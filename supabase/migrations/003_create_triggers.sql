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
