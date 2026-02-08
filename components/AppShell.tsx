'use client'

import React, { useEffect, useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname() || '/'
  const searchParams = useSearchParams()
  const router = useRouter()

  const type = searchParams?.get('type')

  const getActiveTab = () => {
    if (pathname === '/' || pathname === '') {
      return type === 'complete' ? 'complete' : 'home'
    }

    if (pathname.startsWith('/schedule')) return 'schedule'
    // if (pathname.startsWith('/favorites')) return 'favorites'
    // if (pathname.startsWith('/watchlist')) return 'watchlist'

    return 'home'
  }

  const [activeTab, setActiveTab] = useState<string>(getActiveTab())

  useEffect(() => {
    setActiveTab(getActiveTab())
    // close mobile sidebar on route change
    setSidebarOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, type])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab === 'home') {
      router.push('/')
    } else if (tab === 'complete') {
      router.push('/?type=complete')
    } else if (tab === 'schedule') {
      router.push('/schedule')
    }
    if (window.innerWidth < 768) setSidebarOpen(false)
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
      />

      <div className="flex-1 flex flex-col">
        <Header 
          searchQuery={searchQuery} 
          onSearchChange={setSearchQuery} 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="w-full py-8 px-4 md:px-8">
            {children}
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/40 z-30 md:hidden" />
      )}
    </div>
  )
}
