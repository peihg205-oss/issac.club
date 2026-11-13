'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  QrCode,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Users,
  Search,
  Filter,
  Download,
  Calendar,
  MapPin,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Check,
  RefreshCw,
  Copy,
  ExternalLink,
  Laptop,
  Smartphone,
  Ticket,
  Shield,
  X,
  Crown,
  ChevronDown,
  Plus,
  FileText,
} from 'lucide-react'
import { useClub, type CheckinStatus } from '@/lib/context/ClubContext'
import { useAuth } from '@/lib/auth/AuthContext'
import { useLanguage } from '@/lib/context/LanguageContext'
import type { DepartmentCode } from '@/types/database'
import { getMemberAvatarUrl } from '@/lib/clubData'
import { getEventPeriodId } from '@/lib/periodData'
import { AdminQrScannerModal } from '@/components/checkin/AdminQrScannerModal'

export function CheckinView() {
  const { language, t } = useLanguage()
  const {
    members,
    events,
    activeEvent,
    activeEventId,
    setActiveEventId,
    updateCheckinRecord,
    memberSelfCheckin,
    finalizeEvent,
    createUpcomingEvent,
    currentActiveMonth,
    currentActivePeriodId,
  } = useClub()

  const { isBCN, isHR, currentUser } = useAuth()

  // Helper dịch tên Ban & chức vụ
  const getDeptName = (slugOrName: string) => {
    if (language === 'vi') {
      if (slugOrName === 'bcn' || slugOrName === 'Ban Chủ nhiệm') return 'Ban Chủ nhiệm'
      if (slugOrName === 'truyen-thong' || slugOrName === 'Ban Truyền thông') return 'Ban Truyền thông'
      if (slugOrName === 'tu-van' || slugOrName === 'Ban Tư vấn') return 'Ban Tư vấn'
      if (slugOrName === 'nhan-su' || slugOrName === 'Ban Nhân sự') return 'Ban Nhân sự'
      return slugOrName
    } else {
      if (slugOrName === 'bcn' || slugOrName === 'Ban Chủ nhiệm') return 'Executive Board'
      if (slugOrName === 'truyen-thong' || slugOrName === 'Ban Truyền thông') return 'Communications'
      if (slugOrName === 'tu-van' || slugOrName === 'Ban Tư vấn') return 'Advisory'
      if (slugOrName === 'nhan-su' || slugOrName === 'Ban Nhân sự') return 'HR Dept'
      return slugOrName
    }
  }

  const getPositionName = (pos: string) => {
    if (language === 'vi') return pos
    if (pos === 'Chủ nhiệm') return 'President'
    if (pos === 'Phó chủ nhiệm') return 'Vice President'
    if (pos === 'Trưởng ban') return 'Head of Dept'
    if (pos === 'Phó ban') return 'Deputy Head'
    if (pos === 'Cố vấn') return 'Advisor'
    if (pos === 'Thành viên') return 'Member'
    return pos
  }

  // Modal tạo sự kiện mới trực tiếp tại màn hình Check-in
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState<'meeting' | 'workshop' | 'teambuilding' | 'external'>('meeting')
  const [newDate, setNewDate] = useState(() => {
    const today = new Date()
    return `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`
  })
  const [newStartTime, setNewStartTime] = useState('19:30')
  const [newEndTime, setNewEndTime] = useState('21:00')
  const [newLocation, setNewLocation] = useState('Phòng Hội thảo 202 - Nhà G4')
  const [newPin, setNewPin] = useState(() => String(Math.floor(1000 + Math.random() * 9000)))
  const [newIsRequired, setNewIsRequired] = useState(true)
  const [newAllowReg, setNewAllowReg] = useState(false)
  const [newPointBonus, setNewPointBonus] = useState(1)
  const [newDescription, setNewDescription] = useState('')

  // Tab con trong màn hình Điểm danh
  const [subTab, setSubTab] = useState<'admin_roster' | 'registered_attendees' | 'member_kiosk' | 'history'>(
    'admin_roster'
  )
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  // Bộ lọc danh sách điểm danh
  const [searchQuery, setSearchQuery] = useState('')
  const [deptFilter, setDeptFilter] = useState<'ALL' | DepartmentCode>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | CheckinStatus>('ALL')

  // Trạng thái thao tác chốt buổi họp
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [finalizeSuccessModal, setFinalizeSuccessModal] = useState<any | null>(null)

  // Form tự điểm danh Kiosk
  const [kioskMemberCode, setKioskMemberCode] = useState(members[3]?.member_code || '')
  const [kioskPhoneDigits, setKioskPhoneDigits] = useState('')
  const [kioskFeedback, setKioskFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [isSimulatingCamera, setIsSimulatingCamera] = useState(false)

  // Thông tin thành viên đang chọn trong Kiosk (xác thực nội bộ)
  const currentKioskMember = members.find((m) => m.member_code === kioskMemberCode) || members[0]
  const expectedPhoneDigits = currentKioskMember?.phone
    ? currentKioskMember.phone.replace(/\D/g, '').slice(-4)
    : ''

  const [copiedPin, setCopiedPin] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // Mascot điểm danh tương tác & các câu nhắc nhở sự kiện
  const [isMascotCheering, setIsMascotCheering] = useState<boolean>(false)
  const [mascotMessageIdx, setMascotMessageIdx] = useState<number>(0)
  const [showMascotBubble, setShowMascotBubble] = useState<boolean>(false)
  const bubbleTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const checkinMascotMessages = language === 'vi' ? [
    'Đăng kí sự kiện ngay',
    'Check - in đúng giờ',
    'Đừng đi muộn nhé iSARIS ơi',
  ] : [
    'Register for event now',
    'Check-in on time',
    "Don't be late iSARIS!",
  ]

  const handleMascotClick = () => {
    setIsMascotCheering(true)
    setShowMascotBubble(true)
    setMascotMessageIdx((prev) => (prev + 1) % checkinMascotMessages.length)
    setTimeout(() => setIsMascotCheering(false), 850)

    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current)
    bubbleTimeoutRef.current = setTimeout(() => {
      setShowMascotBubble(false)
    }, 2800)
  }

  const [viewingEventId, setViewingEventId] = useState<string | null>(null)
  const currentEvt =
    (viewingEventId ? events.find((e) => e.id === viewingEventId) : null) ||
    activeEvent ||
    null

  // Tính toán thống kê nhanh
  const records = currentEvt?.records || {}
  let countOnTime = 0
  let countLate = 0
  let countExcused = 0
  let countUnexcused = 0

  if (currentEvt) {
    members.forEach((m) => {
      const rec = records[m.member_code]?.status || 'unexcused'
      if (rec === 'present_on_time') countOnTime++
      else if (rec === 'late') countLate++
      else if (rec === 'excused') countExcused++
      else countUnexcused++
    })
  }

  // Lọc thành viên
  const filteredMembers = members.filter((m) => {
    const recStatus = records[m.member_code]?.status || 'unexcused'
    const matchesSearch =
      m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.member_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.student_id && m.student_id.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesDept = deptFilter === 'ALL' || m.department_code === deptFilter
    const matchesStatus = statusFilter === 'ALL' || recStatus === statusFilter

    return matchesSearch && matchesDept && matchesStatus
  })

  // Màu sắc nhãn Ban trực thuộc đồng bộ toàn dự án
  const getDeptBadgeStyle = (slug?: string) => {
    switch (slug) {
      case 'bcn':
        return 'bg-amber-50 text-amber-700 border border-amber-200/80'
      case 'truyen-thong':
        return 'bg-blue-50 text-blue-600 border border-blue-200/80'
      case 'tu-van':
        return 'bg-pink-50 text-pink-700 border border-pink-200/80'
      case 'nhan-su':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200/80'
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200'
    }
  }

  const handleCopyPin = () => {
    if (currentEvt) {
      navigator.clipboard.writeText(currentEvt.pinCode)
      setCopiedPin(true)
      setTimeout(() => setCopiedPin(false), 2000)
    }
  }

  const handleCopyCheckinLink = () => {
    if (currentEvt && typeof window !== 'undefined') {
      const url = `${window.location.origin}/checkin?event=${currentEvt.id}`
      navigator.clipboard.writeText(url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  // Khởi tạo sự kiện / phiên họp mới
  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) {
      alert('Vui lòng nhập tên sự kiện / buổi họp!')
      return
    }

    const res = createUpcomingEvent({
      title: newTitle.trim(),
      description: newDescription.trim() || `Phiên điểm danh ${newTitle.trim()}`,
      date: newDate.trim(),
      startTime: newStartTime.trim(),
      endTime: newEndTime.trim(),
      location: newLocation.trim(),
      pinCode: newPin.trim(),
      isRequired: newIsRequired,
      allowRegistration: newAllowReg,
      maxAttendees: 50,
      pointBonus: Number(newPointBonus) || (newIsRequired ? 1 : 2),
      category: newCategory,
    })

    if (res.success && res.event) {
      setActiveEventId(res.event.id)
      setViewingEventId(null)
      setIsCreateModalOpen(false)
      setNewTitle('')
      setNewDescription('')
      setNewPin(String(Math.floor(1000 + Math.random() * 9000)))
    } else {
      alert(res.message)
    }
  }

  // Chốt buổi họp (Quyền BCN)
  const handleFinalizeMeeting = () => {
    if (!currentEvt || !isBCN) return
    setIsFinalizing(true)

    const res = finalizeEvent(currentEvt.id, currentUser?.name || 'Ban Chủ nhiệm')
    setIsFinalizing(false)

    if (res.success && res.summary) {
      setFinalizeSuccessModal(res.summary)
    } else {
      alert(res.message)
    }
  }

  // Submit Kiosk (Xác thực 4 số cuối số điện thoại cá nhân)
  const handleKioskSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentEvt) {
      setKioskFeedback({ type: 'error', text: 'Hiện tại chưa có phiên điểm danh nào đang mở!' })
      return
    }
    const cleanDigits = kioskPhoneDigits.trim()
    if (!cleanDigits || cleanDigits.length !== 4) {
      setKioskFeedback({ type: 'error', text: 'Vui lòng nhập đúng 4 số cuối số điện thoại của người chuẩn bị điểm danh!' })
      return
    }

    const res = memberSelfCheckin(
      currentEvt.id,
      kioskMemberCode,
      currentEvt.pinCode,
      cleanDigits,
      'kiosk'
    )
    if (res.success) {
      setKioskFeedback({ type: 'success', text: res.message })
      setKioskPhoneDigits('')
    } else {
      setKioskFeedback({ type: 'error', text: res.message })
    }
  }

  // Xuất file CSV điểm danh
  const handleExportCSV = () => {
    if (!currentEvt) return

    const headers = ['STT', 'Mã TV', 'MSSV', 'Họ và tên', 'Ban', 'Chức vụ', 'Trạng thái', 'Giờ điểm danh', 'Ghi chú']
    const rows = members.map((m, idx) => {
      const rec = records[m.member_code]
      const statusText =
        rec?.status === 'present_on_time'
          ? 'Đúng giờ (+1 C07)'
          : rec?.status === 'late'
            ? 'Đi muộn >15p (-1 T04)'
            : rec?.status === 'excused'
              ? 'Có phép (-2 T01)'
              : 'Vắng không phép (-5 T02)'

      return [
        idx + 1,
        m.member_code,
        m.student_id || '-',
        m.full_name,
        m.department_name,
        m.position,
        statusText,
        rec?.checkinTime || '-',
        rec?.note || '',
      ]
    })

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `DiemDanh_CLB_${currentEvt.date.replace(/\//g, '-')}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Xuất file CSV điểm danh cho một sự kiện cụ thể trong lịch sử
  const handleExportEventCSV = (targetEvt: any) => {
    if (!targetEvt) return

    const evtRecs = targetEvt.records || {}
    const headers = ['STT', 'Mã TV', 'MSSV', 'Họ và tên', 'Ban', 'Chức vụ', 'Trạng thái', 'Giờ điểm danh', 'Ghi chú']
    const rows = members.map((m, idx) => {
      const rec = evtRecs[m.member_code]
      const statusText =
        rec?.status === 'present_on_time'
          ? 'Đúng giờ (+1 C07)'
          : rec?.status === 'late'
            ? 'Đi muộn >15p (-1 T04)'
            : rec?.status === 'excused'
              ? 'Có phép (-2 T01)'
              : 'Vắng không phép (-5 T02)'

      return [
        idx + 1,
        m.member_code,
        m.student_id || '-',
        m.full_name,
        m.department_name,
        m.position,
        statusText,
        rec?.checkinTime || '-',
        rec?.note || '',
      ]
    })

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `DiemDanh_CLB_${targetEvt.title.replace(/\s+/g, '_')}_${targetEvt.date.replace(/\//g, '-')}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* 1. Header trang chuẩn nhận diện dự án CLB */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3 sm:gap-3.5">
          <div>
            <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#061651] tracking-tight leading-tight">
              {t('checkin.title', 'Quản lý điểm danh sự kiện iSSAC')}
            </h1>
            <p className="text-xs sm:text-[13px] text-[#64748B] mt-1 font-normal">
              {t('checkin.subtitle', 'Hệ thống kiểm soát chuyên cần thời gian thực')}
            </p>
          </div>

          {/* Mascot tương tác kèm lời nhắc nhở điểm danh */}
          <div
            onClick={handleMascotClick}
            className="relative group cursor-pointer inline-flex items-center shrink-0 select-none"
            title={t('checkin.mascot_tooltip', 'Bấm vào tớ để xem lời nhắc nhé!')}
          >
            {/* Ảnh Mascot chibi năng động cùng linh thú điện */}
            <img
              src="/checkin-mascot.png"
              alt="iSSAC Check-in Mascot"
              className={`w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-[0_4px_12px_rgba(2,132,199,0.25)] transition-all duration-300 ${
                isMascotCheering
                  ? 'animate-mascot-pop drop-shadow-[0_8px_20px_rgba(2,132,199,0.45)]'
                  : 'animate-mascot-fly hover:scale-115 hover:rotate-3'
              }`}
            />

            {/* Bubble lời nhắc nhở động (ẩn trên mobile để không tràn viền) */}
            <div
              className={`absolute left-full ml-2.5 sm:ml-3 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#0369A1] text-white text-[11px] font-bold shadow-md whitespace-nowrap z-40 transition-all duration-200 hidden sm:flex items-center border border-white/25 pointer-events-none ${
                isMascotCheering || showMascotBubble
                  ? 'opacity-100 scale-105 translate-x-1 pointer-events-auto'
                  : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
              }`}
            >
              {/* Mũi tên chỉ về phía mascot */}
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#0284C7] rotate-45 border-l border-b border-white/25" />
              <span className="relative z-10 select-none tracking-tight">
                {checkinMascotMessages[mascotMessageIdx]}
              </span>
            </div>
          </div>
        </div>

        {/* Sub-tabs + Nút Máy Quét QR: 1 hàng ngang duy nhất, gọn gàng và không rớt dòng */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap self-start lg:self-center flex-shrink-0 max-w-full">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/70 overflow-x-auto no-scrollbar max-w-full flex-shrink-0">
            <button
              type="button"
              onClick={() => setSubTab('admin_roster')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${subTab === 'admin_roster'
                  ? 'bg-[#0084c8] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
            >
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t('checkin.tab_roster', 'Sĩ số')} ({members.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('registered_attendees')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${subTab === 'registered_attendees'
                  ? 'bg-[#0084c8] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
            >
              <Ticket className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t('checkin.tab_tickets', 'Vé')} ({currentEvt?.registeredMemberCodes?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('member_kiosk')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${subTab === 'member_kiosk'
                  ? 'bg-[#0084c8] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
            >
              <Smartphone className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t('checkin.tab_kiosk', 'Cổng Kiosk')}</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('history')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${subTab === 'history'
                  ? 'bg-[#0084c8] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
            >
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t('checkin.tab_history', 'Lịch sử')}</span>
            </button>
          </div>

          {/* Nút Kích hoạt Máy Quét QR Điểm Danh Admin */}
          <button
            type="button"
            onClick={() => {
              if (!currentEvt) {
                alert(language === 'vi' ? 'Vui lòng khởi tạo một phiên sự kiện trước khi mở máy quét QR!' : 'Please initialize an event session before opening the QR scanner!')
                return
              }
              setIsScannerOpen(true)
            }}
            className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm shadow-emerald-600/25 transition active:scale-95 cursor-pointer whitespace-nowrap flex-shrink-0"
          >
            <QrCode className="w-4 h-4 text-emerald-200" />
            <span>{t('checkin.btn_qr_scanner', 'MÁY QUÉT QR')}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
          </button>
        </div>
      </div>

      {/* Sub-tab 1: Bảng Sĩ số Trực tiếp (Admin & HR) */}
      {subTab === 'admin_roster' && (
        !currentEvt ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#F0F9FF] text-[#0284C7] border border-sky-100 flex items-center justify-center mx-auto shadow-2xs">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-lg font-black text-slate-900">
                {language === 'vi' ? `Chưa Có Phiên Điểm Danh Nào (${currentActiveMonth || 'Tháng 11/2026'})` : `No Active Meeting Session (${currentActiveMonth || 'November 2026'})`}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                {language === 'vi'
                  ? `Toàn bộ dữ liệu điểm danh ${currentActiveMonth || 'Tháng 11/2026'} sẵn sàng chạy thật. Ban Chủ nhiệm hoặc Ban Nhân sự hãy bấm nút bên dưới để tạo phiên điểm danh cho buổi sinh hoạt CLB.`
                  : `Check-in system for ${currentActiveMonth || 'November 2026'} is ready. Executive Board or HR can click below to create a new session.`}
              </p>
            </div>
            {(isBCN || isHR) ? (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'vi' ? 'Tạo sự kiện mới ngay' : 'Create New Event Now'}</span>
              </button>
            ) : (
              <p className="text-xs text-slate-400 italic">
                {language === 'vi' ? '(Phiên điểm danh sẽ hiển thị tại đây khi Ban Tổ chức khởi tạo)' : '(Session will appear here once initiated by organizers)'}
              </p>
            )}

            {events.length > 0 && (
              <div className="pt-5 border-t border-slate-100 max-w-lg mx-auto space-y-2.5">
                <span className="text-xs font-bold text-slate-500 block">
                  {language === 'vi' ? 'Hoặc xem lại phiên sinh hoạt đã chốt sổ kỳ trước:' : 'Or review closed sessions from previous period:'}
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {events.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setViewingEventId(e.id)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200/90 hover:border-[#0284C7] bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-[#0284C7] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Calendar className="w-3.5 h-3.5 text-[#0284C7]" />
                      <span>{e.title} ({e.date})</span>
                      {e.isFinalized && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Card Thông tin Phiên Điểm Danh Tích Hợp Selector Hiện Đại */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
              {/* Tầng 1: Thanh điều khiển phiên sự kiện (trái) và Thao tác tạo mới (phải) - Cân đối tuyệt đối */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                {/* Vế trái: Selector phiên sự kiện */}
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                    <span>{t('checkin.switch_session', 'Đổi phiên:')}</span>
                  </span>
                  <div className="relative min-w-0">
                    <select
                      suppressHydrationWarning
                      value={currentEvt.id}
                      onChange={(e) => {
                        const selectedId = e.target.value
                        const ev = events.find((item) => item.id === selectedId)
                        if (ev && getEventPeriodId(ev) === currentActivePeriodId) {
                          setActiveEventId(ev.id)
                          setViewingEventId(null)
                        } else {
                          setViewingEventId(selectedId)
                        }
                      }}
                      className="appearance-none bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/90 dark:border-slate-700 rounded-xl pl-3 pr-8 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/20 transition shadow-2xs cursor-pointer max-w-[260px] sm:max-w-md truncate"
                    >
                      {events.map((e) => (
                        <option key={e.id} value={e.id} suppressHydrationWarning>
                          {e.title} ({e.date}) {e.isFinalized ? (language === 'vi' ? '[Chốt sổ]' : '[Closed]') : (language === 'vi' ? '[Đang mở]' : '[Open]')}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {(viewingEventId || getEventPeriodId(currentEvt) !== currentActivePeriodId) && (
                    <button
                      type="button"
                      onClick={() => {
                        setViewingEventId(null)
                        setActiveEventId('')
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                      title={language === 'vi' ? 'Quay lại chu kỳ hiện tại' : 'Return to current period'}
                    >
                      <ArrowRight className="w-3 h-3 rotate-180" />
                      <span>{language === 'vi' ? `Về ${currentActiveMonth || 'T11'}` : 'Back'}</span>
                    </button>
                  )}
                </div>

                {/* Vế phải: Nút tạo sự kiện mới cho BCN / HR */}
                {(isBCN || isHR) && (
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 self-start sm:self-auto shrink-0"
                    title={t('checkin.create_event', 'Khởi tạo phiên điểm danh / sự kiện mới')}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('checkin.create_event', 'Tạo sự kiện mới')}</span>
                  </button>
                )}
              </div>

              {/* Tầng 2: Toàn bộ dải huy hiệu trạng thái của phiên đang chọn (rộng rãi 100%, không bị chèn ép hay rớt dòng đơn lẻ) */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 border ${currentEvt.isFinalized
                      ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                    }`}
                >
                  <span className={`w-2 h-2 rounded-full ${currentEvt.isFinalized ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'}`} />
                  <span>{currentEvt.isFinalized ? t('checkin.status_finalized', 'ĐÃ CHỐT SỔ ĐIỂM DANH') : t('checkin.status_live', 'PHIÊN ĐIỂM DANH ĐANG DIỄN RA')}</span>
                </span>
                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-[#F0F9FF] text-[#0284C7] border border-sky-200/90 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800">
                  {currentEvt.category === 'workshop'
                    ? t('checkin.cat_workshop', 'Workshop chuyên đề')
                    : currentEvt.category === 'teambuilding'
                      ? t('checkin.cat_teambuilding', 'Teambuilding')
                      : currentEvt.category === 'external'
                        ? t('checkin.cat_external', 'Sự kiện ĐHQG')
                        : t('checkin.cat_meeting', 'Sinh hoạt định kỳ CLB')}
                </span>
                {currentEvt.isRequired ? (
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                    {t('checkin.required_badge', 'Bắt buộc tham gia')}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                    {t('checkin.optional_badge', 'Mở đăng ký')} (+{currentEvt.pointBonus || 2}{language === 'vi' ? 'đ' : ' pts'})
                  </span>
                )}
                {currentEvt.allowRegistration && (
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 flex items-center gap-1">
                    <Ticket className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    <span>{t('checkin.registered_badge', 'Đã đăng ký trước')}: {currentEvt.registeredMemberCodes?.length || 0} / {currentEvt.maxAttendees || 50}</span>
                  </span>
                )}
                {getEventPeriodId(currentEvt) !== currentActivePeriodId && (
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-700 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-700 dark:text-amber-300" />
                    <span>{language === 'vi' ? 'Đang xem lại sự kiện kỳ trước' : 'Viewing previous period session'}</span>
                  </span>
                )}
              </div>

              {/* Hàng 2: Grid 12 cột cân đối hoàn hảo giữa Thông tin sự kiện và Trạm Chiếu PIN */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2 border-t border-slate-100">
                {/* Cột trái rộng rãi: Tiêu đề, mô tả và chip địa điểm/thời gian */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-2.5">
                  <h2 className="text-xl sm:text-2xl font-black text-[#061651] tracking-tight leading-snug">
                    {currentEvt.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-3xl">
                    {currentEvt.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 font-bold text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-[#0284C7] flex-shrink-0" />
                      <span>{currentEvt.date}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 font-bold text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-[#0284C7] flex-shrink-0" />
                      <span>{currentEvt.startTime} - {currentEvt.endTime}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 font-bold text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-[#0284C7] flex-shrink-0" />
                      <span>{currentEvt.location}</span>
                    </div>
                  </div>
                </div>

                {/* Cột phải: Trạm Chiếu PIN & QR Check-in Navy Phong Cách Chuyên Nghiệp */}
                <div className="lg:col-span-5 xl:col-span-4">
                  <div className="bg-gradient-to-br from-[#0284C7] via-[#0369A1] to-[#075985] text-white rounded-2xl p-4 sm:p-4.5 border border-sky-400/30 shadow-md flex items-center gap-4">
                    {/* QR Code Graphic */}
                    <div className="w-20 h-20 sm:w-22 sm:h-22 bg-[#024970] rounded-xl p-2 flex flex-col items-center justify-center relative overflow-hidden text-white flex-shrink-0 border border-white/20 shadow-inner">
                      <QrCode className="w-12 h-12 sm:w-14 sm:h-14 text-emerald-300" />
                      <span className="text-[9px] font-mono font-bold tracking-widest mt-0.5 text-sky-200">
                        SCAN ME
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                          {t('checkin.pin_title', 'Mã PIN máy chiếu')}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                          Kiosk Live
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-white/15 rounded-xl border border-white/20 tracking-[0.2em] font-mono font-black text-2xl sm:text-3xl text-white shadow-inner">
                          {currentEvt.pinCode}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyPin}
                          title={t('checkin.pin_copy_title', 'Sao chép mã PIN')}
                          className="p-2 hover:bg-white/20 rounded-xl text-sky-100 hover:text-white transition active:scale-95 cursor-pointer border border-white/15"
                        >
                          {copiedPin ? (
                            <Check className="w-4 h-4 text-emerald-300" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 pt-0.5 text-[11px] font-bold">
                        <a
                          href={`/checkin?event=${currentEvt.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-300 hover:text-amber-200 hover:underline flex items-center gap-1 truncate"
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          <span>{t('checkin.mobile_portal', 'Cổng Mobile')}</span>
                        </a>
                        <span className="text-white/40 text-xs">|</span>
                        <button
                          type="button"
                          onClick={handleCopyCheckinLink}
                          className="text-sky-100 hover:text-white flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <Copy className="w-3 h-3 flex-shrink-0" />
                          <span>{copiedLink ? t('checkin.copied', 'Đã copy!') : t('checkin.copy_zalo', 'Copy link Zalo')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* 4 Khối thống kê: Không viền mờ + Màu pastel chuẩn bộ nhận diện */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Đúng giờ (C07) */}
            <div
              onClick={() => setStatusFilter(statusFilter === 'present_on_time' ? 'ALL' : 'present_on_time')}
              className={`p-4 rounded-2xl bg-[#F0FDF4] flex items-center justify-between cursor-pointer transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)] ${statusFilter === 'present_on_time'
                  ? 'ring-2 ring-emerald-500 shadow-md scale-[1.01]'
                  : 'hover:shadow-md hover:-translate-y-0.5'
                }`}
            >
              <div>
                <span className="text-xs font-bold text-emerald-800 block">{t('checkin.card_on_time', 'Đúng giờ (C07)')}</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-700">{countOnTime}</span>
                  <span className="text-xs font-bold text-emerald-600">{t('checkin.card_on_time_pts', '+1 điểm / TV')}</span>
                </div>
                <p className="text-[11px] text-emerald-700/80 mt-1 font-medium">{t('checkin.card_on_time_desc', 'Đến trước hoặc đúng giờ')}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white text-emerald-600 shadow-2xs border border-emerald-300 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* Card 2: Đi muộn (T04) */}
            <div
              onClick={() => setStatusFilter(statusFilter === 'late' ? 'ALL' : 'late')}
              className={`p-4 rounded-2xl bg-[#FFFBEB] flex items-center justify-between cursor-pointer transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)] ${statusFilter === 'late'
                  ? 'ring-2 ring-amber-500 shadow-md scale-[1.01]'
                  : 'hover:shadow-md hover:-translate-y-0.5'
                }`}
            >
              <div>
                <span className="text-xs font-bold text-amber-800 block">{t('checkin.card_late', 'Đi muộn (T04)')}</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-amber-700">{countLate}</span>
                  <span className="text-xs font-bold text-amber-600">{t('checkin.card_late_pts', '-1 điểm / TV')}</span>
                </div>
                <p className="text-[11px] text-amber-700/80 mt-1 font-medium">{t('checkin.card_late_desc', 'Muộn trên 15 phút')}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white text-amber-600 shadow-2xs border border-amber-300 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* Card 3: Có phép (T01) */}
            <div
              onClick={() => setStatusFilter(statusFilter === 'excused' ? 'ALL' : 'excused')}
              className={`p-4 rounded-2xl bg-[#F0F9FF] flex items-center justify-between cursor-pointer transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)] ${statusFilter === 'excused'
                  ? 'ring-2 ring-[#0284C7] shadow-md scale-[1.01]'
                  : 'hover:shadow-md hover:-translate-y-0.5'
                }`}
            >
              <div>
                <span className="text-xs font-bold text-sky-800 block">{t('checkin.card_excused', 'Có phép (T01)')}</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-[#0284C7]">{countExcused}</span>
                  <span className="text-xs font-bold text-sky-600">{t('checkin.card_excused_pts', '-2 điểm / TV')}</span>
                </div>
                <p className="text-[11px] text-sky-700/80 mt-1 font-medium">{t('checkin.card_excused_desc', 'Gửi đơn trước >12h')}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white text-[#0284C7] shadow-2xs border border-sky-300 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            {/* Card 4: Không phép (T02) */}
            <div
              onClick={() => setStatusFilter(statusFilter === 'unexcused' ? 'ALL' : 'unexcused')}
              className={`p-4 rounded-2xl bg-[#FEF2F2] flex items-center justify-between cursor-pointer transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)] ${statusFilter === 'unexcused'
                  ? 'ring-2 ring-rose-500 shadow-md scale-[1.01]'
                  : 'hover:shadow-md hover:-translate-y-0.5'
                }`}
            >
              <div>
                <span className="text-xs font-bold text-rose-800 block">{t('checkin.card_unexcused', 'Không phép (T02)')}</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-rose-700">{countUnexcused}</span>
                  <span className="text-xs font-bold text-rose-600">{t('checkin.card_unexcused_pts', '-5 điểm / TV')}</span>
                </div>
                <p className="text-[11px] text-rose-600 font-semibold mt-1">{t('checkin.card_unexcused_desc', 'Báo động kỷ luật')}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white text-rose-600 shadow-2xs border border-rose-300 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Thanh công cụ tìm kiếm, bộ lọc & hành động BCN */}
          <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Ô tìm kiếm */}
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t('checkin.search_placeholder', 'Tìm thành viên, MSSV...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-2 bg-slate-50 hover:bg-slate-50/80 border border-slate-200/90 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/20 transition shadow-2xs"
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

              {/* Bộ lọc Ban */}
              <div className="relative">
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value as any)}
                  className="appearance-none pl-3.5 pr-8 py-2 bg-slate-50 hover:bg-white border border-slate-200/90 rounded-xl text-xs font-bold text-[#061651] focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/20 transition shadow-2xs cursor-pointer"
                >
                  <option value="ALL">{t('checkin.dept_all', 'Tất cả các ban')}</option>
                  <option value="B04">{getDeptName('bcn')}</option>
                  <option value="B01">{getDeptName('truyen-thong')}</option>
                  <option value="B02">{getDeptName('tu-van')}</option>
                  <option value="B03">{getDeptName('nhan-su')}</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Bộ lọc Trạng thái */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="appearance-none pl-3.5 pr-8 py-2 bg-slate-50 hover:bg-white border border-slate-200/90 rounded-xl text-xs font-bold text-[#061651] focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/20 transition shadow-2xs cursor-pointer"
                >
                  <option value="ALL">{t('checkin.status_all', 'Mọi trạng thái')}</option>
                  <option value="present_on_time">{language === 'vi' ? 'Đúng giờ (+1 C07)' : 'On Time (+1 C07)'}</option>
                  <option value="late">{language === 'vi' ? 'Đi muộn (-1 T04)' : 'Late (-1 T04)'}</option>
                  <option value="excused">{language === 'vi' ? 'Có phép (-2 T01)' : 'Excused (-2 T01)'}</option>
                  <option value="unexcused">{language === 'vi' ? 'Không phép (-5 T02)' : 'Unexcused (-5 T02)'}</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 font-bold text-xs transition shadow-2xs hover:shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title={language === 'vi' ? 'Xuất danh sách điểm danh buổi họp' : 'Export meeting attendance list'}
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('checkin.export_csv', 'Xuất CSV')}</span>
              </button>

              {/* Nút Chốt buổi họp chuẩn nhận diện BCN */}
              {isBCN ? (
                <button
                  type="button"
                  disabled={currentEvt.isFinalized || isFinalizing}
                  onClick={handleFinalizeMeeting}
                  className={`flex items-center justify-center px-4 py-2 text-xs font-bold rounded-xl text-white shadow-xs transition-all active:scale-95 cursor-pointer ${currentEvt.isFinalized
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-[#0284C7] hover:bg-[#0369A1] shadow-sm'
                    }`}
                >
                  <span>
                    {currentEvt.isFinalized
                      ? t('checkin.btn_finalized', 'Đã chốt sổ điểm')
                      : isFinalizing
                        ? t('checkin.btn_finalizing', 'Đang xử lý...')
                        : t('checkin.btn_finalize', 'Chốt buổi họp & Áp dụng điểm (Quyền BCN)')}
                  </span>
                </button>
              ) : (
                <div
                  title={language === 'vi' ? 'Chỉ Ban Chủ nhiệm có thẩm quyền chốt sổ điểm danh và cộng/trừ điểm chính thức' : 'Only the Executive Board has authority to finalize attendance and apply official points'}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/80"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{t('checkin.btn_finalize_bcn_only', 'Chốt buổi (Chỉ BCN)')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Card List for phones (< md): Dễ dàng bấm bằng 1 ngón tay cái */}
          <div className="block md:hidden space-y-3">
            {filteredMembers.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200/90 text-center text-slate-400 space-y-2">
                <Search className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-xs">{t('checkin.no_members', 'Không tìm thấy thành viên nào phù hợp')}</p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setDeptFilter('ALL')
                    setStatusFilter('ALL')
                  }}
                  className="text-xs text-[#0284C7] font-bold hover:underline"
                >
                  {t('checkin.reset_filter', 'Xóa bộ lọc')}
                </button>
              </div>
            ) : (
              filteredMembers.map((m, idx) => {
                const rec = records[m.member_code] || {
                  memberCode: m.member_code,
                  status: 'unexcused',
                }
                const status = rec.status

                return (
                  <div
                    key={m.member_code}
                    className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3"
                  >
                    {/* Top: Avatar, Tên, MSSV, Ban, Huy hiệu trạng thái */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {getMemberAvatarUrl(m) ? (
                          <img
                            src={getMemberAvatarUrl(m)!}
                            alt={m.full_name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#F0F9FF] text-[#0284C7] font-bold flex items-center justify-center text-sm shrink-0 border border-sky-200/80">
                            {m.full_name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-[#061651] text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
                            <span className="truncate">{m.full_name}</span>
                            {m.is_core && (
                              <span className="px-1.5 py-0.2 bg-amber-50 text-amber-700 text-[9px] font-bold rounded border border-amber-200/80">
                                CORE
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span>{m.student_id || m.member_code}</span>
                            <span>-</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getDeptBadgeStyle(m.department_slug)}`}>
                              {getDeptName(m.department_slug)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Trạng thái hiện tại */}
                      <div className="shrink-0">
                        {status === 'present_on_time' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                            <span>{language === 'vi' ? 'Đúng giờ (+1)' : 'On time (+1)'}</span>
                          </span>
                        )}
                        {status === 'late' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{language === 'vi' ? 'Muộn (-1)' : 'Late (-1)'}</span>
                          </span>
                        )}
                        {status === 'excused' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F0F9FF] text-[#0284C7] border border-sky-200/90 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-[#0284C7]" />
                            <span>{language === 'vi' ? 'Phép (-2)' : 'Excused (-2)'}</span>
                          </span>
                        )}
                        {status === 'unexcused' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>{language === 'vi' ? 'Vắng (-5)' : 'Absent (-5)'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 4 Nút điểm danh 1 chạm to rõ trải đều màn hình điện thoại */}
                    <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/70">
                      <button
                        type="button"
                        onClick={() => updateCheckinRecord(currentEvt.id, m.member_code, 'present_on_time')}
                        className={`py-2 text-[11px] font-bold rounded-lg transition-all text-center cursor-pointer ${
                          status === 'present_on_time'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-700 hover:bg-white hover:text-emerald-700'
                        }`}
                      >
                        {t('checkin.btn_ontime', 'Đúng giờ')}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCheckinRecord(currentEvt.id, m.member_code, 'late')}
                        className={`py-2 text-[11px] font-bold rounded-lg transition-all text-center cursor-pointer ${
                          status === 'late'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-slate-700 hover:bg-white hover:text-amber-700'
                        }`}
                      >
                        {t('checkin.btn_late', 'Muộn')}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCheckinRecord(currentEvt.id, m.member_code, 'excused')}
                        className={`py-2 text-[11px] font-bold rounded-lg transition-all text-center cursor-pointer ${
                          status === 'excused'
                            ? 'bg-[#0284C7] text-white shadow-xs'
                            : 'text-slate-700 hover:bg-white hover:text-[#0284C7]'
                        }`}
                      >
                        {t('checkin.btn_excused', 'Phép')}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCheckinRecord(currentEvt.id, m.member_code, 'unexcused')}
                        className={`py-2 text-[11px] font-bold rounded-lg transition-all text-center cursor-pointer ${
                          status === 'unexcused'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-700 hover:bg-white hover:text-rose-700'
                        }`}
                      >
                        {t('checkin.btn_unexcused', 'Vắng')}
                      </button>
                    </div>

                    {/* Dòng ghi chú & giờ điểm danh */}
                    <div className="flex items-center gap-2 pt-1 text-xs">
                      {rec.checkinTime && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/60 px-2 py-1 rounded-lg shrink-0 text-[10px]">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          <span>{rec.checkinTime}</span>
                        </span>
                      )}
                      <input
                        type="text"
                        placeholder={t('checkin.note_placeholder', 'Ghi chú (lý do muộn/vắng)...')}
                        defaultValue={rec.note || ''}
                        onBlur={(e) =>
                          updateCheckinRecord(currentEvt.id, m.member_code, status, e.target.value)
                        }
                        className="flex-1 text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-[#0284C7] shadow-2xs"
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Bảng Danh Sách Điểm Danh Desktop (Ẩn trên điện thoại, hiển thị từ màn hình md trở lên) */}
          <div className="hidden md:block bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-700 border-collapse">
                {/* Header màu xanh tươi #0284C7 đồng bộ ảnh 1 */}
                <thead className="bg-[#0284C7] text-xs font-bold text-white uppercase tracking-wider select-none shadow-xs">
                  <tr className="divide-x divide-white/15">
                    <th className="py-3 px-3 w-12 text-center font-bold text-sky-100 whitespace-nowrap">{t('checkin.th_stt', 'STT')}</th>
                    <th className="py-3 px-4 min-w-[260px] font-bold text-white whitespace-nowrap">{t('checkin.th_member', 'Thành viên')}</th>
                    <th className="py-3 px-3 min-w-[130px] font-bold text-sky-100 whitespace-nowrap">{t('checkin.th_dept', 'Ban')}</th>
                    <th className="py-3 px-3 min-w-[130px] text-center font-bold text-sky-100 whitespace-nowrap">{t('checkin.th_time', 'Giờ Check-in')}</th>
                    <th className="py-3 px-3 min-w-[170px] font-bold text-white whitespace-nowrap">{t('checkin.th_status', 'Trạng thái điểm danh')}</th>
                    <th className="py-3 px-3 min-w-[250px] text-center font-bold text-sky-100 whitespace-nowrap">{t('checkin.th_actions', 'Thao tác nhanh 1 chạm')}</th>
                    <th className="py-3 px-4 min-w-[180px] font-bold text-sky-100 whitespace-nowrap">{t('checkin.th_note', 'Ghi chú')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="space-y-2">
                          <Search className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="font-semibold text-xs sm:text-sm">{t('checkin.no_members', 'Không tìm thấy thành viên nào phù hợp với bộ lọc')}</p>
                          <button
                            onClick={() => {
                              setSearchQuery('')
                              setDeptFilter('ALL')
                              setStatusFilter('ALL')
                            }}
                            className="text-xs sm:text-sm text-[#0284C7] font-semibold hover:underline"
                          >
                            {t('checkin.reset_filter', 'Xóa bộ lọc tìm kiếm')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((m, idx) => {
                      const rec = records[m.member_code] || {
                        memberCode: m.member_code,
                        status: 'unexcused',
                      }
                      const status = rec.status

                      return (
                        <tr key={m.member_code} className="hover:bg-blue-50/40 transition-colors">
                          <td className="py-3 px-3 text-center font-bold text-slate-500 font-mono text-xs">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2.5 whitespace-nowrap">
                              {getMemberAvatarUrl(m) ? (
                                <img
                                  src={getMemberAvatarUrl(m)!}
                                  alt={m.full_name}
                                  className="w-9 h-9 rounded-full object-cover border border-slate-200 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-[#F0F9FF] text-[#0284C7] font-bold flex items-center justify-center text-xs flex-shrink-0 border border-sky-200/80">
                                  {m.full_name.charAt(0)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-bold text-[#061651] flex items-center gap-1.5 whitespace-nowrap">
                                  <span className="whitespace-nowrap">{m.full_name}</span>
                                  {m.is_core && (
                                    <span className="px-1.5 py-0.2 bg-amber-50 text-amber-700 text-[9px] font-bold rounded border border-amber-200/80 whitespace-nowrap">
                                      CORE
                                    </span>
                                  )}
                                  {currentEvt.allowRegistration && (
                                    currentEvt.registeredMemberCodes?.includes(m.member_code) ? (
                                      <span
                                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded border border-emerald-200/80 whitespace-nowrap"
                                        title={language === 'vi' ? 'Thành viên đã đăng ký tham gia sự kiện này' : 'Member has registered for this event'}
                                      >
                                        <Ticket className="w-2.5 h-2.5" />
                                        {t('checkin.badge_reg', 'Đã ĐK')}
                                      </span>
                                    ) : (
                                      <span
                                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 text-slate-400 text-[9px] rounded border border-slate-200/60 whitespace-nowrap"
                                        title={language === 'vi' ? 'Chưa đăng ký trước' : 'Not pre-registered'}
                                      >
                                        {t('checkin.badge_unreg', 'Chưa ĐK')}
                                      </span>
                                    )
                                  )}
                                </div>
                                <div className="font-normal text-slate-500 text-[11px] mt-0.5 whitespace-nowrap">
                                  {m.student_id ? `${m.student_id} - ` : ''}
                                  {m.class_name ? `${m.class_name} - ` : ''}
                                  {getPositionName(m.position)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap ${getDeptBadgeStyle(m.department_slug)}`}>
                              {getDeptName(m.department_slug)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center">
                              {rec.checkinTime ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-lg text-xs whitespace-nowrap">
                                  <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>{rec.checkinTime}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-xs whitespace-nowrap">{t('checkin.not_checked_in', 'Chưa điểm danh')}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            {status === 'present_on_time' && (
                              currentEvt.allowRegistration && !currentEvt.registeredMemberCodes?.includes(m.member_code) ? (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 inline-flex items-center gap-1 whitespace-nowrap" title={language === 'vi' ? 'Chưa đăng ký trước sự kiện nên không cộng điểm thi đua' : 'Not registered beforehand, no activity points added'}>
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  <span>{language === 'vi' ? 'Đúng giờ (0đ - Chưa ĐK)' : 'On Time (0pt - Not Reg)'}</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] inline-flex items-center gap-1 whitespace-nowrap">
                                  <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                                  <span>{language === 'vi' ? `Đúng giờ (+${currentEvt.pointBonus !== undefined ? currentEvt.pointBonus : 1} C07)` : `On Time (+${currentEvt.pointBonus !== undefined ? currentEvt.pointBonus : 1} C07)`}</span>
                                </span>
                              )
                            )}
                            {status === 'late' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 inline-flex items-center gap-1 whitespace-nowrap">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>{language === 'vi' ? 'Đi muộn (-1 T04)' : 'Late (-1 T04)'}</span>
                              </span>
                            )}
                            {status === 'excused' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 inline-flex items-center gap-1 whitespace-nowrap">
                                <AlertTriangle className="w-3 h-3 text-blue-600" />
                                <span>{language === 'vi' ? 'Có phép (-2 T01)' : 'Excused (-2 T01)'}</span>
                              </span>
                            )}
                            {status === 'unexcused' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 inline-flex items-center gap-1 whitespace-nowrap">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>{language === 'vi' ? 'Không phép (-5 T02)' : 'Unexcused (-5 T02)'}</span>
                              </span>
                            )}
                          </td>

                          {/* Quick 1-Touch Status Buttons Segmented Group */}
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/70 shadow-2xs">
                              <button
                                type="button"
                                onClick={() =>
                                  updateCheckinRecord(currentEvt.id, m.member_code, 'present_on_time')
                                }
                                title={language === 'vi' ? 'Ghi nhận đúng giờ (+1 C07)' : 'Mark on time (+1 C07)'}
                                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${status === 'present_on_time'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-emerald-700 hover:bg-white'
                                  }`}
                              >
                                {t('checkin.btn_ontime', 'Đúng giờ')}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateCheckinRecord(currentEvt.id, m.member_code, 'late')
                                }
                                title={language === 'vi' ? 'Ghi nhận đi muộn (-1 T04)' : 'Mark late (-1 T04)'}
                                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${status === 'late'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-amber-700 hover:bg-white'
                                  }`}
                              >
                                {t('checkin.btn_late', 'Muộn')}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateCheckinRecord(currentEvt.id, m.member_code, 'excused')
                                }
                                title={language === 'vi' ? 'Ghi nhận vắng có phép (-2 T01)' : 'Mark excused absence (-2 T01)'}
                                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${status === 'excused'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-blue-700 hover:bg-white'
                                  }`}
                              >
                                {t('checkin.btn_excused', 'Phép')}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateCheckinRecord(currentEvt.id, m.member_code, 'unexcused')
                                }
                                title={language === 'vi' ? 'Ghi nhận vắng không phép (-5 T02)' : 'Mark unexcused absence (-5 T02)'}
                                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${status === 'unexcused'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-rose-700 hover:bg-white'
                                  }`}
                              >
                                {t('checkin.btn_unexcused', 'Vắng')}
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <input
                              type="text"
                              placeholder={t('checkin.note_placeholder', 'Ghi chú lý do...')}
                              defaultValue={rec.note || ''}
                              onBlur={(e) =>
                                updateCheckinRecord(
                                  currentEvt.id,
                                  m.member_code,
                                  status,
                                  e.target.value
                                )
                              }
                              className="w-full text-xs font-medium px-2.5 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/20 rounded-lg focus:outline-none transition shadow-2xs"
                            />
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )
      )}

      {/* Sub-tab: Danh Sách Người Đăng Ký Trước & Đối Soát Mã Vé QR */}
      {subTab === 'registered_attendees' && (
        !currentEvt ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center shadow-xs space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center mx-auto">
              <Ticket className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {language === 'vi' ? 'Chưa có sự kiện nào' : 'No Events Available'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {language === 'vi' ? 'Vui lòng khởi tạo sự kiện có mở đăng ký để theo dõi danh sách vé và đối soát QR.' : 'Please create an event with open registration to track tickets and reconcile QR codes.'}
            </p>
          </div>
        ) : (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Card đối soát */}
          <div className="bg-[#0084c8] text-white rounded-3xl p-6 sm:p-7 border border-white/20 shadow-xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#FFCD38] text-[#061651] shadow-xs">
                    {language === 'vi' ? 'Bảo đảm công bằng & chống gian lận 100%' : '100% Fair & Anti-Fraud Guarantee'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-white/20 text-white border border-white/25">
                    {language === 'vi' ? 'Phiên: ' : 'Session: '}{currentEvt.title}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5 text-white">
                  <Ticket className="w-6 h-6 text-[#FFCD38]" />
                  {language === 'vi' ? 'Danh Sách Đăng Ký Trước & Bảng Đối Soát Vé QR' : 'Pre-Registration List & QR Ticket Reconciliation'}
                </h3>
                <p className="text-xs sm:text-[13px] text-white/95 max-w-2xl leading-relaxed font-normal text-justify">
                  {language === 'vi'
                    ? 'Khi thành viên đến hội trường, Admin/Ban Nhân sự tại bàn tiếp đón sử dụng Máy quét QR để quét mã trên màn hình điện thoại của thành viên. Hệ thống tự động so khớp danh sách đã giữ chỗ, ngăn chặn hoàn toàn việc điểm danh hộ.'
                    : 'When members arrive at the venue, Admin/HR desk officers scan the QR ticket on member phones. The system automatically reconciles against the reserved list, preventing proxy attendance.'}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="px-5 py-3 rounded-2xl bg-[#FFCD38] hover:bg-[#F8C327] text-[#061651] font-black text-xs sm:text-[13px] transition shadow-lg shadow-black/10 flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <QrCode className="w-5 h-5 text-[#061651]" />
                  <span>{language === 'vi' ? 'MỞ MÁY QUÉT QR BÀN TRỰC' : 'OPEN DESK QR SCANNER'}</span>
                </button>
              </div>
            </div>

            {/* Quick counters - Độ tương phản cao, rõ ràng và sắc nét */}
            <div className="pt-4 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white/15 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-white/25 shadow-sm">
                <span className="text-white/90 block text-xs font-medium mb-1">
                  {language === 'vi' ? 'Tổng số đã giữ chỗ:' : 'Total Reserved:'}
                </span>
                <span className="text-2xl sm:text-[26px] font-black text-white tracking-tight">
                  {currentEvt.registeredMemberCodes?.length || 0} / {currentEvt.maxAttendees || 50}
                </span>
              </div>

              <div className="bg-white/15 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-white/25 shadow-sm">
                <span className="text-white/90 block text-xs font-medium mb-1">
                  {language === 'vi' ? 'Đã quét vé có mặt:' : 'Scanned & Present:'}
                </span>
                <span className="text-2xl sm:text-[26px] font-black text-[#A7F3D0] tracking-tight">
                  {
                    (currentEvt.registeredMemberCodes || []).filter(
                      (c) => records[c]?.status === 'present_on_time' || records[c]?.status === 'late'
                    ).length
                  } {language === 'vi' ? 'TV' : 'members'}
                </span>
              </div>

              <div className="bg-white/15 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-white/25 shadow-sm">
                <span className="text-white/90 block text-xs font-medium mb-1">
                  {language === 'vi' ? 'Chưa đến hội trường:' : 'Not Arrived Yet:'}
                </span>
                <span className="text-2xl sm:text-[26px] font-black text-[#FEF08A] tracking-tight">
                  {
                    Math.max(
                      0,
                      (currentEvt.registeredMemberCodes?.length || 0) -
                      (currentEvt.registeredMemberCodes || []).filter(
                        (c) => records[c]?.status === 'present_on_time' || records[c]?.status === 'late'
                      ).length
                    )
                  } {language === 'vi' ? 'TV' : 'members'}
                </span>
              </div>

              <div className="bg-white/15 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-white/25 shadow-sm">
                <span className="text-white/90 block text-xs font-medium mb-1">
                  {language === 'vi' ? 'Tỷ lệ có mặt:' : 'Attendance Rate:'}
                </span>
                <span className="text-2xl sm:text-[26px] font-black text-white tracking-tight">
                  {currentEvt.registeredMemberCodes?.length
                    ? Math.round(
                      ((currentEvt.registeredMemberCodes || []).filter(
                        (c) => records[c]?.status === 'present_on_time' || records[c]?.status === 'late'
                      ).length /
                        currentEvt.registeredMemberCodes.length) *
                      100
                    )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Table of Registered Attendees */}
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm space-y-4 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h4 className="text-sm font-black text-slate-800">
                  {language === 'vi'
                    ? `Bảng Danh Sách Người Đăng Ký (${currentEvt.registeredMemberCodes?.length || 0} người)`
                    : `Registered Attendees List (${currentEvt.registeredMemberCodes?.length || 0} members)`}
                </h4>
                <p className="text-xs text-slate-500">
                  {language === 'vi'
                    ? 'Danh sách chính xác từng thành viên đã đăng ký trước khi sự kiện diễn ra'
                    : 'Verified list of members who registered prior to the session'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Quét QR nhanh' : 'Quick QR Scan'}</span>
                </button>
              </div>
            </div>

            {(!currentEvt.registeredMemberCodes || currentEvt.registeredMemberCodes.length === 0) ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <Ticket className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-bold text-sm text-slate-600">
                  {language === 'vi' ? 'Chưa có thành viên nào đăng ký sự kiện này.' : 'No members registered for this event yet.'}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {language === 'vi'
                    ? 'Thành viên có thể đăng ký giữ chỗ trước tại Cổng Thành Viên (/checkin?tab=register) để nhận mã vé QR cá nhân.'
                    : 'Members can reserve their spot via Member Portal to receive their personal QR ticket.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#0284C7] text-white text-xs font-bold uppercase tracking-wider select-none shadow-xs">
                    <tr>
                      <th className="py-3 px-3 w-12 text-center">{t('checkin.th_stt', 'STT')}</th>
                      <th className="py-3 px-4">{language === 'vi' ? 'Mã Vé Điện Tử' : 'E-Ticket Code'}</th>
                      <th className="py-3 px-4 min-w-[200px]">{t('checkin.th_member', 'Thành viên')}</th>
                      <th className="py-3 px-3">{language === 'vi' ? 'MSSV' : 'Student ID'}</th>
                      <th className="py-3 px-3">{t('checkin.th_dept', 'Ban')}</th>
                      <th className="py-3 px-3 text-center">{language === 'vi' ? 'Trạng thái vé' : 'Ticket Status'}</th>
                      <th className="py-3 px-3 text-right">{language === 'vi' ? 'Giờ quét QR' : 'Scan Time'}</th>
                      <th className="py-3 px-3 text-center">{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentEvt.registeredMemberCodes.map((code, idx) => {
                      const m = members.find((mem) => mem.member_code === code)
                      if (!m) return null
                      const rec = records[code]
                      const isChecked = rec?.status === 'present_on_time' || rec?.status === 'late'
                      const ticketToken = `TKT-${currentEvt.id.slice(-4).toUpperCase()}-${m.member_code}`

                      return (
                        <tr
                          key={code}
                          className={`hover:bg-blue-50/40 transition ${isChecked ? 'bg-emerald-50/30' : ''
                            }`}
                        >
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-500 text-xs">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-blue-700 text-xs">
                            <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200/80">
                              {ticketToken}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                            <span>{m.full_name}</span>
                            {m.is_core && (
                              <span className="px-1.5 py-0.2 rounded font-black text-[9px] bg-amber-100 text-amber-800 border border-amber-300">
                                CORE
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600 text-xs">
                            {m.student_id || m.member_code}
                          </td>
                          <td className="py-3 px-3 text-slate-600 text-xs">
                            {getDeptName(m.department_slug)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isChecked ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <Check className="w-3.5 h-3.5 text-emerald-700 font-black" />
                                {language === 'vi' ? 'ĐÃ CHECK-IN' : 'CHECKED IN'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                {language === 'vi' ? 'CHƯA ĐẾN' : 'NOT ARRIVED'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-xs font-bold">
                            {isChecked ? (
                              <span className="text-emerald-700">{rec.checkinTime || '19:25'}</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isChecked ? (
                              <span className="text-[11px] font-semibold text-emerald-700">
                                {language === 'vi' ? '✓ Hoàn tất' : '✓ Completed'}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const scanTime = new Date().toLocaleTimeString('vi-VN', {
                                    timeZone: 'Asia/Ho_Chi_Minh',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                  })
                                  updateCheckinRecord(
                                    currentEvt.id,
                                    code,
                                    'present_on_time',
                                    language === 'vi'
                                      ? `Quét vé QR xác thực tại bàn đón tiếp lúc ${scanTime}`
                                      : `Scanned QR ticket verified at desk at ${scanTime}`
                                  )
                                }}
                                className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-2xs cursor-pointer inline-flex items-center gap-1"
                              >
                                <QrCode className="w-3 h-3" />
                                <span>{language === 'vi' ? 'Quét vé' : 'Scan ticket'}</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        )
      )}

      {/* Sub-tab 2: Cổng Check-in Thành viên (Kiosk / Mobile Portal) */}
      {subTab === 'member_kiosk' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Cột Trái: Cổng Kiosk Điểm Danh Tự Phục Vụ */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col justify-between h-full space-y-5">
            <div>
              {/* Header đồng bộ chuẩn format dự án (ảnh 2) */}
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#F0F9FF] text-[#0084c8] border border-sky-300/80 shadow-2xs flex items-center justify-center shrink-0">
                    <Smartphone className="w-5.5 h-5.5 stroke-[2.2] text-[#0084c8]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-extrabold text-[#061651] tracking-tight">
                      {language === 'vi' ? 'Điểm Danh Sinh Hoạt CLB' : 'Club Meeting Check-in'}
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5 truncate">
                      {currentEvt ? currentEvt.title : (language === 'vi' ? `Chưa có phiên điểm danh (${currentActiveMonth || 'Tháng 11/2026'})` : 'No active session')}
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F0F9FF] text-[#0084c8] border border-sky-200/80 shrink-0">
                  {language === 'vi' ? 'Cổng Kiosk' : 'Kiosk Portal'}
                </span>
              </div>

              {/* Segmented Switcher Pill */}
              <div className="flex justify-center pt-4 mb-4">
                <div className="inline-flex items-center p-1 bg-[#F1F5F9] rounded-xl text-xs font-medium w-full max-w-xs border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setIsSimulatingCamera(false)}
                    className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      !isSimulatingCamera
                        ? 'bg-[#0084c8] text-white shadow-xs'
                        : 'text-slate-600 hover:text-[#061651] hover:bg-white/60'
                    }`}
                  >
                    {language === 'vi' ? 'Nhập mã PIN' : 'Enter PIN'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSimulatingCamera(true)}
                    className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      isSimulatingCamera
                        ? 'bg-[#0084c8] text-white shadow-xs'
                        : 'text-slate-600 hover:text-[#061651] hover:bg-white/60'
                    }`}
                  >
                    {language === 'vi' ? 'Camera quét QR' : 'QR Scanner'}
                  </button>
                </div>
              </div>

              {/* Nội dung Form Kiosk */}
              {isSimulatingCamera ? (
                <div className="aspect-square max-w-sm mx-auto bg-slate-950 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center p-6 border border-slate-800">
                  <div className="w-48 h-48 border border-emerald-400/80 rounded-xl relative flex items-center justify-center">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400"></div>

                    {/* Scanning laser line */}
                    <div className="w-full h-0.5 bg-emerald-400 absolute shadow-[0_0_15px_#10B981]"></div>
                    <QrCode className="w-24 h-24 text-slate-700 opacity-50" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentEvt) {
                        setKioskPhoneDigits(expectedPhoneDigits || currentEvt.pinCode)
                        setIsSimulatingCamera(false)
                      }
                    }}
                    className="mt-4 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow hover:bg-emerald-700 transition cursor-pointer active:scale-95"
                  >
                    {language === 'vi' ? 'Mô phỏng: Đã bắt được QR Code' : 'Simulate: QR Code Captured'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleKioskSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#061651] mb-1.5">
                      {language === 'vi' ? 'Chọn thành viên điểm danh:' : 'Select member to check-in:'}
                    </label>
                    <div className="relative">
                      <select
                        value={kioskMemberCode}
                        onChange={(e) => {
                          setKioskMemberCode(e.target.value)
                          setKioskPhoneDigits('')
                        }}
                        className="appearance-none w-full pl-3.5 pr-8 py-2.5 bg-slate-50 hover:bg-white border border-slate-200/90 rounded-xl text-xs font-bold text-[#061651] focus:outline-none focus:border-[#0084c8] focus:ring-1 focus:ring-[#0084c8]/20 transition shadow-2xs cursor-pointer"
                      >
                        {members.map((m) => (
                          <option key={m.member_code} value={m.member_code}>
                            {m.full_name} ({getDeptName(m.department_slug)} - {m.student_id || m.member_code})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#061651] mb-1.5">
                      {language === 'vi' ? '4 số cuối số điện thoại cá nhân (Xác thực):' : 'Last 4 digits of personal phone (Verification):'}
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="••••"
                      value={kioskPhoneDigits}
                      onChange={(e) => setKioskPhoneDigits(e.target.value.replace(/\D/g, ''))}
                      className="w-full p-3 text-center tracking-[0.35em] font-mono text-xl font-black text-[#061651] bg-slate-50 border border-slate-200/90 rounded-xl focus:border-[#0084c8] focus:bg-white focus:outline-none transition shadow-2xs placeholder:text-slate-300"
                    />
                    <p className="text-[11px] text-slate-500 text-center mt-1.5 font-normal">
                      {language === 'vi'
                        ? 'Nhập đúng 4 số cuối SĐT đã đăng ký trong hồ sơ CLB để xác nhận có mặt'
                        : 'Enter the last 4 digits of phone number registered in club records'}
                    </p>
                  </div>

                  {kioskFeedback && (
                    <div
                      className={`p-3 rounded-xl text-xs font-semibold ${
                        kioskFeedback.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {kioskFeedback.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!currentEvt || currentEvt.isFinalized}
                    className={`w-full py-3 text-white font-bold text-xs sm:text-[13px] rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-2 ${
                      !currentEvt || currentEvt.isFinalized
                        ? 'bg-slate-400 cursor-not-allowed opacity-80'
                        : 'bg-[#0084c8] hover:bg-[#0074b0] cursor-pointer hover:shadow'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {!currentEvt
                        ? (language === 'vi' ? 'Chưa mở phiên điểm danh' : 'No active session')
                        : currentEvt.isFinalized
                        ? (language === 'vi' ? 'Phiên điểm danh đã chốt sổ' : 'Session finalized')
                        : (language === 'vi' ? 'Xác nhận Điểm danh Ngay' : 'Confirm Check-in Now')}
                    </span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Cột Phải: Quy chế Điểm danh & Tính điểm CLB - Format Card KPI đồng bộ chuẩn ảnh 2 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col justify-between h-full space-y-5">
            <div>
              {/* Header đồng bộ format ảnh 2 */}
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#EBFBF2] text-[#059669] border border-emerald-300/80 shadow-2xs flex items-center justify-center shrink-0">
                    <Shield className="w-5.5 h-5.5 stroke-[2.2] text-[#059669]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base sm:text-lg font-extrabold text-[#061651] tracking-tight">
                      {language === 'vi' ? 'Quy chế Điểm danh & Tính điểm CLB' : 'Attendance & Scoring Rules'}
                    </h4>
                    <p className="text-xs text-[#64748B] mt-0.5 truncate">
                      {language === 'vi' ? 'Quy chế chấm điểm check - in cho thành viên iSSAC' : 'Check-in scoring regulations for iSSAC members'}
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F0FDF4] text-[#16A34A] border border-emerald-200/80 shrink-0">
                  {language === 'vi' ? 'Áp dụng Gen 3.0' : 'Gen 3.0 Applied'}
                </span>
              </div>

              {/* 4 Thẻ Quy Chế Điểm Danh Chuẩn Style Theo Yêu Cầu */}
              <div className="space-y-3 pt-3">
                {/* Thẻ C07: Đúng giờ */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F0FDF4] border border-emerald-100/70 flex items-start gap-3.5 sm:gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <span className="px-3 py-1.5 rounded-xl bg-[#00875A] text-white font-black text-xs sm:text-[13px] shrink-0 tracking-wide shadow-2xs">
                    C07
                  </span>
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-xs sm:text-[13.5px] text-[#064E3B] tracking-tight">
                      {language === 'vi' ? 'Đúng giờ: +1 điểm hoạt động' : 'On Time: +1 activity point'}
                    </h5>
                    <p className="text-xs text-[#047857] leading-relaxed font-normal">
                      {language === 'vi'
                        ? 'Có mặt tại phòng họp và check-in trong khung giờ quy định (trước hoặc trong vòng 15 phút đầu).'
                        : 'Present and check-in within designated window (before or within first 15 mins).'}
                    </p>
                  </div>
                </div>

                {/* Thẻ T04: Đi muộn */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FFFDF0] border border-amber-100/70 flex items-start gap-3.5 sm:gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <span className="px-3 py-1.5 rounded-xl bg-[#E67E00] text-white font-black text-xs sm:text-[13px] shrink-0 tracking-wide shadow-2xs">
                    T04
                  </span>
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-xs sm:text-[13.5px] text-[#78350F] tracking-tight">
                      {language === 'vi' ? 'Đi muộn >15 phút: -1 điểm' : 'Late >15 mins: -1 point'}
                    </h5>
                    <p className="text-xs text-[#B45309] leading-relaxed font-normal">
                      {language === 'vi'
                        ? 'Check-in sau 19:45 mà không có lý do bất khả kháng được duyệt trước.'
                        : 'Check-in after 19:45 without approved force majeure reason.'}
                    </p>
                  </div>
                </div>

                {/* Thẻ T01: Vắng có phép */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F0F7FF] border border-blue-100/70 flex items-start gap-3.5 sm:gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <span className="px-3 py-1.5 rounded-xl bg-[#1D68CD] text-white font-black text-xs sm:text-[13px] shrink-0 tracking-wide shadow-2xs">
                    T01
                  </span>
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-xs sm:text-[13.5px] text-[#1E3A8A] tracking-tight">
                      {language === 'vi' ? 'Vắng có phép hợp lệ: -2 điểm' : 'Excused Absence: -2 points'}
                    </h5>
                    <p className="text-xs text-[#2563EB] leading-relaxed font-normal">
                      {language === 'vi'
                        ? 'Gửi đơn xin phép trước tối thiểu 12 tiếng qua email CLB kèm minh chứng lịch thi hoặc lý do chính đáng.'
                        : 'Submit leave request >=12h prior via Club email with exam schedule or valid reason.'}
                    </p>
                  </div>
                </div>

                {/* Thẻ T02: Vắng không phép */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FFF1F2] border border-rose-100/70 flex items-start gap-3.5 sm:gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <span className="px-3 py-1.5 rounded-xl bg-[#E11D48] text-white font-black text-xs sm:text-[13px] shrink-0 tracking-wide shadow-2xs">
                    T02
                  </span>
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-xs sm:text-[13.5px] text-[#881337] tracking-tight">
                      {language === 'vi' ? 'Vắng không phép: -5 điểm & Báo động kỷ luật' : 'Unexcused Absence: -5 points & Disciplinary Alert'}
                    </h5>
                    <p className="text-xs text-[#BE123C] leading-relaxed font-normal">
                      {language === 'vi'
                        ? 'Tích luỹ 3 lần vắng không phép trong nhiệm kỳ sẽ kích hoạt quy trình xem xét khai trừ khỏi Câu Lạc bộ Đại sứ sinh viên Trường Quốc tế.'
                        : 'Accumulating 3 unexcused absences triggers expulsion review from VNU-IS Student Ambassadors Club.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Note dưới cùng đồng bộ format chuẩn */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs text-slate-600 mt-auto">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#0084c8] shrink-0" />
                <span>
                  {language === 'vi'
                    ? 'Điểm chuyên cần sinh hoạt được tính trực tiếp vào Bảng xếp hạng thi đua tháng.'
                    : 'Attendance scores are calculated directly into the monthly performance leaderboard.'}
                </span>
              </div>
              <span className="font-semibold text-[#0084c8] shrink-0">
                {language === 'vi' ? 'Quy chế CLB' : 'Club Rules'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 3: Lịch sử các buổi sinh hoạt */}
      {subTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-5">
            {/* Header của Khối Lịch sử */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] text-[#0084c8] flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#061651] tracking-tight">
                    {language === 'vi' ? 'Các kỳ sinh hoạt CLB trong nhiệm kỳ 2026 - 2027' : 'Club Meeting Sessions in Term 2026 - 2027'}
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {language === 'vi'
                      ? 'Hồ sơ chuyên cần, danh sách đối soát và biên bản chốt điểm chính thức'
                      : 'Attendance logs, reconciliation lists and official finalized point minutes'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  {language === 'vi' ? 'Tổng số: ' : 'Total: '}<strong className="text-[#061651]">{events.length}</strong> {language === 'vi' ? 'phiên sinh hoạt' : 'meeting sessions'}
                </span>
              </div>
            </div>

            {/* Danh sách các buổi sinh hoạt */}
            <div className="space-y-3.5">
              {events.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Calendar className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                  <p className="font-bold text-sm text-slate-600">
                    {language === 'vi' ? 'Chưa có buổi sinh hoạt nào được lưu trong lịch sử' : 'No meeting sessions saved in history'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {language === 'vi'
                      ? 'Các phiên điểm danh sau khi kết thúc sẽ được lưu trữ tự động tại đây'
                      : 'Attendance sessions will be automatically archived here upon conclusion'}
                  </p>
                </div>
              ) : (
                events.map((evt) => {
                  const evtRecords = evt.records || {}
                  let onTime = 0
                  let late = 0
                  let excused = 0
                  let unexcused = 0

                  members.forEach((m) => {
                    const st = evtRecords[m.member_code]?.status || 'unexcused'
                    if (st === 'present_on_time') onTime++
                    else if (st === 'late') late++
                    else if (st === 'excused') excused++
                    else unexcused++
                  })

                  const totalPresent = onTime + late
                  const attendanceRate = members.length
                    ? Math.round((totalPresent / members.length) * 100)
                    : 0

                  return (
                    <div
                      key={evt.id}
                      className="p-4 sm:p-5 rounded-xl border border-slate-200/90 bg-white hover:border-[#0084c8]/50 hover:shadow-xs transition-all duration-200 space-y-4"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-extrabold text-sm sm:text-base text-[#061651]">
                              {evt.title}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full flex items-center gap-1 border ${
                                evt.isFinalized
                                   ? 'bg-[#F0FDF4] text-[#16A34A] border-emerald-200/80'
                                  : 'bg-[#F0F9FF] text-[#0084c8] border-sky-200/80'
                              }`}
                            >
                              {evt.isFinalized ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
                                  <span>{t('checkin.btn_finalized', 'Đã chốt sổ điểm')}</span>
                                </>
                              ) : (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#0084c8] animate-pulse" />
                                  <span>{language === 'vi' ? 'Đang mở điểm danh' : 'Live Check-in'}</span>
                                </>
                              )}
                            </span>
                          </div>

                          {evt.description && (
                            <p className="text-xs text-slate-600 font-normal leading-relaxed">
                              {evt.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-medium pt-0.5">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{evt.date}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{evt.startTime} - {evt.endTime}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{evt.location}</span>
                            </div>
                          </div>
                        </div>

                        {/* Thống kê nhanh chuyên cần & Nút thao tác */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2 lg:pt-0 shrink-0">
                          {/* 4 Thẻ KPI mini chuyên cần */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="px-2.5 py-1.5 rounded-lg bg-[#F0FDF4] text-center">
                              <span className="block text-[10px] text-slate-500 font-medium">
                                {language === 'vi' ? 'Có mặt' : 'Present'}
                              </span>
                              <strong className="text-xs font-bold text-[#16A34A]">{totalPresent}/{members.length}</strong>
                            </div>
                            <div className="px-2.5 py-1.5 rounded-lg bg-[#F0F9FF] text-center">
                              <span className="block text-[10px] text-slate-500 font-medium">
                                {language === 'vi' ? 'Tỷ lệ' : 'Rate'}
                              </span>
                              <strong className="text-xs font-bold text-[#0084c8]">{attendanceRate}%</strong>
                            </div>
                            <div className="px-2.5 py-1.5 rounded-lg bg-[#FFFBEB] text-center">
                              <span className="block text-[10px] text-slate-500 font-medium">
                                {language === 'vi' ? 'Muộn' : 'Late'}
                              </span>
                              <strong className="text-xs font-bold text-[#D97706]">{late}</strong>
                            </div>
                            <div className="px-2.5 py-1.5 rounded-lg bg-[#FEF2F2] text-center">
                              <span className="block text-[10px] text-slate-500 font-medium">
                                {language === 'vi' ? 'Vắng' : 'Absent'}
                              </span>
                              <strong className="text-xs font-bold text-[#DC2626]">{unexcused}</strong>
                            </div>
                          </div>

                          {/* Nhóm nút thao tác */}
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveEventId(evt.id)
                                setSubTab('admin_roster')
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#0084c8] hover:bg-[#0074b0] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                              title={language === 'vi' ? 'Xem danh sách chi tiết điểm danh của buổi sinh hoạt này' : 'View detailed attendance roster for this session'}
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>{language === 'vi' ? 'Xem danh sách' : 'View Roster'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleExportEventCSV(evt)}
                              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-[#061651] text-xs font-bold transition shadow-2xs hover:shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                              title={language === 'vi' ? 'Tải file CSV kết quả điểm danh' : 'Download attendance CSV file'}
                            >
                              <Download className="w-3.5 h-3.5 text-slate-500" />
                              <span>{t('checkin.export_csv', 'Xuất CSV')}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Footer chốt sổ */}
                      {evt.finalizedBy && (
                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-normal">
                          <div className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                              {language === 'vi' ? 'Biên bản chốt điểm chính thức bởi: ' : 'Official point finalization by: '}
                              <strong className="text-[#061651] font-semibold">{evt.finalizedBy}</strong>
                              {language === 'vi' ? ' lúc ' : ' at '}{evt.finalizedAt}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {language === 'vi' ? 'Đã đồng bộ vào sổ điểm CLB' : 'Synced with Club Scorebook'}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Finalize Success Modal */}
      {finalizeSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-200 text-center space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-extrabold text-[#061651]">
              {language === 'vi' ? 'Chốt Sổ Điểm Danh Thành Công!' : 'Attendance Successfully Finalized!'}
            </h3>
            <p className="text-xs text-[#64748B]">
              {language === 'vi'
                ? 'Hệ thống đã tính toán và tự động cập nhật điểm chính thức cho toàn bộ thành viên Câu Lạc bộ Đại sứ sinh viên Trường Quốc tế.'
                : 'The system has calculated and updated official performance scores for all members of the VNU-IS Student Ambassadors Club.'}
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-2 gap-3 text-left border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  {t('checkin.card_on_time', 'Đúng giờ (C07)')}
                </span>
                <span className="text-lg font-black text-emerald-600">
                  {finalizeSuccessModal.present} {language === 'vi' ? 'TV' : 'members'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  {t('checkin.card_late', 'Đi muộn (T04)')}
                </span>
                <span className="text-lg font-black text-amber-600">
                  {finalizeSuccessModal.late} {language === 'vi' ? 'TV' : 'members'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  {t('checkin.card_excused', 'Có phép (T01)')}
                </span>
                <span className="text-lg font-black text-[#0284C7]">
                  {finalizeSuccessModal.excused} {language === 'vi' ? 'TV' : 'members'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  {t('checkin.card_unexcused', 'Không phép (T02)')}
                </span>
                <span className="text-lg font-black text-rose-600">
                  {finalizeSuccessModal.unexcused} {language === 'vi' ? 'TV' : 'members'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFinalizeSuccessModal(null)}
              className="w-full py-3 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold rounded-xl shadow transition active:scale-95 cursor-pointer"
            >
              {language === 'vi' ? 'Hoàn tất & Xem bảng điểm mới' : 'Done & View Leaderboard'}
            </button>
          </div>
        </div>
      )}

      {/* Modal Máy Quét QR Điểm Danh Admin (Live Scanner) */}
      {currentEvt && (
        <AdminQrScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          event={currentEvt}
          members={members}
          currentRecords={records}
          onVerifyCheckin={(memberCode, status, note) => {
            updateCheckinRecord(currentEvt.id, memberCode, status, note)
            return { success: true, message: 'Đã cập nhật trạng thái điểm danh!' }
          }}
        />
      )}

      {/* Modal Khởi Tạo Sự Kiện / Phiên Điểm Danh Mới */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0284C7] via-[#0369A1] to-[#075985] px-6 py-4 flex items-center justify-between text-white border-b border-sky-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/20 border border-white/20">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-snug">
                    {language === 'vi' ? 'Khởi tạo sự kiện / Phiên điểm danh mới' : 'Create Event / Attendance Session'}
                  </h3>
                  <p className="text-xs text-sky-100 font-medium">
                    {language === 'vi' ? 'Thiết lập buổi họp, workshop hoặc teambuilding cho CLB' : 'Set up meeting, workshop or teambuilding for the club'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateEventSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Tên sự kiện / Buổi họp ' : 'Event / Meeting Name '}<span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'vi' ? 'Vd: Họp Thường Niên Tháng 11 CLB iSSAC' : 'e.g. November Regular Meeting iSSAC'}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Danh mục' : 'Category'}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#0284C7]"
                  >
                    <option value="meeting">{language === 'vi' ? 'Buổi họp CLB / Ban' : 'Club / Dept Meeting'}</option>
                    <option value="workshop">{language === 'vi' ? 'Workshop đào tạo' : 'Training Workshop'}</option>
                    <option value="teambuilding">{language === 'vi' ? 'Teambuilding nội bộ' : 'Internal Teambuilding'}</option>
                    <option value="external">{language === 'vi' ? 'Sự kiện đối ngoại / Hợp tác' : 'External / Partnership Event'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Ngày diễn ra ' : 'Date '}<span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="DD/MM/YYYY"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Giờ bắt đầu' : 'Start Time'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="19:30"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'vi' ? 'Giờ kết thúc' : 'End Time'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="21:00"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Địa điểm tổ chức' : 'Location'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'vi' ? 'Vd: Phòng Hội thảo 202 - Nhà G4 hoặc Online' : 'e.g. Conference Room 202 - G4 or Online'}
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              {/* PIN Code Generator */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">
                    {language === 'vi' ? 'Mã PIN máy chiếu Check-in' : 'Projector Check-in PIN'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {language === 'vi' ? 'Mã 4 số hiển thị trên màn hình lớn để thành viên tự nhập' : '4-digit code displayed on big screen for member self-checkin'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-20 px-2 py-1.5 font-mono text-center font-black text-sm bg-white border border-slate-300 rounded-lg text-[#0284C7]"
                  />
                  <button
                    type="button"
                    onClick={() => setNewPin(String(Math.floor(1000 + Math.random() * 9000)))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 cursor-pointer"
                    title={language === 'vi' ? 'Đổi mã PIN ngẫu nhiên khác' : 'Generate new random PIN'}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={newIsRequired}
                    onChange={(e) => setNewIsRequired(e.target.checked)}
                    className="w-4 h-4 text-[#0284C7] rounded focus:ring-0 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">
                      {language === 'vi' ? 'Bắt buộc tham dự' : 'Mandatory Attendance'}
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      {language === 'vi' ? 'Vắng không phép trừ điểm T02' : 'Unexcused absence deducts T02 points'}
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={newAllowReg}
                    onChange={(e) => setNewAllowReg(e.target.checked)}
                    className="w-4 h-4 text-[#0284C7] rounded focus:ring-0 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">
                      {language === 'vi' ? 'Mở cổng đăng ký trước' : 'Open Pre-Registration'}
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      {language === 'vi' ? 'Cấp vé điện tử QR cá nhân' : 'Issues personal digital QR ticket'}
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'vi' ? 'Điểm cộng khi tham dự đúng giờ (+điểm)' : 'Points for on-time attendance (+pts)'}
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setNewPointBonus(pts)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        newPointBonus === pts
                          ? 'bg-[#0284C7] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      +{pts} {language === 'vi' ? 'điểm' : 'pts'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold shadow transition active:scale-95 cursor-pointer"
                >
                  {language === 'vi' ? 'Khởi tạo & Kích hoạt phiên ngay' : 'Create & Activate Session Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
