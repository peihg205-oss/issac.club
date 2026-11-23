import { NextResponse } from 'next/server'
import { generatePaymentCode, generateVietQrUrl, getSePayConfig } from '@/lib/finance/sepay'
import { FinancialStore } from '@/lib/finance/store'
import { verifyClubMemberIdentity } from '@/lib/finance/verifyMember'
import type { PaymentIntent } from '@/types/finance'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { campaignSlug, fullName, studentId, email, phone } = body

    const campaign = await FinancialStore.getCampaignBySlug(campaignSlug)
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Chiến dịch thu quỹ không tồn tại.' },
        { status: 404 }
      )
    }

    if (campaign.status === 'closed' || campaign.isFrozen) {
      return NextResponse.json(
        { success: false, error: 'Chiến dịch thu quỹ đã đóng.' },
        { status: 400 }
      )
    }

    // Re-verify member details
    const verification = verifyClubMemberIdentity({ fullName, studentId, email, phone })
    if (!verification.isValid || !verification.member) {
      return NextResponse.json(
        { success: false, error: verification.errorMessage },
        { status: 400 }
      )
    }

    // Check if already paid
    const existingSuccess = await FinancialStore.getSuccessIntentForMember(
      campaign.id,
      verification.member.studentId
    )
    if (existingSuccess) {
      return NextResponse.json(
        {
          success: false,
          alreadyPaid: true,
          message: 'Bạn đã hoàn tất đóng quỹ cho chiến dịch này.',
        },
        { status: 400 }
      )
    }

    // Resume existing pending intent if valid and unexpired
    const existingPending = await FinancialStore.getActiveIntentForMember(
      campaign.id,
      verification.member.studentId
    )
    if (existingPending) {
      return NextResponse.json({
        success: true,
        intent: existingPending,
        bankInfo: {
          accountNumber: getSePayConfig().bankAccount,
          bankCode: getSePayConfig().bankCode,
          accountHolder: getSePayConfig().accountHolder,
        },
      })
    }

    // Generate new single-use cryptographically random payment code
    const paymentCode = generatePaymentCode()
    const config = getSePayConfig()
    const qrUrl = generateVietQrUrl({
      bankAccount: config.bankAccount,
      bankCode: config.bankCode,
      amount: campaign.defaultAmount,
      paymentCode,
      template: 'compact',
    })

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 mins expiry
    const newIntent: PaymentIntent = {
      id: `PI-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      campaignId: campaign.id,
      campaignSlug: campaign.slug,
      campaignTitle: campaign.title,
      memberCode: verification.member.memberCode,
      fullName: verification.member.fullName,
      studentId: verification.member.studentId,
      email: verification.member.email,
      phone: verification.member.phone,
      amount: campaign.defaultAmount,
      paymentCode,
      qrUrl,
      status: 'pending',
      expiresAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await FinancialStore.savePaymentIntent(newIntent)

    FinancialStore.addAuditLog({
      actor: `${verification.member.fullName} (${verification.member.studentId})`,
      actorRole: 'MEMBER',
      action: 'TẠO_MÃ_THANH_TOÁN',
      targetRecord: paymentCode,
      details: `Tạo mã thanh toán ${paymentCode} cho chiến dịch ${campaign.title} (${campaign.defaultAmount.toLocaleString('vi-VN')}đ)`,
    })

    return NextResponse.json({
      success: true,
      intent: newIntent,
      bankInfo: {
        accountNumber: config.bankAccount,
        bankCode: config.bankCode,
        accountHolder: config.accountHolder,
      },
    })
  } catch (error: any) {
    console.error('Error generating payment intent:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi tạo mã thanh toán' },
      { status: 500 }
    )
  }
}

