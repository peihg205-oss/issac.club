import crypto from 'crypto'
import { describe, expect, it } from 'vitest'
import {
  GENESIS_HASH,
  calculateEntryHash,
  verifyLedgerIntegrity,
} from '../src/lib/finance/hashChain'
import {
  extractPaymentCode,
  generatePaymentCode,
  generateVietQrUrl,
  verifySePayWebhookSignature,
} from '../src/lib/finance/sepay'
import { FinancialStore } from '../src/lib/finance/store'
import {
  normalizeEmail,
  normalizePhoneNumber,
  normalizeStudentId,
  normalizeVietnameseString,
  verifyClubMemberIdentity,
} from '../src/lib/finance/verifyMember'
import type { FinancialLedgerEntry } from '../src/types/finance'

describe('1. Member Identity Verification (4 Required Fields)', () => {
  it('normalizes Vietnamese Unicode NFC, phone numbers, emails, and MSSV', () => {
    expect(normalizeVietnameseString('  Giang   Lê   Hiệp  ')).toBe('giang lê hiệp')
    expect(normalizePhoneNumber('+84374140705')).toBe('0374140705')
    expect(normalizePhoneNumber('037-414-0705')).toBe('0374140705')
    expect(normalizeEmail('  GLHIEP@VNUIS.EDU.VN  ')).toBe('glhiep@vnuis.edu.vn')
    expect(normalizeStudentId('  23070691  ')).toBe('23070691')
  })

  it('verifies valid official member Giang Lê Hiệp successfully', () => {
    const result = verifyClubMemberIdentity({
      fullName: 'Giang Lê Hiệp',
      studentId: '23070691',
      email: 'glhiep@vnuis.edu.vn',
      phone: '0374140705',
    })

    expect(result.isValid).toBe(true)
    expect(result.member?.fullName).toBe('Giang Lê Hiệp')
    expect(result.member?.studentId).toBe('23070691')
  })

  it('rejects verification if any of the 4 fields is missing or mismatched', () => {
    // Wrong phone number
    const wrongPhone = verifyClubMemberIdentity({
      fullName: 'Giang Lê Hiệp',
      studentId: '23070691',
      email: 'glhiep@vnuis.edu.vn',
      phone: '0999999999',
    })
    expect(wrongPhone.isValid).toBe(false)
    expect(wrongPhone.errorMessage).toContain('không khớp với danh sách thành viên')

    // Wrong email
    const wrongEmail = verifyClubMemberIdentity({
      fullName: 'Giang Lê Hiệp',
      studentId: '23070691',
      email: 'attacker@gmail.com',
      phone: '0374140705',
    })
    expect(wrongEmail.isValid).toBe(false)

    // Missing field
    const missingField = verifyClubMemberIdentity({
      fullName: 'Giang Lê Hiệp',
      studentId: '',
      email: 'glhiep@vnuis.edu.vn',
      phone: '0374140705',
    })
    expect(missingField.isValid).toBe(false)
  })
})

describe('2. VietQR & Cryptographic Payment Code', () => {
  it('generates random single-use reference codes starting with ISSAC', () => {
    const code1 = generatePaymentCode()
    const code2 = generatePaymentCode()

    expect(code1).toMatch(/^ISSAC[2-9A-Z]{8}$/)
    expect(code2).toMatch(/^ISSAC[2-9A-Z]{8}$/)
    expect(code1).not.toBe(code2)
  })

  it('builds valid dynamic VietQR URL with SePay format', () => {
    const qrUrl = generateVietQrUrl({
      bankAccount: '0374140705',
      bankCode: 'MB',
      amount: 100000,
      paymentCode: 'ISSAC8F3K9P2A',
    })

    expect(qrUrl).toBe(
      'https://vietqr.app/img?acc=0374140705&bank=MB&amount=100000&des=ISSAC8F3K9P2A&template=compact'
    )
  })

  it('extracts payment code accurately from transfer descriptions', () => {
    const memo = 'IBFT MBVCB.091234.GLHIEP chuyen tien quy ISSAC8F3K9P2A xong nhe'
    const code = extractPaymentCode(memo)
    expect(code).toBe('ISSAC8F3K9P2A')
  })
})

