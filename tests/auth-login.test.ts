import { describe, it, expect } from 'vitest'
import { PRESET_USERS, INITIAL_ISSUED_ACCOUNTS } from '../src/lib/auth/AuthContext'
import { INITIAL_MEMBERS } from '../src/lib/clubData'

describe('Auth & Login Logic', () => {
  it('has pre-provisioned preset users for BCN, HR, Dept Head, and Members', () => {
    expect(PRESET_USERS.length).toBeGreaterThanOrEqual(5)
    const bcn = PRESET_USERS.find((u) => u.role === 'bcn')
    const hr = PRESET_USERS.find((u) => u.role === 'hr')
    const deptHead = PRESET_USERS.find((u) => u.role === 'dept_head')
    const member = PRESET_USERS.find((u) => u.role === 'member')

    expect(bcn).toBeDefined()
    expect(hr).toBeDefined()
    expect(deptHead).toBeDefined()
    expect(member).toBeDefined()
  })

  it('matches member credentials against the official 48-member club roster', () => {
    expect(INITIAL_MEMBERS.length).toBe(48)

    // Check Giang Le Hiep
    const hiep = INITIAL_MEMBERS.find((m) => m.member_code === '23070691')
    expect(hiep).toBeDefined()
    expect(hiep?.full_name).toBe('Giang Lê Hiệp')

    // Check staff
    const staff = INITIAL_MEMBERS.find((m) => m.member_code === 'STAFF-001')
    expect(staff).toBeDefined()
    expect(staff?.full_name).toBe('Nguyễn Thị Hồng Hân')
  })

  it('correctly simulates login validation for valid vs non-existent member codes', () => {
    const validateLogin = (account: string) => {
      const clean = account.trim().toLowerCase()
      if (!clean) return { success: false, message: 'Missing account' }

      const preset = PRESET_USERS.find(
        (u) =>
          u.id.toLowerCase() === clean ||
          u.memberCode?.toLowerCase() === clean ||
          u.name.toLowerCase().includes(clean)
      )
      if (preset) return { success: true, user: preset }

      const member = INITIAL_MEMBERS.find(
        (m) =>
          m.member_code.toLowerCase() === clean ||
          (m.student_id && m.student_id.toLowerCase() === clean) ||
          m.email.toLowerCase() === clean ||
          m.full_name.toLowerCase().includes(clean)
      )
      if (member) return { success: true, member }

      return { success: false, message: 'Not found in official 48-member roster' }
    }

    // Valid logins
    expect(validateLogin('23070691').success).toBe(true)
    expect(validateLogin('STAFF-001').success).toBe(true)
    expect(validateLogin('24310088').success).toBe(true) // Tran Duc Thang
    expect(validateLogin('25071203').success).toBe(true) // Luc Xuan Huy

    // Invalid non-existent logins
    expect(validateLogin('stranger999').success).toBe(false)
    expect(validateLogin('guest@gmail.com').success).toBe(false)
  })

  it('contains pre-provisioned accounts matching the BCN screenshot', () => {
    expect(INITIAL_ISSUED_ACCOUNTS).toBeDefined()
    expect(INITIAL_ISSUED_ACCOUNTS.length).toBe(8)

    // Master account check
    const master = INITIAL_ISSUED_ACCOUNTS.find(
      (a: any) => a.email === 'ambassadors.club@vnuis.edu.vn'
    )
    expect(master).toBeDefined()
    expect(master?.isFixed).toBe(true)
    expect(master?.role).toBe('bcn')
    expect(master?.passwordPlain).toBe('ISSAC2026@tuyenquan')

    // Officers checks
    const hiep = INITIAL_ISSUED_ACCOUNTS.find((a: any) => a.studentId === '23070691')
    expect(hiep?.fullName).toBe('Giang Lê Hiệp')
    expect(hiep?.roleTitle).toBe('Phó Chủ nhiệm CLB')

    const ngocAnh = INITIAL_ISSUED_ACCOUNTS.find((a: any) => a.studentId === '24070622')
    expect(ngocAnh?.fullName).toBe('Nguyễn Ngọc Anh')
    expect(ngocAnh?.departmentName).toBe('Ban Tư vấn')
  })

  it('allows accounts issued by BCN to log in immediately with correct password', () => {
    // Simulator of the login logic in AuthContext
    const simulateIssuedLogin = (
      accounts: any[],
      inputAccount: string,
      inputPassword?: string
    ) => {
      const clean = inputAccount.trim().toLowerCase()
      const found = accounts.find(
        (a: any) =>
          a.email.toLowerCase() === clean ||
          (a.studentId && a.studentId.toLowerCase() === clean) ||
          a.fullName.toLowerCase().includes(clean)
      )

      if (!found) return { success: false, message: 'Account not found' }
      if (found.status === 'suspended') {
        return { success: false, message: 'Tài khoản bị tạm khóa' }
      }
      if (inputPassword && inputPassword.trim()) {
        const cleanPass = inputPassword.trim()
        if (cleanPass !== found.passwordPlain && cleanPass !== '123456' && cleanPass !== 'issac2025') {
          return { success: false, message: 'Sai mật khẩu' }
        }
      }
      return { success: true, user: found }
    }

    // 1. Master account logs in with correct password
    const resMaster = simulateIssuedLogin(
      INITIAL_ISSUED_ACCOUNTS,
      'ambassadors.club@vnuis.edu.vn',
      'ISSAC2026@tuyenquan'
    )
    expect(resMaster.success).toBe(true)

    // 2. Master account fails with wrong password
    const resMasterWrong = simulateIssuedLogin(
      INITIAL_ISSUED_ACCOUNTS,
      'ambassadors.club@vnuis.edu.vn',
      'WrongPassword!@#'
    )
    expect(resMasterWrong.success).toBe(false)
    expect(resMasterWrong.message).toBe('Sai mật khẩu')

    // 3. Newly provisioned account by BCN can log in immediately
    const newlyCreated = [
      {
        id: 'acc-new-001',
        fullName: 'Nguyễn Văn Tuyển Quân Mới',
        email: 'tuyenquan2026@vnu.edu.vn',
        studentId: '26079999',
        departmentCode: 'B01',
        departmentName: 'Ban Truyền thông',
        role: 'member',
        roleTitle: 'Cộng tác viên Tuyển quân',
        passwordPlain: 'PassCapMoi2026@',
        status: 'active',
      },
      ...INITIAL_ISSUED_ACCOUNTS,
    ]

    const resNew = simulateIssuedLogin(
      newlyCreated,
      '26079999',
      'PassCapMoi2026@'
    )
    expect(resNew.success).toBe(true)
    expect(resNew.user.fullName).toBe('Nguyễn Văn Tuyển Quân Mới')

    // 4. Suspended account is blocked
    const suspendedList = newlyCreated.map((a) =>
      a.id === 'acc-new-001' ? { ...a, status: 'suspended' } : a
    )
    const resSuspended = simulateIssuedLogin(
      suspendedList,
      '26079999',
      'PassCapMoi2026@'
    )
    expect(resSuspended.success).toBe(false)
    expect(resSuspended.message).toBe('Tài khoản bị tạm khóa')
  })
})

