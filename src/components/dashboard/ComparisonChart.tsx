'use client'

import React, { useState, useMemo, useEffect } from 'react'
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
} from 'lucide-react'
import { useClub } from '@/lib/context/ClubContext'
import { calculatePeriodLeaderboard } from '@/lib/periodData'

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
      <span className="absolute text-[10px] font-black text-slate-800 tracking-tight">
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
  const { members, periods, customPeriodScores, currentActivePeriodId, setCurrentActivePeriodId } = useClub()
  const [mode, setMode] = useState<ComparisonMode>('dept_score')
  const [sortBy, setSortBy] = useState<SortOption>('default')
  const [hoveredDept, setHoveredDept] = useState<string | null>(null)

  // Quản lý chu kỳ được chọn: Ưu tiên propPeriodId từ trang cha, fallback chu kỳ hiện tại
  const [internalPeriodId, setInternalPeriodId] = useState<string>(() => {
    return propPeriodId || currentActivePeriodId || periods.find((p) => p.isCurrent)?.id || periods[0]?.id || 'month-2026-10'
  })

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
    return calculatePeriodLeaderboard(activePeriodId, members, periods, customPeriodScores)
  }, [activePeriodId, members, periods, customPeriodScores])

  // 4 ban của CLB VNU-IS Ambassadors - Tự động tính toán điểm trung bình & biến động thực tế
  const rawDeptComparisons: DeptComparisonItem[] = useMemo(() => {
    const deptConfigs = [
      {
        name: 'Ban Truyền thông',
        shortName: 'Truyền thông',
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
        name: 'Ban Tư vấn',
        shortName: 'Tư vấn',
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
        name: 'Ban Nhân sự',
        shortName: 'Nhân sự',
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
        name: 'Ban Chủ nhiệm',
        shortName: 'BCN',
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
          rankBadge: 'Khởi đầu',
          rankBadgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
          rankBadgeIcon: '🎯',
          rankText: 'Xuất phát 60đ',
          rankNumber: 1,
          description: 'Chu kỳ mới khởi tạo - Toàn ban đang ở mốc xuất phát 60 điểm chuẩn bị thi đua.',
        }
      }

      const rankIndex = sortedByScore.findIndex((d) => d.code === dept.code)
      const rank = rankIndex + 1

      if (rank === 1) {
        return {
          ...dept,
          rankBadge: 'Dẫn đầu',
          rankBadgeColor: 'bg-amber-100/80 text-amber-900 border-amber-200',
          rankBadgeIcon: '🏆',
          rankText: 'Dẫn đầu',
          rankNumber: 1,
          description: `Dẫn đầu điểm thi đua phong trào kỳ này (${dept.avgScore}đ)`,
        }
      }
      if (rank === 2) {
        return {
          ...dept,
          rankBadge: 'Xếp thứ 2',
          rankBadgeColor: 'bg-rose-100/80 text-rose-900 border-rose-200',
          rankBadgeIcon: '🥈',
          rankText: 'Xếp thứ 2',
          rankNumber: 2,
          description: `Điểm trung bình toàn ban đạt ${dept.avgScore}đ`,
        }
      }
      if (rank === 3) {
        return {
          ...dept,
          rankBadge: 'Xếp thứ 3',
          rankBadgeColor: 'bg-purple-100/80 text-purple-900 border-purple-200',
          rankBadgeIcon: '🥉',
          rankText: 'Xếp thứ 3',
          rankNumber: 3,
          description: `Điểm trung bình toàn ban đạt ${dept.avgScore}đ`,
        }
      }
      return {
        ...dept,
        rankBadge: 'Xếp thứ 4',
        rankBadgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
        rankBadgeIcon: '🎖️',
        rankText: 'Xếp thứ 4',
        rankNumber: 4,
        description: `Điểm trung bình toàn ban đạt ${dept.avgScore}đ`,
      }
    })
  }, [periodRankings])

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
        customPeriodScores
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

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-sm space-y-6">
      {/* 1. Header bar with Title, Tabs & Semester Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1351D8] border border-blue-200/70 shadow-2xs flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#0F172A] tracking-tight">
              So sánh Thi đua &amp; Hiệu suất Hoạt động
            </h2>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Phân tích đối sánh giữa các ban, tỷ lệ tích lũy điểm và xu hướng theo thời gian thực
            </p>
          </div>
        </div>

        {/* Tab Switcher & Dropdown / Chu kỳ Indicator */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/70 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode('dept_score')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === 'dept_score'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>Điểm TB các Ban</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('plus_vs_minus')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === 'plus_vs_minus'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>Điểm Cộng vs Trừ</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('monthly_trend')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === 'monthly_trend'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>Xu hướng 3 Tháng</span>
            </button>
          </div>

          {/* Hiển thị chu kỳ đang chọn */}
          {propPeriodId ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-[#1351D8] border border-blue-200/80 text-xs font-bold shadow-2xs whitespace-nowrap">
              <span>{displayPeriodName}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          ) : (
            <select
              value={internalPeriodId}
              onChange={(e) => {
                setInternalPeriodId(e.target.value)
                setCurrentActivePeriodId(e.target.value)
              }}
              className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#2563EB] shadow-2xs transition cursor-pointer"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.status === 'locked' ? '(Đã khóa)' : p.id === activePeriodId ? '(Hiện tại)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 2. MODE 1: So sánh Điểm TB các Ban (Chuẩn xác theo Ảnh 1) */}
      {mode === 'dept_score' && (
        <div className="space-y-6">
          {/* HÀNG 4 THẺ CHỈ SỐ MỐC CHUẨN (Benchmark Metrics Row - Đúng chuẩn Ảnh 1) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Mục tiêu Tốt */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center gap-3.5 shadow-2xs hover:shadow-xs transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0">
                <Flag className="w-5 h-5 fill-current" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Mục tiêu Tốt
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-700">
                  80 điểm
                </span>
                <span className="text-[10.5px] text-emerald-600/90 font-medium block">
                  Xuất sắc
                </span>
              </div>
            </div>

            {/* Card 2: Mức chuẩn CLB */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center gap-3.5 shadow-2xs hover:shadow-xs transition">
              <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Mức chuẩn CLB
                </span>
                <span className="text-base sm:text-lg font-black text-blue-700">
                  70 điểm
                </span>
                <span className="text-[10.5px] text-blue-600/90 font-medium block">
                  Đạt yêu cầu
                </span>
              </div>
            </div>

            {/* Card 3: Mốc xuất phát */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FFFBEB] border border-[#FEF3C7] flex items-center gap-3.5 shadow-2xs hover:shadow-xs transition">
              <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Mốc xuất phát
                </span>
                <span className="text-base sm:text-lg font-black text-amber-700">
                  60 điểm
                </span>
                <span className="text-[10.5px] text-amber-600/90 font-medium block">
                  Cần cố gắng
                </span>
              </div>
            </div>

            {/* Card 4: Thang điểm */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3.5 shadow-2xs hover:shadow-xs transition">
              <div className="w-10 h-10 rounded-xl bg-slate-200/70 text-slate-700 flex items-center justify-center shrink-0">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Thang điểm
                </span>
                <span className="text-base sm:text-lg font-black text-slate-800">
                  0 – 100 điểm
                </span>
                <span className="text-[10.5px] text-slate-400 font-medium block">
                  Thang điểm chuẩn
                </span>
              </div>
            </div>
          </div>

          {/* KHỐI BIỂU ĐỒ THANH NGANG (Horizontal Benchmark Bar Chart - Đúng chuẩn Ảnh 1) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 space-y-4 shadow-2xs">
            {/* Header trong biểu đồ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-[#0F172A] tracking-tight">
                  Điểm trung bình các ban
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  So sánh điểm thi đua hiện tại và mức mục tiêu
                </p>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                {/* Dropdown sắp xếp */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <span>Sắp xếp theo:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-slate-50 hover:bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition cursor-pointer"
                  >
                    <option value="default">Thứ tự mặc định</option>
                    <option value="high_to_low">Điểm cao → thấp</option>
                    <option value="low_to_high">Điểm thấp → cao</option>
                    <option value="attendance">Tỷ lệ chuyên cần</option>
                  </select>
                </div>

                {/* Legend mốc 80đ */}
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <span className="w-4 border-b-2 border-dashed border-emerald-500" />
                  <span>Mục tiêu: 80 điểm</span>
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Vùng thanh ngang & Đường mục tiêu 80đ */}
            <div className="pt-2">
              <div className="relative">
                {/* ĐƯỜNG MỤC TIÊU 80 ĐIỂM (Dashed Vertical Target Line at 80%) */}
                <div
                  className="absolute top-0 bottom-7 border-r-2 border-dashed border-emerald-500 pointer-events-none z-20 hidden sm:block"
                  style={{
                    left: 'calc(12rem + (100% - 12rem - 5.5rem) * 0.8)',
                  }}
                >
                  <span className="absolute -top-3.5 -translate-x-1/2 bg-[#059669] text-white text-[10px] font-black px-2 py-0.5 rounded shadow-xs whitespace-nowrap">
                    Mục tiêu 80đ
                  </span>
                </div>

                {/* 4 Dòng biểu đồ thanh ngang */}
                <div className="space-y-4 pt-2">
                  {sortedDepts.map((dept, index) => {
                    const rank = index + 1
                    const rankCircleStyle =
                      rank === 1
                        ? 'bg-blue-100 text-blue-600'
                        : rank === 2
                        ? 'bg-pink-100 text-pink-600'
                        : rank === 3
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'bg-amber-100 text-amber-700'

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
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${rankCircleStyle}`}
                        >
                          {rank}
                        </span>

                        {/* Icon & Tên Ban */}
                        <div className="flex items-center gap-2.5 w-40 sm:w-44 shrink-0">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${dept.color}15`, color: dept.color }}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 block truncate">
                              {dept.shortName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium block truncate">
                              {dept.memberCount} thành viên
                            </span>
                          </div>
                        </div>

                        {/* Thanh Ngang (Horizontal Progress Bar) */}
                        <div className="flex-1 relative flex items-center">
                          <div className="w-full h-7 bg-slate-100/90 rounded-md overflow-hidden relative shadow-inner">
                            <div
                              className="h-full rounded-md transition-all duration-700 ease-out shadow-xs"
                              style={{
                                width: `${(dept.avgScore / 100) * 100}%`,
                                backgroundColor: dept.color,
                              }}
                            />
                          </div>

                          {/* Điểm số & Biến động ở cạnh phải thanh */}
                          <div className="w-20 sm:w-22 pl-3 shrink-0 flex items-center gap-1.5 text-xs font-bold">
                            <span className="text-slate-900 font-black text-sm">
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

                {/* Trục Hoành X (X-Axis: 0, 20, 40, 60, 80, 100) */}
                <div
                  className="pt-3 text-[11px] text-slate-400 font-medium select-none"
                  style={{
                    paddingLeft: 'calc(12rem + 1rem)',
                    paddingRight: '5.5rem',
                  }}
                >
                  <div className="flex justify-between border-t border-slate-200/80 pt-1.5">
                    <span>0</span>
                    <span>20</span>
                    <span>40</span>
                    <span>60</span>
                    <span className="text-emerald-600 font-bold">80</span>
                    <span>100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PHẦN DƯỚI: CHI TIẾT TỪNG BAN & BẢNG SO SÁNH NHANH (Hai khối chuẩn xác theo Ảnh 1) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 pt-1">
            {/* CỘT TRÁI (8 cols): Chi tiết từng ban (4 Thẻ con có gauge tròn & danh hiệu) */}
            <div className="lg:col-span-8 space-y-3">
              <h4 className="text-sm font-black text-[#0F172A] tracking-tight">
                Chi tiết từng ban
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
                        <span className="font-bold text-xs text-slate-900">
                          {dept.shortName}
                        </span>
                      </div>

                      {/* Điểm TB & Tag biến động */}
                      <div className="flex items-baseline justify-between pt-0.5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-black text-slate-900">
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
                            Tỷ lệ chuyên cần
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
                          <span>{dept.rankBadgeIcon}</span>
                          <span>{dept.rankText}</span>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* CỘT PHẢI (4 cols): Bảng So sánh nhanh (Quick Comparison Table) */}
            <div className="lg:col-span-4 p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-white space-y-3.5 shadow-2xs">
              <div>
                <h4 className="text-sm font-black text-[#0F172A] tracking-tight">
                  So sánh nhanh
                </h4>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Điểm thi đua và tỷ lệ chuyên cần của các ban
                </p>
              </div>

              {/* Bảng tổng hợp đối sánh */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100 font-semibold text-[11px]">
                      <th className="text-left pb-2.5 font-medium">Ban</th>
                      <th className="text-center pb-2.5 font-medium">Điểm TB</th>
                      <th className="text-center pb-2.5 font-medium">
                        So với kỳ trước
                      </th>
                      <th className="text-right pb-2.5 font-medium">
                        Tỷ lệ chuyên cần
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
                          <td className="py-2.5 flex items-center gap-2 font-bold text-slate-900">
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
                          <td className="py-2.5 text-center font-black text-slate-900">
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
                <span>Điểm cộng thi đua (C01-C09)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#EF4444]"></span>
                <span>Điểm trừ kỷ luật (T01-T13)</span>
              </span>
            </div>
            <span className="text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full text-xs font-black border border-emerald-300">
              Tỷ lệ tuân thủ toàn CLB: 93.4%
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
                      <span className="font-bold text-sm text-[#0F172A]">
                        {dept.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-black">
                      <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        Cộng: +{dept.positivePoints}đ ({plusPct}%)
                      </span>
                      <span className="text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                        Trừ: {dept.negativePoints}đ ({minusPct}%)
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-[#0F172A] text-white text-xs font-black">
                        Thực nhận: +{dept.positivePoints + dept.negativePoints}đ
                      </span>
                    </div>
                  </div>

                  {/* Dual Proportional Split Bar or Empty State */}
                  {hasActions ? (
                    <div className="w-full h-6 bg-slate-100 rounded-full overflow-hidden flex shadow-inner p-1">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-l-full transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white"
                        style={{ width: `${plusPct}%` }}
                        title={`Điểm cộng: ${dept.positivePoints}đ (${plusPct}%)`}
                      >
                        {plusPct > 15 && `+${dept.positivePoints}đ`}
                      </div>
                      <div
                        className="bg-gradient-to-r from-rose-500 to-red-600 h-full rounded-r-full transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white"
                        style={{ width: `${minusPct}%` }}
                        title={`Điểm trừ: ${dept.negativePoints}đ (${minusPct}%)`}
                      >
                        {minusPct > 15 && `${dept.negativePoints}đ`}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-6 bg-slate-100/90 rounded-full flex items-center justify-center text-[11px] font-bold text-slate-400 shadow-inner">
                      Chu kỳ mới khởi tạo - Mốc xuất phát 60đ (chưa phát sinh điểm cộng/trừ)
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
                  <span className="text-xs font-black text-[#0F172A]">
                    {item.month}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    Kỳ 1 (2025 - 2026)
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-[#64748B] block">
                    Điểm trung bình CLB
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[#0F172A]">
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
                    <span className="text-slate-500 block">Chuyên cần:</span>
                    <span className="font-bold text-[#0F172A]">
                      {item.attendance}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tổng điểm cộng:</span>
                    <span className="font-bold text-emerald-600">
                      +{item.positiveSum}đ
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#065F46]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#059669] shrink-0" />
              <span className="font-bold">
                Đánh giá tổng kết: Toàn Câu Lạc bộ duy trì đà tăng trưởng chuyên
                cần và điểm rèn luyện liên tục qua 3 tháng (+6.2 điểm tích luỹ).
              </span>
            </div>
            <span className="font-black text-[#047857] uppercase tracking-wider shrink-0">
              Nhiệm kỳ 2025 - 2026
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
