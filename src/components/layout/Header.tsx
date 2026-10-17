'use client'

import React, { useState } from 'react'
import { useAuth, PRESET_USERS } from '@/lib/auth/AuthContext'
import {
  Search,
  Bell,
  Home,
  ChevronDown,
  Check,
  User,
  Smartphone,
  ExternalLink,
  Crown,
  Shield,
  Sparkles,
  Lock,
  ArrowRight,
  LogOut,
} from 'lucide-react'

interface HeaderProps {
  searchTerm: string
  onSearchChange: (val: string) => void
  pendingCount?: number
  onNotificationClick?: () => void
  onHomeClick?: () => void
}

export function Header({
  searchTerm,
  onSearchChange,
  pendingCount = 0,
  onNotificationClick,
  onHomeClick,
}: HeaderProps) {
  const { currentUser, isBCN, logout } = useAuth()
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)
  const [language, setLanguage] = useState<'vi' | 'en'>('vi')

  // Notification count: chỉ hiển thị huy hiệu khi có đề xuất/thông báo chờ xử lý thực tế
  const badgeDisplay = pendingCount > 0 ? pendingCount : 0

  return (
    <header className="h-14 sm:h-15 bg-white border-b border-slate-200/90 px-3 sm:px-6 md:px-10 lg:px-16 xl:px-20 flex items-center justify-between sticky top-0 z-30 select-none shadow-2xs">
      {/* LEFT: Logo + Pill Search Bar (Clean without launcher) */}
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        {/* Câu Lạc Bộ Đại Sứ Sinh Viên Logo */}
        <button
          type="button"
          onClick={onHomeClick}
          className="flex items-center gap-2 hover:opacity-90 transition focus:outline-none shrink-0 cursor-pointer"
          title="Câu Lạc Bộ Đại Sứ Sinh Viên (VNU-IS Ambassadors Club)"
        >
          <img
            src="/club-ambassadors-logo.png"
            alt="CÂU LẠC BỘ ĐẠI SỨ SINH VIÊN - BRIDGE TO SUCCESS - VNU-IS AMBASSADORS CLUB"
            className="h-8 sm:h-9 w-auto object-contain"
          />
        </button>

        {/* Pill Search Input with right-aligned search icon */}
        <div className="relative w-44 sm:w-64 md:w-80 lg:w-96">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm..."
            className="w-full h-8 sm:h-9 rounded-full bg-white border border-slate-200/90 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 pl-4 pr-9 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition shadow-2xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* RIGHT: Flags + Trang chủ + Tin tức (297) + User Profile */}
      <div className="flex items-center gap-3 sm:gap-5 md:gap-6 shrink-0">
        {/* Language Flags */}
        <div className="flex items-center gap-1.5">
          {/* Vietnam Flag */}
          <button
            type="button"
            onClick={() => setLanguage('vi')}
            className={`p-0.5 rounded transition cursor-pointer ${
              language === 'vi'
                ? 'ring-1.5 ring-blue-500 shadow-xs'
                : 'opacity-70 hover:opacity-100'
            }`}
            title="Tiếng Việt (Vietnamese)"
          >
            <img
              src="/flag-vn.svg"
              alt="Vietnam Flag"
              className="w-6 h-4 object-cover rounded-[2px] border border-slate-200/60 shadow-2xs block"
            />
          </button>

          {/* United Kingdom Flag */}
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`p-0.5 rounded transition cursor-pointer ${
              language === 'en'
                ? 'ring-1.5 ring-blue-500 shadow-xs'
                : 'opacity-70 hover:opacity-100'
            }`}
            title="English (United Kingdom)"
          >
            <img
              src="/flag-uk.svg"
              alt="UK Flag"
              className="w-6 h-4 object-cover rounded-[2px] border border-slate-200/60 shadow-2xs block"
            />
          </button>
        </div>

        {/* Divider line */}
        <div className="hidden sm:block h-4 w-px bg-slate-200" />

        {/* Home Navigation: "Trang chủ" */}
        <button
          type="button"
          onClick={onHomeClick}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-blue-600 transition cursor-pointer py-1 px-1 rounded-md"
          title="Về Trang chủ Dashboard"
        >
          <Home className="w-4 h-4 text-slate-600 shrink-0" />
          <span className="hidden sm:inline">Trang chủ</span>
        </button>

        {/* News & Notification: "Tin tức" with red badge */}
        <button
          type="button"
          onClick={onNotificationClick}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-blue-600 transition cursor-pointer py-1 px-1 rounded-md group"
          title="Xem thông báo tin tức & xét duyệt thi đua"
        >
          <div className="relative flex items-center justify-center">
            <Bell className="w-4 h-4 text-slate-600 group-hover:text-blue-600 transition shrink-0" />
            {badgeDisplay > 0 && (
              <span className="absolute -top-2.5 -right-3.5 bg-[#E53E3E] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs leading-tight tracking-tight border border-white animate-pulse">
                {badgeDisplay > 99 ? '99+' : badgeDisplay}
              </span>
            )}
          </div>
          <span className="hidden sm:inline ml-1.5">Tin tức</span>
        </button>

        {/* User Account Profile Pill */}
        <div className="relative">
          {!currentUser ? (
            <a
              href="/login"
              className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-[#1351D8] text-white hover:bg-blue-700 transition font-bold text-xs shadow-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Đăng nhập</span>
            </a>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2 py-1 px-2 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition cursor-pointer select-none group"
                title="Tài khoản cá nhân"
              >
                {/* Gray Circular Avatar with Person Silhouette */}
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-slate-300">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 fill-slate-400 text-slate-400" />
                  )}
                </div>

                {/* Username in UPPERCASE */}
                <span className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight uppercase truncate max-w-[85px] sm:max-w-none">
                  {currentUser.name}
                </span>

                {/* Downward Caret */}
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-800 transition" />
              </button>

              {/* User Account Dropdown Modal */}
              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200/90 shadow-xl p-3 space-y-2 z-50 animate-fadeIn text-xs">
                  <div className="px-3.5 py-2.5 border border-blue-100 bg-gradient-to-br from-blue-50/70 to-slate-50/90 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                      Tài khoản đang đăng nhập
                    </span>
                    <p className="font-black text-slate-900 text-sm tracking-tight">
                      {currentUser.name}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1351D8] text-white shadow-2xs">
                        <Crown className="w-2.5 h-2.5 text-amber-300" />
                        {currentUser.roleTitle}
                      </span>
                      {currentUser.memberCode && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          MSV: {currentUser.memberCode}
                        </span>
                      )}
                    </div>
                    {currentUser.departmentName && (
                      <p className="text-[10px] text-slate-500 font-medium pt-0.5">
                        Đơn vị: <strong className="text-slate-700">{currentUser.departmentName}</strong>
                      </p>
                    )}
                  </div>

                  {/* Quick Link to Member Portal */}
                  <div className="py-1">
                    <a
                      href="/checkin"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-blue-600 hover:bg-blue-50 font-bold transition"
                    >
                      <span className="flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Cổng Thành Viên Check-in</span>
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    </a>
                  </div>

                  {/* Actions: Đăng xuất */}
                  <div className="pt-1.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setRoleDropdownOpen(false)
                        logout()
                        window.location.href = '/login'
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition text-left cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span>Đăng xuất hệ thống</span>
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
