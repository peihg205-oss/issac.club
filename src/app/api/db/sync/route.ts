import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Bộ nhớ đệm tạm thời phía server để phản hồi tức thì
let cachedEvents: any[] | null = null
let cachedProposals: any[] | null = null

// GET /api/db/sync — Lấy dữ liệu sự kiện & điểm danh mới nhất từ Supabase
export async function GET() {
  try {
    const supabase = createAdminClient()

    // 1. Đọc từ bảng settings trong Supabase
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['issac_events_cloud', 'issac_proposals_cloud'])

    if (!error && data && data.length > 0) {
      const eventsRow = data.find((r) => r.key === 'issac_events_cloud')
      const proposalsRow = data.find((r) => r.key === 'issac_proposals_cloud')

      let eventsFromDb = null
      let proposalsFromDb = null

      if (eventsRow?.value) {
        try {
          eventsFromDb = JSON.parse(eventsRow.value)
          cachedEvents = eventsFromDb
        } catch (e) {
          console.error('Error parsing events JSON:', e)
        }
      }

      if (proposalsRow?.value) {
        try {
          proposalsFromDb = JSON.parse(proposalsRow.value)
          cachedProposals = proposalsFromDb
        } catch (e) {
          console.error('Error parsing proposals JSON:', e)
        }
      }

      return NextResponse.json({
        success: true,
        events: eventsFromDb || cachedEvents,
        proposals: proposalsFromDb || cachedProposals,
        source: 'supabase_cloud',
      })
    }

    return NextResponse.json({
      success: true,
      events: cachedEvents,
      proposals: cachedProposals,
      source: 'cache_memory',
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Sync error'
    return NextResponse.json({
      success: true,
      events: cachedEvents,
      proposals: cachedProposals,
      error: msg,
      source: 'fallback',
    })
  }
}

// POST /api/db/sync — Ghi nhận sự kiện hoặc điểm danh mới lên Supabase để PC và ĐT cùng thấy
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, event, events, eventId, memberCode, status, note, proposals } = body
    const supabase = createAdminClient()

    let updatedEvents = events || cachedEvents || []

    if (action === 'create_event' && event) {
      // Đẩy sự kiện mới lên đầu danh sách
      updatedEvents = [event, ...updatedEvents.filter((e: any) => e.id !== event.id)]
    } else if (action === 'checkin' && eventId && memberCode) {
      // Cập nhật điểm danh 1 thành viên
      updatedEvents = updatedEvents.map((evt: any) => {
        if (evt.id === eventId) {
          return {
            ...evt,
            records: {
              ...(evt.records || {}),
              [memberCode]: {
                memberCode,
                status: status || 'present_on_time',
                note: note || '',
                checkinTime: new Date().toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              },
            },
          }
        }
        return evt
      })
    } else if (action === 'finalize' && eventId) {
      // Chốt sổ buổi họp
      updatedEvents = updatedEvents.map((evt: any) => {
        if (evt.id === eventId) {
          return {
            ...evt,
            isFinalized: true,
            finalizedAt: new Date().toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            }),
            finalizedBy: body.finalizedBy || 'BCN',
          }
        }
        return evt
      })
    } else if (action === 'sync_all' && events) {
      updatedEvents = events
    }

    cachedEvents = updatedEvents

    // Ghi vào bảng settings của Supabase để lưu trữ vĩnh viễn trên Cloud
    let dbSuccess = false
    let dbErrorMsg = null

    try {
      const { error: upsertErr } = await supabase
        .from('settings')
        .upsert(
          {
            key: 'issac_events_cloud',
            value: JSON.stringify(updatedEvents),
            description: 'Cloud synchronized events for iSSAC Web across mobile and desktop',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        )

      if (upsertErr) {
        dbErrorMsg = upsertErr.message
        console.warn('Supabase settings upsert notice:', upsertErr.message)
      } else {
        dbSuccess = true
      }
    } catch (dbErr: any) {
      dbErrorMsg = dbErr?.message || 'Database error'
      console.warn('Supabase events catch notice:', dbErr)
    }

    if (proposals) {
      cachedProposals = proposals
      try {
        await supabase
          .from('settings')
          .upsert(
            {
              key: 'issac_proposals_cloud',
              value: JSON.stringify(proposals),
              description: 'Cloud synchronized proposals for iSSAC Web',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          )
      } catch (propErr) {
        console.warn('Supabase proposals upsert notice:', propErr)
      }
    }

    return NextResponse.json({
      success: true,
      events: updatedEvents,
      cloudSynced: dbSuccess,
      cloudNote: dbSuccess
        ? 'Đã đồng bộ trực tiếp lên cơ sở dữ liệu Supabase Cloud'
        : `Dữ liệu đang đồng bộ qua server memory cache (${dbErrorMsg || 'Cần cấp quyền SQL hoặc service_role'}). Hãy chạy script SQL mở RLS hoặc cấp SUPABASE_SERVICE_ROLE_KEY để lưu vĩnh viễn.`,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
