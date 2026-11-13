// ============================================================
// iSSAC_Web - Survey Data & Cross-Evaluation Storage for BCN
// ============================================================

export interface SurveyFeedbackItem {
  id: string
  event: string
  targetMemberCode: string
  targetMemberName: string
  targetDepartment: string
  targetPosition: string
  targetAvatarUrl?: string
  evaluatorMemberCode?: string
  evaluatorName: string
  evaluatorDept: string
  evaluatorRole: string
  evaluatorAvatarUrl?: string
  rating: number // 1 to 5
  feedback: string // Nhận xét sau sự kiện
  improvement: string // Mong muốn cải thiện
  criteriaScores: {
    responsibility: number // Tinh thần trách nhiệm (1-5)
    taskDelivery: number // Hoàn thành nhiệm vụ (1-5)
    collaboration: number // Phối hợp & Giao tiếp (1-5)
    initiative: number // Tác phong & Chủ động (1-5)
  }
  customAnswers?: Record<string, string | number>
  submittedAt: string
}

export const SURVEY_STORAGE_KEY = 'issac_all_survey_feedbacks_v5'

export const INITIAL_SURVEY_FEEDBACKS: SurveyFeedbackItem[] = []

// ============================================================
// Core Evaluation Criteria (Bộ 4 tiêu chí cốt lõi)
// ============================================================
export interface CoreCriterion {
  key: 'responsibility' | 'taskDelivery' | 'collaboration' | 'initiative'
  label: string
  shortLabel: string
  description: string
  weight: number
}

export const CORE_EVALUATION_CRITERIA: CoreCriterion[] = [
  {
    key: 'responsibility',
    label: 'Tinh thần trách nhiệm',
    shortLabel: 'Trách nhiệm',
    description: 'Tỉ mỉ, đúng hạn, tận tâm và không bỏ lửng đầu việc được giao',
    weight: 1,
  },
  {
    key: 'taskDelivery',
    label: 'Thực thi nhiệm vụ',
    shortLabel: 'Thực thi nhiệm vụ',
    description: 'Chất lượng đầu ra công việc, độ chuẩn xác và cam kết tiến độ',
    weight: 1,
  },
  {
    key: 'collaboration',
    label: 'Phối hợp & Giao tiếp',
    shortLabel: 'Phối hợp & Giao tiếp',
    description: 'Tương tác nhịp nhàng, lắng nghe đồng đội và phản hồi nhanh chóng',
    weight: 1,
  },
  {
    key: 'initiative',
    label: 'Chủ động sáng tạo',
    shortLabel: 'Chủ động sáng tạo',
    description: 'Đề xuất giải pháp mới, linh hoạt ứng biến trong các tình huống phát sinh',
    weight: 1,
  },
]

// ============================================================
// Survey Events & Questions Configuration
// ============================================================
export interface SurveyQuestionItem {
  id: string
  title: string
  description?: string
  type: 'rating_stars' | 'textarea' | 'text'
  required: boolean
  isCore?: boolean
  criteriaKey?: 'responsibility' | 'taskDelivery' | 'collaboration' | 'initiative'
}

export interface SurveyEventItem {
  id: string
  name: string
  date: string       // Ngày bắt đầu / ngày diễn ra (YYYY-MM-DD)
  endDate?: string   // Ngày kết thúc / hạn chót khảo sát (YYYY-MM-DD)
  status: 'active' | 'closed'
  description: string
  targetGroup: string
  customQuestions?: SurveyQuestionItem[]
  createdAt: string
}

export function isSurveyEventExpired(event: SurveyEventItem): boolean {
  if (event.status === 'closed') return true
  if (event.endDate) {
    const today = new Date().toISOString().slice(0, 10)
    return today > event.endDate
  }
  return false
}

export const SURVEY_EVENTS_STORAGE_KEY = 'issac_survey_events_v3'
export const SURVEY_QUESTIONS_STORAGE_KEY = 'issac_survey_custom_questions_v2'
export const SURVEY_DELETED_EVENTS_STORAGE_KEY = 'issac_deleted_survey_event_ids'

