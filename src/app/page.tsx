'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar, type ActiveNavTab } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { DashboardView } from '@/components/views/DashboardView'
import { MembersView } from '@/components/views/MembersView'
import { HistoryView } from '@/components/views/HistoryView'
import { RulesView } from '@/components/views/RulesView'
import { StatsView } from '@/components/views/StatsView'
import { SettingsView } from '@/components/views/SettingsView'
import { CheckinView } from '@/components/views/CheckinView'
import { MemberProfileView } from '@/components/views/MemberProfileView'
import { AccountsView } from '@/components/views/AccountsView'
import { useClub } from '@/lib/context/ClubContext'
import { useAuth } from '@/lib/auth/AuthContext'
import { canUserManageAccounts } from '@/lib/auth/permissions'
import type { RosterMember } from '@/lib/clubData'

export default function AppHome() {
  const router = useRouter()
  const { currentUser, isAuthChecked, isBCN, isHR } = useAuth()
  const { proposals, disputes, activeEvent } = useClub()

  const isAccountManager = isBCN || canUserManageAccounts(currentUser)

  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard')
  const [selectedMember, setSelectedMember] = useState<RosterMember | null>(null)
  const [globalSearch, setGlobalSearch] = useState<string>('')
  // Mặc định đóng trên màn hình điện thoại (< 1024px) để không che khuất nội dung
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false)

  // Auth Guard: Người chưa đăng nhập lập tức bị chuyển hướng về /login
  useEffect(() => {
    if (isAuthChecked && !currentUser) {
      router.replace('/login')
    }
  }, [isAuthChecked, currentUser, router])

  // Quyền hạn: Chỉ Ban Chủ nhiệm mới được vào tab accounts. Nếu là Ban Nhân sự / Tư vấn / Truyền thông -> tự động đưa về dashboard
  useEffect(() => {
    if (activeTab === 'accounts' && !isAccountManager) {
      setActiveTab('dashboard')
    }
  }, [activeTab, isAccountManager])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setIsSidebarOpen(true)
    }
  }, [])

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFBFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-[#1351D8] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500">Đang xác thực phiên đăng nhập CLB iSSAC...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  // Tính tổng số lượng mục cần duyệt / khiếu nại chờ xử lý thời gian thực (Real-time):
  // - Ban Chủ nhiệm: Số đề xuất chờ duyệt (pending_bcn) + Số khiếu nại chờ xử lý (pending_bcn hoặc pending_hr_review)
  // - Ban Nhân sự: Số khiếu nại chờ HR thẩm định (pending_hr_review)
  // - Thành viên: Số khiếu nại chưa giải quyết của chính mình
  const pendingCount = isBCN
    ? (proposals?.filter((p) => p.status === 'pending_bcn').length || 0) +
      (disputes?.filter((d) => d.status === 'pending_bcn' || d.status === 'pending_hr_review').length || 0)
    : isHR
    ? (disputes?.filter((d) => d.status === 'pending_hr_review').length || 0)
    : (disputes?.filter(
        (d) =>
          (d.status === 'pending_bcn' || d.status === 'pending_hr_review') &&
          d.memberCode === currentUser?.memberCode
      ).length || 0)

  const handleSelectTab = (tab: ActiveNavTab) => {
    setSelectedMember(null) // Reset member profile view when switching tabs
    setActiveTab(tab)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false)
    }
  }

  const handleSelectMember = (member: RosterMember) => {
    setSelectedMember(member)
  }

  const handleBackFromMember = () => {
    setSelectedMember(null)
  }

  return (
    <div className="h-screen flex flex-col bg-[#E7ECF1] overflow-hidden">
      {/* Top Header - Full Width spanning the top 100% */}
      <Header
        searchTerm={globalSearch}
        onSearchChange={setGlobalSearch}
        pendingCount={pendingCount}
        onHomeClick={() => {
          setSelectedMember(null)
          setActiveTab('dashboard')
        }}
        onNotificationClick={() => {
          if (isBCN) {
            setSelectedMember(null)
            setActiveTab('history')
          }
        }}
      />

      <div className="flex-1 min-h-0 overflow-y-auto relative">
        {/* Left Floating Menu & 9-Dots Button */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          pendingCount={pendingCount}
          hasActiveEvent={!activeEvent?.isFinalized}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Main Content Area - Căn đều hai bên đồng bộ với Header 100% */}
        <main className="flex-1 py-4 sm:py-8 px-3 sm:px-6 md:px-10 lg:px-16 xl:px-20 w-full min-w-0 overflow-x-hidden">
          {selectedMember ? (
            <MemberProfileView member={selectedMember} onBack={handleBackFromMember} />
          ) : activeTab === 'dashboard' ? (
            <DashboardView
              onViewAllMembers={() => setActiveTab('members')}
              onNavigateToCheckin={() => setActiveTab('checkin')}
              onNavigateToLeaderboard={() => setActiveTab('stats')}
            />
          ) : activeTab === 'members' ? (
            <MembersView onSelectMember={handleSelectMember} searchQuery={globalSearch} />
          ) : activeTab === 'checkin' ? (
            <CheckinView />
          ) : activeTab === 'history' ? (
            <HistoryView />
          ) : activeTab === 'rules' ? (
            <RulesView />
          ) : activeTab === 'stats' ? (
            <StatsView onSelectMember={handleSelectMember} />
          ) : activeTab === 'accounts' && isAccountManager ? (
            <AccountsView />
          ) : (
            <SettingsView />
          )}
        </main>
      </div>
    </div>
  )
}
