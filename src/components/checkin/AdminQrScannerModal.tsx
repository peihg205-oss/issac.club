'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Search,
  Filter,
  Camera,
  Play,
  RotateCw,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ArrowRight,
  Maximize2,
  Volume2,
  VolumeX,
  X,
  Check,
  Zap,
  ImageIcon,
  Upload,
} from 'lucide-react'
import type { MeetingEvent, CheckinRecord, CheckinStatus } from '@/lib/context/ClubContext'
import type { RosterMember } from '@/lib/clubData'

interface AdminQrScannerModalProps {
  isOpen: boolean
  onClose: () => void
  event: MeetingEvent
  members: RosterMember[]
  onVerifyCheckin: (memberCode: string, status: CheckinStatus, note: string) => { success: boolean; message: string }
  currentRecords: Record<string, CheckinRecord>
}

export function AdminQrScannerModal({
  isOpen,
  onClose,
  event,
  members,
  onVerifyCheckin,
  currentRecords,
}: AdminQrScannerModalProps) {
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [manualInput, setManualInput] = useState('')
  const [activeCamera, setActiveCamera] = useState(false)
  const [cameraScanFlash, setCameraScanFlash] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const lastScannedPayloadRef = useRef<string>('')
  const lastScannedTimeRef = useRef<number>(0)

  // Feedback state for current scan
  const [scanResult, setScanResult] = useState<{
    type: 'success' | 'warning' | 'error'
    title: string
    message: string
    member?: RosterMember
    timestamp?: string
    status?: CheckinStatus
  } | null>(null)

  // Danh sách đã đăng ký
  const registeredCodes = event.registeredMemberCodes || []
  const registeredMembers = members.filter((m) => registeredCodes.includes(m.member_code))

  // Đếm thống kê
  const checkedInCount = registeredMembers.filter((m) => {
    const st = currentRecords[m.member_code]?.status
    return st === 'present_on_time' || st === 'late'
  }).length

  const attendancePct = registeredMembers.length > 0
    ? Math.round((checkedInCount / registeredMembers.length) * 100)
    : 0

  // Sound generator using Web Audio API
  const playSound = (isSuccess: boolean) => {
    if (!soundEnabled || typeof window === 'undefined') return
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      if (isSuccess) {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1) // A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
        osc.start()
        osc.stop(ctx.currentTime + 0.4)
      } else {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(220, ctx.currentTime)
        osc.frequency.setValueAtTime(146.83, ctx.currentTime + 0.15)
        gain.gain.setValueAtTime(0.4, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
        osc.start()
        osc.stop(ctx.currentTime + 0.35)
      }
    } catch {
      // Audio not supported or blocked
    }
  }

  // Camera video stream handling with Html5Qrcode (Tối ưu tuyệt đối cho iPhone Safari / Android Chrome)
  useEffect(() => {
    let isMounted = true
    let html5Qr: any = null

    if (isOpen && activeCamera && typeof window !== 'undefined') {
      const initScanner = async () => {
        try {
          const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
          if (!isMounted) return

          // Đợi DOM #admin-qr-reader sẵn sàng
          const readerEl = document.getElementById('admin-qr-reader')
          if (!readerEl) return

          html5Qr = new Html5Qrcode('admin-qr-reader', {
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            verbose: false,
          })

          const qrBoxSize = (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
            return {
              width: Math.floor(minEdge * 0.8),
              height: Math.floor(minEdge * 0.8),
            }
          }

          await html5Qr.start(
            { facingMode: 'environment' },
            {
              fps: 15,
              qrbox: qrBoxSize,
              aspectRatio: 1.0,
            },
            (decodedText: string) => {
              if (!decodedText || !decodedText.trim()) return

              const now = Date.now()
              const isSame = decodedText === lastScannedPayloadRef.current
              const cooldown = isSame ? 2500 : 1000

              if (now - lastScannedTimeRef.current > cooldown) {
                lastScannedPayloadRef.current = decodedText
                lastScannedTimeRef.current = now

                // Hiệu ứng chớp xanh & rung điện thoại phản hồi xúc giác
                setCameraScanFlash(true)
                setTimeout(() => setCameraScanFlash(false), 800)
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                  try {
                    navigator.vibrate([80, 40, 80])
                  } catch {}
                }

                processScan(decodedText)
              }
            },
            () => {
              // frame miss - continue scanning
            }
          )

          if (isMounted) {
            setCameraError(null)
          }
        } catch (err: any) {
          console.warn('HTML5 QR Scanner start error:', err)
          if (isMounted) {
            setCameraError('Không thể mở camera. Vui lòng cấp quyền truy cập Camera trên Safari/Chrome hoặc bấm nút Quét Nhanh bên dưới.')
            setActiveCamera(false)
          }
        }
      }

      initScanner()
    }

    return () => {
      isMounted = false
      if (html5Qr) {
        if (html5Qr.isScanning) {
          html5Qr.stop().then(() => {
            try { html5Qr.clear() } catch {}
          }).catch(() => {
            try { html5Qr.clear() } catch {}
          })
        } else {
          try { html5Qr.clear() } catch {}
        }
      }
    }
  }, [isOpen, activeCamera])

  // Quét mã từ ảnh chụp trong thư viện điện thoại
  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const tempScanner = new Html5Qrcode('admin-qr-reader-temp')
      const decodedText = await tempScanner.scanFile(file, true)
      try { tempScanner.clear() } catch {}
      if (decodedText) {
        setCameraScanFlash(true)
        setTimeout(() => setCameraScanFlash(false), 800)
        processScan(decodedText)
      }
    } catch (err) {
      console.warn('File scan error:', err)
      setScanResult({
        type: 'error',
        title: 'KHÔNG TÌM THẤY MÃ QR TRONG ẢNH',
        message: 'Ảnh tải lên không phát hiện mã QR hợp lệ. Bạn hãy chụp ảnh rõ nét hơn hoặc dùng camera quét trực tiếp.',
      })
    } finally {
      e.target.value = ''
    }
  }

  // Xử lý quét mã QR
  const processScan = (rawPayload: string) => {
    if (!rawPayload.trim()) return

    let memberCode = rawPayload.trim()

    // 1. Nếu là chuỗi JSON từ QR Ticket
    try {
      if (rawPayload.includes('{') && rawPayload.includes('}')) {
        const parsed = JSON.parse(rawPayload)
        if (parsed.memberCode) {
          memberCode = String(parsed.memberCode)
        } else if (parsed.studentId) {
          memberCode = String(parsed.studentId)
        } else if (parsed.ticketToken) {
          memberCode = String(parsed.ticketToken)
        } else if (parsed.m) {
          memberCode = String(parsed.m)
        } else if (parsed.s) {
          memberCode = String(parsed.s)
        }
      }
    } catch {
      // Not JSON, use raw
    }

    // 2. Nếu là URL dạng https://.../checkin?member=... hoặc ?code=...
    if (memberCode.includes('http://') || memberCode.includes('https://') || memberCode.includes('?')) {
      try {
        const queryStr = memberCode.includes('?') ? memberCode.split('?')[1] : ''
        const params = new URLSearchParams(queryStr)
        const code = params.get('member') || params.get('code') || params.get('memberCode') || params.get('studentId') || params.get('t')
        if (code) memberCode = code
      } catch {
        // ignore
      }
    }

    // 3. Nếu là mã vé token TKT-XXX-MEMBERCODE hoặc TKT-MEMBERCODE
    if (memberCode.startsWith('TKT-')) {
      const parts = memberCode.split('-')
      if (parts.length >= 3) {
        memberCode = parts.slice(2).join('-')
      } else if (parts.length === 2) {
        memberCode = parts[1]
      }
    }

    const targetMember = members.find(
      (m) =>
        m.member_code.toLowerCase() === memberCode.toLowerCase() ||
        (m.student_id && m.student_id.toLowerCase() === memberCode.toLowerCase()) ||
        m.full_name.toLowerCase() === memberCode.toLowerCase()
    )

    if (!targetMember) {
      playSound(false)
      setScanResult({
        type: 'error',
        title: 'MÃ KHÔNG HỢP LỆ',
        message: `Không tìm thấy thành viên nào tương ứng với mã quét: "${memberCode}". Vui lòng kiểm tra lại.`,
      })
      return
    }

    // 1. Kiểm tra đã đăng ký trước hay chưa
    const isRegistered = registeredCodes.includes(targetMember.member_code)

    // 2. Kiểm tra ĐÃ CHECK-IN TRƯỚC ĐÓ CHƯA (Chống gian lận quét trùng / điểm danh hộ)
    const existingRec = currentRecords[targetMember.member_code]
    if (existingRec && (existingRec.status === 'present_on_time' || existingRec.status === 'late')) {
      playSound(false)
      setScanResult({
        type: 'warning',
        title: 'CẢNH BÁO GIAN LẬN: VÉ ĐÃ ĐƯỢC CHECK-IN',
        message: `Thành viên "${targetMember.full_name}" ĐÃ ĐIỂM DANH lúc ${existingRec.checkinTime || 'trước đó'} (${existingRec.status === 'present_on_time' ? 'Đúng giờ' : 'Đến muộn'}). Không thể quét trùng lặp hoặc sử dụng lại vé!`,
        member: targetMember,
        timestamp: existingRec.checkinTime,
        status: existingRec.status,
      })
      return
    }

    // 3. Tiến hành điểm danh hợp lệ
    const scanTime = new Date().toLocaleTimeString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

    const status: CheckinStatus = 'present_on_time'
    const note = `Xác thực quét mã QR vé tại bàn đón tiếp lúc ${scanTime}`

    const res = onVerifyCheckin(targetMember.member_code, status, note)
    if (res.success) {
      playSound(true)
      setScanResult({
        type: 'success',
        title: isRegistered ? 'XÁC THỰC THÀNH CÔNG (CÓ GIỮ CHỖ)' : 'XÁC THỰC THÀNH CÔNG (BỔ SUNG)',
        message: isRegistered
          ? `Đã xác thực vé thành công cho ${targetMember.full_name} (${targetMember.department_name}). Có tên trong danh sách đăng ký trước!`
          : `Đã xác thực thành công cho ${targetMember.full_name}. Lưu ý: Thành viên này chưa giữ chỗ trước nhưng đã được Admin chấp thuận có mặt.`,
        member: targetMember,
        timestamp: scanTime,
        status,
      })
      setManualInput('')
    } else {
      playSound(false)
      setScanResult({
        type: 'error',
        title: 'LỖI ĐIỂM DANH',
        message: res.message,
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-[#F8FAFC] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Header */}
        <div className="bg-[#0B1E48] text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Máy Quét QR Điểm Danh &amp; Đối Soát Đăng Ký
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  Live Scanner
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-1">
                Sự kiện: <strong>{event.title}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition"
              title={soundEnabled ? 'Tắt âm báo' : 'Bật âm báo'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real-time stats bar */}
        <div className="bg-white border-b border-slate-200/80 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-500 block text-[11px]">Đã đăng ký trước:</span>
              <span className="font-black text-slate-900 text-sm">{registeredMembers.length} thành viên</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-500 block text-[11px]">Đã quét vé có mặt:</span>
              <span className="font-black text-emerald-600 text-sm">{checkedInCount} người</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-500 block text-[11px]">Chưa đến:</span>
              <span className="font-black text-amber-600 text-sm">
                {Math.max(0, registeredMembers.length - checkedInCount)} người
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">Tỷ lệ có mặt:</span>
            <div className="w-28 bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${attendancePct}%` }}
              />
            </div>
            <span className="font-mono font-black text-emerald-700 text-xs">{attendancePct}%</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Main Action Split: Scanner View + Live Feedback Overlay */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left: Camera / Scanner Zone (6 cols) */}
            <div className="md:col-span-6 space-y-4">
              <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center border-2 border-slate-800 shadow-inner">
                {/* Luôn giữ container #admin-qr-reader để Html5Qrcode gắn vào DOM */}
                <div id="admin-qr-reader" className={`w-full h-full ${activeCamera ? 'block' : 'hidden'}`} />
                <div id="admin-qr-reader-temp" style={{ display: 'none' }} />

                {!activeCamera && (
                  <div className="text-center p-6 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 mx-auto flex items-center justify-center text-blue-400">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Camera đang tắt</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Bật camera quét trực tiếp hoặc chọn ảnh vé từ máy
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveCamera(true)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Bật Camera Quét Mã</span>
                    </button>
                  </div>
                )}

                {/* Controls and flash overlay when camera is on */}
                {activeCamera && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveCamera(false)}
                      className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black text-white text-[10px] font-bold z-20 backdrop-blur-xs cursor-pointer"
                    >
                      Tắt Camera
                    </button>
                    {/* Hiệu ứng chớp xanh khi nhận mã thành công */}
                    {cameraScanFlash && (
                      <div className="absolute inset-0 bg-emerald-500/35 border-4 border-emerald-400 rounded-2xl flex items-center justify-center pointer-events-none z-30 animate-in fade-in zoom-in duration-150">
                        <div className="bg-emerald-600 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2 border border-white/40">
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>ĐÃ BẮT MÃ THÀNH CÔNG!</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Tùy chọn quét vé từ ảnh thư viện */}
              <div className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] text-slate-600 font-semibold">Ảnh chụp màn hình vé:</span>
                <label className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 border border-blue-200 transition">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Chọn ảnh từ thư viện</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileScan}
                  />
                </label>
              </div>

              {cameraError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Input for Barcode Guns or manual typing */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Hoặc Quét Bằng Máy Quét Mã Vạch / Nhập Mã Vé:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        processScan(manualInput)
                      }
                    }}
                    placeholder="Quét mã QR hoặc nhập MSSV/Mã thành viên..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => processScan(manualInput)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Live Feedback Display (6 cols) */}
            <div className="md:col-span-6 flex flex-col justify-between space-y-4">
              {scanResult ? (
                <div
                  className={`p-5 rounded-2xl border shadow-sm space-y-4 animate-fadeIn flex-1 flex flex-col justify-between ${
                    scanResult.type === 'success'
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                      : scanResult.type === 'warning'
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {scanResult.type === 'success' ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                      ) : scanResult.type === 'warning' ? (
                        <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
                      ) : (
                        <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                      )}
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight">
                          {scanResult.title}
                        </h4>
                        <span className="text-[11px] opacity-75 font-mono">
                          Thời gian: {scanResult.timestamp || 'Vừa xong'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed font-medium">
                      {scanResult.message}
                    </p>

                    {scanResult.member && (
                      <div className="bg-white/90 rounded-xl p-3 border border-slate-200/70 space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Họ và tên:</span>
                          <span className="font-black text-slate-900 text-sm">
                            {scanResult.member.full_name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">MSSV / Lớp:</span>
                          <span className="font-mono font-bold text-blue-700">
                            {scanResult.member.student_id || scanResult.member.member_code} • {scanResult.member.class_name || '-'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Ban trực thuộc:</span>
                          <span className="font-semibold text-slate-800">
                            {scanResult.member.department_name}
                          </span>
                        </div>
                        {scanResult.member.is_core && (
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-slate-500 font-medium">Phân loại:</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                              ★ Core Team
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setScanResult(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs"
                    >
                      Sẵn sàng quét người tiếp theo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs text-center flex-1 flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">Hệ Thống Sẵn Sàng Đối Soát</h4>
                    <p className="text-xs text-slate-500 max-w-xs mt-1">
                      Giơ mã vé QR của thành viên trước camera hoặc bấm chọn nhanh trong danh sách dưới đây để điểm danh.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Simulation Bar (Mô phỏng quét vé nhanh) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wide">
                  Mô Phỏng Quét Vé Nhanh (Click để thử nghiệm điểm danh)
                </h4>
              </div>
              <span className="text-[11px] text-slate-500">
                Thành viên đã giữ chỗ: {registeredMembers.length}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
              {registeredMembers.map((m) => {
                const rec = currentRecords[m.member_code]
                const isChecked = rec?.status === 'present_on_time' || rec?.status === 'late'

                return (
                  <button
                    key={m.member_code}
                    type="button"
                    onClick={() => processScan(m.member_code)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs ${
                      isChecked
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                        : 'bg-slate-100 hover:bg-blue-100 text-slate-800 hover:text-blue-800 border border-slate-200'
                    }`}
                  >
                    {isChecked ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 font-black" />
                    ) : (
                      <QrCode className="w-3.5 h-3.5 text-blue-600" />
                    )}
                    <span>{m.full_name}</span>
                    {isChecked && (
                      <span className="text-[10px] text-emerald-600 font-mono">({rec.checkinTime})</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Real-time Registered Attendee Table (Bảng Danh Sách Người Đăng Ký) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-800">
                  Danh Sách Đăng Ký Trước &amp; Trạng Thái Điểm Danh
                </h4>
                <p className="text-xs text-slate-500">
                  Tự động cập nhật thời gian thực khi Admin quét mã vé tại bàn đón tiếp
                </p>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                {checkedInCount} / {registeredMembers.length} Có mặt
              </span>
            </div>

            <div className="overflow-x-auto max-h-64 overflow-y-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 z-10 border-b border-slate-200/80">
                  <tr>
                    <th className="py-2.5 px-3">STT</th>
                    <th className="py-2.5 px-3">Thành viên</th>
                    <th className="py-2.5 px-3">MSSV</th>
                    <th className="py-2.5 px-3">Ban</th>
                    <th className="py-2.5 px-3 text-center">Trạng thái vé</th>
                    <th className="py-2.5 px-3 text-right">Giờ Check-in</th>
                    <th className="py-2.5 px-2 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registeredMembers.map((m, idx) => {
                    const rec = currentRecords[m.member_code]
                    const isChecked = rec?.status === 'present_on_time' || rec?.status === 'late'

                    return (
                      <tr
                        key={m.member_code}
                        className={`hover:bg-slate-50/80 transition ${
                          isChecked ? 'bg-emerald-50/30' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{m.full_name}</span>
                          {m.is_core && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-amber-100 text-amber-800">
                              Core
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{m.student_id || m.member_code}</td>
                        <td className="py-2.5 px-3 text-slate-600">{m.department_name}</td>
                        <td className="py-2.5 px-3 text-center">
                          {isChecked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <Check className="w-3 h-3 text-emerald-700" />
                              Đã quét vé
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Chưa đến
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {isChecked ? (
                            <span className="text-emerald-700">{rec.checkinTime || '19:30'}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {!isChecked && (
                            <button
                              type="button"
                              onClick={() => processScan(m.member_code)}
                              className="px-2 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                            >
                              Quét ngay
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-3.5 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm cursor-pointer"
          >
            Đóng bảng quét mã
          </button>
        </div>
      </div>
    </div>
  )
}
