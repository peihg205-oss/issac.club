// ============================================================
// iSSAC_Web - Vietnam Real-Time Clock & History Formatter
// Múi giờ chuẩn: Asia/Ho_Chi_Minh (UTC+7)
// Đảm bảo tính toán chính xác tuyệt đối trên cả Client (Trình duyệt) và Server (Node/Next.js/Vercel)
// ============================================================

export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh'

export interface VietnamTimeParts {
  hour: string
  minute: string
  second: string
  day: string
  month: string
  year: string
}

/**
 * Trích xuất các thành phần thời gian chuẩn xác theo Múi giờ Việt Nam (UTC+7)
 */
export function getVietnamTimeParts(inputDate?: Date | string | number): VietnamTimeParts {
  let d: Date

  if (!inputDate) {
    d = new Date()
  } else if (typeof inputDate === 'string') {
    const trimmed = inputDate.trim()
    if (trimmed === 'Vừa xong' || !trimmed) {
      d = new Date()
    } else if (trimmed.includes('T') || trimmed.includes('-')) {
      const parsed = new Date(trimmed)
      d = isNaN(parsed.getTime()) ? new Date() : parsed
    } else {
      // Chuỗi khác không parse được thành Date ISO
      d = new Date()
    }
  } else if (typeof inputDate === 'number') {
    d = new Date(inputDate)
  } else {
    d = inputDate
  }

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: VIETNAM_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false,
  })

  const parts = formatter.formatToParts(d)
  const map: Record<string, string> = {}
  for (const part of parts) {
    map[part.type] = part.value
  }

  return {
    hour: map.hour || '00',
    minute: map.minute || '00',
    second: map.second || '00',
    day: map.day || '01',
    month: map.month || '01',
    year: map.year || '2026',
  }
}

/**
 * Lấy chuỗi ngày giờ hiện tại chuẩn giờ Việt Nam: "HH:mm DD/MM/YYYY" (VD: "21:30 17/10/2026")
 */
export function getVietnamNowFormatted(): string {
  const p = getVietnamTimeParts()
  return `${p.hour}:${p.minute} ${p.day}/${p.month}/${p.year}`
}

/**
 * Lấy giờ phút hiện tại chuẩn giờ Việt Nam: "HH:mm" (VD: "21:30")
 */
export function getVietnamNowTimeFormatted(): string {
  const p = getVietnamTimeParts()
  return `${p.hour}:${p.minute}`
}

/**
 * Lấy ngày tháng năm hiện tại chuẩn giờ Việt Nam: "DD/MM/YYYY" (VD: "17/10/2026")
 */
export function getVietnamNowDateFormatted(): string {
  const p = getVietnamTimeParts()
  return `${p.day}/${p.month}/${p.year}`
}

/**
 * Định dạng giờ phút cho bất kỳ thời điểm nào: "HH:mm"
 */
export function formatVietnamTime(input?: Date | string | number): string {
  const p = getVietnamTimeParts(input)
  return `${p.hour}:${p.minute}`
}

/**
 * Định dạng ngày tháng năm cho bất kỳ thời điểm nào: "DD/MM/YYYY"
 */
export function formatVietnamDate(input?: Date | string | number): string {
  const p = getVietnamTimeParts(input)
  return `${p.day}/${p.month}/${p.year}`
}

/**
 * Định dạng bất kỳ Date/timestamp/string nào sang "HH:mm DD/MM/YYYY" theo giờ Việt Nam
 */
export function formatVietnamDateTime(input?: Date | string | number): string {
  if (typeof input === 'string') {
    const trimmed = input.trim()
    // Nếu chuỗi đã có định dạng giờ Việt Nam hoàn chỉnh, giữ nguyên
    if (/^\d{2}:\d{2}\s+\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return trimmed
    }
    if (/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}$/.test(trimmed)) {
      return trimmed
    }
  }
  const p = getVietnamTimeParts(input)
  return `${p.hour}:${p.minute} ${p.day}/${p.month}/${p.year}`
}

/**
 * Định dạng ngày giờ kèm giây theo giờ Việt Nam: "HH:mm:ss DD/MM/YYYY"
 */
export function formatVietnamDateTimeWithSeconds(input?: Date | string | number): string {
  const p = getVietnamTimeParts(input)
  return `${p.hour}:${p.minute}:${p.second} ${p.day}/${p.month}/${p.year}`
}

/**
 * Chuẩn hóa chuỗi thời gian lịch sử:
 * Nếu là 'Vừa xong' hoặc rỗng thì tự động gán thời gian thực hiện tại theo giờ Việt Nam.
 * Nếu là dạng ISO "2026-10-17T13:30:00Z" thì chuyển về "HH:mm DD/MM/YYYY" theo giờ Việt Nam.
 */
export function normalizeHistoryTimestamp(timeStr?: string): string {
  if (!timeStr || timeStr === 'Vừa xong' || timeStr.trim() === '') {
    return getVietnamNowFormatted()
  }
  const trimmed = timeStr.trim()
  // Nếu là dạng ISO datetime
  if (trimmed.includes('T') && (trimmed.includes('Z') || trimmed.includes('+'))) {
    return formatVietnamDateTime(trimmed)
  }
  // Nếu đã là "HH:mm DD/MM/YYYY" hoặc "DD/MM/YYYY HH:mm"
  if (/^\d{2}:\d{2}\s+\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return trimmed
  }
  if (/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed
  }
  // Nếu chỉ có ngày "DD/MM/YYYY", thêm giờ hiện tại của Việt Nam để lịch sử hiển thị đầy đủ
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return `${getVietnamNowTimeFormatted()} ${trimmed}`
  }
  return trimmed
}
