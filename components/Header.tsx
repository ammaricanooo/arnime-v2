'use client'

import { Search, PanelLeft, X, LogIn } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuth from '@/lib/useAuth'
import { useAuthActions } from '@/lib/useAuthActions'
import LoginModal from './LoginModal'

interface HeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onSidebarToggle?: () => void
  sidebarCollapsed?: boolean
}

export default function Header({
  searchQuery,
  onSearchChange,
  onSidebarToggle,
  sidebarCollapsed = false,
}: HeaderProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { busy, loginWith } = useAuthActions(user)

  const [inputValue, setInputValue] = useState(searchQuery)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = inputValue.trim()
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`)
      setMobileSearchOpen(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    onSearchChange(e.target.value)
  }

  return (
    <>
      <header className="sticky top-0 z-40 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        {/* Mobile search overlay */}
        {mobileSearchOpen && (
          <div className="md:hidden absolute inset-0 z-50 bg-white dark:bg-slate-900 flex items-center px-3 gap-2">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  autoFocus
                  type="search"
                  placeholder="Cari anime, komik..."
                  value={inputValue}
                  onChange={handleChange}
                  className="w-full pl-9 pr-9 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                {inputValue && (
                  <button
                    type="button"
                    onClick={() => { setInputValue(''); onSearchChange('') }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
            <button
              onClick={() => setMobileSearchOpen(false)}
              className="shrink-0 text-slate-500 dark:text-slate-400 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex items-center h-full px-3 md:px-4 gap-3">
          {/* Desktop: sidebar toggle */}
          <button
            onClick={onSidebarToggle}
            className="hidden md:flex p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="w-5 h-5" />
          </button>

          {/* Mobile: logo */}
          <div className="md:hidden flex items-center gap-2">
            <img src="/arnime.svg" alt="Arnime" className="w-7 h-7 object-contain shrink-0" />
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Arnime</span>
          </div>

          {/* Desktop: search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search anime, comics..."
                value={inputValue}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
              />
            </div>
          </form>

          <div className="flex-1 md:hidden" />

          {/* Mobile: search icon */}
          <button
            onClick={() => setMobileSearchOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
            aria-label="Open search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Mobile: login button — only shown when not logged in */}
          {!user && (
            <button
              onClick={() => setLoginModalOpen(true)}
              disabled={busy}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-60"
              aria-label="Sign in"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign in
            </button>
          )}

          {/* Mobile: avatar when logged in */}
          {user && (
            <img
              src={user.photoURL || '/default-avatar.png'}
              alt="avatar"
              className="md:hidden w-8 h-8 rounded-full object-cover shrink-0 border-2 border-indigo-200 dark:border-indigo-800"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      </header>

      {/* Login modal */}
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
