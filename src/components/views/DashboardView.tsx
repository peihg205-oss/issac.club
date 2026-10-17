'use client'

import React from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useClub } from '@/lib/context/ClubContext'
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
  const { members, activeEvent, proposals } = useClub()

  const totalMembers = members.length
  const totalScore = members.reduce((sum, m) => sum + m.current_score, 0)
  const avgScore = totalMembers > 0 ? (totalScore / totalMembers).toFixed(1) : '60.0'

  // Thống kê đề xuất điểm
  const pendingCount = proposals.filter((p) => p.status === 'pending_bcn').length
  const approvedCount = proposals.filter((p) => p.status === 'approved').length

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
  const ttMembers = members.filter((m) => m.department_code === 'B01').length || 14
  const tvMembers = members.filter((m) => m.department_code === 'B02').length || 23
  const nsMembers = members.filter((m) => m.department_code === 'B03').length || 8

  // Top 5 thành viên dẫn đầu
  const top5Members = [...members].sort((a, b) => b.current_score - a.current_score).slice(0, 5)

  return (
    <div className="space-y-6">
      {/* 1. Header trang chuẩn nhận diện dự án CLB */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
            Dashboard Điểm Hoạt Động
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium">
            Tổng quan tiến độ rèn luyện, thi đua và chuyên cần của toàn bộ 48 thành viên CLB.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-center flex-wrap">
          {/* Nút Xem Bảng Xếp Hạng */}
          <button
            type="button"
            onClick={onNavigateToLeaderboard}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs sm:text-[13px] shadow-xs hover:shadow flex items-center gap-2 transition active:scale-95 cursor-pointer"
            title="Mở Bảng xếp hạng điểm hoạt động"
          >
            <Trophy className="w-4 h-4 text-white fill-current flex-shrink-0" />
            <span>Xem Bảng Xếp Hạng</span>
          </button>

          {/* Huy hiệu Cổng điểm danh */}
          <button
            type="button"
            onClick={onNavigateToCheckin}
            className={`px-3.5 py-2.5 rounded-xl border text-xs sm:text-[13px] font-bold shadow-2xs hover:shadow-xs flex items-center gap-2 transition active:scale-95 cursor-pointer ${
              activeEvent && !activeEvent.isFinalized
                ? 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200/90 text-emerald-700'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200/90 text-slate-700'
            }`}
            title="Chuyển đến màn hình điểm danh"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                activeEvent && !activeEvent.isFinalized ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span>
              {activeEvent && !activeEvent.isFinalized
                ? 'Đang mở cổng điểm danh'
                : 'Cổng điểm danh CLB'}
            </span>
          </button>
        </div>
      </div>

      {/* Banner Phiên Điểm Danh Trực Tiếp Đẳng Cấp Navy */}
      {activeEvent && !activeEvent.isFinalized && (
        <div className="bg-gradient-to-br from-[#0B1E48] via-[#0F3282] to-[#1351D8] rounded-2xl p-5 text-white border border-blue-900/40 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center flex-shrink-0 border border-white/20 text-[#FFCD38] shadow-inner">
              <QrCode className="w-6 h-6 text-[#FFCD38]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FFCD38] text-[#0F172A] shadow-2xs">
                  Đang diễn ra trực tiếp
                </span>
                <span className="text-xs font-bold text-blue-100 font-mono bg-white/15 px-2.5 py-0.5 rounded-lg border border-white/20">
                  Mã PIN: {activeEvent.pinCode}
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
            className="px-4 py-2.5 bg-[#FFCD38] hover:bg-[#F8C327] text-[#0F172A] text-xs font-black rounded-xl shadow-xs transition hover:scale-102 active:scale-95 flex items-center gap-2 flex-shrink-0 self-end sm:self-auto cursor-pointer"
          >
            <span>Mở bảng điểm danh</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Tám Thẻ Chỉ Số KPI (Pastel 1px Thin Border chuẩn thiết kế hệ thống) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Tổng thành viên */}
        <div
          onClick={onViewAllMembers}
          className="p-4 rounded-2xl border border-blue-200/90 bg-[#EFF6FF] flex items-center justify-between cursor-pointer transition-all shadow-2xs hover:shadow-md hover:-translate-y-0.5"
        >
          <div>
            <span className="text-xs font-bold text-slate-600 block">
              Tổng số thành viên
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#1351D8] mt-1 block">
              {totalMembers}
            </span>
            <span className="text-[11px] text-blue-700/80 font-medium block mt-0.5">
              48 nhân sự chính thức
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white text-[#1351D8] shadow-2xs border border-blue-200/60 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Chờ duyệt */}
        <div
          className="p-4 rounded-2xl border border-amber-200/90 bg-[#FFFBEB] flex items-center justify-between cursor-pointer transition-all shadow-2xs hover:shadow-md hover:-translate-y-0.5"
        >
          <div>
            <span className="text-xs font-bold text-slate-600 block">
              Đề xuất chờ duyệt
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#D97706] mt-1 block">
              {pendingCount}
            </span>
            <span className="text-[11px] text-amber-700/80 font-medium block mt-0.5">
              Chờ BCN thẩm định
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white text-[#D97706] shadow-2xs border border-amber-200/60 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Đã duyệt điểm */}
        <div
          className="p-4 rounded-2xl border border-emerald-200/90 bg-[#F0FDF4] flex items-center justify-between cursor-pointer transition-all shadow-2xs hover:shadow-md hover:-translate-y-0.5"
        >
          <div>
            <span className="text-xs font-bold text-slate-600 block">
              Đã duyệt điểm
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#059669] mt-1 block">
              {approvedCount}
            </span>
            <span className="text-[11px] text-emerald-700/80 font-medium block mt-0.5">
              Cộng / trừ hợp lệ
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white text-[#059669] shadow-2xs border border-emerald-200/60 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Kỳ sinh hoạt */}
        <div
          onClick={onNavigateToCheckin}
          className="p-4 rounded-2xl border border-purple-200/90 bg-[#F5F3FF] flex items-center justify-between cursor-pointer transition-all shadow-2xs hover:shadow-md hover:-translate-y-0.5"
        >
          <div>
            <span className="text-xs font-bold text-slate-600 block">
              Kỳ sinh hoạt CLB
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#7C3AED] mt-1 block">
              1
            </span>
            <span className="text-[11px] text-purple-700/80 font-medium block mt-0.5">
              Tháng 10/2025
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white text-[#7C3AED] shadow-2xs border border-purple-200/60 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Card 5: Đúng giờ (C07) */}
        <div
          onClick={onNavigateToCheckin}
          className="p-4 rounded-2xl border border-emerald-200/90 bg-[#F0FDF4] flex items-center justify-between cursor-pointer transition-all shadow-2xs hover:shadow-md hover:-translate-y-0.5"
        >
          <div>
            <span className="text-xs font-bold text-slate-600 block">
              Đúng giờ (C07)
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700">
                {countOnTime}
              </span>
              <span className="text-xs font-bold text-emerald-600">+1đ / TV</span>
            </div>
            <span className="text-[11px] text-emerald-700/80 font-medium block mt-0.5">
              Đến trước hoặc đúng giờ
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 shadow-2xs border border-emerald-200/60 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 6: Đi muộn (T04) */}
        <div
          onClick={onNavigateToCheckin}
          className="p-4 rounded-2xl border border-amber-200/90 bg-[#FFFBEB] flex items-center justify-between cursor-pointer transition-all shadow-2xs hover:shadow-md hover:-translate-y-0.5"
        >
          <div>
            <span className="text-xs font-bold text-slate-600 block">
              Đi muộn (T04)
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-700">
                {countLate}
              </span>
              <span className="text-xs font-bold text-amber-600">-1đ / TV</span>
            </div>
            <span className="text-[11px] text-amber-700/80 font-medium block mt-0.5">
              Muộn trên 15 phút
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white text-amber-600 shadow-2xs border border-amber-200/60 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 7: Vắng có phép (T01) */}
        <div
          onClick={onNavigateToCheckin}
          className="p-4 rounded-2xl border border-blue-200/90 bg-[#EFF6FF] flex items-center justify-between cursor-pointer transition-all shadow-2xs hover:shadow-md hover:-translate-y-0.5"
        >
          <div>
            <span className="text-xs font-bold text-slate-600 block">
              Vắng có phép (T01)
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-[#1351D8]">
                {countExcused}
              </span>
              <span className="text-xs font-bold text-blue-600">-2đ / TV</span>
            </div>
            <span className="text-[11px] text-blue-700/80 font-medium block mt-0.5">
              Gửi đơn trước &gt;12h
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white text-[#1351D8] shadow-2xs border border-blue-200/60 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
        </div>

        {/* Card 8: Điểm rèn luyện TB CLB */}
        <div
          onClick={onNavigateToLeaderboard}
          className="p-4 rounded-2xl border border-slate-200/90 bg-[#F8FAFC] flex items-center justify-between cursor-pointer transition-all shadow-2xs hover:shadow-md hover:-translate-y-0.5"
        >
          <div>
            <span className="text-xs font-bold text-slate-600 block">
              Điểm rèn luyện TB
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#0F172A] mt-1 block">
              {avgScore}/100
            </span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
              Thang điểm chuẩn 0 - 100đ
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white text-[#0F172A] shadow-2xs border border-slate-200/60 flex items-center justify-center flex-shrink-0">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
          </div>
        </div>
      </div>

      {/* 3. Mô-đun Biểu đồ So sánh Thi đua & Hiệu suất Hoạt động */}
      <ComparisonChart />

      {/* 4. Khối thông tin bổ trợ: 2 Cột chuẩn thiết kế đồng bộ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột Trái: Bảng Xếp Hạng Top 5 Thành Viên Xuất Sắc */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs flex items-center justify-center font-black">
                  <Trophy className="w-5 h-5 text-amber-600 fill-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#0F172A]">
                    Bảng Xếp Hạng Điểm Hoạt Động (Top 5)
                  </h3>
                  <p className="text-[11px] text-[#64748B] font-medium">
                    Gương mặt tiêu biểu dẫn đầu phong trào thi đua CLB
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onNavigateToLeaderboard}
                className="text-xs font-bold text-[#1351D8] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Xem tất cả 48</span>
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
                    <div className="flex items-center gap-3">
                      {/* Huy hiệu xếp hạng */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-2xs ${
                          rank === 1
                            ? 'bg-[#FFCD38] text-[#0F172A]'
                            : rank === 2
                            ? 'bg-slate-200 text-slate-800'
                            : rank === 3
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-blue-50 text-[#1351D8] border border-blue-200/60'
                        }`}
                      >
                        {rank}
                      </div>

                      {/* Họ tên và Ban */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#1351D8] transition-colors whitespace-nowrap">
                            {m.full_name}
                          </span>
                          {m.is_core && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-200/80 whitespace-nowrap">
                              CORE
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-normal block whitespace-nowrap">
                          {m.student_id ? `${m.student_id} - ` : ''}{m.department_name} - {m.position}
                        </span>
                      </div>
                    </div>

                    {/* Điểm số & Xếp loại */}
                    <div className="text-right">
                      <span className="text-sm font-black text-[#1351D8] block">
                        {m.current_score}đ
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 block">
                        {m.current_score >= 85 ? 'Rất tích cực' : 'Tích cực'}
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
            <span>Mở Bảng Xếp Hạng Đầy Đủ & Bục Vinh Danh Top 3</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Cột Phải: Phân bổ thành viên theo Ban */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1351D8] border border-blue-200/60 shadow-2xs flex items-center justify-center font-black">
                <Users className="w-4 h-4 text-[#1351D8]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#0F172A]">
                  Phân bổ thành viên theo Ban (48 thành viên)
                </h3>
                <p className="text-[11px] text-[#64748B] font-medium">
                  Cơ cấu nhân sự và điểm trung bình theo từng ban trực thuộc
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* Ban Tư vấn */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0F172A]">Ban Tư vấn</span>
                  <span className="font-black text-[#0F172A]">{tvMembers} thành viên</span>
                </div>
                <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#EC4899] h-full rounded-full"
                    style={{ width: '47.9%' }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-medium block">
                  47.9% toàn CLB, Điểm TB: 73.8đ
                </span>
              </div>

              {/* Ban Truyền thông */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0F172A]">Ban Truyền thông</span>
                  <span className="font-black text-[#0F172A]">{ttMembers} thành viên</span>
                </div>
                <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#1351D8] h-full rounded-full"
                    style={{ width: '29.2%' }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-medium block">
                  29.2% toàn CLB, Điểm TB: 78.4đ
                </span>
              </div>

              {/* Ban Nhân sự */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0F172A]">Ban Nhân sự</span>
                  <span className="font-black text-[#0F172A]">{nsMembers} thành viên</span>
                </div>
                <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#6366F1] h-full rounded-full"
                    style={{ width: '16.7%' }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-medium block">
                  16.7% toàn CLB, Điểm TB: 75.2đ
                </span>
              </div>

              {/* Ban Chủ nhiệm */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0F172A]">Ban Chủ nhiệm</span>
                  <span className="font-black text-[#0F172A]">3 thành viên</span>
                </div>
                <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#F59E0B] h-full rounded-full"
                    style={{ width: '6.2%' }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-medium block">
                  6.2% toàn CLB, Điểm TB: 88.0đ
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
                TOP 15 XUẤT SẮC
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
                ĐẠT CHUẨN CLB
              </span>
            </button>

            {/* Box 3: Slate */}
            <button
              type="button"
              onClick={onViewAllMembers}
              className="rounded-xl border border-slate-200/90 bg-slate-50 p-3 text-center hover:bg-slate-100 transition hover:shadow-xs group cursor-pointer"
            >
              <span className="text-xl font-black text-[#0F172A] block group-hover:scale-105 transition-transform">
                {members.filter((m) => m.current_score < 60 || m.absent_count_t02 >= 1).length || 1}
              </span>
              <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block mt-0.5">
                CẢNH BÁO / KHÔNG ĐẠT
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
