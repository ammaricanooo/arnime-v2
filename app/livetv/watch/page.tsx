"use client"
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { ArrowLeft, Share2, Info, Tv, Loader2, AlertCircle } from 'lucide-react'
import Swal from 'sweetalert2'

export default function LiveTVWatchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const name = searchParams?.get('name') || 'Live TV'

  const videoRef = useRef<HTMLVideoElement>(null)
  const [streamUrl, setStreamUrl] = useState<string>('')
  const [referer, setReferer] = useState<string>('')
  const [origin, setOrigin] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function getUrl() {
      try {
        const res = await fetch('https://api.ammaricano.my.id/api/tools/tv')
        const data = await res.json()
        // Cari channel yang namanya cocok dengan parameter 'name'
        const found = data.result.find((ch: any) => ch.name === name)
        if (found) {
          setStreamUrl(found.url)
          setReferer(found.referer || '')
          setOrigin(found.origin || '')
        } else setError(true)
      } catch {
        setError(true)
      }
    }
    getUrl()
  }, [name])

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return

    const video = videoRef.current
    let hls: Hls

    if (Hls.isSupported()) {
      hls = new Hls({
        xhrSetup: function (xhr, url) {
          xhr.setRequestHeader("Referer", referer)
          xhr.setRequestHeader("Origin", origin)
        }
      })
      hls.loadSource(streamUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => console.log("Autoplay blocked"))
        setLoading(false)
      })
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) setError(true)
      })
    }
    // Untuk Safari (Native HLS support)
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl
      video.addEventListener('loadedmetadata', () => {
        video.play()
        setLoading(false)
      })
    }

    return () => {
      if (hls) hls.destroy()
    }
  }, [streamUrl])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    Swal.fire({ icon: 'success', title: 'Link disalin!', timer: 1000, showConfirmButton: false, toast: true, position: 'top-end' })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <button
        onClick={() => router.push(`/livetv`)}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all group mb-8"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="tracking-tighter">Back</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">

          {/* Player Container */}
          <div className="relative bg-black rounded-3xl overflow-hidden aspect-video shadow-2xl ring-1 ring-white/10">
            {loading && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-2" />
                <p className="text-white text-[10px] tracking-[0.3em] font-black uppercase">Menghubungkan Stream...</p>
              </div>
            )}

            {error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 p-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-white font-bold">Gagal Memutar Stream</h3>
                <p className="text-slate-400 text-xs mt-2 mb-6">Channel ini mungkin sedang offline atau URL tidak valid.</p>
                <button onClick={() => window.location.reload()} className="bg-indigo-600 text-white px-6 py-2 rounded-full text-xs font-bold">Coba Lagi</button>
              </div>
            ) : (
              <video
                ref={videoRef}
                controls
                className="w-full h-full object-contain"
                poster="/tv-placeholder.png" // Opsional: Tambahkan gambar placeholder
              />
            )}
          </div>

          {/* Player Info Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                <Tv className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {name}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Now</p>
                </div>
              </div>
            </div>

            <button onClick={handleShare} className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-widest">
              <Share2 className="w-4 h-4" /> Bagikan
            </button>
          </div>
        </div>

        {/* Sidebar Mini Info */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-4 border-b pb-2 dark:border-slate-800">Stream Info</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                <span className="text-[10px] font-black text-green-500 uppercase">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Type</span>
                <span className="text-[10px] font-black uppercase">M3U8 / HLS</span>
              </div>
            </div>
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl">
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Gunakan browser Chrome atau Edge untuk pengalaman terbaik. Jika stream macet, silakan refresh halaman.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}