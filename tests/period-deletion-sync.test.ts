import { describe, it, expect } from 'vitest'
import { AVAILABLE_PERIODS, type PeriodItem } from '@/lib/periodData'

describe('Period Deletion & Cloud Tombstone Persistence', () => {
  it('correctly filters out deleted periods using tombstone IDs', () => {
    const deletedPeriodIds = new Set(['month-2025-08', 'month-2025-09'])

    // Giả lập logic merge trên Client hoặc Server
    const periodMap = new Map<string, PeriodItem>()
    AVAILABLE_PERIODS.forEach((p) => {
      if (!deletedPeriodIds.has(p.id)) {
        periodMap.set(p.id, p)
      }
    })

    const safePeriods = Array.from(periodMap.values())
    const safeIds = safePeriods.map((p) => p.id)

    expect(safeIds).not.toContain('month-2025-08')
    expect(safeIds).not.toContain('month-2025-09')
    expect(safeIds).toContain('month-2026-10')
    expect(safeIds).toContain('month-2025-10')
    expect(safePeriods.length).toBe(AVAILABLE_PERIODS.length - 2)
  })

  it('prevents deleted periods from resurrecting when cloud sync returns existing periods', () => {
    const deletedPeriodIds = new Set(['month-2025-08'])
    const cloudIncomingPeriods = [
      { id: 'month-2026-10', name: 'Tháng 10/2026', scope: 'month', status: 'active' },
      { id: 'month-2025-08', name: 'Tháng 08/2025', scope: 'month', status: 'locked' }, // Bản ghi cũ từ cloud
    ] as PeriodItem[]

    const periodMap = new Map<string, PeriodItem>()
    AVAILABLE_PERIODS.forEach((p) => {
      if (!deletedPeriodIds.has(p.id)) {
        periodMap.set(p.id, p)
      }
    })

    cloudIncomingPeriods.forEach((p) => {
      if (p?.id && !deletedPeriodIds.has(p.id)) {
        periodMap.set(p.id, { ...(periodMap.get(p.id) || {}), ...p })
      }
    })

    const result = Array.from(periodMap.values())
    expect(result.some((p) => p.id === 'month-2025-08')).toBe(false)
  })

  it('allows re-creating a previously deleted period by un-tombstoning it', () => {
    const deletedPeriodIds = new Set(['month-2026-10'])

    // Người dùng bấm tạo lại Tháng 10/2026
    const newPeriodId = 'month-2026-10'
    if (deletedPeriodIds.has(newPeriodId)) {
      deletedPeriodIds.delete(newPeriodId)
    }

    const periodMap = new Map<string, any>()
    AVAILABLE_PERIODS.forEach((p) => {
      if (!deletedPeriodIds.has(p.id)) {
        periodMap.set(p.id, p)
      }
    })

    expect(periodMap.has('month-2026-10')).toBe(true)
    expect(deletedPeriodIds.has('month-2026-10')).toBe(false)
  })

  it('un-tombstones any period present in the incoming periods payload at the server', () => {
    let cachedDeleted = ['month-2026-10', 'month-2025-10', 'month-2025-09']
    const incomingPeriods = [
      { id: 'month-2026-10', name: 'Tháng 10/2026', scope: 'month', status: 'active' },
    ]

    // Logic xử lý un-tombstone ở API route
    const activePeriodIds = new Set(incomingPeriods.map((p) => p.id))
    cachedDeleted = cachedDeleted.filter((id) => !activePeriodIds.has(id))

    expect(cachedDeleted).not.toContain('month-2026-10')
    expect(cachedDeleted).toContain('month-2025-10')
    expect(cachedDeleted).toContain('month-2025-09')

    // Khi lọc periods:
    const activeDelSet = new Set(cachedDeleted)
    const cleanPeriods = incomingPeriods.filter((p) => !activeDelSet.has(p.id))
    expect(cleanPeriods.length).toBe(1)
    expect(cleanPeriods[0].id).toBe('month-2026-10')
  })
})
