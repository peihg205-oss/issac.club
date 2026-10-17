import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/db/status — Kiểm tra tình trạng kết nối & thống kê dữ liệu thật trong Postgres
export async function GET() {
  try {
    const supabase = createAdminClient()
    const startTime = Date.now()

    // Query counts in parallel
    const [
      { count: memberCount, error: memberErr },
      { count: deptCount, error: deptErr },
      { count: termCount, error: termErr },
      { count: eventCount, error: eventErr },
      { count: attendanceCount, error: attErr },
      { count: criteriaCount, error: critErr },
      { count: ledgerCount, error: ledgerErr },
    ] = await Promise.all([
      supabase.from('members').select('*', { count: 'exact', head: true }),
      supabase.from('departments').select('*', { count: 'exact', head: true }),
      supabase.from('terms').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('attendance').select('*', { count: 'exact', head: true }),
      supabase.from('criteria').select('*', { count: 'exact', head: true }),
      supabase.from('score_ledger').select('*', { count: 'exact', head: true }),
    ])

    const latency = Date.now() - startTime

    if (memberErr || deptErr || termErr) {
      return NextResponse.json(
        {
          connected: false,
          error: memberErr?.message || deptErr?.message || termErr?.message,
          latencyMs: latency,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      connected: true,
      latencyMs: latency,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
      studioUrl: 'http://127.0.0.1:54323',
      databaseUrl: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
      tables: {
        members: memberCount ?? 0,
        departments: deptCount ?? 0,
        terms: termCount ?? 0,
        events: eventCount ?? 0,
        attendance: attendanceCount ?? 0,
        criteria: criteriaCount ?? 0,
        score_ledger: ledgerCount ?? 0,
      },
      systemRules: {
        p01_initialScore: 60,
        p02_clamp: '[0, 100]',
        p03_coreMultiplier: 2,
        p04_interactionCap: 15,
        ratingLevels: 6,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ connected: false, error: message }, { status: 500 })
  }
}
