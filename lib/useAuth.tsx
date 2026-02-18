"use client"

import { useEffect, useState } from "react"
import type { User } from "firebase/auth"
import { onAuthChange, handleRedirectResult } from "./firebase"

export default function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    handleRedirectResult().catch(console.error)

    const unsub = onAuthChange((u) => {
      setUser(u)
      setLoading(false)
    })

    return () => unsub()
  }, [])

  return { user, loading }
}
