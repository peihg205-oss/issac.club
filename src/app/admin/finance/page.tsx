'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Sidebar, type ActiveNavTab } from '@/components/layout/Sidebar'
import FinanceView from '@/components/views/FinanceView'
import { useAuth } from '@/lib/auth/AuthContext'
import { useClub } from '@/lib/context/ClubContext'

export default function AdminFinancePage() {
  const router = useRouter()
  const { currentUser, isAuthChecked } = useAuth()
  const { proposals, disputes, activeEvent } = useClub()

  const [activeTab, setActiveTab] = useState<ActiveNavTab>('finance')
  const [globalSearch, setGlobalSearch] = useState<string>('')
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false)

  const handleSelectTab = (tab: ActiveNavTab) => {
    if (tab === 'finance') {
      setActiveTab('finance')
    } else {
      router.push('/')
    }
  }

  return (
    <div className="flex h-screen bg-[#E8EDF3] text-slate-800 font-sans antialiased overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        pendingCount={(proposals?.length || 0) + (disputes?.length || 0)}
        hasActiveEvent={Boolean(activeEvent)}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          searchTerm={globalSearch}
          onSearchChange={setGlobalSearch}
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <FinanceView />
        </main>
      </div>
    </div>
  )
}
