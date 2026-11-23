import { NextResponse } from 'next/server'
import { FinancialStore } from '@/lib/finance/store'
import { verifyClubMemberIdentity } from '@/lib/finance/verifyMember'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { fullName, studentId, email, phone, campaignSlug } = body

    if (!campaignSlug) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin chiến dịch thu quỹ' },
        { status: 400 }
      )
    }

    // 1. Verify campaign existence and state
    const campaign = await FinancialStore.getCampaignBySlug(campaignSlug)
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Chiến dịch thu quỹ không tồn tại' },
        { status: 404 }
      )
    }

    if (campaign.status === 'closed' || campaign.isFrozen) {
      return NextResponse.json(
        { success: false, error: 'Chiến dịch thu quỹ này hiện đang tạm dừng hoặc đã kết thúc.' },
        { status: 400 }
      )
    }

    // 2. Strict 4-field member verification
    const clientIp = request.headers.get('x-forwarded-for') || 'local'
    const verification = verifyClubMemberIdentity(
      { fullName, studentId, email, phone },
      clientIp
    )

    if (!verification.isValid || !verification.member) {
      return NextResponse.json(
        { success: false, error: verification.errorMessage },
        { status: 400 }
      )
    }

    // 3. Check if member already completed payment
    const existingSuccess = await FinancialStore.getSuccessIntentForMember(
      campaign.id,
      verification.member.studentId
    )

    if (existingSuccess) {
      return NextResponse.json(
        {
          success: false,
          alreadyPaid: true,
          message: 'Bạn đã hoàn thành đóng quỹ cho chiến dịch này.',
          paymentCode: existingSuccess.paymentCode,
          paidAt: existingSuccess.paidAt,
        },
        { status: 400 }
      )
    }

    // 4. Check if member already has active pending payment
    const existingPending = await FinancialStore.getActiveIntentForMember(
      campaign.id,
      verification.member.studentId
    )

    return NextResponse.json({
      success: true,
      message: 'Thông tin hợp lệ – Bạn có thể tạo mã thanh toán.',
      member: {
        memberCode: verification.member.memberCode,
        fullName: verification.member.fullName,
        studentId: verification.member.studentId,
        departmentName: verification.member.departmentName,
      },
      campaign: {
        id: campaign.id,
        slug: campaign.slug,
        title: campaign.title,
        amount: campaign.defaultAmount,
      },
      existingIntent: existingPending
        ? {
            paymentCode: existingPending.paymentCode,
            qrUrl: existingPending.qrUrl,
            expiresAt: existingPending.expiresAt,
            amount: existingPending.amount,
          }
        : null,
    })
  } catch (error: any) {
    console.error('Error verifying member identity:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi hệ thống khi xác minh' },
      { status: 500 }
    )
  }
}

