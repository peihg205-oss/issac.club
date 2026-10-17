'use client'

import React, { useState, useMemo } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useClub } from '@/lib/context/ClubContext'
import type { RosterMember } from '@/lib/clubData'
import { AddMemberModal } from '@/components/admin/AddMemberModal'
import { EditMemberModal } from '@/components/admin/EditMemberModal'
import {
  Download,
  Plus,
  UserPlus,
  Pencil,
  ChevronDown,
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
  Shield,
  GraduationCap,
  Sparkles,
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
  const { members } = useClub()

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
  const totalCount = members.length
  const coreCount = members.filter((m) => m.is_core).length
  const avgScore = totalCount > 0 ? (members.reduce((acc, m) => acc + m.current_score, 0) / totalCount).toFixed(1) : '74.6'
  const warningT02Count = members.filter((m) => m.absent_count_t02 >= 2).length
  const lowScoreCount = members.filter((m) => m.current_score < 60).length
  const highScoreCount = members.filter((m) => m.current_score >= 85).length

  // Số lượng theo ban
  const bcnCount = members.filter((m) => m.department_slug === 'bcn').length
  const ttCount = members.filter((m) => m.department_slug === 'truyen-thong').length
  const tvCount = members.filter((m) => m.department_slug === 'tu-van').length
  const nsCount = members.filter((m) => m.department_slug === 'nhan-su').length

  // Bộ lọc dữ liệu nâng cao
  const filtered = useMemo(() => {
    return members.filter((m) => {
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
  }, [members, searchQuery, selectedDept, filterDiscipline])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginatedMembers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Màu sắc nhãn Ban trực thuộc
  const getDeptBadgeStyle = (slug: string) => {
    switch (slug) {
      case 'bcn':
        return 'bg-amber-50 text-amber-700 border border-amber-200/80'
      case 'truyen-thong':
        return 'bg-blue-50 text-[#1351D8] border border-blue-200/80'
      case 'tu-van':
        return 'bg-pink-50 text-pink-700 border border-pink-200/80'
      case 'nhan-su':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200/80'
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200'
    }
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
      {/* Header trang đồng bộ & chuẩn nhận diện dự án iSSAC */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
            Danh Sách Hồ Sơ Thành Viên CLB
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium">
            Quản lý thông tin thành viên, theo dõi tiến độ thi đua và rèn luyện. Áp dụng cho toàn bộ 48 nhân sự chính thức.
          </p>
        </div>

        {/* Thanh công cụ hành động phía trên */}
        <div className="flex items-center gap-2.5 flex-shrink-0 self-start md:self-center">
          {/* Nút Xuất file CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 font-bold text-xs sm:text-[13px] transition shadow-2xs hover:shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title="Xuất toàn bộ danh sách thành viên ra file Excel CSV"
          >
            <Download className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span>Xuất file (.CSV)</span>
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
            className="px-4 py-2.5 rounded-xl bg-[#1351D8] hover:bg-[#0E40AF] text-white font-bold text-xs sm:text-[13px] transition shadow-xs hover:shadow flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title={isBCN ? 'Thêm thành viên mới vào danh sách' : 'Chỉ Ban Chủ nhiệm có quyền'}
          >
            <UserPlus className="w-4 h-4 stroke-[2.2] flex-shrink-0" />
            <span>Thêm Thành Viên</span>
          </button>
        </div>
      </div>

      {/* 4 Khối tóm tắt: Chuẩn viền mỏng 1px sang trọng & Tương tác 1 chạm */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Tổng nhân sự */}
        <div
          onClick={() => {
            setSelectedDept('all')
            setFilterDiscipline('all')
            setCurrentPage(1)
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            selectedDept === 'all' && filterDiscipline === 'all'
              ? 'border-blue-300 ring-2 ring-[#1351D8]/20 bg-blue-50/40 shadow-xs scale-[1.01]'
              : 'border-slate-200/90 bg-white hover:border-blue-300 hover:shadow-xs'
          }`}
        >
          <div>
            <span className="text-xs font-semibold text-slate-600 block">Tổng số thành viên</span>
            <span className="text-2xl sm:text-3xl font-black text-[#1351D8] mt-1 block">
              {totalCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1351D8] shadow-2xs border border-blue-200/60 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Core Team */}
        <div
          onClick={() => {
            setFilterDiscipline(filterDiscipline === 'core_only' ? 'all' : 'core_only')
            setCurrentPage(1)
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            filterDiscipline === 'core_only'
              ? 'border-amber-300 ring-2 ring-amber-500/20 bg-amber-50/40 shadow-xs scale-[1.01]'
              : 'border-slate-200/90 bg-white hover:border-amber-300 hover:shadow-xs'
          }`}
        >
          <div>
            <span className="text-xs font-semibold text-slate-600 block">Core Team nòng cốt</span>
            <span className="text-2xl sm:text-3xl font-black text-[#D97706] mt-1 block">
              {coreCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D97706] shadow-2xs border border-amber-200/60 flex items-center justify-center flex-shrink-0">
            <Crown className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Điểm trung bình */}
        <div
          onClick={() => {
            setFilterDiscipline(filterDiscipline === 'high_score' ? 'all' : 'high_score')
            setCurrentPage(1)
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            filterDiscipline === 'high_score'
              ? 'border-emerald-300 ring-2 ring-emerald-500/20 bg-emerald-50/40 shadow-xs scale-[1.01]'
              : 'border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-xs'
          }`}
        >
          <div>
            <span className="text-xs font-semibold text-slate-600 block">Điểm rèn luyện TB</span>
            <span className="text-2xl sm:text-3xl font-black text-[#059669] mt-1 block">
              {avgScore}đ
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#059669] shadow-2xs border border-emerald-200/60 flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Kỷ luật T02 & Điểm dưới chuẩn */}
        <div
          onClick={() => {
            setFilterDiscipline(filterDiscipline === 'warning_t02' ? 'all' : 'warning_t02')
            setCurrentPage(1)
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
            filterDiscipline === 'warning_t02' || filterDiscipline === 'low_score'
              ? 'border-rose-300 ring-2 ring-rose-500/20 bg-rose-50/40 shadow-xs scale-[1.01]'
              : 'border-slate-200/90 bg-white hover:border-rose-300 hover:shadow-xs'
          }`}
        >
          <div>
            <span className="text-xs font-semibold text-slate-600 block">Cảnh báo kỷ luật T02</span>
            <span className="text-2xl sm:text-3xl font-black text-[#DC2626] mt-1 block">
              {warningT02Count}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#DC2626] shadow-2xs border border-rose-200/60 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Thanh điều khiển lọc: Subtabs Ban + Tìm kiếm & Chip lọc */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Subtabs theo Ban (Segmented Control 1 hàng ngang) */}
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/70 overflow-x-auto max-w-full">
            {[
              { id: 'all', label: 'Tất cả ban', count: totalCount },
              { id: 'bcn', label: 'Ban Chủ nhiệm', count: bcnCount },
              { id: 'truyen-thong', label: 'Truyền thông', count: ttCount },
              { id: 'tu-van', label: 'Tư vấn', count: tvCount },
              { id: 'nhan-su', label: 'Nhân sự', count: nsCount },
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0B1E48] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                  }`}
                >
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

          {/* Quick Counter */}
          <div className="text-xs text-slate-500 font-medium whitespace-nowrap flex items-center gap-1 self-end sm:self-auto px-1">
            <span>Hiển thị:</span>
            <strong className="text-slate-900 font-bold">{filtered.length}</strong>
            <span>/ {totalCount} thành viên</span>
          </div>
        </div>

        {/* Thanh tìm kiếm & Chip lọc nhanh trạng thái */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên, MSSV, lớp, ngành học..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-8 pr-8 py-1.5 sm:py-2 bg-slate-50 hover:bg-slate-50/80 border border-slate-200/90 rounded-lg text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#1351D8] focus:ring-1 focus:ring-[#1351D8]/20 transition shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Chip filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0 text-xs">
            <span className="text-slate-500 font-bold text-[11px] whitespace-nowrap flex items-center gap-1 pr-1">
              <Filter className="w-3 h-3 text-slate-400" /> Tiêu chí:
            </span>
            {[
              { id: 'all' as const, label: 'Tất cả' },
              { id: 'core_only' as const, label: `Core Team (${coreCount})`, icon: Crown },
              { id: 'high_score' as const, label: `Rất tích cực ≥85 (${highScoreCount})`, icon: Sparkles },
              { id: 'low_score' as const, label: `Dưới chuẩn <60 (${lowScoreCount})`, icon: ShieldAlert },
              { id: 'warning_t02' as const, label: `Cảnh báo T02 (${warningT02Count})`, icon: AlertTriangle },
            ].map((chip) => {
              const isSelected = filterDiscipline === chip.id
              const ChipIcon = chip.icon
              return (
                <button
                  key={chip.id}
                  onClick={() => {
                    setFilterDiscipline(chip.id)
                    setCurrentPage(1)
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all inline-flex items-center gap-1 cursor-pointer ${
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

      {/* Bảng dữ liệu thành viên: Header Navy sang trọng & Đường viền mỏng 1px thanh lịch */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700 border-collapse">
            {/* Header bảng chuẩn nhận diện iSSAC Navy */}
            <thead className="bg-[#0B1E48] text-xs font-bold text-white uppercase tracking-wider border-b border-[#071533] select-none">
              <tr className="divide-x divide-white/10">
                <th className="py-3 px-3 w-[60px] text-center font-bold text-blue-100 whitespace-nowrap">STT</th>
                <th className="py-3 px-4 min-w-[260px] font-bold text-white whitespace-nowrap">
                  Họ và tên &amp; MSSV - Lớp
                </th>
                <th className="py-3 px-3 text-center w-[150px] font-bold text-white whitespace-nowrap">
                  Ban trực thuộc
                </th>
                <th className="py-3 px-3 text-center w-[140px] font-bold whitespace-nowrap bg-[#122A5E] text-amber-300 border-x border-amber-400/30">
                  <div className="inline-flex items-center justify-center gap-1 font-bold text-amber-300">
                    <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>Vai trò</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-center w-[130px] font-bold text-white whitespace-nowrap">
                  Điểm hiện tại
                </th>
                <th className="py-3 px-3 text-center w-[130px] font-bold text-blue-100 whitespace-nowrap">
                  Kỷ luật T02
                </th>
                <th className="py-3 px-3 text-center w-[130px] font-bold text-blue-100 whitespace-nowrap">
                  Trạng thái
                </th>
                <th className="py-3 px-3 text-center w-[100px] font-bold text-blue-100 whitespace-nowrap">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="space-y-2">
                      <Search className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-semibold text-xs sm:text-sm">Không tìm thấy thành viên phù hợp với bộ lọc</p>
                      <button
                        onClick={() => {
                          setSearchQuery('')
                          setSelectedDept('all')
                          setFilterDiscipline('all')
                        }}
                        className="text-xs sm:text-sm text-[#1351D8] font-semibold hover:underline cursor-pointer"
                      >
                        Xóa toàn bộ bộ lọc
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member) => {
                  const majorInfo = getMajorDetail(member.class_name)

                  return (
                    <tr
                      key={member.member_code}
                      onClick={() => onSelectMember(member)}
                      className="hover:bg-slate-50/70 transition-colors group divide-x divide-slate-100 cursor-pointer"
                    >
                      {/* 1. STT */}
                      <td className="py-3 px-2.5 text-center font-mono text-xs font-semibold text-slate-400 group-hover:text-[#0F172A] align-middle">
                        #{member.source_stt}
                      </td>

                      {/* 2. Họ và tên + Avatar + MSSV & Ngành học chuẩn format */}
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-3 whitespace-nowrap">
                          {member.avatar_url || member.full_name === 'Trần Đức Thắng' ? (
                            <img
                              src={member.avatar_url || '/avatars/duc-thang.jpg'}
                              alt={member.full_name}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-slate-200 shadow-2xs group-hover:border-[#1351D8] transition-colors"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1351D8] border border-blue-200/80 font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-2xs group-hover:bg-[#1351D8] group-hover:text-white transition-all">
                              {member.full_name.charAt(0)}
                            </div>
                          )}

                          <div className="min-w-0">
                            {/* Tên thành viên & Huy hiệu Core Team nếu có */}
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <span className="font-bold text-[#0F172A] text-[13.5px] sm:text-[14px] group-hover:text-[#1351D8] transition-colors leading-tight whitespace-nowrap">
                                {member.full_name}
                              </span>
                              {member.is_core && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs whitespace-nowrap">
                                  <Crown className="w-3 h-3 text-amber-600 flex-shrink-0" />
                                  <span>Core</span>
                                </span>
                              )}
                            </div>

                            {/* MSSV - Mã ngành / Lớp chuẩn gọn gàng */}
                            <div className="text-xs text-slate-500 font-normal mt-0.5 whitespace-nowrap">
                              {member.student_id || member.member_code}
                              {member.class_name ? ` - ${member.class_name}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Ban trực thuộc với huy hiệu viền mỏng đồng bộ màu */}
                      <td className="py-3 px-3 text-center align-middle">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap shadow-2xs ${getDeptBadgeStyle(
                            member.department_slug
                          )}`}
                        >
                          {member.department_name.replace('Ban ', '')}
                        </span>
                      </td>

                      {/* 4. Vai trò / Chức vụ */}
                      <td className="py-3 px-3 text-center align-middle bg-amber-50/20 border-x border-amber-200/40 group-hover:bg-amber-50/35 transition-colors">
                        {member.is_core ? (
                          <div className="flex flex-col items-center justify-center gap-0.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 whitespace-nowrap shadow-2xs">
                              <Crown className="w-3 h-3 text-amber-600 flex-shrink-0" />
                              <span>{member.position}</span>
                            </span>
                            <span className="text-[10px] font-semibold text-amber-800/80">
                              Core Team
                            </span>
                          </div>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 whitespace-nowrap shadow-2xs">
                            {member.position}
                          </span>
                        )}
                      </td>

                      {/* 5. Điểm hiện tại với viền mỏng 1px */}
                      <td className="py-3 px-3 text-center align-middle">
                        <div className="flex flex-col items-center justify-center gap-0.5 whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg font-bold text-xs whitespace-nowrap shadow-2xs ${
                              member.current_score >= 80
                                ? 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                                : member.current_score >= 60
                                ? 'text-[#1351D8] bg-blue-50 border border-blue-200'
                                : 'text-rose-800 bg-rose-50 border border-rose-200'
                            }`}
                          >
                            {member.current_score}đ
                          </span>
                          <span
                            className={`text-[10px] font-medium ${
                              member.current_score >= 85
                                ? 'text-emerald-600'
                                : member.current_score >= 60
                                ? 'text-blue-600'
                                : 'text-rose-600 font-bold'
                            }`}
                          >
                            {member.current_score >= 85
                              ? 'Rất tích cực'
                              : member.current_score >= 70
                              ? 'Tích cực'
                              : member.current_score >= 60
                              ? 'Đạt yêu cầu'
                              : 'Cần cải thiện'}
                          </span>
                        </div>
                      </td>

                      {/* 6. Kỷ luật T02 (Vắng không phép) */}
                      <td className="py-3 px-3 text-center align-middle">
                        {member.absent_count_t02 >= 3 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 whitespace-nowrap shadow-2xs animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                            <span>Khai trừ (3/3)</span>
                          </span>
                        ) : member.absent_count_t02 === 2 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap shadow-2xs">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                            <span>Cảnh báo (2/3)</span>
                          </span>
                        ) : member.absent_count_t02 === 1 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 whitespace-nowrap shadow-2xs">
                            1/3 lần
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 whitespace-nowrap shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>0 vi phạm</span>
                          </span>
                        )}
                      </td>

                      {/* 7. Trạng thái hoạt động */}
                      <td className="py-3 px-3 text-center align-middle">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 whitespace-nowrap shadow-2xs">
                          <span>Hoạt động</span>
                        </span>
                      </td>

                      {/* 8. Thao tác xem chi tiết & Chỉnh sửa */}
                      <td className="py-3 px-3 text-center align-middle whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingMember(member)
                            }}
                            className="px-2 py-1 rounded-lg text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 transition shadow-2xs inline-flex items-center gap-1 cursor-pointer active:scale-95"
                            title="Sửa thông tin & đổi Avatar"
                          >
                            <Pencil className="w-3 h-3 flex-shrink-0 text-amber-700" />
                            <span>Sửa</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onSelectMember(member)
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#1351D8] bg-blue-50/70 hover:bg-[#1351D8] hover:text-white border border-blue-200/80 transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer active:scale-95"
                          >
                            <span>Xem</span>
                            <ArrowRight className="w-3 h-3 flex-shrink-0" />
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
            <span>Hiển thị</span>
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
            <span>thành viên / trang</span>
            <span className="text-slate-300 mx-1">|</span>
            <span>Tổng cộng <strong>{filtered.length}</strong> thành viên</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium shadow-2xs inline-flex items-center gap-1 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Trước</span>
            </button>

            <span className="px-3 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg shadow-2xs">
              Trang {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium shadow-2xs inline-flex items-center gap-1 transition"
            >
              <span>Sau</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal thêm thành viên mới */}
      <AddMemberModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} />

      {/* Modal chỉnh sửa thông tin & Avatar */}
      <EditMemberModal
        isOpen={Boolean(editingMember)}
        onClose={() => setEditingMember(null)}
        member={editingMember}
      />
    </div>
  )
}
