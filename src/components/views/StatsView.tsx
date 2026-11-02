'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useClub } from '@/lib/context/ClubContext'
import { useAuth } from '@/lib/auth/AuthContext'
import { useLanguage } from '@/lib/context/LanguageContext'
import { type RosterMember, getMemberAvatarUrl } from '@/lib/clubData'
import { ComparisonChart } from '@/components/dashboard/ComparisonChart'
import {
  calculatePeriodLeaderboard,
  type PeriodScope,
} from '@/lib/periodData'
import {
  Trophy,
  Crown,
  Medal,
  Search,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  Sparkles,
  Award,
  AlertTriangle,
  Shield,
  BarChart3,
  ArrowRight,
  Calendar,
  CheckCircle2,
  X,
  Layers,
  Lock,
  Unlock,
} from 'lucide-react'

interface StatsViewProps {
  onSelectMember?: (member: RosterMember) => void
}

export function StatsView({ onSelectMember }: StatsViewProps) {
  const {
    members,
    periods,
    currentActivePeriodId,
    setCurrentActivePeriodId,
    customPeriodScores,
    lockMonthPeriod,
    unlockMonthPeriod,
  } = useClub()
  const { currentUser, isBCN } = useAuth()
  const { language } = useLanguage()

  // 1. Navigation Subtab: Leaderboard | Podium Top 3 | Analytics Comparison
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'podium' | 'analytics'>('leaderboard')

  // 2. Tra cứu điểm theo chu kỳ (Tháng / Quý / Năm)
  const [selectedScope, setSelectedScope] = useState<PeriodScope>('month')
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    () => currentActivePeriodId || 'month-2026-10'
  )

  // Mascot động & lời thoại tương tác
  const [isMascotCheering, setIsMascotCheering] = useState<boolean>(false)
  const [mascotQuoteIdx, setMascotQuoteIdx] = useState<number>(0)
  const [showMascotBubble, setShowMascotBubble] = useState<boolean>(false)
  const mascotBubbleTimeout = useRef<NodeJS.Timeout | null>(null)

  const mascotQuotes = language === 'vi' ? [
    'Mục tiêu Top 3 nhé!',
    'Vinh danh Top 1 thi đua!',
    'Bứt phá điểm rèn luyện nào!',
  ] : [
    'Aim for the Top 3!',
    'Honoring the Top performers!',
    'Keep boosting your activity score!',
  ]

  const handleMascotClick = () => {
    setIsMascotCheering(true)
    setShowMascotBubble(true)
    setMascotQuoteIdx((prev) => (prev + 1) % mascotQuotes.length)
    setTimeout(() => setIsMascotCheering(false), 850)

    if (mascotBubbleTimeout.current) clearTimeout(mascotBubbleTimeout.current)
    mascotBubbleTimeout.current = setTimeout(() => {
      setShowMascotBubble(false)
    }, 3000)
  }

  // Tự động đồng bộ kỳ được chọn khi chu kỳ kích hoạt hiện tại thay đổi
  useEffect(() => {
    if (currentActivePeriodId && selectedScope === 'month') {
      setSelectedPeriodId(currentActivePeriodId)
    }
  }, [currentActivePeriodId, selectedScope])

  // 3. Search & Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDept, setSelectedDept] = useState<string>('all')
  const [selectedRating, setSelectedRating] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const pageSize = 12

  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Danh sách các chu kỳ thuộc phạm vi đang chọn (Tháng / Quý / Năm) lấy trực tiếp từ Context
  const availablePeriodsInScope = useMemo(() => {
    return periods.filter((p) => p.scope === selectedScope)
  }, [periods, selectedScope])

  // Lấy chu kỳ hiện tại
  const currentPeriodObj = useMemo(() => {
    return periods.find((p) => p.id === selectedPeriodId) || periods[0]
  }, [periods, selectedPeriodId])

  // Tính toán bảng xếp hạng của 48 thành viên theo chu kỳ được chọn
  const periodRankings = useMemo(() => {
    return calculatePeriodLeaderboard(selectedPeriodId, members, periods, customPeriodScores)
  }, [selectedPeriodId, members, periods, customPeriodScores])

  // Top 3 thành viên dẫn đầu của chu kỳ đang chọn
  const top1 = periodRankings[0]
  const top2 = periodRankings[1]
  const top3 = periodRankings[2]

  // Top 3 thành viên điểm cao nhất không tính Core Team
  const top3NonCoreMembers = useMemo(() => {
    return periodRankings.filter((item) => !item.member.is_core).slice(0, 3)
  }, [periodRankings])

  const top3NonCoreCodes = useMemo(() => {
    return new Set(top3NonCoreMembers.map((item) => item.member.member_code))
  }, [top3NonCoreMembers])

  // Lọc danh sách thành viên theo Search, Ban, Xếp loại
  const filtered = useMemo(() => {
    return periodRankings.filter((item) => {
      const m = item.member
      const matchSearch =
        m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.member_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.student_id && m.student_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.class_name && m.class_name.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchDept = selectedDept === 'all' || m.department_slug === selectedDept

      let matchRating = true
      if (selectedRating === 'core_only') matchRating = !!m.is_core
      else if (selectedRating === 'top3_non_core') matchRating = top3NonCoreCodes.has(m.member_code)
      else if (selectedRating === 'excellent') matchRating = item.finalScore >= 85
      else if (selectedRating === 'good') matchRating = item.finalScore >= 70 && item.finalScore < 85
      else if (selectedRating === 'pass') matchRating = item.finalScore >= 55 && item.finalScore < 70
      else if (selectedRating === 'warning') matchRating = item.finalScore < 55

      return matchSearch && matchDept && matchRating
    })
  }, [periodRankings, searchQuery, selectedDept, selectedRating, top3NonCoreCodes])

  // Counts cho subtabs theo ban và chips tiêu chí
  const bcnCount = useMemo(() => periodRankings.filter((i) => i.member.department_slug === 'bcn').length, [periodRankings])
  const ttCount = useMemo(() => periodRankings.filter((i) => i.member.department_slug === 'truyen-thong').length, [periodRankings])
  const tvCount = useMemo(() => periodRankings.filter((i) => i.member.department_slug === 'tu-van').length, [periodRankings])
  const nsCount = useMemo(() => periodRankings.filter((i) => i.member.department_slug === 'nhan-su').length, [periodRankings])

  const coreCount = useMemo(() => periodRankings.filter((i) => i.member.is_core).length, [periodRankings])
  const excellentCount = useMemo(() => periodRankings.filter((i) => i.finalScore >= 85).length, [periodRankings])
  const goodCount = useMemo(() => periodRankings.filter((i) => i.finalScore >= 70 && i.finalScore < 85).length, [periodRankings])
  const warningCount = useMemo(() => periodRankings.filter((i) => i.finalScore < 55).length, [periodRankings])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginatedMembers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Helper xuất CSV theo chu kỳ đang chọn
  const handleExportCSV = () => {
    const headers = [
      'Thu_hang',
      'Ma_TV',
      'MSSV',
      'Ho_va_ten',
      'Ban',
      'Chuc_vu',
      'Diem_xuat_phat',
      'Bien_dong_trong_ky',
      'Tong_diem_ky',
      'Xep_loai',
      'Chu_ky',
    ]

    const rows = filtered.map((item) => {
      const m = item.member
      return [
        item.rankInPeriod,
        m.member_code,
        m.student_id || '-',
        `"${m.full_name}"`,
        `"${m.department_name}"`,
        `"${m.position}"`,
        item.baseScore,
        item.earnedDelta >= 0 ? `+${item.earnedDelta}` : `${item.earnedDelta}`,
        item.finalScore,
        `"${item.ratingLevel}"`,
        `"${currentPeriodObj.name}"`,
      ]
    })

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    const sanitizedName = currentPeriodObj.shortLabel.replace(/[^a-zA-Z0-9]/g, '_')
    link.setAttribute('download', `Bang_Xep_Hang_CLB_${sanitizedName}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Khóa / Mở khóa chu kỳ trực tiếp bởi Ban Chủ nhiệm
  const handleToggleLock = () => {
    if (!isBCN) return
    const actor = currentUser?.name || 'Ban Chủ nhiệm'
    if (currentPeriodObj.status === 'locked') {
      unlockMonthPeriod(currentPeriodObj.id, actor)
      setToastMessage(`Đã mở khóa chu kỳ ${currentPeriodObj.name}. Cho phép cập nhật điểm.`)
    } else {
      lockMonthPeriod(currentPeriodObj.id, actor)
      setToastMessage(`Đã khóa sổ chính thức chu kỳ ${currentPeriodObj.name}. Điểm số được bảo lưu an toàn.`)
    }
  }

  // Helper badge rating chuẩn thiết kế dự án
  const getRatingBadge = (score: number) => {
    if (score >= 85) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] inline-flex items-center gap-1 whitespace-nowrap">
          <span>{language === 'vi' ? 'Rất tích cực (≥85đ)' : 'Very Active (≥85)'}</span>
        </span>
      )
    }
    if (score >= 70) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-[#0284C7] border border-sky-200 inline-flex items-center gap-1 whitespace-nowrap">
          <span>{language === 'vi' ? 'Tích cực (70 - 84đ)' : 'Active (70 - 84)'}</span>
        </span>
      )
    }
    if (score >= 55) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] inline-flex items-center gap-1 whitespace-nowrap">
          <span>{language === 'vi' ? 'Đạt yêu cầu (55 - 69đ)' : 'Pass (55 - 69)'}</span>
        </span>
      )
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] inline-flex items-center gap-1 whitespace-nowrap">
        <span>{language === 'vi' ? 'Cần cố gắng (<55đ)' : 'Needs Improvement (<55)'}</span>
      </span>
    )
  }

  // Helper màu Ban chuẩn đồng bộ
  const getDeptBadgeStyle = (slug?: string) => {
    switch (slug) {
      case 'bcn':
        return 'bg-amber-50 text-amber-700 border border-amber-200/80'
      case 'truyen-thong':
        return 'bg-blue-50 text-[#0284C7] border border-blue-200/80'
      case 'tu-van':
        return 'bg-pink-50 text-pink-700 border border-pink-200/80'
      case 'nhan-su':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200/80'
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Header Bar chuẩn nhận diện dự án CLB iSSAC - Đồng bộ 100% với MembersView & HistoryView */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3.5 sm:gap-4.5">
          <div>
            <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#061651] tracking-tight leading-tight">
              {language === 'vi' ? 'Bảng xếp hạng đóng góp iSSACer' : 'iSSACer Contribution Leaderboard'}
            </h1>
            <p className="text-xs sm:text-[13px] text-[#64748B] mt-1 font-normal">
              {language === 'vi'
                ? 'Bảng xếp hạng thi đua rèn luyện theo thời gian thực.'
                : 'Real-time performance and extracurricular ranking.'}
            </p>
          </div>

          {/* Mascot Kỳ lân với lời động viên & bóng thoại bên cạnh chuẩn nhận diện các trang */}
          <div
            onClick={handleMascotClick}
            className="relative group cursor-pointer inline-flex items-center shrink-0 select-none"
          >
            <img
              src="/unicorn-mascot.png"
              alt="iSSAC Leaderboard Unicorn Mascot"
              className={`w-12 h-14 sm:w-14 sm:h-16 object-contain drop-shadow-[0_4px_12px_rgba(2,132,199,0.22)] transition-all duration-300 ${
                isMascotCheering
                  ? 'animate-mascot-pop drop-shadow-[0_8px_20px_rgba(2,132,199,0.45)]'
                  : 'animate-mascot-fly hover:scale-115 hover:rotate-3'
              }`}
            />

            {/* Bubble tooltip nằm bên cạnh mascot chuẩn style như MembersView và DashboardView */}
            <div
              className={`absolute left-full ml-2.5 sm:ml-3 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#0369A1] text-white text-[11px] font-bold shadow-md whitespace-nowrap z-40 transition-all duration-200 flex items-center border border-white/25 pointer-events-none ${
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

        {/* Sub Navigation Tabs dạng Segmented Control chuẩn dự án */}
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80 overflow-x-auto max-w-full flex-shrink-0 self-start md:self-center">
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-[#0284C7] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70 font-medium'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{language === 'vi' ? 'Bảng Xếp Hạng Toàn CLB' : 'Full Club Leaderboard'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('podium')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'podium'
                ? 'bg-[#0284C7] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70 font-medium'
            }`}
          >
            <Crown className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{language === 'vi' ? 'Bục Vinh Danh Top 3' : 'Top 3 Podium'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-[#0284C7] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70 font-medium'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{language === 'vi' ? 'Đối Sánh & Thống Kê' : 'Analytics & Trends'}</span>
          </button>
        </div>
      </div>

      {/* 2. THANH CÔNG CỤ TRA CỨU & THAO TÁC CHU KỲ (NỀN VÀNG PASTEL #FFFBEC KHÔNG VIỀN MỀM MẠI) */}
      <div className="bg-[#FFFBEC] rounded-2xl p-3.5 sm:p-4 shadow-[0_2px_12px_rgba(217,119,6,0.06)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Vế trái: 3 Tab chọn phạm vi (Theo Tháng, Theo Quý, Cả Năm) dạng Segmented Control tông ấm */}
          <div className="inline-flex items-center p-1 bg-amber-100/60 rounded-xl border border-amber-200/60 self-start md:self-auto shadow-2xs">
            {/* Nút: Theo Tháng */}
            <button
              type="button"
              onClick={() => {
                setSelectedScope('month')
                setSelectedPeriodId(currentActivePeriodId || periods.find((p) => p.scope === 'month' && p.isCurrent)?.id || 'month-2026-10')
                setCurrentPage(1)
              }}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 ${
                selectedScope === 'month'
                  ? 'bg-white text-amber-950 font-bold shadow-xs border border-amber-200/70'
                  : 'text-amber-900/70 hover:text-amber-950 hover:bg-white/40'
              }`}
            >
              <Calendar className={`w-3.5 h-3.5 ${selectedScope === 'month' ? 'text-amber-600' : 'text-amber-700/60'}`} />
              <span>{language === 'vi' ? 'Theo Tháng' : 'Monthly'}</span>
            </button>

            {/* Nút: Theo Quý */}
            <button
              type="button"
              onClick={() => {
                setSelectedScope('quarter')
                setSelectedPeriodId(periods.find((p) => p.scope === 'quarter' && p.isCurrent)?.id || 'quarter-2026-q4')
                setCurrentPage(1)
              }}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 ${
                selectedScope === 'quarter'
                  ? 'bg-white text-amber-950 font-bold shadow-xs border border-amber-200/70'
                  : 'text-amber-900/70 hover:text-amber-950 hover:bg-white/40'
              }`}
            >
              <Layers className={`w-3.5 h-3.5 ${selectedScope === 'quarter' ? 'text-amber-600' : 'text-amber-700/60'}`} />
              <span>{language === 'vi' ? 'Theo Quý' : 'Quarterly'}</span>
            </button>

            {/* Nút: Cả Năm */}
            <button
              type="button"
              onClick={() => {
                setSelectedScope('year')
                setSelectedPeriodId(periods.find((p) => p.scope === 'year' && p.isCurrent)?.id || 'year-2026-2027')
                setCurrentPage(1)
              }}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 ${
                selectedScope === 'year'
                  ? 'bg-white text-amber-950 font-bold shadow-xs border border-amber-200/70'
                  : 'text-amber-900/70 hover:text-amber-950 hover:bg-white/40'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>{language === 'vi' ? 'Cả Năm' : 'Annually'}</span>
            </button>
          </div>

          {/* Vế phải: Dropdown chọn kỳ + Huy hiệu trạng thái + Nút Khóa sổ/Mở khóa */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Dropdown chọn kỳ cụ thể */}
            <div className="relative min-w-[200px] sm:min-w-[230px]">
              <select
                value={selectedPeriodId}
                onChange={(e) => {
                  const newId = e.target.value
                  setSelectedPeriodId(newId)
                  if (selectedScope === 'month') {
                    setCurrentActivePeriodId(newId)
                  }
                  setCurrentPage(1)
                }}
                className="w-full pl-3.5 pr-8 py-2 bg-white/95 hover:bg-white border border-amber-200/90 focus:border-amber-400 focus:ring-2 focus:ring-amber-300/30 rounded-xl text-xs font-bold text-amber-950 focus:outline-none transition shadow-2xs cursor-pointer appearance-none"
              >
                {availablePeriodsInScope.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.status === 'locked' ? '(Đã khóa)' : (p.id === currentActivePeriodId || p.isCurrent) ? '(Hiện tại)' : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-amber-700/70">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
            </div>

            {/* Trạng thái chu kỳ */}
            {currentPeriodObj.status === 'locked' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-stone-100/90 text-stone-700 border border-stone-300/70 shadow-2xs whitespace-nowrap">
                <Lock className="w-3.5 h-3.5 text-stone-600" />
                <span>{language === 'vi' ? 'Đã khóa' : 'Locked'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-800 border border-emerald-300/60 shadow-2xs whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{language === 'vi' ? 'Đang mở' : 'Open'}</span>
              </span>
            )}

            {/* Quyền Ban Chủ nhiệm: Nút Khóa sổ / Mở khóa */}
            {isBCN && (
              <button
                type="button"
                onClick={handleToggleLock}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition active:scale-95 whitespace-nowrap cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 ${
                  currentPeriodObj.status === 'locked'
                    ? 'border border-amber-300/80 bg-white text-amber-900 hover:bg-amber-50'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                }`}
                title={
                  currentPeriodObj.status === 'locked'
                    ? 'Mở khóa lại chu kỳ'
                    : 'Khóa sổ điểm chu kỳ'
                }
              >
                {currentPeriodObj.status === 'locked' ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-amber-700" />
                    <span>{language === 'vi' ? 'Mở khóa' : 'Unlock'}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-white" />
                    <span>{language === 'vi' ? 'Khóa sổ' : 'Lock Period'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Top 3 Podium (Cập nhật động theo kỳ được chọn, nền trắng chuẩn giao diện) */}
      {(activeTab === 'podium' || activeTab === 'leaderboard') && top1 && top2 && top3 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0284C7] block">
              {language === 'vi' ? 'Vinh danh gương mặt xuất sắc dẫn đầu' : 'Honoring top leading members'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#061651] tracking-tight">
              {language === 'vi' ? 'Bục Vinh Danh Top 3' : 'Top 3 Podium'} - {currentPeriodObj.name}
            </h2>
            <p className="text-xs text-[#64748B] font-normal">
              {language === 'vi'
                ? '3 thành viên có thành tích rèn luyện và đóng góp phong trào thi đua cao nhất'
                : 'Top 3 members with highest training achievements and contributions'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-end max-w-4xl mx-auto pt-3">
            {/* Rank 2 (Hạng 2 - Trái) */}
            <div
              onClick={() => onSelectMember && onSelectMember(top2.member)}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 text-center space-y-3 shadow-xs hover:shadow-md transition cursor-pointer relative order-2 md:order-1 hover:-translate-y-1"
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-700 text-[10px] font-black flex items-center gap-1 shadow-2xs">
                <Medal className="w-3.5 h-3.5 text-slate-500" />
                <span>{language === 'vi' ? 'HẠNG 2' : 'RANK 2'}</span>
              </div>

              <div className="w-16 h-16 rounded-full bg-slate-100 ring-2 ring-slate-200/80 text-slate-800 font-black text-xl flex items-center justify-center mx-auto shadow-inner overflow-hidden">
                {getMemberAvatarUrl(top2.member) ? (
                  <img
                    src={getMemberAvatarUrl(top2.member)!}
                    alt={top2.member.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  top2.member.full_name.charAt(0)
                )}
              </div>

              <div>
                <h3 className="font-bold text-sm text-[#061651] truncate">
                  {top2.member.full_name}
                </h3>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                  {top2.member.department_name} - {top2.member.position}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                  {top2.earnedDelta >= 0 ? `+${top2.earnedDelta}đ trong kỳ` : `${top2.earnedDelta}đ`}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {selectedScope === 'quarter' ? (language === 'vi' ? 'Điểm TB Quý:' : 'Quarterly Avg:') : (language === 'vi' ? 'Điểm thi đua:' : 'Total Score:')}
                </span>
                <span className="text-xl font-black text-[#0284C7]">
                  {top2.finalScore}đ
                </span>
              </div>
            </div>

            {/* Rank 1 (Hạng 1 - Chính giữa - Cao nhất) */}
            <div
              onClick={() => onSelectMember && onSelectMember(top1.member)}
              className="bg-gradient-to-b from-[#FFFDF5] to-white rounded-2xl border-2 border-amber-300 p-6 text-center space-y-3.5 shadow-md hover:shadow-xl transition cursor-pointer relative order-1 md:order-2 md:-translate-y-2 hover:-translate-y-3"
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#FFCD38] to-amber-500 text-[#0F172A] text-xs font-black flex items-center gap-1.5 shadow-md">
                <Crown className="w-4 h-4 text-[#0F172A]" />
                <span>{language === 'vi' ? 'HẠNG 1' : 'RANK 1'}</span>
              </div>

              {/* Glowing Avatar */}
              <div className="relative inline-block mt-1">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFCD38] to-[#F59E0B] text-[#0F172A] font-black text-2xl flex items-center justify-center mx-auto shadow-md ring-4 ring-amber-300/80 border-2 border-white overflow-hidden">
                  {getMemberAvatarUrl(top1.member) ? (
                    <img
                      src={getMemberAvatarUrl(top1.member)!}
                      alt={top1.member.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    top1.member.full_name.charAt(0)
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black shadow border border-white">
                  1
                </div>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-[#061651] truncate">
                  {top1.member.full_name}
                </h3>
                <span className="text-xs font-bold text-amber-800 block mt-0.5">
                  {top1.member.department_name} - {top1.member.position}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                  {top1.earnedDelta >= 0 ? `+${top1.earnedDelta}đ trong kỳ` : `${top1.earnedDelta}đ`}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">
                  {selectedScope === 'quarter' ? (language === 'vi' ? 'Điểm TB Quý:' : 'Quarterly Avg:') : (language === 'vi' ? 'Điểm cao nhất:' : 'Highest Score:')}
                </span>
                <span className="text-2xl font-black text-amber-600">
                  {top1.finalScore}đ
                </span>
              </div>
            </div>

            {/* Rank 3 (Hạng 3 - Phải) */}
            <div
              onClick={() => onSelectMember && onSelectMember(top3.member)}
              className="bg-white rounded-2xl border border-amber-200/80 p-5 text-center space-y-3 shadow-xs hover:shadow-md transition cursor-pointer relative order-3 md:order-3 hover:-translate-y-1"
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-black flex items-center gap-1 shadow-2xs">
                <Medal className="w-3.5 h-3.5 text-amber-700" />
                <span>{language === 'vi' ? 'HẠNG 3' : 'RANK 3'}</span>
              </div>

              <div className="w-16 h-16 rounded-full bg-amber-50 ring-2 ring-amber-200/80 text-amber-800 font-black text-xl flex items-center justify-center mx-auto shadow-inner overflow-hidden">
                {getMemberAvatarUrl(top3.member) ? (
                  <img
                    src={getMemberAvatarUrl(top3.member)!}
                    alt={top3.member.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  top3.member.full_name.charAt(0)
                )}
              </div>

              <div>
                <h3 className="font-bold text-sm text-[#061651] truncate">
                  {top3.member.full_name}
                </h3>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                  {top3.member.department_name} - {top3.member.position}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                  {top3.earnedDelta >= 0 ? `+${top3.earnedDelta}đ trong kỳ` : `${top3.earnedDelta}đ`}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {selectedScope === 'quarter' ? (language === 'vi' ? 'Điểm TB Quý:' : 'Quarterly Avg:') : (language === 'vi' ? 'Điểm thi đua:' : 'Total Score:')}
                </span>
                <span className="text-xl font-black text-[#0284C7]">
                  {top3.finalScore}đ
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. BẢNG XẾP HẠNG CHI TIẾT 48 THÀNH VIÊN: SUBTABS BAN + CHIPS TIÊU CHÍ ĐỒNG BỘ ẢNH 1 */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-4 sm:p-5 space-y-4">
          {/* Hàng 1: Subtabs theo Ban (Dạng Pill bo tròn mềm mại) + Chỉ số Hiển thị + Nút Xuất file CSV (Chuẩn 100% Ảnh 1) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
              {[
                { id: 'all', label: language === 'vi' ? 'Tất cả ban' : 'All Departments', count: periodRankings.length },
                { id: 'bcn', label: language === 'vi' ? 'Ban Chủ nhiệm' : 'Exec Board', count: bcnCount },
                { id: 'truyen-thong', label: language === 'vi' ? 'Truyền thông' : 'Communications', count: ttCount },
                { id: 'tu-van', label: language === 'vi' ? 'Tư vấn' : 'Advisory', count: tvCount },
                { id: 'nhan-su', label: language === 'vi' ? 'Nhân sự' : 'HR', count: nsCount },
              ].map((tab) => {
                const isSelected = selectedDept === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setSelectedDept(tab.id)
                      setCurrentPage(1)
                    }}
                    className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs transition-all whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#0284C7] text-white font-bold shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 font-medium'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/90 text-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Quick Counter & Nút Xuất CSV */}
            <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
              <div className="text-xs text-slate-500 font-medium whitespace-nowrap flex items-center gap-1 px-1">
                <span>{language === 'vi' ? 'Hiển thị:' : 'Showing:'}</span>
                <strong className="text-[#061651] font-bold">{filtered.length}</strong>
                <span>/ {periodRankings.length} {language === 'vi' ? 'thành viên' : 'members'}</span>
              </div>

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-[#061651] border border-slate-200/90 hover:border-slate-300 font-bold text-xs transition shadow-2xs hover:shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                title="Xuất bảng xếp hạng ra file Excel CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>{language === 'vi' ? 'Xuất CSV' : 'Export CSV'}</span>
              </button>
            </div>
          </div>

          {/* Hàng 2: Thanh tìm kiếm (Bo tròn dài) & Chip tiêu chí lọc (Chuẩn 100% Ảnh 1) */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={language === 'vi' ? 'Tìm theo tên, MSSV, lớp...' : 'Search by name, student ID, class...'}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/20 transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Chip filter tiêu chí */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs">
              <span className="text-slate-500 font-bold text-[11px] whitespace-nowrap flex items-center gap-1 pr-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>{language === 'vi' ? 'Tiêu chí:' : 'Criteria:'}</span>
              </span>
              {[
                { id: 'all' as const, label: language === 'vi' ? 'Tất cả' : 'All' },
                { id: 'core_only' as const, label: `Core Team (${coreCount})`, icon: Crown },
                {
                  id: 'top3_non_core' as const,
                  label: language === 'vi' ? `Top 3 ngoài Core Team (${top3NonCoreMembers.length})` : `Top 3 Non-Core (${top3NonCoreMembers.length})`,
                  icon: Medal,
                },
                { id: 'excellent' as const, label: `${language === 'vi' ? 'Rất tích cực' : 'Highly Active'} ≥85 (${excellentCount})`, icon: Sparkles },
                { id: 'good' as const, label: `${language === 'vi' ? 'Tích cực' : 'Active'} 70-84 (${goodCount})`, icon: Award },
                { id: 'warning' as const, label: `${language === 'vi' ? 'Cần cải thiện' : 'Needs Improvement'} <55 (${warningCount})`, icon: AlertTriangle },
              ].map((chip) => {
                const isSelected = selectedRating === chip.id
                const ChipIcon = chip.icon
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      setSelectedRating(chip.id)
                      setCurrentPage(1)
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                      isSelected
                        ? 'bg-[#0284C7] text-white font-bold'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    {ChipIcon && (
                      <ChipIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                    )}
                    <span>{chip.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Hàng 3: Bảng xếp hạng chi tiết (Header màu xanh #0284C7 đồng bộ ảnh 1) */}
          <div className="rounded-xl overflow-hidden border border-slate-200/90 shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-700 border-collapse">
                <thead className="bg-[#0284C7] text-xs font-bold text-white uppercase tracking-wider select-none shadow-xs">
                  <tr className="divide-x divide-white/15">
                    <th className="py-3 px-3 w-16 text-center font-bold text-sky-100 whitespace-nowrap">
                      {language === 'vi' ? 'Thứ hạng' : 'Rank'}
                    </th>
                    <th className="py-3 px-4 min-w-[260px] font-bold text-white whitespace-nowrap">
                      {language === 'vi' ? 'Thành viên' : 'Member'}
                    </th>
                    <th className="py-3 px-3 min-w-[130px] font-bold text-white whitespace-nowrap">
                      {language === 'vi' ? 'Ban trực thuộc' : 'Department'}
                    </th>
                    <th className="py-3 px-3 min-w-[120px] font-bold text-white whitespace-nowrap">
                      {language === 'vi' ? 'Chức vụ' : 'Position'}
                    </th>
                    <th className="py-3 px-3 w-24 text-center font-bold text-sky-100 whitespace-nowrap">
                      {language === 'vi' ? 'Xuất phát' : 'Base'}
                    </th>
                    <th className="py-3 px-3 w-28 text-center font-bold text-sky-100 whitespace-nowrap">
                      {language === 'vi' ? 'Biến động' : 'Delta'}
                    </th>
                    <th className="py-3 px-4 w-32 text-right font-bold text-white whitespace-nowrap">
                      {language === 'vi' ? 'Tổng điểm' : 'Total Score'}
                    </th>
                    <th className="py-3 px-3 min-w-[150px] font-bold text-sky-100 whitespace-nowrap">
                      {language === 'vi' ? 'Xếp loại' : 'Rating'}
                    </th>
                    <th className="py-3 px-3 w-24 text-center font-bold text-sky-100 whitespace-nowrap">
                      {language === 'vi' ? 'Chi tiết' : 'Action'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedMembers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <div className="space-y-2">
                          <Search className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="font-semibold text-xs sm:text-sm">
                            {language === 'vi' ? 'Không tìm thấy thành viên phù hợp với bộ lọc' : 'No members found matching filter'}
                          </p>
                          <button
                            onClick={() => {
                              setSearchQuery('')
                              setSelectedDept('all')
                              setSelectedRating('all')
                            }}
                            className="text-xs sm:text-sm text-[#0284C7] font-semibold hover:underline cursor-pointer"
                          >
                            {language === 'vi' ? 'Xóa bộ lọc tìm kiếm' : 'Reset search filter'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedMembers.map((item) => {
                      const m = item.member
                      const overallRank = item.rankInPeriod
                      const delta = item.deltaRank

                      return (
                        <tr
                          key={m.member_code}
                          onClick={() => onSelectMember && onSelectMember(m)}
                          className="hover:bg-sky-50/50 transition-colors cursor-pointer group"
                        >
                          {/* Rank Badge with Medal or Number */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {overallRank === 1 ? (
                                <span className="w-7 h-7 rounded-full bg-[#FFCD38] text-[#0F172A] font-black flex items-center justify-center text-xs shadow-2xs">
                                  1
                                </span>
                              ) : overallRank === 2 ? (
                                <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 font-black flex items-center justify-center text-xs shadow-2xs">
                                  2
                                </span>
                              ) : overallRank === 3 ? (
                                <span className="w-7 h-7 rounded-full bg-amber-200 text-amber-900 font-black flex items-center justify-center text-xs shadow-2xs">
                                  3
                                </span>
                              ) : overallRank <= 10 ? (
                                <span className="w-7 h-7 rounded-full bg-sky-50 text-[#0284C7] font-bold flex items-center justify-center text-xs border border-sky-200">
                                  {overallRank}
                                </span>
                              ) : (
                                <span className="font-mono font-bold text-slate-400 text-xs">
                                  #{overallRank}
                                </span>
                              )}

                              {/* Delta rank indicator */}
                              {delta > 0 ? (
                                <span className="text-[10px] font-bold text-emerald-600 flex items-center">
                                  <ArrowUpRight className="w-3 h-3" />
                                  <span>{delta}</span>
                                </span>
                              ) : delta < 0 ? (
                                <span className="text-[10px] font-bold text-rose-500 flex items-center">
                                  <ArrowDownRight className="w-3 h-3" />
                                  <span>{Math.abs(delta)}</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">
                                  <Minus className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Member info with avatar */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2.5 whitespace-nowrap">
                              {getMemberAvatarUrl(m) ? (
                                <img
                                  src={getMemberAvatarUrl(m)!}
                                  alt={m.full_name}
                                  className="w-9 h-9 rounded-full object-cover border border-slate-200 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-sky-50 text-[#0284C7] font-bold flex items-center justify-center text-xs flex-shrink-0 border border-sky-200">
                                  {m.full_name.charAt(0)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-bold text-[#061651] flex items-center gap-1.5 group-hover:text-[#0284C7] transition-colors whitespace-nowrap">
                                  <span className="whitespace-nowrap">{m.full_name}</span>
                                  {m.is_core && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-200/80 whitespace-nowrap">
                                      CORE
                                    </span>
                                  )}
                                </div>
                                <div className="font-normal text-slate-500 text-[11px] mt-0.5 whitespace-nowrap">
                                  {m.student_id ? `${m.student_id} - ` : ''}
                                  {m.class_name || m.member_code}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Department */}
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap ${getDeptBadgeStyle(
                                m.department_slug
                              )}`}
                            >
                              {m.department_name}
                            </span>
                          </td>

                          {/* Position */}
                          <td className="py-3 px-3 text-slate-600 font-medium text-xs">
                            {m.position}
                          </td>

                          {/* Base Score (Always 60) */}
                          <td className="py-3 px-3 text-center">
                            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                              {item.baseScore}đ
                            </span>
                          </td>

                          {/* Earned Delta in Period */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold font-mono ${
                                item.earnedDelta > 0
                                  ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                                  : item.earnedDelta < 0
                                  ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {item.earnedDelta > 0
                                ? `+${item.earnedDelta}đ`
                                : `${item.earnedDelta}đ`}
                            </span>
                          </td>

                          {/* Final Score in Period */}
                          <td className="py-3 px-4 text-right">
                            <div className="inline-block text-right">
                              <span className="text-base font-black text-[#061651] block leading-tight">
                                {item.finalScore}đ
                              </span>
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden ml-auto">
                                <div
                                  className="h-full bg-[#0284C7] rounded-full"
                                  style={{ width: `${Math.min(100, item.finalScore)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Rating Level */}
                          <td className="py-3 px-3">
                            {getRatingBadge(item.finalScore)}
                          </td>

                          {/* Action Button */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                onSelectMember && onSelectMember(m)
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#0284C7] hover:text-white text-slate-700 font-bold text-xs transition-colors inline-flex items-center gap-1 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                            >
                              <span>{language === 'vi' ? 'Hồ sơ' : 'Profile'}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3.5 sm:p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  {language === 'vi' ? 'Hiển thị' : 'Showing'} {(currentPage - 1) * pageSize + 1} -{' '}
                  {Math.min(currentPage * pageSize, filtered.length)} {language === 'vi' ? 'trên tổng số' : 'of'}{' '}
                  {filtered.length} {language === 'vi' ? 'thành viên' : 'members'}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-3 font-bold text-[#061651]">
                    {language === 'vi' ? 'Trang' : 'Page'} {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Tab: Thống Kê & Đối Sánh Biểu Đồ */}
      {activeTab === 'analytics' && (
        <ComparisonChart
          periodId={selectedPeriodId}
          periodName={currentPeriodObj.name}
        />
      )}
    </div>
  )
}
