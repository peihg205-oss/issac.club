'use client'

import React, { useState, useMemo } from 'react'
import { useClub } from '@/lib/context/ClubContext'
import { useAuth } from '@/lib/auth/AuthContext'
import type { RosterMember } from '@/lib/clubData'
import { ComparisonChart } from '@/components/dashboard/ComparisonChart'
import {
  AVAILABLE_PERIODS,
  STANDARD_MONTHLY_BASELINE,
  calculatePeriodLeaderboard,
  type PeriodScope,
  type MemberPeriodRanking,
} from '@/lib/periodData'
import {
  Trophy,
  Crown,
  Medal,
  Award,
  Users,
  Search,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BarChart3,
  Flame,
  ArrowRight,
  Shield,
  Calendar,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  Layers,
  Lock,
  Unlock,
  Settings,
} from 'lucide-react'

interface StatsViewProps {
  onSelectMember?: (member: RosterMember) => void
}

export function StatsView({ onSelectMember }: StatsViewProps) {
  const {
    members,
    currentActiveMonth,
    periods,
    customPeriodScores,
    lockMonthPeriod,
    unlockMonthPeriod,
    restoreOctoberScores,
  } = useClub()
  const { currentUser, isBCN } = useAuth()

  // 1. Navigation Subtab: Leaderboard | Podium Top 3 | Analytics Comparison
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'podium' | 'analytics'>('leaderboard')

  // 2. Tra cứu điểm theo chu kỳ (Tháng / Quý / Năm)
  const [selectedScope, setSelectedScope] = useState<PeriodScope>('month')
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('month-2025-10')

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
      if (selectedRating === 'excellent') matchRating = item.finalScore >= 85
      else if (selectedRating === 'good') matchRating = item.finalScore >= 70 && item.finalScore < 85
      else if (selectedRating === 'pass') matchRating = item.finalScore >= 55 && item.finalScore < 70
      else if (selectedRating === 'warning') matchRating = item.finalScore < 55

      return matchSearch && matchDept && matchRating
    })
  }, [periodRankings, searchQuery, selectedDept, selectedRating])

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
    if (currentPeriodObj.status === 'locked') {
      unlockMonthPeriod(currentPeriodObj.id, currentUser.name)
      setToastMessage(`Đã mở khóa chu kỳ ${currentPeriodObj.name}. Cho phép cập nhật điểm.`)
    } else {
      lockMonthPeriod(currentPeriodObj.id, currentUser.name)
      setToastMessage(`Đã khóa sổ chính thức chu kỳ ${currentPeriodObj.name}. Điểm số được bảo lưu an toàn.`)
    }
  }

  // Helper badge rating chuẩn thiết kế dự án
  const getRatingBadge = (score: number) => {
    if (score >= 85) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] inline-flex items-center gap-1 whitespace-nowrap">
          <span>Rất tích cực (≥85đ)</span>
        </span>
      )
    }
    if (score >= 70) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#E0F2FE] text-[#1351D8] border border-[#BAE6FD] inline-flex items-center gap-1 whitespace-nowrap">
          <span>Tích cực (70 - 84đ)</span>
        </span>
      )
    }
    if (score >= 55) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] inline-flex items-center gap-1 whitespace-nowrap">
          <span>Đạt yêu cầu (55 - 69đ)</span>
        </span>
      )
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] inline-flex items-center gap-1 whitespace-nowrap">
        <span>Cần cố gắng (&lt;55đ)</span>
      </span>
    )
  }

  // Helper màu Ban chuẩn đồng bộ
  const getDeptBadgeStyle = (slug?: string) => {
    switch (slug) {
      case 'bcn':
        return 'bg-amber-50 text-amber-700 border border-amber-200/80'
      case 'truyen-thong':
        return 'bg-blue-50 text-[#1351D8] border border-blue-200/80'
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
        <div className="p-4 rounded-2xl bg-[#0F172A] text-white flex items-center justify-between shadow-xl animate-fade-in border border-slate-700">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#FFCD38] flex-shrink-0" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Header Bar chuẩn nhận diện dự án */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
              Bảng Xếp Hạng Điểm Hoạt Động
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
              {currentPeriodObj.shortLabel}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium">
            Bảng xếp hạng thi đua rèn luyện theo thời gian thực. Cập nhật minh bạch cho toàn bộ 48 thành viên CLB.
          </p>
        </div>

        {/* Sub Navigation Tabs dạng Segmented Control chuẩn dự án */}
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/70 overflow-x-auto max-w-full flex-shrink-0 self-start md:self-center">
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'leaderboard'
                ? 'bg-[#1351D8] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Bảng Xếp Hạng Toàn CLB</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('podium')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'podium'
                ? 'bg-[#0B1E48] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <Crown className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Bục Vinh Danh Top 3</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Đối Sánh & Thống Kê</span>
          </button>
        </div>
      </div>

      {/* 2. THANH CÔNG CỤ TRA CỨU & THAO TÁC CHU KỲ (CÂN ĐỐI, GỌN GÀNG, VIỀN MỎNG 1PX) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Vế trái: 3 Tab chọn phạm vi (Theo Tháng, Theo Quý, Cả Năm) dạng Segmented Control */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/70 self-start md:self-auto">
            {/* Nút: Theo Tháng */}
            <button
              type="button"
              onClick={() => {
                setSelectedScope('month')
                setSelectedPeriodId(periods.find((p) => p.scope === 'month')?.id || 'month-2025-10')
                setCurrentPage(1)
              }}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedScope === 'month'
                  ? 'bg-white text-[#1351D8] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Theo Tháng</span>
            </button>

            {/* Nút: Theo Quý */}
            <button
              type="button"
              onClick={() => {
                setSelectedScope('quarter')
                setSelectedPeriodId(periods.find((p) => p.scope === 'quarter')?.id || 'quarter-2025-q4')
                setCurrentPage(1)
              }}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedScope === 'quarter'
                  ? 'bg-white text-[#1351D8] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Theo Quý</span>
            </button>

            {/* Nút: Cả Năm */}
            <button
              type="button"
              onClick={() => {
                setSelectedScope('year')
                setSelectedPeriodId(periods.find((p) => p.scope === 'year')?.id || 'year-2025-2026')
                setCurrentPage(1)
              }}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedScope === 'year'
                  ? 'bg-white text-[#1351D8] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Cả Năm</span>
            </button>
          </div>

          {/* Vế phải: Dropdown chọn kỳ + Huy hiệu trạng thái + Nút Khóa sổ/Mở khóa */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Dropdown chọn kỳ cụ thể */}
            <div className="relative min-w-[200px] sm:min-w-[230px]">
              <select
                value={selectedPeriodId}
                onChange={(e) => {
                  setSelectedPeriodId(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-3.5 pr-8 py-2 bg-slate-50 hover:bg-white border border-slate-200/90 focus:border-[#1351D8] rounded-xl text-xs font-bold text-slate-800 focus:outline-none transition shadow-2xs cursor-pointer appearance-none"
              >
                {availablePeriodsInScope.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.status === 'locked' ? '(Đã khóa)' : p.isCurrent ? '(Hiện tại)' : ''}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
            </div>

            {/* Trạng thái chu kỳ */}
            {currentPeriodObj.status === 'locked' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs whitespace-nowrap">
                <Lock className="w-3.5 h-3.5 text-slate-600" />
                <span>Đã khóa</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Đang mở</span>
              </span>
            )}

            {/* Quyền Ban Chủ nhiệm: Nút Khóa sổ / Mở khóa */}
            {isBCN && (
              <button
                type="button"
                onClick={handleToggleLock}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition active:scale-95 whitespace-nowrap cursor-pointer ${
                  currentPeriodObj.status === 'locked'
                    ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
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
                    <Unlock className="w-3.5 h-3.5 text-slate-600" />
                    <span>Mở khóa</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Khóa sổ</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Top 3 Podium (Cập nhật động theo kỳ được chọn) */}
      {(activeTab === 'podium' || activeTab === 'leaderboard') && top1 && top2 && top3 && (
        <div className="bg-gradient-to-b from-blue-50/40 via-slate-50/60 to-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[10.5px] font-black uppercase tracking-widest text-[#1351D8] block">
              Vinh danh gương mặt xuất sắc dẫn đầu
            </span>
            <h2 className="text-xl font-black text-[#0F172A] tracking-tight">
              Bục Vinh Danh Top 3 - {currentPeriodObj.name}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              3 thành viên có thành tích rèn luyện và đóng góp phong trào thi đua cao nhất
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto pt-4">
            {/* Rank 2 (Hạng 2 - Trái) */}
            <div
              onClick={() => onSelectMember && onSelectMember(top2.member)}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 text-center space-y-3 shadow-2xs hover:shadow-md transition cursor-pointer relative order-2 md:order-1 hover:-translate-y-1"
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-800 text-[10px] font-black flex items-center gap-1 shadow-2xs">
                <Medal className="w-3.5 h-3.5 text-slate-600" />
                <span>HẠNG 2</span>
              </div>

              <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-300 text-slate-800 font-black text-xl flex items-center justify-center mx-auto shadow-inner overflow-hidden">
                {top2.member.avatar_url || top2.member.full_name === 'Trần Đức Thắng' ? (
                  <img
                    src={top2.member.avatar_url || '/avatars/duc-thang.jpg'}
                    alt={top2.member.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  top2.member.full_name.charAt(0)
                )}
              </div>

              <div>
                <h3 className="font-black text-sm text-[#0F172A] truncate">
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
                  {selectedScope === 'quarter' ? 'Điểm TB Quý:' : 'Điểm thi đua:'}
                </span>
                <span className="text-xl font-black text-[#1351D8]">
                  {top2.finalScore}đ
                </span>
              </div>
            </div>

            {/* Rank 1 (Hạng 1 - Chính giữa - Cao nhất) */}
            <div
              onClick={() => onSelectMember && onSelectMember(top1.member)}
              className="bg-gradient-to-b from-[#FFFBEB] to-white rounded-3xl border border-amber-300 p-6 text-center space-y-3 shadow-lg hover:shadow-xl transition cursor-pointer relative order-1 md:order-2 md:-translate-y-3 hover:-translate-y-4"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#FFCD38] text-[#0F172A] text-xs font-black flex items-center gap-1.5 shadow-md">
                <Medal className="w-4 h-4 text-[#0F172A]" />
                <span>HẠNG 1</span>
              </div>

              {/* Glowing Avatar */}
              <div className="relative inline-block mt-2">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFCD38] to-[#F59E0B] text-[#0F172A] font-black text-2xl flex items-center justify-center mx-auto shadow-lg border-4 border-white overflow-hidden">
                  {top1.member.avatar_url || top1.member.full_name === 'Trần Đức Thắng' ? (
                    <img
                      src={top1.member.avatar_url || '/avatars/duc-thang.jpg'}
                      alt={top1.member.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    top1.member.full_name.charAt(0)
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black shadow">
                  1
                </div>
              </div>

              <div>
                <h3 className="font-black text-base text-[#0F172A] truncate">
                  {top1.member.full_name}
                </h3>
                <span className="text-xs font-bold text-amber-800 block mt-0.5">
                  {top1.member.department_name} - {top1.member.position}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                  {top1.earnedDelta >= 0 ? `+${top1.earnedDelta}đ trong kỳ` : `${top1.earnedDelta}đ`} (Xuất phát: 60đ)
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">
                  {selectedScope === 'quarter' ? 'Điểm TB Quý:' : 'Điểm cao nhất:'}
                </span>
                <span className="text-2xl font-black text-amber-700">
                  {top1.finalScore}đ
                </span>
              </div>
            </div>

            {/* Rank 3 (Hạng 3 - Phải) */}
            <div
              onClick={() => onSelectMember && onSelectMember(top3.member)}
              className="bg-white rounded-2xl border border-amber-200/90 p-5 text-center space-y-3 shadow-2xs hover:shadow-md transition cursor-pointer relative order-3 md:order-3 hover:-translate-y-1"
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-black flex items-center gap-1 shadow-2xs">
                <Medal className="w-3.5 h-3.5 text-amber-700" />
                <span>HẠNG 3</span>
              </div>

              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-black text-xl flex items-center justify-center mx-auto shadow-inner overflow-hidden">
                {top3.member.avatar_url || top3.member.full_name === 'Trần Đức Thắng' ? (
                  <img
                    src={top3.member.avatar_url || '/avatars/duc-thang.jpg'}
                    alt={top3.member.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  top3.member.full_name.charAt(0)
                )}
              </div>

              <div>
                <h3 className="font-black text-sm text-[#0F172A] truncate">
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
                  {selectedScope === 'quarter' ? 'Điểm TB Quý:' : 'Điểm thi đua:'}
                </span>
                <span className="text-xl font-black text-[#1351D8]">
                  {top3.finalScore}đ
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. BẢNG XẾP HẠNG CHI TIẾT 48 THÀNH VIÊN VỚI NAVY HEADER ĐỒNG BỘ */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          {/* Action & Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, MSSV, lớp..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-8 pr-7 py-2 bg-slate-50 hover:bg-slate-50/80 border border-slate-200/90 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1351D8] focus:ring-1 focus:ring-[#1351D8]/20 transition shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Department Filter */}
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-3.5 py-2 bg-slate-50 hover:bg-white border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#1351D8] focus:ring-1 focus:ring-[#1351D8]/20 transition shadow-2xs cursor-pointer"
              >
                <option value="all">Tất cả các ban</option>
                <option value="truyen-thong">Ban Truyền thông</option>
                <option value="tu-van">Ban Tư vấn</option>
                <option value="nhan-su">Ban Nhân sự</option>
                <option value="bcn">Ban Chủ nhiệm</option>
              </select>

              {/* Rating level Filter */}
              <select
                value={selectedRating}
                onChange={(e) => {
                  setSelectedRating(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-3.5 py-2 bg-slate-50 hover:bg-white border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#1351D8] focus:ring-1 focus:ring-[#1351D8]/20 transition shadow-2xs cursor-pointer"
              >
                <option value="all">Mọi mức đánh giá</option>
                <option value="excellent">Rất tích cực (≥85đ)</option>
                <option value="good">Tích cực (70 - 84đ)</option>
                <option value="pass">Đạt yêu cầu (55 - 69đ)</option>
                <option value="warning">Cần cải thiện (&lt;55đ)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 font-bold text-xs transition shadow-2xs hover:shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer self-end md:self-auto"
              title="Xuất bảng xếp hạng ra file Excel CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Xuất Bảng Xếp Hạng (.CSV)</span>
            </button>
          </div>

          {/* Full Ranked Table with Deep Navy Header */}
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-700 border-collapse">
                <thead className="bg-[#0B1E48] text-xs font-bold text-white uppercase tracking-wider border-b border-[#071533] select-none">
                  <tr className="divide-x divide-white/10">
                    <th className="py-3 px-3 w-16 text-center font-bold text-blue-100 whitespace-nowrap">Thứ hạng</th>
                    <th className="py-3 px-4 min-w-[260px] font-bold text-white whitespace-nowrap">Thành viên</th>
                    <th className="py-3 px-3 min-w-[130px] font-bold text-blue-100 whitespace-nowrap">Ban trực thuộc</th>
                    <th className="py-3 px-3 min-w-[120px] font-bold text-blue-100 whitespace-nowrap">Chức vụ</th>
                    <th className="py-3 px-3 w-24 text-center font-bold text-blue-100 whitespace-nowrap">Xuất phát</th>
                    <th className="py-3 px-3 w-28 text-center font-bold text-blue-100 whitespace-nowrap">Biến động</th>
                    <th className="py-3 px-4 w-32 text-right font-bold text-white whitespace-nowrap">Tổng điểm</th>
                    <th className="py-3 px-3 min-w-[150px] font-bold text-blue-100 whitespace-nowrap">Xếp loại</th>
                    <th className="py-3 px-3 w-24 text-center font-bold text-blue-100 whitespace-nowrap">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedMembers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <div className="space-y-2">
                          <Search className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="font-semibold text-xs sm:text-sm">Không tìm thấy thành viên phù hợp với bộ lọc</p>
                          <button
                            onClick={() => {
                              setSearchQuery('')
                              setSelectedDept('all')
                              setSelectedRating('all')
                            }}
                            className="text-xs sm:text-sm text-[#1351D8] font-semibold hover:underline cursor-pointer"
                          >
                            Xóa bộ lọc tìm kiếm
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
                          className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
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
                                <span className="w-7 h-7 rounded-full bg-blue-50 text-[#1351D8] font-black flex items-center justify-center text-xs border border-blue-200/60">
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
                              {m.avatar_url || m.full_name === 'Trần Đức Thắng' ? (
                                <img
                                  src={m.avatar_url || '/avatars/duc-thang.jpg'}
                                  alt={m.full_name}
                                  className="w-9 h-9 rounded-full object-cover border border-slate-200 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1351D8] font-bold flex items-center justify-center text-xs flex-shrink-0 border border-blue-200/60">
                                  {m.full_name.charAt(0)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-bold text-[#0F172A] flex items-center gap-1.5 group-hover:text-[#1351D8] transition-colors whitespace-nowrap">
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
                              <span className="text-base font-black text-[#0F172A] block leading-tight">
                                {item.finalScore}đ
                              </span>
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden ml-auto">
                                <div
                                  className="h-full bg-[#1351D8] rounded-full"
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
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#1351D8] hover:text-white text-slate-700 font-bold text-xs transition-colors inline-flex items-center gap-1 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                            >
                              <span>Hồ sơ</span>
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
                  Hiển thị {(currentPage - 1) * pageSize + 1} -{' '}
                  {Math.min(currentPage * pageSize, filtered.length)} trên tổng số {filtered.length}{' '}
                  thành viên
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

                  <span className="px-3 font-bold text-[#0F172A]">
                    Trang {currentPage} / {totalPages}
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
