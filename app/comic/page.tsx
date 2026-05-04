"use client"

import { useEffect, useState, useRef, useCallback } from 'react'
import { Loader2, ChevronDown } from 'lucide-react'
import ComicContentGrid from '@/components/ComicContentGrid'
import HeroSlider, { type SliderItem } from '@/components/HeroSlider'
import { db } from "@/lib/firebase"
import { doc, setDoc, deleteDoc } from "firebase/firestore"
import useAuth from '@/lib/useAuth'
import { API } from '@/lib/constants'
import type { Comic } from '@/lib/types'
import Swal from 'sweetalert2'

const GENRES = [
  { id: 'latest', label: 'Latest', api: API.komiku.latest },
  { id: 'hot', label: 'Hot', api: API.komiku.hot },
]

export default function ComicHomePage() {
  const { user } = useAuth()
  const [genre, setGenre] = useState(GENRES[0].id)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [comics, setComics] = useState<Comic[]>([])
  const [sliderItems, setSliderItems] = useState<SliderItem[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [likedComics, setLikedComics] = useState<string[]>([])
  const observerRef = useRef<HTMLDivElement>(null)

  const fetchComics = useCallback(async (reset = false, currentPage = 1) => {
    setLoading(true)
    try {
      const api = GENRES.find((g) => g.id === genre)?.api ?? API.komiku.latest
      const res = await fetch(`${api}?page=${currentPage}`)
      const json = await res.json()
      if (json.success && Array.isArray(json.result)) {
        const results: Comic[] = json.result
        if (reset) {
          setComics(results)
          // Build slider from first page
          const shuffled = [...results].sort(() => Math.random() - 0.5)
          const picks = shuffled.slice(0, 6).map<SliderItem>((c) => ({
            slug: c.link.split('/').filter(Boolean).pop() ?? '',
            title: c.title,
            poster: c.image || c.thumb || '/placeholder.svg',
            badge: c.latest_chapter ?? c.type,
            badgeColor: c.latest_chapter ? 'bg-amber-500' : 'bg-indigo-600',
            subtitle: c.genre,
            type: 'comic',
          }))
          setSliderItems(picks)
        } else {
          setComics((prev) => [...prev, ...results])
        }
        setHasMore(results.length > 0)
      } else {
        setHasMore(false)
      }
    } catch {
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [genre])

  useEffect(() => {
    setPage(1)
    setComics([])
    setHasMore(true)
    fetchComics(true, 1)
  }, [genre])

  useEffect(() => {
    if (page === 1) return
    fetchComics(false, page)
  }, [page])

  useEffect(() => {
    const el = observerRef.current
    if (!el || !hasMore || loading) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setPage((p) => p + 1) },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading])

  const handleLike = async (slug: string) => {
    if (!user) {
      Swal.fire({ icon: 'error', title: 'Login required', text: 'Sign in to save favorites.' })
      return
    }
    const isLiked = likedComics.includes(slug)
    const ref = doc(db, 'bookmarks', `${user.uid}_${slug}`)
    try {
      if (isLiked) {
        await deleteDoc(ref)
        setLikedComics((prev) => prev.filter((s) => s !== slug))
      } else {
        const comic = comics.find((c) => c.link.includes(slug))
        setLikedComics((prev) => [...prev, slug])
        await setDoc(ref, {
          userId: user.uid,
          slug,
          title: comic?.title ?? '',
          poster: comic?.image ?? '',
          type: 'comic',
          createdAt: new Date().toISOString(),
        })
      }
    } catch {
      if (!isLiked) setLikedComics((prev) => prev.filter((s) => s !== slug))
    }
  }

  const genreLabel = GENRES.find((g) => g.id === genre)?.label ?? 'Genre'

  return (
    <div>
      {sliderItems.length > 0 && <HeroSlider items={sliderItems} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
            {genreLabel} Comics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse and discover your favorite comics
          </p>
        </div>

        <div className="relative w-44 shrink-0">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 hover:border-indigo-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {genreLabel}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {dropdownOpen && (
            <div className="absolute top-full right-0 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
              {GENRES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => { setGenre(g.id); setDropdownOpen(false) }}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                    genre === g.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <ComicContentGrid
        comics={comics}
        onLike={handleLike}
        likedComics={likedComics}
        loading={loading && comics.length === 0}
        hasMore={false}
      />

      <div ref={observerRef} className="flex justify-center py-10">
        {loading && comics.length > 0 && (
          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
        )}
      </div>
    </div>
  )
}
