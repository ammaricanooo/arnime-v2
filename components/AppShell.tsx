'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Header from './Header'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { ROUTES } from '@/lib/constants'

function getActiveTab(pathname: string, type: string | null): string {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/schedule')) return 'schedule'
  if (pathname.startsWith('/favorites')) return 'favorites'
  if (pathname.startsWith('/watchhistory')) return 'watchhistory'
  if (pathname.startsWith('/watchparty')) return 'watchparty'
  if (pathname.startsWith('/livetv')) return 'livetv'
  if (pathname.startsWith('/comic')) return 'comic'
  if (pathname.startsWith('/settings')) return 'settings'
  if (pathname.startsWith('/download')) return 'download'
  return 'home'
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const pathname = usePathname() ?? '/'
  const searchParams = useSearchParams()
  const router = useRouter()
  const type = searchParams?.get('type') ?? null

  const [activeTab, setActiveTab] = useState(() => getActiveTab(pathname, type))

  useEffect(() => {
    setActiveTab(getActiveTab(pathname, type))
    setSidebarOpen(false)
  }, [pathname, type])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    router.push(ROUTES[tab] ?? '/')
    setSidebarOpen(false)
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

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSidebarToggle={() => setSidebarCollapsed((v) => !v)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="flex-1 overflow-y-auto custom-scroll">
          <div className="relative w-full px-3 py-4 pb-20 md:px-8 md:py-8 md:pb-8">
            {children}
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          aria-hidden="true"
        />
      )}

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  )
}
