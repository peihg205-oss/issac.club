'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { INITIAL_MEMBERS, type RosterMember, getRankedMembers, getActiveRosterMembers } from '@/lib/clubData'
import type { DepartmentCode, DepartmentSlug, RuleCode } from '@/types/database'
import { CRITERIA_RULES } from '@/lib/scoring/constants'
import { calculateScoreDelta } from '@/lib/scoring/engine'
import { AVAILABLE_PERIODS, type PeriodItem, createMonthlyPeriodItem } from '@/lib/periodData'

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
  status: 'pending_bcn' | 'approved' | 'rejected'
  createdAt: string
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
}

export interface DisputeItem {
  id: string
  memberCode: string
  memberName: string
  memberDept: string
  criterionCode: string
  pointsContested: number
  reason: string
  evidenceUrl: string
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
    reason: string
    evidenceUrl?: string
    proposerName: string
    proposerRole: string
    directApply?: boolean
    periodId?: string
  }) => { success: boolean; message: string }
  approveProposal: (proposalId: string) => void
  rejectProposal: (proposalId: string) => void
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
    evidenceUrl: string
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
  registerForEvent: (eventId: string, memberCode: string) => { success: boolean; message: string }
  unregisterFromEvent: (eventId: string, memberCode: string) => { success: boolean; message: string }
  deleteEvent: (eventId: string) => { success: boolean; message: string }
}

const ClubContext = createContext<ClubContextType | undefined>(undefined)

const INITIAL_PROPOSALS: ProposalItem[] = [
  {
    id: 'prop-01',
    memberCode: '25071203',
    memberName: 'Lục Xuân Huy',
    memberDept: 'Ban Truyền thông',
    isCore: false,
    criterionCode: 'C06',
    criterionName: 'Nhiệm vụ xuất sắc / Vượt tiến độ',
    points: 3,
    reason: 'Hoàn thiện bộ nhận diện bài đăng tuyển sinh trước hạn 2 ngày',
    evidenceUrl: 'https://drive.google.com/drive/folders/demo-1',
    proposedBy: 'Trần Đức Thắng (Trưởng Ban TT)',
    proposedByRole: 'dept_head',
    status: 'pending_bcn',
    createdAt: '15/10/2025 14:30',
  },
  {
    id: 'prop-02',
    memberCode: '24310108',
    memberName: 'Hoàng Triều Xuân',
    memberDept: 'Ban Truyền thông',
    isCore: false,
    criterionCode: 'T07',
    criterionName: 'Chậm deadline nhiệm vụ (<24h)',
    points: -2,
    reason: 'Ban Nhân sự kiểm tra thấy nộp báo cáo muộn 8 tiếng không xin phép',
    evidenceUrl: '',
    proposedBy: 'Vũ Thị Minh Ngọc (Ban Nhân sự)',
    proposedByRole: 'hr',
    status: 'pending_bcn',
    createdAt: '15/10/2025 16:45',
  },
  {
    id: 'prop-03',
    memberCode: '25070278',
    memberName: 'Đinh Tấn Tài',
    memberDept: 'Ban Truyền thông',
    isCore: false,
    criterionCode: 'T05',
    criterionName: 'Không tương tác bài đăng / thông báo',
    points: -1,
    reason: 'Ban Nhân sự rà soát: không phản hồi thông báo khẩn trong 24h',
    evidenceUrl: '',
    proposedBy: 'Nguyễn Thị Hải Yến (Ban Nhân sự)',
    proposedByRole: 'hr',
    status: 'pending_bcn',
    createdAt: '16/10/2025 09:15',
  },
]

// Khởi tạo buổi họp mẫu với 48 thành viên có trạng thái sống
function createInitialEventRecords(): Record<string, CheckinRecord> {
  const records: Record<string, CheckinRecord> = {}

  INITIAL_MEMBERS.forEach((m, idx) => {
    // 38 thành viên đúng giờ, 4 muộn, 3 có phép, 3 vắng chưa phép
    if (idx === 7 || idx === 11 || idx === 25 || idx === 43) {
      records[m.member_code] = {
        memberCode: m.member_code,
        status: 'late',
        checkinTime: '19:48',
        note: 'Đến muộn 18 phút do kẹt xe',
      }
    } else if (idx === 15 || idx === 28 || idx === 45) {
      records[m.member_code] = {
        memberCode: m.member_code,
        status: 'excused',
        note: 'Trùng lịch thi kết thúc học phần, đã gửi đơn trước 24h',
      }
    } else if (idx === 16 || idx === 46 || idx === 47) {
      records[m.member_code] = {
        memberCode: m.member_code,
        status: 'unexcused',
        note: 'Chưa có mặt và chưa gửi đơn xin phép',
      }
    } else {
      records[m.member_code] = {
        memberCode: m.member_code,
        status: 'present_on_time',
        checkinTime: '19:22',
        note: 'Có mặt đúng giờ tại phòng họp A3-201',
      }
    }
  })

  return records
}

