"use client"

import { useState, useEffect } from "react"
import { signInWithGoogle, signInWithGithub, signOutUser } from "./firebase"
import type { User } from "firebase/auth"
import Swal from "sweetalert2"

export function useAuthActions(user: User | null) {
  const [busy, setBusy] = useState(false)

  // Show success toast once after login
  useEffect(() => {
    if (!user) return
    const flag = sessionStorage.getItem("justLoggedIn")
    if (!flag) return
    sessionStorage.removeItem("justLoggedIn")
    Swal.fire({
      title: "Signed in",
      text: `Welcome, ${user.displayName ?? user.email}!`,
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    })
  }, [user])

  useEffect(() => {
    if (user) setBusy(false)
  }, [user])

  const loginWith = async (provider: 'google' | 'github') => {
    setBusy(true)
    try {
      sessionStorage.setItem("justLoggedIn", "true")
      if (provider === 'google') await signInWithGoogle()
      else await signInWithGithub()
    } catch {
      sessionStorage.removeItem("justLoggedIn")
      await Swal.fire({ title: "Error", text: "Failed to sign in. Please try again.", icon: "error" })
      setBusy(false)
    }
  }

  const logout = async () => {
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
    } catch {
      await Swal.fire({ title: "Error", text: "Failed to sign out", icon: "error" })
    } finally {
      setBusy(false)
    }
  }

  // Convenience wrappers
  const login = () => loginWith('google')

  return { busy, login, loginWith, logout }
}
