'use client'

import React, { useState } from 'react'
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
} from 'lucide-react'
import { useClub, type CheckinStatus } from '@/lib/context/ClubContext'
import { useAuth } from '@/lib/auth/AuthContext'
import type { DepartmentCode } from '@/types/database'
import { AdminQrScannerModal } from '@/components/checkin/AdminQrScannerModal'

export function CheckinView() {
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
  } = useClub()

  const { isBCN, isHR, currentUser } = useAuth()

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
  const [kioskPin, setKioskPin] = useState('')
  const [kioskFeedback, setKioskFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [isSimulatingCamera, setIsSimulatingCamera] = useState(false)

  const [copiedPin, setCopiedPin] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const currentEvt = activeEvent || events[0] || null

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
        return 'bg-blue-50 text-[#1351D8] border border-blue-200/80'
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
      const url = `${window.location.origin}/checkin?event=${currentEvt.id}&pin=${currentEvt.pinCode}`
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

    const res = finalizeEvent(currentEvt.id, currentUser.name)
    setIsFinalizing(false)

    if (res.success && res.summary) {
      setFinalizeSuccessModal(res.summary)
    } else {
      alert(res.message)
    }
  }

  // Submit Kiosk
  const handleKioskSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentEvt) {
      setKioskFeedback({ type: 'error', text: 'Hiện tại chưa có phiên điểm danh nào đang mở!' })
      return
    }
    if (!kioskPin.trim()) {
      setKioskFeedback({ type: 'error', text: 'Vui lòng nhập mã PIN máy chiếu!' })
      return
    }

    const res = memberSelfCheckin(currentEvt.id, kioskMemberCode, kioskPin)
    if (res.success) {
      setKioskFeedback({ type: 'success', text: res.message })
      setKioskPin('')
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

  return (
    <div className="space-y-6">
      {/* 1. Header trang chuẩn nhận diện dự án CLB */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
            Quản Lý Điểm Danh & Kiểm Soát Chuyên Cần
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium">
            Hệ thống kiểm soát chuyên cần thời gian thực
          </p>
        </div>

        {/* Sub-tabs + Nút Máy Quét QR: 1 hàng ngang duy nhất, gọn gàng và không rớt dòng */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap self-start lg:self-center flex-shrink-0">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/70 overflow-x-auto flex-shrink-0">
            <button
              type="button"
              onClick={() => setSubTab('admin_roster')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${subTab === 'admin_roster'
                  ? 'bg-[#1351D8] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
            >
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Sĩ số ({members.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('registered_attendees')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${subTab === 'registered_attendees'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
            >
              <Ticket className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Vé ({currentEvt?.registeredMemberCodes?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('member_kiosk')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${subTab === 'member_kiosk'
                  ? 'bg-[#0B1E48] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
            >
              <Smartphone className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Cổng Kiosk</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('history')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${subTab === 'history'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
            >
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Lịch sử</span>
            </button>
          </div>

          {/* Nút Kích hoạt Máy Quét QR Điểm Danh Admin */}
          <button
            type="button"
            onClick={() => {
              if (!currentEvt) {
                alert('Vui lòng khởi tạo một phiên sự kiện trước khi mở máy quét QR!')
                return
              }
              setIsScannerOpen(true)
            }}
            className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm shadow-emerald-600/25 transition active:scale-95 cursor-pointer whitespace-nowrap flex-shrink-0"
          >
            <QrCode className="w-4 h-4 text-emerald-200" />
            <span>MÁY QUÉT QR</span>
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
          </button>
        </div>
      </div>

      {/* Sub-tab 1: Bảng Sĩ số Trực tiếp (Admin & HR) */}
      {subTab === 'admin_roster' && (
        !currentEvt ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1351D8] border border-blue-100 flex items-center justify-center mx-auto shadow-2xs">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-lg font-black text-slate-900">
                Chưa Có Phiên Điểm Danh Nào
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                Toàn bộ dữ liệu điểm danh đã được làm sạch và sẵn sàng chạy thật. Ban Chủ nhiệm hoặc Ban Nhân sự hãy bấm nút bên dưới để tạo phiên điểm danh cho buổi sinh hoạt CLB.
              </p>
            </div>
            {(isBCN || isHR) ? (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0F3282] via-[#1351D8] to-[#1E62F4] hover:from-[#0B2562] hover:to-[#1351D8] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo sự kiện mới ngay</span>
              </button>
            ) : (
              <p className="text-xs text-slate-400 italic">
                (Phiên điểm danh sẽ hiển thị tại đây khi Ban Tổ chức khởi tạo)
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Card Thông tin Phiên Điểm Danh Tích Hợp Selector Hiện Đại */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
              {/* Hàng 1: Trạng thái phiên bên trái + Dropdown chuyển phiên gọn gàng bên phải */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 border ${currentEvt.isFinalized
                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200/90'
                      }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${currentEvt.isFinalized ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'}`} />
                    <span>{currentEvt.isFinalized ? 'ĐÃ CHỐT SỔ ĐIỂM DANH' : 'PHIÊN ĐIỂM DANH ĐANG DIỄN RA'}</span>
                  </span>
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-[#1351D8] border border-blue-200/80">
                    {currentEvt.category === 'workshop'
                      ? 'Workshop chuyên đề'
                      : currentEvt.category === 'teambuilding'
                        ? 'Teambuilding'
                        : currentEvt.category === 'external'
                          ? 'Sự kiện ĐHQG'
                          : 'Sinh hoạt định kỳ CLB'}
                  </span>
                  {currentEvt.isRequired ? (
                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
                      Bắt buộc tham gia
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      Mở đăng ký (+{currentEvt.pointBonus || 2}đ)
                    </span>
                  )}
                  {currentEvt.allowRegistration && (
                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center gap-1">
                      <Ticket className="w-3 h-3 text-purple-600" />
                      <span>Đã đăng ký trước: {currentEvt.registeredMemberCodes?.length || 0} / {currentEvt.maxAttendees || 50}</span>
                    </span>
                  )}
                </div>

                {/* Dropdown chuyển phiên tích hợp tinh tế & nút tạo sự kiện mới */}
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap hidden md:inline">
                    Đổi phiên:
                  </span>
                  <div className="relative">
                    <select
                      suppressHydrationWarning
                      value={currentEvt.id}
                      onChange={(e) => setActiveEventId(e.target.value)}
                      className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl pl-3 pr-8 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1351D8] focus:ring-1 focus:ring-[#1351D8]/20 transition shadow-2xs cursor-pointer max-w-[240px] sm:max-w-xs truncate"
                    >
                      {events.map((e) => (
                        <option key={e.id} value={e.id} suppressHydrationWarning>
                          {e.title} ({e.date}) {e.isFinalized ? '• [Chốt sổ]' : '• [Đang mở]'}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {(isBCN || isHR) && (
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0F3282] via-[#1351D8] to-[#1E62F4] hover:from-[#0B2562] hover:to-[#1351D8] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
                      title="Khởi tạo phiên điểm danh / sự kiện mới"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tạo sự kiện mới</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Hàng 2: Grid 12 cột cân đối hoàn hảo giữa Thông tin sự kiện và Trạm Chiếu PIN */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2 border-t border-slate-100">
                {/* Cột trái rộng rãi: Tiêu đề, mô tả và chip địa điểm/thời gian */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-2.5">
                  <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight leading-snug">
                    {currentEvt.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-3xl">
                    {currentEvt.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 font-bold text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-[#1351D8] flex-shrink-0" />
                      <span>{currentEvt.date}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 font-bold text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-[#1351D8] flex-shrink-0" />
                      <span>{currentEvt.startTime} - {currentEvt.endTime}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 font-bold text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-[#1351D8] flex-shrink-0" />
                      <span>{currentEvt.location}</span>
                    </div>
                  </div>
                </div>

                {/* Cột phải: Trạm Chiếu PIN & QR Check-in Navy Phong Cách Chuyên Nghiệp */}
                <div className="lg:col-span-5 xl:col-span-4">
                  <div className="bg-gradient-to-br from-[#0B1E48] via-[#0F2A66] to-[#122A5E] text-white rounded-2xl p-4 sm:p-4.5 border border-blue-900/60 shadow-md flex items-center gap-4">
                    {/* QR Code Graphic */}
                    <div className="w-20 h-20 sm:w-22 sm:h-22 bg-[#071533] rounded-xl p-2 flex flex-col items-center justify-center relative overflow-hidden text-white flex-shrink-0 border border-white/10 shadow-inner">
                      <QrCode className="w-12 h-12 sm:w-14 sm:h-14 text-emerald-400" />
                      <span className="text-[9px] font-mono font-bold tracking-widest mt-0.5 text-blue-200">
                        SCAN ME
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                          Mã PIN máy chiếu
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Kiosk Live
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-white/10 rounded-xl border border-white/15 tracking-[0.2em] font-mono font-black text-2xl sm:text-3xl text-white shadow-inner">
                          {currentEvt.pinCode}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyPin}
                          title="Sao chép mã PIN"
                          className="p-2 hover:bg-white/15 rounded-xl text-slate-200 hover:text-white transition active:scale-95 cursor-pointer border border-white/10"
                        >
                          {copiedPin ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 pt-0.5 text-[11px] font-bold">
                        <a
                          href={`/checkin?event=${currentEvt.id}&pin=${currentEvt.pinCode}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-300 hover:text-amber-200 hover:underline flex items-center gap-1 truncate"
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          <span>Cổng Mobile</span>
                        </a>
                        <span className="text-white/30 text-xs">|</span>
                        <button
                          type="button"
                          onClick={handleCopyCheckinLink}
                          className="text-blue-200 hover:text-white flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <Copy className="w-3 h-3 flex-shrink-0" />
                          <span>{copiedLink ? 'Đã copy!' : 'Copy link Zalo'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* 4 Khối thống kê: Viền mỏng 1px + Màu pastel chuẩn bộ nhận diện */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Đúng giờ (C07) */}
            <div
              onClick={() => setStatusFilter(statusFilter === 'present_on_time' ? 'ALL' : 'present_on_time')}
              className={`p-4 rounded-2xl border border-emerald-200/90 bg-[#F0FDF4] flex items-center justify-between cursor-pointer transition-all shadow-2xs ${statusFilter === 'present_on_time'
                  ? 'ring-2 ring-emerald-500 shadow-md scale-[1.01]'
                  : 'hover:shadow-md hover:-translate-y-0.5'
                }`}
            >
              <div>
                <span className="text-xs font-bold text-emerald-800 block">Đúng giờ (C07)</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-700">{countOnTime}</span>
                  <span className="text-xs font-bold text-emerald-600">+1 điểm / TV</span>
                </div>
                <p className="text-[11px] text-emerald-700/80 mt-1 font-medium">Đến trước hoặc đúng giờ</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 shadow-2xs border border-emerald-200/60 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* Card 2: Đi muộn (T04) */}
            <div
              onClick={() => setStatusFilter(statusFilter === 'late' ? 'ALL' : 'late')}
              className={`p-4 rounded-2xl border border-amber-200/90 bg-[#FFFBEB] flex items-center justify-between cursor-pointer transition-all shadow-2xs ${statusFilter === 'late'
                  ? 'ring-2 ring-amber-500 shadow-md scale-[1.01]'
                  : 'hover:shadow-md hover:-translate-y-0.5'
                }`}
            >
              <div>
                <span className="text-xs font-bold text-amber-800 block">Đi muộn (T04)</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-amber-700">{countLate}</span>
                  <span className="text-xs font-bold text-amber-600">-1 điểm / TV</span>
                </div>
                <p className="text-[11px] text-amber-700/80 mt-1 font-medium">Muộn trên 15 phút</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white text-amber-600 shadow-2xs border border-amber-200/60 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* Card 3: Có phép (T01) */}
            <div
              onClick={() => setStatusFilter(statusFilter === 'excused' ? 'ALL' : 'excused')}
              className={`p-4 rounded-2xl border border-blue-200/90 bg-[#EFF6FF] flex items-center justify-between cursor-pointer transition-all shadow-2xs ${statusFilter === 'excused'
                  ? 'ring-2 ring-blue-500 shadow-md scale-[1.01]'
                  : 'hover:shadow-md hover:-translate-y-0.5'
                }`}
            >
              <div>
                <span className="text-xs font-bold text-blue-800 block">Có phép (T01)</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-[#1351D8]">{countExcused}</span>
                  <span className="text-xs font-bold text-blue-600">-2 điểm / TV</span>
                </div>
                <p className="text-[11px] text-blue-700/80 mt-1 font-medium">Gửi đơn trước &gt;12h</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white text-[#1351D8] shadow-2xs border border-blue-200/60 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            {/* Card 4: Không phép (T02) */}
            <div
              onClick={() => setStatusFilter(statusFilter === 'unexcused' ? 'ALL' : 'unexcused')}
              className={`p-4 rounded-2xl border border-rose-200/90 bg-[#FEF2F2] flex items-center justify-between cursor-pointer transition-all shadow-2xs ${statusFilter === 'unexcused'
                  ? 'ring-2 ring-rose-500 shadow-md scale-[1.01]'
                  : 'hover:shadow-md hover:-translate-y-0.5'
                }`}
            >
              <div>
                <span className="text-xs font-bold text-rose-800 block">Không phép (T02)</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-rose-700">{countUnexcused}</span>
                  <span className="text-xs font-bold text-rose-600">-5 điểm / TV</span>
                </div>
                <p className="text-[11px] text-rose-600 font-semibold mt-1">Báo động kỷ luật</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white text-rose-600 shadow-2xs border border-rose-200/60 flex items-center justify-center flex-shrink-0">
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
                  placeholder="Tìm thành viên, MSSV..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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

              {/* Bộ lọc Ban */}
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 hover:bg-white border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#1351D8] focus:ring-1 focus:ring-[#1351D8]/20 transition shadow-2xs"
              >
                <option value="ALL">Tất cả các ban</option>
                <option value="B04">Ban Chủ nhiệm</option>
                <option value="B01">Ban Truyền thông</option>
                <option value="B02">Ban Tư vấn</option>
                <option value="B03">Ban Nhân sự</option>
              </select>

              {/* Bộ lọc Trạng thái */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 hover:bg-white border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#1351D8] focus:ring-1 focus:ring-[#1351D8]/20 transition shadow-2xs"
              >
                <option value="ALL">Mọi trạng thái</option>
                <option value="present_on_time">Đúng giờ (+1 C07)</option>
                <option value="late">Đi muộn (-1 T04)</option>
                <option value="excused">Có phép (-2 T01)</option>
                <option value="unexcused">Không phép (-5 T02)</option>
              </select>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 font-bold text-xs transition shadow-2xs hover:shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="Xuất danh sách điểm danh buổi họp"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Xuất CSV</span>
              </button>

              {/* Nút Chốt buổi họp chuẩn nhận diện BCN */}
              {isBCN ? (
                <button
                  type="button"
                  disabled={currentEvt.isFinalized || isFinalizing}
                  onClick={handleFinalizeMeeting}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white shadow-xs transition-all active:scale-95 cursor-pointer ${currentEvt.isFinalized
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#0F3282] via-[#1351D8] to-[#1E62F4] hover:from-[#0B2562] hover:to-[#1351D8] shadow-sm'
                    }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                  <span>
                    {currentEvt.isFinalized
                      ? 'Đã chốt sổ điểm'
                      : isFinalizing
                        ? 'Đang xử lý...'
                        : 'Chốt buổi họp & Áp dụng điểm (Quyền BCN)'}
                  </span>
                </button>
              ) : (
                <div
                  title="Chỉ Ban Chủ nhiệm có thẩm quyền chốt sổ điểm danh và cộng/trừ điểm chính thức"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/80"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Chốt buổi (Chỉ BCN)</span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Card List for phones (< md): Dễ dàng bấm bằng 1 ngón tay cái */}
          <div className="block md:hidden space-y-3">
            {filteredMembers.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200/90 text-center text-slate-400 space-y-2">
                <Search className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-xs">Không tìm thấy thành viên nào phù hợp</p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setDeptFilter('ALL')
                    setStatusFilter('ALL')
                  }}
                  className="text-xs text-[#1351D8] font-bold hover:underline"
                >
                  Xóa bộ lọc
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
                        {m.avatar_url || m.full_name === 'Trần Đức Thắng' ? (
                          <img
                            src={m.avatar_url || '/avatars/duc-thang.jpg'}
                            alt={m.full_name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1351D8] font-bold flex items-center justify-center text-sm shrink-0 border border-blue-200/60">
                            {m.full_name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-[#0F172A] text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
                            <span className="truncate">{m.full_name}</span>
                            {m.is_core && (
                              <span className="px-1.5 py-0.2 bg-amber-50 text-amber-700 text-[9px] font-bold rounded border border-amber-200/80">
                                CORE
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span>{m.student_id || m.member_code}</span>
                            <span>•</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getDeptBadgeStyle(m.department_slug)}`}>
                              {m.department_name}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Trạng thái hiện tại */}
                      <div className="shrink-0">
                        {status === 'present_on_time' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                            <span>Đúng giờ (+1)</span>
                          </span>
                        )}
                        {status === 'late' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Muộn (-1)</span>
                          </span>
                        )}
                        {status === 'excused' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-blue-600" />
                            <span>Phép (-2)</span>
                          </span>
                        )}
                        {status === 'unexcused' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Vắng (-5)</span>
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
                        Đúng giờ
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
                        Muộn
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCheckinRecord(currentEvt.id, m.member_code, 'excused')}
                        className={`py-2 text-[11px] font-bold rounded-lg transition-all text-center cursor-pointer ${
                          status === 'excused'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-700 hover:bg-white hover:text-blue-700'
                        }`}
                      >
                        Phép
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
                        Vắng
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
                        placeholder="Ghi chú (lý do muộn/vắng)..."
                        defaultValue={rec.note || ''}
                        onBlur={(e) =>
                          updateCheckinRecord(currentEvt.id, m.member_code, status, e.target.value)
                        }
                        className="flex-1 text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-[#1351D8] shadow-2xs"
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
                {/* Header Navy sang trọng của dự án */}
                <thead className="bg-[#0B1E48] text-xs font-bold text-white uppercase tracking-wider border-b border-[#071533] select-none">
                  <tr className="divide-x divide-white/10">
                    <th className="py-3 px-3 w-12 text-center font-bold text-blue-100 whitespace-nowrap">STT</th>
                    <th className="py-3 px-4 min-w-[260px] font-bold text-white whitespace-nowrap">Thành viên</th>
                    <th className="py-3 px-3 min-w-[130px] font-bold text-blue-100 whitespace-nowrap">Ban</th>
                    <th className="py-3 px-3 min-w-[130px] font-bold text-blue-100 whitespace-nowrap">Giờ Check-in</th>
                    <th className="py-3 px-3 min-w-[170px] font-bold text-white whitespace-nowrap">Trạng thái điểm danh</th>
                    <th className="py-3 px-3 min-w-[250px] text-center font-bold text-blue-100 whitespace-nowrap">Thao tác nhanh 1 chạm</th>
                    <th className="py-3 px-4 min-w-[180px] font-bold text-blue-100 whitespace-nowrap">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="space-y-2">
                          <Search className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="font-semibold text-xs sm:text-sm">Không tìm thấy thành viên nào phù hợp với bộ lọc</p>
                          <button
                            onClick={() => {
                              setSearchQuery('')
                              setDeptFilter('ALL')
                              setStatusFilter('ALL')
                            }}
                            className="text-xs sm:text-sm text-[#1351D8] font-semibold hover:underline"
                          >
                            Xóa bộ lọc tìm kiếm
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
                                <div className="font-bold text-[#0F172A] flex items-center gap-1.5 whitespace-nowrap">
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
                                        title="Thành viên đã đăng ký tham gia sự kiện này"
                                      >
                                        <Ticket className="w-2.5 h-2.5" />
                                        Đã ĐK
                                      </span>
                                    ) : (
                                      <span
                                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 text-slate-400 text-[9px] rounded border border-slate-200/60 whitespace-nowrap"
                                        title="Chưa đăng ký trước"
                                      >
                                        Chưa ĐK
                                      </span>
                                    )
                                  )}
                                </div>
                                <div className="font-normal text-slate-500 text-[11px] mt-0.5 whitespace-nowrap">
                                  {m.student_id ? `${m.student_id} - ` : ''}
                                  {m.class_name ? `${m.class_name} - ` : ''}
                                  {m.position}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap ${getDeptBadgeStyle(m.department_slug)}`}>
                              {m.department_name}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono text-[11px] text-[#334155]">
                              {rec.checkinTime ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-lg text-xs">
                                  <Clock className="w-3 h-3 text-emerald-600" />
                                  <span>{rec.checkinTime}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-xs">Chưa điểm danh</span>
                              )}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {status === 'present_on_time' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] inline-flex items-center gap-1 whitespace-nowrap">
                                <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                                <span>Đúng giờ (+1 C07)</span>
                              </span>
                            )}
                            {status === 'late' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 inline-flex items-center gap-1 whitespace-nowrap">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Đi muộn (-1 T04)</span>
                              </span>
                            )}
                            {status === 'excused' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 inline-flex items-center gap-1 whitespace-nowrap">
                                <AlertTriangle className="w-3 h-3 text-blue-600" />
                                <span>Có phép (-2 T01)</span>
                              </span>
                            )}
                            {status === 'unexcused' && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 inline-flex items-center gap-1 whitespace-nowrap">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>Không phép (-5 T02)</span>
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
                                title="Ghi nhận đúng giờ (+1 C07)"
                                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${status === 'present_on_time'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-emerald-700 hover:bg-white'
                                  }`}
                              >
                                Đúng giờ
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateCheckinRecord(currentEvt.id, m.member_code, 'late')
                                }
                                title="Ghi nhận đi muộn (-1 T04)"
                                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${status === 'late'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-amber-700 hover:bg-white'
                                  }`}
                              >
                                Muộn
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateCheckinRecord(currentEvt.id, m.member_code, 'excused')
                                }
                                title="Ghi nhận vắng có phép (-2 T01)"
                                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${status === 'excused'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-blue-700 hover:bg-white'
                                  }`}
                              >
                                Phép
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateCheckinRecord(currentEvt.id, m.member_code, 'unexcused')
                                }
                                title="Ghi nhận vắng không phép (-5 T02)"
                                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${status === 'unexcused'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-rose-700 hover:bg-white'
                                  }`}
                              >
                                Vắng
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <input
                              type="text"
                              placeholder="Ghi chú lý do..."
                              defaultValue={rec.note || ''}
                              onBlur={(e) =>
                                updateCheckinRecord(
                                  currentEvt.id,
                                  m.member_code,
                                  status,
                                  e.target.value
                                )
                              }
                              className="w-full text-xs font-medium px-2.5 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-[#1351D8] focus:ring-1 focus:ring-[#1351D8]/20 rounded-lg focus:outline-none transition shadow-2xs"
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
            <h3 className="text-base font-bold text-slate-800">Chưa có sự kiện nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Vui lòng khởi tạo sự kiện có mở đăng ký để theo dõi danh sách vé và đối soát QR.</p>
          </div>
        ) : (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Card đối soát */}
          <div className="bg-gradient-to-r from-[#0B1E48] via-[#103E8F] to-[#1351D8] text-white rounded-3xl p-6 sm:p-7 border border-blue-900/40 shadow-lg space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    Bảo đảm công bằng & chống gian lận 100%
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-blue-200">
                    Phiên: {currentEvt.title}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
                  <Ticket className="w-6 h-6 text-[#F5B301]" />
                  Danh Sách Đăng Ký Trước &amp; Bảng Đối Soát Vé QR
                </h3>
                <p className="text-xs text-blue-100/80 max-w-2xl leading-relaxed">
                  Khi thành viên đến hội trường, Admin/Ban Nhân sự tại bàn tiếp đón sử dụng <strong>Máy quét QR</strong> để quét mã trên màn hình điện thoại của thành viên. Hệ thống tự động so khớp danh sách đã giữ chỗ, ngăn chặn hoàn toàn việc điểm danh hộ.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="px-5 py-3 rounded-2xl bg-[#F5B301] hover:bg-[#e0a400] text-[#0B1E48] font-black text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <QrCode className="w-5 h-5 text-[#0B1E48]" />
                  <span>MỞ MÁY QUÉT QR BÀN TRỰC</span>
                </button>
              </div>
            </div>

            {/* Quick counters */}
            <div className="pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                <span className="text-slate-300 block text-[11px]">Tổng số đã giữ chỗ:</span>
                <span className="text-xl font-black text-white">
                  {currentEvt.registeredMemberCodes?.length || 0} / {currentEvt.maxAttendees || 50}
                </span>
              </div>
              <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                <span className="text-slate-300 block text-[11px]">Đã quét vé có mặt:</span>
                <span className="text-xl font-black text-emerald-400">
                  {
                    (currentEvt.registeredMemberCodes || []).filter(
                      (c) => records[c]?.status === 'present_on_time' || records[c]?.status === 'late'
                    ).length
                  } TV
                </span>
              </div>
              <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                <span className="text-slate-300 block text-[11px]">Chưa đến hội trường:</span>
                <span className="text-xl font-black text-amber-300">
                  {
                    Math.max(
                      0,
                      (currentEvt.registeredMemberCodes?.length || 0) -
                      (currentEvt.registeredMemberCodes || []).filter(
                        (c) => records[c]?.status === 'present_on_time' || records[c]?.status === 'late'
                      ).length
                    )
                  } TV
                </span>
              </div>
              <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                <span className="text-slate-300 block text-[11px]">Tỷ lệ có mặt:</span>
                <span className="text-xl font-black text-white">
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
                  Bảng Danh Sách Người Đăng Ký ({currentEvt.registeredMemberCodes?.length || 0} người)
                </h4>
                <p className="text-xs text-slate-500">
                  Danh sách chính xác từng thành viên đã đăng ký trước khi sự kiện diễn ra
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Quét QR nhanh</span>
                </button>
              </div>
            </div>

            {(!currentEvt.registeredMemberCodes || currentEvt.registeredMemberCodes.length === 0) ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <Ticket className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-bold text-sm text-slate-600">Chưa có thành viên nào đăng ký sự kiện này.</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Thành viên có thể đăng ký giữ chỗ trước tại <strong>Cổng Thành Viên (/checkin?tab=register)</strong> để nhận mã vé QR cá nhân.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#0B1E48] text-white text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3 w-12 text-center">STT</th>
                      <th className="py-3 px-4">Mã Vé Điện Tử</th>
                      <th className="py-3 px-4 min-w-[200px]">Thành viên</th>
                      <th className="py-3 px-3">MSSV</th>
                      <th className="py-3 px-3">Ban</th>
                      <th className="py-3 px-3 text-center">Trạng thái vé</th>
                      <th className="py-3 px-3 text-right">Giờ quét QR</th>
                      <th className="py-3 px-3 text-center">Thao tác</th>
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
                            {m.department_name}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isChecked ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <Check className="w-3.5 h-3.5 text-emerald-700 font-black" />
                                ĐÃ CHECK-IN
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                CHƯA ĐẾN
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
                              <span className="text-[11px] font-semibold text-emerald-700">✓ Hoàn tất</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const scanTime = new Date().toLocaleTimeString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                  })
                                  updateCheckinRecord(
                                    currentEvt.id,
                                    code,
                                    'present_on_time',
                                    `Quét vé QR xác thực tại bàn đón tiếp lúc ${scanTime}`
                                  )
                                }}
                                className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-2xs cursor-pointer inline-flex items-center gap-1"
                              >
                                <QrCode className="w-3 h-3" />
                                <span>Quét vé</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Mobile Mockup Kiosk Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xl max-w-md mx-auto w-full relative overflow-hidden">
            {/* Top speaker notch mockup */}
            <div className="w-32 h-4 bg-slate-900 rounded-b-xl mx-auto -mt-6 mb-4 flex items-center justify-center">
              <div className="w-10 h-1 bg-slate-700 rounded-full"></div>
            </div>

            <div className="text-center space-y-1 mb-6">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#1351D8] border border-blue-200/80 inline-block">
                Cổng Check-in Điện Tử CLB
              </span>
              <h3 className="text-xl font-extrabold text-[#0F172A]">
                Điểm Danh Sinh Hoạt CLB
              </h3>
              <p className="text-xs text-[#64748B]">
                {currentEvt?.title || 'Sinh hoạt định kỳ CLB'}
              </p>
            </div>

            {/* Simulated QR Scanner view toggle */}
            <div className="mb-6">
              <div className="flex justify-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setIsSimulatingCamera(false)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${!isSimulatingCamera
                      ? 'bg-[#1351D8] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Nhập mã PIN
                </button>
                <button
                  type="button"
                  onClick={() => setIsSimulatingCamera(true)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${isSimulatingCamera
                      ? 'bg-[#1351D8] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Camera quét QR
                </button>
              </div>

              {isSimulatingCamera ? (
                <div className="aspect-square bg-slate-950 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center p-6 border border-slate-800">
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
                        setKioskPin(currentEvt.pinCode)
                        setIsSimulatingCamera(false)
                      }
                    }}
                    className="mt-4 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow hover:bg-emerald-700 transition"
                  >
                    Mô phỏng: Đã bắt được QR Code
                  </button>
                </div>
              ) : (
                <form onSubmit={handleKioskSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Chọn thành viên điểm danh:
                    </label>
                    <select
                      value={kioskMemberCode}
                      onChange={(e) => setKioskMemberCode(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#1351D8] focus:bg-white"
                    >
                      {members.map((m) => (
                        <option key={m.member_code} value={m.member_code}>
                          {m.full_name} ({m.department_name} - {m.student_id || m.member_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mã PIN máy chiếu (4 số):
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="e.g. 8899"
                      value={kioskPin}
                      onChange={(e) => setKioskPin(e.target.value)}
                      className="w-full p-3 text-center tracking-widest font-mono text-xl font-bold bg-slate-50 border border-slate-200/90 rounded-xl focus:border-[#1351D8] focus:bg-white focus:outline-none"
                    />
                    <span className="block text-[10px] text-slate-500 text-center mt-1">
                      (Mã PIN hiện tại đang hiển thị: <strong className="text-[#1351D8] font-mono">{currentEvt ? currentEvt.pinCode : 'Chưa có'}</strong>)
                    </span>
                  </div>

                  {kioskFeedback && (
                    <div
                      className={`p-3 rounded-xl text-xs font-semibold ${kioskFeedback.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                    >
                      {kioskFeedback.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#1351D8] hover:bg-[#0E40AF] text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95"
                  >
                    Xác nhận Điểm danh Ngay
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Guide & Rules for Check-in */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-5 shadow-sm">
            <h4 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#1351D8]" />
              <span>Quy chế Điểm danh & Tính điểm CLB</span>
            </h4>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
                <span className="p-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs">
                  C07
                </span>
                <div>
                  <h5 className="font-bold text-xs text-emerald-900">
                    Đúng giờ: +1 điểm hoạt động
                  </h5>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    Có mặt tại phòng họp và check-in trong khung giờ quy định (trước hoặc trong vòng 15 phút đầu).
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                <span className="p-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs">
                  T04
                </span>
                <div>
                  <h5 className="font-bold text-xs text-amber-900">
                    Đi muộn &gt;15 phút: -1 điểm
                  </h5>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Check-in sau 19:45 mà không có lý do bất khả kháng được duyệt trước.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                <span className="p-1.5 rounded-lg bg-[#1351D8] text-white font-bold text-xs">
                  T01
                </span>
                <div>
                  <h5 className="font-bold text-xs text-blue-900">
                    Vắng có phép hợp lệ: -2 điểm
                  </h5>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    Gửi đơn xin phép trước tối thiểu 12 tiếng qua email CLB kèm minh chứng lịch thi hoặc lý do chính đáng.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3">
                <span className="p-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs">
                  T02
                </span>
                <div>
                  <h5 className="font-bold text-xs text-rose-900">
                    Vắng không phép: -5 điểm & Báo động kỷ luật
                  </h5>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    Tích luỹ 3 lần vắng không phép trong nhiệm kỳ sẽ kích hoạt quy trình xem xét khai trừ khỏi Câu Lạc bộ Đại sứ sinh viên Trường Quốc tế.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 3: Lịch sử các buổi sinh hoạt */}
      {subTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#0F172A] mb-4">
              Các kỳ sinh hoạt CLB trong nhiệm kỳ 2025 - 2026
            </h3>
            <div className="space-y-3">
              {events.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <p className="font-semibold text-xs">Chưa có buổi sinh hoạt nào được lưu trong lịch sử</p>
                </div>
              ) : (
                events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-blue-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#0F172A]">
                        {evt.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${evt.isFinalized
                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          }`}
                      >
                        {evt.isFinalized ? 'Đã chốt sổ điểm' : 'Đang diễn ra'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">{evt.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                      <span>📅 {evt.date}</span>
                      <span>⏰ {evt.startTime} - {evt.endTime}</span>
                      <span>📍 {evt.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {evt.finalizedBy && (
                      <span className="text-[10px] text-slate-500 italic">
                        Chốt bởi: {evt.finalizedBy} ({evt.finalizedAt})
                      </span>
                    )}
                  </div>
                </div>
              )))}
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

            <h3 className="text-xl font-extrabold text-[#0F172A]">
              Chốt Sổ Điểm Danh Thành Công!
            </h3>
            <p className="text-xs text-[#64748B]">
              Hệ thống đã tính toán và tự động cập nhật điểm chính thức cho toàn bộ thành viên Câu Lạc bộ Đại sứ sinh viên Trường Quốc tế.
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-2 gap-3 text-left border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  Đúng giờ (+1 C07)
                </span>
                <span className="text-lg font-black text-emerald-600">
                  {finalizeSuccessModal.present} TV
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  Đi muộn (-1 T04)
                </span>
                <span className="text-lg font-black text-amber-600">
                  {finalizeSuccessModal.late} TV
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  Có phép (-2 T01)
                </span>
                <span className="text-lg font-black text-[#1351D8]">
                  {finalizeSuccessModal.excused} TV
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  Không phép (-5 T02)
                </span>
                <span className="text-lg font-black text-rose-600">
                  {finalizeSuccessModal.unexcused} TV
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFinalizeSuccessModal(null)}
              className="w-full py-3 bg-[#1351D8] hover:bg-[#0E40AF] text-white text-xs font-bold rounded-xl shadow transition active:scale-95 cursor-pointer"
            >
              Hoàn tất & Xem bảng điểm mới
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
            <div className="bg-[#0B1E48] px-6 py-4 flex items-center justify-between text-white border-b border-[#071533]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-400/30">
                  <Calendar className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-snug">Khởi tạo sự kiện / Phiên điểm danh mới</h3>
                  <p className="text-xs text-blue-200 font-medium">Thiết lập buổi họp, workshop hoặc teambuilding cho CLB</p>
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
                  Tên sự kiện / Buổi họp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Vd: Họp Thường Niên Tháng 11 CLB iSSAC"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#1351D8] focus:ring-1 focus:ring-[#1351D8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Danh mục</label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1351D8]"
                  >
                    <option value="meeting">Buổi họp CLB / Ban</option>
                    <option value="workshop">Workshop đào tạo</option>
                    <option value="teambuilding">Teambuilding nội bộ</option>
                    <option value="external">Sự kiện đối ngoại / Hợp tác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ngày diễn ra <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="DD/MM/YYYY"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1351D8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giờ bắt đầu</label>
                  <input
                    type="text"
                    required
                    placeholder="19:30"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1351D8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giờ kết thúc</label>
                  <input
                    type="text"
                    required
                    placeholder="21:00"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1351D8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Địa điểm tổ chức</label>
                <input
                  type="text"
                  required
                  placeholder="Vd: Phòng Hội thảo 202 - Nhà G4 hoặc Online"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#1351D8]"
                />
              </div>

              {/* PIN Code Generator */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Mã PIN máy chiếu Check-in</span>
                  <span className="text-[11px] text-slate-500">Mã 4 số hiển thị trên màn hình lớn để thành viên tự nhập</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-20 px-2 py-1.5 font-mono text-center font-black text-sm bg-white border border-slate-300 rounded-lg text-[#1351D8]"
                  />
                  <button
                    type="button"
                    onClick={() => setNewPin(String(Math.floor(1000 + Math.random() * 9000)))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 cursor-pointer"
                    title="Đổi mã PIN ngẫu nhiên khác"
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
                    className="w-4 h-4 text-[#1351D8] rounded focus:ring-0 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">Bắt buộc tham dự</span>
                    <span className="text-slate-500 text-[10px]">Vắng không phép trừ điểm T02</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={newAllowReg}
                    onChange={(e) => setNewAllowReg(e.target.checked)}
                    className="w-4 h-4 text-[#1351D8] rounded focus:ring-0 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">Mở cổng đăng ký trước</span>
                    <span className="text-slate-500 text-[10px]">Cấp vé điện tử QR cá nhân</span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Điểm cộng khi tham dự đúng giờ (+điểm)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setNewPointBonus(pts)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        newPointBonus === pts
                          ? 'bg-[#1351D8] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      +{pts} điểm
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
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0F3282] via-[#1351D8] to-[#1E62F4] hover:from-[#0B2562] hover:to-[#1351D8] text-white text-xs font-bold shadow transition active:scale-95 cursor-pointer"
                >
                  Khởi tạo & Kích hoạt phiên ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
