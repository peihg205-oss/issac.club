import type { Metadata, Viewport } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth/AuthContext'
import { ClubProvider } from '@/lib/context/ClubContext'
import { LanguageProvider } from '@/lib/context/LanguageContext'

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-be-vietnam-pro',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export const metadata: Metadata = {
  title: 'Câu Lạc bộ Đại sứ sinh viên Trường Quốc tế - Quản Lý & Kiểm Soát Điểm Hoạt Động',
  description:
    'Hệ thống quản lý, theo dõi điểm thi đua, hồ sơ thành viên và xét duyệt hoạt động của Câu Lạc bộ Đại sứ sinh viên Trường Quốc tế - ĐHQGHN.',
  keywords: [
    'iSSAC',
    'Câu Lạc bộ Đại sứ sinh viên Trường Quốc tế',
    'Điểm hoạt động',
    'Trường Quốc tế ĐHQGHN',
    'Quản trị thành viên',
  ],
  authors: [{ name: 'Câu Lạc bộ Đại sứ sinh viên Trường Quốc tế' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={`h-full scroll-smooth ${beVietnamPro.variable}`}>
      <body className={`min-h-full bg-[#E7ECF1] text-[#1E293B] antialiased selection:bg-[#BFDBFE] selection:text-[#1E3A8A] ${beVietnamPro.className}`}>
        <LanguageProvider>
          <AuthProvider>
            <ClubProvider>
              {children}
            </ClubProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
