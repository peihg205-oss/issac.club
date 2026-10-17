// ============================================================
// iSSAC_Web - Authoritative Scoring Engine (Client & Server)
// Matches Postgres 002_create_functions.sql
// ============================================================

import {
  MONTHLY_INTERACTION_QUOTA,
  MIN_SCORE,
  MAX_SCORE,
  CORE_MULTIPLIER,
} from './constants'
import type {
  ScoringParams,
  ScoringResult,
  AttendanceEvaluationParams,
  AttendanceEvaluationResult,
} from './types'
import type { RuleCode } from '@/types/database'

/**
 * Calculates authoritative score deltas per Section 5, 6, 7, 8 of iSSAC Spec.
 */
export function calculateScoreDelta(params: ScoringParams): ScoringResult {
  const {
    ruleCode,
    basePoints,
    isCoreAtEvent,
    currentScore,
    monthlyQuotaUsed = 0,
    supersedesRuleCode,
    violationCaseHighestPenalty = 0,
  } = params

  // 1. Core Multiplier: only doubles negative points (P02)
  const isNegative = basePoints < 0
  const coreMultiplier = isNegative && isCoreAtEvent ? CORE_MULTIPLIER : 1
  let rulePoints = basePoints * coreMultiplier

  // 2. Q04: Mail warning for existing violation case
  if (ruleCode === 'T03') {
    const targetPenalty = 10 * (isCoreAtEvent ? 2 : 1)
    const existingPenalty = Math.abs(violationCaseHighestPenalty)
    const additionalPenalty = Math.max(0, targetPenalty - existingPenalty)
    rulePoints = -additionalPenalty
  }

  // 3. Superseding logic (e.g. T08 replaces T07, C02 replaces C01)
  if (supersedesRuleCode === 'T07' && ruleCode === 'T08') {
    // T08 is -4 (-8 core). T07 was -2 (-4 core). Delta is -2 (-4 core).
    const prevDelta = -2 * (isCoreAtEvent ? 2 : 1)
    const newTotal = -4 * (isCoreAtEvent ? 2 : 1)
    rulePoints = newTotal - prevDelta
  } else if (supersedesRuleCode === 'C01' && ruleCode === 'C02') {
    // C02 (+2) replaces C01 (+1). Additional delta is +1.
    rulePoints = 1
  }

  // 4. Monthly Quota for interaction rules (C01, C02, C03) - max 15/month (P04)
  let quotaEligibleDelta = rulePoints
  let newQuotaUsed = monthlyQuotaUsed

  if (['C01', 'C02', 'C03'].includes(ruleCode) && rulePoints > 0) {
    const remainingQuota = Math.max(0, MONTHLY_INTERACTION_QUOTA - monthlyQuotaUsed)
    quotaEligibleDelta = Math.min(rulePoints, remainingQuota)
    newQuotaUsed = monthlyQuotaUsed + quotaEligibleDelta
  }

  const eligibleDelta = quotaEligibleDelta

  // 5. Clamping [0, 100] (P01)
  const scoreBefore = Math.min(MAX_SCORE, Math.max(MIN_SCORE, currentScore))
  const rawAfter = scoreBefore + eligibleDelta
  const scoreAfter = Math.min(MAX_SCORE, Math.max(MIN_SCORE, rawAfter))
  const actualDelta = scoreAfter - scoreBefore

  return {
    coreMultiplier,
    rulePoints,
    quotaEligibleDelta,
    eligibleDelta,
    scoreBefore,
    scoreAfter,
    actualDelta,
    newQuotaUsed,
  }
}

/**
 * Replays a ledger sequence of transactions to verify idempotency and correct order of operations.
 */
export function replayScoreHistory(
  initialScore: number,
  transactions: Array<{
    ruleCode: RuleCode
    basePoints: number
    isCoreAtEvent: boolean
    monthlyQuotaUsed?: number
    supersedesRuleCode?: RuleCode | null
    violationCaseHighestPenalty?: number
  }>
): { finalScore: number; history: ScoringResult[] } {
  let current = initialScore
  let quotaTracker = 0
  const history: ScoringResult[] = []

  for (const tx of transactions) {
    const res = calculateScoreDelta({
      ...tx,
      currentScore: current,
      monthlyQuotaUsed: tx.monthlyQuotaUsed ?? quotaTracker,
    })
    history.push(res)
    current = res.scoreAfter
    quotaTracker = res.newQuotaUsed
  }

  return { finalScore: current, history }
}

/**
 * Evaluates attendance compliance based on percentage, tardiness, and excuse.
 */
export function evaluateAttendance(params: AttendanceEvaluationParams): AttendanceEvaluationResult {
  const { attendancePct, minutesLate, isExcused } = params

  if (attendancePct >= 80) {
    if (minutesLate <= 0) {
      return { eligibleCriteria: ['C07'], status: 'present' }
    }
    if (minutesLate > 15) {
      return { eligibleCriteria: ['T04'], status: 'late' }
    }
    // Present within 1-15 min: no C07, but no T04 either
    return { eligibleCriteria: [], status: 'present' }
  }

  // < 80% attendance
  if (isExcused) {
    return { eligibleCriteria: ['T01'], status: 'excused_absent' }
  }

  return { eligibleCriteria: ['T02'], status: 'unexcused_absent' }
}
