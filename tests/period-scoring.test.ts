// ============================================================
// iSSAC_Web - Unit Tests: Period Scoring & Monthly Reset
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  calculatePeriodLeaderboard,
  STANDARD_MONTHLY_BASELINE,
  AVAILABLE_PERIODS,
} from '@/lib/periodData'
import { INITIAL_MEMBERS, getActiveRosterMembers } from '@/lib/clubData'

describe('Period Scoring & Monthly Reset Engine', () => {
  it('1. Đảm bảo mốc xuất phát chuẩn hàng tháng là 60 điểm', () => {
    expect(STANDARD_MONTHLY_BASELINE).toBe(60)
  })

  it('2. Tra cứu điểm Tháng 10 (Hiện tại) tính đúng điểm bắt đầu từ 60đ', () => {
    const active = getActiveRosterMembers(INITIAL_MEMBERS)
    const rankings = calculatePeriodLeaderboard('month-2025-10', active)

    expect(rankings.length).toBe(48)
    expect(rankings[0].baseScore).toBe(60)
    // Hạng 1 Tháng 10: Giang Lê Hiệp (96đ, +36đ)
    expect(rankings[0].member.full_name).toBe('Giang Lê Hiệp')
    expect(rankings[0].finalScore).toBe(96)
    expect(rankings[0].earnedDelta).toBe(36)

    // Hạng 2 Tháng 10: Nguyễn Thị Hồng Hân (94đ, +34đ)
    expect(rankings[1].member.full_name).toBe('Nguyễn Thị Hồng Hân')
    expect(rankings[1].finalScore).toBe(94)
    expect(rankings[1].earnedDelta).toBe(34)
  })

  it('3. Tra cứu điểm Tháng 09/2025 (Đã chốt) - Hạng 1 Nguyễn Thị Hồng Hân (95đ)', () => {
    const active = getActiveRosterMembers(INITIAL_MEMBERS)
    const rankings = calculatePeriodLeaderboard('month-2025-09', active)

    expect(rankings.length).toBe(48)
    expect(rankings[0].member.full_name).toBe('Nguyễn Thị Hồng Hân')
    expect(rankings[0].finalScore).toBe(95)
    expect(rankings[0].earnedDelta).toBe(35)
    expect(rankings[0].baseScore).toBe(60)
  })

  it('4. Tra cứu điểm Tháng 08/2025 (Đã chốt) - Hạng 1 Trần Đức Thắng (94đ)', () => {
    const active = getActiveRosterMembers(INITIAL_MEMBERS)
    const rankings = calculatePeriodLeaderboard('month-2025-08', active)

    expect(rankings.length).toBe(48)
    expect(rankings[0].member.full_name).toBe('Trần Đức Thắng')
    expect(rankings[0].finalScore).toBe(94)
    expect(rankings[0].earnedDelta).toBe(34)
    expect(rankings[0].baseScore).toBe(60)
  })

  it('5. Tra cứu điểm Quý 3/2025 (T7-T9) tính điểm TB mỗi tháng và tổng tích lũy', () => {
    const active = getActiveRosterMembers(INITIAL_MEMBERS)
    const rankings = calculatePeriodLeaderboard('quarter-2025-q3', active)

    expect(rankings.length).toBe(48)
    // Điểm TB Quý của Top 1 >= 90
    expect(rankings[0].finalScore).toBeGreaterThanOrEqual(90)
    expect(rankings[0].earnedDelta).toBeGreaterThan(0)
  })

  it('6. Tra cứu Cả Năm / Nhiệm kỳ 2025-2026 tổng hợp cống hiến toàn diện', () => {
    const active = getActiveRosterMembers(INITIAL_MEMBERS)
    const rankings = calculatePeriodLeaderboard('year-2025-2026', active)

    expect(rankings.length).toBe(48)
    expect(rankings[0].finalScore).toBeGreaterThanOrEqual(90)
    expect(rankings[0].earnedDelta).toBeGreaterThan(50)
  })

  it('7. Danh mục chu kỳ chứa đủ các nhóm Tháng, Quý, Năm', () => {
    const monthPeriods = AVAILABLE_PERIODS.filter((p) => p.scope === 'month')
    const quarterPeriods = AVAILABLE_PERIODS.filter((p) => p.scope === 'quarter')
    const yearPeriods = AVAILABLE_PERIODS.filter((p) => p.scope === 'year')

    expect(monthPeriods.length).toBeGreaterThanOrEqual(3)
    expect(quarterPeriods.length).toBeGreaterThanOrEqual(2)
    expect(yearPeriods.length).toBeGreaterThanOrEqual(1)
  })

  it('8. Khởi tạo chu kỳ Tháng 10/2026 theo thời gian thực bắt đầu chuẩn 60đ', () => {
    const active = getActiveRosterMembers(INITIAL_MEMBERS)
    const newPeriod = {
      id: 'month-2026-10',
      scope: 'month' as const,
      name: 'Tháng 10/2026',
      shortLabel: 'T10/2026',
      description: 'Chu kỳ thi đua Tháng 10/2026 theo thời gian thực',
      timeRange: '01/10/2026 - 31/10/2026',
      status: 'active' as const,
      isCurrent: true,
      isFinalized: false,
    }

    const customDeltas = {
      'month-2026-10': {
        '23070691': 15, // Giang Lê Hiệp: +15đ -> 75đ
        'STAFF-001': 10, // Nguyễn Thị Hồng Hân: +10đ -> 70đ
      },
    }

    const rankings = calculatePeriodLeaderboard('month-2026-10', active, [newPeriod, ...AVAILABLE_PERIODS], customDeltas)

    expect(rankings.length).toBe(48)
    expect(rankings[0].member.full_name).toBe('Giang Lê Hiệp')
    expect(rankings[0].baseScore).toBe(60)
    expect(rankings[0].earnedDelta).toBe(15)
    expect(rankings[0].finalScore).toBe(75)
    expect(rankings[0].isLocked).toBe(false)

    // Thành viên chưa có delta vẫn an toàn ở 60đ xuất phát
    const memberNoDelta = rankings.find((r) => r.member.member_code === '24310069')
    expect(memberNoDelta?.baseScore).toBe(60)
    expect(memberNoDelta?.earnedDelta).toBe(0)
    expect(memberNoDelta?.finalScore).toBe(60)
  })

  it('9. Chu kỳ đã khóa sổ điểm (locked) phản ánh đúng cờ isLocked trong xếp hạng', () => {
    const active = getActiveRosterMembers(INITIAL_MEMBERS)
    const lockedPeriod = {
      id: 'month-2026-10',
      scope: 'month' as const,
      name: 'Tháng 10/2026',
      shortLabel: 'T10/2026',
      description: 'Đã khóa sổ bởi BCN',
      timeRange: '01/10/2026 - 31/10/2026',
      status: 'locked' as const,
      isCurrent: false,
      isFinalized: true,
      lockedBy: 'Nguyễn Thị Hồng Hân (Chủ nhiệm)',
    }

    const rankings = calculatePeriodLeaderboard('month-2026-10', active, [lockedPeriod, ...AVAILABLE_PERIODS])
    expect(rankings[0].isLocked).toBe(true)
    expect(rankings[0].note).toBe('Đã khóa sổ bởi BCN')
  })
})

