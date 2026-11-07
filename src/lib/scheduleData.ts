// iSSAC Activity Schedule & Master Plan 2026 - 2027
// Data strictly reflecting Image 1 (University Timetable Portal) and Image 2 (iSSAC Plan 2026 - 2027)

export interface ActivityItem {
  id: string
  code: string
  title: string
  quarter: string // 'Quý 1', 'Quý 2', etc.
  month: string // 'Tháng 9/2026', 'Tháng 10/2026', etc.
  timeStart: string // Image 2 column Time start (e.g. '18/9', '15/10', '4/11 (TT)')
  timeEnd: string // Image 2 column Time end (e.g. '05/10', '22/10', 'Cùng ngày')
  date: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
  dayOfWeek: number // 1: T2, 2: T3, 3: T4, 4: T5, 5: T6, 6: T7, 0: CN
  session: 'morning' | 'afternoon' | 'evening' // Ca Sáng, Ca Chiều, Ca Tối
  period?: string // 'Tiết: 1 - 3', 'Tiết: 4 - 6', 'Tiết: 10 - 12'
  time: string // Giờ hoạt động, vd: '09:50 - 12:30'
  lead: string // Lead: Who (vd: 'Giang Lê Hiệp', 'PGS.TS Trần Thị Ngân', 'Lê Trần Thuỷ Nguyên')
  room: string // Tại phòng gì đó (vd: 'Phòng 514, số 1 Phan Tây Nhạc')
  category: 'training' | 'meeting' | 'recruitment' | 'event' | 'gala'
  categoryLabel: string
  department: string
  done: boolean // Checkbox Done in Image 2
  notes?: string
  colorTheme?: 'blue' | 'purple' | 'amber' | 'emerald' | 'cyan' | 'rose'
}

