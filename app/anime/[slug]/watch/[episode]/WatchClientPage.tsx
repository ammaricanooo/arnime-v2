'use client'

import { useRouter } from 'next/navigation'
import { Download, ChevronDown, Share2, Loader2, Info, Users, Check, Star, Tv, Clock, PlayCircle, ChevronRight, Home } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import useAuth from '@/lib/useAuth'
import { saveHistory } from '@/lib/useBookmark'
import { fetchJson } from '@/lib/fetchJson'
import { API } from '@/lib/constants'
import type { EpisodeDetail, AnimeDetail, EpisodeItem } from '@/lib/types'
import { createWatchPartyRoom, updateRoomEpisode, getUserRooms } from '@/lib/watchparty'
import type { WatchPartyRoom } from '@/lib/types'
import LoginModal from '@/components/LoginModal'
import { useAuthActions } from '@/lib/useAuthActions'
import Swal from 'sweetalert2'

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = () => (
  <div className="animate-pulse space-y-3 max-w-7xl mx-auto">
    <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-3">
        <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="bg-slate-200 dark:bg-slate-800 rounded-2xl h-40" />
      </div>
      <div className="space-y-3">
        <div className="bg-slate-200 dark:bg-slate-800 rounded-2xl h-72" />
        <div className="bg-slate-200 dark:bg-slate-800 rounded-2xl h-40" />
      </div>
    </div>
  </div>
)

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

function Breadcrumb({ animeTitle, animeSlug, episodeTitle }: {
  animeTitle: string
  animeSlug: string
  episodeTitle: string
}) {
  const router = useRouter()
  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap mb-4" aria-label="Breadcrumb">
      <button onClick={() => router.push('/')} className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
        <Home className="w-3 h-3" />
        <span>Home</span>
      </button>
      <ChevronRight className="w-3 h-3 shrink-0" />
      <button
        onClick={() => router.push(`/anime/${animeSlug}`)}
        className="hover:text-indigo-600 transition-colors max-w-[160px] truncate"
      >
        {animeTitle}
      </button>
      <ChevronRight className="w-3 h-3 shrink-0" />
      <span className="text-slate-600 dark:text-slate-300 font-medium max-w-[200px] truncate">
        {episodeTitle}
      </span>
    </nav>
  )
}

// ─── Server dropdown ──────────────────────────────────────────────────────────
// Structure: quality groups → servers inside each group.
// Default server is auto-selected on load.
// Clicking a server immediately loads it and closes the dropdown.

interface ServerDropdownProps {
  mirrors: Record<string, Array<{ nama: string; content: string }>>
  streamUrl?: string | null   // direct stream_url — shown as "Default" option
  selectedQuality: string
  selectedServer: string
  onSelect: (quality: string, serverName: string, content: string) => void
  onSelectStream?: () => void  // called when user picks the Default option
  loading: boolean
}

