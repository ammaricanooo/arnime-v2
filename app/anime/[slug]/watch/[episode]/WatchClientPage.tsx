'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, ChevronDown, Share2, Loader2, Play, Info } from 'lucide-react'
import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'

// --- Skeleton Component untuk Halaman Nonton ---
const WatchSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 py-6 animate-pulse">
    <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg mb-6" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        {/* Video Player Skeleton */}
        <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-xl shadow-lg" />
        {/* Title & Info Skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-100 dark:border-slate-800 space-y-4">
          <div className="h-10 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-10 w-24 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          <div className="space-y-4 pt-4">
            <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />)}
            </div>
          </div>
        </div>
      </div>
      {/* Sidebar Skeleton */}
      <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-xl" />
    </div>
  </div>
)

interface EpisodeDetail {
  title?: string
  has_next_episode?: boolean
  next_episode?: { slug: string }
  has_previous_episode?: boolean
  previous_episode?: { slug: string }
  stream_url?: string
  mirror?: {
    [quality: string]: Array<{ nama: string; content: string }>
  }
  download?: {
    [format: string]: Array<{ nama: string; href: string }>
  }
}

interface WatchProps {
  slug: string
  episode: string
}

export default function WatchClientPage({ slug, episode: episodeSlug }: WatchProps) {
  const router = useRouter()
  const [episodeData, setEpisodeData] = useState<EpisodeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedQuality, setSelectedQuality] = useState<string>('')
  const [iframeSrc, setIframeSrc] = useState<string | null>(null)
  const [iframeLoading, setIframeLoading] = useState(false)
  const [iframeError, setIframeError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEpisode = async () => {
      setLoading(true)
      setError(null)
      try {
        const { fetchJson } = await import('@/lib/fetchJson')
        const data = await fetchJson(`https://api.ammaricano.my.id/api/otakudesu/episode/${encodeURIComponent(episodeSlug)}`)

        if (data?.result) {
          setEpisodeData(data.result)

          // PRIORITAS 1: Gunakan stream_url bawaan jika ada
          if (data.result.stream_url) {
            setIframeSrc(data.result.stream_url)
            setSelectedQuality('Default') // Label untuk server utama
          }
          // PRIORITAS 2: Jika stream_url tidak ada, cari mirror yang tersedia
          else {
            const mirrorData = data.result.mirror || {}
            const qualities = Object.keys(mirrorData)
            const availableQuality = qualities.find(q => mirrorData[q] && mirrorData[q].length > 0)

            if (availableQuality) {
              setSelectedQuality(availableQuality)
              handleMirrorClick(mirrorData[availableQuality][0].content)
            }
          }
        } else {
          setError('Episode tidak ditemukan')
        }
      } catch (err: any) {
        setError(err?.message || 'Gagal memuat episode')
      } finally {
        setLoading(false)
      }
    }
    fetchEpisode()
  }, [episodeSlug])

  const handleMirrorClick = async (mirrorContent: string) => {
    // Jika diklik server mirror, kita hapus dulu src yang lama
    setIframeSrc(null)
    setIframeLoading(true)
    setIframeError(null)
    try {
      const { fetchJson } = await import('@/lib/fetchJson')
      const nonceRes = await fetchJson('https://api.ammaricano.my.id/api/otakudesu/nonce')
      const nonce = nonceRes?.result
      if (!nonce) throw new Error('Gagal mendapatkan token keamanan')

      const iframeRes = await fetchJson(
        `https://api.ammaricano.my.id/api/otakudesu/getiframe?content=${encodeURIComponent(mirrorContent)}&nonce=${encodeURIComponent(nonce)}`
      )

      const parser = new DOMParser()
      const doc = parser.parseFromString(iframeRes?.result || '', 'text/html')
      const iframe = doc.querySelector('iframe')

      if (iframe?.src) setIframeSrc(iframe.src)
      else throw new Error('Player tidak dapat dimuat')
    } catch (err: any) {
      setIframeError(err.message)
    } finally {
      setIframeLoading(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: episodeData?.title, url })
    } else {
      await navigator.clipboard.writeText(url)
      Swal.fire({ icon: 'success', title: 'Link copied', timer: 1000, showConfirmButton: false })
    }
  }

  const toggleAccordion = (id: string) => {
    const content = document.getElementById(id)
    content?.classList.toggle('max-h-0')
    content?.classList.toggle('max-h-[1000px]')
  }

  if (loading) return <WatchSkeleton />

  if (error || !episodeData) return (
    <div className="text-center py-24 px-4">
      <div className="bg-red-50 dark:bg-red-950/20 text-red-600 p-6 rounded-2xl inline-block max-w-md">
        <Info className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">{error || 'Episode Not Found'}</h2>
        <p className="mb-6 opacity-80 text-sm">Gagal mengambil data dari server. Silakan coba beberapa saat lagi.</p>
        <button onClick={() => router.back()} className="bg-red-600 text-white px-6 py-2 rounded-full font-semibold">Kembali</button>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <button
        onClick={() => router.push(`/anime/${slug}`)}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all group mb-8"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="uppercase italic tracking-tighter">Back to Detail Anime</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Video Section */}
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-video shadow-2xl ring-1 ring-white/10">
            {iframeLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-10 gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                <p className="text-white text-xs font-medium tracking-widest animate-pulse">MEMUAT VIDEO...</p>
              </div>
            )}
            {iframeError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center bg-slate-900">
                <p className="mb-4 text-red-400 font-medium">{iframeError}</p>
                <button onClick={() => window.location.reload()} className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded-full text-sm font-bold transition-all">Refresh Player</button>
              </div>
            ) : (
              <iframe
                src={iframeSrc || 'about:blank'}
                allowFullScreen
                className="w-full h-full border-none"
                title="Anime Player"
              />
            )}
          </div>

          {/* Info Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h1 className="text-2xl md:text-3xl font-extrabold mb-4 leading-tight text-slate-900 dark:text-white">
              {episodeData.title}
            </h1>

            <div className="flex gap-2 mb-8">
              <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all">
                <Share2 className="w-4 h-4" /> Bagikan
              </button>
            </div>

            {/* Quality & Mirror Selection */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-5 border border-slate-100 dark:border-slate-800">
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Play className="w-4 h-4" /> Pilih Kualitas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(episodeData.mirror || {}).map((q) => (
                    <button
                      key={q}
                      onClick={() => setSelectedQuality(q)}
                      className={`px-5 py-2 rounded-full text-xs font-black transition-all border ${selectedQuality === q ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Pilih Server Mirror</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {episodeData.mirror?.[selectedQuality]?.map((m, i) => (
                    <button
                      key={i}
                      onClick={() => handleMirrorClick(m.content)}
                      className="p-3 text-[11px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 hover:text-indigo-600 transition-all text-center truncate shadow-sm"
                    >
                      SERVER {m.nama.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Navigasi Next/Prev */}
            <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t dark:border-slate-800">
              <button
                disabled={!episodeData.has_previous_episode}
                onClick={() => router.push(`/anime/${slug}/watch/${episodeData.previous_episode?.slug}`)}
                className="flex items-center justify-center p-4 rounded-2xl border border-slate-200 dark:border-slate-700 disabled:opacity-20 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-all text-sm tracking-widest"
              >
                PREVIOUS
              </button>
              <button
                disabled={!episodeData.has_next_episode}
                onClick={() => router.push(`/anime/${slug}/watch/${episodeData.next_episode?.slug}`)}
                className="flex items-center justify-center p-4 rounded-2xl bg-indigo-600 text-white disabled:opacity-20 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100 dark:shadow-none transition-all text-sm tracking-widest"
              >
                NEXT EPISODE
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Download */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-2 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleAccordion('download-area')}
              className="flex justify-between items-center w-full p-4 font-black text-sm uppercase tracking-tighter"
            >
              Download Links <ChevronDown className="w-5 h-5 text-indigo-500" />
            </button>

            <div id="download-area" className="max-h-0 overflow-hidden transition-all duration-500 ease-in-out bg-slate-50 dark:bg-slate-950/50 rounded-xl">
              <div className="p-4 space-y-6">
                {Object.entries(episodeData.download || {}).map(([format, links]) => (
                  <div key={format} className="space-y-3">
                    <p className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded inline-block">{format.replace('dmp4', 'MP4')}</p>
                    <div className="grid grid-cols-1 gap-1">
                      {(links as any[]).map((link, idx) => (
                        <a
                          key={idx}
                          href={link.link}
                          target="_blank"
                          className="flex items-center justify-between p-3 text-xs bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:text-indigo-600 hover:border-indigo-500 transition-all font-semibold"
                        >
                          <span className="flex items-center gap-2"><Download className="w-3 h-3 text-slate-400" /> {link.provider}</span>
                          <span className="text-[10px] opacity-50 uppercase">DL</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}