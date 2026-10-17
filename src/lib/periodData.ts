// ============================================================
// iSSAC_Web - Multi-Period Scoring & Real-Time Monthly Management
// Hỗ trợ thiết lập chu kỳ tháng mới theo thời gian thực (ví dụ 10/2026)
// Cơ chế: Ban Nhân sự chọn tháng đang mở để cho điểm
// Ban Chủ nhiệm chốt tháng xong thì KHÓA SỔ ĐIỂM (Locked) để bảo toàn công bằng
// ============================================================

import type { RosterMember } from './clubData'
import { INITIAL_MEMBERS } from './clubData'
import { getRatingLevel } from './scoring/constants'
import type { RatingLevelName } from '@/types/database'
import { formatVietnamDateTime } from './vietnamTime'

export const STANDARD_MONTHLY_BASELINE = 60

export type PeriodScope = 'month' | 'quarter' | 'year'
export type PeriodStatus = 'active' | 'locked' | 'planned'

export interface PeriodItem {
  id: string
  scope: PeriodScope
  name: string
  shortLabel: string
  description: string
  timeRange: string
  status: PeriodStatus // 'active' (đang mở cho điểm) | 'locked' (đã khóa sổ bởi BCN) | 'planned'
  isCurrent?: boolean
  isFinalized?: boolean
  lockedAt?: string
  lockedBy?: string
  createdAt?: string
}

