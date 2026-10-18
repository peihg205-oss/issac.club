'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useClub } from '@/lib/context/ClubContext'
import type { RosterMember } from '@/lib/clubData'
import type { DepartmentCode } from '@/types/database'
import {
  X,
  Camera,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  AlertTriangle,
  Crown,
  Trash2,
  RefreshCw,
  Sparkles,
  User,
  Image as ImageIcon,
  Check,
} from 'lucide-react'
import { compressImage } from '@/lib/utils/imageCompress'

// Bộ sưu tập avatar mẫu gợi ý nhanh (SVG / Gradient chuyên nghiệp cho Đại sứ sinh viên)
const PRESET_AVATARS = [
  {
    id: 'thang',
    name: 'Đức Thắng (Thực tế)',
    url: '/avatars/duc-thang.jpg',
  },
  {
    id: 'ambassador-1',
    name: 'Đại sứ Nam Navy',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces&auto=format&q=80',
  },
  {
    id: 'ambassador-2',
    name: 'Đại sứ Nữ Thanh lịch',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces&auto=format&q=80',
  },
  {
    id: 'ambassador-3',
    name: 'Đại sứ Nam Trẻ trung',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces&auto=format&q=80',
  },
  {
    id: 'ambassador-4',
    name: 'Đại sứ Nữ Năng động',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=faces&auto=format&q=80',
  },
  {
    id: 'ambassador-5',
    name: 'Đại sứ Nam Chuyên nghiệp',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces&auto=format&q=80',
  },
]

interface EditMemberModalProps {
  isOpen: boolean
  onClose: () => void
  member: RosterMember | null
}

