'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, PRESET_USERS } from '@/lib/auth/AuthContext'
import { useClub, type ProposalItem } from '@/lib/context/ClubContext'
import { CRITERIA_RULES, getRatingLevel } from '@/lib/scoring/constants'
import { calculateScoreDelta } from '@/lib/scoring/engine'
import type { RuleCode } from '@/types/database'
import { AddMemberModal } from '@/components/admin/AddMemberModal'
import { normalizeHistoryTimestamp } from '@/lib/vietnamTime'
import {
  KeyRound,
  Crown,
  ClipboardList,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Users,
  Settings,
  Send,
  Sparkles,
  ArrowRight,
  FileCheck,
  UserPlus,
  ShieldAlert,
  Info,
  Zap,
} from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const { currentUser, isAuthChecked, isBCN, isHR, switchUser } = useAuth()
  const { members, proposals, createProposal, approveProposal, rejectProposal, customRules } = useClub()

  // Auth Guard
  useEffect(() => {
    if (isAuthChecked && !currentUser) {
      router.replace('/login')
    }
  }, [isAuthChecked, currentUser, router])

  const [activeTab, setActiveTab] = useState<'proposals' | 'members' | 'settings'>('proposals')
  const [addModalOpen, setAddModalOpen] = useState(false)

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFBFC]">
        <div className="w-8 h-8 border-3 border-[#1351D8] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!currentUser) return null

  // Scoring Form State
  const [targetMemberCode, setTargetMemberCode] = useState(members[7]?.member_code || '24070753')
  const [criterionCode, setCriterionCode] = useState<string>('T07') // Default to penalty T07 for HR
  const [isCustomPoints, setIsCustomPoints] = useState(false)
  const [customPoints, setCustomPoints] = useState<number>(-2)
  const [reason, setReason] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [directApply, setDirectApply] = useState(isBCN) // BCN can direct apply
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const targetMember = members.find((m) => m.member_code === targetMemberCode) || members[0]
  const rule = CRITERIA_RULES[criterionCode as RuleCode]
  const customRule = customRules.find((r) => r.code === criterionCode)

  const handleCriterionChange = (newCode: string) => {
    setCriterionCode(newCode)
    if (newCode === 'CUSTOM_POINT_DEDUCT') {
      setIsCustomPoints(true)
      setCustomPoints((prev) => (prev < 0 ? prev : -2))
    } else if (newCode === 'CUSTOM_POINT_ADD') {
      setIsCustomPoints(true)
      setCustomPoints((prev) => (prev > 0 ? prev : 2))
    } else {
      const bRule = CRITERIA_RULES[newCode as RuleCode]
      const cRule = customRules.find((r) => r.code === newCode)
      if (bRule) {
        setCustomPoints(bRule.type === 'deduct' ? -bRule.base_points : bRule.base_points)
      } else if (cRule) {
        const pts = typeof cRule.points === 'number' ? cRule.points : parseFloat(String(cRule.points)) || 0
        setCustomPoints(pts)
      }
    }
  }

  const isCustomMode = isCustomPoints || criterionCode.startsWith('CUSTOM_POINT_')
  let previewActualDelta = 0
  let previewScoreAfter = targetMember?.current_score || 60

  if (isCustomMode) {
    previewActualDelta = typeof customPoints === 'number' && !isNaN(customPoints) ? customPoints : 0
    previewScoreAfter = Math.max(0, Math.min(100, (targetMember?.current_score || 60) + previewActualDelta))
  } else if (rule) {
    const preview = calculateScoreDelta({
      ruleCode: criterionCode as RuleCode,
      basePoints: rule.base_points,
      isCoreAtEvent: targetMember.is_core,
      currentScore: targetMember.current_score,
    })
    previewActualDelta = preview.actualDelta
    previewScoreAfter = preview.scoreAfter
  } else if (customRule) {
    const basePts =
      typeof customRule.points === 'number'
        ? customRule.points
        : parseFloat(String(customRule.points)) || 0
    const isCoreMultiplier = !!customRule.coreMultiplierApplies && basePts < 0
    const multiplier = targetMember?.is_core && isCoreMultiplier ? 2 : 1
    const nominal = basePts * multiplier
    previewScoreAfter = Math.max(0, Math.min(100, (targetMember?.current_score || 60) + nominal))
    previewActualDelta = previewScoreAfter - (targetMember?.current_score || 60)
  }

  // Pending proposals awaiting BCN
  const pendingQueue = proposals.filter((p) => p.status === 'pending_bcn')
  const historyQueue = proposals.filter((p) => p.status !== 'pending_bcn')

  const handleSubmitScore = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) return

    const res = createProposal({
      memberCode: targetMember.member_code,
      criterionCode,
      customPoints: isCustomMode ? customPoints : undefined,
      reason,
      evidenceUrl,
      proposerName: currentUser.name,
      proposerRole: currentUser.role,
      directApply: isBCN ? directApply : false, // Only BCN can directApply
    })

    if (res.success) {
      setFormFeedback({ type: 'success', message: res.message })
      setReason('')
      setEvidenceUrl('')
      setTimeout(() => setFormFeedback(null), 3500)
    } else {
      setFormFeedback({ type: 'error', message: res.message })
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Role Banner Notification */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isBCN
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            : isHR
            ? 'bg-purple-500/10 border-purple-500/30 text-purple-200'
            : 'bg-blue-500/10 border-blue-500/30 text-blue-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-base ${currentUser.avatarBg}`}
          >
            {isBCN ? <Crown className="w-5 h-5 text-white" /> : <ClipboardList className="w-5 h-5 text-white" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white">{currentUser.name}</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-black/40 border border-white/10 text-white">
                {currentUser.roleTitle}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isBCN
                ? 'Quyền tối cao: Thêm thành viên mới, duyệt điểm trực tiếp và phê duyệt toàn bộ đề xuất của Ban Nhân sự.'
                : isHR
                ? 'Ban Nhân sự: Có quyền ghi nhận trừ điểm và cộng điểm, đề xuất sẽ chuyển tới Ban Chủ nhiệm phê duyệt.'
                : 'Trưởng ban: Chấm điểm thành viên trong ban chuyên môn.'}
            </p>
          </div>
        </div>

        {/* Quick switcher in page */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] text-slate-400 font-medium">Chuyển vai trò:</span>
          <select
            value={currentUser.id}
            onChange={(e) => switchUser(e.target.value)}
            className="bg-[#0B1530] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            {PRESET_USERS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Admin Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Trung Tâm Quản Trị & Phê Duyệt Điểm
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quy trình kiểm soát điểm thi đua nghiêm ngặt theo đúng phân quyền CLB
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add member button (Only for BCN) */}
          {isBCN && (
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-[#1E63D6] text-white hover:opacity-90 shadow-md transition-all"
            >
              <UserPlus className="w-4 h-4 text-white" />
              <span>Thêm Thành Viên Mới</span>
            </button>
          )}

          {/* Tab Navigation */}
          <div className="flex gap-1 p-1 glass-panel rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('proposals')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'proposals'
                  ? 'bg-[#1E63D6] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Chấm & Duyệt ({pendingQueue.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'members'
                  ? 'bg-[#1E63D6] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Thành Viên ({members.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'settings'
                  ? 'bg-[#1E63D6] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Cài Đặt</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: Proposals & Approval Hub */}
      {activeTab === 'proposals' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form: 5 cols */}
          <div className="lg:col-span-5 glass-panel-glow rounded-3xl p-6 border border-[#1E63D6]/30 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F5B301]">
                  {isBCN ? 'BCN Chấm Điểm' : 'Ban Nhân Sự Đề Xuất'}
                </span>
                {isHR && (
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Qua BCN Duyệt
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-white mt-1">
                {isBCN ? 'Ghi Nhận & Duyệt Điểm' : 'Ghi Nhận Trừ / Cộng Điểm'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isBCN
                  ? 'Ban Chủ nhiệm có thể áp dụng trực tiếp hoặc gửi phê duyệt'
                  : 'Đề xuất sẽ được chuyển vào hàng đợi chờ Ban Chủ nhiệm duyệt'}
              </p>
            </div>

            {formFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  formFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{formFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmitScore} className="space-y-3.5">
              {/* Member select */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Chọn thành viên:
                </label>
                <select
                  value={targetMemberCode}
                  onChange={(e) => setTargetMemberCode(e.target.value)}
                  className="w-full bg-[#070D1E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1E63D6]"
                >
                  {members.map((m) => (
                    <option key={m.member_code} value={m.member_code}>
                      {m.full_name} ({m.department_name} - {m.current_score}đ)
                    </option>
                  ))}
                </select>
              </div>

              {/* Criterion select */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tiêu chí tính điểm:
                </label>
                <select
                  value={criterionCode}
                  onChange={(e) => handleCriterionChange(e.target.value)}
                  className="w-full bg-[#070D1E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1E63D6]"
                >
                  <optgroup label="--- ⚡ ĐIỂM TỰ CHO / TÙY CHỈNH ĐIỂM ---">
                    <option value="CUSTOM_POINT_DEDUCT">⚡ Điểm trừ tự cho (Tùy chỉnh số điểm trừ)</option>
                    <option value="CUSTOM_POINT_ADD">⚡ Điểm cộng tự cho (Tùy chỉnh số điểm cộng)</option>
                  </optgroup>
                  <optgroup label="--- Điểm trừ vi phạm (T01-T13) ---">
                    {Object.values(CRITERIA_RULES)
                      .filter((c) => c.type === 'deduct')
                      .map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} ({c.base_points}đ): {c.name}
                        </option>
                      ))}
                  </optgroup>
                  {customRules.filter((c) => c.type === 'deduct').length > 0 && (
                    <optgroup label="--- Điểm trừ quy định bổ sung của CLB ---">
                      {customRules
                        .filter((c) => c.type === 'deduct')
                        .map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code} ({c.points}đ): {c.name}
                          </option>
                        ))}
                    </optgroup>
                  )}
                  <optgroup label="--- Điểm cộng đóng góp (C01-C09) ---">
                    {Object.values(CRITERIA_RULES)
                      .filter((c) => c.type === 'add')
                      .map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} (+{c.base_points}đ): {c.name}
                        </option>
                      ))}
                  </optgroup>
                  {customRules.filter((c) => c.type === 'add').length > 0 && (
                    <optgroup label="--- Điểm cộng quy định bổ sung của CLB ---">
                      {customRules
                        .filter((c) => c.type === 'add')
                        .map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code} (+{c.points}đ): {c.name}
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Custom points input & toggle */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#F5B301]" />
                    <span>Số điểm áp dụng:</span>
                  </label>
                  <div className="inline-flex p-0.5 rounded-lg bg-black/40 text-[10.5px] font-bold">
                    <button
                      type="button"
                      disabled={criterionCode.startsWith('CUSTOM_POINT_')}
                      onClick={() => setIsCustomPoints(false)}
                      className={`px-2 py-0.5 rounded transition ${
                        !isCustomMode
                          ? 'bg-[#1E63D6] text-white shadow'
                          : 'text-slate-400 hover:text-white disabled:opacity-40'
                      }`}
                    >
                      Mặc định ({rule ? `${rule.type === 'deduct' ? '-' : '+'}${rule.base_points}đ` : '0đ'})
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCustomPoints(true)}
                      className={`px-2 py-0.5 rounded transition flex items-center gap-1 ${
                        isCustomMode
                          ? 'bg-[#F5B301] text-slate-950 font-black shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Zap className="w-3 h-3" />
                      <span>Điểm tự cho</span>
                    </button>
                  </div>
                </div>

                {isCustomMode ? (
                  <div className="space-y-2 pt-1 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          value={customPoints}
                          onChange={(e) => setCustomPoints(Number(e.target.value))}
                          placeholder="Nhập số điểm (+ hoặc -)..."
                          className="w-full bg-[#070D1E] border border-[#F5B301]/40 focus:border-[#F5B301] rounded-xl px-3 py-1.5 text-xs font-black text-white focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">
                          điểm
                        </span>
                      </div>
                      <div
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-black min-w-[60px] text-center ${
                          customPoints > 0
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : customPoints < 0
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-white/10 text-slate-300'
                        }`}
                      >
                        {customPoints > 0 ? `+${customPoints}đ` : `${customPoints}đ`}
                      </div>
                    </div>

                    {/* Chips */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] text-slate-400 mr-0.5">Nhanh:</span>
                      {[-10, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 10].map((pt) => (
                        <button
                          key={pt}
                          type="button"
                          onClick={() => setCustomPoints(pt)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                            customPoints === pt
                              ? pt > 0
                                ? 'bg-emerald-500 text-white'
                                : 'bg-rose-500 text-white'
                              : pt > 0
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20'
                          }`}
                        >
                          {pt > 0 ? `+${pt}` : pt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[10.5px] text-slate-400">
                    Đang dùng điểm mặc định. Bấm <span className="font-bold text-[#F5B301]">"Điểm tự cho"</span> để tự nhập điểm.
                  </p>
                )}
              </div>

              {/* Preview card */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Điểm hiện tại:</span>
                  <span className="font-bold text-white">{targetMember.current_score}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Chế tài Core Team:</span>
                  <span className={`font-bold ${targetMember.is_core ? 'text-[#F5B301]' : 'text-slate-400'}`}>
                    {targetMember.is_core ? 'Có (Phạt ×2 nếu dùng quy định chuẩn)' : 'Không'}
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-1 font-bold">
                  <span className="text-slate-300">Dự kiến sau cập nhật:</span>
                  <span className={previewActualDelta > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {previewScoreAfter} ({previewActualDelta > 0 ? `+${previewActualDelta}` : previewActualDelta} đ)
                  </span>
                </div>
              </div>

              {/* Direct Apply Option for BCN */}
              {isBCN && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Áp dụng trực tiếp (Quyền BCN)</span>
                    <span className="text-[10px] text-amber-300">Cập nhật ngay vào sổ cái không cần chờ</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={directApply}
                    onChange={(e) => setDirectApply(e.target.checked)}
                    className="w-4 h-4 rounded text-[#F5B301] focus:ring-[#F5B301] bg-[#070D1E]"
                  />
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Lý do / Mô tả chi tiết: <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ghi rõ sự vụ vi phạm hoặc đóng góp..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[#070D1E] border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1E63D6]"
                />
              </div>

              {/* Evidence */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Link minh chứng (nếu có):
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  className="w-full bg-[#070D1E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1E63D6]"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-md transition-all ${
                  isBCN && directApply
                    ? 'bg-gradient-to-r from-amber-500 to-[#1E63D6] hover:opacity-90'
                    : 'bg-[#1E63D6] hover:bg-[#1E63D6]/90'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {isBCN
                    ? directApply
                      ? 'Áp Dụng Điểm Trực Tiếp (BCN)'
                      : 'Đưa Vào Hàng Đợi Duyệt'
                    : 'Gửi Ban Chủ Nhiệm Phê Duyệt'}
                </span>
              </button>
            </form>
          </div>

          {/* Right Queue: 7 cols */}
          <div className="lg:col-span-7 glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-black text-white">
                  {isBCN ? 'Hàng Đợi Chờ BCN Phê Duyệt' : 'Danh Sách Đề Xuất Của Ban Nhân Sự'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isBCN
                    ? 'Ban Chủ nhiệm xem xét và duyệt các đề xuất trừ/cộng điểm'
                    : 'Theo dõi tiến độ xét duyệt của Ban Chủ nhiệm'}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F5B301]/20 text-[#F5B301] border border-[#F5B301]/30">
                {pendingQueue.length} chờ BCN duyệt
              </span>
            </div>

            {pendingQueue.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                🎉 Không có đề xuất nào đang chờ duyệt. Mọi việc đã xử lý xong!
              </div>
            ) : (
              <div className="space-y-3">
                {pendingQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{item.memberName}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded bg-white/5 text-slate-300">
                          {item.memberDept}
                        </span>
                        {item.isCore && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-[#F5B301]">
                            Core Team (×2)
                          </span>
                        )}
                      </div>
                      <span
                        className={`font-black text-sm ${
                          item.points > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {item.points > 0 ? `+${item.points}` : item.points} điểm
                      </span>
                    </div>

                    <div className="text-xs text-slate-300">
                      <span className="font-bold text-[#F5B301] mr-1.5">
                        [{item.criterionCode}] {item.criterionName}:
                      </span>
                      {item.reason}
                    </div>

                    {item.evidenceUrl && (
                      <div className="text-[11px] text-[#38BDF8] truncate">
                        Minh chứng:{' '}
                        <a
                          href={item.evidenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          {item.evidenceUrl}
                        </a>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-400">
                      <span>Người đề xuất: {item.proposedBy} - {normalizeHistoryTimestamp(item.createdAt)}</span>

                      {/* Approval buttons (BCN only) */}
                      {isBCN ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => rejectProposal(item.id)}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Từ chối</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => approveProposal(item.id)}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Duyệt điểm</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          <Info className="w-3.5 h-3.5" />
                          Đang chờ BCN phê duyệt
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* History of approved/rejected */}
            {historyQueue.length > 0 && (
              <div className="pt-4 border-t border-white/10">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Lịch sử đề xuất đã xử lý gần đây
                </span>
                <div className="space-y-2">
                  {historyQueue.slice(0, 3).map((h) => (
                    <div
                      key={h.id}
                      className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs text-slate-300"
                    >
                      <div className="truncate mr-2">
                        <span className="font-semibold text-white">{h.memberName}</span>{' '}
                        <span className="text-slate-400">[{h.criterionCode}] {h.reason}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          h.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {h.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Members Directory */}
      {activeTab === 'members' && (
        <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <h3 className="text-base font-black text-white">
                Danh Sách {members.length} Nhân Sự CLB
              </h3>
              <p className="text-xs text-slate-400">
                Hiển thị đầy đủ thông tin nội bộ (MSSV, SĐT, Email) theo phân quyền quản trị
              </p>
            </div>

            {isBCN && (
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1E63D6] text-white hover:bg-[#1E63D6]/90 shadow"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#F5B301]" />
                <span>+ Thêm thành viên</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0B1530] text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-2.5 px-3">STT</th>
                  <th className="py-2.5 px-4">Họ và tên</th>
                  <th className="py-2.5 px-4">Ban</th>
                  <th className="py-2.5 px-4">Chức vụ</th>
                  <th className="py-2.5 px-4">MSSV</th>
                  <th className="py-2.5 px-4">SĐT</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-3 text-right">Điểm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {members.map((m) => (
                  <tr key={m.member_code} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 font-mono text-slate-500">{m.source_stt}</td>
                    <td className="py-2.5 px-4 font-bold text-white flex items-center gap-1.5">
                      <span>{m.full_name}</span>
                      {m.is_core && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-bold badge-core">
                          Core
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-300">{m.department_name}</td>
                    <td className="py-2.5 px-4 text-slate-400">{m.position}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-300">{m.student_id || '-'}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-300">{m.phone || '-'}</td>
                    <td className="py-2.5 px-4 text-slate-400">{m.email}</td>
                    <td className="py-2.5 px-3 text-right font-black text-white">
                      {m.current_score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: System Settings */}
      {activeTab === 'settings' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 max-w-2xl mx-auto space-y-5">
          <div>
            <h3 className="text-lg font-black text-white">Cấu Hình Quy Chế Điểm</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Các tham số chuẩn được áp dụng tự động trong toàn bộ hệ thống
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
              <div>
                <span className="font-bold text-white block">Điểm khởi đầu (initial_score)</span>
                <span className="text-slate-400">Mức điểm cấp cho thành viên đầu nhiệm kỳ</span>
              </div>
              <span className="font-mono text-sm font-black text-[#F5B301]">60</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
              <div>
                <span className="font-bold text-white block">Thang điểm (score_min / score_max)</span>
                <span className="text-slate-400">Khoảng giới hạn clamp cứng sau mọi đợt tính toán</span>
              </div>
              <span className="font-mono text-sm font-black text-[#F5B301]">[0, 100]</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
              <div>
                <span className="font-bold text-white block">Trần tương tác tháng (interaction_cap)</span>
                <span className="text-slate-400">Hạn ngạch tối đa cho nhóm C01 + C02 + C03</span>
              </div>
              <span className="font-mono text-sm font-black text-[#F5B301]">15 đ/tháng</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
              <div>
                <span className="font-bold text-white block">Chế tài Core Team (core_multiplier)</span>
                <span className="text-slate-400">Hệ số nhân đôi cho điểm trừ vi phạm</span>
              </div>
              <span className="font-mono text-sm font-black text-[#F5B301]">×2</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
              <div>
                <span className="font-bold text-white block">Số lần T02 dừng tư cách (t02_max_count)</span>
                <span className="text-slate-400">Vắng họp không phép kích hoạt hồ sơ xem xét</span>
              </div>
              <span className="font-mono text-sm font-black text-[#F5B301]">3 lần</span>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      <AddMemberModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </div>
  )
}
