import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateScoreDelta } from '@/lib/scoring/engine'
import { CRITERIA_RULES } from '@/lib/scoring/constants'
import type { RuleCode } from '@/types/database'

// POST /api/db/test-transaction — Thử nghiệm tính điểm và ghi sổ trực tiếp vào database thật
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const { memberCode, criterionCode, reason = 'Kiểm thử logic database' } = body

    if (!memberCode || !criterionCode) {
      return NextResponse.json(
        { error: 'Thiếu trường bắt buộc: memberCode, criterionCode' },
        { status: 400 }
      )
    }

    // 1. Fetch member from real DB
    const { data: member, error: mErr } = await supabase
      .from('members')
      .select('id, member_code, full_name, is_core_team, current_score, term_id')
      .eq('member_code', memberCode)
      .single()

    if (mErr || !member) {
      return NextResponse.json(
        { error: `Không tìm thấy thành viên với mã: ${memberCode}` },
        { status: 404 }
      )
    }

    // 2. Fetch criterion rule
    const rule = CRITERIA_RULES[criterionCode as RuleCode]
    if (!rule) {
      return NextResponse.json(
        { error: `Không tìm thấy tiêu chí: ${criterionCode}` },
        { status: 404 }
      )
    }

    // 3. Authoritative scoring calculation
    const calc = calculateScoreDelta({
      ruleCode: criterionCode as RuleCode,
      basePoints: rule.base_points,
      isCoreAtEvent: member.is_core_team,
      currentScore: Number(member.current_score),
    })

    // 4. Record to score_ledger table in real Postgres
    const occurredAt = new Date().toISOString()
    const idempotencyKey = `test-${member.id}-${criterionCode}-${Date.now()}`

    const { data: ledger, error: lErr } = await supabase
      .from('score_ledger')
      .insert({
        member_id: member.id,
        term_id: member.term_id,
        criterion_code: criterionCode,
        score_before: calc.scoreBefore,
        raw_delta: rule.base_points,
        multiplier: calc.coreMultiplier,
        applied_delta: calc.actualDelta,
        score_after: calc.scoreAfter,
        reason,
        status: 'approved',
        occurred_at: occurredAt,
        idempotency_key: idempotencyKey,
        recorded_by: member.id, // self or system
        approved_by: member.id,
      })
      .select()
      .single()

    if (lErr) {
      console.error('[test-transaction] Ledger insert error:', lErr)
      return NextResponse.json({ error: lErr.message }, { status: 500 })
    }

    // 5. Update member current_score in members table
    const { error: uErr } = await supabase
      .from('members')
      .update({
        current_score: calc.scoreAfter,
        updated_at: new Date().toISOString(),
      })
      .eq('id', member.id)

    if (uErr) {
      console.error('[test-transaction] Member update error:', uErr)
      return NextResponse.json({ error: uErr.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      member: {
        code: member.member_code,
        name: member.full_name,
        isCore: member.is_core_team,
      },
      rule: {
        code: rule.code,
        name: rule.name,
        basePoints: rule.base_points,
      },
      calculation: {
        scoreBefore: calc.scoreBefore,
        appliedDelta: calc.actualDelta,
        scoreAfter: calc.scoreAfter,
        coreMultiplier: calc.coreMultiplier,
        rulePoints: calc.rulePoints,
      },
      ledgerRecord: {
        id: ledger.id,
        idempotencyKey: ledger.idempotency_key,
        createdAt: ledger.created_at,
      },
      message: `Đã cập nhật điểm thành viên ${member.full_name}: ${calc.scoreBefore} → ${calc.scoreAfter} (${calc.actualDelta > 0 ? '+' : ''}${calc.actualDelta}đ) và ghi sổ Score Ledger trong DB thật!`,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
