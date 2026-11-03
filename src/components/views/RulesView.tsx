'use client'

import React, { useState, useMemo } from 'react'
import { useClub, type CustomRuleItem } from '@/lib/context/ClubContext'
import { useAuth } from '@/lib/auth/AuthContext'
import { useLanguage } from '@/lib/context/LanguageContext'
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
  XCircle,
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
  Minus,
  ChevronDown,
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
    condition: 'Nhân sự Core Team (BCN & Trưởng/Phó ban) bị phạt gấp đôi đối với các lỗi vi phạm kỷ luật. Điểm cộng giữ nguyên.',
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

const PRINCIPLES_EN: Record<string, { title: string; points: string; condition: string; category: string }> = {
  P01: {
    title: 'Starting Score',
    points: '60',
    condition: 'Each member begins with a baseline of 60 points at the start of each tenure or competition cycle.',
    category: 'Foundational Principle',
  },
  P02: {
    title: 'Score Scale Range',
    points: '0 - 100',
    condition: 'Absolute scale from 0 to 100. Scores are clamped strictly within this range after all calculations.',
    category: 'Foundational Principle',
  },
  P03: {
    title: 'Core Team Sanctions (×2)',
    points: '×2 Penalty',
    condition: 'Core Team members (Executive Board & Heads/Deputy Heads) receive double penalty points for violations. Bonus points remain standard 1×.',
    category: 'Leadership Accountability',
  },
  P04: {
    title: 'Monthly Interaction Cap',
    points: '15 pts/month',
    condition: 'Total points from C01, C02, C03 are capped at a maximum of 15 points/month/member to prevent score farming.',
    category: 'Quota Control',
  },
  P05: {
    title: 'Interaction & Response Deadline',
    points: '12h',
    condition: 'Deadline to respond to important announcements and complete call-to-action interactions applies strictly within 12 hours.',
    category: 'Communication Discipline',
  },
  P06: {
    title: 'Replacement & Non-stacking Rules',
    points: 'Non-stacking',
    condition: 'C02 includes C01; T02 replaces T01; T08 replaces T07; T09 replaces T07/T08. Prevents duplicate penalties or bonuses.',
    category: 'Scoring Fairness',
  },
  P07: {
    title: '4 Task Delivery Quality Standards',
    points: '4 Standards',
    condition: 'Deliverable acceptance criteria: meets requirements, accurate information, complete, no rework needed.',
    category: 'Task Acceptance',
  },
  P08: {
    title: 'Member PII Privacy Protection',
    points: '100% Confidential',
    condition: 'Public leaderboard protects sensitive PII: excludes Email, Phone, Student ID, or disciplinary details.',
    category: 'Privacy Rights',
  },
  P09: {
    title: 'Excused Meeting Absence',
    points: '-2 pts',
    condition: 'Notice given at least 2 hours prior in departmental group and confirmed with legitimate reason by Exec Board / Head.',
    category: 'Activity Discipline',
  },
  P10: {
    title: 'Unexcused Absence Sanction (3 times)',
    points: 'Membership Termination',
    condition: 'Accumulating 3 unexcused absences triggers an official review process for club membership termination.',
    category: 'Strict Disciplinary',
  },
}

const CRITERIA_EN: Record<string, { name: string; description: string; category: string }> = {
  C01: {
    name: 'Standard Engagement',
    description: 'React, like, and interact on time (within 12h of announcement).',
    category: 'Social & Interaction',
  },
  C02: {
    name: 'Quality Feedback & Comment',
    description: 'Constructive comments, suggestions, or sharing public posts.',
    category: 'Social & Interaction',
  },
  C03: {
    name: 'Form & Survey Response',
    description: 'Fill out internal forms and feedback surveys accurately and on time.',
    category: 'Social & Interaction',
  },
  C04: {
    name: 'Creative Ideas & Proposals',
    description: 'Contribute approved initiatives and innovative ideas implemented by departments.',
    category: 'Tasks & Dedication',
  },
  C05: {
    name: 'On-time & Standard Task Completion',
    description: 'Successfully fulfill all 4 deliverable acceptance standards on time.',
    category: 'Tasks & Dedication',
  },
  C06: {
    name: 'Outstanding Task / Ahead of Schedule',
    description: 'High quality deliverable, completed ahead of deadline, or exceptional issue handling.',
    category: 'Tasks & Dedication',
  },
  C07: {
    name: 'Punctual Meeting / Event Attendance',
    description: 'Arrive on time and participate in >=80% of event/meeting duration.',
    category: 'Meetings & Attendance',
  },
  C08: {
    name: 'Cross-functional Event Support',
    description: 'Volunteer support for other departments or handle urgent unassigned tasks.',
    category: 'Tasks & Dedication',
  },
  C09: {
    name: 'University Awards & Recognitions',
    description: 'Represent the club to achieve accolades or official commendations from the University.',
    category: 'Tasks & Dedication',
  },
  T01: {
    name: 'Excused Meeting / Event Absence',
    description: 'Requested at least 2 hours in advance with a verified legitimate reason.',
    category: 'Meetings & Discipline',
  },
  T02: {
    name: 'UNEXCUSED Meeting / Event Absence',
    description: 'Absent without notice or requesting permission after the meeting has started.',
    category: 'Meetings & Discipline',
  },
  T03: {
    name: 'Official Disciplinary Warning from Exec Board',
    description: 'Formal written warning letter/email from Exec Board. Capped at -10 pts total.',
    category: 'Disciplinary Sanctions',
  },
  T04: {
    name: 'Late Arrival / Early Departure (>15m)',
    description: 'Participate >=80% duration but arrive >15 mins late or leave early.',
    category: 'Meetings & Discipline',
  },
  T05: {
    name: 'No Interaction on Posts / Announcements',
    description: 'Missed important announcements within 12h without any response.',
    category: 'Interaction & Attitude',
  },
  T06: {
    name: 'Lost Contact >48h During Active Campaigns',
    description: 'Unresponsive to work messages while department is actively running an event/campaign.',
    category: 'Interaction & Attitude',
  },
  T07: {
    name: 'Task Deadline Delay (<24h)',
    description: 'Submit product or deliverable less than 24 hours late after the deadline.',
    category: 'Tasks & Deadlines',
  },
  T08: {
    name: 'Task Deadline Delay (>24h)',
    description: 'Submit product 24 hours or more past deadline without prior notice.',
    category: 'Tasks & Deadlines',
  },
  T09: {
    name: 'Abandoned Task / Incomplete Assignment',
    description: 'Accepted task but failed to deliver, adversely affecting team progress.',
    category: 'Tasks & Deadlines',
  },
  T10: {
    name: 'Substandard Deliverable Quality',
    description: 'Poor quality output, violating acceptance criteria and requiring rework.',
    category: 'Tasks & Deadlines',
  },
  T11: {
    name: 'Violation of Internal Communication Etiquette',
    description: 'Disrespectful language, causing discord or internal conflict.',
    category: 'Discipline & Attitude',
  },
  T12: {
    name: 'Fraud / Club Image Infringement',
    description: 'Dishonest reporting, proxy check-in, forged proof, or harming club reputation.',
    category: 'Strict Disciplinary',
  },
  T13: {
    name: 'Loss / Damage of Shared Club Assets',
    description: 'Failure to safeguard entrusted club equipment, logistics, or physical assets.',
    category: 'Asset Responsibility',
  },
}

