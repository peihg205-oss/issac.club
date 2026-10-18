'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { INITIAL_MEMBERS, type RosterMember, getRankedMembers, getActiveRosterMembers } from '@/lib/clubData'
import type { DepartmentCode, DepartmentSlug, RuleCode } from '@/types/database'
import { CRITERIA_RULES } from '@/lib/scoring/constants'
import { calculateScoreDelta } from '@/lib/scoring/engine'
import { AVAILABLE_PERIODS, type PeriodItem, createMonthlyPeriodItem } from '@/lib/periodData'
import {
  getVietnamNowFormatted,
  getVietnamNowDateFormatted,
  getVietnamNowTimeFormatted,
  normalizeHistoryTimestamp,
} from '@/lib/vietnamTime'
import { sanitizeMemberAvatar } from '@/lib/utils/imageCompress'

export interface CustomRuleItem {
  code: string
  name: string
  description: string
  type: 'add' | 'deduct' | 'principle'
  points: number | string
  category: string
  condition?: string
  coreMultiplierApplies?: boolean
  monthlyCapGroup?: string | null
  createdAt?: string
}

export interface ProposalItem {
  id: string
  memberCode: string
  memberName: string
  memberDept: string
  isCore: boolean
  criterionCode: string
  criterionName: string
  points: number
  reason: string
  evidenceUrl?: string
  proposedBy: string
  proposedByRole: string
  status: 'pending_bcn' | 'approved' | 'rejected' | 'deleted'
  createdAt: string
  reviewedAt?: string
  periodId?: string
  periodName?: string
}

export type CheckinStatus = 'present_on_time' | 'late' | 'excused' | 'unexcused'

export interface CheckinRecord {
  memberCode: string
  status: CheckinStatus
  checkinTime?: string
  note?: string
}

export interface MeetingEvent {
  id: string
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  location: string
  pinCode: string
  isRequired: boolean
  isFinalized: boolean
  finalizedAt?: string
  finalizedBy?: string
  records: Record<string, CheckinRecord>
  allowRegistration?: boolean
  registeredMemberCodes?: string[]
  maxAttendees?: number
  pointBonus?: number
  category?: 'meeting' | 'workshop' | 'teambuilding' | 'external'
  targetDept?: string
  periodId?: string
  periodName?: string
}

export interface DisputeItem {
  id: string
  memberCode: string
  memberName: string
  memberDept: string
  criterionCode: string
  pointsContested: number
  reason: string
  evidenceUrl?: string
  createdAt: string
  status: 'pending_hr_review' | 'pending_bcn' | 'approved_resolved' | 'rejected'
  hrNote?: string
  bcnVerdict?: string
  resolvedAt?: string
}

interface ClubContextType {
  members: RosterMember[]
  proposals: ProposalItem[]
  events: MeetingEvent[]
  activeEvent: MeetingEvent | null
  disputes: DisputeItem[]
  addMember: (data: {
    fullName: string
    departmentCode: DepartmentCode
    position: string
    studentId?: string
    phone?: string
    email: string
    isCore: boolean
    className?: string
    avatarUrl?: string
  }) => void
  updateMember: (
    memberCode: string,
    updates: Partial<RosterMember>
  ) => { success: boolean; message: string }
  deleteMember: (
    memberCode: string
  ) => { success: boolean; message: string }
  createProposal: (data: {
    memberCode: string
    criterionCode: string
    customPoints?: number
    reason: string
    evidenceUrl?: string
    proposerName: string
    proposerRole: string
    proposerDepartmentCode?: string
    directApply?: boolean
    periodId?: string
  }) => { success: boolean; message: string }
  approveProposal: (proposalId: string) => void
  rejectProposal: (proposalId: string) => void
  updateProposal: (
    proposalId: string,
    updatedData: { points?: number; reason?: string; criterionCode?: string },
    actorName: string
  ) => { success: boolean; message: string }
  deleteProposal: (
    proposalId: string,
    actorName: string
  ) => { success: boolean; message: string }
  updateCheckinRecord: (
    eventId: string,
    memberCode: string,
    status: CheckinStatus,
    note?: string
  ) => void
  memberSelfCheckin: (
    eventId: string,
    memberCode: string,
    pinCode: string,
    phoneLastDigits?: string,
    mode?: 'personal' | 'kiosk'
  ) => { success: boolean; message: string; status?: CheckinStatus }
  finalizeEvent: (
    eventId: string,
    finalizedByName: string
  ) => {
    success: boolean
    message: string
    summary?: {
      present: number
      late: number
      excused: number
      unexcused: number
      totalApplied: number
    }
  }
  createDispute: (data: {
    memberCode: string
    criterionCode: string
    pointsContested: number
    reason: string
    evidenceUrl?: string
  }) => { success: boolean; message: string }
  reviewDisputeByHR: (disputeId: string, hrNote: string) => void
  resolveDisputeByBCN: (
    disputeId: string,
    approved: boolean,
    verdict: string
  ) => { success: boolean; message: string }
  currentActiveMonth: string
  resetMonthlyScores: (newMonthLabel: string, actorName: string) => { success: boolean; message: string }
  restoreOctoberScores: () => void
  // Hệ thống chu kỳ tháng & khóa sổ thi đua
  periods: PeriodItem[]
  customPeriodScores: Record<string, Record<string, number>>
  currentActivePeriodId: string
  setCurrentActivePeriodId: (id: string) => void
  createMonthPeriod: (data: {
    month: number
    year: number
    name?: string
    description?: string
    actorName: string
  }) => { success: boolean; message: string; period?: PeriodItem }
  updateMonthPeriod: (
    periodId: string,
    data: {
      name?: string
      shortLabel?: string
      description?: string
      timeRange?: string
    },
    actorName: string
  ) => { success: boolean; message: string; period?: PeriodItem }
  deleteMonthPeriod: (periodId: string, actorName: string) => { success: boolean; message: string }
  lockMonthPeriod: (periodId: string, actorName: string) => { success: boolean; message: string }
  unlockMonthPeriod: (periodId: string, actorName: string) => { success: boolean; message: string }
  // Quản lý quy định & tiêu chí mở rộng
  customRules: CustomRuleItem[]
  addCustomRule: (rule: CustomRuleItem) => { success: boolean; message: string }
  deleteCustomRule: (code: string) => { success: boolean; message: string }
  // Quản lý sự kiện sắp tới & cổng đăng ký
  activeEventId: string
  setActiveEventId: (id: string) => void
  createUpcomingEvent: (data: {
    title: string
    description: string
    date: string
    startTime: string
    endTime: string
    location: string
    pinCode?: string
    isRequired: boolean
    allowRegistration?: boolean
    maxAttendees?: number
    pointBonus?: number
    category?: 'meeting' | 'workshop' | 'teambuilding' | 'external'
  }) => { success: boolean; message: string; event?: MeetingEvent }
  updateEvent: (eventId: string, updates: Partial<MeetingEvent>) => { success: boolean; message: string }
  updateEventAttendees: (eventId: string, memberCodes: string[]) => { success: boolean; message: string }
  registerForEvent: (eventId: string, memberCode: string) => { success: boolean; message: string }
  unregisterFromEvent: (eventId: string, memberCode: string) => { success: boolean; message: string }
  deleteEvent: (eventId: string) => { success: boolean; message: string }
}

const ClubContext = createContext<ClubContextType | undefined>(undefined)

// Sẵn sàng vận hành thật: Danh sách đề xuất điểm rỗng
const INITIAL_PROPOSALS: ProposalItem[] = []

// Sẵn sàng vận hành thật: Danh sách sự kiện và khiếu nại rỗng, khởi tạo theo thực tế CLB
const INITIAL_EVENTS: MeetingEvent[] = []

const INITIAL_DISPUTES: DisputeItem[] = []


const INITIAL_CUSTOM_RULES: CustomRuleItem[] = [
  {
    code: 'C10',
    name: 'Đại diện CLB tham gia Hội thảo / Diễn đàn ĐHQG',
    description: 'Đại diện CLB tham dự và phát biểu hoặc hỗ trợ công tác tổ chức tại diễn đàn, hội thảo cấp ĐHQGHN',
    type: 'add',
    points: 4,
    category: 'Đối ngoại & Sự kiện',
    condition: 'Có quyết định cử đi từ Ban Chủ nhiệm & ảnh check-in thực tế',
    coreMultiplierApplies: false,
    createdAt: '15/10/2025',
  },
  {
    code: 'T14',
    name: 'Không tham gia sự kiện bắt buộc CLB (Teambuilding/Gen Fest)',
    description: 'Vắng mặt không phép tại sự kiện trọng điểm toàn CLB được BCN ấn định bắt buộc',
    type: 'deduct',
    points: -5,
    category: 'Kỷ luật & Sự kiện',
    condition: 'Không xin phép BCN trước 48h. Nhân sự Core Team chịu chế tài x2 (-10 điểm).',
    coreMultiplierApplies: true,
    createdAt: '15/10/2025',
  },
]

// Thuật toán hợp nhất Proposals 2 chiều thông minh chống mất dữ liệu lịch sử điểm số
export function mergeProposals(
  localList: ProposalItem[],
  incomingList: ProposalItem[],
  deletedIds: Set<string> = new Set()
): ProposalItem[] {
  const map = new Map<string, ProposalItem>()

  // 1. Nạp từ incoming (server hoặc cloud)
  for (const item of incomingList) {
    if (item?.id && !deletedIds.has(item.id) && item.status !== 'deleted') {
      map.set(item.id, {
        ...item,
        createdAt: normalizeHistoryTimestamp(item.createdAt),
      })
    }
  }

  // 2. Hợp nhất từ local (không bỏ sót bất kỳ bản ghi nào mới tạo ở local)
  for (const item of localList) {
    if (item?.id && !deletedIds.has(item.id) && item.status !== 'deleted') {
      const existing = map.get(item.id)
      if (!existing) {
        map.set(item.id, {
          ...item,
          createdAt: normalizeHistoryTimestamp(item.createdAt),
        })
      } else {
        // Cả 2 đều có: nếu bản ghi local có reviewedAt mới hơn hoặc status approved thì giữ lại
        if (item.reviewedAt && !existing.reviewedAt) {
          map.set(item.id, { ...existing, ...item })
        } else if (item.status === 'approved' && existing.status === 'pending_bcn') {
          map.set(item.id, { ...existing, ...item })
        }
      }
    }
  }

  return Array.from(map.values())
}

// Thuật toán hợp nhất Events 2 chiều thông minh theo ID và bản ghi điểm danh
export function mergeEvents(
  localList: MeetingEvent[],
  incomingList: MeetingEvent[],
  deletedEventIds?: Set<string>
): MeetingEvent[] {
  const map = new Map<string, MeetingEvent>()

  for (const evt of incomingList) {
    if (evt?.id && (!deletedEventIds || !deletedEventIds.has(evt.id))) {
      map.set(evt.id, evt)
    }
  }

  for (const evt of localList) {
    if (evt?.id && (!deletedEventIds || !deletedEventIds.has(evt.id))) {
      const existing = map.get(evt.id)
      if (!existing) {
        map.set(evt.id, evt)
      } else {
        map.set(evt.id, {
          ...existing,
          ...evt,
          isFinalized: existing.isFinalized || evt.isFinalized,
          finalizedAt: existing.finalizedAt || evt.finalizedAt,
          finalizedBy: existing.finalizedBy || evt.finalizedBy,
          registeredMemberCodes: Array.from(
            new Set([...(existing.registeredMemberCodes || []), ...(evt.registeredMemberCodes || [])])
          ),
          records: {
            ...(existing.records || {}),
            ...(evt.records || {}),
          },
        })
      }
    }
  }

  return Array.from(map.values())
}

/**
 * Tự động đồng bộ và chuẩn hóa điểm số thực tế của tất cả thành viên trong chu kỳ hiện tại
 * dựa trên sổ cái các bản ghi điểm đã được phê duyệt (Single Source of Truth).
 * Mốc bắt đầu chuẩn là 60 điểm (Quy chế P01).
 */
