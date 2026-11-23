import { NextResponse } from 'next/server'
import { FinancialStore } from '@/lib/finance/store'

export async function GET() {
  try {
    const result = await FinancialStore.verifyLedgerIntegrity()
    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
