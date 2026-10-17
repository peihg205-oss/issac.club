import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/db/events — Lấy danh sách sự kiện từ real DB
export async function GET(request: Request) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('events')
      .select(`
        id,
        name,
        event_type,
        format,
        is_mandatory,
        starts_at,
        ends_at,
        status,
        checkin_token,
        token_expires_at,
        short_code,
        short_code_expires_at,
        created_at,
        departments (
          code,
          name
        )
      `)
      .order('starts_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('[API/db/events] Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ events: data, count: data?.length ?? 0 })
  } catch (err) {
    console.error('[API/db/events] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/db/events — Tạo sự kiện mới
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const {
      name,
      department_id,
      event_type = 'meeting',
      format = 'offline',
      is_mandatory = true,
      starts_at,
      ends_at,
      created_by,
    } = body

    if (!name || !starts_at || !ends_at) {
      return NextResponse.json(
        { error: 'Thiếu trường bắt buộc: name, starts_at, ends_at' },
        { status: 400 }
      )
    }

    if (new Date(ends_at) <= new Date(starts_at)) {
      return NextResponse.json(
        { error: 'ends_at phải sau starts_at' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('events')
      .insert({
        name,
        department_id: department_id || null,
        event_type,
        format,
        is_mandatory,
        starts_at,
        ends_at,
        status: 'draft',
        created_by: created_by || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ event: data }, { status: 201 })
  } catch (err) {
    console.error('[API/db/events] POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
