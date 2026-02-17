"use client"

import { useEffect, useRef, useState } from "react"
import useAuth from "@/lib/useAuth"
import { signInWithGoogle, signOutUser } from "@/lib/firebase"
import { LogIn, LogOut } from "lucide-react"
import Swal from "sweetalert2"

export default function AuthButton() {
  const { user, loading } = useAuth()
  const [busy, setBusy] = useState(false)
  const hasShownLoginAlert = useRef(false)

  /* =====================
     ALERT SETELAH LOGIN
  ===================== */
  useEffect(() => {
    if (user && !hasShownLoginAlert.current) {
      hasShownLoginAlert.current = true

      Swal.fire({
        title: "Signed in",
        text: "You have been successfully logged in",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      })
    }

    if (!user) {
      hasShownLoginAlert.current = false
    }
  }, [user])

  /* =====================
     LOGIN (NO TRY/CATCH)
  ===================== */
  const handleLogin = async () => {
    setBusy(true)

    // ⚠️ JANGAN try/catch
    // redirect akan reload halaman
    await signInWithGoogle()
  }

  /* =====================
     LOGOUT
  ===================== */
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Sign out?",
      text: "You will be logged out from your account",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, sign out",
      cancelButtonText: "Cancel",
    })

    if (!result.isConfirmed) return

    setBusy(true)
    try {
      await signOutUser()
      await Swal.fire({
        title: "Signed out",
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      })
    } finally {
      setBusy(false)
    }
  }

  if (loading) return null

  if (user) {
    return (
      <button
        onClick={handleLogout}
        disabled={busy}
        className="flex items-center px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-60 cursor-pointer"
      >
        <span className="hidden md:block">Sign out</span>
        <LogOut className="w-4 h-4 ml-1" />
      </button>
    )
  }

  return (
    <button
      onClick={handleLogin}
      disabled={busy}
      className="flex items-center px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-60 cursor-pointer"
    >
      <LogIn className="w-4 h-4 mr-1" />
      <span className="hidden md:block">Sign in with Google</span>
    </button>
  )
}
