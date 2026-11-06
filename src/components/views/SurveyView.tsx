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
  IdCard,
  GraduationCap,
  Calendar,
  Clock,
  BarChart3,
  Lock,
  ShieldAlert,
  ClipboardEdit,
  Eye,
} from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useClub } from '@/lib/context/ClubContext'
import { useLanguage } from '@/lib/context/LanguageContext'
import { BcnSurveyReportView } from '@/components/survey/BcnSurveyReportView'
import {
  saveNewSurveyFeedback,
  getStoredSurveyEvents,
  SurveyEventItem,
  CORE_EVALUATION_CRITERIA,
  getStoredCustomQuestions,
  SurveyQuestionItem,
} from '@/lib/surveyData'

// Quotes for survey mascot speech bubble
const SURVEY_MASCOT_QUOTES_VI = [
  'Đánh giá công tâm, cùng nhau tiến bộ nhé! ✨',
  'Mỗi góp ý của bạn là một bước phát triển của iSSAC! 💙',
  'Khảo sát Core Team giúp sự kiện sau bùng nổ hơn! 🚀',
  'Cùng xây dựng iSSAC đoàn kết và vững mạnh nha! 🌟',
  'Đừng quên gửi phiếu khảo sát cho tất cả Core Team nhé! 📋',
  'Cảm ơn bạn đã luôn nhiệt huyết cùng CLB! 🔥',
]