// Danh mục các chu kỳ thi đua chuẩn của iSSAC
export const AVAILABLE_PERIODS: PeriodItem[] = [
  // Theo Tháng
  {
    id: 'month-2026-10',
    scope: 'month',
    name: 'Tháng 10/2026',
    shortLabel: 'T10/2026',
    description: 'Chu kỳ thi đua cao điểm Chào tân sinh viên QH-2026 & Phát động phong trào Đại sứ',
    timeRange: '01/10/2026 - 31/10/2026',
    status: 'active', // Đang mở cổng chấm điểm
    isCurrent: true,
    isFinalized: false,
    createdAt: '01/10/2026 00:00',
  },
  {
    id: 'month-2025-10',
    scope: 'month',
    name: 'Tháng 10/2025',
    shortLabel: 'T10/2025',
    description: 'Chu kỳ thi đua cao điểm Chào tân sinh viên QH-2025 & Gala Chào mừng',
    timeRange: '01/10/2025 - 31/10/2025',
    status: 'locked', // Đã được BCN khóa sổ
    isCurrent: false,
    isFinalized: true,
    lockedAt: '31/10/2025 23:59',
    lockedBy: 'Nguyễn Thị Hồng Hân (Chủ nhiệm)',
    createdAt: '01/10/2025 00:00',
  },
  {
    id: 'month-2025-09',
    scope: 'month',
    name: 'Tháng 09/2025',
    shortLabel: 'T09/2025',
    description: 'Chu kỳ Khai giảng năm học mới & Chiến dịch Tuyển quân đợt 1',
    timeRange: '01/09/2025 - 30/09/2025',
    status: 'locked', // Đã được BCN khóa sổ
    isCurrent: false,
    isFinalized: true,
    lockedAt: '30/09/2025 23:59',
    lockedBy: 'Nguyễn Thị Hồng Hân (Chủ nhiệm)',
  },
  {
    id: 'month-2025-08',
    scope: 'month',
    name: 'Tháng 08/2025',
    shortLabel: 'T08/2025',
    description: 'Chu kỳ Tập huấn kỹ năng Đại sứ & Tiếp sức Mùa thi VNU-IS',
    timeRange: '01/08/2025 - 31/08/2025',
    status: 'locked', // Đã được BCN khóa sổ
    isCurrent: false,
    isFinalized: true,
    lockedAt: '31/08/2025 23:59',
    lockedBy: 'Nguyễn Thị Hồng Hân (Chủ nhiệm)',
  },

  // Theo Quý
  {
    id: 'quarter-2026-q4',
    scope: 'quarter',
    name: 'Quý 4/2026 (Tháng 10 - 12)',
    shortLabel: 'Quý 4/2026',
    description: 'Tổng kết thi đua Quý 4: Chuỗi hoạt động Chào tân & Ngày hội Hướng nghiệp',
    timeRange: '01/10/2026 - 31/12/2026',
    status: 'active',
    isCurrent: true,
    isFinalized: false,
  },
  {
    id: 'quarter-2025-q4',
    scope: 'quarter',
    name: 'Quý 4/2025 (Tháng 10 - 12)',
    shortLabel: 'Quý 4/2025',
    description: 'Tổng kết thi đua Quý 4: Chuỗi hoạt động Chào tân & Ngày hội Hướng nghiệp',
    timeRange: '01/10/2025 - 31/12/2025',
    status: 'locked',
    isCurrent: false,
    isFinalized: true,
  },
  {
    id: 'quarter-2025-q3',
    scope: 'quarter',
    name: 'Quý 3/2025 (Tháng 7 - 9)',
    shortLabel: 'Quý 3/2025',
    description: 'Tổng kết thi đua Quý 3: Mùa hè tình nguyện, Tiếp sức tư vấn tuyển sinh',
    timeRange: '01/07/2025 - 30/09/2025',
    status: 'locked',
    isCurrent: false,
    isFinalized: true,
    lockedAt: '30/09/2025 23:59',
    lockedBy: 'Ban Chủ nhiệm CLB',
  },

  // Theo Năm / Toàn nhiệm kỳ
  {
    id: 'year-2026-2027',
    scope: 'year',
    name: 'Nhiệm kỳ 2026 - 2027 (Cả năm)',
    shortLabel: 'Năm 2026-2027',
    description: 'Toàn bộ năm hoạt động: Xét khen thưởng Đoàn - Hội & Danh hiệu Đại sứ tiêu biểu',
    timeRange: '01/08/2026 - 31/07/2027',
    status: 'active',
    isCurrent: true,
    isFinalized: false,
  },
  {
    id: 'year-2025-2026',
    scope: 'year',
    name: 'Nhiệm kỳ 2025 - 2026 (Cả năm)',
    shortLabel: 'Năm 2025-2026',
    description: 'Toàn bộ năm hoạt động: Xét khen thưởng Đoàn - Hội & Danh hiệu Đại sứ tiêu biểu',
    timeRange: '01/08/2025 - 31/07/2026',
    status: 'locked',
    isCurrent: false,
    isFinalized: true,
  },
]

/**
 * Khởi tạo chu kỳ tháng thi đua mới theo thời gian thực (ví dụ: Tháng 10/2026)
 * @param month Số tháng (1-12)
 * @param year Năm (ví dụ: 2026)
 * @param name Tên chu kỳ tùy chọn
 * @param description Mô tả/mục tiêu chu kỳ
 * @param creatorName Người khởi tạo (Ban Chủ nhiệm)
 */
export function createMonthlyPeriodItem(
  month: number,
  year: number,
  name?: string,
  description?: string,
  creatorName?: string
): PeriodItem {
  const monthStr = String(month).padStart(2, '0')
  const periodId = `month-${year}-${monthStr}`
  // Tính ngày cuối cùng của tháng
  const daysInMonth = new Date(year, month, 0).getDate()
  const timeRange = `01/${monthStr}/${year} - ${daysInMonth}/${monthStr}/${year}`
  const defaultName = `Tháng ${monthStr}/${year}`
  const shortLabel = `T${monthStr}/${year}`

  const createdAt = formatVietnamDateTime()

  return {
    id: periodId,
    scope: 'month',
    name: name?.trim() ? name.trim() : defaultName,
    shortLabel,
    description: description?.trim()
      ? description.trim()
      : `Chu kỳ thi đua ${defaultName} theo thời gian thực - Mốc xuất phát 60 điểm toàn CLB`,
    timeRange,
    status: 'active',
    isCurrent: true,
    isFinalized: false,
    createdAt: creatorName ? `${createdAt} bởi ${creatorName}` : createdAt,
  }
}

