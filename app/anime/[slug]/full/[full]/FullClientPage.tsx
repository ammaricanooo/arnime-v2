'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, Share2, Info, Box } from 'lucide-react'
import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'

// Interface khusus untuk tipe "Lengkap" sesuai JSON kamu
interface DownloadItem {
  provider: string
  link: string
}

interface LengkapItem {
  title: string
  resolution: string
  downloads: DownloadItem[]
}

interface LengkapDetail {
  title: string
  lengkap: LengkapItem[]
}

export default function FullClientPage({ slug, full }: { slug: string; full: string }) {
  const router = useRouter()
  const [data, setData] = useState<LengkapDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFullData = async () => {
      setLoading(true)
      try {
        const { fetchJson } = await import('@/lib/fetchJson')
        const res = await fetchJson(`https://api.ammaricano.my.id/api/otakudesu/lengkap/${encodeURIComponent(full)}`)

        if (res?.result && res?.result.lengkap) {
          setData(res.result)
        } else {
          setError('Data lengkap tidak ditemukan')
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat data')
      } finally {
        setLoading(false)
      }
    }
    fetchFullData()
  }, [full])

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: data?.title, url })
    } else {
      await navigator.clipboard.writeText(url)
      Swal.fire({ icon: 'success', title: 'Link copied', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false })
    }
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-12 text-center">
      <div className="inline-block animate-spin mb-4"><Box className="w-8 h-8 text-indigo-600" /></div>
      <p className="font-black italic text-slate-400 uppercase tracking-widest">Loading...</p>
    </div>
  )

  if (error || !data) return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <Info className="w-12 h-12 mx-auto text-red-500 mb-4" />
      <h2 className="text-xl font-black uppercase italic mb-2">Data Kosong</h2>
      <p className="text-slate-500 mb-8">{error}</p>
      <button onClick={() => router.push(`/anime/${slug}`)} className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold">Kembali</button>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Tombol Back & Share */}
      <button
        onClick={() => router.push(`/anime/${slug}`)}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all group mb-8"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="uppercase italic tracking-tighter">Back to Detail Anime</span>
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-[40px] p-6 md:p-12 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
        {/* Badge */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 w-fit px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
            <Download className="w-3 h-3" /> Complete Episode List
          </div>
          <div className="flex gap-2">
            <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all">
              <Share2 className="w-4 h-4" /> Bagikan
            </button>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-black mb-12 leading-tight italic uppercase tracking-tighter text-slate-900 dark:text-white">
          {data.title}
        </h1>

        <div className="space-y-12">
          {data.lengkap.map((item, i) => (
            <div key={i} className="relative">
              {/* Judul Episode & Resolusi */}
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase italic">
                  {item.title}
                </h3>
                <div className="hidden md:block h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                <span className="w-fit bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-lg italic shadow-lg shadow-indigo-100 dark:shadow-none uppercase">
                  Res: {item.resolution}
                </span>
              </div>

              {/* Grid Link Download */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {item.downloads.map((dl, idx) => (
                  <a
                    key={idx}
                    href={dl.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 text-[11px] font-bold bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-[20px] hover:border-indigo-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 transition-all text-center truncate shadow-sm group/link"
                  >
                    <span className="uppercase tracking-tight">{dl.provider}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}