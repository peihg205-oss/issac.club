'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Users,
  X,
  HelpCircle,
} from 'lucide-react'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/'

  const { login, currentUser, isAuthChecked } = useAuth()

  // Nếu đã đăng nhập thì tự động chuyển hướng vào hệ thống
  useEffect(() => {
    if (isAuthChecked && currentUser) {
      router.replace(redirectUrl)
    }
  }, [isAuthChecked, currentUser, redirectUrl, router])

  // Form states - sẵn sàng đăng nhập thật
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  // Modal quên mật khẩu
  const [showForgotModal, setShowForgotModal] = useState(false)

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)

    if (!account.trim()) {
      setFeedback({
        type: 'error',
        message: 'Vui lòng nhập Email sinh viên hoặc Mã số sinh viên (MSSV).',
      })
      return
    }

    if (!password.trim()) {
      setFeedback({
        type: 'error',
        message: 'Vui lòng nhập mật khẩu tài khoản.',
      })
      return
    }

    setLoading(true)

    setTimeout(() => {
      const result = login(account, password)
      setLoading(false)

      if (result.success) {
        setFeedback({
          type: 'success',
          message: result.message || 'Đăng nhập thành công! Đang chuyển hướng...',
        })
        setTimeout(() => {
          router.push(redirectUrl)
        }, 600)
      } else {
        setFeedback({
          type: 'error',
          message: result.message || 'Tài khoản hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.',
        })
      }
    }, 350)
  }

  return (
    <div className="min-h-screen bg-[#1351D8] text-white flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden select-none font-sans">
      {/* Background Subtle Ambience */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-blue-600/30 blur-3xl pointer-events-none" />

      {/* Main Container - 2 Columns */}
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14 z-10">
        
        {/* ============================================================== */}
        {/* CỘT TRÁI: LINH VẬT & HUY HIỆU iSSAC (CLICK ĐỂ VỀ TRANG CHỦ)    */}
        {/* ============================================================== */}
        <div className="flex-1 w-full flex items-center justify-center max-w-xl py-4 lg:py-0">
          <Link
            href="/"
            title="Về Trang chủ hệ thống"
            className="relative w-full max-w-[460px] sm:max-w-[520px] lg:max-w-[560px] flex items-center justify-center group animate-in fade-in zoom-in-95 duration-500 cursor-pointer"
          >
            {/* Soft Ambient Glow behind the mascot */}
            <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-3xl pointer-events-none transform -translate-y-4 scale-95" />
            <img
              src="/issac-mascot.png"
              alt="iSSAC Unicorn Mascot - Welcome to VNUIS Ambassadors Club"
              className="relative z-10 w-full h-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.35)] transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </Link>
        </div>

        {/* ============================================================== */}
        {/* CỘT PHẢI: KHUNG ĐĂNG NHẬP TRẮNG TINH GỌN, SANG TRỌNG (MAX-W-MD) */}
        {/* ============================================================== */}
        <div className="w-full max-w-[430px] shrink-0">
          <div className="bg-white rounded-[32px] p-7 sm:p-9 shadow-2xl text-slate-800 border border-white/40 animate-in fade-in zoom-in-95 duration-300">
            
            {/* 1. PILL BADGE & HEADLINE */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-[#1351D8] font-bold text-[11px] tracking-wide border border-blue-100">
                <Users className="w-3.5 h-3.5" />
                <span>CỔNG DÀNH CHO CORE TEAM iSSAC</span>
              </div>

              <h2 className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight">
                Đăng nhập Core Team iSSAC
              </h2>
            </div>

            {/* 2. FEEDBACK NOTIFICATION */}
            {feedback && (
              <div
                className={`mt-4 p-3.5 rounded-xl border flex items-start gap-2.5 text-xs font-semibold animate-in fade-in duration-200 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{feedback.message}</span>
              </div>
            )}

            {/* 3. FORM FIELDS */}
            <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
              {/* Field 1: Email sinh viên / MSSV */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Email sinh viên / MSSV
                </label>
                <input
                  type="text"
                  required
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="23070691@vnu.edu.vn"
                  className="w-full bg-[#EEF4FF] hover:bg-blue-50/80 focus:bg-white border border-blue-100 focus:border-[#1351D8] focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 transition outline-none"
                />
              </div>

              {/* Field 2: Mật khẩu */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full bg-[#EEF4FF] hover:bg-blue-50/80 focus:bg-white border border-blue-100 focus:border-[#1351D8] focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 pr-11 py-3 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 transition outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Quên mật khẩu link */}
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-bold text-[#1351D8] hover:underline cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-6 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#1351D8] hover:bg-blue-700 active:scale-[0.98] shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {loading ? (
                  <span>Đang xác thực...</span>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    <span>Đăng nhập Core Team iSSAC</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* MODAL: QUÊN MẬT KHẨU                                            */}
      {/* ============================================================== */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white text-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#1351D8]" />
                <h3 className="text-base font-black text-slate-900">Hỗ Trợ Khôi Phục Mật Khẩu</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                Để bảo đảm an toàn dữ liệu và quyền lợi của thành viên, hệ thống CLB iSSAC không sử dụng khôi phục tự động qua SMS.
              </p>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-1.5 text-[11.5px]">
                <div className="font-bold text-[#1351D8]">Liên hệ Ban Chủ nhiệm / Ban Nhân sự:</div>
                <div>• Email: <span className="font-bold font-mono text-slate-800">ambassadors.club@vnuis.edu.vn</span></div>
                <div>• Hotline Tuyển quân: <span className="font-bold font-mono text-slate-800">0357 626 105</span></div>
                <div>• Fanpage: <span className="font-bold text-blue-700">CLB Đại sứ Sinh viên Trường Quốc tế - iSSAC</span></div>
              </div>
              <p className="text-[11px] text-slate-400">
                Ban Chủ nhiệm sẽ xác minh thông tin sinh viên và cấp lại mật khẩu mới trong vòng 15 phút.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 bg-[#1351D8] text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#1351D8] flex items-center justify-center text-white">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold tracking-wide">Đang tải Cổng Đăng Nhập...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