export function getDeletedSurveyEventIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(SURVEY_DELETED_EVENTS_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

export function addDeletedSurveyEventId(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const set = getDeletedSurveyEventIds()
    set.add(id)
    localStorage.setItem(SURVEY_DELETED_EVENTS_STORAGE_KEY, JSON.stringify(Array.from(set)))
  } catch (err) {
    console.error('Failed to save deleted survey event id:', err)
  }
}

export function removeDeletedSurveyEventId(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const set = getDeletedSurveyEventIds()
    set.delete(id)
    localStorage.setItem(SURVEY_DELETED_EVENTS_STORAGE_KEY, JSON.stringify(Array.from(set)))
  } catch (err) {
    console.error('Failed to remove deleted survey event id:', err)
  }
}

export const INITIAL_SURVEY_EVENTS: SurveyEventItem[] = [
  {
    id: 'evt-core-t10',
    name: 'Đánh giá hoạt động Core Team T10',
    date: '2026-11-07',
    endDate: '2026-11-30',
    status: 'active',
    description: 'Đánh giá khách quan quá trình đồng hành làm việc với nhau, đánh giá đúng và chuẩn, nếu đánh giá qua qua BCN sẽ note thái độ làm việc của chính thành viên đánh giá.',
    targetGroup: 'Toàn bộ Core Team (trừ BCN)',
    createdAt: '2026-11-07T08:00:00.000Z',
  },
]

// Default questions template for events
export const DEFAULT_EVENT_CUSTOM_QUESTIONS: SurveyQuestionItem[] = [
  {
    id: 'q-custom-1',
    title: 'Điểm ấn tượng nhất khi làm việc cùng thành viên này trong sự kiện?',
    description: 'Ghi nhận những đóng góp nổi bật hoặc khoảnh khắc hỗ trợ đồng đội tốt',
    type: 'textarea',
    required: false,
  },
]

// ============================================================
// Data access helpers
// ============================================================

export function normalizeFeedbacksToScale10(feedbacks: SurveyFeedbackItem[]): SurveyFeedbackItem[] {
  if (!Array.isArray(feedbacks)) return []
  return feedbacks.map((f) => {
    // If rating is <= 5, convert it to 10-point scale (e.g. 5 -> 10, 4.8 -> 9.6)
    const isScale5 = f.rating <= 5
    const newRating = isScale5 ? Number((f.rating * 2).toFixed(1)) : f.rating
    const newScores = f.criteriaScores
      ? {
          responsibility: f.criteriaScores.responsibility <= 5 ? Number((f.criteriaScores.responsibility * 2).toFixed(1)) : f.criteriaScores.responsibility,
          taskDelivery: f.criteriaScores.taskDelivery <= 5 ? Number((f.criteriaScores.taskDelivery * 2).toFixed(1)) : f.criteriaScores.taskDelivery,
          collaboration: f.criteriaScores.collaboration <= 5 ? Number((f.criteriaScores.collaboration * 2).toFixed(1)) : f.criteriaScores.collaboration,
          initiative: f.criteriaScores.initiative <= 5 ? Number((f.criteriaScores.initiative * 2).toFixed(1)) : f.criteriaScores.initiative,
        }
      : {
          responsibility: newRating,
          taskDelivery: newRating,
          collaboration: newRating,
          initiative: newRating,
        }
    return {
      ...f,
      rating: newRating,
      criteriaScores: newScores,
    }
  })
}

export function getStoredSurveyFeedbacks(): SurveyFeedbackItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SURVEY_STORAGE_KEY)
    if (raw === null) {
      // Chỉ giữ lại những phản hồi do người dùng thực sự gửi qua form (id bắt đầu bằng fb-sub-)
      let realUserFeedbacks: SurveyFeedbackItem[] = []
      try {
        const legacyKeys = [
          'issac_all_survey_feedbacks_v4',
          'issac_all_survey_feedbacks_v3',
          'issac_all_survey_feedbacks_v2',
        ]
        for (const k of legacyKeys) {
          const legacy = localStorage.getItem(k)
          if (legacy) {
            const parsed = JSON.parse(legacy)
            if (Array.isArray(parsed)) {
              const real = parsed.filter((f: SurveyFeedbackItem) => f.id?.startsWith('fb-sub-'))
              if (real.length > 0) {
                realUserFeedbacks = real
                break
              }
            }
          }
        }
      } catch {}

      localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(realUserFeedbacks))
      return realUserFeedbacks
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? normalizeFeedbacksToScale10(parsed) : []
  } catch {
    return []
  }
}

