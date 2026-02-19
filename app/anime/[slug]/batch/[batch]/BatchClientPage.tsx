'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, ChevronDown, Share2, Info, Box } from 'lucide-react'
import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'

// Interface disesuaikan dengan respons API Batch kamu
interface BatchDownloadItem {
  provider: string
  link: string
}

interface BatchResolution {
  resolution: string
  downloads: BatchDownloadItem[]
}

interface BatchDetail {
  title: string
  batch: BatchResolution[]
}

interface BatchProps {
  slug: string      // slug anime
  batch: string   // slug episode
}

export default function BatchClientPage({ slug, batch: batchSlug }: BatchProps) {
  const router = useRouter()
  const [data, setData] = useState<BatchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBatch = async () => {
      setLoading(true)
      try {
        const { fetchJson } = await import('@/lib/fetchJson')
        const res = await fetchJson(`https://api.ammaricano.my.id/api/otakudesu/batch/${encodeURIComponent(batchSlug)}`)

        if (res?.result) {
          setData(res.result)
        } else {
          setError('Data batch tidak ditemukan')
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat data batch')
      } finally {
        setLoading(false)
      }
    }
    fetchBatch()
  }, [slug, batchSlug])

  const toggleAccordion = (id: string) => {
    const content = document.getElementById(id)
    content?.classList.toggle('max-h-0')
    content?.classList.toggle('max-h-[2000px]')
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: data?.title, url })
    } else {
      await navigator.clipboard.writeText(url)
      Swal.fire({ icon: 'success', title: 'Link copied', timer: 1000, showConfirmButton: false })
    }
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-12 text-center">
      <div className="inline-block animate-spin mb-4"><Box className="w-8 h-8 text-indigo-600" /></div>
      <p className="font-black italic text-slate-400 uppercase tracking-widest">Loading...</p>
    </div>
  )

  if (error || !data) return (
    <div className="text-center py-24 px-4">
      <div className="bg-red-50 dark:bg-red-950/20 text-red-600 p-8 rounded-2xl inline-block max-w-md">
        <Info className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">{error || 'Batch Not Found'}</h2>
        <button onClick={() => router.back()} className="bg-red-600 text-white px-6 py-2 rounded-full font-semibold mt-4">Kembali</button>
      </div>
    </div>
  )

  return (
    <div className="mx-auto px-4 py-6">
      <button
        onClick={() => router.push(`/anime/${slug}`)}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all group mb-8"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="uppercase italic tracking-tighter">Back to Detail Anime</span>
      </button>

      <div className="grid grid-cols-1">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 w-fit px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                <Box className="w-3 h-3" /> Batch Download
              </div>
              <div className="flex gap-2 mb-8">
                <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all">
                  <Share2 className="w-4 h-4" /> Bagikan
                </button>
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold mb-4 leading-tight text-slate-900 dark:text-white">
              {data.title}
            </h1>

            {/* List Download Utama (Grid Style) */}
            <div className="space-y-6">
              {data.batch.map((item, i) => (
                <div key={i} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-black text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
                    <Download className="w-4 h-4" /> {item.resolution}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {item.downloads.map((dl, idx) => (
                      <a
                        key={idx}
                        href={dl.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 text-[11px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 hover:text-indigo-600 transition-all text-center truncate shadow-sm"
                      >
                        {dl.provider.toUpperCase()}
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