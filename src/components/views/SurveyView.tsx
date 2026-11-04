'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import {
  Users,
  ClipboardCheck,
  Target,
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle2,
  Lock,
  Unlock,
  Edit3,
  Save,
  Send,
  ChevronDown,
  Check,
  X,
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
  q1_work: number // 1-10
  q2_teamwork: number // 1-10
  q3_initiative: number // 1-10
  q4_feedback: string
  q5_suggestions: string
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
  isCore: boolean
}

// Initial mock evaluation for realistic display matching project style
export const INITIAL_CORE_EVALUATIONS: Record<string, SurveyEvaluation> = {
  '24310069': {
    targetMemberCode: '24310069',
    targetMemberName: 'Lê Trần Thuỳ Nguyên',
    targetMemberDept: 'Ban Tư vấn',
    targetMemberRole: 'Trưởng ban - Ban Tư vấn',
    avatarUrl: '/thuy-nguyen-avatar.png',
    initials: 'N',
    q1_work: 9,
    q2_teamwork: 10,
    q3_initiative: 9,
    q4_feedback:
      'Bạn hoàn thành công việc rất tốt, chủ động trong hoạt động và hỗ trợ các thành viên kịp thời.',
    q5_suggestions:
      'Có thể chia sẻ thêm về kinh nghiệm quản lý công việc để cả team cùng học hỏi.',
    status: 'completed',
    updatedAt: '2026-11-01T20:30:00.000Z',
  },
  '24310088': {
    targetMemberCode: '24310088',
    targetMemberName: 'Trần Đức Thắng',
    targetMemberDept: 'Ban Truyền thông',
    targetMemberRole: 'Trưởng ban - Ban Truyền thông',
    avatarUrl: '/thang-avatar.png',
    initials: 'T',
    q1_work: 8,
    q2_teamwork: 9,
    q3_initiative: 8,
    q4_feedback:
      'Nhiệt tình tham gia hoạt động, định hướng truyền thông tốt và đóng góp nhiều ý tưởng sáng tạo cho ban.',
    q5_suggestions: 'Cần bám sát deadline các ấn phẩm truyền thông hơn.',
    status: 'completed',
    updatedAt: '2026-11-02T10:15:00.000Z',
  },
}

