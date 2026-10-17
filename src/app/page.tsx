'use client'

import React, { useState } from 'react'
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
import type { RosterMember } from '@/lib/clubData'

export default function AppHome() {
  const { proposals, activeEvent } = useClub()
  const { isBCN } = useAuth()

  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard')
  const [selectedMember, setSelectedMember] = useState<RosterMember | null>(null)
  const [globalSearch, setGlobalSearch] = useState<string>('')
  // Mặc định đóng trên màn hình điện thoại (< 1024px) để không che khuất nội dung
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false)

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setIsSidebarOpen(true)
    }
  }, [])

  const pendingCount = isBCN ? proposals.filter((p) => p.status === 'pending_bcn').length : 0

  const handleSelectTab = (tab: ActiveNavTab) => {
    setSelectedMember(null) // Reset member profile view when switching tabs
    setActiveTab(tab)
  }

  const handleSelectMember = (member: RosterMember) => {
    setSelectedMember(member)
  }

  const handleBackFromMember = () => {
    setSelectedMember(null)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBFC]">
      {/* Top Header - Full Width spanning the top */}
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

      <div className="flex-1 min-h-0 relative">
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
        <main className="flex-1 py-4 sm:py-8 px-3 sm:px-6 md:px-10 lg:px-16 xl:px-20 w-full min-w-0">
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
          ) : activeTab === 'accounts' ? (
            <AccountsView />
          ) : (
            <SettingsView />
          )}
        </main>
      </div>
    </div>
  )
}
