"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  collection, doc, onSnapshot, addDoc,
  serverTimestamp, query, orderBy, limit,
  type Unsubscribe,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import useAuth from "@/lib/useAuth"
import LoginModal from "@/components/LoginModal"
import { useAuthActions } from "@/lib/useAuthActions"
import { joinRoom, deleteExpiredRoom, ROOM_DURATION_MS, updateRoomEpisode } from "@/lib/watchparty"
import { fetchJson } from "@/lib/fetchJson"
import { API } from "@/lib/constants"
import type { WatchPartyRoom, WatchPartyMessage, EpisodeItem } from "@/lib/types"
import {
  ArrowLeft, Send, Users, Copy, Check,
  Loader2, Crown, Clock,
  ChevronLeft, ChevronRight, List, DoorOpen,
} from "lucide-react"

// ─── Countdown bar ────────────────────────────────────────────────────────────

function CountdownBar({ expiresAt }: { expiresAt: number }) {
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
    <div className="flex items-center gap-2">
      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 shrink-0">
        {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
      </span>
    </div>
  )
}

// ─── Chat bubble ─────────────────────────────────────────────────────────────

function ChatBubble({ msg, isOwn }: { msg: WatchPartyMessage; isOwn: boolean }) {
  const time = msg.createdAt
    ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : ""

  return (
    <div className={`flex items-end gap-1.5 ${isOwn ? "flex-row-reverse" : ""}`}>
      <img
        src={msg.userAvatar || "/default-avatar.png"}
        alt={msg.userName}
        className="w-6 h-6 rounded-full object-cover shrink-0 mb-0.5"
        referrerPolicy="no-referrer"
      />
      <div className={`max-w-[78%] flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn && (
          <span className="text-[10px] text-slate-400 px-1 leading-none">{msg.userName}</span>
        )}
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-snug ${
            isOwn
              ? "bg-indigo-600 text-white rounded-br-sm"
              : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-bl-sm"
          }`}
          style={{ wordBreak: "break-word" }}
        >
          {msg.text}
        </div>
        <span className="text-[10px] text-slate-400 px-1">{time}</span>
      </div>
    </div>
  )
}

function SystemMsg({ text }: { text: string }) {
  return (
    <div className="flex justify-center">
      <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
        {text}
      </span>
    </div>
  )
}

// ─── Episode picker (host only) ───────────────────────────────────────────────

