'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface ScheduleAnime {
    judul: string
    slug: string
}

interface ScheduleDay {
    hari: string
    anime: ScheduleAnime[]
}

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
                console.error('Error fetching schedule:', err)
                setError(err?.message || 'Failed to load schedule')
            } finally {
                setLoading(false)
            }
        }

        fetchSchedule()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    <p className="text-slate-600 dark:text-slate-400">Loading schedule...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="text-center">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                        {error}
                    </h2>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-indigo-600 hover:underline font-medium"
                    >
                        Try again
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    Anime Schedule
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Check what anime is airing this week
                </p>
            </div>

            {schedule.length === 0 ? (
                <div className="flex items-center justify-center py-24">
                    <div className="text-center">
                        <p className="text-slate-600 dark:text-slate-400">No schedule data available</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {schedule.map((day, idx) => (
                        <div
                            key={idx}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
                        >
                            {/* Day Header */}
                            <div className="bg-linear-to-r from-indigo-600 to-indigo-700 dark:from-indigo-500 dark:to-indigo-600 px-6 py-4">
                                <h2 className="text-xl font-bold text-white">{day.hari}</h2>
                            </div>

                            {/* Anime List */}
                            <div className="divide-y divide-slate-200 dark:divide-slate-700">
                                {day.anime.length === 0 ? (
                                    <div className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                        No anime scheduled for this day
                                    </div>
                                ) : (
                                    day.anime.map((anime, animeIdx) => (
                                        <button
                                            key={animeIdx}
                                            onClick={() => router.push(`/anime/${anime.slug}`)}
                                            className="w-full px-6 py-4 text-left hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors group"
                                        >
                                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {anime.judul}
                                            </h3>
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