/**
 * Kiểm tra xem một chu kỳ có đang bị khóa sổ bởi BCN hay không
 */
export function isPeriodLocked(periodId: string, periods: PeriodItem[] = AVAILABLE_PERIODS): boolean {
  const found = periods.find((p) => p.id === periodId)
  return found?.status === 'locked'
}

// Delta điểm lịch sử Tháng 09/2025 (Đã khóa sổ)
export const SEPTEMBER_2025_DELTAS: Record<string, number> = {
  'STAFF-001': 35, // Nguyễn Thị Hồng Hân: 95đ (#1)
  '23070691': 32,  // Giang Lê Hiệp: 92đ (#2)
  '24310069': 31,  // Lê Trần Thuỷ Nguyên: 91đ (#3)
  '24310088': 29,  // Trần Đức Thắng: 89đ (#4)
  '24310108': 27,  // Hoàng Triều Xuân: 87đ (#5)
  '24070752': 25,  // Phùng Thị Thu Hiền: 85đ (#6)
  '25070407': 24,  // Vũ Đình Hải: 84đ (#7)
  '25070345': 23,  // Lâm Thị Bình Dương: 83đ (#8)
  '24070622': 22,  // Nguyễn Ngọc Anh: 82đ (#9)
  '23071317': 21,  // Nguyễn Thị Hải Yến (NS): 81đ (#10)
  '22073125': 21,  // Nguyễn Trịnh Minh Trang: 81đ
  '24310099': 20,  // Lê Duy Tuấn: 80đ
  '23071234': 19,  // Nguyễn Thu Thảo: 79đ
  '24070680': 18,  // Phương Gia Huy: 78đ
  '26070440': 18,  // Nguyễn Khánh Linh (NS): 78đ
  '24070753': 17,  // Hoàng Thị Khánh Linh: 77đ
  '24310072': 17,  // Nguyễn Thị Nguyệt: 77đ
  '25070203': 16,  // Hoàng Thị Tú An: 76đ
  '25071139': 16,  // Hoàng Mẫn Quỳnh Chi: 76đ
  '26070775': 15,  // Trần Bùi Thanh Thuỷ: 75đ
  '25070278': 15,  // Đinh Tấn Tài: 75đ
  '25071210': 14,  // Nguyễn Vũ Hồng Hạnh: 74đ
  '23070355': 14,  // Vũ Bá Quốc Hưng: 74đ
  '26070773': 13,  // Nguyễn Thanh Tùng: 73đ
  '24310078': 13,  // Nguyễn Tố Như: 73đ
  '24070659': 12,  // Nguyễn Thị Thuỳ Dương: 72đ
  '26070162': 12,  // Ngô Ánh Dương: 72đ
  '24070676': 11,  // Phan Thành Đạt: 71đ
  '25070088': 11,  // Nguyễn Nhật Ánh: 71đ
  '26070774': 11,  // Tô Mai Trang: 71đ
  '25070097': 10,  // Phạm Thị Hải Chi: 70đ
  '24070608': 10,  // Nguyễn Phú Cường: 70đ
  '24071358': 10,  // Vũ Gia Linh: 70đ
  '26070437': 9,   // Lê Mai Anh: 69đ
  '24070778': 9,   // Phùng Đình Thiệp: 69đ
  '25070868': 8,   // Nguyễn Phương Thảo: 68đ
  '24070732': 7,   // Nguyễn Thành Trung: 67đ
  '25070267': 6,   // Nguyễn Thị Hải Yến: 66đ
  '24070845': 5,   // Nguyễn Thị Linh Chi: 65đ
  '25070014': 5,   // Lê Hoàng Anh: 65đ
  '25071191': 4,   // Nguyễn Ngọc Anh Thư: 64đ
  '25070860': 3,   // Hoàng Thị Thuỳ Linh: 63đ
  '25070857': 3,   // Trần Mỹ Ngọc: 63đ
  '25070863': 2,   // Nguyễn Duy Khánh: 62đ
  '25071203': 1,   // Lục Xuân Huy: 61đ
  '25070193': 0,   // Phạm Thị Phương Thảo: 60đ
  '26070772': -1,  // Bùi Phương Linh: 59đ
}

