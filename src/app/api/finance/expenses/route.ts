import { NextResponse } from 'next/server'
import { FinancialStore } from '@/lib/finance/store'

export async function GET() {
  try {
    const expenses = await FinancialStore.getExpenses()
    return NextResponse.json({ success: true, data: expenses })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'create') {
      const {
        category,
        categoryLabel,
        amount,
        reason,
        description,
        recipient,
        relatedEvent,
        creatorId,
        creatorName,
        creatorRole,
      } = body

      if (!amount || !reason || !recipient || !creatorId) {
        return NextResponse.json(
          { success: false, error: 'Thiếu thông tin bắt buộc trong đề xuất chi' },
          { status: 400 }
        )
      }

      const expense = await FinancialStore.createExpenseRequest({
        category: category || 'materials',
        categoryLabel: categoryLabel || 'Chi hoạt động',
        amount: Number(amount),
        reason,
        description: description || '',
        recipient,
        relatedEvent,
        creatorId,
        creatorName: creatorName || 'Thành viên',
        creatorRole: creatorRole || 'Thành viên',
      })

      return NextResponse.json({ success: true, data: expense })
    }

    if (action === 'approve') {
      const { expenseId, approverId, approverName, approverRole } = body

      if (!expenseId || !approverId) {
        return NextResponse.json(
          { success: false, error: 'Thiếu thông tin người phê duyệt' },
          { status: 400 }
        )
      }

      // Segregation of duties is checked inside FinancialStore.approveExpenseRequest
      const updatedExpense = await FinancialStore.approveExpenseRequest({
        expenseId,
        approverId,
        approverName: approverName || 'Người phê duyệt',
        approverRole: approverRole || 'Ban Chủ nhiệm',
      })

      return NextResponse.json({
        success: true,
        message: 'Khoản chi đã được phê duyệt và ghi tự động vào sổ cái.',
        data: updatedExpense,
      })
    }

    if (action === 'reject') {
      const { expenseId, approverId, approverName, approverRole, reason } = body

      const updatedExpense = await FinancialStore.rejectExpenseRequest({
        expenseId,
        approverId,
        approverName: approverName || 'Người phê duyệt',
        approverRole: approverRole || 'Ban Chủ nhiệm',
        reason: reason || 'Không phù hợp với dự toán hoạt động',
      })

      return NextResponse.json({
        success: true,
        message: 'Đã từ chối khoản chi.',
        data: updatedExpense,
      })
    }

    return NextResponse.json(
      { success: false, error: 'Hành động không hợp lệ' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error in expenses API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi xử lý đề xuất chi' },
      { status: 400 }
    )
  }
}
