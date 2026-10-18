'use client'

import React, { useState } from 'react'
import { useAuth, type IssuedAccount } from '@/lib/auth/AuthContext'
import { useClub } from '@/lib/context/ClubContext'
import type { DepartmentCode, DepartmentSlug, UserRole } from '@/types/database'
import {
  ShieldCheck,
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
  ExternalLink,
  Users,
  Smartphone,
  Info,
  RefreshCw,
} from 'lucide-react'

export function AccountsView() {
  const {
    issuedAccounts,
    createIssuedAccount,
    updateIssuedAccount,
    deleteIssuedAccount,
    isBCN,
    canManageAccounts,
    switchUser,
  } = useAuth()
  const { members } = useClub()

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
      setAddFeedback({ type: 'error', message: 'Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu!' })
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
    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản của cán bộ "${name}" không?`)) {
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

  // Style huy hiệu Ban chuyên môn chuẩn nhận diện (bo tròn, không icon trước tên Ban)
  const getDeptBadgeStyle = (slug: DepartmentSlug) => {
    switch (slug) {
      case 'bcn':
        return 'bg-amber-50/80 text-amber-900 border-amber-300/90 font-semibold'
      case 'truyen-thong':
        return 'bg-blue-50/80 text-[#1351D8] border-blue-200/90 font-semibold'
      case 'tu-van':
        return 'bg-emerald-50/80 text-emerald-800 border-emerald-300/90 font-semibold'
      case 'nhan-su':
        return 'bg-purple-50/80 text-purple-800 border-purple-300/90 font-semibold'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 font-semibold'
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER TRANG: QUẢN TRỊ TÀI KHOẢN BAN (KHỚP 100% ẢNH CHỤP) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1351D8] border border-blue-200/80 flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldCheck className="w-6 h-6 text-[#1351D8]" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-[#0B1E48] tracking-tight">
              Quản trị Tài khoản Ban Tuyển Quân
            </h1>
            <p className="text-xs sm:text-[13px] text-slate-500 font-medium leading-relaxed">
              Ban Chủ nhiệm có toàn quyền cấp tài khoản, đổi mật khẩu và phân quyền cho Ban Chủ nhiệm và các Ban chuyên môn.
            </p>
          </div>
        </div>

        {canManageAccounts ? (
          <button
            type="button"
            onClick={() => {
              setIsAddModalOpen(true)
              setAddFeedback(null)
            }}
            className="self-start md:self-center px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-xs hover:shadow transition active:scale-95 cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Cấp tài khoản mới</span>
          </button>
        ) : (
          <div className="self-start md:self-center px-4 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200/90 flex items-center gap-2 shrink-0 shadow-2xs">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Chỉ Ban Chủ nhiệm mới có quyền cấp tài khoản</span>
          </div>
        )}
      </div>

      {/* 2. MAIN TABLE CARD: DANH SÁCH CÁN BỘ TUYỂN QUÂN */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Table Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#1351D8]" />
            <h3 className="text-base font-black text-[#0B1E48]">
              Danh sách Cán bộ Tuyển quân ({filteredAccounts.length})
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên, email, ban..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-full pl-8.5 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#1351D8] transition shadow-2xs"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium hidden md:inline">
              Bao gồm Ban Chủ nhiệm &amp; các Ban chuyên môn
            </span>
          </div>
        </div>

        {/* Mobile View for Phones (< md) */}
        <div className="block md:hidden p-3 space-y-3">
          {filteredAccounts.map((account) => {
            const isPasswordRevealed = revealedPasswords[account.id] || false
            return (
              <div
                key={account.id}
                className="p-3.5 bg-slate-50/70 border border-slate-200/90 rounded-2xl space-y-3 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {account.fullName}
                      </span>
                      {account.isFixed && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          Cố định
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                      {account.roleTitle}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {account.email}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] border shrink-0 ${getDeptBadgeStyle(
                      account.departmentSlug
                    )}`}
                  >
                    {account.departmentName}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-1 rounded-lg border border-slate-200">
                      {isPasswordRevealed ? account.passwordPlain : '••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePasswordReveal(account.id)}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
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
                      className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
                    >
                      {copiedId === `pass-${account.id}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {account.status === 'active' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Hoạt động</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span>Tạm khóa</span>
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
                      className="px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-900 font-bold text-xs transition flex items-center gap-1 shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                      <span>Sửa thông tin</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(account.id, account.fullName)}
                      className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Xóa tài khoản"
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
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/90 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-5">TÀI KHOẢN / NGƯỜI ĐẠI DIỆN</th>
                <th className="py-3 px-4">BAN ĐƯỢC PHÂN CÔNG</th>
                <th className="py-3 px-4">MẬT KHẨU</th>
                <th className="py-3 px-4">TRẠNG THÁI</th>
                <th className="py-3 px-5 text-right">HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.map((account) => {
                const isPasswordRevealed = revealedPasswords[account.id] || false
                return (
                  <tr
                    key={account.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Cột 1: Tên & Email */}
                    <td className="py-3.5 px-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-[13px]">
                            {account.fullName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#1351D8] border border-blue-200/70">
                            {account.roleTitle}
                          </span>
                          {account.isFixed && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              Cố định
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {account.email}
                        </p>
                      </div>
                    </td>

                    {/* Cột 2: Ban phân công (Không có icon trước tên Ban) */}
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
                          className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-md hover:bg-slate-100"
                          title={isPasswordRevealed ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
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
                          className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-md hover:bg-slate-100"
                          title="Sao chép mật khẩu"
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
                          <span>Hoạt động</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>Tạm khóa</span>
                        </span>
                      )}
                    </td>

                    {/* Cột 5: Hành động */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {account.isFixed ? (
                          <span className="text-[11px] text-slate-400 font-semibold px-2 py-1 bg-slate-100 rounded-lg">
                            Khóa bảo vệ BCN
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
                              className="px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-900 font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                              <span>Sửa thông tin</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(account.id, account.fullName)}
                              className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                            Chỉ BCN quản lý
                          </span>
                        )}
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
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shadow-2xs">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0B1E48]">Cấp Tài Khoản Cán Bộ Mới</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Tài khoản được cấp có thể đăng nhập ngay trên trang /login
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
                  Chọn thành viên CLB để tự điền nhanh thông tin:
                </label>
                <select
                  value={selectedMemberCode}
                  onChange={(e) => handleSelectMemberForAccount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-[#1351D8] shadow-2xs cursor-pointer"
                >
                  <option value="">-- Hoặc nhập thủ công bên dưới --</option>
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
                  Họ và tên cán bộ: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1351D8] shadow-2xs"
                />
              </div>

              {/* Email đăng nhập */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  Email đăng nhập VNU / VNU-IS: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ví dụ: 24070622@vnu.edu.vn"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1351D8] shadow-2xs"
                />
              </div>

              {/* MSSV */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Mã số sinh viên (MSSV):</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 24070622"
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1351D8] shadow-2xs"
                />
              </div>

              {/* Ban phân công & Quyền hạn */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Ban được phân công:</label>
                  <select
                    value={newDeptCode}
                    onChange={(e) => setNewDeptCode(e.target.value as DepartmentCode)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1351D8] shadow-2xs"
                  >
                    <option value="B04">Ban Chủ nhiệm</option>
                    <option value="B01">Ban Truyền thông</option>
                    <option value="B02">Ban Tư vấn</option>
                    <option value="B03">Ban Nhân sự</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Phân quyền vai trò:</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1351D8] shadow-2xs"
                  >
                    <option value="member">Thành viên</option>
                    <option value="dept_head">Trưởng / Phó Ban</option>
                    <option value="hr">Ban Nhân sự (HR)</option>
                    <option value="bcn">Ban Chủ nhiệm (BCN)</option>
                  </select>
                </div>
              </div>

              {/* Chức danh hiển thị */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Chức vụ / Chức danh cụ thể:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Phó ban Tư vấn"
                  value={newRoleTitle}
                  onChange={(e) => setNewRoleTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1351D8] shadow-2xs"
                />
              </div>

              {/* Mật khẩu khởi tạo */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">
                    Mật khẩu khởi tạo: <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPassword}
                    className="text-[11px] font-bold text-[#1351D8] hover:underline cursor-pointer"
                  >
                    Tạo ngẫu nhiên
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-[#1351D8] shadow-2xs"
                  />
                </div>
                <span className="block text-[10.5px] text-slate-400">
                  Mật khẩu này sẽ dùng để đăng nhập tại <code>/login</code>.
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Xác Nhận Cấp Tài Khoản</span>
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
              <div className="flex items-center gap-2 text-[#0B1E48]">
                <Edit3 className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black">Sửa Thông Tin Tài Khoản</h3>
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
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cán bộ</span>
                <p className="font-bold text-slate-900 text-sm">{editingAccount.fullName}</p>
                <p className="text-slate-500 font-mono text-[11px]">{editingAccount.email}</p>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Chức danh / Vai trò:</label>
                <input
                  type="text"
                  value={editRoleTitle}
                  onChange={(e) => setEditRoleTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1351D8]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Mật khẩu mới (bỏ trống nếu không đổi):</label>
                <input
                  type="text"
                  placeholder="Nhập mật khẩu mới"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-[#1351D8]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Trạng thái tài khoản:</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'active' | 'suspended')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1351D8]"
                >
                  <option value="active">🟢 Hoạt động bình thường</option>
                  <option value="suspended">🔴 Tạm khóa (không cho phép đăng nhập)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1351D8] hover:bg-[#0B1E48] transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
