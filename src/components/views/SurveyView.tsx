'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import {
  Users,
  ChevronDown,
  Check,
  Send,
  Star,
  Briefcase,
  Mail,
  Info,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
} from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useClub } from '@/lib/context/ClubContext'

export interface SurveyEvaluation {
  targetMemberCode: string
  targetMemberName: string
  targetMemberDept: string
  targetMemberRole: string
  avatarUrl?: string
  initials?: string
  rating: number // 1 to 5
  feedback: string // Nhận xét
  improvement: string // Mong muốn cải thiện
  status: 'completed' | 'in_progress' | 'pending'
  updatedAt?: string
}

export interface SurveyTargetMember {
  memberCode: string
  fullName: string
  departmentName: string
  position: string
  avatarUrl?: string
  initials: string
  initialBg?: string
  email?: string
  isCore: boolean
  reviewsCount?: number
  averageScore?: number
}

// Helper to format position and department cleanly (e.g. "Trưởng ban Truyền thông" instead of "Trưởng ban Ban Truyền thông")
export function formatMemberPosition(position: string, departmentName: string): string {
  const cleanDept = departmentName.replace(/^Ban\s+/i, '')
  if (position.toLowerCase().includes('trưởng ban')) {
    return `Trưởng ban ${cleanDept}`
  }
  if (position.toLowerCase().includes('phó ban')) {
    return `Phó ban ${cleanDept}`
  }
  if (position.toLowerCase().includes('thành viên') || position.toLowerCase().includes('member')) {
    return `Thành viên ${cleanDept}`
  }
  return `${position} ${cleanDept}`
}

// Initial mock evaluations for realistic display matching project style and mockup
export const INITIAL_CORE_EVALUATIONS: Record<string, SurveyEvaluation> = {
  '24310069': {
    targetMemberCode: '24310069',
    targetMemberName: 'Lê Trần Thuỳ Nguyên',
    targetMemberDept: 'Ban Tư vấn',
    targetMemberRole: 'Trưởng ban Tư vấn',
    avatarUrl: '/thuy-nguyen-avatar.png',
    initials: 'N',
    rating: 5,
    feedback:
      'Hỗ trợ sự kiện rất nhiệt tình, giải đáp thắc mắc của tân sinh viên nhanh chóng và chu đáo.',
    improvement: 'Tiếp tục phát huy tinh thần năng động và truyền lửa cho team.',
    status: 'completed',
    updatedAt: '2026-11-01T20:30:00.000Z',
  },
  '25070407': {
    targetMemberCode: '25070407',
    targetMemberName: 'Vũ Đình Hải',
    targetMemberDept: 'Ban Truyền thông',
    targetMemberRole: 'Phó ban Truyền thông',
    avatarUrl: '/vu-dinh-hai-avatar.png',
    initials: 'H',
    rating: 4,
    feedback: 'Nhiệt tình phụ trách kỹ thuật và hình ảnh trong suốt sự kiện.',
    improvement: 'Cần phân công việc chi tiết hơn cho các thành viên trong ban.',
    status: 'completed',
    updatedAt: '2026-11-02T14:20:00.000Z',
  },
}

const RATING_OPTIONS = [
  { score: 1, label: 'Chưa tốt' },
  { score: 2, label: 'Ổn' },
  { score: 3, label: 'Tốt' },
  { score: 4, label: 'Rất tốt' },
  { score: 5, label: 'Xuất sắc' },
]

