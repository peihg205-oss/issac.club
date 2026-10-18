// ============================================================
// iSSAC_Web - Unit Tests: Member Info & Avatar Updating
// ============================================================

import { describe, it, expect } from 'vitest'
import { INITIAL_MEMBERS, type RosterMember } from '@/lib/clubData'
import type { DepartmentCode, DepartmentSlug } from '@/types/database'

describe('Member Profile & Avatar Update Logic', () => {
  const deptSlugMap: Record<DepartmentCode, { name: string; slug: DepartmentSlug }> = {
    B04: { name: 'Ban Chủ nhiệm', slug: 'bcn' },
    B01: { name: 'Ban Truyền thông', slug: 'truyen-thong' },
    B02: { name: 'Ban Tư vấn', slug: 'tu-van' },
    B03: { name: 'Ban Nhân sự', slug: 'nhan-su' },
  }

  it('1. Cập nhật thông tin thành viên (Họ tên, MSSV, SĐT, Email)', () => {
    const original: RosterMember = { ...INITIAL_MEMBERS[1] } // Giang Lê Hiệp - 23070691
    const updates: Partial<RosterMember> = {
      full_name: 'Giang Lê Hiệp (Phó Chủ Nhiệm BCN)',
      phone: '0988776655',
      email: 'hiep.issac@vnuis.edu.vn',
      student_id: '23070691',
    }

    const updated = { ...original, ...updates }
    expect(updated.full_name).toBe('Giang Lê Hiệp (Phó Chủ Nhiệm BCN)')
    expect(updated.phone).toBe('0988776655')
    expect(updated.email).toBe('hiep.issac@vnuis.edu.vn')
  })

  it('2. Cập nhật ảnh đại diện Avatar (Data URL Base64 / URL thực tế)', () => {
    const member: RosterMember = { ...INITIAL_MEMBERS[1] }
    const base64Avatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

    const updatedWithAvatar = {
      ...member,
      avatar_url: base64Avatar,
    }

    expect(updatedWithAvatar.avatar_url).toBe(base64Avatar)
    expect(updatedWithAvatar.avatar_url?.startsWith('data:image/')).toBe(true)
  })

  it('3. Tự động đồng bộ Tên Ban và Slug khi đổi mã Ban trực thuộc', () => {
    const member: RosterMember = { ...INITIAL_MEMBERS[7] } // Ban Truyền thông B01
    expect(member.department_code).toBe('B01')
    expect(member.department_slug).toBe('truyen-thong')

    const newDeptCode: DepartmentCode = 'B03'
    const deptInfo = deptSlugMap[newDeptCode]

    const transferredMember = {
      ...member,
      department_code: newDeptCode,
      department_name: deptInfo.name,
      department_slug: deptInfo.slug,
    }

    expect(transferredMember.department_code).toBe('B03')
    expect(transferredMember.department_name).toBe('Ban Nhân sự')
    expect(transferredMember.department_slug).toBe('nhan-su')
  })

  it('4. Khôi phục avatar về mặc định (chữ cái đầu)', () => {
    const member: RosterMember = { ...INITIAL_MEMBERS[3], avatar_url: '/avatars/duc-thang.jpg' }
    expect(member.avatar_url).toBeDefined()

    // Xóa avatar
    const resetMember = {
      ...member,
      avatar_url: undefined,
    }

    expect(resetMember.avatar_url).toBeUndefined()
    expect(resetMember.full_name.charAt(0)).toBe('T')
  })

  it('5. Chống nhảy lại dữ liệu: Local vừa đổi lớp (DC2024A) có timestamp mới hơn không bị snapshot cũ (DC2024B) ghi đè', () => {
    // Member Hoàng Triều Xuân (24310108)
    const localMember: RosterMember = {
      ...INITIAL_MEMBERS[11],
      class_name: 'DC2024A',
      updated_at: new Date('2026-10-18T20:10:00Z').toISOString(),
    }

    // Cloud snapshot trả về dữ liệu cũ (DC2024B) với timestamp cũ hơn hoặc rỗng
    const staleCloudMember: RosterMember = {
      ...INITIAL_MEMBERS[11],
      class_name: 'DC2024B',
      updated_at: new Date('2026-10-18T19:00:00Z').toISOString(),
    }

    const localTime = localMember.updated_at ? new Date(localMember.updated_at).getTime() : 0
    const cloudTime = staleCloudMember.updated_at ? new Date(staleCloudMember.updated_at).getTime() : 0

    // Thuật toán merge 2 chiều có kiểm tra timestamp
    let mergedMember: RosterMember
    if (localTime > cloudTime) {
      mergedMember = {
        ...staleCloudMember,
        ...localMember,
      }
    } else {
      mergedMember = {
        ...localMember,
        ...staleCloudMember,
      }
    }

    expect(mergedMember.class_name).toBe('DC2024A')
    expect(mergedMember.member_code).toBe('24310108')
  })
})
