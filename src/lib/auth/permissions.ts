// ============================================================
// iSSAC_Web - Role & Scoring Permissions Matrix
// Quy định phân quyền chuẩn xác theo Quy chế iSSAC
// ============================================================

import type { AuthUser } from './AuthContext'
import type { RosterMember } from '@/lib/clubData'

/**
 * Kiểm tra xem người dùng có thuộc Core Team (hoặc BCN) hay không.
 * Thành viên thường của các ban (kể cả Ban Nhân sự, Ban Truyền thông, Ban Tư vấn) KHÔNG thuộc Core Team.
 * Chỉ có:
 * 1. Ban Chủ nhiệm (BCN: role === 'bcn' hoặc admin)
 * 2. Cán bộ quản lý: Trưởng ban, Phó ban (dept_head, hr)
 * 3. Thành viên được phân định nòng cốt chính thức (is_core === true trong danh sách CLB)
 */
export function isUserCoreTeam(
  user: AuthUser | null | undefined,
  membersList?: RosterMember[]
): boolean {
  if (!user) return false

  // 1. Thành viên thường (role: 'member' hoặc chức danh bắt đầu bằng "Thành viên"):
  // TUYỆT ĐỐI không thuộc Core Team, TRỪ KHI được phân định chính thức là is_core === true trong danh sách CLB
  const isRegularMember =
    user.role === 'member' ||
    Boolean(user.roleTitle && user.roleTitle.toLowerCase().startsWith('thành viên'))

  if (isRegularMember) {
    if (membersList && membersList.length > 0) {
      const found = membersList.find(
        (m) =>
          (user.memberCode && m.member_code === user.memberCode) ||
          (user.memberCode && m.student_id === user.memberCode) ||
          (m.full_name && user.name && m.full_name.trim().toLowerCase() === user.name.trim().toLowerCase())
      )
      return Boolean(found?.is_core)
    }
    return false
  }

  // 2. Ban Chủ nhiệm luôn thuộc Core Team
  if (user.role === 'bcn' || user.role === 'admin' || user.departmentCode === 'B04') {
    return true
  }

  // 3. Trưởng ban / Phó ban (dept_head) hoặc Trưởng/Phó ban Nhân sự (hr)
  if (user.role === 'dept_head' || user.role === 'hr') {
    return true
  }

  // 4. Nếu chức vụ chứa Trưởng ban / Phó ban / Chủ nhiệm
  if (
    user.roleTitle &&
    (user.roleTitle.includes('Trưởng') ||
      user.roleTitle.includes('Phó') ||
      user.roleTitle.includes('Chủ nhiệm'))
  ) {
    return true
  }

  // 5. Nếu có danh sách thành viên, kiểm tra cờ is_core chính thức
  if (membersList && membersList.length > 0) {
    const found = membersList.find(
      (m) =>
        (user.memberCode && m.member_code === user.memberCode) ||
        (user.memberCode && m.student_id === user.memberCode) ||
        (m.full_name && user.name && m.full_name.trim().toLowerCase() === user.name.trim().toLowerCase())
    )
    if (found) {
      return Boolean(found.is_core)
    }
  }

  // 6. Nếu user object có cờ isCore VÀ không phải là thành viên thường (member)
  if (user.isCore && user.role !== 'member') {
    return true
  }

  return false
}

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
 * 1. Ban Chủ nhiệm (BCN): Có toàn quyền cho điểm trực tiếp hoặc đề xuất cho TẤT CẢ thành viên mọi ban.
 * 2. Ban Nhân sự (HR): Toàn bộ tài khoản Ban Nhân sự (Trưởng ban, Phó ban và THÀNH VIÊN BAN NHÂN SỰ)
 *    đều có quyền gửi đề xuất cho điểm cho TẤT CẢ thành viên ở MỌI BAN trong CLB (Ban Chủ nhiệm duyệt cuối).
 * 3. Trưởng ban / Phó ban Ban Truyền thông: Có quyền gửi đề xuất cho điểm THÀNH VIÊN CỦA BAN TRUYỀN THÔNG (BCN duyệt cuối).
 * 4. Trưởng ban / Phó ban Ban Tư vấn: Có quyền gửi đề xuất cho điểm THÀNH VIÊN CỦA BAN TƯ VẤN (BCN duyệt cuối).
 * 5. Thành viên thường các ban khác: Không có quyền cho điểm.
 */
