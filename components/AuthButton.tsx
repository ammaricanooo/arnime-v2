"use client"

import { useEffect, useRef, useState } from "react"
import useAuth from "@/lib/useAuth"
import { signInWithGoogle, signOutUser } from "@/lib/firebase"
import { LogIn, LogOut } from "lucide-react"
import Swal from "sweetalert2"

export default function AuthButton() {
  const { user, loading } = useAuth()
  const [busy, setBusy] = useState(false)

  // 🔒 supaya alert login tidak muncul berkali-kali
  const hasShownLoginAlert = useRef(false)

  /* =========================
     SWEETALERT SETELAH LOGIN
     (AMAN DESKTOP + MOBILE)
  ========================= */
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

  /* =========================
     LOGIN
  ========================= */
  const handleLogin = async () => {
    setBusy(true)
    try {
      await signInWithGoogle()
      // ⚠️ JANGAN SweetAlert di sini (redirect mobile)
    } catch (err) {
      console.error("Login error", err)
      await Swal.fire({
        title: "Error",
        text: "Failed to sign in",
        icon: "error",
      })
      setBusy(false)
    }
  }

  /* =========================
     LOGOUT
  ========================= */
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
  }

  if (loading) return null

  /* =========================
     UI
  ========================= */
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