export function reconcileMemberScores(
  membersList: RosterMember[],
  proposalsList: ProposalItem[],
  activePeriodId: string = 'month-2026-10'
): RosterMember[] {
  const deltaMap = new Map<string, number>()
  const t02CountMap = new Map<string, number>()

  for (const p of proposalsList) {
    if (p.status === 'approved' && (!p.periodId || p.periodId === activePeriodId)) {
      deltaMap.set(p.memberCode, (deltaMap.get(p.memberCode) || 0) + p.points)
      if (p.criterionCode === 'T02') {
        t02CountMap.set(p.memberCode, (t02CountMap.get(p.memberCode) || 0) + 1)
      }
    }
  }

  const updated = membersList.map((m) => {
    const delta = deltaMap.get(m.member_code)
    // Nếu có bản ghi trong sổ cái proposals chu kỳ hiện tại, điểm = 60 + delta (clamp 0..100)
    // Nếu chưa có bản ghi nào, giữ nguyên mốc 60 điểm chuẩn
    const baseScore = 60
    const calculatedScore = delta !== undefined ? Math.max(0, Math.min(100, baseScore + delta)) : (m.current_score || 60)
    const t02Count = t02CountMap.get(m.member_code) || 0
    return {
      ...m,
      current_score: calculatedScore,
      absent_count_t02: t02Count,
    }
  })

  return getRankedMembers(updated)
}