const INITIAL_EVENTS: MeetingEvent[] = [
  {
    id: 'evt-20251016',
    title: 'Sinh hoạt định kỳ Câu Lạc bộ Đại sứ sinh viên Trường Quốc tế tháng 10/2025',
    description:
      'Triển khai chiến dịch Tuyển sinh K25, phân công nhiệm vụ tuần và đánh giá xếp loại giữa kỳ.',
    date: '16/10/2025',
    startTime: '19:30',
    endTime: '21:30',
    location: 'Phòng A3-201, Cơ sở Quốc Oai & Google Meet',
    pinCode: '8899',
    isRequired: true,
    isFinalized: false,
    allowRegistration: true,
    maxAttendees: 48,
    pointBonus: 1,
    category: 'meeting',
    registeredMemberCodes: ['25071203', '24310108', '25070278', '24070608', '24070446', '24070678', '25071249', '25070267'],
    records: createInitialEventRecords(),
  },
  {
    id: 'evt-upcoming-workshop',
    title: 'Workshop Kỹ năng Đàm phán & Thuyết trình chuyên nghiệp',
    description:
      'Chuyên đề nâng cao kỹ năng đàm phán, thuyết phục và ứng biến sân khấu dành riêng cho thành viên CLB cùng chuyên gia VNU.',
    date: '24/10/2026',
    startTime: '19:00',
    endTime: '21:30',
    location: 'Hội trường Tầng 5, Tòa nhà HT1 - Cơ sở Hòa Lạc & Zoom',
    pinCode: '7788',
    isRequired: false,
    allowRegistration: true,
    isFinalized: false,
    maxAttendees: 50,
    pointBonus: 2,
    category: 'workshop',
    registeredMemberCodes: ['25071203', '24310108', '25070278', '24070608', '24070446'],
    records: {},
  },
  {
    id: 'evt-upcoming-teambuilding',
    title: 'Teambuilding Gen 3 & Gắn kết Thành viên mới',
    description:
      'Chuyến dã ngoại kết nối toàn CLB. Bắt buộc tham gia 100% thành viên (nhân sự có việc bận xin phép trước 48h).',
    date: '02/11/2026',
    startTime: '08:00',
    endTime: '17:00',
    location: 'Khu du lịch sinh thái Quốc Oai, Hà Nội',
    pinCode: '2026',
    isRequired: true,
    allowRegistration: true,
    isFinalized: false,
    maxAttendees: 60,
    pointBonus: 3,
    category: 'teambuilding',
    registeredMemberCodes: ['25071203', '24310108', '25070278', '24070608', '24070446', '24070678', '25071249'],
    records: {},
  },
  {
    id: 'evt-20250920',
    title: 'Họp khởi động năm học mới 2025-2026',
    description: 'Tổng kết hoạt động hè và ra mắt cơ cấu nhân sự mới các ban.',
    date: '20/09/2025',
    startTime: '19:00',
    endTime: '21:00',
    location: 'Hội trường B2, Cơ sở Xuân Thuỷ',
    pinCode: '2025',
    isRequired: true,
    isFinalized: true,
    finalizedAt: '20/09/2025 21:15',
    finalizedBy: 'Nguyễn Thị Hồng Hân (Chủ nhiệm CLB)',
    records: {},
  },
]

