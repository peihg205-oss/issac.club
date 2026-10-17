// ============================================================
// iSSAC_Web - Unit Tests: Vietnam Real-Time Clock & History Formatter
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  getVietnamTimeParts,
  formatVietnamDateTime,
  formatVietnamTime,
  formatVietnamDate,
  normalizeHistoryTimestamp,
  VIETNAM_TIMEZONE,
} from '@/lib/vietnamTime'

describe('Vietnam Real-Time Clock & History Formatter Engine', () => {
  it('1. Đảm bảo múi giờ cấu hình chuẩn là Asia/Ho_Chi_Minh (UTC+7)', () => {
    expect(VIETNAM_TIMEZONE).toBe('Asia/Ho_Chi_Minh')
  })

  it('2. Chuyển đổi mốc ISO UTC chuẩn xác sang giờ Việt Nam (UTC+7)', () => {
    // 13:45 UTC = 20:45 GMT+7
    const isoUtc = '2026-10-17T13:45:00.000Z'
    const formatted = formatVietnamDateTime(isoUtc)
    expect(formatted).toBe('20:45 17/10/2026')
  })

  it('3. Trích xuất giờ và phút theo múi giờ Việt Nam', () => {
    const isoUtc = '2026-10-17T02:30:00.000Z' // 02:30 UTC = 09:30 GMT+7
    const timeOnly = formatVietnamTime(isoUtc)
    expect(timeOnly).toBe('09:30')
  })

  it('4. Trích xuất ngày tháng năm theo định dạng Việt Nam DD/MM/YYYY', () => {
    const isoUtc = '2026-10-17T17:00:00.000Z' // 17:00 UTC = 00:00 ngày 18/10/2026 GMT+7
    const dateOnly = formatVietnamDate(isoUtc)
    expect(dateOnly).toBe('18/10/2026')
  })

  it('5. Chuẩn hóa chuỗi "Vừa xong" thành mốc thời gian thực hiện tại giờ Việt Nam', () => {
    const normalized = normalizeHistoryTimestamp('Vừa xong')
    // Định dạng phải là HH:mm DD/MM/YYYY
    expect(normalized).toMatch(/^\d{2}:\d{2}\s+\d{2}\/\d{2}\/\d{4}$/)
  })

  it('6. Giữ nguyên chuỗi đã được định dạng chuẩn giờ Việt Nam', () => {
    const existing = '20:30 17/10/2026'
    expect(normalizeHistoryTimestamp(existing)).toBe(existing)
  })

  it('7. Chuẩn hóa chuỗi rỗng hoặc undefined thành giờ Việt Nam hiện tại', () => {
    const fromEmpty = normalizeHistoryTimestamp('')
    const fromUndefined = normalizeHistoryTimestamp(undefined)

    expect(fromEmpty).toMatch(/^\d{2}:\d{2}\s+\d{2}\/\d{2}\/\d{4}$/)
    expect(fromUndefined).toMatch(/^\d{2}:\d{2}\s+\d{2}\/\d{2}\/\d{4}$/)
  })

  it('8. Trả về đúng các phần tử thời gian getVietnamTimeParts', () => {
    const parts = getVietnamTimeParts('2026-10-17T13:45:20.000Z')
    expect(parts.hour).toBe('20')
    expect(parts.minute).toBe('45')
    expect(parts.second).toBe('20')
    expect(parts.day).toBe('17')
    expect(parts.month).toBe('10')
    expect(parts.year).toBe('2026')
  })
})
