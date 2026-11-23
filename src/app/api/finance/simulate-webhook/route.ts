import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSePayConfig } from '@/lib/finance/sepay'
import { FinancialStore } from '@/lib/finance/store'

/**
 * Demo / Simulation endpoint for Administrators to test SePay Webhook without external banking calls.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { paymentCode, transferAmount, content } = body

    if (!paymentCode) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp mã thanh toán' },
        { status: 400 }
      )
    }

    const intent = await FinancialStore.getPaymentIntentByCode(paymentCode)
    if (!intent) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy yêu cầu thanh toán tương ứng' },
        { status: 404 }
      )
    }

    const amount = transferAmount ? Number(transferAmount) : intent.amount
    const config = getSePayConfig()
    const simulatedSePayId = Math.floor(100000 + Math.random() * 900000)
    const simulatedDate = new Date().toISOString().replace('T', ' ').slice(0, 19)

    // Build mock SePay payload
    const mockPayload = {
      id: simulatedSePayId,
      gateway: 'MBBank',
      transactionDate: simulatedDate,
      accountNumber: config.bankAccount,
      code: paymentCode,
      content: content || `Chuyen khoan ung ho quy iSSAC ${paymentCode}`,
      transferType: 'in' as const,
      transferAmount: amount,
      accumulated: 10000000,
      subAccount: null,
      referenceCode: `FT${simulatedSePayId}`,
      description: content || `Chuyen khoan ung ho quy iSSAC ${paymentCode}`,
    }

    const rawBody = JSON.stringify(mockPayload)
    const timestamp = Date.now().toString()
    const signature = crypto
      .createHmac('sha256', config.webhookSecret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex')

    // Call the actual webhook handler endpoint internally
    const url = new URL('/api/webhooks/sepay', request.url)
    const webhookRes = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SePay-Signature': signature,
        'X-SePay-Timestamp': timestamp,
      },
      body: rawBody,
    })

    const webhookResult = await webhookRes.json()

    return NextResponse.json({
      success: webhookRes.ok,
      simulatedSePayId,
      webhookResult,
    })
  } catch (error: any) {
    console.error('Simulation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi giả lập SePay webhook' },
      { status: 500 }
    )
  }
}

