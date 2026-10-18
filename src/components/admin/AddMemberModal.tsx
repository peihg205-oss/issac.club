'use client'

import React, { useState } from 'react'
import { useClub } from '@/lib/context/ClubContext'
import type { DepartmentCode } from '@/types/database'
import { UserPlus, X, CheckCircle2, ShieldAlert, Camera, Upload, Trash2 } from 'lucide-react'
import { compressImage } from '@/lib/utils/imageCompress'

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddMemberModal({ isOpen, onClose }: AddMemberModalProps) {
  const { addMember } = useClub()

  const [fullName, setFullName] = useState('')
  const [departmentCode, setDepartmentCode] = useState<DepartmentCode>('B01')
  const [position, setPosition] = useState('Thành viên')
  const [studentId, setStudentId] = useState('')
  const [className, setClassName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [isCore, setIsCore] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  if (!isOpen) return null

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file, 160, 0.8)
    if (compressed) setAvatarUrl(compressed)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) return

    addMember({
      fullName,
      departmentCode,
      position,
      studentId: studentId.trim() || undefined,
      className: className.trim() || undefined,
      phone: phone.trim() || undefined,
      email,
      isCore,
      avatarUrl: avatarUrl.trim() || undefined,
    })

    setSuccessMsg(`Đã thêm thành công thành viên: ${fullName.trim()} (Điểm khởi đầu: 60)`)
    setTimeout(() => {
      setSuccessMsg('')
      onClose()
      // reset form
      setFullName('')
      setStudentId('')
      setClassName('')
      setPhone('')
      setEmail('')
      setIsCore(false)
      setAvatarUrl('')
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1E48]/55 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full border border-slate-200/90 shadow-2xl relative space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0B1E48] via-[#1351D8] to-[#1E62F4] text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <UserPlus className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-blue-50 text-[#1351D8] border border-blue-200/60 mb-1">
                <span>Ban Chủ Nhiệm CLB</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#0F172A] tracking-tight">
                Thêm Thành Viên Mới
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Khởi tạo hồ sơ nhân sự với mức điểm chuẩn khởi đầu 60 điểm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex items-center justify-center cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h4 className="text-base font-bold text-slate-900">{successMsg}</h4>
            <p className="text-xs text-slate-500 font-medium">Dữ liệu đã được cập nhật trực tiếp vào hệ thống quản lý.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Ảnh đại diện (Avatar) */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center gap-4">
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar Preview"
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white shadow-sm border border-slate-200"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 text-[#1351D8] font-bold text-lg flex items-center justify-center border border-blue-200">
                    {fullName ? fullName.charAt(0).toUpperCase() : <Camera className="w-6 h-6 text-blue-400" />}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <span className="font-bold text-slate-800 block text-xs">Ảnh đại diện (Avatar):</span>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    id="new-member-avatar"
                    onChange={handleAvatarFile}
                    className="hidden"
                  />
                  <label
                    htmlFor="new-member-avatar"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#1351D8] bg-white hover:bg-blue-50 border border-blue-200/80 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải ảnh từ máy</span>
                  </label>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200/80 transition cursor-pointer"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Họ tên */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn An"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#1351D8] focus:ring-2 focus:ring-[#1351D8]/10 transition shadow-2xs"
                />
              </div>

              {/* Ban */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ban chuyên môn: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={departmentCode}
                  onChange={(e) => setDepartmentCode(e.target.value as DepartmentCode)}
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1351D8] focus:ring-2 focus:ring-[#1351D8]/10 transition shadow-2xs cursor-pointer"
                >
                  <option value="B01">Ban Truyền thông (B01)</option>
                  <option value="B02">Ban Tư vấn (B02)</option>
                  <option value="B03">Ban Nhân sự (B03)</option>
                  <option value="B04">Ban Chủ nhiệm (B04)</option>
                </select>
              </div>

              {/* Chức vụ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chức vụ: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1351D8] focus:ring-2 focus:ring-[#1351D8]/10 transition shadow-2xs cursor-pointer"
                >
                  <option value="Thành viên">Thành viên</option>
                  <option value="Phó ban">Phó ban</option>
                  <option value="Trưởng ban">Trưởng ban</option>
                  <option value="Phó chủ nhiệm">Phó chủ nhiệm</option>
                  <option value="Chủ nhiệm">Chủ nhiệm</option>
                  <option value="Cố vấn">Cố vấn</option>
                </select>
              </div>

              {/* MSSV */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã sinh viên (MSSV):
                </label>
                <input
                  type="text"
                  placeholder="VD: 23070691"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1351D8] focus:ring-2 focus:ring-[#1351D8]/10 transition shadow-2xs"
                />
              </div>

              {/* Lớp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lớp sinh hoạt:
                </label>
                <input
                  type="text"
                  placeholder="VD: MIS2023A"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1351D8] focus:ring-2 focus:ring-[#1351D8]/10 transition shadow-2xs"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email liên hệ: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="an.nguyen@vnuis.edu.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#1351D8] focus:ring-2 focus:ring-[#1351D8]/10 transition shadow-2xs"
                />
              </div>

              {/* SĐT */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số điện thoại:
                </label>
                <input
                  type="tel"
                  placeholder="0912345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#1351D8] focus:ring-2 focus:ring-[#1351D8]/10 transition shadow-2xs"
                />
              </div>
            </div>

            {/* Core Team Checkbox */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70">
              <input
                type="checkbox"
                id="isCoreCheck"
                checked={isCore}
                onChange={(e) => setIsCore(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 bg-white mt-0.5 cursor-pointer"
              />
              <label htmlFor="isCoreCheck" className="text-xs text-slate-800 cursor-pointer select-none">
                <span className="font-bold text-amber-900 block">Thuộc Đội ngũ Core Team (11 nhân sự nòng cốt)</span>
                <span className="text-amber-800/90 block text-[11px] font-medium mt-0.5">
                  Áp dụng chế tài trừ điểm gấp đôi (×2) đối với các vi phạm kỷ luật theo quy chế CLB
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200/90 text-slate-700 font-bold text-xs hover:bg-slate-50 transition shadow-2xs active:scale-95 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0F3282] via-[#1351D8] to-[#1E62F4] hover:from-[#0B2562] hover:to-[#1351D8] text-white font-bold text-xs shadow-xs hover:shadow transition flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 stroke-[2.2]" />
                <span>Thêm Thành Viên</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
