'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useLanguage } from '@/lib/context/LanguageContext'
import {
  Search,
  Bell,
  Home,
  ChevronDown,
  User,
  Smartphone,
  ExternalLink,
  Crown,
  Lock,
  LogOut,
  X,
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
  const { currentUser, logout } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const roleDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false)
      }
    }
    if (roleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [roleDropdownOpen])

  // Notification count: chỉ hiển thị huy hiệu khi có đề xuất/thông báo chờ xử lý thực tế
  const badgeDisplay = pendingCount > 0 ? pendingCount : 0

  // Tên rút gọn cho màn hình điện thoại (VD: "GIANG LÊ HIỆP" -> "HIỆP")
  const shortName = currentUser?.name
    ? currentUser.name.trim().split(' ').slice(-1)[0]
    : ''

  return (
    <header className="w-full shrink-0 h-14 sm:h-15 bg-white border-b border-slate-200/90 px-3 sm:px-6 md:px-10 lg:px-16 xl:px-20 flex items-center justify-between sticky top-0 z-30 select-none shadow-2xs">
      {/* Khi mở ô tìm kiếm trên mobile: Hiển thị thanh search toàn phần */}
      {isMobileSearchOpen ? (
        <div className="flex items-center gap-2 w-full animate-fadeIn sm:hidden">
          <div className="relative flex-1">
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm kiếm thành viên, sự kiện..."
              className="w-full h-8.5 rounded-full bg-slate-50 border border-blue-500 focus:bg-white pl-8 pr-7 text-xs text-slate-800 placeholder:text-slate-400 outline-none shadow-xs"
            />
            <Search className="w-3.5 h-3.5 text-blue-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(false)}
            className="text-xs font-bold text-slate-600 hover:text-blue-600 px-2 py-1.5 rounded-lg active:bg-slate-100 transition shrink-0"
          >
            Đóng
          </button>
        </div>
      ) : (
        <>
          {/* LEFT: Logo + Pill Search Bar */}
          <div className="flex items-center gap-2 sm:gap-6 min-w-0">
            {/* Logo CLB: Badge icon trên mobile, Full logo trên tablet/desktop */}
            <button
              type="button"
              onClick={onHomeClick}
              className="flex items-center gap-1.5 hover:opacity-90 transition focus:outline-none shrink-0 cursor-pointer"
              title="Câu Lạc Bộ Đại Sứ Sinh Viên (VNU-IS Ambassadors Club)"
            >
              {/* Mobile: Huy hiệu badge tròn + chữ iSSAC tinh gọn */}
              <div className="flex items-center gap-1.5 sm:hidden">
                <img
                  src="/logo-badge.png"
                  alt="iSSAC Logo"
                  className="h-8 w-8 object-contain"
                />
                <span className="font-black text-sm text-[#0B1E48] tracking-tight">
                  iSSAC
                </span>
              </div>

              {/* Tablet & Desktop: Logo đầy đủ */}
              <img
                src="/club-ambassadors-logo.png"
                alt="CÂU LẠC BỘ ĐẠI SỨ SINH VIÊN - BRIDGE TO SUCCESS - VNU-IS AMBASSADORS CLUB"
                className="hidden sm:block h-8 sm:h-9 w-auto object-contain"
              />
            </button>

            {/* Desktop Pill Search Bar (Ẩn trên mobile để dành cho nút search icon) */}
            <div className="hidden sm:block relative w-44 sm:w-56 md:w-72 lg:w-80">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t('header.search_placeholder')}
                className="w-full h-8 sm:h-9 rounded-full bg-white border border-slate-200/90 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 pl-4 pr-9 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition shadow-2xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* RIGHT: Search icon (mobile) + Flags + Home + News + User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-5 md:gap-6 shrink-0">
            {/* Mobile Search Trigger Button */}
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(true)}
              className="sm:hidden p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
              title="Tìm kiếm"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Language Flags */}
            {/* Mobile: 1 nút toggle chuyển đổi nhanh giữa VI & EN */}
            <div className="sm:hidden flex items-center">
              <button
                type="button"
                onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
                className="p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer flex items-center gap-1"
                title={`Đang chọn: ${language === 'vi' ? 'Tiếng Việt' : 'English'}. Bấm để chuyển đổi.`}
              >
                <img
                  src={language === 'vi' ? '/flag-vn.svg' : '/flag-uk.svg'}
                  alt={language === 'vi' ? 'Vietnam Flag' : 'UK Flag'}
                  className="w-5 h-3.5 object-cover rounded-[2px] border border-slate-200 shadow-2xs block"
                />
              </button>
            </div>

            {/* Desktop: Cả 2 cờ Việt Nam và UK chuẩn Ảnh 1 (Không có viền bọc ngoài) */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setLanguage('vi')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                  language === 'vi'
                    ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] scale-105'
                    : 'opacity-55 hover:opacity-100 hover:bg-slate-100/50'
                }`}
                title="Tiếng Việt (Vietnamese)"
              >
                <img
                  src="/flag-vn.svg"
                  alt="Vietnam Flag"
                  className="w-6 h-4 object-cover rounded-[2px] block"
                />
              </button>

              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                  language === 'en'
                    ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] scale-105'
                    : 'opacity-55 hover:opacity-100 hover:bg-slate-100/50'
                }`}
                title="English (United Kingdom)"
              >
                <img
                  src="/flag-uk.svg"
                  alt="UK Flag"
                  className="w-6 h-4 object-cover rounded-[2px] block"
                />
              </button>
            </div>

            {/* Divider line */}
            <div className="hidden sm:block h-4 w-px bg-slate-200" />

            {/* Home Navigation */}
            <button
              type="button"
              onClick={onHomeClick}
              className="hidden sm:flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-blue-600 transition cursor-pointer py-1 px-1 rounded-md"
              title="Về Trang chủ Dashboard"
            >
              <Home className="w-4 h-4 text-slate-600 shrink-0" />
              <span>{t('header.home')}</span>
            </button>

            {/* News & Notification */}
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
              <span className="hidden sm:inline ml-1.5">{t('header.news')}</span>
            </button>

            {/* User Account Profile Pill */}
            <div ref={roleDropdownRef} className="relative">
              {!currentUser ? (
                <a
                  href="/login"
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#0284C7] text-white hover:bg-[#0369a1] transition font-bold text-xs shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Đăng nhập</span>
                </a>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                    className="flex items-center gap-2 py-1 px-1.5 sm:px-2 rounded-xl hover:bg-slate-50 transition cursor-pointer select-none group focus:outline-none"
                    title="Tài khoản cá nhân"
                  >
                    {/* Circular Avatar */}
                    <div className="w-7 h-7 rounded-full bg-[#E2E8F0] text-slate-400 flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-slate-300">
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

                    {/* Username in all-caps uppercase matching Image 1 */}
                    <span className="sm:hidden text-xs font-bold text-[#061651] tracking-tight uppercase max-w-[65px] truncate">
                      {shortName}
                    </span>
                    <span className="hidden sm:inline text-xs sm:text-sm font-bold text-[#061651] tracking-tight uppercase truncate max-w-[140px] md:max-w-none">
                      {currentUser.name}
                    </span>

                    {/* Downward Caret */}
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-500 group-hover:text-slate-800 transition-transform duration-200 ${
                        roleDropdownOpen ? 'rotate-180 text-slate-800' : ''
                      }`}
                    />
                  </button>

                  {/* User Account Dropdown Modal */}
                  {roleDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-[320px] sm:w-80 rounded-2xl bg-white border border-slate-200/90 shadow-xl p-3 space-y-2.5 z-50 animate-fadeIn text-xs">
                      {/* Card thông tin người dùng cân đối & mềm mại */}
                      <div className="p-3 bg-slate-50/90 rounded-xl space-y-2.5 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-full bg-sky-100 text-[#0284C7] flex items-center justify-center font-bold text-sm overflow-hidden ring-2 ring-white shadow-xs">
                              {currentUser.avatarUrl ? (
                                <img
                                  src={currentUser.avatarUrl}
                                  alt={currentUser.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{currentUser.name.slice(0, 1).toUpperCase()}</span>
                              )}
                            </div>
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-[#061651] text-sm tracking-tight truncate">
                              {currentUser.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-[#0284C7] border border-sky-200/60">
                                <Crown className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                                {currentUser.roleTitle}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Thông tin phụ: MSV & Đơn vị dạng cột cân bằng */}
                        <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 block font-normal text-[10px]">{t('header.student_id')}</span>
                            <span className="font-semibold text-slate-700 truncate block">
                              {currentUser.memberCode || '23070691'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-normal text-[10px]">{t('header.department')}</span>
                            <span className="font-semibold text-slate-700 truncate block">
                              {currentUser.departmentName || 'Ban Chủ nhiệm'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Link to Member Portal */}
                      <div>
                        <a
                          href="/checkin"
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:text-[#0284C7] hover:bg-sky-50/80 font-semibold transition group cursor-pointer"
                        >
                          <span className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0284C7] flex items-center justify-center">
                              <Smartphone className="w-4 h-4" />
                            </div>
                            <span className="text-xs">Cổng Thành Viên Check-in</span>
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0284C7] transition" />
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
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold transition text-left cursor-pointer group"
                        >
                          <span className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                              <LogOut className="w-4 h-4" />
                            </div>
                            <span className="text-xs">{t('header.logout')}</span>
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  )
}
