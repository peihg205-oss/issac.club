// ============================================================
// iSSAC_Web - Unit Tests: Account Deletion & Realtime Auth Protection
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest'
import {
  DEFAULT_DELETED_ACCOUNT_IDS,
  resolveAllAssociatedIdentities,
  INITIAL_ISSUED_ACCOUNTS,
  PRESET_USERS,
  type IssuedAccount,
  type AuthUser,
} from '@/lib/auth/AuthContext'
import { INITIAL_MEMBERS } from '@/lib/clubData'

describe('Account Deletion & Realtime Blacklist Matrix', () => {
  it('1. DEFAULT_DELETED_ACCOUNT_IDS contains all variations of deleted account Tran Duc Thang', () => {
    expect(DEFAULT_DELETED_ACCOUNT_IDS).toContain('acc-thang')
    expect(DEFAULT_DELETED_ACCOUNT_IDS).toContain('24310088')
    expect(DEFAULT_DELETED_ACCOUNT_IDS).toContain('tdthang@vnuis.edu.vn')
    expect(DEFAULT_DELETED_ACCOUNT_IDS).toContain('user-dept-head')
  })

  it('2. resolveAllAssociatedIdentities expands any alias to all associated identifiers', () => {
    const fromId = resolveAllAssociatedIdentities('acc-thang')
    expect(fromId).toContain('24310088')
    expect(fromId).toContain('tdthang@vnuis.edu.vn')
    expect(fromId).toContain('acc-thang')
    expect(fromId).toContain('user-dept-head')

    const fromMssv = resolveAllAssociatedIdentities('24310088')
    expect(fromMssv).toContain('acc-thang')
    expect(fromMssv).toContain('24310088')
    expect(fromMssv).toContain('tdthang@vnuis.edu.vn')

    const fromEmail = resolveAllAssociatedIdentities('tdthang@vnuis.edu.vn')
    expect(fromEmail).toContain('24310088')
    expect(fromEmail).toContain('acc-thang')
  })

  it('3. PRESET_USERS no longer contains deleted user Tran Duc Thang as dept_head', () => {
    const foundThang = PRESET_USERS.find(
      (u) =>
        u.name === 'Trần Đức Thắng' ||
        u.memberCode === '24310088' ||
        (u.id === 'user-dept-head' && u.name === 'Trần Đức Thắng')
    )
    expect(foundThang).toBeUndefined()

    // Department head preset is now an active dept head (Le Tran Thuy Nguyen)
    const deptHeadPreset = PRESET_USERS.find((u) => u.id === 'user-dept-head')
    expect(deptHeadPreset).toBeDefined()
    expect(deptHeadPreset?.name).toBe('Lê Trần Thuỷ Nguyên')
    expect(deptHeadPreset?.role).toBe('dept_head')
  })

  it('4. INITIAL_ISSUED_ACCOUNTS no longer provisions acc-thang by default', () => {
    const accThang = INITIAL_ISSUED_ACCOUNTS.find(
      (a) => a.id === 'acc-thang' || a.studentId === '24310088' || a.email === 'tdthang@vnuis.edu.vn'
    )
    expect(accThang).toBeUndefined()
  })

  it('5. Login rejection simulation: Any login attempt by MSSV, Email, Name, or ID is strictly blocked', () => {
    const deletedSet = new Set<string>(
      DEFAULT_DELETED_ACCOUNT_IDS.map((s) => s.toLowerCase().trim())
    )

    // Expand all aliases
    for (const d of DEFAULT_DELETED_ACCOUNT_IDS) {
      resolveAllAssociatedIdentities(d).forEach((alias) =>
        deletedSet.add(alias.toLowerCase().trim())
      )
    }

    const isBlocked = (input: string) => {
      const clean = input.trim().toLowerCase()
      if (deletedSet.has(clean)) return true

      const member = INITIAL_MEMBERS.find(
        (m) =>
          m.member_code.toLowerCase() === clean ||
          m.student_id?.toLowerCase() === clean ||
          m.email?.toLowerCase() === clean ||
          m.full_name?.toLowerCase() === clean
      )
      if (member) {
        if (
          deletedSet.has(member.member_code.toLowerCase()) ||
          (member.student_id && deletedSet.has(member.student_id.toLowerCase())) ||
          (member.email && deletedSet.has(member.email.toLowerCase())) ||
          (member.full_name && deletedSet.has(member.full_name.toLowerCase()))
        ) {
          return true
        }
      }

      return false
    }

    // Try logging in with MSSV: 24310088
    expect(isBlocked('24310088')).toBe(true)

    // Try logging in with Email: tdthang@vnuis.edu.vn
    expect(isBlocked('tdthang@vnuis.edu.vn')).toBe(true)

    // Try logging in with Full Name: Trần Đức Thắng
    expect(isBlocked('Trần Đức Thắng')).toBe(true)

    // Try logging in with Account ID: acc-thang
    expect(isBlocked('acc-thang')).toBe(true)

    // Valid non-deleted user (Giang Le Hiep) should NOT be blocked
    expect(isBlocked('23070691')).toBe(false)
    expect(isBlocked('glhiep@vnuis.edu.vn')).toBe(false)
  })

  it('6. Force Logout simulation: Active session is detected and cleared immediately', () => {
    const deletedSet = new Set<string>(
      DEFAULT_DELETED_ACCOUNT_IDS.map((s) => s.toLowerCase().trim())
    )
    for (const d of DEFAULT_DELETED_ACCOUNT_IDS) {
      resolveAllAssociatedIdentities(d).forEach((alias) =>
        deletedSet.add(alias.toLowerCase().trim())
      )
    }

    const isUserDeleted = (user: AuthUser | null): boolean => {
      if (!user) return false
      const id = user.id?.toLowerCase().trim()
      const code = user.memberCode?.toLowerCase().trim()
      const name = user.name?.toLowerCase().trim()
      return (
        (id ? deletedSet.has(id) : false) ||
        (code ? deletedSet.has(code) : false) ||
        (name ? deletedSet.has(name) : false)
      )
    }

    // A session logged in as Tran Duc Thang by memberCode
    const thangSessionByCode: AuthUser = {
      id: '24310088',
      name: 'Trần Đức Thắng',
      role: 'dept_head',
      roleTitle: 'Trưởng Ban Truyền thông',
      memberCode: '24310088',
      isCore: true,
      avatarBg: 'bg-blue-600',
    }
    expect(isUserDeleted(thangSessionByCode)).toBe(true)

    // A session logged in as Tran Duc Thang by old preset ID
    const thangSessionByPreset: AuthUser = {
      id: 'user-dept-head',
      name: 'Trần Đức Thắng',
      role: 'dept_head',
      roleTitle: 'Trưởng Ban Truyền thông',
      memberCode: '24310088',
      isCore: true,
      avatarBg: 'bg-blue-600',
    }
    expect(isUserDeleted(thangSessionByPreset)).toBe(true)

    // A session logged in as Tran Duc Thang by old account ID
    const thangSessionByAccId: AuthUser = {
      id: 'acc-thang',
      name: 'Trần Đức Thắng',
      role: 'dept_head',
      roleTitle: 'Trưởng Ban Truyền thông',
      memberCode: '24310088',
      isCore: true,
      avatarBg: 'bg-blue-600',
    }
    expect(isUserDeleted(thangSessionByAccId)).toBe(true)

    // Giang Le Hiep active session should NOT be deleted
    const hiepSession: AuthUser = {
      id: 'user-hiep',
      name: 'Giang Lê Hiệp',
      role: 'bcn',
      roleTitle: 'Phó chủ nhiệm CLB',
      memberCode: '23070691',
      isCore: true,
      avatarBg: 'bg-blue-600',
    }
    expect(isUserDeleted(hiepSession)).toBe(false)
  })
})

