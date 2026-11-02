'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useClub } from '@/lib/context/ClubContext'
import { useLanguage } from '@/lib/context/LanguageContext'
import { getMemberAvatarUrl } from '@/lib/clubData'
import { ScoreModal } from '@/components/admin/ScoreModal'
import {
  Download,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
  Pencil,
  Trash2,
  Search,
  Filter,
} from 'lucide-react'
import { normalizeHistoryTimestamp } from '@/lib/vietnamTime'
import { CRITERIA_RULES } from '@/lib/scoring/constants'
import type { ProposalItem } from '@/lib/context/ClubContext'
import type { RuleCode } from '@/types/database'

// Sẵn sàng vận hành thật: Danh sách lịch sử điểm số sạch xuất phát từ các phiên điểm danh & đề xuất thực tế
const INITIAL_HISTORY: Array<{
  id: string
  memberCode: string
  time: string
  name: string
  dept: string
  code: string
  title: string
  points: number
  type: string
  scorer: string
  rawProposal?: ProposalItem
}> = []

export function HistoryView() {
  const { language, t } = useLanguage()
  const { isBCN, isHR, currentUser } = useAuth()
  const {
    members,
    proposals,
    approveProposal,
    rejectProposal,
    updateProposal,
    deleteProposal,
    disputes,
    createDispute,
    resolveDisputeByBCN,
    reviewDisputeByHR,
    periods,
    currentActivePeriodId,
    customRules,
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
  const [selectedSemester, setSelectedSemester] = useState('ky1_2026_2027')
  const [scoreModalOpen, setScoreModalOpen] = useState(false)
  const [disputeModalOpen, setDisputeModalOpen] = useState(false)

  // Bộ lọc tìm kiếm & phòng ban & phân trang
  const [searchQuery, setSearchQuery] = useState('')
  const [deptFilter, setDeptFilter] = useState('ALL')
  const [pageSize, setPageSize] = useState<number>(15)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // State cho BCN Sửa điểm
  const [editingProposal, setEditingProposal] = useState<ProposalItem | null>(null)
  const [editPoints, setEditPoints] = useState<number>(0)
  const [editCriterionCode, setEditCriterionCode] = useState<string>('C07')
  const [editReason, setEditReason] = useState<string>('')

  // State cho BCN Xóa điểm
  const [deletingProposal, setDeletingProposal] = useState<ProposalItem | null>(null)

  // Form khiếu nại mới
  const [disputeMemberCode, setDisputeMemberCode] = useState(members[0]?.member_code || '')
  const [disputeCriterion, setDisputeCriterion] = useState('T02')
  const [disputePoints, setDisputePoints] = useState(-5)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeEvidence, setDisputeEvidence] = useState('')

  // State Ban Chủ nhiệm & Ban Nhân sự xét duyệt khiếu nại
  const [verdictModalOpen, setVerdictModalOpen] = useState(false)
  const [selectedDispute, setSelectedDispute] = useState<any>(null)
  const [isApproveVerdict, setIsApproveVerdict] = useState(true)
  const [verdictText, setVerdictText] = useState('')
  const [verdictActionLoading, setVerdictActionLoading] = useState(false)

  const [hrReviewModalOpen, setHrReviewModalOpen] = useState(false)
  const [hrNoteText, setHrNoteText] = useState('')

  const openBcnVerdictModal = (disp: any, approve: boolean) => {
    setSelectedDispute(disp)
    setIsApproveVerdict(approve)
    setVerdictText(
      approve
        ? 'Hồ sơ khiếu nại hợp lệ. Ban Chủ nhiệm đồng ý chấp thuận và hoàn trả lại số điểm đã trừ.'
        : 'Bác khiếu nại do minh chứng chưa đầy đủ hoặc không thỏa mãn quy định.'
    )
    setVerdictModalOpen(true)
  }

  const handleConfirmBcnVerdict = () => {
    if (!selectedDispute) return
    setVerdictActionLoading(true)
    const res = resolveDisputeByBCN(
      selectedDispute.id,
      isApproveVerdict,
      verdictText.trim() || (isApproveVerdict ? 'Chấp thuận khiếu nại' : 'Bác khiếu nại')
    )
    setVerdictActionLoading(false)
    setVerdictModalOpen(false)
    setSelectedDispute(null)
    if (res?.message) {
      alert(res.message)
    }
  }

  const handleOpenHrReview = (disp: any) => {
    setSelectedDispute(disp)
    setHrNoteText('Đã kiểm tra sơ bộ minh chứng hợp lệ, chuyển Ban Chủ nhiệm xem xét phán quyết.')
    setHrReviewModalOpen(true)
  }

  const handleConfirmHrReview = () => {
    if (!selectedDispute) return
    reviewDisputeByHR(selectedDispute.id, hrNoteText.trim())
    setHrReviewModalOpen(false)
    setSelectedDispute(null)
    alert('Đã hoàn tất thẩm định sơ bộ và chuyển Ban Chủ nhiệm xem xét phê duyệt!')
  }

  // Helper avatar đồng bộ với MembersView & StatsView
  const getMemberAvatar = (name: string, memberCode?: string) => {
    const found = members.find((m) => m.full_name === name || (memberCode && m.member_code === memberCode))
    return getMemberAvatarUrl(found || { full_name: name, member_code: memberCode })
  }

  // Helper dịch phòng ban sang tiếng Anh
  const translateDept = (deptName?: string) => {
    if (!deptName || language === 'vi') return deptName || ''
    if (deptName.includes('Tư vấn')) return 'Advisory Dept'
    if (deptName.includes('Truyền thông')) return 'Communications Dept'
    if (deptName.includes('Nhân sự')) return 'HR Dept'
    if (deptName.includes('Chủ nhiệm') || deptName.includes('BCN')) return 'Executive Board'
    return deptName
  }

  // Mascot Chibi tương tác & danh ngôn động viên iSSAC
  const [isMascotCheering, setIsMascotCheering] = useState<boolean>(false)
  const [mascotMessageIdx, setMascotMessageIdx] = useState<number>(0)
  const [showMascotBubble, setShowMascotBubble] = useState<boolean>(false)
  const bubbleTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const historyMascotQuotesVi = [
    'Chào iSSACer! Cùng theo dõi sổ điểm nhé!',
    'Mọi cống hiến đều được ghi nhận công bằng!',
    'Minh bạch - Kịp thời - Chuẩn mực!',
    'Khiếu nại Q06 được xử lý nhanh chóng!',
    'Năng động - Sáng tạo - Dẫn đầu!',
    'Tự hào VNU-IS Ambassadors!',
  ]

  const historyMascotQuotesEn = [
    'Hello iSSACer! Tracking emulation ledger!',
    'Every contribution is fairly recognized!',
    'Transparent - Prompt - Standardized!',
    'Q06 appeals are resolved quickly!',
    'Dynamic - Creative - Leading!',
    'Proud VNU-IS Ambassadors!',
  ]

  const handleMascotClick = () => {
    setIsMascotCheering(true)
    setShowMascotBubble(true)
    setMascotMessageIdx((prev) => (prev + 1) % historyMascotQuotesVi.length)
    setTimeout(() => setIsMascotCheering(false), 850)

    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current)
    bubbleTimeoutRef.current = setTimeout(() => {
      setShowMascotBubble(false)
    }, 2800)
  }

  const pendingList = proposals.filter((p) => p.status === 'pending_bcn')
  const pendingDisputesCount = disputes.filter((d) => d.status === 'pending_bcn' || d.status === 'pending_hr_review').length

  // Ghép các bản ghi được approved từ context vào danh sách lịch sử sống
  const dynamicHistory = proposals
    .filter((p) => p.status === 'approved')
    .map((p) => ({
      id: p.id,
      memberCode: p.memberCode,
      time: normalizeHistoryTimestamp(p.createdAt),
      name: p.memberName,
      dept: p.memberDept,
      code: p.criterionCode,
      title: `${p.criterionName} - ${p.reason}`,
      points: p.points,
      type: p.points > 0 ? 'Cộng' : p.points < 0 ? 'Trừ' : 'Ghi nhận',
      scorer: p.proposedBy,
      rawProposal: p,
    }))

  const combinedHistory = [...dynamicHistory, ...INITIAL_HISTORY]

  // Filter table data: chuẩn hóa logic điểm cộng > 0, điểm trừ < 0, tất cả = mọi bản ghi
  const filteredHistory = combinedHistory.filter((item) => {
    // 1. Lọc theo chuỗi tìm kiếm
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.memberCode.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.scorer.toLowerCase().includes(q)
      if (!matchesSearch) return false
    }

    // 2. Lọc theo Ban trực thuộc
    if (deptFilter !== 'ALL' && item.dept !== deptFilter) {
      return false
    }

    // 3. Lọc theo Tab chuẩn: Điểm cộng (> 0), Điểm trừ (< 0), Tất cả (bao gồm cả ghi nhận 0đ)
    if (activeTab === 'add') return item.points > 0
    if (activeTab === 'deduct') return item.points < 0
    return true
  })

  // Đếm đúng chuẩn số lượng: Điểm cộng > 0, Điểm trừ < 0
  const countAdd = combinedHistory.filter((i) => i.points > 0).length
  const countDeduct = combinedHistory.filter((i) => i.points < 0).length

  // Tự động nhảy về trang 1 khi chuyển tab hoặc thay đổi tìm kiếm / bộ lọc
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchQuery, deptFilter, selectedPeriodId, pageSize])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredHistory.length / (pageSize === 0 ? filteredHistory.length || 1 : pageSize))
  )
  const paginatedHistory =
    pageSize === 0
      ? filteredHistory
      : filteredHistory.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Mở modal Sửa điểm cho BCN
  const handleOpenEdit = (prop?: ProposalItem) => {
    if (!prop) return
    setEditingProposal(prop)
    setEditPoints(prop.points)
    setEditCriterionCode(prop.criterionCode)
    setEditReason(prop.reason)
  }

  // Mở modal Xóa điểm cho BCN
  const handleOpenDelete = (prop?: ProposalItem) => {
    if (!prop) return
    setDeletingProposal(prop)
  }

  // Lưu chỉnh sửa điểm (BCN)
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProposal) return

    const res = updateProposal(
      editingProposal.id,
      {
        points: Number(editPoints),
        criterionCode: editCriterionCode,
        reason: editReason.trim(),
      },
      currentUser?.name || 'Ban Chủ nhiệm'
    )

    alert(res.message)
    if (res.success) {
      setEditingProposal(null)
    }
  }

  // Xác nhận xóa điểm (BCN)
  const handleConfirmDelete = () => {
    if (!deletingProposal) return

    const res = deleteProposal(deletingProposal.id, currentUser?.name || 'Ban Chủ nhiệm')
    alert(res.message)
    if (res.success) {
      setDeletingProposal(null)
    }
  }

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
      {/* 1. Header trang chuẩn nhận diện dự án CLB (Ảnh 2) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3.5 sm:gap-4.5">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-[28px] font-extrabold text-[#061651] tracking-tight leading-tight">
              {t('history.title')}
            </h1>
            <p className="text-xs sm:text-[13px] text-[#64748B] mt-1 font-normal">
              {t('history.subtitle')}
            </p>
          </div>

          {/* Mascot Chibi - Cách 1 khoảng thoáng và căn giữa cân đối theo cả 2 dòng chữ */}
          <div
            onClick={handleMascotClick}
            className="relative group cursor-pointer inline-flex items-center shrink-0 select-none"
            title={t('history.mascot_tooltip')}
          >
            <img
              src="/history-mascot.png"
              alt="iSSAC Chibi Mascot"
              className={`w-11 h-14 sm:w-12 sm:h-15 object-contain drop-shadow-[0_3px_8px_rgba(0,0,0,0.12)] transition-all duration-300 ${
                isMascotCheering
                  ? 'animate-mascot-pop drop-shadow-[0_8px_20px_rgba(0,132,200,0.4)]'
                  : 'animate-mascot-fly hover:scale-115 hover:rotate-3'
              }`}
            />

            {/* Bubble tooltip nằm bên cạnh mascot (ẩn trên điện thoại hẹp để tránh tràn viền) */}
            <div
              className={`absolute left-full ml-2.5 sm:ml-3 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0084c8] to-[#0284C7] text-white text-[11px] font-bold shadow-lg pointer-events-none whitespace-nowrap z-40 transition-all duration-200 hidden sm:flex items-center border border-white/25 ${
                isMascotCheering || showMascotBubble
                  ? 'opacity-100 scale-105 translate-x-1 pointer-events-auto'
                  : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
              }`}
            >
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#0084c8] rotate-45 border-l border-b border-white/25" />
              <span className="relative z-10 select-none tracking-tight">
                {language === 'vi' ? historyMascotQuotesVi[mascotMessageIdx] : historyMascotQuotesEn[mascotMessageIdx]}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0 self-start md:self-auto">
          {/* Dispute button for members */}
          <button
            type="button"
            onClick={() => setDisputeModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#FAF5FF] text-[#9333EA] border border-purple-200 hover:bg-purple-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
          >
            <AlertCircle className="w-4 h-4 text-[#9333EA] shrink-0" />
            <span>{t('history.btn_dispute')}</span>
          </button>

          {/* Score proposal action button */}
          {(isBCN || isHR) && (
            <button
              type="button"
              onClick={() => setScoreModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-xs shadow-sky-600/30 transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>{isBCN ? t('history.btn_score') : t('history.btn_propose')}</span>
            </button>
          )}

          {/* Export button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            title="Xuất dữ liệu lịch sử ra file CSV"
          >
            <Download className="w-4 h-4 text-slate-500 shrink-0" />
            <span>{t('history.btn_export')}</span>
          </button>
        </div>
      </div>

      {/* 2. Bốn Thẻ Chỉ Số KPI Sổ Điểm Chuẩn Style Ảnh 2 (Pastel Nhạt, Bo góc rounded-xl, Đổ bóng nổi rõ khối box) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Tổng số bản ghi (Sky Pastel #F0F9FF) */}
        <div
          onClick={() => setActiveTab('all')}
          className={`p-3.5 sm:p-4 rounded-xl bg-[#F0F9FF] flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 ${
            activeTab === 'all' ? 'ring-2 ring-[#0284C7]' : ''
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 block">
              {t('history.kpi_total')}
            </span>
            <span className="text-2xl sm:text-[28px] font-black text-[#0284C7] block tracking-tight leading-none py-0.5">
              {combinedHistory.length}
            </span>
            <span className="text-[11.5px] font-semibold text-[#0284C7] block hover:underline">
              {t('history.kpi_total_desc')}
            </span>
          </div>
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-sky-300/70 bg-white/60 flex items-center justify-center text-[#0284C7] shrink-0">
            <Layers className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* Card 2: Lượt cộng điểm (Emerald Pastel #F0FDF4) */}
        <div
          onClick={() => setActiveTab('add')}
          className={`p-3.5 sm:p-4 rounded-xl bg-[#F0FDF4] flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 ${
            activeTab === 'add' ? 'ring-2 ring-[#16A34A]' : ''
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 block">
              {t('history.kpi_bonus')}
            </span>
            <span className="text-2xl sm:text-[28px] font-black text-[#16A34A] block tracking-tight leading-none py-0.5">
              {countAdd}
            </span>
            <span className="text-[11.5px] font-semibold text-[#16A34A] block hover:underline">
              {t('history.kpi_bonus_desc')}
            </span>
          </div>
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-emerald-300/70 bg-white/60 flex items-center justify-center text-[#16A34A] shrink-0">
            <TrendingUp className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* Card 3: Lượt trừ điểm (Amber Pastel #FFFBEB) */}
        <div
          onClick={() => setActiveTab('deduct')}
          className={`p-3.5 sm:p-4 rounded-xl bg-[#FFFBEB] flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 ${
            activeTab === 'deduct' ? 'ring-2 ring-[#D97706]' : ''
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 block">
              {t('history.kpi_penalty')}
            </span>
            <span className="text-2xl sm:text-[28px] font-black text-[#D97706] block tracking-tight leading-none py-0.5">
              {countDeduct}
            </span>
            <span className="text-[11.5px] font-semibold text-[#D97706] block hover:underline">
              {t('history.kpi_penalty_desc')}
            </span>
          </div>
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-amber-300/70 bg-white/60 flex items-center justify-center text-[#D97706] shrink-0">
            <TrendingDown className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* Card 4: Khiếu nại Q06 (Purple Pastel #FAF5FF) */}
        <div
          onClick={() => setActiveTab('disputes')}
          className={`p-3.5 sm:p-4 rounded-xl bg-[#FAF5FF] flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 ${
            activeTab === 'disputes' ? 'ring-2 ring-[#9333EA]' : ''
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 block">
              {t('history.kpi_disputes')}
            </span>
            <span className="text-2xl sm:text-[28px] font-black text-[#9333EA] block tracking-tight leading-none py-0.5">
              {disputes.length}
            </span>
            <span className="text-[11.5px] font-semibold text-[#9333EA] block hover:underline">
              {pendingDisputesCount > 0
                ? (language === 'vi' ? `${pendingDisputesCount} đơn cần xử lý` : `${pendingDisputesCount} pending review`)
                : t('history.kpi_disputes_desc')}
            </span>
          </div>
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border border-purple-300/70 bg-white/60 flex items-center justify-center text-[#9333EA] shrink-0">
            <MessageSquare className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
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

      {/* KHỐI CONTAINER TRẮNG: Subtabs (Pills bo tròn) + Bộ điều khiển chu kỳ + Thanh tìm kiếm & Tiêu chí lọc (Khớp 100% Ảnh 1) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-4 sm:p-5 space-y-3.5">
        {/* Hàng 1: Subtabs (Dạng Pill bo tròn mềm mại) + Bộ điều khiển Kỳ & Tháng */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Subtabs dạng Pill độc lập chuẩn Ảnh 1 */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {[
              {
                id: 'all' as const,
                label: t('history.tab_all'),
                count: combinedHistory.length,
                icon: Layers,
              },
              {
                id: 'add' as const,
                label: t('history.tab_add'),
                count: countAdd,
                icon: TrendingUp,
              },
              {
                id: 'deduct' as const,
                label: t('history.tab_deduct'),
                count: countDeduct,
                icon: TrendingDown,
              },
              {
                id: 'disputes' as const,
                label: t('history.tab_disputes'),
                count: pendingDisputesCount > 0 ? pendingDisputesCount : disputes.length,
                icon: MessageSquare,
                isAlert: pendingDisputesCount > 0,
              },
            ].map((tab) => {
              const isSelected = activeTab === tab.id
              const TabIcon = tab.icon
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id)
                    setCurrentPage(1)
                  }}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs transition-all whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0284C7] text-white font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 font-medium'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : tab.isAlert
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-200/90 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Period & Month Controls */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            {/* Semester selector */}
            <div className="relative shrink-0">
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="appearance-none pl-3.5 pr-8 py-1.5 bg-white hover:bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-bold text-[#061651] focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/20 transition shadow-2xs cursor-pointer whitespace-nowrap"
              >
                <option value="ky1_2026_2027">
                  {language === 'vi' ? 'Kỳ 1 năm học 2026 - 2027' : 'Semester 1 AY 2026 - 2027'}
                </option>
                <option value="ky2_2025_2026">
                  {language === 'vi' ? 'Kỳ 2 năm học 2025 - 2026' : 'Semester 2 AY 2025 - 2026'}
                </option>
                <option value="ky1_2025_2026">
                  {language === 'vi' ? 'Kỳ 1 năm học 2025 - 2026' : 'Semester 1 AY 2025 - 2026'}
                </option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Month selector using periods - Clean name without redundant text */}
            <div className="relative shrink-0">
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="appearance-none pl-3.5 pr-8 py-1.5 bg-white hover:bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-bold text-[#061651] focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/20 transition shadow-2xs cursor-pointer whitespace-nowrap"
              >
                {monthPeriods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {language === 'en'
                      ? p.name.replace('Tháng ', 'Month ').replace('Năm ', 'Year ')
                      : p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Status Badge */}
            {selectedPeriodObj?.status === 'locked' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs whitespace-nowrap shrink-0">
                <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                <span>{t('history.status_locked')}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs whitespace-nowrap shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>{t('history.status_open')}</span>
              </span>
            )}
          </div>
        </div>

        {/* Hàng 2: Thanh tìm kiếm (Bo tròn dài rounded-full) & Chip tiêu chí lọc ban (Chuẩn 100% Ảnh 1) */}
        {activeTab !== 'disputes' && (
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-0.5">
            {/* Search Input (rounded-full) */}
            <div className="relative flex-1 sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('history.search_placeholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-9.5 pr-8 py-2 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/20 transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Chip filter theo Ban & Dropdown Số bản ghi/trang */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 text-xs flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-bold text-[11px] whitespace-nowrap flex items-center gap-1 pr-1">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span>{language === 'vi' ? 'Tiêu chí:' : 'Criteria:'}</span>
                </span>
                {[
                  { id: 'ALL', label: language === 'vi' ? 'Tất cả' : 'All' },
                  { id: 'Ban Chủ nhiệm', label: language === 'vi' ? 'Ban Chủ nhiệm' : 'Exec Board' },
                  { id: 'Ban Truyền thông', label: language === 'vi' ? 'Truyền thông' : 'Communications' },
                  { id: 'Ban Tư vấn', label: language === 'vi' ? 'Tư vấn' : 'Advisory' },
                  { id: 'Ban Nhân sự', label: language === 'vi' ? 'Nhân sự' : 'HR' },
                ].map((chip) => {
                  const isSelected = deptFilter === chip.id
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => {
                        setDeptFilter(chip.id)
                        setCurrentPage(1)
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        isSelected
                          ? 'bg-[#0284C7] text-white font-bold'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <span>{chip.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Page size dropdown */}
              <div className="relative shrink-0 ml-1">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="appearance-none pl-3 pr-7 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-[#061651] focus:outline-none focus:border-[#0284C7] transition shadow-2xs cursor-pointer whitespace-nowrap"
                >
                  <option value={10}>10 {t('history.records_per_page')}</option>
                  <option value={15}>15 {t('history.records_per_page')}</option>
                  <option value={25}>25 {t('history.records_per_page')}</option>
                  <option value={50}>50 {t('history.records_per_page')}</option>
                  <option value={0}>{t('history.all_records')} ({filteredHistory.length})</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        )}
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
              Thành viên có quyền khiếu nại điểm trong vòng 7 ngày kể từ khi có biến động điểm. Ban Nhân sự thẩm định sơ bộ hoặc Ban Chủ nhiệm có toàn quyền trực tiếp kiểm tra và ra phán quyết cuối cùng (Hoàn trả điểm hoặc Bác khiếu nại).
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

                {/* Quyền Ban Chủ nhiệm: Trực tiếp thẩm định & ra quyết định ngay ở mọi giai đoạn */}
                {isBCN && (disp.status === 'pending_bcn' || disp.status === 'pending_hr_review') && (
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200/70 inline-flex items-center gap-1.5 w-fit">
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      Quyền Ban Chủ nhiệm: Trực tiếp kiểm tra &amp; ra quyết định
                    </span>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => openBcnVerdictModal(disp, false)}
                        className="px-3.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl transition shadow-2xs cursor-pointer active:scale-95"
                      >
                        Bác khiếu nại
                      </button>
                      <button
                        type="button"
                        onClick={() => openBcnVerdictModal(disp, true)}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-xs shadow-emerald-600/30 transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Chấp thuận &amp; Hoàn điểm</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Ban Nhân sự thẩm định sơ bộ khi BCN chưa trực tiếp duyệt */}
                {isHR && !isBCN && disp.status === 'pending_hr_review' && (
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <span className="text-xs text-slate-500 font-medium">
                      Ban Nhân sự thẩm định hồ sơ trước khi chuyển Ban Chủ nhiệm phê duyệt.
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenHrReview(disp)}
                      className="px-3.5 py-1.5 text-xs font-bold text-[#0284C7] bg-sky-50 hover:bg-sky-100 border border-sky-200/80 rounded-xl transition shadow-2xs cursor-pointer active:scale-95"
                    >
                      Thẩm định &amp; Chuyển BCN
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
            {paginatedHistory.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200/90 text-center text-slate-400">
                <p className="font-semibold text-xs">{t('history.no_data')}</p>
              </div>
            ) : (
              paginatedHistory.map((item, index) => {
                const avatar = getMemberAvatar(item.name, item.memberCode)
                return (
                  <div
                    key={item.id || index}
                    className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={item.name}
                            className="w-8 h-8 rounded-full object-cover border border-sky-200/80 shrink-0 shadow-2xs"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#F0F9FF] text-[#0284C7] border border-sky-200/80 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {item.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-bold text-[#061651] text-xs sm:text-sm block truncate">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium block truncate">
                            {translateDept(item.dept)} • {item.time}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-black shadow-2xs border ${
                            item.points > 0
                              ? 'bg-[#F0FDF4] text-[#16A34A] border-emerald-200'
                              : item.points < 0
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {item.points > 0 ? `+${item.points}` : item.points}đ
                        </span>
                      </div>
                    </div>

                    <div className="p-2 bg-slate-50/70 rounded-xl border border-slate-200/60 text-xs text-slate-700 flex items-start gap-1.5">
                      <span className="font-mono font-bold text-[10px] text-[#0284C7] bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 shrink-0">
                        {item.code}
                      </span>
                      <span className="leading-snug">{item.title}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span>
                        {t('history.th_scorer')}: <strong className="text-slate-700">{item.scorer}</strong>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.points > 0 ? 'text-[#16A34A]' : item.points < 0 ? 'text-rose-700' : 'text-slate-600'
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>

                    {/* Quyền Sửa/Xóa của Ban Chủ nhiệm trên Mobile */}
                    {isBCN && item.rawProposal && (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item.rawProposal)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#0284C7] bg-sky-50 hover:bg-sky-100 border border-sky-200/80 rounded-lg transition active:scale-95 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>{t('history.edit_score')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(item.rawProposal)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-lg transition active:scale-95 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{t('history.delete_score')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Regular Table: Signature iSSAC Blue Header (Desktop >= md) */}
          <div className="hidden md:block bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm">
            <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse table-fixed min-w-[1020px]">
              <colgroup>
                <col className="w-[145px]" style={{ width: '145px' }} />
                <col className="w-[220px]" style={{ width: '220px' }} />
                <col className="w-[55px]" style={{ width: '55px' }} />
                <col />
                <col className="w-[60px]" style={{ width: '60px' }} />
                <col className="w-[64px]" style={{ width: '64px' }} />
                <col className="w-[155px]" style={{ width: '155px' }} />
                {isBCN && <col className="w-[86px]" style={{ width: '86px' }} />}
              </colgroup>
              <thead className="bg-[#0284C7] text-xs font-bold text-white uppercase tracking-wider select-none shadow-xs">
                <tr className="divide-x divide-white/15">
                  <th className="py-3 px-4 whitespace-nowrap text-left font-bold text-sky-100 w-[145px]">
                    {t('history.th_time')}
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap text-left font-bold text-white w-[220px]">
                    {t('history.th_member')}
                  </th>
                  <th className="py-3 px-1 text-center whitespace-nowrap font-bold text-sky-100 w-[55px]">
                    {t('history.th_code')}
                  </th>
                  <th className="py-3 px-4 text-left font-bold text-white min-w-[280px]">
                    {t('history.th_content')}
                  </th>
                  <th className="py-3 px-1 text-center whitespace-nowrap font-bold text-white w-[60px]">
                    {t('history.th_points')}
                  </th>
                  <th className="py-3 px-1 text-center whitespace-nowrap font-bold text-sky-100 w-[64px]">
                    {t('history.th_type')}
                  </th>
                  <th className="py-3 px-3.5 text-left whitespace-nowrap font-bold text-sky-100 w-[155px]">
                    {t('history.th_scorer')}
                  </th>
                  {isBCN && (
                    <th className="py-3 px-2 text-center whitespace-nowrap font-bold text-amber-200 w-[86px]">
                      {t('history.th_action')}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={isBCN ? 8 : 7} className="py-10 text-center text-slate-400">
                      <p className="font-semibold text-xs">{t('history.no_data')}</p>
                    </td>
                  </tr>
                ) : (
                  paginatedHistory.map((item, index) => {
                    const avatar = getMemberAvatar(item.name, item.memberCode)
                    return (
                      <tr key={item.id || index} className="hover:bg-slate-50/70 transition-colors group divide-x divide-slate-100">
                        {/* Thời gian (Rộng rãi, có đệm thoáng, không bị sát viền) */}
                        <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap text-xs">
                          {item.time}
                        </td>

                        {/* Thành viên + avatar (Đầy đủ họ tên, không bị cắt dấu ...) */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={item.name}
                                className="w-8 h-8 rounded-full object-cover border border-sky-200/80 shrink-0 shadow-2xs"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#F0F9FF] text-[#0284C7] border border-sky-200/80 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs group-hover:bg-[#0284C7] group-hover:text-white transition-all">
                                {item.name.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-bold text-[#061651] group-hover:text-[#0284C7] transition-colors whitespace-nowrap block text-[13px]">
                                {item.name}
                              </span>
                              {item.dept && (
                                <span className="text-[10.5px] text-slate-400 font-medium block whitespace-nowrap">
                                  {translateDept(item.dept)}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Mã tiêu chí (căn giữa, vừa vặn) */}
                        <td className="py-3.5 px-1 text-center whitespace-nowrap">
                          <span className="font-mono font-bold text-xs text-[#0284C7] inline-block">
                            {item.code}
                          </span>
                        </td>

                        {/* Nội dung (rộng rãi, hiển thị rõ ràng không bị đè lên ô khác) */}
                        <td className="py-3.5 px-4 text-slate-800 font-medium text-xs sm:text-[13px] leading-relaxed break-words">
                          {item.title}
                        </td>

                        {/* Điểm */}
                        <td className="py-3.5 px-1 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold shadow-2xs border ${
                              item.points > 0
                                ? 'bg-[#F0FDF4] text-[#16A34A] border-emerald-200'
                                : item.points < 0
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {item.points > 0 ? `+${item.points}` : item.points}
                          </span>
                        </td>

                        {/* Loại */}
                        <td className="py-3.5 px-1 text-center font-bold text-xs whitespace-nowrap">
                          <span className={item.points > 0 ? 'text-[#16A34A]' : item.points < 0 ? 'text-rose-700' : 'text-slate-600'}>
                            {item.type}
                          </span>
                        </td>

                        {/* Người chấm (Định dạng gọn gàng 2 dòng nếu có ghi chú, không bị tràn chèn ô thao tác) */}
                        <td className="py-3.5 px-3.5 text-slate-600 font-medium text-xs overflow-hidden">
                          {item.scorer.includes('(') ? (
                            <div className="leading-snug min-w-0">
                              <span className="font-bold text-slate-800 block truncate text-[12px]">
                                {item.scorer.split('(')[0].trim()}
                              </span>
                              <span className="text-[10.5px] text-slate-400 font-medium block truncate">
                                ({item.scorer.split('(')[1]}
                              </span>
                            </div>
                          ) : (
                            <span className="font-medium text-slate-700 block truncate" title={item.scorer}>
                              {item.scorer}
                            </span>
                          )}
                        </td>

                        {/* Thao tác BCN (Khoảng cách thoáng đãng, không bị xén lề phải) */}
                        {isBCN && (
                          <td className="py-3.5 px-2 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(item.rawProposal)}
                                className="w-7 h-7 rounded-lg text-blue-600 hover:text-white hover:bg-blue-600 bg-white border border-blue-200 transition-all shadow-2xs flex items-center justify-center cursor-pointer"
                                title={t('history.edit_score')}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenDelete(item.rawProposal)}
                                className="w-7 h-7 rounded-lg text-rose-500 hover:text-white hover:bg-rose-500 bg-white border border-rose-200 transition-all shadow-2xs flex items-center justify-center cursor-pointer"
                                title={t('history.delete_score')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer chuẩn hóa đầy đủ */}
          <div className="bg-slate-50/80 px-5 py-3.5 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs font-medium text-slate-500">
              {language === 'vi' ? (
                <>
                  Hiển thị <span className="font-bold text-[#061651]">{filteredHistory.length > 0 ? (currentPage - 1) * (pageSize || filteredHistory.length) + 1 : 0}</span> - <span className="font-bold text-[#061651]">{pageSize ? Math.min(currentPage * pageSize, filteredHistory.length) : filteredHistory.length}</span> trên tổng số <span className="font-bold text-[#061651]">{filteredHistory.length}</span> bản ghi
                </>
              ) : (
                <>
                  Showing <span className="font-bold text-[#061651]">{filteredHistory.length > 0 ? (currentPage - 1) * (pageSize || filteredHistory.length) + 1 : 0}</span> - <span className="font-bold text-[#061651]">{pageSize ? Math.min(currentPage * pageSize, filteredHistory.length) : filteredHistory.length}</span> of <span className="font-bold text-[#061651]">{filteredHistory.length}</span> records
                </>
              )}
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={`p-1.5 rounded-lg border border-slate-200/90 transition shadow-2xs ${
                    currentPage === 1
                      ? 'text-slate-300 bg-slate-50 cursor-not-allowed'
                      : 'text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 cursor-pointer'
                  }`}
                  title={language === 'vi' ? 'Trang trước' : 'Previous page'}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer ${
                          currentPage === page
                            ? 'bg-[#0284C7] text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/90'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className="px-1 text-slate-400 text-xs font-bold select-none">
                        ...
                      </span>
                    )
                  }
                  return null
                })}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={`p-1.5 rounded-lg border border-slate-200/90 transition shadow-2xs ${
                    currentPage === totalPages
                      ? 'text-slate-300 bg-slate-50 cursor-not-allowed'
                      : 'text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 cursor-pointer'
                  }`}
                  title={language === 'vi' ? 'Trang kế tiếp' : 'Next page'}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
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

      {/* Modal Sửa Điểm Nhầm cho BCN */}
      {editingProposal && (
        <div className="fixed inset-0 z-50 bg-[#0B1E48]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/90 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1351D8] flex items-center justify-center border border-blue-200/80 shadow-2xs">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0B1E48] tracking-tight">
                    Chỉnh sửa bản ghi điểm (Quyền BCN)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Sửa đổi điểm số / tiêu chí nếu phát hiện nhập nhầm
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingProposal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Thành viên:</span>
                  <span className="font-bold text-slate-900 text-sm">{editingProposal.memberName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Ban trực thuộc:</span>
                  <span className="font-semibold text-slate-700">{editingProposal.memberDept}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Thời gian tạo:</span>
                  <span className="font-mono text-slate-600">{normalizeHistoryTimestamp(editingProposal.createdAt)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tiêu chí:
                  </label>
                  <select
                    value={editCriterionCode}
                    onChange={(e) => {
                      const code = e.target.value
                      setEditCriterionCode(code)
                      const rule = CRITERIA_RULES[code as RuleCode]
                      const cRule = customRules.find((r) => r.code === code)
                      if (rule) {
                        setEditPoints(rule.type === 'deduct' ? -rule.base_points : rule.base_points)
                      } else if (cRule) {
                        const pts = typeof cRule.points === 'number' ? cRule.points : parseFloat(String(cRule.points)) || 0
                        setEditPoints(pts)
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50/70 border border-slate-200/90 rounded-xl font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-[#1351D8] transition shadow-2xs cursor-pointer"
                  >
                    <optgroup label="Tiêu chí Cộng điểm chuẩn (C01 - C09)">
                      {Object.values(CRITERIA_RULES)
                        .filter((r) => r.code.startsWith('C'))
                        .map((r) => (
                          <option key={r.code} value={r.code}>
                            {r.code} - {r.name} (+{r.base_points}đ)
                          </option>
                        ))}
                    </optgroup>
                    {customRules.filter((r) => r.type === 'add').length > 0 && (
                      <optgroup label="Tiêu chí Cộng điểm bổ sung CLB">
                        {customRules
                          .filter((r) => r.type === 'add')
                          .map((r) => (
                            <option key={r.code} value={r.code}>
                              {r.code} - {r.name} (+{r.points}đ)
                            </option>
                          ))}
                      </optgroup>
                    )}
                    <optgroup label="Tiêu chí Trừ điểm chuẩn (T01 - T13)">
                      {Object.values(CRITERIA_RULES)
                        .filter((r) => r.code.startsWith('T'))
                        .map((r) => (
                          <option key={r.code} value={r.code}>
                            {r.code} - {r.name} ({r.base_points}đ)
                          </option>
                        ))}
                    </optgroup>
                    {customRules.filter((r) => r.type === 'deduct').length > 0 && (
                      <optgroup label="Tiêu chí Trừ điểm bổ sung CLB">
                        {customRules
                          .filter((r) => r.type === 'deduct')
                          .map((r) => (
                            <option key={r.code} value={r.code}>
                              {r.code} - {r.name} ({r.points}đ)
                            </option>
                          ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số điểm (Có thể nhập số âm hoặc 0):
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={editPoints}
                    onChange={(e) => setEditPoints(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50/70 border border-slate-200/90 rounded-xl font-black text-slate-900 focus:bg-white focus:outline-none focus:border-[#1351D8] transition shadow-2xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Gốc: {editingProposal.points > 0 ? `+${editingProposal.points}` : editingProposal.points}đ (Chênh lệch: {editPoints - editingProposal.points >= 0 ? `+${editPoints - editingProposal.points}` : editPoints - editingProposal.points}đ)
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nội dung / Lý do ghi nhận:
                </label>
                <textarea
                  rows={3}
                  required
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50/70 border border-slate-200/90 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-[#1351D8] transition shadow-2xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProposal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200/80 transition cursor-pointer"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 shadow-sm shadow-blue-600/25 transition-all active:scale-95 cursor-pointer"
                >
                  Lưu thay đổi & Cập nhật điểm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xóa / Hoàn Tác Điểm Nhầm cho BCN */}
      {deletingProposal && (
        <div className="fixed inset-0 z-50 bg-[#0B1E48]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-rose-950">
                  Xác nhận xóa bản ghi điểm?
                </h3>
                <p className="text-xs text-rose-700/80 font-medium">
                  Hoàn tác điểm số về trạng thái trước đó
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-200/70 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Thành viên:</span>
                <span className="font-bold text-slate-900">{deletingProposal.memberName} ({deletingProposal.memberDept})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Điểm trong bản ghi:</span>
                <span className="font-black text-rose-700">
                  {deletingProposal.points > 0 ? `+${deletingProposal.points}` : deletingProposal.points} điểm ({deletingProposal.criterionCode})
                </span>
              </div>
              <div className="text-slate-600 leading-relaxed border-t border-rose-200/60 pt-2">
                <strong>Nội dung:</strong> {deletingProposal.reason}
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
              ⚠️ <strong>Cảnh báo:</strong> Thao tác này sẽ xóa bản ghi khỏi sổ cái và tự động hoàn tác điểm của thành viên: {deletingProposal.points > 0 ? `Trừ lại ${deletingProposal.points} điểm` : deletingProposal.points < 0 ? `Cộng hoàn trả lại ${Math.abs(deletingProposal.points)} điểm` : 'Không ảnh hưởng tổng điểm'}.
            </div>

            <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingProposal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200/80 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-sm shadow-rose-600/25 transition-all active:scale-95 cursor-pointer"
              >
                Xác nhận xóa & Hoàn tác
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Phán Quyết Khiếu Nại Dành Cho Ban Chủ Nhiệm (Q06) */}
      {verdictModalOpen && selectedDispute && (
        <div className="fixed inset-0 z-50 bg-[#0B1E48]/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/90 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-2xs ${
                    isApproveVerdict
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      : 'bg-rose-50 text-rose-600 border-rose-200'
                  }`}
                >
                  <Crown className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0B1E48] tracking-tight">
                    {isApproveVerdict
                      ? 'Chấp thuận khiếu nại & Hoàn trả điểm'
                      : 'Bác bỏ khiếu nại (Q06)'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Quyền phán quyết trực tiếp của Ban Chủ nhiệm CLB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setVerdictModalOpen(false)
                  setSelectedDispute(null)
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Chi tiết đơn khiếu nại */}
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Thành viên:</span>
                <span className="font-bold text-slate-900">
                  {selectedDispute.memberName} ({selectedDispute.memberDept})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Điểm &amp; Tiêu chí:</span>
                <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200/60">
                  {selectedDispute.criterionCode} ({selectedDispute.pointsContested > 0 ? `+${selectedDispute.pointsContested}` : selectedDispute.pointsContested} điểm)
                </span>
              </div>
              <div className="text-slate-700 leading-relaxed border-t border-slate-200/60 pt-2">
                <strong className="text-slate-900">Lý do khiếu nại: </strong>
                {selectedDispute.reason}
              </div>
              {selectedDispute.evidenceUrl && (
                <div className="border-t border-slate-200/60 pt-1.5 flex items-center gap-1.5 text-[#0284C7] font-semibold">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <a
                    href={selectedDispute.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-blue-800 break-all"
                  >
                    Xem minh chứng đính kèm
                  </a>
                </div>
              )}
              {selectedDispute.hrNote && (
                <div className="border-t border-slate-200/60 pt-1.5 text-slate-600 bg-sky-50/50 p-2 rounded-xl">
                  <strong className="text-sky-900">Ý kiến Ban Nhân sự: </strong>
                  {selectedDispute.hrNote}
                </div>
              )}
            </div>

            {/* Textarea lý do phán quyết */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-slate-700">
                Ý kiến / Phán quyết chính thức của Ban Chủ nhiệm:
              </label>
              <textarea
                rows={3}
                required
                value={verdictText}
                onChange={(e) => setVerdictText(e.target.value)}
                placeholder="Nhập căn cứ phán quyết hoặc ghi chú..."
                className="w-full p-2.5 bg-slate-50/70 border border-slate-200/90 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-[#1351D8] transition shadow-2xs font-medium"
              />
            </div>

            {/* Thông báo tác động */}
            {isApproveVerdict ? (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 leading-relaxed flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Cơ chế tự động:</strong> Khi chấp thuận, hệ thống sẽ tự động hoàn trả{' '}
                  <strong className="text-emerald-700">
                    +{Math.abs(selectedDispute.pointsContested)} điểm
                  </strong>{' '}
                  cho thành viên {selectedDispute.memberName}, đồng thời ghi nhận vào sổ cái lịch sử và đồng bộ dữ liệu ngay lập tức.
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Lưu ý:</strong> Khi bác khiếu nại, điểm số bị trừ sẽ được giữ nguyên và trạng thái khiếu nại chuyển thành Bác khiếu nại.
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setVerdictModalOpen(false)
                  setSelectedDispute(null)
                }}
                disabled={verdictActionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200/80 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmBcnVerdict}
                disabled={verdictActionLoading}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                  isApproveVerdict
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/25'
                    : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-600/25'
                }`}
              >
                {verdictActionLoading ? (
                  <span className="animate-spin">⏳</span>
                ) : isApproveVerdict ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>
                  {verdictActionLoading
                    ? 'Đang xử lý...'
                    : isApproveVerdict
                    ? 'Xác nhận Chấp thuận & Hoàn điểm'
                    : 'Xác nhận Bác khiếu nại'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ban Nhân Sự Thẩm Định Sơ Bộ (Q06) */}
      {hrReviewModalOpen && selectedDispute && (
        <div className="fixed inset-0 z-50 bg-[#0B1E48]/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/90 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#0284C7] flex items-center justify-center border border-sky-200 shadow-2xs">
                  <FileCheck className="w-5 h-5 text-[#0284C7]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0B1E48] tracking-tight">
                    Ban Nhân sự: Thẩm định khiếu nại
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Xác minh sơ bộ minh chứng và đề xuất chuyển Ban Chủ nhiệm
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setHrReviewModalOpen(false)
                  setSelectedDispute(null)
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Chi tiết */}
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Thành viên:</span>
                <span className="font-bold text-slate-900">
                  {selectedDispute.memberName} ({selectedDispute.memberDept})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Tiêu chí:</span>
                <span className="font-bold text-slate-800">
                  {selectedDispute.criterionCode} ({selectedDispute.pointsContested > 0 ? `+${selectedDispute.pointsContested}` : selectedDispute.pointsContested} điểm)
                </span>
              </div>
              <div className="text-slate-700 leading-relaxed border-t border-slate-200/60 pt-2">
                <strong className="text-slate-900">Lý do: </strong>
                {selectedDispute.reason}
              </div>
              {selectedDispute.evidenceUrl && (
                <div className="border-t border-slate-200/60 pt-1.5 flex items-center gap-1.5 text-[#0284C7] font-semibold">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <a
                    href={selectedDispute.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-blue-800 break-all"
                  >
                    Xem minh chứng đính kèm
                  </a>
                </div>
              )}
            </div>

            {/* Ghi chú */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-slate-700">
                Ý kiến thẩm định của Ban Nhân sự:
              </label>
              <textarea
                rows={3}
                required
                value={hrNoteText}
                onChange={(e) => setHrNoteText(e.target.value)}
                placeholder="Nhập kết quả xác minh sơ bộ..."
                className="w-full p-2.5 bg-slate-50/70 border border-slate-200/90 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-[#1351D8] transition shadow-2xs font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setHrReviewModalOpen(false)
                  setSelectedDispute(null)
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200/80 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmHrReview}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 shadow-sm shadow-sky-600/25 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Chuyển Ban Chủ nhiệm phê duyệt</span>
              </button>
            </div>
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