export function canUserAddOrProposeScore(user: AuthUser | null | undefined): boolean {
  if (!user) return false

  // 1. Ban Chủ nhiệm (BCN) có toàn quyền cho điểm trực tiếp hoặc đề xuất
  if (
    user.role === 'bcn' ||
    user.role === 'admin' ||
    user.departmentCode === 'B04' ||
    (user.roleTitle && user.roleTitle.toLowerCase().includes('chủ nhiệm'))
  ) {
    return true
  }

  // 2. Ban Nhân sự: Cả cán bộ (Trưởng/Phó) VÀ THÀNH VIÊN BAN NHÂN SỰ
  // Ban Nhân sự chịu trách nhiệm quản lý, giám sát nề nếp thi đua điểm rèn luyện của toàn bộ thành viên CLB
  if (
    user.role === 'hr' ||
    user.departmentCode === 'B03' ||
    (user.roleTitle && user.roleTitle.toLowerCase().includes('nhân sự')) ||
    (user.departmentName && user.departmentName.toLowerCase().includes('nhân sự'))
  ) {
    return true
  }

  // 3. Trưởng ban, Phó ban của các ban khác (Ban Truyền thông B01, Ban Tư vấn B02)
  if (
    user.role === 'dept_head' ||
    (user.roleTitle && (user.roleTitle.includes('Trưởng') || user.roleTitle.includes('Phó')))
  ) {
    return true
  }

  return false
}

export function canUserScoreMember(
  user: AuthUser | null | undefined,
  targetMember: { department_code?: string; department_slug?: string; full_name?: string } | null
): { allowed: boolean; reason?: string } {
  if (!user) {
    return {
      allowed: false,
      reason: 'Bạn cần đăng nhập tài khoản để thực hiện đề xuất cho điểm!',
    }
  }

  if (!targetMember) {
    return {
      allowed: false,
      reason: 'Vui lòng chọn thành viên cần cho điểm.',
    }
  }

  // 1. Ban Chủ nhiệm (BCN) có toàn quyền cho điểm tất cả thành viên mọi ban
  if (
    user.role === 'bcn' ||
    user.role === 'admin' ||
    user.departmentCode === 'B04' ||
    (user.roleTitle && user.roleTitle.toLowerCase().includes('chủ nhiệm'))
  ) {
    return { allowed: true }
  }

  // 2. Ban Nhân sự (HR): Toàn bộ tài khoản Ban Nhân sự (Trưởng ban, Phó ban và THÀNH VIÊN BAN NHÂN SỰ)
  // đều có quyền đề xuất cho điểm tất cả thành viên của mọi ban trong CLB (Ban Chủ nhiệm phê duyệt cuối)
  if (
    user.role === 'hr' ||
    user.departmentCode === 'B03' ||
    (user.roleTitle && user.roleTitle.toLowerCase().includes('nhân sự')) ||
    (user.departmentName && user.departmentName.toLowerCase().includes('nhân sự'))
  ) {
    return { allowed: true }
  }

  // 3. Trưởng ban / Phó ban Ban Truyền thông (B01): Có quyền đề xuất cho điểm thành viên của Ban Truyền thông
  const isCommLeader =
    (user.departmentCode === 'B01' || user.departmentName?.toLowerCase().includes('truyền thông')) &&
    (user.role === 'dept_head' ||
      (user.roleTitle && (user.roleTitle.includes('Trưởng') || user.roleTitle.includes('Phó'))))
  if (isCommLeader) {
    if (targetMember.department_code === 'B01' || targetMember.department_slug === 'truyen-thong') {
      return { allowed: true }
    }
    return {
      allowed: false,
      reason: 'Trưởng/Phó ban Ban Truyền thông chỉ có quyền đề xuất cho điểm thành viên thuộc Ban Truyền thông!',
    }
  }

  // 4. Trưởng ban / Phó ban Ban Tư vấn (B02): Có quyền đề xuất cho điểm thành viên của Ban Tư vấn
  const isAdvLeader =
    (user.departmentCode === 'B02' || user.departmentName?.toLowerCase().includes('tư vấn')) &&
    (user.role === 'dept_head' ||
      (user.roleTitle && (user.roleTitle.includes('Trưởng') || user.roleTitle.includes('Phó'))))
  if (isAdvLeader) {
    if (targetMember.department_code === 'B02' || targetMember.department_slug === 'tu-van') {
      return { allowed: true }
    }
    return {
      allowed: false,
      reason: 'Trưởng/Phó ban Ban Tư vấn chỉ có quyền đề xuất cho điểm thành viên thuộc Ban Tư vấn!',
    }
  }

  // 5. Cán bộ quản lý ban khác
  const isOtherLeader =
    user.role === 'dept_head' ||
    (user.roleTitle && (user.roleTitle.includes('Trưởng') || user.roleTitle.includes('Phó')))
  if (isOtherLeader && user.departmentCode && targetMember.department_code === user.departmentCode) {
    return { allowed: true }
  }

  return {
    allowed: false,
    reason: 'Tài khoản của bạn không có quyền đề xuất cho điểm thành viên này!',
  }
}

