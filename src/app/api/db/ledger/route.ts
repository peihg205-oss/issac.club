import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/db/ledger — Lấy danh sách giao dịch điểm từ Score Ledger thật
export async function GET(request: Request) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit') || 50)

    const { data, error } = await supabase
      .from('score_ledger')
      .select(`
        id,
        criterion_code,
        score_before,
        raw_delta,
        multiplier,
        applied_delta,
        score_after,
        reason,
        occurred_at,
        created_at,
        members (
          member_code,
          full_name,
          is_core_team
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[API/db/ledger] Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ records: data || [], count: data?.length || 0 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