const INITIAL_DISPUTES: DisputeItem[] = [
  {
    id: 'disp-01',
    memberCode: '24070608',
    memberName: 'Nguyễn Phú Cường',
    memberDept: 'Ban Truyền thông',
    criterionCode: 'T02',
    pointsContested: -5,
    reason:
      'Em có gửi email đơn xin phép vắng buổi họp ngày 10/10 trước 24 giờ do lịch thi học phần BDA2024, nhưng hệ thống ghi nhận T02 (-5đ). Em xin được chuyển sang T01 (-2đ) theo quy chế.',
    evidenceUrl: 'https://drive.google.com/file/d/demo-don-xin-phep',
    createdAt: '14/10/2025 10:20',
    status: 'pending_bcn',
    hrNote:
      'Ban Nhân sự đã kiểm tra hộp thư club.issac: Đã nhận được email kèm minh chứng lịch thi hợp lệ lúc 08:30 ngày 09/10 (>24h). Đề xuất BCN chấp nhận khiếu nại và hoàn trả 3 điểm.',
  },
  {
    id: 'disp-02',
    memberCode: '24310108',
    memberName: 'Hoàng Triều Xuân',
    memberDept: 'Ban Truyền thông',
    criterionCode: 'T07',
    pointsContested: -2,
    reason:
      'Em đã tải file thiết kế banner lên Google Drive lúc 21:55 ngày 08/10 trước hạn 22:00, nhưng do lỗi mạng link cập nhật chậm trên Zalo nhóm.',
    evidenceUrl: 'https://drive.google.com/file/d/demo-drive-history',
    createdAt: '11/10/2025 15:40',
    status: 'approved_resolved',
    hrNote: 'Đã kiểm tra lịch sử Drive: Timestamp 21:54 ngày 08/10.',
    bcnVerdict:
      'Ban Chủ nhiệm phê duyệt: Hồ sơ minh chứng hợp lệ. Hoàn trả lại 2 điểm cho bạn Hoàng Triều Xuân.',
    resolvedAt: '12/10/2025 09:30',
  },
]

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

