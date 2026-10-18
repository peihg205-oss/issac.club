-- ============================================================
-- 001_create_tables.sql — iSSAC_Web Database Schema
-- All 18+ tables for club activity management system
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TERMS — Nhiệm kỳ
-- ============================================================
CREATE TABLE terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rules_effective_from DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT terms_dates_check CHECK (end_date > start_date),
  CONSTRAINT terms_effective_check CHECK (rules_effective_from >= start_date)
);

-- ============================================================
-- DEPARTMENTS — Ban (B01–B04)
-- ============================================================
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,          -- B01, B02, B03, B04
  name TEXT NOT NULL,
  scoring_notes TEXT,                 -- Gợi ý đầu việc tính điểm (bảng D)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MEMBERS — Thành viên CLB
-- ============================================================
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_code TEXT UNIQUE NOT NULL,   -- MSSV hoặc STAFF-xxx
  student_id TEXT,                    -- Nullable cho cán bộ
  full_name TEXT NOT NULL,
  class_name TEXT,                    -- Lưu nguyên văn
  dob DATE,                          -- Nullable
  phone TEXT,                         -- Nhạy cảm
  email TEXT,                         -- Nhạy cảm
  department_id UUID NOT NULL REFERENCES departments(id),
  position TEXT NOT NULL DEFAULT 'Thành viên',
  is_core_team BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'terminated')),
  current_score NUMERIC(5,2) NOT NULL DEFAULT 60
    CHECK (current_score >= 0 AND current_score <= 100),
  t02_count INTEGER NOT NULL DEFAULT 0,
  term_id UUID NOT NULL REFERENCES terms(id),
  user_id UUID REFERENCES auth.users(id),
  pin_hash TEXT,                      -- bcrypt hash of PIN for check-in
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Student ID unique per term (when not null)
  CONSTRAINT members_student_id_unique
    UNIQUE NULLS NOT DISTINCT (student_id, term_id)
);

CREATE INDEX idx_members_department ON members(department_id);
CREATE INDEX idx_members_term ON members(term_id);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_user ON members(user_id);
CREATE INDEX idx_members_score ON members(current_score);

-- ============================================================
-- USER_ROLES — Liên kết auth.users ↔ vai trò hệ thống
-- ============================================================
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL
    CHECK (role IN ('admin', 'bcn', 'dept_head', 'hr', 'advisor', 'member')),
  department_id UUID REFERENCES departments(id),
  term_id UUID REFERENCES terms(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role, department_id, term_id)
);

-- ============================================================
-- CRITERIA — Tiêu chí chấm điểm (C01–C09, T01–T13)
-- ============================================================
CREATE TABLE criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,          -- C01, T01, P01...
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('add', 'deduct', 'rule')),
  base_points NUMERIC(5,2) NOT NULL DEFAULT 0,
  monthly_cap_group TEXT,             -- 'interaction' cho C01-C03
  monthly_cap_value INTEGER,          -- 15 cho nhóm interaction
  is_auto BOOLEAN NOT NULL DEFAULT false,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  core_multiplier_applies BOOLEAN NOT NULL DEFAULT false,
  replaces TEXT[] DEFAULT '{}',       -- Mảng mã bị thay thế
  exclusive_group TEXT,               -- Nhóm loại trừ
  max_per_event INTEGER DEFAULT 1,
  conditions TEXT,                    -- Mô tả điều kiện
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- ============================================================
-- CRITERIA_HISTORY — Lịch sử thay đổi tiêu chí
-- ============================================================
CREATE TABLE criteria_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  criteria_id UUID NOT NULL REFERENCES criteria(id),
  old_values JSONB NOT NULL,
  new_values JSONB NOT NULL,
  reason TEXT,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SETTINGS — Bảng cấu hình hệ thống
-- ============================================================
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RATING_LEVELS — Mức đánh giá (bảng E, mục 5.6)
-- ============================================================
CREATE TABLE rating_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  min_score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  level_name TEXT NOT NULL,
  action_required TEXT,
  confirmer TEXT,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rating_score_check CHECK (max_score >= min_score)
);

-- ============================================================
-- EVENTS — Sự kiện / buổi họp
-- ============================================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  department_id UUID REFERENCES departments(id), -- NULL = toàn CLB
  event_type TEXT NOT NULL DEFAULT 'meeting'
    CHECK (event_type IN ('meeting', 'activity', 'other')),
  format TEXT NOT NULL DEFAULT 'offline'
    CHECK (format IN ('online', 'offline')),
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  checkin_token TEXT UNIQUE,
  token_expires_at TIMESTAMPTZ,
  short_code TEXT,
  short_code_expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'open', 'closed', 'finalized')),
  created_by UUID REFERENCES auth.users(id),
  finalized_by UUID REFERENCES auth.users(id),
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT events_times_check CHECK (ends_at > starts_at)
);

CREATE INDEX idx_events_department ON events(department_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_checkin_token ON events(checkin_token);

-- ============================================================
-- ATTENDANCE — Điểm danh
-- ============================================================
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id),
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  attendance_pct NUMERIC(5,2),       -- % thời lượng tham dự
  status TEXT NOT NULL DEFAULT 'present'
    CHECK (status IN ('present', 'late', 'left_early',
                      'excused_absent', 'unexcused_absent')),
  excuse_requested_at TIMESTAMPTZ,
  excuse_confirmed_by UUID REFERENCES auth.users(id),
  excuse_reason TEXT,
  device_fingerprint TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, member_id)
);

CREATE INDEX idx_attendance_event ON attendance(event_id);
CREATE INDEX idx_attendance_member ON attendance(member_id);

