'use client'

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import type { UserRole, DepartmentCode } from '@/types/database'
import {
  canUserManageAccounts,
  canUserScoreMember,
  getAllowedScoringMembers,
  isUserCoreTeam,
  canUserAddOrProposeScore,
} from './permissions'
import type { RosterMember } from '@/lib/clubData'

export interface AuthUser {
  id: string
  name: string
  role: UserRole
  roleTitle: string
  departmentCode?: DepartmentCode
  departmentName?: string
  memberCode?: string
  isCore: boolean
  avatarBg: string
  avatarUrl?: string
}

export const PRESET_USERS: AuthUser[] = [
  {
    id: 'user-hiep',
    name: 'Giang Lê Hiệp',
    role: 'bcn',
    roleTitle: 'Phó chủ nhiệm CLB (BCN)',
    departmentCode: 'B04',
    departmentName: 'Ban Chủ nhiệm',
    memberCode: '23070691',
    isCore: true,
    avatarBg: 'bg-blue-600',
    avatarUrl: '/giang-le-hiep-avatar.png',
  },
  {
    id: 'user-bcn',
    name: 'Nguyễn Thị Hồng Hân',
    role: 'bcn',
    roleTitle: 'Chủ nhiệm CLB (BCN)',
    departmentCode: 'B04',
    departmentName: 'Ban Chủ nhiệm',
    memberCode: 'STAFF-001',
    isCore: true,
    avatarBg: 'bg-amber-500',
  },
  {
    id: 'user-hr',
    name: 'Vũ Thị Minh Ngọc',
    role: 'hr',
    roleTitle: 'Trưởng Ban Nhân sự (HR)',
    departmentCode: 'B03',
    departmentName: 'Ban Nhân sự',
    memberCode: '23070764',
    isCore: true,
    avatarBg: 'bg-purple-500',
  },
  {
    id: 'user-dept-head',
    name: 'Lê Trần Thuỷ Nguyên',
    role: 'dept_head',
    roleTitle: 'Trưởng Ban Tư vấn',
    departmentCode: 'B02',
    departmentName: 'Ban Tư vấn',
    memberCode: '24310069',
    isCore: true,
    avatarBg: 'bg-emerald-500',
    avatarUrl: '/thuy-nguyen-avatar.png',
  },
  {
    id: 'user-member',
    name: 'Lục Xuân Huy',
    role: 'member',
    roleTitle: 'Thành viên Ban Truyền thông',
    departmentCode: 'B01',
    departmentName: 'Ban Truyền thông',
    memberCode: '25071203',
    isCore: false,
    avatarBg: 'bg-emerald-500',
  },
]

import { INITIAL_MEMBERS } from '@/lib/clubData'
import type { DepartmentSlug } from '@/types/database'

/**
 * Hàm phân định quyền và vai trò chuẩn hóa cho từng thành viên CLB iSSAC
 * Đảm bảo đồng bộ tuyệt đối trên mọi thiết bị (Mobile, Tablet, Desktop)
 */
export function getRoleForMember(m: RosterMember): { role: UserRole; isCore: boolean; roleTitle: string } {
  // 1. Ban Chủ nhiệm
  if (m.department_slug === 'bcn' || m.position.includes('Chủ nhiệm')) {
    return {
      role: 'bcn',
      isCore: true,
      roleTitle: `${m.position} - ${m.department_name}`,
    }
  }

  // 2. Ban Nhân sự: Cán bộ (Trưởng ban & Phó ban) -> 'hr'
  if (m.department_slug === 'nhan-su') {
    if (m.position.includes('Trưởng') || m.position.includes('Phó')) {
      return {
        role: 'hr',
        isCore: true,
        roleTitle: `${m.position} - ${m.department_name} (HR)`,
      }
    }
    // Thành viên Ban Nhân sự: role 'member' nhưng thuộc Ban Nhân sự (có quyền đề xuất điểm theo quy chế)
    return {
      role: 'member',
      isCore: Boolean(m.is_core),
      roleTitle: `${m.position} - ${m.department_name}`,
    }
  }

  // 3. Trưởng ban, Phó ban, Cố vấn của các ban chuyên môn (Truyền thông B01, Tư vấn B02) -> 'dept_head'
  if (m.position.includes('Trưởng') || m.position.includes('Phó') || m.position.includes('Cố vấn')) {
    return {
      role: 'dept_head',
      isCore: true,
      roleTitle: `${m.position} - ${m.department_name}`,
    }
  }

  // 4. Thành viên thường
  return {
    role: 'member',
    isCore: Boolean(m.is_core),
    roleTitle: `${m.position} - ${m.department_name}`,
  }
}

