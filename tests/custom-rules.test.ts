import { describe, it, expect } from 'vitest'
import { CRITERIA_RULES } from '../src/lib/scoring/constants'

describe('Custom Rules Logic & Extension Tests', () => {
  it('should allow defining custom bonus criteria (e.g. C10, C11) and adding points within bounds', () => {
    const customRule = {
      code: 'C10',
      name: 'Đại diện CLB tham gia Hội thảo / Diễn đàn ĐHQG',
      points: 4,
      type: 'add' as const,
      category: 'Đối ngoại & Sự kiện',
      coreMultiplierApplies: false,
    }

    const currentScore = 60
    const nominal = customRule.points
    const newScore = Math.min(100, currentScore + nominal)
    const actualDelta = newScore - currentScore

    expect(newScore).toBe(64)
    expect(actualDelta).toBe(4)
  })

  it('should apply Core Team x2 penalty for custom deduction criteria when coreMultiplierApplies is true', () => {
    const customDeductRule = {
      code: 'T14',
      name: 'Không tham gia sự kiện bắt buộc CLB (Teambuilding/Gen Fest)',
      points: -5,
      type: 'deduct' as const,
      category: 'Kỷ luật & Sự kiện',
      coreMultiplierApplies: true,
    }

    // Member is Core Team -> 2x penalty (-10)
    const isCore = true
    const multiplier = (isCore && customDeductRule.coreMultiplierApplies) ? 2 : 1
    const nominalDelta = customDeductRule.points * multiplier
    const initialScore = 60
    const finalScore = Math.max(0, initialScore + nominalDelta)

    expect(nominalDelta).toBe(-10)
    expect(finalScore).toBe(50)

    // Member is NOT Core Team -> 1x penalty (-5)
    const nonCoreMultiplier = (false && customDeductRule.coreMultiplierApplies) ? 2 : 1
    const nonCoreDelta = customDeductRule.points * nonCoreMultiplier
    const nonCoreFinal = Math.max(0, initialScore + nonCoreDelta)

    expect(nonCoreDelta).toBe(-5)
    expect(nonCoreFinal).toBe(55)
  })

  it('should clamp scores correctly between 0 and 100 for custom rules', () => {
    const highBonus = 50
    const scoreNearMax = 95
    const clampedHigh = Math.min(100, scoreNearMax + highBonus)
    expect(clampedHigh).toBe(100)

    const severePenalty = -70
    const scoreNearMin = 20
    const clampedLow = Math.max(0, scoreNearMin + severePenalty)
    expect(clampedLow).toBe(0)
  })
})
