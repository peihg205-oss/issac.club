import { NextResponse } from 'next/server'
import { FinancialStore } from '@/lib/finance/store'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Thiếu mã thanh toán' },
        { status: 400 }
      )
    }

    const intent = await FinancialStore.getPaymentIntentByCode(code)
    if (!intent) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy giao dịch với mã này' },
        { status: 404 }
      )
    }

    // Check expiration if still pending
    const now = new Date().toISOString()
    if (intent.status === 'pending' && intent.expiresAt < now) {
      intent.status = 'expired'
      await FinancialStore.savePaymentIntent(intent)
    }

    // Return only safe fields for member payment portal - NEVER leak full club ledger or totals!
    return NextResponse.json({
      success: true,
      data: {
        paymentCode: intent.paymentCode,
        campaignTitle: intent.campaignTitle,
        fullName: intent.fullName,
        studentId: intent.studentId,
        amount: intent.amount,
        status: intent.status,
        expiresAt: intent.expiresAt,
        sepayTransactionId: intent.sepayTransactionId || null,
        paidAmount: intent.paidAmount || null,
        paidAt: intent.paidAt || null,
        evidenceUploaded: Boolean(intent.evidenceUrl),
        evidenceFileName: intent.evidenceFileName || null,
        evidenceUploadedAt: intent.evidenceUploadedAt || null,
      },
    })
  } catch (error: any) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw error
    }
    console.error('Error fetching payment status:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi kiểm tra trạng thái' },
      { status: 500 }
    )
  }
}
