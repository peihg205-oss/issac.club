'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Printer,
  Plus,
  Search,
  Filter,
  X,
  Building2,
  CalendarDays,
  CheckSquare,
  Square,
  Award,
  XCircle,
  Users,
  Crown,
  Pencil,
  Trash2,
  Save,
  Shield,
  Check,
  Bell,
  Send,
  Eye,
  Inbox,
  AlertCircle,
} from 'lucide-react'
import {
  ActivityItem,
  INITIAL_ACTIVITIES,
  getWeekDays,
  WeekDayColumn,
} from '@/lib/scheduleData'
import { useAuth } from '@/lib/auth/AuthContext'

export type ActivityCategoryKey = 'training' | 'meeting' | 'recruitment' | 'gala'

export function getActivityCategory(act: ActivityItem): ActivityCategoryKey {
  if (act.category === 'meeting') return 'meeting'
  if (act.category === 'training') return 'training'
  if (act.category === 'gala') return 'gala'
  if (act.category === 'recruitment') return 'recruitment'

  // Backwards compatibility for any item saved with legacy values
  const text = (act.title + ' ' + (act.notes || '') + ' ' + (act.categoryLabel || '')).toLowerCase()
  if (
    text.includes('họp') ||
    text.includes('hội nghị') ||
    text.includes('kiện toàn') ||
    act.colorTheme === 'purple' ||
    act.colorTheme === 'rose'
  ) {
    return 'meeting'
  }
  if (text.includes('tổng kết') || text.includes('gala') || act.colorTheme === 'emerald') {
    return 'gala'
  }
  if (text.includes('tuyển') || text.includes('sự kiện') || act.colorTheme === 'amber') {
    return 'recruitment'
  }
  return 'training'
}

// Trích xuất mốc thời gian (timestamp) để sắp xếp theo Time (ngày trước đến hiện tại)
export function getActivitySortTime(act: ActivityItem): number {
  if (act.date && !isNaN(new Date(act.date).getTime())) {
    return new Date(act.date).getTime()
  }
  const str = act.timeEnd || act.timeStart || ''
  const match = str.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/)
  if (match) {
    const day = parseInt(match[1], 10)
    const month = parseInt(match[2], 10) - 1
    let year = 2026
    if (match[3]) year = parseInt(match[3], 10)
    return new Date(year, month, day).getTime()
  }
  return 0
}

// Quy chuẩn Quý CLB iSSAC theo năm học:
// - Quý 1: Tháng 10 đến hết Tháng 12 (kèm cả đợt tuyển quân Tháng 9 mở đầu năm học)
// - Quý 2: Tháng 1 đến hết Tháng 3 (Ví dụ: Tháng 1/2027 là Quý 2)
// - Quý 3: Tháng 4 đến hết Tháng 6
// - Quý 4: Tháng 7 đến hết Tháng 8 (hè)
export function getClubQuarter(dateStr?: string, monthStr?: string): string {
  let monthNum = 0
  if (dateStr) {
    const isoMatch = dateStr.match(/^\d{4}-(\d{1,2})-(\d{1,2})/)
    if (isoMatch) {
      monthNum = parseInt(isoMatch[1], 10)
    } else {
      const dmyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})/)
      if (dmyMatch) {
        monthNum = parseInt(dmyMatch[2], 10)
      } else {
        const d = new Date(dateStr)
        if (!isNaN(d.getTime())) {
          monthNum = d.getMonth() + 1
        }
      }
    }
  }
  if (!monthNum && monthStr) {
    const match = monthStr.match(/(?:tháng\s*|t\s*)?(\d{1,2})/i)
    if (match) {
      monthNum = parseInt(match[1], 10)
    }
  }
  if (monthNum >= 10 && monthNum <= 12) return 'Quý 1'
  if (monthNum === 9) return 'Quý 1'
  if (monthNum >= 1 && monthNum <= 3) return 'Quý 2'
  if (monthNum >= 4 && monthNum <= 6) return 'Quý 3'
  if (monthNum >= 7 && monthNum <= 8) return 'Quý 4'
  return 'Quý 1'
}

// Định dạng ngày hiển thị dd/mm/yyyy chuẩn tiếng Việt
export function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return 'Chưa xác định'
  const match = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (match) {
    const y = match[1]
    const m = match[2].padStart(2, '0')
    const d = match[3].padStart(2, '0')
    return `${d}/${m}/${y}`
  }
  return dateStr
}

// Chuẩn hóa 1 Time duy nhất (chung 1 ngày, không có ngày bắt đầu / kết thúc tách rời) và chuẩn Quý CLB iSSAC
export function normalizeActivity(item: ActivityItem): ActivityItem {
  const correctedQuarter = getClubQuarter(item.date, item.month)
  const base: ActivityItem = { ...item, quarter: correctedQuarter, endDate: undefined }

  if (item.id === 'act-01-recruitment') {
    return { ...base, date: '2026-09-18', timeStart: '18/09', timeEnd: '18/09' }
  }
  if (item.id === 'act-02-first-meeting') {
    return { ...base, date: '2026-10-22', timeStart: '22/10', timeEnd: '22/10' }
  }
  if (item.id === 'act-09-conference') {
    return { ...base, date: '2026-11-26', timeStart: '26/11', timeEnd: '26/11' }
  }
  if (item.date) {
    const d = new Date(item.date)
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      return {
        ...base,
        timeStart: `${day}/${month}`,
        timeEnd: `${day}/${month}`,
      }
    }
  }
  return base
}

// Tự động nhận diện ca hoạt động (Sáng / Chiều / Tối) từ khung giờ
export function getSessionFromTime(
  timeStr?: string,
  defaultSession: 'morning' | 'afternoon' | 'evening' = 'morning'
): 'morning' | 'afternoon' | 'evening' {
  if (!timeStr) return defaultSession
  const match = timeStr.match(/(\d{1,2})/)
  if (match) {
    const h = parseInt(match[1], 10)
    if (h >= 18) return 'evening'
    if (h >= 12) return 'afternoon'
    return 'morning'
  }
  return defaultSession
}

export const CATEGORY_STYLES: Record<
  ActivityCategoryKey,
  {
    label: string
    cardBg: string
    border: string
    titleHover: string
    codeBadge: string
    clockIcon: string
    leadText: string
    leadIcon: string
    divider: string
    legendDot: string
  }
> = {
  training: {
    label: 'Workshop Training',
    cardBg: 'bg-[#F0F9FF] hover:bg-[#E0F2FE] dark:bg-sky-950/40 dark:hover:bg-sky-900/50',
    border: 'border-sky-300 dark:border-sky-800/80',
    titleHover: 'group-hover:text-[#0284C7]',
    codeBadge: 'text-[#0284C7] bg-white dark:bg-slate-800 border-sky-300',
    clockIcon: 'text-[#0284C7]',
    leadText: 'text-[#0284C7] dark:text-sky-300',
    leadIcon: 'text-[#0284C7]',
    divider: 'border-sky-200/80 dark:border-sky-900/40',
    legendDot: 'bg-[#F0F9FF] border-sky-300',
  },
  meeting: {
    label: 'Họp BCN & Hội nghị',
    cardBg: 'bg-[#FFF1F2] hover:bg-[#FFE4E6] dark:bg-rose-950/40 dark:hover:bg-rose-900/50',
    border: 'border-rose-300 dark:border-rose-800/80',
    titleHover: 'group-hover:text-rose-600',
    codeBadge: 'text-rose-700 bg-white dark:bg-slate-800 border-rose-300',
    clockIcon: 'text-rose-600',
    leadText: 'text-rose-700 dark:text-rose-300',
    leadIcon: 'text-rose-600',
    divider: 'border-rose-200/80 dark:border-rose-900/40',
    legendDot: 'bg-[#FFF1F2] border-rose-300',
  },
  recruitment: {
    label: 'Sự kiện & Tuyển quân',
    cardBg: 'bg-[#FFFBEB] hover:bg-[#FEF3C7] dark:bg-amber-950/40 dark:hover:bg-amber-900/50',
    border: 'border-amber-300 dark:border-amber-800/80',
    titleHover: 'group-hover:text-amber-600',
    codeBadge: 'text-amber-800 bg-white dark:bg-slate-800 border-amber-300',
    clockIcon: 'text-amber-600',
    leadText: 'text-amber-800 dark:text-amber-300',
    leadIcon: 'text-amber-600',
    divider: 'border-amber-200/80 dark:border-amber-900/40',
    legendDot: 'bg-[#FFFBEB] border-amber-300',
  },
  gala: {
    label: 'Tổng kết & Gala',
    cardBg: 'bg-[#F0FDF4] hover:bg-[#DCFCE7] dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50',
    border: 'border-emerald-300 dark:border-emerald-800/80',
    titleHover: 'group-hover:text-emerald-600',
    codeBadge: 'text-emerald-700 bg-white dark:bg-slate-800 border-emerald-300',
    clockIcon: 'text-emerald-600',
    leadText: 'text-emerald-700 dark:text-emerald-300',
    leadIcon: 'text-emerald-600',
    divider: 'border-emerald-200/80 dark:border-emerald-900/40',
    legendDot: 'bg-[#F0FDF4] border-emerald-300',
  },
}

export interface PendingScheduleRequest {
  id: string
  type: 'create' | 'edit'
  targetActivityId?: string
  targetActivityTitle?: string
  activityData: ActivityItem
  requestedBy: string
  requestedByTitle?: string
  requestedAt: string
}

