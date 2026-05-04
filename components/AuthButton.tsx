"use client"

import useAuth from "@/lib/useAuth"
import { useAuthActions } from "@/lib/useAuthActions"
import { LogIn, LogOut, Loader2 } from "lucide-react"

export default function AuthButton() {
  const { user, loading } = useAuth()
  const { busy, login, logout } = useAuthActions(user)

  if (loading) return null

  if (user) {
    return (
      <button
        onClick={logout}
        disabled={busy}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-60 hover:bg-indigo-700 transition-colors"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
        <span className="hidden md:block">Sign out</span>
      </button>
    )
  }

  return (
    <button
      onClick={login}
      disabled={busy}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-60 hover:bg-indigo-700 transition-colors"
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
      <span className="hidden md:block">Sign in</span>
    </button>
  )
}
