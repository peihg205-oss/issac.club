import { NextResponse } from 'next/server'
import {
  extractPaymentCode,
  getSePayConfig,
  verifySePayWebhookSignature,
} from '@/lib/finance/sepay'
import { FinancialStore } from '@/lib/finance/store'
import type { SePayWebhookPayload } from '@/types/finance'

export async function GET() {
  return NextResponse.json({
    status: 'active',
    service: 'iSSAC SePay Webhook Service',
    message:
      'Cổng webhook SePay đang hoạt động bình thường. Vui lòng gửi dữ liệu bằng phương thức POST từ SePay gateway.',
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: Request) {
  try {
    // 1. Read raw body as text for HMAC verification
    const rawBody = await request.text()

    if (!rawBody) {
      return NextResponse.json({ success: false, error: 'Empty body' }, { status: 400 })
    }

    // 2. Read headers
    const signature =
      request.headers.get('x-sepay-signature') ||
      request.headers.get('X-SePay-Signature') ||
      request.headers.get('authorization')?.replace('Apikey ', '') ||
      null

    const timestamp =
      request.headers.get('x-sepay-timestamp') ||
      request.headers.get('X-SePay-Timestamp') ||
      null

    const config = getSePayConfig()

    // 3. Signature verification (if secret configured or in production mode)
    if (config.webhookSecret && config.webhookSecret !== 'issac_sepay_webhook_secret_2026') {
      const sigCheck = verifySePayWebhookSignature({
        rawBody,
        signature,
        timestamp,
        secret: config.webhookSecret,
      })

      if (!sigCheck.isValid) {
        return NextResponse.json(
          { success: false, error: sigCheck.reason || 'Invalid HMAC signature' },
          { status: 401 }
        )
      }
    }

    // 4. Parse payload
    let payload: SePayWebhookPayload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
    }

    // 5. Transfer direction: must be incoming money ("in")
    if (payload.transferType !== 'in') {
      return NextResponse.json(
        { success: true, message: 'Bỏ qua giao dịch tiền ra (transferType != in)' },
        { status: 200 }
      )
    }

    // 6. Match payment code
    // Check code field or extract from content/description
    const paymentCode =
      payload.code?.trim().toUpperCase() ||
      extractPaymentCode(payload.content) ||
      extractPaymentCode(payload.description || '')

    if (!paymentCode) {
      return NextResponse.json(
        {
          success: true,
          message: 'Giao dịch không chứa mã thanh toán iSSAC hợp lệ. Chuyển đối soát thủ công.',
        },
        { status: 200 }
      )
    }

    // 7. Find payment intent
    const intent = await FinancialStore.getPaymentIntentByCode(paymentCode)
    if (!intent) {
      // Record unmatched transaction into audit log for bookkeeping
      FinancialStore.addAuditLog({
        actor: 'SePay Webhook',
        actorRole: 'GATEWAY',
        action: 'GIAO_DỊCH_KHÔNG_KHỚP_MÃ',
        targetRecord: `SP-${payload.id}`,
        details: `Nhận ${payload.transferAmount.toLocaleString('vi-VN')}đ với nội dung "${payload.content}" nhưng mã ${paymentCode} không có trong hệ thống.`,
      })

      return NextResponse.json(
        {
          success: true,
          message: 'Không tìm thấy yêu cầu thanh toán tương ứng. Đã lưu nhật ký đối soát.',
        },
        { status: 200 }
      )
    }

    // 8. Idempotency Check: if already confirmed, acknowledge without duplicate ledger entry
    if (intent.status === 'success') {
      return NextResponse.json(
        {
          success: true,
          message: 'Giao dịch đã được ghi nhận thành công trước đó (Idempotent response).',
        },
        { status: 200 }
      )
    }

    // 9. Exact amount verification
    const expectedAmount = intent.amount
    const receivedAmount = payload.transferAmount

    if (receivedAmount !== expectedAmount) {
      // Amount mismatch -> Route to manual reconciliation (disputed)
      intent.status = 'disputed'
      intent.sepayTransactionId = String(payload.id)
      intent.paidAmount = receivedAmount
      intent.disputeReason = `Sai lệch số tiền: Thực nhận ${receivedAmount.toLocaleString('vi-VN')}đ, dự kiến ${expectedAmount.toLocaleString('vi-VN')}đ`
      await FinancialStore.savePaymentIntent(intent)

      FinancialStore.addAuditLog({
        actor: 'SePay Webhook',
        actorRole: 'GATEWAY',
        action: 'LỆCH_SỐ_TIỀN_THANH_TOÁN',
        targetRecord: intent.id,
        details: `Thành viên ${intent.fullName} (${intent.studentId}) chuyển ${receivedAmount.toLocaleString('vi-VN')}đ thay vì ${expectedAmount.toLocaleString('vi-VN')}đ. Trạng thái: Cần đối soát.`,
      })

      return NextResponse.json(
        {
          success: true,
          message: 'Giao dịch sai lệch số tiền. Đã chuyển sang trạng thái chờ đối soát.',
        },
        { status: 200 }
      )
    }

    // 10. Confirm payment intent
    intent.status = 'success'
    intent.sepayTransactionId = String(payload.id)
    intent.paidAmount = receivedAmount
    intent.paidAt = new Date().toISOString()
    await FinancialStore.savePaymentIntent(intent)

    // 11. Append-only ledger posting
    const ledgerEntry = await FinancialStore.addLedgerEntry({
      type: 'INCOME',
      category: 'fund_collection',
      categoryLabel: intent.campaignTitle,
      amount: receivedAmount,
      description: `${intent.campaignTitle} - ${intent.fullName} (${intent.studentId})`,
      memberCode: intent.memberCode,
      memberName: intent.fullName,
      campaignId: intent.campaignId,
      campaignTitle: intent.campaignTitle,
      paymentCode: intent.paymentCode,
      sepayTransactionId: `SP-${payload.id}`,
      status: 'confirmed',
      actor: 'SePay Webhook',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Thanh toán đã được xác nhận tự động và ghi vào sổ cái bất biến thành công.',
        ledgerId: ledgerEntry.id,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error handling SePay webhook:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

