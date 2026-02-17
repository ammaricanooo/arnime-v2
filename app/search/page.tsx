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

    // Fetch anime data
    const fetchSearchResults = useCallback(async () => {
        if (!query || query.trim() === '') {
            setAnimes([])
            setHasSearched(false)
            return
        }

        setLoading(true)
        setHasSearched(true)
        try {
            const url = `https://api.ammaricano.my.id/api/otakudesu/search?query=${encodeURIComponent(query)}`
            const { fetchJson } = await import('../../lib/fetchJson')
            const data = await fetchJson(url)

            if (data && data.result && Array.isArray(data.result)) {
                setAnimes(data.result)
            } else {
                setAnimes([])
            }
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
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-24">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        <p className="text-slate-600 dark:text-slate-400">Searching anime...</p>
                    </div>
                </div>
            )}

            {/* Content Grid */}
            {animes.length > 0 && !loading && (
                <ContentGrid
                    animes={animes}
                    onLike={handleLike}
                    likedAnimes={likedAnimes}
                    type="complete"
                    loading={loading}
                    hasMore={false}
                />
            )}

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
