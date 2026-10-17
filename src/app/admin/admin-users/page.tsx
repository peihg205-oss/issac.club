'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AccountsView } from '@/components/views/AccountsView'
import { useAuth } from '@/lib/auth/AuthContext'
import {
  Home,
  ShieldCheck,
  UserCheck,
  Crown,
  LogOut,
  LogIn,
  KeyRound,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'

export default function AdminUsersPage() {
  const router = useRouter()
  const { currentUser, isAuthChecked, isBCN, logout } = useAuth()

  useEffect(() => {
    if (isAuthChecked && !currentUser) {
      router.replace('/login')
    }
  }, [isAuthChecked, currentUser, router])

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFBFC]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!currentUser) return null

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBFC]">
      {/* Top Header - Matching URL & Brand from Screenshot */}
      <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-8 lg:px-12 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition"
            title="Về Trang chủ hệ thống"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
              iS
            </div>
            <div className="hidden sm:block text-left">
              <div className="font-extrabold text-blue-900 text-sm tracking-tight leading-tight">
                iSSAC Admin
              </div>
              <div className="text-[11px] text-slate-500 font-medium leading-none">
                Recruitment Portal
              </div>
            </div>
          </Link>

          <div className="hidden md:flex items-center text-slate-300">
            <ChevronRight className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              HỆ THỐNG QUẢN TRỊ TUYỂN QUÂN GEN 3
              <span className="text-slate-400 font-normal">
                · CLB Đại sứ Sinh viên Trường Quốc tế - ĐHQGHN (ISSAC)
              </span>
            </div>

            <Link
              href="/"
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="Về Dashboard"
            >
              <Home className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Right Admin Profile & Quick Links */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-3 py-1.5 rounded-lg transition"
            title="Kiểm tra trang đăng nhập"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Trang Đăng Nhập</span>
          </Link>

          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {currentUser.name ? currentUser.name.charAt(0) : 'U'}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <span>{currentUser.name}</span>
                  {isBCN && <Crown className="w-3 h-3 text-amber-500" />}
                </div>
                <div className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                  <span>{currentUser.roleTitle || 'Cán bộ CLB'}</span>
                </div>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 rounded-lg shadow-sm transition"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Content: AccountsView */}
      <main className="flex-1 py-6 sm:py-8 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto w-full">
        <AccountsView />
      </main>
    </div>
  )
}
