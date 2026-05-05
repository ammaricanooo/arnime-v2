"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Loader2 } from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore"
import useAuth from "@/lib/useAuth"
import ContentGrid from "@/components/ContentGrid"
import HeroSlider, { type SliderItem } from "@/components/HeroSlider"
import { fetchJson } from "@/lib/fetchJson"
import { API, MAX_PAGES } from "@/lib/constants"
import type { AnimeItem } from "@/lib/types"
import Swal from "sweetalert2"
import { ChevronDown } from "lucide-react"
import { useRef as useDropdownRef, useEffect as useDropdownEffect } from "react"

interface Genre { name: string; slug: string }

// ─── Filter dropdown (type + genre combined) ──────────────────────────────────

const TYPE_OPTIONS = [
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'complete', label: 'Complete' },
]

interface FilterDropdownProps {
  types: typeof TYPE_OPTIONS
  genres: string[]
  selectedType: string
  selectedGenre: string
  onSelectType: (t: string) => void
  onSelectGenre: (g: string) => void
}

function FilterDropdown({ types, genres, selectedType, selectedGenre, onSelectType, onSelectGenre }: FilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useDropdownRef<HTMLDivElement>(null)

  useDropdownEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const label = selectedGenre !== 'All'
    ? selectedGenre
    : selectedType === 'ongoing' ? 'Ongoing' : 'Complete'

  return (
    <div ref={ref} className="relative w-48">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 hover:border-indigo-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
      >
        <span className="font-medium truncate">{label}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="max-h-72 overflow-y-auto custom-scroll py-1">
            {/* Type section */}
            <p className="px-3 pt-1 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</p>
            {types.map((t) => (
              <button
                key={t.id}
                onClick={() => { onSelectType(t.id); onSelectGenre('All'); setOpen(false) }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  selectedGenre === 'All' && selectedType === t.id
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}

            {/* Genre section */}
            <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
              <p className="px-3 pt-1 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Genre</p>
              {genres.filter(g => g !== 'All').map((genre) => (
                <button
                  key={genre}
                  onClick={() => { onSelectGenre(genre); setOpen(false) }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    selectedGenre === genre
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Full-page skeleton (slider + header + grid) ──────────────────────────────

function PageSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Slider skeleton */}
      <div className="w-full mb-8 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 h-[220px] sm:h-[300px] md:h-[400px]" />

      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <div className="h-9 w-44 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <div className="relative aspect-3/4 bg-slate-200 dark:bg-slate-800">
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-slate-300/60 dark:from-slate-700/60 to-transparent" />
              <div className="absolute top-2 left-2 h-4 w-10 bg-slate-300 dark:bg-slate-700 rounded-md" />
              <div className="absolute top-2 right-2 h-6 w-6 bg-slate-300 dark:bg-slate-700 rounded-lg" />
              <div className="absolute bottom-0 left-0 right-0 p-2.5 space-y-1.5">
                <div className="h-2.5 bg-slate-300 dark:bg-slate-700 rounded w-full" />
                <div className="h-2 bg-slate-300/70 dark:bg-slate-700/70 rounded w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user } = useAuth()

  const [genres, setGenres] = useState<string[]>([])
  const [genreMap, setGenreMap] = useState<Record<string, string>>({})
  const [selectedType, setSelectedType] = useState<'ongoing' | 'complete'>('ongoing')
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [animes, setAnimes] = useState<AnimeItem[]>([])
  const [sliderItems, setSliderItems] = useState<SliderItem[]>([])
  // initialLoad = true until first data arrives (shows full skeleton)
  const [initialLoad, setInitialLoad] = useState(true)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [likedAnimes, setLikedAnimes] = useState<string[]>([])
  const observerRef = useRef<HTMLDivElement>(null)

  // Fetch user bookmarks
  useEffect(() => {
    if (!user) { setLikedAnimes([]); return }
    getDocs(query(collection(db, "bookmarks"), where("userId", "==", user.uid)))
      .then((snap) => setLikedAnimes(snap.docs.map((d) => d.data().slug)))
      .catch(() => {})
  }, [user])

  // Fetch genres once
  useEffect(() => {
    fetchJson<{ result: Genre[] }>(API.otakudesu.genre)
      .then(({ result }) => {
        setGenres(result.map((g) => g.name))
        setGenreMap(Object.fromEntries(result.map((g) => [g.name, g.slug])))
      })
      .catch(() => setGenres(["Action", "Adventure", "Comedy", "Drama"]))
  }, [])

  const fetchAnimes = useCallback(
    async (page: number, append = false) => {
      if (page > MAX_PAGES) { setHasMore(false); return }
      setLoading(true)
      try {
        const url = selectedGenre !== 'All'
          ? API.otakudesu.byGenre(genreMap[selectedGenre] ?? selectedGenre.toLowerCase(), page)
          : API.otakudesu.list(selectedType, page)

        const data = await fetchJson<{ result: AnimeItem[] }>(url)
        if (data?.result) {
          const results = data.result
          if (!append) {
            const picks = results
              .filter((a) => a.poster)
              .slice(0, 6)
              .map<SliderItem>((a) => ({
                slug: a.slug,
                title: a.title,
                poster: a.poster,
                badge: a.current_episode ? `Ep ${a.current_episode}` : a.total_episode ? `${a.total_episode} Eps` : undefined,
                badgeColor: 'bg-indigo-600',
                subtitle: a.studio ?? a.release_day,
                type: 'anime',
              }))
            setSliderItems(picks)
          }
          setAnimes((prev) => (append ? [...prev, ...results] : results))
          setHasMore(page < MAX_PAGES && results.length > 0)
        }
      } catch {
        // keep existing data
      } finally {
        setLoading(false)
        setInitialLoad(false)
      }
    },
    [selectedType, selectedGenre, genreMap]
  )

  useEffect(() => {
    setCurrentPage(1)
    setAnimes([])
    setHasMore(true)
    setInitialLoad(true)
    fetchAnimes(1, false)
  }, [selectedType, selectedGenre, fetchAnimes])

  // Infinite scroll
  useEffect(() => {
    const el = observerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading && animes.length > 0) {
          const next = currentPage + 1
          setCurrentPage(next)
          fetchAnimes(next, true)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, currentPage, animes.length, fetchAnimes])

  const handleLike = async (slug: string) => {
    if (!user) {
      Swal.fire({ icon: "error", title: "Login required", text: "Sign in to save favorites." })
      return
    }
    const isLiked = likedAnimes.includes(slug)
    const ref = doc(db, "bookmarks", `${user.uid}_${slug}`)
    try {
      if (isLiked) {
        await deleteDoc(ref)
        setLikedAnimes((prev) => prev.filter((s) => s !== slug))
      } else {
        const anime = animes.find((a) => a.slug === slug)
        setLikedAnimes((prev) => [...prev, slug])
        await setDoc(ref, {
          userId: user.uid,
          slug,
          title: anime?.title ?? "",
          poster: anime?.poster ?? "",
          type: selectedType,
          createdAt: new Date().toISOString(),
        })
      }
    } catch {
      if (!isLiked) setLikedAnimes((prev) => prev.filter((s) => s !== slug))
    }
  }

  const title = selectedGenre !== 'All'
    ? selectedGenre
    : selectedType === 'ongoing' ? 'Ongoing Anime' : 'Completed Anime'

  // Show full skeleton on initial load
  if (initialLoad) return <PageSkeleton />

  return (
    <>
      {/* Hero slider — only when not filtering by genre */}
      {selectedGenre === 'All' && sliderItems.length > 0 && (
        <HeroSlider items={sliderItems} />
      )}

      {/* Header + filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Browse and discover your favorite anime</p>
        </div>
        <FilterDropdown
          types={TYPE_OPTIONS}
          genres={['All', ...genres]}
          selectedType={selectedType}
          selectedGenre={selectedGenre}
          onSelectType={(t) => setSelectedType(t as 'ongoing' | 'complete')}
          onSelectGenre={setSelectedGenre}
        />
      </div>

      <ContentGrid
        animes={animes}
        onLike={handleLike}
        likedAnimes={likedAnimes}
        type={selectedType}
        loading={loading && animes.length === 0}
        hasMore={false}
      />

      {/* Infinite scroll sentinel */}
      <div ref={observerRef} className="flex justify-center py-10">
        {loading && animes.length > 0 && (
          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
        )}
      </div>

      {!loading && animes.length === 0 && (
        <div className="text-center py-20 text-slate-500">No anime found</div>
      )}
    </>
  )
}
