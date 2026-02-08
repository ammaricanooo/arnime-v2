'use client'

import { House, Flame, Star, Bookmark, MessageCircle, Calendar, X } from 'lucide-react'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isOpen?: boolean
  onClose?: () => void
  isCollapsed?: boolean
}

export default function Sidebar({ activeTab, onTabChange, isOpen = true, onClose, isCollapsed = false }: SidebarProps) {
  const menuItems = [
    { id: 'home', label: 'Home', icon: House },
    { id: 'complete', label: 'Complete', icon: Flame },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    // { id: 'comments', label: 'Comments', icon: MessageCircle },
    // { id: 'favorites', label: 'My Favorites', icon: Star },
    // { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
  ]

  const handleTabChange = (tab: string) => {
    onTabChange(tab)
    if (window.innerWidth < 768) {
      onClose?.()
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
        />
      )}

      {/* Sidebar - Full height from top */}
      <aside
        className={`fixed md:static left-0 top-0 h-screen bg-linear-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-r border-slate-200 dark:border-slate-800 overflow-y-auto z-40 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'w-20 md:w-20' : 'w-64 md:w-64'
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo Section */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'flex-col' : ''}`}>
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/arnime.svg" alt="" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Arnime</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">v2.0</span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex flex-col p-3 space-y-1 flex-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm ${
                  isActive
                    ? 'bg-linear-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                } ${
                  isCollapsed ? 'justify-center px-2' : ''
                }`}
                title={isCollapsed ? item.label : ''}
              >
                <IconComponent className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