export function ClubProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<RosterMember[]>(() => getActiveRosterMembers(INITIAL_MEMBERS))
  const [proposals, setProposals] = useState<ProposalItem[]>(INITIAL_PROPOSALS)
  const [events, setEvents] = useState<MeetingEvent[]>(INITIAL_EVENTS)
  const [activeEventId, _setActiveEventId] = useState<string>('')
  const setActiveEventId = (id: string) => {
    _setActiveEventId(id)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('issac_active_event_id', id)
      } catch (e) {}
    }
    syncToCloud({ activeEventId: id })
  }
  const [disputes, setDisputes] = useState<DisputeItem[]>(INITIAL_DISPUTES)
  const [currentActiveMonth, setCurrentActiveMonth] = useState<string>('Tháng 10/2026')
  const [periods, setPeriods] = useState<PeriodItem[]>(AVAILABLE_PERIODS)
  const [customPeriodScores, setCustomPeriodScores] = useState<Record<string, Record<string, number>>>({})
  const [currentActivePeriodId, _setCurrentActivePeriodId] = useState<string>('month-2026-10')
  const [customRules, setCustomRules] = useState<CustomRuleItem[]>(INITIAL_CUSTOM_RULES)

  const isHydratedRef = useRef(false)
  const deletedProposalIdsRef = useRef<Set<string>>(new Set())
  const deletedEventIdsRef = useRef<Set<string>>(new Set())
  const deletedPeriodIdsRef = useRef<Set<string>>(new Set())
  const deletedMemberCodesRef = useRef<Set<string>>(new Set())

  // Các Refs chống stale closure và đảm bảo Single Source of Truth
  const proposalsRef = useRef<ProposalItem[]>(proposals)
  proposalsRef.current = proposals

  const membersRef = useRef<RosterMember[]>(members)
  membersRef.current = members

  const eventsRef = useRef<MeetingEvent[]>(events)
  eventsRef.current = events

  const periodsRef = useRef<PeriodItem[]>(periods)
  periodsRef.current = periods

  const currentActivePeriodIdRef = useRef<string>(currentActivePeriodId)
  currentActivePeriodIdRef.current = currentActivePeriodId

  const customRulesRef = useRef<CustomRuleItem[]>(customRules)
  customRulesRef.current = customRules

  const customPeriodScoresRef = useRef<Record<string, Record<string, number>>>(customPeriodScores)
  customPeriodScoresRef.current = customPeriodScores

  const disputesRef = useRef<DisputeItem[]>(disputes)
  disputesRef.current = disputes

  // Đổi chu kỳ hoạt động và đồng bộ lập tức đa nền tảng
  const setCurrentActivePeriodId = (newId: string) => {
    _setCurrentActivePeriodId(newId)
    const target = periods.find((p) => p.id === newId)
    if (target?.name) {
      setCurrentActiveMonth(target.name)
    }
    const updated = periods.map((p) => ({
      ...p,
      isCurrent: p.id === newId,
    }))
    setPeriods(updated)
    try {
      localStorage.setItem('issac_active_period_id', newId)
      localStorage.setItem('issac_periods_clean_v1', JSON.stringify(updated))
    } catch (e) {}
    syncToCloud({ activePeriodId: newId, periods: updated })
  }

  // Safe client-side hydration from localStorage to prevent SSR mismatch
  useEffect(() => {
    // Dọn sạch triệt để toàn bộ dữ liệu demo cũ trong localStorage của trình duyệt
    const oldDemoKeys = [
      'issac_events_v4',
      'issac_events_v3',
      'issac_events_v2',
      'issac_events_v1',
      'issac_proposals_v1',
      'issac_members_v1',
      'issac_disputes_v1',
    ]
    oldDemoKeys.forEach((k) => {
      try {
        localStorage.removeItem(k)
      } catch (e) {}
    })

    try {
      const savedEvents = localStorage.getItem('issac_events_clean_v1')
      if (savedEvents) {
        setEvents(JSON.parse(savedEvents))
      }
    } catch (e) {
      console.error('Error reading events from localStorage:', e)
    }

    try {
      const savedActiveEventId = localStorage.getItem('issac_active_event_id')
      if (savedActiveEventId) {
        _setActiveEventId(savedActiveEventId)
      }
    } catch (e) {}

    try {
      const savedRules = localStorage.getItem('issac_custom_rules_v1')
      if (savedRules) {
        setCustomRules(JSON.parse(savedRules))
      }
    } catch (e) {
      console.error('Error reading custom rules from localStorage:', e)
    }

    try {
      const savedDeletedMemberCodes = localStorage.getItem('issac_deleted_member_codes')
      if (savedDeletedMemberCodes) {
        const parsed = JSON.parse(savedDeletedMemberCodes)
        if (Array.isArray(parsed)) {
          parsed.forEach((code: string) => deletedMemberCodesRef.current.add(code))
        }
      }
    } catch (e) {}

    try {
      const savedMembers = localStorage.getItem('issac_members_clean_v1')
      const savedProposals = localStorage.getItem('issac_proposals_clean_v1')
      let initialMemberList: RosterMember[] = savedMembers ? JSON.parse(savedMembers) : getActiveRosterMembers(INITIAL_MEMBERS)
      // Loại bỏ các thành viên đã xóa và nén/làm sạch avatar quá lớn
      initialMemberList = initialMemberList
        .filter((m) => !deletedMemberCodesRef.current.has(m.member_code))
        .map((m) => ({
          ...m,
          avatar_url: sanitizeMemberAvatar(m.avatar_url),
        }))
      let initialProposalList: ProposalItem[] = []
      if (savedProposals) {
        const parsed = JSON.parse(savedProposals)
        if (Array.isArray(parsed)) {
          initialProposalList = parsed.map((p: ProposalItem) => ({
            ...p,
            createdAt: normalizeHistoryTimestamp(p.createdAt),
          }))
          setProposals(initialProposalList)
          proposalsRef.current = initialProposalList
        }
      }
      const reconciled = reconcileMemberScores(initialMemberList, initialProposalList, currentActivePeriodId)
      membersRef.current = reconciled
      setMembers(reconciled)
    } catch (e) {
      console.error('Error reading members/proposals from localStorage:', e)
    }

    try {
      const savedDeleted = localStorage.getItem('issac_deleted_proposal_ids')
      if (savedDeleted) {
        const parsed = JSON.parse(savedDeleted)
        if (Array.isArray(parsed)) {
          parsed.forEach((id: string) => deletedProposalIdsRef.current.add(id))
        }
      }
    } catch (e) {}

    try {
      const savedDeletedEvents = localStorage.getItem('issac_deleted_event_ids')
      if (savedDeletedEvents) {
        const parsed = JSON.parse(savedDeletedEvents)
        if (Array.isArray(parsed)) {
          parsed.forEach((id: string) => deletedEventIdsRef.current.add(id))
        }
      }
    } catch (e) {}

    try {
      const savedDeletedPeriods = localStorage.getItem('issac_deleted_period_ids')
      if (savedDeletedPeriods) {
        const parsed = JSON.parse(savedDeletedPeriods)
        if (Array.isArray(parsed)) {
          parsed.forEach((id: string) => deletedPeriodIdsRef.current.add(id))
        }
      }
    } catch (e) {}

    try {
      const savedPeriods = localStorage.getItem('issac_periods_clean_v1')
      if (savedPeriods) {
        const parsed = JSON.parse(savedPeriods)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = parsed.filter((p: any) => p?.id && !deletedPeriodIdsRef.current.has(p.id))
          if (clean.length > 0) {
            setPeriods(clean)
          }
        }
      } else {
        const cleanAvailable = AVAILABLE_PERIODS.filter((p) => !deletedPeriodIdsRef.current.has(p.id))
        if (cleanAvailable.length > 0) {
          setPeriods(cleanAvailable)
        }
      }
    } catch (e) {
      console.error('Error reading periods from localStorage:', e)
    }

    try {
      const savedActivePeriod = localStorage.getItem('issac_active_period_id')
      if (savedActivePeriod) {
        _setCurrentActivePeriodId(savedActivePeriod)
        const savedPeriods = localStorage.getItem('issac_periods_clean_v1')
        const pList = savedPeriods ? JSON.parse(savedPeriods) : AVAILABLE_PERIODS
        const target = pList.find((p: any) => p.id === savedActivePeriod)
        if (target?.name) {
          setCurrentActiveMonth(target.name)
        }
      }
    } catch (e) {}

    try {
      const savedPeriodScores = localStorage.getItem('issac_custom_period_scores')
      if (savedPeriodScores) {
        setCustomPeriodScores(JSON.parse(savedPeriodScores))
      }
    } catch (e) {}

    isHydratedRef.current = true
    // Đồng bộ tức thì từ Supabase Cloud khi vừa tải trang
    fetchCloudSync()
  }, [])

  // Helper đồng bộ dữ liệu đa thiết bị qua Supabase Cloud API
  const syncToCloud = (payload: {
    events?: MeetingEvent[]
    activeEventId?: string
    proposals?: ProposalItem[]
    members?: RosterMember[]
    disputes?: DisputeItem[]
    periods?: PeriodItem[]
    activePeriodId?: string
    customPeriodScores?: Record<string, Record<string, number>>
    customRules?: CustomRuleItem[]
    deletedProposalIds?: string[]
    deletedEventIds?: string[]
    deletedPeriodIds?: string[]
    deletedMemberCodes?: string[]
    member?: RosterMember
    memberCode?: string
    action?: string
    [key: string]: any
  }) => {
    if (typeof window !== 'undefined') {
      fetch('/api/db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch((e) => console.error('Cloud sync notice:', e))
    }
  }

  // Đồng bộ đám mây Supabase (PC <-> Điện thoại) - Tích hợp Hợp Nhất 2 Chiều Chống Mất Dữ Liệu & Chống Lag
  const fetchCloudSync = async () => {
    try {
      const res = await fetch('/api/db/sync')
      if (res.ok) {
        const data = await res.json()

        // 1. Đồng bộ danh sách ID đề xuất đã xóa
        if (data.deletedProposalIds && Array.isArray(data.deletedProposalIds)) {
          data.deletedProposalIds.forEach((id: string) => deletedProposalIdsRef.current.add(id))
          try {
            localStorage.setItem(
              'issac_deleted_proposal_ids',
              JSON.stringify(Array.from(deletedProposalIdsRef.current))
            )
          } catch (e) {}
        }

        // 1.1 Đồng bộ danh sách ID sự kiện đã xóa
        if (data.deletedEventIds && Array.isArray(data.deletedEventIds)) {
          data.deletedEventIds.forEach((id: string) => deletedEventIdsRef.current.add(id))
          try {
            localStorage.setItem(
              'issac_deleted_event_ids',
              JSON.stringify(Array.from(deletedEventIdsRef.current))
            )
          } catch (e) {}
        }

        // 1.3 Đồng bộ danh sách ID chu kỳ đã xóa (Chống hồi sinh chu kỳ khi chuyển thiết bị)
        if (data.deletedPeriodIds && Array.isArray(data.deletedPeriodIds)) {
          data.deletedPeriodIds.forEach((id: string) => deletedPeriodIdsRef.current.add(id))
          try {
            localStorage.setItem(
              'issac_deleted_period_ids',
              JSON.stringify(Array.from(deletedPeriodIdsRef.current))
            )
          } catch (e) {}
        }

        // 1.2 Đồng bộ activeEventId từ cloud để máy tính và điện thoại chọn cùng 1 sự kiện
        if (data.activeEventId !== undefined && data.activeEventId !== '') {
          _setActiveEventId((prev) => {
            if (prev !== data.activeEventId) {
              try {
                localStorage.setItem('issac_active_event_id', data.activeEventId)
              } catch (e) {}
              return data.activeEventId
            }
            return prev
          })
        }

        // 2. Hợp nhất Sự kiện (Events) 2 chiều (Lọc bỏ sự kiện đã xóa)
        if (data.events && Array.isArray(data.events)) {
          const currentEvents = eventsRef.current
          const merged = mergeEvents(currentEvents, data.events, deletedEventIdsRef.current)
          if (JSON.stringify(merged) !== JSON.stringify(currentEvents)) {
            eventsRef.current = merged
            setEvents(merged)
            try {
              localStorage.setItem('issac_events_clean_v1', JSON.stringify(merged))
            } catch (e) {}
          }
        }

        // 3. Hợp nhất Proposals 2 chiều (Chống ghi đè mất dữ liệu điểm số từ proposalsRef)
        const currentLocalProps = proposalsRef.current
        let latestMergedProposals: ProposalItem[] = currentLocalProps
        if (data.proposals && Array.isArray(data.proposals)) {
          latestMergedProposals = mergeProposals(currentLocalProps, data.proposals, deletedProposalIdsRef.current)
          
          const isPropsChanged = JSON.stringify(latestMergedProposals) !== JSON.stringify(currentLocalProps)
          if (isPropsChanged) {
            proposalsRef.current = latestMergedProposals
            setProposals(latestMergedProposals)
            try {
              localStorage.setItem('issac_proposals_clean_v1', JSON.stringify(latestMergedProposals))
            } catch (e) {}
          }

          // Nếu local có bản ghi mà cloud chưa có, đẩy ngay bản hợp nhất lên cloud!
          const cloudIds = new Set(data.proposals.map((p: any) => p.id))
          const hasUnsynced = latestMergedProposals.some((p) => !cloudIds.has(p.id))
          if (hasUnsynced || latestMergedProposals.length > data.proposals.length) {
            syncToCloud({
              proposals: latestMergedProposals,
              deletedProposalIds: Array.from(deletedProposalIdsRef.current),
            })
          }
        }

        // 4. Hợp nhất Danh sách Thành viên & Điểm số (Khớp 100% giữa Mobile và Desktop, Chống nhảy lại dữ liệu)
        if (data.deletedMemberCodes && Array.isArray(data.deletedMemberCodes)) {
          data.deletedMemberCodes.forEach((code: string) => deletedMemberCodesRef.current.add(code))
          try {
            localStorage.setItem(
              'issac_deleted_member_codes',
              JSON.stringify(Array.from(deletedMemberCodesRef.current))
            )
          } catch (e) {}
        }

        if (data.members && Array.isArray(data.members) && data.members.length > 0) {
          const deletedCodes = deletedMemberCodesRef.current
          // Lọc bỏ thành viên đã xóa khỏi cloud list
          const safeCloudMembers = data.members.filter((m: any) => m?.member_code && !deletedCodes.has(m.member_code))

          const currentMembers = membersRef.current.filter((m) => !deletedCodes.has(m.member_code))
          const curMap = new Map(currentMembers.map((m) => [m.member_code, m]))
          let hasLocalNewer = false

          const merged = safeCloudMembers.map((cloudM: RosterMember) => {
            const cleanCloudM: RosterMember = {
              ...cloudM,
              avatar_url: sanitizeMemberAvatar(cloudM.avatar_url),
            }
            const localM = curMap.get(cleanCloudM.member_code)
            if (!localM) return cleanCloudM

            const localTime = localM.updated_at ? new Date(localM.updated_at).getTime() : 0
            const cloudTime = cleanCloudM.updated_at ? new Date(cleanCloudM.updated_at).getTime() : 0

            // Nếu local có cập nhật mới hơn cloud, bảo toàn tuyệt đối dữ liệu local!
            if (localTime > cloudTime) {
              hasLocalNewer = true
              return {
                ...cleanCloudM,
                ...localM,
                avatar_url: sanitizeMemberAvatar(localM.avatar_url) || cleanCloudM.avatar_url,
                current_score: cleanCloudM.current_score !== undefined ? cleanCloudM.current_score : (localM?.current_score ?? 60),
                absent_count_t02: cleanCloudM.absent_count_t02 !== undefined ? cleanCloudM.absent_count_t02 : (localM?.absent_count_t02 ?? 0),
              }
            } else {
              return {
                ...localM,
                ...cleanCloudM,
                avatar_url: cleanCloudM.avatar_url || sanitizeMemberAvatar(localM.avatar_url),
                current_score: cleanCloudM.current_score !== undefined ? cleanCloudM.current_score : (localM?.current_score ?? 60),
                absent_count_t02: cleanCloudM.absent_count_t02 !== undefined ? cleanCloudM.absent_count_t02 : (localM?.absent_count_t02 ?? 0),
              }
            }
          })

          // Giữ lại các thành viên mới tạo ở local mà cloud chưa kịp có (loại trừ đã xóa)
          const cloudCodes = new Set(safeCloudMembers.map((m: any) => m.member_code))
          const localOnlyMembers = currentMembers.filter((m) => !cloudCodes.has(m.member_code) && !deletedCodes.has(m.member_code))
          if (localOnlyMembers.length > 0) {
            merged.push(...localOnlyMembers.map((m) => ({
              ...m,
              avatar_url: sanitizeMemberAvatar(m.avatar_url),
            })))
            hasLocalNewer = true
          }

          // Tự động chuẩn hóa điểm số thực tế từ sổ cái proposals
          const reconciled = reconcileMemberScores(merged, latestMergedProposals, currentActivePeriodIdRef.current)
          const isMembersChanged = JSON.stringify(reconciled) !== JSON.stringify(currentMembers)
          if (isMembersChanged) {
            membersRef.current = reconciled
            setMembers(reconciled)
            try {
              localStorage.setItem('issac_members_clean_v1', JSON.stringify(reconciled))
            } catch (e) {}
          }

          // Đẩy ngay bản cập nhật mới nhất lên cloud nếu local có sửa đổi mới hơn
          if (hasLocalNewer) {
            syncToCloud({
              members: reconciled,
              deletedMemberCodes: Array.from(deletedCodes),
            })
          }
        } else if (!data.members || data.members.length === 0) {
          // Lưu 48 thành viên chuẩn lên Supabase Cloud lần đầu để sẵn sàng đồng bộ
          syncToCloud({
            members: membersRef.current,
            deletedMemberCodes: Array.from(deletedMemberCodesRef.current),
          })
        }

        if (data.disputes && Array.isArray(data.disputes)) {
          if (JSON.stringify(data.disputes) !== JSON.stringify(disputesRef.current)) {
            disputesRef.current = data.disputes
            setDisputes(data.disputes)
            try {
              localStorage.setItem('issac_disputes_clean_v1', JSON.stringify(data.disputes))
            } catch (e) {}
          }
        }

        if (data.periods !== undefined && Array.isArray(data.periods)) {
          if (JSON.stringify(data.periods) !== JSON.stringify(periodsRef.current)) {
            periodsRef.current = data.periods
            setPeriods(data.periods)
            try {
              localStorage.setItem('issac_periods_clean_v1', JSON.stringify(data.periods))
            } catch (e) {}
          }
        }

        if (data.activePeriodId && data.activePeriodId !== currentActivePeriodIdRef.current) {
          currentActivePeriodIdRef.current = data.activePeriodId
          _setCurrentActivePeriodId(data.activePeriodId)
          const allPeriods =
            data.periods && Array.isArray(data.periods)
              ? data.periods
              : periodsRef.current
          const found = allPeriods.find((p: any) => p.id === data.activePeriodId)
          if (found?.name) {
            setCurrentActiveMonth(found.name)
          }
          try {
            localStorage.setItem('issac_active_period_id', data.activePeriodId)
          } catch (e) {}
        }

        if (data.customPeriodScores) {
          if (JSON.stringify(data.customPeriodScores) !== JSON.stringify(customPeriodScoresRef.current)) {
            customPeriodScoresRef.current = data.customPeriodScores
            setCustomPeriodScores(data.customPeriodScores)
            try {
              localStorage.setItem('issac_custom_period_scores', JSON.stringify(data.customPeriodScores))
            } catch (e) {}
          }
        }

        if (data.customRules && Array.isArray(data.customRules)) {
          if (data.customRules.length === 0 && customRulesRef.current.length > 0) {
            syncToCloud({ customRules: customRulesRef.current })
          } else if (data.customRules.length > 0 && JSON.stringify(data.customRules) !== JSON.stringify(customRulesRef.current)) {
            customRulesRef.current = data.customRules
            setCustomRules(data.customRules)
            try {
              localStorage.setItem('issac_custom_rules_v1', JSON.stringify(data.customRules))
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      // Offline fallback
    }
  }

  // Polling định kỳ mượt mà, chống lag và tự động tạm dừng khi tab ẩn
  useEffect(() => {
    let isFetching = false
    const pollSync = async () => {
      if (isFetching || (typeof document !== 'undefined' && document.hidden)) return
      isFetching = true
      try {
        await fetchCloudSync()
      } finally {
        isFetching = false
      }
    }

    const timer = setInterval(pollSync, 12000)

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        pollSync()
      }
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    return () => {
      clearInterval(timer)
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [])

  // Auto-sync state changes to localStorage after initial hydration
  useEffect(() => {
    if (!isHydratedRef.current || typeof window === 'undefined') return
    try {
      localStorage.setItem('issac_members_clean_v1', JSON.stringify(members))
    } catch (e) {
      console.error('Error saving members:', e)
    }
  }, [members])

  useEffect(() => {
    if (!isHydratedRef.current || typeof window === 'undefined') return
    try {
      localStorage.setItem('issac_events_clean_v1', JSON.stringify(events))
    } catch (e) {
      console.error('Error saving events:', e)
    }
  }, [events])

  useEffect(() => {
    if (!isHydratedRef.current || typeof window === 'undefined') return
    try {
      localStorage.setItem('issac_proposals_clean_v1', JSON.stringify(proposals))
    } catch (e) {
      console.error('Error saving proposals:', e)
    }
  }, [proposals])

  useEffect(() => {
    if (!isHydratedRef.current || typeof window === 'undefined') return
    try {
      localStorage.setItem('issac_periods_clean_v1', JSON.stringify(periods))
    } catch (e) {}
  }, [periods])

  useEffect(() => {
    if (!isHydratedRef.current || typeof window === 'undefined') return
    try {
      localStorage.setItem('issac_active_period_id', currentActivePeriodId)
    } catch (e) {}
  }, [currentActivePeriodId])

  useEffect(() => {
    if (!isHydratedRef.current || typeof window === 'undefined') return
    try {
      localStorage.setItem('issac_custom_period_scores', JSON.stringify(customPeriodScores))
    } catch (e) {}
  }, [customPeriodScores])

  const addCustomRule = (rule: CustomRuleItem) => {
    const trimmedCode = rule.code.trim().toUpperCase()
    if (!trimmedCode) {
      return { success: false, message: 'Mã quy định không được để trống!' }
    }
    if (CRITERIA_RULES[trimmedCode as RuleCode]) {
      return { success: false, message: `Mã "${trimmedCode}" đã trùng với quy chế chuẩn của hệ thống!` }
    }
    if (customRules.some((r) => r.code.toUpperCase() === trimmedCode)) {
      return { success: false, message: `Mã "${trimmedCode}" đã tồn tại trong danh mục quy định bổ sung!` }
    }

    // Chuẩn hóa điểm số: Trừ luôn âm (-), Cộng luôn dương (+)
    let normalizedPoints: number | string = rule.points
    if (rule.type === 'deduct') {
      const num = typeof rule.points === 'number' ? rule.points : parseFloat(String(rule.points)) || 2
      normalizedPoints = -Math.abs(num)
    } else if (rule.type === 'add') {
      const num = typeof rule.points === 'number' ? rule.points : parseFloat(String(rule.points)) || 2
      normalizedPoints = Math.abs(num)
    }

    const newRule: CustomRuleItem = {
      ...rule,
      code: trimmedCode,
      points: normalizedPoints,
      createdAt: getVietnamNowDateFormatted(),
    }

    const updated = [...customRules, newRule]
    setCustomRules(updated)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('issac_custom_rules_v1', JSON.stringify(updated))
      } catch (e) {
        console.error('Error writing custom rules to localStorage:', e)
      }
    }

    // Đồng bộ tức thời lên Supabase Cloud để toàn bộ PC và Mobile đều nhận được tiêu chí mới
    syncToCloud({ customRules: updated })

    return {
      success: true,
      message: `Đã thêm thành công quy định "${newRule.code} - ${newRule.name}" vào hệ thống CLB!`,
    }
  }

  const deleteCustomRule = (code: string) => {
    const target = customRules.find((r) => r.code === code)
    if (!target) return { success: false, message: 'Không tìm thấy quy định cần xóa!' }

    const updated = customRules.filter((r) => r.code !== code)
    setCustomRules(updated)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('issac_custom_rules_v1', JSON.stringify(updated))
      } catch (e) {
        console.error('Error updating custom rules in localStorage:', e)
      }
    }

    syncToCloud({ customRules: updated })

    return {
      success: true,
      message: `Đã xóa quy định "${code}" khỏi danh mục CLB.`,
    }
  }

  const activeEvent =
    events.find((e) => e.id === activeEventId) ||
    events.find((e) => !e.isFinalized) ||
    events[0] ||
    null

  // Ban Chủ nhiệm thêm thành viên mới
  const addMember = (data: {
    fullName: string
    departmentCode: DepartmentCode
    position: string
    studentId?: string
    phone?: string
    email: string
    isCore: boolean
    className?: string
    avatarUrl?: string
  }) => {
    const deptSlugMap: Record<DepartmentCode, { name: string; slug: DepartmentSlug }> = {
      B04: { name: 'Ban Chủ nhiệm', slug: 'bcn' },
      B01: { name: 'Ban Truyền thông', slug: 'truyen-thong' },
      B02: { name: 'Ban Tư vấn', slug: 'tu-van' },
      B03: { name: 'Ban Nhân sự', slug: 'nhan-su' },
    }

    const deptInfo = deptSlugMap[data.departmentCode]
    const nextStt = members.length + 1
    const generatedCode = data.studentId ? data.studentId.trim() : `STAFF-00${nextStt}`
    const nowIso = new Date().toISOString()

    const cleanAvatar = sanitizeMemberAvatar(data.avatarUrl?.trim())
    const newMember: RosterMember = {
      source_stt: nextStt,
      member_code: generatedCode,
      full_name: data.fullName.trim(),
      department_name: deptInfo.name,
      department_code: data.departmentCode,
      department_slug: deptInfo.slug,
      position: data.position.trim(),
      is_core: data.isCore,
      student_id: data.studentId?.trim() || undefined,
      class_name: data.className?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      email: data.email.trim(),
      current_score: 60,
      absent_count_t02: 0,
      avatar_url: cleanAvatar || undefined,
      updated_at: nowIso,
    }

    // Gỡ khỏi deletedMemberCodes nếu trước đó từng bị đánh dấu xóa
    deletedMemberCodesRef.current.delete(generatedCode)
    try {
      localStorage.setItem('issac_deleted_member_codes', JSON.stringify(Array.from(deletedMemberCodesRef.current)))
    } catch (e) {}

    const currentList = (membersRef.current.length > 0 ? membersRef.current : members).filter(
      (m) => m.member_code !== generatedCode && !deletedMemberCodesRef.current.has(m.member_code)
    )
    const updated = getRankedMembers([...currentList, newMember])
    membersRef.current = updated
    setMembers(updated)
    try {
      localStorage.setItem('issac_members_clean_v1', JSON.stringify(updated))
    } catch (e) {
      console.error('Error saving members to localStorage:', e)
    }
    syncToCloud({
      action: 'add_member',
      member: newMember,
      members: updated,
      deletedMemberCodes: Array.from(deletedMemberCodesRef.current),
    })
  }

  // Cập nhật thông tin thành viên & ảnh đại diện Avatar
  const updateMember = (
    memberCode: string,
    updates: Partial<RosterMember>
  ): { success: boolean; message: string } => {
    const deptSlugMap: Record<DepartmentCode, { name: string; slug: DepartmentSlug }> = {
      B04: { name: 'Ban Chủ nhiệm', slug: 'bcn' },
      B01: { name: 'Ban Truyền thông', slug: 'truyen-thong' },
      B02: { name: 'Ban Tư vấn', slug: 'tu-van' },
      B03: { name: 'Ban Nhân sự', slug: 'nhan-su' },
    }

    const currentList = membersRef.current.length > 0 ? membersRef.current : members
    let found = false
    const nowIso = new Date().toISOString()

    const updatedList = currentList.map((m) => {
      if (m.member_code === memberCode) {
        found = true
        let deptName = m.department_name
        let deptSlug = m.department_slug

        if (updates.department_code && deptSlugMap[updates.department_code]) {
          deptName = deptSlugMap[updates.department_code].name
          deptSlug = deptSlugMap[updates.department_code].slug
        }

        const cleanAvatar = updates.avatar_url !== undefined ? sanitizeMemberAvatar(updates.avatar_url) : m.avatar_url

        return {
          ...m,
          ...updates,
          avatar_url: cleanAvatar,
          department_name: deptName,
          department_slug: deptSlug,
          updated_at: nowIso,
        }
      }
      return m
    })

    if (!found) {
      return { success: false, message: `Không tìm thấy thành viên: ${memberCode}` }
    }

    const reRanked = getRankedMembers(updatedList)
    membersRef.current = reRanked
    setMembers(reRanked)
    try {
      localStorage.setItem('issac_members_clean_v1', JSON.stringify(reRanked))
    } catch (e) {
      console.error('Error saving updated members to localStorage:', e)
    }
    syncToCloud({
      members: reRanked,
      deletedMemberCodes: Array.from(deletedMemberCodesRef.current),
    })

    return { success: true, message: 'Đã cập nhật thông tin thành viên thành công!' }
  }

  // Xóa thành viên
  const deleteMember = (
    memberCode: string
  ): { success: boolean; message: string } => {
    const currentList = membersRef.current.length > 0 ? membersRef.current : members
    const target = currentList.find((m) => m.member_code === memberCode)
    if (!target) return { success: false, message: 'Không tìm thấy thành viên để xóa' }

    deletedMemberCodesRef.current.add(memberCode)
    try {
      localStorage.setItem('issac_deleted_member_codes', JSON.stringify(Array.from(deletedMemberCodesRef.current)))
    } catch (e) {}

    const updated = currentList.filter((m) => m.member_code !== memberCode)
    const reRanked = getRankedMembers(updated)
    membersRef.current = reRanked
    setMembers(reRanked)
    try {
      localStorage.setItem('issac_members_clean_v1', JSON.stringify(reRanked))
    } catch (e) {
      console.error('Error saving members after deletion:', e)
    }
    syncToCloud({
      action: 'delete_member',
      memberCode,
      members: reRanked,
      deletedMemberCodes: Array.from(deletedMemberCodesRef.current),
    })
    return { success: true, message: `Đã xóa thành viên ${target.full_name} khỏi hệ thống.` }
  }

  // Tạo đề xuất (hoặc BCN áp dụng trực tiếp) cho chu kỳ tháng được chọn
  const createProposal = (data: {
    memberCode: string
    criterionCode: string
    customPoints?: number
    reason: string
    evidenceUrl?: string
    proposerName: string
    proposerRole: string
    proposerDepartmentCode?: string
    directApply?: boolean
    periodId?: string
  }) => {
    const target = members.find((m) => m.member_code === data.memberCode)
    if (!target) return { success: false, message: 'Không tìm thấy thành viên' }

    // KIỂM TRA PHÂN QUYỀN CHO ĐIỂM THEO BAN:
    // 1. Ban Truyền thông (B01): Chỉ cho điểm thành viên Ban Truyền thông
    if (data.proposerDepartmentCode === 'B01') {
      if (target.department_code !== 'B01' && target.department_slug !== 'truyen-thong') {
        return {
          success: false,
          message: 'Cán bộ Ban Truyền thông chỉ có quyền cho điểm thành viên thuộc Ban Truyền thông!',
        }
      }
    }
    // 2. Ban Tư vấn (B02): Chỉ cho điểm thành viên Ban Tư vấn
    if (data.proposerDepartmentCode === 'B02') {
      if (target.department_code !== 'B02' && target.department_slug !== 'tu-van') {
        return {
          success: false,
          message: 'Cán bộ Ban Tư vấn chỉ có quyền cho điểm thành viên thuộc Ban Tư vấn!',
        }
      }
    }
    // 3. Ban Nhân sự (B03) & Ban Chủ nhiệm (B04): Có quyền cho điểm mọi người tất cả các ban

    // Xác định chu kỳ mục tiêu
    const targetPeriodId = data.periodId || currentActivePeriodId
    const targetPeriod = periods.find((p) => p.id === targetPeriodId) || periods[0]

    // KIỂM TRA KHÓA SỔ: Nếu chu kỳ đã được BCN khóa sổ thì KHÔNG cho phép chấm điểm!
    if (targetPeriod.status === 'locked') {
      return {
        success: false,
        message: `Chu kỳ "${targetPeriod.name}" đã được Ban Chủ nhiệm KHÓA SỔ ĐIỂM (${targetPeriod.lockedBy || 'BCN'}). Mọi hoạt động chấm điểm đã đóng băng để bảo đảm tính công bằng tuyệt đối!`,
      }
    }

    const builtinRule = CRITERIA_RULES[data.criterionCode as RuleCode]
    const customRule = customRules.find((r) => r.code === data.criterionCode)

    let ruleName = data.criterionCode
    let actualDelta = 0
    let scoreAfter = target.current_score

    // ĐIỂM TỰ CHO (Tùy chỉnh số điểm không bắt buộc theo mặc định)
    if (typeof data.customPoints === 'number' && !isNaN(data.customPoints)) {
      actualDelta = data.customPoints
      scoreAfter = Math.max(0, Math.min(100, target.current_score + actualDelta))
      if (builtinRule) {
        ruleName = `${builtinRule.name} (Tự cho: ${actualDelta > 0 ? `+${actualDelta}` : actualDelta}đ)`
      } else if (customRule) {
        ruleName = `${customRule.name} (Tự cho: ${actualDelta > 0 ? `+${actualDelta}` : actualDelta}đ)`
      } else {
        ruleName = `Điểm tự cho (${actualDelta > 0 ? `+${actualDelta}` : actualDelta}đ)`
      }
    } else if (builtinRule) {
      ruleName = builtinRule.name
      const calc = calculateScoreDelta({
        ruleCode: data.criterionCode as RuleCode,
        basePoints: builtinRule.base_points,
        isCoreAtEvent: target.is_core,
        currentScore: target.current_score,
      })
      actualDelta = calc.actualDelta
      scoreAfter = calc.scoreAfter
    } else if (customRule) {
      ruleName = customRule.name
      const basePts =
        typeof customRule.points === 'number'
          ? customRule.points
          : parseFloat(String(customRule.points)) || 0
      const isCoreMultiplier = !!customRule.coreMultiplierApplies && basePts < 0
      const multiplier = target.is_core && isCoreMultiplier ? 2 : 1
      const nominal = basePts * multiplier
      scoreAfter = Math.max(0, Math.min(100, target.current_score + nominal))
      actualDelta = scoreAfter - target.current_score
    }

    // Nếu Ban Chủ nhiệm chọn áp dụng trực tiếp:
    if (data.directApply) {
      // Thêm bản ghi với trạng thái approved
      const record: ProposalItem = {
        id: `prop-${Date.now()}`,
        memberCode: target.member_code,
        memberName: target.full_name,
        memberDept: target.department_name,
        isCore: target.is_core,
        criterionCode: data.criterionCode,
        criterionName: ruleName,
        points: actualDelta,
        reason: data.reason,
        evidenceUrl: data.evidenceUrl,
        proposedBy: `${data.proposerName} (Duyệt trực tiếp)`,
        proposedByRole: data.proposerRole,
        status: 'approved',
        createdAt: getVietnamNowFormatted(),
        periodId: targetPeriod.id,
        periodName: targetPeriod.name,
      }
      const updatedProps = [record, ...proposalsRef.current]
      proposalsRef.current = updatedProps
      setProposals(updatedProps)

      let updatedMembers = membersRef.current
      const isCurrentActive =
        targetPeriodId === currentActivePeriodIdRef.current ||
        Boolean(periodsRef.current.find((p) => p.id === targetPeriodId)?.isCurrent)
      if (isCurrentActive) {
        updatedMembers = reconcileMemberScores(membersRef.current, updatedProps, targetPeriod.id)
        membersRef.current = updatedMembers
        setMembers(updatedMembers)
      }

      // 2. Ghi nhận delta vào sổ cái customPeriodScores cho chu kỳ này
      setCustomPeriodScores((prev) => {
        const periodMap = prev[targetPeriodId] || {}
        const curDelta = periodMap[target.member_code] || 0
        return {
          ...prev,
          [targetPeriodId]: {
            ...periodMap,
            [target.member_code]: curDelta + actualDelta,
          },
        }
      })

      try {
        localStorage.setItem('issac_proposals_clean_v1', JSON.stringify(updatedProps))
        if (isCurrentActive) {
          localStorage.setItem('issac_members_clean_v1', JSON.stringify(updatedMembers))
        }
      } catch (e) {}
      syncToCloud({
        proposals: updatedProps,
        ...(isCurrentActive ? { members: updatedMembers } : {}),
      })

      return {
        success: true,
        message: `Đã cập nhật trực tiếp điểm cho ${target.full_name} (${targetPeriod.name}): ${actualDelta > 0 ? `+${actualDelta}` : actualDelta} điểm.`,
      }
    }

    // Ban Nhân sự hoặc Trưởng ban đề xuất -> chờ BCN duyệt
    const newProp: ProposalItem = {
      id: `prop-${Date.now()}`,
      memberCode: target.member_code,
      memberName: target.full_name,
      memberDept: target.department_name,
      isCore: target.is_core,
      criterionCode: data.criterionCode,
      criterionName: ruleName,
      points: actualDelta,
      reason: data.reason,
      evidenceUrl: data.evidenceUrl,
      proposedBy: data.proposerName,
      proposedByRole: data.proposerRole,
      status: 'pending_bcn',
      createdAt: getVietnamNowFormatted(),
      periodId: targetPeriod.id,
      periodName: targetPeriod.name,
    }
    const updatedProps = [newProp, ...proposalsRef.current]
    proposalsRef.current = updatedProps
    setProposals(updatedProps)
    try {
      localStorage.setItem('issac_proposals_clean_v1', JSON.stringify(updatedProps))
    } catch (e) {}
    syncToCloud({ proposals: updatedProps })

    return {
      success: true,
      message: `Đã gửi đề xuất điểm cho ${target.full_name} trong ${targetPeriod.name} (${actualDelta > 0 ? `+${actualDelta}` : actualDelta} đ). Đang chờ Ban Chủ nhiệm phê duyệt.`,
    }
  }

  // Ban Chủ nhiệm duyệt đề xuất
  const approveProposal = (proposalId: string) => {
    const currentProps = proposalsRef.current
    const prop = currentProps.find((p) => p.id === proposalId)
    if (!prop || prop.status !== 'pending_bcn') return

    const targetPeriodId = prop.periodId || currentActivePeriodIdRef.current || 'month-2026-10'
    const targetPeriod = periodsRef.current.find((p) => p.id === targetPeriodId)
    if (targetPeriod?.status === 'locked') {
      alert(`Chu kỳ "${targetPeriod.name}" đã được Ban Chủ nhiệm KHÓA SỔ. Không thể duyệt điểm!`)
      return
    }

    // Đánh dấu approved và cập nhật mốc thời gian duyệt chuẩn giờ Việt Nam
    const updatedProps = currentProps.map((p) =>
      p.id === proposalId
        ? {
            ...p,
            status: 'approved' as const,
            reviewedAt: getVietnamNowFormatted(),
            createdAt: normalizeHistoryTimestamp(p.createdAt),
          }
        : p
    )
    proposalsRef.current = updatedProps
    setProposals(updatedProps)

    let updatedMembers = membersRef.current
    const isCurrentActive =
      targetPeriodId === currentActivePeriodIdRef.current ||
      Boolean(periodsRef.current.find((p) => p.id === targetPeriodId)?.isCurrent)
    // Cập nhật điểm thành viên nếu là chu kỳ đang hoạt động
    if (isCurrentActive) {
      updatedMembers = reconcileMemberScores(membersRef.current, updatedProps, targetPeriodId)
      membersRef.current = updatedMembers
      setMembers(updatedMembers)
    }

    // Ghi nhận delta vào customPeriodScores cho chu kỳ này
    setCustomPeriodScores((prev) => {
      const periodMap = prev[targetPeriodId] || {}
      const curDelta = periodMap[prop.memberCode] || 0
      return {
        ...prev,
        [targetPeriodId]: {
          ...periodMap,
          [prop.memberCode]: curDelta + prop.points,
        },
      }
    })
    try {
      localStorage.setItem('issac_proposals_clean_v1', JSON.stringify(updatedProps))
      if (isCurrentActive) {
        localStorage.setItem('issac_members_clean_v1', JSON.stringify(updatedMembers))
      }
    } catch (e) {}
    syncToCloud({
      proposals: updatedProps,
      ...(isCurrentActive ? { members: updatedMembers } : {}),
    })
  }

  // Ban Chủ nhiệm từ chối đề xuất
  const rejectProposal = (proposalId: string) => {
    const currentProps = proposalsRef.current
    const updatedProps = currentProps.map((p) =>
      p.id === proposalId ? { ...p, status: 'rejected' as const } : p
    )
    proposalsRef.current = updatedProps
    setProposals(updatedProps)
    try {
      localStorage.setItem('issac_proposals_clean_v1', JSON.stringify(updatedProps))
    } catch (e) {}
    syncToCloud({ proposals: updatedProps })
  }

  // Ban Chủ nhiệm chỉnh sửa trực tiếp 1 bản ghi điểm (nếu phát hiện cộng/trừ điểm nhầm)
  const updateProposal = (
    proposalId: string,
    updatedData: { points?: number; reason?: string; criterionCode?: string },
    actorName: string
  ) => {
    const currentProps = proposalsRef.current
    const prop = currentProps.find((p) => p.id === proposalId)
    if (!prop) return { success: false, message: 'Bản ghi điểm không tồn tại' }

    const oldPoints = prop.points
    const newPoints = updatedData.points !== undefined ? updatedData.points : oldPoints
    const delta = newPoints - oldPoints

    const targetPeriodId = prop.periodId || currentActivePeriodIdRef.current || 'month-2026-10'
    const targetPeriod = periodsRef.current.find((p) => p.id === targetPeriodId)
    if (targetPeriod?.status === 'locked') {
      return { success: false, message: `Chu kỳ "${targetPeriod.name}" đã khóa sổ, không thể điều chỉnh điểm!` }
    }

    const updatedProps = currentProps.map((p) => {
      if (p.id !== proposalId) return p

      let newCriterionName = p.criterionName
      if (updatedData.criterionCode && CRITERIA_RULES[updatedData.criterionCode as RuleCode]) {
        newCriterionName = CRITERIA_RULES[updatedData.criterionCode as RuleCode].name
      }

      return {
        ...p,
        points: newPoints,
        reason: updatedData.reason !== undefined ? updatedData.reason : p.reason,
        criterionCode: updatedData.criterionCode || p.criterionCode,
        criterionName: newCriterionName,
        proposedBy: p.proposedBy.includes('(Đã chỉnh sửa')
          ? p.proposedBy
          : `${p.proposedBy} (BCN ${actorName} sửa)`,
      }
    })

    proposalsRef.current = updatedProps
    setProposals(updatedProps)

    let updatedMembers = membersRef.current
    const isCurrentActive =
      targetPeriodId === currentActivePeriodIdRef.current ||
      Boolean(periodsRef.current.find((p) => p.id === targetPeriodId)?.isCurrent)

    if (isCurrentActive) {
      updatedMembers = reconcileMemberScores(membersRef.current, updatedProps, targetPeriodId)
      membersRef.current = updatedMembers
      setMembers(updatedMembers)
    }

    // Cập nhật period scores delta nếu có
    if (prop.status === 'approved' && delta !== 0) {
      setCustomPeriodScores((prev) => {
        const periodMap = prev[targetPeriodId] || {}
        const curDelta = periodMap[prop.memberCode] || 0
        return {
          ...prev,
          [targetPeriodId]: {
            ...periodMap,
            [prop.memberCode]: curDelta + delta,
          },
        }
      })
    }
    try {
      localStorage.setItem('issac_proposals_clean_v1', JSON.stringify(updatedProps))
      if (isCurrentActive) {
        localStorage.setItem('issac_members_clean_v1', JSON.stringify(updatedMembers))
      }
    } catch (e) {}

    syncToCloud({
      proposals: updatedProps,
      ...(isCurrentActive ? { members: updatedMembers } : {}),
    })

    return {
      success: true,
      message: `Đã cập nhật bản ghi thành công! Điểm của ${prop.memberName} được điều chỉnh ${delta >= 0 ? `+${delta}` : delta}đ (từ ${oldPoints}đ thành ${newPoints}đ).`,
    }
  }

  // Ban Chủ nhiệm xóa / hoàn tác 1 bản ghi điểm nhầm
  const deleteProposal = (proposalId: string, actorName: string) => {
    const currentProps = proposalsRef.current
    const prop = currentProps.find((p) => p.id === proposalId)
    if (!prop) return { success: false, message: 'Bản ghi điểm không tồn tại' }

    const targetPeriodId = prop.periodId || currentActivePeriodIdRef.current || 'month-2026-10'
    const targetPeriod = periodsRef.current.find((p) => p.id === targetPeriodId)
    if (targetPeriod?.status === 'locked') {
      return { success: false, message: `Chu kỳ "${targetPeriod.name}" đã khóa sổ, không thể xóa bản ghi!` }
    }

    const updatedProps = currentProps.filter((p) => p.id !== proposalId)
    proposalsRef.current = updatedProps
    setProposals(updatedProps)

    let updatedMembers = membersRef.current
    const isCurrentActive =
      targetPeriodId === currentActivePeriodIdRef.current ||
      Boolean(periodsRef.current.find((p) => p.id === targetPeriodId)?.isCurrent)

    if (isCurrentActive) {
      updatedMembers = reconcileMemberScores(membersRef.current, updatedProps, targetPeriodId)
      membersRef.current = updatedMembers
      setMembers(updatedMembers)
    }

    // Hoàn tác trong customPeriodScores
    if (prop.status === 'approved') {
      setCustomPeriodScores((prev) => {
        const periodMap = prev[targetPeriodId] || {}
        const curDelta = periodMap[prop.memberCode] || 0
        return {
          ...prev,
          [targetPeriodId]: {
            ...periodMap,
            [prop.memberCode]: curDelta - prop.points,
          },
        }
      })
    }

    deletedProposalIdsRef.current.add(proposalId)
    try {
      localStorage.setItem('issac_proposals_clean_v1', JSON.stringify(updatedProps))
      localStorage.setItem(
        'issac_deleted_proposal_ids',
        JSON.stringify(Array.from(deletedProposalIdsRef.current))
      )
      if (isCurrentActive) {
        localStorage.setItem('issac_members_clean_v1', JSON.stringify(updatedMembers))
      }
    } catch (e) {}

    syncToCloud({
      action: 'delete_proposal',
      proposalId,
      deletedProposalIds: Array.from(deletedProposalIdsRef.current),
      proposals: updatedProps,
      ...(isCurrentActive ? { members: updatedMembers } : {}),
    })

    return {
      success: true,
      message: `Đã xóa bản ghi điểm khỏi sổ cái! Điểm của ${prop.memberName} đã được hoàn tác ${prop.points > 0 ? `-${prop.points}` : `+${Math.abs(prop.points)}`} điểm thành công.`,
    }
  }

  // Cập nhật trạng thái check-in của 1 thành viên trong buổi họp
  const updateCheckinRecord = (
    eventId: string,
    memberCode: string,
    status: CheckinStatus,
    note?: string
  ) => {
    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id !== eventId) return evt

        const existing = evt.records[memberCode] || { memberCode, status: 'unexcused' }
        const updatedRecord: CheckinRecord = {
          ...existing,
          status,
          note: note !== undefined ? note : existing.note,
          checkinTime:
            status === 'present_on_time' || status === 'late'
              ? existing.checkinTime || '19:35'
              : undefined,
        }

        return {
          ...evt,
          records: {
            ...evt.records,
            [memberCode]: updatedRecord,
          },
        }
      })
    )

    if (typeof window !== 'undefined') {
      fetch('/api/db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkin', eventId, memberCode, status, note }),
      }).catch((e) => console.error('Cloud sync error on checkin:', e))
    }
  }

  // Thành viên tự check-in qua cổng Kiosk hoặc Mobile (Tích hợp cơ chế Chống Điểm Danh Hộ)
  const memberSelfCheckin = (
    eventId: string,
    memberCode: string,
    pinCode: string,
    phoneLastDigits?: string,
    mode?: 'personal' | 'kiosk'
  ): { success: boolean; message: string; status?: CheckinStatus } => {
    const evt = events.find((e) => e.id === eventId)
    if (!evt) return { success: false, message: 'Buổi họp không tồn tại!' }
    if (evt.isFinalized) {
      return { success: false, message: 'Buổi họp đã kết thúc và chốt sổ điểm danh!' }
    }
    if (evt.pinCode !== pinCode.trim()) {
      return { success: false, message: 'Mã PIN điểm danh không chính xác! Vui lòng kiểm tra trên máy chiếu.' }
    }

    const member = members.find((m) => m.member_code === memberCode)
    if (!member) {
      return { success: false, message: 'Mã thành viên không tồn tại trong danh sách CLB!' }
    }

    // Kiểm tra đã điểm danh trước đó chưa (Chống ghi đè / bấm lặp)
    const existing = evt.records[memberCode]
    if (existing && (existing.status === 'present_on_time' || existing.status === 'late')) {
      const statusLabel = existing.status === 'present_on_time' ? 'Đúng giờ' : 'Đến muộn'
      return {
        success: false,
        message: `Thành viên "${member.full_name}" đã được ghi nhận có mặt trong sự kiện này rồi (Trạng thái: ${statusLabel}). Không cần điểm danh lại!`,
      }
    }

    // Xác thực 4 số cuối số điện thoại cá nhân (Chống điểm danh hộ)
    if (phoneLastDigits && phoneLastDigits.trim() !== '') {
      const cleanInput = phoneLastDigits.trim()
      const memberPhone = (member.phone || '').replace(/\D/g, '')
      const expectedDigits = memberPhone.slice(-4)
      if (expectedDigits && cleanInput !== expectedDigits) {
        return {
          success: false,
          message: `Xác thực cá nhân thất bại! 4 số cuối SĐT (${cleanInput}) không khớp với hồ sơ CLB của "${member.full_name}". Vui lòng kiểm tra lại để tránh điểm danh nhầm/hộ!`,
        }
      }
    }

    // Thời gian hiện tại giả lập: nếu quá 19:45 -> late, ngược lại -> on_time
    const currentStatus: CheckinStatus = 'present_on_time'
    const isRegistered = evt.registeredMemberCodes?.includes(memberCode)
    const bonus = evt.pointBonus !== undefined ? evt.pointBonus : 1
    const requiresRegistration = evt.allowRegistration !== false
    const canReceivePoints = !requiresRegistration || isRegistered

    const regBadge = isRegistered
      ? ' [🎟️ Đã đăng ký trước]'
      : ' [⚠️ Chưa ĐK trước - Không tính điểm]'
    const modeBadge = mode === 'kiosk' ? ' [Kiosk Lễ tân]' : ' [Thiết bị cá nhân]'

    updateCheckinRecord(
      eventId,
      memberCode,
      currentStatus,
      `Tự điểm danh${modeBadge}${regBadge}`
    )

    return {
      success: true,
      status: currentStatus,
      message: canReceivePoints
        ? `Điểm danh thành công cho ${member.full_name}! Trạng thái: Đã đăng ký trước. Ghi nhận: ĐÚNG GIỜ (+${bonus} điểm sau khi chốt buổi).`
        : `Điểm danh thành công cho ${member.full_name}! Lưu ý quy chế: Do bạn KHÔNG ĐĂNG KÝ TRƯỚC nên hệ thống chỉ ghi nhận có mặt, KHÔNG ĐƯỢC CỘNG ĐIỂM THI ĐUA.`,
    }
  }

  // Ban Chủ nhiệm bấm chốt buổi họp & tự động áp dụng điểm C07/T04/T01/T02
  const finalizeEvent = (
    eventId: string,
    finalizedByName: string
  ) => {
    const evt = events.find((e) => e.id === eventId)
    if (!evt) return { success: false, message: 'Buổi họp không tồn tại' }
    if (evt.isFinalized) return { success: false, message: 'Buổi họp này đã được chốt trước đó!' }

    let present = 0
    let late = 0
    let excused = 0
    let unexcused = 0
    let totalApplied = 0

    const newLedgerRecords: ProposalItem[] = []
    const nowStr = getVietnamNowFormatted()

    // Duyệt qua từng thành viên để tính điểm chuẩn quy chế iSSAC
    const updatedMembers = members.map((m) => {
      const rec = evt.records[m.member_code] || {
        memberCode: m.member_code,
        status: 'unexcused',
      }

      // Nếu là sự kiện không bắt buộc (isRequired === false), người không tham gia (unexcused hoặc không có record) thì không bị phạt điểm
      if (!evt.isRequired && (rec.status === 'unexcused' || !evt.records[m.member_code])) {
        return m
      }

      let criterion: RuleCode
      let reason: string
      let change = 0

      // Quy chế: Chỉ thành viên ĐÃ ĐĂNG KÝ TRƯỚC mới được cộng điểm khi check-in đúng giờ.
      // Dù check-in đúng giờ nhưng không đăng ký trước thì KHÔNG tính điểm (0 điểm).
      const isRegistered = evt.registeredMemberCodes?.includes(m.member_code)
      const requiresRegistration = evt.allowRegistration !== false
      const canReceivePoints = !requiresRegistration || isRegistered

      switch (rec.status) {
        case 'present_on_time':
          criterion = 'C07'
          reason = canReceivePoints
            ? `Tham gia họp/sự kiện CLB đúng giờ (${evt.title}) [Đã ĐK trước]`
            : `Tham gia sự kiện đúng giờ nhưng KHÔNG ĐĂNG KÝ TRƯỚC (${evt.title}) - Không tính điểm theo quy chế`
          present++
          break
        case 'late':
          criterion = 'T04'
          reason = `Đi muộn >15 phút buổi họp CLB (${evt.title})`
          late++
          break
        case 'excused':
          criterion = 'T01'
          reason = `Vắng họp CLB có phép hợp lệ (${evt.title}): ${rec.note || 'Có đơn xin phép'}`
          excused++
          break
        case 'unexcused':
        default:
          criterion = 'T02'
          reason = `Vắng họp CLB không phép (${evt.title})`
          unexcused++
          break
      }

      const rule = CRITERIA_RULES[criterion]
      let calc = { actualDelta: 0, scoreAfter: m.current_score }

      // Nếu check-in đúng giờ nhưng không đăng ký trước: Không tính điểm (change = 0)
      if (rec.status === 'present_on_time' && !canReceivePoints) {
        change = 0
        calc = { actualDelta: 0, scoreAfter: m.current_score }
      } else {
        const basePts =
          rec.status === 'present_on_time' && evt.pointBonus !== undefined && evt.pointBonus > 0
            ? evt.pointBonus
            : rule.base_points

        calc = calculateScoreDelta({
          ruleCode: criterion,
          basePoints: basePts,
          isCoreAtEvent: m.is_core,
          currentScore: m.current_score,
        })

        change = calc.actualDelta
      }

      totalApplied++

      // Lưu lại bản ghi điểm đã duyệt
      newLedgerRecords.push({
        id: `checkin-${evt.id}-${m.member_code}`,
        memberCode: m.member_code,
        memberName: m.full_name,
        memberDept: m.department_name,
        isCore: m.is_core,
        criterionCode: criterion,
        criterionName: rec.status === 'present_on_time' && !canReceivePoints ? `${rule.name} (Chưa ĐK trước: 0đ)` : rule.name,
        points: change,
        reason,
        proposedBy: `${finalizedByName} (Chốt điểm danh)`,
        proposedByRole: 'bcn',
        status: 'approved',
        createdAt: nowStr,
        periodId: evt.periodId || currentActivePeriodId || 'month-2026-10',
        periodName: currentActiveMonth || 'Tháng 10/2026',
      })

      const newT02Count = criterion === 'T02' ? m.absent_count_t02 + 1 : m.absent_count_t02

      return {
        ...m,
        current_score: calc.scoreAfter,
        absent_count_t02: newT02Count,
      }
    })

    // Cập nhật danh sách thành viên với bảng xếp hạng mới
    const rankedMembers = getRankedMembers(updatedMembers)
    membersRef.current = rankedMembers
    setMembers(rankedMembers)

    // Thêm các bản ghi mới vào sổ cái và deduplicate theo id
    const currentProps = proposalsRef.current
    const combinedProposals = [
      ...newLedgerRecords,
      ...currentProps.filter((p) => !newLedgerRecords.some((r) => r.id === p.id)),
    ]
    proposalsRef.current = combinedProposals
    setProposals(combinedProposals)
    try {
      localStorage.setItem('issac_proposals_clean_v1', JSON.stringify(combinedProposals))
      localStorage.setItem('issac_members_clean_v1', JSON.stringify(rankedMembers))
    } catch (e) {}

    // Đánh dấu buổi họp đã chốt
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              isFinalized: true,
              finalizedAt: getVietnamNowFormatted(),
              finalizedBy: finalizedByName,
            }
          : e
      )
    )

    const result = {
      success: true,
      message: `Đã chốt sổ điểm danh và tự động cập nhật điểm cho ${totalApplied} thành viên Câu Lạc bộ Đại sứ sinh viên Trường Quốc tế!`,
      summary: {
        present,
        late,
        excused,
        unexcused,
        totalApplied,
      },
    }

    if (typeof window !== 'undefined') {
      fetch('/api/db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'finalize',
          eventId,
          finalizedBy: finalizedByName,
          proposals: combinedProposals,
          members: getRankedMembers(updatedMembers),
        }),
      }).catch((e) => console.error('Cloud sync error on finalize:', e))
    }

    return result
  }

  // Thành viên nộp đơn khiếu nại điểm (Q06)
  const createDispute = (data: {
    memberCode: string
    criterionCode: string
    pointsContested: number
    reason: string
    evidenceUrl?: string
  }) => {
    const member = members.find((m) => m.member_code === data.memberCode)
    if (!member) return { success: false, message: 'Thành viên không tồn tại' }

    const newDisp: DisputeItem = {
      id: `disp-${Date.now()}`,
      memberCode: data.memberCode,
      memberName: member.full_name,
      memberDept: member.department_name,
      criterionCode: data.criterionCode,
      pointsContested: data.pointsContested,
      reason: data.reason,
      evidenceUrl: data.evidenceUrl || '',
      createdAt: getVietnamNowFormatted(),
      status: 'pending_hr_review',
    }

    const updatedDisputes = [newDisp, ...disputes]
    setDisputes(updatedDisputes)
    syncToCloud({ disputes: updatedDisputes })

    return {
      success: true,
      message: 'Đã gửi khiếu nại thành công! Ban Nhân sự sẽ tiến hành xác minh trong vòng 48h.',
    }
  }

  // Ban Nhân sự thẩm định khiếu nại và chuyển BCN
  const reviewDisputeByHR = (disputeId: string, hrNote: string) => {
    const updatedDisputes = disputes.map((d) =>
      d.id === disputeId
        ? {
            ...d,
            hrNote,
            status: 'pending_bcn' as const,
          }
        : d
    )
    setDisputes(updatedDisputes)
    syncToCloud({ disputes: updatedDisputes })
  }

  // Ban Chủ nhiệm ra quyết định khiếu nại cuối cùng
  const resolveDisputeByBCN = (
    disputeId: string,
    approved: boolean,
    verdict: string
  ) => {
    const disp = disputes.find((d) => d.id === disputeId)
    if (!disp) return { success: false, message: 'Khiếu nại không tồn tại' }

    let updatedMembers = members
    let updatedProposals = proposals

    if (approved) {
      // Hoàn lại điểm cho thành viên (cộng bù lại số điểm đã bị trừ)
      const refundPoints = Math.abs(disp.pointsContested)

      updatedMembers = getRankedMembers(
        members.map((m) => {
          if (m.member_code === disp.memberCode) {
            const newScore = Math.min(100, m.current_score + refundPoints)
            const newT02 =
              disp.criterionCode === 'T02'
                ? Math.max(0, m.absent_count_t02 - 1)
                : m.absent_count_t02
            return { ...m, current_score: newScore, absent_count_t02: newT02 }
          }
          return m
        })
      )
      setMembers(updatedMembers)

      // Ghi nhận vào sổ cái lịch sử hoàn điểm
      const refundRecord: ProposalItem = {
        id: `refund-${Date.now()}`,
        memberCode: disp.memberCode,
        memberName: disp.memberName,
        memberDept: disp.memberDept,
        isCore: false,
        criterionCode: 'C09' as RuleCode,
        criterionName: 'Hoàn điểm khiếu nại Q06 thành công',
        points: refundPoints,
        reason: `Ban Chủ nhiệm chấp nhận khiếu nại: ${verdict}`,
        proposedBy: 'Nguyễn Thị Hồng Hân (Chủ nhiệm CLB)',
        proposedByRole: 'bcn',
        status: 'approved',
        createdAt: getVietnamNowFormatted(),
      }
      updatedProposals = [refundRecord, ...proposals]
      setProposals(updatedProposals)
    }

    const finalStatus: DisputeItem['status'] = approved ? 'approved_resolved' : 'rejected'
    const updatedDisputes = disputes.map((d) =>
      d.id === disputeId
        ? {
            ...d,
            status: finalStatus,
            bcnVerdict: verdict,
            resolvedAt: getVietnamNowFormatted(),
          }
        : d
    )
    setDisputes(updatedDisputes)

    syncToCloud({
      disputes: updatedDisputes,
      ...(approved ? { members: updatedMembers, proposals: updatedProposals } : {}),
    })

    return {
      success: true,
      message: approved
        ? `Đã chấp thuận khiếu nại và hoàn trả điểm cho ${disp.memberName}!`
        : `Đã bác bỏ khiếu nại của ${disp.memberName}.`,
    }
  }

  // Ban Chủ nhiệm chốt kỳ & reset điểm tháng mới về mốc 60 điểm
  const resetMonthlyScores = (newMonthLabel: string, actorName: string) => {
    const resetMembers = getRankedMembers(
      members.map((m) => ({
        ...m,
        current_score: 60, // Reset chuẩn 60 điểm
        absent_count_t02: 0,
        delta_rank: 0,
      }))
    )
    setMembers(resetMembers)

    setCurrentActiveMonth(newMonthLabel)

    // Thêm bản ghi thông báo hệ thống vào danh sách duyệt
    const logItem: ProposalItem = {
      id: `sys-reset-${Date.now()}`,
      memberCode: 'ALL-CLUB',
      memberName: 'Toàn bộ 48 Thành viên',
      memberDept: 'Toàn Câu Lạc bộ',
      isCore: false,
      criterionCode: 'C01',
      criterionName: `Reset điểm tháng mới (${newMonthLabel})`,
      points: 0,
      reason: `Ban Chủ nhiệm (${actorName}) đã thực hiện chốt điểm tháng trước và thiết lập mốc xuất phát 60 điểm cho toàn bộ thành viên để thi đua công bằng cho ${newMonthLabel}.`,
      proposedBy: actorName,
      proposedByRole: 'Ban Chủ nhiệm',
      status: 'approved',
      createdAt: getVietnamNowFormatted(),
    }
    const updatedProps = [logItem, ...proposals]
    setProposals(updatedProps)
    syncToCloud({ members: resetMembers, proposals: updatedProps })

    return {
      success: true,
      message: `Đã chốt kết quả và reset điểm toàn bộ 48 thành viên về mốc chuẩn 60 điểm cho ${newMonthLabel}!`,
    }
  }

  // Khôi phục điểm demo Tháng 10
  const restoreOctoberScores = () => {
    setMembers(getActiveRosterMembers(INITIAL_MEMBERS))
    setCurrentActiveMonth('Tháng 10/2025')
  }

  // Tạo chu kỳ tháng thi đua mới theo thời gian thực (Quyền Ban Chủ nhiệm)
  const createMonthPeriod = (data: {
    month: number
    year: number
    name?: string
    description?: string
    actorName: string
  }) => {
    const monthStr = String(data.month).padStart(2, '0')
    const targetId = `month-${data.year}-${monthStr}`
    const periodName = data.name?.trim() || `Tháng ${monthStr}/${data.year}`

    // Gỡ targetId ra khỏi danh sách đã xóa nếu từng bị xóa
    if (deletedPeriodIdsRef.current.has(targetId)) {
      deletedPeriodIdsRef.current.delete(targetId)
      try {
        localStorage.setItem(
          'issac_deleted_period_ids',
          JSON.stringify(Array.from(deletedPeriodIdsRef.current))
        )
      } catch (e) {}
    }

    // 1. Reset toàn bộ 48 thành viên về mốc xuất phát chuẩn 60 điểm cho chu kỳ mới
    const resetMembers = getRankedMembers(
      members.map((m) => ({
        ...m,
        current_score: 60,
        absent_count_t02: 0,
        delta_rank: 0,
      }))
    )
    setMembers(resetMembers)

    // 2. Cập nhật danh sách chu kỳ (nếu đã có thì kích hoạt lại, chưa có thì tạo mới)
    const existingIndex = periods.findIndex((p) => p.id === targetId)
    let activeItem: PeriodItem
    let updatedPeriods: PeriodItem[]

    if (existingIndex >= 0) {
      activeItem = {
        ...periods[existingIndex],
        name: periodName,
        status: 'active',
        isCurrent: true,
        isFinalized: false,
        description: data.description?.trim() || periods[existingIndex].description,
      }
      updatedPeriods = periods.map((p, idx) => {
        if (idx === existingIndex) return activeItem
        if (p.scope === 'month') return { ...p, isCurrent: false }
        return p
      })
    } else {
      activeItem = createMonthlyPeriodItem(
        data.month,
        data.year,
        data.name,
        data.description,
        data.actorName
      )
      activeItem.isCurrent = true
      updatedPeriods = [
        activeItem,
        ...periods.map((p) => (p.scope === 'month' ? { ...p, isCurrent: false } : p)),
      ]
    }

    setPeriods(updatedPeriods)
    _setCurrentActivePeriodId(activeItem.id)
    setCurrentActiveMonth(activeItem.name)

    const updatedPeriodScores = {
      ...customPeriodScores,
      [activeItem.id]: {},
    }
    setCustomPeriodScores(updatedPeriodScores)

    // Thêm bản ghi thông báo hệ thống
    const logItem: ProposalItem = {
      id: `sys-period-${Date.now()}`,
      memberCode: 'ALL-CLUB',
      memberName: 'Toàn bộ 48 Thành viên',
      memberDept: 'Toàn Câu Lạc bộ',
      isCore: false,
      criterionCode: 'C01',
      criterionName: `Khởi tạo chu kỳ: ${activeItem.name}`,
      points: 0,
      periodId: activeItem.id,
      periodName: activeItem.name,
      reason: `Ban Chủ nhiệm (${data.actorName}) đã khởi tạo chu kỳ thi đua ${activeItem.name} theo thời gian thực (${activeItem.timeRange}). Tất cả 48 thành viên được reset về mốc 60 điểm chuẩn thi đua.`,
      proposedBy: data.actorName,
      proposedByRole: 'Ban Chủ nhiệm',
      status: 'approved',
      createdAt: getVietnamNowFormatted(),
    }
    const updatedProps = [logItem, ...proposals]
    setProposals(updatedProps)

    // 3. Lưu tức thì vào localStorage
    try {
      localStorage.setItem('issac_periods_clean_v1', JSON.stringify(updatedPeriods))
      localStorage.setItem('issac_active_period_id', activeItem.id)
      localStorage.setItem('issac_members_clean_v1', JSON.stringify(resetMembers))
      localStorage.setItem('issac_proposals_clean_v1', JSON.stringify(updatedProps))
      localStorage.setItem('issac_custom_period_scores', JSON.stringify(updatedPeriodScores))
    } catch (e) {
      console.error('Error saving period to localStorage:', e)
    }

    if (deletedPeriodIdsRef.current.has(activeItem.id)) {
      deletedPeriodIdsRef.current.delete(activeItem.id)
      try {
        localStorage.setItem(
          'issac_deleted_period_ids',
          JSON.stringify(Array.from(deletedPeriodIdsRef.current))
        )
      } catch (e) {}
    }

    // 4. Lưu vĩnh viễn lên Supabase Cloud
    syncToCloud({
      periods: updatedPeriods,
      activePeriodId: activeItem.id,
      members: resetMembers,
      proposals: updatedProps,
      customPeriodScores: updatedPeriodScores,
      deletedPeriodIds: Array.from(deletedPeriodIdsRef.current),
    })

    return {
      success: true,
      message: `Đã khởi tạo thành công chu kỳ thi đua "${activeItem.name}" theo thời gian thực! Tất cả 48 thành viên đã reset về mốc chuẩn 60 điểm và được lưu vĩnh viễn lên hệ thống Cloud.`,
      period: activeItem,
    }
  }

  // Khóa sổ điểm chu kỳ (Ban Chủ nhiệm chốt tháng)
  const lockMonthPeriod = (periodId: string, actorName: string) => {
    const target = periods.find((p) => p.id === periodId)
    if (!target) return { success: false, message: 'Không tìm thấy chu kỳ!' }

    const lockedAt = getVietnamNowFormatted()

    const updatedPeriods = periods.map((p) =>
      p.id === periodId
        ? {
            ...p,
            status: 'locked' as const,
            isFinalized: true,
            lockedAt,
            lockedBy: actorName,
          }
        : p
    )
    setPeriods(updatedPeriods)

    const logItem: ProposalItem = {
      id: `sys-lock-${Date.now()}`,
      memberCode: 'ALL-CLUB',
      memberName: 'Toàn bộ 48 Thành viên',
      memberDept: 'Toàn Câu Lạc bộ',
      isCore: false,
      criterionCode: 'T01',
      criterionName: `Khóa sổ điểm: ${target.name}`,
      points: 0,
      periodId: target.id,
      periodName: target.name,
      reason: `Ban Chủ nhiệm (${actorName}) đã chính thức KHÓA SỔ ĐIỂM cho ${target.name}. Kết quả thi đua được đóng băng để bảo đảm tính minh bạch và công bằng tuyệt đối.`,
      proposedBy: actorName,
      proposedByRole: 'Ban Chủ nhiệm',
      status: 'approved',
      createdAt: getVietnamNowFormatted(),
    }
    const updatedProps = [logItem, ...proposals]
    setProposals(updatedProps)

    try {
      localStorage.setItem('issac_periods_clean_v1', JSON.stringify(updatedPeriods))
      localStorage.setItem('issac_proposals_clean_v1', JSON.stringify(updatedProps))
    } catch (e) {}

    syncToCloud({
      periods: updatedPeriods,
      proposals: updatedProps,
    })

    return {
      success: true,
      message: `Đã khóa sổ điểm chu kỳ "${target.name}"! Toàn bộ điểm số được đóng băng công bằng.`,
    }
  }

  // Mở khóa lại chu kỳ (Trường hợp BCN cần điều chỉnh)
  const unlockMonthPeriod = (periodId: string, actorName: string) => {
    const target = periods.find((p) => p.id === periodId)
    if (!target) return { success: false, message: 'Không tìm thấy chu kỳ!' }

    const updatedPeriods = periods.map((p) =>
      p.id === periodId
        ? {
            ...p,
            status: 'active' as const,
            isFinalized: false,
            lockedAt: undefined,
            lockedBy: undefined,
          }
        : p
    )
    setPeriods(updatedPeriods)

    try {
      localStorage.setItem('issac_periods_clean_v1', JSON.stringify(updatedPeriods))
    } catch (e) {}

    syncToCloud({
      periods: updatedPeriods,
    })

    return {
      success: true,
      message: `Đã mở khóa lại chu kỳ "${target.name}". Cổng chấm điểm tiếp tục mở cho Ban Nhân sự và BCN.`,
    }
  }

  // Cập nhật thông tin chu kỳ (Ban Chủ nhiệm chỉnh sửa tên, mô tả, thời gian)
  const updateMonthPeriod = (
    periodId: string,
    data: {
      name?: string
      shortLabel?: string
      description?: string
      timeRange?: string
    },
    actorName: string
  ): { success: boolean; message: string; period?: PeriodItem } => {
    const target = periods.find((p) => p.id === periodId)
    if (!target) return { success: false, message: 'Không tìm thấy chu kỳ cần chỉnh sửa!' }

    const trimmedName =
      data.name !== undefined && data.name.trim() !== '' ? data.name.trim() : target.name
    const trimmedShortLabel =
      data.shortLabel !== undefined && data.shortLabel.trim() !== ''
        ? data.shortLabel.trim()
        : target.shortLabel
    const trimmedDescription =
      data.description !== undefined ? data.description.trim() : target.description
    const trimmedTimeRange =
      data.timeRange !== undefined && data.timeRange.trim() !== ''
        ? data.timeRange.trim()
        : target.timeRange

    const updatedPeriods = periods.map((p) =>
      p.id === periodId
        ? {
            ...p,
            name: trimmedName,
            shortLabel: trimmedShortLabel,
            description: trimmedDescription,
            timeRange: trimmedTimeRange,
          }
        : p
    )
    setPeriods(updatedPeriods)

    if (periodId === currentActivePeriodId) {
      setCurrentActiveMonth(trimmedName)
    }

    const logItem: ProposalItem = {
      id: `sys-edit-period-${Date.now()}`,
      memberCode: 'ALL-CLUB',
      memberName: 'Toàn bộ 48 Thành viên',
      memberDept: 'Toàn Câu Lạc bộ',
      isCore: false,
      criterionCode: 'T02',
      criterionName: `Cập nhật chu kỳ: ${trimmedName}`,
      points: 0,
      periodId: target.id,
      periodName: trimmedName,
      reason: `Ban Chủ nhiệm (${actorName}) đã cập nhật thông tin chu kỳ thi đua "${trimmedName}" (${trimmedTimeRange}).`,
      proposedBy: actorName,
      proposedByRole: 'Ban Chủ nhiệm',
      status: 'approved',
      createdAt: getVietnamNowFormatted(),
    }
    const updatedProps = [
      logItem,
      ...proposals.map((prop) =>
        prop.periodId === periodId ? { ...prop, periodName: trimmedName } : prop
      ),
    ]
    setProposals(updatedProps)

    try {
      localStorage.setItem('issac_periods_clean_v1', JSON.stringify(updatedPeriods))
      localStorage.setItem('issac_proposals_clean_v1', JSON.stringify(updatedProps))
    } catch (e) {
      console.error('Error saving updated period to localStorage:', e)
    }

    syncToCloud({
      periods: updatedPeriods,
      proposals: updatedProps,
    })

    const updatedTarget = updatedPeriods.find((p) => p.id === periodId)
    return {
      success: true,
      message: `Đã cập nhật thông tin chu kỳ thi đua "${trimmedName}" thành công!`,
      period: updatedTarget,
    }
  }

  // Xóa chu kỳ tháng (Ban Chủ nhiệm xóa bỏ chu kỳ đã tạo hoặc không còn dùng)
  const deleteMonthPeriod = (
    periodId: string,
    actorName: string
  ): { success: boolean; message: string } => {
    const target = periods.find((p) => p.id === periodId)
    if (!target) return { success: false, message: 'Không tìm thấy chu kỳ cần xóa!' }

    if (periods.length <= 1) {
      return { success: false, message: 'Không thể xóa chu kỳ duy nhất còn lại của Câu Lạc Bộ!' }
    }

    const remainingPeriods = periods.filter((p) => p.id !== periodId)

    let nextActiveId = currentActivePeriodId
    let nextActiveName = currentActiveMonth
    let updatedPeriods = remainingPeriods

    // Nếu chu kỳ bị xóa đang là chu kỳ kích hoạt hiện tại
    if (periodId === currentActivePeriodId) {
      const fallbackPeriod =
        remainingPeriods.find((p) => p.scope === 'month' && p.status === 'active') ||
        remainingPeriods.find((p) => p.scope === 'month') ||
        remainingPeriods[0]

      nextActiveId = fallbackPeriod.id
      nextActiveName = fallbackPeriod.name

      updatedPeriods = remainingPeriods.map((p) => ({
        ...p,
        isCurrent: p.id === nextActiveId,
      }))

      _setCurrentActivePeriodId(nextActiveId)
      setCurrentActiveMonth(nextActiveName)
    }

    setPeriods(updatedPeriods)

    // Xóa điểm tự tính riêng của chu kỳ này (nếu có)
    const updatedCustomScores = { ...customPeriodScores }
    delete updatedCustomScores[periodId]
    setCustomPeriodScores(updatedCustomScores)

    const logItem: ProposalItem = {
      id: `sys-del-period-${Date.now()}`,
      memberCode: 'ALL-CLUB',
      memberName: 'Toàn bộ 48 Thành viên',
      memberDept: 'Toàn Câu Lạc bộ',
      isCore: false,
      criterionCode: 'T03',
      criterionName: `Xóa chu kỳ: ${target.name}`,
      points: 0,
      periodId: target.id,
      periodName: target.name,
      reason: `Ban Chủ nhiệm (${actorName}) đã xóa chu kỳ thi đua "${target.name}". Dữ liệu chu kỳ đã được làm sạch và chuyển đổi an toàn.`,
      proposedBy: actorName,
      proposedByRole: 'Ban Chủ nhiệm',
      status: 'approved',
      createdAt: getVietnamNowFormatted(),
    }
    const updatedProps = [logItem, ...proposals]
    setProposals(updatedProps)

    deletedPeriodIdsRef.current.add(periodId)

    try {
      localStorage.setItem('issac_periods_clean_v1', JSON.stringify(updatedPeriods))
      if (periodId === currentActivePeriodId) {
        localStorage.setItem('issac_active_period_id', nextActiveId)
      }
      localStorage.setItem('issac_custom_period_scores', JSON.stringify(updatedCustomScores))
      localStorage.setItem('issac_proposals_clean_v1', JSON.stringify(updatedProps))
      localStorage.setItem(
        'issac_deleted_period_ids',
        JSON.stringify(Array.from(deletedPeriodIdsRef.current))
      )
    } catch (e) {
      console.error('Error deleting period from localStorage:', e)
    }

    syncToCloud({
      action: 'delete_period',
      periodId,
      deletedPeriodIds: Array.from(deletedPeriodIdsRef.current),
      periods: updatedPeriods,
      activePeriodId: nextActiveId,
      customPeriodScores: updatedCustomScores,
      proposals: updatedProps,
    })

    return {
      success: true,
      message: `Đã xóa chu kỳ thi đua "${target.name}" thành công!`,
    }
  }

  // Quản lý sự kiện sắp tới & cổng đăng ký
  const createUpcomingEvent = (data: {
    title: string
    description: string
    date: string
    startTime: string
    endTime: string
    location: string
    pinCode?: string
    isRequired: boolean
    allowRegistration?: boolean
    maxAttendees?: number
    pointBonus?: number
    category?: 'meeting' | 'workshop' | 'teambuilding' | 'external'
  }) => {
    const id = `evt-${Date.now()}`
    const generatedPin = data.pinCode?.trim() || String(Math.floor(1000 + Math.random() * 9000))

    const newEvt: MeetingEvent = {
      id,
      title: data.title.trim(),
      description: data.description.trim(),
      date: data.date.trim(),
      startTime: data.startTime.trim(),
      endTime: data.endTime.trim(),
      location: data.location.trim(),
      pinCode: generatedPin,
      isRequired: data.isRequired,
      isFinalized: false,
      allowRegistration: data.allowRegistration ?? true,
      maxAttendees: data.maxAttendees || 50,
      pointBonus: data.pointBonus || (data.isRequired ? 0 : 2),
      category: data.category || 'meeting',
      registeredMemberCodes: [],
      records: {},
    }

    const updated = [newEvt, ...events]
    setEvents(updated)
    setActiveEventId(newEvt.id)

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('issac_events_clean_v1', JSON.stringify(updated))
      } catch (e) {
        console.error('Error saving events:', e)
      }

      // Đẩy ngay lên Supabase Cloud API để điện thoại nhận được tức thì!
      fetch('/api/db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_event', event: newEvt, events: updated }),
      }).catch((e) => console.error('Cloud sync error on create_event:', e))
    }

    return {
      success: true,
      message: `Đã thiết lập thành công sự kiện "${newEvt.title}" (Mã PIN: ${newEvt.pinCode})! Cổng đăng ký và điểm danh Check-in đã sẵn sàng.`,
      event: newEvt,
    }
  }

  // Thành viên đăng ký tham gia sự kiện
  const registerForEvent = (eventId: string, memberCode: string) => {
    const target = events.find((e) => e.id === eventId)
    if (!target) return { success: false, message: 'Không tìm thấy sự kiện!' }

    const registered = target.registeredMemberCodes || []
    if (registered.includes(memberCode)) {
      return { success: false, message: 'Bạn đã đăng ký tham gia sự kiện này rồi!' }
    }

    if (target.maxAttendees && registered.length >= target.maxAttendees) {
      return { success: false, message: 'Sự kiện đã đạt số lượng đăng ký tối đa!' }
    }

    const updated = events.map((e) => {
      if (e.id === eventId) {
        return {
          ...e,
          registeredMemberCodes: [...(e.registeredMemberCodes || []), memberCode],
        }
      }
      return e
    })

    setEvents(updated)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('issac_events_clean_v1', JSON.stringify(updated))
      } catch (err) {
        console.error(err)
      }
      fetch('/api/db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_all', events: updated }),
      }).catch((e) => console.error('Cloud sync error on registerForEvent:', e))
    }

    const memberName = members.find((m) => m.member_code === memberCode)?.full_name || memberCode
    return {
      success: true,
      message: `Đăng ký thành công cho ${memberName}! Hãy chuẩn bị mã PIN ${target.pinCode} để điểm danh check-in.`,
    }
  }

  // Hủy đăng ký tham gia sự kiện
  const unregisterFromEvent = (eventId: string, memberCode: string) => {
    const target = events.find((e) => e.id === eventId)
    if (!target) return { success: false, message: 'Không tìm thấy sự kiện!' }

    const updated = events.map((e) => {
      if (e.id === eventId) {
        return {
          ...e,
          registeredMemberCodes: (e.registeredMemberCodes || []).filter((c) => c !== memberCode),
        }
      }
      return e
    })

    setEvents(updated)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('issac_events_clean_v1', JSON.stringify(updated))
      } catch (err) {
        console.error(err)
      }
      fetch('/api/db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unregister', eventId, memberCode, events: updated }),
      }).catch((e) => console.error('Cloud sync error on unregisterFromEvent:', e))
    }

    return {
      success: true,
      message: 'Đã hủy đăng ký sự kiện thành công.',
    }
  }

  // Cập nhật thông tin chi tiết sự kiện
  const updateEvent = (eventId: string, updates: Partial<MeetingEvent>) => {
    const target = events.find((e) => e.id === eventId)
    if (!target) return { success: false, message: 'Không tìm thấy sự kiện cần chỉnh sửa!' }

    const updated = events.map((e) => (e.id === eventId ? { ...e, ...updates } : e))
    setEvents(updated)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('issac_events_clean_v1', JSON.stringify(updated))
      } catch (err) {
        console.error(err)
      }
      fetch('/api/db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_event',
          eventId,
          event: updates,
          events: updated,
        }),
      }).catch((e) => console.error('Cloud sync error on updateEvent:', e))
    }
    return { success: true, message: 'Đã cập nhật thông tin sự kiện và đồng bộ tới toàn hệ thống.' }
  }

  // Cập nhật danh sách thành viên đăng ký theo danh sách CLB
  const updateEventAttendees = (eventId: string, memberCodes: string[]) => {
    const target = events.find((e) => e.id === eventId)
    if (!target) return { success: false, message: 'Không tìm thấy sự kiện!' }

    const uniqueCodes = Array.from(new Set(memberCodes))
    const updated = events.map((e) =>
      e.id === eventId ? { ...e, registeredMemberCodes: uniqueCodes } : e
    )
    setEvents(updated)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('issac_events_clean_v1', JSON.stringify(updated))
      } catch (err) {
        console.error(err)
      }
      fetch('/api/db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_event_attendees',
          eventId,
          registeredMemberCodes: uniqueCodes,
          events: updated,
        }),
      }).catch((e) => console.error('Cloud sync error on updateEventAttendees:', e))
    }
    return {
      success: true,
      message: `Đã lưu danh sách ${uniqueCodes.length} thành viên tham gia theo danh sách CLB!`,
    }
  }

  // Xóa sự kiện
  const deleteEvent = (eventId: string) => {
    deletedEventIdsRef.current.add(eventId)
    const updated = events.filter((e) => e.id !== eventId)
    setEvents(updated)
    if (activeEventId === eventId) {
      setActiveEventId(updated.length > 0 ? updated[0].id : '')
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('issac_events_clean_v1', JSON.stringify(updated))
        localStorage.setItem(
          'issac_deleted_event_ids',
          JSON.stringify(Array.from(deletedEventIdsRef.current))
        )
      } catch (err) {
        console.error(err)
      }
      fetch('/api/db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_event',
          eventId,
          events: updated,
          deletedEventIds: Array.from(deletedEventIdsRef.current),
        }),
      }).catch((e) => console.error('Cloud sync error on deleteEvent:', e))
    }
    return { success: true, message: 'Đã xóa sự kiện khỏi hệ thống và đồng bộ tới tất cả thiết bị.' }
  }

  return (
    <ClubContext.Provider
      value={{
        members,
        proposals,
        events,
        activeEvent,
        disputes,
        addMember,
        updateMember,
        deleteMember,
        createProposal,
        approveProposal,
        rejectProposal,
        updateProposal,
        deleteProposal,
        updateCheckinRecord,
        memberSelfCheckin,
        finalizeEvent,
        createDispute,
        reviewDisputeByHR,
        resolveDisputeByBCN,
        currentActiveMonth,
        resetMonthlyScores,
        restoreOctoberScores,
        periods,
        customPeriodScores,
        currentActivePeriodId,
        setCurrentActivePeriodId,
        createMonthPeriod,
        updateMonthPeriod,
        deleteMonthPeriod,
        lockMonthPeriod,
        unlockMonthPeriod,
        customRules,
        addCustomRule,
        deleteCustomRule,
        activeEventId,
        setActiveEventId,
        createUpcomingEvent,
        updateEvent,
        updateEventAttendees,
        registerForEvent,
        unregisterFromEvent,
        deleteEvent,
      }}
    >
      {children}
    </ClubContext.Provider>
  )
}

export function useClub() {
  const context = useContext(ClubContext)
  if (!context) {
    throw new Error('useClub must be used within a ClubProvider')
  }
  return context
}
