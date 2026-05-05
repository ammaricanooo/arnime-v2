'use client'

import {
  House, Star, History, Tv, Calendar,
  LogOut, LogIn, GalleryVertical, Settings, Users, Download,
} from 'lucide-react'
import { useRef, useState } from 'react'
import useAuth from '@/lib/useAuth'
import { useAuthActions } from '@/lib/useAuthActions'
import LoginModal from './LoginModal'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isOpen?: boolean
  onClose?: () => void
  isCollapsed?: boolean
}

const MENU_GROUPS = [
  {
    title: 'Anime',
    items: [
      { id: 'home', label: 'Home', icon: House },
      { id: 'schedule', label: 'Schedule', icon: Calendar },
    ],
  },
  {
    title: 'Comic',
    items: [{ id: 'comic', label: 'Comic', icon: GalleryVertical }],
  },
  {
    title: 'TV',
    items: [{ id: 'livetv', label: 'Live TV', icon: Tv }],
  },
]

const BOTTOM_ITEMS = [
  { id: 'favorites', label: 'Favorites', icon: Star },
  { id: 'watchhistory', label: 'Watch History', icon: History },
  { id: 'watchparty', label: 'Watch Party', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'download', label: 'Download App', icon: Download },
]

export default function Sidebar({
  activeTab,
  onTabChange,
  isOpen = true,
  onClose,
  isCollapsed = false,
}: SidebarProps) {
  const { user } = useAuth()
  const { busy, loginWith, logout } = useAuthActions(user)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const handleTabChange = (tab: string) => {
    onTabChange(tab)
    if (typeof window !== 'undefined' && window.innerWidth < 768) onClose?.()
  }

  const navItemClass = (isActive: boolean) =>
    `flex items-center w-full gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
      isActive
        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
    } ${isCollapsed ? 'justify-center px-2' : ''}`

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed md:static left-0 top-0 h-full z-40 flex flex-col
          bg-white dark:bg-slate-900
          border-r border-slate-200 dark:border-slate-800
          overflow-y-auto overflow-x-hidden
          transition-all duration-300
          ${isCollapsed ? 'w-16 md:w-16' : 'w-64 md:w-64'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="h-14 px-4 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="w-8 h-8 shrink-0 overflow-hidden">
            <img src="/arnime.svg" alt="Arnime" className="w-8 h-8 object-contain" />
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">Arnime</p>
              <p className="text-[10px] text-slate-400 mt-0.5">v2.0</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-5 overflow-y-auto custom-scroll">
          {MENU_GROUPS.map((group) => (
            <div key={group.title}>
              {!isCollapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {group.title}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => handleTabChange(id)}
                    className={navItemClass(activeTab === id)}
                    title={isCollapsed ? label : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span>{label}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-0.5">
            {!isCollapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Library
              </p>
            )}
            {BOTTOM_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={navItemClass(activeTab === id)}
                title={isCollapsed ? label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>{label}</span>}
              </button>
            ))}
          </div>
        </nav>

        {/* User section */}
        <div ref={ref} className="relative border-t border-slate-200 dark:border-slate-800 shrink-0">
          {user ? (
            <div className="relative">
              {/* User card — click to open sign-out dropdown */}
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-3 w-full px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <img
                  src={user.photoURL || '/default-avatar.png'}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                {!isCollapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100 leading-tight">
                      {user.displayName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                )}
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-50">
                  <button
                    onClick={() => { logout(); setUserMenuOpen(false) }}
                    disabled={busy}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-60"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Single "Sign in" button — opens modal */
            <button
              onClick={() => setLoginModalOpen(true)}
              disabled={busy}
              className="flex items-center gap-3 w-full px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-60"
              title={isCollapsed ? 'Sign in' : undefined}
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                <LogIn className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              {!isCollapsed && (
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">Sign in</p>
                  <p className="text-xs text-slate-400">Save your favorites</p>
                </div>
              )}
            </button>
          )}
        </div>
      </aside>

      {/* Login modal — rendered outside aside so it covers full screen */}
      <LoginModal
        open={loginModalOpen}
        busy={busy}
        onClose={() => setLoginModalOpen(false)}
        onLoginGoogle={() => { loginWith('google'); setLoginModalOpen(false) }}
        onLoginGithub={() => { loginWith('github'); setLoginModalOpen(false) }}
      />
    </>
  )
}