describe('3. SePay Webhook HMAC-SHA256 & Replay Protection', () => {
  const secret = 'test_sepay_secret_key_123'

  it('verifies valid HMAC signature and fresh timestamp', () => {
    const rawBody = JSON.stringify({
      id: 998877,
      transferType: 'in',
      transferAmount: 100000,
      content: 'Dong quy ISSAC8F3K9P2A',
    })
    const timestamp = Date.now().toString()
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex')

    const result = verifySePayWebhookSignature({
      rawBody,
      signature,
      timestamp,
      secret,
    })

    expect(result.isValid).toBe(true)
  })

  it('rejects tampered body or invalid signature', () => {
    const rawBody = JSON.stringify({ transferAmount: 100000 })
    const timestamp = Date.now().toString()
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex')

    // Tampered body
    const tamperedBody = JSON.stringify({ transferAmount: 1000000 })
    const result = verifySePayWebhookSignature({
      rawBody: tamperedBody,
      signature,
      timestamp,
      secret,
    })

    expect(result.isValid).toBe(false)
  })

  it('rejects replay attack with stale timestamp (> 10 mins)', () => {
    const rawBody = JSON.stringify({ transferAmount: 100000 })
    const staleTimestamp = (Date.now() - 15 * 60 * 1000).toString() // 15 mins ago
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${staleTimestamp}.${rawBody}`)
      .digest('hex')

    const result = verifySePayWebhookSignature({
      rawBody,
      signature,
      timestamp: staleTimestamp,
      secret,
    })

    expect(result.isValid).toBe(false)
    expect(result.reason).toContain('tấn công phát lại')
  })
})

describe('4. Append-Only Financial Ledger & Cryptographic Hash Chaining', () => {
  it('builds a cryptographically chained ledger and passes full integrity audit', async () => {
    const entries = await FinancialStore.getLedgerEntries()
    expect(entries.length).toBeGreaterThanOrEqual(5)

    const audit = verifyLedgerIntegrity(entries)
    expect(audit.valid).toBe(true)
    expect(entries[0].previousHash).toBe(GENESIS_HASH)
  })

  it('detects tampering immediately if any historical ledger entry is altered', async () => {
    const entries = await FinancialStore.getLedgerEntries()
    const tamperedEntries: FinancialLedgerEntry[] = JSON.parse(JSON.stringify(entries))

    // Attacker tampers row #2 amount
    tamperedEntries[1].amount = 99999999

    const audit = verifyLedgerIntegrity(tamperedEntries)
    expect(audit.valid).toBe(false)
    expect(audit.reason).toContain('Dữ liệu bị can thiệp tại bản ghi #2')
  })

  it('supports non-destructive adjustment entry without deleting or editing old records', async () => {
    const initialCount = (await FinancialStore.getLedgerEntries()).length

    const adjustment = await FinancialStore.addAdjustmentEntry({
      referenceEntryId: 'BT-00128',
      reason: 'Điều chỉnh phân loại theo quyết định BCN',
      adjustmentAmount: 0,
      type: 'ADJUSTMENT',
      category: 'reversal',
      actor: 'Giang Lê Hiệp (BCN)',
    })

    expect(adjustment.id).toBeDefined()
    expect(adjustment.referenceEntryId).toBe('BT-00128')
    expect(adjustment.status).toBe('adjusted')

    const newEntries = await FinancialStore.getLedgerEntries()
    expect(newEntries.length).toBe(initialCount + 1)

    const audit = verifyLedgerIntegrity(newEntries)
    expect(audit.valid).toBe(true)
  })
})

describe('5. Segregation of Duties in Expense Management', () => {
  it('blocks creator from approving their own expense request', async () => {
    const expense = await FinancialStore.createExpenseRequest({
      category: 'materials',
      categoryLabel: 'Chi vật tư sự kiện',
      amount: 500000,
      reason: 'Mua văn phòng phẩm cho workshop',
      description: 'Bút, sổ tay và tài liệu in',
      recipient: 'Nhà sách Tiền Phong',
      creatorId: '23070691',
      creatorName: 'Giang Lê Hiệp',
      creatorRole: 'Phó chủ nhiệm',
    })

    // Same person attempts to approve
    await expect(
      FinancialStore.approveExpenseRequest({
        expenseId: expense.id,
        approverId: '23070691', // Same ID as creator!
        approverName: 'Giang Lê Hiệp',
        approverRole: 'Phó chủ nhiệm',
      })
    ).rejects.toThrow('phân tách nhiệm vụ')
  })

  it('allows approval by an independent authorized approver and automatically creates EXPENSE ledger entry', async () => {
    const expense = await FinancialStore.createExpenseRequest({
      category: 'food_drink',
      categoryLabel: 'Teambuilding',
      amount: 300000,
      reason: 'Teabreak sinh hoạt',
      description: 'Bánh ngọt và trà hoa quả',
      recipient: 'Tiệm bánh Tous Les Jours',
      creatorId: '25070407',
      creatorName: 'Vũ Đình Hải',
      creatorRole: 'Phó ban',
    })

    // Independent approver
    const approvedExpense = await FinancialStore.approveExpenseRequest({
      expenseId: expense.id,
      approverId: '22073125', // Different person
      approverName: 'Nguyễn Trịnh Minh Trang',
      approverRole: 'Phó chủ nhiệm',
    })

    expect(approvedExpense.status).toBe('approved')
    expect(approvedExpense.ledgerEntryId).toBeDefined()

    // Verify ledger integrity after auto-posting
    const entries = await FinancialStore.getLedgerEntries()
    const audit = verifyLedgerIntegrity(entries)
    expect(audit.valid).toBe(true)
  })
})

