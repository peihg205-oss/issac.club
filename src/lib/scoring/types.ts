// ============================================================
// iSSAC_Web - Scoring Engine Interfaces
// ============================================================

import type { RuleCode } from '@/types/database'

export interface ScoringParams {
  ruleCode: RuleCode
  basePoints: number
  isCoreAtEvent: boolean
  currentScore: number
  monthlyQuotaUsed?: number
  supersedesRuleCode?: RuleCode | null
  violationCaseHighestPenalty?: number
}

export interface ScoringResult {
  coreMultiplier: number
  rulePoints: number
  quotaEligibleDelta: number
  eligibleDelta: number
  scoreBefore: number
  scoreAfter: number
  actualDelta: number
  newQuotaUsed: number
}

export interface AttendanceEvaluationParams {
  attendancePct: number
  minutesLate: number
  isExcused: boolean
  isMandatory: boolean
}

export interface AttendanceEvaluationResult {
  eligibleCriteria: RuleCode[]
  status: 'present' | 'late' | 'left_early' | 'excused_absent' | 'unexcused_absent'
}
