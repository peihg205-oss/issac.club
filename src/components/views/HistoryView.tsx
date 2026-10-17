'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useClub } from '@/lib/context/ClubContext'
import { ScoreModal } from '@/components/admin/ScoreModal'
import {
  Download,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Crown,
  FileCheck,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Check,
  Layers,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from 'lucide-react'
import { normalizeHistoryTimestamp } from '@/lib/vietnamTime'

// Sẵn sàng vận hành thật: Danh sách lịch sử điểm số sạch xuất phát từ các phiên điểm danh & đề xuất thực tế
const INITIAL_HISTORY: Array<{
  time: string
  name: string
  dept: string
  code: string
  title: string
  points: number
  type: string
  scorer: string
}> = []


export function HistoryView() {
  const { isBCN, isHR } = useAuth()
  const {
    members,
    proposals,
    approveProposal,
    rejectProposal,
    disputes,
    createDispute,
    resolveDisputeByBCN,
    periods,
    currentActivePeriodId,
  } = useClub()

  const monthPeriods = periods.filter((p) => p.scope === 'month')
  const [selectedPeriodId, setSelectedPeriodId] = useState(
    () => currentActivePeriodId || monthPeriods.find((p) => p.isCurrent)?.id || monthPeriods[0]?.id || 'month-2026-10'
  )

  useEffect(() => {
    if (currentActivePeriodId) {
      setSelectedPeriodId(currentActivePeriodId)
    }
  }, [currentActivePeriodId])

  const selectedPeriodObj = monthPeriods.find((p) => p.id === selectedPeriodId) || monthPeriods[0]

  const [activeTab, setActiveTab] = useState<'all' | 'add' | 'deduct' | 'disputes'>('all')
  const [selectedSemester, setSelectedSemester] = useState('ky1_2025_2026')
  const [scoreModalOpen, setScoreModalOpen] = useState(false)
  const [disputeModalOpen, setDisputeModalOpen] = useState(false)

  // Form khiếu nại mới
  const [disputeMemberCode, setDisputeMemberCode] = useState(members[0]?.member_code || '')
  const [disputeCriterion, setDisputeCriterion] = useState('T02')
  const [disputePoints, setDisputePoints] = useState(-5)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeEvidence, setDisputeEvidence] = useState('')

  const pendingList = proposals.filter((p) => p.status === 'pending_bcn')
  const pendingDisputesCount = disputes.filter((d) => d.status === 'pending_bcn' || d.status === 'pending_hr_review').length

  // Ghép các bản ghi được approved từ context vào danh sách lịch sử sống
  const dynamicHistory = proposals
    .filter((p) => p.status === 'approved')
    .map((p) => ({
      time: normalizeHistoryTimestamp(p.createdAt),
      name: p.memberName,
      dept: p.memberDept,
      code: p.criterionCode,
      title: `${p.criterionName} - ${p.reason}`,
      points: p.points,
      type: p.points >= 0 ? 'Cộng' : 'Trừ',
      scorer: p.proposedBy,
    }))

  const combinedHistory = [...dynamicHistory, ...INITIAL_HISTORY]

  // Filter table data
  const filteredHistory = combinedHistory.filter((item) => {
    if (activeTab === 'add') return item.type === 'Cộng'
    if (activeTab === 'deduct') return item.type === 'Trừ'
    return true
  })

  const countAdd = combinedHistory.filter((i) => i.type === 'Cộng').length
  const countDeduct = combinedHistory.filter((i) => i.type === 'Trừ').length

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Thoi_gian', 'Thanh_vien', 'Ma_tieu_chi', 'Noi_dung', 'Diem', 'Loai', 'Nguoi_cham']
    const rows = filteredHistory.map((item) => [
      `"${item.time}"`,
      `"${item.name}"`,
      item.code,
      `"${item.title}"`,
      item.points,
      item.type,
      `"${item.scorer}"`,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `lich_su_diem_issac_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Submit dispute form
  const handleSubmitDispute = (e: React.FormEvent) => {
    e.preventDefault()
    if (!disputeReason.trim()) {
      alert('Vui lòng nhập lý do khiếu nại chi tiết!')
      return
    }

    const res = createDispute({
      memberCode: disputeMemberCode,
      criterionCode: disputeCriterion,
      pointsContested: disputePoints,
      reason: disputeReason,
      evidenceUrl: disputeEvidence,
    })

    if (res.success) {
      alert(res.message)
      setDisputeReason('')
      setDisputeEvidence('')
      setDisputeModalOpen(false)
    } else {
      alert(res.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Header trang chuẩn nhận diện dự án CLB */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight whitespace-nowrap">
              Lịch Sử &amp; Khiếu Nại Điểm
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0B1E48]/5 text-[#1351D8] border border-blue-200/80 whitespace-nowrap shrink-0">
              Quy chế Q06
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium">
            Sổ cái ghi nhận điểm thi đua, tiếp nhận &amp; xử lý hồ sơ khiếu nại của 48 thành viên CLB
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0 self-start md:self-auto">
          {/* Dispute button for members */}
          <button
            type="button"
            onClick={() => setDisputeModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
          >
            <AlertCircle className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Gửi khiếu nại (Q06)</span>
          </button>

          {/* Score proposal action button */}
          {(isBCN || isHR) && (
            <button
              type="button"
              onClick={() => setScoreModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#0F3282] via-[#1351D8] to-[#1E62F4] hover:brightness-110 text-white shadow-sm shadow-[#1351D8]/25 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>{isBCN ? 'Chấm / Duyệt điểm' : 'Đề xuất điểm (HR)'}</span>
            </button>
          )}

          {/* Export button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            title="Xuất dữ liệu lịch sử ra file CSV"
          >
            <Download className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Xuất file (.CSV)</span>
          </button>
        </div>
      </div>

      {/* 2. Hàng đợi chờ Ban Chủ nhiệm phê duyệt (Khớp phong cách thiết kế dự án iSSAC) */}
      {isBCN && pendingList.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold shadow-2xs shrink-0">
                <Crown className="w-4 h-4 text-amber-100" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-[#0B1E48]">
                    Hàng đợi chờ Ban Chủ nhiệm phê duyệt
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white shadow-2xs">
                    {pendingList.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Đề xuất chấm điểm chính thức từ Ban Nhân sự &amp; Trưởng ban
                </p>
              </div>
            </div>

            {/* Executive Role Tag */}
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/80 flex items-center gap-1.5 shadow-2xs">
                <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Quyền phê duyệt: Ban Chủ nhiệm</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {pendingList.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-50/70 hover:bg-white border border-slate-200/90 hover:border-blue-300/80 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all duration-200 group space-y-3"
              >
                <div>
                  {/* Member Name, Dept & Score Tag */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0B1E48] to-[#1351D8] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {item.memberName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs sm:text-sm text-[#0F172A] group-hover:text-[#1351D8] transition-colors truncate block">
                          {item.memberName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium block truncate">
                          {item.memberDept}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-full whitespace-nowrap shadow-2xs border shrink-0 ${
                        item.points > 0
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          : 'bg-rose-50 text-rose-700 border-rose-200/80'
                      }`}
                    >
                      {item.points > 0 ? `+${item.points}` : item.points} điểm
                    </span>
                  </div>

                  {/* Reason Box */}
                  <div className="mt-3 p-2.5 rounded-lg bg-white border border-slate-200/70 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-[11px] text-[#1351D8] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
                        [{item.criterionCode}]
                      </span>
                      <span className="font-bold text-xs text-slate-800">
                        {item.criterionName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.reason}
                    </p>
                  </div>

                  {/* Proposed By & Date */}
                  <div className="mt-2 text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      Đề xuất: <strong className="text-slate-600 font-semibold">{item.proposedBy}</strong> • {normalizeHistoryTimestamp(item.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => rejectProposal(item.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200/80 shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Từ chối</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => approveProposal(item.id)}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-2xs shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Duyệt điểm</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Balanced Toolbar Box: Subtabs on the Left & Period Selectors on the Right */}
      <div className="bg-white p-2.5 sm:p-3 rounded-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-3 border border-slate-200/90 shadow-2xs overflow-x-auto">
        {/* Subtabs: Tất cả | Điểm cộng | Điểm trừ | Khiếu nại Q06 */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'all'
                ? 'bg-white text-[#1351D8] shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Tất cả</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold leading-none ${
              activeTab === 'all' ? 'bg-blue-100/80 text-[#1351D8]' : 'bg-slate-200/70 text-slate-600'
            }`}>
              {combinedHistory.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'add'
                ? 'bg-white text-emerald-700 shadow-2xs border border-emerald-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="whitespace-nowrap">Điểm cộng</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold leading-none ${
              activeTab === 'add' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200/70 text-slate-600'
            }`}>
              {countAdd}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deduct')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'deduct'
                ? 'bg-white text-rose-700 shadow-2xs border border-rose-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="whitespace-nowrap">Điểm trừ</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold leading-none ${
              activeTab === 'deduct' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200/70 text-slate-600'
            }`}>
              {countDeduct}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('disputes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'disputes'
                ? 'bg-white text-purple-700 shadow-2xs border border-purple-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Khiếu nại Q06</span>
            {pendingDisputesCount > 0 ? (
              <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-black flex items-center justify-center shadow-2xs shrink-0">
                {pendingDisputesCount}
              </span>
            ) : (
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold leading-none ${
                activeTab === 'disputes' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200/70 text-slate-600'
              }`}>
                {disputes.length}
              </span>
            )}
          </button>
        </div>

        {/* Period & Month Controls */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Semester selector */}
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="bg-white border border-slate-200/90 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#1351D8] transition shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
          >
            <option value="ky1_2025_2026">Kỳ 1 năm học 2025-2026</option>
            <option value="ky2_2024_2025">Kỳ 2 năm học 2024-2025</option>
          </select>

          {/* Month selector using periods - Clean name without redundant text */}
          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="bg-white border border-slate-200/90 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#1351D8] transition shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
          >
            {monthPeriods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Status Badge - Crisp SVG dot indicator, always beside the month selector */}
          {selectedPeriodObj?.status === 'locked' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs whitespace-nowrap shrink-0">
              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
              <span>Đã khóa sổ</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs whitespace-nowrap shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>Đang mở chấm điểm</span>
            </span>
          )}
        </div>
      </div>

      {/* View Tab 4: Khiếu nại Q06 */}
      {activeTab === 'disputes' ? (
        <div className="space-y-4">
          <div className="rounded-2xl p-4 sm:p-5 border border-purple-200/90 bg-gradient-to-br from-purple-50/80 via-indigo-50/30 to-purple-50/50 shadow-2xs space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-400/40 text-purple-700 flex items-center justify-center shadow-xs flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-purple-950">
                  Quy trình xử lý khiếu nại điểm (Q06 - Quy chế Câu Lạc bộ Đại sứ sinh viên Trường Quốc tế)
                </h3>
                <p className="text-[11px] text-purple-800/80 font-medium">
                  Đảm bảo công bằng, minh bạch - Thời hạn giải quyết tối đa 7 ngày làm việc
                </p>
              </div>
            </div>
            <p className="text-xs text-purple-900/85 leading-relaxed pl-10.5">
              Thành viên có quyền khiếu nại điểm trong vòng 7 ngày kể từ khi có biến động điểm. Ban Nhân sự tiến hành thẩm định sơ bộ, sau đó Ban Chủ nhiệm ra phán quyết cuối cùng (Hoàn trả điểm hoặc Bác khiếu nại).
            </p>
          </div>

          <div className="space-y-3">
            {disputes.map((disp) => (
              <div
                key={disp.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 space-y-4 shadow-2xs hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 whitespace-nowrap">{disp.memberName}</span>
                      <span className="text-xs text-slate-500 font-medium">({disp.memberDept})</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
                        {disp.criterionCode} ({disp.pointsContested}đ)
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {normalizeHistoryTimestamp(disp.createdAt)}
                    </span>
                  </div>

                  <div>
                    {disp.status === 'pending_hr_review' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs">
                        Chờ Ban Nhân sự thẩm định
                      </span>
                    )}
                    {disp.status === 'pending_bcn' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#1351D8] border border-blue-200/80 shadow-2xs">
                        Đang chờ BCN phê duyệt
                      </span>
                    )}
                    {disp.status === 'approved_resolved' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Đã chấp thuận &amp; Hoàn trả điểm
                      </span>
                    )}
                    {disp.status === 'rejected' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs">
                        Bác khiếu nại
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <strong className="text-slate-800 font-bold">Lý do khiếu nại: </strong>
                    <span className="text-slate-600">{disp.reason}</span>
                  </div>

                  {disp.evidenceUrl && (
                    <div className="flex items-center gap-1.5 text-xs text-[#1351D8] font-bold">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <a href={disp.evidenceUrl} target="_blank" rel="noreferrer" className="hover:underline">
                        Minh chứng đính kèm (Google Drive)
                      </a>
                    </div>
                  )}

                  {disp.hrNote && (
                    <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl text-blue-900 leading-relaxed">
                      <strong className="font-bold">Ý kiến Ban Nhân sự: </strong> {disp.hrNote}
                    </div>
                  )}

                  {disp.bcnVerdict && (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-xl text-emerald-900 leading-relaxed">
                      <strong className="font-bold">Phán quyết Ban Chủ nhiệm: </strong> {disp.bcnVerdict} ({disp.resolvedAt})
                    </div>
                  )}
                </div>

                {/* BCN Action Buttons */}
                {isBCN && disp.status === 'pending_bcn' && (
                  <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        resolveDisputeByBCN(
                          disp.id,
                          false,
                          'Bác khiếu nại do minh chứng chưa đầy đủ hoặc vượt quá thời hạn 7 ngày quy định'
                        )
                      }
                      className="px-3.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 rounded-xl transition shadow-2xs cursor-pointer"
                    >
                      Bác khiếu nại
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        resolveDisputeByBCN(
                          disp.id,
                          true,
                          'Hồ sơ hợp lệ, hoàn trả lại số điểm đã trừ và cập nhật hồ sơ'
                        )
                      }
                      className="px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-2xs shadow-emerald-600/20 transition cursor-pointer"
                    >
                      Chấp thuận khiếu nại (Hoàn điểm)
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Card List for phones (< md) */}
          <div className="block md:hidden space-y-3">
            {filteredHistory.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200/90 text-center text-slate-400">
                <p className="font-semibold text-xs">Không có dữ liệu lịch sử điểm</p>
              </div>
            ) : (
              filteredHistory.map((item, index) => (
                <div
                  key={index}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-[#1351D8] border border-blue-200/80 font-bold flex items-center justify-center text-xs shrink-0">
                        {item.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm block truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block truncate">
                          {item.dept} • {item.time}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-black shadow-2xs border ${
                          item.points > 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {item.points > 0 ? `+${item.points}` : item.points}đ
                      </span>
                    </div>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-700 flex items-start gap-1.5">
                    <span className="font-mono font-bold text-[10px] text-[#1351D8] bg-white px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                      {item.code}
                    </span>
                    <span className="leading-snug">{item.title}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>
                      Người chấm: <strong className="text-slate-700">{item.scorer}</strong>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.type === 'Cộng' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {item.type} điểm
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Regular Table: Signature iSSAC Deep Navy Header (Desktop >= md) */}
          <div className="hidden md:block bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm">
            <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-[#0B1E48] text-xs font-bold text-white uppercase tracking-wider border-b border-[#071533] select-none">
                <tr className="divide-x divide-white/10">
                  <th className="py-3 px-4 whitespace-nowrap text-left font-bold text-blue-100">Thời gian</th>
                  <th className="py-3 px-4 whitespace-nowrap text-left font-bold text-white min-w-[200px]">Thành viên</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap font-bold text-blue-100 w-16">Mã</th>
                  <th className="py-3 px-4 text-left font-bold text-white">Nội dung</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap font-bold text-white w-20">Điểm</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap font-bold text-blue-100 w-16">Loại</th>
                  <th className="py-3 px-4 text-left whitespace-nowrap font-bold text-blue-100">Người chấm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredHistory.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/70 transition-colors group divide-x divide-slate-100">
                    {/* Thời gian */}
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap text-xs">
                      {item.time}
                    </td>

                    {/* Thành viên + avatar (whitespace-nowrap enforced) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5 whitespace-nowrap">
                        {item.name === 'Trần Đức Thắng' ? (
                          <img
                            src="/avatars/duc-thang.jpg"
                            alt={item.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0 shadow-2xs"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-[#1351D8] border border-blue-200/80 font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-2xs group-hover:bg-[#1351D8] group-hover:text-white transition-all">
                            {item.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 group-hover:text-[#1351D8] transition-colors whitespace-nowrap block text-[13px]">
                            {item.name}
                          </span>
                          {item.dept && (
                            <span className="text-[10.5px] text-slate-400 font-medium block whitespace-nowrap">
                              {item.dept}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Mã tiêu chí */}
                    <td className="py-3.5 px-3 text-center font-mono font-black text-xs text-[#1351D8]">
                      {item.code}
                    </td>

                    {/* Nội dung */}
                    <td className="py-3.5 px-4 text-slate-700 font-medium text-xs max-w-md leading-relaxed">
                      {item.title}
                    </td>

                    {/* Điểm */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-black shadow-2xs border ${
                          item.points > 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                            : 'bg-rose-50 text-rose-700 border-rose-200/80'
                        }`}
                      >
                        {item.points > 0 ? `+${item.points}` : item.points}
                      </span>
                    </td>

                    {/* Loại */}
                    <td className="py-3.5 px-3 text-center font-bold text-xs">
                      <span className={item.type === 'Cộng' ? 'text-emerald-700' : 'text-rose-700'}>
                        {item.type}
                      </span>
                    </td>

                    {/* Người chấm */}
                    <td className="py-3.5 px-4 text-slate-600 font-semibold text-xs whitespace-nowrap">
                      {item.scorer}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="bg-slate-50/80 px-5 py-3.5 border-t border-slate-200/80 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Hiển thị <span className="font-bold text-slate-800">{filteredHistory.length}</span> bản ghi
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-1.5 rounded-lg border border-slate-200/90 text-slate-500 hover:bg-white hover:text-slate-800 transition shadow-2xs cursor-pointer"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="w-7 h-7 rounded-lg text-xs font-bold bg-[#0B1E48] text-white shadow-2xs cursor-pointer"
              >
                1
              </button>
              <button
                type="button"
                className="p-1.5 rounded-lg border border-slate-200/90 text-slate-500 hover:bg-white hover:text-slate-800 transition shadow-2xs cursor-pointer"
                title="Trang kế tiếp"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </>
    )}

      {/* Modal nộp khiếu nại điểm Q06 */}
      {disputeModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B1E48]/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/90 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200/80 shadow-2xs">
                  <AlertCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0B1E48] tracking-tight">
                    Gửi đơn khiếu nại điểm (Q06)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Quy chuẩn bảo vệ quyền lợi thành viên CLB iSSAC
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDisputeModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDispute} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Thành viên khiếu nại:
                </label>
                <select
                  value={disputeMemberCode}
                  onChange={(e) => setDisputeMemberCode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50/70 border border-slate-200/90 rounded-xl font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-[#1351D8] transition shadow-2xs"
                >
                  {members.map((m) => (
                    <option key={m.member_code} value={m.member_code}>
                      {m.full_name} ({m.department_name} - {m.student_id || m.member_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mã tiêu chí bị trừ:
                  </label>
                  <select
                    value={disputeCriterion}
                    onChange={(e) => setDisputeCriterion(e.target.value)}
                    className="w-full p-2.5 bg-slate-50/70 border border-slate-200/90 rounded-xl font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-[#1351D8] transition shadow-2xs"
                  >
                    <option value="T02">T02 (Vắng không phép -5đ)</option>
                    <option value="T04">T04 (Đi họp muộn -1đ)</option>
                    <option value="T07">T07 (Trễ deadline -2đ)</option>
                    <option value="T05">T05 (Không xác nhận TB -1đ)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số điểm khiếu nại:
                  </label>
                  <input
                    type="number"
                    value={disputePoints}
                    onChange={(e) => setDisputePoints(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50/70 border border-slate-200/90 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-[#1351D8] transition shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Lý do chi tiết &amp; Giải trình:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nêu rõ hoàn cảnh, lý do bất khả kháng hoặc minh chứng đã nộp..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50/70 border border-slate-200/90 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-[#1351D8] transition shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Đường dẫn minh chứng (Google Drive / Ảnh):
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={disputeEvidence}
                  onChange={(e) => setDisputeEvidence(e.target.value)}
                  className="w-full p-2.5 bg-slate-50/70 border border-slate-200/90 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-[#1351D8] transition shadow-2xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDisputeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200/80 transition cursor-pointer"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-sm shadow-purple-600/25 transition-all active:scale-95 cursor-pointer"
                >
                  Gửi khiếu nại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Score Modal */}
      <ScoreModal
        isOpen={scoreModalOpen}
        onClose={() => setScoreModalOpen(false)}
        initialPeriodId={selectedPeriodId}
      />
    </div>
  )
}
