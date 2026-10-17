'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useClub } from '@/lib/context/ClubContext'
import { Header } from '@/components/layout/Header'
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Users,
  Search,
  Sparkles,
  Ticket,
  ChevronRight,
  Award,
  RefreshCw,
  ExternalLink,
  Laptop,
  Flame,
  Zap,
  Info,
  UserCheck,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Key,
  Smartphone,
  Check,
  XCircle,
  ArrowLeft,
  Copy,
  Home,
} from 'lucide-react'
import { QrTicketPass } from '@/components/checkin/QrTicketPass'

function CheckinContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlEventId = searchParams.get('event')
  const urlPin = searchParams.get('pin')
  const urlTab = searchParams.get('tab')

  const {
    members,
    events,
    activeEvent,
    activeEventId,
    registerForEvent,
    unregisterFromEvent,
    memberSelfCheckin,
  } = useClub()

  // 3 tab dành cho thành viên không có tài khoản:
  // 'live_checkin': Điểm danh trực tiếp tại hội trường bằng PIN máy chiếu
  // 'register': Đăng ký trước các sự kiện/workshop sắp tới của CLB
  // 'lookup': Tra cứu điểm thi đua và hồ sơ cá nhân nhanh bằng MSSV/Họ tên
  const [activeTab, setActiveTab] = useState<'live_checkin' | 'register' | 'lookup'>(
    urlTab === 'register' ? 'register' : urlTab === 'lookup' ? 'lookup' : 'live_checkin'
  )

  // Sự kiện đang chọn để check-in hoặc đăng ký
  const [selectedEventId, setSelectedEventId] = useState<string>(
    urlEventId || activeEventId || events[0]?.id || ''
  )

  // Form check-in tại hội trường & Cơ chế Chống Điểm Danh Hộ
  const [checkinMemberCode, setCheckinMemberCode] = useState<string>(members[0]?.member_code || '')
  const [pinInput, setPinInput] = useState<string>(urlPin || '')
  const [phoneLastDigits, setPhoneLastDigits] = useState<string>('')
  const [checkinResult, setCheckinResult] = useState<{
    success: boolean
    message: string
    timestamp?: string
    member?: any
    event?: any
  } | null>(null)
  const [submittingCheckin, setSubmittingCheckin] = useState(false)

  // Khóa thiết bị (1 điện thoại = 1 thành viên)
  const [deviceLockedMember, setDeviceLockedMember] = useState<{
    memberCode: string
    memberName: string
    timestamp: string
  } | null>(null)

  // Chế độ Kiosk Công Cộng (Bàn đón tiếp của Ban Nhân sự)
  const [isKioskMode, setIsKioskMode] = useState<boolean>(false)
  const [showKioskUnlockModal, setShowKioskUnlockModal] = useState<boolean>(false)
  const [kioskSupervisorPin, setKioskSupervisorPin] = useState<string>('')
  const [kioskError, setKioskError] = useState<string>('')

  // Form đăng ký trước sự kiện
  const [regMemberCode, setRegMemberCode] = useState<string>(members[0]?.member_code || '')
  const [regFeedback, setRegFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Tra cứu điểm thành viên
  const [lookupQuery, setLookupQuery] = useState<string>('')
  const [selectedLookupMember, setSelectedLookupMember] = useState<string>(members[0]?.member_code || '')

  // Đồng bộ URL params nếu có
  useEffect(() => {
    if (urlEventId && events.some((e) => e.id === urlEventId)) {
      setSelectedEventId(urlEventId)
    }
    if (urlPin) {
      setPinInput(urlPin)
    }
  }, [urlEventId, urlPin, events])

  const currentEvent = events.find((e) => e.id === selectedEventId) || activeEvent || events[0]
  const currentCheckinMember = members.find((m) => m.member_code === checkinMemberCode)
  const currentLookupMember = members.find((m) => m.member_code === selectedLookupMember)

  // Đọc trạng thái khóa thiết bị từ localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && currentEvent) {
      try {
        const savedLock = localStorage.getItem(`issac_device_lock_${currentEvent.id}`)
        if (savedLock) {
          setDeviceLockedMember(JSON.parse(savedLock))
        } else {
          setDeviceLockedMember(null)
        }
      } catch (err) {
        console.error(err)
      }
    }
  }, [currentEvent?.id])

  // Xử lý điểm danh tại hội trường (có kiểm tra chống gian lận đa lớp)
  const handleCheckinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentEvent) {
      alert('Không tìm thấy sự kiện điểm danh!')
      return
    }

    // 1. Kiểm tra khóa thiết bị (Ngăn điểm danh hộ nhiều người trên cùng 1 điện thoại)
    if (deviceLockedMember && !isKioskMode) {
      alert(
        `⚠️ CẢNH BÁO CHỐNG ĐIỂM DANH HỘ: Thiết bị này đã hoàn tất điểm danh cho bạn "${deviceLockedMember.memberName}". Mỗi thiết bị cá nhân chỉ được điểm danh cho 1 thành viên. Nếu đây là máy tính tại bàn lễ tân của Ban Nhân sự, vui lòng bấm "Mở khóa Kiosk Công Cộng".`
      )
      return
    }

    // 2. Kiểm tra mã PIN máy chiếu
    if (!pinInput.trim()) {
      alert('Vui lòng nhập mã PIN máy chiếu (4 số)!')
      return
    }

    // 3. Kiểm tra 4 số cuối SĐT cá nhân
    const cleanPhoneDigits = phoneLastDigits.trim()
    if (!cleanPhoneDigits || cleanPhoneDigits.length !== 4) {
      alert('Vui lòng nhập chính xác 4 số cuối Số điện thoại cá nhân đã đăng ký trong hồ sơ CLB để xác thực!')
      return
    }

    setSubmittingCheckin(true)
    setTimeout(() => {
      const res = memberSelfCheckin(
        currentEvent.id,
        checkinMemberCode,
        pinInput.trim(),
        cleanPhoneDigits,
        isKioskMode ? 'kiosk' : 'personal'
      )
      setSubmittingCheckin(false)

      if (res.success) {
        const lockInfo = {
          memberCode: currentCheckinMember?.member_code || checkinMemberCode,
          memberName: currentCheckinMember?.full_name || checkinMemberCode,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        }

        // Nếu là thiết bị cá nhân, khóa cứng thiết bị cho sự kiện này
        if (!isKioskMode) {
          try {
            localStorage.setItem(`issac_device_lock_${currentEvent.id}`, JSON.stringify(lockInfo))
            setDeviceLockedMember(lockInfo)
          } catch (err) {
            console.error(err)
          }
        }

        setCheckinResult({
          success: true,
          message: res.message,
          timestamp: lockInfo.timestamp,
          member: currentCheckinMember,
          event: currentEvent,
        })
      } else {
        setCheckinResult({
          success: false,
          message: res.message,
        })
      }
    }, 400)
  }

  // Mở khóa chế độ Kiosk công cộng dành cho Ban Nhân sự
  const handleUnlockKiosk = (e: React.FormEvent) => {
    e.preventDefault()
    // Mã giám sát chuẩn: issac2025 hoặc 8888
    if (kioskSupervisorPin.trim() === 'issac2025' || kioskSupervisorPin.trim() === '8888') {
      setIsKioskMode(true)
      setShowKioskUnlockModal(false)
      setKioskSupervisorPin('')
      setKioskError('')
      setCheckinResult(null)
      alert(
        '✓ Đã mở khóa thành công Chế độ Kiosk Công Cộng! Thiết bị này hiện có thể sử dụng tại bàn lễ tân để các thành viên lần lượt điểm danh dưới sự giám sát của Ban Nhân sự.'
      )
    } else {
      setKioskError('Mã giám sát không chính xác! (Mã của Ban Nhân sự: issac2025 hoặc 8888)')
    }
  }

  // Xử lý đăng ký trước sự kiện
  const handleRegisterEvent = (eventId: string, memberCode: string) => {
    const res = registerForEvent(eventId, memberCode)
    if (res.success) {
      setRegFeedback({ type: 'success', message: res.message })
    } else {
      setRegFeedback({ type: 'error', message: res.message })
    }
    setTimeout(() => setRegFeedback(null), 5000)
  }

  // Xử lý hủy đăng ký trước sự kiện
  const handleUnregisterEvent = (eventId: string, memberCode: string) => {
    const res = unregisterFromEvent(eventId, memberCode)
    if (res.success) {
      setRegFeedback({ type: 'success', message: res.message })
    } else {
      setRegFeedback({ type: 'error', message: res.message })
    }
    setTimeout(() => setRegFeedback(null), 5000)
  }

  // Lọc thành viên trong phần tra cứu điểm
  const filteredLookupMembers = members.filter((m) => {
    if (!lookupQuery.trim()) return true
    const q = lookupQuery.toLowerCase()
    return (
      m.full_name.toLowerCase().includes(q) ||
      m.member_code.toLowerCase().includes(q) ||
      (m.student_id && m.student_id.toLowerCase().includes(q)) ||
      m.department_name.toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen bg-[#FAFBFC] text-slate-800 antialiased flex flex-col">
      {/* Top Header - Full Width spanning the top identical to Main Club App */}
      <Header
        searchTerm={lookupQuery}
        onSearchChange={(val) => {
          setLookupQuery(val)
          if (val.trim() && activeTab !== 'lookup') {
            setActiveTab('lookup')
          }
        }}
        pendingCount={0}
        onHomeClick={() => router.push('/')}
        onNotificationClick={() => router.push('/?tab=history')}
      />

      {/* Sub-navbar with Breadcrumbs & Quick Link back to Admin */}
      <div className="bg-white border-b border-slate-200/90 px-6 sm:px-12 lg:px-16 xl:px-20 py-2.5 shadow-2xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/"
              className="text-slate-500 hover:text-[#1351D8] flex items-center gap-1 font-semibold transition"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Trang chủ</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-[#0B1E48]">Cổng Điểm Danh &amp; Đăng Ký Thành Viên CLB</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#1351D8] border border-blue-200/80">
              Tự phục vụ
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#1351D8] bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 shadow-2xs transition active:scale-95 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Đăng Nhập BCN / HR</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 shadow-2xs transition active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Vào Trang Quản Trị CLB</span>
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-1 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Banner giới thiệu cơ chế không cần tài khoản */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B1E48] via-[#0E2C6C] to-[#1351D8] p-6 sm:p-7 text-white shadow-lg shadow-blue-950/15 border border-white/10">
          {/* Ambient background glow decoration */}
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-blue-400/15 blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-16 w-56 h-56 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold text-blue-100 backdrop-blur-md border border-white/20">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>Không Cần Đăng Nhập Mật Khẩu</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
                Điểm Danh &amp; Đăng Ký Sự Kiện Dành Riêng Cho 48 Thành Viên CLB
              </h2>
              <p className="text-xs sm:text-[13px] text-blue-100/90 leading-relaxed">
                Thành viên không cần tài khoản riêng. Chỉ cần chọn hoặc nhập <strong>Họ tên / MSSV</strong> và nhập <strong>Mã PIN 4 số</strong> hiển thị trên máy chiếu hội trường để điểm danh, hoặc đăng ký giữ chỗ trước các sự kiện/workshop sắp tới.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="px-5 py-3.5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md text-center shadow-inner">
                <div className="text-2xl font-black text-[#FFCD38]">
                  {members.length}
                </div>
                <div className="text-[10px] text-blue-100 uppercase tracking-wider font-bold mt-0.5">
                  Thành viên chính thức
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Segmented Control 3 Tabs */}
        <div className="grid grid-cols-3 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('live_checkin')
              setCheckinResult(null)
            }}
            className={`flex items-center justify-center gap-2 py-3 px-3 sm:px-5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'live_checkin'
                ? 'bg-white text-[#1351D8] shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <QrCode className={`w-4 h-4 shrink-0 ${activeTab === 'live_checkin' ? 'text-[#1351D8]' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">1. Điểm Danh Hội Trường</span>
            <span className="sm:hidden">1. Điểm danh</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex items-center justify-center gap-2 py-3 px-3 sm:px-5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'register'
                ? 'bg-white text-[#1351D8] shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Ticket className={`w-4 h-4 shrink-0 ${activeTab === 'register' ? 'text-[#1351D8]' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">2. Đăng Ký Sự Kiện Trước</span>
            <span className="sm:hidden">2. Đăng ký trước</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lookup')}
            className={`flex items-center justify-center gap-2 py-3 px-3 sm:px-5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'lookup'
                ? 'bg-white text-[#1351D8] shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Award className={`w-4 h-4 shrink-0 ${activeTab === 'lookup' ? 'text-[#1351D8]' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">3. Tra Cứu Điểm Cá Nhân</span>
            <span className="sm:hidden">3. Tra cứu điểm</span>
          </button>
        </div>

        {/* Feedback Alert for Registration */}
        {regFeedback && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold shadow-sm animate-in fade-in duration-200 ${
              regFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {regFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{regFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setRegFeedback(null)}
              className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer ml-3"
            >
              Đóng
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: ĐIỂM DANH HỘI TRƯỜNG BẰNG MÃ PIN (LIVE CHECK-IN) */}
        {/* ========================================================= */}
        {activeTab === 'live_checkin' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Cột trái: Thông tin buổi sinh hoạt / Sự kiện đang chiếu */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Phiên Điểm Danh Đang Mở
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>ĐANG CHIẾU</span>
                </span>
              </div>

              {/* Selector nếu có nhiều sự kiện */}
              {events.length > 1 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chọn sự kiện đang tham gia:
                  </label>
                  <select
                    suppressHydrationWarning
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full bg-slate-50/70 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-[#1351D8] transition shadow-2xs cursor-pointer"
                  >
                    {events.map((e) => (
                      <option key={e.id} value={e.id} suppressHydrationWarning>
                        {e.title} ({e.date})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {currentEvent && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[#0B1E48] leading-snug tracking-tight">
                      {currentEvent.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal mt-1.5">
                      {currentEvent.description}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#1351D8] flex items-center justify-center shrink-0 shadow-2xs">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Thời gian</span>
                        <span className="font-bold text-slate-800">{currentEvent.date} ({currentEvent.startTime} - {currentEvent.endTime})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2 border-t border-slate-200/60">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Địa điểm</span>
                        <span className="font-semibold text-slate-700">{currentEvent.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-blue-50/90 to-indigo-50/60 border border-blue-200/80 rounded-2xl text-xs text-blue-950 space-y-1.5 shadow-2xs">
                    <div className="flex items-center gap-2 font-bold text-[#0B1E48]">
                      <div className="w-6 h-6 rounded-lg bg-[#1351D8] text-white flex items-center justify-center shadow-xs">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-black">Mức điểm cộng nhận được:</span>
                    </div>
                    <p className="text-[11.5px] text-blue-900 leading-relaxed pl-8">
                      Điểm danh đúng giờ được cộng <span className="inline-block px-1.5 py-0.5 rounded-md bg-white border border-blue-200 text-[#1351D8] font-black font-mono shadow-2xs">+{currentEvent.pointBonus || 1} điểm thi đua</span> trực tiếp vào hồ sơ tháng sau khi BCN chốt buổi.
                    </p>
                  </div>

                  {/* Cảnh báo Quy chế Chống Điểm Danh Hộ */}
                  <div className="p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-xs text-amber-950 space-y-2 shadow-2xs">
                    <div className="flex items-center gap-2 font-bold text-amber-950">
                      <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                        <ShieldAlert className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-black">Quy chế Chống Điểm Danh Hộ (Điều T01)</span>
                    </div>
                    <p className="text-[11.5px] text-amber-900/90 leading-relaxed pl-8">
                      Nghiêm cấm mọi hành vi điểm danh hộ hoặc nhờ điểm danh hộ. Hệ thống kích hoạt <strong>Khóa cứng thiết bị cá nhân (1 máy = 1 người)</strong> kết hợp <strong>xác thực 4 số cuối SĐT</strong>. Vi phạm sẽ bị trừ 10 điểm thi đua và xử lý kỷ luật trước toàn CLB.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Cột phải: Form tự điểm danh & Màn hình Chống Điểm Danh Hộ */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-5">
              {/* TRƯỜNG HỢP 1: Thiết bị đã điểm danh và bị khóa (Chống điểm danh hộ trên 1 điện thoại) */}
              {deviceLockedMember && !isKioskMode && !checkinResult ? (
                <div className="text-center py-6 space-y-5 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1351D8] border border-blue-200 flex items-center justify-center mx-auto shadow-sm">
                    <Lock className="w-8 h-8" />
                  </div>

                  <div className="space-y-1.5">
                    <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-200">
                      Thiết bị cá nhân đã khóa xác thực
                    </span>
                    <h3 className="text-xl font-black text-[#0B1E48]">
                      Bạn Đã Hoàn Tất Điểm Danh!
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      Hệ thống đã ghi nhận sự hiện diện của bạn cho sự kiện này. Để chống gian lận và điểm danh hộ, <strong>mỗi thiết bị chỉ được điểm danh cho 1 thành viên</strong>.
                    </p>
                  </div>

                  {/* Thông tin thành viên đã điểm danh trên máy này */}
                  <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 text-xs text-left space-y-2.5 max-w-sm mx-auto shadow-2xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Thành viên:</span>
                      <span className="font-bold text-slate-900">{deviceLockedMember.memberName}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Thời gian:</span>
                      <span className="font-bold text-emerald-600">{deviceLockedMember.timestamp} (Đúng giờ)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Trạng thái thiết bị:</span>
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Đã khóa bảo vệ chính chủ
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('lookup')}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1351D8] text-white hover:bg-[#0F3282] shadow-sm transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Tra cứu điểm thi đua cá nhân</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowKioskUnlockModal(true)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 border border-slate-200/80 transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Key className="w-3.5 h-3.5 text-amber-600" />
                      <span>Mở khóa Kiosk (Dành cho Ban Nhân sự)</span>
                    </button>
                  </div>
                </div>
              ) : checkinResult?.success ? (
                /* TRƯỜNG HỢP 2: Màn hình thông báo điểm danh vừa thành công */
                <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div>
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      Điểm danh thành công
                    </span>
                    <h3 className="text-xl font-black text-[#0B1E48] mt-2">
                      Ghi Nhận Sự Hiện Diện!
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {isKioskMode
                        ? 'Đã cập nhật dữ liệu qua Kiosk Lễ tân có giám sát của Ban Nhân sự.'
                        : 'Thiết bị cá nhân đã được khóa an toàn để bảo vệ quyền lợi chính chủ.'}
                    </p>
                  </div>

                  {/* Thông tin xác nhận */}
                  <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 text-xs text-left space-y-2.5 max-w-sm mx-auto shadow-2xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Thành viên:</span>
                      <span className="font-bold text-slate-900">{checkinResult.member?.full_name}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Ban trực thuộc:</span>
                      <span className="font-bold text-[#1351D8]">{checkinResult.member?.department_name}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Giờ điểm danh:</span>
                      <span className="font-bold text-emerald-600">{checkinResult.timestamp} (Đúng giờ)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Dự kiến cộng:</span>
                      <span className="font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
                        +{checkinResult.event?.pointBonus || 1} Điểm thi đua
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                    {isKioskMode ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCheckinResult(null)
                          setPinInput('')
                          setPhoneLastDigits('')
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1351D8] text-white hover:bg-[#0F3282] shadow-sm transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Điểm danh thành viên tiếp theo (Kiosk)</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveTab('lookup')}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1351D8] text-white hover:bg-[#0F3282] shadow-sm transition active:scale-95 cursor-pointer"
                        >
                          Xem Bảng Điểm Thi Đua
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowKioskUnlockModal(true)}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 border border-slate-200/80 transition cursor-pointer"
                        >
                          Mở khóa Kiosk bàn lễ tân
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                /* TRƯỜNG HỢP 3: Form nhập danh tính & PIN 3 lớp chống gian lận */
                <form onSubmit={handleCheckinSubmit} className="space-y-4">
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1351D8] border border-blue-200/80 flex items-center justify-center font-bold shadow-2xs">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-[#0B1E48]">
                          Xác Thực Thành Viên &amp; Điểm Danh
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Bảo mật 3 bước xác thực chống gian lận
                        </p>
                      </div>
                    </div>
                    {isKioskMode ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                        <Unlock className="w-3.5 h-3.5 text-amber-700" />
                        <span>KIOSK LỄ TÂN (HR)</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200/80">
                        3 Bước xác thực
                      </span>
                    )}
                  </div>

                  {isKioskMode && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-amber-700 shrink-0" />
                        <span className="text-[11.5px] font-semibold">
                          Chế độ Kiosk Công Cộng đang mở. Các thành viên có thể lần lượt tự nhập thông tin tại bàn đón tiếp.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsKioskMode(false)}
                        className="text-[11px] font-bold text-amber-900 underline hover:no-underline shrink-0 ml-2 cursor-pointer"
                      >
                        Khóa lại
                      </button>
                    </div>
                  )}

                  {checkinResult && !checkinResult.success && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2 animate-in fade-in duration-200 shadow-2xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{checkinResult.message}</span>
                    </div>
                  )}

                  {/* Bước 1: Chọn thành viên */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-[#1351D8] text-[11px] font-black mr-1.5">1</span>
                      Chọn Họ tên &amp; MSSV của bạn trong CLB: <span className="text-rose-500">*</span>
                    </label>
                    <select
                      suppressHydrationWarning
                      value={checkinMemberCode}
                      onChange={(e) => setCheckinMemberCode(e.target.value)}
                      className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-[#1351D8] focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 transition shadow-2xs cursor-pointer"
                    >
                      {members.map((m) => {
                        const isCheckedIn =
                          currentEvent?.records[m.member_code]?.status === 'present_on_time' ||
                          currentEvent?.records[m.member_code]?.status === 'late'
                        return (
                          <option
                            key={m.member_code}
                            value={m.member_code}
                            suppressHydrationWarning
                            disabled={isCheckedIn}
                          >
                            {isCheckedIn ? '✓ [ĐÃ ĐIỂM DANH] ' : ''}
                            {m.full_name} ({m.department_name} - {m.student_id || m.member_code})
                          </option>
                        )
                      })}
                    </select>
                    <span className="block text-[11px] text-slate-400 mt-1 pl-6">
                      (Danh sách 48 thành viên CLB. Thành viên đã điểm danh sẽ được đánh dấu và khóa).
                    </span>
                  </div>

                  {/* Bước 2: Nhập mã PIN máy chiếu */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-[#1351D8] text-[11px] font-black mr-1.5">2</span>
                      Nhập mã PIN máy chiếu hội trường (4 số): <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="Ví dụ: 8899"
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-[#1351D8] focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 text-center tracking-[0.3em] font-mono text-xl font-black text-[#1351D8] transition shadow-2xs"
                      />
                    </div>
                    <span className="block text-[11px] text-slate-500 mt-1 text-center">
                      Mã PIN hiển thị trực tiếp trên màn hình máy chiếu phòng họp / hội trường.
                    </span>
                  </div>

                  {/* Bước 3: Xác thực 4 số cuối Số điện thoại cá nhân (Chống điểm danh hộ) */}
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-[#1351D8] text-[11px] font-black mr-1.5">3</span>
                        Xác thực 4 số cuối Số điện thoại của bạn: <span className="text-rose-500">*</span>
                      </label>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1351D8] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60 shadow-2xs">
                        <ShieldCheck className="w-3 h-3 text-[#1351D8]" />
                        Chống điểm danh hộ
                      </span>
                    </div>
                    <div className="relative max-w-xs mx-auto">
                      <input
                        type="password"
                        maxLength={4}
                        required
                        placeholder="Ví dụ: 0705"
                        value={phoneLastDigits}
                        onChange={(e) => setPhoneLastDigits(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white border border-slate-200/90 focus:border-[#1351D8] focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2 text-center tracking-[0.35em] font-mono text-base font-black text-[#0B1E48] transition shadow-2xs"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                      Nhập 4 số cuối SĐT đã đăng ký trong hồ sơ CLB để xác minh chính chủ. Người ở nhà không thể điểm danh hộ nếu không có thông tin xác thực này.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingCheckin}
                    className="w-full py-3.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-[#0B1E48] via-[#1351D8] to-[#1E62F4] hover:brightness-110 text-white shadow-md shadow-[#1351D8]/20 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    {submittingCheckin ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang xác thực bảo mật &amp; điểm danh...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Xác Nhận Hiện Diện (Chống Gian Lận)</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal Mở Khóa Chế Độ Kiosk Công Cộng (Dành riêng cho Ban Nhân Sự) */}
        {showKioskUnlockModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-[#0B1E48]">
                  <Key className="w-5 h-5 text-amber-600" />
                  <h3 className="text-base font-black">Mở Khóa Kiosk Lễ Tân</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowKioskUnlockModal(false)
                    setKioskError('')
                    setKioskSupervisorPin('')
                  }}
                  className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Chế độ Kiosk cho phép <strong>thiết bị công cộng đặt tại bàn đón tiếp</strong> điểm danh cho nhiều thành viên liên tiếp dưới sự giám sát trực tiếp của Ban Nhân sự.
              </p>

              {kioskError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{kioskError}</span>
                </div>
              )}

              <form onSubmit={handleUnlockKiosk} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nhập mã giám sát của Ban Nhân sự (HR PIN):
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Nhập mã giám sát (Ví dụ: issac2025)"
                    value={kioskSupervisorPin}
                    onChange={(e) => setKioskSupervisorPin(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-[#1351D8]"
                  />
                  <span className="block text-[11px] text-slate-400 mt-1">
                    Mã mặc định hệ thống: <code>issac2025</code> hoặc <code>8888</code>
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowKioskUnlockModal(false)
                      setKioskError('')
                      setKioskSupervisorPin('')
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1351D8] text-white hover:bg-[#0F3282] transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Xác Nhận Mở Kiosk</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ĐĂNG KÝ TRƯỚC SỰ KIỆN / WORKSHOP (PRE-REGISTRATION) */}
        {/* ========================================================= */}
        {activeTab === 'register' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200/80 font-bold shadow-2xs">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#0B1E48]">
                      Cổng Đăng Ký Sự Kiện &amp; Workshop Sắp Tới
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Chọn danh tính của bạn rồi bấm Đăng ký giữ chỗ trước tại các sự kiện
                    </p>
                  </div>
                </div>

                {/* Chọn danh tính thành viên để đăng ký */}
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Bạn là:</span>
                  <select
                    suppressHydrationWarning
                    value={regMemberCode}
                    onChange={(e) => setRegMemberCode(e.target.value)}
                    className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1351D8] shadow-2xs cursor-pointer transition"
                  >
                    {members.map((m) => (
                      <option key={m.member_code} value={m.member_code} suppressHydrationWarning>
                        {m.full_name} ({m.department_name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Danh sách các sự kiện đang mở đăng ký */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {events.map((evt) => {
                  const registeredList = evt.registeredMemberCodes || []
                  const isUserRegistered = registeredList.includes(regMemberCode)
                  const remainingSeats = Math.max(0, (evt.maxAttendees || 50) - registeredList.length)

                  return (
                    <div
                      key={evt.id}
                      className={`p-5 sm:p-6 rounded-2xl border transition-all duration-200 space-y-4 shadow-2xs flex flex-col justify-between ${
                        isUserRegistered
                          ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-300/40'
                          : 'bg-white border-slate-200/90 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-[#1351D8] border border-blue-200/80">
                            {evt.category === 'workshop'
                              ? 'Workshop chuyên đề'
                              : evt.category === 'teambuilding'
                              ? 'Teambuilding'
                              : 'Sinh hoạt định kỳ'}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                              isUserRegistered
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-amber-50 text-amber-800 border-amber-200/80'
                            }`}
                          >
                            {isUserRegistered ? 'Đã giữ chỗ' : `Còn ${remainingSeats} chỗ`}
                          </span>
                        </div>

                        <h4 className="text-base font-black text-[#0B1E48] leading-tight">
                          {evt.title}
                        </h4>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {evt.description}
                        </p>

                        <div className="pt-2 space-y-1.5 text-xs text-slate-500">
                          <div className="flex items-center gap-2 font-semibold text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-[#1351D8]" />
                            <span>{evt.date} ({evt.startTime} - {evt.endTime})</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-[#1351D8]" />
                            <span className="truncate">{evt.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-emerald-700 font-bold">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            <span>+{evt.pointBonus || 2} Điểm thi đua khi tham gia</span>
                          </div>
                        </div>
                      </div>

                      {/* Hiển thị Vé Điểm Danh QR Cá Nhân nếu đã đăng ký */}
                      {isUserRegistered && members.find((m) => m.member_code === regMemberCode) ? (
                        <div className="pt-2">
                          <QrTicketPass
                            event={evt}
                            member={members.find((m) => m.member_code === regMemberCode)!}
                            onUnregister={() => handleUnregisterEvent(evt.id, regMemberCode)}
                          />
                        </div>
                      ) : (
                        /* Hành động Đăng ký nếu chưa tham gia */
                        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div className="text-xs text-slate-500">
                            Đã đăng ký: <strong>{registeredList.length}/{evt.maxAttendees || 50}</strong>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRegisterEvent(evt.id, regMemberCode)}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-2xs shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Đăng ký tham gia ngay</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: TRA CỨU ĐIỂM THI ĐUA & SỔ CÁI CÁ NHÂN (LOOKUP) */}
        {/* ========================================================= */}
        {activeTab === 'lookup' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1351D8] flex items-center justify-center border border-blue-200/80 font-bold shadow-2xs">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#0B1E48]">
                      Tra Cứu Điểm Thi Đua &amp; Sổ Cái Cá Nhân
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Nhập MSSV hoặc Họ tên để xem kết quả điểm và lịch sử ghi nhận
                    </p>
                  </div>
                </div>

                {/* Ô tìm kiếm nhanh thành viên */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm tên, MSSV, ban..."
                    value={lookupQuery}
                    onChange={(e) => setLookupQuery(e.target.value)}
                    className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-full pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#1351D8] shadow-2xs transition"
                  />
                </div>
              </div>

              {/* Selector danh sách thành viên */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn thành viên cần xem thông tin ({filteredLookupMembers.length} kết quả):
                </label>
                <select
                  suppressHydrationWarning
                  value={selectedLookupMember}
                  onChange={(e) => setSelectedLookupMember(e.target.value)}
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#1351D8] shadow-2xs cursor-pointer transition"
                >
                  {filteredLookupMembers.map((m) => (
                    <option key={m.member_code} value={m.member_code} suppressHydrationWarning>
                      {m.full_name} ({m.department_name} - MSSV: {m.student_id || m.member_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Thẻ hiển thị điểm cá nhân */}
              {currentLookupMember && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200/90 space-y-5 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0B1E48] to-[#1351D8] text-white font-black flex items-center justify-center text-lg shadow-sm shrink-0">
                        {currentLookupMember.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-lg font-black text-[#0B1E48]">
                            {currentLookupMember.full_name}
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#1351D8] border border-blue-200/70">
                            {currentLookupMember.department_name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-1">
                          MSSV: {currentLookupMember.student_id || '-'} | Lớp: {currentLookupMember.class_name || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Điểm thi đua hiện tại
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-[#1351D8]">
                          {currentLookupMember.current_score}đ
                        </span>
                      </div>
                      <div className="text-right pl-4 border-l border-slate-200">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Xếp hạng CLB
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-[#0B1E48]">
                          #{currentLookupMember.rank_in_club || 1}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                      <span className="text-[11px] text-slate-500 block">Vắng T02 không phép:</span>
                      <span className="font-bold text-rose-600 text-sm mt-0.5 block">
                        {currentLookupMember.absent_count_t02 || 0} lần
                      </span>
                    </div>
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                      <span className="text-[11px] text-slate-500 block">Vai trò CLB:</span>
                      <span className="font-bold text-slate-800 text-sm truncate mt-0.5 block">
                        {currentLookupMember.position || 'Thành viên'}
                      </span>
                    </div>
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                      <span className="text-[11px] text-slate-500 block">Khởi đầu chu kỳ:</span>
                      <span className="font-bold text-slate-800 text-sm mt-0.5 block">60 điểm</span>
                    </div>
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                      <span className="text-[11px] text-slate-500 block">Trạng thái:</span>
                      <span className="font-bold text-emerald-600 text-sm mt-0.5 block">Đang hoạt động</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function CheckinPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Đang tải Cổng Thành Viên...</div>}>
      <CheckinContent />
    </Suspense>
  )
}
