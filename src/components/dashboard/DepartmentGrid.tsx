'use client'

import React from 'react'
import { useClub } from '@/lib/context/ClubContext'
import { DEPARTMENTS_DATA } from '@/lib/clubData'
import { Crown, Megaphone, MessagesSquare, Users2, ArrowRight } from 'lucide-react'

const ICON_MAP = {
  bcn: Crown,
  'truyen-thong': Megaphone,
  'tu-van': MessagesSquare,
  'nhan-su': Users2,
}

const COLOR_MAP = {
  bcn: {
    accent: '#F5B301',
    border: 'border-[#F5B301]/30',
    badge: 'bg-[#F5B301]/10 text-[#FDE047] border-[#F5B301]/30',
  },
  'truyen-thong': {
    accent: '#38BDF8',
    border: 'border-[#38BDF8]/30',
    badge: 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30',
  },
  'tu-van': {
    accent: '#34D399',
    border: 'border-[#34D399]/30',
    badge: 'bg-[#34D399]/10 text-[#34D399] border-[#34D399]/30',
  },
  'nhan-su': {
    accent: '#A78BFA',
    border: 'border-[#A78BFA]/30',
    badge: 'bg-[#A78BFA]/10 text-[#A78BFA] border-[#A78BFA]/30',
  },
}

interface DepartmentGridProps {
  onSelectDepartment?: (deptSlug: string) => void
}

export function DepartmentGrid({ onSelectDepartment }: DepartmentGridProps) {
  const { members } = useClub()

  return (
    <div id="departments" className="space-y-6 pt-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#F5B301]">
            Cơ cấu tổ chức
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            4 Ban Chuyên Môn iSSAC
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Quy mô phân bổ nhân sự chính thức nhiệm kỳ 2026-2027
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {DEPARTMENTS_DATA.map((dept) => {
          const Icon = ICON_MAP[dept.slug]
          const colors = COLOR_MAP[dept.slug]
          const deptMembers = members.filter((m) => m.department_slug === dept.slug)
          const leader = deptMembers.find(
            (m) => m.position.includes('Trưởng ban') || m.position.includes('Chủ nhiệm')
          )

          return (
            <div
              key={dept.slug}
              className={`glass-panel rounded-2xl p-6 border ${colors.border} flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/10"
                    style={{ backgroundColor: `${colors.accent}15`, color: colors.accent }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colors.badge}`}>
                    {deptMembers.length} thành viên
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-[#F5B301] transition-colors">
                  {dept.name}
                </h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {dept.description}
                </p>

                {leader && (
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">{leader.position}:</span>
                    <span className="text-slate-200 font-semibold">{leader.full_name}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-2">
                <a
                  href="#leaderboard"
                  onClick={() => onSelectDepartment?.(dept.slug)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 transition-colors"
                >
                  <span>Xem danh sách ban</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
