"use client"
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { ArrowLeft, Share2, Tv, Loader2, AlertCircle, WifiOff } from 'lucide-react'
import Swal from 'sweetalert2'

interface Channel {
  name: string
  url: string
  referer?: string
  origin?: string
}

// Check if a URL is HTTP (not HTTPS) — blocked by browsers on HTTPS sites
function isInsecureUrl(url: string): boolean {
  return url.startsWith('http://')
}

export default function LiveTVWatchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const name = searchParams?.get('name') || 'Live TV'

  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)

  const [channel, setChannel] = useState<Channel | null>(null)
  const [loading, setLoading] = useState(true)
  const [playerLoading, setPlayerLoading] = useState(true)
  const [error, setError] = useState<'not_found' | 'stream_error' | 'mixed_content' | null>(null)

  // ── Fetch channel info ──────────────────────────────────────────────────────

  useEffect(() => {
    fetch('https://api.ammaricano.my.id/api/tools/tv')
      .then((r) => r.json())
      .then((data) => {
        const found: Channel | undefined = data.result?.find((ch: Channel) => ch.name === name)
        if (!found) { setError('not_found'); return }
        setChannel(found)
      })
      .catch(() => setError('not_found'))
      .finally(() => setLoading(false))
  }, [name])

  // ── Init HLS player ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!channel || !videoRef.current) return

    const { url, referer, origin } = channel

    // Mixed content: HTTP stream on HTTPS page — browsers always block this
    if (isInsecureUrl(url) && typeof window !== 'undefined' && window.location.protocol === 'https:') {
      setError('mixed_content')
      setPlayerLoading(false)
      return
    }

    // Destroy previous HLS instance
    hlsRef.current?.destroy()
    setPlayerLoading(true)
    setError(null)

    const video = videoRef.current

    if (Hls.isSupported()) {
      const hlsConfig: Partial<Hls['config']> = {}

      // Only set xhrSetup when referer/origin are present AND stream is HTTPS
      // Browsers refuse to set Referer/Origin headers via XHR — this is a no-op
      // in production but kept for completeness (some environments allow it)
      if ((referer || origin) && !isInsecureUrl(url)) {
        hlsConfig.xhrSetup = (xhr: XMLHttpRequest) => {
          // Note: browsers silently ignore these for security reasons on HTTPS
          // The stream must not require these headers to work in a browser context
          if (referer) {
            try { xhr.setRequestHeader('X-Referer', referer) } catch { /* ignored */ }
          }
        }
      }

      const hls = new Hls(hlsConfig)
      hlsRef.current = hls

      hls.loadSource(url)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => { /* autoplay blocked — user can press play */ })
        setPlayerLoading(false)
      })

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError('stream_error')
          setPlayerLoading(false)
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = url
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {})
        setPlayerLoading(false)
      }, { once: true })
      video.addEventListener('error', () => {
        setError('stream_error')
        setPlayerLoading(false)
      }, { once: true })
    } else {
      setError('stream_error')
      setPlayerLoading(false)
    }

    return () => {
      hlsRef.current?.destroy()
      hlsRef.current = null
    }
  }, [channel])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    Swal.fire({ icon: 'success', title: 'Link disalin!', timer: 1000, showConfirmButton: false, toast: true, position: 'top-end' })
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <button
        onClick={() => router.push('/livetv')}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all group mb-6"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="tracking-tighter">Back</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-5">

          {/* Player */}
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-video shadow-2xl ring-1 ring-white/10">

            {/* Fetching channel data */}
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10 gap-2">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                <p className="text-white text-[10px] tracking-[0.3em] font-black uppercase">Memuat Channel...</p>
              </div>
            )}

            {/* Player loading (channel found, HLS initializing) */}
            {!loading && !error && playerLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10 gap-2">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                <p className="text-white text-[10px] tracking-[0.3em] font-black uppercase">Menghubungkan Stream...</p>
              </div>
            )}

            {/* Mixed content error */}
            {error === 'mixed_content' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 p-6 text-center gap-4">
                <WifiOff className="w-12 h-12 text-amber-500" />
                <div>
                  <h3 className="text-white font-bold text-base mb-1">Channel Tidak Tersedia</h3>
                  <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
                    Channel <span className="text-white font-semibold">{name}</span> menggunakan stream HTTP
                    yang diblokir oleh browser saat mengakses situs HTTPS.
                  </p>
                  <p className="text-slate-500 text-[10px] mt-2">
                    Ini adalah batasan keamanan browser, bukan masalah pada aplikasi.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/livetv')}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Pilih Channel Lain
                </button>
              </div>
            )}

            {/* Stream error / not found */}
            {(error === 'stream_error' || error === 'not_found') && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 p-6 text-center gap-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <div>
                  <h3 className="text-white font-bold text-base mb-1">
                    {error === 'not_found' ? 'Channel Tidak Ditemukan' : 'Gagal Memutar Stream'}
                  </h3>
                  <p className="text-slate-400 text-xs">
                    {error === 'not_found'
                      ? 'Channel ini tidak tersedia.'
                      : 'Channel mungkin sedang offline atau URL tidak valid.'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Coba Lagi
                  </button>
                  <button
                    onClick={() => router.push('/livetv')}
                    className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Pilih Channel Lain
                  </button>
                </div>
              </div>
            )}

            {/* Video element — always rendered so HLS can attach */}
            <video
              ref={videoRef}
              controls
              className={`w-full h-full object-contain ${error ? 'hidden' : ''}`}
            />
          </div>

          {/* Info card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                  {name}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`flex h-2 w-2 rounded-full ${error ? 'bg-slate-400' : 'bg-red-500 animate-pulse'}`} />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {error ? 'Offline' : 'Live Now'}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-widest"
            >
              <Share2 className="w-4 h-4" /> Bagikan
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-4 border-b pb-2 dark:border-slate-800">
              Stream Info
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                <span className={`text-[10px] font-black uppercase ${error ? 'text-red-500' : 'text-green-500'}`}>
                  {error === 'mixed_content' ? 'Blocked' : error ? 'Error' : playerLoading ? 'Connecting' : 'Online'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Type</span>
                <span className="text-[10px] font-black uppercase">M3U8 / HLS</span>
              </div>
              {channel?.url && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Protocol</span>
                  <span className={`text-[10px] font-black uppercase ${isInsecureUrl(channel.url) ? 'text-amber-500' : 'text-green-500'}`}>
                    {isInsecureUrl(channel.url) ? 'HTTP (Blocked)' : 'HTTPS'}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl">
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {error === 'mixed_content'
                  ? 'Channel ini menggunakan HTTP stream yang tidak kompatibel dengan browser modern pada situs HTTPS.'
                  : 'Gunakan Chrome atau Edge untuk pengalaman terbaik. Jika stream macet, refresh halaman.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
