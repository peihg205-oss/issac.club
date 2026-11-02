'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useClub } from '@/lib/context/ClubContext'
import { CRITERIA_RULES } from '@/lib/scoring/constants'
import { calculateScoreDelta } from '@/lib/scoring/engine'
import { getMemberAvatarUrl } from '@/lib/clubData'
import type { RuleCode } from '@/types/database'
import {
  X,
  CheckCircle2,
  ShieldAlert,
  ClipboardList,
  Lock,
  Search,
  ChevronDown,
  Check,
  Pencil,
  Plus,
  Minus,
} from 'lucide-react'

interface ScoreModalProps {
  isOpen: boolean
  onClose: () => void
  initialPeriodId?: string
  initialMemberCode?: string
}

const DEPARTMENTS = [
  { slug: 'all', name: 'Tất cả' },
  { slug: 'bcn', name: 'Ban Chủ nhiệm' },
  { slug: 'truyen-thong', name: 'Truyền thông' },
  { slug: 'tu-van', name: 'Tư vấn' },
  { slug: 'nhan-su', name: 'Nhân sự' },
]

export function ScoreModal({
  isOpen,
  onClose,
  initialPeriodId,
  initialMemberCode,
}: ScoreModalProps) {
  const { currentUser, isBCN, isHR, canScoreMember, getAllowedMembers } = useAuth()
  const {
    members,
    createProposal,
    periods,
    currentActivePeriodId,
    customRules,
    proposals,
  } = useClub()

  const [selectedPeriodId, setSelectedPeriodId] = useState(
    initialPeriodId || currentActivePeriodId || 'month-2026-10'
  )
  const [memberCode, setMemberCode] = useState(initialMemberCode || members[0]?.member_code || '')
  
  // Member Search & Filter
  const [memberSearch, setMemberSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Criterion Mode & Search Popover (Ảnh 2 & 3)
  const [criterionCategory, setCriterionCategory] = useState<'deduct' | 'add' | 'custom'>('deduct')
  const [criterionCode, setCriterionCode] = useState<string>('T07') // Default to penalty T07
  const [isCriterionDropdownOpen, setIsCriterionDropdownOpen] = useState(false)
  const [criterionSearch, setCriterionSearch] = useState('')
  const criterionDropdownRef = useRef<HTMLDivElement>(null)

  const [customPoints, setCustomPoints] = useState<number>(-2)
  const [reason, setReason] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [directApply, setDirectApply] = useState(isBCN)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Close dropdowns when click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (criterionDropdownRef.current && !criterionDropdownRef.current.contains(event.target as Node)) {
        setIsCriterionDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Lọc danh sách thành viên mà người dùng có quyền chấm điểm theo vai trò/Ban
  const allowedMembers = useMemo(() => {
    return getAllowedMembers(members)
  }, [getAllowedMembers, members])

  useEffect(() => {
    if (initialPeriodId) {
      setSelectedPeriodId(initialPeriodId)
    } else if (currentActivePeriodId) {
      setSelectedPeriodId(currentActivePeriodId)
    }
    if (initialMemberCode) {
      setMemberCode(initialMemberCode)
    } else if (allowedMembers.length > 0 && !allowedMembers.some((m) => m.member_code === memberCode)) {
      setMemberCode(allowedMembers[0].member_code)
    }
    if (isBCN) {
      setDirectApply(true)
    }
  }, [initialPeriodId, currentActivePeriodId, initialMemberCode, isOpen, isBCN, allowedMembers, memberCode])

  // Lọc danh sách thành viên theo từ khóa tìm kiếm và Ban
  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase()
    return allowedMembers.filter((m) => {
      const matchDept = deptFilter === 'all' || m.department_slug === deptFilter
      const matchQuery =
        !q ||
        m.full_name.toLowerCase().includes(q) ||
        m.member_code.toLowerCase().includes(q) ||
        m.department_name.toLowerCase().includes(q)
      return matchDept && matchQuery
    })
  }, [allowedMembers, memberSearch, deptFilter])

  // Danh sách Ban hiển thị theo phân quyền
  const availableDepts = useMemo(() => {
    if (currentUser?.departmentCode === 'B01') {
      return [{ slug: 'truyen-thong', name: 'Ban Truyền thông (Ban của bạn)' }]
    }
    if (currentUser?.departmentCode === 'B02') {
      return [{ slug: 'tu-van', name: 'Ban Tư vấn (Ban của bạn)' }]
    }
    return DEPARTMENTS
  }, [currentUser?.departmentCode])

  if (!isOpen) return null

  // Danh sách các chu kỳ tháng
  const monthPeriods = periods.filter((p) => p.scope === 'month')
  const selectedPeriod =
    periods.find((p) => p.id === selectedPeriodId) || monthPeriods[0] || periods[0]
  const isLocked = selectedPeriod?.status === 'locked'

  const selectedMember = members.find((m) => m.member_code === memberCode) || members[0]

  // ⭐ NHẬT KÝ ĐÃ CHẤM THÁNG NÀY CHO THÀNH VIÊN ĐANG CHỌN (Khắc phục hoàn toàn việc quên đã cho gì)
  const memberHistoryThisMonth = proposals
    .filter(
      (p) =>
        p.memberCode === selectedMember?.member_code &&
        (p.periodId === selectedPeriodId || (!p.periodId && selectedPeriodId === currentActivePeriodId))
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const totalAddedThisMonth = memberHistoryThisMonth
    .filter((p) => p.points > 0 && p.status === 'approved')
    .reduce((sum, p) => sum + p.points, 0)

  const totalDeductedThisMonth = Math.abs(
    memberHistoryThisMonth
      .filter((p) => p.points < 0 && p.status === 'approved')
      .reduce((sum, p) => sum + p.points, 0)
  )

  const pendingCountThisMonth = memberHistoryThisMonth.filter(
    (p) => p.status === 'pending_bcn'
  ).length

  // Rules list by category
  const builtinDeductRules = Object.values(CRITERIA_RULES).filter((c) => c.type === 'deduct')
  const builtinAddRules = Object.values(CRITERIA_RULES).filter((c) => c.type === 'add')
  const customDeductRules = customRules.filter((c) => c.type === 'deduct')
  const customAddRules = customRules.filter((c) => c.type === 'add')

  const builtinRule = CRITERIA_RULES[criterionCode as RuleCode]
  const customRule = customRules.find((r) => r.code === criterionCode)

  const handleCategorySwitch = (cat: 'deduct' | 'add' | 'custom') => {
    setCriterionCategory(cat)
    setIsCriterionDropdownOpen(false)
    setCriterionSearch('')
    if (cat === 'deduct') {
      setCriterionCode('T07')
      setCustomPoints(-2)
    } else if (cat === 'add') {
      setCriterionCode('C06')
      setCustomPoints(1)
    } else {
      setCriterionCode('CUSTOM_POINT_DEDUCT')
      setCustomPoints(-2)
    }
  }

  // Lọc danh sách tiêu chí theo từ khóa tìm kiếm (Mã hoặc Tên) - Tính toán thuần túy không dùng Hook sau early return
  const q = criterionSearch.trim().toLowerCase()
  const isDeductCriteria = criterionCategory === 'deduct'
  const builtinList = isDeductCriteria ? builtinDeductRules : builtinAddRules
  const customList = isDeductCriteria ? customDeductRules : customAddRules

  const matchFilter = (r: { code: string; name: string }) => {
    if (!q) return true
    return r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)
  }

  const filteredCriteria = {
    builtin: builtinList.filter(matchFilter),
    custom: customList.filter(matchFilter),
  }

  const handleCriterionChange = (newCode: string) => {
    setCriterionCode(newCode)
    const bRule = CRITERIA_RULES[newCode as RuleCode]
    const cRule = customRules.find((r) => r.code === newCode)
    if (bRule) {
      const defaultPt = bRule.type === 'deduct' ? -Math.abs(bRule.base_points) : Math.abs(bRule.base_points)
      setCustomPoints(defaultPt)
    } else if (cRule) {
      const pts = typeof cRule.points === 'number' ? cRule.points : parseFloat(String(cRule.points)) || 0
      setCustomPoints(cRule.type === 'deduct' ? -Math.abs(pts) : Math.abs(pts))
    }
  }

  const isCustomMode = criterionCategory === 'custom' || criterionCode.startsWith('CUSTOM_POINT_')

  let previewActualDelta = 0
  let previewScoreAfter = selectedMember?.current_score || 60

  if (isCustomMode) {
    const pts = typeof customPoints === 'number' && !isNaN(customPoints) ? customPoints : 0
    previewActualDelta = pts
    previewScoreAfter = Math.max(0, Math.min(100, (selectedMember?.current_score || 60) + previewActualDelta))
  } else if (builtinRule) {
    const preview = calculateScoreDelta({
      ruleCode: criterionCode as RuleCode,
      basePoints: builtinRule.base_points,
      isCoreAtEvent: selectedMember?.is_core || false,
      currentScore: selectedMember?.current_score || 60,
    })
    previewActualDelta = preview.actualDelta
    previewScoreAfter = preview.scoreAfter
  } else if (customRule) {
    const basePts =
      typeof customRule.points === 'number'
        ? customRule.points
        : parseFloat(String(customRule.points)) || 0
    const isCoreMultiplier = !!customRule.coreMultiplierApplies && basePts < 0
    const multiplier = selectedMember?.is_core && isCoreMultiplier ? 2 : 1
    const nominal = basePts * multiplier
    previewScoreAfter = Math.max(0, Math.min(100, (selectedMember?.current_score || 60) + nominal))
    previewActualDelta = previewScoreAfter - (selectedMember?.current_score || 60)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) return

    if (isLocked) {
      setFeedback({
        type: 'error',
        message: `Chu kỳ ${selectedPeriod?.name} đã bị Ban Chủ nhiệm khóa sổ. Không thể chấm điểm!`,
      })
      return
    }

    const permCheck = canScoreMember(selectedMember)
    if (!permCheck.allowed) {
      setFeedback({
        type: 'error',
        message: permCheck.reason || 'Bạn không có quyền cho điểm thành viên này!',
      })
      return
    }

    const res = createProposal({
      memberCode: selectedMember.member_code,
      criterionCode: isCustomMode
        ? (customPoints >= 0 ? 'CUSTOM_POINT_ADD' : 'CUSTOM_POINT_DEDUCT')
        : criterionCode,
      customPoints: isCustomMode ? customPoints : undefined,
      reason,
      evidenceUrl,
      proposerName: currentUser?.name || 'Cán bộ CLB',
      proposerRole: currentUser?.role || 'member',
      proposerDepartmentCode: currentUser?.departmentCode,
      directApply: isBCN ? directApply : false,
      periodId: selectedPeriodId,
    })

    if (res.success) {
      const isDirect = isBCN && directApply
      const detailMsg = isDirect
        ? `✅ ĐÃ ÁP DỤNG TRỰC TIẾP: ${res.message} Điểm số trên bảng xếp hạng và hồ sơ đã được cập nhật thành công!`
        : `⏳ ĐÃ LƯU ĐỀ XUẤT: ${res.message} Bản ghi đã được chuyển vào hàng đợi chờ Ban Chủ Nhiệm phê duyệt.`
      setFeedback({ type: 'success', message: detailMsg })
      setTimeout(() => {
        setFeedback(null)
        onClose()
        setReason('')
        setEvidenceUrl('')
      }, 2000)
    } else {
      setFeedback({ type: 'error', message: res.message })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#0B1E48]/55 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-4xl w-full border border-slate-200/90 shadow-2xl relative space-y-4 max-h-[94vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0284C7] to-[#0369A1] text-white flex items-center justify-center shadow-sm shadow-[#0284C7]/25 shrink-0">
              <ClipboardList className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#061651] tracking-tight">
                {isBCN ? 'Trung Tâm Chấm Điểm & Phê Duyệt' : 'Đề Xuất Chấm Điểm Thi Đua'}
              </h3>
              <p className="text-[11px] text-[#64748B] font-medium">
                {currentUser?.departmentCode === 'B01'
                  ? 'Ban Truyền thông có quyền cho điểm các thành viên thuộc Ban Truyền thông'
                  : currentUser?.departmentCode === 'B02'
                  ? 'Ban Tư vấn có quyền cho điểm các thành viên thuộc Ban Tư vấn'
                  : isHR || currentUser?.departmentCode === 'B03'
                  ? 'Ban Nhân sự có quyền cho điểm mọi người ở tất cả các ban'
                  : 'Chọn thành viên, xem lịch sử đã cho điểm trong tháng và phê duyệt trực tiếp'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {feedback ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h4 className="text-sm font-bold text-[#061651] max-w-md mx-auto leading-relaxed">
              {feedback.message}
            </h4>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            
            {/* Top Toolbar: Chọn Tháng (Ảnh 1) & Cảnh báo Khóa sổ - Bo tròn cân đối */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/75">
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-[#061651] text-xs sm:text-sm">Chu kỳ áp dụng:</span>
                <div className="relative">
                  <select
                    value={selectedPeriodId}
                    onChange={(e) => setSelectedPeriodId(e.target.value)}
                    className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-full pl-4 pr-9 py-2 text-xs sm:text-sm font-bold text-[#061651] focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/15 cursor-pointer shadow-2xs appearance-none transition"
                  >
                    {monthPeriods.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.status === 'locked' ? '(Đã khóa)' : '(Đang mở)'}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {isLocked ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Chu kỳ đã bị BCN khóa sổ</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Sổ điểm đang mở ghi nhận</span>
                </div>
              )}
            </div>

            {/* Layout 2 Cột Chống Nhầm & Ghi Nhớ Lịch Sử */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* CỘT TRÁI (5 Cols): CHỌN THÀNH VIÊN & XEM LỊCH SỬ ĐÃ CHO THÁNG NÀY */}
              <div className="lg:col-span-5 space-y-3.5">
                
                {/* 1. Bộ chọn thành viên thông minh có tìm kiếm & lọc Ban */}
                <div className="space-y-1.5" ref={dropdownRef}>
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-bold text-[#061651]">
                      Thành viên nhận điểm:
                    </label>
                    <span className="text-[11px] text-[#64748B] font-medium">
                      Tìm kiếm nhanh theo tên/mã
                    </span>
                  </div>

                  {/* Nút bấm mở popover chọn thành viên */}
                  <div className="relative">
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full bg-white hover:bg-slate-50/70 border border-slate-200/90 hover:border-sky-300 rounded-2xl p-2.5 flex items-center justify-between text-left transition shadow-2xs group focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/15 cursor-pointer disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {getMemberAvatarUrl(selectedMember) ? (
                          <img
                            src={getMemberAvatarUrl(selectedMember)!}
                            alt={selectedMember.full_name}
                            className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0284C7] to-[#0369A1] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {selectedMember?.full_name?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-extrabold text-sm text-[#061651] truncate">
                            {selectedMember?.full_name}
                          </p>
                          <p className="text-xs text-[#64748B] font-medium truncate">
                            {selectedMember?.member_code} - {selectedMember?.department_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold bg-slate-100 text-[#061651] border border-slate-200/70">
                          {selectedMember?.current_score || 60}đ
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
                      </div>
                    </button>

                    {/* Popover Menu: Tìm kiếm + Lọc Ban + Danh sách */}
                    {isDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 space-y-2 max-h-72 flex flex-col animate-fadeIn">
                        {/* Search Input */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Gõ tên hoặc mã SV..."
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            autoFocus
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#061651] placeholder-slate-400 focus:outline-none focus:border-[#0284C7] focus:bg-white"
                          />
                        </div>

                        {/* Dept Filter Tabs */}
                        <div className="flex gap-1 overflow-x-auto pb-1 shrink-0 no-scrollbar">
                          {availableDepts.map((d) => (
                            <button
                              key={d.slug}
                              type="button"
                              onClick={() => setDeptFilter(d.slug)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition cursor-pointer ${
                                deptFilter === d.slug
                                  ? 'bg-[#0284C7] text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {d.name}
                            </button>
                          ))}
                        </div>

                        {/* List Items */}
                        <div className="overflow-y-auto space-y-1 flex-1 pr-1">
                          {filteredMembers.length === 0 ? (
                            <div className="py-6 text-center text-slate-400 text-xs">
                              Không tìm thấy thành viên phù hợp
                            </div>
                          ) : (
                            filteredMembers.map((m) => {
                              const isSelected = m.member_code === memberCode
                              return (
                                <button
                                  key={m.member_code}
                                  type="button"
                                  onClick={() => {
                                    setMemberCode(m.member_code)
                                    setIsDropdownOpen(false)
                                  }}
                                  className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition cursor-pointer ${
                                    isSelected
                                      ? 'bg-sky-50/80 border border-sky-200 text-[#0284C7]'
                                      : 'hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {getMemberAvatarUrl(m) ? (
                                      <img
                                        src={getMemberAvatarUrl(m)!}
                                        alt={m.full_name}
                                        className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                                      />
                                    ) : (
                                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0284C7] to-[#0369A1] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                                        {m.full_name.charAt(0)}
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <p className="font-bold text-xs truncate">{m.full_name}</p>
                                      <p className="text-[10px] text-slate-400 truncate">
                                        {m.member_code} - {m.department_name}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                    <span className="text-[11px] font-black">{m.current_score}đ</span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-[#0284C7]" />}
                                  </div>
                                </button>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Thẻ hồ sơ thành viên đang chọn */}
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/75 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Hồ sơ thành viên
                    </span>
                    {selectedMember?.is_core ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                        Core Team (Phạt ×2)
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">Thành viên thường</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">Điểm hiện tại:</p>
                      <p className="text-2xl font-black text-[#061651] tracking-tight">
                        {selectedMember?.current_score}<span className="text-xs font-bold text-slate-400 ml-0.5">đ</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-medium mb-1">Biến động tháng này:</p>
                      <div className="flex items-center gap-1.5 font-bold text-xs justify-end">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px]">
                          +{totalAddedThisMonth}đ
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 text-[11px]">
                          -{totalDeductedThisMonth}đ
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Sổ ghi nhớ lịch sử đã chấm tháng này */}
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/75 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#061651] text-xs">
                      Đã ghi nhận trong {selectedPeriod?.name}:
                    </span>
                    <span className="text-[10.5px] px-2.5 py-0.5 rounded-full font-bold bg-slate-200/80 text-slate-700">
                      {memberHistoryThisMonth.length} lần
                    </span>
                  </div>

                  {memberHistoryThisMonth.length === 0 ? (
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200/70 text-center space-y-1 shadow-2xs">
                      <p className="text-[11px] text-slate-600 font-semibold">
                        Chưa có bản ghi điểm nào trong tháng này
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Thành viên đang giữ trọn vẹn {selectedMember?.current_score || 60} điểm xuất phát trong chu kỳ.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {memberHistoryThisMonth.map((rec) => {
                        const isAdd = rec.points >= 0
                        return (
                          <div
                            key={rec.id}
                            className="p-2.5 rounded-xl bg-white border border-slate-200/70 text-[11px] space-y-1 shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  isAdd
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200/80'
                                }`}
                              >
                                {isAdd ? `+${rec.points}đ` : `${rec.points}đ`} ({rec.criterionCode})
                              </span>
                              <span className="text-[9.5px] text-slate-400 font-medium">
                                {rec.createdAt}
                              </span>
                            </div>
                            <p className="text-[10.5px] font-bold text-slate-800 line-clamp-1">
                              {rec.reason || rec.criterionName}
                            </p>
                            <div className="flex items-center justify-between text-[9.5px] text-slate-400 border-t border-slate-100 pt-1">
                              <span>Bởi: {rec.proposedBy}</span>
                              <span
                                className={
                                  rec.status === 'approved'
                                    ? 'text-emerald-600 font-semibold'
                                    : 'text-amber-600 font-semibold'
                                }
                              >
                                {rec.status === 'approved' ? '✓ Đã duyệt' : '⏳ Chờ duyệt'}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* CỘT PHẢI (7 Cols): THAO TÁC CHO ĐIỂM DỄ SỬ DỤNG - KHÔNG BỊ RỐI */}
              <div className="lg:col-span-7 space-y-3.5">
                
                {/* 1. Tabs Chọn Loại Tiêu Chí (Trừ / Cộng / Tự Điền) - Bo tròn viên thuốc, chữ rõ ràng */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#061651] mb-2">
                    Chọn loại điểm muốn ghi nhận:
                  </label>
                  <div className="grid grid-cols-3 gap-2 w-full">
                    {[
                      {
                        id: 'deduct' as const,
                        label: 'Vi phạm (Trừ)',
                        activeColor: 'bg-rose-600 text-white font-bold shadow-sm shadow-rose-600/20',
                        inactiveColor: 'bg-rose-50/70 text-rose-700 hover:bg-rose-100/80 font-semibold border border-rose-200/60',
                      },
                      {
                        id: 'add' as const,
                        label: 'Cống hiến (Cộng)',
                        activeColor: 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-600/20',
                        inactiveColor: 'bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100/80 font-semibold border border-emerald-200/60',
                      },
                      {
                        id: 'custom' as const,
                        label: 'Tự nhập điểm',
                        activeColor: 'bg-[#0284C7] text-white font-bold shadow-sm shadow-[#0284C7]/20',
                        inactiveColor: 'bg-sky-50/70 text-[#0284C7] hover:bg-sky-100/80 font-semibold border border-sky-200/60',
                      },
                    ].map((tab) => {
                      const isSelected = criterionCategory === tab.id
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => handleCategorySwitch(tab.id)}
                          className={`w-full py-2.5 px-3 sm:px-4 rounded-full text-xs sm:text-sm transition-all flex items-center justify-center cursor-pointer text-center whitespace-nowrap font-bold ${
                            isSelected ? tab.activeColor : tab.inactiveColor
                          }`}
                        >
                          {tab.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 2. Tiêu chí theo loại - Thay thế native select bằng Custom Dropdown Popover cao cấp (Ảnh 2 & Ảnh 3) */}
                {criterionCategory !== 'custom' ? (
                  <div className="space-y-1.5" ref={criterionDropdownRef}>
                    <label className="block text-xs sm:text-sm font-bold text-[#061651]">
                      {criterionCategory === 'deduct'
                        ? 'Chọn lỗi vi phạm quy định:'
                        : 'Chọn hoạt động đóng góp / khen thưởng:'}
                    </label>

                    <div className="relative">
                      {/* Nút bấm trigger (Ảnh 2) - Bo tròn viên thuốc rounded-full, đồng bộ cân đối với Ảnh 1 */}
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => setIsCriterionDropdownOpen(!isCriterionDropdownOpen)}
                        className={`w-full bg-white hover:bg-slate-50/70 border rounded-full px-4 py-2.5 flex items-center justify-between text-left transition shadow-2xs group cursor-pointer disabled:opacity-50 ${
                          isCriterionDropdownOpen
                            ? 'border-[#0284C7] ring-2 ring-[#0284C7]/15'
                            : 'border-slate-200/90 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-white font-extrabold text-xs shrink-0 ${
                              criterionCategory === 'deduct' ? 'bg-rose-600' : 'bg-emerald-600'
                            }`}
                          >
                            {builtinRule?.code || customRule?.code}
                          </span>
                          <span className="font-bold text-xs sm:text-sm text-[#061651] truncate">
                            {builtinRule
                              ? `${builtinRule.name} (${criterionCategory === 'deduct' ? '-' : '+'}${Math.abs(builtinRule.base_points)}đ)`
                              : customRule
                              ? `${customRule.name} (${criterionCategory === 'deduct' ? '-' : '+'}${Math.abs(Number(customRule.points) || 0)}đ)`
                              : 'Chọn tiêu chí...'}
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0 transition-transform ${
                            isCriterionDropdownOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {/* Popover Menu Tiêu Chí (Ảnh 3) - Cực kỳ rõ ràng, phân nhóm, có tìm kiếm, không bao giờ nhầm lẫn */}
                      {isCriterionDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2.5 space-y-2 max-h-80 flex flex-col animate-fadeIn">
                          {/* Ô tìm kiếm nhanh */}
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                            <input
                              type="text"
                              placeholder={
                                criterionCategory === 'deduct'
                                  ? 'Tìm lỗi (gõ T01, T07, deadline, muộn, vắng...)...'
                                  : 'Tìm hoạt động (gõ C01, khen thưởng, bài viết...)...'
                              }
                              value={criterionSearch}
                              onChange={(e) => setCriterionSearch(e.target.value)}
                              autoFocus
                              className="w-full bg-slate-50 border border-slate-200 rounded-full pl-8 pr-3 py-1.5 text-xs text-[#061651] placeholder-slate-400 focus:outline-none focus:border-[#0284C7] focus:bg-white transition"
                            />
                          </div>

                          {/* Danh sách tiêu chí chia 2 nhóm trực quan */}
                          <div className="overflow-y-auto space-y-2.5 pr-1 max-h-60 custom-scrollbar">
                            {/* Nhóm 1: Tiêu chuẩn */}
                            {filteredCriteria.builtin.length > 0 && (
                              <div className="space-y-1">
                                <div className="px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  {criterionCategory === 'deduct'
                                    ? 'Lỗi vi phạm tiêu chuẩn (T01 - T13)'
                                    : 'Đóng góp & Khen thưởng chuẩn (C01 - C09)'}
                                </div>
                                <div className="space-y-1">
                                  {filteredCriteria.builtin.map((c) => {
                                    const isSelected = criterionCode === c.code
                                    const pts = criterionCategory === 'deduct' ? -c.base_points : c.base_points
                                    return (
                                      <button
                                        key={c.code}
                                        type="button"
                                        onClick={() => {
                                          handleCriterionChange(c.code)
                                          setIsCriterionDropdownOpen(false)
                                          setCriterionSearch('')
                                        }}
                                        className={`w-full p-2 rounded-xl text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                                          isSelected
                                            ? criterionCategory === 'deduct'
                                              ? 'bg-rose-50 text-rose-900 border border-rose-200'
                                              : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                                            : 'hover:bg-slate-50 text-slate-700'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span
                                            className={`px-2 py-0.5 rounded-lg text-[10.5px] font-black shrink-0 ${
                                              isSelected
                                                ? criterionCategory === 'deduct'
                                                  ? 'bg-rose-600 text-white'
                                                  : 'bg-emerald-600 text-white'
                                                : 'bg-slate-100 text-slate-700 font-bold'
                                            }`}
                                          >
                                            {c.code}
                                          </span>
                                          <span className="font-semibold text-xs truncate">{c.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <span
                                            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                                              criterionCategory === 'deduct'
                                                ? 'bg-rose-100 text-rose-700'
                                                : 'bg-emerald-100 text-emerald-700'
                                            }`}
                                          >
                                            {pts > 0 ? `+${pts}đ` : `${pts}đ`}
                                          </span>
                                          {isSelected && (
                                            <Check
                                              className={`w-4 h-4 ${
                                                criterionCategory === 'deduct' ? 'text-rose-600' : 'text-emerald-600'
                                              }`}
                                            />
                                          )}
                                        </div>
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Nhóm 2: Bổ sung CLB */}
                            {filteredCriteria.custom.length > 0 && (
                              <div className="space-y-1 pt-1.5 border-t border-slate-100">
                                <div className="px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  {criterionCategory === 'deduct'
                                    ? 'Quy định phạt bổ sung của CLB'
                                    : 'Điểm cộng bổ sung của CLB'}
                                </div>
                                <div className="space-y-1">
                                  {filteredCriteria.custom.map((c) => {
                                    const isSelected = criterionCode === c.code
                                    const numPts = typeof c.points === 'number' ? c.points : parseFloat(String(c.points)) || 0
                                    const pts = criterionCategory === 'deduct' ? -Math.abs(numPts) : Math.abs(numPts)
                                    return (
                                      <button
                                        key={c.code}
                                        type="button"
                                        onClick={() => {
                                          handleCriterionChange(c.code)
                                          setIsCriterionDropdownOpen(false)
                                          setCriterionSearch('')
                                        }}
                                        className={`w-full p-2 rounded-xl text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                                          isSelected
                                            ? criterionCategory === 'deduct'
                                              ? 'bg-rose-50 text-rose-900 border border-rose-200'
                                              : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                                            : 'hover:bg-slate-50 text-slate-700'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span
                                            className={`px-2 py-0.5 rounded-lg text-[10.5px] font-black shrink-0 ${
                                              isSelected
                                                ? criterionCategory === 'deduct'
                                                  ? 'bg-rose-600 text-white'
                                                  : 'bg-emerald-600 text-white'
                                                : 'bg-slate-100 text-slate-700 font-bold'
                                            }`}
                                          >
                                            {c.code}
                                          </span>
                                          <span className="font-semibold text-xs truncate">{c.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <span
                                            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                                              criterionCategory === 'deduct'
                                                ? 'bg-rose-100 text-rose-700'
                                                : 'bg-emerald-100 text-emerald-700'
                                            }`}
                                          >
                                            {pts > 0 ? `+${pts}đ` : `${pts}đ`}
                                          </span>
                                          {isSelected && (
                                            <Check
                                              className={`w-4 h-4 ${
                                                criterionCategory === 'deduct' ? 'text-rose-600' : 'text-emerald-600'
                                              }`}
                                            />
                                          )}
                                        </div>
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {filteredCriteria.builtin.length === 0 && filteredCriteria.custom.length === 0 && (
                              <div className="py-6 text-center text-xs text-slate-400">
                                Không tìm thấy tiêu chí nào với từ khóa &quot;{criterionSearch}&quot;
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Thẻ hiển thị tóm tắt mức điểm của quy định đang chọn */}
                    <div
                      className={`p-2.5 rounded-2xl border flex items-center justify-between text-xs sm:text-sm transition ${
                        criterionCategory === 'deduct'
                          ? 'bg-rose-50/70 border-rose-200/70 text-rose-900'
                          : 'bg-emerald-50/70 border-emerald-200/70 text-emerald-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-white font-extrabold text-xs shrink-0 ${
                            criterionCategory === 'deduct' ? 'bg-rose-600' : 'bg-emerald-600'
                          }`}
                        >
                          {builtinRule?.code || customRule?.code}
                        </span>
                        <span className="font-bold text-xs sm:text-sm truncate">
                          {builtinRule?.name || customRule?.name}
                        </span>
                      </div>
                      <span
                        className={`font-black text-xs sm:text-sm shrink-0 pl-2 ${
                          criterionCategory === 'deduct' ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {previewActualDelta > 0 ? `+${previewActualDelta}đ` : `${previewActualDelta}đ`}
                        {selectedMember?.is_core && previewActualDelta < 0 ? ' (Core ×2)' : ''}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* 2. Điểm tự cho (Tăng giảm điểm tùy biến - Tối ưu bố cục gọn gàng, hài hòa) */
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-2.5">
                    
                    {/* Hàng 1: Header + Chuyển nhanh chế độ Phạt (-) / Thưởng (+) Segmented gọn gàng */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Pencil className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                        <span className="font-bold text-[#061651] text-xs">
                          Chế độ tự cho điểm:
                        </span>
                      </div>

                      {/* Segmented Pill: Phạt (-) / Thưởng (+) */}
                      <div className="flex items-center bg-slate-200/75 p-0.5 rounded-xl shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const currentAbs = Math.abs(customPoints) || 2
                            setCustomPoints(-currentAbs)
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            customPoints < 0
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-rose-700'
                          }`}
                        >
                          <Minus className="w-3 h-3 stroke-[2.5]" />
                          <span>Phạt (-)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const currentAbs = Math.abs(customPoints) || 2
                            setCustomPoints(currentAbs)
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            customPoints > 0
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-emerald-700'
                          }`}
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                          <span>Thưởng (+)</span>
                        </button>
                      </div>
                    </div>

                    {/* Hàng 2: Bộ điều khiển Stepper trực quan, cao cấp & cân xứng */}
                    <div className="flex items-center gap-2">
                      {/* Nút Giảm 1 điểm (-) */}
                      <button
                        type="button"
                        onClick={() => setCustomPoints((prev) => (prev || 0) - 1)}
                        disabled={isLocked}
                        title="Giảm 1 điểm"
                        className="w-10 h-10 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-300 flex items-center justify-center font-black transition active:scale-95 shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4 stroke-[2.5]" />
                      </button>

                      {/* Ô nhập số điểm */}
                      <div className="relative flex-1 flex items-center">
                        <input
                          type="number"
                          disabled={isLocked}
                          value={customPoints === 0 ? '' : customPoints}
                          onChange={(e) => {
                            const val = e.target.value
                            setCustomPoints(val === '' ? 0 : Number(val))
                          }}
                          placeholder="Nhập số điểm (+ thưởng, - phạt)..."
                          className="w-full bg-white border border-slate-200/90 focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10 rounded-xl pl-3.5 pr-20 py-2 text-sm font-bold text-[#061651] placeholder:text-slate-400 placeholder:font-normal focus:outline-none transition shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-2.5 flex items-center pointer-events-none">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-xs font-black transition ${
                              customPoints > 0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                : customPoints < 0
                                ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                                : 'bg-slate-100 text-slate-500 border border-slate-200/80'
                            }`}
                          >
                            {customPoints > 0 ? `+${customPoints}đ` : customPoints < 0 ? `${customPoints}đ` : '0đ'}
                          </span>
                        </div>
                      </div>

                      {/* Nút Tăng 1 điểm (+) */}
                      <button
                        type="button"
                        onClick={() => setCustomPoints((prev) => (prev || 0) + 1)}
                        disabled={isLocked}
                        title="Tăng 1 điểm"
                        className="w-10 h-10 rounded-xl bg-white hover:bg-emerald-50 text-emerald-600 border border-slate-200 hover:border-emerald-300 flex items-center justify-center font-black transition active:scale-95 shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>

                    {/* Hàng 3: Hai nhóm chọn nhanh đối xứng: Trừ điểm (Giảm) & Cộng điểm (Tăng) */}
                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-0.5">
                        <span className="text-rose-600 font-bold">● Giảm nhanh:</span>
                        <span className="text-emerald-600 font-bold">● Tăng nhanh:</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* 4 nút Trừ điểm */}
                        <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
                          {[-1, -2, -5, -10].map((pt) => {
                            const isSelected = customPoints === pt
                            return (
                              <button
                                key={pt}
                                type="button"
                                onClick={() => setCustomPoints(pt)}
                                className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center active:scale-95 ${
                                  isSelected
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-white hover:bg-rose-50 text-rose-700 border border-rose-200/70'
                                }`}
                              >
                                {pt}đ
                              </button>
                            )
                          })}
                        </div>

                        {/* 4 nút Cộng điểm */}
                        <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
                          {[1, 2, 5, 10].map((pt) => {
                            const isSelected = customPoints === pt
                            return (
                              <button
                                key={pt}
                                type="button"
                                onClick={() => setCustomPoints(pt)}
                                className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center active:scale-95 ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                                }`}
                              >
                                +{pt}đ
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* 3. Lý do / Nội dung chi tiết */}
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-[#061651] block">
                    Lý do / Nội dung chi tiết: <span className="text-rose-500">*</span>
                  </label>

                  <textarea
                    required
                    rows={2}
                    disabled={isLocked}
                    placeholder="Ghi rõ đầu việc hoặc lý do cụ thể..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-white hover:border-slate-300 focus:bg-white border border-slate-200/90 rounded-2xl p-3 text-xs sm:text-sm font-medium text-[#061651] placeholder:text-slate-400 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/15 transition shadow-2xs disabled:opacity-60"
                  />
                </div>

                {/* 4. Link minh chứng */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#061651] mb-1">
                    Link minh chứng (Drive, ảnh, bài viết - nếu có):
                  </label>
                  <input
                    type="url"
                    disabled={isLocked}
                    placeholder="https://drive.google.com/..."
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    className="w-full bg-white hover:border-slate-300 focus:bg-white border border-slate-200/90 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#061651] placeholder:text-slate-400 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/15 transition shadow-2xs disabled:opacity-60"
                  />
                </div>

                {/* 5. Tóm tắt Biến Động Điểm Tức Thì (Thẻ 3 cột hiện đại) */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-50/50 via-slate-50 to-indigo-50/30 border border-slate-200/80 shadow-2xs">
                  <div className="grid grid-cols-3 divide-x divide-slate-200/80 text-center">
                    <div className="px-2">
                      <p className="text-xs font-semibold text-slate-500">Trước khi chấm</p>
                      <p className="text-base font-extrabold text-[#061651] mt-0.5">
                        {selectedMember?.current_score}đ
                      </p>
                    </div>

                    <div className="px-2">
                      <p className="text-xs font-semibold text-slate-500">Biến động điểm</p>
                      <p
                        className={`text-base font-extrabold mt-0.5 ${
                          previewActualDelta > 0
                            ? 'text-emerald-600'
                            : previewActualDelta < 0
                            ? 'text-rose-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {previewActualDelta > 0 ? `+${previewActualDelta}đ` : previewActualDelta < 0 ? `${previewActualDelta}đ` : '0đ'}
                        {selectedMember?.is_core && previewActualDelta < 0 && !isCustomMode ? ' (×2)' : ''}
                      </p>
                    </div>

                    <div className="px-2">
                      <p className="text-xs font-bold text-[#0284C7]">Dự kiến điểm mới</p>
                      <p className="text-lg font-black text-[#0284C7] mt-0.5">
                        {previewScoreAfter}đ
                      </p>
                    </div>
                  </div>
                </div>

                {/* 6. Phân quyền BCN / HR & Submit Actions */}
                <div className="space-y-2.5 pt-1">
                  {isBCN && !isLocked && (
                    <label className="p-3 rounded-2xl bg-white border border-slate-200/80 hover:border-sky-300 flex items-center justify-between cursor-pointer transition shadow-2xs group">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${directApply ? 'bg-sky-50 text-[#0284C7]' : 'bg-slate-100 text-slate-400'}`}>
                          <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        <div>
                          <span className="font-bold text-xs sm:text-sm text-[#061651] block group-hover:text-[#0284C7] transition">
                            Áp dụng trực tiếp (Quyền BCN)
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            Cập nhật ngay vào bảng xếp hạng
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={directApply}
                        onChange={(e) => setDirectApply(e.target.checked)}
                        className="w-4 h-4 rounded text-[#0284C7] accent-[#0284C7] cursor-pointer"
                      />
                    </label>
                  )}

                  {isHR && !isLocked && (
                    <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>Đề xuất sẽ được gửi vào hàng đợi chờ Ban Chủ nhiệm phê duyệt.</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                    >
                      Hủy bỏ
                    </button>

                    {isLocked ? (
                      <button
                        type="button"
                        disabled
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-200 text-slate-500 cursor-not-allowed"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Tháng Này Đã Khóa Sổ Điểm</span>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#0369A1] hover:from-[#0369A1] hover:to-[#075985] text-white font-bold text-xs shadow-md shadow-[#0284C7]/25 transition-all active:scale-95 cursor-pointer"
                      >
                        {isBCN
                          ? directApply
                            ? 'Áp Dụng Trực Tiếp (BCN)'
                            : 'Đưa Vào Hàng Đợi Duyệt'
                          : 'Gửi BCN Phê Duyệt'}
                      </button>
                    )}
                  </div>
                </div>

              </div>

            </div>

          </form>
        )}
      </div>
    </div>
  )
}
