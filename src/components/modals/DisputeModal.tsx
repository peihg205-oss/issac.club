'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  AlertCircle,
  X,
  Search,
  Check,
  ChevronDown,
  User,
  ShieldCheck,
  Building2,
  Clock,
  Briefcase,
  Scale,
  Sparkles,
} from 'lucide-react'
import { useClub } from '@/lib/context/ClubContext'
import { useAuth } from '@/lib/auth/AuthContext'
import type { RosterMember } from '@/lib/clubData'

export interface DisputeModalProps {
  isOpen: boolean
  onClose: () => void
  initialMemberCode?: string
  initialCriterionCode?: string
  initialPoints?: number
  onSuccess?: () => void
}

// Bảng tiêu chí trừ điểm chuẩn hóa kèm phân nhóm rõ ràng
interface DeductCriterionOption {
  code: string
  name: string
  points: number
  group: 'Chuyên cần & Điểm danh' | 'Nhiệm vụ & Sự kiện' | 'Quy chế & Kỷ luật' | 'Khác'
}

const CRITERIA_GROUPS: DeductCriterionOption[] = [
  // 1. Chuyên cần & Điểm danh
  { code: 'T02', name: 'Vắng họp CLB không phép', points: -5, group: 'Chuyên cần & Điểm danh' },
  { code: 'T04', name: 'Đi họp muộn quá 15 phút', points: -1, group: 'Chuyên cần & Điểm danh' },
  { code: 'T01', name: 'Vắng có phép nhưng báo muộn', points: -2, group: 'Chuyên cần & Điểm danh' },
  { code: 'T05', name: 'Không xác nhận thông báo/tin nhắn', points: -1, group: 'Chuyên cần & Điểm danh' },

  // 2. Nhiệm vụ & Sự kiện
  { code: 'T07', name: 'Trễ deadline công việc/nhiệm vụ', points: -2, group: 'Nhiệm vụ & Sự kiện' },
  { code: 'T03', name: 'Không tham gia hoạt động bắt buộc', points: -2, group: 'Nhiệm vụ & Sự kiện' },
  { code: 'T06', name: 'Trang phục/tác phong không đúng chuẩn', points: -2, group: 'Nhiệm vụ & Sự kiện' },

  // 3. Quy chế & Kỷ luật
  { code: 'T08', name: 'Vi phạm kỷ luật/quy chế CLB', points: -5, group: 'Quy chế & Kỷ luật' },
  { code: 'T09', name: 'Vi phạm nghiêm trọng làm ảnh hưởng CLB', points: -10, group: 'Quy chế & Kỷ luật' },
  { code: 'T10', name: 'Tự ý phát ngôn/hành động sai lệch', points: -10, group: 'Quy chế & Kỷ luật' },

  // 4. Mục khác / Tự nhập linh hoạt
  { code: 'OTHER', name: 'Mục khác (Tự nhập nội dung / tiêu chí)', points: -1, group: 'Khác' },
]

