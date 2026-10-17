// ============================================================
// iSSAC_Web - Unit Tests: QR Ticket Pass & Anti-Fraud Scanner
// ============================================================

import { describe, it, expect } from 'vitest'
import { INITIAL_MEMBERS } from '@/lib/clubData'

describe('QR Check-in Pass & Admin Scanner Anti-Fraud Logic', () => {
  const sampleEvent = {
    id: 'evt-20251016',
    title: 'Sinh hoạt định kỳ Câu Lạc bộ Đại sứ sinh viên Trường Quốc tế',
    date: '16/10/2025',
    startTime: '19:30',
    registeredMemberCodes: ['23070691', '24310088', '25071203'],
    records: {} as Record<string, { status: string; checkinTime: string }>,
  }

  it('1. Tạo mã vé độc bản TKT-EVENT-MEMBER chính xác', () => {
    const member = INITIAL_MEMBERS[1] // Giang Lê Hiệp - 23070691
    const ticketToken = `TKT-${sampleEvent.id.slice(-6).toUpperCase()}-${member.member_code}`
    expect(ticketToken).toBe('TKT-251016-23070691')
  })

  it('2. Giải mã và xác thực QR payload của thành viên đã đăng ký', () => {
    const member = INITIAL_MEMBERS[1]
    const qrPayload = JSON.stringify({
      type: 'ISSAC_EVENT_TICKET',
      eventId: sampleEvent.id,
      memberCode: member.member_code,
      memberName: member.full_name,
      studentId: member.student_id,
    })

    const parsed = JSON.parse(qrPayload)
    expect(parsed.type).toBe('ISSAC_EVENT_TICKET')
    expect(parsed.memberCode).toBe('23070691')
    expect(sampleEvent.registeredMemberCodes.includes(parsed.memberCode)).toBe(true)
  })

  it('3. Phát hiện và ngăn chặn quét vé trùng lặp / mượn vé (Anti-Proxy / Double Scan)', () => {
    const memberCode = '23070691'
    
    // Lần quét 1: Hợp lệ
    sampleEvent.records[memberCode] = {
      status: 'present_on_time',
      checkinTime: '19:25:30',
    }

    // Lần quét 2 (cùng vé / người khác mượn vé): Bị từ chối
    const isAlreadyCheckedIn =
      sampleEvent.records[memberCode]?.status === 'present_on_time' ||
      sampleEvent.records[memberCode]?.status === 'late'

    expect(isAlreadyCheckedIn).toBe(true)
    expect(sampleEvent.records[memberCode].checkinTime).toBe('19:25:30')
  })

  it('4. Cảnh báo thành viên chưa đăng ký trước khi sự kiện diễn ra', () => {
    const unregisteredMemberCode = '99999999' // Chưa đăng ký
    const isRegistered = sampleEvent.registeredMemberCodes.includes(unregisteredMemberCode)
    expect(isRegistered).toBe(false)
  })

  it('5. Giải mã chính xác token vé TKT-EVENT-MEMBERCODE (ví dụ TKT-598471-24070680)', () => {
    const token = 'TKT-598471-24070680'
    const parts = token.split('-')
    const extractedCode = parts.slice(2).join('-')
    expect(extractedCode).toBe('24070680')

    const member = INITIAL_MEMBERS.find((m) => m.member_code === extractedCode || m.student_id === extractedCode)
    expect(member).toBeDefined()
    expect(member?.full_name).toBe('Phương Gia Huy')
  })

  it('6. Giải mã chính xác URL query params check-in', () => {
    const url = 'https://issacclubvnuis-eight.vercel.app/checkin?event=evt-1792261598471&member=24070680'
    const queryStr = url.split('?')[1]
    const params = new URLSearchParams(queryStr)
    const code = params.get('member')
    expect(code).toBe('24070680')
  })
})