export const INITIAL_ACTIVITIES: ActivityItem[] = [
  // ==========================================
  // THÁNG 9/2026 (QUÝ 1) - Row 1 in Image 2
  // ==========================================
  {
    id: 'act-01-recruitment',
    code: 'iSSAC-REC01',
    title: 'Tuyển quân CLB iSSAC gen 3.0',
    quarter: 'Quý 1',
    month: 'Tháng 9/2026',
    timeStart: '18/09',
    timeEnd: '18/09',
    date: '2026-09-18',
    dayOfWeek: 5,
    session: 'morning',
    period: 'Toàn thời gian',
    time: '08:00 - 17:30',
    lead: 'Ban Chủ nhiệm (Giang Lê Hiệp & Hồng Hân)',
    room: 'Sảnh Tòa C & Online VNUIS, số 1 Phan Tây Nhạc',
    category: 'recruitment',
    categoryLabel: 'Tuyển quân CLB',
    department: 'Toàn CLB',
    done: true,
    notes: 'Tìm kiếm nhân tố mới phù hợp với định hướng iSSAC gen 3.0',
    colorTheme: 'amber',
  },

  // ==========================================
  // THÁNG 10/2026 (QUÝ 1) - Row 2 in Image 2
  // ==========================================
  {
    id: 'act-02-first-meeting',
    code: 'iSSAC-MT01',
    title: 'First Meeting iSSAC Gen 3.0',
    quarter: 'Quý 1',
    month: 'Tháng 10/2026',
    timeStart: '22/10',
    timeEnd: '22/10',
    date: '2026-10-22',
    dayOfWeek: 4,
    session: 'evening',
    period: 'Ca Tối',
    time: '18:30 - 21:00',
    lead: 'Giang Lê Hiệp (Chủ nhiệm CLB)',
    room: 'Hội trường 101, Tòa C, số 1 Phan Tây Nhạc',
    category: 'meeting',
    categoryLabel: 'Họp toàn thể',
    department: 'Toàn CLB',
    done: true,
    notes: 'Gặp gỡ thành viên mới, phổ biến quy chế hoạt động và kết nối Đại sứ VNUIS',
    colorTheme: 'rose',
  },

  // ==========================================
  // THÁNG 11/2026 (QUÝ 1) - Row 3 in Image 2
  // ==========================================
  {
    // Row 3 in Image 2: Workshop Training 4/11 (TT)
    id: 'act-06-ws-tt',
    code: 'iSSAC-WS01',
    title: 'Workshop Training Ban Truyền thông (Design & Content)',
    quarter: 'Quý 1',
    month: 'Tháng 11/2026',
    timeStart: '4/11',
    timeEnd: '4/11',
    date: '2026-11-04',
    dayOfWeek: 3, // Thứ 4
    session: 'afternoon',
    period: 'Tiết: 7 - 9',
    time: '13:30 - 16:30',
    lead: 'Trần Đức Thắng (Trưởng ban TT)',
    room: 'Phòng 514, số 1 Phan Tây Nhạc',
    category: 'training',
    categoryLabel: 'Workshop Training',
    department: 'Ban Truyền thông',
    done: true,
    notes: 'Training kỹ năng thiết kế banner sự kiện và lên ý tưởng content truyền thông lan tỏa',
    colorTheme: 'blue',
  },
  {
    // Row 3 in Image 2: Workshop Training 5/11 (TT/TV)
    id: 'act-07-ws-tv-ns',
    code: 'iSSAC-WS02',
    title: 'Workshop Training Ban Tư vấn & Nhân sự',
    quarter: 'Quý 1',
    month: 'Tháng 11/2026',
    timeStart: '5/11',
    timeEnd: '5/11',
    date: '2026-11-05',
    dayOfWeek: 4, // Thứ 5
    session: 'afternoon',
    period: 'Tiết: 8 - 10',
    time: '14:00 - 17:00',
    lead: 'Lê Trần Thuỷ Nguyên (Trưởng ban TV)',
    room: 'Phòng học 404, số 1 Phan Tây Nhạc',
    category: 'training',
    categoryLabel: 'Workshop Training',
    department: 'Ban Tư vấn',
    done: true,
    notes: 'Rèn luyện kỹ năng tư vấn tuyển sinh trực tiếp, vượt qua rào cản giao tiếp và viết mail chuyên nghiệp',
    colorTheme: 'blue',
  },
  {
    id: 'act-08-bcn-briefing',
    code: 'iSSAC-BCN01',
    title: 'Họp đánh giá hoạt động T11 và phương án kiện toàn CLB',
    quarter: 'Quý 1',
    month: 'Tháng 11/2026',
    timeStart: '8/11',
    timeEnd: '8/11',
    date: '2026-11-08',
    dayOfWeek: 0, // CN
    session: 'evening',
    period: 'Ca Tối',
    time: '19:30 - 21:30',
    lead: 'Giang Lê Hiệp (Chủ nhiệm CLB)',
    room: 'Phòng Sinh hoạt Đa năng iSSAC Hub, số 1 Phan Tây Nhạc',
    category: 'meeting',
    categoryLabel: 'Họp Ban Chủ nhiệm',
    department: 'Ban Chủ nhiệm',
    done: false,
    notes: 'Tổng kết tuần hoạt động tháng 11 và chuẩn bị phương án kiện toàn BCN',
    colorTheme: 'rose',
  },

  // ==========================================
  // THÁNG 11/2026 (QUÝ 1) - Row 4 in Image 2
  // ==========================================
  {
    id: 'act-09-conference',
    code: 'iSSAC-CF01',
    title: 'Hội nghị kiện toàn nhân sự CLB',
    quarter: 'Quý 1',
    month: 'Tháng 11/2026',
    timeStart: '26/11',
    timeEnd: '26/11',
    date: '2026-11-26',
    dayOfWeek: 4, // Thứ 5
    session: 'afternoon',
    period: 'Ca Chiều',
    time: '14:00 - 17:30',
    lead: 'Ban Chủ nhiệm & Trưởng các ban',
    room: 'Hội trường Lớn ĐHQGHN, số 1 Phan Tây Nhạc',
    category: 'meeting',
    categoryLabel: 'Hội nghị CLB',
    department: 'Toàn CLB',
    done: false,
    notes: 'Bầu và chuẩn hóa đội ngũ Ban Chủ nhiệm mới, đủ năng lực và khả năng vận hành CLB',
    colorTheme: 'rose',
  },

  // ==========================================
  // THÁNG 12/2026 (QUÝ 1) - Row 5 in Image 2
  // ==========================================
  {
    id: 'act-10-tvts-summary',
    code: 'iSSAC-SUM01',
    title: 'Tổng kết chuỗi TVTS năm học 2026 - 2027 cùng phòng TT & TS',
    quarter: 'Quý 1',
    month: 'Tháng 12/2026',
    timeStart: '15/12',
    timeEnd: '15/12',
    date: '2026-12-15',
    dayOfWeek: 2, // Thứ 3
    session: 'morning',
    period: 'Ca Sáng',
    time: '08:30 - 11:30',
    lead: 'Lê Trần Thuỷ Nguyên & Cán bộ Phòng TT&TS',
    room: 'Phòng Họp 202, Nhà G6 VNUIS, số 1 Phan Tây Nhạc',
    category: 'gala',
    categoryLabel: 'Tổng kết & Gala',
    department: 'Ban Tư vấn',
    done: false,
    notes: 'Nhìn lại 1 năm vừa rồi đã hoạt động và khen thưởng, động viên từ thầy cô cán bộ',
    colorTheme: 'emerald',
  },

  // ==========================================
  // THÁNG 12/2026 (QUÝ 1) - Row 6 in Image 2
  // ==========================================
  {
    id: 'act-11-ws-q1-gala',
    code: 'iSSAC-WS03',
    title: 'Workshop Training + Tổng kết Quý 1',
    quarter: 'Quý 1',
    month: 'Tháng 12/2026',
    timeStart: '24/12',
    timeEnd: '24/12',
    date: '2026-12-24',
    dayOfWeek: 4, // Thứ 5
    session: 'evening',
    period: 'Ca Tối',
    time: '18:30 - 21:30',
    lead: 'Giang Lê Hiệp & BCN iSSAC',
    room: 'Phòng Sinh hoạt Đa năng iSSAC Hub, số 1 Phan Tây Nhạc',
    category: 'gala',
    categoryLabel: 'Tổng kết & Gala',
    department: 'Toàn CLB',
    done: false,
    notes: 'Làm thế nào để trở thành 1 Đại sứ sinh viên VNUIS? Khen thưởng chặng 1.',
    colorTheme: 'emerald',
  },
]

