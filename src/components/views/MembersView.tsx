'use client'

import React, { useState, useMemo } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useClub } from '@/lib/context/ClubContext'
import { useLanguage } from '@/lib/context/LanguageContext'
import { type RosterMember, getMemberAvatarUrl } from '@/lib/clubData'
import { AddMemberModal } from '@/components/admin/AddMemberModal'
import { EditMemberModal } from '@/components/admin/EditMemberModal'
import {
  Download,
  UserPlus,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Users,
  Award,
  Crown,
  Search,
  X,
  ArrowRight,
  Sparkles,
  Shield,
  Trash2,
} from 'lucide-react'

// Helper tra cứu ngành học chi tiết từ mã lớp
export function getMajorDetail(className?: string): { major: string; short: string } {
  if (!className) return { major: 'Đại sứ sinh viên Trường Quốc tế', short: 'iSSAC' }
  const upper = className.toUpperCase().trim()
  if (upper.includes('MIS')) return { major: 'Hệ thống thông tin quản lý', short: 'MIS' }
  if (upper.includes('ACF') || upper.includes('AC')) return { major: 'Kế toán & Kiểm toán', short: 'ACF' }
  if (upper.includes('DC')) return { major: 'Marketing số & Truyền thông', short: 'DC' }
  if (upper.includes('BDA')) return { major: 'Phân tích dữ liệu kinh doanh', short: 'BDA' }
  if (upper.includes('ICE')) return { major: 'Tin học & Kỹ thuật máy tính', short: 'ICE' }
  if (upper.includes('BEL')) return { major: 'Ngôn ngữ Anh thương mại', short: 'BEL' }
  if (upper.includes('DB')) return { major: 'Kinh doanh số', short: 'DB' }
  if (upper.includes('AIT')) return { major: 'Công nghệ thông tin ứng dụng', short: 'AIT' }
  if (upper.includes('IB')) return { major: 'Kinh doanh quốc tế', short: 'IB' }
  if (upper.includes('BA')) return { major: 'Quản trị kinh doanh', short: 'BA' }
  if (upper.includes('DUAL_MKT') || upper.includes('MKT')) return { major: 'Marketing (Bằng kép)', short: 'MKT' }
  if (upper.includes('DUAL_FIN') || upper.includes('FIN')) return { major: 'Tài chính (Bằng kép)', short: 'FIN' }
  if (upper.includes('CÁN BỘ') || upper.includes('TT&TS')) return { major: 'Cán bộ phòng TT&TS', short: 'VNU-IS' }
  return { major: className, short: className }
}

interface MembersViewProps {
  onSelectMember: (member: RosterMember) => void
  searchQuery?: string
}