export function DisputeModal({
  isOpen,
  onClose,
  initialMemberCode,
  initialCriterionCode = 'T02',
  initialPoints = -5,
  onSuccess,
}: DisputeModalProps) {
  const { members, createDispute, customRules } = useClub()
  const { currentUser } = useAuth()

  // Xác định thành viên mặc định: ưu tiên theo tài khoản đang đăng nhập để tránh gửi nhầm
  const getDefaultMember = (): RosterMember => {
    if (initialMemberCode) {
      const found = members.find((m) => m.member_code === initialMemberCode)
      if (found) return found
    }
    if (currentUser?.memberCode) {
      const current = members.find((m) => m.member_code === currentUser.memberCode)
      if (current) return current
    }
    return members[0] || ({} as RosterMember)
  }

  const [selectedMember, setSelectedMember] = useState<RosterMember>(getDefaultMember)
  const [isMemberPickerOpen, setIsMemberPickerOpen] = useState<boolean>(false)
  const [memberSearch, setMemberSearch] = useState<string>('')
  const [deptFilter, setDeptFilter] = useState<'ALL' | 'bcn' | 'truyen-thong' | 'tu-van' | 'nhan-su'>('ALL')
  const pickerDropdownRef = useRef<HTMLDivElement>(null)

  const [criterion, setCriterion] = useState<string>(initialCriterionCode)
  const [customCriterionName, setCustomCriterionName] = useState<string>('')
  const [isCriterionPickerOpen, setIsCriterionPickerOpen] = useState<boolean>(false)
  const criterionDropdownRef = useRef<HTMLDivElement>(null)

  const [points, setPoints] = useState<number>(initialPoints)
  const [reason, setReason] = useState<string>('')
  const [evidence, setEvidence] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerDropdownRef.current && !pickerDropdownRef.current.contains(e.target as Node)) {
        setIsMemberPickerOpen(false)
      }
      if (criterionDropdownRef.current && !criterionDropdownRef.current.contains(e.target as Node)) {
        setIsCriterionPickerOpen(false)
      }
    }
    if (isMemberPickerOpen || isCriterionPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMemberPickerOpen, isCriterionPickerOpen])

  // Reset form khi modal mở ra
  useEffect(() => {
    if (isOpen) {
      const def = getDefaultMember()
      setSelectedMember(def)
      setCriterion(initialCriterionCode)
      setCustomCriterionName('')
      setPoints(initialPoints)
      setReason('')
      setEvidence('')
      setMemberSearch('')
      setDeptFilter('ALL')
      setIsMemberPickerOpen(false)
      setIsCriterionPickerOpen(false)
      setSubmitting(false)
    }
  }, [isOpen, initialMemberCode, initialCriterionCode, initialPoints])

  // Toàn bộ tiêu chí trừ (gồm tiêu chí chuẩn + tiêu chí bổ sung nếu có)
  const allDeductCriteria = useMemo(() => {
    const list = [...CRITERIA_GROUPS]
    customRules
      .filter((r) => r.type === 'deduct')
      .forEach((r) => {
        if (!list.some((item) => item.code === r.code)) {
          list.push({
            code: r.code,
            name: r.name,
            points: -Math.abs(Number(r.points) || 0),
            group: 'Khác',
          })
        }
      })
    return list
  }, [customRules])

  // Lọc danh sách thành viên theo ô tìm kiếm và Ban
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchDept = deptFilter === 'ALL' || m.department_slug === deptFilter
      const q = memberSearch.toLowerCase().trim()
      const matchSearch =
        !q ||
        m.full_name.toLowerCase().includes(q) ||
        (m.student_id && m.student_id.toLowerCase().includes(q)) ||
        m.member_code.toLowerCase().includes(q) ||
        m.department_name.toLowerCase().includes(q)
      return matchDept && matchSearch
    })
  }, [members, memberSearch, deptFilter])

  // Đổi tiêu chí -> tự động cập nhật số điểm chuẩn
  const handleSelectCriterion = (opt: DeductCriterionOption) => {
    setCriterion(opt.code)
    if (opt.code !== 'OTHER') {
      setPoints(opt.points)
    }
    setIsCriterionPickerOpen(false)
  }

  // Chọn thành viên
  const handleSelectMember = (m: RosterMember) => {
    setSelectedMember(m)
    setIsMemberPickerOpen(false)
    setMemberSearch('')
  }

  // Màu sắc badge phòng ban
  const getDeptBadge = (slug: string) => {
    switch (slug) {
      case 'bcn':
        return 'bg-amber-50 text-amber-700 border-amber-200/80'
      case 'truyen-thong':
        return 'bg-blue-50 text-[#0284C7] border-blue-200/80'
      case 'tu-van':
        return 'bg-pink-50 text-pink-700 border-pink-200/80'
      case 'nhan-su':
        return 'bg-purple-50 text-purple-700 border-purple-200/80'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMember || !selectedMember.member_code) {
      alert('Vui lòng chọn thành viên khiếu nại!')
      return
    }
    if (criterion === 'OTHER' && !customCriterionName.trim()) {
      alert('Vui lòng nhập tên tiêu chí / nội dung bạn muốn khiếu nại ở ô "Tên tiêu chí / Nội dung bị trừ"!')
      return
    }
    if (!reason.trim()) {
      alert('Vui lòng nhập lý do chi tiết & giải trình để Ban Nhân sự và Ban Chủ nhiệm đối soát!')
      return
    }

    setSubmitting(true)
    const finalReason = criterion === 'OTHER'
      ? `[Tiêu chí: ${customCriterionName.trim()}] ${reason.trim()}`
      : reason.trim()

    const res = createDispute({
      memberCode: selectedMember.member_code,
      criterionCode: criterion === 'OTHER' ? 'KHÁC' : criterion,
      pointsContested: Number(points) || 0,
      reason: finalReason,
      evidenceUrl: evidence.trim(),
    })

    setSubmitting(false)
    if (res.success) {
      alert(res.message || 'Gửi đơn khiếu nại thành công! Đơn sẽ được xử lý trong vòng 7 ngày làm việc.')
      if (onSuccess) onSuccess()
      onClose()
    } else {
      alert(res.message)
    }
  }

  const selectedCriterionObj = useMemo(() => {
    if (criterion === 'OTHER') {
      return {
        code: 'KHÁC',
        name: customCriterionName.trim() || 'Mục khác (Tự nhập nội dung / tiêu chí)',
        points: points,
        group: 'Khác' as const,
      }
    }
    return (
      allDeductCriteria.find((c) => c.code === criterion) || allDeductCriteria[0]
    )
  }, [allDeductCriteria, criterion, points, customCriterionName])

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1E48]/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[28px] max-w-[540px] w-full p-5 sm:p-7 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.22)] border border-slate-100/90 space-y-4 sm:space-y-4.5 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto no-scrollbar">
        
        {/* ============================================================== */}
        {/* HEADER: Icon tròn tím + Tiêu đề + Nút Đóng X tròn viền mỏng    */}
        {/* ============================================================== */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-3 sm:gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#FAF5FF] text-[#7026ED] flex items-center justify-center border border-purple-200/50 shadow-2xs shrink-0">
              <AlertCircle className="w-5 h-5 text-[#7026ED]" />
            </div>

            <div>
              <h3 className="text-base sm:text-[17px] font-extrabold text-[#061651] tracking-tight leading-tight">
                Gửi đơn khiếu nại điểm (Q06)
              </h3>
              <p className="text-xs text-[#64748B] font-normal mt-0.5">
                Quy chuẩn bảo vệ quyền lợi thành viên CLB iSSAC
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-slate-300/80 text-slate-400 hover:text-slate-600 hover:border-slate-400 transition flex items-center justify-center cursor-pointer shrink-0"
            title="Đóng modal"
          >
            <X className="w-3.5 h-3.5 stroke-[2]" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* FORM NHẬP THÔNG TIN KHIẾU NẠI THÔNG MINH, TRÁNH NHẦM LẪN       */}
        {/* ============================================================== */}
        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
          
          {/* ============================================================== */}
          {/* FIELD 1: CHỌN THÀNH VIÊN TÌM KIẾM THEO BAN (KHÔNG RỐI MẮT)     */}
          {/* ============================================================== */}
          <div className="relative" ref={pickerDropdownRef}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[13px] font-bold text-[#061651] block">
                Thành viên khiếu nại:
              </label>
              {currentUser?.memberCode === selectedMember?.member_code && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Tài khoản của bạn</span>
                </span>
              )}
            </div>

            {/* Thẻ hiển thị thành viên đang chọn (Trực quan, rõ ràng) */}
            <div
              onClick={() => {
                setIsMemberPickerOpen(!isMemberPickerOpen)
                setIsCriterionPickerOpen(false)
              }}
              className={`w-full p-2.5 sm:p-3 bg-white border rounded-2xl flex items-center justify-between gap-2.5 cursor-pointer transition shadow-2xs hover:border-[#7026ED] ${
                isMemberPickerOpen
                  ? 'border-[#7026ED] ring-2 ring-[#7026ED]/15'
                  : 'border-slate-200 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-[#7026ED] border border-purple-200/80 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                  {selectedMember.full_name ? selectedMember.full_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-[13px] font-bold text-[#061651] truncate">
                      {selectedMember.full_name || 'Chọn thành viên'}
                    </span>
                    {selectedMember.department_name && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getDeptBadge(selectedMember.department_slug)}`}>
                        {selectedMember.department_name}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium block truncate">
                    MSSV: {selectedMember.student_id || selectedMember.member_code || '-'}
                    {selectedMember.position ? ` - ${selectedMember.position}` : ''}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-slate-400 shrink-0">
                <span className="text-[11px] font-bold text-[#7026ED] hidden sm:inline">Thay đổi</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMemberPickerOpen ? 'rotate-180 text-[#7026ED]' : ''}`} />
              </div>
            </div>

            {/* POPOVER CHỌN THÀNH VIÊN */}
            {isMemberPickerOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200/90 shadow-xl z-50 p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Tìm theo tên thành viên hoặc MSSV..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#7026ED] transition"
                  />
                  {memberSearch && (
                    <button
                      type="button"
                      onClick={() => setMemberSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5 text-[11px]">
                  {[
                    { id: 'ALL' as const, label: 'Tất cả (49)' },
                    { id: 'bcn' as const, label: 'BCN (3)' },
                    { id: 'truyen-thong' as const, label: 'Truyền thông (13)' },
                    { id: 'tu-van' as const, label: 'Tư vấn (25)' },
                    { id: 'nhan-su' as const, label: 'Nhân sự (8)' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setDeptFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition cursor-pointer ${
                        deptFilter === tab.id
                          ? 'bg-[#7026ED] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-50">
                  {filteredMembers.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Không tìm thấy thành viên phù hợp
                    </div>
                  ) : (
                    filteredMembers.map((m) => {
                      const isSelected = m.member_code === selectedMember.member_code
                      return (
                        <div
                          key={m.member_code}
                          onClick={() => handleSelectMember(m)}
                          className={`p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition ${
                            isSelected
                              ? 'bg-purple-50/80 border border-purple-200/80'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="min-w-0 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black flex items-center justify-center shrink-0">
                              {m.full_name.charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <span className={`text-xs font-bold truncate block ${isSelected ? 'text-[#7026ED]' : 'text-slate-800'}`}>
                                {m.full_name}
                              </span>
                              <span className="text-[10px] text-slate-500 font-normal block truncate">
                                {m.department_name} - {m.student_id || m.member_code}
                              </span>
                            </div>
                          </div>

                          {isSelected && (
                            <Check className="w-4 h-4 text-[#7026ED] shrink-0" />
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* FIELD 2 & 3: 2 CỘT CÂN ĐỐI - MÃ TIÊU CHÍ VÀ SỐ ĐIỂM KHIẾU NẠI  */}
          {/* ============================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
            {/* Cột trái: Mã tiêu chí bị trừ (Custom Picker sang trọng) */}
            <div className="relative" ref={criterionDropdownRef}>
              <label className="text-[13px] font-bold text-[#061651] mb-1.5 block">
                Mã tiêu chí bị trừ:
              </label>

              {/* Box bấm chọn tiêu chí */}
              <div
                onClick={() => {
                  setIsCriterionPickerOpen(!isCriterionPickerOpen)
                  setIsMemberPickerOpen(false)
                }}
                className={`w-full p-2.5 sm:p-3 bg-white border rounded-2xl flex items-center justify-between gap-2 cursor-pointer transition shadow-2xs hover:border-[#7026ED] ${
                  isCriterionPickerOpen
                    ? 'border-[#7026ED] ring-2 ring-[#7026ED]/15'
                    : 'border-slate-200 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold shrink-0 border ${
                    selectedCriterionObj.code === 'KHÁC'
                      ? 'bg-purple-50 text-[#7026ED] border-purple-200/80'
                      : 'bg-rose-50 text-rose-700 border-rose-200/80'
                  }`}>
                    {selectedCriterionObj.code}
                  </span>
                  <span className="text-xs sm:text-[13px] font-bold text-slate-800 truncate">
                    {selectedCriterionObj.name}
                  </span>
                </div>

                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isCriterionPickerOpen ? 'rotate-180 text-[#7026ED]' : ''}`} />
              </div>

              {/* POPOVER CHỌN TIÊU CHÍ ĐƯỢC PHÂN NHÓM CHUYÊN NGHIỆP */}
              {isCriterionPickerOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-full sm:w-[360px] bg-white rounded-2xl border border-slate-200/90 shadow-xl z-50 p-2.5 max-h-72 overflow-y-auto space-y-3 animate-in fade-in zoom-in-95 duration-150 no-scrollbar">
                  {/* Nhóm 1: Chuyên cần & Điểm danh */}
                  <div>
                    <div className="px-2 py-1 flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>1. Chuyên cần &amp; Điểm danh</span>
                    </div>
                    <div className="space-y-0.5 mt-1">
                      {allDeductCriteria
                        .filter((c) => c.group === 'Chuyên cần & Điểm danh')
                        .map((c) => {
                          const isSel = c.code === criterion
                          return (
                            <div
                              key={c.code}
                              onClick={() => handleSelectCriterion(c)}
                              className={`p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition ${
                                isSel ? 'bg-purple-50 text-[#7026ED] font-bold' : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold border ${isSel ? 'bg-[#7026ED] text-white border-[#7026ED]' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                  {c.code}
                                </span>
                                <span className="text-xs truncate">{c.name}</span>
                              </div>
                              <span className="text-xs font-bold text-rose-600 shrink-0">
                                {c.points}đ
                              </span>
                            </div>
                          )
                        })}
                    </div>
                  </div>

                  {/* Nhóm 2: Nhiệm vụ & Sự kiện */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="px-2 py-1 flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                      <span>2. Nhiệm vụ &amp; Sự kiện</span>
                    </div>
                    <div className="space-y-0.5 mt-1">
                      {allDeductCriteria
                        .filter((c) => c.group === 'Nhiệm vụ & Sự kiện')
                        .map((c) => {
                          const isSel = c.code === criterion
                          return (
                            <div
                              key={c.code}
                              onClick={() => handleSelectCriterion(c)}
                              className={`p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition ${
                                isSel ? 'bg-purple-50 text-[#7026ED] font-bold' : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold border ${isSel ? 'bg-[#7026ED] text-white border-[#7026ED]' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                  {c.code}
                                </span>
                                <span className="text-xs truncate">{c.name}</span>
                              </div>
                              <span className="text-xs font-bold text-rose-600 shrink-0">
                                {c.points}đ
                              </span>
                            </div>
                          )
                        })}
                    </div>
                  </div>

                  {/* Nhóm 3: Quy chế & Kỷ luật */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="px-2 py-1 flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <Scale className="w-3.5 h-3.5 text-rose-500" />
                      <span>3. Quy chế &amp; Kỷ luật</span>
                    </div>
                    <div className="space-y-0.5 mt-1">
                      {allDeductCriteria
                        .filter((c) => c.group === 'Quy chế & Kỷ luật')
                        .map((c) => {
                          const isSel = c.code === criterion
                          return (
                            <div
                              key={c.code}
                              onClick={() => handleSelectCriterion(c)}
                              className={`p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition ${
                                isSel ? 'bg-purple-50 text-[#7026ED] font-bold' : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold border ${isSel ? 'bg-[#7026ED] text-white border-[#7026ED]' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                  {c.code}
                                </span>
                                <span className="text-xs truncate">{c.name}</span>
                              </div>
                              <span className="text-xs font-bold text-rose-600 shrink-0">
                                {c.points}đ
                              </span>
                            </div>
                          )
                        })}
                    </div>
                  </div>

                  {/* Nhóm 4: Tiêu chí khác & Tự do khiếu nại */}
                  {allDeductCriteria.filter((c) => c.group === 'Khác').length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="px-2 py-1 flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                        <span>4. Tiêu chí khác &amp; Tự nhập</span>
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {allDeductCriteria
                          .filter((c) => c.group === 'Khác')
                          .map((c) => {
                            const isSel = c.code === criterion
                            const isOther = c.code === 'OTHER'
                            return (
                              <div
                                key={c.code}
                                onClick={() => handleSelectCriterion(c)}
                                className={`p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition ${
                                  isSel ? 'bg-purple-50 text-[#7026ED] font-bold' : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold border ${isSel ? 'bg-[#7026ED] text-white border-[#7026ED]' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                                    {isOther ? 'KHÁC' : c.code}
                                  </span>
                                  <span className="text-xs truncate">{c.name}</span>
                                </div>
                                <span className="text-xs font-bold text-purple-600 shrink-0">
                                  {isOther ? 'Tự nhập' : `${c.points}đ`}
                                </span>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cột phải: Số điểm khiếu nại (Tự động đồng bộ số điểm) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-bold text-[#061651] block">
                  Số điểm khiếu nại:
                </label>
                <span className="text-[10px] text-slate-500 font-normal">
                  (Điểm trừ gốc)
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-[13px] font-bold text-rose-600 focus:outline-none focus:border-[#7026ED] focus:ring-2 focus:ring-[#7026ED]/15 transition shadow-2xs pr-10"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                  điểm
                </span>
              </div>
            </div>

            {/* Ô TỰ NHẬP TIÊU CHÍ KHÁC KHI CHỌN 'MỤC KHÁC' */}
            {criterion === 'OTHER' && (
              <div className="sm:col-span-2 p-3 bg-purple-50/70 border border-purple-200/90 rounded-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[12.5px] font-bold text-[#061651] block flex items-center gap-1.5">
                    <span>Tên tiêu chí / Nội dung bị trừ cần khiếu nại:</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-purple-700 font-semibold bg-white/80 border border-purple-200/80 px-2 py-0.5 rounded-lg shadow-2xs">
                    Tự do thêm thắt
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Trừ nhầm điểm hoạt động GenFest, trừ nhầm buổi trực phòng máy..."
                  value={customCriterionName}
                  onChange={(e) => setCustomCriterionName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-purple-200 rounded-xl text-xs sm:text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7026ED] focus:ring-2 focus:ring-[#7026ED]/15 transition shadow-2xs font-medium"
                />
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* FIELD 4: LÝ DO CHI TIẾT & GIẢI TRÌNH                           */}
          {/* ============================================================== */}
          <div>
            <label className="text-[13px] font-bold text-[#061651] mb-1.5 block">
              Lý do chi tiết &amp; Giải trình:
            </label>
            <textarea
              rows={3}
              required
              placeholder="Nêu rõ hoàn cảnh, lý do bất khả kháng hoặc minh chứng đã nộp..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7026ED] focus:ring-2 focus:ring-[#7026ED]/15 transition shadow-2xs resize-y min-h-[85px]"
            />
          </div>

          {/* ============================================================== */}
          {/* FIELD 5: ĐƯỜNG DẪN MINH CHỨNG                                  */}
          {/* ============================================================== */}
          <div>
            <label className="text-[13px] font-bold text-[#061651] mb-1.5 block">
              Đường dẫn minh chứng (Google Drive / Ảnh):
            </label>
            <input
              type="url"
              placeholder="https://drive.google.com/..."
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7026ED] focus:ring-2 focus:ring-[#7026ED]/15 transition shadow-2xs"
            />
          </div>

          {/* ============================================================== */}
          {/* THẺ TÓM TẮT XÁC NHẬN (TRÁNH GỬI NHẦM 100%)                    */}
          {/* ============================================================== */}
          <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-200/70 text-xs text-purple-950 flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-[#7026ED] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span>Đang tạo đơn khiếu nại cho: </span>
              <strong className="text-[#061651] font-bold">{selectedMember.full_name || '...'}</strong>
              <span className="text-slate-500"> ({selectedMember.department_name || ''})</span>
              <span> - Tiêu chí: </span>
              <strong className="text-purple-900 font-bold">[{selectedCriterionObj.code}] {selectedCriterionObj.name}</strong>
              <span className="text-rose-600 font-black"> ({points} điểm)</span>.
            </div>
          </div>

          {/* ============================================================== */}
          {/* FOOTER ACTION BUTTONS: HUỶ & GỬI KHIẾU NẠI                     */}
          {/* ============================================================== */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-[13px] transition active:scale-95 cursor-pointer shadow-2xs"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-2xl text-xs sm:text-[13px] font-bold text-white bg-[#7026ED] hover:bg-[#621fde] shadow-sm shadow-[#7026ED]/25 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Đang gửi...' : 'Gửi khiếu nại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