export type { IssuedAccount } from './accountData'
export { INITIAL_ISSUED_ACCOUNTS } from './accountData'
import { INITIAL_ISSUED_ACCOUNTS, type IssuedAccount } from './accountData'

export interface AuthContextType {
  currentUser: AuthUser | null
  isAuthChecked: boolean
  isAuthenticated: boolean
  switchUser: (userId: string) => void
  login: (account: string, password?: string) => { success: boolean; user?: AuthUser; message?: string }
  logout: () => void
  issuedAccounts: IssuedAccount[]
  createIssuedAccount: (accountData: Omit<IssuedAccount, 'id' | 'createdAt'>) => { success: boolean; message: string }
  updateIssuedAccount: (id: string, updates: Partial<IssuedAccount>) => { success: boolean; message: string }
  deleteIssuedAccount: (id: string) => { success: boolean; message: string }
  isBCN: boolean
  isHR: boolean
  isDeptHead: boolean
  isMember: boolean
  isCoreTeam: boolean
  canManageAccounts: boolean
  canAddOrProposeScore: boolean
  canScoreMember: (targetMember: { department_code?: string; department_slug?: string; full_name?: string } | null) => { allowed: boolean; reason?: string }
  getAllowedMembers: (members: RosterMember[]) => RosterMember[]
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Danh sách các định danh tài khoản đã bị Ban Chủ nhiệm xóa trên Cloud / Hệ thống
export const DEFAULT_DELETED_ACCOUNT_IDS: string[] = [
  'acc-thang',
  '24310088',
  'tdthang@vnuis.edu.vn',
  'user-dept-head',
  'Trần Đức Thắng',
]

/**
 * Thu thập tất cả các định danh liên quan (ID, MSSV, Email, Họ tên, Mã thành viên)
 * của một người dùng dựa trên bất kỳ định danh nào truyền vào.
 */
export function resolveAllAssociatedIdentities(
  rawId: string,
  extraAccounts?: IssuedAccount[]
): string[] {
  if (!rawId) return []
  const clean = rawId.trim().toLowerCase()
  const results = new Set<string>()
  results.add(rawId.trim())
  results.add(clean)

  // Đặc tả nhận diện cán bộ Trần Đức Thắng (khóa triệt để mọi alias)
  if (
    clean === 'acc-thang' ||
    clean === '24310088' ||
    clean === 'tdthang@vnuis.edu.vn' ||
    clean === 'trần đức thắng' ||
    clean === 'tran duc thang' ||
    clean === 'user-dept-head'
  ) {
    results.add('acc-thang')
    results.add('24310088')
    results.add('tdthang@vnuis.edu.vn')
    results.add('trần đức thắng')
    results.add('user-dept-head')
  }

  // 1. Quét trong INITIAL_ISSUED_ACCOUNTS và extraAccounts
  const allAccs = [...INITIAL_ISSUED_ACCOUNTS, ...(extraAccounts || [])]
  for (const acc of allAccs) {
    const match =
      acc.id.toLowerCase() === clean ||
      (acc.studentId && acc.studentId.toLowerCase() === clean) ||
      acc.email.toLowerCase() === clean ||
      acc.fullName.toLowerCase() === clean
    if (match) {
      results.add(acc.id)
      if (acc.studentId) results.add(acc.studentId)
      if (acc.email) results.add(acc.email.toLowerCase())
      if (acc.fullName) results.add(acc.fullName.toLowerCase())
    }
  }

  // 2. Quét trong INITIAL_MEMBERS
  for (const m of INITIAL_MEMBERS) {
    const match =
      m.member_code.toLowerCase() === clean ||
      (m.student_id && m.student_id.toLowerCase() === clean) ||
      m.email.toLowerCase() === clean ||
      m.full_name.toLowerCase() === clean
    if (match) {
      results.add(m.member_code)
      if (m.student_id) results.add(m.student_id)
      if (m.email) results.add(m.email.toLowerCase())
      if (m.full_name) results.add(m.full_name.toLowerCase())
    }
  }

  // 3. Quét trong PRESET_USERS
  for (const p of PRESET_USERS) {
    const match =
      p.id.toLowerCase() === clean ||
      (p.memberCode && p.memberCode.toLowerCase() === clean) ||
      p.name.toLowerCase() === clean
    if (match) {
      results.add(p.id)
      if (p.memberCode) results.add(p.memberCode)
      if (p.name) results.add(p.name.toLowerCase())
    }
  }

  return Array.from(results)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isAuthChecked, setIsAuthChecked] = useState(false)
  const [issuedAccounts, setIssuedAccounts] = useState<IssuedAccount[]>(() => {
    return INITIAL_ISSUED_ACCOUNTS.filter((a) => !DEFAULT_DELETED_ACCOUNT_IDS.includes(a.id))
  })
  const deletedAccountIdsRef = useRef<Set<string>>(new Set(DEFAULT_DELETED_ACCOUNT_IDS))

