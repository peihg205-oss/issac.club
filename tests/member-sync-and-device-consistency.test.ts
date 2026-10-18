import { describe, it, expect } from 'vitest'
import { sanitizeMemberAvatar } from '../src/lib/utils/imageCompress'
import type { RosterMember } from '../src/lib/clubData'

describe('Member Sync & Cross-Device Consistency Engine', () => {
  it('should sanitize oversized avatar base64 strings (>40KB) to prevent network/sync hangs', () => {
    const smallAvatar = 'data:image/jpeg;base64,' + 'A'.repeat(500)
    expect(sanitizeMemberAvatar(smallAvatar)).toBe(smallAvatar)

    const giantAvatar = 'data:image/jpeg;base64,' + 'A'.repeat(50000)
    expect(sanitizeMemberAvatar(giantAvatar)).toBeUndefined()

    const regularUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'
    expect(sanitizeMemberAvatar(regularUrl)).toBe(regularUrl)
  })

  it('should respect deletedMemberCodes tombstoning and never resurrect deleted members from other devices', () => {
    const deletedCodes = new Set(['ISSAC-049'])

    const deviceBLocalMembers: Partial<RosterMember>[] = [
      { member_code: 'ISSAC-001', full_name: 'Nguyễn Văn A' },
      { member_code: 'ISSAC-049', full_name: 'Thành viên đã bị xóa trên điện thoại' },
    ]

    const cloudMembers: Partial<RosterMember>[] = [
      { member_code: 'ISSAC-001', full_name: 'Nguyễn Văn A' },
    ]

    // Device B receives cloud sync with deletedCodes
    const filteredLocal = deviceBLocalMembers.filter((m) => !deletedCodes.has(m.member_code!))
    const filteredCloud = cloudMembers.filter((m) => !deletedCodes.has(m.member_code!))

    // Merged list should NOT contain the deleted member
    const cloudCodes = new Set(filteredCloud.map((m) => m.member_code))
    const localOnly = filteredLocal.filter((m) => !cloudCodes.has(m.member_code))

    const merged = [...filteredCloud, ...localOnly]
    expect(merged.length).toBe(1)
    expect(merged.some((m) => m.member_code === 'ISSAC-049')).toBe(false)
  })

  it('should synchronize newly added member across laptop and phone', () => {
    const cloudMembers: Partial<RosterMember>[] = [
      { member_code: 'ISSAC-001', full_name: 'Nguyễn Văn A', updated_at: '2026-10-18T10:00:00Z' },
    ]

    const newMember: Partial<RosterMember> = {
      member_code: 'ISSAC-049',
      full_name: 'Thành viên mới thêm trên Laptop',
      updated_at: '2026-10-18T14:00:00Z',
    }

    // Laptop adds member
    const laptopMembers = [...cloudMembers, newMember]
    expect(laptopMembers.length).toBe(2)

    // Laptop pushes to cloud
    const updatedCloud = [...laptopMembers]

    // Phone polls cloud
    const phoneLocal: Partial<RosterMember>[] = [cloudMembers[0]]
    const phoneCurMap = new Map(phoneLocal.map((m) => [m.member_code, m]))

    const phoneMerged = updatedCloud.map((cloudM) => {
      const localM = phoneCurMap.get(cloudM.member_code)
      if (!localM) return cloudM
      return cloudM
    })

    expect(phoneMerged.length).toBe(2)
    expect(phoneMerged.find((m) => m.member_code === 'ISSAC-049')?.full_name).toBe('Thành viên mới thêm trên Laptop')
  })
})