export function ScheduleView() {
  const { currentUser, isBCN: authIsBCN } = useAuth()

  // Phân quyền Ban Chủ nhiệm (BCN):
  // Duy nhất BCN mới có quyền tạo trực tiếp, sửa trực tiếp, xóa và tick xác nhận hoàn thành
  const isBCN = useMemo(() => {
    if (authIsBCN) return true
    if (!currentUser) return false
    const r = currentUser.role
    const dept = currentUser.departmentCode || ''
    const deptName = currentUser.departmentName?.toLowerCase() || ''
    const title = currentUser.roleTitle?.toLowerCase() || ''
    const slug = (currentUser as unknown as { departmentSlug?: string }).departmentSlug || ''
    return (
      r === 'bcn' ||
      r === 'admin' ||
      dept === 'B04' ||
      slug === 'bcn' ||
      title.includes('chủ nhiệm') ||
      deptName.includes('chủ nhiệm') ||
      currentUser.name === 'Giang Lê Hiệp' ||
      currentUser.name === 'Nguyễn Thị Hồng Hân'
    )
  }, [authIsBCN, currentUser])

  // Phân quyền Core Team CLB (Bao gồm BCN + Cán bộ nòng cốt Trưởng/Phó Ban + HR):
  // Được quyền đề xuất tạo sự kiện mới & đề xuất sửa thông tin (Phải chờ BCN duyệt chấp thuận)
  const isCoreTeam = useMemo(() => {
    if (isBCN) return true
    if (!currentUser) return false
    const r = currentUser.role
    const title = currentUser.roleTitle?.toLowerCase() || ''
    return Boolean(
      currentUser.isCore ||
      r === 'hr' ||
      r === 'dept_head' ||
      title.includes('trưởng ban') ||
      title.includes('phó ban') ||
      title.includes('cán bộ') ||
      title.includes('core')
    )
  }, [isBCN, currentUser])

  // Thành viên thường: Chỉ được xem các hoạt động
  const isMemberOnly = !isBCN && !isCoreTeam

  // Danh sách đề xuất tạo mới & chỉnh sửa chờ Ban Chủ nhiệm duyệt
  const [pendingRequests, setPendingRequests] = useState<PendingScheduleRequest[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('issac_schedule_pending_requests')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) return parsed
        } catch (e) {}
      }
    }
    return []
  })

  // Hàm đồng bộ tức thì lên Supabase Cloud và phát tín hiệu cho toàn bộ ứng dụng
  const syncScheduleToCloud = useCallback(
    async (payload: {
      activities?: ActivityItem[]
      schedulePendingRequests?: PendingScheduleRequest[]
    }) => {
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('issac_schedule_sync', { detail: payload }))
        }
        await fetch('/api/db/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } catch (err) {
        console.warn('Lỗi đồng bộ lịch hoạt động lên cloud:', err)
      }
    },
    []
  )

  // Nạp dữ liệu lịch và các đề xuất phê duyệt mới nhất từ server / Supabase
  const fetchCloudSchedule = useCallback(async () => {
    try {
      const res = await fetch(`/api/db/sync?t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' },
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.success) {
        if (Array.isArray(data.schedulePendingRequests)) {
          setPendingRequests(data.schedulePendingRequests)
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              'issac_schedule_pending_requests',
              JSON.stringify(data.schedulePendingRequests)
            )
          }
        }
        if (Array.isArray(data.activities) && data.activities.length > 0) {
          const cleaned = data.activities
            .filter(
              (item: ActivityItem) =>
                !item.code?.startsWith('INS') &&
                item.id !== 'act-03-netsec' &&
                item.id !== 'act-04-dsa' &&
                item.id !== 'act-05-bi'
            )
            .map(normalizeActivity)
          setActivities(cleaned)
          if (typeof window !== 'undefined') {
            localStorage.setItem('issac_activities_data', JSON.stringify(cleaned))
          }
        } else if (!data.activities || data.activities.length === 0) {
          // Khởi tạo hạt giống (seed) dữ liệu lịch lên cloud nếu Supabase chưa có
          const initialClean = INITIAL_ACTIVITIES.map(normalizeActivity)
          syncScheduleToCloud({ activities: initialClean })
        }
      }
    } catch (err) {
      console.warn('Lỗi nạp lịch hoạt động từ cloud:', err)
    }
  }, [syncScheduleToCloud])

  // Cơ chế Real-time đa thiết bị & đa tài khoản: Polling, Storage event & Window Focus
  useEffect(() => {
    fetchCloudSchedule()

    // Polling định kỳ mỗi 5 giây khi tab đang active
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchCloudSchedule()
      }
    }, 5000)

    // Lắng nghe sự kiện storage từ các tab khác trong cùng trình duyệt
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'issac_schedule_pending_requests' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (Array.isArray(parsed)) setPendingRequests(parsed)
        } catch {}
      }
      if (e.key === 'issac_activities_data' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (Array.isArray(parsed)) setActivities(parsed.map(normalizeActivity))
        } catch {}
      }
    }

    // Lắng nghe CustomEvent khi có thay đổi trong cùng tab
    const handleCustomSync = (e: Event) => {
      const customEvt = e as CustomEvent<{
        activities?: ActivityItem[]
        schedulePendingRequests?: PendingScheduleRequest[]
      }>
      if (customEvt.detail?.schedulePendingRequests) {
        setPendingRequests(customEvt.detail.schedulePendingRequests)
      }
      if (customEvt.detail?.activities) {
        setActivities(customEvt.detail.activities.map(normalizeActivity))
      }
    }

    const handleFocus = () => {
      fetchCloudSchedule()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('issac_schedule_sync', handleCustomSync as EventListener)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleFocus)

    return () => {
      clearInterval(timer)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('issac_schedule_sync', handleCustomSync as EventListener)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [fetchCloudSchedule])

  // Khi người dùng chuyển đổi tài khoản (BCN <-> Core Team <-> Member), ngay lập tức đồng bộ dữ liệu mới nhất
  useEffect(() => {
    fetchCloudSchedule()
  }, [currentUser, fetchCloudSchedule])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('issac_schedule_pending_requests', JSON.stringify(pendingRequests))
    }
  }, [pendingRequests])

  // Set các ID hoạt động đang có đề xuất chỉnh sửa chờ BCN duyệt
  const pendingEditIds = useMemo(() => {
    return new Set(
      pendingRequests
        .filter((r) => r.type === 'edit' && r.targetActivityId)
        .map((r) => r.targetActivityId!)
    )
  }, [pendingRequests])

  // Modal duyệt đề xuất dành cho Ban Chủ nhiệm (DUY NHẤT BCN)
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)

  // Tự động đóng modal duyệt nếu tài khoản hiện tại không phải là Ban Chủ nhiệm
  useEffect(() => {
    if (!isBCN && isApprovalModalOpen) {
      setIsApprovalModalOpen(false)
    }
  }, [isBCN, isApprovalModalOpen])

  // Toast thông báo hệ thống (Thành công / Cảnh báo / Thông tin)
  const [systemNotice, setSystemNotice] = useState<{
    type: 'success' | 'warning' | 'info'
    title: string
    message: string
  } | null>(null)

  useEffect(() => {
    if (systemNotice) {
      const timer = setTimeout(() => setSystemNotice(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [systemNotice])

  // Toast thông báo phân quyền Ban Chủ nhiệm (BCN)
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null)

  useEffect(() => {
    if (permissionNotice) {
      const timer = setTimeout(() => setPermissionNotice(null), 4500)
      return () => clearTimeout(timer)
    }
  }, [permissionNotice])

  // BCN duyệt chấp nhận đề xuất (ĐẶC QUYỀN DUY NHẤT BAN CHỦ NHIỆM)
  const handleApproveRequest = (reqId: string) => {
    if (!isBCN) {
      setPermissionNotice('Quyền hạn bị giới hạn: Duy nhất Ban Chủ nhiệm (BCN) mới có quyền duyệt chấp thuận đề xuất hoạt động!')
      return
    }

    const req = pendingRequests.find((r) => r.id === reqId)
    if (!req) return

    let nextActivities = activities
    if (req.type === 'create') {
      nextActivities = [req.activityData, ...activities]
    } else if (req.type === 'edit' && req.targetActivityId) {
      nextActivities = activities.map((item) =>
        item.id === req.targetActivityId ? req.activityData : item
      )
      if (selectedActivity && selectedActivity.id === req.targetActivityId) {
        setSelectedActivity(req.activityData)
      }
    }

    const nextPending = pendingRequests.filter((r) => r.id !== reqId)
    setActivities(nextActivities)
    setPendingRequests(nextPending)

    if (typeof window !== 'undefined') {
      localStorage.setItem('issac_activities_data', JSON.stringify(nextActivities))
      localStorage.setItem('issac_schedule_pending_requests', JSON.stringify(nextPending))
    }
    syncScheduleToCloud({ activities: nextActivities, schedulePendingRequests: nextPending })

    setSystemNotice({
      type: 'success',
      title: 'Phê duyệt thành công',
      message: `Ban Chủ nhiệm đã chấp thuận và cập nhật hoạt động "${req.activityData.title}" vào lịch hoạt động chính thức của iSSAC!`
    })
  }

  // BCN từ chối đề xuất (ĐẶC QUYỀN DUY NHẤT BAN CHỦ NHIỆM)
  const handleRejectRequest = (reqId: string) => {
    if (!isBCN) {
      setPermissionNotice('Quyền hạn bị giới hạn: Duy nhất Ban Chủ nhiệm (BCN) mới có quyền từ chối đề xuất hoạt động!')
      return
    }

    const req = pendingRequests.find((r) => r.id === reqId)
    if (!req) return
    const nextPending = pendingRequests.filter((r) => r.id !== reqId)
    setPendingRequests(nextPending)

    if (typeof window !== 'undefined') {
      localStorage.setItem('issac_schedule_pending_requests', JSON.stringify(nextPending))
    }
    syncScheduleToCloud({ schedulePendingRequests: nextPending })

    setSystemNotice({
      type: 'info',
      title: 'Đã từ chối đề xuất',
      message: `Ban Chủ nhiệm đã từ chối yêu cầu đề xuất của ${req.requestedBy}.`
    })
  }

  // Tab switch: 'week' (Thời khóa biểu theo tuần) vs 'plan' (Kế hoạch theo Quý)
  const [viewMode, setViewMode] = useState<'week' | 'plan'>('week')

  // Quý được chọn trong Kế hoạch: 'Quý 1' | 'Quý 2' | 'Quý 3' | 'Quý 4' | 'all'
  const [selectedQuarter, setSelectedQuarter] = useState<'Quý 1' | 'Quý 2' | 'Quý 3' | 'Quý 4' | 'all'>('Quý 1')

  // Activities state (loaded from localStorage or INITIAL_ACTIVITIES)
  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('issac_activities_data')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            // Lọc bỏ triệt để các môn học demo trường và chuẩn hóa 1 Time duy nhất
            const cleaned = parsed
              .filter(
                (item: ActivityItem) =>
                  !item.code?.startsWith('INS') &&
                  item.id !== 'act-03-netsec' &&
                  item.id !== 'act-04-dsa' &&
                  item.id !== 'act-05-bi'
              )
              .map(normalizeActivity)
            return cleaned
          }
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_ACTIVITIES.map(normalizeActivity)
  })

  // Đảm bảo dọn dẹp bộ nhớ đệm và chuẩn hóa 1 Time duy nhất cùng Quý CLB chuẩn
  useEffect(() => {
    setActivities((prev) =>
      prev
        .filter(
          (item) =>
            !item.code?.startsWith('INS') &&
            item.id !== 'act-03-netsec' &&
            item.id !== 'act-04-dsa' &&
            item.id !== 'act-05-bi'
        )
        .map(normalizeActivity)
    )
    setSelectedActivity((prev) => (prev ? normalizeActivity(prev) : null))
  }, [])

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('issac_activities_data', JSON.stringify(activities))
    } catch {
      // ignore
    }
  }, [activities])

  // Current selected date for week navigation (defaults to 07/11/2026 matching Image 1)
  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-11-07T00:00:00'))

  // Filter in Week view: 'all' | 'training' | 'meeting' | 'recruitment'
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Filter by completion status: 'all' | 'done' | 'pending'
  const [statusFilter, setStatusFilter] = useState<'all' | 'done' | 'pending'>('all')

  // Search query
  const [searchQuery, setSearchQuery] = useState('')

  // Sắp xếp theo Time trong bảng Kế hoạch: 'asc' (ngày trước đến hiện tại / tương lai)
  const [timeSortOrder, setTimeSortOrder] = useState<'asc' | 'desc'>('asc')

  // Selected activity for Detail / Edit Modal
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null)
  const [isEditingSelected, setIsEditingSelected] = useState(false)

  // Edit fields state
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState<ActivityCategoryKey>('training')
  const [editDate, setEditDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editSession, setEditSession] = useState<'morning' | 'afternoon' | 'evening'>('morning')
  const [editTime, setEditTime] = useState('')
  const [editPeriod, setEditPeriod] = useState('')
  const [editLead, setEditLead] = useState('')
  const [editRoom, setEditRoom] = useState('')
  const [editDepartment, setEditDepartment] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editDone, setEditDone] = useState(false)

  // Open activity in view or edit mode
  const handleOpenActivity = (act: ActivityItem, editDirectly = false) => {
    const normalized = normalizeActivity(act)
    setSelectedActivity(normalized)
    setEditTitle(normalized.title)
    setEditCategory(getActivityCategory(normalized))
    setEditDate(normalized.date)
    setEditEndDate(normalized.endDate || '')
    setEditSession(normalized.session)
    setEditTime(normalized.time)
    setEditPeriod(normalized.period || '')
    setEditLead(normalized.lead)
    setEditRoom(normalized.room)
    setEditDepartment(normalized.department)
    setEditNotes(normalized.notes || '')
    setEditDone(normalized.done)

    // Thành viên thường: Chỉ được xem, không được vào chế độ chỉnh sửa
    if (editDirectly && isMemberOnly) {
      setSystemNotice({
        type: 'warning',
        title: 'Giới hạn quyền hạn',
        message: 'Thành viên chỉ được quyền xem các hoạt động, không có quyền chỉnh sửa!',
      })
      setIsEditingSelected(false)
      return
    }

    setIsEditingSelected(editDirectly)
  }

  // Switch to edit mode
  const handleStartEdit = () => {
    if (!selectedActivity) return
    if (isMemberOnly) {
      setSystemNotice({
        type: 'warning',
        title: 'Giới hạn quyền hạn',
        message: 'Thành viên chỉ được quyền xem các hoạt động!',
      })
      return
    }
    const normalized = normalizeActivity(selectedActivity)
    setSelectedActivity(normalized)
    setEditTitle(normalized.title)
    setEditCategory(getActivityCategory(normalized))
    setEditDate(normalized.date)
    setEditEndDate(normalized.endDate || '')
    setEditSession(normalized.session)
    setEditTime(normalized.time)
    setEditPeriod(normalized.period || '')
    setEditLead(normalized.lead)
    setEditRoom(normalized.room)
    setEditDepartment(normalized.department)
    setEditNotes(normalized.notes || '')
    setEditDone(normalized.done)
    setIsEditingSelected(true)
  }

  // Save changes (BCN: sửa trực tiếp; Core Team: gửi đề xuất cho BCN duyệt; Member: chặn)
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedActivity || !editTitle.trim()) return

    if (isMemberOnly) {
      setSystemNotice({
        type: 'warning',
        title: 'Giới hạn quyền hạn',
        message: 'Thành viên chỉ được quyền xem các hoạt động!',
      })
      return
    }

    let dayOfWeek = selectedActivity.dayOfWeek
    let dayStr = '01'
    let monthNum = 11
    let year = 2026

    const match = editDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
    if (match) {
      year = parseInt(match[1], 10)
      monthNum = parseInt(match[2], 10)
      dayStr = match[3].padStart(2, '0')
      dayOfWeek = new Date(year, monthNum - 1, parseInt(match[3], 10)).getDay()
    } else {
      const parsedDate = new Date(editDate)
      dayOfWeek = isNaN(parsedDate.getTime()) ? selectedActivity.dayOfWeek : parsedDate.getDay()
      dayStr = String(parsedDate.getDate()).padStart(2, '0')
      monthNum = parsedDate.getMonth() + 1
      year = parsedDate.getFullYear() || 2026
    }

    const monthStrPadded = String(monthNum).padStart(2, '0')
    const timeFormatted = `${dayStr}/${monthStrPadded}`
    const monthStr = `Tháng ${monthNum}/${year}`
    const quarterStr = getClubQuarter(editDate, monthStr)

    const updated: ActivityItem = {
      ...selectedActivity,
      title: editTitle.trim(),
      category: editCategory,
      categoryLabel: CATEGORY_STYLES[editCategory].label,
      date: editDate,
      endDate: undefined,
      timeStart: timeFormatted,
      timeEnd: timeFormatted,
      dayOfWeek,
      month: monthStr,
      quarter: quarterStr,
      session: getSessionFromTime(editTime, selectedActivity.session),
      time: editTime.trim(),
      period: editPeriod.trim(),
      lead: editLead.trim(),
      room: editRoom.trim(),
      department: editDepartment.trim(),
      notes: editNotes.trim(),
      done: isBCN ? editDone : selectedActivity.done, // Chỉ BCN mới được đổi done
      colorTheme:
        editCategory === 'training'
          ? 'blue'
          : editCategory === 'meeting'
          ? 'rose'
          : editCategory === 'recruitment'
          ? 'amber'
          : 'emerald',
    }

    if (isBCN) {
      // Ban Chủ nhiệm: Áp dụng trực tiếp ngay lập tức
      const nextActivities = activities.map((item) => (item.id === updated.id ? updated : item))
      setActivities(nextActivities)
      setSelectedActivity(updated)
      setIsEditingSelected(false)
      if (typeof window !== 'undefined') {
        localStorage.setItem('issac_activities_data', JSON.stringify(nextActivities))
      }
      syncScheduleToCloud({ activities: nextActivities })
      setSystemNotice({
        type: 'success',
        title: 'Cập nhật thành công',
        message: `Đã lưu thay đổi cho hoạt động "${updated.title}".`,
      })
    } else {
      // Core Team: Gửi đề xuất tới BCN duyệt, không sửa trực tiếp
      const newReq: PendingScheduleRequest = {
        id: `req-edit-${Date.now()}`,
        type: 'edit',
        targetActivityId: selectedActivity.id,
        targetActivityTitle: selectedActivity.title,
        activityData: updated,
        requestedBy: currentUser?.name || 'Cán bộ Core Team',
        requestedByTitle: currentUser?.roleTitle || 'Core Team CLB',
        requestedAt: new Date().toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
      }
      const nextPending = [newReq, ...pendingRequests]
      setPendingRequests(nextPending)
      setIsEditingSelected(false)
      setSelectedActivity(null)
      if (typeof window !== 'undefined') {
        localStorage.setItem('issac_schedule_pending_requests', JSON.stringify(nextPending))
      }
      syncScheduleToCloud({ schedulePendingRequests: nextPending })
      setSystemNotice({
        type: 'info',
        title: 'Đã gửi đề xuất chỉnh sửa',
        message: 'Đề xuất chỉnh sửa của bạn đã được chuyển tới Ban Chủ nhiệm. Thông tin sẽ được cập nhật sau khi BCN phê duyệt!',
      })
    }
  }

  // Delete activity (Chỉ BCN mới có quyền xóa)
  const handleDeleteActivity = (id: string) => {
    if (!isBCN) {
      setSystemNotice({
        type: 'warning',
        title: 'Giới hạn quyền hạn',
        message: 'Chỉ Ban Chủ nhiệm (BCN) mới có quyền xóa hoạt động khỏi hệ thống!',
      })
      return
    }

    if (window.confirm('Bạn có chắc chắn muốn xóa hoạt động này khỏi lịch CLB?')) {
      const nextActivities = activities.filter((item) => item.id !== id)
      setActivities(nextActivities)
      setSelectedActivity(null)
      setIsEditingSelected(false)
      if (typeof window !== 'undefined') {
        localStorage.setItem('issac_activities_data', JSON.stringify(nextActivities))
      }
      syncScheduleToCloud({ activities: nextActivities })
      setSystemNotice({
        type: 'success',
        title: 'Đã xóa hoạt động',
        message: 'Hoạt động đã được xóa khỏi hệ thống CLB.',
      })
    }
  }

  // Add Activity Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newCode, setNewCode] = useState('iSSAC-WS03')
  const [newTitle, setNewTitle] = useState('')
  const [newQuarter, setNewQuarter] = useState('Quý 1')
  const [newMonth, setNewMonth] = useState('Tháng 11/2026')
  const [newCategory, setNewCategory] = useState<ActivityCategoryKey>('training')
  const [newDate, setNewDate] = useState('2026-11-07')
  const [newSession, setNewSession] = useState<'morning' | 'afternoon' | 'evening'>('morning')
  const [newPeriod, setNewPeriod] = useState('Tiết: 1 - 3')
  const [newTime, setNewTime] = useState('08:00 - 12:00')
  const [newLead, setNewLead] = useState(currentUser?.name || 'Giang Lê Hiệp')
  const [newRoom, setNewRoom] = useState('Phòng 514, số 1 Phan Tây Nhạc')
  const [newDone, setNewDone] = useState(false)
  const [newDepartment, setNewDepartment] = useState('Ban Truyền thông')
  const [newNotes, setNewNotes] = useState('')

  // Tự động gợi ý mã kế tiếp và cập nhật Quý CLB chuẩn khi đổi ngày / danh mục
  useEffect(() => {
    const prefix =
      newCategory === 'training'
        ? 'WS'
        : newCategory === 'meeting'
        ? 'MT'
        : newCategory === 'recruitment'
        ? 'REC'
        : 'EV'
    const num = Math.floor(10 + Math.random() * 90)
    setNewCode(`iSSAC-${prefix}${num}`)
  }, [newCategory])

  useEffect(() => {
    if (newDate) {
      const match = newDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
      if (match) {
        const y = match[1]
        const m = parseInt(match[2], 10)
        setNewMonth(`Tháng ${m}/${y}`)
        setNewQuarter(getClubQuarter(newDate))
      } else {
        const d = new Date(newDate)
        if (!isNaN(d.getTime())) {
          const m = d.getMonth() + 1
          const y = d.getFullYear() || 2026
          setNewMonth(`Tháng ${m}/${y}`)
          setNewQuarter(getClubQuarter(newDate))
        }
      }
    }
  }, [newDate])

  // Calculate 7 days of the current week
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate])

  // Navigate week
  const handlePrevWeek = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() - 7)
      return d
    })
  }

  const handleNextWeek = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + 7)
      return d
    })
  }

  const handleResetToCurrent = () => {
    setCurrentDate(new Date('2026-11-07T00:00:00'))
  }

  // Toggle Done state of an activity - Phân quyền DUY NHẤT Ban Chủ nhiệm (BCN)
  const handleToggleDone = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()

    // Phân quyền: Chỉ thành viên thuộc BCN mới có quyền xác nhận hoặc thay đổi trạng thái hoàn thành
    if (!isBCN) {
      setPermissionNotice(
        'Quyền hạn bị giới hạn: Chỉ thành viên thuộc Ban Chủ nhiệm (BCN) mới có quyền tick xác nhận hoặc thay đổi trạng thái hoàn thành của hoạt động!'
      )
      return
    }

    const nextActivities = activities.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    setActivities(nextActivities)
    if (selectedActivity && selectedActivity.id === id) {
      setSelectedActivity((prev) => (prev ? { ...prev, done: !prev.done } : null))
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('issac_activities_data', JSON.stringify(nextActivities))
    }
    syncScheduleToCloud({ activities: nextActivities })
  }

  // Handle Create Activity (BCN: thêm trực tiếp; Core Team: gửi đề xuất cho BCN duyệt; Member: chặn)
  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    if (isMemberOnly) {
      setSystemNotice({
        type: 'warning',
        title: 'Giới hạn quyền hạn',
        message: 'Thành viên chỉ được quyền xem các hoạt động!',
      })
      return
    }

    let dayOfWeek = 0
    let dayStr = '01'
    let monthNum = 11
    let year = 2026

    const match = newDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
    if (match) {
      year = parseInt(match[1], 10)
      monthNum = parseInt(match[2], 10)
      dayStr = match[3].padStart(2, '0')
      dayOfWeek = new Date(year, monthNum - 1, parseInt(match[3], 10)).getDay()
    } else {
      const parsedDate = new Date(newDate)
      dayOfWeek = parsedDate.getDay()
      dayStr = String(parsedDate.getDate()).padStart(2, '0')
      monthNum = parsedDate.getMonth() + 1
      year = parsedDate.getFullYear() || 2026
    }

    const monthStrPadded = String(monthNum).padStart(2, '0')
    const timeFormatted = `${dayStr}/${monthStrPadded}`
    const monthStr = `Tháng ${monthNum}/${year}`
    const quarterStr = getClubQuarter(newDate, monthStr)

    const newItem: ActivityItem = {
      id: `act-${Date.now()}`,
      code: newCode.trim() || `iSSAC-${newCategory.substring(0, 2).toUpperCase()}${Math.floor(10 + Math.random() * 90)}`,
      title: newTitle.trim(),
      quarter: quarterStr,
      month: monthStr,
      timeStart: timeFormatted,
      timeEnd: timeFormatted,
      date: newDate,
      endDate: undefined,
      dayOfWeek,
      session: newSession || getSessionFromTime(newTime),
      period: newPeriod,
      time: newTime,
      lead: newLead.trim(),
      room: newRoom.trim(),
      category: newCategory,
      categoryLabel: CATEGORY_STYLES[newCategory].label,
      department: newDepartment,
      notes: newNotes.trim(),
      done: isBCN ? newDone : false, // Core team đề xuất luôn là false
      colorTheme:
        newCategory === 'training'
          ? 'blue'
          : newCategory === 'meeting'
          ? 'rose'
          : newCategory === 'recruitment'
          ? 'amber'
          : 'emerald',
    }

    if (isBCN) {
      // Ban Chủ nhiệm: Thêm trực tiếp vào lịch
      const nextActivities = [newItem, ...activities]
      setActivities(nextActivities)
      setIsAddModalOpen(false)
      setNewTitle('')
      if (typeof window !== 'undefined') {
        localStorage.setItem('issac_activities_data', JSON.stringify(nextActivities))
      }
      syncScheduleToCloud({ activities: nextActivities })
      setSystemNotice({
        type: 'success',
        title: 'Tạo hoạt động thành công',
        message: `Đã thêm hoạt động "${newItem.title}" vào lịch CLB.`,
      })
    } else {
      // Core Team: Gửi đề xuất tới BCN duyệt, không thêm trực tiếp
      const newReq: PendingScheduleRequest = {
        id: `req-create-${Date.now()}`,
        type: 'create',
        activityData: newItem,
        requestedBy: currentUser?.name || 'Cán bộ Core Team',
        requestedByTitle: currentUser?.roleTitle || 'Core Team CLB',
        requestedAt: new Date().toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
      }
      const nextPending = [newReq, ...pendingRequests]
      setPendingRequests(nextPending)
      setIsAddModalOpen(false)
      setNewTitle('')
      if (typeof window !== 'undefined') {
        localStorage.setItem('issac_schedule_pending_requests', JSON.stringify(nextPending))
      }
      syncScheduleToCloud({ schedulePendingRequests: nextPending })
      setSystemNotice({
        type: 'info',
        title: 'Đã gửi đề xuất sự kiện mới',
        message: 'Đề xuất tạo sự kiện của bạn đã được gửi tới Ban Chủ nhiệm. Sự kiện sẽ chính thức hiển thị sau khi BCN phê duyệt!',
      })
    }
  }

  // Filter activities for week view
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const catKey = getActivityCategory(act)
      const matchCat = categoryFilter === 'all' || catKey === categoryFilter
      const matchStatus =
        statusFilter === 'all' || (statusFilter === 'done' ? act.done : !act.done)
      const matchSearch =
        !searchQuery.trim() ||
        act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.lead.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.room.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCat && matchStatus && matchSearch
    })
  }, [activities, categoryFilter, statusFilter, searchQuery])

  // Map activities into cells [session][isoDate]
  const cellMap = useMemo(() => {
    const map: Record<string, ActivityItem[]> = {}
    filteredActivities.forEach((act) => {
      weekDays.forEach((w) => {
        if (act.date === w.isoDate) {
          const key = `${act.session}-${w.isoDate}`
          if (!map[key]) map[key] = []
          map[key].push(act)
        }
      })
    })
    return map
  }, [filteredActivities, weekDays])

  // Filter activities for Plan view (Image 2 table) - Sắp xếp theo Time: ngày trước đến hiện tại
  const planActivities = useMemo(() => {
    return activities
      .filter((act) => {
        const catKey = getActivityCategory(act)
        const matchCat = categoryFilter === 'all' || catKey === categoryFilter
        const matchStatus =
          statusFilter === 'all' || (statusFilter === 'done' ? act.done : !act.done)
        const actQuarter = getClubQuarter(act.date, act.month)
        const matchQuarter =
          selectedQuarter === 'all' || actQuarter === selectedQuarter
        const matchSearch =
          !searchQuery.trim() ||
          act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          act.lead.toLowerCase().includes(searchQuery.toLowerCase()) ||
          act.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
          act.month.toLowerCase().includes(searchQuery.toLowerCase())
        return matchCat && matchStatus && matchQuarter && matchSearch
      })
      .sort((a, b) => {
        const timeA = getActivitySortTime(a)
        const timeB = getActivitySortTime(b)
        if (timeA !== timeB) {
          return timeSortOrder === 'asc' ? timeA - timeB : timeB - timeA
        }
        return a.title.localeCompare(b.title)
      })
  }, [activities, categoryFilter, statusFilter, selectedQuarter, searchQuery, timeSortOrder])

  // Summary counts
  const totalCount = activities.length
  const doneCount = activities.filter((a) => a.done).length
  const pendingCount = activities.filter((a) => !a.done).length
  const trainingCount = activities.filter((a) => a.category === 'training').length
  const meetingCount = activities.filter((a) => a.category === 'meeting').length

  // Hoạt động diễn ra trong tuần đang xem (Dữ liệu thật chuẩn thời gian thực)
  const weekActivitiesCount = useMemo(() => {
    const weekIsoDates = new Set(weekDays.map((w) => w.isoDate))
    return activities.filter((act) => act.date && weekIsoDates.has(act.date)).length
  }, [activities, weekDays])

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* ======================================================== */}
      {/* 1. HEADER TRANG CHUẨN NHẬN DIỆN DỰ ÁN CLB (Khớp 100% Ảnh 1) */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        {/* Tiêu đề & Sticker Welcome */}
        <div>
          <div className="flex items-center gap-3 sm:gap-3.5 flex-wrap sm:flex-nowrap">
            <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#061651] dark:text-white tracking-tight leading-tight">
              Lịch hoạt động & Kế hoạch iSSAC
            </h1>

            {/* Sticker Welcome to iSSAC to rõ, căn cân chuẩn dòng tiêu đề, nhấp nháy êm ái nhẹ nhàng */}
            <div className="relative group cursor-pointer inline-flex items-center shrink-0 select-none translate-y-1 sm:translate-y-1.5">
              <style>{`
                @keyframes issac-gentle-blink-shake {
                  0%, 100% {
                    transform: rotate(0deg) scale(1);
                    opacity: 1;
                    filter: drop-shadow(0 4px 12px rgba(2, 132, 199, 0.25));
                  }
                  20% {
                    transform: rotate(-2.5deg) scale(1.03);
                    opacity: 0.88;
                    filter: drop-shadow(0 4px 14px rgba(2, 132, 199, 0.35));
                  }
                  40% {
                    transform: rotate(2.5deg) scale(1.04);
                    opacity: 1;
                    filter: drop-shadow(0 4px 16px rgba(2, 132, 199, 0.4));
                  }
                  60% {
                    transform: rotate(-1.5deg) scale(1.02);
                    opacity: 0.86;
                    filter: drop-shadow(0 4px 14px rgba(2, 132, 199, 0.35));
                  }
                  80% {
                    transform: rotate(1.5deg) scale(1.01);
                    opacity: 1;
                    filter: drop-shadow(0 4px 12px rgba(2, 132, 199, 0.3));
                  }
                }
                .issac-sticker-anim {
                  animation: issac-gentle-blink-shake 2.4s ease-in-out infinite !important;
                  display: inline-block !important;
                  transform-origin: center center;
                  will-change: transform, opacity, filter;
                }
              `}</style>
              <img
                src="/welcome-to-issac.png"
                alt="Welcome to iSSAC"
                className="h-13 sm:h-16 md:h-[68px] w-auto object-contain issac-sticker-anim hover:scale-110 transition-transform duration-300"
              />
            </div>
          </div>
          <p className="text-xs sm:text-[13px] text-[#64748B] dark:text-slate-400 mt-1 font-normal">
            Quản lý thời khóa biểu tuần và kế hoạch hoạt động chính thức của CLB.
          </p>
        </div>

        {/* Thanh công cụ hành động phía trên (Khớp 100% Ảnh 1 & Phân quyền BCN / Core Team / Member) */}
        <div className="flex items-center gap-2.5 flex-shrink-0 self-start md:self-center">
          {/* Nút In lịch (nền trắng viền nhạt như Xuất file) */}
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 text-[#061651] dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 hover:border-slate-300 font-bold text-xs sm:text-[13px] transition shadow-2xs hover:shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title="In thời khóa biểu / kế hoạch ra PDF"
          >
            <Printer className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span>In lịch</span>
          </button>

          {/* Nút Duyệt yêu cầu dành cho Ban Chủ nhiệm (ĐẶC QUYỀN DUY NHẤT BCN - Chuẩn style Nút xanh thương hiệu đồng bộ) */}
          {isBCN && (
            <button
              type="button"
              onClick={() => setIsApprovalModalOpen(true)}
              className="relative px-4 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs sm:text-[13px] transition shadow-xs hover:shadow flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="Xem và phê duyệt các đề xuất tạo sự kiện / chỉnh sửa từ Core Team"
            >
              <Bell className="w-4 h-4 text-white shrink-0" />
              <span>Duyệt yêu cầu</span>
              {pendingRequests.length > 0 && (
                <span className="ml-0.5 bg-rose-600 text-white text-[10.5px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none shadow-xs">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          )}

          {/* Nút Thêm Hoạt Động (Chỉ BCN và Core Team mới có; Đã bỏ dấu + theo yêu cầu) */}
          {(isBCN || isCoreTeam) && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs sm:text-[13px] transition shadow-xs hover:shadow flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title={isBCN ? 'Thêm hoạt động mới vào lịch' : 'Đề xuất tạo sự kiện mới gửi Ban Chủ nhiệm phê duyệt'}
            >
              <span>{isBCN ? 'Thêm Hoạt Động' : 'Đề xuất Sự Kiện'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. BỐN THẺ CHỈ SỐ KPI PASTEL (Khớp 100% Ảnh 1) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Tổng số hoạt động (Pastel xanh Sky #F0F9FF - #0284C7) */}
        <div
          onClick={() => {
            setCategoryFilter('all')
            setStatusFilter('all')
          }}
          className={`p-4 sm:p-5 rounded-2xl bg-[#F0F9FF] dark:bg-sky-950/30 flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 ${
            statusFilter === 'all' && categoryFilter === 'all' ? '' : 'hover:opacity-90'
          }`}
          title="Bấm để xem tất cả hoạt động"
        >
          <div className="space-y-1">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-400 block">
              Tổng số hoạt động
            </span>
            <span className="text-2xl sm:text-[28px] font-black text-[#0284C7] block tracking-tight leading-none py-0.5">
              {totalCount}
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-sky-300/70 bg-white/70 dark:bg-slate-900 flex items-center justify-center text-[#0284C7] shrink-0">
            <Users className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* Card 2: Hoạt động trong tuần (Pastel vàng #FFFBEB - #D97706, Dữ liệu thật chuẩn) */}
        <div
          onClick={() => setViewMode('week')}
          className="p-4 sm:p-5 rounded-2xl bg-[#FFFBEB] dark:bg-amber-950/30 flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
          title="Bấm để xem thời khóa biểu tuần này"
        >
          <div className="space-y-1">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-400 block">
              Hoạt động trong tuần
            </span>
            <span className="text-2xl sm:text-[28px] font-black text-[#D97706] block tracking-tight leading-none py-0.5">
              {weekActivitiesCount}
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-amber-300/70 bg-white/70 dark:bg-slate-900 flex items-center justify-center text-[#D97706] shrink-0">
            <CalendarDays className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* Card 3: Đã hoàn thành (Pastel xanh lá #F0FDF4 - #16A34A) */}
        <div
          onClick={() => setStatusFilter((prev) => (prev === 'done' ? 'all' : 'done'))}
          className={`p-4 sm:p-5 rounded-2xl bg-[#F0FDF4] dark:bg-emerald-950/30 flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 ${
            statusFilter === 'done' ? 'ring-2 ring-emerald-500 shadow-[0_4px_14px_rgba(22,163,74,0.2)]' : ''
          }`}
          title="Bấm để lọc hoạt động đã hoàn thành"
        >
          <div className="space-y-1">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-400 block">
              Đã hoàn thành (Done)
            </span>
            <span className="text-2xl sm:text-[28px] font-black text-[#16A34A] block tracking-tight leading-none py-0.5">
              {doneCount}
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-emerald-300/70 bg-white/70 dark:bg-slate-900 flex items-center justify-center text-[#16A34A] shrink-0">
            <Award className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* Card 4: Chưa hoàn thành (Pastel tím #FAF5FF - #9333EA) */}
        <div
          onClick={() => setStatusFilter((prev) => (prev === 'pending' ? 'all' : 'pending'))}
          className={`p-4 sm:p-5 rounded-2xl bg-[#FAF5FF] dark:bg-purple-950/30 flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 ${
            statusFilter === 'pending' ? 'ring-2 ring-purple-500 shadow-[0_4px_14px_rgba(147,51,234,0.2)]' : ''
          }`}
          title="Bấm để lọc hoạt động chưa hoàn thành"
        >
          <div className="space-y-1">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-400 block">
              Chưa hoàn thành
            </span>
            <span className="text-2xl sm:text-[28px] font-black text-[#9333EA] block tracking-tight leading-none py-0.5">
              {pendingCount}
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-purple-300/70 bg-white/70 dark:bg-slate-900 flex items-center justify-center text-[#9333EA] shrink-0">
            <Clock className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. KHỐI CONTAINER TRẮNG LIỀN MẠCH (Khớp 100% Ảnh 1) */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-4 sm:p-5 space-y-4">
        {/* Hàng 1: Subtabs Chế độ xem (Dạng Pill bo tròn mềm mại) + Quick Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3.5 sm:px-4 py-2 rounded-full text-xs transition-all whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-[#0284C7] text-white font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 font-medium'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Thời khóa biểu theo tuần</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('plan')
                setSelectedQuarter('Quý 1')
              }}
              className={`px-3.5 sm:px-4 py-2 rounded-full text-xs transition-all whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                viewMode === 'plan' && selectedQuarter === 'Quý 1'
                  ? 'bg-[#0284C7] text-white font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 font-medium'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Kế hoạch Quý 1</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('plan')
                setSelectedQuarter('Quý 2')
              }}
              className={`px-3.5 sm:px-4 py-2 rounded-full text-xs transition-all whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                viewMode === 'plan' && selectedQuarter === 'Quý 2'
                  ? 'bg-[#0284C7] text-white font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 font-medium'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Kế hoạch Quý 2</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('plan')
                setSelectedQuarter('Quý 3')
              }}
              className={`px-3.5 sm:px-4 py-2 rounded-full text-xs transition-all whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                viewMode === 'plan' && selectedQuarter === 'Quý 3'
                  ? 'bg-[#0284C7] text-white font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 font-medium'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Kế hoạch Quý 3</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('plan')
                setSelectedQuarter('all')
              }}
              className={`px-3.5 sm:px-4 py-2 rounded-full text-xs transition-all whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                viewMode === 'plan' && selectedQuarter === 'all'
                  ? 'bg-[#0284C7] text-white font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 font-medium'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Toàn bộ kế hoạch</span>
            </button>
          </div>

          {/* Quick Counter */}
          <div className="text-xs text-slate-500 font-medium whitespace-nowrap flex items-center gap-1.5 self-end sm:self-auto px-1">
            <span>Hiển thị:</span>
            <strong className="text-[#061651] dark:text-white font-bold">
              {viewMode === 'week' ? filteredActivities.length : planActivities.length}
            </strong>
            <span>/ {totalCount} hoạt động</span>
            {viewMode === 'plan' && selectedQuarter !== 'all' && (
              <span className="text-[11px] font-semibold text-[#0284C7] bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 px-2 py-0.5 rounded-full">
                {selectedQuarter}
              </span>
            )}
            {statusFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/80 cursor-pointer transition ml-1"
                title="Bấm để hiển thị tất cả"
              >
                <span>{statusFilter === 'done' ? 'Đã hoàn thành' : 'Chưa hoàn thành'}</span>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Hàng 2: Thanh tìm kiếm (Bo tròn dài) & Chip lọc danh mục */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input (rounded-full) */}
          <div className="relative flex-1 sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm hoạt động, người phụ trách (Lead), phòng học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/20 transition shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Chip filter danh mục chuẩn CLB */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs">
            <span className="text-slate-500 font-bold text-[11px] whitespace-nowrap flex items-center gap-1 pr-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Lọc:</span>
            </span>
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'training', label: 'Workshop & Đào tạo' },
              { id: 'meeting', label: 'Họp BCN & Hội nghị' },
              { id: 'recruitment', label: 'Sự kiện & Tuyển quân' },
              { id: 'gala', label: 'Tổng kết & Gala' },
            ].map((chip) => {
              const isSelected = categoryFilter === chip.id
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setCategoryFilter(chip.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'bg-[#0284C7] text-white font-bold'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <span>{chip.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Hàng 3: Điều hướng tuần (Dành cho viewMode === 'week') */}
        {viewMode === 'week' && (
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#061651] dark:text-white">
                Tuần hoạt động:
              </span>
              <span className="text-xs font-semibold text-[#0284C7] bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 px-2.5 py-0.5 rounded-lg">
                {weekDays[0]?.dateString} — {weekDays[6]?.dateString}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Ô ngày hiển thị */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs">
                <CalendarIcon className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>
                  {String(currentDate.getDate()).padStart(2, '0')}/
                  {String(currentDate.getMonth() + 1).padStart(2, '0')}/
                  {currentDate.getFullYear()}
                </span>
              </div>

              {/* Nút Hiện tại */}
              <button
                type="button"
                onClick={handleResetToCurrent}
                className="px-2.5 py-1 text-xs font-bold bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-lg flex items-center gap-1 transition shadow-2xs cursor-pointer"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Hiện tại</span>
              </button>

              {/* Nút Trở về & Tiếp */}
              <button
                type="button"
                onClick={handlePrevWeek}
                className="px-2 py-1 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-sky-50 text-slate-700 dark:text-slate-300 hover:text-[#0284C7] rounded-lg flex items-center gap-0.5 transition shadow-2xs cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trở về</span>
              </button>
              <button
                type="button"
                onClick={handleNextWeek}
                className="px-2 py-1 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-sky-50 text-slate-700 dark:text-slate-300 hover:text-[#0284C7] rounded-lg flex items-center gap-0.5 transition shadow-2xs cursor-pointer"
              >
                <span>Tiếp</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* HÀNG 4: BẢNG DỮ LIỆU THỜI KHÓA BIỂU HOẶC KẾ HOẠCH */}
        {/* ======================================================== */}
        {viewMode === 'week' ? (
          <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-2xs bg-white dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] border-collapse">
                  {/* Table Header: Xanh CLB #0284C7 */}
                  <thead className="bg-[#0284C7] text-white select-none shadow-xs">
                    <tr className="divide-x divide-white/15">
                      <th className="py-2.5 sm:py-3 px-2 w-20 sm:w-24 text-center align-middle select-none">
                        <div className="font-extrabold text-white text-[13px] sm:text-sm uppercase tracking-wider">
                          CA
                        </div>
                      </th>
                      {weekDays.map((w) => (
                        <th
                          key={w.isoDate}
                          className="py-2.5 sm:py-3 px-2 text-center select-none relative"
                        >
                          {/* Chấm tròn nhấp nháy ở góc nhận diện Ngày hiện tại (Hôm nay), không phá vỡ cân đối chữ */}
                          {w.isToday && (
                            <span className="absolute top-2 right-2 flex h-2 w-2" title="Hôm nay">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300 shadow-2xs" />
                            </span>
                          )}
                          <div className="font-extrabold text-white text-[13px] sm:text-sm uppercase tracking-wide">
                            {w.dayName}
                          </div>
                          <div className="text-[11px] sm:text-xs font-medium text-sky-100 tracking-normal mt-0.5">
                            {w.dateString}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  {/* Table Body: Sáng / Chiều / Tối */}
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {/* HÀNG 1: SÁNG */}
                    <tr className="divide-x divide-slate-100 dark:divide-slate-800">
                      <td className="bg-[#F0F9FF] dark:bg-sky-950/30 text-[#0284C7] dark:text-sky-300 font-extrabold text-[13px] sm:text-sm text-center py-6 px-2 align-middle select-none border-r border-slate-100 dark:border-slate-800 tracking-wide uppercase">
                        Sáng
                      </td>
                      {weekDays.map((w) => {
                        const items = cellMap[`morning-${w.isoDate}`] || []
                        return (
                          <td
                            key={`morning-${w.isoDate}`}
                            className={`p-2 align-top transition-colors min-h-[140px] w-[13.5%] ${
                              w.isToday ? 'bg-sky-50/20 dark:bg-sky-950/10' : 'bg-white dark:bg-slate-900'
                            }`}
                          >
                            <div className="space-y-2">
                              {items.map((item) => (
                                <ActivityCard
                                  key={item.id}
                                  item={item}
                                  isBCN={isBCN}
                                  hasPendingEdit={pendingEditIds.has(item.id)}
                                  onClick={() => handleOpenActivity(item, false)}
                                  onToggleDone={(e) => handleToggleDone(item.id, e)}
                                />
                              ))}
                            </div>
                          </td>
                        )
                      })}
                    </tr>

                    {/* HÀNG 2: CHIỀU */}
                    <tr className="divide-x divide-slate-100 dark:divide-slate-800">
                      <td className="bg-[#F0FDF4] dark:bg-emerald-950/30 text-[#16A34A] dark:text-emerald-300 font-extrabold text-[13px] sm:text-sm text-center py-6 px-2 align-middle select-none border-r border-slate-100 dark:border-slate-800 tracking-wide uppercase">
                        Chiều
                      </td>
                      {weekDays.map((w) => {
                        const items = cellMap[`afternoon-${w.isoDate}`] || []
                        return (
                          <td
                            key={`afternoon-${w.isoDate}`}
                            className={`p-2 align-top transition-colors min-h-[140px] w-[13.5%] ${
                              w.isToday ? 'bg-sky-50/20 dark:bg-sky-950/10' : 'bg-white dark:bg-slate-900'
                            }`}
                          >
                            <div className="space-y-2">
                              {items.map((item) => (
                                <ActivityCard
                                  key={item.id}
                                  item={item}
                                  isBCN={isBCN}
                                  hasPendingEdit={pendingEditIds.has(item.id)}
                                  onClick={() => handleOpenActivity(item, false)}
                                  onToggleDone={(e) => handleToggleDone(item.id, e)}
                                />
                              ))}
                            </div>
                          </td>
                        )
                      })}
                    </tr>

                    {/* HÀNG 3: TỐI */}
                    <tr className="divide-x divide-slate-100 dark:divide-slate-800">
                      <td className="bg-[#FFFBEB] dark:bg-amber-950/30 text-[#D97706] dark:text-amber-300 font-extrabold text-[13px] sm:text-sm text-center py-6 px-2 align-middle select-none border-r border-slate-100 dark:border-slate-800 tracking-wide uppercase">
                        Tối
                      </td>
                      {weekDays.map((w) => {
                        const items = cellMap[`evening-${w.isoDate}`] || []
                        return (
                          <td
                            key={`evening-${w.isoDate}`}
                            className={`p-2 align-top transition-colors min-h-[120px] w-[13.5%] ${
                              w.isToday ? 'bg-sky-50/20 dark:bg-sky-950/10' : 'bg-white dark:bg-slate-900'
                            }`}
                          >
                            <div className="space-y-2">
                              {items.map((item) => (
                                <ActivityCard
                                  key={item.id}
                                  item={item}
                                  isBCN={isBCN}
                                  hasPendingEdit={pendingEditIds.has(item.id)}
                                  onClick={() => handleOpenActivity(item, false)}
                                  onToggleDone={(e) => handleToggleDone(item.id, e)}
                                />
                              ))}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chú thích chân bảng */}
            <div className="flex items-center gap-5 flex-wrap pt-1 px-1 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-3.5 rounded bg-[#F0F9FF] border border-sky-300" />
                <span>Workshop Training</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-3.5 rounded bg-[#FFF1F2] border border-rose-300" />
                <span>Họp BCN & Hội nghị</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-3.5 rounded bg-[#FFFBEB] border border-amber-300" />
                <span>Sự kiện & Tuyển quân</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-3.5 rounded bg-[#F0FDF4] border border-emerald-300" />
                <span>Tổng kết & Gala</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-600 font-black">✓</span>
                <span>Đã hoàn thành</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-2xs bg-white dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] border-collapse text-xs">
                  {/* Header: Xanh CLB #0284C7 */}
                  <thead className="bg-[#0284C7] text-white uppercase select-none shadow-xs">
                    <tr className="divide-x divide-white/15">
                      <th className="py-3.5 px-2 w-24 text-center align-middle font-black text-xs sm:text-sm text-white tracking-wider whitespace-nowrap">
                        {selectedQuarter === 'all' ? 'Quý / Tháng' : selectedQuarter}
                      </th>
                      <th className="py-3.5 px-3 sm:px-4 text-center align-middle font-black text-xs sm:text-sm text-white tracking-wider min-w-[340px] whitespace-nowrap">
                        Nội dung hoạt động
                      </th>
                      <th
                        onClick={() => setTimeSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                        className="py-3.5 px-2 w-20 sm:w-24 text-center align-middle font-black text-xs sm:text-sm text-white tracking-wider cursor-pointer hover:bg-[#0369A1] transition select-none group whitespace-nowrap"
                        title="Đang xếp theo Time: ngày trước đến hiện tại. Bấm để đổi chiều"
                      >
                        <div className="inline-flex items-center justify-center gap-1">
                          <span>Time</span>
                          <span className="text-[10px] text-white/90 group-hover:text-white transition font-mono">
                            {timeSortOrder === 'asc' ? '▲' : '▼'}
                          </span>
                        </div>
                      </th>
                      <th className="py-3.5 px-3 text-center align-middle font-black text-xs sm:text-sm text-white w-48 sm:w-52 tracking-wider whitespace-nowrap">
                        Chịu trách nhiệm
                      </th>
                      <th className="py-3.5 px-3 text-center align-middle font-black text-xs sm:text-sm text-white w-52 sm:w-56 tracking-wider whitespace-nowrap">
                        Địa điểm
                      </th>
                      <th className="py-3.5 px-2 w-24 sm:w-28 text-center align-middle font-black text-xs sm:text-sm text-white tracking-wider whitespace-nowrap">
                        Trạng thái
                      </th>
                      <th className="py-3.5 px-2 w-36 sm:w-40 text-center align-middle font-black text-xs sm:text-sm text-white tracking-wider whitespace-nowrap">
                        Thao tác
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {planActivities.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <div className="space-y-2">
                            <Search className="w-8 h-8 text-slate-300 mx-auto" />
                            <p className="font-semibold text-xs sm:text-sm">
                              Chưa có hoạt động nào trong {selectedQuarter === 'all' ? 'kế hoạch' : selectedQuarter}
                            </p>
                            <p className="text-xs text-slate-400">
                              Bấm nút &ldquo;Thêm Hoạt Động&rdquo; phía trên để thêm hoạt động cho {selectedQuarter === 'all' ? 'CLB' : selectedQuarter}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      planActivities.map((act) => (
                        <tr
                          key={act.id}
                          onClick={() => handleOpenActivity(act, false)}
                          className={`divide-x divide-slate-100 dark:divide-slate-800 hover:bg-sky-50/50 dark:hover:bg-slate-800/60 transition cursor-pointer ${
                            act.done ? 'bg-slate-50/40 dark:bg-slate-900/40' : 'bg-white dark:bg-slate-900'
                          }`}
                        >
                          {/* Quý / Tháng */}
                          <td className="py-3.5 px-2 font-bold text-center text-[#061651] dark:text-slate-300 align-middle">
                            <div className="flex flex-col items-center justify-center gap-1">
                              {selectedQuarter === 'all' && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-black tracking-wide bg-sky-100 text-[#0284C7] dark:bg-sky-950 dark:text-sky-300">
                                  {getClubQuarter(act.date, act.month)}
                                </span>
                              )}
                              <span>{act.month}</span>
                            </div>
                          </td>

                          {/* Content */}
                          <td className="py-3.5 px-4 font-bold text-[#061651] dark:text-white align-middle">
                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                              <span className="text-xs font-bold text-[#061651] dark:text-white">{act.title}</span>
                              {(() => {
                                const cat = getActivityCategory(act)
                                const style = CATEGORY_STYLES[cat]
                                return (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold border whitespace-nowrap shrink-0 inline-flex items-center leading-none ${style.codeBadge}`}>
                                    {act.code}
                                  </span>
                                )
                              })()}
                            </div>
                            {act.notes && (
                              <div className="text-[11px] font-normal text-slate-400 mt-0.5 line-clamp-1">
                                {act.notes}
                              </div>
                            )}
                            {pendingEditIds.has(act.id) && (
                              <div className="mt-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-300/80 px-2 py-0.5 rounded-md">
                                  <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
                                  Đang chờ BCN duyệt sửa
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Time (1 Time duy nhất, chung 1 ngày) */}
                          <td className="py-3.5 px-2 text-center font-bold text-slate-700 dark:text-slate-300 align-middle whitespace-nowrap">
                            {(() => {
                              if (act.date) {
                                const d = new Date(act.date)
                                if (!isNaN(d.getTime())) {
                                  const day = String(d.getDate()).padStart(2, '0')
                                  const month = String(d.getMonth() + 1).padStart(2, '0')
                                  return `${day}/${month}`
                                }
                              }
                              return act.timeEnd || act.timeStart || ''
                            })()}
                          </td>

                          {/* Chịu trách nhiệm */}
                          <td className="py-3.5 px-3 align-middle">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                              <span className="font-bold text-[#061651] dark:text-slate-100 text-xs">
                                {act.lead}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 pl-5">
                              {act.department}
                            </div>
                          </td>

                          {/* Địa điểm */}
                          <td className="py-3.5 px-3 align-middle">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                                {act.room}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 pl-5">
                              Giờ: {act.time}
                            </div>
                          </td>

                          {/* Trạng thái (Nút tích khi done - Phân quyền BCN) */}
                          <td className="py-3.5 px-2 text-center align-middle">
                            <div className="flex items-center justify-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleToggleDone(act.id, e)
                                }}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer active:scale-95 ${
                                  !isBCN
                                    ? 'hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-70 hover:opacity-100'
                                    : 'hover:bg-sky-100/60 dark:hover:bg-slate-800'
                                }`}
                                title={
                                  !isBCN
                                    ? 'Chỉ Ban Chủ nhiệm (BCN) mới có quyền tick xác nhận hoàn thành hoạt động'
                                    : act.done
                                    ? 'Đánh dấu chưa hoàn thành'
                                    : 'Đánh dấu đã hoàn thành (Done)'
                                }
                              >
                                {act.done ? (
                                  <div className="w-5 h-5 rounded-md bg-[#0284C7] flex items-center justify-center text-white shadow-xs">
                                    <span className="font-black text-xs leading-none">✓</span>
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 hover:border-[#0284C7] transition" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Thao tác (Sửa & Xóa theo phân quyền BCN / Core Team / Member) */}
                          <td className="py-3.5 px-2 text-center align-middle">
                            <div className="flex items-center justify-center gap-2">
                              {isBCN ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleOpenActivity(act, true)
                                    }}
                                    className="px-2.5 py-1 rounded-xl font-bold text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-600/60 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                                    title="Chỉnh sửa hoạt động trực tiếp (BCN)"
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                                    <span>Sửa</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteActivity(act.id)
                                    }}
                                    className="px-2.5 py-1 rounded-xl font-bold text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-600/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                                    title="Xóa hoạt động khỏi lịch"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-700 dark:text-rose-300" />
                                    <span>Xóa</span>
                                  </button>
                                </>
                              ) : isCoreTeam ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleOpenActivity(act, true)
                                  }}
                                  className="px-2.5 py-1 rounded-xl font-bold text-xs bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 border border-sky-300 dark:border-sky-600/60 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                                  title="Gửi đề xuất chỉnh sửa cho Ban Chủ nhiệm duyệt"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-[#0284C7] dark:text-sky-300" />
                                  <span>Đề xuất sửa</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleOpenActivity(act, false)
                                  }}
                                  className="px-2.5 py-1 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                                  title="Xem chi tiết hoạt động (Chỉ xem)"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Xem</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: CHI TIẾT & CHỈNH SỬA HOẠT ĐỘNG (FULL EDITABLE) */}
      {/* ======================================================== */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`bg-white dark:bg-slate-900 rounded-3xl ${
            isEditingSelected ? 'max-w-xl sm:max-w-2xl' : 'max-w-lg'
          } w-full p-5 sm:p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150`}>
            {!isEditingSelected ? (
              /* CHẾ ĐỘ XEM CHI TIẾT - GỌN GÀNG TINH TẾ (BÉ GỌN CHUẨN YÊU CẦU) */
              <div className="space-y-2.5 sm:space-y-3">
                {/* Header bé gọn */}
                <div className="flex items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs ${
                        CATEGORY_STYLES[getActivityCategory(selectedActivity)].cardBg
                      } ${CATEGORY_STYLES[getActivityCategory(selectedActivity)].border}`}
                    >
                      {getActivityCategory(selectedActivity) === 'training' && (
                        <Award className="w-5 h-5 text-[#0284C7]" />
                      )}
                      {getActivityCategory(selectedActivity) === 'meeting' && (
                        <Users className="w-5 h-5 text-rose-600" />
                      )}
                      {getActivityCategory(selectedActivity) === 'recruitment' && (
                        <Crown className="w-5 h-5 text-amber-600" />
                      )}
                      {getActivityCategory(selectedActivity) === 'gala' && (
                        <Award className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-black rounded-md border tracking-wide uppercase leading-none ${
                            CATEGORY_STYLES[getActivityCategory(selectedActivity)].codeBadge
                          }`}
                        >
                          {selectedActivity.code}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md border leading-none ${
                            CATEGORY_STYLES[getActivityCategory(selectedActivity)].cardBg
                          } ${CATEGORY_STYLES[getActivityCategory(selectedActivity)].border}`}
                        >
                          {CATEGORY_STYLES[getActivityCategory(selectedActivity)].label}
                        </span>
                        {getClubQuarter(selectedActivity.date, selectedActivity.month) && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {getClubQuarter(selectedActivity.date, selectedActivity.month)}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-[#061651] dark:text-white leading-tight">
                        {selectedActivity.title}
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedActivity(null)}
                    className="w-7 h-7 rounded-full border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Danh sách thông tin chi tiết (Style chuẩn 100% như các thẻ KPI ở Ảnh 1: Không viền, kích thước hài hòa) */}
                <div className="space-y-2 pt-0.5">
                  {/* Ô 1: Thời gian hoạt động (Pastel xanh Sky #F0F9FF - #0284C7, Không viền) */}
                  <div className="py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-2xl bg-[#F0F9FF] dark:bg-sky-950/30 flex items-center justify-between gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)]">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
                        Thời gian hoạt động
                      </span>
                      <span className="text-sm sm:text-[15px] font-black text-[#0284C7] dark:text-sky-300 block tracking-tight leading-tight py-0.5">
                        {selectedActivity.time}
                      </span>
                      <span className="text-[10.5px] sm:text-[11px] font-medium text-slate-400 dark:text-slate-500 block leading-tight">
                        Ngày: {selectedActivity.date} ({selectedActivity.month})
                      </span>
                    </div>
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-sky-300/70 bg-white/80 dark:bg-slate-900 flex items-center justify-center text-[#0284C7] shrink-0 shadow-2xs">
                      <Clock className="w-4 h-4 stroke-[1.75]" />
                    </div>
                  </div>

                  {/* Ô 2: Địa điểm tổ chức (Pastel đỏ hồng #FFF1F2 - text-rose-600, Không viền) */}
                  <div className="py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-2xl bg-[#FFF1F2] dark:bg-rose-950/30 flex items-center justify-between gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)]">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
                        Địa điểm tổ chức
                      </span>
                      <span className="text-sm sm:text-[15px] font-black text-rose-600 dark:text-rose-400 block tracking-tight leading-tight py-0.5 truncate">
                        {selectedActivity.room}
                      </span>
                      <span className="text-[10.5px] sm:text-[11px] font-medium text-slate-400 dark:text-slate-500 block leading-tight">
                        Kế hoạch chính thức iSSAC
                      </span>
                    </div>
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-rose-300/70 bg-white/80 dark:bg-slate-900 flex items-center justify-center text-rose-500 shrink-0 shadow-2xs">
                      <MapPin className="w-4 h-4 stroke-[1.75]" />
                    </div>
                  </div>

                  {/* Ô 3: Chịu trách nhiệm (Pastel tím #FAF5FF - #9333EA, Không viền) */}
                  <div className="py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-2xl bg-[#FAF5FF] dark:bg-purple-950/30 flex items-center justify-between gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)]">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
                        Chịu trách nhiệm (Lead)
                      </span>
                      <span className="text-sm sm:text-[15px] font-black text-[#9333EA] dark:text-purple-300 block tracking-tight leading-tight py-0.5 truncate">
                        {selectedActivity.lead}
                      </span>
                      <span className="text-[10.5px] sm:text-[11px] font-medium text-slate-400 dark:text-slate-500 block leading-tight">
                        {selectedActivity.department}
                      </span>
                    </div>
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-purple-300/70 bg-white/80 dark:bg-slate-900 flex items-center justify-center text-[#9333EA] shrink-0 shadow-2xs">
                      <User className="w-4 h-4 stroke-[1.75]" />
                    </div>
                  </div>

                  {/* Ô 4: Trạng thái tiến độ (Pastel vàng #FFFBEB / Xanh #F0FDF4, Không viền) */}
                  <div
                    className={`py-2 px-3 sm:py-2.5 sm:px-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)] ${
                      selectedActivity.done
                        ? 'bg-[#F0FDF4] dark:bg-emerald-950/30'
                        : 'bg-[#FFFBEB] dark:bg-amber-950/30'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
                        Trạng thái tiến độ
                      </span>
                      <span
                        className={`text-sm sm:text-[15px] font-black block tracking-tight leading-tight py-0.5 ${
                          selectedActivity.done
                            ? 'text-[#16A34A] dark:text-emerald-300'
                            : 'text-[#D97706] dark:text-amber-300'
                        }`}
                      >
                        {selectedActivity.done ? 'Đã hoàn thành' : 'Sắp diễn ra'}
                      </span>
                      <span className="text-[10.5px] sm:text-[11px] font-medium text-slate-400 dark:text-slate-500 block leading-tight">
                        {selectedActivity.done
                          ? 'Đã nghiệm thu hoạt động'
                          : `Theo kế hoạch ${getClubQuarter(selectedActivity.date, selectedActivity.month)}`}
                      </span>
                    </div>
                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border flex items-center justify-center shrink-0 shadow-2xs ${
                        selectedActivity.done
                          ? 'border-emerald-300/70 bg-white/70 dark:bg-slate-900 text-[#16A34A]'
                          : 'border-amber-300/70 bg-white/70 dark:bg-slate-900 text-[#D97706]'
                      }`}
                    >
                      {selectedActivity.done ? (
                        <CheckCircle2 className="w-4 h-4 stroke-[2]" />
                      ) : (
                        <Clock className="w-4 h-4 stroke-[1.75]" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Mục tiêu & Lưu ý (Kích thước to đồng bộ như các box trên, Không viền) */}
                {selectedActivity.notes && (
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-100/75 dark:bg-slate-800/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all">
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-[13px] text-[#061651] dark:text-slate-200">
                      <Shield className="w-4 h-4 text-[#0284C7] shrink-0" />
                      <span>Mục tiêu & Lưu ý triển khai:</span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-normal mt-1 pl-6">
                      {selectedActivity.notes}
                    </p>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleToggleDone(selectedActivity.id)}
                    className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs ${
                      !isBCN
                        ? 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 border border-slate-200 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50/50'
                        : selectedActivity.done
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 hover:bg-slate-200/80'
                    }`}
                    title={
                      !isBCN
                        ? 'Chỉ Ban Chủ nhiệm (BCN) mới có quyền xác nhận hoàn thành hoạt động'
                        : selectedActivity.done
                        ? 'Đánh dấu chưa hoàn thành'
                        : 'Đánh dấu đã hoàn thành'
                    }
                  >
                    {selectedActivity.done ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                        <span>Đã hoàn thành ✓</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Đánh dấu hoàn thành</span>
                      </>
                    )}
                    {!isBCN && (
                      <span className="ml-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-300/80">
                        Chỉ BCN
                      </span>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    {(isBCN || isCoreTeam) && (
                      <button
                        type="button"
                        onClick={handleStartEdit}
                        className="px-3.5 py-2 rounded-xl border border-slate-200/90 dark:border-slate-700 text-[#061651] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                        title={isBCN ? 'Chỉnh sửa trực tiếp thông tin hoạt động' : 'Gửi đề xuất chỉnh sửa thông tin cho Ban Chủ nhiệm duyệt'}
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#0284C7]" />
                        <span>{isBCN ? 'Chỉnh sửa' : 'Đề xuất sửa'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedActivity(null)}
                      className="px-5 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs shadow-md shadow-sky-500/20 transition cursor-pointer active:scale-95"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* CHẾ ĐỘ CHỈNH SỬA (EDIT FORM) - CHUẨN STYLE ẢNH 1 */
              <form onSubmit={handleSaveEdit} className="space-y-4">
                {/* Header chuẩn Style Ảnh 1 */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-[#0284C7] flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-900/50 shadow-2xs">
                      <CalendarDays className="w-5 h-5 text-[#0284C7]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-[#061651] dark:text-white leading-tight">
                        {isBCN ? 'Chỉnh sửa hoạt động CLB' : 'Đề xuất chỉnh sửa hoạt động (Core Team)'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                        {isBCN
                          ? 'Cập nhật nội dung, thời gian và phân công người phụ trách CLB.'
                          : 'Gửi đề xuất thay đổi lên Ban Chủ nhiệm phê duyệt trước khi cập nhật chính thức.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingSelected(false)}
                    className="w-8 h-8 rounded-full border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Danh mục phân loại hoạt động (Tab cards lớn chuẩn Ảnh 1) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                  {(
                    [
                      { key: 'training', label: 'Workshop Đào tạo' },
                      { key: 'meeting', label: 'Họp & Hội nghị' },
                      { key: 'recruitment', label: 'Sự kiện Tuyển quân' },
                      { key: 'gala', label: 'Tổng kết & Gala' },
                    ] as const
                  ).map((cat) => {
                    const isSelected = editCategory === cat.key
                    const style = CATEGORY_STYLES[cat.key]
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setEditCategory(cat.key)}
                        className={`py-2.5 px-2 rounded-2xl border-2 font-bold text-xs transition-all flex items-center justify-center text-center cursor-pointer ${
                          isSelected
                            ? `${style.cardBg} ${style.border} shadow-2xs scale-[1.01]`
                            : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        <span className={isSelected ? 'font-black' : 'font-semibold'}>
                          {cat.label}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Form Fields Body */}
                <div className="max-h-[58vh] overflow-y-auto pr-1 space-y-3.5 text-xs">
                  {/* Hàng 1: Mã hoạt động & Ca hoạt động (Khớp 100% Style Ảnh người dùng yêu cầu) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#061651] dark:text-slate-200 mb-1.5">
                        Mã hoạt động: <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={selectedActivity.code}
                        className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-sky-800 dark:text-sky-300 font-mono font-bold text-xs sm:text-sm cursor-not-allowed select-none"
                      />
                      <p className="text-[11px] text-slate-400 mt-1 font-normal">
                        Mã nhận diện chính thức trong kế hoạch CLB
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#061651] dark:text-slate-200 mb-1.5">
                        Ca hoạt động: <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={editSession}
                        onChange={(e) => {
                          const s = e.target.value as 'morning' | 'afternoon' | 'evening'
                          setEditSession(s)
                          if (s === 'morning') setEditTime('08:00 - 12:00')
                          else if (s === 'afternoon') setEditTime('13:30 - 17:30')
                          else if (s === 'evening') setEditTime('18:30 - 21:30')
                        }}
                        className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-[#0284C7] focus:border-transparent outline-none transition cursor-pointer"
                      >
                        <option value="morning">Ca Sáng (08:00 - 12:00)</option>
                        <option value="afternoon">Ca Chiều (13:30 - 17:30)</option>
                        <option value="evening">Ca Tối (18:30 - 21:30)</option>
                      </select>
                      <p className="text-[11px] text-slate-400 mt-1 font-normal">
                        Khung ca sinh hoạt chính thức của CLB
                      </p>
                    </div>
                  </div>

                  {/* Hàng 2: Tên nội dung hoạt động */}
                  <div>
                    <label className="block text-xs font-bold text-[#061651] dark:text-slate-200 mb-1.5">
                      Tên nội dung hoạt động: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="VD: Workshop Training Ban Truyền thông (Design & Content)..."
                      className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-[#0284C7] focus:border-transparent outline-none transition placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>

                  {/* Hàng 3: Người phụ trách & Đơn vị phụ trách */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#061651] dark:text-slate-200 mb-1.5">
                        Người phụ trách (Lead): <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editLead}
                        onChange={(e) => setEditLead(e.target.value)}
                        placeholder="VD: Giang Lê Hiệp / Lê Trần Thuỷ Nguyên..."
                        className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-[#0284C7] focus:border-transparent outline-none transition placeholder:text-slate-400 placeholder:font-normal"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#061651] dark:text-slate-200 mb-1.5">
                        Đơn vị phụ trách:
                      </label>
                      <select
                        value={editDepartment}
                        onChange={(e) => setEditDepartment(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-[#0284C7] focus:border-transparent outline-none transition cursor-pointer"
                      >
                        <option value="Ban Chủ nhiệm">Ban Chủ nhiệm</option>
                        <option value="Ban Truyền thông">Ban Truyền thông</option>
                        <option value="Ban Tư vấn">Ban Tư vấn</option>
                        <option value="Ban Nhân sự">Ban Nhân sự</option>
                        <option value="Toàn CLB">Toàn CLB</option>
                      </select>
                    </div>
                  </div>

                  {/* Hàng 4: Ngày diễn ra & Địa điểm tổ chức */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#061651] dark:text-slate-200 mb-1.5">
                        Ngày diễn ra: <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-[#0284C7] focus:border-transparent outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#061651] dark:text-slate-200 mb-1.5">
                        Địa điểm tổ chức: <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editRoom}
                        onChange={(e) => setEditRoom(e.target.value)}
                        placeholder="VD: Phòng 514, số 1 Phan Tây Nhạc / Hội trường 101, Tòa C..."
                        className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-[#0284C7] focus:border-transparent outline-none transition placeholder:text-slate-400 placeholder:font-normal"
                      />
                    </div>
                  </div>

                  {/* Hàng 6: Mục tiêu & Lưu ý */}
                  <div>
                    <label className="block text-xs font-bold text-[#061651] dark:text-slate-200 mb-1.5">
                      Mục tiêu & Lưu ý:
                    </label>
                    <textarea
                      rows={3}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Mô tả cụ thể trường hợp áp dụng, căn cứ phân công, nội dung chuyên môn cần chuẩn bị..."
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-normal text-xs sm:text-sm focus:ring-2 focus:ring-[#0284C7] focus:border-transparent outline-none transition resize-none placeholder:text-slate-400"
                    />
                  </div>

                  {/* Hộp Thông báo cơ chế CLB chuẩn Ảnh 1 & Phân quyền BCN / Core Team */}
                  {isBCN ? (
                    <div className="rounded-2xl p-4 border border-sky-200/90 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/30">
                      <div className="flex items-center gap-2 font-bold text-xs text-[#061651] dark:text-sky-200 mb-1">
                        <Shield className="w-4 h-4 text-[#0284C7] shrink-0" />
                        <span>Quyền hạn Ban Chủ nhiệm:</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                        Sau khi lưu, hoạt động này sẽ ngay lập tức xuất hiện và cập nhật trực tiếp trên Thời khóa biểu tuần và Kế hoạch hoạt động chính thức của iSSAC.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl p-4 border border-amber-200/90 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30">
                      <div className="flex items-center gap-2 font-bold text-xs text-amber-950 dark:text-amber-200 mb-1">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Lưu ý:</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                        Thông tin chỉnh sửa này sẽ được gửi tới Ban Chủ nhiệm phê duyệt. Khi BCN chấp thuận, các thay đổi mới chính thức có hiệu lực trên hệ thống.
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Actions chuẩn Style Ảnh 1 */}
                <div className="flex items-center justify-between gap-3 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                  {isBCN ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteActivity(selectedActivity.id)}
                      className="px-3.5 py-2.5 rounded-2xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200/80 font-bold text-xs sm:text-[13px] flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Xóa hoạt động</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsEditingSelected(false)}
                      className="px-5 py-2.5 rounded-2xl border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs sm:text-[13px] transition cursor-pointer active:scale-95"
                    >
                      Hủy bỏ
                    </button>

                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs sm:text-[13px] shadow-md shadow-sky-500/20 flex items-center gap-2 transition active:scale-95 cursor-pointer"
                    >
                      {isBCN ? (
                        <>
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>Lưu thay đổi</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Gửi đề xuất sửa cho BCN duyệt</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: THÊM HOẠT ĐỘNG MỚI - CHUẨN STYLE ẢNH 1 */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl sm:max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150 space-y-4">
            {/* Header chuẩn Style Ảnh 1 */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-[#0284C7] flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-900/50 shadow-2xs">
                  <Plus className="w-5 h-5 text-[#0284C7] stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#061651] dark:text-white leading-tight">
                    {isBCN ? 'Thêm hoạt động mới vào Lịch CLB' : 'Đề xuất thêm hoạt động mới (Core Team)'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                    {isBCN
                      ? 'Khởi tạo sự kiện, phân công phụ trách và cập nhật vào kế hoạch iSSAC.'
                      : 'Gửi đề xuất sự kiện mới lên Ban Chủ nhiệm phê duyệt trước khi cập nhật vào lịch.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Danh mục phân loại hoạt động (Tab cards lớn chuẩn Ảnh 1) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
              {(
                [
                  { key: 'training', label: 'Workshop Đào tạo' },
                  { key: 'meeting', label: 'Họp & Hội nghị' },
                  { key: 'recruitment', label: 'Sự kiện Tuyển quân' },
                  { key: 'gala', label: 'Tổng kết & Gala' },
                ] as const
              ).map((cat) => {
                const isSelected = newCategory === cat.key
                const style = CATEGORY_STYLES[cat.key]
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setNewCategory(cat.key)}
                    className={`py-2.5 px-2 rounded-2xl border-2 font-bold text-xs transition-all flex items-center justify-center text-center cursor-pointer ${
                      isSelected
                        ? `${style.cardBg} ${style.border} shadow-2xs scale-[1.01]`
                        : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span className={isSelected ? 'font-black' : 'font-semibold'}>
                      {cat.label}
                    </span>
                  </button>
                )
              })}
            </div>

            <form onSubmit={handleCreateActivity} className="space-y-4">
              {/* Form Fields Body */}
              <div className="max-h-[58vh] overflow-y-auto pr-1 space-y-3.5 text-xs">
                {/* Hàng 1: Mã hoạt động & Ca hoạt động (Khớp 100% Style Ảnh người dùng yêu cầu) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#061651] dark:text-slate-200 mb-1.5">
                      Mã hoạt động: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      placeholder="VD: iSSAC-WS03"
                      className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sky-800 dark:text-sky-300 font-mono font-bold text-xs sm:text-sm focus:ring-2 focus:ring-[#0284C7] focus:border-transparent outline-none transition placeholder:text-slate-400 placeholder:font-normal"
                    />
                    <p className="text-[11px] text-slate-400 mt-1 font-normal">
                      Tự động gợi ý mã kế tiếp
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#061651] dark:text-slate-200 mb-1.5">
                      Ca hoạt động: <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newSession}
                      onChange={(e) => {
                        const s = e.target.value as 'morning' | 'afternoon' | 'evening'
                        setNewSession(s)
                        if (s === 'morning') setNewTime('08:00 - 12:00')
                        else if (s === 'afternoon') setNewTime('13:30 - 17:30')
                        else if (s === 'evening') setNewTime('18:30 - 21:30')
                      }}
                      className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-[#0284C7] focus:border-transparent outline-none transition cursor-pointer"
                    >
                      <option value="morning">Ca Sáng (08:00 - 12:00)</option>
                      <option value="afternoon">Ca Chiều (13:30 - 17:30)</option>
                      <option value="evening">Ca Tối (18:30 - 21:30)</option>
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1 font-normal">
                      Khung ca sinh hoạt chính thức của CLB
                    </p>
                  </div>
                </div>

                {/* Hàng 2: Tên nội dung hoạt động */}
                <div>
                  <label className="block text-xs font-bold text-[#061651] dark:text-slate-200 mb-1.5">
                    Tên nội dung hoạt động: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Workshop Training kỹ năng TVTS & Kỹ năng mềm..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-[#0284C7] focus:border-transparent outline-none transition placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>

                {/* Hàng 3: Người phụ trách & Đơn vị phụ trách */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#061651] dark:text-slate-200 mb-1.5">
                      Người phụ trách (Lead): <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Giang Lê Hiệp / Lê Trần Thuỷ Nguyên..."
                      value={newLead}
                      onChange={(e) => setNewLead(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-[#0284C7] focus:border-transparent outline-none transition placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#061651] dark:text-slate-200 mb-1.5">
                      Đơn vị phụ trách:
                    </label>
                    <select
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-[#0284C7] focus:border-transparent outline-none transition cursor-pointer"
                    >
                      <option value="Ban Chủ nhiệm">Ban Chủ nhiệm</option>
                      <option value="Ban Truyền thông">Ban Truyền thông</option>
                      <option value="Ban Tư vấn">Ban Tư vấn</option>
                      <option value="Ban Nhân sự">Ban Nhân sự</option>
                      <option value="Toàn CLB">Toàn CLB</option>
                    </select>
                  </div>
                </div>

                {/* Hàng 4: Ngày diễn ra & Địa điểm tổ chức */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#061651] dark:text-slate-200 mb-1.5">
                      Ngày diễn ra: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-[#0284C7] focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#061651] dark:text-slate-200 mb-1.5">
                      Địa điểm tổ chức: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Phòng 514, số 1 Phan Tây Nhạc / Hội trường 101, Tòa C..."
                      value={newRoom}
                      onChange={(e) => setNewRoom(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm focus:ring-2 focus:ring-[#0284C7] focus:border-transparent outline-none transition placeholder:text-slate-400 placeholder:font-normal"
                    />
                  </div>
                </div>

                {/* Hàng 5: Mục tiêu & Lưu ý */}
                <div>
                  <label className="block text-xs font-bold text-[#061651] dark:text-slate-200 mb-1.5">
                    Mục tiêu & Lưu ý:
                  </label>
                  <textarea
                    rows={3}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Mô tả cụ thể trường hợp áp dụng, căn cứ phân công, nội dung chuyên môn cần chuẩn bị..."
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-normal text-xs sm:text-sm focus:ring-2 focus:ring-[#0284C7] focus:border-transparent outline-none transition resize-none placeholder:text-slate-400"
                  />
                </div>

                {/* Hộp Thông báo cơ chế CLB chuẩn Ảnh 1 & Phân quyền BCN / Core Team */}
                {isBCN ? (
                  <div className="rounded-2xl p-4 border border-sky-200/90 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/30">
                    <div className="flex items-center gap-2 font-bold text-xs text-[#061651] dark:text-sky-200 mb-1">
                      <Shield className="w-4 h-4 text-[#0284C7] shrink-0" />
                      <span>Quyền hạn Ban Chủ nhiệm:</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                      Sự kiện sau khi lưu sẽ xuất hiện trực tiếp và đồng bộ ngay trên Thời khóa biểu tuần và Kế hoạch hoạt động chính thức của iSSAC.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl p-4 border border-amber-200/90 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30">
                    <div className="flex items-center gap-2 font-bold text-xs text-amber-950 dark:text-amber-200 mb-1">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Lưu ý:</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                      Sự kiện này sẽ được chuyển vào hàng đợi duyệt của Ban Chủ nhiệm. Sau khi BCN phê duyệt chấp nhận, hoạt động mới chính thức hiển thị trên lịch.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Actions chuẩn Style Ảnh 1 */}
              <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs sm:text-[13px] transition cursor-pointer active:scale-95"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs sm:text-[13px] shadow-md shadow-sky-500/20 flex items-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  {isBCN ? (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Lưu hoạt động</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Gửi đề xuất cho BCN duyệt</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ======================================================== */}
      {/* MODAL 3: DUYỆT ĐỀ XUẤT (ĐẶC QUYỀN DUY NHẤT BAN CHỦ NHIỆM) */}
      {/* ======================================================== */}
      {isApprovalModalOpen && isBCN && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl lg:max-w-4xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-900/50 shadow-2xs">
                  <Bell className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#061651] dark:text-white leading-tight flex items-center gap-2">
                    <span>Phê duyệt đề xuất sự kiện & hoạt động</span>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      {pendingRequests.length} yêu cầu
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                    Duyệt hoặc từ chối các yêu cầu tạo mới và chỉnh sửa hoạt động từ Core Team.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsApprovalModalOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Scrollable list */}
            <div className="overflow-y-auto space-y-4 flex-1 pr-1">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    Hiện không có đề xuất nào đang chờ duyệt
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Tất cả các hoạt động trên Thời khóa biểu và Kế hoạch chính thức iSSAC đã được cập nhật đồng bộ.
                  </p>
                </div>
              ) : (
                pendingRequests.map((req) => {
                  const cat = getActivityCategory(req.activityData)
                  const catStyle = CATEGORY_STYLES[cat]
                  const isEdit = req.type === 'edit'
                  const originalAct = req.targetActivityId
                    ? activities.find((a) => a.id === req.targetActivityId)
                    : null

                  return (
                    <div
                      key={req.id}
                      className="p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-sm space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
                    >
                      {/* 1. THANH TIÊU ĐỀ THẺ: Loại đề xuất, Mã nhận diện, Thời gian & Người gửi (100% nằm trọn trong box) */}
                      <div className="pb-3 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
                        {/* Hàng 1: Các nhãn phân loại (Trái) & Thời gian gửi (Phải) */}
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isEdit ? (
                              <span className="px-3 py-1 rounded-xl text-xs font-black bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-700 flex items-center gap-1.5 shadow-2xs whitespace-nowrap">
                                <Pencil className="w-3.5 h-3.5 text-sky-600" />
                                Đề xuất chỉnh sửa
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1.5 shadow-2xs whitespace-nowrap">
                                <Plus className="w-3.5 h-3.5 stroke-[2.5] text-emerald-600" />
                                Đề xuất sự kiện mới
                              </span>
                            )}

                            <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                              {req.activityData.code}
                            </span>

                            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border whitespace-nowrap ${catStyle.codeBadge}`}>
                              {catStyle.label}
                            </span>
                          </div>

                          {/* Thời gian gửi đề xuất căn phải */}
                          <div className="text-slate-500 dark:text-slate-400 font-medium text-xs flex items-center gap-1.5 shrink-0 ml-auto">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{req.requestedAt}</span>
                          </div>
                        </div>

                        {/* Hàng 2: Thẻ người gửi đề xuất - Rộng rãi, nằm gọn 100% trong box, không bao giờ bị tràn */}
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 px-3.5 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex-wrap sm:flex-nowrap">
                          <div className="w-5 h-5 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                            {req.requestedBy.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            Người gửi: {req.requestedBy}
                          </span>
                          {req.requestedByTitle && (
                            <>
                              <span className="text-slate-300 dark:text-slate-600 font-normal mx-0.5">|</span>
                              <span className="text-slate-500 dark:text-slate-400 font-medium truncate">
                                {req.requestedByTitle}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 2. TÊN NỘI DUNG HOẠT ĐỘNG (Rõ ràng, bố cục nổi bật) */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase block">
                          Tên nội dung hoạt động đề xuất:
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-[#061651] dark:text-white leading-snug">
                          {req.activityData.title}
                        </h4>
                      </div>

                      {/* 3. LƯỚI 4 THẺ THÔNG TIN CHI TIẾT CÂN ĐỐI (2x2 Grid) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Thẻ 1: Thời gian & Lịch trình */}
                        <div className="p-3.5 rounded-2xl bg-[#F0F9FF] dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/60 flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-sky-300/80 flex items-center justify-center text-[#0284C7] shrink-0 shadow-2xs">
                            <Clock className="w-4.5 h-4.5 stroke-[2]" />
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                              Thời gian & Ngày diễn ra
                            </span>
                            <div className="text-sm font-black text-[#0284C7] dark:text-sky-300 truncate">
                              {req.activityData.time || '08:00 - 12:00'}
                            </div>
                            <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1 flex-wrap">
                              <span>Ngày: <strong>{formatDisplayDate(req.activityData.date)}</strong></span>
                              {req.activityData.session && (
                                <>
                                  <span className="text-slate-300 dark:text-slate-600 font-normal mx-1">|</span>
                                  <span className="text-slate-500 font-normal">
                                    Ca {req.activityData.session === 'morning' ? 'Sáng' : req.activityData.session === 'afternoon' ? 'Chiều' : 'Tối'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Thẻ 2: Địa điểm tổ chức */}
                        <div className="p-3.5 rounded-2xl bg-[#FFF1F2] dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-rose-300/80 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs">
                            <MapPin className="w-4.5 h-4.5 stroke-[2]" />
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                              Địa điểm tổ chức
                            </span>
                            <div className="text-sm font-black text-rose-700 dark:text-rose-300 truncate">
                              {req.activityData.room}
                            </div>
                            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                              Khuôn viên sinh hoạt CLB iSSAC
                            </div>
                          </div>
                        </div>

                        {/* Thẻ 3: Người phụ trách (Lead) */}
                        <div className="p-3.5 rounded-2xl bg-[#FAF5FF] dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-purple-300/80 flex items-center justify-center text-purple-600 shrink-0 shadow-2xs">
                            <User className="w-4.5 h-4.5 stroke-[2]" />
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                              Chịu trách nhiệm (Lead)
                            </span>
                            <div className="text-sm font-black text-purple-800 dark:text-purple-300 truncate">
                              {req.activityData.lead}
                            </div>
                            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                              {req.activityData.department || 'Ban phụ trách CLB'}
                            </div>
                          </div>
                        </div>

                        {/* Thẻ 4: Chu kỳ kế hoạch & Phân loại (Đã đổi dấu . thành | nhạt) */}
                        <div className="p-3.5 rounded-2xl bg-[#FFFBEB] dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-amber-300/80 flex items-center justify-center text-amber-600 shrink-0 shadow-2xs">
                            <Award className="w-4.5 h-4.5 stroke-[2]" />
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                              Kế hoạch & Chu kỳ
                            </span>
                            <div className="text-sm font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5 truncate">
                              <span>{req.activityData.quarter || getClubQuarter(req.activityData.date)}</span>
                              <span className="text-amber-400/80 dark:text-amber-600/80 font-normal">|</span>
                              <span>{req.activityData.month}</span>
                            </div>
                            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                              {catStyle.label}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 4. NẾU LÀ ĐỀ XUẤT CHỈNH SỬA: BẢNG ĐỐI CHIẾU SO SÁNH (TRƯỚC VS SAU) */}
                      {isEdit && (
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                            <Pencil className="w-3.5 h-3.5 text-[#0284C7]" />
                            <span>Đối chiếu thay đổi so với hoạt động gốc:</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-[11px]">
                            {/* Dữ liệu gốc */}
                            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                              <span className="font-bold text-slate-400 block">DỮ LIỆU GỐC HIỆN TẠI:</span>
                              <p className="font-bold text-slate-700 dark:text-slate-300 line-clamp-1">
                                {originalAct?.title || req.targetActivityTitle || 'Không xác định'}
                              </p>
                              <div className="text-slate-500 space-y-0.5 text-[11px]">
                                {originalAct ? (
                                  <>
                                    <p>Thời gian: {originalAct.time} ({formatDisplayDate(originalAct.date)})</p>
                                    <p>Địa điểm: {originalAct.room}</p>
                                    <p>Phụ trách: {originalAct.lead}</p>
                                  </>
                                ) : (
                                  <p className="italic">Dữ liệu gốc đã được cập nhật trước đó.</p>
                                )}
                              </div>
                            </div>

                            {/* Dữ liệu đề xuất mới */}
                            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/80 space-y-1.5">
                              <span className="font-bold text-[#0284C7] block">ĐỀ XUẤT THAY ĐỔI MỚI:</span>
                              <p className="font-bold text-[#061651] dark:text-sky-200 line-clamp-1">
                                {req.activityData.title}
                              </p>
                              <div className="text-sky-700 dark:text-sky-300 space-y-0.5 text-[11px]">
                                <p>Thời gian: <strong>{req.activityData.time}</strong> ({formatDisplayDate(req.activityData.date)})</p>
                                <p>Địa điểm: <strong>{req.activityData.room}</strong></p>
                                <p>Phụ trách: <strong>{req.activityData.lead}</strong></p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 5. GHI CHÚ & LÝ DO ĐỀ XUẤT */}
                      {req.activityData.notes && (
                        <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200 mb-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Ghi chú & Lý do đề xuất từ Core Team:</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 pl-5 leading-relaxed font-normal">
                            {req.activityData.notes}
                          </p>
                        </div>
                      )}

                      {/* 6. HÀNH ĐỘNG PHÊ DUYỆT (ĐẶC QUYỀN DUY NHẤT BAN CHỦ NHIỆM) */}
                      <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        {/* Dòng ghi chú bảo mật phân tầng */}
                        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
                          <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Khi Ban Chủ nhiệm phê duyệt, hoạt động sẽ được cập nhật trực tiếp lên Lịch hoạt động chính thức của CLB.</span>
                        </div>

                        {/* Dòng nút bấm thao tác căn phải rộng rãi, cân đối */}
                        <div className="flex items-center justify-end gap-3 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleRejectRequest(req.id)}
                            className="px-5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs sm:text-[13px] flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
                          >
                            <X className="w-4 h-4" />
                            <span>Từ chối</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveRequest(req.id)}
                            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-[13px] flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/25 transition active:scale-95 cursor-pointer"
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                            <span>Chấp nhận & Cập nhật</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <div className="text-xs text-slate-400 font-medium">
                {pendingRequests.length > 0
                  ? `Tổng cộng: ${pendingRequests.length} đề xuất trong danh sách`
                  : 'Hàng đợi phê duyệt đang trống'}
              </div>
              <button
                type="button"
                onClick={() => setIsApprovalModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer active:scale-95"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast thông báo hệ thống (Thành công / Cảnh báo / Thông tin) */}
      {systemNotice && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-md bg-white dark:bg-slate-900 border-2 rounded-2xl shadow-2xl p-4 flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200 ${
            systemNotice.type === 'success'
              ? 'border-emerald-500 dark:border-emerald-600'
              : systemNotice.type === 'warning'
              ? 'border-rose-400 dark:border-rose-500'
              : 'border-[#0284C7] dark:border-sky-500'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              systemNotice.type === 'success'
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60'
                : systemNotice.type === 'warning'
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60'
                : 'bg-sky-100 text-[#0284C7] dark:bg-sky-950/60'
            }`}
          >
            {systemNotice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : systemNotice.type === 'warning' ? (
              <Shield className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 pr-2">
            <div
              className={`font-bold text-sm flex items-center gap-1.5 ${
                systemNotice.type === 'success'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : systemNotice.type === 'warning'
                  ? 'text-rose-700 dark:text-rose-400'
                  : 'text-[#0284C7] dark:text-sky-400'
              }`}
            >
              <span>{systemNotice.title}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {systemNotice.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSystemNotice(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Toast thông báo phân quyền Ban Chủ nhiệm (BCN) */}
      {permissionNotice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-white dark:bg-slate-900 border-2 border-rose-400 dark:border-rose-500 rounded-2xl shadow-2xl p-4 flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-rose-600" />
          </div>
          <div className="flex-1 pr-2">
            <div className="font-bold text-rose-700 dark:text-rose-400 text-sm flex items-center gap-1.5">
              <span>Giới hạn quyền xác nhận</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                Chỉ BCN
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {permissionNotice}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPermissionNotice(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// Subcomponent: Activity Card inside a timetable cell
function ActivityCard({
  item,
  isBCN,
  hasPendingEdit,
  onClick,
  onToggleDone,
}: {
  item: ActivityItem
  isBCN?: boolean
  hasPendingEdit?: boolean
  onClick: () => void
  onToggleDone: (e: React.MouseEvent) => void
}) {
  const cat = getActivityCategory(item)
  const style = CATEGORY_STYLES[cat]

  return (
    <div
      onClick={onClick}
      className={`p-2.5 sm:p-3 rounded-xl border ${style.cardBg} ${style.border} shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-sm transition-all duration-150 cursor-pointer text-left space-y-2 group`}
    >
      {/* Title */}
      <div
        className={`font-bold text-[#061651] dark:text-white text-xs sm:text-[13px] leading-snug line-clamp-2 ${style.titleHover} transition-colors`}
      >
        {item.title}
      </div>

      {/* Code & Pending Edit Badge */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`text-[10.5px] font-bold border px-2 py-0.5 rounded-md whitespace-nowrap shrink-0 inline-flex items-center leading-none ${style.codeBadge}`}>
          {item.code}
        </span>
        {hasPendingEdit && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border border-amber-300/90 dark:border-amber-700 px-1.5 py-0.5 rounded-md shadow-2xs">
            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
            Đang chờ duyệt sửa
          </span>
        )}
      </div>

      {/* Giờ / Time */}
      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
        <Clock className={`w-3.5 h-3.5 ${style.clockIcon} shrink-0`} />
        <span>Giờ: {item.time}</span>
      </div>

      {/* Phòng */}
      <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        <span>Phòng: {item.room}</span>
      </div>

      {/* Lead: Who */}
      <div className={`text-[11.5px] sm:text-xs font-black ${style.leadText} line-clamp-1 flex items-center gap-1.5`}>
        <User className={`w-3.5 h-3.5 ${style.leadIcon} shrink-0`} />
        <span>Lead: {item.lead}</span>
      </div>

      {/* Done Badge & Checkbox xác nhận hoàn thành */}
      <div className={`pt-1.5 flex items-center justify-between border-t ${style.divider}`}>
        {item.done ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 px-2 py-0.5 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Đã hoàn thành
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 px-2 py-0.5 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Sắp diễn ra
          </span>
        )}

        <button
          type="button"
          onClick={onToggleDone}
          className={`p-1 rounded-md transition cursor-pointer ${
            !isBCN
              ? 'opacity-60 hover:opacity-100 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600'
              : 'hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700'
          }`}
          title={
            !isBCN
              ? 'Chỉ Ban Chủ nhiệm (BCN) mới có quyền tick xác nhận hoàn thành hoạt động'
              : item.done
              ? 'Đánh dấu chưa hoàn thành'
              : 'Đánh dấu đã hoàn thành'
          }
        >
          {item.done ? (
            <CheckSquare className={`w-4 h-4 ${!isBCN ? 'text-emerald-500' : 'text-emerald-600'}`} />
          ) : (
            <Square className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>
    </div>
  )
}
