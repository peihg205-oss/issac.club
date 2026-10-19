import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AVAILABLE_PERIODS } from '@/lib/periodData'

// Bộ nhớ đệm tạm thời phía server để phản hồi tức thì
let cachedEvents: any[] | null = null
let cachedActiveEventId: string | null = null
let cachedProposals: any[] | null = null
let cachedMembers: any[] | null = null
let cachedDisputes: any[] | null = null
let cachedPeriods: any[] | null = null
let cachedActivePeriodId: string | null = null
let cachedPeriodScores: Record<string, any> | null = null
let cachedDeletedProposalIds: string[] | null = null
let cachedDeletedEventIds: string[] | null = null
let cachedDeletedPeriodIds: string[] | null = null
let cachedCustomRules: any[] | null = null
let cachedAccounts: any[] | null = null
let cachedDeletedAccountIds: string[] | null = null
let cachedDeletedMemberCodes: string[] | null = null

// GET /api/db/sync — Lấy dữ liệu sự kiện & điểm danh mới nhất từ Supabase
export async function GET(request: Request) {
  try {
    const supabase = createAdminClient()

    // 1. Đọc từ bảng settings trong Supabase
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', [
        'issac_events_cloud',
        'issac_active_event_id',
        'issac_proposals_cloud',
        'issac_members_cloud',
        'issac_disputes_cloud',
        'issac_periods_cloud',
        'issac_active_period_id',
        'issac_custom_period_scores',
        'issac_deleted_proposal_ids',
        'issac_deleted_event_ids',
        'issac_deleted_period_ids',
        'issac_custom_rules_cloud',
        'issac_issued_accounts_cloud',
        'issac_deleted_account_ids',
        'issac_deleted_member_codes',
      ])

    if (!error && data && data.length > 0) {
      const eventsRow = data.find((r) => r.key === 'issac_events_cloud')
      const proposalsRow = data.find((r) => r.key === 'issac_proposals_cloud')
      const membersRow = data.find((r) => r.key === 'issac_members_cloud')
      const disputesRow = data.find((r) => r.key === 'issac_disputes_cloud')
      const periodsRow = data.find((r) => r.key === 'issac_periods_cloud')
      const activePeriodRow = data.find((r) => r.key === 'issac_active_period_id')
      const scoresRow = data.find((r) => r.key === 'issac_custom_period_scores')
      const deletedIdsRow = data.find((r) => r.key === 'issac_deleted_proposal_ids')
      const deletedEventIdsRow = data.find((r) => r.key === 'issac_deleted_event_ids')
      const deletedPeriodIdsRow = data.find((r) => r.key === 'issac_deleted_period_ids')
      const activeEventRow = data.find((r) => r.key === 'issac_active_event_id')
      const customRulesRow = data.find((r) => r.key === 'issac_custom_rules_cloud')
      const accountsRow = data.find((r) => r.key === 'issac_issued_accounts_cloud')
      const deletedAccountsRow = data.find((r) => r.key === 'issac_deleted_account_ids')
      const deletedMemberCodesRow = data.find((r) => r.key === 'issac_deleted_member_codes')

      let eventsFromDb = null
      let proposalsFromDb = null
      let membersFromDb = null
      let disputesFromDb = null
      let periodsFromDb = null
      let activePeriodFromDb = null
      let scoresFromDb = null
      let deletedIdsFromDb = null
      let deletedEventIdsFromDb = null
      let deletedPeriodIdsFromDb = null
      let activeEventIdFromDb = null
      let customRulesFromDb = null
      let accountsFromDb = null
      let deletedAccountIdsFromDb = null
      let deletedMemberCodesFromDb = null

      if (eventsRow?.value) {
        try {
          eventsFromDb = JSON.parse(eventsRow.value)
          cachedEvents = eventsFromDb
        } catch (e) {
          console.error('Error parsing events JSON:', e)
        }
      }

      if (activeEventRow?.value) {
        activeEventIdFromDb = activeEventRow.value
        cachedActiveEventId = activeEventIdFromDb
      }

      if (customRulesRow?.value) {
        try {
          customRulesFromDb = JSON.parse(customRulesRow.value)
          cachedCustomRules = customRulesFromDb
        } catch (e) {
          console.error('Error parsing custom rules JSON:', e)
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

      if (deletedIdsRow?.value) {
        try {
          deletedIdsFromDb = JSON.parse(deletedIdsRow.value)
          cachedDeletedProposalIds = deletedIdsFromDb
        } catch (e) {
          console.error('Error parsing deleted IDs JSON:', e)
        }
      }

      if (deletedEventIdsRow?.value) {
        try {
          deletedEventIdsFromDb = JSON.parse(deletedEventIdsRow.value)
          cachedDeletedEventIds = deletedEventIdsFromDb
        } catch (e) {
          console.error('Error parsing deleted event IDs JSON:', e)
        }
      }

      if (deletedPeriodIdsRow?.value) {
        try {
          deletedPeriodIdsFromDb = JSON.parse(deletedPeriodIdsRow.value)
          cachedDeletedPeriodIds = deletedPeriodIdsFromDb
        } catch (e) {
          console.error('Error parsing deleted period IDs JSON:', e)
        }
      }

      if (deletedAccountsRow?.value) {
        try {
          deletedAccountIdsFromDb = JSON.parse(deletedAccountsRow.value)
          cachedDeletedAccountIds = deletedAccountIdsFromDb
        } catch (e) {
          console.error('Error parsing deleted accounts JSON:', e)
        }
      }

      if (deletedMemberCodesRow?.value) {
        try {
          deletedMemberCodesFromDb = JSON.parse(deletedMemberCodesRow.value)
          cachedDeletedMemberCodes = deletedMemberCodesFromDb
        } catch (e) {
          console.error('Error parsing deleted member codes JSON:', e)
        }
      }

      if (accountsRow?.value) {
        try {
          accountsFromDb = JSON.parse(accountsRow.value)
          cachedAccounts = accountsFromDb
        } catch (e) {
          console.error('Error parsing accounts JSON:', e)
        }
      }

      const activeDeletedEventIds = new Set(deletedEventIdsFromDb || cachedDeletedEventIds || [])
      let finalEvents = eventsFromDb || cachedEvents || []
      if (activeDeletedEventIds.size > 0 && Array.isArray(finalEvents)) {
        finalEvents = finalEvents.filter((e: any) => !activeDeletedEventIds.has(e.id))
      }

      const activeDeletedPeriodIds = new Set(deletedPeriodIdsFromDb || cachedDeletedPeriodIds || [])
      const periodMap = new Map<string, any>()
      
      const savedPeriodsList = periodsFromDb !== null ? periodsFromDb : cachedPeriods
      if (Array.isArray(savedPeriodsList)) {
        for (const p of savedPeriodsList) {
          if (p?.id && !activeDeletedPeriodIds.has(p.id)) {
            periodMap.set(p.id, p)
          }
        }
      } else {
        // Chỉ dùng AVAILABLE_PERIODS mặc định nếu hệ thống chưa từng lưu chu kỳ nào
        for (const p of AVAILABLE_PERIODS) {
          if (!activeDeletedPeriodIds.has(p.id)) {
            periodMap.set(p.id, p)
          }
        }
      }
      const safePeriods = Array.from(periodMap.values())

      const activeDeletedAccountIds = new Set(deletedAccountIdsFromDb || cachedDeletedAccountIds || [])
      let finalAccounts = accountsFromDb || cachedAccounts
      if (Array.isArray(finalAccounts) && activeDeletedAccountIds.size > 0) {
        finalAccounts = finalAccounts.filter((a: any) => a?.id && !activeDeletedAccountIds.has(a.id))
      }

      const activeDeletedMemberCodes = new Set(deletedMemberCodesFromDb || cachedDeletedMemberCodes || [])
      let finalMembers = membersFromDb || cachedMembers
      if (Array.isArray(finalMembers)) {
        if (activeDeletedMemberCodes.size > 0) {
          finalMembers = finalMembers.filter((m: any) => m?.member_code && !activeDeletedMemberCodes.has(m.member_code))
        }
        finalMembers = finalMembers.map((m: any) => ({
          ...m,
          avatar_url: m.avatar_url && m.avatar_url.length > 40000 ? undefined : m.avatar_url,
        }))
      }

      return NextResponse.json(
        {
          success: true,
          events: finalEvents,
          activeEventId: activeEventIdFromDb || cachedActiveEventId || '',
          proposals: proposalsFromDb || cachedProposals,
          members: finalMembers,
          disputes: disputesFromDb || cachedDisputes,
          periods: safePeriods,
          activePeriodId: activePeriodFromDb || cachedActivePeriodId || (safePeriods[0]?.id || 'month-2026-10'),
          customPeriodScores: scoresFromDb || cachedPeriodScores,
          customRules: customRulesFromDb || cachedCustomRules || [],
          deletedProposalIds: deletedIdsFromDb || cachedDeletedProposalIds || [],
          deletedEventIds: deletedEventIdsFromDb || cachedDeletedEventIds || [],
          deletedPeriodIds: deletedPeriodIdsFromDb || cachedDeletedPeriodIds || [],
          accounts: finalAccounts,
          deletedAccountIds: Array.from(activeDeletedAccountIds),
          deletedMemberCodes: Array.from(activeDeletedMemberCodes),
          source: 'supabase_cloud',
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      )
    }

    const fallbackDeletedEventIds = new Set(cachedDeletedEventIds || [])
    let fallbackEvents = cachedEvents || []
    if (fallbackDeletedEventIds.size > 0 && Array.isArray(fallbackEvents)) {
      fallbackEvents = fallbackEvents.filter((e: any) => !fallbackDeletedEventIds.has(e.id))
    }

    const fallbackDeletedPeriodIds = new Set(cachedDeletedPeriodIds || [])
    const fallbackPeriodMap = new Map<string, any>()
    if (Array.isArray(cachedPeriods)) {
      for (const p of cachedPeriods) {
        if (p?.id && !fallbackDeletedPeriodIds.has(p.id)) {
          fallbackPeriodMap.set(p.id, p)
        }
      }
    } else {
      for (const p of AVAILABLE_PERIODS) {
        if (!fallbackDeletedPeriodIds.has(p.id)) {
          fallbackPeriodMap.set(p.id, p)
        }
      }
    }
    const safeFallbackPeriods = Array.from(fallbackPeriodMap.values())

    const fallbackDeletedAccountIds = new Set(cachedDeletedAccountIds || [])
    let fallbackAccounts = cachedAccounts || []
    if (fallbackDeletedAccountIds.size > 0 && Array.isArray(fallbackAccounts)) {
      fallbackAccounts = fallbackAccounts.filter((a: any) => !fallbackDeletedAccountIds.has(a.id))
    }

    return NextResponse.json(
      {
        success: true,
        events: fallbackEvents,
        activeEventId: cachedActiveEventId || '',
        proposals: cachedProposals,
        members: cachedMembers,
        disputes: cachedDisputes,
        periods: safeFallbackPeriods,
        activePeriodId: cachedActivePeriodId || (safeFallbackPeriods[0]?.id || 'month-2026-10'),
        customPeriodScores: cachedPeriodScores,
        customRules: cachedCustomRules || [],
        deletedProposalIds: cachedDeletedProposalIds || [],
        deletedEventIds: cachedDeletedEventIds || [],
        deletedPeriodIds: cachedDeletedPeriodIds || [],
        accounts: fallbackAccounts,
        deletedAccountIds: Array.from(fallbackDeletedAccountIds),
        source: 'cache_memory',
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Sync error'
    const errorFallbackDeletedEventIds = new Set(cachedDeletedEventIds || [])
    let errorFallbackEvents = cachedEvents || []
    if (errorFallbackDeletedEventIds.size > 0 && Array.isArray(errorFallbackEvents)) {
      errorFallbackEvents = errorFallbackEvents.filter((e: any) => !errorFallbackDeletedEventIds.has(e.id))
    }

    return NextResponse.json({
      success: true,
      events: errorFallbackEvents,
      proposals: cachedProposals,
      members: cachedMembers,
      disputes: cachedDisputes,
      periods: cachedPeriods,
      activePeriodId: cachedActivePeriodId,
      customPeriodScores: cachedPeriodScores,
      deletedProposalIds: cachedDeletedProposalIds || [],
      deletedEventIds: cachedDeletedEventIds || [],
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
      proposalId,
      deletedProposalIds,
      deletedEventIds,
      deletedPeriodIds,
      periodId,
      activeEventId,
      members,
      disputes,
      periods,
      activePeriodId,
      customPeriodScores,
      customRules,
      accounts,
      deletedAccountIds,
      accountId,
      deletedMemberCodes,
      member,
    } = body
    const supabase = createAdminClient()

    let dbSuccess = false
    let dbErrorMsg = null

    // 0. Quản lý danh sách ID bản ghi đã xóa (Tombstones để chống hồi sinh khi sync từ máy khác)
    if (deletedProposalIds !== undefined || (action === 'delete_proposal' && proposalId)) {
      const incomingDel = Array.isArray(deletedProposalIds) ? deletedProposalIds : []
      if (action === 'delete_proposal' && proposalId && !incomingDel.includes(proposalId)) {
        incomingDel.push(proposalId)
      }
      const combinedDelSet = new Set([
        ...(cachedDeletedProposalIds || []),
        ...incomingDel,
      ])
      cachedDeletedProposalIds = Array.from(combinedDelSet)

      try {
        await supabase
          .from('settings')
          .upsert(
            {
              key: 'issac_deleted_proposal_ids',
              value: JSON.stringify(cachedDeletedProposalIds),
              description: 'Cloud synchronized deleted proposal IDs for iSSAC Web',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          )
      } catch (delErr) {
        console.warn('Supabase deleted proposals upsert notice:', delErr)
      }
    }

    // 0.1 Quản lý danh sách ID sự kiện đã xóa (Tombstones để chống hồi sinh khi sync từ máy khác)
    if (deletedEventIds !== undefined || (action === 'delete_event' && eventId)) {
      const incomingDelEvt = Array.isArray(deletedEventIds) ? deletedEventIds : []
      if (action === 'delete_event' && eventId && !incomingDelEvt.includes(eventId)) {
        incomingDelEvt.push(eventId)
      }
      const combinedDelEvtSet = new Set([
        ...(cachedDeletedEventIds || []),
        ...incomingDelEvt,
      ])
      cachedDeletedEventIds = Array.from(combinedDelEvtSet)

      try {
        await supabase
          .from('settings')
          .upsert(
            {
              key: 'issac_deleted_event_ids',
              value: JSON.stringify(cachedDeletedEventIds),
              description: 'Cloud synchronized deleted event IDs for iSSAC Web',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          )
      } catch (delEvtErr) {
        console.warn('Supabase deleted events upsert notice:', delEvtErr)
      }
    }

    // 0.2 Quản lý danh sách ID chu kỳ thi đua đã xóa (Tombstones để chống hồi sinh chu kỳ đã xóa)
    if (deletedPeriodIds !== undefined || (action === 'delete_period' && periodId)) {
      if (action === 'delete_period' && periodId) {
        const set = new Set([...(cachedDeletedPeriodIds || []), periodId])
        cachedDeletedPeriodIds = Array.from(set)
      } else if (Array.isArray(deletedPeriodIds)) {
        cachedDeletedPeriodIds = Array.from(new Set(deletedPeriodIds))
      }
    }

    // Nếu có danh sách periods được gửi lên (kể cả tạo mới hay cập nhật):
    // Mọi chu kỳ có trong periods đều PHẢI ĐƯỢC GỠ KHỎI cachedDeletedPeriodIds!
    if (periods !== undefined && Array.isArray(periods)) {
      const activePeriodIds = new Set(periods.map((p: any) => p?.id).filter(Boolean))
      if (cachedDeletedPeriodIds && cachedDeletedPeriodIds.length > 0) {
        cachedDeletedPeriodIds = cachedDeletedPeriodIds.filter((id) => !activePeriodIds.has(id))
      }
    }

    if (deletedPeriodIds !== undefined || (action === 'delete_period' && periodId) || (periods !== undefined && Array.isArray(periods))) {
      try {
        await supabase
          .from('settings')
          .upsert(
            {
              key: 'issac_deleted_period_ids',
              value: JSON.stringify(cachedDeletedPeriodIds || []),
              description: 'Cloud synchronized deleted period IDs for iSSAC Web',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          )
      } catch (delPerErr) {
        console.warn('Supabase deleted periods upsert notice:', delPerErr)
      }
    }

    // 0.3 Quản lý danh sách ID tài khoản đã xóa (Tombstones để đồng bộ nhất quán giữa Điện thoại và Máy tính)
    if (deletedAccountIds !== undefined || (action === 'delete_account' && accountId)) {
      const incomingDelAcc = Array.isArray(deletedAccountIds) ? deletedAccountIds : []
      if (action === 'delete_account' && accountId && !incomingDelAcc.includes(accountId)) {
        incomingDelAcc.push(accountId)
      }
      const combinedDelAccSet = new Set([
        ...(cachedDeletedAccountIds || []),
        ...incomingDelAcc,
      ])
      cachedDeletedAccountIds = Array.from(combinedDelAccSet)

      if (Array.isArray(cachedAccounts)) {
        cachedAccounts = cachedAccounts.filter((a: any) => !combinedDelAccSet.has(a.id))
      }

      try {
        await supabase
          .from('settings')
          .upsert(
            {
              key: 'issac_deleted_account_ids',
              value: JSON.stringify(cachedDeletedAccountIds),
              description: 'Cloud synchronized deleted account IDs for iSSAC Web',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          )
      } catch (delAccErr) {
        console.warn('Supabase deleted accounts upsert notice:', delAccErr)
      }
    }

    // 0.4 Quản lý danh sách Member Code đã xóa (Tombstones để chống hồi sinh khi sync từ thiết bị khác)
    if (deletedMemberCodes !== undefined || (action === 'delete_member' && memberCode)) {
      const incomingDel = Array.isArray(deletedMemberCodes) ? deletedMemberCodes : []
      if (action === 'delete_member' && memberCode && !incomingDel.includes(memberCode)) {
        incomingDel.push(memberCode)
      }
      const combinedDelSet = new Set([
        ...(cachedDeletedMemberCodes || []),
        ...incomingDel,
      ])
      cachedDeletedMemberCodes = Array.from(combinedDelSet)

      try {
        await supabase
          .from('settings')
          .upsert(
            {
              key: 'issac_deleted_member_codes',
              value: JSON.stringify(cachedDeletedMemberCodes),
              description: 'Cloud synchronized deleted member codes for iSSAC Web',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          )
      } catch (delMemErr) {
        console.warn('Supabase deleted member codes upsert notice:', delMemErr)
      }
    }

    const shouldUpdateEvents = events !== undefined || action !== undefined

    if (shouldUpdateEvents) {
      // Nếu chưa có cachedEvents trong bộ nhớ server, tải từ Supabase trước
      if (!cachedEvents) {
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

      let updatedEvents = cachedEvents || []

      if (action === 'delete_event' && eventId) {
        // Xóa sự kiện cụ thể
        updatedEvents = updatedEvents.filter((e: any) => e.id !== eventId)
        if (Array.isArray(events)) {
          updatedEvents = events.filter((e: any) => e.id !== eventId)
        }
      } else if (action === 'create_event' && event) {
        // Đẩy sự kiện mới lên đầu danh sách và giữ nguyên các sự kiện cũ
        updatedEvents = [event, ...updatedEvents.filter((e: any) => e.id !== event.id)]
      } else if (action === 'update_event' && eventId && (event || body.event)) {
        // Cập nhật thông tin sự kiện
        const evUpdates = event || body.event
        updatedEvents = updatedEvents.map((evt: any) => {
          if (evt.id === eventId) {
            return {
              ...evt,
              ...evUpdates,
            }
          }
          return evt
        })
        if (Array.isArray(events)) {
          updatedEvents = events
        }
      } else if (action === 'update_event_attendees' && eventId && Array.isArray(body.registeredMemberCodes)) {
        // Cập nhật danh sách thành viên đăng ký theo danh sách CLB
        updatedEvents = updatedEvents.map((evt: any) => {
          if (evt.id === eventId) {
            return {
              ...evt,
              registeredMemberCodes: body.registeredMemberCodes,
            }
          }
          return evt
        })
        if (Array.isArray(events)) {
          updatedEvents = events
        }
      } else if (action === 'unregister' && eventId && memberCode) {
        // Hủy đăng ký 1 thành viên
        updatedEvents = updatedEvents.map((evt: any) => {
          if (evt.id === eventId) {
            return {
              ...evt,
              registeredMemberCodes: (evt.registeredMemberCodes || []).filter((c: string) => c !== memberCode),
            }
          }
          return evt
        })
        if (Array.isArray(events)) {
          updatedEvents = events
        }
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
      } else if (events && Array.isArray(events)) {
        // Hợp nhất events 2 chiều thông minh theo ID (tránh ghi đè mất sự kiện hoặc mất record điểm danh)
        const delSet = new Set(cachedDeletedEventIds || [])
        const evtMap = new Map<string, any>()
        for (const e of updatedEvents) {
          if (e?.id && !delSet.has(e.id)) evtMap.set(e.id, e)
        }
        for (const e of events) {
          if (e?.id && !delSet.has(e.id)) {
            const existing = evtMap.get(e.id)
            if (!existing) {
              evtMap.set(e.id, e)
            } else {
              evtMap.set(e.id, {
                ...existing,
                ...e,
                isFinalized: existing.isFinalized || e.isFinalized,
                registeredMemberCodes: Array.from(
                  new Set([...(existing.registeredMemberCodes || []), ...(e.registeredMemberCodes || [])])
                ),
                records: {
                  ...(existing.records || {}),
                  ...(e.records || {}),
                },
              })
            }
          }
        }
        updatedEvents = Array.from(evtMap.values())
      }

      if (cachedDeletedEventIds && cachedDeletedEventIds.length > 0) {
        const delSet = new Set(cachedDeletedEventIds)
        updatedEvents = updatedEvents.filter((e: any) => !delSet.has(e.id))
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

    // 2. Đồng bộ & Hợp nhất Proposals 2 chiều (Chống mất dữ liệu lịch sử điểm số)
    if (proposals !== undefined || (action === 'delete_proposal' && proposalId)) {
      if (!cachedProposals) {
        try {
          const { data: curRow } = await supabase
            .from('settings')
            .select('value')
            .eq('key', 'issac_proposals_cloud')
            .maybeSingle()
          if (curRow?.value) {
            cachedProposals = JSON.parse(curRow.value)
          }
        } catch (e) {
          console.warn('Error reading current proposals before update:', e)
        }
      }

      const existingProps = cachedProposals || []
      const incomingProps = Array.isArray(proposals) ? proposals : []
      const deletedSet = new Set(cachedDeletedProposalIds || [])

      const propMap = new Map<string, any>()
      // Thêm các proposal hiện có nếu chưa bị xóa
      for (const p of existingProps) {
        if (p?.id && !deletedSet.has(p.id) && p.status !== 'deleted') {
          propMap.set(p.id, p)
        }
      }
      // Hợp nhất các proposal từ client (cập nhật hoặc thêm mới)
      for (const p of incomingProps) {
        if (p?.id && !deletedSet.has(p.id) && p.status !== 'deleted') {
          propMap.set(p.id, p)
        }
      }

      if (action === 'delete_proposal' && proposalId) {
        propMap.delete(proposalId)
      }

      const mergedProposals = Array.from(propMap.values())
      cachedProposals = mergedProposals

      try {
        await supabase
          .from('settings')
          .upsert(
            {
              key: 'issac_proposals_cloud',
              value: JSON.stringify(mergedProposals),
              description: 'Cloud synchronized proposals for iSSAC Web',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          )
      } catch (propErr) {
        console.warn('Supabase proposals upsert notice:', propErr)
      }
    }

    if (members !== undefined || action === 'add_member' || action === 'delete_member') {
      const activeDelMemSet = new Set(cachedDeletedMemberCodes || [])
      let baseMembers = members !== undefined ? members : (cachedMembers || [])
      if (!Array.isArray(baseMembers)) baseMembers = []

      if (action === 'delete_member' && memberCode) {
        baseMembers = baseMembers.filter((m: any) => m.member_code !== memberCode)
      }

      if (action === 'add_member' && member) {
        const existingIdx = baseMembers.findIndex((m: any) => m.member_code === member.member_code)
        if (existingIdx >= 0) {
          baseMembers[existingIdx] = member
        } else {
          baseMembers.push(member)
        }
      }

      // Filter out deleted members and sanitize oversized avatars
      const cleanMembers = baseMembers
        .filter((m: any) => m?.member_code && !activeDelMemSet.has(m.member_code))
        .map((m: any) => ({
          ...m,
          avatar_url: m.avatar_url && m.avatar_url.length > 40000 ? undefined : m.avatar_url,
        }))

      cachedMembers = cleanMembers
      try {
        await supabase
          .from('settings')
          .upsert(
            {
              key: 'issac_members_cloud',
              value: JSON.stringify(cleanMembers),
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
      const activeDelPerSet = new Set(cachedDeletedPeriodIds || [])
      const cleanPeriods = Array.isArray(periods)
        ? periods.filter((p: any) => p?.id && !activeDelPerSet.has(p.id))
        : periods
      cachedPeriods = cleanPeriods
      try {
        await supabase
          .from('settings')
          .upsert(
            {
              key: 'issac_periods_cloud',
              value: JSON.stringify(cleanPeriods),
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

    if (activeEventId !== undefined) {
      cachedActiveEventId = String(activeEventId)
      try {
        await supabase
          .from('settings')
          .upsert(
            {
              key: 'issac_active_event_id',
              value: String(activeEventId),
              description: 'Cloud synchronized active event ID for iSSAC Web',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          )
      } catch (actEvtErr) {
        console.warn('Supabase active event upsert notice:', actEvtErr)
      }
    }

    if (customRules !== undefined) {
      cachedCustomRules = customRules
      try {
        await supabase
          .from('settings')
          .upsert(
            {
              key: 'issac_custom_rules_cloud',
              value: JSON.stringify(customRules),
              description: 'Cloud synchronized custom rules for iSSAC Web',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          )
      } catch (ruleErr) {
        console.warn('Supabase custom rules upsert notice:', ruleErr)
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

    if (accounts !== undefined) {
      const activeDelAccSet = new Set(cachedDeletedAccountIds || [])
      const cleanAccounts = Array.isArray(accounts)
        ? accounts.filter((a: any) => a?.id && !activeDelAccSet.has(a.id))
        : accounts
      cachedAccounts = cleanAccounts
      try {
        await supabase
          .from('settings')
          .upsert(
            {
              key: 'issac_issued_accounts_cloud',
              value: JSON.stringify(cleanAccounts),
              description: 'Cloud synchronized issued accounts for iSSAC Web',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          )
      } catch (accErr) {
        console.warn('Supabase accounts upsert notice:', accErr)
      }
    }

    return NextResponse.json({
      success: true,
      events: cachedEvents,
      activeEventId: cachedActiveEventId || '',
      proposals: cachedProposals,
      members: cachedMembers,
      disputes: cachedDisputes,
      periods: cachedPeriods,
      activePeriodId: cachedActivePeriodId || 'month-2026-10',
      customPeriodScores: cachedPeriodScores,
      customRules: cachedCustomRules || [],
      deletedProposalIds: cachedDeletedProposalIds || [],
      deletedEventIds: cachedDeletedEventIds || [],
      deletedPeriodIds: cachedDeletedPeriodIds || [],
      accounts: cachedAccounts,
      deletedAccountIds: cachedDeletedAccountIds || [],
      deletedMemberCodes: cachedDeletedMemberCodes || [],
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
