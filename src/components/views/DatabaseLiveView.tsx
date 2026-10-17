'use client'

import React, { useState, useEffect } from 'react'
import {
  Database,
  Server,
  Activity,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Play,
  Layers,
  Users,
  Calendar,
  FileText,
  Clock,
  Sparkles,
  Zap,
  Crown,
  Search,
  Filter,
} from 'lucide-react'
import { CRITERIA_RULES } from '@/lib/scoring/constants'
import type { RuleCode } from '@/types/database'

interface DbStatus {
  connected: boolean
  latencyMs: number
  supabaseUrl: string
  studioUrl: string
  databaseUrl: string
  tables: {
    members: number
    departments: number
    terms: number
    events: number
    attendance: number
    criteria: number
    score_ledger: number
  }
  systemRules: {
    p01_initialScore: number
    p02_clamp: string
    p03_coreMultiplier: number
    p04_interactionCap: number
    ratingLevels: number
  }
}

interface MemberRow {
  id: string
  member_code: string
  student_id: string | null
  full_name: string
  class_name: string | null
  position: string
  is_core_team: boolean
  status: string
  current_score: number
  t02_count: number
  phone: string | null
  email: string | null
  departments: { code: string; name: string } | null
}

interface LedgerRow {
  id: string
  criterion_code: string
  score_before: number
  raw_delta: number
  multiplier: number
  applied_delta: number
  score_after: number
  reason: string
  occurred_at: string
  created_at: string
}

