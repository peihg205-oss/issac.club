import { NextResponse } from 'next/server'
import { FinancialStore } from '@/lib/finance/store'

export async function GET() {
  try {
    const campaigns = await FinancialStore.getCampaigns()
    return NextResponse.json({ success: true, data: campaigns })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, slug, description, defaultAmount, startDate, endDate, targetCount, createdBy } =
      body

    if (!title || !slug || !defaultAmount) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp tiêu đề, đường dẫn slug và mức thu' },
        { status: 400 }
      )
    }

    const campaign = await FinancialStore.createCampaign({
      title,
      slug,
      description: description || '',
      defaultAmount: Number(defaultAmount),
      startDate: startDate || new Date().toISOString(),
      endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      targetCount: Number(targetCount) || 48,
      status: 'active',
      isFrozen: false,
      createdBy: createdBy || 'Ban Quản trị',
    })

    return NextResponse.json({ success: true, data: campaign })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
