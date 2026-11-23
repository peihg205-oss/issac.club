'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ShieldCheck,
  QrCode,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Upload,
  FileText,
  Download,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Lock,
  Building,
  User,
  CreditCard,
} from 'lucide-react'

interface PageProps {
  params: Promise<{
    campaignSlug: string
  }>
}

interface PaymentStatusData {
  paymentCode: string
  campaignTitle: string
  fullName: string
  studentId: string
  amount: number
  status: 'pending' | 'confirming' | 'success' | 'expired' | 'disputed' | 'waived'
  expiresAt: string
  sepayTransactionId?: string | null
  paidAmount?: number | null
  paidAt?: string | null
  evidenceUploaded: boolean
  evidenceFileName?: string | null
  evidenceUploadedAt?: string | null
}

export default function MemberPaymentPortalClient({
  campaignSlug = 'quy-thang-11-2026',
}: {
  campaignSlug?: string
}) {
  // Step 1: Form state
  const [fullName, setFullName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null)

  // Step 2 & 3: Active payment intent state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [paymentData, setPaymentData] = useState<PaymentStatusData | null>(null)
  const [qrUrl, setQrUrl] = useState<string>('')
  const [bankInfo, setBankInfo] = useState<{
    accountNumber: string
    bankCode: string
    accountHolder: string
  } | null>(null)

  // Polling & Timer
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900)
  const [copyNotice, setCopyNotice] = useState(false)

  // Evidence upload
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false)
  const [evidenceMessage, setEvidenceMessage] = useState<string | null>(null)
  const [evidenceError, setEvidenceError] = useState<string | null>(null)

  // Ref for receipt download
  const receiptRef = useRef<HTMLDivElement>(null)

  // Step 1 Form Submission
  const handleVerifyAndGenerateQR = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)
    setVerifyError(null)
    setVerifySuccess(null)

    try {
      // 1. Verify identity
      const verifyRes = await fetch('/api/finance/verify-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, studentId, email, phone, campaignSlug }),
      })

      const verifyJson = await verifyRes.json()

      if (!verifyRes.ok || !verifyJson.success) {
        if (verifyJson.alreadyPaid) {
          setVerifyError(`Bạn đã hoàn tất đóng quỹ cho chiến dịch này (${verifyJson.paidAt || 'Đã xác nhận'}). Không cần nộp lại.`)
        } else {
          setVerifyError(verifyJson.error || 'Thông tin xác minh không khớp với dữ liệu thành viên.')
        }
        setIsVerifying(false)
        return
      }

      setVerifySuccess('Thông tin hợp lệ – Đang tạo mã thanh toán riêng...')

      // 2. Generate or Resume Payment Intent
      const intentRes = await fetch('/api/finance/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignSlug, fullName, studentId, email, phone }),
      })

      const intentJson = await intentRes.json()
      if (!intentRes.ok || !intentJson.success) {
        setVerifyError(intentJson.error || 'Lỗi khi khởi tạo mã thanh toán.')
        setIsVerifying(false)
        return
      }

      const intent = intentJson.intent
      setPaymentData({
        paymentCode: intent.paymentCode,
        campaignTitle: intent.campaignTitle,
        fullName: intent.fullName,
        studentId: intent.studentId,
        amount: intent.amount,
        status: intent.status,
        expiresAt: intent.expiresAt,
        evidenceUploaded: Boolean(intent.evidenceUrl),
      })
      setQrUrl(intent.qrUrl)
      if (intentJson.bankInfo) {
        setBankInfo(intentJson.bankInfo)
      }

      // Compute remaining seconds
      const expiryMs = new Date(intent.expiresAt).getTime()
      const nowMs = Date.now()
      setSecondsRemaining(Math.max(0, Math.floor((expiryMs - nowMs) / 1000)))

      if (intent.status === 'success') {
        setCurrentStep(3)
      } else {
        setCurrentStep(2)
      }
    } catch (err: any) {
      setVerifyError(err.message || 'Lỗi kết nối đến máy chủ xác minh.')
    } finally {
      setIsVerifying(false)
    }
  }

  // Polling every 3 seconds when in Step 2 (payment pending)
  useEffect(() => {
    if (currentStep !== 2 || !paymentData?.paymentCode) return

    let isSubscribed = true

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/finance/payment-status?code=${paymentData.paymentCode}`)
        const json = await res.json()
        if (res.ok && json.success && isSubscribed) {
          const updated = json.data as PaymentStatusData
          setPaymentData(updated)
          if (updated.status === 'success') {
            setCurrentStep(3)
          }
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }

    const intervalId = setInterval(checkStatus, 3000)
    return () => {
      isSubscribed = false
      clearInterval(intervalId)
    }
  }, [currentStep, paymentData?.paymentCode])

  // Countdown timer
  useEffect(() => {
    if (currentStep !== 2 || secondsRemaining <= 0) return
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [currentStep, secondsRemaining])

  // Manual Check Button: "TÔI ĐÃ CHUYỂN KHOẢN"
  // Note: ONLY refreshes status, never marks success on its own!
  const handleManualCheck = async () => {
    if (!paymentData?.paymentCode) return
    setIsCheckingStatus(true)
    try {
      const res = await fetch(`/api/finance/payment-status?code=${paymentData.paymentCode}`)
      const json = await res.json()
      if (res.ok && json.success) {
        const updated = json.data as PaymentStatusData
        setPaymentData(updated)
        if (updated.status === 'success') {
          setCurrentStep(3)
        }
      }
    } catch (err) {
      console.error('Check status error:', err)
    } finally {
      setIsCheckingStatus(false)
    }
  }

  // Copy transfer content
  const handleCopyCode = () => {
    if (!paymentData?.paymentCode) return
    navigator.clipboard.writeText(paymentData.paymentCode)
    setCopyNotice(true)
    setTimeout(() => setCopyNotice(false), 2500)
  }

  // Upload Screenshot Evidence
  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!evidenceFile || !paymentData?.paymentCode) return

    setIsUploadingEvidence(true)
    setEvidenceError(null)
    setEvidenceMessage(null)

    const formData = new FormData()
    formData.append('paymentCode', paymentData.paymentCode)
    formData.append('file', evidenceFile)

    try {
      const res = await fetch('/api/finance/upload-evidence', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setEvidenceMessage('Minh chứng thanh toán đã được lưu.')
        setPaymentData((prev) =>
          prev
            ? {
                ...prev,
                evidenceUploaded: true,
                evidenceFileName: json.fileName,
                evidenceUploadedAt: json.uploadedAt,
              }
            : null
        )
      } else {
        setEvidenceError(json.error || 'Tải minh chứng thất bại.')
      }
    } catch (err: any) {
      setEvidenceError(err.message || 'Lỗi khi tải minh chứng lên máy chủ.')
    } finally {
      setIsUploadingEvidence(false)
    }
  }

  // Print/Download Receipt
  const handleDownloadReceipt = () => {
    window.print()
  }

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-[#E8EDF3] text-slate-800 antialiased font-sans pb-16">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 shadow-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image
              src="/issac-logo.png"
              alt="iSSAC Club"
              width={38}
              height={38}
              className="rounded-lg shadow-sm"
              priority
            />
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#078FE0]">
                VNUIS Student Ambassadors Club
              </span>
              <h1 className="text-base font-bold text-[#0B1B55] leading-tight">
                Cổng Đóng Quỹ Thành Viên
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-medium text-slate-700">Mã hóa an toàn • SePay Gateway</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-8">
        {/* Banner Card */}
        <div className="bg-gradient-to-r from-[#0B1B55] to-[#123180] text-white rounded-2xl p-6 sm:p-8 shadow-lg mb-8 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[#078FE0]/30 text-sky-200 mb-3 border border-sky-400/30">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> CỔNG ĐÓNG QUỸ THÀNH VIÊN
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              Quỹ Sinh Hoạt iSSAC
            </h2>
            <p className="text-sky-100/90 text-sm sm:text-base leading-relaxed">
              Dành cho thành viên iSSAC – Xác minh thông tin để tạo mã thanh toán riêng. Hệ thống tự động
              xác nhận ngay khi tài khoản ngân hàng nhận tiền.
            </p>
          </div>
          {/* Subtle decoration */}
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-8 translate-y-8">
            <ShieldCheck className="w-64 h-64 text-white" />
          </div>
        </div>

        {/* 4 Feature Information Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 hover:border-blue-400 transition-all">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mức thu</div>
            <div className="text-lg font-bold text-[#0B1B55] mt-1">100.000 VNĐ</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Quy chuẩn học kỳ</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 hover:border-blue-400 transition-all">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tài khoản</div>
            <div className="text-lg font-bold text-[#078FE0] mt-1">Không cần login</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Xác minh theo danh bạ</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 hover:border-blue-400 transition-all">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Xác minh</div>
            <div className="text-lg font-bold text-amber-600 mt-1">4 trường bắt buộc</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Tên, MSSV, Email, SĐT</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 hover:border-blue-400 transition-all">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mã thanh toán</div>
            <div className="text-lg font-bold text-emerald-600 mt-1">Đơn nhất 1 lần</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Khớp chuẩn SePay QR</div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* STEP 1: VERIFY IDENTITY                                  */}
        {/* ======================================================== */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#078FE0] flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0B1B55]">Xác minh danh tính thành viên</h3>
                <p className="text-xs text-slate-500">
                  Nhập chính xác thông tin bạn đã đăng ký với Ban Nhân sự iSSAC để nhận mã QR riêng.
                </p>
              </div>
            </div>

            {verifyError && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{verifyError}</span>
              </div>
            )}

            {verifySuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{verifySuccess}</span>
              </div>
            )}

            <form onSubmit={handleVerifyAndGenerateQR} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  1. Họ và tên thành viên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Giang Lê Hiệp"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#078FE0] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  2. Mã số sinh viên (MSSV) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Ví dụ: 23070691"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#078FE0] text-sm uppercase"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    3. Địa chỉ Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@vnuis.edu.vn"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#078FE0] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    4. Số điện thoại đăng ký <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0374140705"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#078FE0] text-sm"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full bg-[#078FE0] hover:bg-blue-600 active:scale-[0.99] text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang xác minh dữ liệu...</span>
                    </>
                  ) : (
                    <>
                      <span>Xác minh & Tạo mã VietQR thanh toán</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-[11px] text-slate-400">
                  Thông tin được đối soát tự động với danh sách thành viên nội bộ iSSAC. Chúng tôi không chia sẻ thông tin này cho bên thứ ba.
                </p>
              </div>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: VIETQR PAYMENT INTERFACE                         */}
        {/* ======================================================== */}
        {currentStep === 2 && paymentData && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
                <div>
                  <div className="inline-flex items-center space-x-2 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md mb-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>MÃ THANH TOÁN ĐÃ ĐƯỢC TẠO</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#0B1B55]">
                    {paymentData.campaignTitle}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thành viên: <span className="font-semibold text-slate-800">{paymentData.fullName}</span> (MSSV: {paymentData.studentId})
                  </p>
                </div>

                <div className="text-right sm:text-right bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div className="text-xs text-slate-500">Thời gian giữ mã:</div>
                  <div className="text-2xl font-mono font-bold text-rose-600">
                    {formatCountdown(secondsRemaining)}
                  </div>
                </div>
              </div>

              {/* QR & Bank Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* VietQR Dynamic Image */}
                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="bg-white p-3 rounded-xl shadow-md border border-slate-200 relative">
                    <img
                      src={qrUrl}
                      alt="VietQR SePay"
                      className="w-64 h-64 object-contain rounded-lg"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-[#0B1B55]">
                      VietQR • SePay Auto
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-4 text-center">
                    Quét mã bằng app ngân hàng bất kỳ để tự động điền số tiền và nội dung chuyển khoản.
                  </p>
                </div>

                {/* Bank Information Details */}
                <div className="space-y-4">
                  <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
                    <div className="text-xs font-bold text-[#078FE0] uppercase tracking-wide">
                      Số tiền cần nộp
                    </div>
                    <div className="text-3xl font-extrabold text-[#0B1B55] mt-1">
                      {paymentData.amount.toLocaleString('vi-VN')} VNĐ
                    </div>
                  </div>

                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-xs text-slate-500">Ngân hàng thụ hưởng:</span>
                      <span className="font-semibold text-slate-800">
                        {bankInfo?.bankCode || 'MBBank (Quân đội)'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-xs text-slate-500">Số tài khoản:</span>
                      <span className="font-mono font-bold text-slate-900 text-base">
                        {bankInfo?.accountNumber || '0374140705'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-xs text-slate-500">Chủ tài khoản:</span>
                      <span className="font-semibold text-slate-800 uppercase">
                        {bankInfo?.accountHolder || 'GIANG LE HIEP'}
                      </span>
                    </div>

                    {/* Special Unique Code Field with Copy Button */}
                    <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-sky-800 uppercase">
                          Nội dung chuyển khoản (Bắt buộc)
                        </span>
                        {copyNotice && (
                          <span className="text-xs text-emerald-600 font-bold">Đã sao chép!</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-extrabold text-lg text-[#0B1B55] tracking-wider">
                          {paymentData.paymentCode}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="px-3 py-1.5 rounded-lg bg-[#078FE0] hover:bg-blue-600 text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleManualCheck}
                      disabled={isCheckingStatus}
                      className="w-full bg-[#0B1B55] hover:bg-blue-900 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl shadow transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-60"
                    >
                      <RefreshCw className={`w-4 h-4 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                      <span>{isCheckingStatus ? 'Đang kiểm tra giao dịch...' : 'TÔI ĐÃ CHUYỂN KHOẢN'}</span>
                    </button>
                    <p className="text-[11px] text-slate-400 text-center mt-2">
                      Hệ thống tự động lắng nghe SePay Webhook mỗi 3 giây. Nút trên dùng để làm mới trạng thái lập tức.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: SUCCESS CONFIRMATION & RECEIPT                   */}
        {/* ======================================================== */}
        {currentStep === 3 && paymentData && (
          <div className="space-y-6">
            {/* Success Card */}
            <div
              ref={receiptRef}
              className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-6 sm:p-8 relative overflow-hidden"
            >
              <div className="text-center pb-6 border-b border-slate-100">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <span className="text-xs font-extrabold tracking-widest text-emerald-600 uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Xác nhận giao dịch thành công
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1B55] mt-2">
                  THANH TOÁN THÀNH CÔNG!
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Khoản đóng quỹ của bạn đã được đối soát tự động qua SePay và ghi vào Sổ cái CLB iSSAC.
                </p>
              </div>

              {/* Receipt Details Grid */}
              <div className="py-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-b border-slate-100">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-400">Họ và tên thành viên:</div>
                  <div className="font-bold text-slate-900 text-base">{paymentData.fullName}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-400">Mã số sinh viên:</div>
                  <div className="font-mono font-bold text-slate-900 text-base">{paymentData.studentId}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-400">Khoản thu / Chiến dịch:</div>
                  <div className="font-semibold text-slate-900">{paymentData.campaignTitle}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-400">Số tiền đã nộp:</div>
                  <div className="font-bold text-emerald-600 text-lg">
                    {paymentData.amount.toLocaleString('vi-VN')} VNĐ
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-400">Mã tham chiếu thanh toán:</div>
                  <div className="font-mono font-bold text-[#0B1B55]">{paymentData.paymentCode}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-400">Mã giao dịch SePay:</div>
                  <div className="font-mono text-slate-700">
                    {paymentData.sepayTransactionId || 'SP-VERIFIED'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl sm:col-span-2">
                  <div className="text-xs text-slate-400">Thời gian ghi nhận:</div>
                  <div className="font-medium text-slate-800">
                    {paymentData.paidAt || new Date().toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>

              {/* Receipt Action Buttons */}
              <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-sm"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>In / Lưu biên lai đóng quỹ</span>
                </button>

                <div className="text-xs text-slate-400 text-center sm:text-right">
                  Trạng thái: <span className="font-bold text-emerald-600">Đã quyết toán hợp lệ</span>
                </div>
              </div>
            </div>

            {/* Supporting Evidence Upload Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#078FE0] flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#0B1B55]">
                    Đính kèm minh chứng thanh toán (Tùy chọn)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Tải lên ảnh chụp màn hình chuyển khoản để ban quản trị đối soát dễ dàng hơn.
                  </p>
                </div>
              </div>

              {paymentData.evidenceUploaded ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span>Minh chứng thanh toán đã được lưu: <strong>{paymentData.evidenceFileName || 'Ảnh giao dịch'}</strong></span>
                  </div>
                  <span className="text-xs text-emerald-600 font-medium">Đã ghi nhận</span>
                </div>
              ) : (
                <form onSubmit={handleUploadEvidence} className="space-y-4">
                  {evidenceError && (
                    <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs">
                      {evidenceError}
                    </div>
                  )}

                  {evidenceMessage && (
                    <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold">
                      {evidenceMessage}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,application/pdf"
                      onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                      className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#078FE0] hover:file:bg-blue-100"
                    />

                    <button
                      type="submit"
                      disabled={!evidenceFile || isUploadingEvidence}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#078FE0] hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all disabled:opacity-50 flex-shrink-0"
                    >
                      {isUploadingEvidence ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang tải...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Gửi minh chứng</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Hỗ trợ định dạng PNG, JPG, JPEG hoặc PDF. Tối đa 5MB.
                  </p>
                </form>
              )}
            </div>

            <div className="text-center pt-4">
              <Link
                href="/"
                className="inline-flex items-center space-x-2 text-xs font-semibold text-[#078FE0] hover:underline"
              >
                <span>← Trở về Trang chủ iSSAC</span>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

