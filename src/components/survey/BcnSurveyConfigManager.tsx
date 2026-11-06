'use client'

import React, { useState, useEffect } from 'react'
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Star,
  Sparkles,
  ShieldCheck,
  Users,
  Award,
  AlertCircle,
  FileText,
  Sliders,
  Check,
  ChevronRight,
  Eye,
  BarChart3,
  MessageSquare,
  Lock,
  X,
} from 'lucide-react'
import {
  CORE_EVALUATION_CRITERIA,
  SurveyEventItem,
  SurveyQuestionItem,
  getStoredSurveyEvents,
  saveNewSurveyEvent,
  updateSurveyEventStatus,
  deleteSurveyEvent,
  getStoredCustomQuestions,
  saveCustomQuestions,
  getStoredSurveyFeedbacks,
  isSurveyEventExpired,
} from '@/lib/surveyData'

interface BcnSurveyConfigManagerProps {
  selectedEvent: string
  onSelectEvent?: (eventName: string) => void
  onSwitchToSurvey?: () => void
}

export function BcnSurveyConfigManager({
  selectedEvent,
  onSelectEvent,
  onSwitchToSurvey,
}: BcnSurveyConfigManagerProps) {
  // 1. Events State
  const [events, setEvents] = useState<SurveyEventItem[]>(() => getStoredSurveyEvents())
  const [feedbacks, setFeedbacks] = useState(() => getStoredSurveyFeedbacks())

  // Create Event Form State
  const [showCreateEventModal, setShowCreateEventModal] = useState<boolean>(false)
  const [newEventName, setNewEventName] = useState<string>('')
  const [newEventDate, setNewEventDate] = useState<string>(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [newEventEndDate, setNewEventEndDate] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  })
  const [newEventDesc, setNewEventDesc] = useState<string>('')
  const [newEventStatus, setNewEventStatus] = useState<'active' | 'closed'>('active')
  const [newEventTarget, setNewEventTarget] = useState<string>('Toàn bộ Core Team (trừ BCN)')
  const [eventErrorMessage, setEventErrorMessage] = useState<string>('')

  // 2. Custom Questions State for currently selected event
  const [customQuestions, setCustomQuestions] = useState<SurveyQuestionItem[]>(() =>
    getStoredCustomQuestions(selectedEvent)
  )
  const [showAddQuestionModal, setShowAddQuestionModal] = useState<boolean>(false)
  const [newQuestionTitle, setNewQuestionTitle] = useState<string>('')
  const [newQuestionDesc, setNewQuestionDesc] = useState<string>('')
  const [newQuestionType, setNewQuestionType] = useState<'rating_stars' | 'textarea' | 'text'>('textarea')
  const [newQuestionRequired, setNewQuestionRequired] = useState<boolean>(false)
  const [questionError, setQuestionError] = useState<string>('')

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Reload questions when selectedEvent changes
  useEffect(() => {
    setCustomQuestions(getStoredCustomQuestions(selectedEvent))
  }, [selectedEvent])

  // Support openModal query param for direct navigation or deep linking
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('openModal=create-event')) {
      setShowCreateEventModal(true)
    }
  }, [])

  // Sync on storage event
  useEffect(() => {
    const handleStorage = () => {
      setEvents(getStoredSurveyEvents())
      setFeedbacks(getStoredSurveyFeedbacks())
      setCustomQuestions(getStoredCustomQuestions(selectedEvent))
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [selectedEvent])

  // Handle Create Event
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEventName.trim()) {
      setEventErrorMessage('Vui lòng nhập tên sự kiện đánh giá!')
      return
    }

    if (newEventDate && newEventEndDate && newEventEndDate < newEventDate) {
      setEventErrorMessage('Ngày kết thúc phải diễn ra sau hoặc cùng Ngày bắt đầu!')
      return
    }

    const newId = `evt-${Date.now()}`
    const item: SurveyEventItem = {
      id: newId,
      name: newEventName.trim(),
      date: newEventDate || new Date().toISOString().split('T')[0],
      endDate: newEventEndDate || undefined,
      status: newEventStatus,
      description: newEventDesc.trim() || 'Phiếu khảo sát & đánh giá chéo thành viên Core Team',
      targetGroup: newEventTarget.trim() || 'Toàn bộ Core Team (trừ BCN)',
      createdAt: new Date().toISOString(),
    }

    const updated = saveNewSurveyEvent(item)
    try {
      // Đảm bảo sự kiện mới tạo luôn là mới hẳn (0 đánh giá, sạch sẽ dữ liệu)
      localStorage.setItem(`issac_survey_evaluations_${encodeURIComponent(item.name)}`, JSON.stringify({}))
    } catch (err) {
      console.error(err)
    }

    setEvents(updated)
    setNewEventName('')
    setNewEventDesc('')
    setEventErrorMessage('')
    setShowCreateEventModal(false)
    showToast(`Đã tạo thành công sự kiện "${item.name}"!`)

    if (onSelectEvent) {
      onSelectEvent(item.name)
    }
  }

  // Handle Toggle Event Status
  const handleToggleStatus = (id: string, currentStatus: 'active' | 'closed') => {
    const nextStatus = currentStatus === 'active' ? 'closed' : 'active'
    const updated = updateSurveyEventStatus(id, nextStatus)
    setEvents(updated)
    showToast(nextStatus === 'active' ? 'Đã mở khảo sát sự kiện!' : 'Đã đóng khảo sát sự kiện!')
  }

  // Handle Delete Event
  const handleDeleteEvent = (id: string, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa sự kiện "${name}"?`)) {
      try {
        localStorage.removeItem(`issac_survey_evaluations_${encodeURIComponent(name)}`)
      } catch (err) {
        console.error(err)
      }
      const updated = deleteSurveyEvent(id)
      setEvents(updated)
      showToast(`Đã xóa sự kiện "${name}"!`)
      if (selectedEvent === name && updated.length > 0 && onSelectEvent) {
        onSelectEvent(updated[0].name)
      }
    }
  }

  // Handle Add Custom Question
  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestionTitle.trim()) {
      setQuestionError('Vui lòng nhập tiêu đề câu hỏi!')
      return
    }

    const newQ: SurveyQuestionItem = {
      id: `q-custom-${Date.now()}`,
      title: newQuestionTitle.trim(),
      description: newQuestionDesc.trim() || undefined,
      type: newQuestionType,
      required: newQuestionRequired,
    }

    const nextList = [...customQuestions, newQ]
    setCustomQuestions(nextList)
    saveCustomQuestions(selectedEvent, nextList)
    setNewQuestionTitle('')
    setNewQuestionDesc('')
    setQuestionError('')
    setShowAddQuestionModal(false)
    showToast('Đã thêm câu hỏi đánh giá mới thành công!')
  }

  // Handle Delete Custom Question
  const handleDeleteQuestion = (id: string) => {
    const nextList = customQuestions.filter((q) => q.id !== id)
    setCustomQuestions(nextList)
    saveCustomQuestions(selectedEvent, nextList)
    showToast('Đã xóa câu hỏi tùy chỉnh!')
  }

  // Count feedback submissions per event
  const feedbackCountsByEvent = React.useMemo(() => {
    const counts: Record<string, number> = {}
    for (const fb of feedbacks) {
      counts[fb.event] = (counts[fb.event] || 0) + 1
    }
    return counts
  }, [feedbacks])

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-[#061651] text-white rounded-2xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-bold border border-white/20 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* COMPACT TOOLBAR (STYLE CHUẨN GỌN GÀNG THEO HỆ THỐNG DỰ ÁN) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:px-5 sm:py-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#0284C7] dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-900/50">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-[#061651] dark:text-white tracking-tight">
                Thiết lập Sự kiện & Câu hỏi Đánh giá
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-950/60 text-[#0284C7] dark:text-sky-300 border border-sky-100 dark:border-sky-900/50 hidden sm:inline-block">
                Cốt lõi 4 tiêu chí
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate sm:whitespace-normal mt-0.5">
              Tạo kỳ khảo sát mới, quản lý câu hỏi mở rộng và duy trì bộ 4 tiêu chí chuẩn
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setShowCreateEventModal(true)}
            className="h-10 px-4 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs sm:text-[13px] shadow-[0_2px_6px_rgba(2,132,199,0.22)] hover:shadow-[0_4px_10px_rgba(2,132,199,0.3)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer border border-transparent select-none"
          >
            <Plus className="w-4 h-4 text-white shrink-0" />
            <span>Tạo sự kiện mới</span>
          </button>

          {onSwitchToSurvey && (
            <button
              type="button"
              onClick={onSwitchToSurvey}
              className="h-10 px-3.5 sm:px-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-[13px] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_3px_8px_rgba(0,0,0,0.08)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer select-none"
            >
              <Eye className="w-4 h-4 text-[#0284C7] dark:text-sky-400 shrink-0" />
              <span>Xem trang điền phiếu</span>
            </button>
          )}
        </div>
      </div>



      {/* SECTION 2: DANH SÁCH SỰ KIỆN ĐÁNH GIÁ (Events List & Management) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#0284C7] dark:bg-blue-950/60 dark:text-blue-300 flex items-center justify-center font-bold">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#061651] dark:text-white">
                Danh sách Sự kiện Khảo sát ({events.length})
              </h3>
            </div>
            <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400">
              Quản lý các đợt mở phiếu đánh giá. Sự kiện đang mở sẽ xuất hiện trong dropdown để toàn thể thành viên chọn điền phiếu.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateEventModal(true)}
            className="h-10 px-4 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs sm:text-[13px] shadow-[0_2px_6px_rgba(2,132,199,0.22)] hover:shadow-[0_4px_10px_rgba(2,132,199,0.3)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer border border-transparent select-none self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-white shrink-0" />
            <span>Thêm sự kiện</span>
          </button>
        </div>

        {/* Events Table / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {events.map((evt) => {
            const isCurrentSelected = selectedEvent === evt.name
            const reviewCount = feedbackCountsByEvent[evt.name] || 0

            return (
              <div
                key={evt.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isCurrentSelected
                    ? 'border-[#0284C7] bg-sky-50/40 dark:bg-sky-950/30 shadow-xs'
                    : 'border-slate-200/80 dark:border-slate-800 bg-[#F8FAFC]/60 dark:bg-slate-800/40 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-[#061651] dark:text-white text-sm sm:text-base truncate">
                        {evt.name}
                      </h4>
                      {isCurrentSelected && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#0284C7] text-white shadow-2xs">
                          Đang xem
                        </span>
                      )}
                      {isSurveyEventExpired(evt) ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200/80">
                          Hết hạn khảo sát
                        </span>
                      ) : evt.status === 'active' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/80">
                          ● Đang mở khảo sát
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          ○ Đã đóng
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {evt.description}
                    </p>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{evt.date}</span>
                      {evt.endDate && (
                        <span className="text-slate-400">→ <strong className="text-slate-700 dark:text-slate-300">{evt.endDate}</strong></span>
                      )}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-[#061651] dark:text-slate-200">
                      <MessageSquare className="w-3.5 h-3.5 text-[#0284C7]" />
                      {reviewCount} lượt nhận xét
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onSelectEvent && !isCurrentSelected && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectEvent(evt.name)
                          showToast(`Đã chọn xem sự kiện "${evt.name}"!`)
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[#0284C7] font-bold text-xs transition cursor-pointer"
                      >
                        Chọn sự kiện
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(evt.id, evt.status)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border cursor-pointer ${
                        evt.status === 'active'
                          ? 'border-amber-200 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                      }`}
                    >
                      {evt.status === 'active' ? 'Đóng khảo sát' : 'Mở lại'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(evt.id, evt.name)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                      title="Xóa sự kiện"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SECTION 3: CẤU HÌNH CÂU HỎI ĐÁNH GIÁ MỞ RỘNG (Custom Questions for current event) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#061651] dark:text-white">
                Câu hỏi Đánh giá cho: <span className="text-[#0284C7]">{selectedEvent}</span>
              </h3>
            </div>
            <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400">
              Bên cạnh 4 tiêu chí cốt lõi, BCN có thể bổ sung thêm các câu hỏi tự luận hoặc thang điểm riêng cho sự kiện này.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddQuestionModal(true)}
            className="h-10 px-4 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs sm:text-[13px] shadow-[0_2px_6px_rgba(2,132,199,0.22)] hover:shadow-[0_4px_10px_rgba(2,132,199,0.3)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer border border-transparent select-none self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-white shrink-0" />
            <span>Thêm câu hỏi mới</span>
          </button>
        </div>

        {/* List of questions for this event */}
        <div className="space-y-3">
          {/* 1. Core criteria row overview */}
          <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/60 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  1 - 4
                </div>
                <div>
                  <h5 className="font-extrabold text-[#061651] dark:text-white text-xs sm:text-sm">
                    Bộ 4 Tiêu chí Cốt lõi (Thang điểm 1 - 5 sao • Bắt buộc)
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Cố định chuẩn CLB trong mọi phiếu khảo sát đánh giá Core Team
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-[#0284C7] dark:bg-blue-900/50 border border-blue-200/80 shrink-0">
                Cố định chuẩn CLB
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {CORE_EVALUATION_CRITERIA.map((crit) => (
                <div
                  key={crit.key}
                  className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 text-center space-y-0.5"
                >
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block truncate">
                    {crit.shortLabel}
                  </span>
                  <span className="text-[11px] text-amber-500 dark:text-amber-400 font-bold block">
                    1.0 — 5.0 ★
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Default General Feedback Questions */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs">
                5
              </div>
              <div>
                <h5 className="font-extrabold text-[#061651] dark:text-white text-xs sm:text-sm">
                  Vài lời nhận xét về thành viên sau sự kiện
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Đoạn văn tự luận (Textarea) • Bắt buộc điền
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200/70 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
              Mặc định
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs">
                6
              </div>
              <div>
                <h5 className="font-extrabold text-[#061651] dark:text-white text-xs sm:text-sm">
                  Mong muốn cải thiện gì trong các sự kiện tới?
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Đoạn văn tự luận (Textarea) • Tùy chọn
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200/70 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
              Mặc định
            </span>
          </div>

          {/* 3. Custom Questions added by BCN */}
          {customQuestions.map((q, qIdx) => (
            <div
              key={q.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200/90 dark:border-slate-700 flex items-center justify-between gap-3 transition hover:border-sky-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                  {7 + qIdx}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-extrabold text-[#061651] dark:text-white text-xs sm:text-sm">
                      {q.title}
                    </h5>
                    {q.required && (
                      <span className="text-[10px] font-bold text-red-500">* Bắt buộc</span>
                    )}
                  </div>
                  {q.description && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {q.description}
                    </p>
                  )}
                  <span className="inline-block mt-1 text-[10px] font-semibold text-slate-400">
                    Loại: {q.type === 'rating_stars' ? 'Đánh giá 1 - 5 sao' : q.type === 'textarea' ? 'Đoạn văn tự luận' : 'Câu ngắn'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Câu hỏi mở rộng
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                  title="Xóa câu hỏi"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL 1: TẠO SỰ KIỆN MỚI (STYLE CHUẨN DISPUTE MODAL CỦA DỰ ÁN) */}
      {showCreateEventModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateEventModal(false)
          }}
          className="fixed inset-0 z-50 bg-[#0B1E48]/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[28px] max-w-[540px] w-full p-5 sm:p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.22)] border border-slate-100/90 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-950/60 text-[#0284C7] dark:text-sky-400 flex items-center justify-center border border-sky-200/50 dark:border-sky-800 shrink-0">
                  <Calendar className="w-5 h-5 text-[#0284C7] dark:text-sky-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-[17px] font-extrabold text-[#061651] dark:text-white tracking-tight truncate">
                    Tạo sự kiện đánh giá mới
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5 truncate">
                    Thiết lập thời hạn khảo sát và cấu hình mở phiếu cho Core Team
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateEventModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {eventErrorMessage && (
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{eventErrorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-3.5">
              {/* Tên sự kiện */}
              <div>
                <label className="text-[13px] font-bold text-[#061651] dark:text-slate-200 mb-1.5 block">
                  Tên sự kiện đánh giá <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  placeholder="Ví dụ: 2nd Meeting, Workshop Sharing Gen 3..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-[13px] text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/15 transition shadow-2xs"
                  required
                />
              </div>

              {/* Hàng 2 cột: Ngày bắt đầu & Ngày kết thúc */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-bold text-[#061651] dark:text-slate-200 mb-1.5 block">
                    Ngày diễn ra (Bắt đầu)
                  </label>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-[13px] text-slate-800 dark:text-white focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/15 transition shadow-2xs cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[13px] font-bold text-[#061651] dark:text-slate-200 mb-1.5 block">
                    Ngày kết thúc (Hạn chót) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newEventEndDate}
                    onChange={(e) => setNewEventEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-[13px] text-slate-800 dark:text-white focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/15 transition shadow-2xs cursor-pointer"
                    required
                  />
                </div>
              </div>

              {/* Hàng 2 cột: Trạng thái & Đối tượng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-bold text-[#061651] dark:text-slate-200 mb-1.5 block">
                    Trạng thái ban đầu
                  </label>
                  <select
                    value={newEventStatus}
                    onChange={(e) => setNewEventStatus(e.target.value as 'active' | 'closed')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-[13px] text-slate-800 dark:text-white focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/15 transition shadow-2xs cursor-pointer"
                  >
                    <option value="active">Đang mở khảo sát</option>
                    <option value="closed">Đã đóng khảo sát</option>
                  </select>
                </div>

                <div>
                  <label className="text-[13px] font-bold text-[#061651] dark:text-slate-200 mb-1.5 block">
                    Đối tượng đánh giá
                  </label>
                  <input
                    type="text"
                    value={newEventTarget}
                    onChange={(e) => setNewEventTarget(e.target.value)}
                    placeholder="Toàn bộ Core Team (trừ BCN)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-[13px] text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/15 transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Mô tả */}
              <div>
                <label className="text-[13px] font-bold text-[#061651] dark:text-slate-200 mb-1.5 block">
                  Mô tả / Hướng dẫn khảo sát
                </label>
                <textarea
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  rows={2}
                  placeholder="Ghi chú mục tiêu hoặc lưu ý khảo sát cho sự kiện này..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-[13px] text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/15 transition shadow-2xs resize-y"
                />
              </div>

              {/* Lưu ý thời hạn & đối tượng */}
              <div className="p-3 bg-sky-50/70 dark:bg-sky-950/40 rounded-2xl border border-sky-200/70 dark:border-sky-800 text-xs text-sky-950 dark:text-sky-200 leading-relaxed flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#0284C7] dark:text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#061651] dark:text-white">Quy định điền phiếu: </span>
                  <span>
                    Khảo sát sẽ tự động kết thúc sau <strong>Ngày kết thúc</strong>. Thành viên không nằm trong danh sách Core Team hoặc khi khảo sát đã hết hạn/đóng sẽ <strong>không thể điền phiếu đánh giá</strong>.
                  </span>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="pt-2 flex items-center gap-2.5 sm:gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateEventModal(false)}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-[13px] text-center transition active:scale-95 cursor-pointer shadow-2xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial h-10 px-5 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs sm:text-[13px] shadow-[0_2px_6px_rgba(2,132,199,0.22)] hover:shadow-[0_4px_10px_rgba(2,132,199,0.3)] transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Lưu &amp; Kích hoạt sự kiện</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: THÊM CÂU HỎI MỞ RỘNG */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-[#061651] dark:text-white">
                  Thêm câu hỏi đánh giá mới
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddQuestionModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {questionError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{questionError}</span>
              </div>
            )}

            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Tiêu đề câu hỏi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newQuestionTitle}
                  onChange={(e) => setNewQuestionTitle(e.target.value)}
                  placeholder="Ví dụ: Điểm cần phát huy tốt nhất trong sự kiện này?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Gợi ý / Mô tả câu hỏi
                </label>
                <input
                  type="text"
                  value={newQuestionDesc}
                  onChange={(e) => setNewQuestionDesc(e.target.value)}
                  placeholder="Hướng dẫn thành viên cách trả lời ngắn gọn..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Loại câu hỏi
                  </label>
                  <select
                    value={newQuestionType}
                    onChange={(e) => setNewQuestionType(e.target.value as 'rating_stars' | 'textarea' | 'text')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value="textarea">Đoạn văn tự luận (Nhiều dòng)</option>
                    <option value="rating_stars">Đánh giá sao (1 - 5 sao)</option>
                    <option value="text">Câu trả lời ngắn (1 dòng)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={newQuestionRequired}
                      onChange={(e) => setNewQuestionRequired(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0284C7] focus:ring-sky-500 cursor-pointer"
                    />
                    <span>Bắt buộc phải trả lời</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Thêm câu hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