// Delta điểm lịch sử Tháng 08/2025 (Đã khóa sổ)
export const AUGUST_2025_DELTAS: Record<string, number> = {
  '24310088': 34,  // Trần Đức Thắng: 94đ (#1)
  '23070691': 30,  // Giang Lê Hiệp: 90đ (#2)
  '24310108': 28,  // Hoàng Triều Xuân: 88đ (#3)
  'STAFF-001': 27, // Nguyễn Thị Hồng Hân: 87đ (#4)
  '24070752': 26,  // Phùng Thị Thu Hiền: 86đ (#5)
  '24310069': 25,  // Lê Trần Thuỷ Nguyên: 85đ (#6)
  '24310099': 24,  // Lê Duy Tuấn: 84đ (#7)
  '22073125': 23,  // Nguyễn Trịnh Minh Trang: 83đ (#8)
  '25070407': 22,  // Vũ Đình Hải: 82đ (#9)
  '24070680': 21,  // Phương Gia Huy: 81đ (#10)
  '23071317': 20,  // Nguyễn Thị Hải Yến (NS): 80đ
  '25070345': 19,  // Lâm Thị Bình Dương: 79đ
  '24070622': 19,  // Nguyễn Ngọc Anh: 79đ
  '23071234': 18,  // Nguyễn Thu Thảo: 78đ
  '26070440': 17,  // Nguyễn Khánh Linh (NS): 77đ
  '24070753': 16,  // Hoàng Thị Khánh Linh: 76đ
  '24310072': 16,  // Nguyễn Thị Nguyệt: 76đ
  '25070203': 15,  // Hoàng Thị Tú An: 75đ
  '25071139': 15,  // Hoàng Mẫn Quỳnh Chi: 75đ
  '26070775': 15,  // Trần Bùi Thanh Thuỷ: 75đ
  '25070278': 14,  // Đinh Tấn Tài: 74đ
  '25071210': 14,  // Nguyễn Vũ Hồng Hạnh: 74đ
  '23070355': 13,  // Vũ Bá Quốc Hưng: 73đ
  '26070773': 13,  // Nguyễn Thanh Tùng: 73đ
  '24310078': 12,  // Nguyễn Tố Như: 72đ
  '24070659': 12,  // Nguyễn Thị Thuỳ Dương: 72đ
  '26070162': 11,  // Ngô Ánh Dương: 71đ
  '24070676': 11,  // Phan Thành Đạt: 71đ
  '25070088': 10,  // Nguyễn Nhật Ánh: 70đ
  '26070774': 10,  // Tô Mai Trang: 70đ
  '25070097': 9,   // Phạm Thị Hải Chi: 69đ
  '24070608': 9,   // Nguyễn Phú Cường: 69đ
  '24071358': 8,   // Vũ Gia Linh: 68đ
  '26070437': 8,   // Lê Mai Anh: 68đ
  '24070778': 7,   // Phùng Đình Thiệp: 67đ
  '25070868': 7,   // Nguyễn Phương Thảo: 67đ
  '24070732': 6,   // Nguyễn Thành Trung: 66đ
  '25070267': 6,   // Nguyễn Thị Hải Yến: 66đ
  '24070845': 5,   // Nguyễn Thị Linh Chi: 65đ
  '25070014': 5,   // Lê Hoàng Anh: 65đ
  '25071191': 4,   // Nguyễn Ngọc Anh Thư: 64đ
  '25070860': 4,   // Hoàng Thị Thuỳ Linh: 64đ
  '25070857': 3,   // Trần Mỹ Ngọc: 63đ
  '25070863': 3,   // Nguyễn Duy Khánh: 63đ
  '25071203': 2,   // Lục Xuân Huy: 62đ
  '25070193': 1,   // Phạm Thị Phương Thảo: 61đ
  '26070772': 0,   // Bùi Phương Linh: 60đ
}

