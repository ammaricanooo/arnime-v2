'use client'

import { House, Flame, Star, History, Tv, Calendar, LogOut, LogIn } from 'lucide-react'
import { useState, useRef, useEffect } from "react"
import useAuth from "@/lib/useAuth"
import { signInWithGoogle, signOutUser } from "@/lib/firebase"
import Swal from "sweetalert2"

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isOpen?: boolean
  onClose?: () => void
  isCollapsed?: boolean
}

export default function Sidebar({ activeTab, onTabChange, isOpen = true, onClose, isCollapsed = false }: SidebarProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  console.log(user);
  

  // close dropdown kalau klik luar
  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!user) return

    const justLoggedIn = sessionStorage.getItem("justLoggedIn")
    if (!justLoggedIn) return

    sessionStorage.removeItem("justLoggedIn")

    Swal.fire({
      title: "Signed in",
      text: "You have been successfully logged in",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    })
  }, [user])

  useEffect(() => {
    if (user) {
      setBusy(false)
    }
  }, [user])

  const handleLogin = async () => {
    setBusy(true)
    try {
      sessionStorage.setItem("justLoggedIn", "true")
      await signInWithGoogle()
    } catch (err) {
      console.error("Login error", err)
      sessionStorage.removeItem("justLoggedIn")
      await Swal.fire({
        title: "Error",
        text: "Failed to sign in",
        icon: "error",
      })
      setBusy(false)
    }
  }

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Sign out?",
      text: "You will be logged out from your account",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, sign out",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#6b7280",
    })

    if (!result.isConfirmed) return

    setBusy(true)
    try {
      await signOutUser()
      await Swal.fire({
        title: "Signed out",
        text: "You have been successfully logged out",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (err) {
      console.error("Logout error", err)
      await Swal.fire({
        title: "Error",
        text: "Failed to sign out",
        icon: "error",
      })
    } finally {
      setBusy(false)
    }
    setOpen(false)
  }


  const menuItems = [
    { id: 'home', label: 'Home', icon: House },
    { id: 'complete', label: 'Complete', icon: Flame },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'watchhistory', label: 'Watch History', icon: History },
    { id: 'livetv', label: 'Live TV', icon: Tv },
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
        className={`fixed md:static left-0 top-16 h-full bg-linear-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-r border-slate-200 dark:border-slate-800 overflow-y-auto overflow-x-hidden z-40 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20 md:w-20' : 'w-64 md:w-64'
          } ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
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
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm ${isActive
                  ? 'bg-linear-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  } ${isCollapsed ? 'justify-center px-2' : ''
                  }`}
                title={isCollapsed ? item.label : ''}
              >
                <IconComponent className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        <div ref={ref} className="relative inline-block w-full mb-16 md:mb-0"> {/* Berikan lebar tetap agar tidak 'loncat' */}
          {user ? (
            <>
              {/* CARD SAAT LOGIN */}
              <div
                onClick={() => setOpen(!open)}
                className="flex items-center gap-3 px-3 py-2 bg-white border-t border-gray-200 cursor-pointer hover:bg-gray-50 transition h-13"
              >
                <img
                  src={user.photoURL || '/default-avatar.png'}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                  referrerPolicy="no-referrer"
                  loading='lazy'
                />
                <div className="text-sm truncate">
                  <p className="font-semibold leading-tight truncate">{user.displayName}</p>
                  <p className="text-gray-500 text-xs truncate">{user.email}</p>
                </div>
              </div>

              {/* DROPDOWN LOGOUT */}
              {open && (
                <div className="absolute left-0 bottom-12 w-full p-1 z-50">
                  <button
                    onClick={handleLogout}
                    disabled={busy}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition disabled:opacity-60"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </>
          ) : (
            /* TOMBOL SAAT BELUM LOGIN (Dibuat identik secara dimensi) */
            <button
              onClick={handleLogin}
              disabled={busy}
              className="flex items-center gap-3 px-3 py-2 bg-white border-t border-gray-200 hover:bg-gray-50 transition disabled:opacity-60 w-full h-13"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
                <LogIn className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold leading-tight text-gray-900">Sign in</p>
                <p className="text-gray-500 text-xs">Sign in to save your anime</p>
              </div>
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
