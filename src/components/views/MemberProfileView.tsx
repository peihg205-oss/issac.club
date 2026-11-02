'use client'

import React, { useState, useMemo } from 'react'
import { type RosterMember, getMemberAvatarUrl } from '@/lib/clubData'
import { useClub } from '@/lib/context/ClubContext'
import { useAuth } from '@/lib/auth/AuthContext'
import { getRatingLevel } from '@/lib/scoring/constants'
import {
  SEPTEMBER_2025_DELTAS,
  AUGUST_2025_DELTAS,
  STANDARD_MONTHLY_BASELINE,
} from '@/lib/periodData'
import { EditMemberModal } from '@/components/admin/EditMemberModal'
import { normalizeHistoryTimestamp } from '@/lib/vietnamTime'
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
  Flag,
  Target,
  Gauge,
  Medal,
  Plus,
  Minus,
  AlertCircle,
  UserCheck,
  Layers,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
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
          time: normalizeHistoryTimestamp(p.createdAt),
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

    // 2. Lịch sử từ các phiên điểm danh sự kiện (chưa chốt sổ)
    events.forEach((evt) => {
      // Nếu sự kiện đã chốt và đã có bản ghi trong proposals thì bỏ qua để tránh trùng lặp
      const alreadyInProposals = proposals.some(
        (p) => p.id === `checkin-${evt.id}-${currentMember.member_code}`
      )
      if (alreadyInProposals) return

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
  const netPoints = bonusTotal - deductTotal

  const totalMovement = bonusTotal + deductTotal
  const bonusPercent = totalMovement > 0 ? Math.round((bonusTotal / totalMovement) * 100) : (bonusTotal > 0 ? 100 : 0)
  const deductPercent = totalMovement > 0 ? Math.round((deductTotal / totalMovement) * 100) : 0

  // Chuẩn hóa điểm thi đua: Lấy điểm hiện tại của thành viên hoặc từ biến động đề xuất
  const displayScore = currentMember.current_score !== undefined && currentMember.current_score !== 60
    ? currentMember.current_score
    : (netPoints !== 0 ? Math.max(0, Math.min(100, 60 + netPoints)) : currentMember.current_score || 60)
  const octScore = displayScore
  const changeValue = displayScore - 60
  const rating = getRatingLevel(displayScore)

  const filteredHistory = useMemo(() => {
    if (historyFilter === 'all') return fullHistory
    return fullHistory.filter((item) => item.type === historyFilter)
  }, [fullHistory, historyFilter])

  return (
    <div className="space-y-4 sm:space-y-5 max-w-5xl mx-auto animate-fadeIn">
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
            <h2 className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              HỒ SƠ THÀNH VIÊN ĐẠI SỨ
            </h2>
            <p className="text-2xl sm:text-[26px] font-black text-[#061651] tracking-tight leading-tight mt-0.5">
              {currentMember.full_name}
            </p>
          </div>
        </div>

        {/* View Switcher Tabs matching Reference Image */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-full border text-xs sm:text-[13px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              activeTab === 'profile'
                ? 'bg-white border-[#0284C7] text-[#0284C7]'
                : 'bg-white/60 border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-[#0284C7]' : 'text-slate-400'}`} />
            <span>Thông tin hồ sơ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-full border text-xs sm:text-[13px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              activeTab === 'overview'
                ? 'bg-white border-[#0284C7] text-[#0284C7]'
                : 'bg-white/60 border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <LayoutGrid className={`w-4 h-4 ${activeTab === 'overview' ? 'text-[#0284C7]' : 'text-slate-400'}`} />
            <span>Điểm thi đua ({displayScore}đ)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-full border text-xs sm:text-[13px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              activeTab === 'history'
                ? 'bg-white border-[#0284C7] text-[#0284C7]'
                : 'bg-white/60 border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Clock className={`w-4 h-4 ${activeTab === 'history' ? 'text-[#0284C7]' : 'text-slate-400'}`} />
            <span>Lịch sử điểm</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW 1: FIGMA PROTOTYPE PROFILE (TÁCH 2 CARD ĐỘC LẬP CHUẨN ẢNH MẪU) */}
      {/* ========================================================= */}
      {activeTab === 'profile' && (
        <div className="space-y-4 sm:space-y-5">
          {/* CARD 1: Hero Profile Summary Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/70 shadow-xs p-6 sm:p-7 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
              {/* Circular Avatar with Logo Badge & Camera indicator */}
              <div
                className="relative group cursor-pointer shrink-0"
                onClick={() => setIsEditModalOpen(true)}
                title="Bấm để thay đổi ảnh đại diện"
              >
                <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-md bg-white flex items-center justify-center overflow-hidden">
                  <img
                    src={getMemberAvatarUrl(currentMember) || '/logo-badge.png'}
                    alt={currentMember.full_name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsEditModalOpen(true)
                  }}
                  className="absolute bottom-0 right-0 w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-[#0284C7] hover:bg-[#0369A1] text-white border-2 border-white shadow-xs flex items-center justify-center cursor-pointer active:scale-90 transition"
                  title="Thay đổi ảnh đại diện"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Identity info */}
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-2xl sm:text-[26px] font-black text-[#061651] tracking-tight">
                    {currentMember.full_name}
                  </h2>
                  {currentMember.is_core && (
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] shadow-2xs">
                      <Crown className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>Core Team</span>
                    </span>
                  )}
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-[#F0F9FF] text-[#0284C7] border border-sky-200 shadow-2xs">
                    {currentMember.department_name}
                  </span>
                </div>
                <p className="text-sm text-slate-400 font-normal">
                  {currentMember.email}
                </p>
              </div>
            </div>

            {/* Nút Chỉnh sửa màu xanh dương #0284C7 chuẩn ảnh 1 */}
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-bold shadow-xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer relative z-10 self-start sm:self-auto shrink-0"
            >
              <Pencil className="w-4 h-4 text-white" />
              <span>Chỉnh sửa</span>
            </button>
          </div>

          {/* CARD 2: Detailed Information & Verified Email Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/70 shadow-xs p-6 sm:p-8 space-y-7">
            {/* Lưới 6 trường thông tin 2 cột chuẩn ảnh 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-7">
              {/* Field 1: Họ và tên */}
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-[#F0F9FF] text-[#0284C7] flex items-center justify-center shrink-0 border border-sky-200/80 shadow-2xs">
                  <User className="w-5 h-5 text-[#0284C7]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-400 font-medium block">
                    Họ và tên
                  </span>
                  <span className="text-base font-extrabold text-[#061651] truncate block mt-0.5">
                    {currentMember.full_name}
                  </span>
                </div>
              </div>

              {/* Field 2: Mã số sinh viên (MSSV) */}
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-[#F0F9FF] text-[#0284C7] flex items-center justify-center shrink-0 border border-sky-200/80 shadow-2xs">
                  <CreditCard className="w-5 h-5 text-[#0284C7]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-400 font-medium block">
                    Mã số sinh viên (MSSV)
                  </span>
                  <span className="text-base font-extrabold text-[#061651] truncate block mt-0.5">
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
                <div className="w-11 h-11 rounded-full bg-[#F0F9FF] text-[#0284C7] flex items-center justify-center shrink-0 border border-sky-200/80 shadow-2xs group-hover:bg-sky-100/80 group-hover:border-sky-300 transition-colors">
                  <Users className="w-5 h-5 text-[#0284C7]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-400 font-medium block">
                    Ban trực thuộc
                  </span>
                  <span className="text-base font-extrabold text-[#061651] group-hover:text-[#0284C7] transition-colors truncate block mt-0.5">
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
                <div className="w-11 h-11 rounded-full bg-[#F0F9FF] text-[#0284C7] flex items-center justify-center shrink-0 border border-sky-200/80 shadow-2xs group-hover:bg-sky-100/80 group-hover:border-sky-300 transition-colors">
                  <Award className="w-5 h-5 text-[#0284C7]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-400 font-medium block">
                    Vị trí chức vụ
                  </span>
                  <span className="text-base font-extrabold text-[#061651] group-hover:text-[#0284C7] transition-colors truncate block mt-0.5">
                    {currentMember.position}
                  </span>
                </div>
              </div>

              {/* Field 5: Số điện thoại */}
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-[#F0F9FF] text-[#0284C7] flex items-center justify-center shrink-0 border border-sky-200/80 shadow-2xs">
                  <Phone className="w-5 h-5 text-[#0284C7]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-400 font-medium block">
                    Số điện thoại
                  </span>
                  <span className="text-base font-extrabold text-[#061651] truncate block mt-0.5 font-mono">
                    {currentMember.phone || '0912158734'}
                  </span>
                </div>
              </div>

              {/* Field 6: Trạng thái thi đua & Xếp hạng */}
              <div
                onClick={() => setActiveTab('overview')}
                className="flex items-center gap-4 cursor-pointer group"
                title="Bấm để xem chi tiết thi đua"
              >
                <div className="w-11 h-11 rounded-full bg-[#F0F9FF] text-[#0284C7] flex items-center justify-center shrink-0 border border-sky-200/80 shadow-2xs group-hover:bg-sky-100/80 group-hover:border-sky-300 transition-colors">
                  <Trophy className="w-5 h-5 text-[#0284C7]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-400 font-medium block">
                    Trạng thái thi đua & Xếp hạng
                  </span>
                  <span className="text-base font-extrabold text-[#0284C7] group-hover:underline transition-colors truncate block mt-0.5">
                    {displayScore}đ ({rating.level_name} - Hạng #{clubRank})
                  </span>
                </div>
              </div>
            </div>

            {/* Section: EMAIL LIÊN HỆ */}
            <div className="pt-6 border-t border-slate-100/90 space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                EMAIL LIÊN HỆ
              </h4>

              <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-[#F8FAFC]/70 border border-slate-200/70 shadow-2xs">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#F0F9FF] border border-sky-200/80 text-[#0284C7] flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-[#0284C7]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-extrabold text-[#061651] truncate">{currentMember.email}</p>
                    <p className="text-xs text-slate-400 font-normal truncate mt-0.5">
                      Tài khoản chính thức - Đã xác thực hồ sơ
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-[#059669] bg-[#ECFDF5] px-3.5 py-1.5 rounded-full border border-[#A7F3D0] flex items-center gap-1.5 shadow-2xs shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
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
        <div className="space-y-5 sm:space-y-6">
          {/* 1. Quick Metrics Cards (Format KPI Pastel Nhạt Khớp 100% Dashboard & Ảnh 2) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
            {/* Card 1: Điểm Thi Đua T10 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F0F9FF] flex items-center justify-between transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
              <div className="space-y-1">
                <span className="text-xs sm:text-[13px] font-semibold text-slate-600 block">
                  Điểm Thi Đua T10
                </span>
                <span className="text-2xl sm:text-[32px] font-black text-[#0284C7] block tracking-tight leading-none py-0.5">
                  {octScore}đ
                </span>
                <span className="text-[11.5px] font-bold text-emerald-600 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{changeValue}đ trong tháng</span>
                </span>
              </div>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-sky-300 bg-white flex items-center justify-center text-[#0284C7] shrink-0 shadow-2xs">
                <Award className="w-5 h-5 stroke-[1.75]" />
              </div>
            </div>

            {/* Card 2: Xếp Hạng Toàn CLB */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFBEB] flex items-center justify-between transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
              <div className="space-y-1">
                <span className="text-xs sm:text-[13px] font-semibold text-slate-600 block">
                  Xếp Hạng Toàn CLB
                </span>
                <span className="text-2xl sm:text-[32px] font-black text-[#D97706] block tracking-tight leading-none py-0.5">
                  #{clubRank}
                </span>
                <span className="text-[11.5px] font-semibold text-[#D97706]/90 block">
                  Top {members.length} Đại sứ sinh viên
                </span>
              </div>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-amber-300 bg-white flex items-center justify-center text-[#D97706] shrink-0 shadow-2xs">
                <Trophy className="w-5 h-5 stroke-[1.75]" />
              </div>
            </div>

            {/* Card 3: Xếp Hạng Trong Ban */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F0FDF4] flex items-center justify-between transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
              <div className="space-y-1">
                <span className="text-xs sm:text-[13px] font-semibold text-slate-600 block">
                  Xếp Hạng Trong Ban
                </span>
                <span className="text-2xl sm:text-[32px] font-black text-[#16A34A] block tracking-tight leading-none py-0.5">
                  #{deptRank}
                </span>
                <span className="text-[11.5px] font-semibold text-[#16A34A]/90 block">
                  {currentMember.department_name}
                </span>
              </div>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-emerald-300 bg-white flex items-center justify-center text-[#16A34A] shrink-0 shadow-2xs">
                <Users className="w-5 h-5 stroke-[1.75]" />
              </div>
            </div>
          </div>

          {/* 2. Hai Khối Phân Tích & Xếp Loại Chuẩn Format Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card Left: Phân Bổ Biến Động Điểm */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F0F9FF] border border-sky-100 flex items-center justify-center text-[#0284C7] shrink-0 shadow-2xs">
                    <Activity className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-[#061651] tracking-tight">
                      Phân Bổ Biến Động Điểm
                    </h4>
                    <p className="text-xs text-slate-400 font-medium">
                      Tỷ lệ đóng góp điểm cộng và trừ kỷ luật trong kỳ
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F0F9FF] text-[#0284C7] border border-sky-200/80 shrink-0">
                  Biểu đồ tròn
                </span>
              </div>

              {/* Biểu đồ Donut SVG & Chi tiết */}
              <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 pt-1">
                {/* Donut Chart */}
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

                    {/* Cung điểm cộng */}
                    {bonusTotal > 0 && (
                      <circle
                        cx="65"
                        cy="65"
                        r="48"
                        fill="none"
                        stroke="url(#bonusPieGradient)"
                        strokeWidth="14"
                        strokeDasharray={`${totalMovement > 0 ? (bonusTotal / totalMovement) * (2 * Math.PI * 48) : 2 * Math.PI * 48} ${2 * Math.PI * 48}`}
                        strokeDashoffset="0"
                        strokeLinecap={deductTotal > 0 ? 'butt' : 'round'}
                        className="transition-all duration-700 ease-out"
                      />
                    )}

                    {/* Cung điểm trừ */}
                    {deductTotal > 0 && (
                      <circle
                        cx="65"
                        cy="65"
                        r="48"
                        fill="none"
                        stroke="url(#deductPieGradient)"
                        strokeWidth="14"
                        strokeDasharray={`${(deductTotal / totalMovement) * (2 * Math.PI * 48)} ${2 * Math.PI * 48}`}
                        strokeDashoffset={`${-((bonusTotal / totalMovement) * (2 * Math.PI * 48))}`}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    )}
                  </svg>

                  {/* Tâm biểu đồ tròn */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Chốt ròng
                    </span>
                    <span className="text-xl font-black text-[#0284C7] leading-none my-0.5">
                      {netPoints >= 0 ? `+${netPoints}` : netPoints}đ
                    </span>
                    {totalMovement > 0 ? (
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border ${
                        netPoints >= 0
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200/80'
                          : 'text-rose-700 bg-rose-50 border-rose-200/80'
                      }`}>
                        {netPoints >= 0 ? `+${bonusPercent}%` : `-${deductPercent}%`}
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-full border border-slate-200">
                        Chuẩn 60đ
                      </span>
                    )}
                  </div>
                </div>

                {/* 3 Khối thống kê chi tiết chuẩn thẻ pastel */}
                <div className="flex-1 w-full space-y-2.5 text-xs">
                  {/* Điểm cộng cống hiến */}
                  <div className="flex justify-between items-center p-3 rounded-xl bg-[#F0FDF4] border border-emerald-200/60 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-bold text-emerald-950">Tổng điểm cộng cống hiến:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200/80 shadow-2xs">
                        {bonusPercent}%
                      </span>
                      <span className="font-black text-emerald-700 text-sm">+{bonusTotal}đ</span>
                    </div>
                  </div>

                  {/* Điểm trừ kỷ luật */}
                  <div className="flex justify-between items-center p-3 rounded-xl bg-[#FFF1F2] border border-rose-200/60 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                      <span className="font-bold text-rose-950">Tổng điểm trừ kỷ luật:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200/80 shadow-2xs">
                        {deductPercent}%
                      </span>
                      <span className="font-black text-rose-700 text-sm">-{deductTotal}đ</span>
                    </div>
                  </div>

                  {/* Điểm chốt ròng */}
                  <div className="flex justify-between items-center p-3 rounded-xl bg-[#F0F9FF] border border-sky-200/60 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#0284C7] shrink-0" />
                      <span className="font-bold text-slate-800">Điểm chốt ròng tháng:</span>
                    </div>
                    <span className="font-black text-[#0284C7] text-sm">
                      {netPoints >= 0 ? `+${netPoints}` : netPoints}đ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Right: Xếp Loại Thi Đua Định Kỳ */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 sm:p-7 space-y-5 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-2xs">
                    <Award className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-[#061651] tracking-tight">
                      Xếp Loại Thi Đua Định Kỳ
                    </h4>
                    <p className="text-xs text-slate-400 font-medium">
                      Đánh giá theo khung tiêu chuẩn thi đua iSSAC
                    </p>
                  </div>
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs shrink-0">
                  {rating.level_name}
                </span>
              </div>

              {/* Khối Banner Đánh Giá Chuẩn Style Dashboard */}
              <div className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 border border-amber-200/70 shadow-2xs space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8.5 h-8.5 rounded-full bg-white border border-amber-300 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Medal className="w-4.5 h-4.5 stroke-[1.8]" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-900">
                        Đạt mức <strong className="text-amber-950 font-black text-sm">{octScore}/100đ</strong>
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900">
                        {rating.level_name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {rating.action_required || 'Thành viên tích cực tham gia các hoạt động và bảo đảm kỷ luật họp CLB.'}
                    </p>
                  </div>
                </div>

                {/* Thanh đo trực quan tiến độ điểm */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500">
                    <span>Mức hoàn thành</span>
                    <span className="text-[#0284C7] font-extrabold">{octScore}% (Điểm tối đa 100đ)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 relative overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-[#0284C7] transition-all duration-700"
                      style={{ width: `${Math.min(100, Math.max(0, octScore))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 4 Khối Chỉ Số Chuẩn Định Kỳ Khớp 100% Ảnh 2 */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 sm:p-3 rounded-xl bg-[#F0FDF4] border border-emerald-200/70 flex items-center gap-2.5">
                  <div className="w-7.5 h-7.5 rounded-full bg-white border border-emerald-300 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
                    <Flag className="w-3.5 h-3.5 stroke-[1.8]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-500 font-semibold block truncate">Mục tiêu CLB</span>
                    <span className="text-xs font-bold text-emerald-800 block truncate">80đ ({octScore >= 80 ? 'Đạt' : 'Chưa đạt'})</span>
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 rounded-xl bg-[#F0F9FF] border border-sky-200/70 flex items-center gap-2.5">
                  <div className="w-7.5 h-7.5 rounded-full bg-white border border-sky-300 flex items-center justify-center text-[#0284C7] shrink-0 shadow-2xs">
                    <Target className="w-3.5 h-3.5 stroke-[1.8]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-500 font-semibold block truncate">Chuẩn thi đua</span>
                    <span className="text-xs font-bold text-[#0284C7] block truncate">70đ ({octScore >= 70 ? 'Đạt' : 'Chưa đạt'})</span>
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 rounded-xl bg-[#FFFBEB] border border-amber-200/70 flex items-center gap-2.5">
                  <div className="w-7.5 h-7.5 rounded-full bg-white border border-amber-300 flex items-center justify-center text-[#D97706] shrink-0 shadow-2xs">
                    <TrendingUp className="w-3.5 h-3.5 stroke-[1.8]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-500 font-semibold block truncate">Mốc khởi đầu</span>
                    <span className="text-xs font-bold text-amber-800 block truncate">60đ ({changeValue >= 0 ? `+${changeValue}đ` : `${changeValue}đ`})</span>
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2.5">
                  <div className="w-7.5 h-7.5 rounded-full bg-white border border-slate-300 flex items-center justify-center text-slate-600 shrink-0 shadow-2xs">
                    <Gauge className="w-3.5 h-3.5 stroke-[1.8]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-500 font-semibold block truncate">Thang điểm</span>
                    <span className="text-xs font-bold text-slate-700 block truncate">0 - 100đ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 3: LỊCH SỬ CHẤM ĐIỂM & SỔ CÁI (HISTORY) */}
      {/* ========================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4 sm:space-y-5">
          {/* 1. Quick Stats Row for History */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Box 1: Tổng bản ghi */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F0F9FF] border border-sky-100/80 flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-500 block">Tổng bản ghi ghi nhận</span>
                <span className="text-2xl font-black text-[#0284C7] block leading-none py-0.5">
                  {fullHistory.length}
                </span>
                <span className="text-[11px] font-medium text-slate-500">Biến động điểm tháng</span>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-sky-300 bg-white flex items-center justify-center text-[#0284C7] shrink-0 shadow-2xs">
                <Layers className="w-4.5 h-4.5 stroke-[1.8]" />
              </div>
            </div>

            {/* Box 2: Điểm cộng cống hiến */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F0FDF4] border border-emerald-100/80 flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-500 block">Điểm cộng cống hiến</span>
                <span className="text-2xl font-black text-[#16A34A] block leading-none py-0.5">
                  +{bonusTotal}đ
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">
                  {fullHistory.filter((h) => h.type === 'add').length} lần ghi nhận
                </span>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-emerald-300 bg-white flex items-center justify-center text-[#16A34A] shrink-0 shadow-2xs">
                <ArrowUpRight className="w-5 h-5 stroke-[2]" />
              </div>
            </div>

            {/* Box 3: Điểm trừ kỷ luật */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FFF1F2] border border-rose-100/80 flex items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-500 block">Điểm trừ kỷ luật</span>
                <span className="text-2xl font-black text-[#E11D48] block leading-none py-0.5">
                  -{deductTotal}đ
                </span>
                <span className="text-[11px] font-semibold text-rose-700">
                  {fullHistory.filter((h) => h.type === 'deduct').length} lần vi phạm
                </span>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-rose-300 bg-white flex items-center justify-center text-[#E11D48] shrink-0 shadow-2xs">
                <ArrowDownRight className="w-5 h-5 stroke-[2]" />
              </div>
            </div>
          </div>

          {/* 2. Main History List Card Container */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 sm:p-7 space-y-5">
            {/* Header + Tabs Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#F0F9FF] border border-sky-100 flex items-center justify-center text-[#0284C7] shrink-0 shadow-2xs">
                  <Clock className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#061651] tracking-tight">
                    Lịch Sử Điểm Cá Nhân
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Ghi nhận chi tiết toàn bộ điểm cộng cống hiến và trừ kỷ luật
                  </p>
                </div>
              </div>

              {/* Subtabs filter pills matching project standard */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 text-xs font-bold self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setHistoryFilter('all')}
                  className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    historyFilter === 'all'
                      ? 'bg-white text-[#0284C7] shadow-2xs border border-slate-200/60 font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Tất cả ({fullHistory.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('add')}
                  className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    historyFilter === 'add'
                      ? 'bg-white text-emerald-700 shadow-2xs border border-emerald-200/60 font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Điểm cộng ({fullHistory.filter((h) => h.type === 'add').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('deduct')}
                  className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    historyFilter === 'deduct'
                      ? 'bg-white text-rose-700 shadow-2xs border border-rose-200/60 font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5 text-rose-600" />
                  <span>Điểm trừ ({fullHistory.filter((h) => h.type === 'deduct').length})</span>
                </button>
              </div>
            </div>

            {/* Items list with rich styling matching project */}
            <div className="space-y-2.5">
              {filteredHistory.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#F0F9FF] border border-sky-200/80 text-[#0284C7] flex items-center justify-center mx-auto shadow-2xs">
                    <Clock className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Chưa có bản ghi điểm nào trong mục này
                  </h4>
                  <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto">
                    Mốc xuất phát chuẩn khởi đầu: 60 điểm (theo Quy chế P01 CLB Đại sứ sinh viên Trường Quốc tế).
                  </p>
                </div>
              ) : (
                filteredHistory.map((item) => {
                  const isAdd = item.type === 'add'
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] group ${
                        isAdd
                          ? 'bg-white hover:bg-[#F0FDF4]/30 border-slate-200/80 hover:border-emerald-300'
                          : 'bg-white hover:bg-[#FFF1F2]/30 border-slate-200/80 hover:border-rose-300'
                      }`}
                    >
                      {/* Left Side: Avatar Icon & Info */}
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        {/* Circular Icon with white bg & border */}
                        <div
                          className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-2xs border ${
                            isAdd
                              ? 'border-emerald-300 text-emerald-600'
                              : 'border-rose-300 text-rose-600'
                          }`}
                        >
                          {isAdd ? (
                            <ArrowUpRight className="w-5 h-5 stroke-[2.2]" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5 stroke-[2.2]" />
                          )}
                        </div>

                        {/* Text details */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`font-mono font-black text-[11px] px-2 py-0.5 rounded-md border shadow-2xs ${
                                isAdd
                                  ? 'bg-[#F0FDF4] text-emerald-700 border-emerald-200/80'
                                  : 'bg-[#FFF1F2] text-rose-700 border-rose-200/80'
                              }`}
                            >
                              {item.code}
                            </span>
                            <span className="font-bold text-xs sm:text-[13.5px] text-[#061651] group-hover:text-[#0284C7] transition-colors">
                              {item.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 text-[11px] flex-wrap font-medium">
                            <span className="flex items-center gap-1 text-slate-500">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{item.time}</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100/90 text-slate-600 text-[10.5px] font-medium border border-slate-200/60">
                              {item.category}
                            </span>
                            <span className="flex items-center gap-1 text-slate-500">
                              <UserCheck className="w-3 h-3 text-slate-400" />
                              <span>{item.actor}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Points & Status Tag */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <span
                          className={`text-sm sm:text-base font-black px-3.5 py-1 rounded-full border shadow-2xs whitespace-nowrap flex items-center gap-1 ${
                            isAdd
                              ? 'bg-[#F0FDF4] text-emerald-700 border-emerald-200'
                              : 'bg-[#FFF1F2] text-rose-700 border-rose-200'
                          }`}
                        >
                          {item.points > 0 ? `+${item.points}đ` : `${item.points}đ`}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mt-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span>{item.status}</span>
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
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