-- ============================================================
-- TASKS — Đầu việc / nhiệm vụ
-- ============================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  department_id UUID REFERENCES departments(id),
  assigned_to UUID NOT NULL REFERENCES members(id),
  assigned_by UUID REFERENCES auth.users(id),
  due_at TIMESTAMPTZ NOT NULL,
  extended_due_at TIMESTAMPTZ,
  extension_approved_by UUID REFERENCES auth.users(id),
  extension_approved_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  -- P08: 4 điều kiện nghiệm thu chất lượng
  acceptance_req1 BOOLEAN NOT NULL DEFAULT false, -- đúng yêu cầu & phạm vi
  acceptance_req2 BOOLEAN NOT NULL DEFAULT false, -- thông tin chính xác
  acceptance_req3 BOOLEAN NOT NULL DEFAULT false, -- hoàn chỉnh, bàn giao đủ
  acceptance_req4 BOOLEAN NOT NULL DEFAULT false, -- không phải làm lại
  accepted_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'assigned'
    CHECK (status IN ('assigned', 'in_progress', 'submitted',
                      'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_department ON tasks(department_id);
CREATE INDEX idx_tasks_status ON tasks(status);

-- ============================================================
-- INTERACTION_REQUESTS — Bài/thông báo cần tương tác
-- ============================================================
CREATE TABLE interaction_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('post', 'announcement')),
  title TEXT NOT NULL,
  source_url TEXT,
  department_id UUID REFERENCES departments(id),
  deadline_at TIMESTAMPTZ NOT NULL,  -- Mặc định +12h từ lúc tạo
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SCORE_LEDGER — Sổ điểm (append-only, bất biến)
-- ============================================================
CREATE TABLE score_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id),
  term_id UUID NOT NULL REFERENCES terms(id),
  criterion_code TEXT NOT NULL,
  event_id UUID REFERENCES events(id),
  task_id UUID REFERENCES tasks(id),
  interaction_id UUID REFERENCES interaction_requests(id),
  score_before NUMERIC(5,2) NOT NULL,
  raw_delta NUMERIC(5,2) NOT NULL,     -- Điểm gốc trước hệ số/clamp
  multiplier NUMERIC(3,1) NOT NULL DEFAULT 1.0,
  applied_delta NUMERIC(5,2) NOT NULL, -- Thay đổi thực tế
  score_after NUMERIC(5,2) NOT NULL,
  reason TEXT NOT NULL,
  evidence_url TEXT,
  scope_note TEXT,                     -- Cho T03/Q04: phạm vi xử lý
  recorded_by UUID NOT NULL,           -- Người ghi nhận
  approved_by UUID,                    -- Người duyệt
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'reversed')),
  idempotency_key TEXT UNIQUE,
  reverses_ledger_id UUID REFERENCES score_ledger(id),
  occurred_at TIMESTAMPTZ NOT NULL,    -- Ngày xảy ra sự việc
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ledger_score_range CHECK (
    score_before >= 0 AND score_before <= 100
    AND score_after >= 0 AND score_after <= 100
  )
);

CREATE INDEX idx_ledger_member ON score_ledger(member_id);
CREATE INDEX idx_ledger_term ON score_ledger(term_id);
CREATE INDEX idx_ledger_occurred ON score_ledger(occurred_at);
CREATE INDEX idx_ledger_criterion ON score_ledger(criterion_code);
CREATE INDEX idx_ledger_event ON score_ledger(event_id);
CREATE INDEX idx_ledger_task ON score_ledger(task_id);
CREATE INDEX idx_ledger_status ON score_ledger(status);
CREATE INDEX idx_ledger_member_term_occurred
  ON score_ledger(member_id, term_id, occurred_at);

-- ============================================================
-- SCORE_REQUESTS — Đề xuất điểm chờ duyệt
-- ============================================================
CREATE TABLE score_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requested_by UUID NOT NULL,
  member_id UUID NOT NULL REFERENCES members(id),
  criterion_code TEXT NOT NULL,
  event_id UUID REFERENCES events(id),
  task_id UUID REFERENCES tasks(id),
  interaction_id UUID REFERENCES interaction_requests(id),
  reason TEXT NOT NULL,
  evidence_url TEXT,
  scope_note TEXT,
  proposed_delta NUMERIC(5,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  review_note TEXT,
  ledger_id UUID REFERENCES score_ledger(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_score_requests_member ON score_requests(member_id);
CREATE INDEX idx_score_requests_status ON score_requests(status);

-- ============================================================
-- WARNINGS — Cảnh báo / mail cảnh cáo
-- ============================================================
CREATE TABLE warnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id),
  type TEXT NOT NULL
    CHECK (type IN ('reminder', 'formal_warning', 'improvement_plan')),
  criterion_code TEXT,
  scope TEXT CHECK (scope IN ('specific_case', 'inactivity')),
  related_ledger_id UUID REFERENCES score_ledger(id),
  content TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_bcn', 'approved', 'sent')),
  created_by UUID,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TERMINATION_CASES — Hồ sơ dừng tư cách (3 lần T02 / điểm thấp)
-- ============================================================
CREATE TABLE termination_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id),
  t02_count_at_trigger INTEGER NOT NULL,
  reason TEXT NOT NULL
    CHECK (reason IN ('3_unexcused_absences', 'low_score_review', 'other')),
  status TEXT NOT NULL DEFAULT 'pending_bcn'
    CHECK (status IN ('pending_bcn', 'confirmed', 'dismissed')),
  confirmed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- ============================================================
-- DISPUTES — Đề nghị sửa điểm (Q06)
-- ============================================================
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id),
  ledger_id UUID NOT NULL REFERENCES score_ledger(id),
  reason TEXT NOT NULL,
  evidence_url TEXT,
  deadline_at TIMESTAMPTZ NOT NULL,    -- 3 ngày làm việc
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'under_review',
                      'resolved_accepted', 'resolved_rejected')),
  dept_head_review_by UUID,
  dept_head_note TEXT,
  hr_review_by UUID,
  hr_note TEXT,
  bcn_decision_by UUID,
  bcn_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ============================================================
-- HONORS — Vinh danh
-- ============================================================
CREATE TABLE honors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id),
  type TEXT NOT NULL CHECK (type IN ('monthly_top', 'term_outstanding')),
  period TEXT NOT NULL,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT_LOG — Nhật ký hệ thống
-- ============================================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- ============================================================
-- WEEKLY_HR_UPDATES — Theo dõi cập nhật hàng tuần của Nhân sự
-- ============================================================
CREATE TABLE weekly_hr_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  term_id UUID NOT NULL REFERENCES terms(id),
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  updated_by UUID,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(term_id, week_number, year)
);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_members_updated_at
  BEFORE UPDATE ON members FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON tasks FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_terms_updated_at
  BEFORE UPDATE ON terms FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
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
-- ============================================================
-- 003_create_triggers.sql — Immutable ledger + audit triggers
-- ============================================================

-- ============================================================
-- TRIGGER: Chặn UPDATE/DELETE trên score_ledger đã duyệt (5.8)
-- Sửa sai = bản ghi adjustment với reverses_ledger_id
-- ============================================================
CREATE OR REPLACE FUNCTION prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'approved' THEN
      RAISE EXCEPTION 'Không thể xóa bản ghi sổ điểm đã duyệt (id: %). '
        'Sử dụng bản ghi adjustment với reverses_ledger_id.', OLD.id;
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Allow status transitions: pending → approved/rejected
    -- Allow adding approved_by to pending entries
    IF OLD.status = 'approved' THEN
      -- Only allow marking as 'reversed'
      IF NEW.status = 'reversed' AND OLD.status = 'approved' THEN
        RETURN NEW;
      END IF;
      RAISE EXCEPTION 'Không thể sửa bản ghi sổ điểm đã duyệt (id: %). '
        'Sử dụng bản ghi adjustment với reverses_ledger_id.', OLD.id;
    END IF;

    -- Allow updates to pending/rejected entries
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_ledger_immutability
  BEFORE UPDATE OR DELETE ON score_ledger
  FOR EACH ROW
  EXECUTE FUNCTION prevent_ledger_modification();

