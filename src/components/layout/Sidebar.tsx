'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  LayoutGrid,
  Users,
  QrCode,
  Clock,
  BookOpen,
  Trophy,
  Settings,
  KeyRound,
} from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import { canUserManageAccounts } from '@/lib/auth/permissions'
import { useClub } from '@/lib/context/ClubContext'

export type ActiveNavTab =
  | 'dashboard'
  | 'members'
  | 'checkin'
  | 'history'
  | 'rules'
  | 'stats'
  | 'accounts'
  | 'settings'

export interface SidebarProps {
  activeTab: ActiveNavTab
  onSelectTab: (tab: ActiveNavTab) => void
  pendingCount?: number
  hasActiveEvent?: boolean
  isOpen?: boolean
  onToggle?: () => void
}

// 7 themes: Default is Vibrant Royal Blue (#1351D8) matching user's Image 2
export const SIDEBAR_THEMES = [
  {
    id: 'blue',
    name: 'Xanh Royal (Mặc định)',
    circleBg: '#1351D8',
    headerBg: '#1351D8',
    activeText: '#1351D8',
    headerText: 'text-blue-200/90',
  },
  {
    id: 'navy',
    name: 'Xanh Navy ĐHQG',
    circleBg: '#1E293B',
    headerBg: '#1E293B',
    activeText: '#1E293B',
    headerText: 'text-slate-300/90',
  },
  {
    id: 'purple',
    name: 'Tím Violet',
    circleBg: '#7C3AED',
    headerBg: '#7C3AED',
    activeText: '#7C3AED',
    headerText: 'text-purple-200/90',
  },
  {
    id: 'royal',
    name: 'Xanh Chàm Slate',
    circleBg: '#4F46E5',
    headerBg: '#4F46E5',
    activeText: '#4F46E5',
    headerText: 'text-indigo-200/90',
  },
  {
    id: 'red',
    name: 'Đỏ Nhiệt Huyết',
    circleBg: '#DC2626',
    headerBg: '#DC2626',
    activeText: '#DC2626',
    headerText: 'text-red-200/90',
  },
  {
    id: 'cyan',
    name: 'Xanh Ngọc Aqua',
    circleBg: '#0891B2',
    headerBg: '#0891B2',
    activeText: '#0891B2',
    headerText: 'text-cyan-100/90',
  },
  {
    id: 'white',
    name: 'Trắng Tinh Khôi',
    circleBg: '#FFFFFF',
    circleBorder: 'border border-slate-300',
    headerBg: '#FFFFFF',
    activeText: '#1351D8',
    headerText: 'text-slate-500',
    isLight: true,
  },
]

