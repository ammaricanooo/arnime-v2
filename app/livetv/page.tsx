"use client"
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Tv, Play, Loader2, Info, Search } from 'lucide-react'

interface Channel {
  name: string
  url: string
}

export default function LiveTVPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchChannels() {
      setLoading(true)
      try {
        const res = await fetch('https://api.ammaricano.my.id/api/tools/tv')
        const data = await res.json()
        if (data.success && Array.isArray(data.result)) {
          setChannels(data.result)
        } else {
          setError('Gagal memuat daftar channel.')
        }
      } catch (err) {
        setError('Terjadi kesalahan koneksi.')
      } finally {
        setLoading(false)
      }
    }
    fetchChannels()
  }, [])

  const filteredChannels = channels.filter(ch => 
    ch.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
      <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">Memuat Channel...</p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Live TV Indonesia</h1>
          <p className="text-slate-500 text-sm">Streaming TV nasional kualitas HD gratis.</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Cari channel..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-2xl text-center border border-red-100 dark:border-red-900/30">
          <Info className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 font-bold">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredChannels.map((ch, idx) => (
            <Link 
              key={idx} 
              href={`/livetv/watch?name=${encodeURIComponent(ch.name)}`}
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all relative overflow-hidden"
            >
              <div className="bg-slate-100 dark:bg-slate-800 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Tv className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate pr-8">{ch.name}</h3>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Live Streaming</p>
              <Play className="absolute right-4 bottom-4 w-5 h-5 text-indigo-500 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}