'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useClub } from '@/lib/context/ClubContext'
import { useAuth } from '@/lib/auth/AuthContext'
import { getRatingLevel } from '@/lib/scoring/constants'
import type { RosterMember } from '@/lib/clubData'
import {
  UserCheck,
  Shield,
  Award,
  TrendingUp,
  Clock,
  AlertTriangle,
  Send,
  CheckCircle,
  FileText,
  Search,
} from 'lucide-react'

export default function MyScorePage() {
  const router = useRouter()
  const { members } = useClub()
  const { currentUser, isAuthChecked } = useAuth()

  useEffect(() => {
    if (isAuthChecked && !currentUser) {
      router.replace('/login')
    }
  }, [isAuthChecked, currentUser, router])

  // Default to currentUser's memberCode if exists, or first member
  const initialCode = currentUser?.memberCode || members[0]?.member_code
  const [selectedCode, setSelectedCode] = useState<string>(initialCode)
  const [disputeModalOpen, setDisputeModalOpen] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeSuccess, setDisputeSuccess] = useState(false)

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFBFC]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!currentUser) return null

  const member: RosterMember =
    members.find((m) => m.member_code === selectedCode) || members[0]

  const rating = getRatingLevel(member.current_score)

  const historyEntries = [
    {
      date: '10/10/2025',
      criterion: 'C05',
      criterionName: 'Hoàn thành nhiệm vụ đúng hạn & đạt chuẩn',
      delta: 2,
      scoreAfter: member.current_score,
      reason: 'Nghiệm thu kế hoạch truyền thông tháng 10',
      approver: 'Trần Đức Thắng (Trưởng ban)',
    },
    {
      date: '05/10/2025',
      criterion: 'C07',
      criterionName: 'Tham dự sự kiện/họp đầy đủ & đúng giờ',
      delta: 1,
      scoreAfter: member.current_score - 2,
      reason: 'Check-in đúng giờ buổi sinh hoạt định kỳ tháng 10',
      approver: 'Hệ thống tự động',
    },
    {
      date: '01/09/2025',
      criterion: 'INIT',
      criterionName: 'Điểm khởi đầu nhiệm kỳ 2025-2026',
      delta: 60,
      scoreAfter: 60,
      reason: 'Khởi tạo dữ liệu thành viên đầu nhiệm kỳ',
      approver: 'Ban Quản trị CLB',
    },
  ]

  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!disputeReason.trim()) return
    setDisputeSuccess(true)
    setTimeout(() => {
      setDisputeModalOpen(false)
      setDisputeSuccess(false)
      setDisputeReason('')
    }, 2000)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#34D399]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#34D399]">
              Phân hệ cá nhân
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">
            Hồ Sơ & Điểm Hoạt Động Cá Nhân
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Tra cứu lịch sử điểm, hạn ngạch tương tác và gửi đề nghị giải trình (Q06)
          </p>
        </div>

        {/* Member Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium whitespace-nowrap">
            Xem hồ sơ:
          </label>
          <select
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            className="bg-[#0B1530] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#1E63D6]"
          >
            {members.map((m) => (
              <option key={m.member_code} value={m.member_code}>
                {m.full_name} ({m.position} - {m.department_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Score Overview */}
        <div className="glass-panel-glow rounded-3xl p-6 border border-[#1E63D6]/30 flex flex-col justify-between items-center text-center">
          <div className="w-full">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
              Điểm tích lũy hiện tại
            </span>

            <div className="relative inline-flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border-4 border-white/10 flex items-center justify-center bg-gradient-to-br from-[#1E63D6]/20 to-[#0B1F4B]/30 shadow-xl">
                <span className="text-4xl font-black text-white">
                  {member.current_score.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="mt-3">
              <span
                className="inline-block px-3 py-0.5 rounded-full text-xs font-bold border"
                style={{
                  backgroundColor: `${rating.badge_color}18`,
                  color: rating.badge_color,
                  borderColor: `${rating.badge_color}40`,
                }}
              >
                {rating.level_name}
              </span>
              <p className="text-xs text-slate-400 mt-2">{rating.action_required}</p>
            </div>
          </div>

          {/* Absence Counter */}
          <div className="w-full mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400">Vắng họp không phép (T02):</span>
            <span
              className={`font-bold px-2 py-0.5 rounded ${
                member.absent_count_t02 === 0
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              {member.absent_count_t02}/3 lần
            </span>
          </div>
        </div>

        {/* Right: Info & Quota (2 cols) */}
        <div className="md:col-span-2 glass-panel rounded-3xl p-6 border border-white/10 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-white">{member.full_name}</h3>
              {member.is_core && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold badge-core">
                  Core Team (Phạt ×2)
                </span>
              )}
            </div>

            {/* Details Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-slate-500 block mb-0.5">Ban chuyên môn</span>
                <span className="font-semibold text-slate-200">{member.department_name}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-slate-500 block mb-0.5">Chức vụ</span>
                <span className="font-semibold text-slate-200">{member.position}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-slate-500 block mb-0.5">Mã sinh viên (MSSV)</span>
                <span className="font-semibold text-slate-200">{member.student_id || 'Cán bộ'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-slate-500 block mb-0.5">Lớp sinh hoạt</span>
                <span className="font-semibold text-slate-200">{member.class_name || '-'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-slate-500 block mb-0.5">Email liên hệ</span>
                <span className="font-semibold text-slate-200">{member.email}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-slate-500 block mb-0.5">Số điện thoại</span>
                <span className="font-semibold text-slate-200">{member.phone || '-'}</span>
              </div>
            </div>
          </div>

          {/* Monthly Interaction Quota Bar */}
          <div className="p-3.5 rounded-2xl bg-[#0B1530] border border-white/10 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300">
                Hạn ngạch tương tác tháng (C01 + C02 + C03)
              </span>
              <span className="font-bold text-[#F5B301]">6 / 15 điểm</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#1E63D6] to-[#F5B301] rounded-full"
                style={{ width: `${(6 / 15) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Tối đa 15 điểm/tháng theo Nguyên tắc P04. Tự động làm mới vào ngày 1 hàng tháng.
            </p>
          </div>
        </div>
      </div>

      {/* Ledger History & Q06 Dispute Section */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">Lịch Sử Biến Động Điểm (Ledger)</h3>
            <p className="text-xs text-slate-400">
              Bản ghi bất biến. Trong vòng 3 ngày làm việc, thành viên có quyền gửi giải trình (Q06).
            </p>
          </div>

          <button
            onClick={() => setDisputeModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-[#F5B301] border border-[#F5B301]/30 transition-all self-start sm:self-auto"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Gửi Đề Nghị Sửa / Giải Trình (Q06)</span>
          </button>
        </div>

        {/* Table of Ledger */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0B1530] text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="py-2.5 px-3">Ngày</th>
                <th className="py-2.5 px-4">Tiêu chí</th>
                <th className="py-2.5 px-3 text-center">Thay đổi</th>
                <th className="py-2.5 px-4">Lý do & Hoạt động</th>
                <th className="py-2.5 px-4">Người xác nhận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {historyEntries.map((item, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">{item.date}</td>
                  <td className="py-2.5 px-4 font-bold text-white">
                    <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/10 mr-1.5 text-[11px]">
                      {item.criterion}
                    </span>
                    {item.criterionName}
                  </td>
                  <td className="py-2.5 px-3 text-center font-black">
                    <span
                      className={
                        item.delta > 0
                          ? 'text-emerald-400'
                          : item.delta < 0
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }
                    >
                      {item.delta > 0 ? `+${item.delta}` : item.delta}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-300 max-w-xs">{item.reason}</td>
                  <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">{item.approver}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispute Modal (Q06) */}
      {disputeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-white/20 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#F5B301]" />
                Đề Nghị Giải Trình & Đối Chiếu (Q06)
              </h3>
              <button
                onClick={() => setDisputeModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {disputeSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Đã Gửi Đề Nghị Thành Công!</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Ban Chủ nhiệm và Trưởng ban sẽ tiếp nhận và phản hồi trong thời hạn 3 ngày làm việc.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDisputeSubmit} className="space-y-3.5">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Theo quy chế Q06, thành viên có quyền giải trình kèm minh chứng. Vui lòng nêu rõ lý do và cung cấp link minh chứng.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nội dung đề nghị đối chiếu / sửa đổi:
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="VD: Em xin phép đối chiếu buổi họp ngày 05/10, em có mặt từ 14:00 đến hết buổi nhưng bị ghi nhận muộn..."
                    className="w-full bg-[#070D1E] border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1E63D6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Link minh chứng (nếu có):
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    className="w-full bg-[#070D1E] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1E63D6]"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setDisputeModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/5 text-slate-300 hover:bg-white/10"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-[#1E63D6] text-white hover:bg-[#1E63D6]/90 shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi Đề Nghị</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
