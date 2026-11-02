'use client'

import React, { useState, useRef } from 'react'
import { useAuth, type IssuedAccount } from '@/lib/auth/AuthContext'
import { useClub } from '@/lib/context/ClubContext'
import { useLanguage } from '@/lib/context/LanguageContext'
import { getMemberAvatarUrl } from '@/lib/clubData'
import type { DepartmentCode, DepartmentSlug, UserRole } from '@/types/database'
import {
  UserCog,
  Plus,
  Eye,
  EyeOff,
  Edit3,
  Lock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Search,
  KeyRound,
  Users,
} from 'lucide-react'

export function AccountsView() {
  const { language } = useLanguage()
  const {
    issuedAccounts,
    createIssuedAccount,
    updateIssuedAccount,
    deleteIssuedAccount,
    isBCN,
    canManageAccounts,
  } = useAuth()
  const { members } = useClub()

  // Mascot động & Lời thoại tương tác
  const [isMascotCheering, setIsMascotCheering] = useState<boolean>(false)
  const [mascotQuoteIdx, setMascotQuoteIdx] = useState<number>(0)
  const [showMascotBubble, setShowMascotBubble] = useState<boolean>(false)
  const mascotBubbleTimeout = useRef<NodeJS.Timeout | null>(null)

  const mascotQuotes = language === 'vi' ? [
    'Bảo mật tài khoản CLB iSSAC!',
    'Phân quyền minh bạch, an toàn!',
    'Hỗ trợ cán bộ chuyên trách!',
  ] : [
    'Secure iSSAC Club Accounts!',
    'Transparent & Safe Access!',
    'Empowering Department Staff!',
  ]

  const handleMascotClick = () => {
    setIsMascotCheering(true)
    setShowMascotBubble(true)
    setMascotQuoteIdx((prev) => (prev + 1) % mascotQuotes.length)
    setTimeout(() => setIsMascotCheering(false), 850)

    if (mascotBubbleTimeout.current) clearTimeout(mascotBubbleTimeout.current)
    mascotBubbleTimeout.current = setTimeout(() => {
      setShowMascotBubble(false)
    }, 2800)
  }

  // State hiển thị mật khẩu từng dòng (toggle eye)
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal Cấp tài khoản mới
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedMemberCode, setSelectedMemberCode] = useState<string>('')
  const [newFullName, setNewFullName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newStudentId, setNewStudentId] = useState('')
  const [newDeptCode, setNewDeptCode] = useState<DepartmentCode>('B01')
  const [newRole, setNewRole] = useState<UserRole>('member')
  const [newRoleTitle, setNewRoleTitle] = useState('Thành viên Ban Truyền thông')
  const [newPassword, setNewPassword] = useState('ISSAC2026@clb')
  const [addFeedback, setAddFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Modal Sửa thông tin / Đổi mật khẩu
  const [editingAccount, setEditingAccount] = useState<IssuedAccount | null>(null)
  const [editPassword, setEditPassword] = useState('')
  const [editRoleTitle, setEditRoleTitle] = useState('')
  const [editStatus, setEditStatus] = useState<'active' | 'suspended'>('active')
  const [editFeedback, setEditFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const togglePasswordReveal = (id: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Khi chọn thành viên trong dropdown cấp tài khoản
  const handleSelectMemberForAccount = (memberCode: string) => {
    setSelectedMemberCode(memberCode)
    const m = members.find((item) => item.member_code === memberCode)
    if (m) {
      setNewFullName(m.full_name)
      setNewStudentId(m.student_id || m.member_code)
      setNewEmail(m.email || `${m.student_id || m.member_code}@vnu.edu.vn`)
      setNewDeptCode(m.department_code)
      setNewRoleTitle(`${m.position} - ${m.department_name}`)
      setNewRole(
        m.department_slug === 'bcn'
          ? 'bcn'
          : m.department_slug === 'nhan-su' && m.position.includes('Trưởng')
          ? 'hr'
          : m.position.includes('Trưởng') || m.position.includes('Phó')
          ? 'dept_head'
          : 'member'
      )
      setNewPassword(`ISSAC2026@${m.student_id || '123'}`)
    }
  }

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#'
    let pass = 'ISSAC2026@'
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewPassword(pass)
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFullName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setAddFeedback({
        type: 'error',
        message: language === 'vi' ? 'Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu!' : 'Please fill in Name, Email and Password!',
      })
      return
    }

    const deptMap: Record<DepartmentCode, { name: string; slug: DepartmentSlug }> = {
      B04: { name: 'Ban Chủ nhiệm', slug: 'bcn' },
      B01: { name: 'Ban Truyền thông', slug: 'truyen-thong' },
      B02: { name: 'Ban Tư vấn', slug: 'tu-van' },
      B03: { name: 'Ban Nhân sự', slug: 'nhan-su' },
    }

    const deptInfo = deptMap[newDeptCode] || deptMap.B01

    const res = createIssuedAccount({
      fullName: newFullName.trim(),
      email: newEmail.trim().toLowerCase(),
      studentId: newStudentId.trim() || undefined,
      departmentCode: newDeptCode,
      departmentName: deptInfo.name,
      departmentSlug: deptInfo.slug,
      role: newRole,
      roleTitle: newRoleTitle.trim(),
      passwordPlain: newPassword.trim(),
      status: 'active',
    })

    if (res.success) {
      setAddFeedback({ type: 'success', message: res.message })
      setTimeout(() => {
        setIsAddModalOpen(false)
        setAddFeedback(null)
        setNewFullName('')
        setNewEmail('')
        setNewStudentId('')
      }, 1200)
    } else {
      setAddFeedback({ type: 'error', message: res.message })
    }
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAccount) return

    const updates: Partial<IssuedAccount> = {
      roleTitle: editRoleTitle.trim() || editingAccount.roleTitle,
      status: editStatus,
    }
    if (editPassword.trim()) {
      updates.passwordPlain = editPassword.trim()
    }

    const res = updateIssuedAccount(editingAccount.id, updates)
    if (res.success) {
      setEditFeedback({ type: 'success', message: res.message })
      setTimeout(() => {
        setEditingAccount(null)
        setEditFeedback(null)
      }, 1000)
    } else {
      setEditFeedback({ type: 'error', message: res.message })
    }
  }

  const handleDelete = (id: string, name: string) => {
    const confirmMsg = language === 'vi'
      ? `Bạn có chắc chắn muốn xóa tài khoản của cán bộ "${name}" không?`
      : `Are you sure you want to delete the account for "${name}"?`
    if (confirm(confirmMsg)) {
      const res = deleteIssuedAccount(id)
      if (!res.success) {
        alert(res.message)
      }
    }
  }

  // Lọc tài khoản theo ô tìm kiếm
  const filteredAccounts = issuedAccounts.filter((a) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      a.fullName.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.studentId && a.studentId.toLowerCase().includes(q)) ||
      a.departmentName.toLowerCase().includes(q) ||
      a.roleTitle.toLowerCase().includes(q)
    )
  })

  // Style huy hiệu Ban chuyên môn chuẩn nhận diện đồng bộ với MembersView & StatsView
  const getDeptBadgeStyle = (slug: DepartmentSlug) => {
    switch (slug) {
      case 'bcn':
        return 'bg-amber-50 text-amber-800 border-amber-200/80 font-bold'
      case 'truyen-thong':
        return 'bg-blue-50 text-[#0284C7] border-blue-200/80 font-bold'
      case 'tu-van':
        return 'bg-pink-50 text-pink-700 border-pink-200/80 font-bold'
      case 'nhan-su':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/80 font-bold'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 font-bold'
    }
  }

  // Khóa truy cập hoàn toàn nếu không phải Ban Chủ nhiệm
  if (!canManageAccounts && !isBCN) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-lg mx-auto my-12 shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/90 flex items-center justify-center mx-auto shadow-2xs">
          <Lock className="w-8 h-8 text-amber-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-[#061651]">
            {language === 'vi' ? 'Quyền Hạn Hạn Chế' : 'Restricted Access'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {language === 'vi'
              ? 'Chức năng Quản trị tài khoản chỉ dành riêng cho Ban Chủ nhiệm CLB iSSAC. Các tài khoản chuyên môn không có thẩm quyền truy cập hay xem thông tin tài khoản tại đây.'
              : 'Account management is reserved exclusively for the Executive Board of iSSAC Club. Department staff do not have authorization to view or edit accounts.'}
          </p>
        </div>
        <div className="pt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            {language === 'vi' ? 'Chỉ Ban Chủ nhiệm mới có quyền cấp tài khoản' : 'Executive Board Permission Required'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER TRANG: QUẢN TRỊ TÀI KHOẢN CLB (CHUẨN NHẬN DIỆN DỰ ÁN) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3.5 sm:gap-4.5">
          <div>
            <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#061651] tracking-tight leading-tight">
              {language === 'vi' ? 'Quản trị tài khoản & phân quyền CLB' : 'Club Accounts & Permissions'}
            </h1>
            <p className="text-xs sm:text-[13px] text-[#64748B] mt-1 font-normal">
              {language === 'vi'
                ? 'Ban Chủ nhiệm có toàn quyền quản lý và cấp tài khoản cho các Ban.'
                : 'The Executive Board holds full authority to manage and issue accounts for all departments.'}
            </p>
          </div>

          {/* Mascot Hoạt Động & Bóng Thoại Đồng Bộ Các Trang */}
          <div
            onClick={handleMascotClick}
            className="relative group cursor-pointer inline-flex items-center shrink-0 select-none"
          >
            <img
              src="/accounts-mascot.png"
              alt="iSSAC Account Mascot"
              className={`w-12 h-14 sm:w-14 sm:h-16 object-contain drop-shadow-[0_4px_12px_rgba(2,132,199,0.22)] transition-all duration-300 ${
                isMascotCheering
                  ? 'animate-mascot-pop drop-shadow-[0_8px_20px_rgba(2,132,199,0.45)]'
                  : 'animate-mascot-fly hover:scale-115 hover:rotate-3'
              }`}
            />

            {/* Bubble tooltip nằm bên cạnh mascot chuẩn style (ẩn trên mobile để không tràn viền) */}
            <div
              className={`absolute left-full ml-2.5 sm:ml-3 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#0369A1] text-white text-[11px] font-bold shadow-md whitespace-nowrap z-40 transition-all duration-200 hidden sm:flex items-center border border-white/25 pointer-events-none ${
                isMascotCheering || showMascotBubble
                  ? 'opacity-100 scale-105 translate-x-1 pointer-events-auto'
                  : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
              }`}
            >
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#0284C7] rotate-45 border-l border-b border-white/25" />
              <span className="relative z-10 select-none tracking-tight">
                {mascotQuotes[mascotQuoteIdx]}
              </span>
            </div>
          </div>
        </div>

        {canManageAccounts ? (
          <button
            type="button"
            onClick={() => {
              setIsAddModalOpen(true)
              setAddFeedback(null)
            }}
            className="px-4 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs sm:text-[13px] transition shadow-xs hover:shadow flex items-center gap-2 active:scale-95 cursor-pointer shrink-0 self-start md:self-center"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'vi' ? 'Cấp tài khoản mới' : 'Issue New Account'}</span>
          </button>
        ) : (
          <div className="px-4 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200/90 flex items-center gap-2 shrink-0 shadow-2xs self-start md:self-center">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>{language === 'vi' ? 'Chỉ BCN có quyền cấp' : 'Exec Board Only'}</span>
          </div>
        )}
      </div>

      {/* 2. MAIN TABLE CARD: DANH SÁCH TÀI KHOẢN CÁN BỘ */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Table Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0284C7] flex items-center justify-center border border-sky-200/60 shadow-2xs">
              <UserCog className="w-4 h-4 text-[#0284C7]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#061651]">
                {language === 'vi' ? 'Danh sách tài khoản cán bộ' : 'Staff Accounts Roster'} ({filteredAccounts.length})
              </h3>
              <p className="text-[11px] text-[#64748B] hidden sm:block">
                {language === 'vi'
                  ? 'Bao gồm Ban Chủ nhiệm & các Ban chuyên môn CLB iSSAC'
                  : 'Includes Executive Board & Departmental Staff'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={language === 'vi' ? 'Tìm tên, email, ban...' : 'Search name, email, dept...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#0284C7] transition shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Mobile View for Phones (< md) */}
        <div className="block md:hidden p-3 space-y-3">
          {filteredAccounts.map((account) => {
            const isPasswordRevealed = revealedPasswords[account.id] || false
            const memberObj = members.find((m) => (account.studentId && (m.student_id === account.studentId || m.member_code === account.studentId)) || m.full_name === account.fullName || m.email === account.email)
            const avatarUrl = account.avatarUrl || getMemberAvatarUrl(memberObj || { full_name: account.fullName, email: account.email, member_code: account.studentId })

            return (
              <div
                key={account.id}
                className="p-3.5 bg-slate-50/70 border border-slate-200/90 rounded-2xl space-y-3 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#F0F9FF] text-[#0284C7] border border-sky-200/80 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={account.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{account.fullName.charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-[#061651] text-sm">
                          {account.fullName}
                        </span>
                        {account.isFixed && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            {language === 'vi' ? 'Cố định' : 'Fixed'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono truncate">{account.email}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] border shrink-0 ${getDeptBadgeStyle(
                      account.departmentSlug
                    )}`}
                  >
                    {account.departmentName}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-[#0284C7] border border-sky-200/70">
                    {account.roleTitle}
                  </span>
                  {account.status === 'active' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{language === 'vi' ? 'Hoạt động' : 'Active'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span>{language === 'vi' ? 'Tạm khóa' : 'Suspended'}</span>
                    </span>
                  )}
                </div>

                {!account.isFixed && canManageAccounts && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAccount(account)
                        setEditPassword(account.passwordPlain)
                        setEditRoleTitle(account.roleTitle)
                        setEditStatus(account.status)
                        setEditFeedback(null)
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-[#061651] font-bold text-xs transition flex items-center gap-1 shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#0284C7]" />
                      <span>{language === 'vi' ? 'Sửa thông tin' : 'Edit'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(account.id, account.fullName)}
                      className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title={language === 'vi' ? 'Xóa tài khoản' : 'Delete account'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Table Content (Desktop >= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#0284C7] text-xs font-bold text-white uppercase tracking-wider select-none shadow-xs">
              <tr className="divide-x divide-white/15">
                <th className="py-3 px-5 font-bold text-white whitespace-nowrap">{language === 'vi' ? 'TÀI KHOẢN / NGƯỜI ĐẠI DIỆN' : 'ACCOUNT / REPRESENTATIVE'}</th>
                <th className="py-3 px-4 font-bold text-sky-100 whitespace-nowrap">{language === 'vi' ? 'BAN ĐƯỢC PHÂN CÔNG' : 'ASSIGNED DEPARTMENT'}</th>
                <th className="py-3 px-4 font-bold text-sky-100 whitespace-nowrap">{language === 'vi' ? 'MẬT KHẨU' : 'PASSWORD'}</th>
                <th className="py-3 px-4 font-bold text-sky-100 whitespace-nowrap">{language === 'vi' ? 'TRẠNG THÁI' : 'STATUS'}</th>
                <th className="py-3 px-5 text-right font-bold text-white whitespace-nowrap">{language === 'vi' ? 'HÀNH ĐỘNG' : 'ACTIONS'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.map((account) => {
                const isPasswordRevealed = revealedPasswords[account.id] || false
                const memberObj = members.find((m) => (account.studentId && (m.student_id === account.studentId || m.member_code === account.studentId)) || m.full_name === account.fullName || m.email === account.email)
                const avatarUrl = account.avatarUrl || getMemberAvatarUrl(memberObj || { full_name: account.fullName, email: account.email, member_code: account.studentId })

                return (
                  <tr
                    key={account.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Cột 1: Avatar + Tên & Email */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#F0F9FF] text-[#0284C7] border border-sky-200/80 font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-2xs overflow-hidden">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={account.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <span>{account.fullName.charAt(0)}</span>
                          )}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-[#061651] text-[13px]">
                              {account.fullName}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-[#0284C7] border border-sky-200/70">
                              {account.roleTitle}
                            </span>
                            {account.isFixed && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                                {language === 'vi' ? 'Cố định' : 'Fixed'}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {account.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Ban phân công */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs border ${getDeptBadgeStyle(
                          account.departmentSlug
                        )}`}
                      >
                        {account.departmentName}
                      </span>
                    </td>

                    {/* Cột 3: Mật khẩu */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200/80">
                          {isPasswordRevealed ? account.passwordPlain : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordReveal(account.id)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-md hover:bg-slate-100 transition-colors"
                          title={isPasswordRevealed ? (language === 'vi' ? 'Ẩn mật khẩu' : 'Hide password') : (language === 'vi' ? 'Hiển thị mật khẩu' : 'Show password')}
                        >
                          {isPasswordRevealed ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyText(account.passwordPlain, `pass-${account.id}`)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-md hover:bg-slate-100 transition-colors"
                          title={language === 'vi' ? 'Sao chép mật khẩu' : 'Copy password'}
                        >
                          {copiedId === `pass-${account.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Cột 4: Trạng thái */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {account.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{language === 'vi' ? 'Hoạt động' : 'Active'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>{language === 'vi' ? 'Tạm khóa' : 'Suspended'}</span>
                        </span>
                      )}
                    </td>

                    {/* Cột 5: Hành động */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {account.isFixed ? (
                          <span className="text-[11px] text-slate-400 font-semibold px-2.5 py-1 bg-slate-50 border border-slate-200/70 rounded-lg">
                            {language === 'vi' ? 'Khóa bảo vệ BCN' : 'Protected BCN'}
                          </span>
                        ) : canManageAccounts ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAccount(account)
                                setEditPassword(account.passwordPlain)
                                setEditRoleTitle(account.roleTitle)
                                setEditStatus(account.status)
                                setEditFeedback(null)
                              }}
                              className="px-3 py-1.5 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50 text-[#061651] font-bold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#0284C7]" />
                              <span>{language === 'vi' ? 'Sửa thông tin' : 'Edit'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(account.id, account.fullName)}
                              className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title={language === 'vi' ? 'Xóa tài khoản' : 'Delete account'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: CẤP TÀI KHOẢN MỚI                                       */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0284C7] flex items-center justify-center font-bold shadow-2xs border border-sky-200/70">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#061651]">
                    {language === 'vi' ? 'Cấp Tài Khoản Cán Bộ Mới' : 'Issue New Staff Account'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {language === 'vi' ? 'Tài khoản được cấp có thể đăng nhập ngay trên hệ thống' : 'Account will be able to log in immediately'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {addFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  addFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {addFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{addFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              {/* Chọn từ 48 thành viên CLB */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  {language === 'vi' ? 'Chọn thành viên CLB để tự điền nhanh thông tin:' : 'Select club member for quick autofill:'}
                </label>
                <select
                  value={selectedMemberCode}
                  onChange={(e) => handleSelectMemberForAccount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-[#0284C7] shadow-2xs cursor-pointer"
                >
                  <option value="">{language === 'vi' ? '-- Hoặc nhập thủ công bên dưới --' : '-- Or enter manually below --'}</option>
                  {members.map((m) => (
                    <option key={m.member_code} value={m.member_code}>
                      {m.full_name} ({m.department_name} - {m.student_id || m.member_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Họ tên */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  {language === 'vi' ? 'Họ và tên cán bộ:' : 'Staff Full Name:'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0284C7] shadow-2xs"
                />
              </div>

              {/* Email đăng nhập */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  {language === 'vi' ? 'Email đăng nhập VNU / VNU-IS:' : 'Login Email:'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ví dụ: 24070622@vnu.edu.vn"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0284C7] shadow-2xs"
                />
              </div>

              {/* MSSV */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">{language === 'vi' ? 'Mã số sinh viên (MSSV):' : 'Student ID:'}</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 24070622"
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0284C7] shadow-2xs"
                />
              </div>

              {/* Ban phân công & Quyền hạn */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">{language === 'vi' ? 'Ban được phân công:' : 'Assigned Department:'}</label>
                  <select
                    value={newDeptCode}
                    onChange={(e) => setNewDeptCode(e.target.value as DepartmentCode)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0284C7] shadow-2xs"
                  >
                    <option value="B04">{language === 'vi' ? 'Ban Chủ nhiệm' : 'Executive Board'}</option>
                    <option value="B01">{language === 'vi' ? 'Ban Truyền thông' : 'Communications Dept'}</option>
                    <option value="B02">{language === 'vi' ? 'Ban Tư vấn' : 'Advisory Dept'}</option>
                    <option value="B03">{language === 'vi' ? 'Ban Nhân sự' : 'HR Dept'}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">{language === 'vi' ? 'Phân quyền vai trò:' : 'Role Permission:'}</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0284C7] shadow-2xs"
                  >
                    <option value="member">{language === 'vi' ? 'Thành viên' : 'Member'}</option>
                    <option value="dept_head">{language === 'vi' ? 'Trưởng / Phó Ban' : 'Dept Head / Vice'}</option>
                    <option value="hr">{language === 'vi' ? 'Ban Nhân sự (HR)' : 'HR Board'}</option>
                    <option value="bcn">{language === 'vi' ? 'Ban Chủ nhiệm (BCN)' : 'Executive Board'}</option>
                  </select>
                </div>
              </div>

              {/* Chức danh hiển thị */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">{language === 'vi' ? 'Chức vụ / Chức danh cụ thể:' : 'Specific Title:'}</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Phó ban Tư vấn"
                  value={newRoleTitle}
                  onChange={(e) => setNewRoleTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0284C7] shadow-2xs"
                />
              </div>

              {/* Mật khẩu khởi tạo */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">
                    {language === 'vi' ? 'Mật khẩu khởi tạo:' : 'Initial Password:'} <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPassword}
                    className="text-[11px] font-bold text-[#0284C7] hover:underline cursor-pointer"
                  >
                    {language === 'vi' ? 'Tạo ngẫu nhiên' : 'Randomize'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-[#0284C7] shadow-2xs"
                  />
                </div>
                <span className="block text-[10.5px] text-slate-400">
                  {language === 'vi' ? 'Mật khẩu này sẽ dùng để đăng nhập hệ thống.' : 'This password will be used to sign in.'}
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Xác Nhận Cấp Tài Khoản' : 'Confirm Issue'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: SỬA THÔNG TIN & ĐỔI MẬT KHẨU TÀI KHOẢN                   */}
      {/* ============================================================== */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-[#061651]">
                <Edit3 className="w-5 h-5 text-[#0284C7]" />
                <h3 className="text-base font-extrabold">
                  {language === 'vi' ? 'Sửa Thông Tin Tài Khoản' : 'Edit Account Info'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {editFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  editFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{editFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  {language === 'vi' ? 'Cán bộ' : 'Staff'}
                </span>
                <p className="font-bold text-[#061651] text-sm">{editingAccount.fullName}</p>
                <p className="text-slate-500 font-mono text-[11px]">{editingAccount.email}</p>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  {language === 'vi' ? 'Chức danh / Vai trò:' : 'Role / Title:'}
                </label>
                <input
                  type="text"
                  value={editRoleTitle}
                  onChange={(e) => setEditRoleTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  {language === 'vi' ? 'Mật khẩu mới (bỏ trống nếu không đổi):' : 'New password (leave blank to keep):'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'vi' ? 'Nhập mật khẩu mới' : 'Enter new password'}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  {language === 'vi' ? 'Trạng thái tài khoản:' : 'Account Status:'}
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'active' | 'suspended')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0284C7]"
                >
                  <option value="active">{language === 'vi' ? '🟢 Hoạt động bình thường' : '🟢 Active'}</option>
                  <option value="suspended">{language === 'vi' ? '🔴 Tạm khóa (không cho phép đăng nhập)' : '🔴 Suspended'}</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  {language === 'vi' ? 'Đóng' : 'Close'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Lưu Thay Đổi' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
