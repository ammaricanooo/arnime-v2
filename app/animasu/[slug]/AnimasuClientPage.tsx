'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Share2, Loader2, Play, Info, Star, Clock, Tv, Calendar, Film } from 'lucide-react'
import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'

// --- Skeleton Loader ---
const WatchSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 py-6 animate-pulse">
    <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg mb-6" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-2xl shadow-lg" />
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 space-y-4">
          <div className="h-10 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />)}
          </div>
        </div>
      </div>
      <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
    </div>
  </div>
)

interface Mirror {
  quality: string;
  src: string;
}

interface AnimasuDetail {
  title: string;
  altTitle: string;
  synopsis: string;
  genres: string[];
  status: string;
  release: string;
  type: string;
  duration: string;
  studio: string;
  rating: string;
  playData: {
    result: {
      mirrors: Mirror[];
      animeName: string;
    }
  }
}

interface Props {
  slug: string;
}

export default function AnimasuClientPage({ slug }: Props) {
  const router = useRouter()
  const [data, setData] = useState<AnimasuDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeMirror, setActiveMirror] = useState<string>('')
  const [iframeLoading, setIframeLoading] = useState(false)

  useEffect(() => {
    const fetchEpisode = async () => {
      setLoading(true)
      try {
        const res = await fetch(`https://api.ammaricano.my.id/api/animasu/detail/${encodeURIComponent(slug)}`)
        const json = await res.json()

        if (json?.success && json?.result) {
          setData(json.result)
          // Set default mirror pertama
          if (json.result.playData?.result?.mirrors?.length > 0) {
            setActiveMirror(json.result.playData.result.mirrors[0].src)
          }
        } else {
          setError("Episode tidak ditemukan atau server sedang sibuk.")
        }
      } catch (err) {
        setError("Gagal mengambil data dari API.")
      } finally {
        setLoading(false)
      }
    }
    fetchEpisode()
  }, [slug])

  const handleMirrorChange = (src: string) => {
    if (src === activeMirror) return
    setIframeLoading(true)
    setActiveMirror(src)
  }

  const handleShare = async () => {
    try {
      await navigator.share({ title: data?.title, url: window.location.href })
    } catch {
      navigator.clipboard.writeText(window.location.href)
      Swal.fire({ icon: 'success', title: 'Link copied!', timer: 1000, showConfirmButton: false, toast: true, position: 'top-end' })
    }
  }

  if (loading) return <WatchSkeleton />
  if (error || !data) return (
    <div className="text-center py-24 px-4">
      <div className="bg-red-50 dark:bg-red-950/20 text-red-600 p-8 rounded-3xl inline-block max-w-md border border-red-100 dark:border-red-900/30">
        <Info className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">{error || 'Error'}</h2>
        <button onClick={() => router.back()} className="mt-4 bg-red-600 text-white px-6 py-2 rounded-full font-bold shadow-lg">Kembali</button>
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
        <span className="tracking-tighter">Kembali Ke Halaman Detail Anime</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Video Player Section */}
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-video shadow-2xl ring-1 ring-white/10">
            {iframeLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 z-10">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-2" />
                <p className="text-white text-[10px] tracking-widest uppercase font-bold animate-pulse">Switching Server...</p>
              </div>
            )}
            <iframe
              src={activeMirror}
              allowFullScreen
              className="w-full h-full border-none"
              onLoad={() => setIframeLoading(false)}
            />
          </div>

          {/* Info Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight mb-2">
              {data.title}
            </h1>

            <div className="flex gap-2 mb-8">
              <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all">
                <Share2 className="w-4 h-4" /> Bagikan
              </button>
            </div>

            {/* Mirror/Server Selection */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                <Play className="w-3 h-3 fill-current" /> Pilih Server & Kualitas
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.playData.result.mirrors.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => handleMirrorChange(m.src)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border shadow-sm ${
                      activeMirror === m.src 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-200 dark:shadow-none' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 hover:border-indigo-400'
                    }`}
                  >
                    {m.quality}
                  </button>
                ))}
              </div>
            </div>

            {/* Sinopsis */}
            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Film className="w-4 h-4 text-indigo-500" /> Sinopsis
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {data.synopsis}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Info Detail */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="font-black text-xs uppercase tracking-widest mb-6 text-indigo-500 border-b pb-4 dark:border-slate-800">Informasi Detail</h2>
            
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-2 uppercase font-bold"><Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /> Score</span>
                <span className="text-sm font-black">{data.rating}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-2 uppercase font-bold"><Clock className="w-3.5 h-3.5" /> Durasi</span>
                <span className="text-sm font-black">{data.duration}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-2 uppercase font-bold"><Tv className="w-3.5 h-3.5" /> Studio</span>
                <span className="text-sm font-black">{data.studio}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-2 uppercase font-bold"><Calendar className="w-3.5 h-3.5" /> Rilis</span>
                <span className="text-sm font-black">{data.release}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-2 uppercase font-bold"><Info className="w-3.5 h-3.5 text-green-500" /> Status</span>
                <span className="text-xs font-black px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 rounded uppercase">{data.status}</span>
              </div>
            </div>

            <div className="mt-8">
              <span className="text-[10px] font-black uppercase text-slate-400 block mb-3 tracking-widest">Genre List</span>
              <div className="flex flex-wrap gap-1.5">
                {data.genres.map((genre, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] rounded-lg font-bold uppercase transition-colors hover:bg-indigo-500 hover:text-white">
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}