'use client'

import React, { useState, useEffect } from 'react'
import {
  Coins,
  Lock,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Hourglass,
  Zap,
  CheckCircle2,
  Shield,
  Download,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Check,
  AlertTriangle,
  FileCheck,
  Eye,
  ExternalLink,
  ChevronRight,
  Calendar,
  BookOpen,
  Users,
  ShieldCheck,
  Building,
} from 'lucide-react'
import { HanoiWeatherCard } from '@/components/dashboard/HanoiWeatherCard'
import { useAuth } from '@/lib/auth/AuthContext'
import type {
  ExpenseRequest,
  FinancialAuditLog,
  FinancialDashboardStats,
  FinancialLedgerEntry,
  FundCampaign,
} from '@/types/finance'

export default function FinanceView() {
  const { currentUser } = useAuth()

  // State
  const [activeTab, setActiveTab] = useState<
    'fund' | 'events' | 'ledger' | 'permissions' | 'audit'
  >('fund')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  // Data
  const [stats, setStats] = useState<FinancialDashboardStats>({
    totalIncome: 8500000,
    totalExpense: 2150000,
    balance: 6350000,
    totalTransactions: 8,
    paidMembersCount: 28,
    unpaidMembersCount: 20,
    pendingReconciliationCount: 2,
    activeCampaignsCount: 2,
  })
  const [ledgerEntries, setLedgerEntries] = useState<FinancialLedgerEntry[]>([])
  const [campaigns, setCampaigns] = useState<FundCampaign[]>([])
  const [expenses, setExpenses] = useState<ExpenseRequest[]>([])
  const [auditLogs, setAuditLogs] = useState<FinancialAuditLog[]>([])

  // Modals
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [showSimulateModal, setShowSimulateModal] = useState(false)
  const [auditResult, setAuditResult] = useState<any>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  // Form states
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    slug: '',
    defaultAmount: 100000,
    description: '',
  })
  const [expenseForm, setExpenseForm] = useState({
    category: 'materials',
    amount: 250000,
    reason: '',
    recipient: '',
    relatedEvent: '',
  })
  const [simulateForm, setSimulateForm] = useState({
    paymentCode: 'ISSAC8F3K9P2A',
    amount: 100000,
    content: 'Chuyen khoan dong quy iSSAC ISSAC8F3K9P2A',
  })

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/finance/dashboard')
      const json = await res.json()
      if (res.ok && json.success) {
        setStats(json.data.stats)
        setLedgerEntries(json.data.ledger)
        setCampaigns(json.data.campaigns)
        setExpenses(json.data.expenses)
        setAuditLogs(json.data.auditLogs)
      }
    } catch (err) {
      console.error('Error fetching finance data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Create Campaign
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/finance/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...campaignForm,
          createdBy: currentUser?.name || 'Ban Quản trị',
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setActionMessage('Chiến dịch thu quỹ mới đã được tạo thành công.')
        setShowCreateCampaignModal(false)
        fetchData()
      } else {
        alert(json.error || 'Lỗi khi tạo chiến dịch')
      }
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Create Expense Request
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          ...expenseForm,
          creatorId: currentUser?.id || '23070691',
          creatorName: currentUser?.name || 'Giang Lê Hiệp',
          creatorRole: currentUser?.roleTitle || 'Phó chủ nhiệm',
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setActionMessage('Đề xuất chi quỹ đã được gửi để phê duyệt.')
        setShowExpenseModal(false)
        fetchData()
      } else {
        alert(json.error || 'Lỗi khi gửi đề xuất chi')
      }
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Approve Expense with segregation of duties check
  const handleApproveExpense = async (expense: ExpenseRequest) => {
    try {
      const approverId = currentUser?.id || '22073125'
      const approverName = currentUser?.name || 'Nguyễn Trịnh Minh Trang'

      if (expense.creatorId === approverId) {
        alert(
          'Vi phạm nguyên tắc phân tách nhiệm vụ (Segregation of Duties): Bạn là người tạo đề xuất này, không thể tự phê duyệt khoản chi của chính mình!'
        )
        return
      }

      const res = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          expenseId: expense.id,
          approverId,
          approverName,
          approverRole: 'Ban Chủ nhiệm',
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setActionMessage('Khoản chi đã được duyệt và ghi sổ cái bất biến.')
        fetchData()
      } else {
        alert(json.error || 'Lỗi khi duyệt khoản chi')
      }
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Verify Hash Chain
  const handleVerifyLedger = async () => {
    try {
      const res = await fetch('/api/finance/verify-ledger')
      const json = await res.json()
      setAuditResult(json)
      setShowAuditModal(true)
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Simulate SePay Webhook
  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/finance/simulate-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simulateForm),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setActionMessage(
          `Giả lập Webhook SePay thành công! Giao dịch SP-${json.simulatedSePayId} đã xác nhận.`
        )
        setShowSimulateModal(false)
        fetchData()
      } else {
        alert(json.error || 'Lỗi giả lập Webhook')
      }
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Filter ledger entries
  const filteredEntries = ledgerEntries.filter((entry) => {
    if (filterType === 'income' && entry.type !== 'INCOME') return false
    if (filterType === 'expense' && entry.type !== 'EXPENSE') return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const matchText = `${entry.id} ${entry.description} ${entry.memberName || ''} ${entry.memberCode || ''} ${entry.sepayTransactionId || ''}`.toLowerCase()
      if (!matchText.includes(term)) return false
    }
    return true
  })

  // Hash info of last entry for footer
  const lastEntry = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1] : null

  return (
    <div className="space-y-6 pb-12 font-sans antialiased text-slate-800">
      {/* Action Notification Toast */}
      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. TOP HEADER & WEATHER CARD                             */}
      {/* ======================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Title & Badges */}
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] text-[#078FE0] flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B55] tracking-tight">
                Sổ quỹ & Kiểm toán giao dịch
              </h1>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-[#078FE0] border border-sky-200">
                <Lock className="w-3 h-3" />
                <span>NỘI BỘ • Chỉ người có quyền</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                <Database className="w-3 h-3" />
                <span>DỮ LIỆU MÔ PHỎNG</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Quản lý thu – chi nội bộ, xác nhận SePay và lưu vết bất biến.
            </p>
          </div>
        </div>

        {/* Right Hanoi Weather Card (Mockup Match) */}
        <div className="flex-shrink-0 self-end lg:self-auto">
          <HanoiWeatherCard />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. HORIZONTAL TAB PILLS                                   */}
      {/* ======================================================== */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('fund')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all flex-shrink-0 ${
            activeTab === 'fund'
              ? 'bg-[#F97316] text-white shadow-md shadow-orange-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Quỹ CLB</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all flex-shrink-0 ${
            activeTab === 'events'
              ? 'bg-[#078FE0] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Thanh toán sự kiện</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all flex-shrink-0 ${
            activeTab === 'ledger'
              ? 'bg-[#078FE0] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Sổ cái giao dịch</span>
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all flex-shrink-0 ${
            activeTab === 'permissions'
              ? 'bg-[#078FE0] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Phân quyền</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all flex-shrink-0 ${
            activeTab === 'audit'
              ? 'bg-[#078FE0] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Kiểm toán</span>
        </button>

        {/* Action Triggers */}
        <div className="ml-auto flex items-center space-x-2 pl-2">
          <button
            onClick={() => setShowCreateCampaignModal(true)}
            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#078FE0] text-xs font-semibold flex items-center space-x-1.5 transition-all flex-shrink-0 border border-blue-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo chiến dịch</span>
          </button>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#F97316] text-xs font-semibold flex items-center space-x-1.5 transition-all flex-shrink-0 border border-orange-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Đề xuất chi</span>
          </button>
          <button
            onClick={() => setShowSimulateModal(true)}
            className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold flex items-center space-x-1.5 transition-all flex-shrink-0 border border-purple-200"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Giả lập SePay</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. 4 KPI STATS CARDS                                     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng thu */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tổng thu
            </span>
            <div className="text-2xl font-extrabold text-[#0B1B55]">
              {stats.totalIncome.toLocaleString('vi-VN')}đ
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-[#078FE0] flex items-center justify-center flex-shrink-0 shadow-inner">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Tổng chi */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tổng chi
            </span>
            <div className="text-2xl font-extrabold text-amber-600">
              {stats.totalExpense.toLocaleString('vi-VN')}đ
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-inner">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Số dư ghi sổ */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Số dư ghi sổ
            </span>
            <div className="text-2xl font-extrabold text-emerald-600">
              {stats.balance.toLocaleString('vi-VN')}đ
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Chờ đối soát */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Chờ đối soát
            </span>
            <div className="text-2xl font-extrabold text-purple-700">
              {stats.pendingReconciliationCount}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Hourglass className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. MAIN LAYOUT: LEDGER TABLE & SIDEBAR WIDGETS           */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Sổ cái bất biến (width 8 cols / ~68%) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            {/* Table Header Bar */}
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#078FE0] flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0B1B55]">
                    Sổ cái bất biến • Append-only Ledger
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mỗi giao dịch ghi nhận một lần – không sửa / không xóa.
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none"
                >
                  <option value="all">Tất cả (Thu & Chi)</option>
                  <option value="income">Chỉ ghi Thu</option>
                  <option value="expense">Chỉ ghi Chi</option>
                </select>

                <div className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-500 bg-slate-50 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>01/11/2026 – 30/11/2026</span>
                </div>

                <button
                  onClick={() => alert('Đã xuất báo cáo sổ quỹ định dạng Excel/PDF.')}
                  className="px-3 py-1.5 rounded-lg bg-[#078FE0] hover:bg-blue-600 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất báo cáo</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3 w-8">#</th>
                    <th className="py-3 px-3">Thời gian</th>
                    <th className="py-3 px-3">Mã thành viên</th>
                    <th className="py-3 px-3">Mã bút toán</th>
                    <th className="py-3 px-3">Phân loại</th>
                    <th className="py-3 px-3">Nội dung giao dịch</th>
                    <th className="py-3 px-3 text-right">Thu / Chi</th>
                    <th className="py-3 px-3">SePay ID</th>
                    <th className="py-3 px-3 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEntries.map((entry, idx) => {
                    const isIncome = entry.type === 'INCOME'
                    return (
                      <tr key={entry.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-3.5 px-3 font-mono font-medium text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                          {entry.timestamp}
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                          {entry.memberCode || 'TV-0**'}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-[#0B1B55] whitespace-nowrap">
                          {entry.id}
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                              isIncome
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {isIncome ? '↑ Thu' : '↓ Chi'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-medium text-slate-800 max-w-xs truncate">
                          {entry.description}
                        </td>
                        <td
                          className={`py-3.5 px-3 text-right font-extrabold whitespace-nowrap ${
                            isIncome ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isIncome ? '+' : '-'}
                          {entry.amount.toLocaleString('vi-VN')}đ
                        </td>
                        <td className="py-3.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                          {entry.sepayTransactionId || 'SP-****582'}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {entry.status === 'confirmed' && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100/70 text-emerald-700">
                              <Check className="w-3 h-3" />
                              <span>Xác nhận</span>
                            </span>
                          )}
                          {entry.status === 'approved' && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100/70 text-blue-700">
                              <Check className="w-3 h-3" />
                              <span>Đã duyệt</span>
                            </span>
                          )}
                          {entry.status === 'adjusted' && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-700">
                              <Check className="w-3 h-3" />
                              <span>Đã hạch toán</span>
                            </span>
                          )}
                          {entry.status === 'reconciled' && (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">
                              <Hourglass className="w-3 h-3" />
                              <span>Đối soát</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mockup Match Footer Bar: Hash & Immutable Principle */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
              <div className="flex items-center space-x-2 font-mono">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Bản ghi #{lastEntry?.entryNumber || 128} • SHA-256:{' '}
                  {lastEntry?.currentHash.slice(0, 10) || '7a9e'}...
                  {lastEntry?.currentHash.slice(-4) || '32f1'} • previous_hash:{' '}
                  {lastEntry?.previousHash.slice(0, 8) || '8d4c'}...
                </span>
                <button
                  onClick={handleVerifyLedger}
                  className="ml-2 text-[#078FE0] hover:underline font-bold"
                >
                  [Kiểm toán hash]
                </button>
              </div>

              <div className="text-slate-400 italic">
                (i) Sai sót được điều chỉnh bằng bút toán mới, tuyệt đối không ghi đè dữ liệu cũ.
              </div>
            </div>
          </div>

          {/* Active Campaigns List Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-[#0B1B55] flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-[#078FE0]" />
                <span>Chiến dịch thu quỹ đang mở</span>
              </h4>
              <span className="text-xs text-slate-400">
                {campaigns.filter((c) => c.status === 'active').length} chiến dịch hoạt động
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {campaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-blue-400 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#078FE0] bg-blue-100/60 px-2 py-0.5 rounded">
                        Mức thu: {camp.defaultAmount.toLocaleString('vi-VN')}đ
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        Đang mở
                      </span>
                    </div>
                    <h5 className="font-bold text-slate-900 text-sm mt-2">{camp.title}</h5>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{camp.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Chỉ tiêu: {camp.targetCount} thành viên</span>
                    <a
                      href={`/dong-quy/${camp.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-[#078FE0] hover:underline flex items-center space-x-1"
                    >
                      <span>Mở cổng đóng quỹ</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: WIDGETS (width 4 cols / ~32%) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Widget 1: Xác thực SePay (Exact Mockup Match) */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-[#078FE0]" />
                <h4 className="text-sm font-bold text-[#0B1B55]">Xác thực SePay</h4>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Giao dịch nhận một lần
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2.5 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Webhook từ SePay</span>
              </div>
              <div className="flex items-center space-x-2.5 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Xác thực chữ ký HMAC</span>
              </div>
              <div className="flex items-center space-x-2.5 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Kiểm tra mã giao dịch & số tiền</span>
              </div>
              <div className="flex items-center space-x-2.5 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Chống ghi trùng (idempotency)</span>
              </div>
              <div className="flex items-center space-x-2.5 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Lưu sổ quỹ (append-only)</span>
              </div>
            </div>
          </div>

          {/* Widget 2: Phân quyền truy cập (Exact Mockup Match) */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-100">
              <Shield className="w-4 h-4 text-[#078FE0]" />
              <h4 className="text-sm font-bold text-[#0B1B55]">Phân quyền truy cập</h4>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <div className="flex items-center space-x-2">
                  <span className="text-amber-500">👑</span>
                  <span className="font-semibold text-slate-800">Ban Chủ nhiệm</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-[#078FE0] font-bold text-[10px]">
                  Xem báo cáo
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-500">👥</span>
                  <span className="font-semibold text-slate-800">Trưởng / Phó ban Nhân sự</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-[#078FE0] font-bold text-[10px]">
                  Xem sổ quỹ
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <div className="flex items-center space-x-2">
                  <span className="text-purple-500">📋</span>
                  <span className="font-semibold text-slate-800">Nhân sự được ủy quyền</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[10px]">
                  Theo phạm vi
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400">👤</span>
                  <span className="font-semibold text-slate-800">Thành viên</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[10px]">
                  Chỉ xem khoản của mình
                </span>
              </div>
            </div>
          </div>

          {/* Pending Expenses & Approval Widget */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-[#0B1B55] flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-amber-600" />
                <span>Đề xuất chi chờ duyệt</span>
              </h4>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                {expenses.filter((e) => e.status === 'pending').length} chờ
              </span>
            </div>

            <div className="space-y-3">
              {expenses.filter((e) => e.status === 'pending').length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400">
                  Không có đề xuất chi nào đang chờ duyệt.
                </div>
              ) : (
                expenses
                  .filter((e) => e.status === 'pending')
                  .map((exp) => (
                    <div
                      key={exp.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{exp.reason}</span>
                        <span className="font-mono font-bold text-rose-600">
                          -{exp.amount.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Người tạo: {exp.creatorName} • Chi cho: {exp.recipient}
                      </div>
                      <div className="pt-1 flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleApproveExpense(exp)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center space-x-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Duyệt chi</span>
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: CREATE CAMPAIGN                                   */}
      {/* ======================================================== */}
      {showCreateCampaignModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-[#0B1B55] mb-4">Tạo chiến dịch thu quỹ mới</h3>
            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên chiến dịch</label>
                <input
                  type="text"
                  required
                  value={campaignForm.title}
                  onChange={(e) =>
                    setCampaignForm({ ...campaignForm, title: e.target.value })
                  }
                  placeholder="Quỹ sinh hoạt tháng 12/2026"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã URL (Slug)</label>
                <input
                  type="text"
                  required
                  value={campaignForm.slug}
                  onChange={(e) =>
                    setCampaignForm({ ...campaignForm, slug: e.target.value })
                  }
                  placeholder="quy-thang-12-2026"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mức thu (VNĐ)</label>
                <input
                  type="number"
                  required
                  value={campaignForm.defaultAmount}
                  onChange={(e) =>
                    setCampaignForm({
                      ...campaignForm,
                      defaultAmount: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả mục đích thu</label>
                <textarea
                  rows={3}
                  value={campaignForm.description}
                  onChange={(e) =>
                    setCampaignForm({ ...campaignForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  placeholder="Chi phí duy trì hoạt động CLB..."
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCampaignModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#078FE0] hover:bg-blue-600 text-white font-bold"
                >
                  Tạo chiến dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE EXPENSE REQUEST                            */}
      {/* ======================================================== */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-[#0B1B55] mb-2">Đề xuất chi quỹ CLB</h3>
            <p className="text-xs text-slate-500 mb-4">
              Khoản chi sau khi được phê duyệt sẽ tự động ghi một bút toán EXPENSE vào Sổ cái bất biến.
            </p>
            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Lý do chi</label>
                <input
                  type="text"
                  required
                  value={expenseForm.reason}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, reason: e.target.value })
                  }
                  placeholder="In ấn backdrop và thẻ đeo thành viên"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số tiền (VNĐ)</label>
                <input
                  type="number"
                  required
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Người nhận tiền / Nhà cung cấp</label>
                <input
                  type="text"
                  required
                  value={expenseForm.recipient}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, recipient: e.target.value })
                  }
                  placeholder="Công ty In Nhanh Hà Nội"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold"
                >
                  Gửi đề xuất
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VERIFY HASH CHAIN AUDIT                           */}
      {/* ======================================================== */}
      {showAuditModal && auditResult && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0B1B55]">
                  Báo cáo kiểm toán Sổ cái mật mã
                </h3>
                <p className="text-xs text-slate-500">
                  Thuật toán SHA-256 Hash Chaining liên kết khối giao dịch
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái toàn vẹn:</span>
                <span className="font-bold text-emerald-600">
                  {auditResult.valid ? '✓ HỢP LỆ (Không bị can thiệp)' : '✗ KHÔNG HỢP LỆ'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tổng số bút toán:</span>
                <span className="font-bold text-slate-800">{auditResult.totalEntries}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-slate-500">First Hash (Genesis):</span>
                <span className="font-mono text-[11px] text-slate-700 break-all bg-white p-1 rounded border">
                  {auditResult.firstHash}
                </span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-slate-500">Latest Hash (Head):</span>
                <span className="font-mono text-[11px] text-slate-700 break-all bg-white p-1 rounded border">
                  {auditResult.lastHash}
                </span>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 rounded-xl bg-[#0B1B55] text-white font-bold text-xs"
              >
                Đóng báo cáo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SIMULATE SEPAY WEBHOOK                            */}
      {/* ======================================================== */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-[#0B1B55] mb-2">Giả lập Webhook SePay</h3>
            <p className="text-xs text-slate-500 mb-4">
              Công cụ thử nghiệm: Phát sinh một gói tin Webhook HMAC-SHA256 chuẩn để kiểm thử quy trình xác nhận tự động.
            </p>
            <form onSubmit={handleSimulateWebhook} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã thanh toán (Payment Code)</label>
                <input
                  type="text"
                  required
                  value={simulateForm.paymentCode}
                  onChange={(e) =>
                    setSimulateForm({ ...simulateForm, paymentCode: e.target.value })
                  }
                  placeholder="ISSAC8F3K9P2A"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số tiền chuyển (VNĐ)</label>
                <input
                  type="number"
                  required
                  value={simulateForm.amount}
                  onChange={(e) =>
                    setSimulateForm({ ...simulateForm, amount: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nội dung SMS/Chuyển khoản</label>
                <input
                  type="text"
                  value={simulateForm.content}
                  onChange={(e) =>
                    setSimulateForm({ ...simulateForm, content: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  Phát Webhook thử nghiệm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
