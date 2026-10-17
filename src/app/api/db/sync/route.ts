import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Bộ nhớ đệm tạm thời phía server để phản hồi tức thì
let cachedEvents: any[] | null = null
let cachedProposals: any[] | null = null
let cachedMembers: any[] | null = null
let cachedDisputes: any[] | null = null
let cachedPeriods: any[] | null = null
let cachedActivePeriodId: string | null = null
let cachedPeriodScores: Record<string, any> | null = null

// GET /api/db/sync — Lấy dữ liệu sự kiện & điểm danh mới nhất từ Supabase
export async function GET() {
  try {
    const supabase = createAdminClient()

    // 1. Đọc từ bảng settings trong Supabase
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', [
        'issac_events_cloud',
        'issac_proposals_cloud',
        'issac_members_cloud',
        'issac_disputes_cloud',
        'issac_periods_cloud',
        'issac_active_period_id',
        'issac_custom_period_scores',
      ])

    if (!error && data && data.length > 0) {
      const eventsRow = data.find((r) => r.key === 'issac_events_cloud')
      const proposalsRow = data.find((r) => r.key === 'issac_proposals_cloud')
      const membersRow = data.find((r) => r.key === 'issac_members_cloud')
      const disputesRow = data.find((r) => r.key === 'issac_disputes_cloud')
      const periodsRow = data.find((r) => r.key === 'issac_periods_cloud')
      const activePeriodRow = data.find((r) => r.key === 'issac_active_period_id')
      const scoresRow = data.find((r) => r.key === 'issac_custom_period_scores')

      let eventsFromDb = null
      let proposalsFromDb = null
      let membersFromDb = null
      let disputesFromDb = null
      let periodsFromDb = null
      let activePeriodFromDb = null
      let scoresFromDb = null

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

      if (membersRow?.value) {
        try {
          membersFromDb = JSON.parse(membersRow.value)
          cachedMembers = membersFromDb
        } catch (e) {
          console.error('Error parsing members JSON:', e)
        }
      }

      if (disputesRow?.value) {
        try {
          disputesFromDb = JSON.parse(disputesRow.value)
          cachedDisputes = disputesFromDb
        } catch (e) {
          console.error('Error parsing disputes JSON:', e)
        }
      }

      if (periodsRow?.value) {
        try {
          periodsFromDb = JSON.parse(periodsRow.value)
          cachedPeriods = periodsFromDb
        } catch (e) {
          console.error('Error parsing periods JSON:', e)
        }
      }

      if (activePeriodRow?.value) {
        activePeriodFromDb = activePeriodRow.value
        cachedActivePeriodId = activePeriodFromDb
      }

      if (scoresRow?.value) {
        try {
          scoresFromDb = JSON.parse(scoresRow.value)
          cachedPeriodScores = scoresFromDb
        } catch (e) {
          console.error('Error parsing period scores JSON:', e)
        }
      }

      return NextResponse.json({
        success: true,
        events: eventsFromDb || cachedEvents,
        proposals: proposalsFromDb || cachedProposals,
        members: membersFromDb || cachedMembers,
        disputes: disputesFromDb || cachedDisputes,
        periods: periodsFromDb || cachedPeriods,
        activePeriodId: activePeriodFromDb || cachedActivePeriodId,
        customPeriodScores: scoresFromDb || cachedPeriodScores,
        source: 'supabase_cloud',
      })
    }

    return NextResponse.json({
      success: true,
      events: cachedEvents,
      proposals: cachedProposals,
      members: cachedMembers,
      disputes: cachedDisputes,
      periods: cachedPeriods,
      activePeriodId: cachedActivePeriodId,
      customPeriodScores: cachedPeriodScores,
      source: 'cache_memory',
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Sync error'
    return NextResponse.json({
      success: true,
      events: cachedEvents,
      proposals: cachedProposals,
      members: cachedMembers,
      disputes: cachedDisputes,
      periods: cachedPeriods,
      activePeriodId: cachedActivePeriodId,
      customPeriodScores: cachedPeriodScores,
      error: msg,
      source: 'fallback',
    })
  }
}

// POST /api/db/sync — Ghi nhận sự kiện hoặc điểm danh mới lên Supabase để PC và ĐT cùng thấy
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      action,
      event,
      events,
      eventId,
      memberCode,
      status,
      note,
      proposals,
      members,
      disputes,
      periods,
      activePeriodId,
      customPeriodScores,
    } = body
    const supabase = createAdminClient()

    let dbSuccess = false
    let dbErrorMsg = null

    const shouldUpdateEvents = events !== undefined || action !== undefined

    if (shouldUpdateEvents) {
      // Nếu chưa có cachedEvents trong bộ nhớ server, tải từ Supabase trước
      if (!events && !cachedEvents) {
        try {
          const { data: currentDbRow } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'issac_events_cloud')
            .maybeSingle()
          if (currentDbRow?.value) {
            cachedEvents = JSON.parse(currentDbRow.value)
          }
        } catch (e) {
          console.warn('Error reading current events before update:', e)
        }
      }

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
                    timeZone: 'Asia/Ho_Chi_Minh',
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
                timeZone: 'Asia/Ho_Chi_Minh',
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
    }

    if (proposals !== undefined) {
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

    if (members !== undefined) {
      cachedMembers = members
      try {
        await supabase
          .from('settings')
          .upsert(
            {
              key: 'issac_members_cloud',
              value: JSON.stringify(members),
              description: 'Cloud synchronized members for iSSAC Web',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          )
      } catch (memErr) {
        console.warn('Supabase members upsert notice:', memErr)
      }
    }

    if (disputes !== undefined) {
      cachedDisputes = disputes
      try {
        await supabase
          .from('settings')
          .upsert(
            {
              key: 'issac_disputes_cloud',
              value: JSON.stringify(disputes),
              description: 'Cloud synchronized disputes for iSSAC Web',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          )
      } catch (dispErr) {
        console.warn('Supabase disputes upsert notice:', dispErr)
      }
    }

    if (periods !== undefined) {
      cachedPeriods = periods
      try {
        await supabase
          .from('settings')
          .upsert(
            {
              key: 'issac_periods_cloud',
              value: JSON.stringify(periods),
              description: 'Cloud synchronized periods for iSSAC Web',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          )
      } catch (perErr) {
        console.warn('Supabase periods upsert notice:', perErr)
      }
    }

    if (activePeriodId !== undefined) {
      cachedActivePeriodId = String(activePeriodId)
      try {
        await supabase
          .from('settings')
          .upsert(
            {
              key: 'issac_active_period_id',
              value: String(activePeriodId),
              description: 'Cloud synchronized active period ID for iSSAC Web',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          )
      } catch (actErr) {
        console.warn('Supabase active period upsert notice:', actErr)
      }
    }

    if (customPeriodScores !== undefined) {
      cachedPeriodScores = customPeriodScores
      try {
        await supabase
          .from('settings')
          .upsert(
            {
              key: 'issac_custom_period_scores',
              value: JSON.stringify(customPeriodScores),
              description: 'Cloud synchronized period scores for iSSAC Web',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          )
      } catch (scoreErr) {
        console.warn('Supabase period scores upsert notice:', scoreErr)
      }
    }

    return NextResponse.json({
      success: true,
      events: cachedEvents,
      proposals: cachedProposals,
      members: cachedMembers,
      disputes: cachedDisputes,
      periods: cachedPeriods,
      activePeriodId: cachedActivePeriodId,
      customPeriodScores: cachedPeriodScores,
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
