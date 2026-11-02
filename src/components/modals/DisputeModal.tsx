'use client'

import React, { useState, useEffect } from 'react'
import { AlertCircle, X, ChevronsUpDown } from 'lucide-react'
import { useClub } from '@/lib/context/ClubContext'
import { useAuth } from '@/lib/auth/AuthContext'

export interface DisputeModalProps {
  isOpen: boolean
  onClose: () => void
  initialMemberCode?: string
  initialCriterionCode?: string
  initialPoints?: number
  onSuccess?: () => void
}

// Bảng tiêu chí trừ điểm mặc định kèm số điểm
const DEDUCT_CRITERIA = [
  { code: 'T02', label: 'T02 (Vắng không phép -5đ)', defaultPoints: -5 },
  { code: 'T04', label: 'T04 (Đi họp muộn -1đ)', defaultPoints: -1 },
  { code: 'T07', label: 'T07 (Trễ deadline nhiệm vụ -2đ)', defaultPoints: -2 },
  { code: 'T01', label: 'T01 (Vắng có phép báo muộn -2đ)', defaultPoints: -2 },
  { code: 'T05', label: 'T05 (Không xác nhận thông báo -1đ)', defaultPoints: -1 },
  { code: 'T06', label: 'T06 (Trang phục/tác phong không chuẩn -2đ)', defaultPoints: -2 },
  { code: 'T03', label: 'T03 (Không tham gia HĐ bắt buộc -2đ)', defaultPoints: -2 },
  { code: 'T08', label: 'T08 (Vi phạm kỷ luật CLB -5đ)', defaultPoints: -5 },
  { code: 'T09', label: 'T09 (Vi phạm nghiêm trọng -10đ)', defaultPoints: -10 },
  { code: 'T10', label: 'T10 (Tự ý phát ngôn sai lệch -10đ)', defaultPoints: -10 },
]

