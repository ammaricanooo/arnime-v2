'use client'

import { useRouter } from 'next/navigation'
import { Download, ChevronDown, Share2, Loader2, Play, Info, Users, Check } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import useAuth from '@/lib/useAuth'
import { saveHistory } from '@/lib/useBookmark'
import BackButton from '@/components/ui/BackButton'
import { fetchJson } from '@/lib/fetchJson'
import { API } from '@/lib/constants'
import type { EpisodeDetail } from '@/lib/types'
import {
  createWatchPartyRoom,
  updateRoomEpisode,
  getUserRooms,
} from '@/lib/watchparty'
import type { WatchPartyRoom } from '@/lib/types'
import LoginModal from '@/components/LoginModal'
import { useAuthActions } from '@/lib/useAuthActions'
import Swal from 'sweetalert2'

const Skeleton = () => (
  <div className="animate-pulse space-y-4 max-w-7xl mx-auto">
    <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
      <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-xl" />
    </div>
  </div>
)

export default function WatchClientPage({ slug, episode: episodeSlug }: { slug: string; episode: string }) {
  const router = useRouter()
  const { user } = useAuth()
  const { busy: authBusy, loginWith } = useAuthActions(user)

  const [episodeData, setEpisodeData] = useState<EpisodeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedQuality, setSelectedQuality] = useState('')
  const [iframeSrc, setIframeSrc] = useState<string | null>(null)
  const [iframeLoading, setIframeLoading] = useState(false)
  const [iframeError, setIframeError] = useState<string | null>(null)
  const [poster, setPoster] = useState('')
  const [animeTitle, setAnimeTitle] = useState('')

  // Watch Party state
  const [partyLoading, setPartyLoading] = useState(false)
  const [activeRoom, setActiveRoom] = useState<WatchPartyRoom | null>(null)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [partyCopied, setPartyCopied] = useState(false)
  const iframeSrcRef = useRef<string | null>(null)

  // Keep ref in sync for watch party
  useEffect(() => { iframeSrcRef.current = iframeSrc }, [iframeSrc])

  // Load episode
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchJson<{ result: EpisodeDetail }>(API.otakudesu.episode(episodeSlug))
        if (!data?.result) { setError('Episode not found'); return }
        setEpisodeData(data.result)

        fetch(API.otakudesu.detail(slug))
          .then((r) => r.json())
          .then((j) => {
            if (j?.result?.poster) setPoster(j.result.poster)
            if (j?.result?.title) setAnimeTitle(j.result.title)
          })
          .catch(() => {})

        if (data.result.stream_url) {
          setIframeSrc(data.result.stream_url)
          setSelectedQuality('Default')
        } else {
          const mirror = data.result.mirror ?? {}
          const quality = Object.keys(mirror).find((q) => mirror[q]?.length > 0)
          if (quality) {
            setSelectedQuality(quality)
            loadMirror(mirror[quality][0].content)
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load episode')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [episodeSlug, slug])

  // Save history
  useEffect(() => {
    if (!episodeData || !user) return
    saveHistory(user.uid, {
      slug,
      title: episodeData.title,
      poster,
      lastEpisodeName: episodeData.title,
      lastEpisodeSlug: episodeSlug,
    }).catch(() => {})
  }, [episodeData, user, slug, episodeSlug, poster])

  // Check if user has an active room for this anime
  useEffect(() => {
    if (!user) { setActiveRoom(null); return }
    getUserRooms(user.uid)
      .then((rooms) => {
        const found = rooms.find((r) => r.animeSlug === slug && r.hostId === user.uid)
        setActiveRoom(found ?? null)
      })
      .catch(() => {})
  }, [user, slug])

  // If user is host and navigates to a new episode, update the room
  useEffect(() => {
    if (!activeRoom || !episodeData || !user) return
    if (activeRoom.hostId !== user.uid) return
    if (activeRoom.episodeSlug === episodeSlug) return
    // Episode changed — update room and reset timer
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
      const doc = new DOMParser().parseFromString(iframeData?.result ?? '', 'text/html')
      const iframe = doc.querySelector('iframe')
      if (iframe?.src) setIframeSrc(iframe.src)
      else throw new Error('Player could not be loaded')
    } catch (err: unknown) {
      setIframeError(err instanceof Error ? err.message : 'Failed to load player')
    } finally {
      setIframeLoading(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) await navigator.share({ title: episodeData?.title, url })
    else {
      await navigator.clipboard.writeText(url)
      Swal.fire({ icon: 'success', title: 'Link copied', timer: 1000, showConfirmButton: false })
    }
  }

  // Create or open watch party room
  const handleWatchParty = async () => {
    if (!user) { setLoginModalOpen(true); return }
    if (!iframeSrc) {
      Swal.fire({ icon: 'info', title: 'Video belum siap', text: 'Tunggu video dimuat terlebih dahulu.', timer: 2000, showConfirmButton: false })
      return
    }

    setPartyLoading(true)
    try {
      // If already has active room for this anime, just go there
      if (activeRoom) {
        // Update episode if changed
        if (activeRoom.episodeSlug !== episodeSlug) {
          await updateRoomEpisode(activeRoom.roomId, episodeSlug, episodeData?.title ?? '', iframeSrc)
        }
        router.push(`/watchparty/${activeRoom.roomId}`)
        return
      }

      // Create new room
      const roomId = await createWatchPartyRoom({
        hostId: user.uid,
        hostName: user.displayName ?? 'Host',
        hostAvatar: user.photoURL ?? '',
        animeSlug: slug,
        animeTitle,
        animePoster: poster,
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

  const copyRoomCode = () => {
    if (!activeRoom) return
    navigator.clipboard.writeText(activeRoom.roomId)
    setPartyCopied(true)
    setTimeout(() => setPartyCopied(false), 2000)
  }

  if (loading) return <Skeleton />

  if (error || !episodeData) return (
    <div className="text-center py-20">
      <Info className="w-10 h-10 text-red-500 mx-auto mb-3" />
      <p className="text-slate-600 dark:text-slate-400 mb-4">{error ?? 'Episode not found'}</p>
      <BackButton />
    </div>
  )

  const mirrors = episodeData.mirror ?? {}
  const downloads = episodeData.download ?? {}

  return (
    <>
      <div className="max-w-7xl mx-auto pb-10">
        <div className="mb-5">
          <BackButton href={`/anime/${slug}`} label="Back to Anime" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                />
              )}
            </div>

            {/* Info */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-3 leading-tight">
                {episodeData.title}
              </h1>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mb-5">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:text-slate-300 transition-all"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>

                {/* Watch Party button */}
                <button
                  onClick={handleWatchParty}
                  disabled={partyLoading || authBusy}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
                >
                  {partyLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                  {activeRoom ? 'Buka Room' : 'Watch Party'}
                </button>

                {/* Active room code badge */}
                {activeRoom && (
                  <button
                    onClick={copyRoomCode}
                    className="flex items-center gap-1.5 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-xs font-mono font-bold text-green-700 dark:text-green-400 hover:bg-green-100 transition-colors"
                    title="Copy room code"
                  >
                    {activeRoom.roomId}
                    {partyCopied ? <Check className="w-3 h-3" /> : null}
                  </button>
                )}
              </div>

              {/* Quality & Mirror */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-4 border border-slate-100 dark:border-slate-800">
                {Object.keys(mirrors).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Play className="w-3 h-3" /> Quality
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(mirrors).map((q) => (
                        <button
                          key={q}
                          onClick={() => setSelectedQuality(q)}
                          className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            selectedQuality === q
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedQuality && mirrors[selectedQuality]?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Mirror Server</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {mirrors[selectedQuality].map((m, i) => (
                        <button
                          key={i}
                          onClick={() => loadMirror(m.content)}
                          className="p-2.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 hover:text-indigo-600 transition-all text-center truncate"
                        >
                          {m.nama.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-slate-200 dark:border-slate-800">
                <button
                  disabled={!episodeData.has_previous_episode}
                  onClick={() => router.push(`/anime/${slug}/watch/${episodeData.previous_episode?.slug}`)}
                  className="py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-white transition-all"
                >
                  ← Previous
                </button>
                <button
                  disabled={!episodeData.has_next_episode}
                  onClick={() => router.push(`/anime/${slug}/watch/${episodeData.next_episode?.slug}`)}
                  className="py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-30 hover:bg-indigo-700 transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>

          {/* Download sidebar */}
          <div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <details className="group">
                <summary className="flex justify-between items-center px-5 py-4 cursor-pointer font-semibold text-sm text-slate-900 dark:text-white list-none">
                  Download Links
                  <ChevronDown className="w-4 h-4 text-indigo-500 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-4 pb-4 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                  {Object.entries(downloads).map(([format, links]) => (
                    <div key={format}>
                      <p className="text-[10px] font-bold uppercase text-indigo-500 mb-2">
                        {format.replace('dmp4', 'MP4')}
                      </p>
                      <div className="space-y-1">
                        {(links as Array<{ provider: string; link: string }>).map((link, i) => (
                          <a
                            key={i}
                            href={link.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2.5 text-xs bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-100 dark:border-slate-700 rounded-lg hover:text-indigo-600 hover:border-indigo-400 transition-all font-medium"
                          >
                            <span className="flex items-center gap-2">
                              <Download className="w-3 h-3 text-slate-400" />
                              {link.provider}
                            </span>
                            <span className="text-[10px] text-slate-400">DL</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
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
