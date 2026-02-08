"use client"

import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Play, Heart, Share2 } from "lucide-react"
import { useState, useEffect } from "react"
// Header and Sidebar are provided by AppShell (in app/layout.tsx)

interface EpisodeItem {
    episode: string
    slug: string
}

interface DetailResult {
    poster?: string
    title?: string
    japanese?: string
    score?: string
    producer?: string
    tipe?: string
    status?: string
    total_episode?: string
    duration?: string
    release_date?: string
    studio?: string
    genre?: string
    synopsis?: string
    episodes?: EpisodeItem[]
    batch?: EpisodeItem[]
}

export default function AnimeDetailPage() {
    const router = useRouter()
    const params = useParams()
    const slug = params.slug as string

    const [detail, setDetail] = useState<DetailResult | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isLiked, setIsLiked] = useState(false)

    useEffect(() => {
        if (!slug) return
        const fetchDetail = async () => {
            setLoading(true)
            setError(null)
            try {
                const { fetchJson } = await import('../../../lib/fetchJson')
                const json = await fetchJson(`https://api.ammaricano.my.id/api/otakudesu/detail/${encodeURIComponent(slug)}`)
                if (json && json.result) {
                    setDetail(json.result)
                } else {
                    setError('Detail not found')
                }
            } catch (err: any) {
                console.error(err)
                setError(err?.message || 'Failed to load detail')
            } finally {
                setLoading(false)
            }
        }

        fetchDetail()
    }, [slug])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="loader mb-4">Loading...</div>
                </div>
            </div>
        )
    }

    if (error || !detail) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-lg font-semibold">{error || 'Anime not found'}</h2>
                    <button onClick={() => router.back()} className="mt-4 text-indigo-600">Go back</button>
                </div>
            </div>
        )
    }

    const episodes = detail.episodes || []
    const batch = detail.batch || []

    return (
        <div className="space-y-8">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium"
            >
                <ArrowLeft className="w-5 h-5" />
                Back
            </button>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                <div className="md:col-span-1">
                    <img src={detail.poster || '/placeholder.svg'} alt={detail.title} className="w-full min-w-40 rounded-lg shadow-lg object-cover aspect-3/4" />
                    <div className="flex gap-3 mt-4">
                        <button onClick={() => setIsLiked(!isLiked)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium">
                            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <div>
                        <div className="flex flex-col">
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">{detail.title}</h1>
                            <h2 className="text-lg md:text-xl font-medium text-slate-400 dark:text-slate-600 mb-2">{detail.japanese}</h2>
                        </div>
                        <div className="flex flex-wrap gap-4 items-center text-slate-600 dark:text-slate-400">
                            {detail.score && <div className="flex items-center gap-1"><span className="text-indigo-500 font-bold">{detail.score}</span><span>Score</span></div>}
                            {detail.total_episode && <div className="flex items-center gap-1"><span className="font-bold">{detail.total_episode}</span><span>Episodes</span></div>}
                            {detail.genre && <span className="capitalize px-3 py-1 bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium truncate">{detail.genre}</span>}
                            {detail.status && <span className="capitalize px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-full text-sm font-medium">{detail.status}</span>}
                        </div>
                        <span className="bg-slate-200 w-full h-0.5 block mt-4"></span>
                    </div>
                    <div className="hidden md:block">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Synopsis</h2>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                {detail.synopsis || 'No synopsis available.'}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-slate-500 dark:text-slate-400">Studio</span>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">{detail.studio || '-'}</p>
                            </div>
                            <div>
                                <span className="text-sm text-slate-500 dark:text-slate-400">Release Date</span>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">{detail.release_date || '-'}</p>
                            </div>
                            <div>
                                <span className="text-sm text-slate-500 dark:text-slate-400">Type</span>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">{detail.tipe || '-'}</p>
                            </div>
                            <div>
                                <span className="text-sm text-slate-500 dark:text-slate-400">Duration</span>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">{detail.duration || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="block md:hidden">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Synopsis</h2>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                {detail.synopsis || 'No synopsis available.'}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-slate-500 dark:text-slate-400">Studio</span>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">{detail.studio || '-'}</p>
                            </div>
                            <div>
                                <span className="text-sm text-slate-500 dark:text-slate-400">Release Date</span>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">{detail.release_date || '-'}</p>
                            </div>
                            <div>
                                <span className="text-sm text-slate-500 dark:text-slate-400">Type</span>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">{detail.tipe || '-'}</p>
                            </div>
                            <div>
                                <span className="text-sm text-slate-500 dark:text-slate-400">Duration</span>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">{detail.duration || '-'}</p>
                            </div>
                        </div>
                    </div>

            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Episodes</h2>
                <div className="grid grid-cols-1 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg gap-4">
                    {episodes.map((ep) => (
                        <button
                            key={ep.slug}
                            onClick={() => router.push(`/anime/${encodeURIComponent(slug)}/watch/${encodeURIComponent(ep.slug)}`)}
                            className="group relative rounded-lg overflow-hidden bg-white dark:bg-slate-800 hover:bg-indigo-200 dark:hover:bg-indigo-300 transition-all text-left"
                        >
                            <div className="p-3 space-y-2">
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm line-clamp-2">{ep.episode}</h3>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Batch</h2>
                <div className="grid grid-cols-1 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg gap-4">
                    {batch?.length > 0 ? (
                        batch.map((ep) => (
                            <button
                                key={ep.slug}
                                onClick={() =>
                                    router.push(
                                        `/anime/${encodeURIComponent(slug)}/watch/${encodeURIComponent(ep.slug)}`
                                    )
                                }
                                className="group relative rounded-lg overflow-hidden bg-white dark:bg-slate-800 hover:bg-indigo-200 dark:hover:bg-indigo-300 transition-all text-left"
                            >
                                <div className="p-3 space-y-2">
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm line-clamp-2">
                                        {ep.episode}
                                    </h3>
                                </div>
                            </button>
                        ))
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-sm">No batch episodes available</p>
                    )}
                </div>
            </div>
        </div>
    )
}
