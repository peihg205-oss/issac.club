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
