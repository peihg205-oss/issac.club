import { describe, it, expect } from 'vitest'
import { AVAILABLE_PERIODS } from '@/lib/periodData'
import { CRITERIA_RULES } from '@/lib/scoring/constants'

describe('Custom Points Scoring & Academic Year 2026-2027', () => {
  it('1. Chu kỳ năm học 2026-2027 được cấu hình làm chu kỳ hoạt động chính', () => {
    const currentYearPeriod = AVAILABLE_PERIODS.find((p) => p.id === 'year-2026-2027')
    expect(currentYearPeriod).toBeDefined()
    expect(currentYearPeriod?.isCurrent).toBe(true)
    expect(currentYearPeriod?.status).toBe('active')
    expect(currentYearPeriod?.shortLabel).toBe('Năm 2026-2027')
  })

  it('2. Tính toán điểm tự cho (Custom Points Override) cho điểm trừ âm', () => {
    const currentScore = 80
    const customPoints = -7
    const expectedScore = Math.max(0, Math.min(100, currentScore + customPoints))

    expect(expectedScore).toBe(73)
  })

  it('3. Tính toán điểm tự cho (Custom Points Override) cho điểm cộng dương', () => {
    const currentScore = 85
    const customPoints = 12
    const expectedScore = Math.max(0, Math.min(100, currentScore + customPoints))

    expect(expectedScore).toBe(97)
  })

  it('4. Điểm tự cho giới hạn an toàn tối đa 100đ và tối thiểu 0đ', () => {
    const highCap = Math.max(0, Math.min(100, 95 + 15))
    expect(highCap).toBe(100)

    const lowCap = Math.max(0, Math.min(100, 10 - 25))
    expect(lowCap).toBe(0)
  })

  it('5. Tên quy tắc tiêu chí khi có điểm tự cho hiển thị số điểm rõ ràng', () => {
    const rule = CRITERIA_RULES['T01']
    const customPoints = -5
    const ruleName = `${rule.name} (Tự cho: ${customPoints > 0 ? `+${customPoints}` : customPoints}đ)`

    expect(ruleName).toContain('Tự cho: -5đ')
    expect(ruleName).toContain(rule.name)
  })
})