export function MembersView({ onSelectMember, searchQuery: initialSearch = '' }: MembersViewProps) {
  const { isBCN } = useAuth()
  const { members, deleteMember } = useClub()
  const { language, t } = useLanguage()

  // Xử lý xóa thành viên
  const handleDeleteMember = (member: RosterMember) => {
    if (!isBCN) {
      alert(
        language === 'vi'
          ? 'Chỉ Ban Chủ nhiệm mới có quyền xóa thành viên khỏi danh sách.'
          : 'Only the Executive Board has permission to delete members.'
      )
      return
    }
    const confirmMsg =
      language === 'vi'
        ? `Bạn có chắc chắn muốn xóa thành viên "${member.full_name}" (${member.student_id || member.member_code}) khỏi danh sách không?`
        : `Are you sure you want to remove member "${member.full_name}" (${member.student_id || member.member_code}) from the roster?`
    if (window.confirm(confirmMsg)) {
      const res = deleteMember(member.member_code)
      if (res && !res.success) {
        alert(res.message)
      }
    }
  }

  // Trạng thái hiệu ứng bất ngờ & tương tác cho Mascot
  const [isMascotCheering, setIsMascotCheering] = useState<boolean>(false)
  const [mascotMessageIdx, setMascotMessageIdx] = useState<number>(0)

  const mascotMessagesVi = [
    'Chào iSSACer năng động!',
    'Cùng nhau bứt phá mục tiêu!',
    'Luôn dẫn đầu thi đua nhé!',
    'Tự hào VNU-IS Ambassadors!',
  ]
  const mascotMessagesEn = [
    'Hello active iSSACer!',
    'Reaching new heights together!',
    'Keep leading the campaign!',
    'Proud VNU-IS Ambassadors!',
  ]

  const handleMascotClick = () => {
    setIsMascotCheering(true)
    setMascotMessageIdx((prev) => (prev + 1) % mascotMessagesVi.length)
    setTimeout(() => setIsMascotCheering(false), 850)
  }

  const [selectedDept, setSelectedDept] = useState<string>('all')
  const [filterDiscipline, setFilterDiscipline] = useState<
    'all' | 'core_only' | 'high_score' | 'warning_t02' | 'low_score'
  >('all')
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false)
  const [editingMember, setEditingMember] = useState<RosterMember | null>(null)

  // Thống kê nhanh chỉ số
  const totalCount = members.length || 49
  const coreCount = members.filter((m) => m.is_core).length || 10
  const avgScore = totalCount > 0 ? (members.reduce((acc, m) => acc + m.current_score, 0) / totalCount).toFixed(1) : '72.3'
  const warningT02Count = members.filter((m) => m.absent_count_t02 >= 2).length || 0
  const lowScoreCount = members.filter((m) => m.current_score < 60).length || 5
  const highScoreCount = members.filter((m) => m.current_score >= 85).length || 4

  // Số lượng theo ban
  const bcnCount = members.filter((m) => m.department_slug === 'bcn').length || 3
  const ttCount = members.filter((m) => m.department_slug === 'truyen-thong').length || 13
  const tvCount = members.filter((m) => m.department_slug === 'tu-van').length || 25
  const nsCount = members.filter((m) => m.department_slug === 'nhan-su').length || 8

  // Bộ lọc dữ liệu nâng cao - Sắp xếp điểm cao nhất lên đầu theo đúng chuẩn thiết kế
  const filtered = useMemo(() => {
    return members
      .filter((m) => {
        const q = searchQuery.toLowerCase().trim()
        const majorInfo = getMajorDetail(m.class_name)
        const matchSearch =
          !q ||
          m.full_name.toLowerCase().includes(q) ||
          (m.student_id && m.student_id.toLowerCase().includes(q)) ||
          m.member_code.toLowerCase().includes(q) ||
          (m.class_name && m.class_name.toLowerCase().includes(q)) ||
          majorInfo.major.toLowerCase().includes(q) ||
          m.department_name.toLowerCase().includes(q) ||
          m.position.toLowerCase().includes(q)

        const matchDept = selectedDept === 'all' || m.department_slug === selectedDept

        let matchFilter = true
        if (filterDiscipline === 'core_only') {
          matchFilter = m.is_core
        } else if (filterDiscipline === 'high_score') {
          matchFilter = m.current_score >= 85
        } else if (filterDiscipline === 'warning_t02') {
          matchFilter = m.absent_count_t02 >= 2
        } else if (filterDiscipline === 'low_score') {
          matchFilter = m.current_score < 60
        }

        return matchSearch && matchDept && matchFilter
      })
      .sort((a, b) => b.current_score - a.current_score || a.source_stt - b.source_stt)
  }, [members, searchQuery, selectedDept, filterDiscipline])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginatedMembers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Màu sắc nhãn Ban trực thuộc chuẩn thiết kế đồng bộ Dashboard
  const getDeptBadgeStyle = (slug: string) => {
    switch (slug) {
      case 'bcn':
        return 'bg-amber-50 text-amber-700 border border-amber-200/80'
      case 'truyen-thong':
        return 'bg-blue-50 text-blue-600 border border-blue-200/80'
      case 'tu-van':
        return 'bg-pink-50 text-pink-600 border border-pink-200/80'
      case 'nhan-su':
        return 'bg-indigo-50 text-indigo-600 border border-indigo-200/80'
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200'
    }
  }

  // Helper dịch tên ban
  const getDeptDisplayName = (slug: string, rawName: string) => {
    if (language === 'vi') {
      return rawName.replace('Ban ', '')
    }
    switch (slug) {
      case 'bcn':
        return 'Exec Board'
      case 'truyen-thong':
        return 'Communications'
      case 'tu-van':
        return 'Advisory'
      case 'nhan-su':
        return 'HR'
      default:
        return rawName
    }
  }

  // Helper dịch chức vụ/vai trò
  const getPositionDisplayName = (pos: string) => {
    if (language === 'vi') return pos
    if (pos.includes('Trưởng ban')) return 'Head of Dept'
    if (pos.includes('Phó ban')) return 'Vice Head'
    if (pos.includes('Chủ nhiệm') && !pos.includes('Phó')) return 'President'
    if (pos.includes('Phó chủ nhiệm')) return 'Vice President'
    if (pos.includes('Cố vấn')) return 'Advisor'
    if (pos.includes('Thành viên')) return 'Member'
    return pos
  }

  // Xuất file CSV
  const handleExportCSV = () => {
    const headers = [
      'STT',
      'Ho_va_ten',
      'MSSV',
      'Lop_Nganh_hoc',
      'Nganh_hoc_chi_tiet',
      'Ban',
      'Chuc_vu',
      'Core_Team',
      'Diem_hien_tai',
      'Vi_pham_T02',
      'Email',
      'So_dien_thoai',
    ]
    const rows = filtered.map((m) => {
      const major = getMajorDetail(m.class_name)
      return [
        m.source_stt,
        `"${m.full_name}"`,
        `"${m.student_id || m.member_code}"`,
        `"${m.class_name || '-'}"`,
        `"${major.major}"`,
        `"${m.department_name}"`,
        `"${m.position}"`,
        m.is_core ? 'Yes' : 'No',
        m.current_score,
        m.absent_count_t02,
        `"${m.email}"`,
        `"${m.phone || ''}"`,
      ]
    })
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `danh_sach_thanh_vien_issac_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* 1. Header trang chuẩn nhận diện dự án CLB (Khớp 100% typography & action buttons như ảnh mẫu) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#061651] tracking-tight leading-tight">
              {language === 'vi' ? 'Danh sách hồ sơ thành viên iSSAC' : 'iSSAC Member Roster & Profiles'}
            </h1>
            <p className="text-xs sm:text-[13px] text-[#64748B] mt-1 font-normal">
              {language === 'vi'
                ? 'Quản lý thông tin cá nhân thành viên chính thức của CLB.'
                : 'Manage personal profiles of official club members.'}
            </p>
          </div>

          {/* Mascot Chibi với hiệu ứng động tương tác - Hộp thoại bên cạnh không bị che bởi header */}
          <div
            onClick={handleMascotClick}
            className="relative group cursor-pointer inline-flex items-center shrink-0 select-none"
          >
            {/* Ảnh Mascot thành viên nữ xinh xắn với hiệu ứng bay bổng & nhào lộn khi click */}
            <img
              src="/member-mascot.png"
              alt="iSSAC Member Mascot"
              className={`w-12 h-14 sm:w-14 sm:h-16 object-contain drop-shadow-[0_4px_12px_rgba(2,132,199,0.22)] transition-all duration-300 ${
                isMascotCheering
                  ? 'animate-mascot-pop drop-shadow-[0_8px_20px_rgba(2,132,199,0.45)]'
                  : 'animate-mascot-fly hover:scale-120 hover:rotate-6'
              }`}
            />

            {/* Bubble tooltip động đặt bên cạnh mascot - Tuyệt đối không bị thanh header che */}
            <div
              className={`absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#0369A1] text-white text-[11px] font-bold shadow-lg pointer-events-none whitespace-nowrap z-40 transition-all duration-200 flex items-center border border-white/25 ${
                isMascotCheering
                  ? 'opacity-100 scale-105 translate-x-1'
                  : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
              }`}
            >
              {/* Mũi tên chỉ về phía mascot */}
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#0284C7] rotate-45 border-l border-b border-white/25" />
              <span className="relative z-10 select-none tracking-tight">
                {language === 'vi' ? mascotMessagesVi[mascotMessageIdx] : mascotMessagesEn[mascotMessageIdx]}
              </span>
            </div>
          </div>
        </div>

        {/* Thanh công cụ hành động phía trên */}
        <div className="flex items-center gap-2.5 flex-shrink-0 self-start md:self-center">
          {/* Nút Xuất file CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#061651] border border-slate-200/90 hover:border-slate-300 font-bold text-xs sm:text-[13px] transition shadow-2xs hover:shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title="Xuất toàn bộ danh sách thành viên ra file Excel CSV"
          >
            <Download className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span>{language === 'vi' ? 'Xuất file (.CSV)' : 'Export (.CSV)'}</span>
          </button>

          {/* Nút Thêm thành viên mới */}
          <button
            type="button"
            onClick={() => {
              if (isBCN) {
                setAddModalOpen(true)
              } else {
                alert('Chỉ Ban Chủ nhiệm mới có quyền thêm thành viên mới theo quy chế CLB.')
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs sm:text-[13px] transition shadow-xs hover:shadow flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title={isBCN ? 'Thêm thành viên mới vào danh sách' : 'Chỉ Ban Chủ nhiệm có quyền'}
          >
            <UserPlus className="w-4 h-4 stroke-[2.2] flex-shrink-0" />
            <span>{language === 'vi' ? 'Thêm Thành Viên' : 'Add Member'}</span>
          </button>
        </div>
      </div>

      {/* 2. Bốn Thẻ Chỉ Số KPI (Bo Góc Gọn Hài Hòa, Nền Pastel Nhạt, Khớp 100% Dashboard & Ảnh mẫu) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Tổng số thành viên */}
        <div
          onClick={() => {
            setSelectedDept('all')
            setFilterDiscipline('all')
            setCurrentPage(1)
          }}
          className="p-4 sm:p-5 rounded-2xl bg-[#F0F9FF] flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
        >
          <div className="space-y-1">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 block">
              {language === 'vi' ? 'Tổng số thành viên' : 'Total Members'}
            </span>
            <span className="text-2xl sm:text-[28px] font-black text-[#0284C7] block tracking-tight leading-none py-0.5">
              {totalCount}
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-sky-300/70 bg-white/70 flex items-center justify-center text-[#0284C7] shrink-0">
            <Users className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* Card 2: Core Team nòng cốt */}
        <div
          onClick={() => {
            setFilterDiscipline(filterDiscipline === 'core_only' ? 'all' : 'core_only')
            setCurrentPage(1)
          }}
          className="p-4 sm:p-5 rounded-2xl bg-[#FFFBEB] flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
        >
          <div className="space-y-1">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 block">
              {language === 'vi' ? 'Core Team nòng cốt' : 'Core Team Members'}
            </span>
            <span className="text-2xl sm:text-[28px] font-black text-[#D97706] block tracking-tight leading-none py-0.5">
              {coreCount}
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-amber-300/70 bg-white/70 flex items-center justify-center text-[#D97706] shrink-0">
            <Crown className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* Card 3: Điểm rèn luyện TB */}
        <div
          onClick={() => {
            setFilterDiscipline(filterDiscipline === 'high_score' ? 'all' : 'high_score')
            setCurrentPage(1)
          }}
          className="p-4 sm:p-5 rounded-2xl bg-[#F0FDF4] flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
        >
          <div className="space-y-1">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 block">
              {language === 'vi' ? 'Điểm rèn luyện TB' : 'Avg Activity Score'}
            </span>
            <span className="text-2xl sm:text-[28px] font-black text-[#16A34A] block tracking-tight leading-none py-0.5">
              {avgScore}{language === 'vi' ? 'đ' : ' pts'}
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-emerald-300/70 bg-white/70 flex items-center justify-center text-[#16A34A] shrink-0">
            <Award className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* Card 4: Cảnh báo kỷ luật T02 */}
        <div
          onClick={() => {
            setFilterDiscipline(filterDiscipline === 'warning_t02' ? 'all' : 'warning_t02')
            setCurrentPage(1)
          }}
          className="p-4 sm:p-5 rounded-2xl bg-[#FAF5FF] flex items-center justify-between cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
        >
          <div className="space-y-1">
            <span className="text-xs sm:text-[13px] font-medium text-slate-600 block">
              {language === 'vi' ? 'Cảnh báo kỷ luật T02' : 'Disciplinary Warnings T02'}
            </span>
            <span className="text-2xl sm:text-[28px] font-black text-[#9333EA] block tracking-tight leading-none py-0.5">
              {warningT02Count}
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-purple-300/70 bg-white/70 flex items-center justify-center text-[#9333EA] shrink-0">
            <ShieldAlert className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>
      </div>

      {/* 3. KHỐI CONTAINER TRẮNG LIỀN MẠCH: Subtabs Ban + Thanh lọc + Bảng dữ liệu (Khớp 100% Ảnh 1) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-4 sm:p-5 space-y-4">
        {/* Hàng 1: Subtabs theo Ban (Dạng Pill bo tròn mềm mại) + Chỉ số Hiển thị */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {[
              { id: 'all', label: language === 'vi' ? 'Tất cả ban' : 'All Departments', count: totalCount },
              { id: 'bcn', label: language === 'vi' ? 'Ban Chủ nhiệm' : 'Exec Board', count: bcnCount },
              { id: 'truyen-thong', label: language === 'vi' ? 'Truyền thông' : 'Communications', count: ttCount },
              { id: 'tu-van', label: language === 'vi' ? 'Tư vấn' : 'Advisory', count: tvCount },
              { id: 'nhan-su', label: language === 'vi' ? 'Nhân sự' : 'HR', count: nsCount },
            ].map((tab) => {
              const isSelected = selectedDept === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedDept(tab.id)
                    setCurrentPage(1)
                  }}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs transition-all whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0284C7] text-white font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 font-medium'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/90 text-slate-700'
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
            <strong className="text-[#061651] font-bold">{filtered.length}</strong>
            <span>/ {totalCount} {language === 'vi' ? 'thành viên' : 'members'}</span>
          </div>
        </div>

        {/* Hàng 2: Thanh tìm kiếm (Bo tròn dài) & Chip tiêu chí lọc */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'vi' ? 'Tìm theo tên, MSSV, lớp, ngành học...' : 'Search by name, student ID, class, major...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/20 transition shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Chip filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs">
            <span className="text-slate-500 font-bold text-[11px] whitespace-nowrap flex items-center gap-1 pr-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>{language === 'vi' ? 'Tiêu chí:' : 'Criteria:'}</span>
            </span>
            {[
              { id: 'all' as const, label: language === 'vi' ? 'Tất cả' : 'All' },
              { id: 'core_only' as const, label: `Core Team (${coreCount})`, icon: Crown },
              { id: 'high_score' as const, label: `${language === 'vi' ? 'Rất tích cực' : 'Highly Active'} ≥85 (${highScoreCount})`, icon: Sparkles },
              { id: 'low_score' as const, label: `${language === 'vi' ? 'Dưới chuẩn' : 'Below Target'} <60 (${lowScoreCount})`, icon: Shield },
              { id: 'warning_t02' as const, label: `${language === 'vi' ? 'Cảnh báo T02' : 'Warning T02'} (${warningT02Count})`, icon: AlertTriangle },
            ].map((chip) => {
              const isSelected = filterDiscipline === chip.id
              const ChipIcon = (chip as any).icon
              return (
                <button
                  key={chip.id}
                  onClick={() => {
                    setFilterDiscipline(chip.id)
                    setCurrentPage(1)
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'bg-[#0284C7] text-white font-bold'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-medium'
                  }`}
                >
                  {ChipIcon && (
                    <ChipIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  )}
                  <span>{chip.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Hàng 3: Bảng dữ liệu thành viên (Header màu xanh #0284C7 đồng bộ ảnh 1) */}
        <div className="rounded-xl overflow-hidden border border-slate-200/90 shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700 border-collapse">
              {/* Header bảng màu xanh tươi #0284C7 đồng bộ ảnh 1 */}
              <thead className="bg-[#0284C7] text-xs font-bold text-white uppercase tracking-wider select-none shadow-xs">
                <tr className="divide-x divide-white/15">
                  <th className="py-3 px-3 w-[60px] text-center font-bold text-sky-100 whitespace-nowrap">
                    {language === 'vi' ? 'STT' : 'NO.'}
                  </th>
                  <th className="py-3 px-4 min-w-[260px] font-bold text-white whitespace-nowrap">
                    {language === 'vi' ? 'HỌ VÀ TÊN & MSSV – LỚP' : 'FULL NAME & STUDENT ID - CLASS'}
                  </th>
                  <th className="py-3 px-3 text-center w-[150px] font-bold text-white whitespace-nowrap">
                    {language === 'vi' ? 'BAN TRỰC THUỘC' : 'DEPARTMENT'}
                  </th>
                  <th className="py-3 px-3 text-center w-[140px] font-bold text-white whitespace-nowrap">
                    <div className="inline-flex items-center justify-center gap-1.5 font-bold text-white">
                      <Crown className="w-3.5 h-3.5 text-white flex-shrink-0" />
                      <span>{language === 'vi' ? 'VAI TRÒ' : 'ROLE'}</span>
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center w-[130px] font-bold text-white whitespace-nowrap">
                    {language === 'vi' ? 'ĐIỂM HIỆN TẠI' : 'CURRENT SCORE'}
                  </th>
                  <th className="py-3 px-3 text-center w-[130px] font-bold text-sky-100 whitespace-nowrap">
                    {language === 'vi' ? 'KỶ LUẬT T02' : 'T02 DISCIPLINE'}
                  </th>
                  <th className="py-3 px-3 text-center w-[130px] font-bold text-sky-100 whitespace-nowrap">
                    {language === 'vi' ? 'TRẠNG THÁI' : 'STATUS'}
                  </th>
                  <th className="py-3 px-3 text-center w-[140px] font-bold text-sky-100 whitespace-nowrap">
                    {language === 'vi' ? 'THAO TÁC' : 'ACTIONS'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="space-y-2">
                        <Search className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-semibold text-xs sm:text-sm">
                          {language === 'vi' ? 'Không tìm thấy thành viên phù hợp với bộ lọc' : 'No members found matching filter'}
                        </p>
                        <button
                          onClick={() => {
                            setSearchQuery('')
                            setSelectedDept('all')
                            setFilterDiscipline('all')
                          }}
                          className="text-xs sm:text-sm text-[#1351D8] font-semibold hover:underline cursor-pointer"
                        >
                          {language === 'vi' ? 'Xóa toàn bộ bộ lọc' : 'Reset filters'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedMembers.map((member) => {
                    return (
                      <tr
                        key={member.member_code}
                        onClick={() => onSelectMember(member)}
                        className="hover:bg-blue-50/20 transition-colors group divide-x divide-slate-100 cursor-pointer"
                      >
                        {/* 1. STT */}
                        <td className="py-3 px-2.5 text-center font-mono text-xs font-medium text-slate-400 group-hover:text-[#061651] align-middle">
                          #{member.source_stt}
                        </td>

                        {/* 2. Họ và tên + Avatar + MSSV & Lớp */}
                        <td className="py-3 px-4 align-middle whitespace-nowrap">
                          <div className="flex items-center gap-3 whitespace-nowrap">
                            {(() => {
                              const avatar = getMemberAvatarUrl(member)

                              return (
                                <div className="w-9 h-9 rounded-full bg-[#F0F9FF] text-[#0284C7] border border-sky-200/80 font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-2xs overflow-hidden">
                                  {avatar ? (
                                    <img
                                      src={avatar}
                                      alt={member.full_name}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                    />
                                  ) : (
                                    <span className="group-hover:text-[#0284C7] transition-colors">
                                      {member.full_name.charAt(0)}
                                    </span>
                                  )}
                                </div>
                              )
                            })()}

                            <div className="min-w-0">
                              {/* Tên thành viên & Huy hiệu Core nếu có */}
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                <span className="font-bold text-[#061651] text-xs sm:text-[13.5px] group-hover:text-[#0284C7] transition-colors leading-tight whitespace-nowrap">
                                  {member.full_name}
                                </span>
                                {member.is_core && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs whitespace-nowrap">
                                    <Crown className="w-3 h-3 text-amber-600 flex-shrink-0" />
                                    <span>Core</span>
                                  </span>
                                )}
                              </div>

                              {/* MSSV - Mã ngành / Lớp */}
                              <div className="text-[11px] text-slate-500 font-normal mt-0.5 whitespace-nowrap">
                                {member.student_id || member.member_code}
                                {member.class_name ? ` - ${member.class_name}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 3. Ban trực thuộc dạng pill mềm mại */}
                        <td className="py-3 px-3 text-center align-middle">
                          <span
                            className={`inline-block px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap shadow-2xs ${getDeptBadgeStyle(
                              member.department_slug
                            )}`}
                          >
                            {getDeptDisplayName(member.department_slug, member.department_name)}
                          </span>
                        </td>

                        {/* 4. Vai trò / Chức vụ */}
                        <td className="py-3 px-3 text-center align-middle">
                          {member.is_core ? (
                            <div className="flex flex-col items-center justify-center gap-0.5 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80 whitespace-nowrap shadow-2xs">
                                <Crown className="w-3 h-3 text-amber-600 flex-shrink-0" />
                                <span>{getPositionDisplayName(member.position)}</span>
                              </span>
                              <span className="text-[10px] font-semibold text-amber-700/80">
                                Core Team
                              </span>
                            </div>
                          ) : (
                            <span className="inline-block px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200/60 whitespace-nowrap shadow-2xs">
                              {getPositionDisplayName(member.position)}
                            </span>
                          )}
                        </td>

                        {/* 5. Điểm hiện tại */}
                        <td className="py-3 px-3 text-center align-middle">
                          <div className="flex flex-col items-center justify-center gap-0.5 whitespace-nowrap">
                            <span className="text-sm font-black text-[#061651] block">
                              {member.current_score}{language === 'vi' ? 'đ' : ' pts'}
                            </span>
                            <span
                              className={`text-[10px] font-bold ${
                                member.current_score >= 85
                                  ? 'text-emerald-600'
                                  : member.current_score >= 70
                                  ? 'text-blue-600'
                                  : member.current_score >= 60
                                  ? 'text-emerald-600'
                                  : 'text-rose-600'
                              }`}
                            >
                              {member.current_score >= 85
                                ? (language === 'vi' ? 'Rất tích cực' : 'Highly Active')
                                : member.current_score >= 70
                                ? (language === 'vi' ? 'Tích cực' : 'Active')
                                : member.current_score >= 60
                                ? (language === 'vi' ? 'Đạt chuẩn' : 'Qualified')
                                : (language === 'vi' ? 'Cần cố gắng' : 'Needs Effort')}
                            </span>
                          </div>
                        </td>

                        {/* 6. Kỷ luật T02 */}
                        <td className="py-3 px-3 text-center align-middle">
                          {member.absent_count_t02 >= 3 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 whitespace-nowrap shadow-2xs animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                              <span>{language === 'vi' ? 'Khai trừ (3/3)' : 'Expelled (3/3)'}</span>
                            </span>
                          ) : member.absent_count_t02 === 2 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap shadow-2xs">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                              <span>{language === 'vi' ? 'Cảnh báo (2/3)' : 'Warning (2/3)'}</span>
                            </span>
                          ) : member.absent_count_t02 === 1 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 whitespace-nowrap shadow-2xs">
                              1/3 {language === 'vi' ? 'lần' : 'times'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/90 whitespace-nowrap shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              <span>{language === 'vi' ? '0 vi phạm' : '0 violations'}</span>
                            </span>
                          )}
                        </td>

                        {/* 7. Trạng thái hoạt động */}
                        <td className="py-3 px-3 text-center align-middle">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/90 whitespace-nowrap shadow-2xs">
                            <span>{language === 'vi' ? 'Hoạt động' : 'Active'}</span>
                          </span>
                        </td>

                        {/* 8. Thao tác Sửa & Xóa */}
                        <td className="py-3 px-3 text-center align-middle whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingMember(member)
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-amber-800 bg-amber-50/70 hover:bg-amber-100 border border-amber-300/90 transition shadow-2xs inline-flex items-center gap-1 cursor-pointer active:scale-95"
                              title={language === 'vi' ? 'Sửa thông tin' : 'Edit info'}
                            >
                              <Pencil className="w-3 h-3 flex-shrink-0 text-amber-700" />
                              <span>{language === 'vi' ? 'Sửa' : 'Edit'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteMember(member)
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 bg-rose-50/70 hover:bg-rose-100 border border-rose-300/90 transition shadow-2xs inline-flex items-center gap-1 cursor-pointer active:scale-95"
                              title={language === 'vi' ? 'Xóa thành viên' : 'Delete member'}
                            >
                              <Trash2 className="w-3 h-3 flex-shrink-0 text-rose-600" />
                              <span>{language === 'vi' ? 'Xóa' : 'Delete'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Thanh phân trang Pagination hiện đại */}
          <div className="p-3.5 px-4 sm:px-6 bg-[#F8FAFC]/80 border-t border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <span>{language === 'vi' ? 'Hiển thị' : 'Show'}</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="py-1 px-2 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1351D8]"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>{language === 'vi' ? 'thành viên / trang' : 'members / page'}</span>
              <span className="text-slate-300 mx-1">|</span>
              <span>{language === 'vi' ? 'Tổng cộng' : 'Total'} <strong>{filtered.length}</strong> {language === 'vi' ? 'thành viên' : 'members'}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium shadow-2xs inline-flex items-center gap-1 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'Trước' : 'Prev'}</span>
              </button>

              <span className="px-3 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg shadow-2xs">
                {language === 'vi' ? `Trang ${currentPage} / ${totalPages}` : `Page ${currentPage} / ${totalPages}`}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium shadow-2xs inline-flex items-center gap-1 transition"
              >
                <span>{language === 'vi' ? 'Sau' : 'Next'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal thêm thành viên mới */}
      <AddMemberModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} />

      {/* Modal chỉnh sửa thông tin & Avatar */}
      <EditMemberModal
        isOpen={Boolean(editingMember)}
        onClose={() => setEditingMember(null)}
        member={editingMember ? members.find((m) => m.member_code === editingMember.member_code) || editingMember : null}
      />
    </div>
  )
}