export function SurveyView() {
  const { currentUser } = useAuth()
  const { members } = useClub()

  // Selected period
  const [selectedPeriod, setSelectedPeriod] = useState<string>('First Meeting - T10/2026')
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState<boolean>(false)
  const periodDropdownRef = useRef<HTMLDivElement>(null)

  const PERIOD_OPTIONS = [
    'First Meeting - T10/2026',
    'Đánh giá Giữa kỳ - T11/2026',
    'Tổng kết Hoạt động - T12/2026',
  ]

  // Close period dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        periodDropdownRef.current &&
        !periodDropdownRef.current.contains(e.target as Node)
      ) {
        setIsPeriodDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Storage keys
  const storageKey = 'issac_survey_core_v1'
  const isSubmittedKey = 'issac_survey_core_submitted'

  // Lọc tất cả thành viên Core Team trong CLB, TRỪ Ban Chủ nhiệm và TRỪ người đang đánh giá nếu họ là core
  const targetMembers: SurveyTargetMember[] = useMemo(() => {
    return members
      .filter((m) => m.is_core)
      // Loại trừ hoàn toàn Ban Chủ nhiệm theo yêu cầu người dùng
      .filter(
        (m) =>
          m.department_slug !== 'bcn' &&
          m.department_name !== 'Ban Chủ nhiệm' &&
          m.department_code !== 'B04'
      )
      // Loại trừ chính người đang đăng nhập (không tự đánh giá bản thân)
      .filter((m) => m.member_code !== currentUser?.memberCode)
      .map((m) => ({
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
        isCore: true,
      }))
  }, [members, currentUser])

  // Tổng số lượng thành viên Core Team (trừ BCN)
  const totalCoreNonBCN = useMemo(() => {
    return members.filter(
      (m) =>
        m.is_core &&
        m.department_slug !== 'bcn' &&
        m.department_name !== 'Ban Chủ nhiệm' &&
        m.department_code !== 'B04'
    ).length
  }, [members])

  // Evaluations state
  const [evaluations, setEvaluations] = useState<Record<string, SurveyEvaluation>>({})
  const [isSurveySubmitted, setIsSurveySubmitted] = useState<boolean>(false)
  const [selectedMemberCode, setSelectedMemberCode] = useState<string>('')

  // Toast / Feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false)
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false)

  // Mascot interaction
  const [isMascotCheering, setIsMascotCheering] = useState<boolean>(false)
  const [showMascotBubble, setShowMascotBubble] = useState<boolean>(false)

  // Load from localStorage or initialize with mock data
  useEffect(() => {
    try {
      const savedEvaluations = localStorage.getItem(storageKey)
      const submitted = localStorage.getItem(isSubmittedKey) === 'true'
      setIsSurveySubmitted(submitted)

      if (savedEvaluations) {
        setEvaluations(JSON.parse(savedEvaluations))
      } else {
        setEvaluations(INITIAL_CORE_EVALUATIONS)
        localStorage.setItem(storageKey, JSON.stringify(INITIAL_CORE_EVALUATIONS))
      }
    } catch {
      setEvaluations(INITIAL_CORE_EVALUATIONS)
    }
  }, [])

  // Select first member by default
  useEffect(() => {
    if (targetMembers.length > 0) {
      if (!selectedMemberCode || !targetMembers.some((m) => m.memberCode === selectedMemberCode)) {
        setSelectedMemberCode(targetMembers[0].memberCode)
      }
    }
  }, [targetMembers, selectedMemberCode])

  // Selected member object
  const selectedMember = useMemo(() => {
    return (
      targetMembers.find((m) => m.memberCode === selectedMemberCode) ||
      targetMembers[0] ||
      null
    )
  }, [targetMembers, selectedMemberCode])

  // Form state for selected member
  const [currentScore1, setCurrentScore1] = useState<number>(0)
  const [currentScore2, setCurrentScore2] = useState<number>(0)
  const [currentScore3, setCurrentScore3] = useState<number>(0)
  const [currentFeedback, setCurrentFeedback] = useState<string>('')
  const [currentSuggestion, setCurrentSuggestion] = useState<string>('')

  // Sync form when selected member changes or evaluations load
  useEffect(() => {
    if (!selectedMember) return
    const existing = evaluations[selectedMember.memberCode]
    if (existing) {
      setCurrentScore1(existing.q1_work || 0)
      setCurrentScore2(existing.q2_teamwork || 0)
      setCurrentScore3(existing.q3_initiative || 0)
      setCurrentFeedback(existing.q4_feedback || '')
      setCurrentSuggestion(existing.q5_suggestions || '')
    } else {
      setCurrentScore1(0)
      setCurrentScore2(0)
      setCurrentScore3(0)
      setCurrentFeedback('')
      setCurrentSuggestion('')
    }
  }, [selectedMemberCode, evaluations])

  // KPI Calculations
  const totalTargetCount = targetMembers.length

  const completedCount = useMemo(() => {
    return targetMembers.filter((m) => evaluations[m.memberCode]?.status === 'completed')
      .length
  }, [targetMembers, evaluations])

  const completionPercent = useMemo(() => {
    if (totalTargetCount === 0) return 0
    return Math.round((completedCount / totalTargetCount) * 100)
  }, [completedCount, totalTargetCount])

  const canSubmit = totalTargetCount > 0 && completedCount >= totalTargetCount

  // Show Toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3200)
  }

  // Mascot Click
  const handleMascotClick = () => {
    setIsMascotCheering(true)
    setShowMascotBubble(true)
    setTimeout(() => setIsMascotCheering(false), 800)
    setTimeout(() => setShowMascotBubble(false), 3000)
  }

  // Save current evaluation
  const handleSaveEvaluation = (shouldAdvance = false) => {
    if (!selectedMember) return

    // Validate: Need at least scores for all 3 criteria to mark as completed
    const isCompleted =
      Number(currentScore1) > 0 &&
      Number(currentScore2) > 0 &&
      Number(currentScore3) > 0

    const newEvaluation: SurveyEvaluation = {
      targetMemberCode: selectedMember.memberCode,
      targetMemberName: selectedMember.fullName,
      targetMemberDept: selectedMember.departmentName,
      targetMemberRole: `${selectedMember.position} - ${selectedMember.departmentName}`,
      avatarUrl: selectedMember.avatarUrl,
      initials: selectedMember.initials,
      q1_work: Number(currentScore1),
      q2_teamwork: Number(currentScore2),
      q3_initiative: Number(currentScore3),
      q4_feedback: currentFeedback.trim(),
      q5_suggestions: currentSuggestion.trim(),
      status: isCompleted ? 'completed' : 'in_progress',
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
      console.error('Failed to save survey to localStorage', e)
    }

    triggerToast(`Đã lưu đánh giá cho ${selectedMember.fullName}!`)

    if (shouldAdvance) {
      // Find next un-evaluated member
      const currentIndex = targetMembers.findIndex(
        (m) => m.memberCode === selectedMember.memberCode
      )
      const nextMember =
        targetMembers.slice(currentIndex + 1).find(
          (m) => updated[m.memberCode]?.status !== 'completed'
        ) ||
        targetMembers.find((m) => updated[m.memberCode]?.status !== 'completed')

      if (nextMember) {
        setSelectedMemberCode(nextMember.memberCode)
      }
    }
  }

  // Handle final submission
  const handleSubmitSurvey = () => {
    setIsSurveySubmitted(true)
    setShowSubmitModal(false)
    setShowSuccessModal(true)
    try {
      localStorage.setItem(isSubmittedKey, 'true')
    } catch (e) {
      console.error('Failed to save submission state', e)
    }
  }

  return (
    <div className="w-full space-y-5 sm:space-y-6 animate-fade-in pb-12 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900/90 text-white shadow-2xl backdrop-blur-md border border-slate-700 animate-slide-in text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: Title + Mascot Chibi + Period Dropdown */}
      <div className="pl-9 sm:pl-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Title & Mascot */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Khảo sát Core Team iSSAC
            </h1>

            {/* Mascot Chibi beside title matching Image 1 */}
            <div
              className="relative cursor-pointer group flex-shrink-0"
              onClick={handleMascotClick}
              title="Nhấn để tương tác cùng iSSAC Mascot!"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 relative">
                <Image
                  src="/issac-mascot.png"
                  alt="iSSAC Mascot"
                  fill
                  className={`object-contain transition-transform duration-300 drop-shadow-sm ${
                    isMascotCheering
                      ? 'animate-mascot-pop scale-125'
                      : 'hover:scale-110 active:scale-95'
                  }`}
                  priority
                />
              </div>

              {/* Speech bubble */}
              {showMascotBubble && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 whitespace-nowrap z-30 animate-scale-in">
                  <span>Chào bạn! Cùng đánh giá khách quan nhé! ⭐</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Đánh giá hoạt động, tinh thần phối hợp và đóng góp của các thành viên Core Team (trừ Ban Chủ nhiệm).
          </p>
        </div>

        {/* Right: Period Dropdown [ 📅 First Meeting - T10/2026 ⌄ ] */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="relative" ref={periodDropdownRef}>
            <button
              type="button"
              onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>{selectedPeriod}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isPeriodDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 shadow-xl py-1 z-40 animate-scale-in">
                {PERIOD_OPTIONS.map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => {
                      setSelectedPeriod(period)
                      setIsPeriodDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors ${
                      selectedPeriod === period
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-slate-800'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{period}</span>
                    {selectedPeriod === period && (
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 Thẻ Chỉ Số KPI (Chuẩn Style DashboardView / Ảnh 1: Nền Pastel, Icon Tròn Viền Mảnh Bên Phải, Số Nổi Bật) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Thành viên Core Team */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-[#F0F9FF] dark:bg-sky-950/25 flex items-center justify-between transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
          <div className="space-y-0.5 min-w-0">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-400 block truncate">
              Thành viên Core Team
            </span>
            <span className="text-2xl sm:text-[28px] font-black text-[#0284C7] dark:text-sky-400 block tracking-tight leading-none py-0.5">
              {totalCoreNonBCN}
            </span>
            <span className="text-[11.5px] font-semibold text-[#0284C7] dark:text-sky-400 block">
              {totalCoreNonBCN} thành viên
            </span>
          </div>
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-sky-300/70 dark:border-sky-700/60 bg-white/70 dark:bg-slate-800/70 flex items-center justify-center text-[#0284C7] dark:text-sky-400 shrink-0 shadow-2xs">
            <Users className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* Card 2: Lượt đánh giá của bạn */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-[#FFFBEB] dark:bg-amber-950/25 flex items-center justify-between transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
          <div className="space-y-0.5 min-w-0">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-400 block truncate">
              Lượt đánh giá của bạn
            </span>
            <span className="text-2xl sm:text-[28px] font-black text-[#D97706] dark:text-amber-400 block tracking-tight leading-none py-0.5">
              {completedCount} / {totalTargetCount}
            </span>
            <span className="text-[11.5px] font-semibold text-[#D97706] dark:text-amber-400 block">
              Đã hoàn thành
            </span>
          </div>
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-amber-300/70 dark:border-amber-700/60 bg-white/70 dark:bg-slate-800/70 flex items-center justify-center text-[#D97706] dark:text-amber-400 shrink-0 shadow-2xs">
            <Clock className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* Card 3: Tiến độ của bạn */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-[#F0FDF4] dark:bg-emerald-950/25 flex items-center justify-between transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
          <div className="space-y-0.5 min-w-0">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-400 block truncate">
              Tiến độ của bạn
            </span>
            <div className="flex items-center gap-2 py-0.5">
              <span className="text-2xl sm:text-[28px] font-black text-[#16A34A] dark:text-emerald-400 tracking-tight leading-none">
                {completionPercent}%
              </span>
              <div className="w-12 sm:w-16 bg-slate-200/90 dark:bg-slate-700 rounded-full h-2 overflow-hidden shrink-0">
                <div
                  className="bg-[#16A34A] h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
            <span className="text-[11.5px] font-semibold text-[#16A34A] dark:text-emerald-400 block">
              {completionPercent === 100
                ? 'Đã hoàn tất 100%'
                : `Còn lại ${totalTargetCount - completedCount} thành viên`}
            </span>
          </div>
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-emerald-300/70 dark:border-emerald-700/60 bg-white/70 dark:bg-slate-800/70 flex items-center justify-center text-[#16A34A] dark:text-emerald-400 shrink-0 shadow-2xs">
            <CheckCircle2 className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* Card 4: Hạn hoàn thành */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-[#FAF5FF] dark:bg-purple-950/25 flex items-center justify-between transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
          <div className="space-y-0.5 min-w-0">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-400 block truncate">
              Hạn hoàn thành
            </span>
            <span className="text-2xl sm:text-[28px] font-black text-[#9333EA] dark:text-purple-400 block tracking-tight leading-none py-0.5">
              23:59
            </span>
            <span className="text-[11.5px] font-semibold text-[#9333EA] dark:text-purple-400 block">
              05/11/2026
            </span>
          </div>
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-purple-300/70 dark:border-purple-700/60 bg-white/70 dark:bg-slate-800/70 flex items-center justify-center text-[#9333EA] dark:text-purple-400 shrink-0 shadow-2xs">
            <Calendar className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>
      </div>

      {/* MAIN 2-COLUMN EVALUATION WORKSPACE (Left ~30% : Right ~70%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* LEFT COLUMN: Danh sách đánh giá Core Team (~30% layout) */}
        <div className="lg:col-span-4 xl:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div className="flex-shrink-0 mb-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Danh sách đánh giá ({targetMembers.length} thành viên)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Bạn cần đánh giá các thành viên Core Team (trừ Ban Chủ nhiệm và bản thân).
            </p>
          </div>

          {/* Member List */}
          <div className="flex-1 flex flex-col justify-between gap-1.5 sm:gap-2 overflow-y-auto pr-1 min-h-0">
            {targetMembers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Không tìm thấy thành viên Core Team nào.
              </div>
            ) : (
              targetMembers.map((member) => {
                const isSelected = member.memberCode === selectedMember?.memberCode
                const isEvaluated =
                  evaluations[member.memberCode]?.status === 'completed'

                return (
                  <div
                    key={member.memberCode}
                    onClick={() => setSelectedMemberCode(member.memberCode)}
                    className={`w-full p-2 sm:p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-2 border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 shadow-sm ring-2 ring-blue-400/20'
                        : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300'
                    }`}
                  >
                    {/* Left: Avatar & Info */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Avatar */}
                      <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-sm shadow-sm">
                        {member.avatarUrl ? (
                          <Image
                            src={member.avatarUrl}
                            alt={member.fullName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div
                            className={`w-full h-full flex items-center justify-center border ${
                              member.initialBg || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {member.initials}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 text-left flex-1">
                        <p
                          className={`text-xs sm:text-[13px] font-bold truncate ${
                            isSelected
                              ? 'text-blue-900 dark:text-blue-300'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {member.fullName}
                        </p>
                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                          {member.position} - {member.departmentName}
                        </p>
                      </div>
                    </div>

                    {/* Right: Status Pill & Chevron */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-1.5">
                      {isEvaluated ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Đã đánh giá</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Chưa đánh giá
                        </span>
                      )}
                      <ChevronRight
                        className={`w-3.5 h-3.5 ${
                          isSelected ? 'text-blue-600' : 'text-slate-400'
                        }`}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Form Đánh giá Thành viên (~70% layout) */}
        <div className="lg:col-span-8 xl:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6.5 shadow-sm flex flex-col justify-between">
          {selectedMember ? (
            <div className="flex-1 flex flex-col justify-between space-y-5 sm:space-y-5.5">
              {/* Selected Member Profile Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-base shadow-sm border border-slate-200 dark:border-slate-700">
                    {selectedMember.avatarUrl ? (
                      <Image
                        src={selectedMember.avatarUrl}
                        alt={selectedMember.fullName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full flex items-center justify-center ${
                          selectedMember.initialBg || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {selectedMember.initials}
                      </div>
                    )}
                  </div>

                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                      {selectedMember.fullName}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                      {selectedMember.position} - {selectedMember.departmentName}
                    </p>
                  </div>
                </div>

                {/* Status Badges on right */}
                <div className="flex items-center gap-2">
                  {evaluations[selectedMember.memberCode]?.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Đã đánh giá</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      Chưa hoàn thành
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSaveEvaluation(false)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Chỉnh sửa</span>
                  </button>
                </div>
              </div>

              {/* Criteria 1: Đánh giá mức độ hoàn thành công việc */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm sm:text-[14.5px] font-bold text-slate-800 dark:text-slate-200">
                    1. Đánh giá mức độ hoàn thành công việc
                  </label>
                  {Number(currentScore1) > 0 ? (
                    <span className="text-[11px] sm:text-xs font-semibold text-[#0B63E5] dark:text-blue-300 bg-blue-50/90 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 px-2.5 py-0.5 rounded-md sm:rounded-lg">
                      {currentScore1} / 10 điểm
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-normal">Thang điểm 1 - 10</span>
                  )}
                </div>

                {/* 1-10 Pill Rating Buttons */}
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => {
                    const isSelected = Number(currentScore1) === Number(score)
                    return (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setCurrentScore1(score)}
                        className={`h-8 sm:h-8.5 rounded-lg sm:rounded-xl text-xs sm:text-[13px] font-semibold transition-all flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'bg-[#0B63E5] hover:bg-[#0954C3] text-white font-bold shadow-sm shadow-blue-500/25'
                            : 'border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:bg-blue-50/80 dark:hover:bg-slate-700 hover:border-blue-300 hover:text-[#0B63E5]'
                        }`}
                      >
                        {score}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Criteria 2: Đánh giá tinh thần phối hợp & làm việc nhóm */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm sm:text-[14.5px] font-bold text-slate-800 dark:text-slate-200">
                    2. Đánh giá tinh thần phối hợp & làm việc nhóm
                  </label>
                  {Number(currentScore2) > 0 ? (
                    <span className="text-[11px] sm:text-xs font-semibold text-[#0B63E5] dark:text-blue-300 bg-blue-50/90 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 px-2.5 py-0.5 rounded-md sm:rounded-lg">
                      {currentScore2} / 10 điểm
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-normal">Thang điểm 1 - 10</span>
                  )}
                </div>

                {/* 1-10 Pill Rating Buttons */}
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => {
                    const isSelected = Number(currentScore2) === Number(score)
                    return (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setCurrentScore2(score)}
                        className={`h-8 sm:h-8.5 rounded-lg sm:rounded-xl text-xs sm:text-[13px] font-semibold transition-all flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'bg-[#0B63E5] hover:bg-[#0954C3] text-white font-bold shadow-sm shadow-blue-500/25'
                            : 'border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:bg-blue-50/80 dark:hover:bg-slate-700 hover:border-blue-300 hover:text-[#0B63E5]'
                        }`}
                      >
                        {score}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Criteria 3: Đánh giá sự chủ động, trách nhiệm */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm sm:text-[14.5px] font-bold text-slate-800 dark:text-slate-200">
                    3. Đánh giá sự chủ động, trách nhiệm
                  </label>
                  {Number(currentScore3) > 0 ? (
                    <span className="text-[11px] sm:text-xs font-semibold text-[#0B63E5] dark:text-blue-300 bg-blue-50/90 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 px-2.5 py-0.5 rounded-md sm:rounded-lg">
                      {currentScore3} / 10 điểm
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-normal">Thang điểm 1 - 10</span>
                  )}
                </div>

                {/* 1-10 Pill Rating Buttons */}
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => {
                    const isSelected = Number(currentScore3) === Number(score)
                    return (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setCurrentScore3(score)}
                        className={`h-8 sm:h-8.5 rounded-lg sm:rounded-xl text-xs sm:text-[13px] font-semibold transition-all flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'bg-[#0B63E5] hover:bg-[#0954C3] text-white font-bold shadow-sm shadow-blue-500/25'
                            : 'border border-slate-200/90 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:bg-blue-50/80 dark:hover:bg-slate-700 hover:border-blue-300 hover:text-[#0B63E5]'
                        }`}
                      >
                        {score}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Criteria 4: Nhận xét tổng quan */}
              <div className="space-y-1.5">
                <label className="text-sm sm:text-[15px] font-bold text-slate-800 dark:text-slate-200">
                  4. Nhận xét tổng quan
                </label>
                <textarea
                  value={currentFeedback}
                  onChange={(e) => setCurrentFeedback(e.target.value)}
                  rows={3}
                  placeholder="Nhập nhận xét về ưu điểm, mức độ hoàn thành và thái độ làm việc của thành viên..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-400 min-h-[82px] resize-y"
                />
              </div>

              {/* Criteria 5: Đề xuất/kiến nghị (nếu có) */}
              <div className="space-y-1.5">
                <label className="text-sm sm:text-[15px] font-bold text-slate-800 dark:text-slate-200">
                  5. Đề xuất/kiến nghị (nếu có)
                </label>
                <textarea
                  value={currentSuggestion}
                  onChange={(e) => setCurrentSuggestion(e.target.value)}
                  rows={3}
                  placeholder="Nhập đề xuất, góp ý cải thiện hoặc kiến nghị hỗ trợ..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-400 min-h-[82px] resize-y"
                />
              </div>

              {/* Action Buttons for current member pinned at bottom */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>
                    {[Number(currentScore1) > 0, Number(currentScore2) > 0, Number(currentScore3) > 0].filter(Boolean).length === 3
                      ? 'Đã hoàn tất điểm 3 tiêu chí chính'
                      : `Đã chấm ${[Number(currentScore1) > 0, Number(currentScore2) > 0, Number(currentScore3) > 0].filter(Boolean).length}/3 tiêu chí điểm`}
                  </span>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleSaveEvaluation(false)}
                    className="h-10 inline-flex items-center justify-center gap-2 px-4.5 sm:px-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                  >
                    <Save className="w-4 h-4 text-blue-600" />
                    <span>Lưu đánh giá</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveEvaluation(true)}
                    className="h-10 inline-flex items-center justify-center gap-2 px-4.5 sm:px-5 rounded-xl bg-[#0B63E5] hover:bg-[#0954C3] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                  >
                    <span>Lưu & Tiếp tục</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400">
              Vui lòng chọn một thành viên Core Team từ danh sách bên trái để đánh giá.
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM FOOTER SUBMISSION BANNER */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left: Lock/Unlock Status */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1 w-full lg:w-auto">
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${
              canSubmit
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {canSubmit ? (
              <Unlock className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            ) : (
              <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
            )}
          </div>

          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              {isSurveySubmitted
                ? 'Đã nộp khảo sát thành công'
                : canSubmit
                ? 'Đã sẵn sàng nộp khảo sát!'
                : 'Chưa thể nộp khảo sát'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
              {isSurveySubmitted
                ? 'Bản khảo sát của bạn đã được ghi nhận vào hệ thống.'
                : canSubmit
                ? `Tuyệt vời! Bạn đã hoàn thành ${completedCount}/${totalTargetCount} đánh giá. Hãy kiểm tra lại và nhấn nộp.`
                : `Bạn cần hoàn thành đánh giá tất cả ${totalTargetCount} thành viên trong danh sách để mở nút nộp.`}
            </p>
          </div>
        </div>

        {/* Right: 3-step Stepper + Submit Button */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0 w-full lg:w-auto justify-end">
          {/* Step 1: Đánh giá từng thành viên */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span>Đánh giá từng thành viên</span>
          </div>

          {/* Line connector */}
          <div className="w-4 sm:w-8 h-0.5 bg-slate-200 dark:bg-slate-700 shrink-0" />

          {/* Step 2: Hoàn thành X/X */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                canSubmit
                  ? 'bg-emerald-500 text-white'
                  : 'border-2 border-slate-300 dark:border-slate-600 text-slate-500'
              }`}
            >
              {canSubmit ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : completedCount}
            </div>
            <span>
              Hoàn thành {completedCount}/{totalTargetCount}
            </span>
          </div>

          {/* Line connector */}
          <div className="w-4 sm:w-8 h-0.5 bg-slate-200 dark:bg-slate-700 shrink-0" />

          {/* Step 3: Nộp khảo sát Button */}
          <div className="shrink-0">
            {isSurveySubmitted ? (
              <button
                disabled
                className="h-10 inline-flex items-center justify-center gap-2 px-5 sm:px-6 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-bold shadow-sm opacity-90 cursor-default whitespace-nowrap shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Đã nộp</span>
              </button>
            ) : canSubmit ? (
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="h-10 inline-flex items-center justify-center gap-2 px-6 sm:px-7 rounded-xl bg-[#0B63E5] hover:bg-[#0954C3] text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>Nộp khảo sát ngay</span>
              </button>
            ) : (
              <button
                disabled
                className="h-10 inline-flex items-center justify-center gap-2 px-5 sm:px-6 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 cursor-not-allowed whitespace-nowrap shrink-0"
              >
                <Lock className="w-4 h-4" />
                <span>Nộp khảo sát</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRMATION SUBMIT MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
                <Send className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Xác nhận nộp khảo sát?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Bạn đã hoàn thành toàn bộ đánh giá cho {totalTargetCount} thành viên Core Team trong đợt khảo sát{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedPeriod}
                </span>
                . Bạn có chắc chắn muốn nộp kết quả không?
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300">
              💡 Sau khi nộp, đánh giá của bạn sẽ được bảo mật và tổng hợp tự động vào báo cáo chung của CLB.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Kiểm tra lại
              </button>
              <button
                type="button"
                onClick={handleSubmitSurvey}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
              >
                Xác nhận nộp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 max-w-md w-full shadow-2xl text-center space-y-4 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Nộp khảo sát thành công!
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Cảm ơn bạn đã hoàn thành khảo sát với tinh thần xây dựng và khách quan. Đóng góp của bạn giúp đội ngũ iSSAC ngày càng gắn kết và vững mạnh!
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-500/25 transition-all cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