function ServerDropdown({ mirrors, streamUrl, selectedQuality, selectedServer, onSelect, onSelectStream, loading }: ServerDropdownProps) {
  const [open, setOpen] = useState(false)
  const [expandedQuality, setExpandedQuality] = useState(selectedQuality)
  const ref = useRef<HTMLDivElement>(null)
  const qualities = Object.keys(mirrors)
  const hasDefault = !!streamUrl
  const hasOptions = hasDefault || qualities.length > 0

  useEffect(() => { setExpandedQuality(selectedQuality) }, [selectedQuality])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!hasOptions) return null

  const isDefaultActive = selectedQuality === 'Default'
  const label = isDefaultActive
    ? 'Default Server'
    : selectedQuality && selectedServer
    ? `${selectedQuality} — ${selectedServer.toUpperCase()}`
    : 'Pilih Server'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 hover:border-indigo-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-44"
      >
        <span className="truncate">{label}</span>
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500 shrink-0" />
          : <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        }
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="max-h-72 overflow-y-auto custom-scroll">
            {/* Default option when stream_url exists */}
            {hasDefault && (
              <button
                onClick={() => { onSelectStream?.(); setOpen(false) }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                  isDefaultActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600'
                }`}
              >
                <span>Default Server</span>
                {isDefaultActive && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            )}

            {/* Mirror quality groups */}            {qualities.map((q) => (
              <div key={q}>
                {/* Quality group header — click to expand/collapse */}
                <button
                  onClick={() => setExpandedQuality((prev) => prev === q ? '' : q)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{q}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedQuality === q ? 'rotate-180' : ''}`} />
                </button>

                {/* Servers under this quality */}
                {expandedQuality === q && mirrors[q]?.map((m, i) => {
                  const isActive = selectedQuality === q && selectedServer === m.nama
                  return (
                    <button
                      key={i}
                      onClick={() => { onSelect(q, m.nama, m.content); setOpen(false) }}
                      className={`w-full flex items-center justify-between px-5 py-2.5 text-sm transition-colors border-t border-slate-100 dark:border-slate-700/50 ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600'
                      }`}
                    >
                      <span>Server {m.nama.toUpperCase()}</span>
                      {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Episode list sidebar ─────────────────────────────────────────────────────

function EpisodeList({ episodes, currentSlug, animeSlug }: {
  episodes: EpisodeItem[]
  currentSlug: string
  animeSlug: string
}) {
  const router = useRouter()
  const activeRef = useRef<HTMLButtonElement>(null)

  // Scroll active episode into view on mount
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [currentSlug])

  if (episodes.length === 0) return null

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Episode List
        </h3>
        <span className="text-[10px] text-slate-400 font-medium">{episodes.length} eps</span>
      </div>
      {/* Fixed height with scroll */}
      <div className="overflow-y-auto custom-scroll" style={{ maxHeight: '360px' }}>
        {episodes.map((ep, idx) => {
          const isActive = ep.slug === currentSlug
          return (
            <button
              key={ep.slug}
              ref={isActive ? activeRef : undefined}
              onClick={() => router.push(`/anime/${animeSlug}/watch/${ep.slug}`)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0 ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <PlayCircle className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-600'}`} />
              <div className="min-w-0 flex-1">
                <p className={`text-[10px] font-semibold uppercase tracking-wide ${isActive ? 'text-indigo-500' : 'text-slate-400'}`}>
                  Ep {idx + 1}
                </p>
                <p className={`text-xs font-medium truncate leading-tight ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                  {ep.episode}
                </p>
              </div>
              {isActive && (
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WatchClientPage({ slug, episode: episodeSlug }: { slug: string; episode: string }) {
  const router = useRouter()
  const { user } = useAuth()
  const { busy: authBusy, loginWith } = useAuthActions(user)

  const [episodeData, setEpisodeData] = useState<EpisodeDetail | null>(null)
  const [animeDetail, setAnimeDetail] = useState<AnimeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Server selection: quality + server name tracked separately
  const [selectedQuality, setSelectedQuality] = useState('')
  const [selectedServer, setSelectedServer] = useState('')
  const [iframeSrc, setIframeSrc] = useState<string | null>(null)
  const [iframeLoading, setIframeLoading] = useState(false)
  const [iframeError, setIframeError] = useState<string | null>(null)

  // Watch Party
  const [partyLoading, setPartyLoading] = useState(false)
  const [activeRoom, setActiveRoom] = useState<WatchPartyRoom | null>(null)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [partyCopied, setPartyCopied] = useState(false)
  const iframeSrcRef = useRef<string | null>(null)

  useEffect(() => { iframeSrcRef.current = iframeSrc }, [iframeSrc])

  // Load episode + anime detail in parallel
  useEffect(() => {
    setLoading(true)
    setError(null)
    setIframeSrc(null)
    setIframeError(null)

    Promise.all([
      fetchJson<{ result: EpisodeDetail }>(API.otakudesu.episode(episodeSlug)),
      fetchJson<{ result: AnimeDetail }>(API.otakudesu.detail(slug)).catch(() => ({ result: null })),
    ])
      .then(([epData, animeData]) => {
        if (!epData?.result) { setError('Episode not found'); return }
        setEpisodeData(epData.result)
        if (animeData?.result) setAnimeDetail(animeData.result as AnimeDetail)

        // Auto-select default server
        if (epData.result.stream_url) {
          setIframeSrc(epData.result.stream_url)
          setSelectedQuality('Default')
          setSelectedServer('Default')
        } else {
          const mirror = epData.result.mirror ?? {}
          const firstQuality = Object.keys(mirror).find((q) => mirror[q]?.length > 0)
          if (firstQuality && mirror[firstQuality]?.[0]) {
            const firstServer = mirror[firstQuality][0]
            setSelectedQuality(firstQuality)
            setSelectedServer(firstServer.nama)
            loadMirror(firstServer.content)
          }
        }
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [episodeSlug, slug])

  // Save history
  useEffect(() => {
    if (!episodeData || !user) return
    saveHistory(user.uid, {
      slug,
      title: episodeData.title,
      poster: animeDetail?.poster,
      lastEpisodeName: episodeData.title,
      lastEpisodeSlug: episodeSlug,
    }).catch(() => {})
  }, [episodeData, user, slug, episodeSlug, animeDetail])

  // Check active watch party room
  useEffect(() => {
    if (!user) { setActiveRoom(null); return }
    getUserRooms(user.uid)
      .then((rooms) => setActiveRoom(rooms.find((r) => r.animeSlug === slug && r.hostId === user.uid) ?? null))
      .catch(() => {})
  }, [user, slug])

  // Auto-update room when episode changes
  useEffect(() => {
    if (!activeRoom || !episodeData || !user) return
    if (activeRoom.hostId !== user.uid) return
    if (activeRoom.episodeSlug === episodeSlug) return
    const src = iframeSrcRef.current ?? ''
    if (!src) return
    updateRoomEpisode(activeRoom.roomId, episodeSlug, episodeData.title ?? '', src)
      .then(() => setActiveRoom((prev) => prev ? { ...prev, episodeSlug, episodeTitle: episodeData.title ?? '' } : prev))
      .catch(() => {})
  }, [episodeSlug, episodeData, activeRoom, user])

  const loadMirror = async (content: string) => {
    setIframeSrc(null)
    setIframeLoading(true)
    setIframeError(null)
    try {
      const nonceData = await fetchJson<{ result: string }>(API.otakudesu.nonce)
      const nonce = nonceData?.result
      if (!nonce) throw new Error('Failed to get security token')
      const iframeData = await fetchJson<{ result: string }>(API.otakudesu.iframe(content, nonce))
      const parsed = new DOMParser().parseFromString(iframeData?.result ?? '', 'text/html')
      const iframe = parsed.querySelector('iframe')
      if (iframe?.src) setIframeSrc(iframe.src)
      else throw new Error('Player could not be loaded')
    } catch (err: unknown) {
      setIframeError(err instanceof Error ? err.message : 'Failed to load player')
    } finally {
      setIframeLoading(false)
    }
  }

  const handleServerSelect = (quality: string, serverName: string, content: string) => {
    setSelectedQuality(quality)
    setSelectedServer(serverName)
    loadMirror(content)
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) await navigator.share({ title: episodeData?.title, url })
    else {
      await navigator.clipboard.writeText(url)
      Swal.fire({ icon: 'success', title: 'Link copied', timer: 1000, showConfirmButton: false })
    }
  }

  const handleWatchParty = async () => {
    if (!user) { setLoginModalOpen(true); return }
    if (!iframeSrc) {
      Swal.fire({ icon: 'info', title: 'Video belum siap', text: 'Tunggu video dimuat terlebih dahulu.', timer: 2000, showConfirmButton: false })
      return
    }
    setPartyLoading(true)
    try {
      if (activeRoom) {
        if (activeRoom.episodeSlug !== episodeSlug) {
          await updateRoomEpisode(activeRoom.roomId, episodeSlug, episodeData?.title ?? '', iframeSrc)
        }
        router.push(`/watchparty/${activeRoom.roomId}`)
        return
      }
      const roomId = await createWatchPartyRoom({
        hostId: user.uid,
        hostName: user.displayName ?? 'Host',
        hostAvatar: user.photoURL ?? '',
        animeSlug: slug,
        animeTitle: animeDetail?.title ?? '',
        animePoster: animeDetail?.poster ?? '',
        episodeSlug,
        episodeTitle: episodeData?.title ?? '',
        iframeSrc,
      })
      router.push(`/watchparty/${roomId}`)
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak bisa membuat room. Coba lagi.' })
    } finally {
      setPartyLoading(false)
    }
  }

  if (loading) return <Skeleton />

  if (error || !episodeData) return (
    <div className="text-center py-20">
      <Info className="w-10 h-10 text-red-500 mx-auto mb-3" />
      <p className="text-slate-600 dark:text-slate-400 mb-4">{error ?? 'Episode not found'}</p>
      <button onClick={() => router.push(`/anime/${slug}`)} className="text-indigo-600 text-sm font-medium hover:underline">
        Back to Anime
      </button>
    </div>
  )

  const mirrors = episodeData.mirror ?? {}
  const downloads = episodeData.download ?? {}
  const hasDownloads = Object.keys(downloads).length > 0
  const episodes = animeDetail?.episodes ?? []

  return (
    <>
      <div className="max-w-7xl mx-auto pb-10">

        {/* Breadcrumb */}
        <Breadcrumb
          animeTitle={animeDetail?.title ?? slug}
          animeSlug={slug}
          episodeTitle={episodeData.title ?? episodeSlug}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Left col: player + info ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Player */}
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-video shadow-xl ring-1 ring-white/10">
              {iframeLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-10 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <p className="text-white text-xs font-medium tracking-widest animate-pulse">LOADING...</p>
                </div>
              )}
              {iframeError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center bg-slate-900">
                  <p className="text-red-400 mb-4 text-sm">{iframeError}</p>
                  <button onClick={() => window.location.reload()} className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-full text-sm font-semibold">
                    Refresh
                  </button>
                </div>
              ) : (
                <iframe
                  src={iframeSrc ?? 'about:blank'}
                  allowFullScreen
                  className="w-full h-full border-none"
                  title="Anime Player"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Info card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-4">

              {/* Title + action buttons */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1 min-w-0">
                  {animeDetail?.title && (
                    <p className="text-xs text-slate-400 font-medium mb-0.5 truncate">{animeDetail.title}</p>
                  )}
                  <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {episodeData.title}
                  </h1>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:text-slate-300 transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                  <button
                    onClick={handleWatchParty}
                    disabled={partyLoading || authBusy}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
                  >
                    {partyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                    <span className="hidden sm:inline">{activeRoom ? 'Buka Room' : 'Watch Party'}</span>
                  </button>
                  {activeRoom && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activeRoom.roomId)
                        setPartyCopied(true)
                        setTimeout(() => setPartyCopied(false), 2000)
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-xs font-mono font-bold text-green-700 dark:text-green-400 hover:bg-green-100 transition-colors"
                    >
                      {activeRoom.roomId}
                      {partyCopied && <Check className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Server selector */}
              {(Object.keys(mirrors).length > 0 || episodeData.stream_url) && (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">Server</span>
                  <ServerDropdown
                    mirrors={mirrors}
                    streamUrl={episodeData.stream_url}
                    selectedQuality={selectedQuality}
                    selectedServer={selectedServer}
                    onSelect={handleServerSelect}
                    onSelectStream={() => {
                      setSelectedQuality('Default')
                      setSelectedServer('Default')
                      setIframeSrc(episodeData.stream_url ?? null)
                    }}
                    loading={iframeLoading}
                  />
                </div>
              )}

              {/* Anime quick info */}
              {animeDetail && (
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  {animeDetail.score && (
                    <div className="flex items-center gap-1 text-amber-500 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {animeDetail.score}
                    </div>
                  )}
                  {animeDetail.total_episode && (
                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <Tv className="w-3.5 h-3.5" />
                      {animeDetail.total_episode} Eps
                    </div>
                  )}
                  {animeDetail.duration && (
                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      {animeDetail.duration}
                    </div>
                  )}
                  {animeDetail.status && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      animeDetail.status === 'Completed'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                    }`}>
                      {animeDetail.status}
                    </span>
                  )}
                  {animeDetail.genre && (
                    <div className="flex flex-wrap gap-1">
                      {animeDetail.genre.split(',').slice(0, 4).map((g) => (
                        <span key={g} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md">
                          {g.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Prev / Next */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  disabled={!episodeData.has_previous_episode}
                  onClick={() => router.push(`/anime/${slug}/watch/${episodeData.previous_episode?.slug}`)}
                  className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-white transition-all"
                >
                  ← Previous
                </button>
                <button
                  disabled={!episodeData.has_next_episode}
                  onClick={() => router.push(`/anime/${slug}/watch/${episodeData.next_episode?.slug}`)}
                  className="py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-30 hover:bg-indigo-700 transition-all"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Download links — left col, below info card */}
            {hasDownloads && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <details className="group">
                  <summary className="flex justify-between items-center px-4 py-3.5 cursor-pointer font-semibold text-sm text-slate-900 dark:text-white list-none">
                    <span className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-indigo-500" />
                      Download Links
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="px-4 pb-4 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                    {Object.entries(downloads).map(([format, links]) => (
                      <div key={format}>
                        <p className="text-[10px] font-bold uppercase text-indigo-500 mb-2">
                          {format.replace('dmp4', 'MP4')}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                          {(links as Array<{ provider: string; link: string }>).map((link, i) => (
                            <a
                              key={i}
                              href={link.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1.5 p-2 text-xs bg-slate-50 dark:bg-slate-800 dark:text-slate-300 border border-slate-100 dark:border-slate-700 rounded-lg hover:text-indigo-600 hover:border-indigo-400 transition-all font-medium text-center"
                            >
                              <Download className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{link.provider}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>

          {/* ── Right col: anime detail + episode list ── */}
          <div className="space-y-4">

            {/* Anime detail card */}
            {animeDetail && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {animeDetail.poster && (
                  <div className="relative h-28 overflow-hidden">
                    <img src={animeDetail.poster} alt="" className="absolute inset-0 w-full h-full object-cover scale-110 blur-sm opacity-50" />
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
                    <img
                      src={animeDetail.poster}
                      alt={animeDetail.title}
                      className="absolute bottom-2.5 left-3 w-11 h-16 object-cover rounded-lg shadow-lg border border-white/20"
                    />
                    <div className="absolute bottom-2.5 left-3 right-3 pl-14">
                      <p className="text-white font-bold text-sm line-clamp-2 leading-tight">{animeDetail.title}</p>
                      {animeDetail.japanese && (
                        <p className="text-white/60 text-[10px] mt-0.5 line-clamp-1">{animeDetail.japanese}</p>
                      )}
                    </div>
                  </div>
                )}
                <div className="px-4 py-3 space-y-2">
                  {animeDetail.synopsis && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {animeDetail.synopsis}
                    </p>
                  )}
                  <button
                    onClick={() => router.push(`/anime/${slug}`)}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Lihat detail lengkap →
                  </button>
                </div>
              </div>
            )}

            {/* Episode list */}
            {episodes.length > 0 && (
              <EpisodeList
                episodes={episodes}
                currentSlug={episodeSlug}
                animeSlug={slug}
              />
            )}
          </div>
        </div>
      </div>

      <LoginModal
        open={loginModalOpen}
        busy={authBusy}
        onClose={() => setLoginModalOpen(false)}
        onLoginGoogle={() => { loginWith('google'); setLoginModalOpen(false) }}
        onLoginGithub={() => { loginWith('github'); setLoginModalOpen(false) }}
      />
    </>
  )
}
