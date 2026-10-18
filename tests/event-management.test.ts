import { describe, it, expect } from 'vitest'
import type { MeetingEvent } from '../src/lib/context/ClubContext'

interface TestMember {
  member_code: string
  full_name: string
  position: string
  department_name: string
  email?: string
}

describe('Event Management & Club Roster Attendance Synchronization', () => {
  const sampleMembers: TestMember[] = [
    {
      member_code: 'ISSAC-001',
      full_name: 'Trần Thị Bích Ngọc',
      position: 'Chủ nhiệm CLB',
      department_name: 'Ban Chủ nhiệm',
    },
    {
      member_code: 'ISSAC-002',
      full_name: 'Nguyễn Văn An',
      position: 'Trưởng ban',
      department_name: 'Ban Truyền thông',
    },
    {
      member_code: 'ISSAC-003',
      full_name: 'Lê Hoàng Nam',
      position: 'Thành viên',
      department_name: 'Ban Tư vấn',
    },
    {
      member_code: 'ISSAC-004',
      full_name: 'Phạm Thu Trang',
      position: 'Phó ban',
      department_name: 'Ban Nhân sự',
    },
  ]

  const initialEvent: MeetingEvent = {
    id: 'evt-test-01',
    title: 'Workshop Kỹ năng Đàm phán',
    description: 'Chuyên đề nâng cao kỹ năng đàm phán',
    date: '28/10/2026',
    startTime: '19:00',
    endTime: '21:30',
    location: 'Hội trường HT1',
    pinCode: '8899',
    isRequired: false,
    isFinalized: false,
    records: {
      'ISSAC-001': {
        memberCode: 'ISSAC-001',
        status: 'present_on_time',
        checkinTime: '19:02',
      },
    },
    registeredMemberCodes: ['ISSAC-001', 'OLD-MEMBER-999'],
    maxAttendees: 50,
    pointBonus: 2,
    category: 'workshop',
  }

  it('allows updating event info correctly', () => {
    const updates: Partial<MeetingEvent> = {
      title: 'Workshop Đàm phán & Thuyết trình Chuyên nghiệp',
      pinCode: '1234',
      location: 'Phòng 402 - Tòa A',
      maxAttendees: 60,
      pointBonus: 3,
    }

    const updatedEvent = {
      ...initialEvent,
      ...updates,
    }

    expect(updatedEvent.title).toBe('Workshop Đàm phán & Thuyết trình Chuyên nghiệp')
    expect(updatedEvent.pinCode).toBe('1234')
    expect(updatedEvent.location).toBe('Phòng 402 - Tòa A')
    expect(updatedEvent.maxAttendees).toBe(60)
    expect(updatedEvent.pointBonus).toBe(3)
    // Preserves original properties
    expect(updatedEvent.date).toBe('28/10/2026')
    expect(updatedEvent.id).toBe('evt-test-01')
  })

  it('updates registered attendees from active club roster and cleans obsolete members', () => {
    const activeMemberCodes = new Set(sampleMembers.map((m) => m.member_code))

    // Cleaning obsolete member codes that no longer exist in the club
    const cleanedCodes = (initialEvent.registeredMemberCodes || []).filter((code) =>
      activeMemberCodes.has(code)
    )

    expect(cleanedCodes).toEqual(['ISSAC-001'])
    expect(cleanedCodes).not.toContain('OLD-MEMBER-999')

    // Add all members of Ban Truyền thông and Ban Tư vấn
    const newSelected = sampleMembers
      .filter((m) => m.department_name === 'Ban Truyền thông' || m.department_name === 'Ban Tư vấn')
      .map((m) => m.member_code)

    const updatedAttendees = Array.from(new Set([...cleanedCodes, ...newSelected]))

    expect(updatedAttendees).toEqual(['ISSAC-001', 'ISSAC-002', 'ISSAC-003'])
  })

  it('filters club members by department and search keyword', () => {
    const filterByDept = (dept: string) =>
      sampleMembers.filter((m) => dept === 'ALL' || m.department_name === dept)

    expect(filterByDept('ALL')).toHaveLength(4)
    expect(filterByDept('Ban Nhân sự')).toHaveLength(1)
    expect(filterByDept('Ban Nhân sự')[0].full_name).toBe('Phạm Thu Trang')

    const searchMembers = (query: string) => {
      const q = query.toLowerCase().trim()
      return sampleMembers.filter(
        (m) =>
          m.full_name.toLowerCase().includes(q) ||
          m.member_code.toLowerCase().includes(q)
      )
    }

    expect(searchMembers('Văn An')).toHaveLength(1)
    expect(searchMembers('Văn An')[0].member_code).toBe('ISSAC-002')
    expect(searchMembers('004')).toHaveLength(1)
    expect(searchMembers('004')[0].full_name).toBe('Phạm Thu Trang')
  })

  it('preserves existing checkin records when registered attendees list is edited', () => {
    const updatedAttendees = ['ISSAC-001', 'ISSAC-002', 'ISSAC-004']

    const updatedEvent: MeetingEvent = {
      ...initialEvent,
      registeredMemberCodes: updatedAttendees,
    }

    expect(updatedEvent.records['ISSAC-001']).toBeDefined()
    expect(updatedEvent.records['ISSAC-001'].status).toBe('present_on_time')
    expect(updatedEvent.registeredMemberCodes).toHaveLength(3)
  })
})
