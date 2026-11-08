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
    name: 'Trần Đức Thắng',
    role: 'dept_head',
    roleTitle: 'Trưởng Ban Truyền thông',
    departmentCode: 'B01',
    departmentName: 'Ban Truyền thông',
    memberCode: '24310088',
    isCore: true,
    avatarBg: 'bg-blue-500',
    avatarUrl: '/duc-thang-avatar.png',
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
  avatarUrl?: string
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
    createdAt: '15/10/2026',
  },
  {
    id: 'acc-hiep',
    fullName: 'Giang Lê Hiệp',
    email: 'glhiep@vnuis.edu.vn',
    studentId: '23070691',
    departmentCode: 'B04',
    departmentName: 'Ban Chủ nhiệm',
    departmentSlug: 'bcn',
    role: 'bcn',
    roleTitle: 'Phó chủ nhiệm - Ban Chủ nhiệm',
    passwordPlain: 'ISSAC2026@23070691',
    status: 'active',
    avatarUrl: '/giang-le-hiep-avatar.png',
    createdAt: '15/10/2026',
  },
  {
    id: 'acc-trang',
    fullName: 'Nguyễn Trịnh Minh Trang',
    email: 'ngtminhtrang3204@gmail.com',
    studentId: '22073125',
    departmentCode: 'B04',
    departmentName: 'Ban Chủ nhiệm',
    departmentSlug: 'bcn',
    role: 'bcn',
    roleTitle: 'Phó chủ nhiệm - Ban Chủ nhiệm',
    passwordPlain: 'ISSAC2026@22073125',
    status: 'active',
    createdAt: '15/10/2026',
  },
  {
    id: 'acc-hoa',
    fullName: 'Ngô Phương Hoa',
    email: '23070448@vnu.edu.vn',
    studentId: '23070448',
    departmentCode: 'B03',
    departmentName: 'Ban Nhân sự',
    departmentSlug: 'nhan-su',
    role: 'hr',
    roleTitle: 'Trưởng Ban Nhân sự (HR)',
    passwordPlain: 'ISSAC2026@23070448',
    status: 'active',
    avatarUrl: '/ngo-phuong-hoa-avatar.png',
    createdAt: '15/10/2026',
  },
  {
    id: 'acc-hien',
    fullName: 'Trần Thanh Hiền',
    email: 'hien.danity.k@gmail.com',
    studentId: '24310150',
    departmentCode: 'B03',
    departmentName: 'Ban Nhân sự',
    departmentSlug: 'nhan-su',
    role: 'hr',
    roleTitle: 'Phó Ban Nhân sự (HR)',
    passwordPlain: 'ISSAC2026@24310150',
    status: 'active',
    avatarUrl: '/tran-thanh-hien-avatar.png',
    createdAt: '15/10/2026',
  },
  {
    id: 'acc-thang',
    fullName: 'Trần Đức Thắng',
    email: 'tdthang@vnuis.edu.vn',
    studentId: '24310088',
    departmentCode: 'B01',
    departmentName: 'Ban Truyền thông',
    departmentSlug: 'truyen-thong',
    role: 'dept_head',
    roleTitle: 'Trưởng Ban Truyền thông',
    passwordPlain: 'ISSAC2026@24310088',
    status: 'active',
    avatarUrl: '/duc-thang-avatar.png',
    createdAt: '15/10/2026',
  },
  {
    id: 'acc-nguyen',
    fullName: 'Lê Trần Thuỷ Nguyên',
    email: 'tnguyenletran@gmail.com',
    studentId: '24310069',
    departmentCode: 'B02',
    departmentName: 'Ban Tư vấn',
    departmentSlug: 'tu-van',
    role: 'dept_head',
    roleTitle: 'Trưởng Ban Tư vấn',
    passwordPlain: 'ISSAC2026@24310069',
    status: 'active',
    avatarUrl: '/thuy-nguyen-avatar.png',
    createdAt: '15/10/2026',
  },
  {
    id: 'acc-hai',
    fullName: 'Vũ Đình Hải',
    email: 'vudinhhai542007@gmail.com',
    studentId: '25070407',
    departmentCode: 'B01',
    departmentName: 'Ban Truyền thông',
    departmentSlug: 'truyen-thong',
    role: 'dept_head',
    roleTitle: 'Phó Ban Truyền thông',
    passwordPlain: 'ISSAC2026@25070407',
    status: 'active',
    avatarUrl: '/vu-dinh-hai-avatar.png',
    createdAt: '15/10/2026',
  },
  {
    id: 'acc-duong',
    fullName: 'Lâm Thị Bình Dương',
    email: 'lamduong200907@gmail.com',
    studentId: '25070345',
    departmentCode: 'B01',
    departmentName: 'Ban Truyền thông',
    departmentSlug: 'truyen-thong',
    role: 'dept_head',
    roleTitle: 'Phó Ban Truyền thông',
    passwordPlain: 'ISSAC2026@25070345',
    status: 'active',
    avatarUrl: '/lam-thi-binh-duong-avatar.png',
    createdAt: '15/10/2026',
  },
  {
    id: 'acc-huy',
    fullName: 'Phương Gia Huy',
    email: '24070680@vnu.edu.vn',
    studentId: '24070680',
    departmentCode: 'B01',
    departmentName: 'Ban Truyền thông',
    departmentSlug: 'truyen-thong',
    role: 'dept_head',
    roleTitle: 'Cán bộ Ban Truyền thông',
    passwordPlain: 'ISSAC2026@truyenthong',
    status: 'active',
    avatarUrl: '/phuong-gia-huy-avatar.png',
    createdAt: '15/10/2026',
  },
  {
    id: 'acc-ngocanh',
    fullName: 'Nguyễn Ngọc Anh',
    email: '24070622@vnu.edu.vn',
    studentId: '24070622',
    departmentCode: 'B02',
    departmentName: 'Ban Tư vấn',
    departmentSlug: 'tu-van',
    role: 'dept_head',
    roleTitle: 'Phó Ban Tư vấn',
    passwordPlain: 'ISSAC2026@tuvan',
    status: 'active',
    avatarUrl: '/nguyen-ngoc-anh-avatar.png',
    createdAt: '15/10/2026',
  },
  {
    id: 'acc-thuhien',
    fullName: 'Phùng Thị Thu Hiền',
    email: '24070752@vnu.edu.vn',
    studentId: '24070752',
    departmentCode: 'B02',
    departmentName: 'Ban Tư vấn',
    departmentSlug: 'tu-van',
    role: 'dept_head',
    roleTitle: 'Phó Ban Tư vấn',
    passwordPlain: 'ISSAC2026@tuvan2',
    status: 'active',
    avatarUrl: '/phung-thi-thu-hien-avatar.png',
    createdAt: '15/10/2026',
  },
  {
    id: 'acc-thao',
    fullName: 'Nguyễn Thu Thảo',
    email: 'nthuthao2011@gmail.com',
    studentId: '23071234',
    departmentCode: 'B02',
    departmentName: 'Ban Tư vấn',
    departmentSlug: 'tu-van',
    role: 'dept_head',
    roleTitle: 'Cố vấn Ban Tư vấn',
    passwordPlain: 'ISSAC2026@thao',
    status: 'active',
    avatarUrl: '/nguyen-thu-thao-avatar.png',
    createdAt: '15/10/2026',
  },
  {
    id: 'acc-26070180',
    fullName: 'Ngô Bảo Anh',
    email: 'daothingan19899@gmail.com',
    studentId: '26070180',
    departmentCode: 'B03',
    departmentName: 'Ban Nhân sự',
    departmentSlug: 'nhan-su',
    role: 'member',
    roleTitle: 'Thành viên - Ban Nhân sự',
    passwordPlain: 'ISSAC2026@26070180',
    status: 'active',
    createdAt: '18/10/2026',
  },
  {
    id: 'acc-26070316',
    fullName: 'Nguyễn Mai Thanh Hương',
    email: 'huongth484@gmail.com',
    studentId: '26070316',
    departmentCode: 'B03',
    departmentName: 'Ban Nhân sự',
    departmentSlug: 'nhan-su',
    role: 'member',
    roleTitle: 'Thành viên - Ban Nhân sự',
    passwordPlain: 'ISSAC2026@26070316',
    status: 'active',
    createdAt: '18/10/2026',
  },
  {
    id: 'acc-25073039',
    fullName: 'Trần Phương Linh',
    email: 'tranplinh2517@gmail.com',
    studentId: '25073039',
    departmentCode: 'B03',
    departmentName: 'Ban Nhân sự',
    departmentSlug: 'nhan-su',
    role: 'member',
    roleTitle: 'Thành viên - Ban Nhân sự',
    passwordPlain: 'ISSAC2026@25073039',
    status: 'active',
    createdAt: '18/10/2026',
  },
  {
    id: 'acc-26070324',
    fullName: 'Hoàng Công Minh',
    email: 'hoangcongminh.cm@gmail.com',
    studentId: '26070324',
    departmentCode: 'B03',
    departmentName: 'Ban Nhân sự',
    departmentSlug: 'nhan-su',
    role: 'member',
    roleTitle: 'Thành viên - Ban Nhân sự',
    passwordPlain: 'ISSAC2026@26070324',
    status: 'active',
    createdAt: '18/10/2026',
  },
  {
    id: 'acc-25073044',
    fullName: 'Đỗ Ngọc Ly',
    email: 'dongocly150106@gmail.com',
    studentId: '25073044',
    departmentCode: 'B03',
    departmentName: 'Ban Nhân sự',
    departmentSlug: 'nhan-su',
    role: 'member',
    roleTitle: 'Thành viên - Ban Nhân sự',
    passwordPlain: 'ISSAC2026@25073044',
    status: 'active',
    createdAt: '18/10/2026',
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
  isCoreTeam: boolean
  canManageAccounts: boolean
  canAddOrProposeScore: boolean
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
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      const paramUser = urlParams?.get('user')
      const saved = paramUser || localStorage.getItem('issac_active_user')
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
    const handleFocus = () => {
      fetchCloudAccounts()
    }
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'issac_issued_accounts' || e.key === 'issac_active_user' || e.key === 'issac_deleted_account_ids') {
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
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchCloudAccounts()
      }
    }, 15000)

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
    const foundPreset = PRESET_USERS.find((u) => u.id === userId)
    if (foundPreset) {
      setCurrentUser(foundPreset)
      localStorage.setItem('issac_active_user', foundPreset.id)
      return
    }

    const foundMember = INITIAL_MEMBERS.find((m) => m.member_code === userId || m.student_id === userId)
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
        !deletedAccountIdsRef.current.has(a.id) &&
        (a.email.toLowerCase() === clean ||
        (a.studentId && a.studentId.toLowerCase() === clean) ||
        (member && a.studentId && (a.studentId.toLowerCase() === member.student_id?.toLowerCase() || a.studentId.toLowerCase() === member.member_code.toLowerCase())) ||
        (member && a.email && a.email.toLowerCase() === member.email.toLowerCase()) ||
        a.fullName.toLowerCase() === clean ||
        a.fullName.toLowerCase().includes(clean))
    )

    if (issued && deletedAccountIdsRef.current.has(issued.id)) {
      return {
        success: false,
        message: 'Tài khoản này đã bị xóa khỏi hệ thống bởi Ban Chủ nhiệm.',
      }
    }

    if (issued && issued.status === 'suspended') {
      return {
        success: false,
        message: 'Tài khoản của bạn hiện đang bị tạm khóa bởi Ban Chủ nhiệm. Vui lòng liên hệ BCN.',
      }
    }

    // 3. Tìm kiếm trong tài khoản cài sẵn (preset)
    const preset = PRESET_USERS.find(
      (u) =>
        u.id.toLowerCase() === clean ||
        u.memberCode?.toLowerCase() === clean ||
        (member && u.memberCode?.toLowerCase() === member.member_code.toLowerCase()) ||
        u.name.toLowerCase() === clean ||
        u.name.toLowerCase().includes(clean)
    )

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
      if (issued.departmentSlug === 'nhan-su' && (issued.roleTitle.includes('Trưởng') || issued.roleTitle.includes('Phó'))) {
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
      roleTitle: finalRoleTitle || (issued?.roleTitle ?? `${member?.position || 'Thành viên'} - ${member?.department_name || 'CLB iSSAC'}`),
      departmentCode: member?.department_code || issued?.departmentCode || preset?.departmentCode,
      departmentName: member?.department_name || issued?.departmentName || preset?.departmentName,
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
