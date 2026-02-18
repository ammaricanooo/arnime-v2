'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, ChevronRight, Info } from 'lucide-react'

interface ScheduleAnime {
    judul: string
    slug: string
}

interface ScheduleDay {
    hari: string
    anime: ScheduleAnime[]
}

// --- Skeleton Component ---
const ScheduleSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
            <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-5 w-48 bg-slate-100 dark:bg-slate-800/50 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="h-12 bg-slate-200 dark:bg-slate-800" />
                    <div className="p-4 space-y-3">
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-5/6" />
                    </div>
                </div>
            ))}
        </div>
    </div>
)

export default function SchedulePage() {
    const router = useRouter()
    const [schedule, setSchedule] = useState<ScheduleDay[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchSchedule = async () => {
            setLoading(true)
            setError(null)
            try {
                const { fetchJson } = await import('@/lib/fetchJson')
                const data = await fetchJson('https://api.ammaricano.my.id/api/otakudesu/schedule')

                if (data && data.result && Array.isArray(data.result)) {
                    setSchedule(data.result)
                } else {
                    setError('Unable to load schedule')
                }
            } catch (err: any) {
                setError(err?.message || 'Failed to load schedule')
            } finally {
                setLoading(false)
            }
        }
        fetchSchedule()
    }, [])

    if (loading) return <ScheduleSkeleton />

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="bg-red-50 dark:bg-red-950/20 p-8 rounded-3xl">
                    <Info className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{error}</h2>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-6 py-2 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-all"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="relative">
                <div className="absolute -left-4 top-0 w-1 h-full bg-indigo-600 rounded-full hidden md:block" />
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    Jadwal Rilis
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Pantau update anime favoritmu setiap harinya
                </p>
            </div>

            {schedule.length === 0 ? (
                <div className="py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-slate-500 font-bold uppercase tracking-widest">Data Kosong</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {schedule.map((day, idx) => (
                        <div
                            key={idx}
                            className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden"
                        >
                            {/* Header Hari */}
                            <div className="flex items-center gap-3 px-5 py-4 bg-indigo-600 dark:bg-indigo-700">
                                <Calendar className="w-5 h-5 text-indigo-100" />
                                <h2 className="text-lg font-black text-white uppercase tracking-wider">{day.hari}</h2>
                            </div>

                            {/* List Anime */}
                            <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-800">
                                {day.anime.length === 0 ? (
                                    <div className="px-6 py-8 text-center">
                                        <p className="text-sm text-slate-400 italic">Tidak ada jadwal</p>
                                    </div>
                                ) : (
                                    day.anime.map((anime, animeIdx) => (
                                        <button
                                            key={animeIdx}
                                            onClick={() => router.push(`/anime/${anime.slug}`)}
                                            className="w-full px-5 py-4 text-left flex items-center justify-between group hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all"
                                        >
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                                                {anime.judul}
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all shrink-0" />
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}