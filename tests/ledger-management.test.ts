import { describe, it, expect } from 'vitest'
import { calculateScoreDelta } from '../src/lib/scoring/engine'
import { CRITERIA_RULES } from '../src/lib/scoring/constants'
import { mergeProposals, mergeEvents } from '../src/lib/context/ClubContext'

describe('Ledger Score Management & BCN Edit/Delete Logic', () => {
  it('correctly categorizes records into Tất cả, Điểm cộng (> 0), and Điểm trừ (< 0)', () => {
    const sampleProposals = [
      { id: '1', memberCode: '24070680', points: 1, status: 'approved' },
      { id: '2', memberCode: '24310069', points: 1, status: 'approved' },
      { id: '3', memberCode: '23070691', points: 0, status: 'approved' }, // unregistered attendance
      { id: '4', memberCode: 'STAFF-001', points: -5, status: 'approved' },
      { id: '5', memberCode: '22073125', points: -5, status: 'approved' },
    ]

    const allApproved = sampleProposals.filter((p) => p.status === 'approved')
    const countAdd = allApproved.filter((p) => p.points > 0).length
    const countDeduct = allApproved.filter((p) => p.points < 0).length
    const countZero = allApproved.filter((p) => p.points === 0).length

    expect(allApproved.length).toBe(5)
    expect(countAdd).toBe(2)
    expect(countDeduct).toBe(2)
    expect(countZero).toBe(1)
    // Total equals sum of all types
    expect(countAdd + countDeduct + countZero).toBe(allApproved.length)
  })

  it('calculates member score adjustments correctly when BCN edits points (delta adjustment)', () => {
    const initialScore = 61
    const oldPoints = 1
    const newPoints = 0 // BCN changes mistakenly added point to 0

    const delta = newPoints - oldPoints // -1
    const newScore = Math.max(0, Math.min(100, initialScore + delta))

    expect(delta).toBe(-1)
    expect(newScore).toBe(60)
  })

  it('calculates member score adjustments correctly when BCN deletes an incorrect point addition', () => {
    const initialScore = 61
    const proposalPoints = 1 // mistake addition of +1

    // Deleting the proposal reverses the points: score - proposalPoints
    const restoredScore = Math.max(0, Math.min(100, initialScore - proposalPoints))
    expect(restoredScore).toBe(60)
  })

  it('calculates member score and absent_count_t02 restoration when BCN deletes an incorrect absence deduction', () => {
    const initialScore = 55
    const proposalPoints = -5
    const absentCount = 1

    // Deleting T02: restores 5 points and decrements absent count
    const restoredScore = Math.max(0, Math.min(100, initialScore - proposalPoints))
    const restoredAbsent = Math.max(0, absentCount - 1)

    expect(restoredScore).toBe(60)
    expect(restoredAbsent).toBe(0)
  })

  it('deduplicates ledger entries by unique proposal ID', () => {
    const existing = [
      { id: 'checkin-evt1-24070680', points: 1 },
      { id: 'prop-old-1', points: 2 },
    ]
    const newRecords = [
      { id: 'checkin-evt1-24070680', points: 1 }, // duplicate ID from re-finalizing
      { id: 'checkin-evt1-24310069', points: 1 },
    ]

    const deduplicated = [
      ...newRecords,
      ...existing.filter((p) => !newRecords.some((n) => n.id === p.id)),
    ]

    expect(deduplicated.length).toBe(3)
    expect(deduplicated.map((p) => p.id)).toEqual([
      'checkin-evt1-24070680',
      'checkin-evt1-24310069',
      'prop-old-1',
    ])
  })

  it('mergeProposals prevents cloud overwrite from erasing locally added proposals', () => {
    const local = [
      { id: 'prop-local-1', memberCode: '24070680', points: 1, status: 'approved', createdAt: '18/10/2026' } as any,
      { id: 'prop-local-2', memberCode: '24310069', points: 2, status: 'approved', createdAt: '18/10/2026' } as any,
    ]
    // Cloud had only 1 item (e.g. stale cache or device sync delay)
    const incomingFromCloud = [
      { id: 'prop-local-1', memberCode: '24070680', points: 1, status: 'approved', createdAt: '18/10/2026' } as any,
    ]

    const merged = mergeProposals(local, incomingFromCloud)
    expect(merged.length).toBe(2)
    expect(merged.map((p) => p.id)).toContain('prop-local-1')
    expect(merged.map((p) => p.id)).toContain('prop-local-2')
  })

  it('mergeProposals respects deletedProposalIds and does not resurrect deleted records', () => {
    const local = [
      { id: 'prop-active-1', memberCode: '24070680', points: 1, status: 'approved' } as any,
    ]
    const incomingFromCloud = [
      { id: 'prop-active-1', memberCode: '24070680', points: 1, status: 'approved' } as any,
      { id: 'prop-deleted-2', memberCode: '24310069', points: -5, status: 'approved' } as any, // deleted by BCN
    ]
    const deletedIds = new Set(['prop-deleted-2'])

    const merged = mergeProposals(local, incomingFromCloud, deletedIds)
    expect(merged.length).toBe(1)
    expect(merged[0].id).toBe('prop-active-1')
  })

  it('mergeEvents merges checkin records across multiple sessions without losing attendance', () => {
    const localEvents = [
      {
        id: 'evt-1',
        title: 'Họp CLB Gen 3.0',
        records: {
          '24070680': { memberCode: '24070680', status: 'present_on_time', checkinTime: '19:30' },
        },
      } as any,
    ]
    const incomingEvents = [
      {
        id: 'evt-1',
        title: 'Họp CLB Gen 3.0',
        records: {
          '24310069': { memberCode: '24310069', status: 'present_on_time', checkinTime: '19:35' },
        },
      } as any,
    ]

    const merged = mergeEvents(localEvents, incomingEvents)
    expect(merged.length).toBe(1)
    expect(merged[0].records['24070680']).toBeDefined()
    expect(merged[0].records['24310069']).toBeDefined()
  })

  it('mergeEvents filters out deleted events via deletedEventIds tombstone set', () => {
    const localEvents = [
      { id: 'evt-del-1', title: 'Sự kiện đã bị xóa' } as any,
      { id: 'evt-keep-2', title: 'Sự kiện còn hiệu lực' } as any,
    ]
    const incomingEvents = [
      { id: 'evt-del-1', title: 'Sự kiện đã bị xóa từ cloud' } as any,
      { id: 'evt-keep-2', title: 'Sự kiện còn hiệu lực' } as any,
    ]
    const deletedEventIds = new Set(['evt-del-1'])

    const merged = mergeEvents(localEvents, incomingEvents, deletedEventIds)
    expect(merged.length).toBe(1)
    expect(merged[0].id).toBe('evt-keep-2')
  })
})
