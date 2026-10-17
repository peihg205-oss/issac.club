'use client'

import React from 'react'
import { Users, TrendingUp, Award, ShieldAlert } from 'lucide-react'
import { useClub } from '@/lib/context/ClubContext'

export function StatCards() {
  const { members } = useClub()

  const total = members.length
  const totalScore = members.reduce((sum, m) => sum + m.current_score, 0)
  const avgScore = total > 0 ? Number((totalScore / total).toFixed(1)) : 0
  const coreCount = members.filter((m) => m.is_core).length
  const alertCount = members.filter((m) => m.current_score < 40).length

  const stats = [
    {
      title: 'Tổng nhân sự CLB',
      value: total.toString(),
      subtext: '4 ban chuyên môn',
      icon: Users,
      iconColor: 'text-[#38BDF8]',
      bgGradient: 'from-[#38BDF8]/20 to-[#0284C7]/5',
      borderColor: 'border-[#38BDF8]/30',
    },
    {
      title: 'Điểm trung bình CLB',
      value: `${avgScore}`,
      subtext: 'Thang điểm 0-100',
      icon: TrendingUp,
      iconColor: 'text-[#F5B301]',
      bgGradient: 'from-[#F5B301]/20 to-[#D97706]/5',
      borderColor: 'border-[#F5B301]/30',
    },
    {
      title: 'Đội ngũ Core Team',
      value: `${coreCount}`,
      subtext: 'Chế tài vi phạm ×2 điểm',
      icon: Award,
      iconColor: 'text-[#A78BFA]',
      bgGradient: 'from-[#A78BFA]/20 to-[#7C3AED]/5',
      borderColor: 'border-[#A78BFA]/30',
    },
    {
      title: 'Cần cải thiện / Cảnh cáo',
      value: `${alertCount}`,
      subtext: 'Dưới 40 điểm',
      icon: ShieldAlert,
      iconColor: 'text-[#EF4444]',
      bgGradient: 'from-[#EF4444]/20 to-[#B91C1C]/5',
      borderColor: 'border-[#EF4444]/30',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((stat, i) => {
        const Icon = stat.icon
        return (
          <div
            key={i}
            className={`glass-panel rounded-2xl p-5 border ${stat.borderColor} relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
          >
            <div
              className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-gradient-to-br ${stat.bgGradient} blur-2xl pointer-events-none`}
            />

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {stat.title}
              </span>
              <div className={`p-2.5 rounded-xl bg-white/5 border border-white/10 ${stat.iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white tracking-tight">
                {stat.value}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-2 font-medium">
              {stat.subtext}
            </p>
          </div>
        )
      })}
    </div>
  )
}
