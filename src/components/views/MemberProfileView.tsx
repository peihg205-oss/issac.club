'use client'

import React, { useState, useMemo } from 'react'
import type { RosterMember } from '@/lib/clubData'
import { useClub } from '@/lib/context/ClubContext'
import { useAuth } from '@/lib/auth/AuthContext'
import { getRatingLevel } from '@/lib/scoring/constants'
import {
  SEPTEMBER_2025_DELTAS,
  AUGUST_2025_DELTAS,
  STANDARD_MONTHLY_BASELINE,
} from '@/lib/periodData'
import { EditMemberModal } from '@/components/admin/EditMemberModal'
import {
  ArrowLeft,
  Award,
  TrendingUp,
  Calendar,
  Activity,
  CheckCircle2,
  Clock,
  Crown,
  User,
  Mail,
  Phone,
  GraduationCap,
  Building,
  Check,
  Star,
  ChevronRight,
  ChevronDown,
  Camera,
  Pencil,
  ShieldCheck,
  Sparkles,
  LayoutDashboard,
  Hash,
  Trophy,
  CreditCard,
  MapPin,
  Users,
  LayoutGrid,
} from 'lucide-react'

interface MemberProfileViewProps {
  member: RosterMember
  onBack: () => void
}

export function MemberProfileView({ member, onBack }: MemberProfileViewProps) {
  const { members, proposals, events } = useClub()
  const { isBCN } = useAuth()
  // Mặc định hiển thị tab 'profile' (Giao diện y hệt Figma Prototype)
  const [activeTab, setActiveTab] = useState<'profile' | 'overview' | 'history'>('profile')
  const [historyFilter, setHistoryFilter] = useState<'all' | 'add' | 'deduct'>('all')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Lấy dữ liệu mới nhất của thành viên từ context
  const currentMember = useMemo(() => {
    return members.find((m) => m.member_code === member.member_code) || member
  }, [members, member])

  // Xếp hạng trong CLB & trong Ban
  const { clubRank, deptRank, deptAvg, clubAvg } = useMemo(() => {
    const sortedClub = [...members].sort((a, b) => b.current_score - a.current_score)
    const cRank = sortedClub.findIndex((m) => m.member_code === currentMember.member_code) + 1 || 1

    const deptMembers = members.filter((m) => m.department_slug === currentMember.department_slug)
    const sortedDept = [...deptMembers].sort((a, b) => b.current_score - a.current_score)
    const dRank = sortedDept.findIndex((m) => m.member_code === currentMember.member_code) + 1 || 1

    const dAvg =
      deptMembers.length > 0
        ? (deptMembers.reduce((acc, m) => acc + m.current_score, 0) / deptMembers.length).toFixed(1)
        : '60.0'

    const cAvg =
      members.length > 0
        ? (members.reduce((acc, m) => acc + m.current_score, 0) / members.length).toFixed(1)
        : '60.0'

    return { clubRank: cRank, deptRank: dRank, deptAvg: dAvg, clubAvg: cAvg }
  }, [members, currentMember])

  const octScore = currentMember.current_score
  const changeValue = currentMember.current_score - 60
  const rating = getRatingLevel(octScore)

  // Danh sách lịch sử điểm thực tế từ đề xuất & sự kiện
  const fullHistory = useMemo(() => {
    const list: Array<{
      id: string
      time: string
      code: string
      title: string
      category: string
      type: 'add' | 'deduct'
      points: number
      rawPoints: number
      actor: string
      status: string
    }> = []

    // 1. Lịch sử điểm từ các đề xuất đã được phê duyệt
    proposals
      .filter((p) => p.memberCode === currentMember.member_code && p.status === 'approved')
      .forEach((p) => {
        list.push({
          id: p.id,
          time: p.createdAt,
          code: p.criterionCode,
          title: `${p.criterionName} - ${p.reason}`,
          category: p.points >= 0 ? 'Khen thưởng & Cống hiến' : 'Kỷ luật & Vi phạm',
          type: p.points >= 0 ? 'add' : 'deduct',
          points: p.points,
          rawPoints: p.points,
          actor: p.proposedBy,
          status: 'Đã phê duyệt',
        })
      })

    // 2. Lịch sử từ các phiên điểm danh sự kiện
    events.forEach((evt) => {
      const rec = evt.records?.[currentMember.member_code]
      if (rec) {
        if (rec.status === 'present_on_time') {
          list.push({
            id: `evt-rec-${evt.id}`,
            time: `${evt.date} ${rec.checkinTime || evt.startTime}`,
            code: 'C07',
            title: `Tham gia đúng giờ: ${evt.title}`,
            category: 'Chuyên cần',
            type: 'add',
            points: 1,
            rawPoints: 1,
            actor: 'Hệ thống điểm danh',
            status: evt.isFinalized ? 'Đã chốt sổ' : 'Ghi nhận',
          })
        } else if (rec.status === 'late') {
          list.push({
            id: `evt-rec-${evt.id}`,
            time: `${evt.date} ${rec.checkinTime || evt.startTime}`,
            code: 'T04',
            title: `Đi muộn: ${evt.title}`,
            category: 'Kỷ luật & Chuyên cần',
            type: 'deduct',
            points: -1,
            rawPoints: -1,
            actor: 'Hệ thống điểm danh',
            status: evt.isFinalized ? 'Đã chốt sổ' : 'Ghi nhận',
          })
        } else if (rec.status === 'excused') {
          list.push({
            id: `evt-rec-${evt.id}`,
            time: `${evt.date} ${evt.startTime}`,
            code: 'T01',
            title: `Vắng có phép: ${evt.title}`,
            category: 'Kỷ luật & Chuyên cần',
            type: 'deduct',
            points: -2,
            rawPoints: -2,
            actor: 'Hệ thống điểm danh',
            status: evt.isFinalized ? 'Đã chốt sổ' : 'Ghi nhận',
          })
        }
      }
    })

    return list
  }, [proposals, events, currentMember.member_code])

  const bonusTotal = fullHistory.filter((h) => h.type === 'add').reduce((sum, h) => sum + h.points, 0)
  const deductTotal = Math.abs(fullHistory.filter((h) => h.type === 'deduct').reduce((sum, h) => sum + h.points, 0))

  const filteredHistory = useMemo(() => {
    if (historyFilter === 'all') return fullHistory
    return fullHistory.filter((item) => item.type === historyFilter)
  }, [fullHistory, historyFilter])

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* 1. Top Navigation Bar (Nút quay lại & Bộ chọn View) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white border border-slate-200/90 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition flex items-center justify-center cursor-pointer shadow-2xs group active:scale-95 shrink-0"
            title="Quay lại danh sách thành viên"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              HỒ SƠ THÀNH VIÊN ĐẠI SỨ
            </h2>
            <p className="text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
              {currentMember.full_name}
            </p>
          </div>
        </div>

        {/* View Switcher Tabs matching Image 1 */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-full border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              activeTab === 'profile'
                ? 'bg-white border-[#2563EB] text-[#2563EB]'
                : 'bg-white border-slate-200/80 text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-[#2563EB]" />
            <span>Thông tin hồ sơ</span>
          </button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block mx-0.5" />

          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'text-[#2563EB] font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-slate-400" />
            <span>Điểm thi đua ({octScore}đ)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-2 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'text-[#2563EB] font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Lịch sử điểm</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW 1: FIGMA PROTOTYPE PROFILE CARD (CHUẨN HÀI HÒA THEO ẢNH 1) */}
      {/* ========================================================= */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Top Airy Pastel Gradient Cover Banner matching Image 1 */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-50/70 via-sky-50/40 to-indigo-50/40 border-b border-slate-100/90 px-6 sm:px-8 py-8 sm:py-9">
            {/* Soft decorative concentric curves in top-right */}
            <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-blue-100/40 blur-2xl pointer-events-none" />
            <div className="absolute top-2 right-12 w-48 h-48 rounded-full border border-blue-200/40 pointer-events-none" />
            <div className="absolute top-8 right-20 w-32 h-32 rounded-full border border-blue-200/30 pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
                {/* Circular Avatar with Logo Badge & Camera indicator */}
                <div
                  className="relative group cursor-pointer shrink-0"
                  onClick={() => setIsEditModalOpen(true)}
                  title="Bấm để thay đổi ảnh đại diện"
                >
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-md bg-white flex items-center justify-center overflow-hidden p-1">
                    <img
                      src={currentMember.avatar_url || '/logo-badge.png'}
                      alt={currentMember.full_name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsEditModalOpen(true)
                    }}
                    className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-[#1351D8] hover:bg-[#0F3282] text-white border-2 border-white shadow-xs flex items-center justify-center cursor-pointer active:scale-90 transition"
                    title="Thay đổi ảnh đại diện"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Identity info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {currentMember.full_name}
                    </h2>
                    {currentMember.is_core && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 shadow-2xs">
                        <Crown className="w-3.5 h-3.5 text-amber-600" />
                        <span>Core Team</span>
                      </span>
                    )}
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100/70 text-[#1351D8] border border-blue-200/60 shadow-2xs">
                      {currentMember.department_name}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 font-medium">
                    {currentMember.email}
                  </p>
                </div>
              </div>

              {/* Blue "Chỉnh sửa" Button matching Image 1 */}
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-bold shadow-xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Pencil className="w-4 h-4 text-white" />
                <span>Chỉnh sửa</span>
              </button>
            </div>
          </div>

          {/* Form Fields: 2-Column Clean Grid With Blue Circular Icons (Y hệt ảnh 1) */}
          <div className="px-6 sm:px-8 py-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-7">
              {/* Field 1: Họ và tên */}
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-blue-50/80 text-[#2563EB] flex items-center justify-center shrink-0 border border-blue-100/70 shadow-2xs">
                  <User className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-500 font-medium block">
                    Họ và tên
                  </span>
                  <span className="text-base font-bold text-slate-900 truncate block mt-0.5">
                    {currentMember.full_name}
                  </span>
                </div>
              </div>

              {/* Field 2: Mã số sinh viên (MSSV) */}
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-blue-50/80 text-[#2563EB] flex items-center justify-center shrink-0 border border-blue-100/70 shadow-2xs">
                  <CreditCard className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-500 font-medium block">
                    Mã số sinh viên (MSSV)
                  </span>
                  <span className="text-base font-bold text-slate-900 truncate block mt-0.5">
                    {currentMember.student_id || currentMember.member_code} {currentMember.class_name ? `(${currentMember.class_name})` : ''}
                  </span>
                </div>
              </div>

              {/* Field 3: Ban trực thuộc */}
              <div
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-4 cursor-pointer group"
                title="Bấm để thay đổi ban trực thuộc"
              >
                <div className="w-11 h-11 rounded-full bg-blue-50/80 text-[#2563EB] flex items-center justify-center shrink-0 border border-blue-100/70 shadow-2xs group-hover:bg-blue-100/80 transition-colors">
                  <Users className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-500 font-medium block">
                    Ban trực thuộc
                  </span>
                  <span className="text-base font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors truncate block mt-0.5">
                    {currentMember.department_name}
                  </span>
                </div>
              </div>

              {/* Field 4: Vị trí chức vụ */}
              <div
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-4 cursor-pointer group"
                title="Bấm để thay đổi vị trí chức vụ"
              >
                <div className="w-11 h-11 rounded-full bg-blue-50/80 text-[#2563EB] flex items-center justify-center shrink-0 border border-blue-100/70 shadow-2xs group-hover:bg-blue-100/80 transition-colors">
                  <Award className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-500 font-medium block">
                    Vị trí chức vụ
                  </span>
                  <span className="text-base font-bold text-slate-900 group-hover:text-[#2563EB] transition-colors truncate block mt-0.5">
                    {currentMember.position}
                  </span>
                </div>
              </div>

              {/* Field 5: Số điện thoại */}
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-blue-50/80 text-[#2563EB] flex items-center justify-center shrink-0 border border-blue-100/70 shadow-2xs">
                  <Phone className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-500 font-medium block">
                    Số điện thoại
                  </span>
                  <span className="text-base font-bold text-slate-900 truncate block mt-0.5 font-mono">
                    {currentMember.phone || '0374140705'}
                  </span>
                </div>
              </div>

              {/* Field 6: Trạng thái thi đua & Xếp hạng */}
              <div
                onClick={() => setActiveTab('overview')}
                className="flex items-center gap-4 cursor-pointer group"
                title="Bấm để xem chi tiết thi đua"
              >
                <div className="w-11 h-11 rounded-full bg-blue-50/80 text-[#2563EB] flex items-center justify-center shrink-0 border border-blue-100/70 shadow-2xs group-hover:bg-blue-100/80 transition-colors">
                  <Trophy className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-500 font-medium block">
                    Trạng thái thi đua & Xếp hạng
                  </span>
                  <span className="text-base font-bold text-[#1351D8] group-hover:text-blue-700 transition-colors truncate block mt-0.5">
                    {octScore}đ ({rating.level_name} - Hạng #{clubRank})
                  </span>
                </div>
              </div>
            </div>

            {/* Section: EMAIL LIÊN HỆ */}
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                EMAIL LIÊN HỆ
              </h4>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-blue-50/80 text-[#2563EB] flex items-center justify-center border border-blue-100/70 shrink-0">
                    <Mail className="w-5 h-5 text-[#2563EB]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{currentMember.email}</p>
                    <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                      Tài khoản chính thức - Đã xác thực hồ sơ
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200/80 flex items-center gap-1.5 shadow-2xs shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Verified</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: TỔNG QUAN THI ĐUA & BẢNG ĐIỂM (OVERVIEW) */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card-deep-blue p-5 text-center space-y-1">
              <span className="text-[11px] font-black uppercase text-blue-600 block">
                Điểm Thi Đua T10
              </span>
              <div className="text-3xl font-black text-slate-900">{octScore}đ</div>
              <span className="text-[11px] font-bold text-emerald-600">
                +{changeValue}đ trong tháng
              </span>
            </div>

            <div className="stat-card-amber p-5 text-center space-y-1">
              <span className="text-[11px] font-black uppercase text-amber-600 block">
                Xếp Hạng Toàn CLB
              </span>
              <div className="text-3xl font-black text-slate-900">#{clubRank}</div>
              <span className="text-[11px] font-bold text-slate-500">
                Top 48 Đại sứ sinh viên
              </span>
            </div>

            <div className="stat-card-sky p-5 text-center space-y-1">
              <span className="text-[11px] font-black uppercase text-sky-600 block">
                Xếp Hạng Trong Ban
              </span>
              <div className="text-3xl font-black text-slate-900">#{deptRank}</div>
              <span className="text-[11px] font-bold text-slate-500">
                {currentMember.department_name}
              </span>
            </div>
          </div>

          {/* Biến động chi tiết */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="card-clean p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wide flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>Phân Bổ Biến Động Điểm</span>
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#1351D8] border border-blue-200/70">
                  Biểu đồ tròn
                </span>
              </div>

              {/* Biểu đồ hình tròn SVG Donut Chart & Thống kê chi tiết */}
              <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 pt-1">
                {/* 1. Biểu đồ hình tròn SVG Donut Chart */}
                <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 130 130">
                    <defs>
                      <linearGradient id="bonusPieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      <linearGradient id="deductPieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F43F5E" />
                        <stop offset="100%" stopColor="#E11D48" />
                      </linearGradient>
                    </defs>

                    {/* Vòng nền xám */}
                    <circle
                      cx="65"
                      cy="65"
                      r="48"
                      fill="none"
                      stroke="#F1F5F9"
                      strokeWidth="14"
                    />

                    {/* Cung điểm cộng (Xanh lá) - 12/19 ~ 63% */}
                    <circle
                      cx="65"
                      cy="65"
                      r="48"
                      fill="none"
                      stroke="url(#bonusPieGradient)"
                      strokeWidth="14"
                      strokeDasharray={`${(bonusTotal / (bonusTotal + deductTotal)) * (2 * Math.PI * 48)} ${2 * Math.PI * 48}`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      className="transition-all duration-700 ease-out"
                    />

                    {/* Cung điểm trừ (Đỏ hồng) - 7/19 ~ 37% */}
                    <circle
                      cx="65"
                      cy="65"
                      r="48"
                      fill="none"
                      stroke="url(#deductPieGradient)"
                      strokeWidth="14"
                      strokeDasharray={`${(deductTotal / (bonusTotal + deductTotal)) * (2 * Math.PI * 48)} ${2 * Math.PI * 48}`}
                      strokeDashoffset={`${-((bonusTotal / (bonusTotal + deductTotal)) * (2 * Math.PI * 48))}`}
                      strokeLinecap="round"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>

                  {/* Tâm biểu đồ tròn: Hiển thị điểm chốt ròng */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Chốt ròng
                    </span>
                    <span className="text-xl font-black text-[#1351D8] leading-none my-0.5">
                      +{bonusTotal - deductTotal}đ
                    </span>
                    <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/80">
                      +63%
                    </span>
                  </div>
                </div>

                {/* 2. Ba khối thống kê chi tiết */}
                <div className="flex-1 w-full space-y-2.5 text-xs">
                  {/* Điểm cộng cống hiến */}
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-semibold text-emerald-950">Tổng điểm cộng cống hiến:</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-emerald-600 bg-white/90 px-1.5 py-0.5 rounded border border-emerald-200/60 shadow-2xs">
                        63%
                      </span>
                      <span className="font-black text-emerald-700 text-sm">+{bonusTotal}đ</span>
                    </div>
                  </div>

                  {/* Điểm trừ kỷ luật */}
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/80 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                      <span className="font-semibold text-rose-950">Tổng điểm trừ kỷ luật:</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-rose-600 bg-white/90 px-1.5 py-0.5 rounded border border-rose-200/60 shadow-2xs">
                        37%
                      </span>
                      <span className="font-black text-rose-700 text-sm">-{deductTotal}đ</span>
                    </div>
                  </div>

                  {/* Điểm chốt ròng */}
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                      <span className="font-semibold text-blue-950">Điểm chốt ròng:</span>
                    </div>
                    <span className="font-black text-blue-700 text-sm">
                      +{bonusTotal - deductTotal}đ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-clean p-6 space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wide flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Xếp Loại Thi Đua Định Kỳ</span>
              </h4>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/50 to-orange-50/30 border border-amber-200/80 text-center space-y-2">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                  {rating.level_name}
                </span>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Đạt mức sàn {octScore}/100đ chuẩn. Thành viên tích cực tham gia các hoạt động và bảo đảm kỷ luật họp CLB.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 3: LỊCH SỬ CHẤM ĐIỂM & SỔ CÁI (HISTORY) */}
      {/* ========================================================= */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-800">
                Lịch Sử Điểm Cá Nhân
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Ghi nhận chi tiết toàn bộ điểm cộng cống hiến và trừ kỷ luật
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setHistoryFilter('all')}
                className={`px-3 py-1 rounded-lg transition ${
                  historyFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Tất cả ({fullHistory.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter('add')}
                className={`px-3 py-1 rounded-lg transition ${
                  historyFilter === 'add' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Điểm cộng
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter('deduct')}
                className={`px-3 py-1 rounded-lg transition ${
                  historyFilter === 'deduct' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Điểm trừ
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {filteredHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <p className="font-semibold text-xs">Chưa có bản ghi điểm nào cho thành viên này</p>
                <p className="text-[11px] text-slate-400 mt-1">Mốc xuất phát chuẩn: 60 điểm (theo Quy chế P01)</p>
              </div>
            ) : (
              filteredHistory.map((item) => (
                <div key={item.id} className="py-3.5 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-500">{item.code}</span>
                      <span className="font-bold text-slate-900">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-[11px] flex-wrap">
                      <span>{item.time}</span>
                      <span className="text-slate-300">-</span>
                      <span>{item.category}</span>
                      <span className="text-slate-300">-</span>
                      <span className="text-slate-600 font-medium">{item.actor}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-black text-sm ${
                        item.type === 'add' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {item.points > 0 ? `+${item.points}đ` : `${item.points}đ`}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal Chỉnh Sửa Thông Tin & Đổi Avatar */}
      <EditMemberModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        member={currentMember}
      />
    </div>
  )
}
