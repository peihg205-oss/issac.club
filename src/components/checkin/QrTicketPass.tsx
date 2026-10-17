'use client'

import React, { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import {
  Ticket,
  QrCode,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Download,
  Maximize2,
  X,
  Sparkles,
  ShieldCheck,
  User,
  Building,
} from 'lucide-react'
import type { MeetingEvent } from '@/lib/context/ClubContext'
import type { RosterMember } from '@/lib/clubData'

interface QrTicketPassProps {
  event: MeetingEvent
  member: RosterMember
  onUnregister?: () => void
}

export function QrTicketPass({ event, member, onUnregister }: QrTicketPassProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [isFullScreen, setIsFullScreen] = useState(false)

  // Payload định dạng chuẩn: ISSAC_TICKET:{eventId}:{memberCode}:{checksum}
  const ticketToken = `TKT-${event.id.slice(-6).toUpperCase()}-${member.member_code}`
  const qrPayload = JSON.stringify({
    type: 'ISSAC_EVENT_TICKET',
    v: 1,
    eventId: event.id,
    eventTitle: event.title,
    memberCode: member.member_code,
    memberName: member.full_name,
    studentId: member.student_id || member.member_code,
    dept: member.department_name,
    ticketToken,
    issuedAt: event.date,
  })

  useEffect(() => {
    let isMounted = true
    QRCode.toDataURL(qrPayload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0B1E48',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url)
      })
      .catch((err) => console.error('QR generation error:', err))

    return () => {
      isMounted = false
    }
  }, [qrPayload])

  const handleDownloadTicket = () => {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.download = `Ve-Checkin-${member.member_code}-${event.id.slice(-4)}.png`
    link.href = qrDataUrl
    link.click()
  }

  return (
    <div className="bg-gradient-to-b from-white to-blue-50/40 rounded-3xl border-2 border-blue-500/30 p-5 sm:p-6 shadow-md relative overflow-hidden space-y-4">
      {/* Decorative top badge */}
      <div className="flex items-center justify-between pb-3.5 border-b border-blue-100/80">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Ticket className="w-4 h-4" />
          </span>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block">
              VÉ THAM DỰ CHÍNH THỨC
            </span>
            <span className="text-xs font-black text-slate-800">CLB Đại sứ sinh viên VNU-IS</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>ĐÃ XÁC THỰC GIỮ CHỖ</span>
        </div>
      </div>

      {/* Event Details */}
      <div className="space-y-1.5">
        <h4 className="text-sm sm:text-base font-black text-[#0B1E48] leading-tight line-clamp-2">
          {event.title}
        </h4>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
          <div className="flex items-center gap-1 font-semibold text-blue-900">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-slate-700">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>{event.startTime} - {event.endTime}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-600 truncate max-w-[220px]">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>
      </div>

      {/* Member ticket strip & QR code block */}
      <div className="bg-white rounded-2xl p-4 border border-blue-200/70 shadow-xs flex flex-col sm:flex-row items-center gap-4">
        {/* QR Code Presentation */}
        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-200/80 shrink-0">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Mã QR Vé Điểm Danh"
              className="w-32 h-32 rounded-lg object-contain select-none"
            />
          ) : (
            <div className="w-32 h-32 flex items-center justify-center bg-slate-100 rounded-lg animate-pulse">
              <QrCode className="w-8 h-8 text-slate-400" />
            </div>
          )}
          <span className="text-[10px] font-mono font-bold text-slate-600 mt-1">
            {ticketToken}
          </span>
        </div>

        {/* Member credentials & Security info */}
        <div className="space-y-2 flex-1 text-xs w-full">
          <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Người sở hữu vé:</span>
              <span className="font-black text-slate-900">{member.full_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Mã SV / MSSV:</span>
              <span className="font-mono font-bold text-blue-700">{member.student_id || member.member_code}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Ban trực thuộc:</span>
              <span className="font-semibold text-slate-800">{member.department_name}</span>
            </div>
            {member.is_core && (
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-slate-500 font-medium">Vai trò:</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-amber-100 text-amber-900 border border-amber-300">
                  ★ Core Team
                </span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed italic">
            💡 Khi đến sự kiện, bạn chỉ cần mở màn hình này để <strong>Ban Nhân sự quét mã QR</strong> tại bàn đón tiếp. Hệ thống sẽ tự động đối soát và ghi nhận có mặt.
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFullScreen(true)}
            className="px-3 py-1.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Phóng to mã QR để quét</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadTicket}
            className="px-3 py-1.5 rounded-xl font-semibold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Lưu ảnh vé</span>
          </button>
        </div>

        {onUnregister && (
          <button
            type="button"
            onClick={onUnregister}
            className="px-3 py-1.5 rounded-xl font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
          >
            Hủy đăng ký vé này
          </button>
        )}
      </div>

      {/* Fullscreen Modal for Bright Scanning */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsFullScreen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 block">
                MÃ VÉ ĐIỂM DANH ĐIỆN TỬ
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">{member.full_name}</h3>
              <p className="text-xs text-slate-500">MSSV: {member.student_id || member.member_code} • {member.department_name}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-blue-500/40 inline-block shadow-inner">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="Mã QR Điểm Danh"
                  className="w-56 h-56 mx-auto rounded-xl object-contain"
                />
              )}
              <span className="font-mono text-xs font-black text-slate-700 mt-2 block">
                {ticketToken}
              </span>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed bg-blue-50/70 p-3 rounded-xl border border-blue-200/60">
              <p className="font-bold text-blue-900">Sự kiện: {event.title}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Vui lòng tăng độ sáng màn hình để Ban Tổ Chức quét mã nhanh nhất.</p>
            </div>

            <button
              type="button"
              onClick={() => setIsFullScreen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Đóng cửa sổ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
