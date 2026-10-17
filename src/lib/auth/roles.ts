import type { UserRole } from '@/types/database'

export interface UserSessionData {
  id: string
  email?: string
  full_name?: string
  role: UserRole
  department_id?: string | null
  member_id?: string | null
  is_core_team?: boolean
}

export function canManageSettings(role?: UserRole): boolean {
  return role === 'admin'
}

export function canImportMembers(role?: UserRole): boolean {
  return role === 'admin' || role === 'bcn' || role === 'hr'
}

export function canProposeScore(role?: UserRole): boolean {
  return role === 'admin' || role === 'bcn' || role === 'dept_head'
}

export function canApproveSevereViolation(role?: UserRole): boolean {
  return role === 'admin' || role === 'bcn'
}

export function canViewSensitiveInfo(role?: UserRole): boolean {
  return role === 'admin' || role === 'bcn' || role === 'hr'
}

export function canReviewDispute(role?: UserRole): boolean {
  return role === 'admin' || role === 'bcn' || role === 'dept_head' || role === 'hr'
}
