-- ============================================================
-- 002_create_functions.sql — Core business logic functions
-- Engine tính điểm + hàm tiện ích
-- ============================================================

-- ============================================================
-- Helper: Kiểm tra vai trò người dùng
-- ============================================================
CREATE OR REPLACE FUNCTION has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id
      AND role = p_role
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- Helper: Kiểm tra là trưởng ban của một ban cụ thể
-- ============================================================
CREATE OR REPLACE FUNCTION is_dept_head_of(p_user_id UUID, p_department_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id
      AND role = 'dept_head'
      AND department_id = p_department_id
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- Helper: Lấy giá trị setting
-- ============================================================
CREATE OR REPLACE FUNCTION get_setting(p_key TEXT)
RETURNS TEXT AS $$
DECLARE
  v_value TEXT;
BEGIN
  SELECT value INTO v_value FROM settings WHERE key = p_key;
  RETURN v_value;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- Helper: Tính tổng interaction cap đã dùng trong tháng
-- (C01 + C02 + C03 với applied_delta > 0)
-- ============================================================
CREATE OR REPLACE FUNCTION get_monthly_interaction_total(
  p_member_id UUID,
  p_term_id UUID,
  p_month DATE  -- Ngày đầu tháng
)
RETURNS NUMERIC AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(applied_delta), 0) INTO v_total
  FROM score_ledger
  WHERE member_id = p_member_id
    AND term_id = p_term_id
    AND criterion_code IN ('C01', 'C02', 'C03')
    AND status IN ('approved', 'pending')
    AND applied_delta > 0
    AND DATE_TRUNC('month', occurred_at) = DATE_TRUNC('month', p_month);

  RETURN v_total;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- MAIN ENGINE: apply_score_change
-- Hàm duy nhất xử lý mọi thay đổi điểm (5.7)
-- Chạy trong transaction, lock row thành viên
-- ============================================================
CREATE OR REPLACE FUNCTION apply_score_change(
  p_member_id UUID,
  p_criterion_code TEXT,
  p_reason TEXT,
  p_evidence_url TEXT DEFAULT NULL,
  p_recorded_by UUID DEFAULT NULL,
  p_approved_by UUID DEFAULT NULL,
  p_event_id UUID DEFAULT NULL,
  p_task_id UUID DEFAULT NULL,
  p_interaction_id UUID DEFAULT NULL,
  p_occurred_at TIMESTAMPTZ DEFAULT NOW(),
  p_scope_note TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_override_effective_date BOOLEAN DEFAULT false
)
RETURNS JSON AS $$
DECLARE
  v_member RECORD;
  v_criterion RECORD;
  v_term RECORD;
  v_score_before NUMERIC;
  v_raw_delta NUMERIC;
  v_multiplier NUMERIC := 1.0;
  v_applied_delta NUMERIC;
  v_score_after NUMERIC;
  v_monthly_cap NUMERIC;
  v_monthly_used NUMERIC;
  v_monthly_remaining NUMERIC;
  v_core_multiplier NUMERIC;
  v_ledger_id UUID;
  v_recorder_member RECORD;
