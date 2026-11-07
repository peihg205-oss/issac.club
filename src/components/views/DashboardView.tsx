'use client'

import React, { useState, useRef } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useClub } from '@/lib/context/ClubContext'
import { useLanguage } from '@/lib/context/LanguageContext'
import {
  Users,
  Clock,
  CheckCircle2,
  Calendar,
  FileText,
  Trophy,
  Star,
  QrCode,
  ArrowRight,
  TrendingUp,
  Shield,
  MapPin,
  Sparkles,
  BarChart3,
  Award,
} from 'lucide-react'
import { ComparisonChart } from '@/components/dashboard/ComparisonChart'
import { HanoiWeatherCard } from '@/components/dashboard/HanoiWeatherCard'

interface DashboardViewProps {
  onViewAllMembers: () => void
  onNavigateToCheckin?: () => void
  onNavigateToLeaderboard?: () => void
}

export function DashboardView({
  onViewAllMembers,
  onNavigateToCheckin,
  onNavigateToLeaderboard,
}: DashboardViewProps) {
  const {
    members,
    activeEvent,
    events,
    proposals,
    currentActiveMonth,
    currentActivePeriodId,
    periods,
  } = useClub()
  const { language, t } = useLanguage()

  const totalMembers = members.length
  const totalScore = members.reduce((sum, m) => sum + m.current_score, 0)
  const avgScore = totalMembers > 0 ? (totalScore / totalMembers).toFixed(1) : '60.0'

  // Thống kê đề xuất điểm trong chu kỳ hiện tại
  const activePeriodId = currentActivePeriodId || periods.find((p) => p.isCurrent)?.id || 'month-2026-11'
  const pendingCount = proposals.filter(
    (p) => p.status === 'pending_bcn' && p.memberCode !== 'ALL-CLUB' && !p.id.startsWith('sys-')
  ).length
  const approvedThisMonth = proposals.filter(
    (p) =>
      p.status === 'approved' &&
      p.memberCode !== 'ALL-CLUB' &&
      !p.id.startsWith('sys-') &&
      (p.periodId === activePeriodId || (!p.periodId && activePeriodId === 'month-2026-10'))
  ).length

  const records = activeEvent?.records || {}
  let countOnTime = 0
  let countLate = 0
  let countExcused = 0
  if (activeEvent) {
    Object.values(records).forEach((r) => {
      if (r.status === 'present_on_time') countOnTime++
      else if (r.status === 'late') countLate++
      else if (r.status === 'excused') countExcused++
    })
  }

  // Thống kê thành viên theo Ban
  const ttMembers = members.filter((m) => m.department_code === 'B01').length
  const tvMembers = members.filter((m) => m.department_code === 'B02').length
  const nsMembers = members.filter((m) => m.department_code === 'B03').length

  // Top 5 thành viên dẫn đầu
  const top5Members = [...members].sort((a, b) => b.current_score - a.current_score).slice(0, 5)

  // Helper dịch tên ban sang tiếng Anh
  const translateDept = (deptName?: string) => {
    if (!deptName || language === 'vi') return deptName || ''
    if (deptName.includes('Tư vấn')) return 'Advisory Dept'
    if (deptName.includes('Truyền thông')) return 'Communications Dept'
    if (deptName.includes('Nhân sự')) return 'HR Dept'
    if (deptName.includes('Chủ nhiệm') || deptName.includes('BCN')) return 'Executive Board'
    return deptName
  }

  // Helper dịch chức vụ/vai trò sang tiếng Anh
  const translateRole = (pos?: string) => {
    if (!pos || language === 'vi') return pos || ''
    if (pos.includes('Trưởng ban')) return 'Head of Dept'
    if (pos.includes('Phó ban')) return 'Vice Head'
    if (pos.includes('Chủ nhiệm') && !pos.includes('Phó')) return 'President'
    if (pos.includes('Phó Chủ nhiệm')) return 'Vice President'
    if (pos.includes('Cố vấn')) return 'Advisor'
    if (pos.includes('Thành viên')) return 'Member'
    return pos
  }

  // Mascot tương tác & các câu danh ngôn/động viên bản sắc iSSAC
  const [isMascotCheering, setIsMascotCheering] = useState<boolean>(false)
  const [mascotMessageIdx, setMascotMessageIdx] = useState<number>(0)
  const [showMascotBubble, setShowMascotBubble] = useState<boolean>(false)
  const bubbleTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const issacMascotQuotesVi = [
    'Chào iSSACer năng động!',
    'Cố lên iSSACer, cùng bứt phá!',
    'Tự hào VNU-IS Ambassadors!',
    'Năng động - Sáng tạo - Dẫn đầu!',
    'Nhiệt huyết tuổi trẻ iSSAC!',
    'Lan tỏa giá trị, kết nối đam mê!',
    'Mỗi ngày một bước tiến mới!',
    'Chinh phục đỉnh cao cùng CLB!',
  ]

  const issacMascotQuotesEn = [
    'Hello active iSSACer!',
    'Keep shining, reach new heights!',
    'Proud VNU-IS Ambassadors!',
    'Dynamic - Creative - Leading!',
    'Ignite the passion of iSSAC youth!',
    'Sharing values, connecting passions!',
    'A new step forward every day!',
    'Conquering peaks together with iSSAC!',
  ]

  const handleMascotClick = () => {
    setIsMascotCheering(true)
    setShowMascotBubble(true)
    setMascotMessageIdx((prev) => (prev + 1) % issacMascotQuotesVi.length)
    setTimeout(() => setIsMascotCheering(false), 850)

    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current)
    bubbleTimeoutRef.current = setTimeout(() => {
      setShowMascotBubble(false)
    }, 2800)
  }

  return (
    <div className="space-y-3.5 sm:space-y-5 lg:space-y-6">
      {/* 1. Header trang chuẩn nhận diện dự án CLB + Card Thời Tiết & Giờ Hà Nội */}
      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Item 1: Tiêu đề + Mascot (nằm cạnh nhau như ảnh 3 trên laptop) */}
        <div className="order-1 lg:order-1 lg:col-span-3 lg:col-start-1 lg:row-start-1 min-w-0">
          <div className="flex items-center justify-between lg:justify-start gap-3.5 sm:gap-4">
            {/* Cụm Tiêu đề & Lời chào */}
            <div className="min-w-0 flex-1 lg:flex-initial">
              <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#061651] dark:text-white tracking-tight leading-tight">
                {t('dashboard.title')}
              </h1>
              <p className="text-xs sm:text-[13px] text-[#64748B] dark:text-slate-400 mt-1 font-normal">
                {t('dashboard.subtitle')}
              </p>
            </div>

            {/* Mascot Chibi với hiệu ứng tương tác - Nằm ngay cạnh tiêu đề như ảnh 3 trên laptop */}
            <div
              onClick={handleMascotClick}
              className="relative group cursor-pointer inline-flex items-center shrink-0 select-none"
              title="Bấm vào tớ để nghe lời động viên nhé!"
            >
              <img
                src="/issac-mascot.png"
                alt="iSSAC Chibi Mascot"
                className={`w-12 h-14 sm:w-14 sm:h-16 lg:w-15 lg:h-17 object-contain drop-shadow-[0_4px_12px_rgba(2,132,199,0.22)] transition-all duration-300 ${
                  isMascotCheering
                    ? 'animate-mascot-pop drop-shadow-[0_8px_20px_rgba(2,132,199,0.45)]'
                    : 'animate-mascot-fly hover:scale-115 hover:rotate-3'
                }`}
              />

              {/* Bubble tooltip nằm bên cạnh mascot (ẩn trên điện thoại giống ảnh 1 để không tràn viền) */}
              <div
                className={`absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#0369A1] text-white text-[11px] font-bold shadow-lg pointer-events-none whitespace-nowrap z-40 transition-all duration-200 hidden sm:flex items-center border border-white/25 ${
                  isMascotCheering
                    ? 'opacity-100 scale-105 translate-x-1'
                    : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
                }`}
              >
                {/* Mũi tên chỉ về phía mascot */}
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#0284C7] rotate-45 border-l border-b border-white/25" />
                <span className="relative z-10 select-none tracking-tight">
                  {language === 'vi' ? issacMascotQuotesVi[mascotMessageIdx] : issacMascotQuotesEn[mascotMessageIdx]}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Item 2: Widget Thời tiết & Giờ Hà Nội (order-2 trên mobile - NẰM TRÊN CHỖ ẢNH 2; trên desktop ở cột 4 hàng 1-2) */}
        <div className="order-2 lg:order-3 lg:col-span-1 lg:col-start-4 lg:row-start-1 lg:row-span-2 w-full md:w-[280px] lg:w-full shrink-0 flex items-center justify-start lg:justify-end">
          <HanoiWeatherCard className="w-full" />
        </div>

        {/* Item 3: Cụm 2 nút hành động (Căn đều giữa 2 khối: Khối thời tiết phía trên và Khối KPI phía dưới; 2 nút bằng nhau và cân đối tuyệt đối) */}
        <div className="order-3 lg:order-2 lg:col-span-3 lg:col-start-1 lg:row-start-2 grid grid-cols-2 lg:flex lg:items-center lg:justify-start gap-3 sm:gap-4 w-full">
          {/* Nút Xem Bảng Xếp Hạng */}
          <button
            type="button"
            onClick={onNavigateToLeaderboard}
            className="h-10 px-3.5 sm:px-4 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs sm:text-[13px] shadow-[0_2px_6px_rgba(249,115,22,0.22)] hover:shadow-[0_4px_10px_rgba(249,115,22,0.3)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer border border-transparent select-none"
            title="Mở Bảng xếp hạng đóng góp iSSACer"
          >
            <Trophy className="w-4 h-4 text-white fill-white shrink-0" />
            <span className="whitespace-nowrap truncate">{t('dashboard.view_leaderboard')}</span>
          </button>

          {/* Huy hiệu Cổng điểm danh CLB */}
          <button
            type="button"
            onClick={onNavigateToCheckin}
            className="h-10 px-3.5 sm:px-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-[13px] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_3px_8px_rgba(0,0,0,0.08)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer select-none"
            title="Chuyển đến màn hình điểm danh"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                activeEvent && !activeEvent.isFinalized ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-500'
              }`}
            />
            <span className="whitespace-nowrap truncate">
              {activeEvent && !activeEvent.isFinalized
                ? (language === 'vi' ? 'Đang mở cổng điểm danh' : 'Check-in Portal Open')
                : (language === 'vi' ? 'Cổng điểm danh CLB' : 'Club Check-in Portal')}
            </span>
          </button>
        </div>
      </div>

      {/* Banner Phiên Điểm Danh Trực Tiếp (nếu đang có sự kiện mở) */}
      {activeEvent && !activeEvent.isFinalized && (
        <div className="bg-gradient-to-br from-[#0B1E48] via-[#0F3282] to-[#1351D8] rounded-2xl p-5 text-white border border-blue-900/40 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center flex-shrink-0 border border-white/20 text-[#FFCD38] shadow-inner">
              <QrCode className="w-6 h-6 text-[#FFCD38]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FFCD38] text-[#061651] shadow-2xs">
                  {t('dashboard.event_live')}
                </span>
                <span className="text-xs font-bold text-blue-100 font-mono bg-white/15 px-2.5 py-0.5 rounded-lg border border-white/20">
                  Mã PIN: {activeEvent.pinCode || (activeEvent as any).passcode || '8899'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-1 tracking-tight">
                {activeEvent.title}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-blue-100 mt-1 font-medium">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-200" />
                  <span>{activeEvent.location}</span>
                </div>
                <span>-</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-200" />
                  <span>{activeEvent.startTime} - {activeEvent.endTime}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToCheckin}
            className="px-4 py-2.5 bg-[#FFCD38] hover:bg-[#F8C327] text-[#061651] text-xs font-black rounded-xl shadow-xs transition hover:scale-102 active:scale-95 flex items-center gap-2 flex-shrink-0 self-end sm:self-auto cursor-pointer"
          >
            <span>{t('dashboard.open_checkin')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Tám Thẻ Chỉ Số KPI (Bo Góc Nhọn Gọn Hài Hòa rounded-xl, Nền Pastel Nhạt Không Viền, Đổ Bóng Hiện Rõ Khối Box) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Tổng số thành viên */}
        <div
          onClick={onViewAllMembers}
          className="p-3.5 sm:p-4 rounded-xl bg-[#F0F9FF] flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
        >
          <div className="space-y-0.5">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 block">
              {t('dashboard.kpi_total_members')}
            </span>
            <span className="text-2xl sm:text-[28px] font-black text-[#0284C7] block tracking-tight leading-none py-0.5">
              {totalMembers || 49}
            </span>
            <span className="text-[11.5px] font-semibold text-[#0284C7] block hover:underline">
              {t('dashboard.view_details')}
            </span>
          </div>
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-sky-300/70 bg-white/60 flex items-center justify-center text-[#0284C7] shrink-0">
            <Users className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* Card 2: Đề xuất chờ duyệt */}
        <div
          className="p-3.5 sm:p-4 rounded-xl bg-[#FFFBEB] flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
        >
          <div className="space-y-0.5">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 block">
              {t('dashboard.kpi_pending')}
            </span>
            <span className="text-2xl sm:text-[28px] font-black text-[#D97706] block tracking-tight leading-none py-0.5">
              {pendingCount}
            </span>
            <span className="text-[11.5px] font-semibold text-[#D97706] block hover:underline">
              {t('dashboard.view_details')}
            </span>
          </div>
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-amber-300/70 bg-white/60 flex items-center justify-center text-[#D97706] shrink-0">
            <Clock className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* Card 3: Đã duyệt điểm */}
        <div
          className="p-3.5 sm:p-4 rounded-xl bg-[#F0FDF4] flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
        >
          <div className="space-y-0.5">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 block">
              {t('dashboard.kpi_approved_month')}
            </span>
            <span className="text-2xl sm:text-[28px] font-black text-[#16A34A] block tracking-tight leading-none py-0.5">
              {approvedThisMonth}
            </span>
            <span className="text-[11.5px] font-semibold text-[#16A34A] block hover:underline">
              {t('dashboard.view_details')}
            </span>
          </div>
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-emerald-300/70 bg-white/60 flex items-center justify-center text-[#16A34A] shrink-0">
            <CheckCircle2 className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* Card 4: Kỳ sinh hoạt CLB */}
        <div
          onClick={onNavigateToCheckin}
          className="p-3.5 sm:p-4 rounded-xl bg-[#FAF5FF] flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
        >
          <div className="space-y-0.5">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 block">
              {language === 'vi' ? 'Kỳ sinh hoạt CLB' : 'Club Meeting Period'}
            </span>
            <span className="text-2xl sm:text-[28px] font-black text-[#9333EA] block tracking-tight leading-none py-0.5">
              {events.length || 1}
            </span>
            <span className="text-[11.5px] font-semibold text-[#9333EA] block hover:underline">
              {currentActiveMonth || (language === 'vi' ? 'Tháng 10/2026' : 'October 2026')}
            </span>
          </div>
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-purple-300/70 bg-white/60 flex items-center justify-center text-[#9333EA] shrink-0">
            <Calendar className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* Card 5: Đúng giờ (C07) */}
        <div
          onClick={onNavigateToCheckin}
          className="p-3.5 sm:p-4 rounded-xl bg-[#F0FDF4] flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
        >
          <div className="space-y-0.5">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 block">
              {language === 'vi' ? 'Đúng giờ (C07)' : 'On-time (C07)'}
            </span>
            <div className="flex items-baseline gap-1.5 py-0.5">
              <span className="text-2xl sm:text-[28px] font-black text-[#16A34A] tracking-tight leading-none">
                {countOnTime}
              </span>
              <span className="text-[11.5px] font-bold text-[#16A34A]">
                {language === 'vi' ? '+1đ / TV' : '+1 pt / mbr'}
              </span>
            </div>
            <span className="text-[11.5px] font-semibold text-[#16A34A] block hover:underline">
              {t('dashboard.view_details')}
            </span>
          </div>
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-emerald-300/70 bg-white/60 flex items-center justify-center text-[#16A34A] shrink-0">
            <CheckCircle2 className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* Card 6: Đi muộn (T04) */}
        <div
          onClick={onNavigateToCheckin}
          className="p-3.5 sm:p-4 rounded-xl bg-[#FFFBEB] flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
        >
          <div className="space-y-0.5">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 block">
              {language === 'vi' ? 'Đi muộn (T04)' : 'Late Arrival (T04)'}
            </span>
            <div className="flex items-baseline gap-1.5 py-0.5">
              <span className="text-2xl sm:text-[28px] font-black text-[#D97706] tracking-tight leading-none">
                {countLate}
              </span>
              <span className="text-[11.5px] font-bold text-[#D97706]">
                {language === 'vi' ? '-1đ / TV' : '-1 pt / mbr'}
              </span>
            </div>
            <span className="text-[11.5px] font-semibold text-[#D97706] block hover:underline">
              {t('dashboard.view_details')}
            </span>
          </div>
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-amber-300/70 bg-white/60 flex items-center justify-center text-[#D97706] shrink-0">
            <Clock className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* Card 7: Vắng có phép (T01) */}
        <div
          onClick={onNavigateToCheckin}
          className="p-3.5 sm:p-4 rounded-xl bg-[#F0F9FF] flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
        >
          <div className="space-y-0.5">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 block">
              {language === 'vi' ? 'Vắng có phép (T01)' : 'Excused Absence (T01)'}
            </span>
            <div className="flex items-baseline gap-1.5 py-0.5">
              <span className="text-2xl sm:text-[28px] font-black text-[#0284C7] tracking-tight leading-none">
                {countExcused}
              </span>
              <span className="text-[11.5px] font-bold text-[#0284C7]">
                {language === 'vi' ? '-2đ / TV' : '-2 pt / mbr'}
              </span>
            </div>
            <span className="text-[11.5px] font-semibold text-[#0284C7] block hover:underline">
              {t('dashboard.view_details')}
            </span>
          </div>
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-sky-300/70 bg-white/60 flex items-center justify-center text-[#0284C7] shrink-0">
            <Trophy className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* Card 8: Điểm rèn luyện TB */}
        <div
          onClick={onNavigateToLeaderboard}
          className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
        >
          <div className="space-y-0.5">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 block">
              {t('dashboard.kpi_avg_score')}
            </span>
            <span className="text-2xl sm:text-[28px] font-black text-[#061651] block tracking-tight leading-none py-0.5">
              {avgScore}/100
            </span>
            <span className="text-[11.5px] font-semibold text-[#0284C7] block hover:underline">
              {t('dashboard.view_details')}
            </span>
          </div>
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-slate-300/70 bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
            <Star className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>
      </div>

      {/* 3. Mô-đun Biểu đồ So sánh Thi đua & Hiệu suất Hoạt động */}
      <ComparisonChart />

      {/* 4. Khối thông tin bổ trợ: 2 Cột chuẩn thiết kế đồng bộ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột Trái: Bảng Xếp Hạng Top 5 Thành Viên Xuất Sắc */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/70 p-5 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs flex items-center justify-center font-black">
                  <Trophy className="w-5 h-5 text-amber-600 fill-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#061651]">
                    {t('dashboard.top5_title')}
                  </h3>
                  <p className="text-[11px] text-[#64748B] font-medium">
                    {t('dashboard.top5_desc')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onNavigateToLeaderboard}
                className="text-xs font-bold text-[#1351D8] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{language === 'vi' ? 'Xem tất cả 48' : 'View all 48'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Danh sách Top 5 */}
            <div className="divide-y divide-slate-100 mt-2">
              {top5Members.map((m, idx) => {
                const rank = idx + 1
                return (
                  <div
                    key={m.member_code}
                    onClick={onNavigateToLeaderboard}
                    className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
                      {/* Huy hiệu xếp hạng */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-2xs shrink-0 ${
                          rank === 1
                            ? 'bg-[#FFCD38] text-[#061651]'
                            : rank === 2
                            ? 'bg-slate-200 text-[#061651]'
                            : rank === 3
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-blue-50 text-[#1351D8] border border-blue-200/60'
                        }`}
                      >
                        {rank}
                      </div>

                      {/* Họ tên và Ban */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#061651] group-hover:text-[#1351D8] transition-colors truncate">
                            {m.full_name}
                          </span>
                          {m.is_core && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-200/80 shrink-0">
                              CORE
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-normal block truncate max-w-[170px] sm:max-w-xs md:max-w-none">
                          {m.student_id ? `${m.student_id} - ` : ''}
                          {translateDept(m.department_name)} - {translateRole(m.position)}
                        </span>
                      </div>
                    </div>

                    {/* Điểm số & Xếp loại */}
                    <div className="text-right">
                      <span className="text-sm font-black text-[#1351D8] block">
                        {m.current_score}{language === 'vi' ? 'đ' : ' pts'}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 block">
                        {m.current_score >= 85 ? t('dashboard.very_active') : t('dashboard.active')}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToLeaderboard}
            className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/90 text-[#1351D8] text-xs font-bold transition flex items-center justify-center gap-2 mt-2 shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>{t('dashboard.open_full_leaderboard')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Cột Phải: Phân bổ thành viên theo Ban */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/70 p-5 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1351D8] border border-blue-200/60 shadow-2xs flex items-center justify-center font-black">
                <Users className="w-4 h-4 text-[#1351D8]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#061651]">
                  {t('dashboard.dept_dist_title')}
                </h3>
                <p className="text-[11px] text-[#64748B] font-medium">
                  {t('dashboard.dept_dist_desc')}
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* Ban Tư vấn */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#061651]">{t('dashboard.dept_consulting')}</span>
                  <span className="font-black text-[#061651]">{tvMembers} {t('dashboard.members_count')}</span>
                </div>
                <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#EC4899] h-full rounded-full"
                    style={{ width: '47.9%' }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-medium block">
                  47.9% {t('dashboard.club_share')}, {t('dashboard.avg_score_label')}: 73.8{language === 'vi' ? 'đ' : ' pts'}
                </span>
              </div>

              {/* Ban Truyền thông */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#061651]">{t('dashboard.dept_media')}</span>
                  <span className="font-black text-[#061651]">{ttMembers} {t('dashboard.members_count')}</span>
                </div>
                <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#1351D8] h-full rounded-full"
                    style={{ width: '29.2%' }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-medium block">
                  29.2% {t('dashboard.club_share')}, {t('dashboard.avg_score_label')}: 78.4{language === 'vi' ? 'đ' : ' pts'}
                </span>
              </div>

              {/* Ban Nhân sự */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#061651]">{t('dashboard.dept_hr')}</span>
                  <span className="font-black text-[#061651]">{nsMembers} {t('dashboard.members_count')}</span>
                </div>
                <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#6366F1] h-full rounded-full"
                    style={{ width: '16.7%' }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-medium block">
                  16.7% {t('dashboard.club_share')}, {t('dashboard.avg_score_label')}: 75.2{language === 'vi' ? 'đ' : ' pts'}
                </span>
              </div>

              {/* Ban Chủ nhiệm */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#061651]">{t('dashboard.dept_bcn')}</span>
                  <span className="font-black text-[#061651]">3 {t('dashboard.members_count')}</span>
                </div>
                <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#F59E0B] h-full rounded-full"
                    style={{ width: '6.2%' }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-medium block">
                  6.2% {t('dashboard.club_share')}, {t('dashboard.avg_score_label')}: 88.0{language === 'vi' ? 'đ' : ' pts'}
                </span>
              </div>
            </div>
          </div>

          {/* 3 Khối tóm tắt phân loại xếp loại */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {/* Box 1: Mint Green */}
            <button
              type="button"
              onClick={onNavigateToLeaderboard}
              className="rounded-xl border border-emerald-200/80 bg-[#F0FDF4] p-3 text-center hover:bg-emerald-100/50 transition hover:shadow-xs group cursor-pointer"
            >
              <span className="text-xl font-black text-[#059669] block group-hover:scale-105 transition-transform">
                {members.filter((m) => m.current_score >= 80).length || 15}
              </span>
              <span className="text-[9px] font-bold text-[#047857] uppercase tracking-wider block mt-0.5">
                {t('dashboard.box_top15')}
              </span>
            </button>

            {/* Box 2: Amber */}
            <button
              type="button"
              onClick={onNavigateToLeaderboard}
              className="rounded-xl border border-amber-200/80 bg-[#FFFBEB] p-3 text-center hover:bg-amber-100/50 transition hover:shadow-xs group cursor-pointer"
            >
              <span className="text-xl font-black text-[#D97706] block group-hover:scale-105 transition-transform">
                {members.filter((m) => m.current_score >= 60 && m.current_score < 80).length || 32}
              </span>
              <span className="text-[9px] font-bold text-[#B45309] uppercase tracking-wider block mt-0.5">
                {t('dashboard.box_qualified')}
              </span>
            </button>

            {/* Box 3: Slate */}
            <button
              type="button"
              onClick={onViewAllMembers}
              className="rounded-xl border border-slate-200/90 bg-slate-50 p-3 text-center hover:bg-slate-100 transition hover:shadow-xs group cursor-pointer"
            >
              <span className="text-xl font-black text-[#061651] block group-hover:scale-105 transition-transform">
                {members.filter((m) => m.current_score < 60 || m.absent_count_t02 >= 1).length || 1}
              </span>
              <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block mt-0.5">
                {t('dashboard.box_warning')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