export function DisputeModal({
  isOpen,
  onClose,
  initialMemberCode,
  initialCriterionCode = 'T02',
  initialPoints = -5,
  onSuccess,
}: DisputeModalProps) {
  const { members, createDispute, customRules } = useClub()
  const { currentUser } = useAuth()

  // Xác định thành viên ban đầu: ưu tiên initialMemberCode, sau đó là currentUser (nếu có trong roster), hoặc thành viên đầu tiên
  const defaultCode = () => {
    if (initialMemberCode) return initialMemberCode
    if (currentUser?.memberCode && members.some((m) => m.member_code === currentUser.memberCode)) {
      return currentUser.memberCode
    }
    // Tìm thử Lê Trần Thuỷ Nguyên (24310069) nếu có
    const nguyen = members.find((m) => m.member_code === '24310069' || m.student_id === '24310069')
    if (nguyen) return nguyen.member_code
    return members[0]?.member_code || ''
  }

  const [memberCode, setMemberCode] = useState<string>(defaultCode)
  const [criterion, setCriterion] = useState<string>(initialCriterionCode)
  const [points, setPoints] = useState<number>(initialPoints)
  const [reason, setReason] = useState<string>('')
  const [evidence, setEvidence] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)

  // Đồng bộ lại khi modal mở ra
  useEffect(() => {
    if (isOpen) {
      setMemberCode(defaultCode())
      setCriterion(initialCriterionCode)
      setPoints(initialPoints)
      setReason('')
      setEvidence('')
      setSubmitting(false)
    }
  }, [isOpen, initialMemberCode, initialCriterionCode, initialPoints])

  // Tự động cập nhật số điểm khi đổi mã tiêu chí
  const handleCriterionChange = (newCode: string) => {
    setCriterion(newCode)
    const found = DEDUCT_CRITERIA.find((c) => c.code === newCode)
    if (found) {
      setPoints(found.defaultPoints)
    } else {
      const cr = customRules.find((r) => r.code === newCode)
      if (cr) {
        setPoints(-Math.abs(Number(cr.points) || 0))
      }
    }
  }

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      alert('Vui lòng nhập lý do chi tiết & giải trình!')
      return
    }

    setSubmitting(true)
    const res = createDispute({
      memberCode,
      criterionCode: criterion,
      pointsContested: Number(points) || 0,
      reason: reason.trim(),
      evidenceUrl: evidence.trim(),
    })

    setSubmitting(false)
    if (res.success) {
      alert(res.message || 'Gửi đơn khiếu nại thành công! Ban Nhân sự & Ban Chủ nhiệm sẽ xem xét và phản hồi.')
      if (onSuccess) onSuccess()
      onClose()
    } else {
      alert(res.message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1E48]/45 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[28px] max-w-[540px] w-full p-6 sm:p-7 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.22)] border border-slate-100/90 space-y-4 sm:space-y-4.5 animate-in zoom-in-95 duration-150">
        
        {/* ============================================================== */}
        {/* HEADER: Icon tròn tím + Tiêu đề + Nút Đóng X tròn viền mỏng    */}
        {/* ============================================================== */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-3 sm:gap-3.5">
            {/* Vòng tròn tím nhạt tinh tế với icon chấm than AlertCircle */}
            <div className="w-10 h-10 rounded-full bg-[#FAF5FF] text-[#7C3AED] flex items-center justify-center border border-purple-200/50 shadow-2xs shrink-0">
              <AlertCircle className="w-5 h-5 text-[#7C3AED]" />
            </div>

            <div>
              <h3 className="text-base sm:text-[17px] font-extrabold text-[#061651] tracking-tight leading-tight">
                Gửi đơn khiếu nại điểm (Q06)
              </h3>
              <p className="text-xs text-[#64748B] font-normal mt-0.5">
                Quy chuẩn bảo vệ quyền lợi thành viên CLB iSSAC
              </p>
            </div>
          </div>

          {/* Nút đóng tròn viền mảnh xám */}
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-slate-300/80 text-slate-400 hover:text-slate-600 hover:border-slate-400 transition flex items-center justify-center cursor-pointer shrink-0"
            title="Đóng modal"
          >
            <X className="w-3.5 h-3.5 stroke-[2]" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* FORM NHẬP THÔNG TIN KHIẾU NẠI                                  */}
        {/* ============================================================== */}
        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
          {/* Field 1: Thành viên khiếu nại */}
          <div>
            <label className="text-[13px] font-bold text-[#061651] mb-1.5 block">
              Thành viên khiếu nại:
            </label>
            <div className="relative">
              <select
                value={memberCode}
                onChange={(e) => setMemberCode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-[13px] font-semibold text-slate-800 focus:outline-none focus:border-[#7026ED] focus:ring-2 focus:ring-[#7026ED]/15 transition shadow-2xs appearance-none pr-9 cursor-pointer"
              >
                {members.map((m) => (
                  <option key={m.member_code} value={m.member_code}>
                    {m.full_name} ({m.department_name} - {m.student_id || m.member_code})
                  </option>
                ))}
              </select>
              <ChevronsUpDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Field 2 & 3: 2 Cột - Mã tiêu chí bị trừ & Số điểm khiếu nại */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
            {/* Cột trái: Mã tiêu chí bị trừ */}
            <div>
              <label className="text-[13px] font-bold text-[#061651] mb-1.5 block">
                Mã tiêu chí bị trừ:
              </label>
              <div className="relative">
                <select
                  value={criterion}
                  onChange={(e) => handleCriterionChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-[13px] font-semibold text-slate-800 focus:outline-none focus:border-[#7026ED] focus:ring-2 focus:ring-[#7026ED]/15 transition shadow-2xs appearance-none pr-9 cursor-pointer"
                >
                  {DEDUCT_CRITERIA.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                  {customRules
                    .filter((r) => r.type === 'deduct')
                    .map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.code} ({r.name} {r.points}đ)
                      </option>
                    ))}
                </select>
                <ChevronsUpDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Cột phải: Số điểm khiếu nại */}
            <div>
              <label className="text-[13px] font-bold text-[#061651] mb-1.5 block">
                Số điểm khiếu nại:
              </label>
              <input
                type="number"
                step="1"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-[13px] font-bold text-slate-800 focus:outline-none focus:border-[#7026ED] focus:ring-2 focus:ring-[#7026ED]/15 transition shadow-2xs"
              />
            </div>
          </div>

          {/* Field 4: Lý do chi tiết & Giải trình */}
          <div>
            <label className="text-[13px] font-bold text-[#061651] mb-1.5 block">
              Lý do chi tiết &amp; Giải trình:
            </label>
            <textarea
              rows={3}
              required
              placeholder="Nêu rõ hoàn cảnh, lý do bất khả kháng hoặc minh chứng đã nộp..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7026ED] focus:ring-2 focus:ring-[#7026ED]/15 transition shadow-2xs resize-y min-h-[96px]"
            />
          </div>

          {/* Field 5: Đường dẫn minh chứng (Google Drive / Ảnh) */}
          <div>
            <label className="text-[13px] font-bold text-[#061651] mb-1.5 block">
              Đường dẫn minh chứng (Google Drive / Ảnh):
            </label>
            <input
              type="url"
              placeholder="https://drive.google.com/..."
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7026ED] focus:ring-2 focus:ring-[#7026ED]/15 transition shadow-2xs"
            />
          </div>

          {/* Footer Action Buttons: Huỷ & Gửi khiếu nại chuẩn nhận diện dự án */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-[13px] transition active:scale-95 cursor-pointer shadow-2xs"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-2xl text-xs sm:text-[13px] font-bold text-white bg-[#7026ED] hover:bg-[#621fde] shadow-sm shadow-[#7026ED]/25 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Đang gửi...' : 'Gửi khiếu nại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
