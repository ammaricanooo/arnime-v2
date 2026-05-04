'use client'

import {
  House, Flame, GalleryVertical, Users,
  MoreHorizontal, Calendar, Tv, History,
  Settings, Star, LogIn, LogOut, X,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import useAuth from '@/lib/useAuth'
import { useAuthActions } from '@/lib/useAuthActions'
import LoginModal from './LoginModal'

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

// Items always visible in the bottom bar
const PRIMARY_ITEMS = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'complete', label: 'Complete', icon: Flame },
  { id: 'comic', label: 'Comic', icon: GalleryVertical },
  { id: 'watchparty', label: 'Party', icon: Users },
]

// Items in the "More" drawer
const MORE_ITEMS = [
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'livetv', label: 'Live TV', icon: Tv },
  { id: 'favorites', label: 'Favorites', icon: Star },
  { id: 'watchhistory', label: 'Watch History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
]

// Tabs that live in the "More" drawer (for active indicator on the More button)
const MORE_IDS = new Set(MORE_ITEMS.map((i) => i.id))

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  const { user } = useAuth()
  const { busy, loginWith, logout } = useAuthActions(user)

  // Close drawer on outside tap
  useEffect(() => {
  if (!drawerOpen) return

  const handler = (e: MouseEvent) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
      setDrawerOpen(false)
    }
  }

  document.addEventListener('click', handler)

  return () => {
    document.removeEventListener('click', handler)
  }
}, [drawerOpen])

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false) }, [activeTab])

  const handleSelect = (id: string) => {
    onTabChange(id)
    setDrawerOpen(false)
  }

  const isMoreActive = MORE_IDS.has(activeTab)

  return (
    <>
      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          aria-hidden="true"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* More drawer — slides up from bottom nav */}
      <div
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className={`md:hidden fixed left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${drawerOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>

        <div className="px-4 pb-4 pt-2">
          {/* Menu grid */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {MORE_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id
              return (
                <button
                  key={id}
                  onClick={() => handleSelect(id)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-colors ${isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                  <span className="text-[10px] font-medium leading-none">{label}</span>
                </button>
              )
            })}
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-100 dark:bg-slate-800 mb-3" />

          {/* User section */}
          {user ? (
            <div className="flex items-center gap-3 px-1">
              <img
                src={user.photoURL || '/default-avatar.png'}
                alt="avatar"
                className="w-9 h-9 rounded-full object-cover shrink-0 border-2 border-slate-100 dark:border-slate-700"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
                  {user.displayName}
                </p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
              <button
                onClick={() => { logout(); setDrawerOpen(false) }}
                disabled={busy}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold transition-colors hover:bg-red-100 disabled:opacity-60 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setLoginModalOpen(true); setDrawerOpen(false) }}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" />
              Sign in
            </button>
          )}
        </div>
      </div>

      {/* Bottom nav bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex h-16">
          {PRIMARY_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors ${isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 dark:text-slate-500'
                  }`}
                aria-label={label}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                )}
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </button>
            )
          })}

          {/* More button */}
          <button
            onClick={() => setDrawerOpen((v) => !v)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors ${isMoreActive || drawerOpen
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-400 dark:text-slate-500'
              }`}
            aria-label="More"
            aria-expanded={drawerOpen}
          >
            {(isMoreActive || drawerOpen) && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
            {drawerOpen ? (
              <X className="w-5 h-5 scale-110 transition-transform" />
            ) : (
              <MoreHorizontal className={`w-5 h-5 ${isMoreActive ? 'scale-110' : ''} transition-transform`} />
            )}
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        </div>
      </nav>

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
