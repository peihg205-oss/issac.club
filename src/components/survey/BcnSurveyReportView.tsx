
'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import {
  Users,
  Star,
  Award,
  Lock,
  MessageSquare,
  Filter,
  Search,
  Download,
  CheckCircle2,
  Calendar,
  GraduationCap,
  IdCard,
  Briefcase,
  Mail,
  ChevronRight,
  ChevronDown,
  Plus,
  TrendingUp,
  BarChart3,
  Sparkles,
  ThumbsUp,
  AlertCircle,
  Clock,
  Eye,
  FileText,
  Flag,
  Target,
  Gauge,
  Trophy,
  Sliders,
} from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useClub } from '@/lib/context/ClubContext'
import {
  getStoredSurveyFeedbacks,
  getStoredSurveyEvents,
  updateSurveyEventStatus,
  SurveyFeedbackItem,
  SurveyEventItem,
} from '@/lib/surveyData'
import { formatMemberPosition } from '@/components/views/SurveyView'
import { BcnSurveyConfigManager } from '@/components/survey/BcnSurveyConfigManager'

// Helper to format scores with standard decimal dots '.'
export function fmtScore(val: number | string | undefined | null, decimals: 1 | 2 = 1): string {
  if (val === undefined || val === null) return '0.0'
  if (typeof val === 'number') {
    return val.toFixed(decimals)
  }
  return String(val)
}

interface BcnSurveyReportViewProps {
  selectedEvent: string
  onSelectEvent?: (eventName: string) => void
  onSwitchToSurvey?: () => void
}

