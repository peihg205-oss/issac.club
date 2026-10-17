'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth, PRESET_USERS } from '@/lib/auth/AuthContext'
import { useClub } from '@/lib/context/ClubContext'
import {
  Shield,
  Trophy,
  Users,
  BookOpen,
  UserCheck,
  KeyRound,
  Menu,
  X,
  Sparkles,
  ChevronDown,
  Crown,
  ClipboardList,
  Check,
} from 'lucide-react'

export function Navbar() {
  const { currentUser, switchUser, isBCN, isHR } = useAuth()
  const { proposals } = useClub()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)

  const pendingCount = proposals.filter((p) => p.status === 'pending_bcn').length

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/10 bg-[#070D1E]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1E63D6] to-[#0B1F4B] p-0.5 shadow-md shadow-[#1E63D6]/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#070D1E] rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#F5B301]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-[#F5B301] transition-colors">
                  iSSAC<span className="text-[#F5B301]">_Web</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-semibold bg-[#1E63D6]/20 text-[#60A5FA] border border-[#1E63D6]/30">
                  2026-2027
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                Hệ thống Quản lý Điểm Hoạt động CLB
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Trophy className="w-3.5 h-3.5 text-[#F5B301]" />
              <span>Bảng xếp hạng</span>
            </Link>

            <Link
              href="/#departments"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>4 Ban</span>
            </Link>

            <Link
              href="/#rules"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span>Quy chế</span>
            </Link>

            <Link
              href="/me"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#34D399]" />
              <span>Tra cứu cá nhân</span>
            </Link>

            <Link
              href="/checkin"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F43F5E]" />
              <span>Đăng ký &amp; Check-in</span>
            </Link>
          </nav>

          {/* Role Switcher & Admin Button */}
          <div className="hidden md:flex items-center gap-3">
            {/* Quick Role Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all select-none"
              >
                <div className={`w-2.5 h-2.5 rounded-full ${currentUser?.avatarBg || 'bg-blue-600'}`} />
                <span className="truncate max-w-[130px]">{currentUser?.name || 'Khách'}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-[#F5B301] border border-white/10">
                  {currentUser?.role === 'bcn' ? '👑 BCN' : currentUser?.role === 'hr' ? '📋 NS' : 'TV'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl glass-panel-glow border border-white/15 shadow-2xl p-2 space-y-1 z-50 animate-fadeIn">
                  <div className="px-3 py-2 border-b border-white/10 mb-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Chọn vai trò đăng nhập
                    </p>
                    <p className="text-xs font-bold text-white mt-0.5">Phân quyền theo quy chế CLB</p>
                  </div>

                  {PRESET_USERS.map((user) => {
                    const isSelected = user.id === currentUser?.id
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          switchUser(user.id)
                          setRoleDropdownOpen(false)
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all ${
                          isSelected
                            ? 'bg-[#1E63D6]/20 border border-[#1E63D6]/40 text-white'
                            : 'hover:bg-white/5 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.name}
                              className="w-7 h-7 rounded-full object-cover border border-white/20 flex-shrink-0"
                            />
                          ) : (
                            <div
                              className={`w-7 h-7 rounded-lg ${user.avatarBg} flex items-center justify-center font-bold text-white text-[11px] flex-shrink-0`}
                            >
                              {user.name.charAt(0)}
                            </div>
                          )}
                          <div className="truncate">
                            <span className="font-bold text-white block truncate">{user.name}</span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {user.roleTitle}
                            </span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#F5B301] flex-shrink-0 ml-2" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Admin Hub Link */}
            <Link
              href="/admin"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                isBCN
                  ? 'bg-gradient-to-r from-amber-500 to-[#1E63D6] text-white border border-amber-500/30'
                  : 'bg-[#1E63D6] text-white hover:bg-[#1E63D6]/90'
              }`}
            >
              {isBCN ? <Crown className="w-3.5 h-3.5 text-[#F5B301]" /> : <KeyRound className="w-3.5 h-3.5" />}
              <span>{isBCN ? 'Quản trị BCN' : isHR ? 'Nhân sự chấm điểm' : 'Quản trị'}</span>
              {pendingCount > 0 && isBCN && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                  {pendingCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#070D1E] px-4 pt-3 pb-5 space-y-3">
          {/* Mobile Role Switcher */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Đang đăng nhập với vai trò:
            </span>
            <select
              value={currentUser?.id || ''}
              onChange={(e) => switchUser(e.target.value)}
              className="w-full bg-[#0B1530] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
            >
              {PRESET_USERS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} - {u.roleTitle}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              <Trophy className="w-4 h-4 text-[#F5B301]" />
              <span>Bảng xếp hạng thi đua</span>
            </Link>

            <Link
              href="/#departments"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              <Users className="w-4 h-4 text-[#38BDF8]" />
              <span>4 Ban chuyên môn</span>
            </Link>

            <Link
              href="/#rules"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              <BookOpen className="w-4 h-4 text-[#A78BFA]" />
              <span>Quy chế tính điểm</span>
            </Link>

            <Link
              href="/me"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              <UserCheck className="w-4 h-4 text-[#34D399]" />
              <span>Tra cứu điểm cá nhân</span>
            </Link>

            <Link
              href="/checkin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              <Sparkles className="w-4 h-4 text-[#F43F5E]" />
              <span>Đăng ký &amp; Check-in</span>
            </Link>
          </div>

          <div className="pt-2 border-t border-white/10">
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1E63D6] text-white hover:bg-[#1E63D6]/90 shadow-md"
            >
              <KeyRound className="w-4 h-4 text-[#F5B301]" />
              <span>Vào khu vực Quản trị & Duyệt điểm</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
