'use client'

import React, { useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useClub } from '@/lib/context/ClubContext'
import {
  Calendar,
  Lock,
  Unlock,
  PlusCircle,
  ShieldCheck,
  Crown,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Info,
  Check,
  QrCode,
  MapPin,
  Users,
  Copy,
  UserCheck,
  UserPlus,
  Trash2,
  Zap,
  Sliders,
  Flame,
  Pencil,
  X,
} from 'lucide-react'
import type { PeriodItem } from '@/lib/periodData'

export function SettingsView() {
  const { isBCN, currentUser } = useAuth()
  const {
    periods,
    createMonthPeriod,
    updateMonthPeriod,
    deleteMonthPeriod,
    lockMonthPeriod,
    unlockMonthPeriod,
    events,
    activeEventId,
    setActiveEventId,
    createUpcomingEvent,
    registerForEvent,
    unregisterFromEvent,
    deleteEvent,
    members,
  } = useClub()

  // Tab chuyển đổi: 'events' (Sự kiện & Đăng ký) vs 'periods' (Chu kỳ & Khóa sổ)
  const [activeSettingsTab, setActiveSettingsTab] = useState<'events' | 'periods'>('events')

  // Form tạo tháng mới theo thời gian thực
  const [selectedMonth, setSelectedMonth] = useState<number>(10)
  const [selectedYear, setSelectedYear] = useState<number>(2026)
  const [customName, setCustomName] = useState<string>('Tháng 10/2026')
  const [description, setDescription] = useState<string>(
    'Chu kỳ thi đua Tháng 10/2026 theo thời gian thực - Mốc xuất phát 60 điểm cho toàn CLB'
  )

  // Chỉnh sửa & Xóa chu kỳ tháng (Dành riêng cho Ban Chủ nhiệm)
  const [editingPeriod, setEditingPeriod] = useState<PeriodItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editShortLabel, setEditShortLabel] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editTimeRange, setEditTimeRange] = useState('')
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)

  const [deletingPeriod, setDeletingPeriod] = useState<PeriodItem | null>(null)
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false)

  // Form tạo sự kiện sắp tới & mở cổng đăng ký
  const [eventTitle, setEventTitle] = useState('Workshop Kỹ năng Đàm phán & Thuyết trình chuyên nghiệp')
  const [eventDate, setEventDate] = useState('28/10/2026')
  const [eventStartTime, setEventStartTime] = useState('19:00')
  const [eventEndTime, setEventEndTime] = useState('21:30')
  const [eventLocation, setEventLocation] = useState('Hội trường HT1 - Cơ sở Hòa Lạc & Zoom Online')
  const [eventPin, setEventPin] = useState('8899')
  const [eventIsRequired, setEventIsRequired] = useState(false)
  const [eventAllowRegistration, setEventAllowRegistration] = useState(true)
  const [eventMaxAttendees, setEventMaxAttendees] = useState(50)
  const [eventPointBonus, setEventPointBonus] = useState(2)
  const [eventCategory, setEventCategory] = useState<'meeting' | 'workshop' | 'teambuilding' | 'external'>('workshop')
  const [eventDescription, setEventDescription] = useState(
    'Chuyên đề nâng cao kỹ năng đàm phán, giao tiếp đối ngoại và ứng biến sân khấu dành riêng cho thành viên CLB.'
  )

  // Thử nghiệm đăng ký thành viên
  const [testRegMemberCode, setTestRegMemberCode] = useState(members[0]?.member_code || '')
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Danh sách các chu kỳ theo tháng
  const monthPeriods = periods.filter((p) => p.scope === 'month')

  // Xử lý tạo tháng mới
  const handleCreateMonth = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isBCN) {
      setToast({
        type: 'error',
        message: 'Chỉ Ban Chủ nhiệm mới có quyền thiết lập và tạo chu kỳ tháng thi đua mới!',
      })
      setTimeout(() => setToast(null), 4000)
      return
    }

    const actor = currentUser?.name || 'Nguyễn Thị Hồng Hân (Ban Chủ nhiệm)'
    const res = createMonthPeriod({
      month: selectedMonth,
      year: selectedYear,
      name: customName.trim() || `Tháng ${String(selectedMonth).padStart(2, '0')}/${selectedYear}`,
      description: description.trim(),
      actorName: actor,
    })

    if (res.success) {
      setToast({ type: 'success', message: res.message })
      const nextMonth = selectedMonth === 12 ? 1 : selectedMonth + 1
      const nextYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear
      setSelectedMonth(nextMonth)
      setSelectedYear(nextYear)
      setCustomName(`Tháng ${String(nextMonth).padStart(2, '0')}/${nextYear}`)
      setDescription(`Chu kỳ thi đua Tháng ${String(nextMonth).padStart(2, '0')}/${nextYear} - Mốc 60đ toàn CLB`)
    } else {
      setToast({ type: 'error', message: res.message })
    }

    setTimeout(() => setToast(null), 5000)
  }

  // Khóa sổ điểm
  const handleLockPeriod = (periodId: string) => {
    if (!isBCN) {
      alert('Chỉ Ban Chủ nhiệm mới có quyền khóa sổ điểm!')
      return
    }
    const actor = currentUser?.name || 'Nguyễn Thị Hồng Hân (Chủ nhiệm)'
    const res = lockMonthPeriod(periodId, actor)
    setToast({ type: 'success', message: res.message })
    setTimeout(() => setToast(null), 4000)
  }

  // Mở khóa sổ điểm
  const handleUnlockPeriod = (periodId: string) => {
    if (!isBCN) {
      alert('Chỉ Ban Chủ nhiệm mới có quyền mở khóa sổ điểm!')
      return
    }
    const actor = currentUser?.name || 'Ban Chủ nhiệm'
    const res = unlockMonthPeriod(periodId, actor)
    setToast({ type: 'success', message: res.message })
    setTimeout(() => setToast(null), 4000)
  }

  // Mở modal chỉnh sửa chu kỳ tháng (Chỉ BCN)
  const handleOpenEdit = (period: PeriodItem) => {
    if (!isBCN) {
      alert('Chỉ Ban Chủ nhiệm mới có quyền chỉnh sửa chu kỳ thi đua!')
      return
    }
    setEditingPeriod(period)
    setEditName(period.name)
    setEditShortLabel(period.shortLabel)
    setEditDescription(period.description)
    setEditTimeRange(period.timeRange)
  }

  // Lưu chỉnh sửa chu kỳ tháng (Chỉ BCN)
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isBCN) {
      alert('Chỉ Ban Chủ nhiệm mới có quyền chỉnh sửa chu kỳ thi đua!')
      return
    }
    if (!editingPeriod) return
    if (!editName.trim()) {
      alert('Vui lòng nhập tên chu kỳ!')
      return
    }

    setIsSubmittingEdit(true)
    const actor = currentUser?.name || 'Ban Chủ nhiệm'
    const res = updateMonthPeriod(
      editingPeriod.id,
      {
        name: editName.trim(),
        shortLabel: editShortLabel.trim(),
        description: editDescription.trim(),
        timeRange: editTimeRange.trim(),
      },
      actor
    )
    setIsSubmittingEdit(false)

    if (res.success) {
      setToast({ type: 'success', message: res.message })
      setEditingPeriod(null)
    } else {
      setToast({ type: 'error', message: res.message })
    }
    setTimeout(() => setToast(null), 4000)
  }

  // Xác nhận xóa chu kỳ tháng (Chỉ BCN)
  const handleConfirmDelete = () => {
    if (!isBCN) {
      alert('Chỉ Ban Chủ nhiệm mới có quyền xóa chu kỳ thi đua!')
      return
    }
    if (!deletingPeriod) return

    setIsSubmittingDelete(true)
    const actor = currentUser?.name || 'Ban Chủ nhiệm'
    const res = deleteMonthPeriod(deletingPeriod.id, actor)
    setIsSubmittingDelete(false)

    if (res.success) {
      setToast({ type: 'success', message: res.message })
      setDeletingPeriod(null)
    } else {
      setToast({ type: 'error', message: res.message })
    }
    setTimeout(() => setToast(null), 4000)
  }

  // Xử lý tạo sự kiện mới sắp tới
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isBCN) {
      setToast({
        type: 'error',
        message: 'Chỉ Ban Chủ nhiệm mới có quyền thiết lập sự kiện và mở cổng đăng ký!',
      })
      setTimeout(() => setToast(null), 4000)
      return
    }

    if (!eventTitle.trim()) {
      alert('Vui lòng nhập tên sự kiện!')
      return
    }

    const res = createUpcomingEvent({
      title: eventTitle,
      description: eventDescription,
      date: eventDate,
      startTime: eventStartTime,
      endTime: eventEndTime,
      location: eventLocation,
      pinCode: eventPin,
      isRequired: eventIsRequired,
      allowRegistration: eventAllowRegistration,
      maxAttendees: eventMaxAttendees,
      pointBonus: eventPointBonus,
      category: eventCategory,
    })

    if (res.success) {
      setToast({ type: 'success', message: res.message })
      // Sinh mã PIN ngẫu nhiên mới cho lần sau
      setEventPin(String(Math.floor(1000 + Math.random() * 9000)))
    } else {
      setToast({ type: 'error', message: res.message })
    }

    setTimeout(() => setToast(null), 5000)
  }

  // Thử đăng ký tham gia sự kiện
  const handleTestRegister = (eventId: string) => {
    if (!testRegMemberCode) return
    const res = registerForEvent(eventId, testRegMemberCode)
    if (res.success) {
      setToast({ type: 'success', message: res.message })
    } else {
      setToast({ type: 'error', message: res.message })
    }
    setTimeout(() => setToast(null), 4000)
  }

  // Hủy đăng ký
  const handleTestUnregister = (eventId: string, memberCode: string) => {
    const res = unregisterFromEvent(eventId, memberCode)
    if (res.success) {
      setToast({ type: 'success', message: res.message })
    }
    setTimeout(() => setToast(null), 4000)
  }

  // Sao chép mã PIN
  const handleCopyPin = (id: string, pin: string) => {
    navigator.clipboard.writeText(pin)
    setCopiedPinId(id)
    setTimeout(() => setCopiedPinId(null), 2000)
  }

  // Preset sự kiện nhanh
  const fillPresetWorkshop = () => {
    setEventTitle('Workshop Kỹ năng Đàm phán & Thuyết trình chuyên nghiệp')
    setEventCategory('workshop')
    setEventDate('28/10/2026')
    setEventStartTime('19:00')
    setEventEndTime('21:30')
    setEventLocation('Hội trường HT1 - Cơ sở Hòa Lạc & Zoom Online')
    setEventIsRequired(false)
    setEventAllowRegistration(true)
    setEventPointBonus(2)
    setEventMaxAttendees(50)
    setEventDescription('Chuyên đề nâng cao kỹ năng đàm phán, giao tiếp đối ngoại và ứng biến sân khấu dành riêng cho thành viên CLB.')
  }

  const fillPresetTeambuilding = () => {
    setEventTitle('Teambuilding Gen 3 & Gắn kết Thành viên mới')
    setEventCategory('teambuilding')
    setEventDate('08/11/2026')
    setEventStartTime('08:00')
    setEventEndTime('17:00')
    setEventLocation('Khu du lịch sinh thái Quốc Oai, Hà Nội')
    setEventIsRequired(true)
    setEventAllowRegistration(true)
    setEventPointBonus(3)
    setEventMaxAttendees(60)
    setEventDescription('Chuyến dã ngoại kết nối toàn CLB. Bắt buộc tham gia 100% thành viên (nhân sự có việc bận xin phép trước 48h).')
  }

  const fillPresetMeeting = () => {
    setEventTitle('Sinh hoạt định kỳ Câu Lạc bộ Đại sứ sinh viên Trường Quốc tế Tháng 11/2026')
    setEventCategory('meeting')
    setEventDate('15/11/2026')
    setEventStartTime('19:30')
    setEventEndTime('21:30')
    setEventLocation('Phòng họp A3-201 & Google Meet')
    setEventIsRequired(true)
    setEventAllowRegistration(true)
    setEventPointBonus(1)
    setEventMaxAttendees(48)
    setEventDescription('Đánh giá hoạt động tháng 10, phát động chiến dịch Chào tân sinh viên QH-2026 và phân công ban.')
  }

  return (
    <div className="space-y-6 w-full">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between shadow-xl animate-fade-in border ${
            toast.type === 'success'
              ? 'bg-[#0B1E48] text-white border-blue-400/30'
              : 'bg-rose-950 text-rose-100 border-rose-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            )}
            <span className="text-xs font-semibold">{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-xs underline text-slate-300 hover:text-white ml-4 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 1. Header & Role Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight whitespace-nowrap">
              Cài Đặt Hệ Thống &amp; Quản Trị CLB
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0B1E48]/5 text-[#1351D8] border border-blue-200/80 whitespace-nowrap shrink-0">
              iSSAC Admin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium">
            Quản trị chu kỳ thi đua và thiết lập sự kiện/workshop cho 48 thành viên CLB
          </p>
        </div>

        {/* Executive Role Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 shadow-2xs whitespace-nowrap ${
              isBCN
                ? 'bg-amber-50/90 text-amber-900 border-amber-300/80'
                : 'bg-purple-50 text-purple-900 border-purple-200/80'
            }`}
          >
            {isBCN ? <Crown className="w-4 h-4 text-amber-600 shrink-0" /> : <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />}
            <span>{isBCN ? 'Quyền: Ban Chủ nhiệm (Toàn quyền)' : 'Quyền: Ban Nhân sự (Chấm điểm)'}</span>
          </span>
        </div>
      </div>

      {/* 2. Primary Sub-tabs Selection (Segmented Control) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit border border-slate-200/70 shadow-2xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSettingsTab('events')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeSettingsTab === 'events'
              ? 'bg-[#1351D8] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>Sự kiện &amp; Đăng ký</span>
          <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold leading-none ${
            activeSettingsTab === 'events' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {events.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSettingsTab('periods')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeSettingsTab === 'periods'
              ? 'bg-[#0B1E48] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
          }`}
        >
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span>Chu kỳ &amp; Khóa sổ</span>
          <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold leading-none ${
            activeSettingsTab === 'periods' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {monthPeriods.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: SET UP SỰ KIỆN SẮP TỚI & CỔNG ĐĂNG KÝ (CHECK-IN) */}
      {/* ======================================================== */}
      {activeSettingsTab === 'events' && (
        <div className="space-y-5">
          {/* 3 Khối chỉ số điều hành nhanh (Gọn gàng, cân đối, thay thế banner cồng kềnh cũ) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Card 1: Tổng số sự kiện */}
            <div className="bg-white rounded-2xl p-4 border border-blue-200/80 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1351D8] flex items-center justify-center shrink-0 border border-blue-200/60 shadow-2xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-500 block truncate">Sự kiện &amp; Workshop</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-black text-[#0B1E48]">{events.length}</span>
                  <span className="text-xs font-semibold text-blue-600">phiên hoạt động</span>
                </div>
              </div>
            </div>

            {/* Card 2: Tổng lượt đăng ký trước */}
            <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-500 block truncate">Tổng lượt đăng ký</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-black text-emerald-700">
                    {events.reduce((acc, cur) => acc + (cur.registeredMemberCodes?.length || 0), 0)}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600">thành viên giữ chỗ</span>
                </div>
              </div>
            </div>

            {/* Card 3: Check-in Kiosk Live */}
            <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-2xs">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 block">Check-in Realtime</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-base font-black text-[#0B1E48] tracking-wider font-mono">
                    PIN: {events.find((e) => e.id === activeEventId)?.pinCode || '8899'}
                  </span>
                  <span className="text-[11px] font-bold text-amber-700 hidden sm:inline">Kiosk Live</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Tạo Sự Kiện Mới - Cân đối, tối ưu hóa, gọn gàng */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 space-y-4 border border-slate-200/90 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B1E48] to-[#1351D8] text-white flex items-center justify-center font-bold shadow-2xs shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#0B1E48]">
                    Thiết Lập Sự Kiện / Buổi Sinh Hoạt Mới
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Điền thông tin sự kiện để mở cổng đăng ký và tạo mã PIN điểm danh
                  </p>
                </div>
              </div>

              {/* Mẫu nhanh */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <span className="text-slate-500 font-semibold whitespace-nowrap">Mẫu nhanh:</span>
                <button
                  type="button"
                  onClick={fillPresetWorkshop}
                  className="px-2.5 py-1 rounded-lg font-bold bg-blue-50 text-[#1351D8] hover:bg-blue-100 border border-blue-200/80 transition whitespace-nowrap shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <Zap className="w-3 h-3 text-[#1351D8]" />
                  <span>Workshop Kỹ năng</span>
                </button>
                <button
                  type="button"
                  onClick={fillPresetTeambuilding}
                  className="px-2.5 py-1 rounded-lg font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 transition whitespace-nowrap shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <Flame className="w-3 h-3 text-emerald-600" />
                  <span>Teambuilding</span>
                </button>
                <button
                  type="button"
                  onClick={fillPresetMeeting}
                  className="px-2.5 py-1 rounded-lg font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/80 transition whitespace-nowrap shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <Users className="w-3 h-3 text-purple-600" />
                  <span>Sinh hoạt định kỳ</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              {/* Row 1: Tên sự kiện & Thể loại */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-8">
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên sự kiện / chuyên đề: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Ví dụ: Workshop Kỹ năng Đàm phán &amp; Thuyết trình chuyên nghiệp"
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#1351D8] transition shadow-2xs"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block font-bold text-slate-700 mb-1">Thể loại sự kiện:</label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value as any)}
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-[#1351D8] transition shadow-2xs cursor-pointer"
                  >
                    <option value="workshop">Workshop chuyên đề</option>
                    <option value="teambuilding">Teambuilding &amp; Ngoại khóa</option>
                    <option value="meeting">Sinh hoạt định kỳ CLB</option>
                    <option value="external">Sự kiện cấp ĐHQGHN</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Thời gian & Địa điểm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
                <div className="md:col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">
                    Ngày diễn ra: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    placeholder="DD/MM/YYYY (VD: 28/10/2026)"
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#1351D8] transition shadow-2xs"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">Giờ bắt đầu - Kết thúc:</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={eventStartTime}
                      onChange={(e) => setEventStartTime(e.target.value)}
                      placeholder="19:00"
                      className="w-1/2 bg-slate-50/70 border border-slate-200/90 rounded-xl px-2 py-2 text-center text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-[#1351D8] transition shadow-2xs"
                    />
                    <span className="text-slate-400 font-bold">-</span>
                    <input
                      type="text"
                      value={eventEndTime}
                      onChange={(e) => setEventEndTime(e.target.value)}
                      placeholder="21:30"
                      className="w-1/2 bg-slate-50/70 border border-slate-200/90 rounded-xl px-2 py-2 text-center text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-[#1351D8] transition shadow-2xs"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 md:col-span-6">
                  <label className="block font-bold text-slate-700 mb-1">
                    Địa điểm tổ chức: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Hội trường B2, Cơ sở Xuân Thủy / Google Meet..."
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#1351D8] transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Row 3: Cấu hình Check-in PIN, Điểm thưởng & Tùy chọn */}
              <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-2.5">
                <span className="font-bold text-slate-800 block text-xs">Cấu hình Đăng ký &amp; Điểm danh Check-in:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-center">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1 text-[11px]">
                      Mã PIN máy chiếu (4 số):
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        maxLength={6}
                        value={eventPin}
                        onChange={(e) => setEventPin(e.target.value)}
                        className="w-full bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 text-center font-mono font-black text-xs text-[#1351D8] focus:outline-none focus:border-[#1351D8] transition shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setEventPin(String(Math.floor(1000 + Math.random() * 9000)))}
                        className="p-1.5 bg-white border border-slate-200/90 rounded-xl hover:bg-slate-50 transition shadow-2xs cursor-pointer"
                        title="Tạo mã PIN ngẫu nhiên"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1 text-[11px]">Số lượng tối đa:</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={eventMaxAttendees}
                        onChange={(e) => setEventMaxAttendees(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200/90 rounded-xl pl-3 pr-8 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#1351D8] transition shadow-2xs"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 pointer-events-none">TV</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1 text-[11px]">Điểm cộng khi tham gia:</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={eventPointBonus}
                        onChange={(e) => setEventPointBonus(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200/90 rounded-xl pl-3 pr-8 py-1.5 text-xs font-bold text-emerald-700 focus:outline-none focus:border-[#1351D8] transition shadow-2xs"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-emerald-600 pointer-events-none">+đ</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 select-none text-[11px]">
                      <input
                        type="checkbox"
                        checked={eventAllowRegistration}
                        onChange={(e) => setEventAllowRegistration(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-[#1351D8] focus:ring-blue-500 cursor-pointer"
                      />
                      <span>Mở cổng cho đăng ký trước</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 select-none text-[11px]">
                      <input
                        type="checkbox"
                        checked={eventIsRequired}
                        onChange={(e) => setEventIsRequired(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                      <span>Bắt buộc 100% thành viên</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Mô tả chi tiết */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mô tả nội dung, trang phục &amp; yêu cầu chuẩn bị:
                </label>
                <textarea
                  rows={2}
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Ghi rõ nội dung diễn giả, trang phục yêu cầu (áo CLB/áo sơ mi), tài liệu cần đem theo..."
                  className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#1351D8] transition shadow-2xs"
                />
              </div>

              {/* Notice & Submit */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#1351D8] flex-shrink-0" />
                  <span>
                    Sau khi tạo, sự kiện sẽ xuất hiện trong danh sách và sẵn sàng điểm danh tại màn hình{' '}
                    <strong className="text-slate-800">Điểm danh Check-in</strong>.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={!isBCN}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    isBCN
                      ? 'bg-gradient-to-r from-[#0F3282] via-[#1351D8] to-[#1E62F4] hover:brightness-110 text-white active:scale-95 shadow-[#1351D8]/25 cursor-pointer'
                      : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{isBCN ? 'Khởi Tạo Sự Kiện & Mở Cổng' : 'Chỉ BCN Được Tạo Sự Kiện'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Danh Sách Sự Kiện Sắp Tới & Thử Nghiệm Đăng Ký */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 space-y-4 border border-slate-200/90 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#1351D8]" />
                <h3 className="text-sm font-black text-[#0B1E48]">
                  Danh Sách Sự Kiện Sắp Tới &amp; Quản Lý Đăng Ký ({events.length} sự kiện)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Mã PIN máy chiếu &amp; Cổng điểm danh thời gian thực
              </span>
            </div>

            {/* Test Registration Control Bar */}
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#1351D8] shrink-0" />
                <span className="font-bold text-[#0B1E48]">Thử nghiệm đăng ký thành viên:</span>
              </div>
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <select
                  value={testRegMemberCode}
                  onChange={(e) => setTestRegMemberCode(e.target.value)}
                  className="w-full bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1351D8] shadow-2xs cursor-pointer"
                >
                  {members.map((m) => (
                    <option key={m.member_code} value={m.member_code}>
                      {m.full_name} ({m.department_name})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 whitespace-nowrap hidden sm:inline">Ấn Đăng ký ở từng thẻ bên dưới</span>
              </div>
            </div>

            {/* Event Cards */}
            <div className="space-y-4">
              {events.map((evt) => {
                const registeredList = evt.registeredMemberCodes || []
                const isUserRegistered = registeredList.includes(testRegMemberCode)
                const isActive = activeEventId === evt.id
                const categoryLabel =
                  evt.category === 'workshop'
                    ? 'Workshop chuyên đề'
                    : evt.category === 'teambuilding'
                    ? 'Teambuilding'
                    : evt.category === 'external'
                    ? 'Sự kiện ĐHQG'
                    : 'Sinh hoạt định kỳ'

                return (
                  <div
                    key={evt.id}
                    className={`p-5 rounded-2xl border transition-all duration-200 space-y-3.5 shadow-2xs ${
                      isActive
                        ? 'bg-blue-50/30 border-[#1351D8] ring-1 ring-[#1351D8]/30 shadow-xs'
                        : 'bg-white border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-base text-[#0B1E48]">{evt.title}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#1351D8] border border-blue-200/80 shadow-2xs">
                            {categoryLabel}
                          </span>
                          {evt.isRequired ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
                              Bắt buộc tham gia
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                              Tự nguyện (+{evt.pointBonus || 2}đ)
                            </span>
                          )}
                          {isActive && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xs flex items-center gap-1 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              <span>ĐANG KÍCH HOẠT ĐIỂM DANH</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{evt.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-0.5">
                          <span className="flex items-center gap-1 font-semibold text-slate-800">
                            <Calendar className="w-3.5 h-3.5 text-[#1351D8]" />
                            {evt.date}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-[#1351D8]" />
                            {evt.startTime} - {evt.endTime}
                          </span>
                          <span className="flex items-center gap-1 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-[#1351D8]" />
                            {evt.location}
                          </span>
                        </div>
                      </div>

                      {/* Mã PIN & QR Box */}
                      <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200/90 flex flex-col items-center justify-center min-w-[125px] self-start md:self-auto shadow-2xs">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Mã PIN Check-in</span>
                        <div className="text-2xl font-mono font-black text-[#1351D8] tracking-widest my-0.5">
                          {evt.pinCode}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyPin(evt.id, evt.pinCode)}
                          className="text-[10.5px] font-bold text-slate-500 hover:text-[#1351D8] flex items-center gap-1 transition cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedPinId === evt.id ? 'Đã sao chép!' : 'Sao chép PIN'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Registration Status & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs">
                          <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-bold text-slate-800 whitespace-nowrap">
                            {registeredList.length} / {evt.maxAttendees || 50} thành viên đã đăng ký
                          </span>
                        </div>
                        <div className="w-32 h-2 rounded-full bg-slate-200 overflow-hidden shrink-0">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, (registeredList.length / (evt.maxAttendees || 50)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Interactive Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Thử Đăng ký / Hủy đăng ký */}
                        {isUserRegistered ? (
                          <button
                            type="button"
                            onClick={() => handleTestUnregister(evt.id, testRegMemberCode)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300/80 hover:bg-amber-100 transition shadow-2xs cursor-pointer whitespace-nowrap"
                          >
                            Hủy đăng ký cho thành viên
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleTestRegister(evt.id)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Đăng ký tham gia ngay</span>
                          </button>
                        )}

                        {/* Đặt làm sự kiện Check-in */}
                        {!isActive ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveEventId(evt.id)
                              setToast({
                                type: 'success',
                                message: `Đã kích hoạt sự kiện "${evt.title}" làm phiên điểm danh Check-in hiện tại!`,
                              })
                              setTimeout(() => setToast(null), 3000)
                            }}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#0F3282] via-[#1351D8] to-[#1E62F4] text-white hover:brightness-110 transition shadow-2xs shadow-[#1351D8]/20 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Đặt làm sự kiện Check-in</span>
                          </button>
                        ) : (
                          <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1 shadow-2xs whitespace-nowrap">
                            <Check className="w-3.5 h-3.5" />
                            <span>Đang chiếu điểm danh</span>
                          </span>
                        )}

                        {/* Sao chép link đăng ký gửi vào nhóm Zalo/Messenger CLB */}
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof window !== 'undefined') {
                              const url = `${window.location.origin}/checkin?tab=register&event=${evt.id}`
                              navigator.clipboard.writeText(url)
                              setToast({
                                type: 'success',
                                message: `Đã copy link đăng ký sự kiện "${evt.title}"! Bạn có thể dán vào nhóm Zalo CLB để thành viên đăng ký.`,
                              })
                              setTimeout(() => setToast(null), 4000)
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/90 transition shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                          title="Sao chép link đăng ký gửi vào nhóm Zalo cho thành viên đăng ký trước"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Link Đăng Ký Zalo</span>
                        </button>

                        {/* Xóa sự kiện nếu là BCN */}
                        {isBCN && events.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa sự kiện "${evt.title}" không?`)) {
                                deleteEvent(evt.id)
                              }
                            }}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                            title="Xóa sự kiện này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: QUẢN TRỊ CHU KỲ THÁNG & KHÓA SỔ ĐIỂM (NGUYÊN BẢN) */}
      {/* ======================================================== */}
      {activeSettingsTab === 'periods' && (
        <div className="space-y-6">
          {/* Triết lý thi đua công bằng CLB */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-slate-50 border border-blue-200/80 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1351D8]">
              <Sparkles className="w-4 h-4 text-[#1351D8] shrink-0" />
              <span>Quy trình vận hành thi đua &amp; khóa sổ điểm chuẩn hóa CLB:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-700 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-white/95 border border-blue-200/80 shadow-2xs space-y-1">
                <span className="font-bold text-[#0B1E48] block text-xs">1. Tạo tháng thi đua mới (BCN)</span>
                <span>
                  Tạo độc lập theo lịch thực tế (ví dụ: <strong className="text-[#1351D8]">Tháng 10/2026</strong>). Không phá hủy lịch sử tháng cũ. Tất cả 48 thành viên tự động xuất phát từ mốc <strong className="text-[#0B1E48]">60 điểm</strong>.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/95 border border-purple-200/80 shadow-2xs space-y-1">
                <span className="font-bold text-purple-900 block text-xs">2. Chấm điểm &amp; Đề xuất (Ban Nhân sự)</span>
                <span>
                  Ban Nhân sự click vào tháng đang mở để cho điểm, trừ điểm vi phạm. Đề xuất chuyển đến hàng đợi Ban Chủ nhiệm phê duyệt.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/95 border border-amber-200/80 shadow-2xs space-y-1">
                <span className="font-bold text-amber-900 block text-xs">3. Khóa sổ điểm tháng (Ban Chủ nhiệm)</span>
                <span>
                  Khi hết tháng hoặc sau khi chốt điểm, BCN nhấn <strong className="text-amber-800">Khóa sổ điểm</strong>. Điểm tháng đó đóng băng vĩnh viễn, ngăn chặn mọi can thiệp về sau.
                </span>
              </div>
            </div>
          </div>

          {/* Form Thiết Lập Tạo Tháng Mới Theo Thời Gian Thật */}
          <div className="bg-white rounded-2xl p-6 space-y-5 border border-slate-200/90 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B1E48] to-[#1351D8] text-white flex items-center justify-center font-bold shadow-2xs shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#0B1E48]">
                    Khởi Tạo Tháng Thi Đua Mới (Mốc Xuất Phát 60 Điểm)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Thiết lập chu kỳ thi đua mới - Khởi tạo mốc xuất phát chuẩn 60 điểm cho toàn CLB &amp; lưu vĩnh viễn trên Cloud
                  </p>
                </div>
              </div>

              {/* Quick presets - No raw emojis */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonth(10)
                    setSelectedYear(2026)
                    setCustomName('Tháng 10/2026')
                    setDescription('Chu kỳ thi đua cao điểm Chào tân sinh viên QH-2026 & Phát động phong trào Đại sứ')
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-[#1351D8] hover:bg-blue-100 border border-blue-200/80 transition shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 text-[#1351D8]" />
                  <span>10/2026 (Hiện tại)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonth(11)
                    setSelectedYear(2026)
                    setCustomName('Tháng 11/2026')
                    setDescription('Chu kỳ thi đua Tháng 11/2026: Tri ân Thầy Cô 20/11 & Tiếp sức tân sinh viên')
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/90 transition shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>11/2026 (Kế tiếp)</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateMonth} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Chọn Tháng */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tháng: <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      const m = Number(e.target.value)
                      setSelectedMonth(m)
                      setCustomName(`Tháng ${String(m).padStart(2, '0')}/${selectedYear}`)
                    }}
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#1351D8] transition shadow-2xs cursor-pointer"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        Tháng {String(m).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chọn Năm */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Năm hoạt động: <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      const y = Number(e.target.value)
                      setSelectedYear(y)
                      setCustomName(`Tháng ${String(selectedMonth).padStart(2, '0')}/${y}`)
                    }}
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#1351D8] transition shadow-2xs cursor-pointer"
                  >
                    {[2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>
                        Năm {y}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tên hiển thị chu kỳ */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên chu kỳ hiển thị:
                  </label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Ví dụ: Tháng 10/2026"
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#1351D8] transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Mô tả / Mục tiêu chu kỳ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mục tiêu &amp; Kế hoạch thi đua trong tháng:
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ghi rõ kế hoạch trọng tâm, sự kiện, chiến dịch trong tháng..."
                  className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#1351D8] transition shadow-2xs"
                />
              </div>

              {/* Notice & Submit */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#1351D8] flex-shrink-0" />
                  <span>
                    Khi tạo, chu kỳ sẽ ở trạng thái <strong className="text-slate-800">Đang mở chấm điểm</strong>. Mọi thành viên bắt đầu ở <strong className="text-slate-800">60đ</strong>.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={!isBCN}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    isBCN
                      ? 'bg-gradient-to-r from-[#0F3282] via-[#1351D8] to-[#1E62F4] hover:brightness-110 text-white active:scale-95 shadow-[#1351D8]/25 cursor-pointer'
                      : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{isBCN ? 'Khởi Tạo Tháng Mới (Mốc 60đ)' : 'Chỉ BCN Được Tạo Tháng'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Danh Sách Các Chu Kỳ Tháng & Quản Trị Khóa Sổ Điểm */}
          <div className="bg-white rounded-2xl p-6 space-y-4 border border-slate-200/90 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-black text-[#0B1E48]">
                  Quản Trị Chu Kỳ Tháng &amp; Khóa Sổ Điểm ({monthPeriods.length} Chu Kỳ)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Quyền Ban Chủ nhiệm: Khóa sổ điểm để đóng băng kết quả, bảo đảm sự công bằng
              </span>
            </div>

            <div className="space-y-3">
              {monthPeriods.map((period) => {
                const isLocked = period.status === 'locked'
                return (
                  <div
                    key={period.id}
                    className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs ${
                      isLocked
                        ? 'bg-slate-50/70 border-slate-200/90'
                        : 'bg-white border-blue-200/80 shadow-xs'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-black text-sm text-[#0B1E48]">
                          {period.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200/90">
                          {period.shortLabel}
                        </span>

                        {/* Status Pill */}
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs">
                            <Lock className="w-3 h-3 text-slate-600" />
                            <span>Đã khóa sổ bởi BCN</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Đang mở chấm điểm</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-1">
                        {period.description}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{period.timeRange}</span>
                        </span>

                        {isLocked && period.lockedBy && (
                          <span className="text-amber-800 font-sans font-medium">
                            Khóa bởi: {period.lockedBy} {period.lockedAt ? `(${period.lockedAt})` : ''}
                          </span>
                        )}

                        {!isLocked && period.createdAt && (
                          <span className="text-slate-500 font-sans">
                            Tạo lúc: {period.createdAt}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hành Động Ban Chủ Nhiệm */}
                    <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
                      {isBCN ? (
                        <>
                          {/* Nút Chỉnh Sửa Chu Kỳ (Chỉ BCN) */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(period)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200/90 bg-white text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 hover:border-blue-200 transition shadow-2xs cursor-pointer whitespace-nowrap"
                            title="Chỉnh sửa tên, nhãn viết tắt, mô tả hoặc thời gian chu kỳ (Chỉ BCN)"
                          >
                            <Pencil className="w-3.5 h-3.5 text-slate-500" />
                            <span>Sửa</span>
                          </button>

                          {/* Nút Khóa / Mở Khóa Sổ Điểm */}
                          {isLocked ? (
                            <button
                              type="button"
                              onClick={() => handleUnlockPeriod(period.id)}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer whitespace-nowrap"
                              title="Mở khóa lại chu kỳ này nếu cần bổ sung duyệt điểm"
                            >
                              <Unlock className="w-3.5 h-3.5 text-slate-600" />
                              <span>Mở khóa lại</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleLockPeriod(period.id)}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white transition shadow-2xs active:scale-95 cursor-pointer whitespace-nowrap"
                              title="Chốt điểm và khóa sổ chu kỳ này, không cho phép cộng/trừ điểm nữa"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Khóa sổ điểm</span>
                            </button>
                          )}

                          {/* Nút Xóa Chu Kỳ (Chỉ BCN) */}
                          <button
                            type="button"
                            onClick={() => setDeletingPeriod(period)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                            title={`Xóa chu kỳ thi đua "${period.name}" (Chỉ BCN)`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Chỉ BCN có quyền chỉnh sửa, khóa sổ hoặc xóa chu kỳ
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA CHU KỲ (CHỈ BAN CHỦ NHIỆM) */}
      {editingPeriod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#0B1E48]/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-lg w-full border border-slate-200/90 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Pencil className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
                      Chỉ Ban Chủ Nhiệm
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {editingPeriod.id}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-[#0B1E48] tracking-tight">
                    Chỉnh Sửa Chu Kỳ Thi Đua
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPeriod(null)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Tên chu kỳ tháng</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                    placeholder="VD: Tháng 10/2026"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Nhãn viết tắt</label>
                  <input
                    type="text"
                    value={editShortLabel}
                    onChange={(e) => setEditShortLabel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold font-mono text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                    placeholder="VD: T10/2026"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Khung thời gian thực</label>
                <input
                  type="text"
                  value={editTimeRange}
                  onChange={(e) => setEditTimeRange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                  placeholder="VD: 01/10/2026 - 31/10/2026"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Mục tiêu &amp; Kế hoạch thi đua</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden resize-none"
                  placeholder="Mô tả trọng tâm thi đua..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingPeriod(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingEdit ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA CHU KỲ (CHỈ BAN CHỦ NHIỆM) */}
      {deletingPeriod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#0B1E48]/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-md w-full border border-slate-200/90 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/70 flex items-center justify-center shadow-xs shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#0B1E48]">
                  Xác Nhận Xóa Chu Kỳ
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Hành động này chỉ dành cho Ban Chủ nhiệm
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1.5 text-slate-600">
              <div className="font-bold text-[#0B1E48] flex items-center gap-2">
                <span>{deletingPeriod.name}</span>
                <span className="font-mono text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {deletingPeriod.shortLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {deletingPeriod.description}
              </p>
              <p className="text-[11px] text-rose-600 font-medium pt-1">
                ⚠️ Chu kỳ này và mọi dữ liệu liên quan sẽ bị xóa khỏi hệ thống. Nếu đây là chu kỳ hiện tại, hệ thống sẽ tự động chuyển sang chu kỳ gần nhất.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingPeriod(null)}
                disabled={isSubmittingDelete}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmittingDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-xs cursor-pointer text-xs flex items-center gap-1.5"
              >
                {isSubmittingDelete ? 'Đang xóa...' : 'Xác Nhận Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