export function RulesView() {
  const { customRules, addCustomRule, deleteCustomRule } = useClub()
  const { isBCN } = useAuth()
  const { language, t } = useLanguage()

  const [activeTab, setActiveTab] = useState<'principles' | 'add' | 'deduct' | 'all'>('principles')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Mascot lời nhắc động & tương tác
  const [mascotBubble, setMascotBubble] = useState(true)
  const [mascotPopping, setMascotPopping] = useState(false)

  const handleMascotClick = () => {
    setMascotPopping(true)
    setMascotBubble(true)
    setTimeout(() => setMascotPopping(false), 850)
  }

  // Form state cho modal thêm quy định
  const [formType, setFormType] = useState<'add' | 'deduct' | 'principle'>('add')
  const [formCode, setFormCode] = useState('')
  const [formName, setFormName] = useState('')
  const [formPoints, setFormPoints] = useState<number | string>(2)
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
    setFormPoints(type === 'deduct' ? -2 : type === 'add' ? 2 : 'Quy chuẩn')
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
      setFormPoints('Quy chuẩn')
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

  // Danh sách hợp nhất (Tự động chuyển đổi ngôn ngữ Vi/En)
  const builtinAddList = useMemo(() => {
    return Object.values(CRITERIA_RULES)
      .filter((c) => c.type === 'add')
      .map((c) => {
        const en = CRITERIA_EN[c.code]
        return {
          code: c.code,
          name: language === 'en' && en ? en.name : c.name,
          type: 'add' as const,
          points: `+${c.base_points}`,
          numericPoints: c.base_points,
          category:
            language === 'en'
              ? en?.category || (c.monthly_cap_group ? 'Social & Interaction' : 'Tasks & Dedication')
              : c.monthly_cap_group
              ? 'Tương tác & Mạng xã hội'
              : 'Nhiệm vụ & Cống hiến',
          condition: language === 'en' && en ? en.description : c.description,
          isCustom: false,
          monthlyCap: !!c.monthly_cap_group,
          coreMultiplier: false,
        }
      })
  }, [language])

  const builtinDeductList = useMemo(() => {
    return Object.values(CRITERIA_RULES)
      .filter((c) => c.type === 'deduct')
      .map((c) => {
        const en = CRITERIA_EN[c.code]
        return {
          code: c.code,
          name: language === 'en' && en ? en.name : c.name,
          type: 'deduct' as const,
          points: `${c.base_points}`,
          numericPoints: c.base_points,
          category:
            language === 'en'
              ? en?.category || (
                  c.code.startsWith('T01') || c.code.startsWith('T02') || c.code.startsWith('T03')
                    ? 'Meetings & Discipline'
                    : c.code.startsWith('T07') || c.code.startsWith('T08') || c.code.startsWith('T09')
                    ? 'Tasks & Deadlines'
                    : 'Interaction & Attitude'
                )
              : c.code.startsWith('T01') || c.code.startsWith('T02') || c.code.startsWith('T03')
              ? 'Họp & Kỷ luật'
              : c.code.startsWith('T07') || c.code.startsWith('T08') || c.code.startsWith('T09')
              ? 'Nhiệm vụ & Deadline'
              : 'Tương tác & Thái độ',
          condition: language === 'en' && en ? en.description : c.description,
          isCustom: false,
          monthlyCap: false,
          coreMultiplier: c.core_multiplier_applies,
        }
      })
  }, [language])

  const builtinPrincipleList = useMemo(() => {
    return BUILTIN_PRINCIPLES.map((p) => {
      const en = PRINCIPLES_EN[p.code]
      return {
        code: p.code,
        name: language === 'en' && en ? en.title : p.title,
        type: 'principle' as const,
        points: language === 'en' && en ? en.points : p.points,
        numericPoints: 0,
        category: language === 'en' && en ? en.category : p.category,
        condition: language === 'en' && en ? en.condition : p.condition,
        isCustom: false,
        monthlyCap: false,
        coreMultiplier: false,
      }
    })
  }, [language])

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
      category: r.category || (language === 'vi' ? 'Quy định bổ sung' : 'Custom Regulation'),
      condition: r.condition || r.description,
      isCustom: true,
      monthlyCap: !!r.monthlyCapGroup,
      coreMultiplier: !!r.coreMultiplierApplies,
    }))
  }, [customRules, language])

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
        const cat = selectedCategory.toLowerCase()
        list = list.filter((r) => {
          const rCat = r.category.toLowerCase()
          if (rCat.includes(cat)) return true
          if (cat === 'tương tác' && (rCat.includes('social') || rCat.includes('interaction') || rCat.includes('tương tác'))) return true
          if (cat === 'nhiệm vụ' && (rCat.includes('task') || rCat.includes('nhiệm vụ'))) return true
          if (cat === 'họp' && (rCat.includes('meeting') || rCat.includes('họp') || rCat.includes('attendance'))) return true
          return false
        })
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

      {/* Header trang với Linh vật Mascot & Lời nhắc động */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1 pt-3 sm:pt-4">
        <div className="flex items-center gap-3.5 sm:gap-4.5">
          {/* Mascot Container với animation bay lượn & bóng thoại */}
          <div className="relative shrink-0 select-none">
            {/* Bóng thoại lời nhắc: "Hãy thực hiện theo quy định" */}
            {mascotBubble && (
              <div
                onClick={handleMascotClick}
                className="absolute -top-8 sm:-top-8.5 -left-1 sm:left-1 bg-white text-[#0B1E48] border border-sky-300/80 shadow-[0_4px_14px_rgba(2,132,199,0.18)] px-2.5 py-1 rounded-xl rounded-bl-none text-[11px] sm:text-xs font-black whitespace-nowrap flex items-center z-20 cursor-pointer animate-pulse transition-all duration-200 hover:scale-105 active:scale-95"
                title="Bấm vào tớ nhé!"
              >
                <span>{language === 'vi' ? 'Hãy thực hiện theo quy định' : 'Please follow the regulations!'}</span>
                {/* Mũi tên bóng thoại chỉ vào mascot */}
                <span className="absolute -bottom-1 left-3 w-2 h-2 bg-white border-b border-r border-sky-300/80 rotate-45" />
              </div>
            )}

            {/* Mascot Image bay lượn động */}
            <div
              onClick={handleMascotClick}
              className={`cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-95 ${
                mascotPopping ? 'animate-mascot-pop' : 'animate-mascot-fly'
              }`}
              title="Linh vật iSSAC: Bấm để tương tác!"
            >
              <img
                src="/rules-mascot.png"
                alt="iSSAC Rules Mascot"
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-md select-none"
              />
            </div>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0B1E48] tracking-tight leading-snug">
              {language === 'vi' ? 'Quy định và quy tắc thực hiện chung của iSSAC' : 'General Rules & Regulations of iSSAC'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-normal mt-0.5">
              {language === 'vi'
                ? 'Áp dụng minh bạch cho toàn bộ thành viên CLB.'
                : 'Transparently applied to all club members.'}
            </p>
          </div>
        </div>

        {isBCN && (
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 self-start md:self-center flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => handleOpenAddModal('add')}
              className="px-3 sm:px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/90 text-emerald-800 border border-emerald-200/90 font-bold text-xs sm:text-[13px] transition shadow-2xs hover:shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{language === 'vi' ? 'Thêm Điểm Cộng' : 'Add Bonus Criterion'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenAddModal('deduct')}
              className="px-3 sm:px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100/90 text-rose-800 border border-rose-200/90 font-bold text-xs sm:text-[13px] transition shadow-2xs hover:shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{language === 'vi' ? 'Thêm Điểm Trừ' : 'Add Penalty Criterion'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenAddModal('principle')}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#0369A1] hover:from-[#0369A1] hover:to-[#075985] text-white font-bold text-xs sm:text-[13px] transition shadow-xs hover:shadow flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5] flex-shrink-0" />
              <span>{language === 'vi' ? 'Thêm Quy Định Mới' : 'Add New Rule'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 4 Khối tóm tắt: Chuẩn Pastel sang trọng & Tương tác 1 chạm như MembersView */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Nguyên tắc cốt lõi */}
        <div
          onClick={() => setActiveTab('principles')}
          className={`p-4 sm:p-5 rounded-2xl bg-[#F0F9FF] flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 ${
            activeTab === 'principles'
              ? 'ring-2 ring-[#0284C7] ring-offset-1 scale-[1.01]'
              : ''
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 block">
              {language === 'vi' ? 'Nguyên tắc cốt lõi' : 'Core Principles'}
            </span>
            <span className="text-2xl sm:text-[28px] font-black text-[#0284C7] block tracking-tight leading-none py-0.5">
              {countPrinciples}
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-sky-300/70 bg-white/70 flex items-center justify-center text-[#0284C7] shrink-0">
            <Scale className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* Card 2: Tiêu chí Điểm cộng */}
        <div
          onClick={() => setActiveTab('add')}
          className={`p-4 sm:p-5 rounded-2xl bg-[#F0FDF4] flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 ${
            activeTab === 'add'
              ? 'ring-2 ring-emerald-500 ring-offset-1 scale-[1.01]'
              : ''
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 block">
              {language === 'vi' ? 'Tiêu chí Điểm cộng' : 'Bonus Criteria'}
            </span>
            <span className="text-2xl sm:text-[28px] font-black text-[#16A34A] block tracking-tight leading-none py-0.5">
              {countAdd}
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-emerald-300/70 bg-white/70 flex items-center justify-center text-[#16A34A] shrink-0">
            <Award className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* Card 3: Tiêu chí Điểm trừ */}
        <div
          onClick={() => setActiveTab('deduct')}
          className={`p-4 sm:p-5 rounded-2xl bg-[#FFF1F2] flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 ${
            activeTab === 'deduct'
              ? 'ring-2 ring-rose-500 ring-offset-1 scale-[1.01]'
              : ''
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 block">
              {language === 'vi' ? 'Tiêu chí Điểm trừ' : 'Penalty Criteria'}
            </span>
            <span className="text-2xl sm:text-[28px] font-black text-[#DC2626] block tracking-tight leading-none py-0.5">
              {countDeduct}
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-rose-300/70 bg-white/70 flex items-center justify-center text-[#DC2626] shrink-0">
            <ShieldAlert className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* Card 4: Tất cả quy chuẩn */}
        <div
          onClick={() => setActiveTab('all')}
          className={`p-4 sm:p-5 rounded-2xl bg-[#FFFBEB] flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 ${
            activeTab === 'all'
              ? 'ring-2 ring-amber-500 ring-offset-1 scale-[1.01]'
              : ''
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 block">
              {language === 'vi' ? 'Tất cả quy chuẩn' : 'All Rules & Criteria'}
            </span>
            <span className="text-2xl sm:text-[28px] font-black text-[#D97706] block tracking-tight leading-none py-0.5">
              {allRulesList.length}
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-amber-300/70 bg-white/70 flex items-center justify-center text-[#D97706] shrink-0">
            <Layers className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>
      </div>

      {/* KHỐI CONTAINER TRẮNG LIỀN MẠCH: Subtabs + Thanh lọc + Bảng dữ liệu (Đồng bộ 100% HistoryView & MembersView) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-4 sm:p-5 space-y-4">
        {/* Hàng 1: Subtabs theo phân loại (Dạng Pill bo tròn mềm mại) + Chỉ số Hiển thị */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {[
              { id: 'principles' as const, label: language === 'vi' ? 'Nguyên tắc cốt lõi' : 'Core Principles', count: countPrinciples, icon: Scale },
              { id: 'add' as const, label: language === 'vi' ? 'Tiêu chí điểm cộng' : 'Bonus Criteria', count: countAdd, icon: Award },
              { id: 'deduct' as const, label: language === 'vi' ? 'Tiêu chí điểm trừ' : 'Penalty Criteria', count: countDeduct, icon: ShieldAlert },
              { id: 'all' as const, label: language === 'vi' ? 'Tất cả quy định' : 'All Rules', count: allRulesList.length, icon: Layers },
            ].map((tab) => {
              const TabIcon = tab.icon
              const isSelected = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs transition-all whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0284C7] text-white font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 font-medium'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Quick Counter */}
          <div className="text-xs text-slate-500 font-medium whitespace-nowrap flex items-center gap-1 self-end sm:self-auto px-1">
            <span>{language === 'vi' ? 'Hiển thị:' : 'Showing:'}</span>
            <strong className="text-slate-900 font-bold">{filteredRules.length}</strong>
            <span>/ {allRulesList.length} {language === 'vi' ? 'quy chuẩn' : 'rules'}</span>
          </div>
        </div>

        {/* Hàng 2: Thanh tìm kiếm (Bo tròn dài rounded-full) & Chip lọc danh mục */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-0.5">
          {/* Search Input (rounded-full) */}
          <div className="relative flex-1 sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={language === 'vi' ? 'Tìm mã (C01, T02...), tên quy chuẩn, điều kiện...' : 'Search code (C01, T02...), rule title, condition...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Chip filter danh mục */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs">
            <span className="text-slate-500 font-bold text-[11px] whitespace-nowrap flex items-center gap-1 pr-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>{language === 'vi' ? 'Lọc:' : 'Filter:'}</span>
            </span>
            {[
              { id: 'all', label: language === 'vi' ? 'Tất cả' : 'All' },
              { id: 'tương tác', label: language === 'vi' ? 'Tương tác' : 'Engagement' },
              { id: 'nhiệm vụ', label: language === 'vi' ? 'Nhiệm vụ' : 'Tasks' },
              { id: 'họp', label: language === 'vi' ? 'Kỷ luật họp' : 'Meetings' },
              { id: 'custom_only', label: language === 'vi' ? `CLB bổ sung (${countCustom})` : `Club Added (${countCustom})`, icon: BadgePlus },
            ].map((chip) => {
              const isSelected = selectedCategory === chip.id
              const ChipIcon = (chip as any).icon
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setSelectedCategory(chip.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'bg-[#0284C7] text-white font-bold'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-medium'
                  }`}
                >
                  {ChipIcon && (
                    <ChipIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  )}
                  <span>{chip.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Hàng 3: Bảng dữ liệu quy chế & Mobile Card List */}
        <div className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs">
          {/* Mobile View: Cards */}
          <div className="md:hidden divide-y divide-slate-100 bg-white">
            {filteredRules.length === 0 ? (
              <div className="py-12 text-center text-slate-400 px-4">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-xs sm:text-sm">
                  {language === 'vi' ? 'Không tìm thấy quy định phù hợp' : 'No matching rules found'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('all')
                  }}
                  className="text-xs text-[#0284C7] font-semibold hover:underline mt-1"
                >
                  {language === 'vi' ? 'Xóa bộ lọc tìm kiếm' : 'Clear search filters'}
                </button>
              </div>
            ) : (
              filteredRules.map((item) => {
                const isAdd = item.type === 'add'
                const isDeduct = item.type === 'deduct'
                const isPrinciple = item.type === 'principle'

                return (
                  <div key={item.code} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold shadow-2xs ${
                            isPrinciple
                              ? 'bg-blue-50 text-[#0284C7] border border-blue-200'
                              : isAdd
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {item.code}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-700">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-black shadow-2xs border ${
                            isAdd
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isDeduct
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-blue-50 text-[#0284C7] border-blue-200'
                          }`}
                        >
                          {item.points}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-[#0B1E48] text-sm">{item.name}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.condition}</p>
                    </div>

                    {/* Core Team badge on mobile */}
                    {item.coreMultiplier && (
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-900 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 shadow-2xs">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{language === 'vi' ? 'Core Team: Phạt gấp đôi (×2)' : 'Core Team: Double Penalty (×2)'}</span>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse table-fixed min-w-[1040px]">
              <colgroup>
                <col className="w-[75px]" style={{ width: '75px' }} />
                <col className="w-[340px]" style={{ width: '340px' }} />
                <col className="w-[145px]" style={{ width: '145px' }} />
                <col className="w-[180px]" style={{ width: '180px' }} />
                <col />
                <col className="w-[130px]" style={{ width: '130px' }} />
              </colgroup>
              <thead className="bg-[#0284C7] text-xs font-bold text-white uppercase tracking-wider select-none shadow-xs">
                <tr className="divide-x divide-white/15">
                  <th className="py-3 px-3 text-center whitespace-nowrap font-bold text-sky-100 w-[75px]">
                    {language === 'vi' ? 'Mã' : 'Code'}
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap text-left font-bold text-white w-[340px]">
                    {language === 'vi' ? 'Nội dung & Danh mục' : 'Content & Category'}
                  </th>
                  <th className="py-3 px-2 text-center whitespace-nowrap font-bold text-white w-[145px]">
                    <div className="flex flex-col items-center justify-center leading-tight">
                      <span>{language === 'vi' ? 'Điểm Thành Viên' : 'Member Score'}</span>
                      <span className="text-[10px] font-normal text-sky-100 tracking-normal lowercase">
                        {language === 'vi' ? 'tiêu chuẩn' : 'standard'}
                      </span>
                    </div>
                  </th>
                  <th className="py-3 px-2 text-center whitespace-nowrap font-bold text-white w-[180px]">
                    <div className="flex flex-col items-center justify-center leading-tight">
                      <div className="inline-flex items-center justify-center gap-1 font-bold text-white">
                        <Crown className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        <span>{language === 'vi' ? 'Điểm Core Team' : 'Core Team Score'}</span>
                      </div>
                      <span className="text-[10px] font-normal text-sky-100 tracking-normal mt-0.5 lowercase">
                        {language === 'vi' ? 'thành viên core team ×2' : 'core team members ×2'}
                      </span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left font-bold text-white">
                    {language === 'vi' ? 'Điều kiện áp dụng & Chi tiết' : 'Conditions & Details'}
                  </th>
                  <th className="py-3 px-2 text-center whitespace-nowrap font-bold text-sky-100 w-[130px]">
                    {language === 'vi' ? 'Nguồn gốc' : 'Source'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredRules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="space-y-2">
                        <Search className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-semibold text-xs sm:text-sm">
                          {language === 'vi' ? 'Không tìm thấy quy định phù hợp với bộ lọc' : 'No rules match the current filters'}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('')
                            setSelectedCategory('all')
                          }}
                          className="text-xs sm:text-sm text-[#0284C7] font-semibold hover:underline"
                        >
                          {language === 'vi' ? 'Xóa bộ lọc tìm kiếm' : 'Clear search filters'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRules.map((item) => {
                    const isAdd = item.type === 'add'
                    const isDeduct = item.type === 'deduct'
                    const isPrinciple = item.type === 'principle'

                    // Render phần hiển thị điểm riêng biệt cho Core Team
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
                            {language === 'vi' ? 'Core phạt ×2' : 'Core ×2 Penalty'}
                          </span>
                        </div>
                      )
                    } else if (item.code === 'P03') {
                      coreTeamElement = (
                        <div className="flex flex-col items-center justify-center gap-1 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs bg-amber-50 text-amber-900 border border-amber-200 whitespace-nowrap shadow-2xs">
                            <Crown className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                            <span>{language === 'vi' ? 'Phạt ×2' : '×2 Penalty'}</span>
                          </span>
                          <span className="inline-block text-[10px] font-semibold text-amber-800 bg-amber-100/70 border border-amber-200/60 px-1.5 py-0.5 rounded whitespace-nowrap">
                            Core Team
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
                            {language === 'vi' ? 'Đồng mức' : 'Standard 1×'}
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
                            {language === 'vi' ? 'Đồng mức' : 'Standard 1×'}
                          </span>
                        </div>
                      )
                    } else {
                      coreTeamElement = (
                        <div className="flex flex-col items-center justify-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50/70 border border-blue-200 whitespace-nowrap shadow-2xs">
                            <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <span>{language === 'vi' ? 'Áp dụng chung' : 'General Apply'}</span>
                          </span>
                        </div>
                      )
                    }

                    return (
                      <tr
                        key={item.code}
                        className="hover:bg-slate-50/70 transition-colors group divide-x divide-slate-100"
                      >
                        {/* 1. Mã quy chế */}
                        <td className="py-3 px-2.5 text-center align-middle">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-xs font-mono font-bold shadow-2xs ${
                              isPrinciple
                                ? 'bg-blue-50 text-[#0284C7] border border-blue-200'
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
                          <div className="font-bold text-[#0B1E48] text-[13px] sm:text-[13.5px] flex items-center gap-1.5 leading-snug">
                            <span>{item.name}</span>
                            {item.isCustom && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap shadow-2xs">
                                {language === 'vi' ? 'CLB Thêm' : 'Custom'}
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

                        {/* 3. Mức Điểm Thành Viên */}
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
                              <span className="inline-block px-2.5 py-1 rounded-lg font-bold text-xs text-[#0284C7] bg-blue-50 border border-blue-200 whitespace-nowrap shadow-2xs">
                                {item.points}
                              </span>
                            )}
                            {item.monthlyCap && (
                              <span className="inline-flex items-center justify-center text-[10px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-center leading-tight whitespace-nowrap mt-1 shadow-2xs">
                                {language === 'vi' ? 'Tối đa 15đ/tháng' : 'Max 15 pts/month'}
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-medium mt-0.5 whitespace-nowrap ${
                                isPrinciple ? 'text-[#0284C7]' : isAdd ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {isPrinciple
                                ? (language === 'vi' ? 'Chuẩn quy chế' : 'Baseline Rule')
                                : (language === 'vi' ? 'Tiêu chuẩn' : 'Standard')}
                            </span>
                          </div>
                        </td>

                        {/* 4. Mức Điểm Core Team */}
                        <td className="py-3 px-3 text-center align-middle">
                          {coreTeamElement}
                        </td>

                        {/* 5. Điều kiện áp dụng & Chi tiết */}
                        <td className="py-3 px-4 align-middle">
                          <p className="text-[12.5px] sm:text-[13px] text-slate-600 leading-relaxed text-left font-normal">
                            {item.condition}
                          </p>
                          {item.code === 'T02' && (
                            <div className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-rose-900 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 shadow-2xs">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                              <span>
                                {language === 'vi'
                                  ? 'Cảnh báo: Tích lũy 3 lần vắng họp xem xét dừng tư cách thành viên'
                                  : 'Warning: 3 unexcused absences trigger membership termination review'}
                              </span>
                            </div>
                          )}
                          {item.code === 'P03' && (
                            <div className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs">
                              <Crown className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                              <span>{language === 'vi' ? 'Áp dụng cho Core Team' : 'Applies to Core Team'}</span>
                            </div>
                          )}
                        </td>

                        {/* 6. Nguồn gốc & Thao tác */}
                        <td className="py-3 px-2.5 text-center align-middle">
                          {item.isCustom ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 whitespace-nowrap shadow-2xs">
                                <BadgePlus className="w-3.5 h-3.5 text-amber-600" />
                                <span>{language === 'vi' ? 'CLB bổ sung' : 'Club Added'}</span>
                              </span>
                              {isBCN && (
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRule(item.code)}
                                    title={language === 'vi' ? 'Xóa quy định này' : 'Delete this rule'}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-700 hover:underline pt-0.5 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" /> {language === 'vi' ? 'Xóa' : 'Delete'}
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 whitespace-nowrap shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#0284C7]" />
                              <span>{language === 'vi' ? 'Quy chế chuẩn' : 'Standard Rule'}</span>
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
      </div>

      {/* Modal: Thêm quy định / tiêu chí mới */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0B1E48]/60 backdrop-blur-xs animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false)
          }}
        >
          <div className="bg-white rounded-3xl sm:rounded-[28px] max-w-xl w-full border border-slate-100 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header (Fixed / Shrink-0) */}
            <div className="p-4 sm:p-5 sm:pb-3.5 border-b border-slate-100 flex items-start justify-between bg-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0 transition-colors ${
                    formType === 'add'
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-700 shadow-emerald-500/20'
                      : formType === 'deduct'
                      ? 'bg-gradient-to-br from-rose-500 to-red-700 shadow-rose-500/20'
                      : 'bg-gradient-to-br from-[#7026ED] via-[#5b1ecc] to-[#1351D8] shadow-purple-500/20'
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
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black text-[#061651] tracking-tight truncate">
                    {language === 'vi' ? 'Thêm Quy Định / Tiêu Chí CLB' : 'Add Club Rule / Criterion'}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#64748B] font-medium truncate mt-0.5">
                    {language === 'vi'
                      ? 'Bổ sung tiêu chí chấm điểm và chế tài thi đua cho CLB'
                      : 'Add scoring criteria and disciplinary regulations for Club'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition flex items-center justify-center cursor-pointer shrink-0 ml-2"
                title="Đóng modal"
              >
                <X className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveRule} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5.5 space-y-4 text-xs overscroll-contain">
                {/* 1. Chọn loại quy định: 3 Thẻ tương tác */}
                <div>
                  <label className="text-xs sm:text-[13px] font-bold text-[#061651] block mb-2">
                    {language === 'vi' ? 'Loại quy định & tiêu chí:' : 'Rule & Criterion Type:'}
                  </label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleTypeChange('add')}
                      className={`py-3 px-2 sm:px-3 rounded-2xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1.5 cursor-pointer ${
                        formType === 'add'
                          ? 'border-emerald-300 bg-emerald-50/80 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20'
                          : 'border-slate-200/90 bg-slate-50/70 text-slate-600 hover:bg-white hover:text-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs shadow-2xs">
                        <Award className="w-4 h-4 text-emerald-700" />
                      </div>
                      <span className="font-bold text-xs truncate max-w-full">{language === 'vi' ? 'Điểm cộng (+)' : 'Bonus (+)'}</span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                        {language === 'vi' ? '+2đ chuẩn' : '+2 pts standard'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTypeChange('deduct')}
                      className={`py-3 px-2 sm:px-3 rounded-2xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1.5 cursor-pointer ${
                        formType === 'deduct'
                          ? 'border-rose-300 bg-rose-50/80 text-rose-950 shadow-xs ring-2 ring-rose-500/20'
                          : 'border-slate-200/90 bg-slate-50/70 text-slate-600 hover:bg-white hover:text-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-black text-xs shadow-2xs">
                        <ShieldAlert className="w-4 h-4 text-rose-700" />
                      </div>
                      <span className="font-bold text-xs truncate max-w-full">{language === 'vi' ? 'Điểm trừ (-)' : 'Penalty (-)'}</span>
                      <span className="text-[10px] font-semibold text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded">
                        {language === 'vi' ? '-2đ (Core ×2)' : '-2 pts (Core ×2)'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTypeChange('principle')}
                      className={`py-3 px-2 sm:px-3 rounded-2xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1.5 cursor-pointer ${
                        formType === 'principle'
                          ? 'border-purple-300 bg-purple-50/80 text-purple-950 shadow-xs ring-2 ring-[#7026ED]/20'
                          : 'border-slate-200/90 bg-slate-50/70 text-slate-600 hover:bg-white hover:text-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-[#7026ED] flex items-center justify-center font-black text-xs shadow-2xs">
                        <Scale className="w-4 h-4 text-[#7026ED]" />
                      </div>
                      <span className="font-bold text-xs truncate max-w-full">{language === 'vi' ? 'Nguyên tắc (P)' : 'Principle (P)'}</span>
                      <span className="text-[10px] font-semibold text-[#7026ED] bg-purple-100/70 px-1.5 py-0.5 rounded">
                        {language === 'vi' ? 'Quy chuẩn' : 'Standard'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* 2. Mã quy chế & Mức điểm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                  <div>
                    <label className="text-xs sm:text-[13px] font-bold text-[#061651] block mb-1.5">
                      {language === 'vi' ? 'Mã quy chế:' : 'Rule Code:'} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                      placeholder="VD: C10, T14, P11"
                      className="w-full bg-white hover:border-[#7026ED]/60 focus:bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] font-mono font-bold text-[#7026ED] focus:outline-none focus:border-[#7026ED] focus:ring-2 focus:ring-[#7026ED]/15 transition shadow-2xs"
                      required
                    />
                    <p className="text-[10.5px] text-slate-400 mt-1 font-medium">
                      {language === 'vi' ? 'Tự động gợi ý mã kế tiếp' : 'Auto-suggested next code'}
                    </p>
                  </div>

                  <div>
                    {/* Stepper hoặc Input tuỳ formType */}
                    {formType === 'add' ? (
                      <>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs sm:text-[13px] font-bold text-[#061651] block">
                            {language === 'vi' ? 'Mức điểm cộng:' : 'Bonus Points:'} <span className="text-rose-500">*</span>
                          </label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 5].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setFormPoints(preset)}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                                  Number(formPoints) === preset
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                +{preset}đ
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-2.5 py-2 sm:py-2.5 shadow-2xs focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/15 transition">
                          <button
                            type="button"
                            onClick={() => setFormPoints((prev) => Math.max(1, (Number(prev) || 1) - 1))}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 flex items-center justify-center transition active:scale-90 shrink-0 cursor-pointer"
                            title="Giảm 1 điểm"
                          >
                            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          <div className="flex-1 flex items-center justify-center gap-1 px-1">
                            <span className="text-xs font-bold text-emerald-600">+</span>
                            <input
                              type="number"
                              step="1"
                              min="1"
                              value={Math.abs(Number(formPoints) || 0)}
                              onChange={(e) => setFormPoints(Math.abs(Number(e.target.value)))}
                              className="w-12 text-center text-xs sm:text-[13px] font-extrabold text-emerald-700 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              required
                            />
                            <span className="text-[11px] sm:text-xs font-bold text-slate-400 select-none">
                              {language === 'vi' ? 'điểm' : 'pts'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormPoints((prev) => (Number(prev) || 0) + 1)}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-500 flex items-center justify-center transition active:scale-90 shrink-0 cursor-pointer"
                            title="Tăng 1 điểm"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>
                      </>
                    ) : formType === 'deduct' ? (
                      <>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs sm:text-[13px] font-bold text-[#061651] block">
                            {language === 'vi' ? 'Mức điểm trừ:' : 'Penalty Points:'} <span className="text-rose-500">*</span>
                          </label>
                          <div className="flex items-center gap-1">
                            {[-1, -2, -3, -5].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setFormPoints(preset)}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                                  Number(formPoints) === preset
                                    ? 'bg-rose-600 text-white shadow-2xs'
                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                                }`}
                              >
                                {preset}đ
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-2.5 py-2 sm:py-2.5 shadow-2xs focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/15 transition">
                          <button
                            type="button"
                            onClick={() => setFormPoints((prev) => -Math.abs(Math.min(-1, (Number(prev) || -1) - 1)))}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 flex items-center justify-center transition active:scale-90 shrink-0 cursor-pointer"
                            title="Trừ thêm 1 điểm"
                          >
                            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          <div className="flex-1 flex items-center justify-center gap-1 px-1">
                            <input
                              type="number"
                              step="1"
                              max="-1"
                              value={formPoints}
                              onChange={(e) => {
                                const val = Number(e.target.value)
                                setFormPoints(val > 0 ? -val : val)
                              }}
                              className="w-14 text-center text-xs sm:text-[13px] font-extrabold text-rose-600 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              required
                            />
                            <span className="text-[11px] sm:text-xs font-bold text-slate-400 select-none">
                              {language === 'vi' ? 'điểm' : 'pts'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormPoints((prev) => {
                              const cur = Number(prev) || -1
                              return cur < -1 ? cur + 1 : -1
                            })}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-500 flex items-center justify-center transition active:scale-90 shrink-0 cursor-pointer"
                            title="Bớt trừ 1 điểm"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs sm:text-[13px] font-bold text-[#061651] block">
                            {language === 'vi' ? 'Quy chuẩn điểm:' : 'Point Standard:'} <span className="text-rose-500">*</span>
                          </label>
                          <div className="flex items-center gap-1">
                            {['Quy chuẩn', '0 - 100', 'Kỷ luật'].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setFormPoints(preset)}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                                  formPoints === preset
                                    ? 'bg-[#7026ED] text-white shadow-2xs'
                                    : 'bg-purple-50 hover:bg-purple-100 text-[#7026ED]'
                                }`}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>
                        <input
                          type="text"
                          value={formPoints}
                          onChange={(e) => setFormPoints(e.target.value)}
                          placeholder="VD: 0, 60, Quy chuẩn..."
                          className="w-full bg-white hover:border-[#7026ED]/60 focus:bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] font-bold text-[#061651] focus:outline-none focus:border-[#7026ED] focus:ring-2 focus:ring-[#7026ED]/15 transition shadow-2xs"
                          required
                        />
                      </>
                    )}
                    <p className="text-[10.5px] text-slate-400 mt-1 font-medium">
                      {formType === 'add'
                        ? (language === 'vi' ? 'Điểm thưởng khi hoàn thành xuất sắc' : 'Bonus points for outstanding contribution')
                        : formType === 'deduct'
                        ? (language === 'vi' ? 'Điểm trừ căn cứ theo mức độ vi phạm' : 'Penalty points based on violation severity')
                        : (language === 'vi' ? 'Mốc điểm hoặc định mức nguyên tắc' : 'Standard score milestone or principle')}
                    </p>
                  </div>
                </div>

                {/* 3. Tên nội dung tiêu chí */}
                <div>
                  <label className="text-xs sm:text-[13px] font-bold text-[#061651] block mb-1.5">
                    {language === 'vi' ? 'Tên nội dung quy định / tiêu chí:' : 'Rule / Criterion Title:'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={language === 'vi' ? 'VD: Đại diện CLB tham gia Hội thảo cấp ĐHQGHN' : 'e.g. Represent club at VNU-level workshop'}
                    className="w-full bg-white hover:border-[#7026ED]/60 focus:bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] font-semibold text-[#061651] placeholder:text-slate-400 focus:outline-none focus:border-[#7026ED] focus:ring-2 focus:ring-[#7026ED]/15 transition shadow-2xs"
                    required
                  />
                </div>

                {/* 4. Danh mục */}
                <div>
                  <label className="text-xs sm:text-[13px] font-bold text-[#061651] block mb-1.5">
                    {language === 'vi' ? 'Danh mục phân loại:' : 'Category Classification:'}
                  </label>
                  <div className="relative">
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full appearance-none bg-white hover:border-[#7026ED]/60 focus:bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 pr-10 text-xs sm:text-[13px] font-semibold text-[#061651] focus:outline-none focus:border-[#7026ED] focus:ring-2 focus:ring-[#7026ED]/15 transition shadow-2xs cursor-pointer"
                    >
                      <option value="Nhiệm vụ & Tiến độ">{language === 'vi' ? 'Nhiệm vụ & Tiến độ' : 'Tasks & Progress'}</option>
                      <option value="Tương tác & Mạng xã hội">{language === 'vi' ? 'Tương tác & Mạng xã hội' : 'Social & Interaction'}</option>
                      <option value="Kỷ luật & Deadline">{language === 'vi' ? 'Kỷ luật & Deadline' : 'Discipline & Deadlines'}</option>
                      <option value="Họp & Kỷ luật">{language === 'vi' ? 'Họp & Kỷ luật' : 'Meetings & Attendance'}</option>
                      <option value="Đối ngoại & Sự kiện">{language === 'vi' ? 'Đối ngoại & Sự kiện' : 'External Affairs & Events'}</option>
                      <option value="Khen thưởng & Đóng góp">{language === 'vi' ? 'Khen thưởng & Đóng góp' : 'Awards & Contributions'}</option>
                      <option value="Nguyên tắc vận hành">{language === 'vi' ? 'Nguyên tắc vận hành' : 'Operational Principles'}</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* 5. Điều kiện áp dụng & Chi tiết */}
                <div>
                  <label className="text-xs sm:text-[13px] font-bold text-[#061651] block mb-1.5">
                    {language === 'vi' ? 'Điều kiện áp dụng & Minh chứng yêu cầu:' : 'Conditions & Required Proof:'}
                  </label>
                  <textarea
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value)}
                    placeholder={language === 'vi' ? 'Mô tả cụ thể trường hợp áp dụng, căn cứ xét điểm, thời hạn nộp hoặc minh chứng cần có...' : 'Describe specific case, scoring basis, submission deadline or required evidence...'}
                    rows={3}
                    className="w-full bg-white hover:border-[#7026ED]/60 focus:bg-white border border-slate-200 rounded-2xl p-3 text-xs sm:text-[13px] font-medium text-[#061651] placeholder:text-slate-400 focus:outline-none focus:border-[#7026ED] focus:ring-2 focus:ring-[#7026ED]/15 transition shadow-2xs leading-relaxed resize-none"
                  />
                </div>

                {/* 6. Tùy chọn nâng cao */}
                <div className="p-3.5 sm:p-4 bg-purple-50/60 rounded-2xl border border-purple-200/80 space-y-2.5">
                  <span className="font-bold text-[#061651] block text-xs sm:text-[12.5px] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#7026ED]" />
                    <span>{language === 'vi' ? 'Tùy chọn cơ chế CLB:' : 'Club Mechanism Options:'}</span>
                  </span>

                  {formType === 'deduct' && (
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={formCoreMultiplier}
                        onChange={(e) => setFormCoreMultiplier(e.target.checked)}
                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-white border-slate-300 mt-0.5 cursor-pointer"
                      />
                      <span>
                        {language === 'vi' ? (
                          <>Áp dụng chế tài <strong className="text-rose-700 font-bold">phạt gấp đôi (×2)</strong> cho Core Team</>
                        ) : (
                          <>Apply <strong className="text-rose-700 font-bold">double penalty (×2)</strong> for Core Team</>
                        )}
                      </span>
                    </label>
                  )}

                  {formType === 'add' && (
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={formMonthlyCap}
                        onChange={(e) => setFormMonthlyCap(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-white border-slate-300 mt-0.5 cursor-pointer"
                      />
                      <span>
                        {language === 'vi' ? (
                          <>Tính vào <strong className="text-emerald-700 font-bold">điểm tương tác tối đa 15 điểm/tháng</strong> (tránh cày điểm ảo)</>
                        ) : (
                          <>Count towards <strong className="text-emerald-700 font-bold">monthly 15-point interaction cap</strong> (anti-farming)</>
                        )}
                      </span>
                    </label>
                  )}

                  <div className="text-[11px] text-slate-600 font-medium bg-white/80 p-2.5 rounded-xl border border-purple-200/60 leading-relaxed">
                    {language === 'vi' ? (
                      <>Sau khi thêm, quy định này sẽ ngay lập tức xuất hiện trong mục <strong>Chấm điểm & Duyệt</strong> để Ban Nhân sự và Ban Chủ nhiệm áp dụng.</>
                    ) : (
                      <>Once added, this rule will immediately become available in <strong>Scoring & Approval</strong> for HR and Exec Board.</>
                    )}
                  </div>
                </div>
              </div>

              {/* Sticky Modal Footer Action Buttons */}
              <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-white/95 backdrop-blur-xs flex items-center gap-2.5 sm:gap-3 sm:justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-[13px] text-center transition active:scale-95 cursor-pointer shadow-2xs"
                >
                  {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-2xl text-xs sm:text-[13px] font-bold text-white bg-[#7026ED] hover:bg-[#621fde] text-center shadow-sm shadow-[#7026ED]/25 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{language === 'vi' ? 'Lưu Quy Định CLB' : 'Save Club Regulation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
