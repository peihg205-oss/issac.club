'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  BarChart3,
  Flag,
  Target,
  TrendingUp,
  Gauge,
  Megaphone,
  Users,
  User,
  Crown,
  Info,
  Trophy,
  Medal,
  Award,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Check,
} from 'lucide-react'
import { useClub } from '@/lib/context/ClubContext'
import { calculatePeriodLeaderboard } from '@/lib/periodData'
import { useLanguage } from '@/lib/context/LanguageContext'

type ComparisonMode = 'dept_score' | 'plus_vs_minus' | 'monthly_trend'
type SortOption = 'default' | 'high_to_low' | 'low_to_high' | 'attendance'

// Circular Progress Component for Attendance Rate
function CircularProgress({ value, color }: { value: number; color: string }) {
  const radius = 20
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
        <circle
          cx="24"
          cy="24"
          r={radius}
          className="text-slate-100"
          strokeWidth="3.5"
          stroke="currentColor"
          fill="transparent"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke={color}
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-[10px] font-black text-[#061651] tracking-tight">
        {value}%
      </span>
    </div>
  )
}

interface DeptComparisonItem {
  name: string
  shortName: string
  code: string
  icon: React.ElementType
  color: string
  bgColor: string
  textColor: string
  borderColor: string
  cardBg: string
  ringColor: string
  avgScore: number
  memberCount: number
  attendanceRate: string
  attendanceNum: number
  positivePoints: number
  negativePoints: number
  deltaPrevMonth: string
  rankBadge: string
  rankBadgeColor: string
  rankBadgeIcon: string
  rankText: string
  rankNumber: number
  description: string
}

export interface ComparisonChartProps {
  periodId?: string
  periodName?: string
}

