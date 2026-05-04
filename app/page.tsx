"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore"
import useAuth from "@/lib/useAuth"
import GenreFilter from "@/components/GenreFilter"
import ContentGrid from "@/components/ContentGrid"
import PageHeader from "@/components/ui/PageHeader"
import HeroSlider, { type SliderItem } from "@/components/HeroSlider"
import { fetchJson } from "@/lib/fetchJson"
import { API, MAX_PAGES } from "@/lib/constants"
import type { AnimeItem } from "@/lib/types"
import Swal from "sweetalert2"

interface Genre { name: string; slug: string }

export default function HomePage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const isComplete = searchParams?.get("type") === "complete"

  const [genres, setGenres] = useState<string[]>(["All"])
  const [genreMap, setGenreMap] = useState<Record<string, string>>({})
  const [selectedGenre, setSelectedGenre] = useState("All")
  const [animes, setAnimes] = useState<AnimeItem[]>([])
  const [sliderItems, setSliderItems] = useState<SliderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingGenres, setLoadingGenres] = useState(true)
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
        setGenres(["All", ...result.map((g) => g.name)])
        setGenreMap(Object.fromEntries(result.map((g) => [g.name, g.slug])))
      })
      .catch(() => setGenres(["All", "Action", "Adventure", "Comedy", "Drama"]))
      .finally(() => setLoadingGenres(false))
  }, [])

  const fetchAnimes = useCallback(
    async (page: number, append = false, genre = "All") => {
      if (page > MAX_PAGES) { setHasMore(false); return }
      setLoading(true)
      try {
        const url =
          genre !== "All"
            ? API.otakudesu.byGenre(genreMap[genre] ?? genre.toLowerCase(), page)
            : API.otakudesu.list(isComplete ? "complete" : "ongoing", page)

        const data = await fetchJson<{ result: AnimeItem[] }>(url)
        if (data?.result) {
          const results = data.result
          if (!append) {
            // Build slider from first page — pick up to 6 with a poster
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
      }
    },
    [isComplete, genreMap]
  )

  useEffect(() => {
    setCurrentPage(1)
    setAnimes([])
    setHasMore(true)
    fetchAnimes(1, false, selectedGenre)
  }, [selectedGenre, fetchAnimes])

  // Infinite scroll
  useEffect(() => {
    const el = observerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading && animes.length > 0) {
          const next = currentPage + 1
          setCurrentPage(next)
          fetchAnimes(next, true, selectedGenre)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, currentPage, animes.length, selectedGenre, fetchAnimes])

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
          type: isComplete ? "complete" : "ongoing",
          createdAt: new Date().toISOString(),
        })
      }
    } catch {
      if (!isLiked) setLikedAnimes((prev) => prev.filter((s) => s !== slug))
    }
  }

  const title =
    selectedGenre !== "All"
      ? selectedGenre
      : isComplete
      ? "Completed Anime"
      : "Ongoing Anime"

  // Only show slider on the default tabs (not genre filter)
  const showSlider = selectedGenre === "All" && sliderItems.length > 0

  return (
    <>
      {/* Hero slider — only on home/complete tabs, not genre filter */}
      {showSlider && <HeroSlider items={sliderItems} />}

      <PageHeader
        title={loading && animes.length === 0 ? "" : title}
        description={loading && animes.length === 0 ? "" : "Browse and discover your favorite anime"}
        action={
          loadingGenres ? (
            <div className="h-9 w-44 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          ) : (
            <GenreFilter
              genres={genres}
              selectedGenre={selectedGenre}
              onSelectGenre={setSelectedGenre}
            />
          )
        }
      />

      <ContentGrid
        animes={animes}
        onLike={handleLike}
        likedAnimes={likedAnimes}
        type={isComplete ? "complete" : "ongoing"}
        loading={loading}
        hasMore={false}
      />

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
