'use client'

import React, { useState, useMemo } from 'react'
import { CRITERIA_RULES } from '@/lib/scoring/constants'
import { calculateScoreDelta } from '@/lib/scoring/engine'
import { useClub } from '@/lib/context/ClubContext'
import type { RuleCode } from '@/types/database'
import { Calculator, Sparkles, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react'

export function LiveCalculator() {
  const { customRules } = useClub()
  const [currentScore, setCurrentScore] = useState<number>(60)
  const [isCore, setIsCore] = useState<boolean>(false)
  const [selectedRule, setSelectedRule] = useState<string>('C05')
  const [quotaUsed, setQuotaUsed] = useState<number>(0)
  const [supersedes, setSupersedes] = useState<string>('none')

  const builtinRule = CRITERIA_RULES[selectedRule as RuleCode]
  const customRule = customRules.find((r) => r.code === selectedRule)
  const basePoints = builtinRule
    ? builtinRule.base_points
    : customRule
    ? (typeof customRule.points === 'number'
        ? customRule.points
        : parseFloat(String(customRule.points)) || 0)
    : 0

  const calculation = useMemo(() => {
    if (builtinRule) {
      return calculateScoreDelta({
        ruleCode: selectedRule as RuleCode,
        basePoints: builtinRule.base_points,
        isCoreAtEvent: isCore,
        currentScore: currentScore,
        monthlyQuotaUsed: quotaUsed,
        supersedesRuleCode: supersedes === 'none' ? null : (supersedes as RuleCode),
      })
    }
    if (customRule) {
      const isCoreMultiplier = !!customRule.coreMultiplierApplies && basePoints < 0
      const coreMultiplier = isCore && isCoreMultiplier ? 2 : 1
      const rulePoints = basePoints * coreMultiplier
      const scoreBefore = Math.min(100, Math.max(0, currentScore))
      const eligibleDelta = rulePoints
      const rawAfter = scoreBefore + eligibleDelta
      const scoreAfter = Math.min(100, Math.max(0, rawAfter))
      const actualDelta = scoreAfter - scoreBefore
      return {
        coreMultiplier,
        rulePoints,
        quotaEligibleDelta: eligibleDelta,
        eligibleDelta,
        scoreBefore,
        scoreAfter,
        actualDelta,
        newQuotaUsed: quotaUsed,
      }
    }
    return {
      coreMultiplier: 1,
      rulePoints: 0,
      quotaEligibleDelta: 0,
      eligibleDelta: 0,
      scoreBefore: currentScore,
      scoreAfter: currentScore,
      actualDelta: 0,
      newQuotaUsed: quotaUsed,
    }
  }, [selectedRule, builtinRule, customRule, basePoints, isCore, currentScore, quotaUsed, supersedes])

  return (
    <div className="pt-12">
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-[#1E63D6]/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#F5B301]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#F5B301]">
                Công cụ giả lập
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
              Live Scoring Sandbox - Thử Nghiệm Tính Điểm
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Kiểm tra tính toán chính xác theo đúng engine PostgreSQL (Hệ số Core ×2, Quota 15, Clamp [0, 100])
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls: 7 cols */}
          <div className="lg:col-span-7 space-y-5">
            {/* Rule Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                1. Chọn tiêu chí chấm điểm
              </label>
              <select
                value={selectedRule}
                onChange={(e) => setSelectedRule(e.target.value)}
                className="w-full bg-[#070D1E] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#1E63D6] focus:ring-1 focus:ring-[#1E63D6]"
              >
                <optgroup label="--- Điểm cộng chuẩn (C01-C09) ---">
                  {Object.values(CRITERIA_RULES)
                    .filter((c) => c.type === 'add')
                    .map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} (+{c.base_points}): {c.name}
                      </option>
                    ))}
                </optgroup>
                {customRules.filter((c) => c.type === 'add').length > 0 && (
                  <optgroup label="--- Điểm cộng bổ sung CLB ---">
                    {customRules
                      .filter((c) => c.type === 'add')
                      .map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} (+{c.points}): {c.name}
                        </option>
                      ))}
                  </optgroup>
                )}
                <optgroup label="--- Điểm trừ chuẩn (T01-T13) ---">
                  {Object.values(CRITERIA_RULES)
                    .filter((c) => c.type === 'deduct')
                    .map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.base_points}): {c.name}
                      </option>
                    ))}
                </optgroup>
                {customRules.filter((c) => c.type === 'deduct').length > 0 && (
                  <optgroup label="--- Điểm trừ bổ sung CLB ---">
                    {customRules
                      .filter((c) => c.type === 'deduct')
                      .map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} ({c.points}): {c.name}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Core Team Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
              <div>
                <span className="text-sm font-bold text-white block">Thành viên nòng cốt (Core Team)</span>
                <span className="text-xs text-slate-400">Áp dụng chế tài phạt nhân đôi (×2) nếu là điểm trừ</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCore}
                  onChange={(e) => setIsCore(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F5B301]"></div>
              </label>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-slate-300">Điểm hiện tại</span>
                  <span className="text-sm font-black text-white">{currentScore}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={currentScore}
                  onChange={(e) => setCurrentScore(Number(e.target.value))}
                  className="w-full accent-[#1E63D6] cursor-pointer"
                />
              </div>

              {['C01', 'C02', 'C03'].includes(selectedRule) && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-slate-300">Quota tương tác đã dùng</span>
                    <span className="text-sm font-black text-[#F5B301]">{quotaUsed}/15</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    value={quotaUsed}
                    onChange={(e) => setQuotaUsed(Number(e.target.value))}
                    className="w-full accent-[#F5B301] cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Supersedes logic toggle if T08 or C02 */}
            {selectedRule === 'T08' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
                <span>Thay thế cho vi phạm T07 đã ghi nhận trước đó?</span>
                <select
                  value={supersedes}
                  onChange={(e) => setSupersedes(e.target.value)}
                  className="bg-black/50 border border-amber-500/40 rounded px-2 py-1 text-xs"
                >
                  <option value="none">Không (Ghi mới)</option>
                  <option value="T07">Có, thay thế T07 (-2)</option>
                </select>
              </div>
            )}
            {selectedRule === 'C02' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
                <span>Nâng cấp từ C01 đã cộng trên cùng một bài?</span>
                <select
                  value={supersedes}
                  onChange={(e) => setSupersedes(e.target.value)}
                  className="bg-black/50 border border-amber-500/40 rounded px-2 py-1 text-xs"
                >
                  <option value="none">Không (Bài độc lập)</option>
                  <option value="C01">Có, nâng cấp C01 (+1)</option>
                </select>
              </div>
            )}
          </div>

          {/* Results Display: 5 cols */}
          <div className="lg:col-span-5 flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-br from-[#0B1530] to-[#070D1E] border border-white/10 shadow-inner">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-4">
                Kết quả tính toán thời gian thực
              </span>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-400">Điểm gốc tiêu chí:</span>
                  <span className="font-bold text-white">{basePoints > 0 ? `+${basePoints}` : basePoints}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-400">Hệ số Core Team áp dụng:</span>
                  <span className={`font-bold ${calculation.coreMultiplier > 1 ? 'text-[#F5B301]' : 'text-slate-300'}`}>
                    ×{calculation.coreMultiplier}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-400">Thay đổi hợp lệ trước clamp:</span>
                  <span className="font-bold text-slate-200">
                    {calculation.eligibleDelta > 0 ? `+${calculation.eligibleDelta}` : calculation.eligibleDelta}
                  </span>
                </div>
                {['C01', 'C02', 'C03'].includes(selectedRule) && (
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-slate-400">Quota tương tác mới:</span>
                    <span className="font-bold text-[#F5B301]">{calculation.newQuotaUsed}/15</span>
                  </div>
                )}
              </div>
            </div>

            {/* Score Delta Big Box */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Trước</span>
                  <span className="text-2xl font-black text-slate-300">{calculation.scoreBefore}</span>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500" />
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Thay đổi thực</span>
                  <span
                    className={`text-2xl font-black ${
                      calculation.actualDelta > 0
                        ? 'text-emerald-400'
                        : calculation.actualDelta < 0
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {calculation.actualDelta > 0 ? `+${calculation.actualDelta}` : calculation.actualDelta}
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500" />
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-[#F5B301] block">Sau khi cập nhật</span>
                  <span className="text-3xl font-black text-white">{calculation.scoreAfter}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