export function ComparisonChart({
  periodId: propPeriodId,
  periodName: propPeriodName,
}: ComparisonChartProps = {}) {
  const { members, proposals, periods, customPeriodScores, currentActivePeriodId, setCurrentActivePeriodId } = useClub()
  const { language, t } = useLanguage()
  const [mode, setMode] = useState<ComparisonMode>('dept_score')
  const [sortBy, setSortBy] = useState<SortOption>('default')
  const [hoveredDept, setHoveredDept] = useState<string | null>(null)

  // Quản lý chu kỳ được chọn: Ưu tiên propPeriodId từ trang cha, fallback chu kỳ hiện tại
  const [internalPeriodId, setInternalPeriodId] = useState<string>(() => {
    return propPeriodId || currentActivePeriodId || periods.find((p) => p.isCurrent)?.id || periods[0]?.id || 'month-2026-10'
  })

  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false)
  const periodDropdownRef = useRef<HTMLDivElement>(null)

  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const sortDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(event.target as Node)) {
        setPeriodDropdownOpen(false)
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false)
      }
    }
    if (periodDropdownOpen || sortDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [periodDropdownOpen, sortDropdownOpen])

  useEffect(() => {
    if (propPeriodId) {
      setInternalPeriodId(propPeriodId)
    } else if (currentActivePeriodId) {
      setInternalPeriodId(currentActivePeriodId)
    }
  }, [propPeriodId, currentActivePeriodId])

  const activePeriodId = propPeriodId || internalPeriodId
  const activePeriod = periods.find((p) => p.id === activePeriodId) || periods[0]
  const displayPeriodName = propPeriodName || activePeriod?.name || 'Tháng 10/2026'

  // Tính toán bảng xếp hạng của 48 thành viên theo đúng chu kỳ được chọn
  const periodRankings = useMemo(() => {
    return calculatePeriodLeaderboard(activePeriodId, members, periods, customPeriodScores, proposals)
  }, [activePeriodId, members, periods, customPeriodScores, proposals])

  // 4 ban của CLB VNU-IS Ambassadors - Tự động tính toán điểm trung bình & biến động thực tế
  const rawDeptComparisons: DeptComparisonItem[] = useMemo(() => {
    const deptConfigs = [
      {
        name: language === 'vi' ? 'Ban Truyền thông' : 'Communications Dept',
        shortName: language === 'vi' ? 'Truyền thông' : 'Communications',
        code: 'B01',
        icon: Megaphone,
        color: '#2563EB',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-600',
        borderColor: 'border-blue-100',
        cardBg: 'bg-[#F0F7FF]',
        ringColor: '#2563EB',
        defaultAttendance: 92.8,
      },
      {
        name: language === 'vi' ? 'Ban Tư vấn' : 'Advisory Dept',
        shortName: language === 'vi' ? 'Tư vấn' : 'Advisory',
        code: 'B02',
        icon: Users,
        color: '#EC4899',
        bgColor: 'bg-pink-50',
        textColor: 'text-pink-600',
        borderColor: 'border-pink-100',
        cardBg: 'bg-[#FFF1F2]',
        ringColor: '#EC4899',
        defaultAttendance: 95.6,
      },
      {
        name: language === 'vi' ? 'Ban Nhân sự' : 'HR Dept',
        shortName: language === 'vi' ? 'Nhân sự' : 'HR',
        code: 'B03',
        icon: User,
        color: '#6366F1',
        bgColor: 'bg-indigo-50',
        textColor: 'text-indigo-600',
        borderColor: 'border-indigo-100',
        cardBg: 'bg-[#F5F3FF]',
        ringColor: '#6366F1',
        defaultAttendance: 88.0,
      },
      {
        name: language === 'vi' ? 'Ban Chủ nhiệm' : 'Executive Board',
        shortName: language === 'vi' ? 'BCN' : 'Exec Board',
        code: 'B04',
        icon: Crown,
        color: '#F59E0B',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-600',
        borderColor: 'border-amber-100',
        cardBg: 'bg-[#FFFBEB]',
        ringColor: '#F59E0B',
        defaultAttendance: 100,
      },
    ]

    const computed = deptConfigs.map((cfg) => {
      const deptMembers = periodRankings.filter(
        (r) => r.member.department_code === cfg.code
      )
      const count = deptMembers.length || 1
      const totalScore = deptMembers.reduce((sum, r) => sum + r.finalScore, 0)
      const avgScore = Number((totalScore / count).toFixed(1))
      const totalDelta = deptMembers.reduce((sum, r) => sum + r.earnedDelta, 0)
      const avgDelta = Number((totalDelta / count).toFixed(1))

      const positivePoints = deptMembers.reduce(
        (sum, r) => sum + (r.earnedDelta > 0 ? r.earnedDelta : 0),
        0
      )
      const negativePoints = deptMembers.reduce(
        (sum, r) => sum + (r.earnedDelta < 0 ? r.earnedDelta : 0),
        0
      )

      let deltaStr = '0.0'
      if (avgDelta > 0) deltaStr = `+${avgDelta}`
      else if (avgDelta < 0) deltaStr = `${avgDelta}`

      // Nếu chu kỳ mới khởi tạo (mọi thành viên xuất phát 60đ, chưa có điểm phát sinh)
      const isNewEmptyPeriod = totalDelta === 0 && avgScore === 60
      const attendanceNum = isNewEmptyPeriod ? 100 : cfg.defaultAttendance
      const attendanceRate = `${attendanceNum}%`

      return {
        ...cfg,
        memberCount: deptMembers.length,
        avgScore,
        avgDelta,
        positivePoints,
        negativePoints,
        deltaPrevMonth: deltaStr,
        attendanceNum,
        attendanceRate,
      }
    })

    const allEqual = computed.every((d) => d.avgScore === computed[0].avgScore)
    const sortedByScore = [...computed].sort((a, b) => b.avgScore - a.avgScore)

    return computed.map((dept) => {
      // Khi chu kỳ mới khởi tạo (ví dụ T10/2026), mọi người đều ở mốc xuất phát 60đ
      if (allEqual) {
        return {
          ...dept,
          rankBadge: language === 'vi' ? 'Khởi đầu' : 'Starting',
          rankBadgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
          rankBadgeIcon: '',
          rankText: language === 'vi' ? 'Xuất phát 60đ' : 'Start 60pts',
          rankNumber: 1,
          description:
            language === 'vi'
              ? 'Chu kỳ mới khởi tạo - Toàn ban đang ở mốc xuất phát 60 điểm chuẩn bị thi đua.'
              : 'New cycle initialized - Entire dept is at the starting baseline of 60 points.',
        }
      }

      const rankIndex = sortedByScore.findIndex((d) => d.code === dept.code)
      const rank = rankIndex + 1

      if (rank === 1) {
        return {
          ...dept,
          rankBadge: language === 'vi' ? 'Dẫn đầu' : 'Leader',
          rankBadgeColor: 'bg-amber-100/80 text-amber-900 border-amber-200',
          rankBadgeIcon: '🏆',
          rankText: language === 'vi' ? 'Dẫn đầu' : 'Leader',
          rankNumber: 1,
          description:
            language === 'vi'
              ? `Dẫn đầu điểm thi đua phong trào kỳ này (${dept.avgScore}đ)`
              : `Leading emulation score this period (${dept.avgScore} pts)`,
        }
      }
      if (rank === 2) {
        return {
          ...dept,
          rankBadge: language === 'vi' ? 'Xếp thứ 2' : '2nd Place',
          rankBadgeColor: 'bg-rose-100/80 text-rose-900 border-rose-200',
          rankBadgeIcon: '🥈',
          rankText: language === 'vi' ? 'Xếp thứ 2' : '2nd Place',
          rankNumber: 2,
          description:
            language === 'vi'
              ? `Điểm trung bình toàn ban đạt ${dept.avgScore}đ`
              : `Department average score reached ${dept.avgScore} pts`,
        }
      }
      if (rank === 3) {
        return {
          ...dept,
          rankBadge: language === 'vi' ? 'Xếp thứ 3' : '3rd Place',
          rankBadgeColor: 'bg-purple-100/80 text-purple-900 border-purple-200',
          rankBadgeIcon: '🥉',
          rankText: language === 'vi' ? 'Xếp thứ 3' : '3rd Place',
          rankNumber: 3,
          description:
            language === 'vi'
              ? `Điểm trung bình toàn ban đạt ${dept.avgScore}đ`
              : `Department average score reached ${dept.avgScore} pts`,
        }
      }
      return {
        ...dept,
        rankBadge: language === 'vi' ? 'Xếp thứ 4' : '4th Place',
        rankBadgeColor: 'bg-slate-100 text-[#061651] border-slate-200',
        rankBadgeIcon: '🎖️',
        rankText: language === 'vi' ? 'Xếp thứ 4' : '4th Place',
        rankNumber: 4,
        description:
          language === 'vi'
            ? `Điểm trung bình toàn ban đạt ${dept.avgScore}đ`
            : `Department average score reached ${dept.avgScore} pts`,
      }
    })
  }, [periodRankings, language])

  // Sắp xếp linh hoạt theo lựa chọn của người dùng
  const sortedDepts = useMemo(() => {
    const list = [...rawDeptComparisons]
    if (sortBy === 'high_to_low') {
      return list.sort((a, b) => b.avgScore - a.avgScore)
    }
    if (sortBy === 'low_to_high') {
      return list.sort((a, b) => a.avgScore - b.avgScore)
    }
    if (sortBy === 'attendance') {
      return list.sort((a, b) => b.attendanceNum - a.attendanceNum)
    }
    return list
  }, [sortBy, rawDeptComparisons])

  // Dữ liệu so sánh theo tháng được tính toán từ các chu kỳ thực tế
  const monthlyTrends = useMemo(() => {
    const monthPeriods = periods.filter((p) => p.scope === 'month')
    return monthPeriods.slice(-3).map((p, idx) => {
      const pRankings = calculatePeriodLeaderboard(
        p.id,
        members,
        periods,
        customPeriodScores,
        proposals
      )
      const avg = Number(
        (
          pRankings.reduce((sum, r) => sum + r.finalScore, 0) /
          (pRankings.length || 1)
        ).toFixed(1)
      )
      const posSum = pRankings.reduce(
        (sum, r) => sum + (r.earnedDelta > 0 ? r.earnedDelta : 0),
        0
      )
      const negSum = Math.abs(
        pRankings.reduce(
          (sum, r) => sum + (r.earnedDelta < 0 ? r.earnedDelta : 0),
          0
        )
      )
      const attendance =
        p.id === 'month-2025-08'
          ? '86.2%'
          : p.id === 'month-2025-09'
          ? '91.4%'
          : p.id === 'month-2025-10'
          ? '94.8%'
          : '100%'

      return {
        month: p.name,
        label: p.isCurrent ? 'Chu kỳ hiện tại' : p.status === 'locked' ? 'Đã khóa sổ' : 'Đang mở',
        avgScore: avg,
        attendance,
        positiveSum: posSum,
        negativeSum: negSum,
        color: idx === 0 ? '#94A3B8' : idx === 1 ? '#3B82F6' : '#1351D8',
      }
    })
  }, [periods, members, customPeriodScores])

  const sortOptions: Array<{ value: SortOption; label: string }> = useMemo(
    () => [
      { value: 'default', label: t('chart.sort_default') },
      { value: 'high_to_low', label: t('chart.sort_highest') },
      { value: 'low_to_high', label: t('chart.sort_lowest') },
      { value: 'attendance', label: t('chart.sort_attendance') },
    ],
    [t]
  )
  const currentSortLabel = sortOptions.find((o) => o.value === sortBy)?.label || t('chart.sort_default')

  return (
    <div className="space-y-6">
      {/* 1. THẺ 1: So sánh Thi đua & Hiệu suất Hoạt động (Header + 4 Thẻ Mốc Chuẩn) */}
      <div className="bg-white rounded-xl border border-slate-200/70 p-5 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-5">
        {/* Header bar with Title, Tabs & Semester Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0284C7] border border-sky-200/60 shadow-2xs flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[#061651] tracking-tight">
                {t('chart.title')}
              </h2>
              <p className="text-xs text-[#64748B] font-normal mt-0.5">
                {t('chart.subtitle')}
              </p>
            </div>
          </div>

          {/* Tab Switcher & Dropdown (Luôn giữ trên 1 hàng ngang cân xứng) */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap shrink-0 self-start lg:self-center max-w-full">
            <div className="inline-flex items-center gap-0.5 sm:gap-1 p-1 bg-[#F1F5F9] rounded-xl text-xs font-medium shrink-0 max-w-full overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setMode('dept_score')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  mode === 'dept_score'
                    ? 'bg-[#0284C7] text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
                }`}
              >
                <span>{t('chart.mode_dept_score')}</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('plus_vs_minus')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  mode === 'plus_vs_minus'
                    ? 'bg-[#0284C7] text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
                }`}
              >
                <span>{t('chart.mode_plus_vs_minus')}</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('monthly_trend')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  mode === 'monthly_trend'
                    ? 'bg-[#0284C7] text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
                }`}
              >
                <span>{t('chart.mode_monthly_trend')}</span>
              </button>
            </div>

            {/* Hiển thị chu kỳ đang chọn */}
            {propPeriodId ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-[#0284C7] border border-sky-200/80 text-xs font-semibold shadow-2xs whitespace-nowrap shrink-0">
                <Calendar className="w-3.5 h-3.5" />
                <span>{displayPeriodName}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            ) : (
              <div ref={periodDropdownRef} className="relative inline-flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => setPeriodDropdownOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20 focus:border-[#0284C7] shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {activePeriod?.name}{' '}
                    <span className="font-medium text-slate-500">
                      {activePeriod?.status === 'locked' ? '(Đã khóa)' : activePeriod?.isCurrent ? '(Hiện tại)' : ''}
                    </span>
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      periodDropdownOpen ? 'rotate-180 text-[#0284C7]' : ''
                    }`}
                  />
                </button>

                {periodDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-[calc(100vw-32px)] sm:w-auto sm:min-w-[280px] max-w-sm bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 p-1.5 space-y-0.5 animate-fadeIn">
                    {periods.map((p) => {
                      const isSelected = p.id === activePeriodId
                      const statusLabel =
                        p.status === 'locked' ? ' (Đã khóa)' : p.isCurrent ? ' (Hiện tại)' : ''
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setInternalPeriodId(p.id)
                            setCurrentActivePeriodId(p.id)
                            setPeriodDropdownOpen(false)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-[13px] transition-colors cursor-pointer flex items-center ${
                            isSelected
                              ? 'bg-[#3B82F6] text-white font-medium shadow-xs'
                              : 'text-slate-800 hover:bg-slate-100/80 font-normal pl-8'
                          }`}
                        >
                          {isSelected && (
                            <Check className="w-4 h-4 mr-2 shrink-0 stroke-[2.5]" />
                          )}
                          <span className="truncate">{p.name}{statusLabel}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* HÀNG 4 THẺ CHỈ SỐ MỐC CHUẨN (Chuẩn Style Ảnh 2) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Card 1: Mục tiêu Tốt */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#F0FDF4] dark:bg-emerald-950/30 flex items-center justify-between transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
            <div className="space-y-0.5">
              <span className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-300 block">
                {language === 'vi' ? 'Mục tiêu Tốt' : 'Club Target'}
              </span>
              <div className="flex items-baseline gap-1 py-0.5">
                <span className="text-lg sm:text-[22px] font-black text-[#16A34A] dark:text-emerald-400 tracking-tight leading-none">
                  80
                </span>
                <span className="text-[11.5px] font-bold text-[#16A34A]/80 dark:text-emerald-300">
                  {language === 'vi' ? 'điểm' : 'pts'}
                </span>
              </div>
              <span className="text-[11.5px] font-semibold text-[#16A34A] dark:text-emerald-400 block">
                {language === 'vi' ? 'Xuất sắc' : 'Excellent'}
              </span>
            </div>
            <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-emerald-300/70 bg-white/60 dark:bg-slate-800/80 flex items-center justify-center text-[#16A34A] shrink-0">
              <Flag className="w-4.5 h-4.5 stroke-[1.75]" />
            </div>
          </div>

          {/* Card 2: Mức chuẩn CLB */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#F0F9FF] dark:bg-sky-950/30 flex items-center justify-between transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
            <div className="space-y-0.5">
              <span className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-300 block">
                {language === 'vi' ? 'Mức chuẩn CLB' : 'Club Standard'}
              </span>
              <div className="flex items-baseline gap-1 py-0.5">
                <span className="text-lg sm:text-[22px] font-black text-[#0284C7] dark:text-sky-400 tracking-tight leading-none">
                  70
                </span>
                <span className="text-[11.5px] font-bold text-[#0284C7]/80 dark:text-sky-300">
                  {language === 'vi' ? 'điểm' : 'pts'}
                </span>
              </div>
              <span className="text-[11.5px] font-semibold text-[#0284C7] dark:text-sky-400 block">
                {language === 'vi' ? 'Đạt yêu cầu' : 'Qualified'}
              </span>
            </div>
            <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-sky-300/70 bg-white/60 dark:bg-slate-800/80 flex items-center justify-center text-[#0284C7] shrink-0">
              <Target className="w-4.5 h-4.5 stroke-[1.75]" />
            </div>
          </div>

          {/* Card 3: Mốc xuất phát */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#FFFBEB] dark:bg-amber-950/30 flex items-center justify-between transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
            <div className="space-y-0.5">
              <span className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-300 block">
                {language === 'vi' ? 'Mốc xuất phát' : 'Starting Baseline'}
              </span>
              <div className="flex items-baseline gap-1 py-0.5">
                <span className="text-lg sm:text-[22px] font-black text-[#D97706] dark:text-amber-400 tracking-tight leading-none">
                  60
                </span>
                <span className="text-[11.5px] font-bold text-[#D97706]/80 dark:text-amber-300">
                  {language === 'vi' ? 'điểm' : 'pts'}
                </span>
              </div>
              <span className="text-[11.5px] font-semibold text-[#D97706] dark:text-amber-400 block">
                {language === 'vi' ? 'Cần cố gắng' : 'Needs Effort'}
              </span>
            </div>
            <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-amber-300/70 bg-white/60 dark:bg-slate-800/80 flex items-center justify-center text-[#D97706] shrink-0">
              <TrendingUp className="w-4.5 h-4.5 stroke-[1.75]" />
            </div>
          </div>

          {/* Card 4: Thang điểm */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/40 flex items-center justify-between transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
            <div className="space-y-0.5">
              <span className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-300 block">
                {t('chart.scale_label')}
              </span>
              <div className="flex items-baseline gap-1 py-0.5">
                <span className="text-lg sm:text-[22px] font-black text-[#061651] dark:text-white tracking-tight leading-none">
                  0 - 100
                </span>
                <span className="text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                  {language === 'vi' ? 'điểm' : 'pts'}
                </span>
              </div>
              <span className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 block">
                {t('chart.scale_standard')}
              </span>
            </div>
            <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-slate-300/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/80 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
              <Gauge className="w-4.5 h-4.5 stroke-[1.75]" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. THẺ 2: Điểm trung bình các ban (Thẻ riêng biệt bên dưới theo đúng thiết kế ảnh mẫu) */}
      {mode === 'dept_score' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/70 p-5 sm:p-6 space-y-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            {/* Header trong biểu đồ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0284C7] border border-sky-200/60 shadow-2xs flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-[#061651] tracking-tight">
                    {t('chart.mode_dept_score')}
                  </h3>
                  <p className="text-xs text-[#64748B] font-normal mt-0.5">
                    {language === 'vi' ? 'So sánh điểm thi đua hiện tại và mức mục tiêu' : 'Compare current emulation scores and targets'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                {/* Dropdown sắp xếp cân đối, đồng bộ thiết kế */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <span>{language === 'vi' ? 'Sắp xếp theo:' : 'Sort by:'}</span>
                  <div ref={sortDropdownRef} className="relative inline-flex items-center">
                    <button
                      type="button"
                      onClick={() => setSortDropdownOpen((prev) => !prev)}
                      className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20 focus:border-[#0284C7] shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                    >
                      <span>{currentSortLabel}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                          sortDropdownOpen ? 'rotate-180 text-[#0284C7]' : ''
                        }`}
                      />
                    </button>

                    {sortDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1.5 min-w-[170px] w-max bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 p-1.5 space-y-0.5 animate-fadeIn">
                        {sortOptions.map((opt) => {
                          const isSelected = opt.value === sortBy
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setSortBy(opt.value)
                                setSortDropdownOpen(false)
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? 'bg-[#3B82F6] text-white font-medium shadow-xs'
                                  : 'text-slate-800 hover:bg-slate-100/80 font-normal'
                              }`}
                            >
                              <span>{opt.label}</span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 ml-2 shrink-0 stroke-[2.5]" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Legend mốc 80đ */}
                <div className="flex items-center gap-1 text-xs font-extrabold text-[#15803D]">
                  <span className="tracking-tight">{language === 'vi' ? 'Mục tiêu: 80 điểm' : 'Target: 80 points'}</span>
                  <Info className="w-3.5 h-3.5 text-emerald-600/80 shrink-0" />
                </div>
              </div>
            </div>

            {/* Vùng thanh ngang & Đường mục tiêu 80đ */}
            <div className="pt-3 pb-1">
              <div className="space-y-4">
                {sortedDepts.map((dept, index) => {
                  const rank = index + 1
                  const rankPillStyle =
                    rank === 1
                      ? 'bg-[#EFF6FF] text-[#2563EB]'
                      : rank === 2
                      ? 'bg-pink-50 text-pink-600'
                      : rank === 3
                      ? 'bg-purple-50 text-purple-600'
                      : 'bg-amber-50 text-amber-700'

                  const IconComponent = dept.icon
                  const isHovered = hoveredDept === dept.code

                  return (
                    <div
                      key={dept.code}
                      onMouseEnter={() => setHoveredDept(dept.code)}
                      onMouseLeave={() => setHoveredDept(null)}
                      className={`flex items-center gap-3 sm:gap-4 p-1.5 rounded-xl transition-all duration-200 ${
                        isHovered ? 'bg-slate-50/80 -translate-x-0.5' : ''
                      }`}
                    >
                      {/* Số thứ hạng (1), (2), (3), (4) */}
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${rankPillStyle}`}
                      >
                        {rank}
                      </span>

                      {/* Icon & Tên Ban */}
                      <div className="flex items-center gap-2.5 w-32 sm:w-40 shrink-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${dept.color}15`, color: dept.color }}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs sm:text-sm text-[#061651] block truncate">
                            {dept.shortName}
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal block truncate">
                            {dept.memberCount} {language === 'vi' ? 'thành viên' : 'members'}
                          </span>
                        </div>
                      </div>

                      {/* Thanh Ngang (Thanh bo tròn hoàn toàn rounded-full kèm vạch mục tiêu 80đ) */}
                      <div className="flex-1 relative flex items-center py-2">
                        <div className="w-full h-7 bg-[#EFF2F6] rounded-full overflow-hidden relative shadow-inner">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out shadow-xs"
                            style={{
                              width: `${(dept.avgScore / 100) * 100}%`,
                              backgroundColor: dept.color,
                            }}
                          />
                        </div>

                        {/* Vạch mục tiêu 80đ đặt ngay trên từng thanh ngang */}
                        <div
                          className="absolute top-[-6px] bottom-[-6px] border-r-2 border-dashed border-[#10B981] pointer-events-none z-10 hidden sm:block"
                          style={{ left: '80%' }}
                        >
                          {index === 0 && (
                            <span className="absolute -top-3.5 -translate-x-1/2 bg-[#059669] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap">
                              {t('chart.target_80')}
                            </span>
                          )}
                        </div>

                        {/* Điểm số & Biến động ở cạnh phải thanh */}
                        <div className="w-20 sm:w-24 pl-3 shrink-0 flex items-center gap-1.5 text-xs font-bold">
                          <span className="text-[#061651] font-black text-sm">
                            {dept.avgScore}
                          </span>
                          {dept.deltaPrevMonth === '0.0' || dept.deltaPrevMonth === '0' || dept.deltaPrevMonth === '+0.0' ? (
                            <span className="text-[11px] font-bold text-slate-400">
                              0.0
                            </span>
                          ) : (
                            <span
                              className={`text-[11px] font-extrabold flex items-center ${
                                dept.deltaPrevMonth.startsWith('+')
                                  ? 'text-emerald-600'
                                  : 'text-rose-500'
                              }`}
                            >
                              {dept.deltaPrevMonth.startsWith('+') ? '▲' : '▼'}{' '}
                              {dept.deltaPrevMonth}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* PHẦN DƯỚI: CHI TIẾT TỪNG BAN & BẢNG SO SÁNH NHANH (Hai khối chuẩn xác theo Ảnh 1) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 pt-1">
            {/* CỘT TRÁI (8 cols): Chi tiết từng ban */}
            <div className="lg:col-span-8 space-y-3">
              <h4 className="text-sm font-black text-[#061651] tracking-tight">
                {t('chart.dept_details_heading')}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
                {rawDeptComparisons.map((dept) => {
                  const IconComponent = dept.icon
                  const isHovered = hoveredDept === dept.code

                  return (
                    <div
                      key={dept.code}
                      onMouseEnter={() => setHoveredDept(dept.code)}
                      onMouseLeave={() => setHoveredDept(null)}
                      className={`p-4 rounded-2xl border transition-all duration-200 space-y-3.5 cursor-pointer shadow-2xs ${
                        isHovered
                          ? 'border-blue-400 bg-white shadow-md -translate-y-0.5'
                          : `${dept.borderColor} bg-white hover:bg-slate-50/60`
                      }`}
                    >
                      {/* Tên Ban & Icon */}
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${dept.color}15`,
                            color: dept.color,
                          }}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-xs text-[#061651]">
                          {dept.shortName}
                        </span>
                      </div>

                      {/* Điểm TB & Tag biến động */}
                      <div className="flex items-baseline justify-between pt-0.5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-black text-[#061651]">
                            {dept.avgScore}
                          </span>
                          <span className="text-[11px] font-normal text-slate-400">
                            / 100
                          </span>
                        </div>

                        {dept.deltaPrevMonth === '0.0' || dept.deltaPrevMonth === '0' || dept.deltaPrevMonth === '+0.0' ? (
                          <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                            0.0
                          </span>
                        ) : (
                          <span
                            className={`text-[10.5px] font-extrabold px-1.5 py-0.5 rounded ${
                              dept.deltaPrevMonth.startsWith('+')
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {dept.deltaPrevMonth.startsWith('+') ? '▲' : '▼'}{' '}
                            {dept.deltaPrevMonth}
                          </span>
                        )}
                      </div>

                      {/* Tỷ lệ chuyên cần & Vòng tròn Progress Ring (Gauge SVG) */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <div>
                          <span className="text-[10.5px] text-slate-400 font-medium block">
                            {t('chart.attendance_rate_label')}
                          </span>
                          <span
                            className="text-sm font-black block mt-0.5"
                            style={{ color: dept.color }}
                          >
                            {dept.attendanceRate}
                          </span>
                        </div>

                        {/* Circular Progress Ring */}
                        <CircularProgress
                          value={dept.attendanceNum}
                          color={dept.ringColor}
                        />
                      </div>

                      {/* Danh hiệu xếp hạng ở chân thẻ (Dẫn đầu, Xếp thứ 2,...) */}
                      <div className="pt-2 border-t border-slate-100">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold w-full justify-center border shadow-2xs ${dept.rankBadgeColor}`}
                        >
                          {dept.rankBadgeIcon ? <span>{dept.rankBadgeIcon}</span> : null}
                          <span>{dept.rankText}</span>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* CỘT PHẢI (4 cols): Bảng So sánh nhanh */}
            <div className="lg:col-span-4 p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-white space-y-3.5 shadow-2xs">
              <div>
                <h4 className="text-sm font-black text-[#061651] tracking-tight">
                  {t('chart.quick_compare_heading')}
                </h4>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {t('chart.quick_compare_desc')}
                </p>
              </div>

              {/* Bảng tổng hợp đối sánh */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100 font-semibold text-[11px]">
                      <th className="text-left pb-2.5 font-medium">{t('chart.col_dept')}</th>
                      <th className="text-center pb-2.5 font-medium">{t('chart.col_avg_score')}</th>
                      <th className="text-center pb-2.5 font-medium">
                        {t('chart.col_vs_prev')}
                      </th>
                      <th className="text-right pb-2.5 font-medium">
                        {t('chart.col_attendance')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rawDeptComparisons.map((dept) => {
                      const IconComponent = dept.icon
                      const isHovered = hoveredDept === dept.code

                      return (
                        <tr
                          key={dept.code}
                          onMouseEnter={() => setHoveredDept(dept.code)}
                          onMouseLeave={() => setHoveredDept(null)}
                          className={`transition-colors cursor-pointer ${
                            isHovered ? 'bg-blue-50/50' : 'hover:bg-slate-50/70'
                          }`}
                        >
                          {/* Cột 1: Ban */}
                          <td className="py-2.5 flex items-center gap-2 font-bold text-[#061651]">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: `${dept.color}15`,
                                color: dept.color,
                              }}
                            >
                              <IconComponent className="w-3 h-3" />
                            </div>
                            <span className="truncate">{dept.shortName}</span>
                          </td>

                          {/* Cột 2: Điểm TB */}
                          <td className="py-2.5 text-center font-black text-[#061651]">
                            {dept.avgScore}
                          </td>

                          {/* Cột 3: So với kỳ trước */}
                          <td className="py-2.5 text-center">
                            {dept.deltaPrevMonth === '0.0' || dept.deltaPrevMonth === '0' || dept.deltaPrevMonth === '+0.0' ? (
                              <span className="text-slate-400 font-bold text-xs">0.0</span>
                            ) : (
                              <span
                                className={`font-bold inline-flex items-center gap-0.5 ${
                                  dept.deltaPrevMonth.startsWith('+')
                                    ? 'text-emerald-600'
                                    : 'text-rose-500'
                                }`}
                              >
                                {dept.deltaPrevMonth.startsWith('+') ? '▲' : '▼'}{' '}
                                {dept.deltaPrevMonth}
                              </span>
                            )}
                          </td>

                          {/* Cột 4: Tỷ lệ chuyên cần */}
                          <td className="py-2.5 text-right font-black text-emerald-600">
                            {dept.attendanceRate}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODE 2: So sánh Điểm Cộng (C) vs Điểm Trừ (T) */}
      {mode === 'plus_vs_minus' && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-[#475569]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#10B981]"></span>
                <span>{t('chart.bonus_rules_tag')}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#EF4444]"></span>
                <span>{t('chart.penalty_rules_tag')}</span>
              </span>
            </div>
            <span className="text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full text-xs font-black border border-emerald-300">
              {t('chart.compliance_rate')}
            </span>
          </div>

          {/* Grouped Paired Bars with Full Colors */}
          <div className="space-y-4">
            {rawDeptComparisons.map((dept) => {
              const totalActionPoints =
                dept.positivePoints + Math.abs(dept.negativePoints)
              const hasActions = totalActionPoints > 0
              const plusPct = hasActions
                ? Math.round((dept.positivePoints / totalActionPoints) * 100)
                : 0
              const minusPct = hasActions ? 100 - plusPct : 0

              return (
                <div
                  key={dept.code}
                  className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 transition space-y-3 shadow-2xs hover:shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-md"
                        style={{ backgroundColor: dept.color }}
                      ></span>
                      <span className="font-bold text-sm text-[#061651]">
                        {dept.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-black">
                      <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        {t('chart.bonus_label')}: +{dept.positivePoints}đ ({plusPct}%)
                      </span>
                      <span className="text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                        {t('chart.penalty_label')}: {dept.negativePoints}đ ({minusPct}%)
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-[#061651] text-white text-xs font-black">
                        {t('chart.net_received')}: +{dept.positivePoints + dept.negativePoints}đ
                      </span>
                    </div>
                  </div>

                  {/* Dual Proportional Split Bar or Empty State */}
                  {hasActions ? (
                    <div className="w-full h-6 bg-slate-100 rounded-full overflow-hidden flex shadow-inner p-1">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-l-full transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white"
                        style={{ width: `${plusPct}%` }}
                        title={`${t('chart.bonus_label')}: ${dept.positivePoints}đ (${plusPct}%)`}
                      >
                        {plusPct > 15 && `+${dept.positivePoints}đ`}
                      </div>
                      <div
                        className="bg-gradient-to-r from-rose-500 to-red-600 h-full rounded-r-full transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white"
                        style={{ width: `${minusPct}%` }}
                        title={`${t('chart.penalty_label')}: ${dept.negativePoints}đ (${minusPct}%)`}
                      >
                        {minusPct > 15 && `${dept.negativePoints}đ`}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-6 bg-slate-100/90 rounded-full flex items-center justify-center text-[11px] font-bold text-slate-400 shadow-inner">
                      {t('chart.new_cycle_note')}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 4. MODE 3: So sánh Xu hướng 3 Tháng gần nhất */}
      {mode === 'monthly_trend' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {monthlyTrends.map((item, idx) => (
              <div
                key={item.month}
                className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/70 space-y-3 relative overflow-hidden shadow-2xs hover:bg-white hover:shadow-xs transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#061651]">
                    {item.month}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {t('chart.term_period_note')}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-[#64748B] block">
                    {t('chart.month_club_avg')}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[#061651]">
                      {item.avgScore}đ
                    </span>
                    {idx > 0 && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        +
                        {(
                          item.avgScore - monthlyTrends[idx - 1].avgScore
                        ).toFixed(1)}
                        đ
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar visual for month */}
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-[#1351D8] transition-all duration-700"
                    style={{ width: `${(item.avgScore / 100) * 100}%` }}
                  />
                </div>

                <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">{t('chart.attendance_short')}:</span>
                    <span className="font-bold text-[#061651]">
                      {item.attendance}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{t('chart.total_bonus')}:</span>
                    <span className="font-bold text-emerald-600">
                      +{item.positiveSum}đ
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-[#ECFDF5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#065F46]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#059669] shrink-0" />
              <span className="font-bold">
                {t('chart.growth_summary')}
              </span>
            </div>
            <span className="font-black text-[#047857] uppercase tracking-wider shrink-0">
              {t('chart.term_tag')}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
