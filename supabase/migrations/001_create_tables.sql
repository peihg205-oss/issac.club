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
