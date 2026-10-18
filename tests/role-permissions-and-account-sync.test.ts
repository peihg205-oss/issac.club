// ============================================================
// iSSAC_Web - Unit Tests: Role Permissions & Account Cloud Sync
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  canUserManageAccounts,
  canUserScoreMember,
  getAllowedScoringMembers,
} from '@/lib/auth/permissions'
import type { AuthUser, IssuedAccount } from '@/lib/auth/AuthContext'
import { INITIAL_MEMBERS, type RosterMember } from '@/lib/clubData'

describe('Role & Scoring Permissions Matrix', () => {
  const userBCN: AuthUser = {
    id: 'user-bcn',
    name: 'Giang Lê Hiệp',
    role: 'bcn',
    roleTitle: 'Phó chủ nhiệm CLB (BCN)',
    departmentCode: 'B04',
    departmentName: 'Ban Chủ nhiệm',
    memberCode: '23070691',
    isCore: true,
    avatarBg: 'bg-blue-600',
  }

  const userHR: AuthUser = {
    id: 'user-hr',
    name: 'Vũ Thị Minh Ngọc',
    role: 'hr',
    roleTitle: 'Trưởng Ban Nhân sự (HR)',
    departmentCode: 'B03',
    departmentName: 'Ban Nhân sự',
    memberCode: '23070764',
    isCore: true,
    avatarBg: 'bg-purple-500',
  }

  const userTruyenThong: AuthUser = {
    id: 'user-tt',
    name: 'Trần Đức Thắng',
    role: 'dept_head',
    roleTitle: 'Trưởng Ban Truyền thông',
    departmentCode: 'B01',
    departmentName: 'Ban Truyền thông',
    memberCode: '24310088',
    isCore: true,
    avatarBg: 'bg-blue-500',
  }

  const userTuVan: AuthUser = {
    id: 'user-tv',
    name: 'Phùng Thị Thu Hiền',
    role: 'dept_head',
    roleTitle: 'Trưởng Ban Tư vấn',
    departmentCode: 'B02',
    departmentName: 'Ban Tư vấn',
    memberCode: '24070752',
    isCore: true,
    avatarBg: 'bg-emerald-500',
  }

  const memberTruyenThong: RosterMember = {
    ...INITIAL_MEMBERS.find((m) => m.department_code === 'B01')!,
  }

  const memberTuVan: RosterMember = {
    ...INITIAL_MEMBERS.find((m) => m.department_code === 'B02')!,
  }

  const memberNhanSu: RosterMember = {
    ...INITIAL_MEMBERS.find((m) => m.department_code === 'B03')!,
  }

  const userDoNgocLy: AuthUser = {
    id: 'user-ly',
    name: 'Đỗ Ngọc Ly',
    role: 'member',
    roleTitle: 'Thành viên Ban Nhân sự',
    departmentCode: 'B03',
    departmentName: 'Ban Nhân sự',
    memberCode: '24070685',
    isCore: false,
    avatarBg: 'bg-purple-500',
  }

  it('1. Chỉ Ban Chủ nhiệm mới có quyền cấp / sửa / xóa tài khoản cán bộ', () => {
    expect(canUserManageAccounts(userBCN)).toBe(true)
    expect(canUserManageAccounts(userHR)).toBe(false)
    expect(canUserManageAccounts(userDoNgocLy)).toBe(false)
    expect(canUserManageAccounts(userTruyenThong)).toBe(false)
    expect(canUserManageAccounts(userTuVan)).toBe(false)
    expect(canUserManageAccounts(null)).toBe(false)
  })

  it('2. Ban Tư vấn chỉ có quyền cho điểm thành viên của Ban Tư vấn', () => {
    // Chấm cho thành viên Ban Tư vấn -> Cho phép
    const scoreTuVan = canUserScoreMember(userTuVan, memberTuVan)
    expect(scoreTuVan.allowed).toBe(true)

    // Chấm cho thành viên Ban Truyền thông -> Bị từ chối
    const scoreTruyenThong = canUserScoreMember(userTuVan, memberTruyenThong)
    expect(scoreTruyenThong.allowed).toBe(false)
    expect(scoreTruyenThong.reason).toContain('Ban Tư vấn chỉ có quyền cho điểm')

    // Chấm cho thành viên Ban Nhân sự -> Bị từ chối
    const scoreNhanSu = canUserScoreMember(userTuVan, memberNhanSu)
    expect(scoreNhanSu.allowed).toBe(false)
  })

  it('3. Ban Truyền thông chỉ có quyền cho điểm thành viên của Ban Truyền thông', () => {
    // Chấm cho thành viên Ban Truyền thông -> Cho phép
    const scoreTruyenThong = canUserScoreMember(userTruyenThong, memberTruyenThong)
    expect(scoreTruyenThong.allowed).toBe(true)

    // Chấm cho thành viên Ban Tư vấn -> Bị từ chối
    const scoreTuVan = canUserScoreMember(userTruyenThong, memberTuVan)
    expect(scoreTuVan.allowed).toBe(false)
    expect(scoreTuVan.reason).toContain('Ban Truyền thông chỉ có quyền cho điểm')

    // Chấm cho thành viên Ban Nhân sự -> Bị từ chối
    const scoreNhanSu = canUserScoreMember(userTruyenThong, memberNhanSu)
    expect(scoreNhanSu.allowed).toBe(false)
  })

  it('4. Ban Nhân sự có quyền cho điểm mọi người ở tất cả các ban', () => {
    expect(canUserScoreMember(userHR, memberNhanSu).allowed).toBe(true)
    expect(canUserScoreMember(userHR, memberTruyenThong).allowed).toBe(true)
    expect(canUserScoreMember(userHR, memberTuVan).allowed).toBe(true)
  })

  it('5. Ban Chủ nhiệm có toàn quyền cho điểm tất cả các ban', () => {
    expect(canUserScoreMember(userBCN, memberNhanSu).allowed).toBe(true)
    expect(canUserScoreMember(userBCN, memberTruyenThong).allowed).toBe(true)
    expect(canUserScoreMember(userBCN, memberTuVan).allowed).toBe(true)
  })

  it('6. getAllowedScoringMembers lọc chính xác theo ban cho Ban Truyền thông và Ban Tư vấn', () => {
    const listForTT = getAllowedScoringMembers(userTruyenThong, INITIAL_MEMBERS)
    expect(listForTT.every((m) => m.department_code === 'B01')).toBe(true)
    expect(listForTT.length).toBeGreaterThan(0)

    const listForTV = getAllowedScoringMembers(userTuVan, INITIAL_MEMBERS)
    expect(listForTV.every((m) => m.department_code === 'B02')).toBe(true)
    expect(listForTV.length).toBeGreaterThan(0)

    const listForHR = getAllowedScoringMembers(userHR, INITIAL_MEMBERS)
    expect(listForHR.length).toBe(INITIAL_MEMBERS.length)

    const listForBCN = getAllowedScoringMembers(userBCN, INITIAL_MEMBERS)
    expect(listForBCN.length).toBe(INITIAL_MEMBERS.length)
  })

  it('7. Đồng bộ tài khoản xóa giữa Điện thoại và Laptop: Tombstone ngăn chặn tài khoản hồi sinh trên Lap', () => {
    const accountToDeleteId = 'acc-temp-123'
    const deletedAccountIds = new Set<string>()

    // Giả lập xóa trên Điện thoại
    deletedAccountIds.add(accountToDeleteId)

    // Laptop có dữ liệu cũ trong cache
    const laptopCachedAccounts: IssuedAccount[] = [
      {
        id: accountToDeleteId,
        fullName: 'Nguyễn Văn Test',
        email: 'test@vnu.edu.vn',
        departmentCode: 'B01',
        departmentName: 'Ban Truyền thông',
        departmentSlug: 'truyen-thong',
        role: 'member',
        roleTitle: 'Thành viên',
        passwordPlain: '123456',
        status: 'active',
        createdAt: '18/10/2026',
      },
      {
        id: 'acc-2',
        fullName: 'Nguyễn Ngọc Anh',
        email: '24070622@vnu.edu.vn',
        departmentCode: 'B02',
        departmentName: 'Ban Tư vấn',
        departmentSlug: 'tu-van',
        role: 'dept_head',
        roleTitle: 'Phó ban Tư vấn',
        passwordPlain: '123456',
        status: 'active',
        createdAt: '18/10/2026',
      },
    ]

    // Áp dụng bộ lọc tombstone khi Laptop sync
    const mergedOnLaptop = laptopCachedAccounts.filter((a) => !deletedAccountIds.has(a.id))

    expect(mergedOnLaptop.some((a) => a.id === accountToDeleteId)).toBe(false)
    expect(mergedOnLaptop.length).toBe(1)
    expect(mergedOnLaptop[0].id).toBe('acc-2')
  })
})
