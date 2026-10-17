import React from 'react'
import { Shield, Lock, Award, Heart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-[#050914] text-slate-400 py-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1E63D6] flex items-center justify-center text-[#F5B301]">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg text-white">
              Câu Lạc bộ Đại sứ sinh viên Trường Quốc tế - ĐHQGHN
            </span>
          </div>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed">
            Hệ thống quản lý, đối chiếu và kiểm soát điểm hoạt động chính thức của Câu Lạc bộ Đại sứ sinh viên Trường Quốc tế. Minh bạch, chuẩn mực và bảo vệ quyền lợi thành viên.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Bảo mật PII nghiêm ngặt
            </span>
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Thang chuẩn 0-100 điểm
            </span>
          </div>
        </div>

        {/* 4 Ban */}
        <div>
          <h4 className="text-white text-sm font-semibold tracking-wider uppercase mb-3">
            Cơ cấu 4 Ban
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <span className="text-slate-300 hover:text-white transition-colors">Ban Chủ nhiệm (BCN)</span>
            </li>
            <li>
              <span className="text-slate-300 hover:text-white transition-colors">Ban Truyền thông (TT)</span>
            </li>
            <li>
              <span className="text-slate-300 hover:text-white transition-colors">Ban Tư vấn (TV)</span>
            </li>
            <li>
              <span className="text-slate-300 hover:text-white transition-colors">Ban Nhân sự (NS)</span>
            </li>
          </ul>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-white text-sm font-semibold tracking-wider uppercase mb-3">
            Đường dẫn nhanh
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="/#leaderboard" className="hover:text-white transition-colors">Bảng xếp hạng thi đua</a>
            </li>
            <li>
              <a href="/#rules" className="hover:text-white transition-colors">Bảng tiêu chí C01-T13</a>
            </li>
            <li>
              <a href="/me" className="hover:text-white transition-colors">Tra cứu điểm cá nhân</a>
            </li>
            <li>
              <a href="/checkin" className="hover:text-white transition-colors">Cổng check-in buổi họp</a>
            </li>
            <li>
              <a href="/admin" className="hover:text-[#F5B301] transition-colors">Khu vực Ban Quản trị</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>© 2025-2026 iSSAC Club - International School, VNU. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Thiết kế & phát triển với <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> cho iSSAC members
        </p>
      </div>
    </footer>
  )
}
