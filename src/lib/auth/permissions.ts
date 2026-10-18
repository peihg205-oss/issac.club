// ============================================================
// iSSAC_Web - Role & Scoring Permissions Matrix
// Quy định phân quyền chuẩn xác theo Quy chế iSSAC
// ============================================================

import type { AuthUser } from './AuthContext'
import type { RosterMember } from '@/lib/clubData'

/**
 * Kiểm tra quyền hạn cấp, chỉnh sửa hoặc xóa tài khoản cán bộ
 * Quy tắc: DUY NHẤT Ban Chủ nhiệm (BCN) mới có quyền cấp / sửa / xóa tài khoản.
 */
export function canUserManageAccounts(user: AuthUser | null): boolean {
  if (!user) return false
  return user.role === 'bcn' || user.departmentCode === 'B04'
}

/**
 * Kiểm tra quyền cho điểm thành viên:
 * 1. Ban Chủ nhiệm (BCN): Có quyền cho điểm TẤT CẢ thành viên mọi ban.
 * 2. Ban Nhân sự (HR): Có quyền cho điểm MỌI NGƯỜI TẤT CẢ CÁC BAN.
 * 3. Ban Truyền thông: CÓ QUYỀN CHO ĐIỂM THÀNH VIÊN CỦA BAN TRUYỀN THÔNG.
 * 4. Ban Tư vấn: CÓ QUYỀN CHO ĐIỂM THÀNH VIÊN CỦA BAN TƯ VẤN.
 */
export function canUserScoreMember(
  user: AuthUser | null,
  targetMember: { department_code?: string; department_slug?: string; full_name?: string } | null
): { allowed: boolean; reason?: string } {
  if (!user) {
    return {
      allowed: false,
      reason: 'Bạn cần đăng nhập tài khoản Cán bộ để thực hiện cho điểm!',
    }
  }

  if (!targetMember) {
    return {
      allowed: false,
      reason: 'Vui lòng chọn thành viên cần cho điểm.',
    }
  }

  // 1. Ban Chủ nhiệm (BCN) có toàn quyền cho điểm tất cả thành viên mọi ban
  if (user.role === 'bcn' || user.departmentCode === 'B04') {
    return { allowed: true }
  }

  // 2. Ban Nhân sự (HR) có quyền cho điểm mọi người tất cả các ban
  if (user.role === 'hr' || user.departmentCode === 'B03') {
    return { allowed: true }
  }

  // 3. Ban Truyền thông (B01) có quyền cho điểm thành viên của Ban Truyền thông
  if (user.departmentCode === 'B01') {
    if (targetMember.department_code === 'B01' || targetMember.department_slug === 'truyen-thong') {
      return { allowed: true }
    }
    return {
      allowed: false,
      reason: 'Cán bộ Ban Truyền thông chỉ có quyền cho điểm thành viên thuộc Ban Truyền thông!',
    }
  }

  // 4. Ban Tư vấn (B02) có quyền cho điểm thành viên của Ban Tư vấn
  if (user.departmentCode === 'B02') {
    if (targetMember.department_code === 'B02' || targetMember.department_slug === 'tu-van') {
      return { allowed: true }
    }
    return {
      allowed: false,
      reason: 'Cán bộ Ban Tư vấn chỉ có quyền cho điểm thành viên thuộc Ban Tư vấn!',
    }
  }

  // 5. Cán bộ thuộc ban khác chỉ chấm được thành viên ban mình
  if (user.departmentCode && targetMember.department_code === user.departmentCode) {
    return { allowed: true }
  }

  return {
    allowed: false,
    reason: 'Bạn không có quyền cho điểm thành viên thuộc ban khác!',
  }
}

/**
 * Trả về danh sách thành viên mà người dùng hiện tại được phép cho điểm
 */
export function getAllowedScoringMembers(
  user: AuthUser | null,
  members: RosterMember[]
): RosterMember[] {
  if (!user) return []

  // BCN và Ban Nhân sự: Cho điểm tất cả mọi người ở tất cả các ban
  if (user.role === 'bcn' || user.departmentCode === 'B04' || user.role === 'hr' || user.departmentCode === 'B03') {
    return members
  }

  // Ban Truyền thông: Chỉ cho điểm thành viên Ban Truyền thông
  if (user.departmentCode === 'B01') {
    return members.filter((m) => m.department_code === 'B01' || m.department_slug === 'truyen-thong')
  }

  // Ban Tư vấn: Chỉ cho điểm thành viên Ban Tư vấn
  if (user.departmentCode === 'B02') {
    return members.filter((m) => m.department_code === 'B02' || m.department_slug === 'tu-van')
  }

  // Các trường hợp khác: Chỉ cho điểm trong ban
  if (user.departmentCode) {
    return members.filter((m) => m.department_code === user.departmentCode)
  }

  return []
}