export function deleteFeedbacksByEvent(eventName: string): SurveyFeedbackItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SURVEY_STORAGE_KEY)
    const current: SurveyFeedbackItem[] = raw !== null ? (JSON.parse(raw) || []) : []
    if (Array.isArray(current)) {
      const updated = current.filter((f) => f.event !== eventName)
      localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(updated))
      return updated
    }
    return []
  } catch (err) {
    console.error('Failed to delete feedbacks for event:', err)
    return []
  }
}

// Đồng bộ dữ liệu khảo sát đa thiết bị qua Supabase Cloud API
export function syncSurveyToCloud(payload: Record<string, any>): void {
  if (typeof window === 'undefined') return
  try {
    fetch('/api/db/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((e) => console.error('Survey cloud sync notice:', e))
  } catch (err) {
    console.error('Failed to trigger survey cloud sync:', err)
  }
}

export function saveNewSurveyFeedback(item: SurveyFeedbackItem): SurveyFeedbackItem[] {
  if (typeof window === 'undefined') return INITIAL_SURVEY_FEEDBACKS
  try {
    const current = getStoredSurveyFeedbacks()
    // Check if duplicate from same evaluator for same target and event
    const filtered = current.filter(
      (f) => !(f.event === item.event && f.targetMemberCode === item.targetMemberCode && f.evaluatorMemberCode === item.evaluatorMemberCode)
    )
    const updated = [item, ...filtered]
    localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(updated))

    syncSurveyToCloud({
      action: 'save_survey_feedback',
      surveyFeedbacks: updated,
    })

    window.dispatchEvent(new Event('storage'))
    return updated
  } catch (err) {
    console.error('Failed to save survey feedback:', err)
    return INITIAL_SURVEY_FEEDBACKS
  }
}

export function getStoredSurveyEvents(): SurveyEventItem[] {
  if (typeof window === 'undefined') return INITIAL_SURVEY_EVENTS
  try {
    const deletedIds = getDeletedSurveyEventIds()
    const raw = localStorage.getItem(SURVEY_EVENTS_STORAGE_KEY)

    // Nếu chưa từng có dữ liệu lưu và chưa có ID nào bị xóa -> Khởi tạo mặc định lần đầu
    if (raw === null && deletedIds.size === 0) {
      localStorage.setItem(SURVEY_EVENTS_STORAGE_KEY, JSON.stringify(INITIAL_SURVEY_EVENTS))
      return [...INITIAL_SURVEY_EVENTS]
    }

    let events: SurveyEventItem[] = []
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          events = parsed.filter((e) => e && e.id && !deletedIds.has(e.id))
        }
      } catch (err) {
        console.error('Error parsing stored survey events:', err)
      }
    }

    return events
  } catch (err) {
    console.error('Failed to get survey events:', err)
    return []
  }
}

export function saveNewSurveyEvent(item: SurveyEventItem): SurveyEventItem[] {
  if (typeof window === 'undefined') return [item]
  try {
    removeDeletedSurveyEventId(item.id)
    const current = getStoredSurveyEvents()
    const filtered = current.filter((e) => e.id !== item.id && e.name.toLowerCase() !== item.name.toLowerCase())
    const updated = [item, ...filtered]
    localStorage.setItem(SURVEY_EVENTS_STORAGE_KEY, JSON.stringify(updated))

    syncSurveyToCloud({
      action: 'save_survey_event',
      surveyEvents: updated,
      deletedSurveyEventIds: Array.from(getDeletedSurveyEventIds()),
    })

    window.dispatchEvent(new Event('storage'))
    return updated
  } catch (err) {
    console.error('Failed to save survey event:', err)
    return [item]
  }
}