export function BcnSurveyReportView({
  selectedEvent,
  onSelectEvent,
  onSwitchToSurvey,
}: BcnSurveyReportViewProps) {
  const { isBCN, currentUser } = useAuth()
  const { members } = useClub()

  // State
  const [feedbacks, setFeedbacks] = useState<SurveyFeedbackItem[]>(() =>
    getStoredSurveyFeedbacks()
  )
  const [surveyEvents, setSurveyEvents] = useState<SurveyEventItem[]>(() =>
    getStoredSurveyEvents()
  )

  const [isEventPickerOpen, setIsEventPickerOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const eventPickerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        eventPickerRef.current &&
        !eventPickerRef.current.contains(e.target as Node)
      ) {
        setIsEventPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Feedback counts by event for picker dropdown
  const feedbackCountsByEvent = useMemo(() => {
    const counts: Record<string, number> = {}
    feedbacks.forEach((f) => {
      counts[f.event] = (counts[f.event] || 0) + 1
    })
    return counts
  }, [feedbacks])

  React.useEffect(() => {
    setFeedbacks(getStoredSurveyFeedbacks())
    setSurveyEvents(getStoredSurveyEvents())
    const handleStorage = () => {
      setFeedbacks(getStoredSurveyFeedbacks())
      setSurveyEvents(getStoredSurveyEvents())
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [selectedEvent])

  const [reportTab, setReportTab] = useState<'charts' | 'feedbacks' | 'config'>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search)
      if (p.get('subtab') === 'feedbacks' || p.get('reportTab') === 'feedbacks') {
        return 'feedbacks'
      }
      if (p.get('subtab') === 'config' || p.get('subtab') === 'events') {
        return 'config'
      }
    }
    return 'charts'
  })
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all')
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedMemberCode, setSelectedMemberCode] = useState<string>('24310088') // Default: Trần Đức Thắng
  const [bcnNotes, setBcnNotes] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const saved = localStorage.getItem('issac_bcn_survey_notes_v1')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  const [toastNoteSaved, setToastNoteSaved] = useState<boolean>(false)

  // Filter Core Team members (excluding BCN)
  const coreMembers = useMemo(() => {
    return members.filter((m) => {
      const isCore = m.is_core || (m as unknown as { is_core_team?: boolean }).is_core_team
      if (!isCore) return false
      if (
        m.department_slug === 'bcn' ||
        m.department_name === 'Ban Chủ nhiệm' ||
        m.department_code === 'B04'
      ) {
        return false
      }
      const pos = (m.position || '').toLowerCase()
      if (
        pos.includes('chủ nhiệm') ||
        pos.includes('phó chủ nhiệm') ||
        pos.includes('bcn')
      ) {
        return false
      }
      return true
    })
  }, [members])

  // Feedbacks for current event
  const eventFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => f.event === selectedEvent)
  }, [feedbacks, selectedEvent])

  // Member Analytics Map
  const memberStatsMap = useMemo(() => {
    const map: Record<
      string,
      {
        totalReviews: number
        avgScore: number
        starCounts: Record<1 | 2 | 3 | 4 | 5, number>
        criteriaAverages: {
          responsibility: number
          taskDelivery: number
          collaboration: number
          initiative: number
        }
        reviews: SurveyFeedbackItem[]
      }
    > = {}

    coreMembers.forEach((m) => {
      const memberReviews = eventFeedbacks.filter(
        (f) => f.targetMemberCode === m.member_code
      )
      const count = memberReviews.length
      const totalScore = memberReviews.reduce((acc, r) => acc + r.rating, 0)
      const avgScore = count > 0 ? Number((totalScore / count).toFixed(2)) : 0

      const starCounts: Record<1 | 2 | 3 | 4 | 5, number> = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      }
      let sumResp = 0
      let sumTask = 0
      let sumCollab = 0
      let sumInit = 0

      memberReviews.forEach((r) => {
        const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5
        starCounts[star] = (starCounts[star] || 0) + 1
        sumResp += r.criteriaScores?.responsibility || r.rating
        sumTask += r.criteriaScores?.taskDelivery || r.rating
        sumCollab += r.criteriaScores?.collaboration || r.rating
        sumInit += r.criteriaScores?.initiative || r.rating
      })

      map[m.member_code] = {
        totalReviews: count,
        avgScore,
        starCounts,
        criteriaAverages: {
          responsibility: count > 0 ? Number((sumResp / count).toFixed(1)) : 0,
          taskDelivery: count > 0 ? Number((sumTask / count).toFixed(1)) : 0,
          collaboration: count > 0 ? Number((sumCollab / count).toFixed(1)) : 0,
          initiative: count > 0 ? Number((sumInit / count).toFixed(1)) : 0,
        },
        reviews: memberReviews,
      }
    })

    return map
  }, [coreMembers, eventFeedbacks])

  // Rankings sorted by avgScore descending
  const memberRankings = useMemo(() => {
    return [...coreMembers]
      .map((m) => ({
        member: m,
        stats: memberStatsMap[m.member_code] || {
          totalReviews: 0,
          avgScore: 0,
          starCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          criteriaAverages: {
            responsibility: 0,
            taskDelivery: 0,
            collaboration: 0,
            initiative: 0,
          },
          reviews: [],
        },
      }))
      .sort((a, b) => {
        if (b.stats.avgScore !== a.stats.avgScore) {
          return b.stats.avgScore - a.stats.avgScore
        }
        return b.stats.totalReviews - a.stats.totalReviews
      })
  }, [coreMembers, memberStatsMap])

  // Overall Event KPIs (Thang điểm 10.0)
  const overallKpis = useMemo(() => {
    const totalReviews = eventFeedbacks.length
    const totalScore = eventFeedbacks.reduce((acc, f) => acc + f.rating, 0)
    const avgScore = totalReviews > 0 ? (totalScore / totalReviews).toFixed(2) : '0.00'

    // Tỷ lệ đánh giá tích cực: rating >= 8.0 trên thang 10 (Mức Tốt & Xuất sắc)
    const positiveCount = eventFeedbacks.filter((f) => f.rating >= 8.0).length
    const positiveRate = totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 0

    const topMember = totalReviews > 0 ? memberRankings[0] : null

    return {
      totalReviews,
      avgScore,
      positiveRate,
      topMember,
    }
  }, [eventFeedbacks, memberRankings])

  // Phân bố Điểm số Đánh giá trên Thang điểm 10.0 của sự kiện (thay thế cho 5 sao cũ)
  const scoreDistribution = useMemo(() => {
    const ranges = [
      { key: '9-10', label: '9.0 - 10.0', tag: 'Xuất sắc', color: 'bg-emerald-500' },
      { key: '8-8.9', label: '8.0 - 8.9', tag: 'Rất tốt', color: 'bg-blue-500' },
      { key: '7-7.9', label: '7.0 - 7.9', tag: 'Đạt chuẩn', color: 'bg-sky-500' },
      { key: '5-6.9', label: '5.0 - 6.9', tag: 'Trung bình', color: 'bg-amber-500' },
      { key: 'below-5', label: 'Dưới 5.0', tag: 'Cần nỗ lực', color: 'bg-rose-500' },
    ]

    const counts: Record<string, number> = {
      '9-10': 0,
      '8-8.9': 0,
      '7-7.9': 0,
      '5-6.9': 0,
      'below-5': 0,
    }

    eventFeedbacks.forEach((f) => {
      const r = f.rating
      if (r >= 9.0) counts['9-10']++
      else if (r >= 8.0) counts['8-8.9']++
      else if (r >= 7.0) counts['7-7.9']++
      else if (r >= 5.0) counts['5-6.9']++
      else counts['below-5']++
    })

    const total = eventFeedbacks.length

    return ranges.map((item) => {
      const count = counts[item.key] || 0
      const pct = total > 0 ? Math.round((count / total) * 100) : 0
      return {
        ...item,
        count,
        pct,
      }
    })
  }, [eventFeedbacks])

  // Overall event criteria averages across all feedbacks (tính trung bình toàn sự kiện từ Core Team)
  const eventCriteriaAverages = useMemo(() => {
    if (eventFeedbacks.length === 0) {
      return {
        responsibility: 0,
        taskDelivery: 0,
        collaboration: 0,
        initiative: 0,
      }
    }
    let totalResp = 0
    let totalTask = 0
    let totalCollab = 0
    let totalInit = 0

    eventFeedbacks.forEach((f) => {
      totalResp += typeof f.criteriaScores?.responsibility === 'number' ? f.criteriaScores.responsibility : f.rating
      totalTask += typeof f.criteriaScores?.taskDelivery === 'number' ? f.criteriaScores.taskDelivery : f.rating
      totalCollab += typeof f.criteriaScores?.collaboration === 'number' ? f.criteriaScores.collaboration : f.rating
      totalInit += typeof f.criteriaScores?.initiative === 'number' ? f.criteriaScores.initiative : f.rating
    })

    const len = eventFeedbacks.length
    return {
      responsibility: Number((totalResp / len).toFixed(1)),
      taskDelivery: Number((totalTask / len).toFixed(1)),
      collaboration: Number((totalCollab / len).toFixed(1)),
      initiative: Number((totalInit / len).toFixed(1)),
    }
  }, [eventFeedbacks])

  // Filtered members for feedback reading
  const filteredRankings = useMemo(() => {
    return memberRankings.filter(({ member }) => {
      if (selectedDeptFilter !== 'all' && member.department_slug !== selectedDeptFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = member.full_name.toLowerCase().includes(q)
        const matchCode = member.member_code.toLowerCase().includes(q)
        const matchDept = (member.department_name || '').toLowerCase().includes(q)
        if (!matchName && !matchCode && !matchDept) return false
      }
      return true
    })
  }, [memberRankings, selectedDeptFilter, searchQuery])

  // Active Member for Detailed Feed
  const activeMemberObj = useMemo(() => {
    const found = memberRankings.find(
      (item) => item.member.member_code === selectedMemberCode
    )
    return found || memberRankings[0] || null
  }, [memberRankings, selectedMemberCode])

  // Filtered reviews of active member (theo thang điểm 10)
  const activeMemberReviews = useMemo(() => {
    if (!activeMemberObj) return []
    return activeMemberObj.stats.reviews.filter((r) => {
      if (selectedRatingFilter === 'all') return true
      if (selectedRatingFilter === 'top') return r.rating >= 8.5
      if (selectedRatingFilter === 'good') return r.rating >= 7.0 && r.rating < 8.5
      if (selectedRatingFilter === 'need_improve') return r.rating < 7.0
      return true
    })
  }, [activeMemberObj, selectedRatingFilter])

  // Save BCN Note
  const handleSaveBcnNote = (memberCode: string, noteText: string) => {
    const updated = {
      ...bcnNotes,
      [memberCode]: noteText,
    }
    setBcnNotes(updated)
    try {
      localStorage.setItem('issac_bcn_survey_notes_v1', JSON.stringify(updated))
      setToastNoteSaved(true)
      setTimeout(() => setToastNoteSaved(false), 2500)
    } catch (e) {
      console.error(e)
    }
  }

  const currentEventObj = useMemo(() => {
    return surveyEvents.find((e) => e.name === selectedEvent) || null
  }, [surveyEvents, selectedEvent])

  const isSelectedEventLocked = Boolean(currentEventObj && currentEventObj.status === 'closed')

  const handleToggleLockCurrentEvent = () => {
    if (!currentEventObj || !isBCN) return
    const nextStatus = currentEventObj.status === 'active' ? 'closed' : 'active'
    const updated = updateSurveyEventStatus(currentEventObj.id, nextStatus)
    setSurveyEvents(updated)
    alert(
      nextStatus === 'closed'
        ? `Đã khóa sổ điểm khảo sát sự kiện "${currentEventObj.name}"! Dữ liệu điểm đã được chốt và bảo lưu an toàn.`
        : `Đã mở lại khảo sát sự kiện "${currentEventObj.name}"!`
    )
  }

  // Export JSON Report
  const handleExportReport = () => {
    const reportData = {
      event: selectedEvent,
      generatedAt: new Date().toISOString(),
      generatedBy: currentUser?.name || 'Ban Chủ nhiệm',
      summary: overallKpis,
      members: memberRankings.map((r) => ({
        memberCode: r.member.member_code,
        fullName: r.member.full_name,
        department: r.member.department_name,
        position: r.member.position,
        avgScore: r.stats.avgScore,
        totalReviews: r.stats.totalReviews,
        bcnNote: bcnNotes[r.member.member_code] || '',
        reviews: r.stats.reviews,
      })),
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `BaoCao_KhaoSat_CoreTeam_${selectedEvent.replace(/\s+/g, '_')}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  // SECURITY GUARD: If not BCN, show access denied
  if (!isBCN) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center max-w-2xl mx-auto my-8 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-[#061651] dark:text-white mb-2">
          Khu vực bảo mật Ban Chủ nhiệm
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          Báo cáo khảo sát và nhận xét đánh giá chéo giữa các thành viên Core Team là thông tin nội bộ được bảo mật nhằm đảm bảo tính khách quan và trung thực. Chỉ tài khoản thuộc <strong>Ban Chủ nhiệm (BCN)</strong> mới có quyền truy cập trang này.
        </p>
        {onSwitchToSurvey && (
          <button
            type="button"
            onClick={onSwitchToSurvey}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0B63E5] hover:bg-[#0954C3] text-white font-bold text-sm shadow-md transition-all cursor-pointer active:scale-95"
          >
            <span>Quay lại trang điền phiếu khảo sát</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. TOP HEADER & CONTROLS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#061651] dark:text-white tracking-tight">
                Báo cáo Đánh giá Khảo sát Core Team
              </h2>
            </div>
            <p className="text-xs sm:text-[13px] text-[#64748B] dark:text-slate-400">
              {reportTab === 'config' ? (
                <span>Thiết lập các đợt mở phiếu khảo sát, quản lý câu hỏi mở rộng và duy trì bộ 4 tiêu chí chuẩn</span>
              ) : reportTab === 'feedbacks' ? (
                <span>
                  Toàn bộ nhận xét chéo, đánh giá chi tiết 4 tiêu chí và ghi chú BCN trong sự kiện{' '}
                  <strong className="text-[#061651] dark:text-slate-200">{selectedEvent || 'Chưa chọn sự kiện'}</strong>
                </span>
              ) : (
                <span>
                  Tổng hợp điểm số, biểu đồ phân tích và toàn bộ nhận xét chéo của các thành viên trong sự kiện{' '}
                  <strong className="text-[#061651] dark:text-slate-200">{selectedEvent || 'Chưa chọn sự kiện'}</strong>
                </span>
              )}
            </p>
          </div>

          {/* Action buttons (Style chuẩn theo từng tab) */}
          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            {reportTab === 'config' ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="h-10 px-4 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs sm:text-[13px] shadow-[0_2px_6px_rgba(2,132,199,0.22)] hover:shadow-[0_4px_10px_rgba(2,132,199,0.3)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer border border-transparent select-none"
                >
                  <Plus className="w-4 h-4 text-white shrink-0" />
                  <span>Tạo sự kiện mới</span>
                </button>

                {onSwitchToSurvey && (
                  <button
                    type="button"
                    onClick={onSwitchToSurvey}
                    className="h-10 px-3.5 sm:px-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-[13px] shadow-2xs hover:shadow-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer select-none"
                  >
                    <Eye className="w-4 h-4 text-[#0284C7] shrink-0" />
                    <span>Xem trang điền phiếu</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleExportReport}
                  className="h-10 px-3.5 sm:px-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-[13px] shadow-2xs hover:shadow-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer select-none"
                  title="Xuất báo cáo tổng hợp"
                >
                  <Download className="w-4 h-4 text-[#0284C7] shrink-0" />
                  <span>Xuất dữ liệu</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleExportReport}
                  className="h-10 px-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200/90 dark:border-slate-700 text-[#061651] dark:text-slate-200 font-bold text-xs sm:text-[13px] shadow-2xs hover:shadow-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer select-none focus:outline-none focus:ring-0"
                  title="Xuất dữ liệu"
                >
                  <Download className="w-4 h-4 text-[#0284C7] shrink-0" />
                  <span>Xuất dữ liệu</span>
                </button>

                {currentEventObj && (
                  <button
                    type="button"
                    onClick={handleToggleLockCurrentEvent}
                    className={`h-10 px-3.5 sm:px-4 rounded-xl font-bold text-xs sm:text-[13px] shadow-2xs hover:shadow-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer border select-none ${
                      isSelectedEventLocked
                        ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                    }`}
                    title={isSelectedEventLocked ? 'Mở lại kỳ khảo sát' : 'Chốt và khóa sổ điểm khảo sát'}
                  >
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>
                      {isSelectedEventLocked
                        ? 'Đã khóa sổ (Mở lại)'
                        : 'Khóa sổ điểm khảo sát'}
                    </span>
                  </button>
                )}

                {onSwitchToSurvey && (
                  <button
                    type="button"
                    onClick={onSwitchToSurvey}
                    className="h-10 px-3.5 sm:px-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-[13px] shadow-2xs hover:shadow-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer select-none"
                  >
                    <Eye className="w-4 h-4 text-[#0284C7] shrink-0" />
                    <span>Trang điền phiếu</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Sub-tab Switcher: Charts vs Feedbacks vs Config (Khớp chuẩn Ảnh 3) */}
        <div className="flex items-center justify-between gap-3 pt-4 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex-wrap">
            <button
              type="button"
              onClick={() => setReportTab('charts')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none focus:outline-none focus:ring-0 ${
                reportTab === 'charts'
                  ? 'bg-white dark:bg-slate-900 text-[#061651] dark:text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-[#0284C7] shrink-0" />
              <span>Biểu đồ & Xếp hạng Core Team</span>
            </button>

            <button
              type="button"
              onClick={() => setReportTab('feedbacks')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none focus:outline-none focus:ring-0 ${
                reportTab === 'feedbacks'
                  ? 'bg-white dark:bg-slate-900 text-[#061651] dark:text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-[#0284C7] shrink-0" />
              <span>Đọc nhận xét chi tiết từng người</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-[#0284C7] dark:bg-sky-950/60 dark:text-sky-300">
                {eventFeedbacks.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setReportTab('config')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none focus:outline-none focus:ring-0 ${
                reportTab === 'config'
                  ? 'bg-white dark:bg-slate-900 text-[#061651] dark:text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4 text-[#0284C7] shrink-0" />
              <span>Tạo sự kiện & Câu hỏi đánh giá</span>
            </button>
          </div>

          {/* Hộp chọn sự kiện khảo sát dành cho BCN (Chuẩn theo Ảnh 3) */}
          <div ref={eventPickerRef} className="relative">
            <button
              type="button"
              onClick={() => setIsEventPickerOpen(!isEventPickerOpen)}
              className="h-10 sm:h-11 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/80 hover:border-[#0284C7] dark:hover:border-sky-500 shadow-2xs hover:shadow-xs transition-all cursor-pointer group text-left flex items-center gap-2.5 focus:outline-none focus:ring-0 active:scale-95"
            >
              <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-[#0284C7] dark:text-sky-400 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0 pr-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block leading-tight">
                  SỰ KIỆN KHẢO SÁT
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-[13px] font-black text-[#061651] dark:text-white truncate max-w-[140px] sm:max-w-[180px]">
                    {selectedEvent || 'Chưa chọn sự kiện'}
                  </span>
                  {selectedEvent && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-sky-100 text-[#0284C7] dark:bg-sky-950/60 dark:text-sky-300">
                      {eventFeedbacks.length} lượt
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform shrink-0 ${
                  isEventPickerOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isEventPickerOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-2 space-y-1 animate-in fade-in-50 zoom-in-95 duration-150">
                <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span>Chọn đợt khảo sát</span>
                  <span>{surveyEvents.length} sự kiện</span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                  {surveyEvents.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">
                      Chưa có sự kiện khảo sát nào
                    </div>
                  ) : (
                    surveyEvents.map((evt) => {
                      const count = feedbackCountsByEvent[evt.name] || 0
                      const isSelected = selectedEvent === evt.name
                      return (
                        <button
                          key={evt.id}
                          type="button"
                          onClick={() => {
                            onSelectEvent?.(evt.name)
                            setIsEventPickerOpen(false)
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-sky-50 dark:bg-sky-950/60 text-[#0284C7]'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs sm:text-sm font-bold truncate block">
                                {evt.name}
                              </span>
                              {evt.status === 'active' ? (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Đang mở" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" title="Đã đóng" />
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {evt.date}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                            {count} lượt
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>

                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setReportTab('config')
                      setIsEventPickerOpen(false)
                    }}
                    className="w-full py-2 px-3 text-center text-xs font-bold text-[#0284C7] hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Quản lý thiết lập tất cả sự kiện</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {reportTab === 'config' ? (
        <BcnSurveyConfigManager
          selectedEvent={selectedEvent}
          onSelectEvent={onSelectEvent}
          onSwitchToSurvey={onSwitchToSurvey}
          hideCompactToolbar={true}
          isCreateModalOpen={isCreateModalOpen}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onCloseCreateModal={() => setIsCreateModalOpen(false)}
          events={surveyEvents}
          onEventsChange={setSurveyEvents}
        />
      ) : (
        <>

      {/* 2. 4 THẺ CHỈ SỐ KPI CHUẨN STYLE ẢNH 2 (Nền Pastel Nhạt Không Viền, Bo Góc rounded-xl, Đổ Bóng Khối Box) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI Card 1: Tổng lượt đánh giá (Style Thẻ Xanh Dương Nhạt #F0F9FF) */}
        <div
          onClick={() => setReportTab('feedbacks')}
          className="p-3.5 sm:p-4 rounded-xl bg-[#F0F9FF] dark:bg-sky-950/30 flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
        >
          <div className="space-y-0.5">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-300 block">
              Tổng lượt đánh giá
            </span>
            <div className="flex items-baseline gap-1.5 py-0.5">
              <span className="text-2xl sm:text-[28px] font-black text-[#0284C7] dark:text-sky-400 tracking-tight leading-none">
                {overallKpis.totalReviews}
              </span>
              <span className="text-[11.5px] font-bold text-[#0284C7] dark:text-sky-300">
                phiếu gửi
              </span>
            </div>
            <span className="text-[11.5px] font-semibold text-[#0284C7] dark:text-sky-400 block hover:underline">
              Xem chi tiết
            </span>
          </div>
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-sky-300/70 bg-white/60 dark:bg-slate-800/80 flex items-center justify-center text-[#0284C7] shrink-0">
            <Users className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* KPI Card 2: Điểm TB Core Team (Style Thẻ Vàng Pastel #FFFBEB) */}
        <div
          onClick={() => setReportTab('charts')}
          className="p-3.5 sm:p-4 rounded-xl bg-[#FFFBEB] dark:bg-amber-950/30 flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
        >
          <div className="space-y-0.5">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-300 block">
              Điểm TB Core Team
            </span>
            <div className="flex items-baseline gap-1 py-0.5">
              <span className="text-2xl sm:text-[28px] font-black text-[#D97706] dark:text-amber-400 tracking-tight leading-none">
                {overallKpis.avgScore}
              </span>
              <span className="text-xs font-bold text-[#D97706]/70 dark:text-amber-300/70">
                / 10.0
              </span>
            </div>
            <span className="text-[11.5px] font-semibold text-[#D97706] dark:text-amber-400 block hover:underline">
              {overallKpis.totalReviews > 0 ? 'Đạt mức Xuất sắc toàn diện' : 'Chưa có dữ liệu khảo sát'}
            </span>
          </div>
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-amber-300/70 bg-white/60 dark:bg-slate-800/80 flex items-center justify-center text-[#D97706] shrink-0">
            <Star className="w-4.5 h-4.5 fill-amber-500/20 stroke-[1.75]" />
          </div>
        </div>

        {/* KPI Card 3: Đánh giá tích cực (Style Thẻ Xanh Lá Pastel #F0FDF4) */}
        <div
          onClick={() => setReportTab('feedbacks')}
          className="p-3.5 sm:p-4 rounded-xl bg-[#F0FDF4] dark:bg-emerald-950/30 flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
        >
          <div className="space-y-0.5">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-300 block">
              Đánh giá tích cực
            </span>
            <div className="flex items-baseline gap-1.5 py-0.5">
              <span className="text-2xl sm:text-[28px] font-black text-[#16A34A] dark:text-emerald-400 tracking-tight leading-none">
                {overallKpis.positiveRate}%
              </span>
              <span className="text-[11.5px] font-bold text-[#16A34A]/80 dark:text-emerald-300">
                ≥ 8.0 điểm
              </span>
            </div>
            <span className="text-[11.5px] font-semibold text-[#16A34A] dark:text-emerald-400 block hover:underline">
              {overallKpis.totalReviews > 0 ? 'Đóng góp tinh thần đoàn kết cao' : 'Chưa có phiếu gửi'}
            </span>
          </div>
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-emerald-300/70 bg-white/60 dark:bg-slate-800/80 flex items-center justify-center text-[#16A34A] shrink-0">
            <CheckCircle2 className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* KPI Card 4: Thành viên điểm cao nhất (Style Thẻ Tím Pastel #FAF5FF) */}
        <div
          onClick={() => {
            if (overallKpis.topMember) {
              setSelectedMemberCode(overallKpis.topMember.member.member_code)
              setReportTab('feedbacks')
            }
          }}
          className="p-3.5 sm:p-4 rounded-xl bg-[#FAF5FF] dark:bg-purple-950/30 flex items-center justify-between gap-2 cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
        >
          <div className="space-y-0.5 min-w-0 flex-1">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-300 block">
              Điểm cao nhất sự kiện
            </span>
            <div className="py-0.5">
              <span
                className="text-base sm:text-[17px] font-black text-[#9333EA] dark:text-purple-400 tracking-tight leading-snug line-clamp-2 break-words block"
                title={overallKpis.totalReviews > 0 ? overallKpis.topMember?.member.full_name : 'Chưa có dữ liệu'}
              >
                {overallKpis.totalReviews > 0 ? (overallKpis.topMember?.member.full_name || 'Chưa có') : 'Chưa có dữ liệu'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#9333EA] dark:text-purple-400 flex-wrap">
              {overallKpis.totalReviews > 0 && overallKpis.topMember ? (
                <>
                  <span className="hover:underline truncate max-w-[120px]">
                    {overallKpis.topMember.member.department_name || 'Ban Tư vấn'}
                  </span>
                  <span className="text-purple-300 dark:text-purple-700 font-light select-none">|</span>
                  <span className="px-1.5 py-0.2 rounded-md text-[10.5px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 shrink-0">
                    {fmtScore(overallKpis.topMember.stats.avgScore, 1)}★
                  </span>
                </>
              ) : (
                <span className="text-slate-400 font-normal">Đang chờ thành viên đánh giá</span>
              )}
            </div>
          </div>
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-purple-300/70 bg-white/60 dark:bg-slate-800/80 flex items-center justify-center text-[#9333EA] shrink-0">
            <Award className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>
      </div>

      {/* 3. TAB 1: CHARTS & CORE TEAM LEADERBOARD (Chuẩn Style Ảnh 2) */}
      {reportTab === 'charts' && (
        <div className="space-y-6">
          {/* Main Visual: Bảng so sánh tiến trình điểm từng thành viên Core Team */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            {/* Header chuẩn Style Ảnh 2 với Icon Box bo góc + Filter tabs màu xanh thương hiệu */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0284C7] border border-sky-200/60 shadow-2xs flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#061651] dark:text-white leading-tight">
                    Xếp hạng & Tiến trình Điểm đánh giá Core Team
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thanh đo điểm trung bình (thang điểm 10.0) và phân bố lượt nhận xét của từng thành viên
                  </p>
                </div>
              </div>

              {/* Department Filter buttons (Chuẩn Style Ảnh 2) */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-800 rounded-xl self-start sm:self-auto flex-wrap">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'truyen-thong', label: 'Truyền thông' },
                  { id: 'tu-van', label: 'Tư vấn' },
                  { id: 'nhan-su', label: 'Nhân sự' },
                ].map((dept) => (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => setSelectedDeptFilter(dept.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedDeptFilter === dept.id
                      ? 'bg-[#0284C7] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    {dept.label}
                  </button>
                ))}
              </div>
            </div>

            {/* HÀNG 4 THẺ CHỈ SỐ MỐC CHUẨN ĐÁNH GIÁ (Chuẩn Style Thang 10) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-1 pb-1">
              {/* Card 1: Mục tiêu Tốt */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#F0FDF4] dark:bg-emerald-950/30 flex items-center justify-between transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
                <div className="space-y-0.5">
                  <span className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-300 block">
                    Mục tiêu Tốt
                  </span>
                  <div className="flex items-baseline gap-1 py-0.5">
                    <span className="text-lg sm:text-[22px] font-black text-[#16A34A] dark:text-emerald-400 tracking-tight leading-none">
                      8.5 - 10.0
                    </span>
                    <span className="text-[11.5px] font-bold text-[#16A34A]/80 dark:text-emerald-300">
                      điểm
                    </span>
                  </div>
                  <span className="text-[11.5px] font-semibold text-[#16A34A] dark:text-emerald-400 block">
                    Xuất sắc
                  </span>
                </div>
                <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-emerald-300/70 bg-white/60 dark:bg-slate-800/80 flex items-center justify-center text-[#16A34A] shrink-0">
                  <Flag className="w-4.5 h-4.5 stroke-[1.75]" />
                </div>
              </div>

              {/* Card 2: Mức chuẩn CLB */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#F0F9FF] dark:bg-sky-950/30 flex items-center justify-between transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
                <div className="space-y-0.5">
                  <span className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-300 block">
                    Mức chuẩn CLB
                  </span>
                  <div className="flex items-baseline gap-1 py-0.5">
                    <span className="text-lg sm:text-[22px] font-black text-[#0284C7] dark:text-sky-400 tracking-tight leading-none">
                      7.0 - 8.4
                    </span>
                    <span className="text-[11.5px] font-bold text-[#0284C7]/80 dark:text-sky-300">
                      điểm
                    </span>
                  </div>
                  <span className="text-[11.5px] font-semibold text-[#0284C7] dark:text-sky-400 block">
                    Đạt yêu cầu
                  </span>
                </div>
                <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-sky-300/70 bg-white/60 dark:bg-slate-800/80 flex items-center justify-center text-[#0284C7] shrink-0">
                  <Target className="w-4.5 h-4.5 stroke-[1.75]" />
                </div>
              </div>

              {/* Card 3: Mốc khởi điểm */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#FFFBEB] dark:bg-amber-950/30 flex items-center justify-between transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
                <div className="space-y-0.5">
                  <span className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-300 block">
                    Mốc khởi điểm
                  </span>
                  <div className="flex items-baseline gap-1 py-0.5">
                    <span className="text-lg sm:text-[22px] font-black text-[#D97706] dark:text-amber-400 tracking-tight leading-none">
                      Dưới 7.0
                    </span>
                    <span className="text-[11.5px] font-bold text-[#D97706]/80 dark:text-amber-300">
                      điểm
                    </span>
                  </div>
                  <span className="text-[11.5px] font-semibold text-[#D97706] dark:text-amber-400 block">
                    Cần cố gắng
                  </span>
                </div>
                <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-amber-300/70 bg-white/60 dark:bg-slate-800/80 flex items-center justify-center text-[#D97706] shrink-0">
                  <TrendingUp className="w-4.5 h-4.5 stroke-[1.75]" />
                </div>
              </div>

              {/* Card 4: Thang điểm */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/40 flex items-center justify-between transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
                <div className="space-y-0.5">
                  <span className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-300 block">
                    Thang điểm
                  </span>
                  <div className="flex items-baseline gap-1 py-0.5">
                    <span className="text-lg sm:text-[22px] font-black text-[#061651] dark:text-white tracking-tight leading-none">
                      0 - 10.0
                    </span>
                    <span className="text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                      điểm
                    </span>
                  </div>
                  <span className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 block">
                    Thang điểm 10 chuẩn
                  </span>
                </div>
                <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-slate-300/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/80 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                  <Gauge className="w-4.5 h-4.5 stroke-[1.75]" />
                </div>
              </div>
            </div>

            {/* List of Member Performance Bars */}
            <div className="space-y-3.5">
              {filteredRankings.map(({ member, stats }, idx) => {
                const percent = Math.min(100, Math.max(0, (stats.avgScore / 10) * 100))
                const isTop3 = idx < 3 && selectedDeptFilter === 'all'

                return (
                  <div
                    key={member.member_code}
                    className="p-3.5 sm:p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
                  >
                    {/* Member Info */}
                    <div className="flex items-center gap-3.5 min-w-[240px]">
                      {/* Rank Medal */}
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${idx === 0
                          ? 'bg-amber-100 text-amber-700 border border-amber-300'
                          : idx === 1
                            ? 'bg-slate-200 text-slate-700 border border-slate-300'
                            : idx === 2
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-white/80 dark:bg-slate-800 text-slate-500 border border-slate-200/80 dark:border-slate-700'
                          }`}
                      >
                        {idx + 1}
                      </span>

                      {/* Avatar */}
                      <div className="relative w-11 h-11 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-blue-100 shrink-0">
                        {member.avatar_url ? (
                          <Image
                            src={member.avatar_url}
                            alt={member.full_name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-blue-700">
                            {member.full_name.trim().slice(-1)}
                          </div>
                        )}
                      </div>

                      {/* Name & Dept */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-[#061651] dark:text-white truncate" title={member.full_name}>
                            {member.full_name}
                          </span>
                          {isTop3 && (
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                          {formatMemberPosition(member.position, member.department_name || '')}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar & Visual Score */}
                    <div className="flex-1 max-w-xl flex flex-col justify-center">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-500">
                          Điểm đánh giá trung bình
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span className="font-black text-sm text-[#061651] dark:text-white">
                            {stats.avgScore > 0 ? fmtScore(stats.avgScore, 2) : 'Chưa có'}
                          </span>
                          <span className="text-slate-400">/ 10.0</span>
                        </div>
                      </div>

                      {/* Colored Progress Bar */}
                      <div className="w-full h-3 bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${stats.avgScore >= 8.5
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : stats.avgScore >= 7.0
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                              : 'bg-gradient-to-r from-amber-500 to-orange-400'
                            }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Action button to jump to detailed feedback */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMemberCode(member.member_code)
                        setReportTab('feedbacks')
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-[#0B63E5] font-bold text-xs shadow-2xs transition-all cursor-pointer shrink-0 self-end md:self-center"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Đọc {stats.totalReviews} nhận xét</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Secondary Grid: 2 Analytical Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {/* Card 1: Phân bố điểm số đánh giá (Thang điểm 10.0) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
              <h3 className="text-base sm:text-lg font-black text-[#061651] dark:text-white mb-1">
                Phân bố Điểm số Đánh giá
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Tỷ lệ phần trăm các mức điểm trên thang điểm 10.0 của sự kiện
              </p>

              <div className="space-y-4">
                {scoreDistribution.map((item) => (
                  <div key={item.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0`} />
                        <span className="font-extrabold text-sm text-[#061651] dark:text-white tracking-tight">
                          {item.label}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600 font-light select-none">|</span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {item.tag}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        <span className="font-black text-sm text-[#061651] dark:text-white">{item.count}</span>
                        <span className="text-slate-400 ml-1.5 font-medium">({item.pct}%)</span>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: 4 Tiêu chí cốt lõi của Core Team */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
              <h3 className="text-base sm:text-lg font-black text-[#061651] dark:text-white mb-1">
                Đánh giá theo 4 Tiêu chí Cốt lõi
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Chỉ số năng lực phối hợp bình quân của toàn bộ Core Team
              </p>

              <div className="space-y-4">
                {[
                  {
                    name: 'Tinh thần trách nhiệm & Chủ động',
                    score: eventFeedbacks.length > 0 ? fmtScore(eventCriteriaAverages.responsibility, 1) : 'Chưa có',
                    scoreNum: eventCriteriaAverages.responsibility,
                    desc: 'Có mặt đúng giờ, chủ động nhận việc và hoàn thành đúng hạn',
                    color: 'from-blue-500 to-indigo-600',
                  },
                  {
                    name: 'Hiệu quả thực thi nhiệm vụ',
                    score: eventFeedbacks.length > 0 ? fmtScore(eventCriteriaAverages.taskDelivery, 1) : 'Chưa có',
                    scoreNum: eventCriteriaAverages.taskDelivery,
                    desc: 'Chất lượng ấn phẩm, kỹ thuật, đón tiếp đạt chuẩn cao',
                    color: 'from-emerald-500 to-teal-600',
                  },
                  {
                    name: 'Kỹ năng phối hợp & Giao tiếp',
                    score: eventFeedbacks.length > 0 ? fmtScore(eventCriteriaAverages.collaboration, 1) : 'Chưa có',
                    scoreNum: eventCriteriaAverages.collaboration,
                    desc: 'Trao đổi nhịp nhàng giữa các ban, thái độ hòa đồng',
                    color: 'from-purple-500 to-pink-600',
                  },
                  {
                    name: 'Tác phong & Xử lý phát sinh',
                    score: eventFeedbacks.length > 0 ? fmtScore(eventCriteriaAverages.initiative, 1) : 'Chưa có',
                    scoreNum: eventCriteriaAverages.initiative,
                    desc: 'Bình tĩnh ứng phó tình huống trên sân khấu và hậu trường',
                    color: 'from-amber-500 to-orange-600',
                  },
                ].map((crit) => (
                  <div key={crit.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-[#061651] dark:text-white">
                        {crit.name}
                      </span>
                      <span className="font-extrabold text-[#0B63E5]">
                        {crit.score}{eventFeedbacks.length > 0 ? ' / 10.0' : ''}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${crit.color}`}
                        style={{ width: `${(crit.scoreNum / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      {crit.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: DETAILED FEEDBACK READER (ĐỌC KHẢO SÁT TỪNG NGƯỜI) */}
      {reportTab === 'feedbacks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Left Column: Member Selector List (4 cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#061651] dark:text-white">
                Chọn thành viên ({filteredRankings.length})
              </h3>
              <span className="text-xs text-slate-400">Core Team</span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên thành viên..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Department Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'truyen-thong', label: 'Truyền thông' },
                { id: 'tu-van', label: 'Tư vấn' },
                { id: 'nhan-su', label: 'Nhân sự' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDeptFilter(d.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${selectedDeptFilter === d.id
                    ? 'bg-[#061651] text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Members Scroll List */}
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {filteredRankings.map(({ member, stats }) => {
                const isSelected = member.member_code === selectedMemberCode

                return (
                  <button
                    key={member.member_code}
                    type="button"
                    onClick={() => setSelectedMemberCode(member.member_code)}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 border ${isSelected
                      ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-300 dark:border-sky-700 shadow-[0_2px_8px_rgba(2,132,199,0.08)]'
                      : 'bg-[#F1F5F9] dark:bg-slate-800/60 border-transparent shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:bg-slate-200/70 dark:hover:bg-slate-750'
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-blue-100 shrink-0">
                        {member.avatar_url ? (
                          <Image
                            src={member.avatar_url}
                            alt={member.full_name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-blue-700">
                            {member.full_name.trim().slice(-1)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span
                          title={member.full_name}
                          className={`font-bold text-xs block truncate ${isSelected
                            ? 'text-[#0B63E5] dark:text-blue-300'
                            : 'text-slate-800 dark:text-slate-200'
                            }`}
                        >
                          {member.full_name}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {formatMemberPosition(member.position, member.department_name || '')}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 justify-end">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span className="font-extrabold text-xs text-[#061651] dark:text-white">
                          {stats.avgScore > 0 ? fmtScore(stats.avgScore, 1) : '-'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        {stats.totalReviews} FB
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Column: Member Dossier & Feedback Feed (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {activeMemberObj ? (
              <>
                {/* Member Profile Overview Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white dark:border-slate-700 bg-gradient-to-br from-blue-100 to-indigo-100 shadow-xs shrink-0 flex items-center justify-center">
                        {activeMemberObj.member.avatar_url ? (
                          <Image
                            src={activeMemberObj.member.avatar_url}
                            alt={activeMemberObj.member.full_name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-black text-2xl text-blue-700">
                            {activeMemberObj.member.full_name.trim().slice(-1)}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg sm:text-xl font-extrabold text-[#061651] dark:text-white">
                            {activeMemberObj.member.full_name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-[#0B63E5] dark:bg-blue-900/60 dark:text-blue-300">
                            Core Team
                          </span>
                        </div>
                        <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 flex items-center flex-wrap gap-x-2 gap-y-0.5">
                          <span>{formatMemberPosition(activeMemberObj.member.position, activeMemberObj.member.department_name || '')}</span>
                          <span className="text-slate-300 dark:text-slate-600 font-light select-none">|</span>
                          <span>Mã SV: {activeMemberObj.member.student_id || activeMemberObj.member.member_code}</span>
                          <span className="text-slate-300 dark:text-slate-600 font-light select-none">|</span>
                          <span>Lớp: {activeMemberObj.member.class_name || 'Khóa 2024'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Overall Score Badge */}
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end self-start sm:self-auto bg-[#FFFBEB] dark:bg-amber-950/30 p-3 sm:p-3.5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border-0">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                        <span className="text-2xl font-black text-[#061651] dark:text-white">
                          {activeMemberObj.stats.totalReviews > 0
                            ? fmtScore(activeMemberObj.stats.avgScore, 2)
                            : 'Chưa có'}
                        </span>
                        <span className="text-xs text-slate-400">/ 10.0</span>
                      </div>
                      <span className="text-xs text-[#D97706] dark:text-amber-300 font-bold">
                        {activeMemberObj.stats.totalReviews} lượt nhận xét
                      </span>
                    </div>
                  </div>

                  {/* 4 Criteria Gauges for this member */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                    <div className="bg-[#F8FAFC] dark:bg-slate-800/40 p-3 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
                      <span className="text-[11px] text-slate-400 block font-medium">Trách nhiệm</span>
                      <span className="text-base font-extrabold text-[#061651] dark:text-white mt-0.5 block">
                        {activeMemberObj.stats.totalReviews > 0
                          ? `${fmtScore(activeMemberObj.stats.criteriaAverages.responsibility, 1)} / 10`
                          : 'Chưa có'}
                      </span>
                    </div>
                    <div className="bg-[#F8FAFC] dark:bg-slate-800/40 p-3 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
                      <span className="text-[11px] text-slate-400 block font-medium">Thực thi nhiệm vụ</span>
                      <span className="text-base font-extrabold text-[#061651] dark:text-white mt-0.5 block">
                        {activeMemberObj.stats.totalReviews > 0
                          ? `${fmtScore(activeMemberObj.stats.criteriaAverages.taskDelivery, 1)} / 10`
                          : 'Chưa có'}
                      </span>
                    </div>
                    <div className="bg-[#F8FAFC] dark:bg-slate-800/40 p-3 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
                      <span className="text-[11px] text-slate-400 block font-medium">Phối hợp & Giao tiếp</span>
                      <span className="text-base font-extrabold text-[#061651] dark:text-white mt-0.5 block">
                        {activeMemberObj.stats.totalReviews > 0
                          ? `${fmtScore(activeMemberObj.stats.criteriaAverages.collaboration, 1)} / 10`
                          : 'Chưa có'}
                      </span>
                    </div>
                    <div className="bg-[#F8FAFC] dark:bg-slate-800/40 p-3 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
                      <span className="text-[11px] text-slate-400 block font-medium">Chủ động sáng tạo</span>
                      <span className="text-base font-extrabold text-[#061651] dark:text-white mt-0.5 block">
                        {activeMemberObj.stats.totalReviews > 0
                          ? `${fmtScore(activeMemberObj.stats.criteriaAverages.initiative, 1)} / 10`
                          : 'Chưa có'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* BCN Private Note Box for this member */}
                <div className="bg-[#FFFBEB] dark:bg-amber-950/30 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] border-0 p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#92400E] dark:text-amber-300">
                      Ghi chú nội bộ của Ban Chủ nhiệm về thành viên này (Bảo mật)
                    </span>
                    {toastNoteSaved && (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã lưu ghi chú!
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    defaultValue={bcnNotes[activeMemberObj.member.member_code] || ''}
                    onBlur={(e) => handleSaveBcnNote(activeMemberObj.member.member_code, e.target.value)}
                    placeholder="Nhập ghi chú riêng của BCN (định hướng bồi dưỡng, phân công sự kiện tới, lưu ý khen thưởng...)"
                    className="w-full px-3.5 py-2.5 rounded-xl border-0 shadow-[0_2px_8px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:shadow-[0_4px_12px_rgba(217,119,6,0.12)] transition-all min-h-[60px] resize-y"
                  />
                  <span className="text-[10px] text-[#B45309] dark:text-amber-400/80 mt-1.5 block">
                    Ghi chú tự động lưu khi bạn bấm ra ngoài ô nhập. Chỉ BCN mới thấy được phần này.
                  </span>
                </div>

                {/* Feedbacks Stream Header & Filter */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <h4 className="text-base font-black text-[#061651] dark:text-white">
                    Chi tiết nhận xét từ các thành viên ({activeMemberReviews.length})
                  </h4>

                  {/* Rating Filter Thang 10 */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400 text-xs hidden sm:inline">Lọc điểm:</span>
                    {[
                      { key: 'all', label: 'Tất cả' },
                      { key: 'top', label: '≥ 8.5' },
                      { key: 'good', label: '7.0 - 8.4' },
                      { key: 'need_improve', label: '< 7.0' },
                    ].map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setSelectedRatingFilter(f.key)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${selectedRatingFilter === f.key
                          ? 'bg-[#061651] text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900'
                          }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FEEDBACK CARDS STREAM */}
                <div className="space-y-4">
                  {activeMemberReviews.length > 0 ? (
                    activeMemberReviews.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm space-y-3.5"
                      >
                        {/* Reviewer Header */}
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap">
                          <div className="flex items-center gap-3">
                            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-blue-100 shrink-0">
                              {item.evaluatorAvatarUrl ? (
                                <Image
                                  src={item.evaluatorAvatarUrl}
                                  alt={item.evaluatorName}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-xs text-blue-700">
                                  {item.evaluatorName.trim().slice(-1)}
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="font-extrabold text-sm text-[#061651] dark:text-white block">
                                {item.evaluatorName}
                              </span>
                              <span className="text-xs text-slate-400 block">
                                {item.evaluatorRole || item.evaluatorDept}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Stars Badge */}
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span>{item.rating} / 10.0</span>
                              <span className="font-normal text-[11px] text-amber-700/80">
                                ({item.rating >= 8.5 ? 'Xuất sắc' : item.rating >= 7.0 ? 'Rất tốt' : 'Tốt'})
                              </span>
                            </span>

                            <span className="text-[11px] text-slate-400 hidden sm:inline">
                              {new Date(item.submittedAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>

                        {/* Question 1: Nhận xét sau sự kiện */}
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-[#061651] dark:text-slate-200 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            Nhận xét sau sự kiện:
                          </span>
                          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-slate-50/70 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed font-normal whitespace-pre-wrap break-words">
                            {item.feedback || 'Không có nhận xét chi tiết'}
                          </p>
                        </div>

                        {/* Question 2: Mong muốn cải thiện */}
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Góp ý / Mong muốn cải thiện:
                          </span>
                          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-amber-50/30 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-100/70 dark:border-amber-900/30 leading-relaxed font-normal whitespace-pre-wrap break-words">
                            {item.improvement || 'Thành viên hoàn thành tốt, không có yêu cầu cải thiện'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 text-xs">
                      Không có nhận xét nào phù hợp với bộ lọc điểm đã chọn
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
                Vui lòng chọn một thành viên bên trái để đọc chi tiết khảo sát
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}