-- ============================================================
-- TRIGGER: Audit log cho members table
-- ============================================================
CREATE OR REPLACE FUNCTION audit_members_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Only log significant changes (not just updated_at)
    IF OLD.current_score != NEW.current_score
       OR OLD.status != NEW.status
       OR OLD.t02_count != NEW.t02_count
       OR OLD.department_id != NEW.department_id
       OR OLD.is_core_team != NEW.is_core_team
    THEN
      INSERT INTO audit_log (
        user_id, action, table_name, record_id,
        old_values, new_values
      ) VALUES (
        NULL, -- Will be set by application layer
        'member_update',
        'members',
        NEW.id,
        jsonb_build_object(
          'current_score', OLD.current_score,
          'status', OLD.status,
          't02_count', OLD.t02_count,
          'department_id', OLD.department_id,
          'is_core_team', OLD.is_core_team
        ),
        jsonb_build_object(
          'current_score', NEW.current_score,
          'status', NEW.status,
          't02_count', NEW.t02_count,
          'department_id', NEW.department_id,
          'is_core_team', NEW.is_core_team
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_members_trigger
  AFTER UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION audit_members_changes();

-- ============================================================
-- TRIGGER: Audit log cho criteria changes
-- ============================================================
CREATE OR REPLACE FUNCTION audit_criteria_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO criteria_history (
      criteria_id, old_values, new_values,
      changed_by
    ) VALUES (
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      NEW.updated_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_criteria_trigger
  AFTER UPDATE ON criteria
  FOR EACH ROW
  EXECUTE FUNCTION audit_criteria_changes();

-- ============================================================
-- TRIGGER: Validate score_ledger constraints before insert
-- Q02: recorded_by ≠ member being scored
-- ============================================================
CREATE OR REPLACE FUNCTION validate_ledger_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_recorder_member_id UUID;
BEGIN
  -- Q02: Check self-scoring (via member's user_id)
  IF NEW.recorded_by IS NOT NULL THEN
    SELECT id INTO v_recorder_member_id
    FROM members
    WHERE user_id = NEW.recorded_by;

    IF v_recorder_member_id = NEW.member_id THEN
      RAISE EXCEPTION 'Không được tự chấm điểm cho chính mình (Q02)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_ledger_before_insert
  BEFORE INSERT ON score_ledger
  FOR EACH ROW
  EXECUTE FUNCTION validate_ledger_insert();
-- ============================================================
-- 004_create_rls.sql — Row Level Security policies
-- Bật RLS cho mọi bảng, helper functions
-- ============================================================

-- ============================================================
-- Enable RLS on ALL tables
-- ============================================================
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE termination_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE honors ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_hr_updates ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper: Check if current user has any of specified roles
-- ============================================================
CREATE OR REPLACE FUNCTION auth_has_any_role(p_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = ANY(p_roles)
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper: Get member's department for current user
CREATE OR REPLACE FUNCTION auth_member_department_id()
RETURNS UUID AS $$
DECLARE
  v_dept_id UUID;
BEGIN
  SELECT department_id INTO v_dept_id
  FROM members
  WHERE user_id = auth.uid()
  LIMIT 1;
  RETURN v_dept_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- TERMS — Everyone can read active terms
-- ============================================================
CREATE POLICY terms_select ON terms
  FOR SELECT USING (true);

CREATE POLICY terms_admin ON terms
  FOR ALL USING (auth_has_any_role(ARRAY['admin']));

-- ============================================================
-- DEPARTMENTS — Everyone can read
-- ============================================================
CREATE POLICY departments_select ON departments
  FOR SELECT USING (true);

CREATE POLICY departments_admin ON departments
  FOR ALL USING (auth_has_any_role(ARRAY['admin']));

-- ============================================================
-- MEMBERS — Complex policies for data privacy
-- ============================================================
-- Public view: basic info (no phone/email/dob)
CREATE POLICY members_select_public ON members
  FOR SELECT USING (true);
  -- Note: Sensitive columns (phone, email, dob) will be filtered
  -- at the application layer using views or server-side queries.
  -- RLS ensures row-level access; column-level is handled in code.

-- Admin/BCN/HR can see everything
CREATE POLICY members_admin_all ON members
  FOR ALL USING (auth_has_any_role(ARRAY['admin', 'bcn', 'hr']));

-- Dept heads can update members in their department
CREATE POLICY members_dept_head_update ON members
  FOR UPDATE USING (
    auth_has_any_role(ARRAY['dept_head'])
    AND department_id = auth_member_department_id()
  );

-- Members can update their own PIN
CREATE POLICY members_self_update ON members
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- USER_ROLES
-- ============================================================
CREATE POLICY user_roles_self ON user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY user_roles_admin ON user_roles
  FOR ALL USING (auth_has_any_role(ARRAY['admin']));

-- ============================================================
-- CRITERIA — Everyone can read, admin can modify
-- ============================================================
CREATE POLICY criteria_select ON criteria
  FOR SELECT USING (true);

CREATE POLICY criteria_admin ON criteria
  FOR ALL USING (auth_has_any_role(ARRAY['admin']));

-- ============================================================
-- CRITERIA_HISTORY — Readable by admin/bcn
-- ============================================================
CREATE POLICY criteria_history_select ON criteria_history
  FOR SELECT USING (auth_has_any_role(ARRAY['admin', 'bcn']));

-- ============================================================
-- SETTINGS — Everyone reads, admin modifies
-- ============================================================
CREATE POLICY settings_select ON settings
  FOR SELECT USING (true);

CREATE POLICY settings_admin ON settings
  FOR ALL USING (auth_has_any_role(ARRAY['admin']));

-- ============================================================
-- RATING_LEVELS — Everyone can read
-- ============================================================
CREATE POLICY rating_levels_select ON rating_levels
  FOR SELECT USING (true);

-- ============================================================
-- EVENTS — Internal users can read, authorized can create
-- ============================================================
CREATE POLICY events_select ON events
  FOR SELECT USING (auth_has_any_role(ARRAY['admin', 'bcn', 'dept_head', 'hr', 'advisor', 'member']));

CREATE POLICY events_manage ON events
  FOR ALL USING (auth_has_any_role(ARRAY['admin', 'bcn', 'dept_head', 'hr']));

-- ============================================================
-- ATTENDANCE — Internal users read, authorized manage
-- ============================================================
CREATE POLICY attendance_select ON attendance
  FOR SELECT USING (auth_has_any_role(ARRAY['admin', 'bcn', 'dept_head', 'hr', 'advisor']));

CREATE POLICY attendance_self ON attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = attendance.member_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY attendance_manage ON attendance
  FOR ALL USING (auth_has_any_role(ARRAY['admin', 'bcn', 'dept_head', 'hr']));

-- ============================================================
-- TASKS — Department scoped
-- ============================================================
CREATE POLICY tasks_select ON tasks
  FOR SELECT USING (auth_has_any_role(ARRAY['admin', 'bcn', 'hr', 'advisor']));

CREATE POLICY tasks_dept_select ON tasks
  FOR SELECT USING (
    auth_has_any_role(ARRAY['dept_head'])
    AND department_id = auth_member_department_id()
  );

CREATE POLICY tasks_self ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = tasks.assigned_to
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY tasks_manage ON tasks
  FOR ALL USING (auth_has_any_role(ARRAY['admin', 'bcn', 'dept_head']));

-- ============================================================
-- SCORE_LEDGER — Strict access control
-- ============================================================
CREATE POLICY ledger_admin ON score_ledger
  FOR SELECT USING (auth_has_any_role(ARRAY['admin', 'bcn', 'hr']));

CREATE POLICY ledger_dept_head ON score_ledger
  FOR SELECT USING (
    auth_has_any_role(ARRAY['dept_head'])
    AND EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = score_ledger.member_id
        AND m.department_id = auth_member_department_id()
    )
  );

CREATE POLICY ledger_self ON score_ledger
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = score_ledger.member_id
        AND m.user_id = auth.uid()
    )
  );

-- Insert only via apply_score_change function (SECURITY DEFINER)
-- No direct insert policy needed for regular users

-- ============================================================
-- SCORE_REQUESTS
-- ============================================================
CREATE POLICY score_requests_select ON score_requests
  FOR SELECT USING (auth_has_any_role(ARRAY['admin', 'bcn', 'dept_head', 'hr']));

CREATE POLICY score_requests_manage ON score_requests
  FOR ALL USING (auth_has_any_role(ARRAY['admin', 'bcn', 'dept_head', 'hr']));

-- ============================================================
-- WARNINGS — BCN/Admin/HR
-- ============================================================
CREATE POLICY warnings_select ON warnings
  FOR SELECT USING (auth_has_any_role(ARRAY['admin', 'bcn', 'hr']));

CREATE POLICY warnings_self ON warnings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = warnings.member_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY warnings_manage ON warnings
  FOR ALL USING (auth_has_any_role(ARRAY['admin', 'bcn', 'hr']));

-- ============================================================
-- TERMINATION_CASES — BCN/Admin only
-- ============================================================
CREATE POLICY termination_select ON termination_cases
  FOR SELECT USING (auth_has_any_role(ARRAY['admin', 'bcn']));

CREATE POLICY termination_manage ON termination_cases
  FOR ALL USING (auth_has_any_role(ARRAY['admin', 'bcn']));

-- ============================================================
-- DISPUTES — Member can create for self, others review
-- ============================================================
CREATE POLICY disputes_select ON disputes
  FOR SELECT USING (auth_has_any_role(ARRAY['admin', 'bcn', 'dept_head', 'hr']));

CREATE POLICY disputes_self ON disputes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = disputes.member_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY disputes_create ON disputes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = disputes.member_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY disputes_manage ON disputes
  FOR UPDATE USING (auth_has_any_role(ARRAY['admin', 'bcn', 'dept_head', 'hr']));

-- ============================================================
-- HONORS — Everyone can read
-- ============================================================
CREATE POLICY honors_select ON honors
  FOR SELECT USING (true);

CREATE POLICY honors_manage ON honors
  FOR ALL USING (auth_has_any_role(ARRAY['admin', 'bcn']));

-- ============================================================
-- AUDIT_LOG — Admin only
-- ============================================================
CREATE POLICY audit_log_select ON audit_log
  FOR SELECT USING (auth_has_any_role(ARRAY['admin']));

-- ============================================================
-- WEEKLY_HR_UPDATES
-- ============================================================
CREATE POLICY weekly_hr_select ON weekly_hr_updates
  FOR SELECT USING (auth_has_any_role(ARRAY['admin', 'bcn', 'hr']));

CREATE POLICY weekly_hr_manage ON weekly_hr_updates
  FOR ALL USING (auth_has_any_role(ARRAY['admin', 'hr']));

-- ============================================================
-- INTERACTION_REQUESTS
-- ============================================================
CREATE POLICY interaction_select ON interaction_requests
  FOR SELECT USING (auth_has_any_role(ARRAY['admin', 'bcn', 'dept_head', 'hr', 'advisor', 'member']));

CREATE POLICY interaction_manage ON interaction_requests
  FOR ALL USING (auth_has_any_role(ARRAY['admin', 'bcn', 'dept_head', 'hr']));
-- ============================================================
-- SEED: Nhiệm kỳ, Ban, Tiêu chí, Settings, Mức đánh giá
-- Dữ liệu giả cho dev/test (không chứa thông tin thật)
-- ============================================================

-- ============================================================
-- 1. NHIỆM KỲ (mặc định)
-- ============================================================
INSERT INTO terms (id, name, start_date, end_date, rules_effective_from, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Nhiệm kỳ 2025–2026',
  '2025-09-01',
  '2026-08-31',
  '2025-10-01',  -- Q08: ngày hiệu lực quy định (cần xác nhận)
  true
);

-- ============================================================
-- 2. BAN (B01–B04) — với gợi ý đầu việc tính điểm (bảng D)
-- ============================================================
INSERT INTO departments (id, code, name, scoring_notes) VALUES
(
  '00000000-0000-0000-0000-000000000011',
  'B01',
  'Ban Truyền thông',
  'Bài viết, thiết kế, video, lịch đăng, báo cáo. Chất lượng: đúng brief, chính xác, dùng được, bàn giao file gốc. C04: tác nghiệp/hỗ trợ ekip/xử lý tình huống ngoài đầu việc đã chấm.'
),
(
  '00000000-0000-0000-0000-000000000012',
  'B02',
  'Ban Tư vấn',
  'Tài liệu/FAQ, ca tư vấn, báo cáo, kế hoạch sự kiện, hậu cần. Chất lượng: thông tin kiểm chứng, triển khai đủ, có bàn giao. C04: hỗ trợ học sinh/phụ huynh/điều phối tình huống sự kiện.'
),
(
  '00000000-0000-0000-0000-000000000013',
  'B03',
  'Ban Nhân sự',
  'Biên bản, mail, danh sách, điểm danh, báo cáo nhân sự, thu-chi. Chất lượng: số liệu đúng, mail đúng người, hồ sơ đủ, quỹ đối chiếu được. C04: hỗ trợ thành viên/gắn kết nội bộ/xử lý nhân sự phát sinh.'
),
(
  '00000000-0000-0000-0000-000000000014',
  'B04',
  'Ban Chủ nhiệm',
  'Kế hoạch, phân công, rà soát tiến độ, báo cáo, bàn giao thuộc trách nhiệm quản lý. Chất lượng: phân công rõ, theo dõi được, đầu ra dùng được, bàn giao đủ. C04: hỗ trợ liên ban, tháo gỡ vướng mắc.'
);

-- ============================================================
-- 3. TIÊU CHÍ CỘNG (C01–C09)
-- ============================================================
INSERT INTO criteria (code, name, description, type, base_points,
  monthly_cap_group, monthly_cap_value, is_auto, requires_approval,
  core_multiplier_applies, replaces, exclusive_group, max_per_event,
  conditions) VALUES

-- C01: Tương tác đúng hạn
('C01', 'Tương tác đúng hạn', 'Thả cảm xúc bài chính thức được giao tương tác, trước hạn.',
 'add', 1, 'interaction', 15, false, false, false,
 '{}', NULL, 1,
 '1 lần/bài; chung trần 15/tháng (P04)'),

-- C02: Tương tác kèm bình luận
('C02', 'Tương tác kèm bình luận', 'Tương tác + bình luận phù hợp, đúng hạn. Thay C01 cùng bài.',
 'add', 2, 'interaction', 15, false, false, false,
 '{C01}', 'interaction_feedback', 1,
 'Thay C01 cùng bài (tổng +2, không +3). Chung trần P04. Không tính bình luận sao chép.'),

-- C03: Xác nhận thông báo đúng hạn
('C03', 'Xác nhận thông báo đúng hạn', 'Thả tim/nhắn xác nhận theo yêu cầu; trả lời đủ câu hỏi nếu có.',
 'add', 1, 'interaction', 15, false, false, false,
 '{}', 'interaction_feedback', 1,
 '1 lần/thông báo; chung trần P04. Không đồng thời C02 và C03 cho cùng phản hồi.'),

-- C04: Tham gia nhiệt tình, đóng góp thực tế
('C04', 'Đóng góp thực tế', 'Đóng góp được sử dụng/hỗ trợ cụ thể, khác phần việc đã chấm C05/C06.',
 'add', 3, NULL, NULL, false, false, false,
 '{}', 'contribution', 1,
 '1 lần/người/hoạt động. Không cộng cùng C08/C09 cho cùng đóng góp.'),

-- C05: Hoàn thành đúng deadline
('C05', 'Hoàn thành đúng deadline', 'Hoàn tất đầy đủ đúng hạn đã thống nhất.',
 'add', 2, NULL, NULL, false, false, false,
 '{}', 'task_completion', 1,
 '1 lần/đầu việc hoặc đợt. Hạn mới được duyệt TRƯỚC hạn cũ vẫn tính C05.'),

-- C06: Sản phẩm/đầu ra chất lượng
('C06', 'Sản phẩm chất lượng', 'Đạt đủ 4 điều kiện P08. Trưởng ban nghiệm thu; BCN chấm Core Team.',
 'add', 3, NULL, NULL, false, true, false,
 '{}', NULL, 1,
 'P08: (1) đúng yêu cầu & phạm vi, (2) thông tin chính xác, (3) hoàn chỉnh, bàn giao đủ, (4) không phải làm lại. C05+C06 tối đa +5/đầu việc (P07).'),

-- C07: Dự họp đầy đủ, đúng giờ
('C07', 'Dự họp đầy đủ', 'Có mặt đúng giờ và ≥ 80% thời lượng.',
 'add', 1, NULL, NULL, true, false, false,
 '{}', NULL, 1,
 '1 lần/buổi. Tự động từ check-in khi đủ điều kiện.'),

-- C08: Nhận & xử lý việc phát sinh
('C08', 'Việc phát sinh', 'Việc ngoài phân công ban đầu, được xác nhận và hoàn tất.',
 'add', 2, NULL, NULL, false, false, false,
 '{}', 'contribution', 1,
 'Không cộng cùng C04/C09 cho cùng đóng góp.'),

-- C09: Đề xuất cải tiến được áp dụng
('C09', 'Đề xuất cải tiến', 'Đã triển khai (không tính ý tưởng mới nêu).',
 'add', 2, NULL, NULL, false, false, false,
 '{}', 'contribution', 1,
 'Không cộng cùng C04/C08 cho cùng đóng góp.');

-- ============================================================
-- 4. TIÊU CHÍ TRỪ (T01–T13)
-- core_multiplier_applies: mặc định BẬT cho hầu hết,
-- TẮT cho T03 và T12 (đã có mức cố định)
-- ============================================================
INSERT INTO criteria (code, name, description, type, base_points,
  monthly_cap_group, monthly_cap_value, is_auto, requires_approval,
  core_multiplier_applies, replaces, exclusive_group, max_per_event,
  conditions) VALUES

-- T01: Vắng họp có lý do
('T01', 'Vắng họp có lý do', 'Buổi chính thức/bắt buộc, lý do được chấp nhận theo P09.',
 'deduct', -2, NULL, NULL, true, false, true,
 '{T04}', 'meeting_penalty', 1,
 'Không tính vào 3 lần T02. Xin phép ≥2h trước hoặc giải trình trong 24h.'),

-- T02: Vắng họp không lý do
('T02', 'Vắng họp không lý do', 'Không xin phép hoặc lý do không được chấp nhận.',
 'deduct', -5, NULL, NULL, true, false, true,
 '{T04,T01}', 'meeting_penalty', 1,
 'Đếm riêng; đủ 3 lần → dừng tư cách (Q05). Bộ đếm KHÔNG reset khi sang tháng.'),

-- T03: Mail cảnh cáo
('T03', 'Mail cảnh cáo', 'Mail chính thức do BCN duyệt.',
 'deduct', -10, NULL, NULL, false, true, false,  -- core_multiplier OFF
 '{}', NULL, 1,
 '1 lần/đợt. Q04: nếu xử lý vụ việc đã trừ → chỉ trừ phần chênh để đủ -10.'),

-- T04: Họp muộn / tự ý rời họp
('T04', 'Họp muộn / rời sớm', 'Muộn > 15 phút hoặc rời trước khi kết thúc.',
 'deduct', -1, NULL, NULL, true, false, true,
 '{}', 'meeting_penalty', 1,
 'Tham dự < 80% thì dùng T01/T02 thay T04 (P10).'),

-- T05: Không xác nhận thông báo bắt buộc
('T05', 'Không xác nhận thông báo', 'Quá hạn chưa xác nhận/trả lời yêu cầu cần phản hồi.',
 'deduct', -1, NULL, NULL, false, false, true,
 '{}', NULL, 1,
 'Không trừ tin trao đổi thường.'),

-- T06: Mất liên lạc khi đang nhận việc
('T06', 'Mất liên lạc', 'Sau 48h và ≥ 2 lần liên hệ vẫn không phản hồi.',
 'deduct', -3, NULL, NULL, false, false, true,
 '{T05}', NULL, 1,
 'Thay T05 cùng yêu cầu. Tính theo vụ việc, không theo số tin.'),

-- T07: Trễ deadline đến 24 giờ
('T07', 'Trễ deadline ≤ 24h', 'Trễ ≤ 24h, chưa được duyệt gia hạn.',
 'deduct', -2, NULL, NULL, false, false, true,
 '{}', 'task_completion', 1,
 'Không nhận C05 cho đầu việc này.'),

-- T08: Trễ deadline trên 24 giờ
('T08', 'Trễ deadline > 24h', 'Trễ > 24h, chưa được duyệt gia hạn.',
 'deduct', -4, NULL, NULL, false, false, true,
 '{T07}', 'task_completion', 1,
 'Thay T07, không cộng dồn.'),

-- T09: Bỏ việc / để người khác làm thay
('T09', 'Bỏ việc', 'Tự ý bỏ nhiệm vụ/không hoàn thành khiến người khác làm thay.',
 'deduct', -5, NULL, NULL, false, true, true,
 '{T07,T08}', 'task_completion', 1,
 'Thay mức trễ hạn cùng vụ việc.'),

-- T10: Lỗi chủ quan khiến phải làm lại
('T10', 'Lỗi chủ quan', 'Sai thông tin/nghiệp vụ, bỏ yêu cầu đã nêu.',
 'deduct', -2, NULL, NULL, false, false, true,
 '{}', NULL, 1,
 'Không tính chỉnh sửa biên tập thông thường.'),

-- T11: Tự ý đăng/gửi nội dung chưa duyệt
('T11', 'Nội dung chưa duyệt', 'Đăng/gửi nội dung chính thức dưới danh nghĩa CLB khi chưa qua thẩm quyền.',
 'deduct', -5, NULL, NULL, false, true, true,
 '{}', NULL, 1, NULL),

-- T12: Gian lận minh chứng/điểm danh
('T12', 'Gian lận', 'Khai khống, điểm danh hộ, làm giả minh chứng.',
 'deduct', -10, NULL, NULL, false, true, false,  -- core_multiplier OFF
 '{}', NULL, 1,
 'BCN xem xét thêm tư cách thành viên.'),

-- T13: Vi phạm quy trình quản lý quỹ
('T13', 'Vi phạm quản lý quỹ', 'Chi quỹ chưa phê duyệt hoặc không kê khai/bàn giao thu-chi.',
 'deduct', -5, NULL, NULL, false, true, true,
 '{}', NULL, 1,
 'Bổ sung hồ sơ và báo BCN.');

-- ============================================================
-- 5. QUY TẮC CHUNG (P01–P10) — lưu dạng tiêu chí type='rule'
-- ============================================================
INSERT INTO criteria (code, name, description, type, base_points,
  is_auto, requires_approval, core_multiplier_applies, conditions) VALUES
('P01', 'Điểm khởi đầu', 'Điểm khởi đầu 60/thành viên, tính khi quy định có hiệu lực hoặc khi được tiếp nhận.',
 'rule', 60, true, false, false, NULL),
('P02', 'Thang điểm 0-100', 'score = MAX(0, MIN(100, score + delta)). Phần cộng vượt 100 KHÔNG giữ.',
 'rule', 0, true, false, false, NULL),
('P03', 'Tích lũy trong nhiệm kỳ', 'Chốt báo cáo hàng tháng; điểm tích lũy, không reset đầu tháng.',
 'rule', 0, true, false, false, NULL),
('P04', 'Trần tương tác 15/tháng', 'Tổng C01+C02+C03 tối đa 15/tháng. Vượt mức vẫn ghi ledger nhưng applied_delta=0.',
 'rule', 0, true, false, false, NULL),
('P05', 'Hạn mặc định 12h', 'Hạn tương tác/xác nhận mặc định 12 giờ từ lúc thông báo.',
 'rule', 0, true, false, false, NULL),
('P06', 'C02 đã gồm C01', 'Tương tác kèm bình luận tổng +2, không +3. C02/C03 không đồng thời.',
 'rule', 0, true, false, false, NULL),
('P07', 'C05+C06 tối đa +5', 'Chốt đầu việc trước khi giao. C05+C06 cùng đầu việc tối đa +5.',
 'rule', 0, true, false, false, NULL),
('P08', 'Chất lượng 4 điều kiện', '4 checkbox: đúng yêu cầu, thông tin chính xác, hoàn chỉnh, không làm lại.',
 'rule', 0, true, false, false, NULL),
('P09', 'Xin phép vắng', 'Báo ≥ 2h trước buổi họp; đột xuất giải trình trong 24h sau.',
 'rule', 0, true, false, false, NULL),
('P10', 'Tham gia ≥ 80%', 'Tham gia ≥ 80% thời lượng = có mặt. Cùng buổi chỉ mức phạt cao nhất.',
 'rule', 0, true, false, false, NULL);

-- ============================================================
-- 6. SETTINGS — Bảng cấu hình
-- ============================================================
INSERT INTO settings (key, value, description) VALUES
('initial_score', '60', 'Điểm khởi đầu khi gia nhập CLB (P01)'),
('score_min', '0', 'Sàn điểm (P02)'),
('score_max', '100', 'Trần điểm (P02)'),
('monthly_interaction_cap', '15', 'Trần tương tác C01+C02+C03 mỗi tháng (P04)'),
('default_interaction_deadline_hours', '12', 'Hạn tương tác/xác nhận mặc định (P05)'),
('attendance_threshold_pct', '80', 'Ngưỡng % tham dự tính có mặt (P10)'),
('late_threshold_minutes', '15', 'Muộn > phút này → T04'),
('lost_contact_hours', '48', 'Mất liên lạc sau giờ này → T06'),
('excuse_before_hours', '2', 'Xin phép vắng trước giờ này (P09)'),
('excuse_after_hours', '24', 'Giải trình đột xuất trong giờ này sau buổi họp (P09)'),
('dispute_deadline_business_days', '3', 'Hạn đề nghị sửa điểm Q06'),
('improvement_deadline_days', '7', 'Hạn cải thiện sau nhắc nhở mức "Cần cải thiện"'),
('t02_termination_count', '3', 'Số lần T02 dẫn đến xem xét dừng tư cách (Q05)'),
('core_team_multiplier', '2', 'Hệ số nhân cho điểm trừ Core Team'),
('core_team_multiplier_enabled', 'true', 'Bật/tắt hệ số Core Team'),
('weekend_days', '6,0', 'Ngày nghỉ (0=CN, 6=T7) để tính ngày làm việc'),
('task_max_bonus_per_task', '5', 'Tối đa C05+C06 cùng đầu việc (P07)'),
('checkin_token_expiry_minutes', '180', 'Thời hạn token check-in (phút)'),
('short_code_expiry_minutes', '5', 'Thời hạn mã ngắn check-in xoay vòng (phút)'),
('checkin_max_per_device', '3', 'Số check-in tối đa trên 1 thiết bị / 1 sự kiện');

-- ============================================================
-- 7. MỨC ĐÁNH GIÁ (bảng E, mục 5.6)
-- ============================================================
INSERT INTO rating_levels (min_score, max_score, level_name, action_required, confirmer, display_order) VALUES
(90, 100, 'Rất tích cực', 'Ghi nhận tổng kết tháng', 'Trưởng ban / BCN', 1),
(75, 89, 'Tích cực', 'Duy trì, cân đối công việc', 'Trưởng ban / BCN', 2),
(60, 74, 'Đạt cơ bản', 'Theo dõi nhiệm vụ & đóng góp', 'Trưởng ban / BCN', 3),
(45, 59, 'Cần cải thiện', 'Nhắc nhở; thống nhất việc cải thiện trong 7 ngày', 'Trưởng ban + Nhân sự', 4),
(30, 44, 'Diện cảnh cáo', 'BCN yêu cầu giải trình; chỉ trừ T03 khi mail được phát hành', 'BCN', 5),
(0, 29, 'Xem xét dừng tư cách', 'BCN xem xét sau giải trình, đối chiếu. Chưa tự động thay quy trình 3 lần vắng', 'BCN', 6);

-- ============================================================


-- ============================================================
-- 8. DANH SÁCH 48 THÀNH VIÊN CHÍNH THỨC CLB ISSAC (NHIỆM KỲ 2025-2026)
-- Đầy đủ 4 ban, 11 Core Team, Điểm khởi đầu 60đ (P01)
-- ============================================================
INSERT INTO members (
  id,
  member_code,
  student_id,
  full_name,
  class_name,
  phone,
  email,
  department_id,
  position,
  is_core_team,
  status,
  current_score,
  t02_count,
  term_id
) VALUES
(
  '10000000-0000-0000-0000-000000000001',
  'STAFF-001',
  NULL,
  'Nguyễn Thị Hồng Hân',
  'Cán bộ phòng TT&TS',
  '0837262678',
  'hannth@vnuis.edu.vn',
  '00000000-0000-0000-0000-000000000014',
  'Chủ nhiệm',
  true,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000002',
  '23070691',
  '23070691',
  'Giang Lê Hiệp',
  'MIS2023A',
  '0374140705',
  'glhiep@vnuis.edu.vn',
  '00000000-0000-0000-0000-000000000014',
  'Phó chủ nhiệm',
  true,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000003',
  '22073125',
  '22073125',
  'Nguyễn Trịnh Minh Trang',
  'ACF2023A',
  '0868351218',
  'ngtminhtrang3204@gmail.com',
  '00000000-0000-0000-0000-000000000014',
  'Phó chủ nhiệm',
  true,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000004',
  '24310088',
  '24310088',
  'Trần Đức Thắng',
  'DC2024B',
  '0357626105',
  'tdthang@vnuis.edu.vn',
  '00000000-0000-0000-0000-000000000011',
  'Trưởng ban',
  true,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000005',
  '25070407',
  '25070407',
  'Vũ Đình Hải',
  'MIS2025A',
  '0354434102',
  'vudinhhai542007@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Phó ban',
  true,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000006',
  '25070345',
  '25070345',
  'Lâm Thị Bình Dương',
  'MIS2025A',
  '0382462795',
  'lamduong200907@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Phó ban',
  true,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000007',
  '24070680',
  '24070680',
  'Phương Gia Huy',
  'MIS2024C',
  '0367361118',
  '9iahuyy@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Cố vấn',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000008',
  '24070753',
  '24070753',
  'Hoàng Thị Khánh Linh',
  'BDA2024C',
  '0325546515',
  'hoanglinh15072006@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000009',
  '25071203',
  '25071203',
  'Lục Xuân Huy',
  'MIS2025B',
  '0985030207',
  'huylucxuan2007@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000010',
  '25070203',
  '25070203',
  'Hoàng Thị Tú An',
  'MIS2025B',
  '0367030748',
  'anhoang26.htta12@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000011',
  '25070278',
  '25070278',
  'Đinh Tấn Tài',
  'MIS2025A',
  '0393518168',
  'dinhtai691@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000012',
  '24310108',
  '24310108',
  'Hoàng Triều Xuân',
  'DC2024A',
  '0865512672',
  'xuanht2603nb@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000013',
  '24310078',
  '24310078',
  'Nguyễn Tố Như',
  'DC2024B',
  '0813773199',
  'ntonhu808@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000014',
  '26070162',
  '26070162',
  'Ngô Ánh Dương',
  'ICE2026',
  '0867385112',
  'ngoanhduong200@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000015',
  '26070774',
  '26070774',
  'Tô Mai Trang',
  'BEL2026',
  '0343299388',
  'thimaitrangto@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000016',
  '24070608',
  '24070608',
  'Nguyễn Phú Cường',
  'MIS2024',
  '0899138456',
  'phunguyen1234567g@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000017',
  '26070437',
  '26070437',
  'Lê Mai Anh',
  'DB2026',
  '0346265628',
  'manhiuoi56@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000018',
  '24310069',
  '24310069',
  'Lê Trần Thuỷ Nguyên',
  'DC2024B',
  '0912158734',
  'tnguyenletran@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Trưởng ban',
  true,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000019',
  '24070752',
  '24070752',
  'Phùng Thị Thu Hiền',
  'AC2024C',
  '0988487541',
  '24070752@vnu.edu.vn',
  '00000000-0000-0000-0000-000000000012',
  'Phó ban',
  true,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000020',
  '24070622',
  '24070622',
  'Nguyễn Ngọc Anh',
  'MIS2024B',
  '0385367500',
  'hnacognnee@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Phó ban',
  true,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000021',
  '23071234',
  '23071234',
  'Nguyễn Thu Thảo',
  'AC2023D',
  '0886493955',
  'nthuthao2011@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Cố vấn',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000022',
  '24310099',
  '24310099',
  'Lê Duy Tuấn',
  'DC2024A',
  '0763021511',
  'rudeyuitan2006@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000023',
  '24310072',
  '24310072',
  'Nguyễn Thị Nguyệt',
  'DC2024A',
  '0378647348',
  'nguytn7@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000024',
  '25071139',
  '25071139',
  'Hoàng Mẫn Quỳnh Chi',
  'BDA2 K24',
  '0975167734',
  'hoangmanquynhchi@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000025',
  '25071210',
  '25071210',
  'Nguyễn Vũ Hồng Hạnh',
  'AIT1 K24',
  '0396680326',
  'hanhnguyenvu2007@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000026',
  '23070355',
  '23070355',
  'Vũ Bá Quốc Hưng',
  'AIT2023A',
  '0373701205',
  'vubaquochung@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000027',
  '24070659',
  '24070659',
  'Nguyễn Thị Thuỳ Dương',
  'MIS2024D',
  '0988917270',
  'duongneeeeee@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000028',
  '24070676',
  '24070676',
  'Phan Thành Đạt',
  'MIS2024B',
  '0562440999',
  'datbich22@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000029',
  '25070097',
  '25070097',
  'Phạm Thị Hải Chi',
  'Dual_MKT2025A',
  '0822657958',
  'haichidepham2305@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000030',
  '25073060',
  '25073060',
  'Vũ Hồng Hải Yến',
  'VISK2025A',
  '0366237866',
  'vhhyen24@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000031',
  '25070642',
  '25070642',
  'Đỗ Trần Ái Linh',
  'DC2025A',
  '0396190937',
  'lyhdo.93@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000032',
  '26070454',
  '26070454',
  'Phạm Thanh Hải',
  'DC2026',
  '0862583973',
  'thanhhaipham281107@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000033',
  '25070140',
  '25070140',
  'Hoàng Chí Công',
  'ISEL2025',
  '0972257259',
  'conghoangvy2007@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000034',
  '25070170',
  '25070170',
  'Bùi Việt Hưng',
  'ISEL2026',
  '0886230707',
  'hungbuiviet512@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000035',
  '24310073',
  '24310073',
  'Hoàng Thị Lan Nhi',
  'DC2024B',
  '0967960624',
  'lannhitdt@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000036',
  '25070040',
  '25070040',
  'Nguyễn Gia Khánh',
  'MIS2025A',
  '0985038376',
  'nguyengiakhanh09092007@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000037',
  '26070004',
  '26070004',
  'Bùi Bảo Anh',
  'DC2026',
  '0858130626',
  '26070004@vnu.edu.vn',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000038',
  '26073033',
  '26073033',
  'Nguyễn Ngọc Duy',
  'VISK2026',
  '0985419948',
  '26073033@vnu.edu.vn',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000039',
  '26070583',
  '26070583',
  'Đặng Thị Lê Na',
  'IB2026',
  '0858130626',
  'lenadangthi2@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000040',
  '26070329',
  '26070329',
  'Hoàng Quốc Việt',
  'DB2026',
  '0344978620',
  'hoangquocvietnb2008@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000041',
  '23070448',
  '23070448',
  'Ngô Phương Hoa',
  'AIT2023A',
  '0983605270',
  '23070448@vnu.edu.vn',
  '00000000-0000-0000-0000-000000000013',
  'Trưởng ban',
  true,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000042',
  '24310150',
  '24310150',
  'Trần Thanh Hiền',
  'DB2024B',
  '0337905649',
  'hien.danity.k@gmail.com',
  '00000000-0000-0000-0000-000000000013',
  'Phó ban',
  true,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000043',
  '23073151',
  '23073151',
  'Phạm Thanh Vân',
  'VISK2025B',
  '0365917966',
  'thanhvanpham051799@gmail.com',
  '00000000-0000-0000-0000-000000000013',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000044',
  '25073044',
  '25073044',
  'Đỗ Ngọc Ly',
  'VISK2025',
  '0362227656',
  'dongocly150106@gmail.com',
  '00000000-0000-0000-0000-000000000013',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000045',
  '26070180',
  '26070180',
  'Ngô Bảo Anh',
  'FDB2026',
  '0332653385',
  'daothingan19899@gmail.com',
  '00000000-0000-0000-0000-000000000013',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000046',
  '25073039',
  '25073039',
  'Trần Phương Linh',
  'VISK2025',
  '0975255107',
  'tranplinh2517@gmail.com',
  '00000000-0000-0000-0000-000000000013',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000047',
  '26070316',
  '26070316',
  'Nguyễn Mai Thanh Hương',
  'DB2026',
  '0332856508',
  'huongth484@gmail.com',
  '00000000-0000-0000-0000-000000000013',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000048',
  '26070324',
  '26070324',
  'Hoàng Công Minh',
  'DB2027',
  '0989402311',
  'hoangcongminh.cm@gmail.com',
  '00000000-0000-0000-0000-000000000013',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
);

-- ============================================================
-- 9. SỰ KIỆN & ĐIỂM DANH MẪU
-- ============================================================
INSERT INTO events (
  id,
  name,
  department_id,
  event_type,
  format,
  is_mandatory,
  starts_at,
  ends_at,
  status,
  checkin_token,
  short_code
) VALUES
(
  '20000000-0000-0000-0000-000000000001',
  'Họp Ban Thường kỳ Tháng 10/2025 - Định hướng Học kỳ I',
  NULL,
  'meeting',
  'offline',
  true,
  '2025-10-15 19:30:00+07',
  '2025-10-15 21:30:00+07',
  'open',
  'token-issac-oct2025',
  '8888'
),
(
  '20000000-0000-0000-0000-000000000002',
  'Workshop Kỹ năng Tư vấn Tuyển sinh 2025',
  '00000000-0000-0000-0000-000000000012',
  'activity',
  'offline',
  false,
  '2025-10-20 14:00:00+07',
  '2025-10-20 17:00:00+07',
  'draft',
  'token-workshop-tuvan',
  '9999'
);

-- Điểm danh mẫu cho cuộc họp tháng 10
INSERT INTO attendance (
  event_id,
  member_id,
  joined_at,
  attendance_pct,
  status
) VALUES
(
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '2025-10-15 19:25:00+07',
  100,
  'present'
),
(
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '2025-10-15 19:28:00+07',
  100,
  'present'
),
(
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000004',
  '2025-10-15 19:20:00+07',
  100,
  'present'
);