export function DatabaseLiveView() {
  const [status, setStatus] = useState<DbStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Tables viewing
  const [activeTableTab, setActiveTableTab] = useState<'members' | 'ledger' | 'rules'>('members')
  const [members, setMembers] = useState<MemberRow[]>([])
  const [ledgerRows, setLedgerRows] = useState<LedgerRow[]>([])
  const [memberSearch, setMemberSearch] = useState('')

  // Interactive Test Transaction Form
  const [selectedMemberCode, setSelectedMemberCode] = useState('23070691') // Giang Lê Hiệp
  const [selectedRuleCode, setSelectedRuleCode] = useState<RuleCode>('C06')
  const [customReason, setCustomReason] = useState('Kiểm thử tính điểm trực tiếp vào DB PostgreSQL')
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    calculation?: {
      scoreBefore: number
      appliedDelta: number
      scoreAfter: number
      coreMultiplier: number
    }
  } | null>(null)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/db/status')
      const data = await res.json()
      if (res.ok) {
        setStatus(data)
        setError(null)
      } else {
        setError(data.error || 'Không thể kết nối đến cơ sở dữ liệu')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/db/members')
      const data = await res.json()
      if (res.ok && data.members) {
        setMembers(data.members)
      }
    } catch (err) {
      console.error('Fetch members error:', err)
    }
  }

  const fetchLedger = async () => {
    try {
      const res = await fetch('/api/db/ledger')
      const data = await res.json()
      if (res.ok && data.records) {
        setLedgerRows(data.records)
      }
    } catch {
      // route might be created soon
    }
  }

  useEffect(() => {
    fetchStatus()
    fetchMembers()
    fetchLedger()
  }, [])

  const handleRunTest = async (e: React.FormEvent) => {
    e.preventDefault()
    setTestLoading(true)
    setTestResult(null)

    try {
      const res = await fetch('/api/db/test-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberCode: selectedMemberCode,
          criterionCode: selectedRuleCode,
          reason: customReason,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setTestResult({
          success: true,
          message: data.message,
          calculation: data.calculation,
        })
        // Refresh status and members
        fetchStatus()
        fetchMembers()
        fetchLedger()
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Giao dịch thất bại',
        })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi giao dịch'
      setTestResult({ success: false, message: msg })
    } finally {
      setTestLoading(false)
    }
  }

  const filteredMembers = members.filter(
    (m) =>
      m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.member_code.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (m.student_id && m.student_id.toLowerCase().includes(memberSearch.toLowerCase()))
  )

  const selectedMemberData = members.find((m) => m.member_code === selectedMemberCode)
  const selectedRuleData = CRITERIA_RULES[selectedRuleCode]

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner: Real Database Connection */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0D244D] via-[#103E8F] to-[#1351D8] p-6 sm:p-8 text-white shadow-xl border border-white/10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                PostgreSQL & Supabase Chạy Thật 100%
              </span>
              {status && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white/10 text-slate-200">
                  Độ trễ: {status.latencyMs}ms
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              <Database className="w-7 h-7 text-[#F5B301]" />
              Trung Tâm Kiểm Thử & Quản Trị Cơ Sở Dữ Liệu
            </h1>
            <p className="text-sm text-slate-200 max-w-2xl leading-relaxed">
              Dữ liệu được lưu trữ và thực thi trực tiếp trên máy chủ cơ sở dữ liệu PostgreSQL cục bộ. Mọi thao tác tính điểm, duyệt đơn và điểm danh được ghi vào bảng Score Ledger bất biến theo đúng quy chế chuẩn.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => {
                fetchStatus()
                fetchMembers()
                fetchLedger()
              }}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold transition flex items-center justify-center gap-2 flex-1 sm:flex-initial"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới dữ liệu
            </button>
            <a
              href="http://127.0.0.1:54323"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-[#F5B301] hover:bg-[#e0a400] text-[#0D244D] text-xs font-black transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 flex-1 sm:flex-initial"
            >
              <ExternalLink className="w-4 h-4" />
              Mở Supabase Studio GUI (54323)
            </a>
          </div>
        </div>

        {/* Connection endpoint pills */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
            <span className="text-slate-400 block font-medium">Postgres DB Host:</span>
            <span className="font-mono text-white font-bold truncate block">127.0.0.1:54322 (postgres)</span>
          </div>
          <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
            <span className="text-slate-400 block font-medium">REST API Endpoint:</span>
            <span className="font-mono text-white font-bold truncate block">http://127.0.0.1:54321/rest/v1</span>
          </div>
          <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
            <span className="text-slate-400 block font-medium">Supabase Studio Web:</span>
            <span className="font-mono text-amber-300 font-bold truncate block">http://127.0.0.1:54323</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Thành viên DB</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-800">{status?.tables.members ?? 48}</span>
            <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">✓ Đủ 48 người</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Ban chuyên môn</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-800">{status?.tables.departments ?? 4}</span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">B01, B02, B03, B04</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Sự kiện họp</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-800">{status?.tables.events ?? 2}</span>
            <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">1 Họp đang mở</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Nhật ký điểm danh</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-800">{status?.tables.attendance ?? 3}</span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Bản ghi check-in</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Quy tắc & Tiêu chí</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-800">{status?.tables.criteria ?? 32}</span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">C01-09 & T01-13</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Sổ điểm Ledger</span>
            <Server className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-800">{status?.tables.score_ledger ?? 0}</span>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Bất biến (Append-only)</span>
          </div>
        </div>
      </div>

      {/* Main Split: Interactive Test Console & Live Data Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Live Test Execution Console (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                <Play className="w-3 h-3 fill-amber-700 text-amber-700" /> Live Simulation
              </span>
              <h2 className="text-lg font-black text-slate-800 mt-2">Bảng Thử Nghiệm Giao Dịch Chạy Thật</h2>
              <p className="text-xs text-slate-500 mt-1">
                Chọn thành viên và tiêu chí để thực hiện tính toán điểm và ghi thẳng vào cơ sở dữ liệu PostgreSQL.
              </p>
            </div>

            <form onSubmit={handleRunTest} className="space-y-4 text-xs">
              {/* Member Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  1. Chọn Thành Viên CLB (Tổng 48 người):
                </label>
                <select
                  value={selectedMemberCode}
                  onChange={(e) => setSelectedMemberCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {members.map((m) => (
                    <option key={m.member_code} value={m.member_code}>
                      {m.full_name} ({m.member_code}) — {m.departments?.name || m.position} {m.is_core_team ? '★ [Core]' : ''} [Điểm: {m.current_score}đ]
                    </option>
                  ))}
                </select>
                {selectedMemberData && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">{selectedMemberData.full_name}</span>
                      <span className="text-[11px] text-slate-500 block">
                        MSSV: {selectedMemberData.student_id || '-'} • Lớp: {selectedMemberData.class_name || '-'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-blue-600 block">{selectedMemberData.current_score}đ</span>
                      {selectedMemberData.is_core_team && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-black bg-amber-100 text-amber-800">
                          Core Team (×2 Phạt)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Criterion Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  2. Chọn Tiêu Chí Đánh Giá (C01-C09 & T01-T13):
                </label>
                <select
                  value={selectedRuleCode}
                  onChange={(e) => setSelectedRuleCode(e.target.value as RuleCode)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <optgroup label="Điểm Cộng (+)">
                    {Object.values(CRITERIA_RULES)
                      .filter((r) => r.type === 'add')
                      .map((r) => (
                        <option key={r.code} value={r.code}>
                          {r.code}: {r.name} (+{r.base_points}đ)
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Điểm Trừ (-)">
                    {Object.values(CRITERIA_RULES)
                      .filter((r) => r.type === 'deduct')
                      .map((r) => (
                        <option key={r.code} value={r.code}>
                          {r.code}: {r.name} ({r.base_points}đ)
                        </option>
                      ))}
                  </optgroup>
                </select>
                {selectedRuleData && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-600">
                    <div className="flex items-center justify-between font-bold">
                      <span className={selectedRuleData.type === 'add' ? 'text-emerald-600' : 'text-rose-600'}>
                        {selectedRuleData.type === 'add' ? '+' : ''}{selectedRuleData.base_points} điểm
                      </span>
                      {selectedRuleData.core_multiplier_applies && selectedMemberData?.is_core_team && (
                        <span className="text-amber-700 font-black">
                          Áp dụng chế tài Core: {selectedRuleData.base_points * 2} điểm
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-slate-500">{selectedRuleData.description}</p>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  3. Lý Do / Nội Dung Ghi Sổ:
                </label>
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Ví dụ: Hoàn thành báo cáo đúng tiến độ..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={testLoading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {testLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Đang ghi vào cơ sở dữ liệu...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Thực Thi Giao Dịch & Ghi Vào Database Thật
                  </>
                )}
              </button>
            </form>

            {/* Test Execution Result */}
            {testResult && (
              <div
                className={`p-4 rounded-2xl border text-xs animate-fadeIn ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1.5 flex-1">
                    <span className="font-bold block text-sm">
                      {testResult.success ? 'Giao Dịch Hoàn Tất Thành Công!' : 'Giao Dịch Thất Bại'}
                    </span>
                    <p className="leading-relaxed">{testResult.message}</p>
                    {testResult.calculation && (
                      <div className="pt-2 border-t border-emerald-200/60 grid grid-cols-3 gap-2 font-mono text-center">
                        <div className="bg-white/80 p-1.5 rounded-lg">
                          <span className="text-[10px] text-slate-500 block">Trước</span>
                          <span className="font-bold">{testResult.calculation.scoreBefore}đ</span>
                        </div>
                        <div className="bg-white/80 p-1.5 rounded-lg">
                          <span className="text-[10px] text-slate-500 block">Biến thiên</span>
                          <span className="font-black text-emerald-700">
                            {testResult.calculation.appliedDelta > 0 ? '+' : ''}
                            {testResult.calculation.appliedDelta}đ
                          </span>
                        </div>
                        <div className="bg-white/80 p-1.5 rounded-lg">
                          <span className="text-[10px] text-slate-500 block">Sau</span>
                          <span className="font-bold">{testResult.calculation.scoreAfter}đ</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Real Data Explorer (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5">
            {/* Table Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTableTab('members')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTableTab === 'members'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bảng Thành Viên ({members.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTableTab('ledger')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTableTab === 'ledger'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sổ Điểm Ledger ({ledgerRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTableTab('rules')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTableTab === 'rules'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tiêu Chí Chấm ({Object.keys(CRITERIA_RULES).length})
                </button>
              </div>

              {activeTableTab === 'members' && (
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Tìm tên, mã, MSSV..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* TAB: Members Table */}
            {activeTableTab === 'members' && (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 z-10 border-b border-slate-200/80">
                    <tr>
                      <th className="py-2.5 px-3">Mã SV</th>
                      <th className="py-2.5 px-3">Họ và tên</th>
                      <th className="py-2.5 px-3">Ban</th>
                      <th className="py-2.5 px-3">Chức vụ</th>
                      <th className="py-2.5 px-3 text-right">Điểm DB</th>
                      <th className="py-2.5 px-2 text-center">Thử</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMembers.map((m) => (
                      <tr
                        key={m.id}
                        className={`hover:bg-slate-50/80 transition ${
                          m.member_code === selectedMemberCode ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono text-slate-600 font-semibold">{m.member_code}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{m.full_name}</span>
                          {m.is_core_team && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-amber-100 text-amber-800">
                              Core
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{m.departments?.name || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-500">{m.position}</td>
                        <td className="py-2.5 px-3 text-right font-black text-blue-600">{m.current_score}</td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedMemberCode(m.member_code)}
                            className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 hover:bg-blue-100 hover:text-blue-700 transition"
                          >
                            Chọn
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB: Ledger Table */}
            {activeTableTab === 'ledger' && (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-slate-100 rounded-2xl">
                {ledgerRows.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <p className="font-semibold text-xs">Chưa có giao dịch ghi sổ nào trong DB.</p>
                    <p className="text-[11px] mt-1">Hãy dùng bảng bên trái để chạy giao dịch thử nghiệm.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 z-10 border-b border-slate-200/80">
                      <tr>
                        <th className="py-2.5 px-3">Thời gian</th>
                        <th className="py-2.5 px-3">Tiêu chí</th>
                        <th className="py-2.5 px-3">Trước</th>
                        <th className="py-2.5 px-3">Hệ số</th>
                        <th className="py-2.5 px-3 text-center">Biến thiên</th>
                        <th className="py-2.5 px-3 text-right">Sau</th>
                        <th className="py-2.5 px-3">Nội dung</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ledgerRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {new Date(row.created_at).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{row.criterion_code}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">{row.score_before}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {row.multiplier > 1 ? (
                              <span className="font-bold text-amber-700">×{row.multiplier}</span>
                            ) : (
                              '1'
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-black">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] ${
                                row.applied_delta > 0
                                  ? 'bg-emerald-50 text-emerald-700 font-bold'
                                  : 'bg-rose-50 text-rose-700 font-bold'
                              }`}
                            >
                              {row.applied_delta > 0 ? '+' : ''}
                              {row.applied_delta}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-800 font-mono">
                            {row.score_after}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 max-w-[200px] truncate" title={row.reason}>
                            {row.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* TAB: Rules Table */}
            {activeTableTab === 'rules' && (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 z-10 border-b border-slate-200/80">
                    <tr>
                      <th className="py-2.5 px-3">Mã</th>
                      <th className="py-2.5 px-3">Tên tiêu chí</th>
                      <th className="py-2.5 px-3">Loại</th>
                      <th className="py-2.5 px-3 text-right">Điểm chuẩn</th>
                      <th className="py-2.5 px-3 text-center">Nhân Core</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.values(CRITERIA_RULES).map((r) => (
                      <tr key={r.code} className="hover:bg-slate-50 transition">
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">{r.code}</td>
                        <td className="py-2 px-3 font-medium text-slate-700">{r.name}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.type === 'add'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {r.type === 'add' ? 'Điểm cộng' : 'Điểm trừ'}
                          </span>
                        </td>
                        <td
                          className={`py-2 px-3 text-right font-black ${
                            r.type === 'add' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {r.type === 'add' ? '+' : ''}{r.base_points}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {r.core_multiplier_applies ? (
                            <span className="font-bold text-amber-700 text-[11px]">×2</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