BEGIN
  -- ============================================================
  -- 0. IDEMPOTENCY CHECK
  -- ============================================================
  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM score_ledger
      WHERE idempotency_key = p_idempotency_key
    ) THEN
      RETURN json_build_object(
        'success', false,
        'error', 'DUPLICATE_IDEMPOTENCY_KEY',
        'message', 'Bản ghi với khóa này đã tồn tại'
      );
    END IF;
  END IF;

  -- ============================================================
  -- 1. LOCK & LOAD — Khóa dòng thành viên
  -- ============================================================
  SELECT * INTO v_member
  FROM members
  WHERE id = p_member_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'MEMBER_NOT_FOUND',
      'message', 'Không tìm thấy thành viên'
    );
  END IF;

  IF v_member.status = 'terminated' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'MEMBER_TERMINATED',
      'message', 'Thành viên đã bị dừng tư cách'
    );
  END IF;

  -- Load criterion
  SELECT * INTO v_criterion
  FROM criteria
  WHERE code = p_criterion_code AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'CRITERION_NOT_FOUND',
      'message', 'Không tìm thấy tiêu chí: ' || p_criterion_code
    );
  END IF;

  -- Load active term
  SELECT * INTO v_term
  FROM terms
  WHERE id = v_member.term_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'NO_ACTIVE_TERM',
      'message', 'Không có nhiệm kỳ đang hoạt động'
    );
  END IF;

  -- ============================================================
  -- 1b. VALIDATION — Kiểm tra các ràng buộc (Q01–Q08)
  -- ============================================================

  -- Q01: Minh chứng bắt buộc (trừ P01 initial score)
  IF p_criterion_code != 'P01' AND p_evidence_url IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'EVIDENCE_REQUIRED',
      'message', 'Minh chứng bắt buộc cho mọi lần ghi điểm (Q01)'
    );
  END IF;

  -- Q02: Không tự chấm mình
  IF p_recorded_by IS NOT NULL THEN
    -- Find the member record for recorder
    SELECT * INTO v_recorder_member
    FROM members
    WHERE user_id = p_recorded_by;

    IF FOUND AND v_recorder_member.id = p_member_id THEN
      RETURN json_build_object(
        'success', false,
        'error', 'SELF_SCORING_NOT_ALLOWED',
        'message', 'Không được tự chấm điểm cho chính mình (Q02)'
      );
    END IF;
  END IF;

  -- Q02: BCN chấm Core Team
  IF v_member.is_core_team = true AND p_recorded_by IS NOT NULL THEN
    IF NOT (has_role(p_recorded_by, 'bcn') OR has_role(p_recorded_by, 'admin')) THEN
      RETURN json_build_object(
        'success', false,
        'error', 'BCN_REQUIRED_FOR_CORE_TEAM',
        'message', 'Chỉ BCN hoặc Admin mới được chấm điểm Core Team (Q02)'
      );
    END IF;
  END IF;

  -- Q08: Kiểm tra ngày hiệu lực
  IF NOT p_override_effective_date THEN
    IF p_occurred_at::DATE < v_term.rules_effective_from THEN
      RETURN json_build_object(
        'success', false,
        'error', 'BEFORE_EFFECTIVE_DATE',
        'message', 'Không thể ghi điểm trước ngày hiệu lực quy định (Q08): ' ||
                   v_term.rules_effective_from::TEXT
      );
    END IF;
  END IF;

  -- ============================================================
  -- 2. XÁC ĐỊNH ĐIỂM GỐC
  -- ============================================================
  v_score_before := v_member.current_score;
  v_raw_delta := v_criterion.base_points;

  -- ============================================================
  -- 3. TRẦN TƯƠNG TÁC (P04): C01+C02+C03 tối đa 15/tháng
  -- ============================================================
  IF v_criterion.monthly_cap_group = 'interaction' THEN
    v_monthly_cap := COALESCE(
      v_criterion.monthly_cap_value,
      (get_setting('monthly_interaction_cap'))::NUMERIC
    );
    IF v_monthly_cap IS NULL THEN
      v_monthly_cap := 15;
    END IF;

    v_monthly_used := get_monthly_interaction_total(
      p_member_id,
      v_member.term_id,
      DATE_TRUNC('month', p_occurred_at)::DATE
    );

    v_monthly_remaining := v_monthly_cap - v_monthly_used;

    IF v_monthly_remaining <= 0 THEN
      -- Vượt trần: vẫn ghi ledger nhưng applied_delta = 0
      v_applied_delta := 0;
      v_score_after := v_score_before;

      INSERT INTO score_ledger (
        member_id, term_id, criterion_code, event_id, task_id,
        interaction_id, score_before, raw_delta, multiplier,
        applied_delta, score_after, reason, evidence_url,
        scope_note, recorded_by, approved_by, status,
        idempotency_key, occurred_at
      ) VALUES (
        p_member_id, v_member.term_id, p_criterion_code, p_event_id,
        p_task_id, p_interaction_id, v_score_before, v_raw_delta,
        1.0, 0, v_score_before,
        p_reason || ' [Vượt trần tương tác ' || v_monthly_cap || '/tháng]',
        p_evidence_url, p_scope_note, p_recorded_by, p_approved_by,
        COALESCE(CASE WHEN p_approved_by IS NOT NULL THEN 'approved' ELSE 'pending' END),
        p_idempotency_key, p_occurred_at
      )
      RETURNING id INTO v_ledger_id;

      RETURN json_build_object(
        'success', true,
        'ledger_id', v_ledger_id,
        'score_before', v_score_before,
        'raw_delta', v_raw_delta,
        'applied_delta', 0,
        'score_after', v_score_before,
        'capped', true,
        'cap_remaining', 0,
        'message', 'Đã vượt trần tương tác tháng. Ghi nhận nhưng không cộng điểm.'
      );
    ELSIF v_raw_delta > v_monthly_remaining THEN
      -- Cộng phần còn lại trong trần
      v_raw_delta := v_monthly_remaining;
    END IF;
  END IF;

  -- ============================================================
  -- 4. HỆ SỐ CORE TEAM (chỉ với điểm trừ, khi bật)
  -- ============================================================
  IF v_member.is_core_team = true
     AND v_criterion.type = 'deduct'
     AND v_criterion.core_multiplier_applies = true
  THEN
    v_core_multiplier := COALESCE(
      (get_setting('core_team_multiplier'))::NUMERIC,
      2.0
    );
    v_multiplier := v_core_multiplier;
    v_raw_delta := v_raw_delta * v_multiplier;
  END IF;

  -- ============================================================
  -- 5. Q04: Mail cảnh cáo T03 — xử lý phần chênh
  -- ============================================================
  IF p_criterion_code = 'T03' AND p_scope_note = 'specific_case' THEN
    -- Tìm tổng đã trừ cho vụ việc này (qua event_id/task_id)
    DECLARE
      v_already_deducted NUMERIC := 0;
      v_target_total NUMERIC := ABS(v_raw_delta); -- -10
    BEGIN
      IF p_event_id IS NOT NULL THEN
        SELECT COALESCE(SUM(ABS(applied_delta)), 0) INTO v_already_deducted
        FROM score_ledger
        WHERE member_id = p_member_id
          AND event_id = p_event_id
          AND criterion_code != 'T03'
          AND status IN ('approved', 'pending')
          AND applied_delta < 0;
      ELSIF p_task_id IS NOT NULL THEN
        SELECT COALESCE(SUM(ABS(applied_delta)), 0) INTO v_already_deducted
        FROM score_ledger
        WHERE member_id = p_member_id
          AND task_id = p_task_id
          AND criterion_code != 'T03'
          AND status IN ('approved', 'pending')
          AND applied_delta < 0;
      END IF;

      IF v_already_deducted >= v_target_total THEN
        -- Đã trừ đủ hoặc hơn -10 → T03 applied_delta = 0
        v_raw_delta := v_criterion.base_points; -- keep original for record
        v_applied_delta := 0;
        v_score_after := v_score_before;

        INSERT INTO score_ledger (
          member_id, term_id, criterion_code, event_id, task_id,
          interaction_id, score_before, raw_delta, multiplier,
          applied_delta, score_after, reason, evidence_url,
          scope_note, recorded_by, approved_by, status,
          idempotency_key, occurred_at
        ) VALUES (
          p_member_id, v_member.term_id, 'T03', p_event_id,
          p_task_id, NULL, v_score_before, v_criterion.base_points,
          v_multiplier, 0, v_score_before,
          p_reason || ' [Vụ việc đã trừ ' || v_already_deducted || ', đủ mức]',
          p_evidence_url, p_scope_note, p_recorded_by, p_approved_by,
          COALESCE(CASE WHEN p_approved_by IS NOT NULL THEN 'approved' ELSE 'pending' END),
          p_idempotency_key, p_occurred_at
        )
        RETURNING id INTO v_ledger_id;

        RETURN json_build_object(
          'success', true,
          'ledger_id', v_ledger_id,
          'score_before', v_score_before,
          'raw_delta', v_criterion.base_points,
          'applied_delta', 0,
          'score_after', v_score_before,
          'q04_already_deducted', v_already_deducted,
          'message', 'Vụ việc đã trừ đủ mức. T03 ghi nhận nhưng không trừ thêm.'
        );
      ELSE
        -- Trừ phần chênh
        v_raw_delta := -(v_target_total - v_already_deducted);
      END IF;
    END;
  END IF;

  -- ============================================================
  -- 6. CLAMP — Cắt trần/sàn (P02)
  -- ============================================================
  -- At this point v_raw_delta has been adjusted for cap/multiplier
  -- Now calculate applied_delta with clamp
  IF v_applied_delta IS NULL THEN
    v_applied_delta := v_raw_delta;
  END IF;

  v_score_after := v_score_before + v_applied_delta;

  -- Clamp to [0, 100]
  IF v_score_after > 100 THEN
    v_applied_delta := 100 - v_score_before;
    v_score_after := 100;
  ELSIF v_score_after < 0 THEN
    v_applied_delta := -v_score_before;
    v_score_after := 0;
  END IF;

  -- ============================================================
  -- 7. GHI LEDGER + CẬP NHẬT ĐIỂM
  -- ============================================================
  INSERT INTO score_ledger (
    member_id, term_id, criterion_code, event_id, task_id,
    interaction_id, score_before, raw_delta, multiplier,
    applied_delta, score_after, reason, evidence_url,
    scope_note, recorded_by, approved_by, status,
    idempotency_key, occurred_at
  ) VALUES (
    p_member_id, v_member.term_id, p_criterion_code, p_event_id,
    p_task_id, p_interaction_id, v_score_before,
    v_criterion.base_points, -- Store original base_points
    v_multiplier, v_applied_delta, v_score_after,
    p_reason, p_evidence_url, p_scope_note,
    p_recorded_by, p_approved_by,
    CASE WHEN p_approved_by IS NOT NULL THEN 'approved' ELSE 'pending' END,
    p_idempotency_key, p_occurred_at
  )
  RETURNING id INTO v_ledger_id;

  -- Update member's current score
  UPDATE members
  SET current_score = v_score_after,
      updated_at = NOW()
  WHERE id = p_member_id;

  -- ============================================================
  -- 8. T02 COUNTER — Đếm vắng không phép (Q05)
  -- ============================================================
  IF p_criterion_code = 'T02' THEN
    UPDATE members
    SET t02_count = t02_count + 1
    WHERE id = p_member_id;

    -- Refresh member data
    SELECT t02_count INTO v_member.t02_count
    FROM members WHERE id = p_member_id;

    -- Check for 3 strikes
    IF v_member.t02_count >= (COALESCE(get_setting('t02_termination_count'), '3'))::INTEGER THEN
      -- Tạo hồ sơ dừng tư cách chờ BCN (Q05)
      -- Hệ thống KHÔNG tự động đổi trạng thái
      INSERT INTO termination_cases (
        member_id, t02_count_at_trigger, reason, status
      ) VALUES (
        p_member_id, v_member.t02_count,
        '3_unexcused_absences', 'pending_bcn'
      );
    END IF;
  END IF;

  -- ============================================================
  -- 9. CẢNH BÁO MỨC ĐÁNH GIÁ
  -- ============================================================
  -- Tạo warning nếu điểm rơi vào mức cần cải thiện trở xuống
  IF v_score_after < 60 AND v_score_before >= 60 THEN
    INSERT INTO warnings (
      member_id, type, content, status, created_by
    ) VALUES (
      p_member_id,
      CASE
        WHEN v_score_after < 30 THEN 'formal_warning'
        WHEN v_score_after < 45 THEN 'formal_warning'
        ELSE 'reminder'
      END,
      'Điểm giảm xuống ' || v_score_after || ' - mức ' ||
        CASE
          WHEN v_score_after < 30 THEN 'Xem xét dừng tư cách'
          WHEN v_score_after < 45 THEN 'Diện cảnh cáo'
          ELSE 'Cần cải thiện'
        END,
      CASE
        WHEN v_score_after < 45 THEN 'pending_bcn'
        ELSE 'draft'
      END,
      p_recorded_by
    );
  END IF;

  -- ============================================================
  -- 10. AUDIT LOG
  -- ============================================================
  INSERT INTO audit_log (
    user_id, action, table_name, record_id,
    new_values
  ) VALUES (
    p_recorded_by, 'score_change', 'score_ledger', v_ledger_id,
    json_build_object(
      'member_id', p_member_id,
      'criterion_code', p_criterion_code,
      'score_before', v_score_before,
      'applied_delta', v_applied_delta,
      'score_after', v_score_after
    )::JSONB
  );

  -- ============================================================
  -- RETURN
  -- ============================================================
  RETURN json_build_object(
    'success', true,
    'ledger_id', v_ledger_id,
    'score_before', v_score_before,
    'raw_delta', v_criterion.base_points,
    'multiplier', v_multiplier,
    'applied_delta', v_applied_delta,
    'score_after', v_score_after,
    'capped', false,
    't02_count', CASE WHEN p_criterion_code = 'T02' THEN v_member.t02_count ELSE NULL END,
    'message', 'Ghi nhận thành công'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RECOMPUTE MEMBER SCORE — Tái tính từ ledger (5.8)
-- ============================================================
CREATE OR REPLACE FUNCTION recompute_member_score(p_member_id UUID)
RETURNS JSON AS $$
DECLARE
  v_initial_score NUMERIC;
  v_computed_score NUMERIC;
  v_current_score NUMERIC;
  v_sum_delta NUMERIC;
BEGIN
  v_initial_score := COALESCE(
    (get_setting('initial_score'))::NUMERIC,
    60
  );

  -- Sum all applied deltas from approved ledger entries
  SELECT COALESCE(SUM(applied_delta), 0) INTO v_sum_delta
  FROM score_ledger
  WHERE member_id = p_member_id
    AND status = 'approved'
    AND criterion_code != 'P01'; -- Exclude initial score entry

  v_computed_score := GREATEST(0, LEAST(100, v_initial_score + v_sum_delta));

  SELECT current_score INTO v_current_score
  FROM members WHERE id = p_member_id;

  RETURN json_build_object(
    'member_id', p_member_id,
    'initial_score', v_initial_score,
    'sum_delta', v_sum_delta,
    'computed_score', v_computed_score,
    'stored_score', v_current_score,
    'match', v_computed_score = v_current_score
  );
END;
$$ LANGUAGE plpgsql STABLE;