/**
 * Trả về danh sách thành viên mà người dùng hiện tại được phép cho điểm
 */
export function getAllowedScoringMembers(
  user: AuthUser | null | undefined,
  members: RosterMember[]
): RosterMember[] {
  if (!user) return []

  // 1. BCN và Ban Nhân sự (kể cả Thành viên thường Ban Nhân sự): Cho điểm tất cả mọi người ở tất cả các ban
  if (
    user.role === 'bcn' ||
    user.role === 'admin' ||
    user.departmentCode === 'B04' ||
    (user.roleTitle && user.roleTitle.toLowerCase().includes('chủ nhiệm')) ||
    user.role === 'hr' ||
    user.departmentCode === 'B03' ||
    (user.roleTitle && user.roleTitle.toLowerCase().includes('nhân sự')) ||
    (user.departmentName && user.departmentName.toLowerCase().includes('nhân sự'))
  ) {
    return members
  }

  // 2. Trưởng ban / Phó ban Ban Truyền thông: Cho điểm thành viên Ban Truyền thông
  const isCommLeader =
    (user.departmentCode === 'B01' || user.departmentName?.toLowerCase().includes('truyền thông')) &&
    (user.role === 'dept_head' ||
      (user.roleTitle && (user.roleTitle.includes('Trưởng') || user.roleTitle.includes('Phó'))))
  if (isCommLeader) {
    return members.filter((m) => m.department_code === 'B01' || m.department_slug === 'truyen-thong')
  }

  // 3. Trưởng ban / Phó ban Ban Tư vấn: Cho điểm thành viên Ban Tư vấn
  const isAdvLeader =
    (user.departmentCode === 'B02' || user.departmentName?.toLowerCase().includes('tư vấn')) &&
    (user.role === 'dept_head' ||
      (user.roleTitle && (user.roleTitle.includes('Trưởng') || user.roleTitle.includes('Phó'))))
  if (isAdvLeader) {
    return members.filter((m) => m.department_code === 'B02' || m.department_slug === 'tu-van')
  }

  // 4. Cán bộ quản lý ban khác
  const isOtherLeader =
    user.role === 'dept_head' ||
    (user.roleTitle && (user.roleTitle.includes('Trưởng') || user.roleTitle.includes('Phó')))
  if (isOtherLeader && user.departmentCode) {
    return members.filter((m) => m.department_code === user.departmentCode)
  }

  return []
}
