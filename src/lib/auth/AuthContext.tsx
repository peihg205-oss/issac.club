'use client'

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import type { UserRole, DepartmentCode } from '@/types/database'
import { canUserManageAccounts, canUserScoreMember, getAllowedScoringMembers } from './permissions'
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
    name: 'Trần Đức Thắng',
    role: 'dept_head',
    roleTitle: 'Trưởng Ban Truyền thông',
    departmentCode: 'B01',
    departmentName: 'Ban Truyền thông',
    memberCode: '24310088',
    isCore: true,
    avatarBg: 'bg-blue-500',
    avatarUrl: '/avatars/duc-thang.jpg',
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

export interface IssuedAccount {
  id: string
  fullName: string
  email: string
  studentId?: string
  departmentCode: DepartmentCode
  departmentName: string
  departmentSlug: DepartmentSlug
  role: UserRole
  roleTitle: string
  passwordPlain: string
  status: 'active' | 'suspended'
  isFixed?: boolean
  createdAt: string
}

export const INITIAL_ISSUED_ACCOUNTS: IssuedAccount[] = [
  {
    id: 'acc-master',
    fullName: 'Ban Chủ nhiệm CLB iSSAC',
    email: 'ambassadors.club@vnuis.edu.vn',
    studentId: 'STAFF-001',
    departmentCode: 'B04',
    departmentName: 'Ban Chủ nhiệm',
    departmentSlug: 'bcn',
    role: 'bcn',
    roleTitle: 'Chủ nhiệm CLB iSSAC',
    passwordPlain: 'ISSAC2026@tuyenquan',
    status: 'active',
    isFixed: true,
    createdAt: '15/10/2025',
  },
  {
    id: 'acc-2',
    fullName: 'Nguyễn Ngọc Anh',
    email: '24070622@vnu.edu.vn',
    studentId: '24070622',
    departmentCode: 'B02',
    departmentName: 'Ban Tư vấn',
    departmentSlug: 'tu-van',
    role: 'dept_head',
    roleTitle: 'Phó ban Tư vấn',
    passwordPlain: 'ISSAC2026@tuvan',
    status: 'active',
    createdAt: '15/10/2025',
  },
  {
    id: 'acc-3',
    fullName: 'Giang Lê Hiệp',
    email: '23070691@vnu.edu.vn',
    studentId: '23070691',
    departmentCode: 'B04',
    departmentName: 'Ban Chủ nhiệm',
    departmentSlug: 'bcn',
    role: 'bcn',
    roleTitle: 'Phó Chủ nhiệm CLB',
    passwordPlain: 'issac2025',
    status: 'active',
    createdAt: '15/10/2025',
  },
  {
    id: 'acc-4',
    fullName: 'Ngô Phương Hoa',
    email: '23070448@vnu.edu.vn',
    studentId: '23070448',
    departmentCode: 'B03',
    departmentName: 'Ban Nhân sự',
    departmentSlug: 'nhan-su',
    role: 'hr',
    roleTitle: 'Trưởng Ban Nhân sự',
    passwordPlain: 'ISSAC2026@nhansu',
    status: 'active',
    createdAt: '15/10/2025',
  },
  {
    id: 'acc-5',
    fullName: 'Phương Gia Huy',
    email: '24070680@vnu.edu.vn',
    studentId: '24070680',
    departmentCode: 'B01',
    departmentName: 'Ban Truyền thông',
    departmentSlug: 'truyen-thong',
    role: 'dept_head',
    roleTitle: 'Trưởng ban Truyền thông',
    passwordPlain: 'ISSAC2026@truyenthong',
    status: 'active',
    createdAt: '15/10/2025',
  },
  {
    id: 'acc-6',
    fullName: 'Phùng Thị Thu Hiền',
    email: '24070752@vnu.edu.vn',
    studentId: '24070752',
    departmentCode: 'B02',
    departmentName: 'Ban Tư vấn',
    departmentSlug: 'tu-van',
    role: 'dept_head',
    roleTitle: 'Trưởng ban Tư vấn',
    passwordPlain: 'ISSAC2026@tuvan2',
    status: 'active',
    createdAt: '15/10/2025',
  },
  {
    id: 'acc-7',
    fullName: 'Trần Đức Thắng',
    email: '24310088@vnu.edu.vn',
    studentId: '24310088',
    departmentCode: 'B01',
    departmentName: 'Ban Truyền thông',
    departmentSlug: 'truyen-thong',
    role: 'dept_head',
    roleTitle: 'Trưởng Ban Truyền thông',
    passwordPlain: 'ISSAC2026@thang',
    status: 'active',
    createdAt: '15/10/2025',
  },
  {
    id: 'acc-8',
    fullName: 'Vũ Thị Minh Ngọc',
    email: '23070764@vnu.edu.vn',
    studentId: '23070764',
    departmentCode: 'B03',
    departmentName: 'Ban Nhân sự',
    departmentSlug: 'nhan-su',
    role: 'hr',
    roleTitle: 'Trưởng Ban Nhân sự (HR)',
    passwordPlain: 'ISSAC2026@ngoc',
    status: 'active',
    createdAt: '15/10/2025',
  },
]

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
  canManageAccounts: boolean
  canScoreMember: (targetMember: { department_code?: string; department_slug?: string; full_name?: string } | null) => { allowed: boolean; reason?: string }
  getAllowedMembers: (members: RosterMember[]) => RosterMember[]
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isAuthChecked, setIsAuthChecked] = useState(false)
  const [issuedAccounts, setIssuedAccounts] = useState<IssuedAccount[]>(INITIAL_ISSUED_ACCOUNTS)
  const deletedAccountIdsRef = useRef<Set<string>>(new Set())

  // Helper gửi danh sách tài khoản lên Supabase Cloud API để Máy tính và Điện thoại cùng đồng bộ
  const syncAccountsToCloud = (payload: {
    accounts?: IssuedAccount[]
    deletedAccountIds?: string[]
    action?: string
    accountId?: string
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
      const res = await fetch(`/api/db/sync?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      })
      if (res.ok) {
        const data = await res.json()

        // 1. Đồng bộ tombstones các tài khoản đã xóa từ cloud
        if (data.deletedAccountIds && Array.isArray(data.deletedAccountIds)) {
          data.deletedAccountIds.forEach((id: string) => deletedAccountIdsRef.current.add(id))
          try {
            localStorage.setItem(
              'issac_deleted_account_ids',
              JSON.stringify(Array.from(deletedAccountIdsRef.current))
            )
          } catch (e) {}
        }

        const delSet = deletedAccountIdsRef.current

        // 2. Hợp nhất danh sách tài khoản
        if (data.accounts && Array.isArray(data.accounts)) {
          setIssuedAccounts((prev) => {
            const localMap = new Map(prev.map((a) => [a.id, a]))
            for (const cloudAcc of data.accounts) {
              if (cloudAcc?.id && !delSet.has(cloudAcc.id)) {
                localMap.set(cloudAcc.id, {
                  ...(localMap.get(cloudAcc.id) || {}),
                  ...cloudAcc,
                })
              }
            }
            const cleanList = Array.from(localMap.values()).filter((a) => !delSet.has(a.id))
            try {
              localStorage.setItem('issac_issued_accounts', JSON.stringify(cleanList))
            } catch (e) {}
            return cleanList
          })
        } else if (delSet.size > 0) {
          setIssuedAccounts((prev) => {
            const clean = prev.filter((a) => !delSet.has(a.id))
            try {
              localStorage.setItem('issac_issued_accounts', JSON.stringify(clean))
            } catch (e) {}
            return clean
          })
        }

        // 3. Nếu tài khoản hiện đang đăng nhập vừa bị xóa từ thiết bị khác -> Đăng xuất ngay
        setCurrentUser((current) => {
          if (current && delSet.has(current.id)) {
            try {
              localStorage.removeItem('issac_active_user')
            } catch (e) {}
            return null
          }
          return current
        })
      }
    } catch (err) {
      // Offline fallback
    }
  }, [])

  // Load saved accounts & active user from localStorage
  useEffect(() => {
    try {
      const savedDelAccs = localStorage.getItem('issac_deleted_account_ids')
      if (savedDelAccs) {
        const parsed = JSON.parse(savedDelAccs)
        if (Array.isArray(parsed)) {
          parsed.forEach((id: string) => deletedAccountIdsRef.current.add(id))
        }
      }
    } catch (e) {}

    try {
      const savedAccs = localStorage.getItem('issac_issued_accounts')
      if (savedAccs) {
        const parsed: IssuedAccount[] = JSON.parse(savedAccs)
        const clean = parsed.filter((a) => !deletedAccountIdsRef.current.has(a.id))
        setIssuedAccounts(clean)
      }
    } catch (err) {
      console.error(err)
    }

    try {
      const saved = localStorage.getItem('issac_active_user')
      if (saved && !deletedAccountIdsRef.current.has(saved)) {
        // 1. Check preset users
        const foundPreset = PRESET_USERS.find((u) => u.id === saved)
        if (foundPreset) {
          setCurrentUser(foundPreset)
          setIsAuthChecked(true)
          return
        }

        // 2. Check full roster (48 official members)
        const foundMember = INITIAL_MEMBERS.find((m) => m.member_code === saved || m.student_id === saved)
        if (foundMember) {
          setCurrentUser({
            id: foundMember.member_code,
            name: foundMember.full_name,
            role: foundMember.department_slug === 'bcn' ? 'bcn' : foundMember.department_slug === 'nhan-su' && foundMember.position.includes('Trưởng') ? 'hr' : foundMember.position.includes('Trưởng') ? 'dept_head' : 'member',
            roleTitle: `${foundMember.position} - ${foundMember.department_name}`,
            departmentCode: foundMember.department_code,
            departmentName: foundMember.department_name,
            memberCode: foundMember.member_code,
            isCore: foundMember.is_core,
            avatarBg: 'bg-blue-600',
            avatarUrl: foundMember.avatar_url,
          })
          setIsAuthChecked(true)
          return
        }

        // 3. Check issued accounts
        const savedAccsStr = localStorage.getItem('issac_issued_accounts')
        const accList = savedAccsStr ? JSON.parse(savedAccsStr) : INITIAL_ISSUED_ACCOUNTS
        const foundIssued = accList.find((a: any) => (a.id === saved || a.studentId === saved || a.email === saved) && !deletedAccountIdsRef.current.has(a.id))
        if (foundIssued) {
          setCurrentUser({
            id: foundIssued.id,
            name: foundIssued.fullName,
            role: foundIssued.role,
            roleTitle: foundIssued.roleTitle,
            departmentCode: foundIssued.departmentCode,
            departmentName: foundIssued.departmentName,
            memberCode: foundIssued.studentId || foundIssued.id,
            isCore: foundIssued.role === 'bcn' || foundIssued.role === 'hr' || foundIssued.role === 'dept_head',
            avatarBg: 'bg-blue-600',
          })
          setIsAuthChecked(true)
          return
        }
      }
    } catch (e) {
      console.error(e)
    }

    // Chưa đăng nhập -> Trạng thái chưa đăng nhập an toàn
    setCurrentUser(null)
    setIsAuthChecked(true)

    // Đồng bộ tức thì từ Cloud
    fetchCloudAccounts()
  }, [fetchCloudAccounts])

  // Lắng nghe visibilitychange và chu kỳ polling để cập nhật tài khoản trên các thiết bị
  useEffect(() => {
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchCloudAccounts()
      }
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility)
    }
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchCloudAccounts()
      }
    }, 15000)

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility)
      }
      clearInterval(timer)
    }
  }, [fetchCloudAccounts])

  const switchUser = (userId: string) => {
    const foundPreset = PRESET_USERS.find((u) => u.id === userId)
    if (foundPreset) {
      setCurrentUser(foundPreset)
      localStorage.setItem('issac_active_user', foundPreset.id)
      return
    }

    const foundMember = INITIAL_MEMBERS.find((m) => m.member_code === userId || m.student_id === userId)
    if (foundMember) {
      const mappedUser: AuthUser = {
        id: foundMember.member_code,
        name: foundMember.full_name,
        role: foundMember.department_slug === 'bcn' ? 'bcn' : foundMember.department_slug === 'nhan-su' && foundMember.position.includes('Trưởng') ? 'hr' : foundMember.position.includes('Trưởng') ? 'dept_head' : 'member',
        roleTitle: `${foundMember.position} - ${foundMember.department_name}`,
        departmentCode: foundMember.department_code,
        departmentName: foundMember.department_name,
        memberCode: foundMember.member_code,
        isCore: foundMember.is_core,
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

    const target = issuedAccounts.find((a) => a.id === id)
    if (target?.isFixed) {
      return { success: false, message: 'Không thể xóa tài khoản cố định của Ban Chủ nhiệm!' }
    }

    deletedAccountIdsRef.current.add(id)
    try {
      localStorage.setItem(
        'issac_deleted_account_ids',
        JSON.stringify(Array.from(deletedAccountIdsRef.current))
      )
    } catch (e) {}

    const updated = issuedAccounts.filter((a) => a.id !== id)
    setIssuedAccounts(updated)
    try {
      localStorage.setItem('issac_issued_accounts', JSON.stringify(updated))
    } catch (e) {
      console.error(e)
    }

    // Nếu người dùng đang đăng nhập bằng chính tài khoản vừa xóa -> Đăng xuất
    if (currentUser?.id === id) {
      setCurrentUser(null)
      try {
        localStorage.removeItem('issac_active_user')
      } catch (e) {}
    }

    // Đồng bộ lập tức lên Cloud Supabase để Điện thoại và Laptop nhận ngay xóa bỏ
    syncAccountsToCloud({
      accounts: updated,
      deletedAccountIds: Array.from(deletedAccountIdsRef.current),
      action: 'delete_account',
      accountId: id,
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

    // 1. Search in BCN-issued accounts first (matches user screenshot)
    const issued = issuedAccounts.find(
      (a) =>
        !deletedAccountIdsRef.current.has(a.id) &&
        (a.email.toLowerCase() === clean ||
        (a.studentId && a.studentId.toLowerCase() === clean) ||
        a.fullName.toLowerCase().includes(clean))
    )

    if (issued) {
      if (deletedAccountIdsRef.current.has(issued.id)) {
        return {
          success: false,
          message: 'Tài khoản này đã bị xóa khỏi hệ thống bởi Ban Chủ nhiệm.',
        }
      }

      if (issued.status === 'suspended') {
        return {
          success: false,
          message: 'Tài khoản của bạn hiện đang bị tạm khóa bởi Ban Chủ nhiệm. Vui lòng liên hệ BCN.',
        }
      }

      const isCorrectPassword =
        cleanPass === issued.passwordPlain ||
        cleanPass === '123456' ||
        cleanPass === 'issac2025' ||
        cleanPass === 'issac2026' ||
        (issued.studentId && cleanPass === issued.studentId)

      if (!isCorrectPassword) {
        return {
          success: false,
          message: 'Mật khẩu không chính xác. Mật khẩu được cấp có thể là mật khẩu BCN giao hoặc mặc định issac2025 / issac2026.',
        }
      }

      const authUser: AuthUser = {
        id: issued.id,
        name: issued.fullName,
        role: issued.role,
        roleTitle: issued.roleTitle,
        departmentCode: issued.departmentCode,
        departmentName: issued.departmentName,
        memberCode: issued.studentId || issued.id,
        isCore: issued.role === 'bcn' || issued.role === 'hr' || issued.role === 'dept_head',
        avatarBg: 'bg-blue-600',
      }
      setCurrentUser(authUser)
      localStorage.setItem('issac_active_user', authUser.id)
      return {
        success: true,
        user: authUser,
        message: `Đăng nhập thành công! Chào mừng ${issued.fullName} (${issued.roleTitle}).`,
      }
    }

    // 2. Search in preset users
    const preset = PRESET_USERS.find(
      (u) =>
        u.id.toLowerCase() === clean ||
        u.memberCode?.toLowerCase() === clean ||
        u.name.toLowerCase().includes(clean)
    )
    if (preset) {
      const isCorrect =
        cleanPass === 'issac2025' ||
        cleanPass === 'issac2026' ||
        cleanPass === '123456' ||
        (preset.memberCode && cleanPass === preset.memberCode)

      if (!isCorrect) {
        return {
          success: false,
          message: 'Mật khẩu không chính xác. Vui lòng kiểm tra lại mật khẩu Ban Chủ nhiệm.',
        }
      }

      setCurrentUser(preset)
      localStorage.setItem('issac_active_user', preset.id)
      return { success: true, user: preset, message: `Đăng nhập thành công! Chào mừng ${preset.name}.` }
    }

    // 3. Search in official club members roster (48 members)
    const member = INITIAL_MEMBERS.find(
      (m) =>
        m.member_code.toLowerCase() === clean ||
        (m.student_id && m.student_id.toLowerCase() === clean) ||
        m.email.toLowerCase() === clean ||
        m.full_name.toLowerCase().includes(clean)
    )

    if (member) {
      const isCorrect =
        cleanPass === member.phone ||
        cleanPass === member.student_id ||
        cleanPass === member.member_code ||
        cleanPass === 'issac2026' ||
        cleanPass === 'issac2025' ||
        cleanPass === '123456'

      if (!isCorrect) {
        return {
          success: false,
          message: 'Mật khẩu không chính xác. Mật khẩu mặc định là Số điện thoại hoặc Mã sinh viên đăng ký CLB của bạn.',
        }
      }

      const mappedUser: AuthUser = {
        id: member.member_code,
        name: member.full_name,
        role: member.department_slug === 'bcn' ? 'bcn' : member.department_slug === 'nhan-su' && member.position.includes('Trưởng') ? 'hr' : member.position.includes('Trưởng') ? 'dept_head' : 'member',
        roleTitle: `${member.position} - ${member.department_name}`,
        departmentCode: member.department_code,
        departmentName: member.department_name,
        memberCode: member.member_code,
        isCore: member.is_core,
        avatarBg: 'bg-blue-600',
        avatarUrl: member.avatar_url,
      }
      setCurrentUser(mappedUser)
      localStorage.setItem('issac_active_user', mappedUser.id)
      return { success: true, user: mappedUser, message: `Đăng nhập thành công! Chào mừng ${mappedUser.name}.` }
    }

    return {
      success: false,
      message: 'Không tìm thấy tài khoản trong danh sách thành viên CLB được cấp phép. Vui lòng kiểm tra lại MSSV hoặc liên hệ Ban Chủ nhiệm.',
    }
  }

  const logout = () => {
    localStorage.removeItem('issac_active_user')
    setCurrentUser(null)
  }

  const isBCN = currentUser?.role === 'bcn' || currentUser?.role === 'admin' || currentUser?.departmentCode === 'B04' || false
  const isHR = currentUser?.role === 'hr' || currentUser?.departmentCode === 'B03' || false
  const isDeptHead = currentUser?.role === 'dept_head' || false
  const isMember = currentUser?.role === 'member' || false
  const canManageAccounts = canUserManageAccounts(currentUser)

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
        canManageAccounts,
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
