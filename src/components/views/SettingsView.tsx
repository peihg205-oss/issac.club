'use client'

import React, { useState, useRef } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useClub } from '@/lib/context/ClubContext'
import { useLanguage } from '@/lib/context/LanguageContext'
import {
  Calendar,
  Lock,
  Unlock,
  PlusCircle,
  ShieldCheck,
  Crown,
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
  Sliders,
  Pencil,
  X,
  Search,
  Filter,
} from 'lucide-react'
import type { PeriodItem } from '@/lib/periodData'
import type { MeetingEvent } from '@/lib/context/ClubContext'

export function SettingsView() {
  const { language } = useLanguage()
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
    updateEvent,
    updateEventAttendees,
    registerForEvent,
    unregisterFromEvent,
    deleteEvent,
    members,
  } = useClub()

  // Tab chuyển đổi: 'events' (Sự kiện & Đăng ký) vs 'periods' (Chu kỳ & Khóa sổ)
  const [activeSettingsTab, setActiveSettingsTab] = useState<'events' | 'periods'>('events')

  // Mascot động & Lời thoại tương tác
  const [isMascotCheering, setIsMascotCheering] = useState(false)
  const [mascotQuoteIdx, setMascotQuoteIdx] = useState(0)
  const [showMascotBubble, setShowMascotBubble] = useState(false)
  const mascotBubbleTimeout = useRef<NodeJS.Timeout | null>(null)

  const mascotQuotes = language === 'vi' ? [
    'Thiết lập hệ thống & sự kiện CLB!',
    'Khởi tạo chu kỳ rèn luyện mới!',
    'Bảo đảm tính minh bạch, công bằng!',
    'Vận hành chuẩn chỉ, chuyên nghiệp!',
  ] : [
    'Configure club events & system!',
    'Initialize new training cycle!',
    'Ensure fairness & transparency!',
    'Standardized & professional ops!',
  ]

  const handleMascotClick = () => {
    setIsMascotCheering(true)
    setShowMascotBubble(true)
    setMascotQuoteIdx((prev) => (prev + 1) % mascotQuotes.length)
    setTimeout(() => setIsMascotCheering(false), 850)

    if (mascotBubbleTimeout.current) clearTimeout(mascotBubbleTimeout.current)
    mascotBubbleTimeout.current = setTimeout(() => {
      setShowMascotBubble(false)
    }, 2800)
  }

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

  // Quản lý danh sách đăng ký theo danh sách CLB
  const [managingAttendeesEvent, setManagingAttendeesEvent] = useState<MeetingEvent | null>(null)
  const [attendeeSelectedCodes, setAttendeeSelectedCodes] = useState<string[]>([])
  const [attendeeSearchQuery, setAttendeeSearchQuery] = useState('')
  const [attendeeFilterDept, setAttendeeFilterDept] = useState('ALL')

  // Chỉnh sửa thông tin sự kiện
  const [editingEvent, setEditingEvent] = useState<MeetingEvent | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editStartTime, setEditStartTime] = useState('')
  const [editEndTime, setEditEndTime] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editPin, setEditPin] = useState('')
  const [editIsRequired, setEditIsRequired] = useState(false)
  const [editAllowRegistration, setEditAllowRegistration] = useState(true)
  const [editMaxAttendees, setEditMaxAttendees] = useState(50)
  const [editPointBonus, setEditPointBonus] = useState(2)
  const [editCategory, setEditCategory] = useState<'meeting' | 'workshop' | 'teambuilding' | 'external'>('workshop')
  const [editEventDescription, setEditEventDescription] = useState('')
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
        message: language === 'vi' ? 'Chỉ Ban Chủ nhiệm mới có quyền thiết lập và tạo chu kỳ tháng thi đua mới!' : 'Only the Executive Board has permission to create new cycles!',
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
      alert(language === 'vi' ? 'Chỉ Ban Chủ nhiệm mới có quyền khóa sổ điểm!' : 'Executive Board permission required!')
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
      alert(language === 'vi' ? 'Chỉ Ban Chủ nhiệm mới có quyền mở khóa sổ điểm!' : 'Executive Board permission required!')
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
      alert(language === 'vi' ? 'Chỉ Ban Chủ nhiệm mới có quyền chỉnh sửa chu kỳ thi đua!' : 'Executive Board permission required!')
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
      alert(language === 'vi' ? 'Chỉ Ban Chủ nhiệm mới có quyền chỉnh sửa chu kỳ thi đua!' : 'Executive Board permission required!')
      return
    }
    if (!editingPeriod) return
    if (!editName.trim()) {
      alert(language === 'vi' ? 'Vui lòng nhập tên chu kỳ!' : 'Please enter cycle name!')
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
      alert(language === 'vi' ? 'Chỉ Ban Chủ nhiệm mới có quyền xóa chu kỳ thi đua!' : 'Executive Board permission required!')
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
        message: language === 'vi' ? 'Chỉ Ban Chủ nhiệm mới có quyền thiết lập sự kiện và mở cổng đăng ký!' : 'Executive Board permission required!',
      })
      setTimeout(() => setToast(null), 4000)
      return
    }

    if (!eventTitle.trim()) {
      alert(language === 'vi' ? 'Vui lòng nhập tên sự kiện!' : 'Please enter event title!')
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

  // Mở modal quản lý danh sách đăng ký theo danh sách CLB
  const openManageAttendees = (evt: MeetingEvent) => {
    setManagingAttendeesEvent(evt)
    setAttendeeSelectedCodes(evt.registeredMemberCodes || [])
    setAttendeeSearchQuery('')
    setAttendeeFilterDept('ALL')
  }

  // Danh sách thành viên CLB được lọc trong modal
  const filteredClubMembers = members.filter((m) => {
    const matchesDept = attendeeFilterDept === 'ALL' || m.department_name === attendeeFilterDept
    const q = attendeeSearchQuery.toLowerCase().trim()
    const matchesQuery =
      !q ||
      m.full_name.toLowerCase().includes(q) ||
      m.member_code.toLowerCase().includes(q) ||
      (m.email && m.email.toLowerCase().includes(q))
    return matchesDept && matchesQuery
  })

  // Mở modal chỉnh sửa thông tin sự kiện
  const openEditEvent = (evt: MeetingEvent) => {
    setEditingEvent(evt)
    setEditTitle(evt.title)
    setEditDate(evt.date)
    setEditStartTime(evt.startTime)
    setEditEndTime(evt.endTime)
    setEditLocation(evt.location)
    setEditPin(evt.pinCode)
    setEditIsRequired(evt.isRequired)
    setEditAllowRegistration(evt.allowRegistration ?? true)
    setEditMaxAttendees(evt.maxAttendees || 50)
    setEditPointBonus(evt.pointBonus ?? 2)
    setEditCategory(evt.category || 'workshop')
    setEditEventDescription(evt.description)
  }

  // Lưu chỉnh sửa thông tin sự kiện
  const handleSaveEditEvent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEvent) return
    if (!editTitle.trim()) {
      setToast({ type: 'error', message: language === 'vi' ? 'Vui lòng nhập tên sự kiện!' : 'Please enter event title!' })
      return
    }
    const res = updateEvent(editingEvent.id, {
      title: editTitle.trim(),
      date: editDate,
      startTime: editStartTime,
      endTime: editEndTime,
      location: editLocation.trim(),
      pinCode: editPin.trim() || '8899',
      isRequired: editIsRequired,
      allowRegistration: editAllowRegistration,
      maxAttendees: Number(editMaxAttendees) || 50,
      pointBonus: Number(editPointBonus) || 0,
      category: editCategory,
      description: editEventDescription.trim(),
    })
    if (res.success) {
      setToast({ type: 'success', message: res.message })
      setEditingEvent(null)
    } else {
      setToast({ type: 'error', message: res.message })
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
    setEventTitle(language === 'vi' ? 'Workshop Kỹ năng Đàm phán & Thuyết trình chuyên nghiệp' : 'Professional Negotiation & Presentation Skills Workshop')
    setEventCategory('workshop')
    setEventDate('28/10/2026')
    setEventStartTime('19:00')
    setEventEndTime('21:30')
    setEventLocation('Hội trường HT1 - Cơ sở Hòa Lạc & Zoom Online')
    setEventIsRequired(false)
    setEventAllowRegistration(true)
    setEventPointBonus(2)
    setEventMaxAttendees(50)
    setEventDescription(language === 'vi'
      ? 'Chuyên đề nâng cao kỹ năng đàm phán, giao tiếp đối ngoại và ứng biến sân khấu dành riêng cho thành viên CLB.'
      : 'Advanced topic on negotiation skills, external communication, and stage presence for club members.')
  }

  const fillPresetTeambuilding = () => {
    setEventTitle(language === 'vi' ? 'Teambuilding Gen 3 & Gắn kết Thành viên mới' : 'Gen 3 Teambuilding & New Member Bonding')
    setEventCategory('teambuilding')
    setEventDate('08/11/2026')
    setEventStartTime('08:00')
    setEventEndTime('17:00')
    setEventLocation('Khu du lịch sinh thái Quốc Oai, Hà Nội')
    setEventIsRequired(true)
    setEventAllowRegistration(true)
    setEventPointBonus(3)
    setEventMaxAttendees(60)
    setEventDescription(language === 'vi'
      ? 'Chuyến dã ngoại kết nối toàn CLB. Bắt buộc tham gia 100% thành viên (nhân sự có việc bận xin phép trước 48h).'
      : 'Club-wide bonding trip. Mandatory 100% attendance (submit excused absence 48h in advance).')
  }

  const fillPresetMeeting = () => {
    setEventTitle(language === 'vi' ? 'Sinh hoạt định kỳ Câu Lạc bộ Đại sứ sinh viên Trường Quốc tế Tháng 11/2026' : 'VNU-IS Ambassadors Club Monthly Meeting Nov 2026')
    setEventCategory('meeting')
    setEventDate('15/11/2026')
    setEventStartTime('19:30')
    setEventEndTime('21:30')
    setEventLocation('Phòng họp A3-201 & Google Meet')
    setEventIsRequired(true)
    setEventAllowRegistration(true)
    setEventPointBonus(1)
    setEventMaxAttendees(48)
    setEventDescription(language === 'vi'
      ? 'Đánh giá hoạt động tháng 10, phát động chiến dịch Chào tân sinh viên QH-2026 và phân công ban.'
      : 'Review October activities, launch QH-2026 orientation campaign, and assign department duties.')
  }

  return (
    <div className="space-y-6 w-full">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between shadow-xl animate-fade-in border ${
            toast.type === 'success'
              ? 'bg-[#061651] text-white border-sky-400/30'
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
            {language === 'vi' ? 'Đóng' : 'Close'}
          </button>
        </div>
      )}

      {/* 1. Header Trang Chuẩn Nhận Diện Dự Án (Đồng Bộ AccountsView, HistoryView, MembersView) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3.5 sm:gap-4.5">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#061651] tracking-tight leading-tight whitespace-nowrap">
                {language === 'vi' ? 'Cài Đặt Hệ Thống & Quản Trị CLB' : 'System Settings & Club Admin'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0284C7]/10 text-[#0284C7] border border-sky-200/80 whitespace-nowrap shrink-0">
                iSSAC Admin
              </span>
            </div>
            <p className="text-xs sm:text-[13px] text-[#64748B] mt-1 font-normal">
              {language === 'vi'
                ? 'Quản trị chu kỳ thi đua và thiết lập sự kiện/workshop cho các thành viên CLB'
                : 'Administer emulation cycles and configure events/workshops for club members'}
            </p>
          </div>

          {/* Mascot Hoạt Động & Bóng Thoại Đồng Bộ Các Trang */}
          <div
            onClick={handleMascotClick}
            className="relative group cursor-pointer inline-flex items-center shrink-0 select-none"
            title={language === 'vi' ? 'Click để trò chuyện với Mascot' : 'Click to interact with Mascot'}
          >
            <img
              src="/settings-mascot.png"
              alt="iSSAC Mascot"
              className={`w-12 h-14 sm:w-14 sm:h-16 object-contain drop-shadow-[0_4px_12px_rgba(249,115,22,0.25)] transition-all duration-300 ${
                isMascotCheering
                  ? 'animate-mascot-pop drop-shadow-[0_8px_20px_rgba(249,115,22,0.45)]'
                  : 'animate-mascot-fly hover:scale-115 hover:rotate-3'
              }`}
            />

            {/* Bubble tooltip nằm bên cạnh mascot chuẩn style */}
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

        {/* Executive Role Badge */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <span
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 shadow-2xs whitespace-nowrap ${
              isBCN
                ? 'bg-amber-50/90 text-amber-900 border-amber-300/80'
                : 'bg-purple-50 text-purple-900 border-purple-200/80'
            }`}
          >
            {isBCN ? <Crown className="w-4 h-4 text-amber-600 shrink-0" /> : <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />}
            <span>
              {isBCN
                ? (language === 'vi' ? 'Quyền: Ban Chủ nhiệm (Toàn quyền)' : 'Role: Executive Board (Full Access)')
                : (language === 'vi' ? 'Quyền: Ban Nhân sự (Chấm điểm)' : 'Role: HR Dept (Scoring)')}
            </span>
          </span>
        </div>
      </div>

      {/* 2. Primary Sub-tabs Selection (Segmented Control Đồng Bộ Hệ Thống) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit border border-slate-200/80 shadow-2xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSettingsTab('events')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeSettingsTab === 'events'
              ? 'bg-[#0284C7] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>{language === 'vi' ? 'Sự kiện & Đăng ký' : 'Events & Registration'}</span>
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
              ? 'bg-[#0284C7] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
          }`}
        >
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span>{language === 'vi' ? 'Chu kỳ & Khóa sổ' : 'Cycles & Finalization'}</span>
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
          {/* 3 Khối chỉ số điều hành nhanh (Gọn gàng, chuẩn màu thương hiệu) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Card 1: Tổng số sự kiện */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0284C7] flex items-center justify-center shrink-0 border border-sky-200/60 shadow-2xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-[#64748B] block truncate">
                  {language === 'vi' ? 'Sự kiện & Workshop' : 'Events & Workshops'}
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-black text-[#061651]">{events.length}</span>
                  <span className="text-xs font-semibold text-[#0284C7]">
                    {language === 'vi' ? 'phiên hoạt động' : 'active sessions'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Tổng lượt đăng ký trước */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-[#64748B] block truncate">
                  {language === 'vi' ? 'Tổng lượt đăng ký' : 'Total Registrations'}
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-black text-emerald-700">
                    {events.reduce((acc, cur) => acc + (cur.registeredMemberCodes?.length || 0), 0)}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600">
                    {language === 'vi' ? 'thành viên giữ chỗ' : 'members registered'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Check-in Kiosk Live */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-2xs">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#64748B] block">
                    {language === 'vi' ? 'Check-in Realtime' : 'Realtime Check-in'}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-base font-black text-[#061651] tracking-wider font-mono">
                    PIN: {events.find((e) => e.id === activeEventId)?.pinCode || '8899'}
                  </span>
                  <span className="text-[11px] font-bold text-amber-700 hidden sm:inline">Kiosk Live</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Tạo Sự Kiện Mới - Cân đối, chuẩn nhận diện dự án */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 space-y-4 border border-slate-200/90 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0284C7] border border-sky-200/70 flex items-center justify-center font-bold shadow-2xs shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#061651]">
                    {language === 'vi' ? 'Thiết Lập Sự Kiện / Buổi Sinh Hoạt Mới' : 'Set Up New Event / Club Meeting'}
                  </h3>
                  <p className="text-[11px] text-[#64748B] font-medium">
                    {language === 'vi'
                      ? 'Điền thông tin sự kiện để mở cổng đăng ký và tạo mã PIN điểm danh'
                      : 'Fill in event details to open registration and generate attendance PIN'}
                  </p>
                </div>
              </div>

              {/* Mẫu nhanh */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <span className="text-[#64748B] font-semibold whitespace-nowrap">
                  {language === 'vi' ? 'Mẫu nhanh:' : 'Quick Presets:'}
                </span>
                <button
                  type="button"
                  onClick={fillPresetWorkshop}
                  className="px-2.5 py-1 rounded-lg font-bold bg-sky-50 text-[#0284C7] hover:bg-sky-100 border border-sky-200/80 transition whitespace-nowrap shadow-2xs cursor-pointer"
                >
                  <span>{language === 'vi' ? 'Workshop Kỹ năng' : 'Skills Workshop'}</span>
                </button>
                <button
                  type="button"
                  onClick={fillPresetTeambuilding}
                  className="px-2.5 py-1 rounded-lg font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 transition whitespace-nowrap shadow-2xs cursor-pointer"
                >
                  <span>{language === 'vi' ? 'Teambuilding' : 'Teambuilding'}</span>
                </button>
                <button
                  type="button"
                  onClick={fillPresetMeeting}
                  className="px-2.5 py-1 rounded-lg font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/80 transition whitespace-nowrap shadow-2xs cursor-pointer"
                >
                  <span>{language === 'vi' ? 'Sinh hoạt định kỳ' : 'Regular Meeting'}</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              {/* Row 1: Tên sự kiện & Thể loại */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-8">
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Tên sự kiện / chuyên đề:' : 'Event / Session Title:'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder={language === 'vi' ? 'Ví dụ: Workshop Kỹ năng Đàm phán & Thuyết trình chuyên nghiệp' : 'e.g. Workshop on Professional Negotiation & Public Speaking'}
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#0284C7] transition shadow-2xs"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Thể loại sự kiện:' : 'Event Category:'}
                  </label>
                  <select
                    value={eventCategory}
                    onChange={(e) => setEventCategory(e.target.value as any)}
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-[#0284C7] transition shadow-2xs cursor-pointer"
                  >
                    <option value="workshop">{language === 'vi' ? 'Workshop chuyên đề' : 'Thematic Workshop'}</option>
                    <option value="teambuilding">{language === 'vi' ? 'Teambuilding & Ngoại khóa' : 'Teambuilding & Field Trip'}</option>
                    <option value="meeting">{language === 'vi' ? 'Sinh hoạt định kỳ CLB' : 'Regular Club Meeting'}</option>
                    <option value="external">{language === 'vi' ? 'Sự kiện cấp ĐHQGHN' : 'VNU University-level Event'}</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Thời gian & Địa điểm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
                <div className="md:col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Ngày diễn ra:' : 'Date:'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    placeholder="DD/MM/YYYY (VD: 28/10/2026)"
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#0284C7] transition shadow-2xs"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Giờ bắt đầu - Kết thúc:' : 'Time Range:'}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={eventStartTime}
                      onChange={(e) => setEventStartTime(e.target.value)}
                      placeholder="19:00"
                      className="w-1/2 bg-slate-50/70 border border-slate-200/90 rounded-xl px-2 py-2 text-center text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-[#0284C7] transition shadow-2xs"
                    />
                    <span className="text-slate-400 font-bold">-</span>
                    <input
                      type="text"
                      value={eventEndTime}
                      onChange={(e) => setEventEndTime(e.target.value)}
                      placeholder="21:30"
                      className="w-1/2 bg-slate-50/70 border border-slate-200/90 rounded-xl px-2 py-2 text-center text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-[#0284C7] transition shadow-2xs"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 md:col-span-6">
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Địa điểm tổ chức:' : 'Location:'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Hội trường B2, Cơ sở Xuân Thủy / Google Meet..."
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0284C7] transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Row 3: Cấu hình Check-in PIN, Điểm thưởng & Tùy chọn */}
              <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/80 space-y-2.5">
                <span className="font-bold text-[#061651] block text-xs">
                  {language === 'vi' ? 'Cấu hình Đăng ký & Điểm danh Check-in:' : 'Registration & Attendance Check-in Settings:'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-center">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1 text-[11px]">
                      {language === 'vi' ? 'Mã PIN máy chiếu (4 số):' : 'Projector PIN (4 digits):'}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={eventPin}
                      onChange={(e) => setEventPin(e.target.value)}
                      className="w-full bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 text-center font-mono font-black text-xs text-[#0284C7] focus:outline-none focus:border-[#0284C7] transition shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1 text-[11px]">
                      {language === 'vi' ? 'Số lượng tối đa:' : 'Max Attendees:'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={eventMaxAttendees}
                        onChange={(e) => setEventMaxAttendees(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200/90 rounded-xl pl-3 pr-8 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0284C7] transition shadow-2xs"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 pointer-events-none">
                        {language === 'vi' ? 'TV' : 'pax'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1 text-[11px]">
                      {language === 'vi' ? 'Điểm cộng khi tham gia:' : 'Participation Bonus:'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={eventPointBonus}
                        onChange={(e) => setEventPointBonus(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200/90 rounded-xl pl-3 pr-8 py-1.5 text-xs font-bold text-emerald-700 focus:outline-none focus:border-[#0284C7] transition shadow-2xs"
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
                        className="w-3.5 h-3.5 rounded text-[#0284C7] focus:ring-sky-500 cursor-pointer"
                      />
                      <span>{language === 'vi' ? 'Mở cổng cho đăng ký trước' : 'Open advance registration'}</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 select-none text-[11px]">
                      <input
                        type="checkbox"
                        checked={eventIsRequired}
                        onChange={(e) => setEventIsRequired(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                      <span>{language === 'vi' ? 'Bắt buộc 100% thành viên' : 'Mandatory 100% attendance'}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Mô tả chi tiết */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Mô tả nội dung, trang phục & yêu cầu chuẩn bị:' : 'Description, Dress Code & Preparation:'}
                </label>
                <textarea
                  rows={2}
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder={language === 'vi' ? 'Ghi rõ nội dung diễn giả, trang phục yêu cầu (áo CLB/áo sơ mi), tài liệu cần đem theo...' : 'Detail speaker info, dress code (club polo/shirt), items to bring...'}
                  className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0284C7] transition shadow-2xs"
                />
              </div>

              {/* Notice & Submit */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#0284C7] flex-shrink-0" />
                  <span>
                    {language === 'vi' ? (
                      <>
                        Sau khi tạo, sự kiện sẽ xuất hiện trong danh sách và sẵn sàng điểm danh tại màn hình{' '}
                        <strong className="text-slate-800">Điểm danh Check-in</strong>.
                      </>
                    ) : (
                      <>
                        Once created, the event will appear in the schedule and be ready for live attendance on the{' '}
                        <strong className="text-slate-800">Check-in screen</strong>.
                      </>
                    )}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={!isBCN}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                    isBCN
                      ? 'bg-[#0284C7] hover:bg-[#0369A1] text-white active:scale-95 shadow-sky-600/20 cursor-pointer'
                      : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>
                    {isBCN
                      ? (language === 'vi' ? 'Khởi Tạo Sự Kiện & Mở Cổng' : 'Create Event & Open Gate')
                      : (language === 'vi' ? 'Chỉ BCN Được Tạo Sự Kiện' : 'BCN Only')}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Danh Sách Sự Kiện Sắp Tới & Thử Nghiệm Đăng Ký */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 space-y-4 border border-slate-200/90 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0284C7]" />
                <h3 className="text-sm sm:text-base font-extrabold text-[#061651]">
                  {language === 'vi'
                    ? `Danh Sách Sự Kiện Sắp Tới & Quản Lý Đăng Ký (${events.length} sự kiện)`
                    : `Upcoming Events & Registration List (${events.length} events)`}
                </h3>
              </div>
              <span className="text-[11px] text-[#64748B] font-medium">
                {language === 'vi' ? 'Mã PIN máy chiếu & Cổng điểm danh thời gian thực' : 'Projector PIN & Realtime Attendance Gate'}
              </span>
            </div>

            {/* Thanh thông tin đồng bộ theo CLB */}
            <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0284C7] shrink-0" />
                <span className="font-bold text-[#061651]">
                  {language === 'vi' ? 'Đồng bộ theo danh sách CLB:' : 'Synchronized with Club Directory:'}
                </span>
                <span className="text-slate-600">
                  {language === 'vi' ? (
                    <>
                      Hiện có <strong className="text-[#0284C7] font-bold">{members.length}</strong> thành viên hoạt động. Bấm &quot;Sửa DS Đăng Ký&quot; ở từng sự kiện để chọn hoặc lọc thành viên tham gia theo danh sách CLB thực tế.
                    </>
                  ) : (
                    <>
                      Currently <strong className="text-[#0284C7] font-bold">{members.length}</strong> active members. Click &quot;Edit Registration&quot; on any event to filter or pick participating members.
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Event Cards */}
            <div className="space-y-4">
              {events.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-300 space-y-2">
                  <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">
                    {language === 'vi' ? 'Chưa có sự kiện nào trong danh sách' : 'No events in list'}
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {language === 'vi'
                      ? 'Ban Chủ nhiệm có thể tạo sự kiện mới ở phần biểu mẫu bên trên để bắt đầu mở cổng đăng ký và điểm danh.'
                      : 'The Executive Board can create a new event above to open registration and attendance.'}
                  </p>
                </div>
              ) : (
                events.map((evt) => {
                  const registeredList = evt.registeredMemberCodes || []
                  const isActive = activeEventId === evt.id
                  const categoryLabel =
                    evt.category === 'workshop'
                      ? (language === 'vi' ? 'Workshop chuyên đề' : 'Thematic Workshop')
                      : evt.category === 'teambuilding'
                      ? (language === 'vi' ? 'Teambuilding' : 'Teambuilding')
                      : evt.category === 'external'
                      ? (language === 'vi' ? 'Sự kiện ĐHQG' : 'VNU Event')
                      : (language === 'vi' ? 'Sinh hoạt định kỳ' : 'Regular Meeting')

                  return (
                    <div
                      key={evt.id}
                      className={`p-5 rounded-2xl border transition-all duration-200 space-y-3.5 shadow-2xs ${
                        isActive
                          ? 'bg-sky-50/30 border-[#0284C7] ring-1 ring-[#0284C7]/30 shadow-xs'
                          : 'bg-white border-slate-200/90 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-base text-[#061651]">{evt.title}</span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-[#0284C7] border border-sky-200/80 shadow-2xs">
                              {categoryLabel}
                            </span>
                            {evt.isRequired ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
                                {language === 'vi' ? 'Bắt buộc tham gia' : 'Mandatory'}
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                                {language === 'vi' ? `Tự nguyện (+${evt.pointBonus || 2}đ)` : `Optional (+${evt.pointBonus || 2} pts)`}
                              </span>
                            )}
                            {isActive && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xs flex items-center gap-1 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                <span>{language === 'vi' ? 'ĐANG KÍCH HOẠT ĐIỂM DANH' : 'ACTIVE CHECK-IN'}</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{evt.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-0.5">
                            <span className="flex items-center gap-1 font-semibold text-slate-800">
                              <Calendar className="w-3.5 h-3.5 text-[#0284C7]" />
                              {evt.date}
                            </span>
                            <span className="flex items-center gap-1 font-semibold text-slate-700">
                              <Clock className="w-3.5 h-3.5 text-[#0284C7]" />
                              {evt.startTime} - {evt.endTime}
                            </span>
                            <span className="flex items-center gap-1 text-slate-600">
                              <MapPin className="w-3.5 h-3.5 text-[#0284C7]" />
                              {evt.location}
                            </span>
                          </div>
                        </div>

                        {/* Mã PIN & QR Box */}
                        <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200/90 flex flex-col items-center justify-center min-w-[125px] self-start md:self-auto shadow-2xs">
                          <span className="text-[10px] uppercase font-bold text-[#64748B]">
                            {language === 'vi' ? 'Mã PIN Check-in' : 'Check-in PIN'}
                          </span>
                          <div className="text-2xl font-mono font-black text-[#0284C7] tracking-widest my-0.5">
                            {evt.pinCode}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyPin(evt.id, evt.pinCode)}
                            className="text-[10.5px] font-bold text-[#64748B] hover:text-[#0284C7] flex items-center gap-1 transition cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>
                              {copiedPinId === evt.id
                                ? (language === 'vi' ? 'Đã sao chép!' : 'Copied!')
                                : (language === 'vi' ? 'Sao chép PIN' : 'Copy PIN')}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Registration Status & Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs">
                            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-bold text-slate-800 whitespace-nowrap">
                              {language === 'vi'
                                ? `${registeredList.length} / ${evt.maxAttendees || 50} thành viên đã đăng ký`
                                : `${registeredList.length} / ${evt.maxAttendees || 50} members registered`}
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
                          {/* Quản lý danh sách đăng ký theo danh sách CLB */}
                          <button
                            type="button"
                            onClick={() => openManageAttendees(evt)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sky-50 text-[#0284C7] border border-sky-200/90 hover:bg-sky-100/80 transition flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
                            title={language === 'vi' ? 'Quản lý & chỉnh sửa danh sách thành viên đăng ký' : 'Manage & edit registered member list'}
                          >
                            <Users className="w-3.5 h-3.5 text-[#0284C7]" />
                            <span>
                              {language === 'vi' ? `Sửa DS Đăng Ký (${registeredList.length})` : `Edit Registrations (${registeredList.length})`}
                            </span>
                          </button>

                          {/* Sửa thông tin sự kiện nếu là BCN */}
                          {isBCN && (
                            <button
                              type="button"
                              onClick={() => openEditEvent(evt)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-[#0284C7] border border-slate-200/90 transition flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
                              title={language === 'vi' ? 'Chỉnh sửa thông tin sự kiện' : 'Edit event info'}
                            >
                              <Pencil className="w-3.5 h-3.5 text-slate-500" />
                              <span>{language === 'vi' ? 'Sửa sự kiện' : 'Edit'}</span>
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
                                  message: language === 'vi'
                                    ? `Đã kích hoạt sự kiện "${evt.title}" làm phiên điểm danh Check-in hiện tại!`
                                    : `Activated event "${evt.title}" as current check-in session!`,
                                })
                                setTimeout(() => setToast(null), 3000)
                              }}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0284C7] hover:bg-[#0369A1] text-white transition shadow-2xs shadow-sky-600/20 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>{language === 'vi' ? 'Đặt làm sự kiện Check-in' : 'Activate Check-in'}</span>
                            </button>
                          ) : (
                            <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1 shadow-2xs whitespace-nowrap">
                              <Check className="w-3.5 h-3.5" />
                              <span>{language === 'vi' ? 'Đang chiếu điểm danh' : 'Live Check-in'}</span>
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
                                  message: language === 'vi'
                                    ? `Đã copy link đăng ký sự kiện "${evt.title}"! Bạn có thể dán vào nhóm Zalo CLB để thành viên đăng ký.`
                                    : `Copied registration link for "${evt.title}"! Paste to group chats for members to register.`,
                                })
                                setTimeout(() => setToast(null), 4000)
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/90 transition shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                            title={language === 'vi' ? 'Sao chép link đăng ký gửi vào nhóm Zalo' : 'Copy registration link'}
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>{language === 'vi' ? 'Link Đăng Ký Zalo' : 'Copy Link'}</span>
                          </button>

                          {/* Xóa sự kiện nếu là BCN */}
                          {isBCN && (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  confirm(
                                    language === 'vi'
                                      ? `Bạn có chắc chắn muốn xóa sự kiện "${evt.title}" không? Hành động này sẽ đồng bộ ngay lập tức và xóa sự kiện trên tất cả thiết bị.`
                                      : `Are you sure you want to delete event "${evt.title}"?`
                                  )
                                ) {
                                  deleteEvent(evt.id)
                                  setToast({
                                    type: 'success',
                                    message: language === 'vi'
                                      ? `Đã xóa sự kiện "${evt.title}" thành công. Dữ liệu đang được đồng bộ tới mọi thiết bị.`
                                      : `Deleted event "${evt.title}" successfully.`,
                                  })
                                  setTimeout(() => setToast(null), 4000)
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100/90 border border-rose-200/90 transition shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                              title={language === 'vi' ? 'Xóa sự kiện này khỏi hệ thống' : 'Delete event'}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>{language === 'vi' ? 'Xóa sự kiện' : 'Delete'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
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
          <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-50/80 via-blue-50/40 to-slate-50 border border-sky-200/80 space-y-3 shadow-2xs">
            <div className="text-xs font-bold text-[#0284C7]">
              <span>
                {language === 'vi'
                  ? 'Quy trình vận hành thi đua & khóa sổ điểm chuẩn hóa CLB:'
                  : 'Emulation Operations & Score Ledger Protocol:'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-700 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-white/95 border border-sky-200/80 shadow-2xs space-y-1">
                <span className="font-bold text-[#061651] block text-xs">
                  {language === 'vi' ? '1. Tạo tháng thi đua mới (BCN)' : '1. Create New Cycle (BCN)'}
                </span>
                <span>
                  {language === 'vi' ? (
                    <>
                      Tạo độc lập theo lịch thực tế (ví dụ: <strong className="text-[#0284C7]">Tháng 10/2026</strong>). Không phá hủy lịch sử tháng cũ. Tất cả thành viên tự động xuất phát từ mốc <strong className="text-[#061651]">60 điểm</strong>.
                    </>
                  ) : (
                    <>
                      Created independently based on real calendar. Previous months are kept immutable. All members initialize at baseline of <strong className="text-[#061651]">60 points</strong>.
                    </>
                  )}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/95 border border-purple-200/80 shadow-2xs space-y-1">
                <span className="font-bold text-purple-900 block text-xs">
                  {language === 'vi' ? '2. Chấm điểm & Đề xuất (Ban Nhân sự)' : '2. Scoring & Proposals (HR)'}
                </span>
                <span>
                  {language === 'vi'
                    ? 'Ban Nhân sự click vào tháng đang mở để cho điểm, trừ điểm vi phạm. Đề xuất chuyển đến hàng đợi Ban Chủ nhiệm phê duyệt.'
                    : 'HR staff logs into active cycles to award or deduct points. Proposals are queued for Executive Board approval.'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/95 border border-amber-200/80 shadow-2xs space-y-1">
                <span className="font-bold text-amber-900 block text-xs">
                  {language === 'vi' ? '3. Khóa sổ điểm tháng (Ban Chủ nhiệm)' : '3. Ledger Lock (BCN)'}
                </span>
                <span>
                  {language === 'vi' ? (
                    <>
                      Khi hết tháng hoặc sau khi chốt điểm, BCN nhấn <strong className="text-amber-800">Khóa sổ điểm</strong>. Điểm tháng đó đóng băng vĩnh viễn, ngăn chặn mọi can thiệp về sau.
                    </>
                  ) : (
                    <>
                      At month-end, the Board clicks <strong className="text-amber-800">Lock Ledger</strong> to permanently freeze scores and prevent further edits.
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Form Thiết Lập Tạo Tháng Mới Theo Thời Gian Thật */}
          <div className="bg-white rounded-2xl p-6 space-y-5 border border-slate-200/90 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0284C7] border border-sky-200/70 flex items-center justify-center font-bold shadow-2xs shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#061651]">
                    {language === 'vi'
                      ? 'Khởi Tạo Tháng Thi Đua Mới (Mốc Xuất Phát 60 Điểm)'
                      : 'Initialize New Emulation Month (60-Point Baseline)'}
                  </h3>
                  <p className="text-[11px] text-[#64748B] font-medium">
                    {language === 'vi'
                      ? 'Thiết lập chu kỳ thi đua mới - Khởi tạo mốc xuất phát chuẩn 60 điểm cho toàn CLB & lưu vĩnh viễn trên Cloud'
                      : 'Set up new cycle - Initialize 60 baseline points across the club & persist on Cloud'}
                  </p>
                </div>
              </div>

              {/* Quick presets */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonth(10)
                    setSelectedYear(2026)
                    setCustomName('Tháng 10/2026')
                    setDescription(language === 'vi'
                      ? 'Chu kỳ thi đua cao điểm Chào tân sinh viên QH-2026 & Phát động phong trào Đại sứ'
                      : 'Emulation cycle for QH-2026 Welcome and Ambassador campaigns')
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-50 text-[#0284C7] hover:bg-sky-100 border border-sky-200/80 transition shadow-2xs cursor-pointer"
                >
                  <span>10/2026 ({language === 'vi' ? 'Hiện tại' : 'Current'})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonth(11)
                    setSelectedYear(2026)
                    setCustomName('Tháng 11/2026')
                    setDescription(language === 'vi'
                      ? 'Chu kỳ thi đua Tháng 11/2026: Tri ân Thầy Cô 20/11 & Tiếp sức tân sinh viên'
                      : 'November 2026 Emulation Cycle: Teachers Day Tribute')
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/90 transition shadow-2xs cursor-pointer"
                >
                  <span>11/2026 ({language === 'vi' ? 'Kế tiếp' : 'Next'})</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateMonth} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Chọn Tháng */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Tháng:' : 'Month:'} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      const m = Number(e.target.value)
                      setSelectedMonth(m)
                      setCustomName(`Tháng ${String(m).padStart(2, '0')}/${selectedYear}`)
                    }}
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#0284C7] transition shadow-2xs cursor-pointer"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {language === 'vi' ? `Tháng ${String(m).padStart(2, '0')}` : `Month ${String(m).padStart(2, '0')}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chọn Năm */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Năm hoạt động:' : 'Year:'} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      const y = Number(e.target.value)
                      setSelectedYear(y)
                      setCustomName(`Tháng ${String(selectedMonth).padStart(2, '0')}/${y}`)
                    }}
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#0284C7] transition shadow-2xs cursor-pointer"
                  >
                    {[2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>
                        {language === 'vi' ? `Năm ${y}` : `Year ${y}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tên hiển thị chu kỳ */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Tên chu kỳ hiển thị:' : 'Cycle Display Name:'}
                  </label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Ví dụ: Tháng 10/2026"
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#0284C7] transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Mô tả / Mục tiêu chu kỳ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Mục tiêu & Kế hoạch thi đua trong tháng:' : 'Goals & Monthly Plans:'}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={language === 'vi' ? 'Ghi rõ kế hoạch trọng tâm, sự kiện, chiến dịch trong tháng...' : 'Detail key focus, events and campaigns...'}
                  className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#0284C7] transition shadow-2xs"
                />
              </div>

              {/* Notice & Submit */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#0284C7] flex-shrink-0" />
                  <span>
                    {language === 'vi' ? (
                      <>
                        Khi tạo, chu kỳ sẽ ở trạng thái <strong className="text-slate-800">Đang mở chấm điểm</strong>. Mọi thành viên bắt đầu ở <strong className="text-slate-800">60đ</strong>.
                      </>
                    ) : (
                      <>
                        When created, the cycle defaults to <strong className="text-slate-800">Scoring Open</strong>. All members start at <strong className="text-slate-800">60 pts</strong>.
                      </>
                    )}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={!isBCN}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                    isBCN
                      ? 'bg-[#0284C7] hover:bg-[#0369A1] text-white active:scale-95 shadow-sky-600/20 cursor-pointer'
                      : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>
                    {isBCN
                      ? (language === 'vi' ? 'Khởi Tạo Tháng Mới (Mốc 60đ)' : 'Create Month (60 pts baseline)')
                      : (language === 'vi' ? 'Chỉ BCN Được Tạo Tháng' : 'BCN Only')}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Danh Sách Các Chu Kỳ Tháng & Quản Trị Khóa Sổ Điểm */}
          <div className="bg-white rounded-2xl p-6 space-y-4 border border-slate-200/90 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm sm:text-base font-extrabold text-[#061651]">
                  {language === 'vi'
                    ? `Quản Trị Chu Kỳ Tháng & Khóa Sổ Điểm (${monthPeriods.length} Chu Kỳ)`
                    : `Monthly Cycles & Ledger Finalization (${monthPeriods.length} Cycles)`}
                </h3>
              </div>
              <span className="text-[11px] text-[#64748B] font-medium">
                {language === 'vi'
                  ? 'Quyền Ban Chủ nhiệm: Khóa sổ điểm để đóng băng kết quả, bảo đảm sự công bằng'
                  : 'Executive Board: Lock ledger to freeze scores and guarantee integrity'}
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
                        : 'bg-white border-sky-200/80 shadow-xs'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-extrabold text-sm text-[#061651]">
                          {period.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200/90">
                          {period.shortLabel}
                        </span>

                        {/* Status Pill */}
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs">
                            <Lock className="w-3 h-3 text-slate-600" />
                            <span>{language === 'vi' ? 'Đã khóa sổ bởi BCN' : 'Locked by BCN'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>{language === 'vi' ? 'Đang mở chấm điểm' : 'Scoring Open'}</span>
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
                            {language === 'vi' ? 'Khóa bởi:' : 'Locked by:'} {period.lockedBy} {period.lockedAt ? `(${period.lockedAt})` : ''}
                          </span>
                        )}

                        {!isLocked && period.createdAt && (
                          <span className="text-slate-500 font-sans">
                            {language === 'vi' ? 'Tạo lúc:' : 'Created at:'} {period.createdAt}
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
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200/90 bg-white text-slate-700 hover:text-[#0284C7] hover:bg-sky-50/70 hover:border-sky-200 transition shadow-2xs cursor-pointer whitespace-nowrap"
                            title={language === 'vi' ? 'Chỉnh sửa tên, nhãn viết tắt, mô tả hoặc thời gian chu kỳ' : 'Edit cycle details'}
                          >
                            <Pencil className="w-3.5 h-3.5 text-slate-500" />
                            <span>{language === 'vi' ? 'Sửa' : 'Edit'}</span>
                          </button>

                          {/* Nút Khóa / Mở Khóa Sổ Điểm */}
                          {isLocked ? (
                            <button
                              type="button"
                              onClick={() => handleUnlockPeriod(period.id)}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer whitespace-nowrap"
                              title={language === 'vi' ? 'Mở khóa lại chu kỳ này' : 'Reopen this cycle'}
                            >
                              <Unlock className="w-3.5 h-3.5 text-slate-600" />
                              <span>{language === 'vi' ? 'Mở khóa lại' : 'Unlock'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleLockPeriod(period.id)}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white transition shadow-2xs active:scale-95 cursor-pointer whitespace-nowrap"
                              title={language === 'vi' ? 'Chốt điểm và khóa sổ chu kỳ' : 'Lock ledger'}
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>{language === 'vi' ? 'Khóa sổ điểm' : 'Lock Ledger'}</span>
                            </button>
                          )}

                          {/* Nút Xóa Chu Kỳ (Chỉ BCN) */}
                          <button
                            type="button"
                            onClick={() => setDeletingPeriod(period)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                            title={language === 'vi' ? `Xóa chu kỳ thi đua "${period.name}"` : `Delete cycle "${period.name}"`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          {language === 'vi' ? 'Chỉ BCN có quyền chỉnh sửa, khóa sổ hoặc xóa chu kỳ' : 'BCN permission required'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#061651]/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-lg w-full border border-slate-200/90 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#0284C7] border border-sky-200/80 flex items-center justify-center shadow-xs shrink-0">
                  <Pencil className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-50 text-[#0284C7] border border-sky-200/60">
                      {language === 'vi' ? 'Chỉ Ban Chủ Nhiệm' : 'Executive Board Only'}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {editingPeriod.id}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#061651] tracking-tight">
                    {language === 'vi' ? 'Chỉnh Sửa Chu Kỳ Thi Đua' : 'Edit Emulation Cycle'}
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
                  <label className="font-bold text-slate-700">{language === 'vi' ? 'Tên chu kỳ tháng' : 'Cycle Name'}</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-[#0284C7] outline-hidden"
                    placeholder="VD: Tháng 10/2026"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">{language === 'vi' ? 'Nhãn viết tắt' : 'Short Label'}</label>
                  <input
                    type="text"
                    value={editShortLabel}
                    onChange={(e) => setEditShortLabel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold font-mono text-slate-800 text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-[#0284C7] outline-hidden"
                    placeholder="VD: T10/2026"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">{language === 'vi' ? 'Khung thời gian thực' : 'Time Range'}</label>
                <input
                  type="text"
                  value={editTimeRange}
                  onChange={(e) => setEditTimeRange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs font-mono focus:ring-2 focus:ring-sky-500/20 focus:border-[#0284C7] outline-hidden"
                  placeholder="VD: 01/10/2026 - 31/10/2026"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">{language === 'vi' ? 'Mục tiêu & Kế hoạch thi đua' : 'Goals & Plan'}</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-[#0284C7] outline-hidden resize-none"
                  placeholder="Mô tả trọng tâm thi đua..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingPeriod(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingEdit
                    ? (language === 'vi' ? 'Đang lưu...' : 'Saving...')
                    : (language === 'vi' ? 'Lưu Thay Đổi' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA CHU KỲ (CHỈ BAN CHỦ NHIỆM) */}
      {deletingPeriod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#061651]/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-md w-full border border-slate-200/90 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/70 flex items-center justify-center shadow-xs shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#061651]">
                  {language === 'vi' ? 'Xác Nhận Xóa Chu Kỳ' : 'Confirm Cycle Deletion'}
                </h3>
                <p className="text-xs text-[#64748B] font-medium">
                  {language === 'vi' ? 'Hành động này chỉ dành cho Ban Chủ nhiệm' : 'Executive Board action only'}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1.5 text-slate-600">
              <div className="font-bold text-[#061651] flex items-center gap-2">
                <span>{deletingPeriod.name}</span>
                <span className="font-mono text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {deletingPeriod.shortLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {deletingPeriod.description}
              </p>
              <p className="text-[11px] text-rose-600 font-medium pt-1">
                {language === 'vi'
                  ? '⚠️ Chu kỳ này và mọi dữ liệu liên quan sẽ bị xóa khỏi hệ thống. Nếu đây là chu kỳ hiện tại, hệ thống sẽ tự động chuyển sang chu kỳ gần nhất.'
                  : '⚠️ This cycle will be permanently deleted from the system.'}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingPeriod(null)}
                disabled={isSubmittingDelete}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer text-xs"
              >
                {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmittingDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-xs cursor-pointer text-xs flex items-center gap-1.5"
              >
                {isSubmittingDelete
                  ? (language === 'vi' ? 'Đang xóa...' : 'Deleting...')
                  : (language === 'vi' ? 'Xác Nhận Xóa' : 'Confirm Delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL QUẢN LÝ DANH SÁCH ĐĂNG KÝ THEO DANH SÁCH CLB */}
      {managingAttendeesEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#061651]/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-2xl w-full border border-slate-200/90 shadow-2xl relative flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-sky-50 text-[#0284C7] border border-sky-200/80">
                    <Users className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-[#061651]">
                      {language === 'vi' ? 'Sửa Danh Sách Đăng Ký Theo CLB' : 'Edit Registration List by Club'}
                    </h3>
                    <p className="text-xs text-[#64748B] font-medium">
                      {language === 'vi' ? 'Sự kiện:' : 'Event:'} <strong className="text-slate-800">{managingAttendeesEvent.title}</strong>
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManagingAttendeesEvent(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stats & Quick Actions */}
            <div className="py-3 shrink-0 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-sky-50/60 rounded-2xl border border-sky-200/60 text-xs">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#0284C7]" />
                  <span className="text-slate-700">
                    {language === 'vi' ? 'Đã chọn:' : 'Selected:'} <strong className="text-[#0284C7] font-bold">{attendeeSelectedCodes.length}</strong> / {managingAttendeesEvent.maxAttendees || 50} {language === 'vi' ? 'thành viên' : 'members'}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500">
                    {language === 'vi' ? 'Tổng CLB:' : 'Club Total:'} <strong className="text-slate-700 font-bold">{members.length}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const currentFilteredCodes = filteredClubMembers.map((m) => m.member_code)
                      setAttendeeSelectedCodes((prev) => Array.from(new Set([...prev, ...currentFilteredCodes])))
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-[11px] hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                  >
                    + {language === 'vi' ? `Chọn tất cả (${filteredClubMembers.length})` : `Select All (${filteredClubMembers.length})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const currentFilteredCodes = new Set(filteredClubMembers.map((m) => m.member_code))
                      setAttendeeSelectedCodes((prev) => prev.filter((c) => !currentFilteredCodes.has(c)))
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold text-[11px] hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                  >
                    {language === 'vi' ? `Bỏ chọn (${filteredClubMembers.length})` : `Deselect (${filteredClubMembers.length})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const validCodes = new Set(members.map((m) => m.member_code))
                      setAttendeeSelectedCodes((prev) => prev.filter((c) => validCodes.has(c)))
                      setToast({
                        type: 'success',
                        message: language === 'vi' ? 'Đã đồng bộ và làm sạch theo danh sách thành viên hiện tại của CLB.' : 'Cleaned up and synchronized with active club directory.',
                      })
                      setTimeout(() => setToast(null), 3000)
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px] hover:bg-emerald-100 transition cursor-pointer shadow-2xs"
                    title={language === 'vi' ? 'Loại bỏ các mã thành viên cũ đã không còn trong danh sách CLB' : 'Clean up stale members'}
                  >
                    {language === 'vi' ? 'Làm sạch theo CLB' : 'Sync Active Members'}
                  </button>
                </div>
              </div>

              {/* Filter and Search */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={language === 'vi' ? 'Tìm theo tên hoặc mã thành viên...' : 'Search by name or code...'}
                    value={attendeeSearchQuery}
                    onChange={(e) => setAttendeeSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284C7] focus:bg-white transition"
                  />
                </div>
                <select
                  value={attendeeFilterDept}
                  onChange={(e) => setAttendeeFilterDept(e.target.value)}
                  className="w-full sm:w-auto bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0284C7] cursor-pointer"
                >
                  <option value="ALL">{language === 'vi' ? `Tất cả các Ban (${members.length})` : `All Departments (${members.length})`}</option>
                  <option value="Ban Chủ nhiệm">{language === 'vi' ? 'Ban Chủ nhiệm' : 'Executive Board'}</option>
                  <option value="Ban Truyền thông">{language === 'vi' ? 'Ban Truyền thông' : 'Communications Dept'}</option>
                  <option value="Ban Tư vấn">{language === 'vi' ? 'Ban Tư vấn' : 'Advisory Dept'}</option>
                  <option value="Ban Nhân sự">{language === 'vi' ? 'Ban Nhân sự' : 'HR Dept'}</option>
                </select>
              </div>
            </div>

            {/* Member Selection List */}
            <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[360px] divide-y divide-slate-100 border border-slate-200/80 rounded-2xl bg-white">
              {filteredClubMembers.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  {language === 'vi' ? 'Không tìm thấy thành viên CLB nào phù hợp với điều kiện tìm kiếm.' : 'No members found matching filter.'}
                </div>
              ) : (
                filteredClubMembers.map((m) => {
                  const isSelected = attendeeSelectedCodes.includes(m.member_code)
                  const hasCheckedIn = managingAttendeesEvent.records?.[m.member_code]

                  return (
                    <label
                      key={m.member_code}
                      className={`flex items-center justify-between p-3 cursor-pointer transition select-none ${
                        isSelected ? 'bg-sky-50/50 hover:bg-sky-50/80' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAttendeeSelectedCodes((prev) => [...prev, m.member_code])
                            } else {
                              setAttendeeSelectedCodes((prev) => prev.filter((c) => c !== m.member_code))
                            }
                          }}
                          className="w-4 h-4 rounded text-[#0284C7] focus:ring-[#0284C7] cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#061651]">{m.full_name}</span>
                            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              {m.member_code}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span>{m.department_name}</span>
                            <span>•</span>
                            <span>{m.position || (language === 'vi' ? 'Thành viên' : 'Member')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasCheckedIn && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {language === 'vi' ? 'Đã điểm danh' : 'Attended'}
                          </span>
                        )}
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                            isSelected
                              ? 'bg-sky-100 text-[#0284C7]'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {isSelected ? (language === 'vi' ? 'Đã chọn' : 'Selected') : (language === 'vi' ? 'Chưa chọn' : 'Unselected')}
                        </span>
                      </div>
                    </label>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-100 mt-3 shrink-0">
              <button
                type="button"
                onClick={() => setManagingAttendeesEvent(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer text-xs"
              >
                {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = updateEventAttendees(managingAttendeesEvent.id, attendeeSelectedCodes)
                  setToast({ type: 'success', message: res.message })
                  setTimeout(() => setToast(null), 4000)
                  setManagingAttendeesEvent(null)
                }}
                className="px-5 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold transition shadow-xs cursor-pointer text-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>
                  {language === 'vi'
                    ? `Lưu Danh Sách (${attendeeSelectedCodes.length} TV)`
                    : `Save List (${attendeeSelectedCodes.length} Pax)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA THÔNG TIN SỰ KIỆN (CHỈ BAN CHỦ NHIỆM) */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#061651]/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-2xl w-full border border-slate-200/90 shadow-2xl relative flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-sky-50 text-[#0284C7] border border-sky-200/80">
                  <Pencil className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-[#061651]">
                    {language === 'vi' ? 'Chỉnh Sửa Thông Tin Sự Kiện' : 'Edit Event Information'}
                  </h3>
                  <p className="text-xs text-[#64748B] font-medium">
                    {language === 'vi' ? 'Cập nhật thông tin và đồng bộ tới toàn bộ hệ thống' : 'Update event info and sync across system'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditEvent} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Tên sự kiện / Hoạt động *' : 'Event / Activity Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0284C7] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Loại sự kiện' : 'Event Category'}
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0284C7]"
                  >
                    <option value="meeting">{language === 'vi' ? 'Sinh hoạt định kỳ CLB' : 'Regular Club Meeting'}</option>
                    <option value="workshop">{language === 'vi' ? 'Workshop chuyên đề' : 'Thematic Workshop'}</option>
                    <option value="teambuilding">{language === 'vi' ? 'Teambuilding & Dã ngoại' : 'Teambuilding & Field Trip'}</option>
                    <option value="external">{language === 'vi' ? 'Sự kiện ĐHQG & Đối ngoại' : 'VNU & External Event'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Ngày diễn ra' : 'Date'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    placeholder="VD: 28/10/2026"
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0284C7] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Giờ bắt đầu' : 'Start Time'}
                  </label>
                  <input
                    type="text"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    placeholder="19:00"
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0284C7] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Giờ kết thúc' : 'End Time'}
                  </label>
                  <input
                    type="text"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    placeholder="21:30"
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0284C7] focus:bg-white"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Mã PIN Check-in' : 'Check-in PIN'}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={editPin}
                    onChange={(e) => setEditPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-mono font-black text-[#0284C7] tracking-widest text-center focus:outline-none focus:border-[#0284C7] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Địa điểm tổ chức' : 'Location'}
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0284C7] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Số lượng tối đa' : 'Max Attendees'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={editMaxAttendees}
                    onChange={(e) => setEditMaxAttendees(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0284C7] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Điểm cộng chuyên cần' : 'Point Bonus'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={editPointBonus}
                    onChange={(e) => setEditPointBonus(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0284C7] focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <input
                  type="checkbox"
                  id="editIsRequired"
                  checked={editIsRequired}
                  onChange={(e) => setEditIsRequired(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0284C7] focus:ring-[#0284C7] cursor-pointer"
                />
                <label htmlFor="editIsRequired" className="text-xs font-bold text-slate-700 cursor-pointer">
                  {language === 'vi'
                    ? 'Buổi sinh hoạt bắt buộc toàn CLB (Vắng không phép trừ điểm)'
                    : 'Mandatory meeting for all members (unexcused absence penalized)'}
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Mô tả / Thông báo sự kiện' : 'Description / Announcement'}
                </label>
                <textarea
                  rows={3}
                  value={editEventDescription}
                  onChange={(e) => setEditEventDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0284C7] focus:bg-white resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer text-xs"
                >
                  {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold transition shadow-xs cursor-pointer text-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{language === 'vi' ? 'Lưu Thông Tin Sự Kiện' : 'Save Event Info'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
