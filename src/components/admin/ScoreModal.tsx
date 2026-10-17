'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useClub } from '@/lib/context/ClubContext'
import { CRITERIA_RULES } from '@/lib/scoring/constants'
import { calculateScoreDelta } from '@/lib/scoring/engine'
import type { RuleCode } from '@/types/database'
import { Send, X, CheckCircle2, ShieldAlert, Crown, ClipboardList, Lock, Calendar, Zap, Sparkles } from 'lucide-react'

interface ScoreModalProps {
  isOpen: boolean
  onClose: () => void
  initialPeriodId?: string
}

export function ScoreModal({ isOpen, onClose, initialPeriodId }: ScoreModalProps) {
  const { currentUser, isBCN, isHR } = useAuth()
  const { members, createProposal, periods, currentActivePeriodId, customRules } = useClub()

  const [selectedPeriodId, setSelectedPeriodId] = useState(
    initialPeriodId || currentActivePeriodId || 'month-2026-10'
  )
  const [memberCode, setMemberCode] = useState(members[0]?.member_code || '')
  const [criterionCode, setCriterionCode] = useState<string>('T07') // Default to penalty T07
  const [isCustomPoints, setIsCustomPoints] = useState(false)
  const [customPoints, setCustomPoints] = useState<number>(-2)
  const [reason, setReason] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [directApply, setDirectApply] = useState(isBCN)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (initialPeriodId) {
      setSelectedPeriodId(initialPeriodId)
    } else if (currentActivePeriodId) {
      setSelectedPeriodId(currentActivePeriodId)
    }
  }, [initialPeriodId, currentActivePeriodId, isOpen])

  if (!isOpen) return null

  // Danh sách các chu kỳ tháng
  const monthPeriods = periods.filter((p) => p.scope === 'month')
  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId) || monthPeriods[0] || periods[0]
  const isLocked = selectedPeriod?.status === 'locked'

  const selectedMember = members.find((m) => m.member_code === memberCode) || members[0]
  const builtinRule = CRITERIA_RULES[criterionCode as RuleCode]
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
        const defaultPt = bRule.type === 'deduct' ? -bRule.base_points : bRule.base_points
        setCustomPoints(defaultPt)
      } else if (cRule) {
        const pts = typeof cRule.points === 'number' ? cRule.points : parseFloat(String(cRule.points)) || 0
        setCustomPoints(pts)
      }
    }
  }

  const isCustomMode = isCustomPoints || criterionCode.startsWith('CUSTOM_POINT_')

  let previewActualDelta = 0
  let previewScoreAfter = selectedMember?.current_score || 60

  if (isCustomMode) {
    const pts = typeof customPoints === 'number' && !isNaN(customPoints) ? customPoints : 0
    previewActualDelta = pts
    previewScoreAfter = Math.max(0, Math.min(100, (selectedMember?.current_score || 60) + previewActualDelta))
  } else if (builtinRule) {
    const preview = calculateScoreDelta({
      ruleCode: criterionCode as RuleCode,
      basePoints: builtinRule.base_points,
      isCoreAtEvent: selectedMember?.is_core || false,
      currentScore: selectedMember?.current_score || 60,
    })
    previewActualDelta = preview.actualDelta
    previewScoreAfter = preview.scoreAfter
  } else if (customRule) {
    const basePts =
      typeof customRule.points === 'number'
        ? customRule.points
        : parseFloat(String(customRule.points)) || 0
    const isCoreMultiplier = !!customRule.coreMultiplierApplies && basePts < 0
    const multiplier = selectedMember?.is_core && isCoreMultiplier ? 2 : 1
    const nominal = basePts * multiplier
    previewScoreAfter = Math.max(0, Math.min(100, (selectedMember?.current_score || 60) + nominal))
    previewActualDelta = previewScoreAfter - (selectedMember?.current_score || 60)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) return

    if (isLocked) {
      setFeedback({
        type: 'error',
        message: `Chu kỳ ${selectedPeriod?.name} đã bị Ban Chủ nhiệm khóa sổ. Không thể chấm điểm!`,
      })
      return
    }

    const res = createProposal({
      memberCode: selectedMember.member_code,
      criterionCode,
      customPoints: isCustomMode ? customPoints : undefined,
      reason,
      evidenceUrl,
      proposerName: currentUser?.name || 'Cán bộ CLB',
      proposerRole: currentUser?.role || 'member',
      directApply: isBCN ? directApply : false,
      periodId: selectedPeriodId,
    })

    if (res.success) {
      setFeedback({ type: 'success', message: res.message })
      setTimeout(() => {
        setFeedback(null)
        onClose()
        setReason('')
        setEvidenceUrl('')
      }, 1500)
    } else {
      setFeedback({ type: 'error', message: res.message })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1E48]/55 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-slate-200/90 shadow-2xl relative space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs flex-shrink-0 ${
                isBCN ? 'bg-gradient-to-br from-amber-500 to-amber-700' : 'bg-gradient-to-br from-[#0B1E48] via-[#1351D8] to-[#1E62F4]'
              }`}
            >
              {isBCN ? <Crown className="w-5 h-5 stroke-[2.2]" /> : <ClipboardList className="w-5 h-5 stroke-[2.2]" />}
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-blue-50 text-[#1351D8] border border-blue-200/60 mb-1">
                <span>{isBCN ? 'Ban Chủ Nhiệm' : 'Ban Nhân Sự'}</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#0F172A] tracking-tight">
                {isBCN ? 'Ghi Nhận & Duyệt Điểm (BCN)' : 'Đề Xuất Chấm Điểm (Ban Nhân Sự)'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isBCN
                  ? 'Quyền cao nhất: Có thể duyệt và áp dụng điểm trực tiếp'
                  : 'Đề xuất cộng hoặc trừ điểm gửi BCN phê duyệt'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex items-center justify-center cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {feedback ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">{feedback.message}</h4>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* 1. Chu kỳ tháng áp dụng điểm */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#1351D8]" />
                  <span>Chọn tháng áp dụng điểm:</span>
                </label>
                {isLocked ? (
                  <span className="text-[10px] font-bold text-rose-700 flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 shadow-2xs">
                    <Lock className="w-3 h-3" /> Đã khóa sổ bởi BCN
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Đang mở chấm điểm
                  </span>
                )}
              </div>
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className={`w-full bg-slate-50/80 hover:bg-white focus:bg-white border rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#0F172A] focus:outline-none transition shadow-2xs cursor-pointer ${
                  isLocked
                    ? 'border-rose-300 bg-rose-50/40 text-rose-950'
                    : 'border-slate-200/90 focus:border-[#1351D8] focus:ring-2 focus:ring-[#1351D8]/10'
                }`}
              >
                {monthPeriods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.status === 'locked' ? '(Đã khóa sổ)' : '(Đang mở chấm điểm)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Lock Banner if Month is Locked */}
            {isLocked && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1.5 animate-fadeIn">
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <Lock className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>Chu kỳ {selectedPeriod?.name} đã được Ban Chủ nhiệm KHÓA SỔ ĐIỂM!</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed font-medium">
                  Chu kỳ này đã kết thúc và được khóa sổ an toàn {selectedPeriod?.lockedBy ? `bởi ${selectedPeriod.lockedBy}` : ''}. Để bảo đảm tính công bằng tuyệt đối cho toàn bộ CLB, không thể ghi nhận hay đề xuất điểm cho tháng đã đóng sổ.
                </p>
                <p className="text-[10.5px] font-bold text-rose-800">
                  Vui lòng chọn một tháng đang mở chấm điểm (ví dụ: Tháng 10/2026) ở dropdown phía trên.
                </p>
              </div>
            )}

            {/* Member select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chọn thành viên:
              </label>
              <select
                value={memberCode}
                onChange={(e) => setMemberCode(e.target.value)}
                disabled={isLocked}
                className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#1351D8] focus:ring-2 focus:ring-[#1351D8]/10 transition shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tiêu chí chấm điểm:
              </label>
              <select
                value={criterionCode}
                onChange={(e) => handleCriterionChange(e.target.value)}
                disabled={isLocked}
                className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#1351D8] focus:ring-2 focus:ring-[#1351D8]/10 transition shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                <optgroup label="--- ⚡ ĐIỂM TỰ CHO / TÙY CHỈNH ĐIỂM ---">
                  <option value="CUSTOM_POINT_DEDUCT">⚡ Điểm trừ tự cho (Tùy chỉnh số điểm trừ)</option>
                  <option value="CUSTOM_POINT_ADD">⚡ Điểm cộng tự cho (Tùy chỉnh số điểm cộng)</option>
                </optgroup>
                <optgroup label="--- Điểm trừ vi phạm chuẩn (T01-T13) ---">
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
                <optgroup label="--- Điểm cộng đóng góp chuẩn (C01-C09) ---">
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
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200/90 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#1351D8]" />
                  <span>Số điểm áp dụng:</span>
                </label>
                <div className="inline-flex p-0.5 rounded-xl bg-slate-200/80 text-[11px] font-bold">
                  <button
                    type="button"
                    disabled={criterionCode.startsWith('CUSTOM_POINT_')}
                    onClick={() => setIsCustomPoints(false)}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      !isCustomMode
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed'
                    }`}
                  >
                    Mặc định ({builtinRule ? `${builtinRule.type === 'deduct' ? '-' : '+'}${builtinRule.base_points}đ` : customRule ? `${customRule.points}đ` : '0đ'})
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCustomPoints(true)}
                    className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                      isCustomMode
                        ? 'bg-[#1351D8] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Zap className="w-3 h-3 text-amber-300" />
                    <span>Điểm tự cho</span>
                  </button>
                </div>
              </div>

              {isCustomMode ? (
                <div className="space-y-2 pt-1 border-t border-blue-100/80 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        disabled={isLocked}
                        value={customPoints}
                        onChange={(e) => setCustomPoints(Number(e.target.value))}
                        placeholder="Nhập số điểm (+ hoặc -)..."
                        className="w-full bg-white border border-blue-300 focus:border-[#1351D8] focus:ring-2 focus:ring-[#1351D8]/20 rounded-xl px-3.5 py-2 text-sm font-black text-[#0F172A] focus:outline-none transition shadow-2xs"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                        điểm
                      </span>
                    </div>
                    <div
                      className={`px-3 py-2 rounded-xl text-xs font-black min-w-[70px] text-center shadow-2xs ${
                        customPoints > 0
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : customPoints < 0
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {customPoints > 0 ? `+${customPoints}đ` : `${customPoints}đ`}
                    </div>
                  </div>

                  {/* Quick point chips */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 mr-0.5">Chọn nhanh:</span>
                    {[-10, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 10].map((pt) => (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => setCustomPoints(pt)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer active:scale-95 ${
                          customPoints === pt
                            ? pt > 0
                              ? 'bg-emerald-600 text-white shadow-2xs ring-1 ring-emerald-500'
                              : 'bg-rose-600 text-white shadow-2xs ring-1 ring-rose-500'
                            : pt > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {pt > 0 ? `+${pt}` : pt}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
                    ⚡ <span className="font-semibold text-slate-700">Chế độ điểm tự cho:</span> Nhập số điểm bất kỳ bạn muốn áp dụng (số âm <span className="text-rose-600 font-bold">-</span> để trừ điểm, số dương <span className="text-emerald-600 font-bold">+</span> để cộng điểm).
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 font-medium">
                  Đang sử dụng số điểm mặc định theo quy định. Bạn có thể nhấn <span className="font-bold text-[#1351D8]">"⚡ Điểm tự cho"</span> nếu muốn tự điền số điểm khác.
                </p>
              )}
            </div>

            {/* Preview Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs space-y-1.5 shadow-2xs">
              <div className="flex justify-between font-medium">
                <span className="text-slate-500">Điểm hiện tại:</span>
                <span className="font-bold text-[#0F172A]">{selectedMember?.current_score}đ</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-500">Core Team (phạt ×2):</span>
                <span className={`font-bold ${selectedMember?.is_core ? 'text-amber-700' : 'text-slate-600'}`}>
                  {selectedMember?.is_core ? 'Có (Nhân đôi lỗi vi phạm)' : 'Không'}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200/80 pt-1.5 font-bold">
                <span className="text-slate-800">Dự kiến sau khi áp dụng:</span>
                <span className={previewActualDelta > 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {previewScoreAfter}đ ({previewActualDelta > 0 ? `+${previewActualDelta}` : previewActualDelta} đ)
                </span>
              </div>
            </div>

            {/* Direct Apply for BCN only */}
            {isBCN && !isLocked && (
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-amber-900 block">Áp dụng trực tiếp (Quyền BCN)</span>
                  <span className="text-[11px] text-amber-800/80 font-medium">Cập nhật ngay vào sổ cái không cần chờ</span>
                </div>
                <input
                  type="checkbox"
                  checked={directApply}
                  onChange={(e) => setDirectApply(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 bg-white cursor-pointer"
                />
              </div>
            )}

            {/* HR Notice */}
            {isHR && !isLocked && (
              <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200/70 text-[11px] text-purple-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <span>Ban Nhân sự đề xuất điểm sẽ được chuyển vào hàng đợi để Ban Chủ nhiệm phê duyệt trước khi cập nhật.</span>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lý do / Nội dung chi tiết: <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                disabled={isLocked}
                placeholder="Ghi rõ đầu việc hoặc lỗi vi phạm cụ thể..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl p-3 text-xs font-medium text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#1351D8] focus:ring-2 focus:ring-[#1351D8]/10 transition shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Evidence Link */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Link minh chứng (Drive, ảnh, URL):
              </label>
              <input
                type="url"
                disabled={isLocked}
                placeholder="https://..."
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#1351D8] focus:ring-2 focus:ring-[#1351D8]/10 transition shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200/90 text-slate-700 font-bold text-xs hover:bg-slate-50 transition shadow-2xs active:scale-95 cursor-pointer"
              >
                Hủy bỏ
              </button>

              {isLocked ? (
                <button
                  type="button"
                  disabled
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-200 text-slate-500 cursor-not-allowed shadow-none"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tháng Này Đã Khóa Sổ Điểm</span>
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0F3282] via-[#1351D8] to-[#1E62F4] hover:from-[#0B2562] hover:to-[#1351D8] text-white font-bold text-xs shadow-xs hover:shadow transition active:scale-95 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isBCN
                      ? directApply
                        ? 'Áp Dụng Trực Tiếp (BCN)'
                        : 'Đưa Vào Hàng Đợi Duyệt'
                      : 'Gửi BCN Phê Duyệt'}
                  </span>
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