export function updateSurveyEventStatus(id: string, status: 'active' | 'closed'): SurveyEventItem[] {
  if (typeof window === 'undefined') return []
  try {
    const current = getStoredSurveyEvents()
    const updated = current.map((e) => (e.id === id ? { ...e, status } : e))
    localStorage.setItem(SURVEY_EVENTS_STORAGE_KEY, JSON.stringify(updated))

    syncSurveyToCloud({
      action: 'update_survey_event_status',
      surveyEvents: updated,
    })

    window.dispatchEvent(new Event('storage'))
    return updated
  } catch (err) {
    console.error('Failed to update survey event status:', err)
    return []
  }
}

export function deleteSurveyEvent(id: string): SurveyEventItem[] {
  if (typeof window === 'undefined') return []
  try {
    const current = getStoredSurveyEvents()
    const targetEvent = current.find((e) => e.id === id)
    addDeletedSurveyEventId(id)
    const updated = current.filter((e) => e.id !== id)
    localStorage.setItem(SURVEY_EVENTS_STORAGE_KEY, JSON.stringify(updated))

    // Dọn dẹp sạch sẽ toàn bộ dữ liệu phụ thuộc của sự kiện bị xóa
    if (targetEvent) {
      try {
        localStorage.removeItem(`issac_survey_evaluations_${encodeURIComponent(targetEvent.name)}`)
        localStorage.removeItem(`issac_survey_evaluations_v5_${encodeURIComponent(targetEvent.name)}`)
        localStorage.removeItem(`${SURVEY_QUESTIONS_STORAGE_KEY}_${targetEvent.id}`)
        localStorage.removeItem(`${SURVEY_QUESTIONS_STORAGE_KEY}_${encodeURIComponent(targetEvent.name)}`)
        deleteFeedbacksByEvent(targetEvent.name)
      } catch (cleanErr) {
        console.error('Error cleaning event artifacts:', cleanErr)
      }
    }

    // Đẩy cập nhật xóa sự kiện lên Cloud tức thì để điện thoại và các thiết bị khác nhận ngay
    syncSurveyToCloud({
      action: 'delete_survey_event',
      surveyEventId: id,
      surveyEvents: updated,
      deletedSurveyEventIds: Array.from(getDeletedSurveyEventIds()),
    })

    window.dispatchEvent(new Event('storage'))
    return updated
  } catch (err) {
    console.error('Failed to delete survey event:', err)
    return []
  }
}

export function restoreDefaultSurveyEvents(): SurveyEventItem[] {
  if (typeof window === 'undefined') return INITIAL_SURVEY_EVENTS
  try {
    localStorage.removeItem(SURVEY_DELETED_EVENTS_STORAGE_KEY)
    localStorage.setItem(SURVEY_EVENTS_STORAGE_KEY, JSON.stringify(INITIAL_SURVEY_EVENTS))

    syncSurveyToCloud({
      action: 'restore_survey_events',
      surveyEvents: INITIAL_SURVEY_EVENTS,
      deletedSurveyEventIds: [],
    })

    window.dispatchEvent(new Event('storage'))
    return INITIAL_SURVEY_EVENTS
  } catch (err) {
    console.error('Failed to restore default survey events:', err)
    return INITIAL_SURVEY_EVENTS
  }
}

export function getStoredCustomQuestions(eventId: string): SurveyQuestionItem[] {
  if (typeof window === 'undefined') return DEFAULT_EVENT_CUSTOM_QUESTIONS
  try {
    const raw = localStorage.getItem(`${SURVEY_QUESTIONS_STORAGE_KEY}_${eventId}`)
    if (!raw) {
      return DEFAULT_EVENT_CUSTOM_QUESTIONS
    }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (q) => q.id !== 'q-custom-2' && !q.title.includes('Mức độ sẵn sàng tiếp tục đồng hành')
      )
    }
    return DEFAULT_EVENT_CUSTOM_QUESTIONS
  } catch {
    return DEFAULT_EVENT_CUSTOM_QUESTIONS
  }
}

export function saveCustomQuestions(eventId: string, questions: SurveyQuestionItem[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`${SURVEY_QUESTIONS_STORAGE_KEY}_${eventId}`, JSON.stringify(questions))

    syncSurveyToCloud({
      action: 'save_survey_custom_questions',
      surveyCustomQuestions: { [eventId]: questions },
    })

    window.dispatchEvent(new Event('storage'))
  } catch (err) {
    console.error('Failed to save custom questions:', err)
  }
}