export function EditMemberModal({ isOpen, onClose, member }: EditMemberModalProps) {
  const { updateMember } = useClub()

  const [fullName, setFullName] = useState('')
  const [departmentCode, setDepartmentCode] = useState<DepartmentCode>('B01')
  const [position, setPosition] = useState('Thành viên')
  const [studentId, setStudentId] = useState('')
  const [className, setClassName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [isCore, setIsCore] = useState(false)
  const [currentScore, setCurrentScore] = useState(60)
  const [absentT02, setAbsentT02] = useState(0)
  const [avatarUrl, setAvatarUrl] = useState('')

  // Tab chọn avatar: 'upload' | 'url' | 'presets'
  const [avatarTab, setAvatarTab] = useState<'upload' | 'url' | 'presets'>('upload')
  const [customUrlInput, setCustomUrlInput] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Đồng bộ form khi modal mở hoặc đổi thành viên
  useEffect(() => {
    if (member && isOpen) {
      setFullName(member.full_name || '')
      setDepartmentCode(member.department_code || 'B01')
      setPosition(member.position || 'Thành viên')
      setStudentId(member.student_id || '')
      setClassName(member.class_name || '')
      setPhone(member.phone || '')
      setEmail(member.email || '')
      setIsCore(Boolean(member.is_core))
      setCurrentScore(member.current_score ?? 60)
      setAbsentT02(member.absent_count_t02 ?? 0)
      setAvatarUrl(member.avatar_url || '')
      setCustomUrlInput(member.avatar_url || '')
      setFeedback(null)
    }
  }, [member?.member_code, isOpen])

  if (!isOpen || !member) return null

  // Xử lý upload file ảnh từ máy tính (convert sang base64 Data URL)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const compressed = await compressImage(file, 160, 0.8)
    if (compressed) {
      setAvatarUrl(compressed)
      setFeedback({
        type: 'success',
        message: 'Đã tối ưu và nén ảnh thành công! Bấm "Lưu thay đổi" để áp dụng vào hồ sơ.',
      })
    } else {
      setFeedback({
        type: 'error',
        message: 'Có lỗi khi nén file ảnh. Vui lòng thử lại.',
      })
    }
  }

  // Áp dụng URL ảnh tự nhập
  const handleApplyUrl = () => {
    if (!customUrlInput.trim()) {
      setAvatarUrl('')
      setFeedback({ type: 'success', message: 'Đã xóa đường dẫn avatar.' })
      return
    }
    setAvatarUrl(customUrlInput.trim())
    setFeedback({ type: 'success', message: 'Đã cập nhật link ảnh avatar!' })
  }

  // Xóa avatar về mặc định (chữ cái đầu)
  const handleRemoveAvatar = () => {
    setAvatarUrl('')
    setCustomUrlInput('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setFeedback({ type: 'success', message: 'Đã đặt lại avatar về ký tự chữ cái mặc định.' })
  }

  // Xử lý submit toàn bộ thông tin
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) {
      setFeedback({ type: 'error', message: 'Vui lòng điền đầy đủ Họ tên và Email!' })
      return
    }

    setIsSubmitting(true)

    const res = updateMember(member.member_code, {
      full_name: fullName.trim(),
      department_code: departmentCode,
      position: position.trim(),
      student_id: studentId.trim() || undefined,
      class_name: className.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim(),
      is_core: isCore,
      current_score: Math.min(100, Math.max(0, Number(currentScore) || 60)),
      absent_count_t02: Math.max(0, Number(absentT02) || 0),
      avatar_url: avatarUrl.trim() || undefined,
    })

    setIsSubmitting(false)

    if (res.success) {
      setFeedback({ type: 'success', message: res.message })
      setTimeout(() => {
        onClose()
      }, 900)
    } else {
      setFeedback({ type: 'error', message: res.message })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#0B1E48]/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-2xl w-full border border-slate-200/90 shadow-2xl relative space-y-5 max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0B1E48] via-[#1351D8] to-[#1E62F4] text-white flex items-center justify-center shadow-xs shrink-0">
              <User className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#1351D8] border border-blue-200/60">
                  Chỉnh Sửa Hồ Sơ Thành Viên
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {member.member_code}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#0F172A] tracking-tight">
                {fullName || member.full_name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 shrink-0 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto flex-1 pr-1 text-xs">
          {/* ========================================================= */}
          {/* PHẦN 1: TỰ DO THAY ĐỔI & TẢI ẢNH ĐẠI DIỆN (AVATAR) */}
          {/* ========================================================= */}
          <div className="bg-gradient-to-b from-slate-50/80 to-blue-50/30 p-4 sm:p-5 rounded-2xl border border-slate-200/90 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#1351D8]" />
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wide">
                  Ảnh Đại Diện Thành Viên (Avatar)
                </h4>
              </div>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer transition"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa ảnh / Về mặc định</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Live Preview Avatar */}
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-white shadow-md border border-slate-200"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-200 ring-4 ring-white shadow-md border border-blue-200 text-[#1351D8] font-black text-2xl flex items-center justify-center">
                    {fullName ? fullName.charAt(0).toUpperCase() : 'A'}
                  </div>
                )}
                {isCore && (
                  <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 text-amber-950 border-2 border-white shadow-xs flex items-center justify-center" title="Core Team">
                    <Crown className="w-3.5 h-3.5 fill-amber-900" />
                  </span>
                )}
              </div>

              {/* Tùy chọn nguồn Avatar */}
              <div className="flex-1 w-full space-y-2.5">
                <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setAvatarTab('upload')}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      avatarTab === 'upload'
                        ? 'bg-white text-[#1351D8] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải từ máy tính</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarTab('presets')}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      avatarTab === 'presets'
                        ? 'bg-white text-[#1351D8] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Avatar gợi ý</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarTab('url')}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      avatarTab === 'url'
                        ? 'bg-white text-[#1351D8] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Dán link ảnh</span>
                  </button>
                </div>

                {/* Tab 1: Upload từ máy tính */}
                {avatarTab === 'upload' && (
                  <div className="space-y-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleFileChange}
                      className="hidden"
                      id="member-avatar-upload"
                    />
                    <label
                      htmlFor="member-avatar-upload"
                      className="w-full py-2.5 px-4 rounded-xl border border-dashed border-[#1351D8]/60 bg-blue-50/60 hover:bg-blue-50 text-[#1351D8] font-bold text-center cursor-pointer transition flex items-center justify-center gap-2 shadow-2xs"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Chọn file ảnh từ thiết bị của bạn (JPG, PNG, WebP)</span>
                    </label>
                    <span className="block text-[10px] text-slate-400 text-center">
                      Ảnh sẽ được nén và hiển thị ngay tức thì trên toàn bộ hệ thống
                    </span>
                  </div>
                )}

                {/* Tab 2: Thư viện Avatar gợi ý */}
                {avatarTab === 'presets' && (
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {PRESET_AVATARS.map((p) => {
                        const isSelected = avatarUrl === p.url
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setAvatarUrl(p.url)
                              setFeedback({ type: 'success', message: `Đã chọn mẫu: ${p.name}` })
                            }}
                            className={`p-1 rounded-xl border transition flex flex-col items-center gap-1 cursor-pointer ${
                              isSelected
                                ? 'bg-blue-100 border-[#1351D8] ring-2 ring-[#1351D8]/30'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <img
                              src={p.url}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                            <span className="text-[9px] font-semibold text-slate-700 truncate w-full text-center">
                              {p.name.split(' ')[0]}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Tab 3: Dán link ảnh */}
                {avatarTab === 'url' && (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Dán đường dẫn ảnh https://... hoặc /avatars/..."
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      className="flex-1 bg-white border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1351D8]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="px-3.5 py-2 rounded-xl bg-[#1351D8] hover:bg-[#0F3282] text-white font-bold text-xs transition cursor-pointer"
                    >
                      Áp dụng
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* PHẦN 2: THÔNG TIN CÁ NHÂN & CHUYÊN MÔN */}
          {/* ========================================================= */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-black uppercase text-slate-800 tracking-wide pb-1 border-b border-slate-100">
              Thông Tin Nhân Sự CLB
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Họ và tên */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên đầy đủ"
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#1351D8] focus:ring-2 focus:ring-[#1351D8]/10 transition shadow-2xs"
                />
              </div>

              {/* Ban chuyên môn */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ban trực thuộc: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={departmentCode}
                  onChange={(e) => setDepartmentCode(e.target.value as DepartmentCode)}
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1351D8] focus:ring-2 focus:ring-[#1351D8]/10 transition shadow-2xs cursor-pointer"
                >
                  <option value="B04">Ban Chủ nhiệm (B04)</option>
                  <option value="B01">Ban Truyền thông (B01)</option>
                  <option value="B02">Ban Tư vấn (B02)</option>
                  <option value="B03">Ban Nhân sự (B03)</option>
                </select>
              </div>

              {/* Chức vụ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chức vụ / Vị trí: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Chủ nhiệm, Phó ban, Thành viên..."
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1351D8] transition shadow-2xs"
                />
              </div>

              {/* Mã sinh viên */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã sinh viên (MSSV):
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="VD: 23070691"
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-[#1351D8] transition shadow-2xs"
                />
              </div>

              {/* Lớp / Ngành */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lớp / Khóa học:
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="VD: MIS2023A, DC2024B..."
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1351D8] transition shadow-2xs"
                />
              </div>

              {/* Số điện thoại */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số điện thoại:
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="VD: 0374140705"
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-[#1351D8] transition shadow-2xs"
                />
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  (Dùng để xác thực 4 số cuối chống điểm danh hộ)
                </span>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email liên hệ: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="VD: email@vnuis.edu.vn"
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1351D8] transition shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* PHẦN 3: PHÂN LOẠI CORE TEAM & ĐIỂM THI ĐUA */}
          {/* ========================================================= */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Quyền &amp; Phân loại Core Team
                </span>
                <span className="text-[11px] text-slate-500">
                  Thành viên Cốt cán (BCN, Trưởng/Phó ban) chịu trách nhiệm cao hơn, áp dụng nhân đôi điểm phạt (×2) theo Quy tắc P03.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                <input
                  type="checkbox"
                  checked={isCore}
                  onChange={(e) => setIsCore(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/70">
              {/* Điểm hiện tại */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Điểm thi đua hiện tại (0 - 100đ):
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={currentScore}
                  onChange={(e) => setCurrentScore(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-[#1351D8]"
                />
              </div>

              {/* Số lần vắng T02 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số lần vắng họp không phép (T02):
                </label>
                <input
                  type="number"
                  min={0}
                  max={3}
                  value={absentT02}
                  onChange={(e) => setAbsentT02(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-black text-rose-700 focus:outline-none focus:border-[#1351D8]"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-[#0F3282] via-[#1351D8] to-[#1E62F4] hover:brightness-110 shadow-md shadow-[#1351D8]/20 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Lưu Thay Đổi Hồ Sơ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
