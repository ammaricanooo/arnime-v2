"use client"

import { useState, useEffect } from "react"
import { db } from "./firebase"
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore"
import type { User } from "firebase/auth"
import Swal from "sweetalert2"

// ─── Single item bookmark toggle ─────────────────────────────────────────────

interface BookmarkPayload {
  slug: string
  title?: string
  poster?: string
  type?: string
}

export function useBookmarkToggle(user: User | null, slug: string) {
  const [isLiked, setIsLiked] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.uid || !slug) return
    getDoc(doc(db, "bookmarks", `${user.uid}_${slug}`)).then((snap) =>
      setIsLiked(snap.exists())
    )
  }, [user, slug])

  const toggle = async (payload: BookmarkPayload) => {
    if (!user) {
      Swal.fire({
        icon: "error",
        title: "Login required",
        text: "Please sign in to save your favorites.",
      })
      return
    }
    setLoading(true)
    const ref = doc(db, "bookmarks", `${user.uid}_${slug}`)
    try {
      if (isLiked) {
        await deleteDoc(ref)
        setIsLiked(false)
      } else {
        await setDoc(ref, {
          userId: user.uid,
          slug: payload.slug,
          title: payload.title ?? "",
          poster: payload.poster ?? "",
          type: payload.type ?? "ongoing",
          createdAt: new Date().toISOString(),
        })
        setIsLiked(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return { isLiked, loading, toggle }
}

// ─── Fetch all bookmarks for a user ──────────────────────────────────────────

export async function fetchUserBookmarks(uid: string) {
  const q = query(collection(db, "bookmarks"), where("userId", "==", uid))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ ...(d.data() as object), id: d.id })) as Array<
    Record<string, unknown> & { id: string }
  >
}

// ─── Save history entry ───────────────────────────────────────────────────────

interface HistoryPayload {
  slug: string
  title?: string
  poster?: string
  lastEpisodeName?: string
  lastEpisodeSlug?: string
  type?: string
}

export async function saveHistory(uid: string, payload: HistoryPayload) {
  await setDoc(
    doc(db, "history", `${uid}_${payload.slug}`),
    {
      userId: uid,
      ...payload,
      lastWatched: new Date().toISOString(),
    },
    { merge: true }
  )
}
