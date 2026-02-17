"use client"

import useAuth from '@/lib/useAuth'
import { signInWithGoogle, signOutUser } from '@/lib/firebase'
import { useState } from 'react'
import { LogIn, LogOut } from 'lucide-react'
import Swal from 'sweetalert2'

export default function AuthButton() {
  const { user, loading } = useAuth()
  const [busy, setBusy] = useState(false)

  const handleLogin = async () => {
    setBusy(true)
    try {
      await signInWithGoogle()
      await Swal.fire({
        title: 'Signed in',
        text: 'You have been successfully logged in',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (err) {
      console.error('Login error', err)
    } finally {
      setBusy(false)
    }
  }

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Sign out?',
      text: 'You will be logged out from your account',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, sign out',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#6b7280',
    })

    if (!result.isConfirmed) return

    setBusy(true)
    try {
      await signOutUser()
      await Swal.fire({
        title: 'Signed out',
        text: 'You have been successfully logged out',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (err) {
      console.error('Logout error', err)
      await Swal.fire({
        title: 'Error',
        text: 'Failed to sign out',
        icon: 'error',
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
        className="flex items-center px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm cursor-pointer disabled:opacity-60"
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
      className="flex items-center px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm cursor-pointer disabled:opacity-60"
    >
      <LogIn className="w-4 h-4 mr-1" />
      <span className="hidden md:block">Sign in with Google</span>
    </button>
  )
}
