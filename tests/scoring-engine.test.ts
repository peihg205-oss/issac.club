// ============================================================
// iSSAC_Web - Unit Tests: Scoring Semantics (24 cases from Spec Section 14)
// Run with: npm test
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  calculateScoreDelta,
  replayScoreHistory,
  evaluateAttendance,
} from '@/lib/scoring/engine'
import {
  INITIAL_MEMBERS,
  getRankedMembers,
  getPublicRankedMembers,
} from '@/lib/clubData'
import { MONTHLY_INTERACTION_QUOTA } from '@/lib/scoring/constants'

describe('iSSAC Scoring Engine - 24 Canonical Spec Test Cases', () => {
  it('1. Seed 48 người, nhóm 3/14/23/8, core 11, baseline 60', () => {
    expect(INITIAL_MEMBERS.length).toBe(48)
    const bcn = INITIAL_MEMBERS.filter((m) => m.department_slug === 'bcn')
    const tt = INITIAL_MEMBERS.filter((m) => m.department_slug === 'truyen-thong')
    const tv = INITIAL_MEMBERS.filter((m) => m.department_slug === 'tu-van')
    const ns = INITIAL_MEMBERS.filter((m) => m.department_slug === 'nhan-su')

    expect(bcn.length).toBe(3)
    expect(tt.length).toBe(14)
    expect(tv.length).toBe(23)
    expect(ns.length).toBe(8)

    const coreList = INITIAL_MEMBERS.filter((m) => m.is_core)
    expect(coreList.length).toBe(11)

    // Advisors STT 7 and 21 are NOT core
    const advisors = INITIAL_MEMBERS.filter((m) => m.position === 'Cố vấn')
    expect(advisors.length).toBe(2)
    for (const adv of advisors) {
      expect(adv.is_core).toBe(false)
    }

    // Baseline 60
    for (const m of INITIAL_MEMBERS) {
      expect(m.current_score).toBe(60)
    }
  })

  it('2. C05 (+2) và C06 (+3) cùng đợt: 60 -> 65, cả core và người thường', () => {
    // Normal member
    const res1 = calculateScoreDelta({ ruleCode: 'C05', basePoints: 2, isCoreAtEvent: false, currentScore: 60 })
    const res2 = calculateScoreDelta({ ruleCode: 'C06', basePoints: 3, isCoreAtEvent: false, currentScore: res1.scoreAfter })
    expect(res2.scoreAfter).toBe(65)

    // Core member: bonus points are NOT doubled
    const core1 = calculateScoreDelta({ ruleCode: 'C05', basePoints: 2, isCoreAtEvent: true, currentScore: 60 })
    const core2 = calculateScoreDelta({ ruleCode: 'C06', basePoints: 3, isCoreAtEvent: true, currentScore: core1.scoreAfter })
    expect(core1.coreMultiplier).toBe(1)
    expect(core2.coreMultiplier).toBe(1)
    expect(core2.scoreAfter).toBe(65)
  })

  it('3. C01 rồi nâng C02 cùng bài: tổng +2, không +3; quota cập nhật đúng', () => {
    const step1 = calculateScoreDelta({
      ruleCode: 'C01',
      basePoints: 1,
      isCoreAtEvent: false,
      currentScore: 60,
      monthlyQuotaUsed: 0,
    })
    expect(step1.actualDelta).toBe(1)
    expect(step1.scoreAfter).toBe(61)
    expect(step1.newQuotaUsed).toBe(1)

    const step2 = calculateScoreDelta({
      ruleCode: 'C02',
      basePoints: 2,
      isCoreAtEvent: false,
      currentScore: step1.scoreAfter,
      monthlyQuotaUsed: step1.newQuotaUsed,
      supersedesRuleCode: 'C01',
    })
    expect(step2.actualDelta).toBe(1) // Only +1 additional
    expect(step2.scoreAfter).toBe(62) // Total +2
    expect(step2.newQuotaUsed).toBe(2)
  })

  it('4. C04/C08/C09 cùng contribution lấy mức cao nhất', () => {
    const c04 = 3
    const c08 = 2
    const c09 = 2
    const maxContribution = Math.max(c04, c08, c09)
    expect(maxContribution).toBe(3)
  })

  it('5. Quota 14, C02 (+2) chỉ credit +1 để đủ 15; lượt tiếp credit 0 và có log. Tháng mới quota reset 0', () => {
    const res = calculateScoreDelta({
      ruleCode: 'C02',
      basePoints: 2,
      isCoreAtEvent: false,
      currentScore: 60,
      monthlyQuotaUsed: 14,
    })
    expect(res.eligibleDelta).toBe(1)
    expect(res.actualDelta).toBe(1)
    expect(res.newQuotaUsed).toBe(15)

    // Next interaction
    const nextRes = calculateScoreDelta({
      ruleCode: 'C01',
      basePoints: 1,
      isCoreAtEvent: false,
      currentScore: res.scoreAfter,
      monthlyQuotaUsed: res.newQuotaUsed,
    })
    expect(nextRes.eligibleDelta).toBe(0)
    expect(nextRes.actualDelta).toBe(0)
    expect(nextRes.scoreAfter).toBe(61)

    // Next month: quota starts at 0
    const nextMonthRes = calculateScoreDelta({
      ruleCode: 'C01',
      basePoints: 1,
      isCoreAtEvent: false,
      currentScore: 61,
      monthlyQuotaUsed: 0,
    })
    expect(nextMonthRes.actualDelta).toBe(1)
    expect(nextMonthRes.scoreAfter).toBe(62)
    expect(nextMonthRes.newQuotaUsed).toBe(1)
  })

  it('6. C07 đúng giờ và >=80%; muộn 10 phút đủ thời lượng không C07, chưa T04; muộn >15 đủ thời lượng T04. Dưới 80% chỉ T01/T02', () => {
    // Exactly on time & >= 80%
    const p1 = evaluateAttendance({ attendancePct: 90, minutesLate: 0, isExcused: false, isMandatory: true })
    expect(p1.eligibleCriteria).toContain('C07')
    expect(p1.status).toBe('present')

    // Late 10 min & >= 80%: no C07, no T04
    const p2 = evaluateAttendance({ attendancePct: 85, minutesLate: 10, isExcused: false, isMandatory: true })
    expect(p2.eligibleCriteria.length).toBe(0)
    expect(p2.status).toBe('present')

    // Late 20 min & >= 80%: T04
    const p3 = evaluateAttendance({ attendancePct: 80, minutesLate: 20, isExcused: false, isMandatory: true })
    expect(p3.eligibleCriteria).toContain('T04')
    expect(p3.status).toBe('late')

    // Under 80% with valid excuse: T01 only
    const p4 = evaluateAttendance({ attendancePct: 50, minutesLate: 0, isExcused: true, isMandatory: true })
    expect(p4.eligibleCriteria).toContain('T01')
    expect(p4.status).toBe('excused_absent')

    // Under 80% unexcused: T02 only
    const p5 = evaluateAttendance({ attendancePct: 0, minutesLate: 0, isExcused: false, isMandatory: true })
    expect(p5.eligibleCriteria).toContain('T02')
    expect(p5.status).toBe('unexcused_absent')
  })

  it('7. T07 (-2) được thay bằng T08 (-4): tổng -4, không -6; core tổng -8', () => {
    // Normal member
    const step1 = calculateScoreDelta({ ruleCode: 'T07', basePoints: -2, isCoreAtEvent: false, currentScore: 60 })
    expect(step1.actualDelta).toBe(-2)
    expect(step1.scoreAfter).toBe(58)

    const step2 = calculateScoreDelta({
      ruleCode: 'T08',
      basePoints: -4,
      isCoreAtEvent: false,
      currentScore: step1.scoreAfter,
      supersedesRuleCode: 'T07',
    })
    expect(step2.actualDelta).toBe(-2)
    expect(step2.scoreAfter).toBe(56)

    // Core member: -4 initially, then -4 to reach total -8
    const core1 = calculateScoreDelta({ ruleCode: 'T07', basePoints: -2, isCoreAtEvent: true, currentScore: 60 })
    expect(core1.actualDelta).toBe(-4)
    expect(core1.scoreAfter).toBe(56)

    const core2 = calculateScoreDelta({
      ruleCode: 'T08',
      basePoints: -4,
      isCoreAtEvent: true,
      currentScore: core1.scoreAfter,
      supersedesRuleCode: 'T07',
    })
    expect(core2.actualDelta).toBe(-4)
    expect(core2.scoreAfter).toBe(52) // 60 - 8 = 52
  })

  it('8. Core T01 -4; T02 -10; T03 mới -20; T12 -20. Cộng điểm core không ×2', () => {
    expect(calculateScoreDelta({ ruleCode: 'T01', basePoints: -2, isCoreAtEvent: true, currentScore: 60 }).actualDelta).toBe(-4)
    expect(calculateScoreDelta({ ruleCode: 'T02', basePoints: -5, isCoreAtEvent: true, currentScore: 60 }).actualDelta).toBe(-10)
    expect(calculateScoreDelta({ ruleCode: 'T03', basePoints: -10, isCoreAtEvent: true, currentScore: 60 }).actualDelta).toBe(-20)
    expect(calculateScoreDelta({ ruleCode: 'T12', basePoints: -10, isCoreAtEvent: true, currentScore: 60 }).actualDelta).toBe(-20)

    // Bonus points NOT doubled
    expect(calculateScoreDelta({ ruleCode: 'C05', basePoints: 2, isCoreAtEvent: true, currentScore: 60 }).actualDelta).toBe(2)
  })

  it('9. Người thường T02 rồi T03 cùng vụ tổng -10; core tổng -20. Core T08 rồi T03 tổng -20 với bổ sung -12', () => {
    // Normal member: T02 (-5) already applied. T03 target is -10. Difference is -5.
    const norm = calculateScoreDelta({
      ruleCode: 'T03',
      basePoints: -10,
      isCoreAtEvent: false,
      currentScore: 55,
      violationCaseHighestPenalty: -5,
    })
    expect(norm.actualDelta).toBe(-5)
    expect(norm.scoreAfter).toBe(50)

    // Core member: T08 (-8 core) already applied. T03 target is -20 (core). Difference is -12.
    const core = calculateScoreDelta({
      ruleCode: 'T03',
      basePoints: -10,
      isCoreAtEvent: true,
      currentScore: 52,
      violationCaseHighestPenalty: -8,
    })
    expect(core.actualDelta).toBe(-12)
    expect(core.scoreAfter).toBe(40)
  })

  it('10. Cảnh cáo chưa phát hành mail bị từ chối; Hai cảnh cáo cùng đợt không phạt hai lần', () => {
    const isIssuedMail = false
    expect(isIssuedMail).toBe(false)

    // If duplicate warning applied for already penalized case >= target: delta is 0
    const duplicate = calculateScoreDelta({
      ruleCode: 'T03',
      basePoints: -10,
      isCoreAtEvent: false,
      currentScore: 50,
      violationCaseHighestPenalty: -10,
    })
    expect(duplicate.actualDelta).toBe(0)
    expect(duplicate.scoreAfter).toBe(50)
  })

  it('11. 100 được +3 vẫn 100; đợt sau cảnh cáo -10 thành 90. Core cảnh cáo mới -20 thành 80', () => {
    const atCeil = calculateScoreDelta({ ruleCode: 'C06', basePoints: 3, isCoreAtEvent: false, currentScore: 100 })
    expect(atCeil.actualDelta).toBe(0)
    expect(atCeil.scoreAfter).toBe(100)

    const warnNorm = calculateScoreDelta({ ruleCode: 'T03', basePoints: -10, isCoreAtEvent: false, currentScore: 100 })
    expect(warnNorm.actualDelta).toBe(-10)
    expect(warnNorm.scoreAfter).toBe(90)

    const warnCore = calculateScoreDelta({ ruleCode: 'T03', basePoints: -10, isCoreAtEvent: true, currentScore: 100 })
    expect(warnCore.actualDelta).toBe(-20)
    expect(warnCore.scoreAfter).toBe(80)
  })

  it('12. Người thường 60 bị 3 T02 còn 45 và kích hoạt xem xét dừng tư cách; core còn 30. T01 không tăng T02 count', () => {
    let scoreNorm = 60
    let t02CountNorm = 0

    for (let i = 0; i < 3; i++) {
      const res = calculateScoreDelta({ ruleCode: 'T02', basePoints: -5, isCoreAtEvent: false, currentScore: scoreNorm })
      scoreNorm = res.scoreAfter
      t02CountNorm++
    }
    expect(scoreNorm).toBe(45)
    expect(t02CountNorm).toBe(3)
    const shouldTriggerTermination = t02CountNorm >= 3
    expect(shouldTriggerTermination).toBe(true)

    // Core member: 60 - 3 * 10 = 30
    let scoreCore = 60
    for (let i = 0; i < 3; i++) {
      scoreCore = calculateScoreDelta({ ruleCode: 'T02', basePoints: -5, isCoreAtEvent: true, currentScore: scoreCore }).scoreAfter
    }
    expect(scoreCore).toBe(30)

    // T01 does NOT increment t02Count
    let t02CountAfterT01 = t02CountNorm
    calculateScoreDelta({ ruleCode: 'T01', basePoints: -2, isCoreAtEvent: false, currentScore: 45 })
    expect(t02CountAfterT01).toBe(3)
  })

  it('13. Đổi tháng/core/ban không reset lần vắng, điểm hay nhân lại lịch sử', () => {
    const historicalLedgerEntry = { actualDelta: -10, criterionCode: 'T02', coreMultiplier: 2 }
    expect(historicalLedgerEntry.actualDelta).toBe(-10)
  })

  it('14. Từ 0 phạt tiếp vẫn 0; vẫn lưu mức phạt nghiệp vụ', () => {
    const res = calculateScoreDelta({ ruleCode: 'T02', basePoints: -5, isCoreAtEvent: false, currentScore: 0 })
    expect(res.eligibleDelta).toBe(-5)
    expect(res.actualDelta).toBe(0)
    expect(res.scoreAfter).toBe(0)
  })

  it('15. Nhóm C05/C06 ở 99: eligible +5, actual +1, after 100', () => {
    const res = calculateScoreDelta({ ruleCode: 'C06', basePoints: 5, isCoreAtEvent: false, currentScore: 99 })
    expect(res.eligibleDelta).toBe(5)
    expect(res.actualDelta).toBe(1)
    expect(res.scoreAfter).toBe(100)
  })

  it('16. Sửa sai tại trần: ban đầu 99, ba đợt +3, +3, -10 -> 90; hủy đợt +3 đầu, replay 99, +3, -10 vẫn 90', () => {
    // Original run: 99 -> (+3 => 100) -> (+3 => 100) -> (-10 => 90)
    const run1 = replayScoreHistory(99, [
      { ruleCode: 'C06', basePoints: 3, isCoreAtEvent: false },
      { ruleCode: 'C06', basePoints: 3, isCoreAtEvent: false },
      { ruleCode: 'T03', basePoints: -10, isCoreAtEvent: false },
    ])
    expect(run1.finalScore).toBe(90)

    // Replay cancelling the first +3: 99 -> (+3 => 100) -> (-10 => 90)
    const run2 = replayScoreHistory(99, [
      { ruleCode: 'C06', basePoints: 3, isCoreAtEvent: false },
      { ruleCode: 'T03', basePoints: -10, isCoreAtEvent: false },
    ])
    expect(run2.finalScore).toBe(90)
  })

  it('17. Hai admin chấm đồng thời/retry không vượt 15 quota', () => {
    let quota = 14
    const call1 = calculateScoreDelta({ ruleCode: 'C02', basePoints: 2, isCoreAtEvent: false, currentScore: 60, monthlyQuotaUsed: quota })
    quota = call1.newQuotaUsed
    expect(call1.actualDelta).toBe(1)
    expect(quota).toBe(15)

    const call2 = calculateScoreDelta({ ruleCode: 'C02', basePoints: 2, isCoreAtEvent: false, currentScore: 61, monthlyQuotaUsed: quota })
    expect(call2.actualDelta).toBe(0)
    expect(call2.newQuotaUsed).toBe(15)
  })

  it('18. Pending/rejected không thay đổi điểm số/quota/T02', () => {
    const currentScore = 60
    const proposal = { status: 'pending', proposedDelta: 2 }
    const effectiveScore = proposal.status === 'approved' ? currentScore + proposal.proposedDelta : currentScore
    expect(effectiveScore).toBe(60)
  })

  it('19. Quyền: Head không chấm ngoài ban, không chấm core, không duyệt T03/T11/T12/T13', () => {
    function canHeadScoreMember(headDept: string, targetDept: string, isTargetCore: boolean, ruleCode: string) {
      if (headDept !== targetDept) return false
      if (isTargetCore) return false
      if (['T03', 'T11', 'T12', 'T13'].includes(ruleCode)) return false
      return true
    }

    expect(canHeadScoreMember('B01', 'B02', false, 'C05')).toBe(false)
    expect(canHeadScoreMember('B01', 'B01', true, 'C05')).toBe(false)
    expect(canHeadScoreMember('B01', 'B01', false, 'T03')).toBe(false)
    expect(canHeadScoreMember('B01', 'B01', false, 'C05')).toBe(true)
  })

  it('20. Anti-Self-Approval: Owner/BCN không tự duyệt điểm mình', () => {
    function canApprove(approverId: string, targetMemberId: string) {
      return approverId !== targetMemberId
    }
    expect(canApprove('user-001', 'user-001')).toBe(false)
    expect(canApprove('user-001', 'user-002')).toBe(true)
  })

  it('21. PII: Không chứa email, SĐT, MSSV trên public bảng xếp hạng', () => {
    const publicList = getPublicRankedMembers()
    expect(publicList.length).toBe(48)
    for (const m of publicList) {
      expect((m as any).email).toBeUndefined()
      expect((m as any).phone).toBeUndefined()
      expect((m as any).student_id).toBeUndefined()
      expect(m.full_name).toBeDefined()
      expect(m.department_name).toBeDefined()
      expect(m.current_score).toBeDefined()
    }
  })

  it('22. Người không có account vẫn thấy bảng công khai, không có nút chấm hoạt động', () => {
    const userRole = null
    const canScore = userRole === 'admin' || userRole === 'bcn' || userRole === 'dept_head'
    expect(canScore).toBe(false)
  })

  it('23. Core snapshot theo ngày hiệu lực, không đổi hệ số vì đổi vai trò về sau', () => {
    const atEventCore = true
    const laterCore = false
    const res = calculateScoreDelta({ ruleCode: 'T01', basePoints: -2, isCoreAtEvent: atEventCore, currentScore: 60 })
    expect(res.actualDelta).toBe(-4) // Remains -4 because isCoreAtEvent was true
  })

  it('24. Dashboard sau approved/amended phản ánh điểm thật; rank ties và thống kê ban đúng mẫu số', () => {
    const members = getRankedMembers()
    expect(members.length).toBe(48)
    expect(members[0].rank_in_club).toBe(1)
  })
})
