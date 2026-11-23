import { NextResponse } from 'next/server'
import { FinancialStore } from '@/lib/finance/store'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const paymentCode = formData.get('paymentCode') as string
    const file = formData.get('file') as File | null

    if (!paymentCode || !file) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin mã thanh toán hoặc tệp minh chứng.' },
        { status: 400 }
      )
    }

    const intent = await FinancialStore.getPaymentIntentByCode(paymentCode)
    if (!intent) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy yêu cầu thanh toán hợp lệ.' },
        { status: 404 }
      )
    }

    // Validate file type (PNG, JPG, JPEG, PDF)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Định dạng tệp không hợp lệ. Vui lòng tải lên ảnh PNG, JPG hoặc file PDF.',
        },
        { status: 400 }
      )
    }

    // Validate size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: 'Kích thước tệp quá lớn. Dung lượng tối đa cho phép là 5MB.',
        },
        { status: 400 }
      )
    }

    // Convert file to base64 data URL for local storage / demonstration
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Data = `data:${file.type};base64,${buffer.toString('base64')}`

    intent.evidenceUrl = base64Data
    intent.evidenceFileName = file.name
    intent.evidenceUploadedAt = new Date().toISOString()
    await FinancialStore.savePaymentIntent(intent)

    FinancialStore.addAuditLog({
      actor: `${intent.fullName} (${intent.studentId})`,
      actorRole: 'MEMBER',
      action: 'TẢI_MINH_CHỨNG_THANH_TOÁN',
      targetRecord: paymentCode,
      details: `Tải lên tệp minh chứng: ${file.name} (${Math.round(file.size / 1024)} KB)`,
    })

    return NextResponse.json({
      success: true,
      message: 'Minh chứng thanh toán đã được lưu thành công.',
      fileName: file.name,
      uploadedAt: intent.evidenceUploadedAt,
    })
  } catch (error: any) {
    console.error('Error uploading payment evidence:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi tải minh chứng' },
      { status: 500 }
    )
  }
}

