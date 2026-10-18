'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useClub } from '@/lib/context/ClubContext'
import { CRITERIA_RULES } from '@/lib/scoring/constants'
import { calculateScoreDelta } from '@/lib/scoring/engine'
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
  const { currentUser, isBCN, isHR } = useAuth()
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

  // Criterion Mode: 'deduct' | 'add' | 'custom'
  const [criterionCategory, setCriterionCategory] = useState<'deduct' | 'add' | 'custom'>('deduct')
  const [criterionCode, setCriterionCode] = useState<string>('T07') // Default to penalty T07
  const [customPoints, setCustomPoints] = useState<number>(-2)
  const [reason, setReason] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [directApply, setDirectApply] = useState(isBCN)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Close dropdown when click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (initialPeriodId) {
      setSelectedPeriodId(initialPeriodId)
    } else if (currentActivePeriodId) {
      setSelectedPeriodId(currentActivePeriodId)
    }
    if (initialMemberCode) {
      setMemberCode(initialMemberCode)
    }
    if (isBCN) {
      setDirectApply(true)
    }
  }, [initialPeriodId, currentActivePeriodId, initialMemberCode, isOpen, isBCN])

  // Lọc danh sách thành viên theo từ khóa tìm kiếm và Ban
  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase()
    return members.filter((m) => {
      const matchDept = deptFilter === 'all' || m.department_slug === deptFilter
      const matchQuery =
        !q ||
        m.full_name.toLowerCase().includes(q) ||
        m.member_code.toLowerCase().includes(q) ||
        m.department_name.toLowerCase().includes(q)
      return matchDept && matchQuery
    })
  }, [members, memberSearch, deptFilter])

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

    const res = createProposal({
      memberCode: selectedMember.member_code,
      criterionCode,
      customPoints: isCustomMode ? customPoints : undefined,
      reason,
      evidenceUrl,
      proposerName: currentUser?.name || 'Cán bộ CLB',
      proposerRole: currentUser?.role || 'member',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#0B1E48]/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-4xl w-full border border-slate-200/90 shadow-2xl relative space-y-4 max-h-[94vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0B1E48] text-white flex items-center justify-center shadow-xs shrink-0">
              <ClipboardList className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10.5px] font-extrabold uppercase tracking-wide bg-blue-50 text-[#1351D8] border border-blue-200/60 mb-0.5">
                <span>{isBCN ? 'Ban Chủ Nhiệm CLB' : 'Ban Nhân Sự CLB'}</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#0F172A] tracking-tight">
                {isBCN ? 'Trung Tâm Chấm Điểm & Phê Duyệt' : 'Đề Xuất Chấm Điểm Thi Đua'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isBCN
                  ? 'Chọn thành viên, xem lịch sử đã cho điểm trong tháng và phê duyệt trực tiếp'
                  : 'Ghi nhận đề xuất cộng/trừ điểm minh bạch chuyển Ban Chủ nhiệm duyệt'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex items-center justify-center cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {feedback ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 max-w-md mx-auto leading-relaxed">
              {feedback.message}
            </h4>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Top Toolbar: Chọn Tháng & Cảnh báo Khóa sổ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 text-xs">Chu kỳ áp dụng:</span>
                <select
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-[#0F172A] focus:outline-none focus:border-[#1351D8] cursor-pointer shadow-2xs"
                >
                  {monthPeriods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.status === 'locked' ? '(Đã khóa)' : '(Đang mở)'}
                    </option>
                  ))}
                </select>
              </div>

              {isLocked ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Chu kỳ đã bị BCN khóa sổ</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
                    <label className="text-xs font-bold text-slate-700">
                      Thành viên nhận điểm:
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Tìm kiếm nhanh theo tên/mã
                    </span>
                  </div>

                  {/* Nút bấm mở popover chọn thành viên */}
                  <div className="relative">
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full bg-slate-50 hover:bg-white border border-slate-200/90 rounded-2xl p-2.5 flex items-center justify-between text-left transition shadow-2xs group focus:border-[#1351D8] focus:ring-2 focus:ring-[#1351D8]/10 cursor-pointer disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-xs shrink-0 ${
                            selectedMember?.avatarBg || 'bg-[#1351D8]'
                          }`}
                        >
                          {selectedMember?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs text-slate-900 truncate">
                            {selectedMember?.full_name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium truncate">
                            {selectedMember?.member_code} • {selectedMember?.department_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-black ${
                            (selectedMember?.current_score || 60) >= 80
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : (selectedMember?.current_score || 60) >= 65
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : (selectedMember?.current_score || 60) >= 60
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
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
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1351D8] focus:bg-white"
                          />
                        </div>

                        {/* Dept Filter Tabs */}
                        <div className="flex gap-1 overflow-x-auto pb-1 shrink-0 no-scrollbar">
                          {DEPARTMENTS.map((d) => (
                            <button
                              key={d.slug}
                              type="button"
                              onClick={() => setDeptFilter(d.slug)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition cursor-pointer ${
                                deptFilter === d.slug
                                  ? 'bg-[#1351D8] text-white shadow-2xs'
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
                                      ? 'bg-blue-50/80 border border-blue-200 text-[#1351D8]'
                                      : 'hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div
                                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-[10px] shrink-0 ${
                                        m.avatarBg || 'bg-[#1351D8]'
                                      }`}
                                    >
                                      {m.full_name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-xs truncate">{m.full_name}</p>
                                      <p className="text-[10px] text-slate-400 truncate">
                                        {m.member_code} • {m.department_name}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                    <span className="text-[11px] font-black">{m.current_score}đ</span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-[#1351D8]" />}
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
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Hồ sơ thành viên
                    </span>
                    {selectedMember?.is_core ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Core Team (Phạt ×2)
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">Thành viên thường</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">Điểm hiện tại:</p>
                      <p className="text-xl font-black text-slate-900 tracking-tight">
                        {selectedMember?.current_score}đ
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-medium">Biến động tháng này:</p>
                      <div className="flex items-center gap-1.5 font-black text-xs justify-end">
                        <span className="text-emerald-600">+{totalAddedThisMonth}đ</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-rose-600">-{totalDeductedThisMonth}đ</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Sổ ghi nhớ lịch sử đã chấm tháng này */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 text-xs">
                      Đã ghi nhận trong {selectedPeriod?.name}:
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-200/80 text-slate-700">
                      {memberHistoryThisMonth.length} lần
                    </span>
                  </div>

                  {memberHistoryThisMonth.length === 0 ? (
                    <div className="p-3 rounded-xl bg-white border border-dashed border-slate-200 text-center space-y-1">
                      <p className="text-[11px] text-slate-600 font-semibold">
                        Chưa có bản ghi điểm nào trong tháng này
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Thành viên đang giữ trọn vẹn 60 điểm xuất phát chuẩn.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {memberHistoryThisMonth.map((rec) => {
                        const isAdd = rec.points >= 0
                        return (
                          <div
                            key={rec.id}
                            className="p-2 rounded-xl bg-white border border-slate-200/80 text-[11px] space-y-1 shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                                  isAdd
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
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
                
                {/* 1. Tabs Chọn Loại Tiêu Chí (Trừ / Cộng / Tự Điền) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Chọn loại điểm muốn ghi nhận:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => handleCategorySwitch('deduct')}
                      className={`py-2 rounded-lg transition cursor-pointer text-center ${
                        criterionCategory === 'deduct'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      Vi phạm (Trừ)
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCategorySwitch('add')}
                      className={`py-2 rounded-lg transition cursor-pointer text-center ${
                        criterionCategory === 'add'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      Cống hiến (Cộng)
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCategorySwitch('custom')}
                      className={`py-2 rounded-lg transition cursor-pointer text-center ${
                        criterionCategory === 'custom'
                          ? 'bg-[#0B1E48] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      Điểm tự cho
                    </button>
                  </div>
                </div>

                {/* 2. Tiêu chí theo loại */}
                {criterionCategory !== 'custom' ? (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {criterionCategory === 'deduct'
                        ? 'Chọn lỗi vi phạm quy định:'
                        : 'Chọn hoạt động đóng góp / khen thưởng:'}
                    </label>

                    <select
                      value={criterionCode}
                      onChange={(e) => handleCriterionChange(e.target.value)}
                      disabled={isLocked}
                      className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#1351D8] focus:ring-2 focus:ring-[#1351D8]/10 transition shadow-2xs cursor-pointer"
                    >
                      {criterionCategory === 'deduct' && (
                        <>
                          <optgroup label="--- Lỗi vi phạm tiêu chuẩn (T01 - T13) ---">
                            {builtinDeductRules.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.code} ({c.base_points}đ): {c.name}
                              </option>
                            ))}
                          </optgroup>
                          {customDeductRules.length > 0 && (
                            <optgroup label="--- Quy định phạt bổ sung của CLB ---">
                              {customDeductRules.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.code} ({c.points}đ): {c.name}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </>
                      )}

                      {criterionCategory === 'add' && (
                        <>
                          <optgroup label="--- Đóng góp & Khen thưởng chuẩn (C01 - C09) ---">
                            {builtinAddRules.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.code} (+{c.base_points}đ): {c.name}
                              </option>
                            ))}
                          </optgroup>
                          {customAddRules.length > 0 && (
                            <optgroup label="--- Điểm cộng bổ sung của CLB ---">
                              {customAddRules.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.code} (+{c.points}đ): {c.name}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </>
                      )}
                    </select>
                  </div>
                ) : (
                  /* 2. Điểm tự cho */
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs">
                        Chế độ tự cho điểm (Tùy biến):
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Điểm âm (-) là phạt, Điểm dương (+) là thưởng
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          disabled={isLocked}
                          value={customPoints}
                          onChange={(e) => setCustomPoints(Number(e.target.value))}
                          placeholder="Nhập số điểm (+ hoặc -)..."
                          className="w-full bg-white border border-slate-200 focus:border-[#1351D8] focus:ring-2 focus:ring-[#1351D8]/10 rounded-xl px-3.5 py-2 text-sm font-black text-[#0F172A] focus:outline-none transition shadow-2xs"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                          điểm
                        </span>
                      </div>
                      <div
                        className={`px-3 py-2 rounded-xl text-xs font-black min-w-[70px] text-center shadow-2xs ${
                          customPoints > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : customPoints < 0
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {customPoints > 0 ? `+${customPoints}đ` : `${customPoints}đ`}
                      </div>
                    </div>

                    {/* Chips nhanh */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-500 mr-0.5">Chọn nhanh:</span>
                      {[-10, -5, -3, -2, -1, 1, 2, 3, 5, 10].map((pt) => (
                        <button
                          key={pt}
                          type="button"
                          onClick={() => setCustomPoints(pt)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer active:scale-95 ${
                            customPoints === pt
                              ? pt > 0
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-rose-600 text-white shadow-2xs'
                              : pt > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {pt > 0 ? `+${pt}` : pt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Lý do / Nội dung chi tiết */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Lý do / Nội dung chi tiết: <span className="text-rose-500">*</span>
                  </label>

                  <textarea
                    required
                    rows={2}
                    disabled={isLocked}
                    placeholder="Ghi rõ đầu việc hoặc lý do cụ thể..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl p-2.5 text-xs font-medium text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#1351D8] focus:ring-2 focus:ring-[#1351D8]/10 transition shadow-2xs disabled:opacity-60"
                  />
                </div>

                {/* 4. Link minh chứng */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Link minh chứng (Drive, ảnh, bài viết - nếu có):
                  </label>
                  <input
                    type="url"
                    disabled={isLocked}
                    placeholder="https://drive.google.com/..."
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-medium text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#1351D8] focus:ring-2 focus:ring-[#1351D8]/10 transition shadow-2xs disabled:opacity-60"
                  />
                </div>

                {/* 5. Tóm tắt Biến Động Điểm Tức Thì */}
                <div className="p-3 rounded-2xl bg-slate-900 text-white space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Trước khi chấm:</span>
                    <span className="font-bold">{selectedMember?.current_score}đ</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Biến động điểm:</span>
                    <span
                      className={`font-black ${
                        previewActualDelta > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {previewActualDelta > 0 ? `+${previewActualDelta}đ` : `${previewActualDelta}đ`}
                      {selectedMember?.is_core && previewActualDelta < 0 && !isCustomMode ? ' (Core Team ×2)' : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800 pt-1.5 text-xs font-bold">
                    <span className="text-amber-400">Dự kiến điểm mới:</span>
                    <span className="text-sm font-black text-white">
                      {previewScoreAfter}đ
                    </span>
                  </div>
                </div>

                {/* 6. Phân quyền BCN / HR & Submit Actions */}
                <div className="space-y-2.5 pt-1">
                  {isBCN && !isLocked && (
                    <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/70 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[#0B1E48] block">Áp dụng trực tiếp (Quyền BCN)</span>
                        <span className="text-[10px] text-slate-600">Cập nhật ngay vào bảng xếp hạng</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={directApply}
                        onChange={(e) => setDirectApply(e.target.checked)}
                        className="w-4 h-4 rounded text-[#1351D8] focus:ring-[#1351D8] bg-white cursor-pointer"
                      />
                    </div>
                  )}

                  {isHR && !isLocked && (
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-[#0B1E48] flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-[#1351D8] flex-shrink-0 mt-0.5" />
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
                        className="px-6 py-2.5 rounded-xl bg-[#0B1E48] hover:bg-[#1351D8] text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
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
