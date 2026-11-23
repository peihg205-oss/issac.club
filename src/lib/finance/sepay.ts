import crypto from 'crypto'

export interface SePayConfig {
  apiKey: string
  webhookSecret: string
  bankAccount: string
  bankCode: string
  accountHolder: string
  isTestMode: boolean
}

export function getSePayConfig(): SePayConfig {
  return {
    apiKey: process.env.SEPAY_API_KEY || 'demo_sepay_api_key',
    webhookSecret: process.env.SEPAY_WEBHOOK_SECRET || 'issac_sepay_webhook_secret_2026',
    bankAccount: process.env.SEPAY_BANK_ACCOUNT || '0374140705',
    bankCode: process.env.SEPAY_BANK_CODE || 'MB',
    accountHolder: process.env.SEPAY_ACCOUNT_HOLDER || 'GIANG LE HIEP',
    isTestMode: process.env.SEPAY_TEST_MODE === 'true' || !process.env.SEPAY_WEBHOOK_SECRET,
  }
}

/**
 * Generates a cryptographically secure, unique payment reference code.
 * Format: ISSAC + 8 uppercase alphanumeric chars (excluding lookalike chars 0, O, 1, I).
 * Example: ISSAC8F3K9P2A
 */
export function generatePaymentCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  const bytes = crypto.randomBytes(8)
  let code = 'ISSAC'
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length]
  }
  return code
}

/**
 * Builds the SePay-supported dynamic VietQR image URL.
 * https://vietqr.app/img?acc=BANK_ACCOUNT&bank=BANK_CODE&amount=AMOUNT&des=UNIQUE_CODE&template=compact
 */
export function generateVietQrUrl(params: {
  bankAccount?: string
  bankCode?: string
  amount: number
  paymentCode: string
  template?: string
}): string {
  const config = getSePayConfig()
  const account = encodeURIComponent(params.bankAccount || config.bankAccount)
  const bank = encodeURIComponent(params.bankCode || config.bankCode)
  const amount = Math.round(params.amount)
  const des = encodeURIComponent(params.paymentCode)
  const template = encodeURIComponent(params.template || 'compact')

  return `https://vietqr.app/img?acc=${account}&bank=${bank}&amount=${amount}&des=${des}&template=${template}`
}

/**
 * Extracts a payment code matching format ISSAC[A-Z0-9]{6,12} from transaction content.
 */
export function extractPaymentCode(content: string): string | null {
  if (!content) return null
  const match = content.toUpperCase().match(/ISSAC[2-9A-Z]{6,12}/)
  return match ? match[0] : null
}

/**
 * Verifies SePay Webhook signature using HMAC-SHA256 and constant-time comparison.
 * Formula: HMAC-SHA256(secret, timestamp + "." + rawBody)
 * Headers: X-SePay-Signature, X-SePay-Timestamp
 */
export function verifySePayWebhookSignature(params: {
  rawBody: string
  signature: string | null
  timestamp: string | null
  secret?: string
  maxAgeMs?: number // Default: 10 minutes (600,000 ms)
}): { isValid: boolean; reason?: string } {
  const secret = params.secret || getSePayConfig().webhookSecret
  const maxAgeMs = params.maxAgeMs ?? 10 * 60 * 1000

  if (!params.signature) {
    return { isValid: false, reason: 'Thiếu header X-SePay-Signature' }
  }

  if (!params.timestamp) {
    return { isValid: false, reason: 'Thiếu header X-SePay-Timestamp' }
  }

  // 1. Check timestamp freshness to prevent replay attacks
  const reqTime = parseInt(params.timestamp, 10)
  if (isNaN(reqTime)) {
    return { isValid: false, reason: 'Header X-SePay-Timestamp không hợp lệ' }
  }

  // Note: SePay timestamp could be seconds or milliseconds
  const reqTimeMs = reqTime < 1e11 ? reqTime * 1000 : reqTime
  const now = Date.now()
  if (Math.abs(now - reqTimeMs) > maxAgeMs) {
    return {
      isValid: false,
      reason: `Giao dịch bị từ chối do quá hạn hoặc nghi vấn tấn công phát lại (Replay attack). Độ lệch: ${Math.round(
        Math.abs(now - reqTimeMs) / 1000
      )}s`,
    }
  }

  // 2. Compute expected HMAC
  // Standard SePay format: timestamp + "." + rawBody
  const messageToSign = `${params.timestamp}.${params.rawBody}`
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(messageToSign)
    .digest('hex')

  const sigBuffer = Buffer.from(params.signature, 'hex')
  const expectedBuffer = Buffer.from(expectedSignature, 'hex')

  if (sigBuffer.length !== expectedBuffer.length) {
    // Also support raw body direct HMAC fallback if SePay mode configured without timestamp prefix
    const altSignature = crypto.createHmac('sha256', secret).update(params.rawBody).digest('hex')
    const altBuffer = Buffer.from(altSignature, 'hex')
    if (sigBuffer.length === altBuffer.length && crypto.timingSafeEqual(sigBuffer, altBuffer)) {
      return { isValid: true }
    }
    return { isValid: false, reason: 'Chữ ký HMAC không khớp độ dài dự kiến' }
  }

  const isValid = crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  if (!isValid) {
    // Check fallback
    const altSignature = crypto.createHmac('sha256', secret).update(params.rawBody).digest('hex')
    const altBuffer = Buffer.from(altSignature, 'hex')
    if (sigBuffer.length === altBuffer.length && crypto.timingSafeEqual(sigBuffer, altBuffer)) {
      return { isValid: true }
    }
    return { isValid: false, reason: 'Chữ ký HMAC-SHA256 không hợp lệ' }
  }

  return { isValid: true }
}

