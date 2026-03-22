'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, ChevronDown, Share2, Loader2, Play, } from 'lucide-react'
import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'

// --- Skeleton Component ---
const WatchSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
    <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-full mb-8" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-3xl shadow-2xl" />
        <div className="h-12 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
      <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
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
    [format: string]: Array<{ nama: string; link: string; provider: string }>
  }
}

export default function WatchClientPage({ slug, episode: episodeSlug }: { slug: string, episode: string }) {
  const router = useRouter()
  const [episodeData, setEpisodeData] = useState<EpisodeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedQuality, setSelectedQuality] = useState<string>('')
  const [iframeSrc, setIframeSrc] = useState<string | null>(null)
  const [iframeLoading, setIframeLoading] = useState(false)

  useEffect(() => {
    const fetchEpisode = async () => {
      setLoading(true)
      try {
        const { fetchJson } = await import('@/lib/fetchJson')
        const data = await fetchJson(`/api/episode/${encodeURIComponent(episodeSlug)}`)

        if (data?.result) {
          setEpisodeData(data.result)
          if (data.result.stream_url) {
            setIframeSrc(data.result.stream_url)
            setSelectedQuality('Default')
          } else {
            const mirrorData = data.result.mirror || {}
            const qualities = Object.keys(mirrorData)
            const availableQuality = qualities[0]
            if (availableQuality) {
              setSelectedQuality(availableQuality)
              handleMirrorClick(mirrorData[availableQuality][0].content)
            }
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchEpisode()
  }, [episodeSlug])

  const handleMirrorClick = async (mirrorContent: string) => {
    setIframeSrc(null)
    setIframeLoading(true)
    try {
      const { fetchJson } = await import('@/lib/fetchJson')
      const nonceRes = await fetchJson('/api/nonce')
      const nonce = nonceRes?.result
      if (!nonce) throw new Error()

      const iframeRes = await fetchJson(
        `/api/getiframe?content=${encodeURIComponent(mirrorContent)}&nonce=${encodeURIComponent(nonce)}`
      )
      const parser = new DOMParser()
      const doc = parser.parseFromString(iframeRes?.result || '', 'text/html')
      const iframe = doc.querySelector('iframe')
      if (iframe?.src) setIframeSrc(iframe.src)
    } catch (err) {
      console.error(err)
    } finally {
      setIframeLoading(false)
    }
  }

  if (loading) return <WatchSkeleton />
  if (!episodeData) return null

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 pb-20">
      {/* Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => router.push(`/anime/${slug}`)}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-black transition-all group text-xs uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Detail
        </button>
        
        <button onClick={() => {
          navigator.clipboard.writeText(window.location.href)
          Swal.fire({ icon: 'success', title: 'Link copied', timer: 800, showConfirmButton: false })
        }} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all text-slate-600 dark:text-slate-400">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (Player & Server) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Video Player */}
          <div className="relative aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            {iframeLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
                <span className="text-[10px] font-black text-white tracking-[0.3em] uppercase animate-pulse">Memuat Video</span>
              </div>
            )}
            <iframe
              src={iframeSrc || 'about:blank'}
              allowFullScreen
              className="w-full h-full"
              title="Anime Player"
            />
          </div>

          {/* Title Section */}
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {episodeData.title}
            </h1>
          </div>

          {/* Quality & Mirror Selection (Consistent with Animasu) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            {/* Quality Selector */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Play className="w-3 h-3 text-indigo-500" /> Pilih Kualitas
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(episodeData.mirror || {}).map((q) => (
                  <button
                    key={q}
                    onClick={() => setSelectedQuality(q)}
                    className={`px-6 py-2.5 rounded-2xl text-[11px] font-black transition-all border ${
                      selectedQuality === q 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none scale-105' 
                        : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Mirror Selector */}
            <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilih Server Mirror</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {episodeData.mirror?.[selectedQuality]?.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => handleMirrorClick(m.content)}
                    className="p-3.5 text-[10px] font-black bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-indigo-500 hover:text-indigo-600 transition-all text-center truncate shadow-sm uppercase tracking-tighter"
                  >
                    Server {m.nama}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex gap-4">
            <button
              disabled={!episodeData.has_previous_episode}
              onClick={() => router.push(`/anime/${slug}/watch/${episodeData.previous_episode?.slug}`)}
              className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-700 font-black transition-all text-xs tracking-[0.2em] uppercase"
            >
              PREV
            </button>
            <button
              disabled={!episodeData.has_next_episode}
              onClick={() => router.push(`/anime/${slug}/watch/${episodeData.next_episode?.slug}`)}
              className="flex-2 py-4 rounded-2xl bg-indigo-600 text-white disabled:opacity-30 hover:bg-indigo-700 font-black shadow-xl shadow-indigo-200 dark:shadow-none transition-all text-xs tracking-[0.2em] uppercase"
            >
              NEXT EPISODE
            </button>
          </div>
        </div>

        {/* Sidebar - Downloads */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
              <h3 className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-800 dark:text-white">
                <Download className="w-4 h-4 text-indigo-500" /> Download Area
              </h3>
            </div>

            <div className="p-4 space-y-6 max-h-150 overflow-y-auto custom-scrollbar">
              {Object.entries(episodeData.download || {}).map(([format, links]) => (
                <div key={format} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      {format.replace('dmp4', 'MP4')}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {(links as any[]).map((link, idx) => (
                      <a
                        key={idx}
                        href={link.link}
                        target="_blank"
                        className="group flex items-center justify-between p-4 text-[11px] bg-slate-50 dark:bg-slate-950/50 border border-transparent hover:border-indigo-500/30 rounded-2xl transition-all font-black"
                      >
                        <span className="text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 transition-colors truncate">
                          {link.provider.toUpperCase()}
                        </span>
                        <Download className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500" />
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
  )
}