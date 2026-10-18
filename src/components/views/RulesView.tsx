'use client'

import React, { useState, useMemo } from 'react'
import { useClub, type CustomRuleItem } from '@/lib/context/ClubContext'
import { CRITERIA_RULES } from '@/lib/scoring/constants'
import {
  BookOpen,
  PlusCircle,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Search,
  Filter,
  Crown,
  Award,
  Info,
  X,
  Layers,
  Check,
  Calendar,
  Zap,
  Scale,
  BadgePlus,
  BarChart3,
  Activity,
  Shield,
  Plus,
} from 'lucide-react'

interface SystemPrinciple {
  code: string
  title: string
  points: string
  condition: string
  category: string
}

const BUILTIN_PRINCIPLES: SystemPrinciple[] = [
  {
    code: 'P01',
    title: 'Điểm khởi đầu',
    points: '60',
    condition: 'Mỗi thành viên bắt đầu với 60 điểm chuẩn khi bắt đầu mỗi nhiệm kỳ hoặc chu kỳ thi đua.',
    category: 'Nguyên tắc nền tảng',
  },
  {
    code: 'P02',
    title: 'Giới hạn thang điểm',
    points: '0 - 100',
    condition: 'Thang điểm tuyệt đối 0 - 100. Sau mọi đợt tính toán, điểm được clamp cứng trong khoảng này.',
    category: 'Nguyên tắc nền tảng',
  },
  {
    code: 'P03',
    title: 'Chế tài Core Team (×2)',
    points: '×2 phạt',
    condition: '11 nhân sự nòng cốt (BCN & Trưởng/Phó ban) bị phạt gấp đôi đối với các lỗi vi phạm kỷ luật. Điểm cộng giữ nguyên.',
    category: 'Chế tài trách nhiệm',
  },
  {
    code: 'P04',
    title: 'Điểm tương tác tối đa',
    points: '15 đ/tháng',
    condition: 'Tổng điểm C01, C02, C03 tối đa 15 điểm/tháng/người. Tự động bảo vệ chống cày điểm ảo.',
    category: 'Kiểm soát hạn mức',
  },
  {
    code: 'P05',
    title: 'Hạn tương tác & phản hồi',
    points: '12h',
    condition: 'Thời hạn phản hồi thông báo quan trọng và hoàn thành tương tác theo phát động chỉ áp dụng trong 12h.',
    category: 'Kỷ luật truyền thông',
  },
  {
    code: 'P06',
    title: 'Quy tắc thay thế & không dồn',
    points: 'Không dồn',
    condition: 'C02 đã gồm C01; T02 thay thế T01; T08 thay thế T07; T09 thay thế T07/T08. Tránh phạt hoặc cộng trùng lặp.',
    category: 'Công bằng tính điểm',
  },
  {
    code: 'P07',
    title: 'Nghiệm thu 4 chuẩn đầu việc',
    points: '4 Tiêu chuẩn',
    condition: 'Đầu việc nghiệm thu: đúng yêu cầu, thông tin chính xác, hoàn chỉnh, không làm lại.',
    category: 'Nghiệm thu nhiệm vụ',
  },
  {
    code: 'P08',
    title: 'Bảo mật PII thành viên',
    points: 'Bảo mật 100%',
    condition: 'Bảng xếp hạng công khai bảo vệ PII: không chứa Email, SĐT, MSSV hay lịch sử xử phạt nhạy cảm.',
    category: 'Quyền riêng tư',
  },
  {
    code: 'P09',
    title: 'Vắng họp có lý do hợp lệ',
    points: '-2 đ',
    condition: 'Báo trước tối thiểu 2 giờ ra nhóm riêng ban và được BCN / Trưởng ban xác nhận lý do chính đáng.',
    category: 'Kỷ luật sinh hoạt',
  },
  {
    code: 'P10',
    title: 'Chế tài vắng họp T02 (3 lần)',
    points: 'Dừng tư cách',
    condition: 'Vắng họp không phép tích lũy 3 lần sẽ kích hoạt quy trình xem xét dừng tư cách thành viên CLB.',
    category: 'Kỷ luật nghiêm khắc',
  },
]