  // Kiểm tra một chuỗi bất kỳ có nằm trong danh sách đã bị xóa không
  const isIdentityDeleted = useCallback((val?: string | null): boolean => {
    if (!val) return false
    const clean = val.trim().toLowerCase()
    const delSet = deletedAccountIdsRef.current
    for (const d of delSet) {
      if (!d) continue
      const cleanD = d.trim().toLowerCase()
      if (clean === cleanD) return true
    }
    return false
  }, [])

  // Kiểm tra một thực thể (User / Member / Account / Preset) có bị xóa không
  const isEntityDeleted = useCallback(
    (entity: any): boolean => {
      if (!entity) return false
      if (typeof entity === 'string') return isIdentityDeleted(entity)
      return (
        isIdentityDeleted(entity.id) ||
        isIdentityDeleted(entity.memberCode) ||
        isIdentityDeleted(entity.studentId) ||
        isIdentityDeleted(entity.member_code) ||
        isIdentityDeleted(entity.student_id) ||
        isIdentityDeleted(entity.email) ||
        isIdentityDeleted(entity.name) ||
        isIdentityDeleted(entity.fullName) ||
        isIdentityDeleted(entity.full_name)
      )
    },
    [isIdentityDeleted]
  )

  // Helper gửi danh sách tài khoản lên Supabase Cloud API để Máy tính và Điện thoại cùng đồng bộ
  const syncAccountsToCloud = (payload: {
    accounts?: IssuedAccount[]
    deletedAccountIds?: string[]
    deletedMemberCodes?: string[]
    action?: string
    accountId?: string
    studentId?: string
    email?: string
    fullName?: string
  }) => {
    if (typeof window !== 'undefined') {
      fetch('/api/db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch((e) => console.error('Cloud account sync notice:', e))
    }
  }

  // Tải và hợp nhất tài khoản đám mây (Chống hồi sinh tài khoản đã xóa khi chuyển giữa ĐT và Máy tính)
  const fetchCloudAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/db/sync', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      })
      if (!res.ok) {
        return
      }
      const data = await res.json()

        // 1. Đồng bộ tombstones các tài khoản & thành viên đã xóa từ cloud
        const cloudDeleted: string[] = []
        if (data.deletedAccountIds && Array.isArray(data.deletedAccountIds)) {
          cloudDeleted.push(...data.deletedAccountIds)
        }
        if (data.deletedMemberCodes && Array.isArray(data.deletedMemberCodes)) {
          cloudDeleted.push(...data.deletedMemberCodes)
        }

        if (cloudDeleted.length > 0) {
          for (const rawId of cloudDeleted) {
            if (!rawId) continue
            deletedAccountIdsRef.current.add(rawId)
            deletedAccountIdsRef.current.add(rawId.toLowerCase())
            const aliases = resolveAllAssociatedIdentities(rawId, issuedAccounts)
            for (const a of aliases) {
              deletedAccountIdsRef.current.add(a)
              deletedAccountIdsRef.current.add(a.toLowerCase())
            }
          }
          try {
            const arr = Array.from(deletedAccountIdsRef.current)
            localStorage.setItem('issac_deleted_account_ids', JSON.stringify(arr))
            localStorage.setItem('issac_deleted_member_codes', JSON.stringify(arr))
          } catch (e) {}
        }

        // 2. Hợp nhất danh sách tài khoản
        if (data.accounts && Array.isArray(data.accounts)) {
          setIssuedAccounts((prev) => {
            const localMap = new Map(prev.map((a) => [a.id, a]))
            for (const cloudAcc of data.accounts) {
              if (cloudAcc?.id && !isEntityDeleted(cloudAcc)) {
                localMap.set(cloudAcc.id, {
                  ...(localMap.get(cloudAcc.id) || {}),
                  ...cloudAcc,
                })
              }
            }
            const cleanList = Array.from(localMap.values()).filter((a) => !isEntityDeleted(a))
            try {
              localStorage.setItem('issac_issued_accounts', JSON.stringify(cleanList))
            } catch (e) {}
            return cleanList
          })
        } else {
          setIssuedAccounts((prev) => {
            const clean = prev.filter((a) => !isEntityDeleted(a))
            try {
              localStorage.setItem('issac_issued_accounts', JSON.stringify(clean))
            } catch (e) {}
            return clean
          })
        }

        // 3. FORCE LOGOUT REAL-TIME TRÊN TẤT CẢ CÁC THIẾT BỊ:
        // Nếu người dùng hiện đang đăng nhập thuộc bất kỳ tài khoản/thành viên nào bị xóa -> ĐĂNG XUẤT NGAY
        setCurrentUser((current) => {
          if (current && isEntityDeleted(current)) {
            try {
              localStorage.removeItem('issac_active_user')
            } catch (e) {}
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('issac_account_deleted', { detail: { user: current } })
              )
              if (window.location.pathname !== '/login') {
                window.location.href = '/login?reason=deleted'
              }
            }
            return null
          }
          return current
        })
    } catch (err) {
      // Offline fallback
    }
  }, [isEntityDeleted, issuedAccounts])

  // Load saved accounts & active user from localStorage
  useEffect(() => {
    // Nạp tombstones từ cả 2 key lưu trữ
    try {
      const savedDelAccs = localStorage.getItem('issac_deleted_account_ids')
      if (savedDelAccs) {
        const parsed = JSON.parse(savedDelAccs)
        if (Array.isArray(parsed)) {
          parsed.forEach((id: string) => {
            deletedAccountIdsRef.current.add(id)
            deletedAccountIdsRef.current.add(id.toLowerCase())
          })
        }
      }
      const savedDelMembers = localStorage.getItem('issac_deleted_member_codes')
      if (savedDelMembers) {
        const parsed = JSON.parse(savedDelMembers)
        if (Array.isArray(parsed)) {
          parsed.forEach((id: string) => {
            deletedAccountIdsRef.current.add(id)
            deletedAccountIdsRef.current.add(id.toLowerCase())
          })
        }
      }
    } catch (e) {}

    // Tự động mở rộng danh sách các bí danh liên quan cho toàn bộ ID đã xóa
    const initialDelList = Array.from(deletedAccountIdsRef.current)
    for (const d of initialDelList) {
      const aliases = resolveAllAssociatedIdentities(d)
      aliases.forEach((a) => {
        deletedAccountIdsRef.current.add(a)
        deletedAccountIdsRef.current.add(a.toLowerCase())
      })
    }

    try {
      const savedAccs = localStorage.getItem('issac_issued_accounts')
      if (savedAccs) {
        const parsed: IssuedAccount[] = JSON.parse(savedAccs)
        const clean = parsed.filter((a) => !isEntityDeleted(a))
        setIssuedAccounts(clean)
      } else {
        setIssuedAccounts(INITIAL_ISSUED_ACCOUNTS.filter((a) => !isEntityDeleted(a)))
      }
    } catch (err) {
      console.error(err)
    }

    try {
      const urlParams =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      const paramUser = urlParams?.get('user')
      const saved = paramUser || localStorage.getItem('issac_active_user')
      if (saved && !isIdentityDeleted(saved)) {
        // 1. Check preset users
        const foundPreset = PRESET_USERS.find((u) => u.id === saved && !isEntityDeleted(u))
        if (foundPreset) {
          setCurrentUser(foundPreset)
          setIsAuthChecked(true)
          fetchCloudAccounts()
          return
        }

        // 2. Check full roster (48 official members)
        const foundMember = INITIAL_MEMBERS.find(
          (m) => (m.member_code === saved || m.student_id === saved) && !isEntityDeleted(m)
        )
        if (foundMember) {
          const roleInfo = getRoleForMember(foundMember)
          setCurrentUser({
            id: foundMember.member_code,
            name: foundMember.full_name,
            role: roleInfo.role,
            roleTitle: roleInfo.roleTitle,
            departmentCode: foundMember.department_code,
            departmentName: foundMember.department_name,
            memberCode: foundMember.member_code,
            isCore: roleInfo.isCore,
            avatarBg: 'bg-blue-600',
            avatarUrl: foundMember.avatar_url,
          })
          setIsAuthChecked(true)
          fetchCloudAccounts()
          return
        }

        // 3. Check issued accounts
        const savedAccsStr = localStorage.getItem('issac_issued_accounts')
        const accList: IssuedAccount[] = savedAccsStr
          ? JSON.parse(savedAccsStr)
          : INITIAL_ISSUED_ACCOUNTS
        const foundIssued = accList.find(
          (a: any) =>
            (a.id === saved || a.studentId === saved || a.email === saved) &&
            !isEntityDeleted(a)
        )
        if (foundIssued) {
          setCurrentUser({
            id: foundIssued.id,
            name: foundIssued.fullName,
            role: foundIssued.role,
            roleTitle: foundIssued.roleTitle,
            departmentCode: foundIssued.departmentCode,
            departmentName: foundIssued.departmentName,
            memberCode: foundIssued.studentId || foundIssued.id,
            isCore:
              foundIssued.role === 'bcn' ||
              foundIssued.role === 'hr' ||
              foundIssued.role === 'dept_head',
            avatarBg: 'bg-blue-600',
          })
          setIsAuthChecked(true)
          fetchCloudAccounts()
          return
        }
      } else if (saved && isIdentityDeleted(saved)) {
        // Nếu user lưu trong local storage nằm trong blacklist -> Xóa ngay
        try {
          localStorage.removeItem('issac_active_user')
        } catch (e) {}
      }
    } catch (e) {
      console.error(e)
    }

    setCurrentUser(null)
    setIsAuthChecked(true)
    fetchCloudAccounts()
  }, [fetchCloudAccounts, isEntityDeleted, isIdentityDeleted])

  // Lắng nghe visibilitychange, storage và chu kỳ polling 3 giây để cập nhật tài khoản trên mọi thiết bị
  useEffect(() => {
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchCloudAccounts()
      }
    }
    const handleFocus = () => {
      fetchCloudAccounts()
    }
    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === 'issac_issued_accounts' ||
        e.key === 'issac_active_user' ||
        e.key === 'issac_deleted_account_ids' ||
        e.key === 'issac_deleted_member_codes'
      ) {
        try {
          if (e.key === 'issac_deleted_account_ids' || e.key === 'issac_deleted_member_codes') {
            if (e.newValue) {
              const parsed = JSON.parse(e.newValue)
              if (Array.isArray(parsed)) {
                parsed.forEach((id: string) => {
                  deletedAccountIdsRef.current.add(id)
                  deletedAccountIdsRef.current.add(id.toLowerCase())
                })
              }
            }
          }
        } catch {}
        fetchCloudAccounts()
      }
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus)
      window.addEventListener('storage', handleStorage)
    }
    // Poll mỗi 15 giây để đồng bộ tài khoản giữa các thiết bị nhẹ nhàng, không gây nghẽn mạng
    let backoffUntil = 0
    const pollAccounts = async () => {
      if (typeof document !== 'undefined' && document.hidden) return
      if (Date.now() < backoffUntil) return
      try {
        await fetchCloudAccounts()
      } catch {
        backoffUntil = Date.now() + 30000
      }
    }
    const timer = setInterval(pollAccounts, 15000)

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility)
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus)
        window.removeEventListener('storage', handleStorage)
      }
      clearInterval(timer)
    }
  }, [fetchCloudAccounts])

  const switchUser = (userId: string) => {
    if (isIdentityDeleted(userId)) return

    const foundPreset = PRESET_USERS.find((u) => u.id === userId && !isEntityDeleted(u))
    if (foundPreset) {
      setCurrentUser(foundPreset)
      localStorage.setItem('issac_active_user', foundPreset.id)
      return
    }

    const foundMember = INITIAL_MEMBERS.find(
      (m) => (m.member_code === userId || m.student_id === userId) && !isEntityDeleted(m)
    )
    if (foundMember) {
      const roleInfo = getRoleForMember(foundMember)
      const mappedUser: AuthUser = {
        id: foundMember.member_code,
        name: foundMember.full_name,
        role: roleInfo.role,
        roleTitle: roleInfo.roleTitle,
        departmentCode: foundMember.department_code,
        departmentName: foundMember.department_name,
        memberCode: foundMember.member_code,
        isCore: roleInfo.isCore,
        avatarBg: 'bg-blue-600',
        avatarUrl: foundMember.avatar_url,
      }
      setCurrentUser(mappedUser)
      localStorage.setItem('issac_active_user', mappedUser.id)
    }
  }

  const createIssuedAccount = (data: Omit<IssuedAccount, 'id' | 'createdAt'>) => {
    // Chỉ Ban Chủ nhiệm mới có thể cấp tài khoản
    if (!canUserManageAccounts(currentUser)) {
      return { success: false, message: 'Chỉ Ban Chủ nhiệm mới có quyền cấp tài khoản cán bộ!' }
    }

    const cleanEmail = data.email.trim().toLowerCase()
    if (issuedAccounts.some((a) => a.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'Email này đã tồn tại trong danh sách tài khoản được cấp!' }
    }

    const newAcc: IssuedAccount = {
      ...data,
      id: `acc-${Date.now()}`,
      createdAt: new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
    }

    const updated = [newAcc, ...issuedAccounts]
    setIssuedAccounts(updated)
    try {
      localStorage.setItem('issac_issued_accounts', JSON.stringify(updated))
    } catch (e) {
      console.error(e)
    }

    syncAccountsToCloud({ accounts: updated })

    return { success: true, message: `Cấp tài khoản thành công cho cán bộ "${data.fullName}"!` }
  }

  const updateIssuedAccount = (id: string, updates: Partial<IssuedAccount>) => {
    // Chỉ Ban Chủ nhiệm mới có thể sửa tài khoản
    if (!canUserManageAccounts(currentUser)) {
      return { success: false, message: 'Chỉ Ban Chủ nhiệm mới có quyền chỉnh sửa tài khoản cán bộ!' }
    }

    const updated = issuedAccounts.map((a) => (a.id === id ? { ...a, ...updates } : a))
    setIssuedAccounts(updated)
    try {
      localStorage.setItem('issac_issued_accounts', JSON.stringify(updated))
    } catch (e) {
      console.error(e)
    }

    syncAccountsToCloud({ accounts: updated })

    return { success: true, message: 'Cập nhật tài khoản thành công!' }
  }

  const deleteIssuedAccount = (id: string) => {
    // Chỉ Ban Chủ nhiệm mới có thể xóa tài khoản
    if (!canUserManageAccounts(currentUser)) {
      return { success: false, message: 'Chỉ Ban Chủ nhiệm mới có quyền xóa tài khoản cán bộ!' }
    }

    const target =
      issuedAccounts.find((a) => a.id === id) || INITIAL_ISSUED_ACCOUNTS.find((a) => a.id === id)
    if (target?.isFixed) {
      return { success: false, message: 'Không thể xóa tài khoản cố định của Ban Chủ nhiệm!' }
    }

    // 1. Mở rộng tất cả các định danh liên quan (ID, MSSV, Email, Họ tên, Mã thành viên)
    const aliases = resolveAllAssociatedIdentities(id, issuedAccounts)
    aliases.forEach((a) => {
      deletedAccountIdsRef.current.add(a)
      deletedAccountIdsRef.current.add(a.toLowerCase())
    })
    deletedAccountIdsRef.current.add(id)
    deletedAccountIdsRef.current.add(id.toLowerCase())

    const deletedArr = Array.from(deletedAccountIdsRef.current)
    try {
      localStorage.setItem('issac_deleted_account_ids', JSON.stringify(deletedArr))
    } catch (e) {}

    // 2. Lọc bỏ tài khoản khỏi danh sách
    const updated = issuedAccounts.filter((a) => !isEntityDeleted(a))
    setIssuedAccounts(updated)
    try {
      localStorage.setItem('issac_issued_accounts', JSON.stringify(updated))
    } catch (e) {
      console.error(e)
    }

    // 3. Nếu người dùng hiện tại bị xóa -> Đăng xuất ngay lập tức
    if (currentUser && isEntityDeleted(currentUser)) {
      setCurrentUser(null)
      try {
        localStorage.removeItem('issac_active_user')
      } catch (e) {}
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login?reason=deleted'
      }
    }

    // 4. Đồng bộ lập tức lên Cloud Supabase để Điện thoại và Laptop nhận ngay xóa bỏ trong thời gian thực
    syncAccountsToCloud({
      accounts: updated,
      deletedAccountIds: deletedArr,
      action: 'delete_account',
      accountId: id,
      studentId: target?.studentId,
      email: target?.email,
      fullName: target?.fullName,
    })

    return { success: true, message: 'Đã xóa tài khoản thành công!' }
  }

  const login = (accountInput: string, passwordInput?: string) => {
    const clean = accountInput.trim().toLowerCase()
    if (!clean) {
      return { success: false, message: 'Vui lòng nhập Email sinh viên hoặc Mã số sinh viên (MSSV).' }
    }

    if (!passwordInput || !passwordInput.trim()) {
      return { success: false, message: 'Vui lòng nhập mật khẩu tài khoản.' }
    }
    const cleanPass = passwordInput.trim()

    // BƯỚC 1: KIỂM TRA BLACKLIST / TOMBSTONE TRƯỚC TIÊN
    // Nếu tài khoản, MSSV, Email hoặc Họ tên đã bị Ban Chủ nhiệm xóa -> Chặn ngay lập tức
    if (isIdentityDeleted(clean)) {
      return {
        success: false,
        message: 'Tài khoản hoặc thông tin thành viên này đã bị xóa khỏi hệ thống bởi Ban Chủ nhiệm.',
      }
    }

    // 1. Tìm kiếm trong danh sách thành viên chính thức CLB (48 thành viên)
    const member = INITIAL_MEMBERS.find(
      (m) =>
        m.member_code.toLowerCase() === clean ||
        (m.student_id && m.student_id.toLowerCase() === clean) ||
        m.email.toLowerCase() === clean ||
        m.full_name.toLowerCase() === clean ||
        m.full_name.toLowerCase().includes(clean)
    )

    // 2. Tìm kiếm trong danh sách tài khoản được cấp (issuedAccounts)
    const issued = issuedAccounts.find(
      (a) =>
        !isEntityDeleted(a) &&
        (a.email.toLowerCase() === clean ||
          (a.studentId && a.studentId.toLowerCase() === clean) ||
          (member &&
            a.studentId &&
            (a.studentId.toLowerCase() === member.student_id?.toLowerCase() ||
              a.studentId.toLowerCase() === member.member_code.toLowerCase())) ||
          (member && a.email && a.email.toLowerCase() === member.email.toLowerCase()) ||
          a.fullName.toLowerCase() === clean ||
          a.fullName.toLowerCase().includes(clean))
    )

    // 3. Tìm kiếm trong tài khoản cài sẵn (preset)
    const preset = PRESET_USERS.find(
      (u) =>
        !isEntityDeleted(u) &&
        (u.id.toLowerCase() === clean ||
          u.memberCode?.toLowerCase() === clean ||
          (member && u.memberCode?.toLowerCase() === member.member_code.toLowerCase()) ||
          u.name.toLowerCase() === clean ||
          u.name.toLowerCase().includes(clean))
    )

    // BƯỚC 2: KIỂM TRA THỰC THỂ TÌM THẤY CÓ BỊ XÓA KHÔNG
    if (
      (issued && isEntityDeleted(issued)) ||
      (member && isEntityDeleted(member)) ||
      (preset && isEntityDeleted(preset))
    ) {
      return {
        success: false,
        message: 'Tài khoản hoặc thông tin thành viên này đã bị xóa khỏi hệ thống bởi Ban Chủ nhiệm.',
      }
    }

    if (issued && issued.status === 'suspended') {
      return {
        success: false,
        message: 'Tài khoản của bạn hiện đang bị tạm khóa bởi Ban Chủ nhiệm. Vui lòng liên hệ BCN.',
      }
    }

    if (!issued && !preset && !member) {
      return {
        success: false,
        message: 'Không tìm thấy tài khoản trong hệ thống. Vui lòng kiểm tra lại Email sinh viên hoặc MSSV của bạn.',
      }
    }

    // Kiểm tra mật khẩu hợp lệ trên mọi thiết bị
    const validPasswords = new Set<string>()
    validPasswords.add('issac2026')
    validPasswords.add('issac2025')
    validPasswords.add('123456')
    validPasswords.add('ISSAC2026@clb')

    if (issued?.passwordPlain) {
      validPasswords.add(issued.passwordPlain)
    }
    if (issued?.studentId) {
      validPasswords.add(issued.studentId)
      validPasswords.add(`ISSAC2026@${issued.studentId}`)
    }
    if (member?.student_id) {
      validPasswords.add(member.student_id)
      validPasswords.add(`ISSAC2026@${member.student_id}`)
    }
    if (member?.member_code) {
      validPasswords.add(member.member_code)
      validPasswords.add(`ISSAC2026@${member.member_code}`)
    }
    if (member?.phone) {
      validPasswords.add(member.phone)
    }

    const isCorrectPassword = validPasswords.has(cleanPass)

    if (!isCorrectPassword) {
      return {
        success: false,
        message: 'Mật khẩu không chính xác. Mật khẩu mặc định là issac2026 hoặc mật khẩu được Ban Chủ nhiệm cấp.',
      }
    }

    // Chuẩn hóa phân quyền tuyệt đối chính xác
    let finalRole: UserRole = 'member'
    let finalRoleTitle = ''
    let isCore = false

    if (member) {
      const derived = getRoleForMember(member)
      finalRole = derived.role
      isCore = derived.isCore
      finalRoleTitle = derived.roleTitle
    } else if (issued) {
      finalRole = issued.role
      finalRoleTitle = issued.roleTitle
      isCore = issued.role === 'bcn' || issued.role === 'hr' || issued.role === 'dept_head'
      if (
        issued.departmentSlug === 'nhan-su' &&
        (issued.roleTitle.includes('Trưởng') || issued.roleTitle.includes('Phó'))
      ) {
        finalRole = 'hr'
        isCore = true
      }
    } else if (preset) {
      finalRole = preset.role
      finalRoleTitle = preset.roleTitle
      isCore = preset.isCore
    }

    const authUser: AuthUser = {
      id: issued?.id || member?.member_code || preset?.id || `user-${Date.now()}`,
      name: member?.full_name || issued?.fullName || preset?.name || 'Thành viên iSSAC',
      role: finalRole,
      roleTitle:
        finalRoleTitle ||
        (issued?.roleTitle ??
          `${member?.position || 'Thành viên'} - ${member?.department_name || 'CLB iSSAC'}`),
      departmentCode:
        member?.department_code || issued?.departmentCode || preset?.departmentCode,
      departmentName:
        member?.department_name || issued?.departmentName || preset?.departmentName,
      memberCode: member?.member_code || issued?.studentId || preset?.memberCode,
      isCore,
      avatarBg: 'bg-blue-600',
      avatarUrl: member?.avatar_url || issued?.avatarUrl || preset?.avatarUrl,
    }

    setCurrentUser(authUser)
    try {
      localStorage.setItem('issac_active_user', authUser.id)
    } catch (e) {}

    return {
      success: true,
      user: authUser,
      message: `Đăng nhập thành công! Chào mừng ${authUser.name} (${authUser.roleTitle}).`,
    }
  }

  const logout = () => {
    localStorage.removeItem('issac_active_user')
    setCurrentUser(null)
  }

  const isBCN =
    currentUser?.role === 'bcn' ||
    currentUser?.role === 'admin' ||
    (currentUser?.departmentCode === 'B04' && currentUser?.role !== 'member') ||
    false
  const isHR =
    currentUser?.role === 'hr' ||
    (currentUser?.departmentCode === 'B03' &&
      currentUser?.role !== 'member' &&
      !currentUser?.roleTitle?.includes('Thành viên')) ||
    false
  const isDeptHead = currentUser?.role === 'dept_head' || false
  const isMember = currentUser?.role === 'member' || currentUser?.roleTitle?.includes('Thành viên') || false
  const isCoreTeam = isUserCoreTeam(currentUser)
  const canManageAccounts = canUserManageAccounts(currentUser)
  const canAddOrProposeScore = Boolean(canUserAddOrProposeScore(currentUser))

  const canScoreMember = useCallback(
    (targetMember: { department_code?: string; department_slug?: string; full_name?: string } | null) => {
      return canUserScoreMember(currentUser, targetMember)
    },
    [currentUser]
  )

  const getAllowedMembers = useCallback(
    (membersList: RosterMember[]) => {
      return getAllowedScoringMembers(currentUser, membersList)
    },
    [currentUser]
  )

  const isAuthenticated = Boolean(currentUser)

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthChecked,
        isAuthenticated,
        switchUser,
        login,
        logout,
        issuedAccounts,
        createIssuedAccount,
        updateIssuedAccount,
        deleteIssuedAccount,
        isBCN,
        isHR,
        isDeptHead,
        isMember,
        isCoreTeam,
        canManageAccounts,
        canAddOrProposeScore,
        canScoreMember,
        getAllowedMembers,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