const SURVEY_MASCOT_QUOTES_EN = [
  'Fair evaluation, growing together! ✨',
  'Your feedback makes iSSAC even better! 💙',
  'Core Team survey helps next events shine! 🚀',
  'Building a united and strong iSSAC! 🌟',
  'Remember to submit surveys for all Core Team! 📋',
  'Thank you for your passion with iSSAC! 🔥',
]

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
  studentId?: string
  className?: string
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
  const { currentUser, isBCN, switchUser } = useAuth()
  const { members } = useClub()
  const { language } = useLanguage()

  // Navigation mode: 'survey' (phiếu đánh giá) vs 'bcn_report' (báo cáo & feedback dành riêng cho BCN)
  const [viewMode, setViewMode] = useState<'survey' | 'bcn_report'>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search)
      if (p.get('mode') === 'bcn' || p.get('report') === 'true') {
        return 'bcn_report'
      }
    }
    return 'survey'
  })
  const [showBcnLockModal, setShowBcnLockModal] = useState<boolean>(false)

  // Mascot interaction & animated speech note state
  const [isMascotCheering, setIsMascotCheering] = useState<boolean>(false)
  const [showMascotBubble, setShowMascotBubble] = useState<boolean>(false)
  const [mascotMessageIdx, setMascotMessageIdx] = useState<number>(0)
  const bubbleTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMascotClick = () => {
    setIsMascotCheering(true)
    setShowMascotBubble(true)
    setMascotMessageIdx((prev) => (prev + 1) % SURVEY_MASCOT_QUOTES_VI.length)
    setTimeout(() => setIsMascotCheering(false), 850)

    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current)
    bubbleTimeoutRef.current = setTimeout(() => {
      setShowMascotBubble(false)
    }, 2800)
  }

  useEffect(() => {
    return () => {
      if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current)
    }
  }, [])

  // Selected event & dynamic events list from BCN management
  const [selectedEvent, setSelectedEvent] = useState<string>('1st Meeting')
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState<boolean>(false)
  const eventDropdownRef = useRef<HTMLDivElement>(null)

  const [surveyEvents, setSurveyEvents] = useState<SurveyEventItem[]>(() =>
    getStoredSurveyEvents()
  )

  useEffect(() => {
    const handleStorage = () => {
      setSurveyEvents(getStoredSurveyEvents())
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const eventOptions = useMemo(() => {
    const names = surveyEvents.map((e) => e.name)
    return names.length > 0 ? names : ['1st Meeting']
  }, [surveyEvents])

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
        studentId: (m as unknown as { student_id?: string }).student_id || m.member_code,
        className: (m as unknown as { class_name?: string }).class_name,
        fullName: m.full_name,
        departmentName: m.department_name,
        position: m.position,
        avatarUrl: m.avatar_url,
        initials: m.full_name.trim().split(' ').pop()?.[0]?.toUpperCase() || 'M',
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

  // Form input state: 4 Core Criteria (Trách nhiệm, Thực thi, Phối hợp, Sáng tạo)
  const [criteriaScores, setCriteriaScores] = useState<{
    responsibility: number
    taskDelivery: number
    collaboration: number
    initiative: number
  }>({
    responsibility: 5,
    taskDelivery: 5,
    collaboration: 5,
    initiative: 5,
  })

  // Calculated overall average score from 4 core criteria
  const calculatedAvgScore = useMemo(() => {
    const sum =
      criteriaScores.responsibility +
      criteriaScores.taskDelivery +
      criteriaScores.collaboration +
      criteriaScores.initiative
    return Number((sum / 4).toFixed(1))
  }, [criteriaScores])

  const [currentRating, setCurrentRating] = useState<number>(5)
  const [currentFeedback, setCurrentFeedback] = useState<string>('')
  const [currentImprovement, setCurrentImprovement] = useState<string>('')

  // Custom questions for this event configured by BCN
  const [customQuestions, setCustomQuestions] = useState<SurveyQuestionItem[]>(() =>
    getStoredCustomQuestions(selectedEvent)
  )
  const [customAnswers, setCustomAnswers] = useState<Record<string, string | number>>({})

  useEffect(() => {
    setCustomQuestions(getStoredCustomQuestions(selectedEvent))
  }, [selectedEvent])

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
      // Nếu đã hoàn thành nộp rồi thì không nạp lại dữ liệu cũ vào ô nhập (bảo mật tuyệt đối, không cho xem lại)
      if (existing && existing.status !== 'completed') {
        setCurrentRating(existing.rating || 5)
        setCurrentFeedback(existing.feedback || '')
        setCurrentImprovement(existing.improvement || '')
      } else {
        setCurrentRating(5)
        setCriteriaScores({
          responsibility: 5,
          taskDelivery: 5,
          collaboration: 5,
          initiative: 5,
        })
        setCurrentFeedback('')
        setCurrentImprovement('')
        setCustomAnswers({})
      }
    }
  }, [selectedMemberCode, evaluations, selectedMember])

  // Trạng thái thành viên đang chọn đã nộp đánh giá hay chưa
  const isSelectedMemberCompleted = Boolean(
    selectedMember && evaluations[selectedMember.memberCode]?.status === 'completed'
  )

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
      rating: calculatedAvgScore,
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

    // Đồng thời lưu vào kho dữ liệu đánh giá chéo dành riêng cho Ban Chủ nhiệm xem báo cáo
    try {
      saveNewSurveyFeedback({
        id: `fb-sub-${Date.now()}-${selectedMember.memberCode}`,
        event: selectedEvent,
        targetMemberCode: selectedMember.memberCode,
        targetMemberName: selectedMember.fullName,
        targetDepartment: selectedMember.departmentName,
        targetPosition: selectedMember.position,
        targetAvatarUrl: selectedMember.avatarUrl,
        evaluatorMemberCode: currentUser?.memberCode || 'eval-user',
        evaluatorName: currentUser?.name || 'Thành viên CLB',
        evaluatorDept: currentUser?.departmentName || 'Core Team',
        evaluatorRole:
          currentUser?.roleTitle ||
          (isBCN ? 'Ban Chủ nhiệm' : 'Thành viên CLB'),
        rating: calculatedAvgScore,
        feedback:
          currentFeedback.trim() ||
          'Thành viên hoàn thành tốt nhiệm vụ được giao, nhiệt tình hỗ trợ sự kiện.',
        improvement:
          currentImprovement.trim() ||
          'Tiếp tục duy trì tinh thần trách nhiệm và chủ động trong các hoạt động tiếp theo.',
        criteriaScores: {
          responsibility: criteriaScores.responsibility,
          taskDelivery: criteriaScores.taskDelivery,
          collaboration: criteriaScores.collaboration,
          initiative: criteriaScores.initiative,
        },
        submittedAt: new Date().toISOString(),
      })
    } catch (saveErr) {
      console.error('Failed to sync feedback to BCN storage', saveErr)
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
      {/* 1. HEADER SECTION & MODE SWITCHER TABS (Góc bên phải) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/90 dark:border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#061651] dark:text-white tracking-tight leading-tight">
              Khảo sát Core Team sự kiện iSSAC
            </h1>

            {/* Mascot Chibi với hiệu ứng động tương tác & note thoại như các trang khác */}
            <div
              onClick={handleMascotClick}
              className="relative group cursor-pointer inline-flex items-center shrink-0 select-none -mt-1.5"
              title="Bấm vào tớ để nghe lời nhắn nhé!"
            >
              {/* Ảnh Mascot với hiệu ứng bay bổng tự nhiên & nhào lộn vui nhộn khi click */}
              <img
                src="/survey-mascot.png"
                alt="iSSAC Core Team Mascot"
                className={`w-11 h-14 sm:w-13 sm:h-16 object-contain drop-shadow-[0_4px_12px_rgba(2,132,199,0.22)] transition-all duration-300 ${
                  isMascotCheering
                    ? 'animate-mascot-pop drop-shadow-[0_8px_20px_rgba(2,132,199,0.45)]'
                    : 'animate-mascot-fly hover:scale-120 hover:rotate-6'
                }`}
              />

              {/* Note / Bubble tooltip động đặt bên cạnh mascot */}
              <div
                className={`absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#0369A1] text-white text-[11px] font-bold shadow-lg pointer-events-none whitespace-nowrap z-40 transition-all duration-200 hidden sm:flex items-center border border-white/25 ${
                  showMascotBubble || isMascotCheering
                    ? 'opacity-100 scale-105 translate-x-1'
                    : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
                }`}
              >
                {/* Mũi tên chỉ về phía mascot */}
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#0284C7] rotate-45 border-l border-b border-white/25" />
                <span className="relative z-10 select-none tracking-tight">
                  {language === 'vi'
                    ? SURVEY_MASCOT_QUOTES_VI[mascotMessageIdx]
                    : SURVEY_MASCOT_QUOTES_EN[mascotMessageIdx]}
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs sm:text-[13px] text-[#64748B] dark:text-slate-400 mt-1 font-normal">
            Nơi ghi nhận góp ý để cải thiện chất lượng tổ chức và phối hợp trong các sự kiện của CLB
          </p>
        </div>

        {/* Mode Switcher Tabs đặt ở góc bên phải */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shrink-0 self-start md:self-center">
          <button
            type="button"
            onClick={() => setViewMode('survey')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              viewMode === 'survey'
                ? 'bg-[#0284C7] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ClipboardEdit className="w-4 h-4" />
            <span>Phiếu khảo sát sự kiện</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isBCN) {
                setViewMode('bcn_report')
              } else {
                setShowBcnLockModal(true)
              }
            }}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer relative ${
              viewMode === 'bcn_report'
                ? 'bg-[#0284C7] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Báo cáo đánh giá Core Team</span>
            {!isBCN && (
              <Lock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
            )}
          </button>
        </div>
      </div>

      {viewMode === 'bcn_report' ? (
        <BcnSurveyReportView
          selectedEvent={selectedEvent}
          onSelectEvent={(evt) => setSelectedEvent(evt)}
          onSwitchToSurvey={() => setViewMode('survey')}
        />
      ) : (
        <>
          {/* 3. EVENT & STATUS BAR */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 px-5 py-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Event selector & Live status grouped logically together */}
            <div className="flex items-center gap-3 sm:gap-3.5 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-[#061651] dark:text-slate-200 whitespace-nowrap">
            Sự kiện khảo sát
          </span>
          <div className="relative" ref={eventDropdownRef}>
            <button
              type="button"
              onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
              className="px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-[#061651] dark:text-slate-100 font-bold text-xs sm:text-sm flex items-center gap-2.5 shadow-2xs transition-colors cursor-pointer"
            >
              <span>{selectedEvent}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {isEventDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                {eventOptions.map((event) => (
                  <button
                    key={event}
                    type="button"
                    onClick={() => {
                      setSelectedEvent(event)
                      setIsEventDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between hover:bg-sky-50 dark:hover:bg-slate-750 transition-colors ${
                      selectedEvent === event
                        ? 'text-[#0284C7] dark:text-sky-400 bg-sky-50/60 dark:bg-slate-700 font-bold'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{event}</span>
                    {selectedEvent === event && (
                      <Check className="w-3.5 h-3.5 text-[#0284C7]" />
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
          {completedCount === totalTargetCount ? (
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Đã nộp toàn bộ:{' '}
                <strong className="font-black text-emerald-800 dark:text-emerald-200">
                  {completedCount}/{totalTargetCount}
                </strong>{' '}
                Core Team
              </span>
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-[10px] font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" /> 100%
              </span>
            </span>
          ) : (
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
          )}
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
                          : 'text-[#061651] dark:text-slate-200'
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
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-3.5">
            {/* Header with Title: Căn chuẩn ngang hàng tuyệt đối với cột phiếu khảo sát */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 min-h-[42px]">
              <h3 className="text-base sm:text-lg font-black text-[#061651] dark:text-white leading-snug">
                Thông tin thành viên được đánh giá
              </h3>
            </div>

            {/* Profile Hero Box with clean background container */}
            <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/80 flex items-center gap-4 sm:gap-4.5">
              {/* Large Avatar */}
              <div className="relative w-22 h-22 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-white dark:border-slate-700 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-slate-800 dark:to-slate-700 shrink-0 shadow-xs flex items-center justify-center">
                {selectedMember.avatarUrl ? (
                  <Image
                    src={selectedMember.avatarUrl}
                    alt={selectedMember.fullName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-2xl text-blue-700 dark:text-blue-300">
                    {selectedMember.initials}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1 space-y-1">
                <h4 className="text-lg sm:text-xl font-black text-[#061651] dark:text-white leading-tight truncate">
                  {selectedMember.fullName}
                </h4>

                <div className="flex items-center gap-2 text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 font-medium">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {formatMemberPosition(selectedMember.position, selectedMember.departmentName)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 font-medium">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {selectedMember.email}
                  </span>
                </div>

                <div className="pt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/60 text-[#0B63E5] dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                    {selectedMember.departmentName.replace('Ban ', '')}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800">
                    Core Team
                  </span>
                </div>
              </div>
            </div>

            {/* Context & Metadata Grid (Fills the card meaningfully, balanced and cohesive) */}
            <div className="grid grid-cols-2 gap-2.5 bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl p-3 sm:p-3.5 border border-slate-100 dark:border-slate-800/80 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100/70 dark:bg-blue-900/40 text-[#0B63E5] flex items-center justify-center shrink-0">
                  <IdCard className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                    Mã số / MSSV
                  </span>
                  <span className="font-bold text-[#061651] dark:text-slate-200 block truncate">
                    {selectedMember.studentId || selectedMember.memberCode}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100/70 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                    Chi đoàn / Lớp
                  </span>
                  <span className="font-bold text-[#061651] dark:text-slate-200 block truncate">
                    {selectedMember.className || 'Khóa 2024'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100/70 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                    Sự kiện khảo sát
                  </span>
                  <span className="font-bold text-[#0B63E5] dark:text-blue-400 block truncate">
                    {selectedEvent}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    evaluations[selectedMember.memberCode]?.status === 'completed'
                      ? 'bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-100/70 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {evaluations[selectedMember.memberCode]?.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                    Trạng thái của bạn
                  </span>
                  <span
                    className={`font-bold block truncate ${
                      evaluations[selectedMember.memberCode]?.status === 'completed'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {evaluations[selectedMember.memberCode]?.status === 'completed'
                      ? 'Đã nộp đánh giá'
                      : 'Chưa đánh giá'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2 Mini Stat Boxes at bottom */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Stat 1: Lượt đánh giá */}
              <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-[#0B63E5] flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-2xl font-black text-[#061651] dark:text-white block leading-none py-0.5">
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
                  <span className="text-2xl font-black text-[#061651] dark:text-white block leading-none py-0.5">
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

            {/* Lưu ý khảo sát: Lấp đầy góc dưới cột thông tin giúp giao diện cân đối và hài hòa */}
            <div className="bg-blue-50/50 dark:bg-slate-800/60 rounded-2xl p-3 sm:p-3.5 border border-blue-100/80 dark:border-slate-700/80 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#0284C7] dark:text-sky-400 flex items-center justify-center shrink-0">
                  <Info className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-[#061651] dark:text-white">
                  Lưu ý khảo sát
                </span>
              </div>
              <ul className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 space-y-1 font-medium pl-1">
                <li className="flex items-center gap-1.5">
                  <span className="text-[#0284C7] dark:text-sky-400 font-black">•</span>
                  <span>Đánh giá mang tính xây dựng</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-[#0284C7] dark:text-sky-400 font-black">•</span>
                  <span>Thông tin dùng để cải thiện phối hợp nội bộ</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-[#0284C7] dark:text-sky-400 font-black">•</span>
                  <span>Mỗi sự kiện chỉ gửi một lần</span>
                </li>
              </ul>
            </div>
          </div>

          {/* RIGHT: Phiếu khảo sát sau sự kiện (Trạng thái Đã Nộp & Khóa Bảo Mật HOẶC Form Điền Mới) */}
          {isSelectedMemberCompleted ? (
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 min-h-[42px]">
                <h3 className="text-base sm:text-lg font-black text-[#061651] dark:text-white leading-snug">
                  Phiếu khảo sát sau sự kiện
                </h3>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Đã nộp & Khóa bảo mật</span>
                </span>
              </div>

              {/* Locked Notice Box: Circular icon badge, unbolded text, and even margins on both sides */}
              <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800/80 flex items-start gap-4 sm:gap-4.5 shadow-2xs">
                <div className="w-11 h-11 rounded-full border border-sky-300 dark:border-sky-500/60 bg-sky-50/50 dark:bg-sky-950/40 text-[#0284C7] dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-5 h-5 stroke-[2]" />
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <h4 className="text-base sm:text-lg font-bold text-[#061651] dark:text-white">
                    Phiếu đánh giá cho {selectedMember.fullName} đã được nộp
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed text-justify [text-justify:inter-word] [text-align-last:left]">
                    Theo quy chế bảo mật khảo sát nội bộ của CLB iSSAC, sau khi đã hoàn tất nộp đánh giá, dữ liệu được chuyển thẳng vào cơ sở dữ liệu bảo mật của Ban Chủ nhiệm. Bạn không thể xem lại điểm số, nhận xét đã gửi hay chỉnh sửa nhằm đảm bảo tính bảo mật và công tâm tuyệt đối.
                  </p>
                </div>
              </div>

              {/* Bottom Navigation */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-3 flex-wrap">
                <div>
                  {completedCount === totalTargetCount ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Đã hoàn tất tất cả {totalTargetCount} thành viên</span>
                    </span>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-[#0284C7] shrink-0" />
                      <span>Đã hoàn thành: <strong className="font-extrabold text-[#061651] dark:text-white">{completedCount}/{totalTargetCount}</strong> thành viên</span>
                    </div>
                  )}
                </div>

                {/* If next unevaluated member exists, show button to jump to them */}
                {(() => {
                  const nextUnevaluated = targetMembers.find(
                    (m) => evaluations[m.memberCode]?.status !== 'completed'
                  )
                  if (nextUnevaluated) {
                    return (
                      <button
                        type="button"
                        onClick={() => handleSelectMember(nextUnevaluated.memberCode)}
                        className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs sm:text-[13px] font-semibold shadow-sm hover:shadow-md hover:shadow-sky-500/20 transition-all cursor-pointer active:scale-95"
                      >
                        <span>Đánh giá tiếp: <strong className="font-black text-white">{nextUnevaluated.fullName}</strong></span>
                        <ChevronRight className="w-4 h-4 stroke-[2.5] transition-transform duration-200 group-hover:translate-x-1" />
                      </button>
                    )
                  }
                  return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Khảo sát đã hoàn tất</span>
                    </span>
                  )
                })()}
              </div>
            </div>
          ) : (
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5 min-h-[42px]">
                <h3 className="text-base sm:text-lg font-black text-[#061651] dark:text-white leading-snug">
                  Phiếu khảo sát sau sự kiện
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-sky-50 dark:bg-sky-950/50 text-[#0284C7] dark:text-sky-300 border border-sky-200/80">
                  Điểm TB: {calculatedAvgScore} / 5.0
                </span>
              </div>

              {/* 1. Bộ 4 Tiêu chí Cốt lõi (Trách nhiệm, Thực thi, Phối hợp, Sáng tạo - Khớp Ảnh 2) */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs sm:text-sm font-bold text-[#061651] dark:text-slate-200 flex items-center gap-1.5">
                    <span className="text-red-500 font-bold">*</span>
                    <span>Chấm điểm 4 Tiêu chí Cốt lõi của {memberFirstName}:</span>
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Bấm chọn thang điểm 1 đến 5 sao cho từng tiêu chí cốt lõi của CLB iSSAC
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CORE_EVALUATION_CRITERIA.map((crit) => {
                    const score = criteriaScores[crit.key]
                    return (
                      <div
                        key={crit.key}
                        className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {crit.shortLabel}
                          </span>
                          <span className="text-xs font-black text-[#0284C7]">
                            {score}.0
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1">
                          {crit.description}
                        </p>
                        <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() =>
                                setCriteriaScores((prev) => ({
                                  ...prev,
                                  [crit.key]: star,
                                }))
                              }
                              className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                                score === star
                                  ? 'bg-[#0284C7] text-white shadow-2xs'
                                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-600 border border-slate-200/80 dark:border-slate-600'
                              }`}
                            >
                              <span>{star}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 2 & 3. Nhận xét tự luận & Mong muốn cải thiện (Bố cục 2 cột cân đối, hài hòa với cột thông tin) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-0.5">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-[13px] font-bold text-[#061651] dark:text-slate-200 flex items-center gap-1">
                    <span className="text-red-500 font-bold">*</span>
                    <span>Vài lời nhận xét về {memberFirstName}</span>
                  </label>
                  <textarea
                    value={currentFeedback}
                    onChange={(e) => setCurrentFeedback(e.target.value)}
                    rows={2}
                    placeholder={`Nhập nhận xét của bạn về ${memberFirstName} sau sự kiện...`}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#061651] dark:text-slate-100 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all placeholder:text-slate-400 min-h-[58px] resize-y"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-[13px] font-bold text-[#061651] dark:text-slate-200 flex items-center gap-1">
                    <span>Mong muốn cải thiện gì?</span>
                  </label>
                  <textarea
                    value={currentImprovement}
                    onChange={(e) => setCurrentImprovement(e.target.value)}
                    rows={2}
                    placeholder={`Bạn mong muốn ${memberFirstName} có thể cải thiện thêm điều gì trong các sự kiện tới?...`}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#061651] dark:text-slate-100 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all placeholder:text-slate-400 min-h-[58px] resize-y"
                  />
                </div>
              </div>

              {/* 4. Các câu hỏi mở rộng do BCN thiết lập riêng cho sự kiện (nếu có) */}
              {customQuestions.length > 0 && (
                <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-500 block">
                    Câu hỏi mở rộng của sự kiện:
                  </span>
                  {customQuestions.map((q) => (
                    <div key={q.id} className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                        {q.required && <span className="text-red-500">*</span>}
                        <span>{q.title}</span>
                      </label>
                      {q.description && (
                        <p className="text-[11px] text-slate-400">{q.description}</p>
                      )}
                      {q.type === 'textarea' ? (
                        <textarea
                          value={(customAnswers[q.id] as string) || ''}
                          onChange={(e) =>
                            setCustomAnswers((prev) => ({
                              ...prev,
                              [q.id]: e.target.value,
                            }))
                          }
                          rows={2}
                          placeholder="Nhập câu trả lời..."
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      ) : q.type === 'rating_stars' ? (
                        <div className="flex items-center gap-1.5 pt-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() =>
                                setCustomAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: star,
                                }))
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                                (customAnswers[q.id] || 5) === star
                                  ? 'bg-[#0284C7] text-white'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              <span>{star}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={(customAnswers[q.id] as string) || ''}
                          onChange={(e) =>
                            setCustomAnswers((prev) => ({
                              ...prev,
                              [q.id]: e.target.value,
                            }))
                          }
                          placeholder="Nhập câu trả lời ngắn..."
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-[#061651] dark:text-slate-200 font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  Bỏ qua
                </button>

                <button
                  type="button"
                  onClick={handleSubmitEvaluation}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/20 transition-all cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Nộp khảo sát</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
          Không tìm thấy thành viên Core Team nào để đánh giá.
        </div>
      )}

        </>
      )}

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
            <h3 className="text-xl font-black text-[#061651] dark:text-white mb-2">
              Hoàn thành tất cả đánh giá!
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Bạn đã gửi đánh giá cho toàn bộ thành viên Core Team trong sự kiện{' '}
              <strong className="text-[#061651] dark:text-slate-200">
                {selectedEvent}
              </strong>
              . Cảm ơn những đóng góp xây dựng của bạn cho CLB iSSAC!
            </p>
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-sm shadow-md shadow-sky-500/20 transition-all cursor-pointer"
            >
              Đóng và tiếp tục
            </button>
          </div>
        </div>
      )}

      {/* BCN ACCESS LOCK MODAL */}
      {showBcnLockModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-800">
              <Lock className="w-8 h-8" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/50 text-[#0284C7] dark:text-sky-300 text-xs font-black mb-3 border border-sky-200/80">
              <span>ĐẶC QUYỀN BAN CHỦ NHIỆM</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-[#061651] dark:text-white mb-2">
              Quyền truy cập bị giới hạn
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4 text-left bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              Theo quy định bảo mật khảo sát nội bộ của iSSAC, các phiếu đánh giá chéo giữa các thành viên, chi tiết góp ý sau sự kiện và biểu đồ xếp hạng hoạt động Core Team chỉ mở cho tài khoản <strong className="text-[#0284C7]">Ban Chủ nhiệm (BCN)</strong> nhằm đảm bảo tính khách quan và an tâm khi góp ý.
            </p>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-5 text-left">
              Tài khoản hiện tại: <strong className="text-slate-800 dark:text-slate-200">{currentUser?.name}</strong> ({currentUser?.roleTitle || 'Thành viên'}).
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowBcnLockModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Đã hiểu
              </button>
              {switchUser && (
                <button
                  type="button"
                  onClick={() => {
                    switchUser('user-hiep')
                    setShowBcnLockModal(false)
                    setViewMode('bcn_report')
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Xem quyền BCN</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