export function ClubProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<RosterMember[]>(() => getActiveRosterMembers(INITIAL_MEMBERS))
  const [proposals, setProposals] = useState<ProposalItem[]>(INITIAL_PROPOSALS)
  const [events, setEvents] = useState<MeetingEvent[]>(INITIAL_EVENTS)
  const [activeEventId, setActiveEventId] = useState<string>('evt-20251016')
  const [disputes, setDisputes] = useState<DisputeItem[]>(INITIAL_DISPUTES)
  const [currentActiveMonth, setCurrentActiveMonth] = useState<string>('Tháng 10/2025')
  const [periods, setPeriods] = useState<PeriodItem[]>(AVAILABLE_PERIODS)
  const [customPeriodScores, setCustomPeriodScores] = useState<Record<string, Record<string, number>>>({})
  const [currentActivePeriodId, setCurrentActivePeriodId] = useState<string>('month-2025-10')
  const [customRules, setCustomRules] = useState<CustomRuleItem[]>(INITIAL_CUSTOM_RULES)

  const isHydratedRef = useRef(false)

  // Safe client-side hydration from localStorage to prevent SSR mismatch
  useEffect(() => {
    try {
      const savedEvents =
        localStorage.getItem('issac_events_v4') ||
        localStorage.getItem('issac_events_v3') ||
        localStorage.getItem('issac_events_v2')
      if (savedEvents) {
        const parsed: MeetingEvent[] = JSON.parse(savedEvents)
        const cleaned = parsed.map((evt) => ({
          ...evt,
          title: evt.title
            .replace(/Tân Sứ giả/g, 'Thành viên mới')
            .replace(/Sứ giả/g, 'Thành viên')
            .replace(/sứ giả/g, 'thành viên')
            .replace(/CLB iSSAC/g, 'Câu Lạc bộ Đại sứ sinh viên Trường Quốc tế'),
          description: evt.description
            .replace(/Tân Sứ giả/g, 'Thành viên mới')
            .replace(/Sứ giả/g, 'Thành viên')
            .replace(/sứ giả/g, 'thành viên')
            .replace(/CLB iSSAC/g, 'Câu Lạc bộ Đại sứ sinh viên Trường Quốc tế'),
        }))
        setEvents(cleaned)
        localStorage.setItem('issac_events_v4', JSON.stringify(cleaned))
        // Dọn sạch các key cũ để tránh xung đột
        localStorage.removeItem('issac_events_v3')
        localStorage.removeItem('issac_events_v2')
      }
    } catch (e) {
      console.error('Error reading events from localStorage:', e)
    }

    try {
      const savedRules = localStorage.getItem('issac_custom_rules_v1')
      if (savedRules) {
        setCustomRules(JSON.parse(savedRules))
      }
    } catch (e) {
      console.error('Error reading custom rules from localStorage:', e)
    }

    try {
      const savedMembers = localStorage.getItem('issac_members_v1')
      if (savedMembers) {
        setMembers(JSON.parse(savedMembers))
      }
    } catch (e) {
      console.error('Error reading members from localStorage:', e)
    }

    try {
      const savedProposals = localStorage.getItem('issac_proposals_v1')
      if (savedProposals) {
        setProposals(JSON.parse(savedProposals))
      }
    } catch (e) {
      console.error('Error reading proposals from localStorage:', e)
    }

    isHydratedRef.current = true
  }, [])

  // Auto-sync state changes to localStorage after initial hydration
  useEffect(() => {
    if (!isHydratedRef.current || typeof window === 'undefined') return
    try {
      localStorage.setItem('issac_members_v1', JSON.stringify(members))
    } catch (e) {
      console.error('Error saving members:', e)
    }
  }, [members])

  useEffect(() => {
    if (!isHydratedRef.current || typeof window === 'undefined') return
    try {
      localStorage.setItem('issac_events_v4', JSON.stringify(events))
    } catch (e) {
      console.error('Error saving events:', e)
    }
  }, [events])

  useEffect(() => {
    if (!isHydratedRef.current || typeof window === 'undefined') return
    try {
      localStorage.setItem('issac_proposals_v1', JSON.stringify(proposals))
    } catch (e) {
      console.error('Error saving proposals:', e)
    }
  }, [proposals])

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

    const newRule: CustomRuleItem = {
      ...rule,
      code: trimmedCode,
      createdAt: new Date().toLocaleDateString('vi-VN'),
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
      avatar_url: data.avatarUrl?.trim() || undefined,
    }

    setMembers((prev) => {
      const updated = getRankedMembers([...prev, newMember])
      try {
        localStorage.setItem('issac_members_v1', JSON.stringify(updated))
      } catch (e) {
        console.error('Error saving members to localStorage:', e)
      }
      return updated
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

    let found = false
    const updatedList = members.map((m) => {
      if (m.member_code === memberCode) {
        found = true
        let deptName = m.department_name
        let deptSlug = m.department_slug

        if (updates.department_code && deptSlugMap[updates.department_code]) {
          deptName = deptSlugMap[updates.department_code].name
          deptSlug = deptSlugMap[updates.department_code].slug
        }

        return {
          ...m,
          ...updates,
          department_name: deptName,
          department_slug: deptSlug,
        }
      }
      return m
    })

    if (!found) {
      return { success: false, message: `Không tìm thấy thành viên: ${memberCode}` }
    }

    const reRanked = getRankedMembers(updatedList)
    setMembers(reRanked)
    try {
      localStorage.setItem('issac_members_v1', JSON.stringify(reRanked))
    } catch (e) {
      console.error('Error saving updated members to localStorage:', e)
    }

    return { success: true, message: 'Đã cập nhật thông tin thành viên thành công!' }
  }

  // Xóa thành viên
  const deleteMember = (
    memberCode: string
  ): { success: boolean; message: string } => {
    const target = members.find((m) => m.member_code === memberCode)
    if (!target) return { success: false, message: 'Không tìm thấy thành viên để xóa' }

    const updated = members.filter((m) => m.member_code !== memberCode)
    const reRanked = getRankedMembers(updated)
    setMembers(reRanked)
    try {
      localStorage.setItem('issac_members_v1', JSON.stringify(reRanked))
    } catch (e) {
      console.error('Error saving members after deletion:', e)
    }
    return { success: true, message: `Đã xóa thành viên ${target.full_name} khỏi hệ thống.` }
  }

  // Tạo đề xuất (hoặc BCN áp dụng trực tiếp) cho chu kỳ tháng được chọn
  const createProposal = (data: {
    memberCode: string
    criterionCode: string
    reason: string
    evidenceUrl?: string
    proposerName: string
    proposerRole: string
    directApply?: boolean
    periodId?: string
  }) => {
    const target = members.find((m) => m.member_code === data.memberCode)
    if (!target) return { success: false, message: 'Không tìm thấy thành viên' }

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

    if (builtinRule) {
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
      // 1. Nếu là chu kỳ mặc định 'month-2025-10', cập nhật vào mảng members
      if (targetPeriodId === 'month-2025-10') {
        setMembers((prev) =>
          getRankedMembers(
            prev.map((m) => {
              if (m.member_code === data.memberCode) {
                const newT02 =
                  data.criterionCode === 'T02' ? m.absent_count_t02 + 1 : m.absent_count_t02
                return { ...m, current_score: scoreAfter, absent_count_t02: newT02 }
              }
              return m
            })
          )
        )
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
        createdAt: 'Vừa xong',
        periodId: targetPeriod.id,
        periodName: targetPeriod.name,
      }
      setProposals((prev) => [record, ...prev])

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
      createdAt: 'Vừa xong',
      periodId: targetPeriod.id,
      periodName: targetPeriod.name,
    }
    setProposals((prev) => [newProp, ...prev])

    return {
      success: true,
      message: `Đã gửi đề xuất điểm cho ${target.full_name} trong ${targetPeriod.name} (${actualDelta > 0 ? `+${actualDelta}` : actualDelta} đ). Đang chờ Ban Chủ nhiệm phê duyệt.`,
    }
  }

  // Ban Chủ nhiệm duyệt đề xuất
  const approveProposal = (proposalId: string) => {
    const prop = proposals.find((p) => p.id === proposalId)
    if (!prop || prop.status !== 'pending_bcn') return

    const targetPeriodId = prop.periodId || 'month-2025-10'
    const targetPeriod = periods.find((p) => p.id === targetPeriodId)
    if (targetPeriod?.status === 'locked') {
      alert(`Chu kỳ "${targetPeriod.name}" đã được Ban Chủ nhiệm KHÓA SỔ. Không thể duyệt điểm!`)
      return
    }

    // Cập nhật điểm thành viên nếu là chu kỳ mặc định
    if (targetPeriodId === 'month-2025-10') {
      setMembers((prev) =>
        getRankedMembers(
          prev.map((m) => {
            if (m.member_code === prop.memberCode) {
              const builtinRule = CRITERIA_RULES[prop.criterionCode as RuleCode]
              let newScore = Math.max(0, Math.min(100, m.current_score + prop.points))
              if (builtinRule) {
                const calc = calculateScoreDelta({
                  ruleCode: prop.criterionCode as RuleCode,
                  basePoints: builtinRule.base_points,
                  isCoreAtEvent: m.is_core,
                  currentScore: m.current_score,
                })
                newScore = calc.scoreAfter
              }
              const newT02 =
                prop.criterionCode === 'T02' ? m.absent_count_t02 + 1 : m.absent_count_t02
              return { ...m, current_score: newScore, absent_count_t02: newT02 }
            }
            return m
          })
        )
      )
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

    // Đánh dấu approved
    setProposals((prev) =>
      prev.map((p) => (p.id === proposalId ? { ...p, status: 'approved' } : p))
    )
  }

  // Ban Chủ nhiệm từ chối đề xuất
  const rejectProposal = (proposalId: string) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === proposalId ? { ...p, status: 'rejected' } : p))
    )
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
    const regBadge = evt.allowRegistration
      ? isRegistered
        ? ' [🎟️ Đã đăng ký trước]'
        : ' [Khách mời/Chưa ĐK trước]'
      : ''
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
      message: `Điểm danh thành công cho ${member.full_name}!${
        regBadge ? ` Trạng thái: ${regBadge}.` : ''
      } Ghi nhận: ĐÚNG GIỜ (+${bonus} điểm sau khi chốt buổi).`,
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
    const nowStr = new Date().toLocaleDateString('vi-VN')

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

      switch (rec.status) {
        case 'present_on_time':
          criterion = 'C07'
          reason = `Tham gia họp/sự kiện CLB đúng giờ (${evt.title})`
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
      const basePts =
        rec.status === 'present_on_time' && evt.pointBonus !== undefined && evt.pointBonus > 0
          ? evt.pointBonus
          : rule.base_points

      const calc = calculateScoreDelta({
        ruleCode: criterion,
        basePoints: basePts,
        isCoreAtEvent: m.is_core,
        currentScore: m.current_score,
      })

      change = calc.actualDelta
      totalApplied++

      // Lưu lại bản ghi điểm đã duyệt
      newLedgerRecords.push({
        id: `checkin-${evt.id}-${m.member_code}`,
        memberCode: m.member_code,
        memberName: m.full_name,
        memberDept: m.department_name,
        isCore: m.is_core,
        criterionCode: criterion,
        criterionName: rule.name,
        points: change,
        reason,
        proposedBy: `${finalizedByName} (Chốt điểm danh)`,
        proposedByRole: 'bcn',
        status: 'approved',
        createdAt: nowStr,
      })

      const newT02Count = criterion === 'T02' ? m.absent_count_t02 + 1 : m.absent_count_t02

      return {
        ...m,
        current_score: calc.scoreAfter,
        absent_count_t02: newT02Count,
      }
    })

    // Cập nhật danh sách thành viên với bảng xếp hạng mới
    setMembers(getRankedMembers(updatedMembers))

    // Thêm các bản ghi mới vào sổ cái
    setProposals((prev) => [...newLedgerRecords, ...prev])

    // Đánh dấu buổi họp đã chốt
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              isFinalized: true,
              finalizedAt: new Date().toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              }),
              finalizedBy: finalizedByName,
            }
          : e
      )
    )

    return {
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
  }

  // Thành viên nộp đơn khiếu nại điểm (Q06)
  const createDispute = (data: {
    memberCode: string
    criterionCode: string
    pointsContested: number
    reason: string
    evidenceUrl: string
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
      evidenceUrl: data.evidenceUrl,
      createdAt: new Date().toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'pending_hr_review',
    }

    setDisputes((prev) => [newDisp, ...prev])
    return {
      success: true,
      message: 'Đã gửi khiếu nại thành công! Ban Nhân sự sẽ tiến hành xác minh trong vòng 48h.',
    }
  }

  // Ban Nhân sự thẩm định khiếu nại và chuyển BCN
  const reviewDisputeByHR = (disputeId: string, hrNote: string) => {
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disputeId
          ? {
              ...d,
              hrNote,
              status: 'pending_bcn',
            }
          : d
      )
    )
  }

  // Ban Chủ nhiệm ra quyết định khiếu nại cuối cùng
  const resolveDisputeByBCN = (
    disputeId: string,
    approved: boolean,
    verdict: string
  ) => {
    const disp = disputes.find((d) => d.id === disputeId)
    if (!disp) return { success: false, message: 'Khiếu nại không tồn tại' }

    if (approved) {
      // Hoàn lại điểm cho thành viên (cộng bù lại số điểm đã bị trừ)
      const refundPoints = Math.abs(disp.pointsContested)

      setMembers((prev) =>
        getRankedMembers(
          prev.map((m) => {
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
      )

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
        createdAt: 'Vừa xong',
      }
      setProposals((prev) => [refundRecord, ...prev])
    }

    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disputeId
          ? {
              ...d,
              status: approved ? 'approved_resolved' : 'rejected',
              bcnVerdict: verdict,
              resolvedAt: new Date().toLocaleDateString('vi-VN'),
            }
          : d
      )
    )

    return {
      success: true,
      message: approved
        ? `Đã chấp thuận khiếu nại và hoàn trả điểm cho ${disp.memberName}!`
        : `Đã bác bỏ khiếu nại của ${disp.memberName}.`,
    }
  }

  // Ban Chủ nhiệm chốt kỳ & reset điểm tháng mới về mốc 60 điểm
  const resetMonthlyScores = (newMonthLabel: string, actorName: string) => {
    setMembers((prev) =>
      getRankedMembers(
        prev.map((m) => ({
          ...m,
          current_score: 60, // Reset chuẩn 60 điểm
          absent_count_t02: 0,
          delta_rank: 0,
        }))
      )
    )

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
      createdAt: 'Vừa xong',
    }
    setProposals((prev) => [logItem, ...prev])

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

    // Kiểm tra xem chu kỳ đã tồn tại chưa
    const existing = periods.find((p) => p.id === targetId)
    if (existing) {
      return {
        success: false,
        message: `Chu kỳ Tháng ${monthStr}/${data.year} đã tồn tại trong danh mục thi đua!`,
      }
    }

    const newPeriod = createMonthlyPeriodItem(
      data.month,
      data.year,
      data.name,
      data.description,
      data.actorName
    )

    // Thêm chu kỳ mới vào danh sách (đưa lên đầu)
    setPeriods((prev) => [newPeriod, ...prev])

    // Khởi tạo sổ cái điểm chu kỳ mới: toàn bộ 48 thành viên bắt đầu từ mức 60đ chuẩn
    setCustomPeriodScores((prev) => ({
      ...prev,
      [newPeriod.id]: {},
    }))

    setCurrentActivePeriodId(newPeriod.id)
    setCurrentActiveMonth(newPeriod.name)

    // Thêm bản ghi thông báo hệ thống
    const logItem: ProposalItem = {
      id: `sys-period-${Date.now()}`,
      memberCode: 'ALL-CLUB',
      memberName: 'Toàn bộ 48 Thành viên',
      memberDept: 'Toàn Câu Lạc bộ',
      isCore: false,
      criterionCode: 'C01',
      criterionName: `Khởi tạo chu kỳ: ${newPeriod.name}`,
      points: 0,
      periodId: newPeriod.id,
      periodName: newPeriod.name,
      reason: `Ban Chủ nhiệm (${data.actorName}) đã khởi tạo chu kỳ thi đua ${newPeriod.name} theo thời gian thực (${newPeriod.timeRange}). Tất cả 48 thành viên bắt đầu từ mốc 60 điểm chuẩn thi đua.`,
      proposedBy: data.actorName,
      proposedByRole: 'Ban Chủ nhiệm',
      status: 'approved',
      createdAt: 'Vừa xong',
    }
    setProposals((prev) => [logItem, ...prev])

    return {
      success: true,
      message: `Đã khởi tạo thành công chu kỳ thi đua "${newPeriod.name}" theo thời gian thực! Mốc xuất phát 60 điểm toàn CLB.`,
      period: newPeriod,
    }
  }

  // Khóa sổ điểm chu kỳ (Ban Chủ nhiệm chốt tháng)
  const lockMonthPeriod = (periodId: string, actorName: string) => {
    const target = periods.find((p) => p.id === periodId)
    if (!target) return { success: false, message: 'Không tìm thấy chu kỳ!' }

    const now = new Date()
    const lockedAt = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    setPeriods((prev) =>
      prev.map((p) =>
        p.id === periodId
          ? {
              ...p,
              status: 'locked',
              isFinalized: true,
              lockedAt,
              lockedBy: actorName,
            }
          : p
      )
    )

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
      createdAt: 'Vừa xong',
    }
    setProposals((prev) => [logItem, ...prev])

    return {
      success: true,
      message: `Đã khóa sổ điểm chu kỳ "${target.name}"! Toàn bộ điểm số được đóng băng công bằng.`,
    }
  }

  // Mở khóa lại chu kỳ (Trường hợp BCN cần điều chỉnh)
  const unlockMonthPeriod = (periodId: string, actorName: string) => {
    const target = periods.find((p) => p.id === periodId)
    if (!target) return { success: false, message: 'Không tìm thấy chu kỳ!' }

    setPeriods((prev) =>
      prev.map((p) =>
        p.id === periodId
          ? {
              ...p,
              status: 'active',
              isFinalized: false,
              lockedAt: undefined,
              lockedBy: undefined,
            }
          : p
      )
    )

    return {
      success: true,
      message: `Đã mở khóa lại chu kỳ "${target.name}". Cổng chấm điểm tiếp tục mở cho Ban Nhân sự và BCN.`,
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
        localStorage.setItem('issac_events_v4', JSON.stringify(updated))
      } catch (e) {
        console.error('Error saving events:', e)
      }
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
        localStorage.setItem('issac_events_v4', JSON.stringify(updated))
      } catch (err) {
        console.error(err)
      }
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
        localStorage.setItem('issac_events_v4', JSON.stringify(updated))
      } catch (err) {
        console.error(err)
      }
    }

    return {
      success: true,
      message: 'Đã hủy đăng ký sự kiện thành công.',
    }
  }

  // Xóa sự kiện
  const deleteEvent = (eventId: string) => {
    const updated = events.filter((e) => e.id !== eventId)
    setEvents(updated)
    if (activeEventId === eventId && updated.length > 0) {
      setActiveEventId(updated[0].id)
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('issac_events_v4', JSON.stringify(updated))
      } catch (err) {
        console.error(err)
      }
    }
    return { success: true, message: 'Đã xóa sự kiện khỏi hệ thống.' }
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
        lockMonthPeriod,
        unlockMonthPeriod,
        customRules,
        addCustomRule,
        deleteCustomRule,
        activeEventId,
        setActiveEventId,
        createUpcomingEvent,
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