export function RulesView() {
  const { customRules, addCustomRule, deleteCustomRule } = useClub()

  const [activeTab, setActiveTab] = useState<'principles' | 'add' | 'deduct' | 'all'>('principles')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Form state cho modal thêm quy định
  const [formType, setFormType] = useState<'add' | 'deduct' | 'principle'>('add')
  const [formCode, setFormCode] = useState('')
  const [formName, setFormName] = useState('')
  const [formPoints, setFormPoints] = useState<number>(2)
  const [formCategory, setFormCategory] = useState('Nhiệm vụ & Tiến độ')
  const [formCondition, setFormCondition] = useState('')
  const [formCoreMultiplier, setFormCoreMultiplier] = useState(false)
  const [formMonthlyCap, setFormMonthlyCap] = useState(false)

  // Tự động gợi ý mã kế tiếp khi đổi formType
  const suggestNextCode = (type: 'add' | 'deduct' | 'principle') => {
    if (type === 'add') {
      const allCodes = [
        ...Object.keys(CRITERIA_RULES).filter((c) => c.startsWith('C')),
        ...customRules.filter((r) => r.type === 'add').map((r) => r.code),
      ]
      const numbers = allCodes
        .map((c) => parseInt(c.replace(/\D/g, ''), 10))
        .filter((n) => !isNaN(n))
      const maxNum = numbers.length > 0 ? Math.max(...numbers) : 9
      return `C${String(maxNum + 1).padStart(2, '0')}`
    } else if (type === 'deduct') {
      const allCodes = [
        ...Object.keys(CRITERIA_RULES).filter((c) => c.startsWith('T')),
        ...customRules.filter((r) => r.type === 'deduct').map((r) => r.code),
      ]
      const numbers = allCodes
        .map((c) => parseInt(c.replace(/\D/g, ''), 10))
        .filter((n) => !isNaN(n))
      const maxNum = numbers.length > 0 ? Math.max(...numbers) : 13
      return `T${String(maxNum + 1).padStart(2, '0')}`
    } else {
      const allCodes = [
        ...BUILTIN_PRINCIPLES.map((p) => p.code),
        ...customRules.filter((r) => r.type === 'principle').map((r) => r.code),
      ]
      const numbers = allCodes
        .map((c) => parseInt(c.replace(/\D/g, ''), 10))
        .filter((n) => !isNaN(n))
      const maxNum = numbers.length > 0 ? Math.max(...numbers) : 10
      return `P${String(maxNum + 1).padStart(2, '0')}`
    }
  }

  const handleOpenAddModal = (type: 'add' | 'deduct' | 'principle' = 'add') => {
    setFormType(type)
    setFormCode(suggestNextCode(type))
    setFormName('')
    setFormPoints(type === 'deduct' ? -2 : type === 'add' ? 2 : 0)
    setFormCategory(
      type === 'add'
        ? 'Nhiệm vụ & Tiến độ'
        : type === 'deduct'
        ? 'Kỷ luật & Deadline'
        : 'Nguyên tắc vận hành'
    )
    setFormCondition('')
    setFormCoreMultiplier(type === 'deduct')
    setFormMonthlyCap(false)
    setIsAddModalOpen(true)
  }

  const handleTypeChange = (type: 'add' | 'deduct' | 'principle') => {
    setFormType(type)
    setFormCode(suggestNextCode(type))
    if (type === 'deduct') {
      setFormPoints(-2)
      setFormCoreMultiplier(true)
      setFormMonthlyCap(false)
      setFormCategory('Kỷ luật & Deadline')
    } else if (type === 'add') {
      setFormPoints(2)
      setFormCoreMultiplier(false)
      setFormCategory('Nhiệm vụ & Tiến độ')
    } else {
      setFormPoints(0)
      setFormCoreMultiplier(false)
      setFormMonthlyCap(false)
      setFormCategory('Nguyên tắc vận hành')
    }
  }

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formCode.trim()) {
      alert('Vui lòng nhập mã quy định!')
      return
    }
    if (!formName.trim()) {
      alert('Vui lòng nhập tên nội dung quy định!')
      return
    }

    let pts: number | string = formPoints
    if (formType === 'deduct') {
      pts = -Math.abs(Number(formPoints) || 2)
    } else if (formType === 'add') {
      pts = Math.abs(Number(formPoints) || 2)
    }

    const res = addCustomRule({
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      description: formCondition.trim() || formName.trim(),
      type: formType,
      points: formType === 'principle' ? String(formPoints) : pts,
      category: formCategory,
      condition: formCondition.trim(),
      coreMultiplierApplies: formCoreMultiplier,
      monthlyCapGroup: formMonthlyCap ? 'interaction' : null,
    })

    if (res.success) {
      setFeedback({ type: 'success', message: res.message })
      setIsAddModalOpen(false)
      setTimeout(() => setFeedback(null), 3500)
    } else {
      alert(res.message)
    }
  }

  const handleDeleteRule = (code: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa quy định "${code}" khỏi hệ thống CLB không?`)) {
      const res = deleteCustomRule(code)
      if (res.success) {
        setFeedback({ type: 'success', message: res.message })
        setTimeout(() => setFeedback(null), 3000)
      } else {
        alert(res.message)
      }
    }
  }

  // Danh sách hợp nhất
  const builtinAddList = useMemo(() => {
    return Object.values(CRITERIA_RULES)
      .filter((c) => c.type === 'add')
      .map((c) => ({
        code: c.code,
        name: c.name,
        type: 'add' as const,
        points: `+${c.base_points}`,
        numericPoints: c.base_points,
        category: c.monthly_cap_group ? 'Tương tác & Mạng xã hội' : 'Nhiệm vụ & Cống hiến',
        condition: c.description,
        isCustom: false,
        monthlyCap: !!c.monthly_cap_group,
        coreMultiplier: false,
      }))
  }, [])

  const builtinDeductList = useMemo(() => {
    return Object.values(CRITERIA_RULES)
      .filter((c) => c.type === 'deduct')
      .map((c) => ({
        code: c.code,
        name: c.name,
        type: 'deduct' as const,
        points: `${c.base_points}`,
        numericPoints: c.base_points,
        category: c.code.startsWith('T01') || c.code.startsWith('T02') || c.code.startsWith('T03')
          ? 'Họp & Kỷ luật'
          : c.code.startsWith('T07') || c.code.startsWith('T08') || c.code.startsWith('T09')
          ? 'Nhiệm vụ & Deadline'
          : 'Tương tác & Thái độ',
        condition: c.description,
        isCustom: false,
        monthlyCap: false,
        coreMultiplier: c.core_multiplier_applies,
      }))
  }, [])

  const builtinPrincipleList = useMemo(() => {
    return BUILTIN_PRINCIPLES.map((p) => ({
      code: p.code,
      name: p.title,
      type: 'principle' as const,
      points: p.points,
      numericPoints: 0,
      category: p.category,
      condition: p.condition,
      isCustom: false,
      monthlyCap: false,
      coreMultiplier: false,
    }))
  }, [])

  // Custom list
  const customListFormatted = useMemo(() => {
    return customRules.map((r) => ({
      code: r.code,
      name: r.name,
      type: r.type,
      points:
        r.type === 'add'
          ? `+${r.points}`
          : r.type === 'deduct'
          ? `${r.points}`
          : String(r.points),
      numericPoints:
        typeof r.points === 'number'
          ? r.points
          : parseInt(String(r.points), 10) || 0,
      category: r.category || 'Quy định bổ sung',
      condition: r.condition || r.description,
      isCustom: true,
      monthlyCap: !!r.monthlyCapGroup,
      coreMultiplier: !!r.coreMultiplierApplies,
    }))
  }, [customRules])

  // Lọc dữ liệu theo tab, search và danh mục
  const allRulesList = useMemo(() => {
    return [...builtinPrincipleList, ...builtinAddList, ...builtinDeductList, ...customListFormatted]
  }, [builtinPrincipleList, builtinAddList, builtinDeductList, customListFormatted])

  const filteredRules = useMemo(() => {
    let list = allRulesList

    if (activeTab === 'principles') {
      list = list.filter((r) => r.type === 'principle')
    } else if (activeTab === 'add') {
      list = list.filter((r) => r.type === 'add')
    } else if (activeTab === 'deduct') {
      list = list.filter((r) => r.type === 'deduct')
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (r) =>
          r.code.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          (r.condition || '').toLowerCase().includes(q) ||
          (r.category || '').toLowerCase().includes(q)
      )
    }

    if (selectedCategory !== 'all') {
      if (selectedCategory === 'custom_only') {
        list = list.filter((r) => r.isCustom)
      } else {
        list = list.filter((r) => r.category.toLowerCase().includes(selectedCategory.toLowerCase()))
      }
    }

    return list
  }, [allRulesList, activeTab, searchQuery, selectedCategory])

  // Thống kê nhanh số lượng
  const countPrinciples = allRulesList.filter((r) => r.type === 'principle').length
  const countAdd = allRulesList.filter((r) => r.type === 'add').length
  const countDeduct = allRulesList.filter((r) => r.type === 'deduct').length
  const countCustom = customRules.length

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header trang đồng bộ, chuyên nghiệp & tinh tế */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
            Bảng Quy Định & Tiêu Chí Chấm Điểm
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium">
            Hệ thống quy chuẩn hóa hoạt động thi đua và rèn luyện. Áp dụng minh bạch cho toàn bộ 48 thành viên CLB.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0 self-start md:self-center">
          <button
            onClick={() => handleOpenAddModal('add')}
            className="px-3.5 py-2 rounded-xl bg-emerald-50/90 hover:bg-emerald-100/90 text-emerald-800 border border-emerald-200 font-bold text-xs sm:text-[13px] transition shadow-2xs hover:shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Thêm Điểm Cộng</span>
          </button>
          <button
            onClick={() => handleOpenAddModal('deduct')}
            className="px-3.5 py-2 rounded-xl bg-rose-50/90 hover:bg-rose-100/90 text-rose-800 border border-rose-200 font-bold text-xs sm:text-[13px] transition shadow-2xs hover:shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Thêm Điểm Trừ</span>
          </button>
          <button
            onClick={() => handleOpenAddModal('principle')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0F3282] via-[#1351D8] to-[#1E62F4] hover:from-[#0B2562] hover:to-[#1351D8] text-white font-bold text-xs sm:text-[13px] transition shadow-xs hover:shadow flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5] flex-shrink-0" />
            <span>Thêm Quy Định Mới</span>
          </button>
        </div>
      </div>

      {/* 4 Khối tóm tắt: Chuẩn viền mỏng 1px sang trọng & Tương tác 1 chạm */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Nguyên tắc cốt lõi */}
        <div
          onClick={() => setActiveTab('principles')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            activeTab === 'principles'
              ? 'border-blue-300 ring-2 ring-[#1351D8]/20 bg-blue-50/40 shadow-xs scale-[1.01]'
              : 'border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-xs'
          }`}
        >
          <div>
            <span className="text-xs font-semibold text-slate-600 block">
              Nguyên tắc cốt lõi
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#1351D8] mt-1 block">
              {countPrinciples}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1351D8] shadow-2xs border border-blue-200/60 flex items-center justify-center flex-shrink-0">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Tiêu chí Điểm cộng */}
        <div
          onClick={() => setActiveTab('add')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            activeTab === 'add'
              ? 'border-emerald-300 ring-2 ring-emerald-500/20 bg-emerald-50/40 shadow-xs scale-[1.01]'
              : 'border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-xs'
          }`}
        >
          <div>
            <span className="text-xs font-semibold text-slate-600 block">
              Tiêu chí Điểm cộng
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#059669] mt-1 block">
              {countAdd}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#059669] shadow-2xs border border-emerald-200/60 flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Tiêu chí Điểm trừ */}
        <div
          onClick={() => setActiveTab('deduct')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            activeTab === 'deduct'
              ? 'border-rose-300 ring-2 ring-rose-500/20 bg-rose-50/40 shadow-xs scale-[1.01]'
              : 'border-slate-200/90 bg-white hover:border-rose-300 hover:shadow-xs'
          }`}
        >
          <div>
            <span className="text-xs font-semibold text-slate-600 block">
              Tiêu chí Điểm trừ
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#DC2626] mt-1 block">
              {countDeduct}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#DC2626] shadow-2xs border border-rose-200/60 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Điểm tương tác tối đa */}
        <div
          onClick={() => setSelectedCategory(selectedCategory === 'tương tác' ? 'all' : 'tương tác')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            selectedCategory === 'tương tác'
              ? 'border-amber-300 ring-2 ring-amber-500/20 bg-amber-50/40 shadow-xs scale-[1.01]'
              : 'border-slate-200/90 bg-white hover:border-amber-300 hover:shadow-xs'
          }`}
        >
          <div>
            <span className="text-xs font-semibold text-slate-600 block">
              Điểm tương tác tối đa
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#D97706] mt-1 block">
              15
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D97706] shadow-2xs border border-amber-200/60 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Thanh điều khiển: Subtabs + Tìm kiếm & Bộ lọc (gọn gàng, cân đối, không rớt dòng) */}
      <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Subtabs kiểu Segmented Control 1 hàng ngang duy nhất */}
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/70 overflow-x-auto max-w-full">
            {[
              { id: 'principles' as const, label: 'Nguyên tắc cốt lõi', count: countPrinciples, icon: Scale, activeColor: 'bg-[#1351D8] text-white shadow-xs' },
              { id: 'add' as const, label: 'Tiêu chí điểm cộng', count: countAdd, icon: Award, activeColor: 'bg-emerald-600 text-white shadow-xs' },
              { id: 'deduct' as const, label: 'Tiêu chí điểm trừ', count: countDeduct, icon: ShieldAlert, activeColor: 'bg-rose-600 text-white shadow-xs' },
              { id: 'all' as const, label: 'Tất cả quy định', count: allRulesList.length, icon: Layers, activeColor: 'bg-[#0B1E48] text-white shadow-xs' },
            ].map((tab) => {
              const TabIcon = tab.icon
              const isSelected = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 ${
                    isSelected
                      ? `${tab.activeColor}`
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[11px] font-extrabold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/90 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Quick Counter - luôn trên 1 dòng */}
          <div className="text-xs text-slate-500 font-medium whitespace-nowrap flex items-center gap-1 self-end sm:self-auto px-1">
            <span>Hiển thị:</span>
            <strong className="text-slate-900 font-bold">{filteredRules.length}</strong>
            <span>/ {allRulesList.length} quy chuẩn</span>
          </div>
        </div>

        {/* Thanh tìm kiếm & chip lọc danh mục */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã (C01, T02...), tên, điều kiện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 sm:py-2 bg-slate-50 hover:bg-slate-50/80 border border-slate-200/90 rounded-lg text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1351D8] focus:ring-1 focus:ring-[#1351D8]/20 transition shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Chip filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0 text-xs">
            <span className="text-slate-500 font-bold text-[11px] whitespace-nowrap flex items-center gap-1 pr-1">
              <Filter className="w-3 h-3 text-slate-400" /> Lọc:
            </span>
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'tương tác', label: 'Tương tác' },
              { id: 'nhiệm vụ', label: 'Nhiệm vụ' },
              { id: 'họp', label: 'Kỷ luật họp' },
              { id: 'custom_only', label: `CLB bổ sung (${countCustom})`, icon: BadgePlus },
            ].map((chip) => {
              const isSelected = selectedCategory === chip.id
              const ChipIcon = (chip as any).icon
              return (
                <button
                  key={chip.id}
                  onClick={() => setSelectedCategory(chip.id)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all inline-flex items-center gap-1 ${
                    isSelected
                      ? 'bg-slate-900 text-white font-bold shadow-2xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-medium'
                  }`}
                >
                  {ChipIcon && (
                    <ChipIcon className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  )}
                  <span>{chip.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bảng dữ liệu quy định: Tiêu đề Navy sang trọng & Đường viền mỏng thanh thoát */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700 border-collapse">
            {/* Header bảng màu xanh Navy CLB sang trọng, chữ trắng nổi bật */}
            <thead className="bg-[#0B1E48] text-xs font-bold text-white uppercase tracking-wider border-b border-[#071533] select-none">
              <tr className="divide-x divide-white/10">
                <th className="py-3 px-3 w-[72px] text-center font-bold text-blue-100 whitespace-nowrap">Mã</th>
                <th className="py-3 px-4 min-w-[220px] font-bold text-white whitespace-nowrap">Nội dung & Danh mục</th>
                <th className="py-3 px-3 text-center w-[160px] min-w-[150px] font-bold whitespace-nowrap">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-white">Điểm Thành Viên</span>
                    <span className="text-[10px] font-normal text-blue-200/90 tracking-normal lowercase">
                      tiêu chuẩn
                    </span>
                  </div>
                </th>
                {/* Cột Điểm Core Team: Hài hòa trên nền Navy với sắc vàng hổ phách trang nhã */}
                <th className="py-3 px-3 text-center w-[200px] min-w-[190px] font-bold whitespace-nowrap bg-[#122A5E] text-amber-300 border-x border-amber-400/30">
                  <div className="flex flex-col items-center justify-center whitespace-nowrap">
                    <div className="inline-flex items-center justify-center gap-1.5 font-bold text-amber-300 whitespace-nowrap">
                      <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className="whitespace-nowrap tracking-wide">Điểm Core Team</span>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-200/80 tracking-normal whitespace-nowrap mt-0.5">
                      Thành viên Core Team ×2
                    </span>
                  </div>
                </th>
                <th className="py-3 px-4 min-w-[280px] font-bold text-white whitespace-nowrap">Điều kiện áp dụng & Chi tiết</th>
                <th className="py-3 px-3 text-center w-[125px] font-bold text-blue-100 whitespace-nowrap">Nguồn gốc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="space-y-2">
                      <Search className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-semibold text-xs sm:text-sm">Không tìm thấy quy định phù hợp với bộ lọc</p>
                      <button
                        onClick={() => {
                          setSearchQuery('')
                          setSelectedCategory('all')
                        }}
                        className="text-xs sm:text-sm text-[#1351D8] font-semibold hover:underline"
                      >
                        Xóa bộ lọc tìm kiếm
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRules.map((item) => {
                  const isAdd = item.type === 'add'
                  const isDeduct = item.type === 'deduct'
                  const isPrinciple = item.type === 'principle'

                  // Render phần hiển thị điểm riêng biệt cho Core Team với viền mỏng thanh lịch
                  let coreTeamElement: React.ReactNode = null
                  if (item.coreMultiplier) {
                    const rawPts = item.numericPoints || 0
                    const corePts = rawPts < 0 ? rawPts * 2 : -Math.abs(rawPts) * 2
                    coreTeamElement = (
                      <div className="flex flex-col items-center justify-center gap-1 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap shadow-2xs">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                          <span>{corePts}</span>
                        </span>
                        <span className="inline-block text-[10px] font-semibold text-rose-800 bg-rose-100/70 border border-rose-200/60 px-1.5 py-0.5 rounded whitespace-nowrap">
                          Core phạt ×2
                        </span>
                      </div>
                    )
                  } else if (item.code === 'P03') {
                    coreTeamElement = (
                      <div className="flex flex-col items-center justify-center gap-1 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs bg-amber-50 text-amber-900 border border-amber-200 whitespace-nowrap shadow-2xs">
                          <Crown className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                          <span>Phạt ×2</span>
                        </span>
                        <span className="inline-block text-[10px] font-semibold text-amber-800 bg-amber-100/70 border border-amber-200/60 px-1.5 py-0.5 rounded whitespace-nowrap">
                          11 nhân sự BCN
                        </span>
                      </div>
                    )
                  } else if (isAdd) {
                    coreTeamElement = (
                      <div className="flex flex-col items-center justify-center gap-1 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-lg font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap shadow-2xs">
                          {item.points}
                        </span>
                        <span className="inline-block text-[10px] font-semibold text-emerald-800 bg-emerald-50/80 border border-emerald-200/60 px-1.5 py-0.5 rounded whitespace-nowrap">
                          Đồng mức
                        </span>
                      </div>
                    )
                  } else if (isDeduct) {
                    coreTeamElement = (
                      <div className="flex flex-col items-center justify-center gap-1 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-lg font-bold text-xs bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap shadow-2xs">
                          {item.points}
                        </span>
                        <span className="inline-block text-[10px] font-semibold text-rose-800 bg-rose-50/80 border border-rose-200/60 px-1.5 py-0.5 rounded whitespace-nowrap">
                          Đồng mức
                        </span>
                      </div>
                    )
                  } else {
                    coreTeamElement = (
                      <div className="flex flex-col items-center justify-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50/70 border border-blue-200 whitespace-nowrap shadow-2xs">
                          <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          <span>Áp dụng chung</span>
                        </span>
                      </div>
                    )
                  }

                  return (
                    <tr
                      key={item.code}
                      className="hover:bg-slate-50/70 transition-colors group divide-x divide-slate-100"
                    >
                      {/* 1. Mã quy chế có viền mỏng thanh thoát */}
                      <td className="py-3 px-2.5 text-center align-middle">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-mono font-bold shadow-2xs ${
                            isPrinciple
                              ? 'bg-blue-50 text-[#1351D8] border border-blue-200'
                              : isAdd
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {item.code}
                        </span>
                      </td>

                      {/* 2. Nội dung & Danh mục */}
                      <td className="py-3 px-4 align-middle space-y-1">
                        <div className="font-bold text-slate-900 text-[13px] sm:text-[13.5px] flex items-center gap-1.5 leading-snug">
                          <span>{item.name}</span>
                          {item.isCustom && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap shadow-2xs">
                              CLB Thêm
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                              isPrinciple
                                ? 'bg-blue-50/80 text-blue-800 border border-blue-200/60'
                                : isAdd
                                ? 'bg-emerald-50/80 text-emerald-800 border border-emerald-200/60'
                                : 'bg-rose-50/80 text-rose-800 border border-rose-200/60'
                            }`}
                          >
                            {item.category}
                          </span>
                        </div>
                      </td>

                      {/* 3. Mức Điểm Thành Viên: Viền mỏng 1px */}
                      <td className="py-3 px-3 text-center align-middle">
                        <div className="flex flex-col items-center justify-center gap-0.5 whitespace-nowrap">
                          {isAdd && (
                            <span className="inline-block px-2.5 py-1 rounded-lg font-bold text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 whitespace-nowrap shadow-2xs">
                              {item.points}
                            </span>
                          )}
                          {isDeduct && (
                            <span className="inline-block px-2.5 py-1 rounded-lg font-bold text-xs text-rose-800 bg-rose-50 border border-rose-200 whitespace-nowrap shadow-2xs">
                              {item.points}
                            </span>
                          )}
                          {isPrinciple && (
                            <span className="inline-block px-2.5 py-1 rounded-lg font-bold text-xs text-[#1351D8] bg-blue-50 border border-blue-200 whitespace-nowrap shadow-2xs">
                              {item.points}
                            </span>
                          )}
                          {item.monthlyCap && (
                            <span className="inline-flex items-center justify-center text-[10px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-center leading-tight whitespace-nowrap mt-1 shadow-2xs">
                              Tối đa 15đ/tháng
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-medium mt-0.5 whitespace-nowrap ${
                              isPrinciple ? 'text-blue-600' : isAdd ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isPrinciple ? 'Chuẩn quy chế' : 'Tiêu chuẩn'}
                          </span>
                        </div>
                      </td>

                      {/* 4. Mức Điểm Core Team: Viền mỏng hổ phách */}
                      <td className="py-3 px-3 text-center align-middle bg-amber-50/20 border-x border-amber-200/40 group-hover:bg-amber-50/35 transition-colors">
                        {coreTeamElement}
                      </td>

                      {/* 5. Điều kiện áp dụng & Chi tiết */}
                      <td className="py-3 px-4 align-middle">
                        <p className="text-[12.5px] sm:text-[13px] text-slate-600 leading-relaxed text-justify [text-align:justify] [text-justify:inter-word]">{item.condition}</p>
                        {item.code === 'T02' && (
                          <div className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-rose-900 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 shadow-2xs">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                            <span>Cảnh báo: Tích lũy 3 lần vắng họp xem xét dừng tư cách thành viên</span>
                          </div>
                        )}
                        {item.code === 'P03' && (
                          <div className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs">
                            <Crown className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                            <span>Áp dụng cho 11 nhân sự Core Team (BCN & Trưởng/Phó ban)</span>
                          </div>
                        )}
                      </td>

                      {/* 6. Nguồn gốc & Thao tác */}
                      <td className="py-3 px-2.5 text-center align-middle">
                        {item.isCustom ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 whitespace-nowrap shadow-2xs">
                              <BadgePlus className="w-3.5 h-3.5 text-amber-600" /> CLB bổ sung
                            </span>
                            <div>
                              <button
                                onClick={() => handleDeleteRule(item.code)}
                                title="Xóa quy định này"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-700 hover:underline pt-0.5"
                              >
                                <Trash2 className="w-3 h-3" /> Xóa
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 whitespace-nowrap shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#1351D8]" />
                            <span>Quy chế chuẩn</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Thêm quy định / tiêu chí mới */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1E48]/55 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full border border-slate-200/90 shadow-2xl relative space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xs flex-shrink-0 transition-colors ${
                    formType === 'add'
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-700'
                      : formType === 'deduct'
                      ? 'bg-gradient-to-br from-rose-500 to-red-700'
                      : 'bg-gradient-to-br from-[#0B1E48] via-[#1351D8] to-[#1E62F4]'
                  }`}
                >
                  {formType === 'add' ? (
                    <Award className="w-5 h-5 text-white stroke-[2.2]" />
                  ) : formType === 'deduct' ? (
                    <ShieldAlert className="w-5 h-5 text-white stroke-[2.2]" />
                  ) : (
                    <Scale className="w-5 h-5 text-white stroke-[2.2]" />
                  )}
                </div>
                <div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-blue-50 text-[#1351D8] border border-blue-200/60 mb-1">
                    <Shield className="w-3 h-3 text-[#1351D8]" />
                    <span>Quy Chế Hoạt Động CLB</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-[#0F172A] tracking-tight">
                    Thêm Quy Định / Tiêu Chí CLB
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Bổ sung tiêu chí chấm điểm và chế tài thi đua cho Câu Lạc bộ Đại sứ sinh viên Trường Quốc tế
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex items-center justify-center cursor-pointer flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
              {/* 1. Chọn loại quy định: 3 Thẻ tương tác sang trọng */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">Loại quy định & tiêu chí:</label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('add')}
                    className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1.5 cursor-pointer ${
                      formType === 'add'
                        ? 'border-emerald-300 bg-emerald-50/80 text-emerald-900 shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-slate-200/90 bg-slate-50/70 text-slate-600 hover:bg-white hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs shadow-2xs">
                      <Award className="w-4 h-4 text-emerald-700" />
                    </div>
                    <span className="font-bold">Điểm cộng (+)</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                      +2đ chuẩn
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange('deduct')}
                    className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1.5 cursor-pointer ${
                      formType === 'deduct'
                        ? 'border-rose-300 bg-rose-50/80 text-rose-900 shadow-xs ring-2 ring-rose-500/20'
                        : 'border-slate-200/90 bg-slate-50/70 text-slate-600 hover:bg-white hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-black text-xs shadow-2xs">
                      <ShieldAlert className="w-4 h-4 text-rose-700" />
                    </div>
                    <span className="font-bold">Điểm trừ (-)</span>
                    <span className="text-[10px] font-semibold text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded">
                      -2đ (Core ×2)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange('principle')}
                    className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1.5 cursor-pointer ${
                      formType === 'principle'
                        ? 'border-blue-300 bg-blue-50/80 text-[#1351D8] shadow-xs ring-2 ring-blue-500/20'
                        : 'border-slate-200/90 bg-slate-50/70 text-slate-600 hover:bg-white hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-[#1351D8] flex items-center justify-center font-black text-xs shadow-2xs">
                      <Scale className="w-4 h-4 text-[#1351D8]" />
                    </div>
                    <span className="font-bold">Nguyên tắc (P)</span>
                    <span className="text-[10px] font-semibold text-[#1351D8] bg-blue-100/70 px-1.5 py-0.5 rounded">
                      Quy chuẩn
                    </span>
                  </button>
                </div>
              </div>

              {/* 2. Mã quy định & Mức điểm */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mã quy chế: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="VD: C10, T14, P11"
                    className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-[#1351D8] focus:outline-none focus:border-[#1351D8] focus:ring-2 focus:ring-[#1351D8]/10 transition shadow-2xs"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">Tự động gợi ý mã kế tiếp</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mức điểm: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formPoints}
                    onChange={(e) => setFormPoints(Number(e.target.value))}
                    step="1"
                    className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#0F172A] focus:outline-none focus:border-[#1351D8] focus:ring-2 focus:ring-[#1351D8]/10 transition shadow-2xs"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">
                    {formType === 'add'
                      ? 'Điểm cộng (dương, VD: +2, +3)'
                      : formType === 'deduct'
                      ? 'Điểm trừ (âm, VD: -2, -5)'
                      : 'Mốc điểm hoặc ghi chú'}
                  </p>
                </div>
              </div>

              {/* 3. Tên nội dung tiêu chí */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên nội dung quy định / tiêu chí: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Đại diện CLB tham gia Hội thảo cấp ĐHQGHN"
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#1351D8] focus:ring-2 focus:ring-[#1351D8]/10 transition shadow-2xs"
                  required
                />
              </div>

              {/* 4. Danh mục */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Danh mục phân loại:</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1351D8] focus:ring-2 focus:ring-[#1351D8]/10 transition shadow-2xs cursor-pointer"
                >
                  <option value="Nhiệm vụ & Tiến độ">Nhiệm vụ & Tiến độ</option>
                  <option value="Tương tác & Mạng xã hội">Tương tác & Mạng xã hội</option>
                  <option value="Kỷ luật & Deadline">Kỷ luật & Deadline</option>
                  <option value="Họp & Kỷ luật">Họp & Kỷ luật</option>
                  <option value="Đối ngoại & Sự kiện">Đối ngoại & Sự kiện</option>
                  <option value="Khen thưởng & Đóng góp">Khen thưởng & Đóng góp</option>
                  <option value="Nguyên tắc vận hành">Nguyên tắc vận hành</option>
                </select>
              </div>

              {/* 5. Điều kiện áp dụng & Chi tiết */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Điều kiện áp dụng & Minh chứng yêu cầu:
                </label>
                <textarea
                  value={formCondition}
                  onChange={(e) => setFormCondition(e.target.value)}
                  placeholder="Mô tả cụ thể trường hợp áp dụng, căn cứ xét điểm, thời hạn nộp hoặc minh chứng cần có..."
                  rows={3}
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#1351D8] focus:ring-2 focus:ring-[#1351D8]/10 transition shadow-2xs leading-relaxed"
                />
              </div>

              {/* 6. Tùy chọn nâng cao */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50/60 to-indigo-50/40 rounded-2xl border border-blue-200/70 space-y-2.5">
                <span className="font-bold text-[#0F172A] block text-xs flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#1351D8]" />
                  <span>Tùy chọn cơ chế CLB:</span>
                </span>

                {formType === 'deduct' && (
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={formCoreMultiplier}
                      onChange={(e) => setFormCoreMultiplier(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-white mt-0.5 cursor-pointer"
                    />
                    <span>
                      Áp dụng chế tài <strong>phạt gấp đôi (×2)</strong> cho 11 nhân sự Core Team (BCN & Trưởng ban)
                    </span>
                  </label>
                )}

                {formType === 'add' && (
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={formMonthlyCap}
                      onChange={(e) => setFormMonthlyCap(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-white mt-0.5 cursor-pointer"
                    />
                    <span>
                      Tính vào <strong>điểm tương tác tối đa 15 điểm/tháng</strong> (tránh cày điểm ảo)
                    </span>
                  </label>
                )}

                <div className="text-[11px] text-slate-600 font-medium bg-white/70 p-2.5 rounded-xl border border-blue-200/50 leading-relaxed">
                  Sau khi thêm, quy định này sẽ ngay lập tức xuất hiện trong mục <strong>Chấm điểm & Duyệt</strong>{' '}
                  để Ban Nhân sự và Ban Chủ nhiệm áp dụng.
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200/90 text-slate-700 font-bold text-xs hover:bg-slate-50 transition shadow-2xs active:scale-95 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0F3282] via-[#1351D8] to-[#1E62F4] hover:from-[#0B2562] hover:to-[#1351D8] text-white font-bold text-xs shadow-xs hover:shadow transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Lưu Quy Định CLB</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