function EpisodePicker({
  animeSlug,
  currentEpisodeSlug,
  onSelect,
  loading,
}: {
  animeSlug: string
  currentEpisodeSlug: string
  onSelect: (ep: EpisodeItem) => void
  loading: boolean
}) {
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([])
  const [fetching, setFetching] = useState(true)
  const [open, setOpen] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchJson<{ result: { episodes?: EpisodeItem[] } }>(API.otakudesu.detail(animeSlug))
      .then((d) => setEpisodes(d?.result?.episodes ?? []))
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [animeSlug])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const currentIdx = episodes.findIndex((e) => e.slug === currentEpisodeSlug)
  const hasPrev = currentIdx > 0
  const hasNext = currentIdx >= 0 && currentIdx < episodes.length - 1

  const go = (dir: -1 | 1) => {
    const target = episodes[currentIdx + dir]
    if (target) onSelect(target)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => go(-1)}
        disabled={!hasPrev || loading || fetching}
        className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Prev
      </button>

      <div ref={listRef} className="relative flex-1">
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={fetching || loading}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-400 transition-all disabled:opacity-50"
        >
          <span className="flex items-center gap-1.5 truncate">
            <List className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
            {fetching ? "Loading..." : currentIdx >= 0 ? `Ep ${currentIdx + 1}` : "Episode"}
          </span>
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500 shrink-0" />}
        </button>

        {open && episodes.length > 0 && (
          <div className="absolute bottom-full mb-1 left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="max-h-52 overflow-y-auto custom-scroll">
              {episodes.map((ep, i) => (
                <button
                  key={ep.slug}
                  onClick={() => { onSelect(ep); setOpen(false) }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                    ep.slug === currentEpisodeSlug
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  <span className="font-medium">Ep {i + 1}</span>
                  <span className="text-slate-400 ml-1.5">{ep.episode}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => go(1)}
        disabled={!hasNext || loading || fetching}
        className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Next <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Room closed screen ───────────────────────────────────────────────────────

function RoomClosed({ reason, onBack }: { reason: 'deleted' | 'expired'; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-4">
      {reason === 'expired' ? (
        <Clock className="w-14 h-14 text-amber-500" />
      ) : (
        <DoorOpen className="w-14 h-14 text-slate-400" />
      )}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
          {reason === 'expired' ? 'Room Sudah Berakhir' : 'Room Ditutup'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {reason === 'expired'
            ? 'Durasi 3 jam telah habis. Room dan chat telah dihapus.'
            : 'Host telah menutup room ini.'}
        </p>
      </div>
      <button
        onClick={onBack}
        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
      >
        Kembali ke Watch Party
      </button>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type RoomStatus = 'loading' | 'active' | 'deleted' | 'expired' | 'error'

export default function WatchPartyRoomPage() {
  const params = useParams<{ roomId: string }>()
  const roomId = params?.roomId ?? ""
  const router = useRouter()
  const { user } = useAuth()
  const { busy, loginWith } = useAuthActions(user)

  // All state declared at top — no conditional hooks
  const [status, setStatus] = useState<RoomStatus>('loading')
  const [room, setRoom] = useState<WatchPartyRoom | null>(null)
  const [messages, setMessages] = useState<WatchPartyMessage[]>([])
  const [isMember, setIsMember] = useState(false)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [changingEp, setChangingEp] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isHost = user?.uid === room?.hostId

  // ── Subscribe to room doc ──────────────────────────────────────────────────

  useEffect(() => {
    if (!roomId) return

    const unsub = onSnapshot(
      doc(db, "watchparty", roomId),
      async (snap) => {
        // Room was deleted (by host or cleanup)
        if (!snap.exists()) {
          setStatus((prev) => prev === 'expired' ? 'expired' : 'deleted')
          return
        }

        const data = snap.data() as WatchPartyRoom

        // Room expired
        if (data.expiresAt && Date.now() > data.expiresAt) {
          setStatus('expired')
          await deleteExpiredRoom(roomId).catch(() => {})
          return
        }

        setRoom({ ...data, roomId })
        setStatus('active')
      },
      () => setStatus('error')
    )

    return () => unsub()
  }, [roomId])

  // ── Join room once active ──────────────────────────────────────────────────

  useEffect(() => {
    if (status !== 'active' || !user || !room || !roomId) return

    if (room.members?.includes(user.uid)) {
      setIsMember(true)
      return
    }

    joinRoom(roomId, user.uid, user.displayName ?? "Guest", user.photoURL ?? "")
      .then((result) => { if (result) setIsMember(true) })
      .catch(() => {})
  }, [status, user, room, roomId])

  // ── Subscribe to messages (no cross-doc get() — just auth required) ────────

  useEffect(() => {
    if (!roomId || !user) return

    const q = query(
      collection(db, "watchparty", roomId, "messages"),
      orderBy("createdAt", "asc"),
      limit(300)
    )
    const unsub = onSnapshot(
      q,
      (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as WatchPartyMessage))),
      () => {} // silently ignore permission errors during join race
    )
    return () => unsub()
  }, [roomId, user])

  // ── Auto-scroll ────────────────────────────────────────────────────────────

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // ── Send message ───────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!user) { setLoginModalOpen(true); return }
    const trimmed = text.trim()
    if (!trimmed || sending) return

    setSending(true)
    setText("")
    try {
      await addDoc(collection(db, "watchparty", roomId, "messages"), {
        userId: user.uid,
        userName: user.displayName ?? "Anonymous",
        userAvatar: user.photoURL ?? "",
        text: trimmed,
        createdAt: serverTimestamp(),
        type: "chat",
      })
    } catch {
      setText(trimmed)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }, [user, text, sending, roomId])

  // ── Host: change episode ───────────────────────────────────────────────────

  const handleEpisodeChange = async (ep: EpisodeItem) => {
    if (!room || !isHost) return
    setChangingEp(true)
    try {
      const data = await fetchJson<{
        result: { stream_url?: string; mirror?: Record<string, Array<{ content: string }>> }
      }>(API.otakudesu.episode(ep.slug))

      let newSrc = data?.result?.stream_url ?? ""

      if (!newSrc) {
        const mirror = data?.result?.mirror ?? {}
        const quality = Object.keys(mirror).find((q) => mirror[q]?.length > 0)
        if (quality) {
          try {
            const nonceData = await fetchJson<{ result: string }>(API.otakudesu.nonce)
            const nonce = nonceData?.result
            if (nonce) {
              const iframeData = await fetchJson<{ result: string }>(
                API.otakudesu.iframe(mirror[quality][0].content, nonce)
              )
              const parsed = new DOMParser().parseFromString(iframeData?.result ?? "", "text/html")
              newSrc = parsed.querySelector("iframe")?.src ?? ""
            }
          } catch { /* use empty */ }
        }
      }

      await updateRoomEpisode(room.roomId, ep.slug, ep.episode, newSrc)

      await addDoc(collection(db, "watchparty", roomId, "messages"), {
        userId: "system",
        userName: "System",
        userAvatar: "",
        text: `Host mengganti episode ke: ${ep.episode}`,
        createdAt: serverTimestamp(),
        type: "system",
      }).catch(() => {})
    } catch {
      // silently fail
    } finally {
      setChangingEp(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (status === 'loading') return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  )

  if (status === 'deleted') return (
    <RoomClosed reason="deleted" onBack={() => router.push("/watchparty")} />
  )

  if (status === 'expired') return (
    <RoomClosed reason="expired" onBack={() => router.push("/watchparty")} />
  )

  if (status === 'error' || !room) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-4">
      <p className="text-slate-600 dark:text-slate-400">Gagal memuat room.</p>
      <button onClick={() => router.push("/watchparty")} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold">
        Kembali
      </button>
    </div>
  )

  return (
    <>
      <div className="max-w-7xl mx-auto pb-4">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <button
            onClick={() => router.push("/watchparty")}
            className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Watch Party
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors"
              title="Copy room code"
            >
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tracking-widest">
                {roomId}
              </span>
              {copied
                ? <Check className="w-3.5 h-3.5 text-green-500" />
                : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Users className="w-3.5 h-3.5" />
              {room.members.length}
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className="mb-3">
          <CountdownBar expiresAt={room.expiresAt} />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── Video ── */}
          <div className="lg:col-span-2 space-y-3">
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-video shadow-xl ring-1 ring-white/10">
              {changingEp && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                  <p className="text-white text-xs font-medium">Mengganti episode...</p>
                </div>
              )}
              {room.iframeSrc ? (
                <iframe
                  src={room.iframeSrc}
                  allowFullScreen
                  className="w-full h-full border-none"
                  title={room.episodeTitle}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin opacity-40" />
                  <p className="text-sm opacity-60">Memuat video...</p>
                </div>
              )}
            </div>

            {/* Info + controls */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 font-medium mb-0.5">{room.animeTitle}</p>
                  <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight line-clamp-2">
                    {room.episodeTitle}
                  </h1>
                </div>
                <button
                  onClick={() => router.push(`/anime/${room.animeSlug}`)}
                  className="shrink-0 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  Detail
                </button>
              </div>

              {isHost ? (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Crown className="w-3 h-3 text-amber-500" /> Kontrol Host
                  </p>
                  <EpisodePicker
                    animeSlug={room.animeSlug}
                    currentEpisodeSlug={room.episodeSlug}
                    onSelect={handleEpisodeChange}
                    loading={changingEp}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <img
                    src={room.hostAvatar || "/default-avatar.png"}
                    alt={room.hostName}
                    className="w-5 h-5 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Host: <span className="font-semibold text-slate-700 dark:text-slate-300">{room.hostName}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Chat ── */}
          <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden h-[480px] lg:h-auto lg:max-h-[calc(100vh-10rem)]">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Live Chat
              </h3>
              <span className="text-[10px] text-slate-400">{room.members.length} online</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scroll">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-slate-400 text-center">Belum ada pesan.<br />Mulai chat!</p>
                </div>
              )}
              {messages.map((msg) =>
                msg.type === "system"
                  ? <SystemMsg key={msg.id} text={msg.text} />
                  : <ChatBubble key={msg.id} msg={msg} isOwn={msg.userId === user?.uid} />
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              {user ? (
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Ketik pesan..."
                    maxLength={300}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!text.trim() || sending}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 shrink-0"
                    aria-label="Send"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Login untuk chat
                </button>
              )}
            </div>
          </div>
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
