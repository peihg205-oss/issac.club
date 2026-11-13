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
  Unlock,
  ShieldCheck,
  ShieldAlert,
  ClipboardEdit,
  Eye,
  Plus,
} from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import { isUserCoreTeam } from '@/lib/auth/permissions'
import { useClub } from '@/lib/context/ClubContext'
import { useLanguage } from '@/lib/context/LanguageContext'
import { BcnSurveyReportView } from '@/components/survey/BcnSurveyReportView'
import {
  saveNewSurveyFeedback,
  getStoredSurveyFeedbacks,
  getStoredSurveyEvents,
  updateSurveyEventStatus,
  SurveyEventItem,
  SurveyFeedbackItem,
  CORE_EVALUATION_CRITERIA,
  getStoredCustomQuestions,
  SurveyQuestionItem,
  isSurveyEventExpired,
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
export const INITIAL_CORE_EVALUATIONS: Record<string, SurveyEvaluation> = {}

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

  // Mascot interaction when clicked
  const [isMascotCheering, setIsMascotCheering] = useState<boolean>(false)

  const handleMascotClick = () => {
    setIsMascotCheering(true)
    setTimeout(() => setIsMascotCheering(false), 850)
  }

  // Selected event & dynamic events list from BCN management
  const [selectedEvent, setSelectedEvent] = useState<string>(() => {
    const events = getStoredSurveyEvents()
    const active = events.find((e) => e.status === 'active') || events[0]
    return active?.name || ''
  })
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState<boolean>(false)
  const eventDropdownRef = useRef<HTMLDivElement>(null)

  const [surveyEvents, setSurveyEvents] = useState<SurveyEventItem[]>(() =>
    getStoredSurveyEvents()
  )
  const [storedFeedbacks, setStoredFeedbacks] = useState<SurveyFeedbackItem[]>(() =>
    getStoredSurveyFeedbacks()
  )

  useEffect(() => {
    const handleStorage = () => {
      const latestEvents = getStoredSurveyEvents()
      setSurveyEvents(latestEvents)
      setStoredFeedbacks(getStoredSurveyFeedbacks())
      if (latestEvents.length > 0 && !latestEvents.some((e) => e.name === selectedEvent)) {
        const active = latestEvents.find((e) => e.status === 'active') || latestEvents[0]
        if (active) setSelectedEvent(active.name)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [selectedEvent])

  // Tự động đồng bộ sự kiện đang chọn nếu sự kiện hiện tại không còn trong danh sách
  useEffect(() => {
    if (surveyEvents.length > 0 && !surveyEvents.some((e) => e.name === selectedEvent)) {
      const active = surveyEvents.find((e) => e.status === 'active') || surveyEvents[0]
      if (active) setSelectedEvent(active.name)
    }
  }, [surveyEvents, selectedEvent])

  // Read event param from URL if provided
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const evtParam = params.get('event')
      if (evtParam) {
        setSelectedEvent(decodeURIComponent(evtParam))
      }
    }
  }, [])

  const eventOptions = useMemo(() => {
    return surveyEvents.map((e) => e.name)
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

  // Dynamic Storage key per event - Đảm bảo mỗi sự kiện có kho đánh giá và lịch sử riêng biệt
  const currentEventStorageKey = useMemo(() => {
    return `issac_survey_evaluations_v5_${encodeURIComponent(selectedEvent)}`
  }, [selectedEvent])

  // Chi tiết thông tin sự kiện hiện tại
  const currentEventItem = useMemo(() => {
    return surveyEvents.find((e) => e.name === selectedEvent) || null
  }, [surveyEvents, selectedEvent])

  // Kiểm tra thời hạn sự kiện (đã quá endDate hoặc status === 'closed')
  const isEventClosedOrExpired = useMemo(() => {
    if (!currentEventItem) return false
    return isSurveyEventExpired(currentEventItem)
  }, [currentEventItem])

  // Kiểm tra thành viên có thuộc Core Team (hoặc BCN) hay không
  // Yêu cầu: "thành viên core mới có thấy được và vào điền khảo sát"
  const isCoreUser = useMemo(() => isUserCoreTeam(currentUser, members), [currentUser, members])

  // Chỉ cho phép điền phiếu nếu là Core Team VÀ sự kiện còn hạn khảo sát
  const canSubmitSurvey = Boolean(isCoreUser && !isEventClosedOrExpired)

  // Lọc tất cả thành viên Core Team trong CLB, TRỪ Ban Chủ nhiệm và TRỪ người đang đánh giá nếu họ là core
  const targetMembers: SurveyTargetMember[] = useMemo(() => {
    // Lấy toàn bộ nhận xét đã nộp thuộc riêng sự kiện đang chọn
    const currentEventFeedbacks = storedFeedbacks.filter((f) => f.event === selectedEvent)

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
      .map((m) => {
        const memberReviews = currentEventFeedbacks.filter(
          (f) => f.targetMemberCode === m.member_code
        )
        const reviewsCount = memberReviews.length
        const totalRating = memberReviews.reduce((sum, r) => sum + r.rating, 0)
        const averageScore = reviewsCount > 0 ? Number((totalRating / reviewsCount).toFixed(1)) : 0

        return {
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
          reviewsCount,
          averageScore,
        }
      })
  }, [members, currentUser, storedFeedbacks, selectedEvent])

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
    responsibility: 10,
    taskDelivery: 10,
    collaboration: 10,
    initiative: 10,
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

  const [currentRating, setCurrentRating] = useState<number>(10)
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

  // Khóa sổ điểm khảo sát bởi Ban Chủ nhiệm
  const isSurveyLocked = Boolean(currentEventItem && currentEventItem.status === 'closed')

  const handleToggleLockSurvey = () => {
    if (!currentEventItem || !isBCN) return
    const nextStatus = currentEventItem.status === 'active' ? 'closed' : 'active'
    const updated = updateSurveyEventStatus(currentEventItem.id, nextStatus)
    setSurveyEvents(updated)
    setToastMessage(
      nextStatus === 'closed'
        ? `Đã khóa sổ điểm khảo sát "${currentEventItem.name}"! Điểm số đã được chốt và bảo lưu an toàn.`
        : `Đã mở lại khảo sát sự kiện "${currentEventItem.name}"!`
    )
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Load from localStorage specifically for the selectedEvent
  useEffect(() => {
    try {
      const savedEvaluations = localStorage.getItem(currentEventStorageKey)
      if (savedEvaluations) {
        setEvaluations(JSON.parse(savedEvaluations))
      } else {
        // Khởi tạo sự kiện mới bắt đầu hoàn toàn sạch sẽ từ 0 đánh giá
        setEvaluations({})
        localStorage.setItem(currentEventStorageKey, JSON.stringify({}))
      }
    } catch {
      setEvaluations({})
    }
  }, [currentEventStorageKey, selectedEvent])

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
        setCurrentRating(10)
        setCriteriaScores({
          responsibility: 10,
          taskDelivery: 10,
          collaboration: 10,
          initiative: 10,
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

    if (!canSubmitSurvey) {
      if (!isCoreUser) {
        setToastMessage('Bạn không thuộc Core Team nên không có quyền gửi đánh giá!')
      } else {
        setToastMessage('Sự kiện khảo sát đã kết thúc hoặc đã đóng!')
      }
      setTimeout(() => setToastMessage(null), 3000)
      return
    }

    if (!currentRating || currentRating === 0) {
      setToastMessage('Vui lòng chọn mức đánh giá từ 1 đến 10!')
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
      localStorage.setItem(currentEventStorageKey, JSON.stringify(updated))
    } catch (e) {
      console.error(e)
    }

    // Đồng thời lưu vào kho dữ liệu đánh giá chéo dành riêng cho Ban Chủ nhiệm xem báo cáo
    try {
      const updatedFeedbacks = saveNewSurveyFeedback({
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
        customAnswers: { ...customAnswers },
        submittedAt: new Date().toISOString(),
      })
      setStoredFeedbacks(updatedFeedbacks)
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

  if (!isCoreUser) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#061651] dark:text-white">
            Giới hạn quyền truy cập
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Chức năng <strong>Khảo sát Core Team</strong> chỉ dành riêng cho các thành viên thuộc Core Team và Ban Chủ nhiệm CLB iSSAC. Tài khoản thành viên thường không có quyền truy cập chức năng này.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/?tab=dashboard'
                }
              }}
              className="px-6 py-2.5 rounded-xl bg-[#1351D8] hover:bg-[#1044B5] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
            >
              Quay lại Bảng điều khiển
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HEADER SECTION & MODE SWITCHER TABS (Góc bên phải) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          {/* Cụm Tiêu đề & Lời dẫn mô tả chuẩn style Dashboard (Ảnh 1) */}
          <div className="min-w-0 flex-1 sm:flex-initial">
            <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#061651] dark:text-white tracking-tight leading-tight">
              Khảo sát Core Team sự kiện iSSAC
            </h1>
            <p className="text-xs sm:text-[13px] text-[#64748B] dark:text-slate-400 mt-1 font-normal">
              Nơi ghi nhận góp ý để cải thiện chất lượng tổ chức và phối hợp trong các sự kiện của CLB
            </p>
          </div>

                    {/* Mascot Chibi với hiệu ứng động tương tác khi click (đã bỏ hẳn note/bubble theo yêu cầu) */}
          <div
            onClick={handleMascotClick}
            className="relative cursor-pointer inline-flex items-center shrink-0 select-none"
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
          </div>
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
      ) : surveyEvents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-8 sm:p-14 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-[#0284C7] dark:text-sky-400 flex items-center justify-center mx-auto shadow-2xs">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg sm:text-xl font-extrabold text-[#061651] dark:text-white">
              Hiện chưa có đợt khảo sát nào đang mở
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Toàn bộ các sự kiện khảo sát đã được hoàn tất hoặc chưa được khởi tạo.
            </p>
          </div>
          {isBCN && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setViewMode('bcn_report')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow-md transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Mở quản lý & Tạo sự kiện mới</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 3. EVENT & STATUS BAR (Bố cục cân bằng, trực quan, không rớt dòng) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 sm:px-5 sm:py-3.5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
            {/* Vế trái: Sự kiện khảo sát & Trạng thái & Thao tác BCN */}
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap min-w-0">
              {/* Nhóm chọn sự kiện */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs sm:text-[13px] font-bold text-[#061651] dark:text-slate-200 whitespace-nowrap">
                  Sự kiện khảo sát:
                </span>
                <div className="relative" ref={eventDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
                    className="h-9 px-3.5 rounded-full border border-slate-200/90 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-[#061651] dark:text-slate-100 font-bold text-xs sm:text-[13px] flex items-center gap-2 shadow-2xs hover:shadow-xs transition-colors cursor-pointer max-w-[260px] sm:max-w-[340px]"
                    title={selectedEvent}
                  >
                    <span className="truncate">{selectedEvent}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </button>

                  {isEventDropdownOpen && (
                    <div className="absolute left-0 mt-1.5 w-64 sm:w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
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
                          <span className="truncate pr-2">{event}</span>
                          {selectedEvent === event && (
                            <Check className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Nhóm trạng thái chu kỳ sự kiện */}
              {isSurveyLocked ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-purple-50/90 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800 shadow-2xs shrink-0">
                  <Lock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Đã khóa sổ</span>
                </span>
              ) : isEventClosedOrExpired ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50/90 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800 shadow-2xs shrink-0">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>Hết hạn</span>
                  {currentEventItem?.endDate && (
                    <>
                      <span className="opacity-40 font-normal select-none text-[11px]">|</span>
                      <span className="text-[11px] font-normal opacity-85">
                        {currentEventItem.endDate}
                      </span>
                    </>
                  )}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800 shadow-2xs shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Đang mở</span>
                  {currentEventItem?.endDate && (
                    <>
                      <span className="opacity-40 font-normal select-none text-[11px]">|</span>
                      <span className="text-[11px] font-normal text-emerald-800/85 dark:text-emerald-300/85">
                        Hạn: {currentEventItem.endDate}
                      </span>
                    </>
                  )}
                </span>
              )}

              {/* Nút Khóa sổ / Mở lại cho BCN (Gọn gàng, vừa vặn) */}
              {isBCN && currentEventItem && (
                <button
                  type="button"
                  onClick={handleToggleLockSurvey}
                  className={`h-9 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 shrink-0 ${
                    isSurveyLocked
                      ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200/90 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200/90 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                  }`}
                  title={isSurveyLocked ? 'Mở lại để tiếp tục nhận phiếu khảo sát' : 'Chốt và khóa sổ điểm khảo sát sự kiện'}
                >
                  {isSurveyLocked ? (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Mở lại</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Khóa sổ</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Vế phải: Huy hiệu Bảo mật & Tiến độ đánh giá của thành viên */}
            <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
              {/* Huy hiệu Bảo mật thông tin */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0284C7] dark:text-sky-400" />
                <span>Điểm bảo mật</span>
              </span>

              {/* Huy hiệu Tiến độ đánh giá */}
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
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-[10px] font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> 100%
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50/90 dark:bg-blue-950/40 text-[#0B63E5] dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 shadow-2xs">
                  <Users className="w-4 h-4 text-[#0B63E5] dark:text-blue-400 shrink-0" />
                  <span>
                    Đã đánh giá:{' '}
                    <strong className="font-black text-blue-900 dark:text-blue-100">
                      {completedCount}/{totalTargetCount}
                    </strong>{' '}
                    Core Team
                  </span>
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-[10px] font-black text-[#0B63E5] dark:text-blue-200">
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

            {/* 2 Stat Boxes: Chuẩn 100% Style Box Thẻ Chỉ số Ảnh 2 */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Stat 1: Lượt đánh giá (Style Mức chuẩn CLB / Xanh Pastel của Ảnh 2) */}
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#F0F9FF] dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/50 flex items-center justify-between transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-300 block truncate">
                    Lượt đánh giá
                  </span>
                  <div className="flex items-baseline gap-1 py-0.5">
                    <span className="text-lg sm:text-[22px] font-black text-[#0284C7] dark:text-sky-400 tracking-tight leading-none">
                      {isSurveyLocked || isBCN ? (selectedMember.reviewsCount ?? 0) : '—'}
                    </span>
                    <span className="text-[11.5px] font-bold text-[#0284C7]/80 dark:text-sky-300">
                      lượt
                    </span>
                  </div>
                  <span className="text-[11.5px] font-semibold text-[#0284C7] dark:text-sky-400 block truncate">
                    {isSurveyLocked || isBCN
                      ? (selectedMember.reviewsCount ?? 0) > 0
                        ? 'Đã có nhận xét'
                        : 'Chưa có lượt nào'
                      : 'Đang mở khảo sát'}
                  </span>
                </div>
                <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-sky-300/70 bg-white/60 dark:bg-slate-800/80 flex items-center justify-center text-[#0284C7] shrink-0 shadow-2xs">
                  <Users className="w-4.5 h-4.5 stroke-[1.75]" />
                </div>
              </div>

              {/* Stat 2: Điểm TB (Chỉ hiển thị khi Ban Chủ nhiệm khóa sổ điểm khảo sát, đảm bảo tính bảo mật tuyệt đối) */}
              {isSurveyLocked ? (
                (selectedMember.reviewsCount ?? 0) > 0 && selectedMember.averageScore != null ? (
                  <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#F0FDF4] dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 flex items-center justify-between transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-300 block truncate">
                        Điểm đánh giá TB
                      </span>
                      <div className="flex items-baseline gap-1 py-0.5">
                        <span className="text-lg sm:text-[22px] font-black text-[#16A34A] dark:text-emerald-400 tracking-tight leading-none">
                          {selectedMember.averageScore.toFixed(1)}
                        </span>
                        <span className="text-[11.5px] font-bold text-[#16A34A]/80 dark:text-emerald-300">
                          / 10
                        </span>
                      </div>
                      <span className="text-[11.5px] font-semibold text-[#16A34A] dark:text-emerald-400 block truncate">
                        Đã khóa sổ bởi BCN
                      </span>
                    </div>
                    <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-emerald-300/70 bg-white/60 dark:bg-slate-800/80 flex items-center justify-center text-[#16A34A] shrink-0 shadow-2xs">
                      <Star className="w-4.5 h-4.5 fill-[#16A34A] stroke-[1.75]" />
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-300 block truncate">
                        Điểm đánh giá TB
                      </span>
                      <div className="flex items-baseline gap-1 py-0.5">
                        <span className="text-lg sm:text-[22px] font-black text-slate-400 dark:text-slate-500 tracking-tight leading-none">
                          —
                        </span>
                        <span className="text-[11.5px] font-bold text-slate-400 dark:text-slate-500">
                          / 10
                        </span>
                      </div>
                      <span className="text-[11.5px] font-semibold text-slate-400 dark:text-slate-500 block truncate">
                        Chưa có đánh giá
                      </span>
                    </div>
                    <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-slate-300/70 bg-white/60 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                      <Star className="w-4.5 h-4.5 stroke-[1.75]" />
                    </div>
                  </div>
                )
              ) : (
                /* KHI CHƯA KHÓA SỔ: Điểm không public, bảo mật tuyệt đối */
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-300 block truncate">
                      Điểm đánh giá TB
                    </span>
                    <div className="flex items-baseline gap-1 py-0.5">
                      <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 tracking-tight leading-none flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-amber-500 stroke-[2.5]" />
                        Bảo mật
                      </span>
                      <span className="text-[11.5px] font-bold text-slate-400 dark:text-slate-500">
                        / 10
                      </span>
                    </div>
                    <span className="text-[11px] sm:text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
                      Chỉ mở khi BCN khóa sổ
                    </span>
                  </div>
                  <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-amber-300/70 dark:border-amber-700/60 bg-amber-50/70 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-2xs">
                    <Lock className="w-4.5 h-4.5 stroke-[1.75]" />
                  </div>
                </div>
              )}
            </div>

            {/* Lưu ý khảo sát: Chuẩn style bo tròn và shadow đồng bộ */}
            <div className="bg-[#F8FAFC] dark:bg-slate-800/50 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full border border-sky-300/70 bg-white dark:bg-slate-800 text-[#0284C7] dark:text-sky-400 flex items-center justify-center shrink-0 shadow-2xs">
                  <Info className="w-4 h-4" />
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
                  Điểm TB: {calculatedAvgScore} / 10.0
                </span>
              </div>

              {/* CẢNH BÁO NẾU KHÔNG THUỘC CORE TEAM HOẶC SỰ KIỆN ĐÃ ĐÓNG / HẾT HẠN */}
              {!isCoreUser ? (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800 text-amber-800 dark:text-amber-200 flex items-start gap-2.5 text-xs leading-relaxed">
                  <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Chỉ dành cho Thành viên Core Team:</strong>
                    Tài khoản của bạn hiện là thành viên thường nên không thể điền phiếu đánh giá này.
                  </div>
                </div>
              ) : isEventClosedOrExpired ? (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/90 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-start gap-2.5 text-xs leading-relaxed">
                  <Clock className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Sự kiện khảo sát đã kết thúc:</strong>
                    Kỳ khảo sát cho sự kiện &quot;{selectedEvent}&quot; đã kết thúc vào ngày{' '}
                    <strong>{currentEventItem?.endDate || currentEventItem?.date}</strong>. Hệ thống đã khóa và ngừng nhận thêm phiếu đánh giá.
                  </div>
                </div>
              ) : null}

              {/* 1. Bộ 4 Tiêu chí Cốt lõi (Trách nhiệm, Thực thi, Phối hợp, Sáng tạo - Khớp Ảnh 2) */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs sm:text-sm font-bold text-[#061651] dark:text-slate-200 flex items-center gap-1.5">
                    <span className="text-red-500 font-bold">*</span>
                    <span>Chấm điểm 4 Tiêu chí Cốt lõi của {memberFirstName}:</span>
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Bấm chọn thang điểm 1 đến 10 cho từng tiêu chí cốt lõi của CLB iSSAC
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                  {CORE_EVALUATION_CRITERIA.map((crit) => {
                    const score = criteriaScores[crit.key]
                    const cStyle =
                      crit.key === 'responsibility'
                        ? {
                            cardBg: 'bg-[#F0FDF4] dark:bg-emerald-950/20',
                            border: 'border-emerald-200/80 dark:border-emerald-900/50',
                            accent: 'text-[#16A34A] dark:text-emerald-400',
                            btnActive: 'bg-[#16A34A] text-white ring-2 ring-[#16A34A]/30',
                          }
                        : crit.key === 'taskDelivery'
                        ? {
                            cardBg: 'bg-[#F0F9FF] dark:bg-sky-950/20',
                            border: 'border-sky-200/80 dark:border-sky-900/50',
                            accent: 'text-[#0284C7] dark:text-sky-400',
                            btnActive: 'bg-[#0284C7] text-white ring-2 ring-[#0284C7]/30',
                          }
                        : crit.key === 'collaboration'
                        ? {
                            cardBg: 'bg-[#FFFBEB] dark:bg-amber-950/20',
                            border: 'border-amber-200/80 dark:border-amber-900/50',
                            accent: 'text-[#D97706] dark:text-amber-400',
                            btnActive: 'bg-[#D97706] text-white ring-2 ring-[#D97706]/30',
                          }
                        : {
                            cardBg: 'bg-[#F8FAFC] dark:bg-slate-800/35',
                            border: 'border-slate-200/80 dark:border-slate-700/60',
                            accent: 'text-[#061651] dark:text-sky-300',
                            btnActive: 'bg-[#061651] dark:bg-sky-600 text-white ring-2 ring-[#061651]/30',
                          }
                    return (
                      <div
                        key={crit.key}
                        className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl ${cStyle.cardBg} ${cStyle.border} border space-y-2 transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-[13px] font-bold text-[#061651] dark:text-white block leading-tight truncate">
                            {crit.shortLabel}
                          </span>
                          <div className="flex items-baseline gap-1 bg-white/80 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-200/70 dark:border-slate-700 shadow-2xs shrink-0">
                            <span className={`text-xs sm:text-sm font-black ${cStyle.accent} leading-none`}>
                              {score}.0
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              / 10
                            </span>
                          </div>
                        </div>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 line-clamp-1 pl-0.5">
                          {crit.description}
                        </p>
                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 sm:gap-1.5 pt-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
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
                                  ? `${cStyle.btnActive} shadow-2xs font-black scale-105`
                                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-slate-600 border border-slate-200/80 dark:border-slate-600'
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

              {/* 2 & 3. Nhận xét tự luận & Mong muốn cải thiện (Tự do không giới hạn chữ / Free word) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-0.5">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-[13px] font-bold text-[#061651] dark:text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <span className="text-red-500 font-bold">*</span>
                      <span>Vài lời nhận xét về {memberFirstName}</span>
                    </span>
                    <span className="text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                      Free word
                    </span>
                  </label>
                  <textarea
                    value={currentFeedback}
                    onChange={(e) => setCurrentFeedback(e.target.value)}
                    rows={3}
                    placeholder={`Nhập nhận xét của bạn về ${memberFirstName} sau sự kiện... (Tự do không giới hạn độ dài ký tự)`}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#061651] dark:text-slate-100 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all placeholder:text-slate-400 min-h-[82px] resize-y leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-[13px] font-bold text-[#061651] dark:text-slate-200 flex items-center justify-between">
                    <span>Mong muốn cải thiện gì?</span>
                    <span className="text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                      Free word
                    </span>
                  </label>
                  <textarea
                    value={currentImprovement}
                    onChange={(e) => setCurrentImprovement(e.target.value)}
                    rows={3}
                    placeholder={`Bạn mong muốn ${memberFirstName} có thể cải thiện thêm điều gì trong các sự kiện tới?... (Tự do không giới hạn độ dài ký tự)`}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#061651] dark:text-slate-100 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all placeholder:text-slate-400 min-h-[82px] resize-y leading-relaxed"
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
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          {q.required && <span className="text-red-500">*</span>}
                          <span>{q.title}</span>
                        </span>
                        {q.type === 'textarea' && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.2 rounded">
                            Free word
                          </span>
                        )}
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
                          rows={3}
                          placeholder="Nhập câu trả lời... (Tự do không giới hạn độ dài ký tự)"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none min-h-[75px] resize-y leading-relaxed"
                        />
                      ) : q.type === 'rating_stars' ? (
                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 sm:gap-1.5 pt-0.5">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() =>
                                setCustomAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: star,
                                }))
                              }
                              className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                                (customAnswers[q.id] || 10) === star
                                  ? 'bg-[#0284C7] text-white shadow-2xs font-black ring-2 ring-[#0284C7]/30'
                                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-600 border border-slate-200/80 dark:border-slate-600'
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
                  disabled={!canSubmitSurvey}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-[#061651] dark:text-slate-200 font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Bỏ qua
                </button>

                <button
                  type="button"
                  onClick={handleSubmitEvaluation}
                  disabled={!canSubmitSurvey}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!isCoreUser ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Không thuộc Core Team</span>
                    </>
                  ) : isEventClosedOrExpired ? (
                    <>
                      <Clock className="w-4 h-4" />
                      <span>Khảo sát đã kết thúc</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Nộp khảo sát</span>
                    </>
                  )}
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
        <div className="fixed inset-0 z-50 bg-[#061651]/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200/90 dark:border-slate-800 text-center animate-in zoom-in-95 duration-200 space-y-4">
            {/* 1. Icon Khóa bảo mật */}
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xs border border-amber-200/60 dark:border-amber-800/60">
              <Lock className="w-7 h-7" />
            </div>

            {/* 2. Tiêu đề & Nhãn Đặc quyền */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/50 text-[#0284C7] dark:text-sky-300 text-[11px] font-black tracking-wide border border-sky-200/80 dark:border-sky-800/60 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ĐẶC QUYỀN BAN CHỦ NHIỆM</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[#061651] dark:text-white tracking-tight">
                Quyền truy cập bị giới hạn
              </h3>
            </div>

            {/* 3. Khung nội dung giải thích (Căn chỉnh cân bằng, typography mạch lạc) */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed text-center space-y-2">
              <p>
                Theo quy định bảo mật khảo sát nội bộ của iSSAC, các phiếu đánh giá chéo giữa các thành viên, chi tiết góp ý sau sự kiện và bảng xếp hạng Core Team chỉ mở cho tài khoản <strong className="text-[#0284C7] dark:text-sky-400 font-bold">Ban Chủ nhiệm (BCN)</strong> nhằm đảm bảo tính khách quan và an tâm khi góp ý.
              </p>
            </div>

            {/* 4. Thẻ tài khoản đang đăng nhập (Hiển thị đầy đủ, không che chữ, tiết tấu nhỏ gọn) */}
            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 max-w-full flex-wrap leading-normal">
              <span className="text-slate-400 dark:text-slate-500 font-normal">Tài khoản:</span>
              <strong className="text-[#061651] dark:text-white font-bold whitespace-nowrap">
                {currentUser?.name || 'Thành viên'}
              </strong>
              <span className="text-slate-300 dark:text-slate-600 select-none">•</span>
              <span className="text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                {currentUser?.roleTitle || 'Thành viên'}
              </span>
            </div>

            {/* 5. Nút bấm thao tác */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowBcnLockModal(false)}
                className="flex-1 h-10 sm:h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-[13px] transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
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
                  className="flex-1 h-10 sm:h-11 px-4 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs sm:text-[13px] shadow-sm hover:shadow-md shadow-sky-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
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