export function SurveyView() {
  const { currentUser } = useAuth()
  const { members } = useClub()

  // Selected event
  const [selectedEvent, setSelectedEvent] = useState<string>('1st Meeting')
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState<boolean>(false)
  const eventDropdownRef = useRef<HTMLDivElement>(null)

  const EVENT_OPTIONS = [
    '1st Meeting',
    'First Meeting - T10/2026',
    'Gen 3 Recruitment',
    'Workshop Sharing',
  ]

  // Close event dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        eventDropdownRef.current &&
        !eventDropdownRef.current.contains(e.target as Node)
      ) {
        setIsEventDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Storage key
  const storageKey = 'issac_survey_core_event_v2'

  // Lọc tất cả thành viên Core Team trong CLB, TRỪ Ban Chủ nhiệm và TRỪ người đang đánh giá nếu họ là core
  const targetMembers: SurveyTargetMember[] = useMemo(() => {
    return members
      .filter((m) => m.is_core)
      // Loại trừ Ban Chủ nhiệm theo yêu cầu người dùng
      .filter(
        (m) =>
          m.department_slug !== 'bcn' &&
          m.department_name !== 'Ban Chủ nhiệm' &&
          m.department_code !== 'B04'
      )
      // Loại trừ chính người đang đăng nhập nếu họ thuộc danh sách (không tự đánh giá bản thân)
      .filter((m) => m.member_code !== currentUser?.memberCode)
      .map((m, idx) => ({
        memberCode: m.member_code,
        fullName: m.full_name,
        departmentName: m.department_name,
        position: m.position,
        avatarUrl: m.avatar_url,
        initials: m.full_name.trim().slice(-1),
        initialBg:
          m.department_slug === 'truyen-thong'
            ? 'bg-blue-100 text-blue-700 border-blue-200'
            : m.department_slug === 'tu-van'
            ? 'bg-amber-100 text-amber-700 border-amber-200'
            : 'bg-purple-100 text-purple-700 border-purple-200',
        email: m.email || `${m.member_code.toLowerCase()}@vnuis.edu.vn`,
        isCore: true,
        reviewsCount: 3 + (idx % 3),
        averageScore: 4.0 + (idx % 2 === 0 ? 0.5 : 0),
      }))
  }, [members, currentUser])

  // Evaluations state
  const [evaluations, setEvaluations] =
    useState<Record<string, SurveyEvaluation>>({})
  const [selectedMemberCode, setSelectedMemberCode] = useState<string>('')

  // Form input state
  const [currentRating, setCurrentRating] = useState<number>(4)
  const [currentFeedback, setCurrentFeedback] = useState<string>('')
  const [currentImprovement, setCurrentImprovement] = useState<string>('')

  // Toast / Feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false)

  // Load from localStorage or initialize with mock data
  useEffect(() => {
    try {
      const savedEvaluations = localStorage.getItem(storageKey)
      if (savedEvaluations) {
        setEvaluations(JSON.parse(savedEvaluations))
      } else {
        setEvaluations(INITIAL_CORE_EVALUATIONS)
        localStorage.setItem(
          storageKey,
          JSON.stringify(INITIAL_CORE_EVALUATIONS)
        )
      }
    } catch {
      setEvaluations(INITIAL_CORE_EVALUATIONS)
    }
  }, [storageKey])

  // Set default selected member: prefer Trần Đức Thắng to match mockup if exists, else first target
  useEffect(() => {
    if (targetMembers.length > 0) {
      if (
        !selectedMemberCode ||
        !targetMembers.some((m) => m.memberCode === selectedMemberCode)
      ) {
        const defaultMember =
          targetMembers.find((m) => m.fullName.includes('Trần Đức Thắng')) ||
          targetMembers[0]
        setSelectedMemberCode(defaultMember.memberCode)
      }
    }
  }, [targetMembers, selectedMemberCode])

  // Current selected member object
  const selectedMember = useMemo(() => {
    return (
      targetMembers.find((m) => m.memberCode === selectedMemberCode) ||
      targetMembers[0] ||
      null
    )
  }, [targetMembers, selectedMemberCode])

  // Synchronize form when selectedMember or evaluations change
  useEffect(() => {
    if (selectedMember) {
      const existing = evaluations[selectedMember.memberCode]
      if (existing) {
        setCurrentRating(existing.rating || 4)
        setCurrentFeedback(existing.feedback || '')
        setCurrentImprovement(existing.improvement || '')
      } else {
        setCurrentRating(4)
        setCurrentFeedback('')
        setCurrentImprovement('')
      }
    }
  }, [selectedMemberCode, evaluations, selectedMember])

  // Completion calculation
  const totalTargetCount = targetMembers.length
  const completedCount = useMemo(() => {
    return targetMembers.filter(
      (m) => evaluations[m.memberCode]?.status === 'completed'
    ).length
  }, [targetMembers, evaluations])

  // Extract first name (tên gọi)
  const memberFirstName = useMemo(() => {
    if (!selectedMember) return 'thành viên'
    const parts = selectedMember.fullName.trim().split(' ')
    return parts[parts.length - 1]
  }, [selectedMember])

  // Submit evaluation for current member
  const handleSubmitEvaluation = () => {
    if (!selectedMember) return

    if (!currentRating || currentRating === 0) {
      setToastMessage('Vui lòng chọn mức đánh giá từ 1 đến 5!')
      setTimeout(() => setToastMessage(null), 3000)
      return
    }

    const newEvaluation: SurveyEvaluation = {
      targetMemberCode: selectedMember.memberCode,
      targetMemberName: selectedMember.fullName,
      targetMemberDept: selectedMember.departmentName,
      targetMemberRole: `${selectedMember.position} - ${selectedMember.departmentName}`,
      avatarUrl: selectedMember.avatarUrl,
      initials: selectedMember.initials,
      rating: currentRating,
      feedback: currentFeedback.trim(),
      improvement: currentImprovement.trim(),
      status: 'completed',
      updatedAt: new Date().toISOString(),
    }

    const updated = {
      ...evaluations,
      [selectedMember.memberCode]: newEvaluation,
    }

    setEvaluations(updated)
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated))
    } catch (e) {
      console.error(e)
    }

    setToastMessage(`Đã nộp đánh giá cho ${selectedMember.fullName}!`)
    setTimeout(() => setToastMessage(null), 3000)

    // Find next unevaluated member in list
    const currentIndex = targetMembers.findIndex(
      (m) => m.memberCode === selectedMember.memberCode
    )
    const nextMember =
      targetMembers
        .slice(currentIndex + 1)
        .find((m) => updated[m.memberCode]?.status !== 'completed') ||
      targetMembers.find((m) => updated[m.memberCode]?.status !== 'completed')

    if (nextMember) {
      handleSelectMember(nextMember.memberCode)
    } else {
      setShowSuccessModal(true)
    }
  }

  // Skip current member
  const handleSkip = () => {
    if (!selectedMember) return
    const currentIndex = targetMembers.findIndex(
      (m) => m.memberCode === selectedMember.memberCode
    )
    const nextMember = targetMembers[currentIndex + 1] || targetMembers[0]
    if (nextMember) {
      handleSelectMember(nextMember.memberCode)
      setToastMessage(`Đã chuyển sang ${nextMember.fullName}`)
      setTimeout(() => setToastMessage(null), 2500)
    }
  }

  // Carousel auto-scroll & manual navigation state
  const carouselRef = useRef<HTMLDivElement>(null)
  const firstSetRef = useRef<HTMLDivElement>(null)
  const [isCarouselHovered, setIsCarouselHovered] = useState<boolean>(false)
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState<boolean>(true)

  // Smooth continuous infinite circular loop (1 vòng tròn lặp đi lặp lại vô tận)
  useEffect(() => {
    if (!isAutoScrollEnabled) return
    const container = carouselRef.current
    if (!container) return

    let animationFrameId: number
    let lastTime: number | null = null

    const animateScroll = (time: number) => {
      if (!lastTime) lastTime = time
      const delta = time - lastTime
      lastTime = time

      if (!isCarouselHovered && container) {
        // Continuous smooth linear motion ~34px per second
        const step = (34 * delta) / 1000
        const singleSetWidth = firstSetRef.current?.offsetWidth || 0

        if (singleSetWidth > 0) {
          container.scrollLeft += step
          // Vòng lặp tròn vô tận: khi cuộn hết 1 set, trừ đúng singleSetWidth (hoàn toàn liền mạch không giật)
          if (container.scrollLeft >= singleSetWidth) {
            container.scrollLeft -= singleSetWidth
          }
        }
      }

      animationFrameId = requestAnimationFrame(animateScroll)
    }

    animationFrameId = requestAnimationFrame(animateScroll)
    return () => cancelAnimationFrame(animationFrameId)
  }, [isAutoScrollEnabled, isCarouselHovered])

  // Scroll manually via Left / Right buttons with infinite wrap support
  const handleScrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return
    const container = carouselRef.current
    const singleSetWidth = firstSetRef.current?.offsetWidth || 0
    const scrollAmount = 260

    if (direction === 'left' && container.scrollLeft <= 20 && singleSetWidth > 0) {
      container.scrollLeft += singleSetWidth
    }

    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  // Select member and smoothly center them into view
  const handleSelectMember = (memberCode: string) => {
    setSelectedMemberCode(memberCode)
    const cardEl = document.getElementById(`member-card-${memberCode}`)
    if (cardEl) {
      cardEl.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      })
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Khảo sát Core Team sự kiện iSSAC
            </h1>
            <div className="relative w-8 h-10 sm:w-9 sm:h-11 shrink-0 -mt-1.5">
              <Image
                src="/member-mascot.png"
                alt="iSSAC Core Team Mascot"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Nơi ghi nhận góp ý để cải thiện chất lượng tổ chức và phối hợp trong các sự kiện của CLB.
          </p>
        </div>
      </div>

      {/* 2. EVENT & STATUS BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 px-5 py-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Event selector & Live status grouped logically together */}
        <div className="flex items-center gap-3 sm:gap-3.5 flex-wrap">
          <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            Sự kiện khảo sát
          </span>
          <div className="relative" ref={eventDropdownRef}>
            <button
              type="button"
              onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
              className="px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm flex items-center gap-2.5 shadow-2xs transition-colors cursor-pointer"
            >
              <span>{selectedEvent}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {isEventDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                {EVENT_OPTIONS.map((event) => (
                  <button
                    key={event}
                    type="button"
                    onClick={() => {
                      setSelectedEvent(event)
                      setIsEventDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between hover:bg-blue-50 dark:hover:bg-slate-750 transition-colors ${
                      selectedEvent === event
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-slate-700'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{event}</span>
                    {selectedEvent === event && (
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Divider between Event and Live Status */}
          <div className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-slate-700" />

          {/* Live indicator badge */}
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Đang mở khảo sát</span>
          </span>
        </div>

        {/* Right: Evaluated count & progress badge */}
        <div className="flex items-center self-end md:self-auto">
          <span className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-bold bg-blue-50/90 dark:bg-blue-950/40 text-[#0B63E5] dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 shadow-2xs">
            <Users className="w-4 h-4 text-[#0B63E5] dark:text-blue-400 shrink-0" />
            <span>
              Đã đánh giá:{' '}
              <strong className="font-black text-blue-900 dark:text-blue-100">
                {completedCount}/{totalTargetCount}
              </strong>{' '}
              Core Team
            </span>
            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-[10px] font-black text-[#0B63E5] dark:text-blue-200">
              {Math.round((completedCount / Math.max(totalTargetCount, 1)) * 100)}%
            </span>
          </span>
        </div>
      </div>

      {/* 3. HORIZONTAL MEMBER BAR / CAROUSEL (Tự động cuộn / Auto-scroll) */}
      <div
        className="relative group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 sm:p-4 shadow-sm"
        onMouseEnter={() => setIsCarouselHovered(true)}
        onMouseLeave={() => setIsCarouselHovered(false)}
      >
        {/* Navigation Button Left */}
        <button
          type="button"
          onClick={() => handleScrollCarousel('left')}
          className="absolute -left-3 sm:left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-blue-50 hover:text-[#0B63E5] hover:scale-105 transition-all cursor-pointer"
          title="Cuộn sang trái"
          aria-label="Cuộn sang trái"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Navigation Button Right */}
        <button
          type="button"
          onClick={() => handleScrollCarousel('right')}
          className="absolute -right-3 sm:right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-blue-50 hover:text-[#0B63E5] hover:scale-105 transition-all cursor-pointer"
          title="Cuộn sang phải"
          aria-label="Cuộn sang phải"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Subtle Fade Edge Gradients */}
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white dark:from-slate-900 to-transparent pointer-events-none z-10 rounded-l-2xl" />
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white dark:from-slate-900 to-transparent pointer-events-none z-10 rounded-r-2xl" />

        {/* Auto-scroll status pill in the corner */}
        <div className="absolute top-2 right-4 z-20 hidden group-hover:flex items-center gap-1.5 transition-opacity">
          <button
            type="button"
            onClick={() => setIsAutoScrollEnabled(!isAutoScrollEnabled)}
            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#0B63E5] shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
          >
            {isAutoScrollEnabled ? (
              <>
                <Pause className="w-2.5 h-2.5" />
                <span>Tạm dừng chạy</span>
              </>
            ) : (
              <>
                <Play className="w-2.5 h-2.5" />
                <span>Tiếp tục chạy</span>
              </>
            )}
          </button>
        </div>

        {/* Scrollable container for infinite circular loop */}
        <div
          ref={carouselRef}
          onTouchStart={() => setIsCarouselHovered(true)}
          onTouchEnd={() => setTimeout(() => setIsCarouselHovered(false), 2000)}
          className="flex items-center overflow-x-auto pb-1 px-4 sm:px-6 no-scrollbar select-none"
        >
          {/* Loop Set 0, 1, 2 for seamless infinite circle */}
          {[0, 1, 2].map((setIndex) => (
            <div
              key={`set-${setIndex}`}
              ref={setIndex === 0 ? firstSetRef : undefined}
              className="flex items-center gap-2.5 sm:gap-4 shrink-0 pr-2.5 sm:pr-4"
            >
              {targetMembers.map((member) => {
                const isSelected = member.memberCode === selectedMember?.memberCode
                const isEvaluated =
                  evaluations[member.memberCode]?.status === 'completed'

                return (
                  <button
                    key={`${member.memberCode}-set-${setIndex}`}
                    id={setIndex === 0 ? `member-card-${member.memberCode}` : undefined}
                    type="button"
                    onClick={() => handleSelectMember(member.memberCode)}
                    className={`relative flex flex-col items-center justify-center p-3 rounded-2xl min-w-[115px] sm:min-w-[130px] shrink-0 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-2 border-[#0B63E5] bg-blue-50/80 dark:bg-blue-950/50 shadow-xs'
                        : isEvaluated
                        ? 'border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/25 hover:bg-emerald-50/70'
                        : 'border border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {/* Corner checkmark on the CARD (completely away from avatar) */}
                    {isEvaluated && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}

                    {/* Avatar with clean outline / ring, completely unblocked */}
                    <div
                      className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden flex items-center justify-center mb-1.5 shadow-xs transition-all ${
                        isEvaluated
                          ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                          : 'border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {member.avatarUrl ? (
                        <Image
                          src={member.avatarUrl}
                          alt={member.fullName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div
                          className={`w-full h-full flex items-center justify-center font-bold text-sm ${
                            member.initialBg || 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {member.initials}
                        </div>
                      )}
                    </div>

                    {/* Member Name (2 lines without cutting off) */}
                    <span
                      className={`text-xs font-bold text-center leading-tight line-clamp-2 h-7.5 flex items-center justify-center max-w-[105px] ${
                        isSelected
                          ? 'text-[#0B63E5] dark:text-blue-400'
                          : isEvaluated
                          ? 'text-emerald-950 dark:text-emerald-200'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {member.fullName}
                    </span>

                    {/* Status Pill Badge: completely distinct and easy to recognize */}
                    {isEvaluated ? (
                      <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        <span>Đã đánh giá</span>
                      </span>
                    ) : (
                      <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100/80 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-slate-700/60">
                        <span>Chưa đánh giá</span>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 4. MAIN 2-COLUMN SECTION: Left Member Info (~40%) : Right Survey Form (~60%) */}
      {selectedMember ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
          {/* LEFT: Thông tin thành viên được đánh giá */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            {/* Title */}
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Thông tin thành viên được đánh giá
            </h3>

            {/* Profile Section (Vertically centered to eliminate empty gap) */}
            <div className="my-auto py-5 sm:py-6 flex items-center gap-4 sm:gap-5">
              {/* Large Avatar */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-slate-200/80 dark:border-slate-700 bg-purple-100 dark:bg-purple-950/40 shrink-0 shadow-xs flex items-center justify-center">
                {selectedMember.avatarUrl ? (
                  <Image
                    src={selectedMember.avatarUrl}
                    alt={selectedMember.fullName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-3xl text-purple-700 dark:text-purple-300">
                    {selectedMember.initials}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="min-w-0 space-y-2">
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                  {selectedMember.fullName}
                </h4>

                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                  <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {formatMemberPosition(selectedMember.position, selectedMember.departmentName)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {selectedMember.email}
                  </span>
                </div>

                <div className="pt-0.5">
                  <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-[#0B63E5] dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                    {selectedMember.departmentName.replace('Ban ', '')}
                  </span>
                </div>
              </div>
            </div>

            {/* 2 Mini Stat Boxes at bottom */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2">
              {/* Stat 1: Lượt đánh giá */}
              <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-[#0B63E5] flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-2xl font-black text-slate-900 dark:text-white block leading-none py-0.5">
                    {selectedMember.reviewsCount || 3}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                    lượt đánh giá
                  </span>
                </div>
              </div>

              {/* Stat 2: Điểm TB */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 fill-emerald-600" />
                </div>
                <div>
                  <span className="text-2xl font-black text-slate-900 dark:text-white block leading-none py-0.5">
                    {selectedMember.averageScore
                      ? `${selectedMember.averageScore.toFixed(1)}/5`
                      : '4.0/5'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                    điểm TB
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Phiếu khảo sát sau sự kiện */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Phiếu khảo sát sau sự kiện
            </h3>

            {/* Question 1: Rating */}
            <div className="space-y-2">
              <label className="text-sm sm:text-[14.5px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <span className="text-red-500 font-bold">*</span>
                <span>
                  Sau sự kiện, bạn đánh giá {memberFirstName} thế nào?
                </span>
              </label>

              {/* 5 Rating buttons */}
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {RATING_OPTIONS.map((opt) => {
                  const isSelected = currentRating === opt.score
                  return (
                    <button
                      key={opt.score}
                      type="button"
                      onClick={() => setCurrentRating(opt.score)}
                      className={`py-2.5 sm:py-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0B63E5] border-[#0B63E5] text-white shadow-md shadow-blue-500/25'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mb-1 transition-colors ${
                          isSelected
                            ? 'bg-white text-[#0B63E5]'
                            : 'border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {opt.score}
                      </div>
                      <span
                        className={`text-xs font-bold ${
                          isSelected
                            ? 'text-white'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {opt.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Question 2: Feedback */}
            <div className="space-y-1.5">
              <label className="text-sm sm:text-[14.5px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <span className="text-red-500 font-bold">*</span>
                <span>Vài lời nhận xét về {memberFirstName}</span>
              </label>
              <textarea
                value={currentFeedback}
                onChange={(e) => setCurrentFeedback(e.target.value)}
                rows={2}
                placeholder={`Nhập nhận xét của bạn về ${memberFirstName} sau sự kiện...`}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-400 min-h-[64px] resize-y"
              />
            </div>

            {/* Question 3: Improvement */}
            <div className="space-y-1.5">
              <label className="text-sm sm:text-[14.5px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <span className="text-red-500 font-bold">*</span>
                <span>Mong muốn cải thiện gì?</span>
              </label>
              <textarea
                value={currentImprovement}
                onChange={(e) => setCurrentImprovement(e.target.value)}
                rows={2}
                placeholder={`Bạn mong muốn ${memberFirstName} có thể cải thiện thêm điều gì trong các sự kiện tới?...`}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-400 min-h-[64px] resize-y"
              />
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={handleSkip}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-95"
              >
                Bỏ qua
              </button>

              <button
                type="button"
                onClick={handleSubmitEvaluation}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0B63E5] hover:bg-[#0954C3] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Nộp khảo sát</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
          Không tìm thấy thành viên Core Team nào để đánh giá.
        </div>
      )}

      {/* 5. LƯU Ý KHẢO SÁT BANNER */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 text-[#0B63E5] flex items-center justify-center shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
            Lưu ý khảo sát
          </span>
        </div>

        <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700" />

        <ul className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-1">
          <li className="flex items-center gap-2">
            <span className="text-[#0B63E5] font-black">•</span>
            <span>Đánh giá mang tính xây dựng</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[#0B63E5] font-black">•</span>
            <span>Thông tin dùng để cải thiện phối hợp nội bộ</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[#0B63E5] font-black">•</span>
            <span>Mỗi sự kiện chỉ gửi một lần</span>
          </li>
        </ul>
      </div>

      {/* TOAST MESSAGE */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-200">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs sm:text-sm font-semibold border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
              Hoàn thành tất cả đánh giá!
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Bạn đã gửi đánh giá cho toàn bộ thành viên Core Team trong sự kiện{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {selectedEvent}
              </strong>
              . Cảm ơn những đóng góp xây dựng của bạn cho CLB iSSAC!
            </p>
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 rounded-xl bg-[#0B63E5] hover:bg-[#0954C3] text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              Đóng và tiếp tục
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