export interface MemberPeriodRanking {
  member: RosterMember
  baseScore: number
  earnedDelta: number
  finalScore: number
  rankInPeriod: number
  rankInDepartment: number
  deltaRank: number
  ratingLevel: RatingLevelName
  periodId: string
  periodName: string
  isLocked: boolean
  note?: string
}

/**
 * Tính toán bảng xếp hạng của 48 thành viên theo chu kỳ được chọn
 * @param periodId ID của chu kỳ (ví dụ: 'month-2025-10', 'month-2026-10', 'quarter-2025-q3')
 * @param activeMembers Danh sách thành viên hiện tại trong Context
 * @param periods Danh mục chu kỳ mở rộng từ context
 * @param customPeriodDeltas Bảng điểm lưu cho các tháng mới tạo
 */
export function calculatePeriodLeaderboard(
  periodId: string,
  activeMembers: RosterMember[],
  periods: PeriodItem[] = AVAILABLE_PERIODS,
  customPeriodDeltas: Record<string, Record<string, number>> = {}
): MemberPeriodRanking[] {
  const currentPeriod = periods.find((p) => p.id === periodId) || periods[0]
  const isLocked = currentPeriod?.status === 'locked'

  // 1. Nếu chu kỳ có lưu delta tùy chỉnh trong sổ cái customPeriodDeltas
  const periodCustomDeltas = customPeriodDeltas[periodId]
  const hasCustomDeltas = periodCustomDeltas && Object.keys(periodCustomDeltas).length > 0

  if (hasCustomDeltas) {
    const list = activeMembers.map((m) => {
      const delta = periodCustomDeltas[m.member_code] ?? (m.current_score - STANDARD_MONTHLY_BASELINE)
      const finalScore = STANDARD_MONTHLY_BASELINE + delta
      return {
        member: m,
        baseScore: STANDARD_MONTHLY_BASELINE,
        earnedDelta: delta,
        finalScore,
      }
    })

    list.sort((a, b) => b.finalScore - a.finalScore || a.member.source_stt - b.member.source_stt)

    const deptMap: Record<string, number> = {}
    return list.map((item, idx) => {
      deptMap[item.member.department_slug] = (deptMap[item.member.department_slug] || 0) + 1
      const rating = getRatingLevel(item.finalScore).level_name as RatingLevelName
      return {
        ...item,
        rankInPeriod: idx + 1,
        rankInDepartment: deptMap[item.member.department_slug],
        deltaRank: item.member.delta_rank || 0,
        ratingLevel: rating,
        periodId,
        periodName: currentPeriod?.name || 'Tháng 10/2026',
        isLocked,
        note: isLocked ? 'Đã khóa sổ bởi BCN' : 'Đang mở chấm điểm',
      }
    })
  }

  // 2. Chu kỳ đang mở (active/current): phản ánh trực tiếp điểm số thực tế của activeMembers
  if (!isLocked && (currentPeriod?.isCurrent || periodId.startsWith('month-2026') || periodId.startsWith('quarter-2026') || periodId === 'month-2026-10')) {
    const sorted = [...activeMembers].sort((a, b) => b.current_score - a.current_score || a.source_stt - b.source_stt)
    const deptMap: Record<string, number> = {}

    return sorted.map((m, idx) => {
      deptMap[m.department_slug] = (deptMap[m.department_slug] || 0) + 1
      const delta = m.current_score - STANDARD_MONTHLY_BASELINE
      const rating = getRatingLevel(m.current_score).level_name as RatingLevelName

      return {
        member: m,
        baseScore: STANDARD_MONTHLY_BASELINE,
        earnedDelta: delta,
        finalScore: m.current_score,
        rankInPeriod: idx + 1,
        rankInDepartment: deptMap[m.department_slug],
        deltaRank: m.delta_rank || 0,
        ratingLevel: rating,
        periodId,
        periodName: currentPeriod?.name || 'Tháng 10/2026',
        isLocked: false,
        note: 'Đang mở chấm điểm',
      }
    })
  }

  // 2. Chu kỳ Tháng 09/2025 (Đã khóa sổ)
  if (periodId === 'month-2025-09') {
    const list = activeMembers.map((m) => {
      const delta = SEPTEMBER_2025_DELTAS[m.member_code] ?? 10
      const finalScore = STANDARD_MONTHLY_BASELINE + delta
      return {
        member: m,
        baseScore: STANDARD_MONTHLY_BASELINE,
        earnedDelta: delta,
        finalScore,
      }
    })

    list.sort((a, b) => b.finalScore - a.finalScore)

    const deptMap: Record<string, number> = {}
    return list.map((item, idx) => {
      deptMap[item.member.department_slug] = (deptMap[item.member.department_slug] || 0) + 1
      const rating = getRatingLevel(item.finalScore).level_name as RatingLevelName
      return {
        ...item,
        rankInPeriod: idx + 1,
        rankInDepartment: deptMap[item.member.department_slug],
        deltaRank: idx === 0 ? 1 : idx === 1 ? -1 : 0,
        ratingLevel: rating,
        periodId,
        periodName: 'Tháng 09/2025',
        isLocked: true,
        note: 'Đã khóa sổ bởi BCN',
      }
    })
  }

  // 3. Chu kỳ Tháng 08/2025 (Đã khóa sổ)
  if (periodId === 'month-2025-08') {
    const list = activeMembers.map((m) => {
      const delta = AUGUST_2025_DELTAS[m.member_code] ?? 8
      const finalScore = STANDARD_MONTHLY_BASELINE + delta
      return {
        member: m,
        baseScore: STANDARD_MONTHLY_BASELINE,
        earnedDelta: delta,
        finalScore,
      }
    })

    list.sort((a, b) => b.finalScore - a.finalScore)

    const deptMap: Record<string, number> = {}
    return list.map((item, idx) => {
      deptMap[item.member.department_slug] = (deptMap[item.member.department_slug] || 0) + 1
      const rating = getRatingLevel(item.finalScore).level_name as RatingLevelName
      return {
        ...item,
        rankInPeriod: idx + 1,
        rankInDepartment: deptMap[item.member.department_slug],
        deltaRank: 0,
        ratingLevel: rating,
        periodId,
        periodName: 'Tháng 08/2025',
        isLocked: true,
        note: 'Đã khóa sổ bởi BCN',
      }
    })
  }

  // 4. Chu kỳ Quý 3/2025 (T7, T8, T9)
  if (periodId === 'quarter-2025-q3') {
    const list = activeMembers.map((m) => {
      const deltaAug = AUGUST_2025_DELTAS[m.member_code] ?? 8
      const deltaSep = SEPTEMBER_2025_DELTAS[m.member_code] ?? 10
      const deltaJul = Math.round((deltaAug + deltaSep) / 2)
      const totalQuarterEarned = deltaAug + deltaSep + deltaJul
      const avgScore = Math.round(STANDARD_MONTHLY_BASELINE + totalQuarterEarned / 3)

      return {
        member: m,
        baseScore: STANDARD_MONTHLY_BASELINE,
        earnedDelta: totalQuarterEarned,
        finalScore: avgScore,
      }
    })

    list.sort((a, b) => b.finalScore - a.finalScore || b.earnedDelta - a.earnedDelta)

    const deptMap: Record<string, number> = {}
    return list.map((item, idx) => {
      deptMap[item.member.department_slug] = (deptMap[item.member.department_slug] || 0) + 1
      const rating = getRatingLevel(item.finalScore).level_name as RatingLevelName
      return {
        ...item,
        rankInPeriod: idx + 1,
        rankInDepartment: deptMap[item.member.department_slug],
        deltaRank: idx < 3 ? 1 : 0,
        ratingLevel: rating,
        periodId,
        periodName: 'Quý 3/2025 (T7-T9)',
        isLocked: true,
        note: `Tổng tích lũy Quý: +${item.earnedDelta}đ`,
      }
    })
  }

  // 5. Chu kỳ Cả Năm / Nhiệm kỳ 2026-2027 & 2025-2026 (Tích lũy toàn diện)
  if (periodId === 'year-2026-2027' || periodId === 'year-2025-2026') {
    const is2627 = periodId === 'year-2026-2027'
    const list = activeMembers.map((m) => {
      const deltaAug = AUGUST_2025_DELTAS[m.member_code] ?? 8
      const deltaSep = SEPTEMBER_2025_DELTAS[m.member_code] ?? 10
      const deltaOct = m.current_score - STANDARD_MONTHLY_BASELINE
      const totalYearNet = deltaAug + deltaSep + deltaOct
      const avgYearScore = Math.round(STANDARD_MONTHLY_BASELINE + totalYearNet / 3)

      return {
        member: m,
        baseScore: STANDARD_MONTHLY_BASELINE,
        earnedDelta: totalYearNet,
        finalScore: avgYearScore,
      }
    })

    list.sort((a, b) => b.finalScore - a.finalScore || b.earnedDelta - a.earnedDelta)

    const deptMap: Record<string, number> = {}
    return list.map((item, idx) => {
      deptMap[item.member.department_slug] = (deptMap[item.member.department_slug] || 0) + 1
      const rating = getRatingLevel(item.finalScore).level_name as RatingLevelName
      return {
        ...item,
        rankInPeriod: idx + 1,
        rankInDepartment: deptMap[item.member.department_slug],
        deltaRank: 0,
        ratingLevel: rating,
        periodId,
        periodName: is2627 ? 'Nhiệm kỳ 2026 - 2027 (Cả năm)' : 'Nhiệm kỳ 2025 - 2026 (Cả năm)',
        isLocked: !is2627,
        note: `Tổng điểm cống hiến: +${item.earnedDelta}đ`,
      }
    })
  }

  // 6. Chu kỳ Tháng Mới Tự Do Được Tạo Trong Cài Đặt (ví dụ: Tháng 10/2026)
  const monthCustomScores = customPeriodDeltas[periodId] || {}
  const list = activeMembers.map((m) => {
    const delta = monthCustomScores[m.member_code] ?? 0
    const finalScore = STANDARD_MONTHLY_BASELINE + delta
    return {
      member: m,
      baseScore: STANDARD_MONTHLY_BASELINE,
      earnedDelta: delta,
      finalScore,
    }
  })

  list.sort((a, b) => b.finalScore - a.finalScore || a.member.source_stt - b.member.source_stt)

  const deptMap: Record<string, number> = {}
  return list.map((item, idx) => {
    deptMap[item.member.department_slug] = (deptMap[item.member.department_slug] || 0) + 1
    const rating = getRatingLevel(item.finalScore).level_name as RatingLevelName
    return {
      ...item,
      rankInPeriod: idx + 1,
      rankInDepartment: deptMap[item.member.department_slug],
      deltaRank: 0,
      ratingLevel: rating,
      periodId,
      periodName: currentPeriod?.name || periodId,
      isLocked,
      note: isLocked ? 'Đã khóa sổ bởi BCN' : 'Đang mở chấm điểm',
    }
  })
}