// Hàm hợp nhất dữ liệu khảo sát từ Supabase Cloud vào LocalStorage khi chạy sync đa thiết bị
export function applyCloudSurveyData(cloudData: {
  surveyEvents?: SurveyEventItem[]
  surveyFeedbacks?: SurveyFeedbackItem[]
  deletedSurveyEventIds?: string[]
  surveyCustomQuestions?: Record<string, SurveyQuestionItem[]>
}): void {
  if (typeof window === 'undefined' || !cloudData) return
  let changed = false

  try {
    // 1. Cập nhật danh sách ID sự kiện đã xóa từ cloud (Tombstones)
    if (Array.isArray(cloudData.deletedSurveyEventIds) && cloudData.deletedSurveyEventIds.length > 0) {
      const currentDelSet = getDeletedSurveyEventIds()
      let addedDel = false
      cloudData.deletedSurveyEventIds.forEach((id) => {
        if (!currentDelSet.has(id)) {
          currentDelSet.add(id)
          addedDel = true
        }
      })
      if (addedDel) {
        localStorage.setItem(SURVEY_DELETED_EVENTS_STORAGE_KEY, JSON.stringify(Array.from(currentDelSet)))
        changed = true
      }
    }

    const deletedIds = getDeletedSurveyEventIds()

    // 2. Cập nhật danh sách sự kiện khảo sát từ cloud
    if (Array.isArray(cloudData.surveyEvents)) {
      const cleanEvents = cloudData.surveyEvents.filter((e) => e && e.id && !deletedIds.has(e.id))
      const currentLocal = localStorage.getItem(SURVEY_EVENTS_STORAGE_KEY)
      const currentStr = currentLocal || '[]'
      const newStr = JSON.stringify(cleanEvents)
      if (currentStr !== newStr) {
        localStorage.setItem(SURVEY_EVENTS_STORAGE_KEY, newStr)
        changed = true
      }
    }

    // 3. Cập nhật danh sách nhận xét khảo sát từ cloud
    if (Array.isArray(cloudData.surveyFeedbacks)) {
      const currentFb = localStorage.getItem(SURVEY_STORAGE_KEY)
      const currentFbStr = currentFb || '[]'
      const newFbStr = JSON.stringify(cloudData.surveyFeedbacks)
      if (currentFbStr !== newFbStr) {
        localStorage.setItem(SURVEY_STORAGE_KEY, newFbStr)
        changed = true
      }
    }

    // 4. Cập nhật câu hỏi khảo sát từ cloud
    if (cloudData.surveyCustomQuestions && typeof cloudData.surveyCustomQuestions === 'object') {
      Object.entries(cloudData.surveyCustomQuestions).forEach(([eventId, questions]) => {
        if (Array.isArray(questions)) {
          const key = `${SURVEY_QUESTIONS_STORAGE_KEY}_${eventId}`
          const cur = localStorage.getItem(key)
          const newStr = JSON.stringify(questions)
          if (cur !== newStr) {
            localStorage.setItem(key, newStr)
            changed = true
          }
        }
      })
    }

    if (changed) {
      window.dispatchEvent(new Event('storage'))
    }
  } catch (err) {
    console.error('Error applying cloud survey data:', err)
  }
}

export const EVENT_EVALS_PREFIX = 'issac_survey_evaluations_'

export function getStoredEventEvaluations(eventName: string): Record<string, any> | null {
  if (typeof window === 'undefined') return null
  try {
    const key = `${EVENT_EVALS_PREFIX}${encodeURIComponent(eventName)}`
    const raw = localStorage.getItem(key)
    if (raw) {
      return JSON.parse(raw)
    }
    return null
  } catch {
    return null
  }
}

export function saveStoredEventEvaluations(eventName: string, evals: Record<string, any>): void {
  if (typeof window === 'undefined') return
  try {
    const key = `${EVENT_EVALS_PREFIX}${encodeURIComponent(eventName)}`
    localStorage.setItem(key, JSON.stringify(evals))
    window.dispatchEvent(new Event('storage'))
  } catch (err) {
    console.error('Failed to save event evaluations:', err)
  }
}


