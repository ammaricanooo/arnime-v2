"use client";
import ContentGrid from "@/components/ContentGrid";
import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface AnimeData {
    title: string
    slug: string
    poster: string
    rating?: string
    current_episode?: string
    release_day?: string
    total_episode?: string
    newest_release_date?: string
    source?: 'animasu'
}

export default function SearchPage() {
    const searchParams = useSearchParams()
    const query = searchParams?.get('q') || ''

    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [activeTab, setActiveTab] = useState('')
    const [animes, setAnimes] = useState<AnimeData[]>([])
    const [loading, setLoading] = useState(false)
    const [likedAnimes, setLikedAnimes] = useState<string[]>([])
    const [hasSearched, setHasSearched] = useState(false)

    // Fetch anime data from both otakudesu and animasu
    const fetchSearchResults = useCallback(async () => {
        if (!query || query.trim() === '') {
            setAnimes([])
            setHasSearched(false)
            setLoading(false)
            return
        }

        setLoading(true)
        setHasSearched(true)
        try {
            const { fetchJson } = await import('../../lib/fetchJson')
            // Otakudesu
            const otakudesuUrl = `https://api.ammaricano.my.id/api/otakudesu/search?query=${encodeURIComponent(query)}`
            let otakudesuResults: AnimeData[] = []
            try {
                const data = await fetchJson(otakudesuUrl)
                if (data && data.result && Array.isArray(data.result)) {
                    otakudesuResults = data.result
                }
            } catch (err) {
                console.error('Otakudesu search error:', err)
            }

            // Animasu
            const animasuUrl = `https://api.ammaricano.my.id/api/animasu/search?query=${encodeURIComponent(query)}`
            let animasuResults: AnimeData[] = []
            try {
                const data = await fetchJson(animasuUrl)
                if (data && data.result && Array.isArray(data.result)) {
                    animasuResults = data.result.map((item: any) => ({
                        title: item.title,
                        slug: item.slug,
                        poster: item.thumb,
                        rating: undefined,
                        current_episode: undefined,
                        release_day: undefined,
                        total_episode: item.episode,
                        newest_release_date: undefined,
                        source: 'animasu',
                    }))
                }
            } catch (err) {
                console.error('Animasu search error:', err)
            }

            // Merge results: otakudesu first, then animasu (with label)
            // Only add animasu if not already present in otakudesu (by normalized title or slug)
            const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, '')
            const otakudesuTitles = new Set(otakudesuResults.map(a => normalize(a.title)))
            const otakudesuSlugs = new Set(otakudesuResults.map(a => normalize(a.slug)))
            const filteredAnimasu = animasuResults.filter(a => {
                const t = normalize(a.title)
                const s = normalize(a.slug)
                return !otakudesuTitles.has(t) && !otakudesuSlugs.has(s)
            })
            const merged = [...otakudesuResults, ...filteredAnimasu]
            setAnimes(merged)
        } catch (error) {
            console.error('Error fetching search results:', error)
            setAnimes([])
        } finally {
            setLoading(false)
        }
    }, [query])

    // Fetch when query changes
    useEffect(() => {
        fetchSearchResults()
    }, [fetchSearchResults])

    const handleLike = (slug: string) => {
        setLikedAnimes(prev =>
            prev.includes(slug)
                ? prev.filter(s => s !== slug)
                : [...prev, slug]
        )
    }

    return (
        <>
            {/* Header Section */}
            <div className="flex flex-col items-start mb-8">
                {loading ? (
                    // SKELETON HEADER
                    <div className="animate-pulse space-y-3 w-full">
                        <div className="h-8 md:h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                        <div className="h-4 w-40 bg-slate-100 dark:bg-slate-800/50 rounded" />
                    </div>
                ) : (
                    // REAL CONTENT
                    <>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                            {query ? `Search Results for "${query}"` : 'Search Anime'}
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
                            {hasSearched && animes.length > 0
                                ? `Found ${animes.length} anime`
                                : hasSearched && animes.length === 0
                                    ? 'No results found'
                                    : 'Enter an anime title to search'}
                        </p>
                    </>
                )}
            </div>

            {/* Content Grid */}
            <ContentGrid
                animes={animes}
                onLike={handleLike}
                likedAnimes={likedAnimes}
                type="complete"
                loading={loading}
                hasMore={false}
            />

            {/* Empty State */}
            {animes.length === 0 && !loading && hasSearched && (
                <div className="flex items-center justify-center py-24">
                    <div className="text-center">
                        <img src="NotFound.png" alt="Not Found" className="w-84" />
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            No anime found for "{query}"
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-500">
                            Try searching with different keywords
                        </p>
                    </div>
                </div>
            )}

            {/* Initial State */}
            {!hasSearched && (
                <div className="flex items-center justify-center py-24">
                    <div className="text-center">
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            Use the search bar to find anime
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
