'use client'

import React, { useState, useMemo } from 'react'
import { useClub } from '@/lib/context/ClubContext'
import { useAuth } from '@/lib/auth/AuthContext'
import { getRatingLevel } from '@/lib/scoring/constants'
import { AddMemberModal } from '@/components/admin/AddMemberModal'
import {
  Trophy,
  Search,
  Award,
  Crown,
  Medal,
  ShieldCheck,
  UserPlus,
} from 'lucide-react'

export function LeaderboardTable({ initialDept = 'all' }: { initialDept?: string }) {
  const { members } = useClub()
  const { isBCN } = useAuth()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDept, setSelectedDept] = useState(initialDept)
  const [onlyCore, setOnlyCore] = useState(false)
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'rank'>('rank')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [addModalOpen, setAddModalOpen] = useState(false)

  const filteredMembers = useMemo(() => {
    return members
      .filter((m) => {
        const matchesSearch = m.full_name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesDept = selectedDept === 'all' || m.department_slug === selectedDept
        const matchesCore = !onlyCore || m.is_core
        return matchesSearch && matchesDept && matchesCore
      })
      .sort((a, b) => {
        let diff = 0
        if (sortBy === 'score') {
          diff = a.current_score - b.current_score
        } else if (sortBy === 'name') {
          diff = a.full_name.localeCompare(b.full_name)
        } else {
          diff = (a.rank_in_club || 0) - (b.rank_in_club || 0)
        }
        return sortOrder === 'asc' ? diff : -diff
      })
  }, [members, searchTerm, selectedDept, onlyCore, sortBy, sortOrder])

  return (
    <div id="leaderboard" className="space-y-6 pt-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F5B301]">
              Thi đua CLB
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" />
              PII-Protected (Không hiện SĐT, Email, MSSV)
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Bảng Xếp Hạng Đóng Góp & Hoạt Động
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Điểm khởi điểm 60. Tích lũy và cập nhật theo thời gian thực.
          </p>
        </div>

        {/* Ban Chủ nhiệm action button */}
        {isBCN && (
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-[#1E63D6] text-white hover:bg-[#1E63D6]/90 shadow-lg shadow-[#1E63D6]/20 transition-all self-start md:self-auto"
          >
            <UserPlus className="w-4 h-4 text-[#F5B301]" />
            <span>Thêm Thành Viên (BCN)</span>
          </button>
        )}
      </div>

      {/* Control Filters Bar */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo họ tên thành viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#070D1E]/90 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1E63D6] transition-all"
            />
          </div>

          {/* Core team toggle checkbox */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 select-none">
              <input
                type="checkbox"
                checked={onlyCore}
                onChange={(e) => setOnlyCore(e.target.checked)}
                className="rounded border-slate-700 text-[#F5B301] focus:ring-[#F5B301] bg-[#070D1E]"
              />
              <Award className="w-3.5 h-3.5 text-[#F5B301]" />
              <span>Chỉ Core Team ({members.filter((m) => m.is_core).length})</span>
            </label>
          </div>
        </div>

        {/* Department Filters */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
          {[
            { id: 'all', label: 'Tất cả', count: members.length },
            { id: 'bcn', label: 'Ban Chủ nhiệm', count: members.filter((m) => m.department_slug === 'bcn').length },
            { id: 'truyen-thong', label: 'Truyền thông', count: members.filter((m) => m.department_slug === 'truyen-thong').length },
            { id: 'tu-van', label: 'Tư vấn', count: members.filter((m) => m.department_slug === 'tu-van').length },
            { id: 'nhan-su', label: 'Nhân sự', count: members.filter((m) => m.department_slug === 'nhan-su').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedDept(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                selectedDept === tab.id
                  ? 'bg-[#1E63D6] text-white shadow-md shadow-[#1E63D6]/30'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedDept === tab.id ? 'bg-white/20 text-white' : 'bg-black/40 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#0B1530]/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Hạng</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Ban chuyên môn</th>
                <th className="py-3 px-4">Chức vụ</th>
                <th className="py-3 px-4 text-center">Core Team</th>
                <th className="py-3 px-4 text-right">Điểm hiện tại</th>
                <th className="py-3 px-4 text-center">Mức đánh giá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    Không tìm thấy thành viên nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const rating = getRatingLevel(member.current_score)
                  const isTop1 = member.rank_in_club === 1
                  const isTop2 = member.rank_in_club === 2
                  const isTop3 = member.rank_in_club === 3

                  return (
                    <tr
                      key={member.member_code}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* Rank Column */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center">
                          {isTop1 ? (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FDE047] to-[#D97706] text-black font-extrabold flex items-center justify-center shadow-md shadow-[#F5B301]/30">
                              <Crown className="w-3.5 h-3.5 fill-current" />
                            </div>
                          ) : isTop2 ? (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 font-extrabold flex items-center justify-center shadow">
                              <Medal className="w-3.5 h-3.5 fill-current" />
                            </div>
                          ) : isTop3 ? (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-white font-extrabold flex items-center justify-center shadow">
                              <Medal className="w-3.5 h-3.5 fill-current" />
                            </div>
                          ) : (
                            <span className="font-bold text-slate-400 group-hover:text-white text-xs">
                              #{member.rank_in_club}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4 font-semibold text-white text-xs whitespace-nowrap">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className="whitespace-nowrap">{member.full_name}</span>
                          {member.position === 'Cố vấn' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/30 whitespace-nowrap">
                              Cố vấn
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 text-slate-300 text-xs">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs bg-white/5 border border-white/10 font-medium">
                          {member.department_name}
                        </span>
                      </td>

                      {/* Position */}
                      <td className="py-3.5 px-4 text-slate-400 text-xs font-medium">
                        {member.position}
                      </td>

                      {/* Core Team Flag */}
                      <td className="py-3.5 px-4 text-center">
                        {member.is_core ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold badge-core">
                            <Award className="w-3 h-3 text-[#F5B301]" />
                            <span>Core Team (×2)</span>
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </td>

                      {/* Score */}
                      <td className="py-3.5 px-4 text-right font-black text-sm text-white">
                        <span
                          className={
                            member.current_score >= 85
                              ? 'text-emerald-400'
                              : member.current_score < 40
                              ? 'text-rose-400'
                              : 'text-white'
                          }
                        >
                          {member.current_score.toFixed(1)}
                        </span>
                      </td>

                      {/* Rating Level */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                          style={{
                            backgroundColor: `${rating.badge_color}18`,
                            color: rating.badge_color,
                            borderColor: `${rating.badge_color}40`,
                          }}
                        >
                          {rating.level_name}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      <AddMemberModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </div>
  )
}
