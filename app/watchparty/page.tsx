"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Users, LogIn, Loader2, Info, Clock, Play,
  Copy, Check, Trash2, Crown,
} from "lucide-react"
import {
  doc, getDoc, collection, query,
  where, onSnapshot, type Unsubscribe,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import useAuth from "@/lib/useAuth"
import LoginModal from "@/components/LoginModal"
import { useAuthActions } from "@/lib/useAuthActions"
import { deleteExpiredRoom, ROOM_DURATION_MS } from "@/lib/watchparty"
import type { WatchPartyRoom } from "@/lib/types"

// ─── Countdown display ────────────────────────────────────────────────────────

function TimeLeft({ expiresAt }: { expiresAt: number }) {
  const [left, setLeft] = useState(Math.max(0, expiresAt - Date.now()))

  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, expiresAt - Date.now())), 1000)
    return () => clearInterval(t)
  }, [expiresAt])

  const h = Math.floor(left / 3600000)
  const m = Math.floor((left % 3600000) / 60000)
  const s = Math.floor((left % 60000) / 1000)
  const pct = Math.min(100, (left / ROOM_DURATION_MS) * 100)
  const color = pct > 50 ? "bg-green-500" : pct > 20 ? "bg-amber-500" : "bg-red-500"

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Clock className="w-3 h-3" />
        <span className="font-mono font-semibold">
          {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
        </span>
      </div>
      <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-1000`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Room card ────────────────────────────────────────────────────────────────

function RoomCard({
  room,
  userId,
  onEnter,
  onDelete,
}: {
  room: WatchPartyRoom
  userId: string
  onEnter: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const isHost = room.hostId === userId

  const copy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(room.roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      onClick={() => onEnter(room.roomId)}
      className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden cursor-pointer hover:border-indigo-400 hover:shadow-lg transition-all"
    >
      {/* Poster strip */}
      {room.animePoster && (
        <div className="relative h-24 overflow-hidden">
          <img
            src={room.animePoster}
            alt={room.animeTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3">
            <p className="text-white text-xs font-bold line-clamp-1">{room.animeTitle}</p>
            <p className="text-slate-300 text-[10px] line-clamp-1">{room.episodeTitle}</p>
          </div>
        </div>
      )}

      <div className="p-3 space-y-2.5">
        {/* Room code + actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isHost && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
            <button
              onClick={copy}
              className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
            >
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tracking-widest">
                {room.roomId}
              </span>
              {copied ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Users className="w-3 h-3" />
              {room.members.length}
            </div>
            {/* Host can delete; non-host can leave (removes from their list) */}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(room.roomId) }}
              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
              aria-label={isHost ? "Delete room" : "Leave room"}
              title={isHost ? "Hapus room" : "Keluar dari room"}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Timer */}
        <TimeLeft expiresAt={room.expiresAt} />

        {/* Enter button */}
        <button className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors">
          <Play className="w-3.5 h-3.5 fill-current" /> Masuk Room
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WatchPartyPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { busy, loginWith } = useAuthActions(user)

  const [rooms, setRooms] = useState<WatchPartyRoom[]>([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState("")
  const [loginModalOpen, setLoginModalOpen] = useState(false)

  // ── Realtime listener for user's rooms ─────────────────────────────────────
  // Uses onSnapshot so when host deletes a room, it disappears from ALL members
  // instantly — no stale data.
  useEffect(() => {
    if (!user) { setRooms([]); return }

    setLoadingRooms(true)
    const now = Date.now()

    const q = query(
      collection(db, "watchparty"),
      where("members", "array-contains", user.uid)
    )

    const unsub: Unsubscribe = onSnapshot(q, (snap) => {
      const live: WatchPartyRoom[] = []
      const expired: string[] = []

      snap.docs.forEach((d) => {
        const data = d.data() as WatchPartyRoom
        if (data.expiresAt && now > data.expiresAt) {
          expired.push(d.id)
        } else {
          live.push({ ...data, roomId: d.id })
        }
      })

      // Sort newest first
      live.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
      setRooms(live)
      setLoadingRooms(false)

      // Clean up expired rooms in background
      expired.forEach((id) => deleteExpiredRoom(id).catch(() => {}))
    }, () => {
      setLoadingRooms(false)
    })

    return () => unsub()
  }, [user])

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { setLoginModalOpen(true); return }
    const code = joinCode.trim().toUpperCase()
    if (code.length < 4) { setError("Masukkan kode room yang valid."); return }
    setJoining(true)
    setError("")
    try {
      const snap = await getDoc(doc(db, "watchparty", code))
      if (!snap.exists()) {
        setError("Room tidak ditemukan. Cek kode dan coba lagi.")
        return
      }
      const data = snap.data() as WatchPartyRoom
      if (data.expiresAt && Date.now() > data.expiresAt) {
        await deleteExpiredRoom(code)
        setError("Room sudah kedaluwarsa.")
        return
      }
      router.push(`/watchparty/${code}`)
    } catch {
      setError("Gagal bergabung. Coba lagi.")
    } finally {
      setJoining(false)
    }
  }

  // Host: delete room entirely. Non-host: remove self from members array.
  const handleLeaveOrDelete = async (roomId: string) => {
    const room = rooms.find((r) => r.roomId === roomId)
    if (!room || !user) return

    if (room.hostId === user.uid) {
      // Host deletes the whole room — all members will see it disappear via onSnapshot
      await deleteExpiredRoom(roomId).catch(() => {})
    } else {
      // Non-host: remove self from members array
      const { doc: firestoreDoc, updateDoc, arrayRemove } = await import("firebase/firestore")
      await updateDoc(firestoreDoc(db, "watchparty", roomId), {
        members: arrayRemove(user.uid),
      }).catch(() => {})
      // onSnapshot will fire and remove this room from the list automatically
    }
  }

  return (
    <>
      <div className="max-w-2xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Watch Party</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Nonton bareng teman dengan chat realtime</p>
          </div>
        </div>

        {/* Not logged in */}
        {!user && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl mb-6">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <button
                onClick={() => setLoginModalOpen(true)}
                className="font-semibold underline underline-offset-2"
              >
                Login
              </button>{" "}
              untuk membuat atau bergabung ke room.
            </p>
          </div>
        )}

        {/* Active rooms — realtime */}
        {user && (
          <section className="mb-6">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">
              Room Aktifmu
            </h2>
            {loadingRooms ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-400">Belum ada room aktif.</p>
                <p className="text-xs text-slate-400 mt-1">Buat room dari halaman nonton episode.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rooms.map((room) => (
                  <RoomCard
                    key={room.roomId}
                    room={room}
                    userId={user.uid}
                    onEnter={(id) => router.push(`/watchparty/${id}`)}
                    onDelete={handleLeaveOrDelete}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Join by code */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
              <LogIn className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Gabung dengan Kode</h2>
              <p className="text-xs text-slate-400">Masukkan kode 6 digit dari temanmu</p>
            </div>
          </div>
          <form onSubmit={handleJoin} className="space-y-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError("") }}
              placeholder="Contoh: AB3X7K"
              maxLength={8}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono tracking-widest text-center uppercase"
            />
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <button
              type="submit"
              disabled={joining || !joinCode.trim() || busy}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60"
            >
              {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {joining ? "Bergabung..." : "Gabung Room"}
            </button>
          </form>
        </section>

        {/* How to */}
        <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
            Cara Pakai
          </p>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 list-disc list-inside">
            <li>Buka halaman nonton episode, klik tombol <strong>Watch Party</strong></li>
            <li>Bagikan kode 6 digit ke teman</li>
            <li>Teman masukkan kode di sini untuk bergabung</li>
            <li>Room aktif selama 3 jam, reset saat ganti episode</li>
          </ul>
        </div>
      </div>

      <LoginModal
        open={loginModalOpen}
        busy={busy}
        onClose={() => setLoginModalOpen(false)}
        onLoginGoogle={() => { loginWith("google"); setLoginModalOpen(false) }}
        onLoginGithub={() => { loginWith("github"); setLoginModalOpen(false) }}
      />
    </>
  )
}
