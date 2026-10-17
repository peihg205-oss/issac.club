// ============================================================
// iSSAC_Web - TypeScript Database & Domain Types
// ============================================================

export type DepartmentCode = 'B01' | 'B02' | 'B03' | 'B04'
export type DepartmentSlug = 'truyen-thong' | 'tu-van' | 'nhan-su' | 'bcn'

export type UserRole = 'admin' | 'bcn' | 'dept_head' | 'hr' | 'advisor' | 'member'

export type MemberStatus = 'active' | 'paused' | 'terminated'

export type CriterionType = 'add' | 'deduct' | 'rule'

export type RuleCode =
  | 'C01' | 'C02' | 'C03' | 'C04' | 'C05' | 'C06' | 'C07' | 'C08' | 'C09'
  | 'T01' | 'T02' | 'T03' | 'T04' | 'T05' | 'T06' | 'T07' | 'T08' | 'T09'
  | 'T10' | 'T11' | 'T12' | 'T13'

export type RatingLevelName =
  | 'Rất tích cực'
  | 'Tích cực'
  | 'Đạt cơ bản'
  | 'Đạt yêu cầu'
  | 'Cần cải thiện'
  | 'Diện cảnh cáo'
  | 'Cảnh cáo'
  | 'Xem xét dừng tư cách'

export interface Term {
  id: string
  name: string
  start_date: string
  end_date: string
  rules_effective_from: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Department {
  id: string
  code: DepartmentCode
  name: string
  slug: DepartmentSlug
  scoring_notes?: string
  is_active: boolean
  created_at: string
}

export interface Member {
  id: string
  member_code: string
  student_id?: string | null
  full_name: string
  class_name?: string | null
  dob?: string | null
  phone?: string | null
  email?: string | null
  department_id: string
  department_code?: DepartmentCode
  department_name?: string
  position: string
  is_core_team: boolean
  status: MemberStatus
  current_score: number
  t02_count: number
  term_id: string
  user_id?: string | null
  created_at: string
  updated_at: string
}

export interface PublicMember {
  id: string
  member_code: string
  full_name: string
  department_name: string
  department_code: DepartmentCode
  position: string
  is_core_team: boolean
  status: MemberStatus
  current_score: number
  rating_level: RatingLevelName
  rank: number
  avatar_url?: string
}

export interface Criterion {
  id: string
  code: RuleCode
  name: string
  description?: string
  type: CriterionType
  base_points: number
  monthly_cap_group?: string | null
  monthly_cap_value?: number | null
  is_auto: boolean
  requires_approval: boolean
  core_multiplier_applies: boolean
  replaces?: string[] | null
  exclusive_group?: string | null
  max_per_event?: number | null
  is_active: boolean
}

export interface ScoreLedgerEntry {
  id: string
  member_id: string
  member_name?: string
  term_id: string
  criterion_code: RuleCode
  criterion_name?: string
  event_id?: string | null
  task_id?: string | null
  score_before: number
  raw_delta: number
  multiplier: number
  applied_delta: number
  score_after: number
  reason: string
  evidence_url?: string | null
  scope_note?: string | null
  recorded_by?: string | null
  approved_by?: string | null
  status: 'pending' | 'approved' | 'rejected' | 'reversed'
  idempotency_key?: string | null
  reverses_ledger_id?: string | null
  occurred_at: string
  created_at: string
}

export interface ScoreRequest {
  id: string
  requested_by: string
  requested_by_name?: string
  member_id: string
  member_name?: string
  department_name?: string
  criterion_code: RuleCode
  criterion_name?: string
  reason: string
  evidence_url?: string | null
  proposed_delta: number
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by?: string | null
  review_note?: string | null
  created_at: string
}

export interface EventItem {
  id: string
  name: string
  department_id?: string | null
  department_name?: string | null
  event_type: 'meeting' | 'activity' | 'other'
  format: 'online' | 'offline'
  is_mandatory: boolean
  starts_at: string
  ends_at: string
  checkin_token: string
  token_expires_at: string
  short_code?: string | null
  status: 'draft' | 'open' | 'closed' | 'finalized'
  created_at: string
}

export interface AttendanceRecord {
  id: string
  event_id: string
  member_id: string
  member_name?: string
  joined_at?: string | null
  left_at?: string | null
  attendance_pct: number
  status: 'present' | 'late' | 'left_early' | 'excused_absent' | 'unexcused_absent'
  excuse_reason?: string | null
  created_at: string
}

export interface Dispute {
  id: string
  member_id: string
  member_name?: string
  ledger_id: string
  criterion_code?: string
  reason: string
  evidence_url?: string | null
  deadline_at: string
  status: 'pending' | 'under_review' | 'resolved_accepted' | 'resolved_rejected'
  dept_head_note?: string | null
  hr_note?: string | null
  bcn_note?: string | null
  created_at: string
  resolved_at?: string | null
}

export interface RatingLevel {
  min_score: number
  max_score: number
  level_name: RatingLevelName
  action_required: string
  confirmer: string
  display_order: number
  badge_color: string
}