// Available rooms for dropdown / suggestions
export const FAMOUS_ROOMS = [
  'Phòng 514, số 1 Phan Tây Nhạc',
  'Phòng học 404, số 1 Phan Tây Nhạc',
  'Phòng 602, số 1 Phan Tây Nhạc',
  'Hội trường 101, Tòa C, số 1 Phan Tây Nhạc',
  'Hội trường Lớn ĐHQGHN, số 1 Phan Tây Nhạc',
  'Phòng Họp 202, Nhà G6 VNUIS',
  'Phòng Sinh hoạt Đa năng iSSAC Hub',
  'Sảnh Tòa C & Online VNUIS',
]

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

// Day columns for weekly schedule (dd/MM/yyyy)
export interface WeekDayColumn {
  dayName: string // 'Thứ 2', 'Thứ 3', ...
  dayNumber: number // 1..6, 0 (CN)
  dateString: string // '02/11/2026'
  isoDate: string // '2026-11-02'
  isToday: boolean
}

// Lấy ngày hiện tại chuẩn múi giờ Việt Nam (Asia/Ho_Chi_Minh - GMT+7) dạng YYYY-MM-DD
export function getVietnamTodayIso(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    return formatter.format(new Date())
  } catch {
    const now = new Date()
    const offset = 7 * 60
    const utc = now.getTime() + now.getTimezoneOffset() * 60000
    const vnDate = new Date(utc + offset * 60000)
    const yyyy = vnDate.getFullYear()
    const mm = String(vnDate.getMonth() + 1).padStart(2, '0')
    const dd = String(vnDate.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }
}

// Lấy đối tượng Date tương ứng ngày hôm nay tại Việt Nam
export function getVietnamCurrentDate(): Date {
  const iso = getVietnamTodayIso()
  const [yyyy, mm, dd] = iso.split('-').map(Number)
  return new Date(yyyy, mm - 1, dd)
}

// Generate the 7 days of the week containing the base date
export function getWeekDays(currentDate: Date, overrideTodayStr?: string): WeekDayColumn[] {
  // Find Monday of this week
  const day = currentDate.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day // if Sunday (0), go back 6 days
  const monday = new Date(currentDate)
  monday.setDate(currentDate.getDate() + diffToMonday)

  const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
  const result: WeekDayColumn[] = []

  const todayStr = overrideTodayStr || getVietnamTodayIso()

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)

    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    const isoDate = `${yyyy}-${mm}-${dd}`

    result.push({
      dayName: dayNames[i],
      dayNumber: (i + 1) % 7,
      dateString: `${dd}/${mm}/${yyyy}`,
      isoDate,
      isToday: isoDate === todayStr,
    })
  }

  return result
}

