import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/db/members — Lấy danh sách thành viên từ real DB
export async function GET(request: Request) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const dept = searchParams.get('dept')
    const status = searchParams.get('status') || 'active'

    let query = supabase
      .from('members')
      .select(`
        id,
        member_code,
        student_id,
        full_name,
        class_name,
        position,
        is_core_team,
        status,
        current_score,
        t02_count,
        phone,
        email,
        created_at,
        departments (
          code,
          name
        )
      `)
      .eq('status', status)
      .order('full_name', { ascending: true })

    if (dept) {
      // Join filter by department code
      query = query.eq('departments.code', dept)
    }

    const { data, error } = await query

    if (error) {
      console.error('[API/db/members] Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ members: data, count: data?.length ?? 0 })
  } catch (err) {
    console.error('[API/db/members] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/db/members — Thêm thành viên mới
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const {
      member_code,
      student_id,
      full_name,
      class_name,
      department_id,
      position = 'Thành viên',
      is_core_team = false,
      phone,
      email,
      term_id,
    } = body

    if (!member_code || !full_name || !department_id || !term_id) {
      return NextResponse.json(
        { error: 'Thiếu trường bắt buộc: member_code, full_name, department_id, term_id' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('members')
      .insert({
        member_code,
        student_id,
        full_name,
        class_name,
        department_id,
        position,
        is_core_team,
        phone,
        email,
        term_id,
        current_score: 60, // P01: điểm khởi đầu
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: `Mã thành viên "${member_code}" đã tồn tại trong nhiệm kỳ này` },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ member: data }, { status: 201 })
  } catch (err) {
    console.error('[API/db/members] POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