export function Sidebar({
  activeTab,
  onSelectTab,
  pendingCount = 0,
  hasActiveEvent = true,
  isOpen = false,
  onToggle,
}: SidebarProps) {
  const { currentUser, isBCN, canManageAccounts } = useAuth()
  const { members } = useClub()

  // Chỉ Ban Chủ nhiệm mới có quyền quản trị và xem Cấp tài khoản Ban
  const isAccountManager = isBCN || canManageAccounts || canUserManageAccounts(currentUser)

  // Theme state: defaults to Royal Blue (#1451D8)
  const [themeId, setThemeId] = useState<string>('blue')
  const menuRef = useRef<HTMLDivElement>(null)

  // Load saved theme if any
  useEffect(() => {
    const saved = localStorage.getItem('issac_sidebar_theme')
    if (saved && SIDEBAR_THEMES.some((t) => t.id === saved)) {
      setThemeId(saved)
    }
  }, [])

  const handleSelectTheme = (id: string) => {
    setThemeId(id)
    localStorage.setItem('issac_sidebar_theme', id)
  }

  const currentTheme =
    SIDEBAR_THEMES.find((t) => t.id === themeId) || SIDEBAR_THEMES[0]

  // Count to display for pending approval (from Image 2: "3" or dynamic pendingCount)
  const displayPendingCount = pendingCount > 0 ? pendingCount : 3

  // Section 1: QUẢN TRỊ & ĐIỂM SỐ
  const section1Items: Array<{
    id: ActiveNavTab
    label: string
    icon: React.ElementType
    badge?: string | number
    badgeType?: 'live' | 'counter' | 'pill'
  }> = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutGrid,
    },
    {
      id: 'members',
      label: 'Hồ sơ thành viên',
      icon: Users,
    },
    {
      id: 'checkin',
      label: 'Điểm danh Check-in',
      icon: QrCode,
      badge: hasActiveEvent ? 'LIVE' : undefined,
      badgeType: 'live',
    },
    {
      id: 'history',
      label: 'Chấm điểm & Duyệt',
      icon: Clock,
      badge: displayPendingCount,
      badgeType: 'counter',
    },
    {
      id: 'rules',
      label: 'Bảng quy định',
      icon: BookOpen,
    },
  ]

  // Section 2: CÔNG CỤ & HỆ THỐNG
  // Chỉ hiển thị tab "Cấp tài khoản Ban" duy nhất cho tài khoản Ban Chủ nhiệm
  const section2Items: Array<{
    id: ActiveNavTab
    label: string
    icon: React.ElementType
    badge?: string | number
    badgeType?: 'live' | 'counter' | 'pill'
  }> = [
    {
      id: 'stats',
      label: 'Bảng xếp hạng',
      icon: Trophy,
      badge: `TOP ${members.length || 48}`,
      badgeType: 'pill',
    },
    ...(isAccountManager
      ? [
          {
            id: 'accounts' as ActiveNavTab,
            label: 'Cấp tài khoản Ban',
            icon: KeyRound,
            badge: 'BCN',
            badgeType: 'pill' as const,
          },
        ]
      : []),
    {
      id: 'settings',
      label: 'Cài đặt hệ thống',
      icon: Settings,
    },
  ]

  // 9-Dots Grid Icon
  const NineDotsIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <rect x="2.5" y="2.5" width="4.8" height="4.8" rx="1.5" />
      <rect x="9.6" y="2.5" width="4.8" height="4.8" rx="1.5" />
      <rect x="16.7" y="2.5" width="4.8" height="4.8" rx="1.5" />
      <rect x="2.5" y="9.6" width="4.8" height="4.8" rx="1.5" />
      <rect x="9.6" y="9.6" width="4.8" height="4.8" rx="1.5" />
      <rect x="16.7" y="9.6" width="4.8" height="4.8" rx="1.5" />
      <rect x="2.5" y="16.7" width="4.8" height="4.8" rx="1.5" />
      <rect x="9.6" y="16.7" width="4.8" height="4.8" rx="1.5" />
      <rect x="16.7" y="16.7" width="4.8" height="4.8" rx="1.5" />
    </svg>
  )

  // STATE 1: COLLAPSED
  // Căn sát lề trái (left-0), dính mép màn hình cân đối (rounded-r-xl rounded-l-none border-l-0)
  if (!isOpen) {
    return (
      <div className="fixed left-0 top-[74px] z-30 select-none">
        <button
          type="button"
          onClick={onToggle}
          className="w-10 h-10 rounded-r-xl rounded-l-none bg-[#EFF6FF] border border-l-0 border-blue-200/90 hover:bg-[#DBEAFE] hover:border-blue-300 shadow-md hover:shadow-lg flex items-center justify-center cursor-pointer transition-all active:scale-95 group text-slate-600 hover:text-blue-600"
          title="Mở thanh điều hướng (Menu 9 chấm)"
        >
          <NineDotsIcon className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
        </button>
      </div>
    )
  }

  // STATE 2: EXPANDED
  // Cỡ chữ to như ảnh 1 (text-[14px]), khung tổng hơi hơi tròn (rounded-r-2xl), các phần tử bên trong bo tròn mềm mại (rounded-xl, rounded-full)
  return (
    <>
      {/* Click-outside backdrop to dismiss */}
      <div
        className="fixed inset-0 z-30 bg-black/40 backdrop-blur-2xs sm:bg-transparent"
        onClick={onToggle}
        aria-hidden="true"
      />

      {/* Floating Menu Drawer: Flush against left edge (left-0), Fixed with 18px gap below Header (top-[74px]) */}
      <div
        ref={menuRef}
        className="fixed left-0 top-[70px] sm:top-[74px] z-40 select-none animate-fadeIn max-h-[calc(100vh-80px)]"
      >
        <div className="relative">
          {/* Launcher button attached to top-right of the menu drawer: rounded-xl */}
          <button
            type="button"
            onClick={onToggle}
            className="absolute -right-11 sm:-right-12 top-2 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#EFF6FF] border border-blue-200/90 hover:bg-[#DBEAFE] hover:border-blue-300 shadow-md hover:shadow-lg flex items-center justify-center cursor-pointer transition-all active:scale-95 z-50 group text-slate-600 hover:text-blue-600"
            title="Thu gọn thanh điều hướng (Menu 9 chấm)"
          >
            <NineDotsIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
          </button>

          {/* Main Container: Khung tổng hơi hơi tròn xíu tổng thể vẫn vuông (rounded-r-2xl), shadow-2xl, border-r border-b */}
          <div
            className="w-[260px] sm:w-72 rounded-r-2xl shadow-2xl overflow-y-auto max-h-[calc(100vh-85px)] border-r border-b border-black/15 transition-colors duration-200 flex flex-col justify-between"
            style={{ backgroundColor: currentTheme.headerBg }}
          >
            {/* Navigation Items: Cỡ chữ chuẩn ảnh 1, các thẻ con bo tròn mềm mại */}
            <div className="p-2.5 sm:p-3 space-y-3">
              {/* SECTION 1: QUẢN TRỊ & ĐIỂM SỐ */}
              <div>
                <div className="px-2.5 pt-0.5 pb-1.5">
                  <span
                    className={`text-[11px] font-extrabold tracking-wider uppercase ${currentTheme.headerText}`}
                  >
                    QUẢN TRỊ & ĐIỂM SỐ
                  </span>
                </div>

                <nav className="space-y-1">
                  {section1Items.map((item) => {
                    const Icon = item.icon
                    const isActive = activeTab === item.id

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectTab(item.id)
                          onToggle?.()
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 cursor-pointer text-left ${
                          isActive
                            ? 'bg-white shadow-xs font-bold'
                            : currentTheme.isLight
                            ? 'text-slate-700 hover:bg-slate-100 font-medium'
                            : 'text-white/95 hover:text-white hover:bg-white/10 font-medium'
                        }`}
                        style={
                          isActive
                            ? { color: currentTheme.activeText }
                            : undefined
                        }
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2.5">
                          <Icon
                            className="w-4.5 h-4.5 shrink-0"
                            style={
                              isActive
                                ? { color: currentTheme.activeText }
                                : undefined
                            }
                          />
                          <span className="truncate text-[14px] font-semibold tracking-tight">
                            {item.label}
                          </span>
                        </div>

                        {/* Badges: Bo tròn tròn (rounded-full) với hiệu ứng nhấp nháy cho LIVE */}
                        {item.badge !== undefined && (
                          item.badgeType === 'live' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00897B] text-white text-[10px] font-black tracking-wider shadow-xs shrink-0 select-none">
                              <span className="relative flex h-1.5 w-1.5 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-85" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                              </span>
                              <span>LIVE</span>
                            </span>
                          ) : (
                            <span
                              className={`text-[10.5px] font-bold rounded-full shrink-0 ${
                                item.badgeType === 'counter'
                                  ? 'bg-[#EF4444] text-white w-5.5 h-5.5 flex items-center justify-center text-[11px] font-black shadow-xs'
                                  : isActive
                                  ? 'bg-blue-100 text-blue-800 px-2.5 py-0.5 font-bold'
                                  : 'bg-white/20 text-white px-2.5 py-0.5'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )
                        )}
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* SECTION 2: CÔNG CỤ & HỆ THỐNG */}
              <div>
                <div className="px-2.5 pt-1 pb-1.5">
                  <span
                    className={`text-[11px] font-extrabold tracking-wider uppercase ${currentTheme.headerText}`}
                  >
                    CÔNG CỤ & HỆ THỐNG
                  </span>
                </div>

                <nav className="space-y-1">
                  {section2Items.map((item) => {
                    const Icon = item.icon
                    const isActive = activeTab === item.id

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectTab(item.id)
                          onToggle?.()
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 cursor-pointer text-left ${
                          isActive
                            ? 'bg-white shadow-xs font-bold'
                            : currentTheme.isLight
                            ? 'text-slate-700 hover:bg-slate-100 font-medium'
                            : 'text-white/95 hover:text-white hover:bg-white/10 font-medium'
                        }`}
                        style={
                          isActive
                            ? { color: currentTheme.activeText }
                            : undefined
                        }
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2.5">
                          <Icon
                            className="w-4.5 h-4.5 shrink-0"
                            style={
                              isActive
                                ? { color: currentTheme.activeText }
                                : undefined
                            }
                          />
                          <span className="truncate text-[14px] font-semibold tracking-tight">
                            {item.label}
                          </span>
                        </div>

                        {/* Badges: Bo tròn tròn (rounded-full) */}
                        {item.badge !== undefined && (
                          <span
                            className={`text-[10.5px] font-bold rounded-full shrink-0 ${
                              isActive
                                ? 'bg-blue-100 text-blue-800 px-2.5 py-0.5 font-bold'
                                : 'bg-white/20 text-white px-2.5 py-0.5'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>

            {/* BOTTOM THEME COLOR PALETTE (Chấm tròn nhỏ gọn, màu web basic, cân đối tổng thể) */}
            <div className="bg-white py-2.5 px-4 shrink-0 border-t border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-center gap-2.5 sm:gap-3">
                {SIDEBAR_THEMES.map((palette) => {
                  const isSelected = palette.id === themeId
                  return (
                    <button
                      key={palette.id}
                      type="button"
                      onClick={() => handleSelectTheme(palette.id)}
                      className={`w-4.5 h-4.5 rounded-full transition-all duration-150 cursor-pointer shrink-0 ${
                        palette.circleBorder || ''
                      } ${
                        isSelected
                          ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white shadow-xs scale-110'
                          : 'hover:scale-115 hover:opacity-95 opacity-90'
                      }`}
                      style={{ backgroundColor: palette.circleBg }}
                      title={`Đổi màu: ${palette.name}`}
                      aria-label={`Chọn màu ${palette.name}`}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
