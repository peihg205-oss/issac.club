import { NextResponse } from 'next/server'
import { FinancialStore } from '@/lib/finance/store'

export async function GET() {
  try {
    const [stats, ledger, campaigns, expenses, auditLogs] = await Promise.all([
      FinancialStore.getDashboardStats(),
      FinancialStore.getLedgerEntries(),
      FinancialStore.getCampaigns(),
      FinancialStore.getExpenses(),
      FinancialStore.getAuditLogs(),
    ])

    return NextResponse.json({
      success: true,
      data: {
        stats,
        ledger,
        campaigns,
        expenses,
        auditLogs,
      },
    })
  } catch (error: any) {
    console.error('Error fetching finance dashboard data:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi tải dữ liệu tài chính' },
      { status: 500 }
    )
  }
}
