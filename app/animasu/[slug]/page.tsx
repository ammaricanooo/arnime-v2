'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Play, Download, Star, Info, Calendar, Clock, Tv, Loader2 } from 'lucide-react'
import { db } from "@/lib/firebase"
import { doc, setDoc } from "firebase/firestore"
import useAuth from "@/lib/useAuth"

export default function AnimasuDetailPage() {
    const { slug } = useParams()
    const { user } = useAuth()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeMirror, setActiveMirror] = useState<string>('')
    const [iframeLoading, setIframeLoading] = useState(false)

    // 1. Fetch Detail Data
    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await fetch(`/api/animasu/detail/${slug}`)
                const json = await res.json()
                if (json.success) {
                    setData(json.result)
                    
                    // Set mirror pertama sebagai default player
                    if (json.result.playData?.result?.mirrors?.length > 0) {
                        setActiveMirror(json.result.playData.result.mirrors[1].src)
                    }

                    // 2. Simpan ke History jika user login
                    if (user && json.result) {
                        saveToHistory(json.result)
                    }
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchDetail()
    }, [slug, user]) // Trigger ulang jika user baru login

    // Fungsi simpan history
    const saveToHistory = async (animeData: any) => {
        try {
            await setDoc(doc(db, "history", `${user?.uid}_${slug}`), {
                userId: user?.uid,
                slug: slug,
                title: animeData.title,
                poster: animeData.poster || '', // Pastikan API mengirim poster
                type: 'animasu',
                lastEpisodeName: 'Full / Batch Episode',
                lastWatched: new Date().toISOString(),
            }, { merge: true })
        } catch (err) {
            console.error("Gagal simpan history Animasu:", err)
        }
    }

    // Handle Ganti Server
    const handleServerChange = (src: string) => {
        if (src === activeMirror) return
        setIframeLoading(true)
        setActiveMirror(src)
        
        // Timeout pengaman jika iframe tidak mentrigger onLoad
        setTimeout(() => setIframeLoading(false), 2000)
    }

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading from Animasu...</p>
        </div>
    )

    if (!data) return <div className="p-20 text-center text-red-500 font-bold">Anime tidak ditemukan.</div>

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 pb-20">
            {/* Header Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Player Section */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 relative">
                        {/* Iframe Loading Overlay */}
                        {iframeLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
                                <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
                                <span className="text-[10px] font-black text-white tracking-[0.3em] uppercase">Menghubungkan Server...</span>
                            </div>
                        )}
                        
                        {activeMirror ? (
                            <iframe 
                                src={activeMirror} 
                                className="w-full h-full" 
                                allowFullScreen 
                                scrolling="no"
                                onLoad={() => setIframeLoading(false)}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500 font-bold uppercase text-xs tracking-widest">
                                Player tidak tersedia
                            </div>
                        )}
                    </div>
                    
                    {/* Mirror Selector */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Play className="w-3 h-3 text-indigo-500 fill-current" /> Pilih Server
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {data.playData?.result?.mirrors.map((m: any, i: number) => (
                                <button 
                                    key={i}
                                    onClick={() => handleServerChange(m.src)}
                                    className={`px-5 py-2.5 rounded-2xl text-[11px] font-black transition-all border ${
                                        activeMirror === m.src 
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none scale-105' 
                                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                    SERVER {i + 1} ({m.quality})
                                </button>
                            ))}
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm">Server 1 sedang mengalami masalah, silakan pilih server lain. Anime ini mengambil sumber dari Animasu dan terdapat iklan di dalam videonya, jika redirect ke halaman lain saat memutar video silakan kembali, terima kasih.</p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                            {data.title}
                        </h1>
                        <p className="text-slate-500 text-sm italic font-medium">{data.altTitle}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <InfoItem icon={<Star className="w-4 h-4 text-amber-500 fill-current" />} label="Rating" value={data.rating} />
                        <InfoItem icon={<Tv className="w-4 h-4 text-indigo-500" />} label="Tipe" value={data.type} />
                        <InfoItem icon={<Calendar className="w-4 h-4 text-emerald-500" />} label="Rilis" value={data.release} />
                        <InfoItem icon={<Clock className="w-4 h-4 text-rose-500" />} label="Durasi" value={data.duration} />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {data.genres.map((g: string) => (
                            <span key={g} className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                {g}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Synopsis */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <h2 className="text-sm font-black mb-4 flex items-center gap-2 uppercase tracking-widest text-slate-400">
                    <Info className="w-4 h-4 text-indigo-500" /> Sinopsis
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">
                    {data.synopsis}
                </p>
            </div>

            {/* Download Section (Batch) */}
            <div className="space-y-4">
                <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tighter">
                    <Download className="w-6 h-6 text-indigo-500" /> Download Area
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.download.map((dl: any, idx: number) => (
                        <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-4xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                            <span className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 px-3 py-1 rounded-lg mb-4 w-fit uppercase tracking-widest">
                                {dl.quality}
                            </span>
                            <div className="space-y-2">
                                {dl.url.map((link: string, i: number) => {
                                    let provider = "Server";
                                    try { provider = new URL(link).hostname.split('.')[0] } catch(e) {}
                                    return (
                                        <a 
                                            key={i} 
                                            href={link} 
                                            target="_blank"
                                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[11px] font-black text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-500 border border-transparent transition-all uppercase"
                                        >
                                            {provider} <Download className="w-3 h-3 opacity-30" />
                                        </a>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function InfoItem({ icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-1 opacity-50">
                {icon}
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{value || '-'}</p>
        </div>
    )
}