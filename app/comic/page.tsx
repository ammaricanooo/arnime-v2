"use client"
import { useEffect, useState, useRef, useCallback } from 'react'
import { Loader2, ChevronDown, Shuffle, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import ComicContentGrid, { Comic } from '@/components/ComicContentGrid'
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import useAuth from '@/lib/useAuth';

const GENRES = [
  { id: 'hot', label: 'Hot', api: 'https://api.ammaricano.my.id/api/komiku/hot' },
  { id: 'latest', label: 'Latest', api: 'https://api.ammaricano.my.id/api/komiku/latest' },
]

// --- Hero Slider Component with Animation ---
const HeroSlider = ({ comics }: { comics: Comic[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (comics.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % comics.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [comics.length])

  if (comics.length === 0) return null

  return (
    <div className="relative w-full mb-8 md:mb-12 rounded-xl md:rounded-2xl overflow-hidden group">
      <div className="relative w-full overflow-hidden rounded-xl md:rounded-2xl bg-slate-900 shadow-xl">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {comics.map((comic, index) => {
            const slug = comic.link.split('/').filter(Boolean).pop() || ''
            const posterUrl = comic.image || comic.thumb || "/placeholder.svg"

            return (
              <div
                key={`${comic.link}-${index}`}
                className="flex-shrink-0 w-full relative h-[240px] sm:h-[320px] md:h-[400px] lg:h-[450px]"
              >
                <img
                  src={posterUrl}
                  alt={comic.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/40 to-black/20" />
                <div className="absolute inset-0 bg-black/50 md:bg-black/30" />

                <div className="absolute inset-0 flex items-end ">
                  <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 pb-6 sm:pb-8 md:pb-12">
                    <div className="max-w-2xl space-y-2 sm:space-y-3 md:space-y-4">
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {comic.type && (
                          <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/10 backdrop-blur-md rounded-md sm:rounded-lg text-[8px] sm:text-[10px] font-black text-white uppercase tracking-wider">
                            {comic.type}
                          </span>
                        )}
                        {comic.is_colored && (
                          <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-green-600 rounded-md sm:rounded-lg text-[8px] sm:text-[10px] font-black text-white uppercase tracking-wider">
                            Full Color
                          </span>
                        )}
                        {comic.latest_chapter && (
                          <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-amber-500 rounded-md sm:rounded-lg text-[8px] sm:text-[10px] font-black text-white uppercase tracking-wider">
                            {comic.latest_chapter}
                          </span>
                        )}
                      </div>

                      <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white leading-tight line-clamp-2">
                        {comic.title}
                      </h2>

                      <p className="block text-slate-200 text-sm md:text-base overflow-hidden text-ellipsis whitespace-nowrap line-clamp-1 md:line-clamp-3">
                        {comic.description || 'Tidak ada deskripsi tersedia.'}
                      </p>

                      <button
                        onClick={() => router.push(`/comic/${slug}`)}
                        className="inline-flex justify-center items-center gap-2 sm:gap-3 px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 bg-white hover:bg-slate-100 text-slate-900 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-base transition-all hover:scale-105 active:scale-95 shadow-lg"
                      >
                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                        Baca Sekarang
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <button
        onClick={() => setCurrentIndex((prev) => (prev - 1 + comics.length) % comics.length)}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
      </button>

      <button
        onClick={() => setCurrentIndex((prev) => (prev + 1) % comics.length)}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
      </button>

      <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
        {comics.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-300 ${idx === currentIndex
                ? 'w-4 sm:w-6 md:w-8 h-1.5 sm:h-2 bg-indigo-600'
                : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/50 hover:bg-white/80'
              } rounded-full`}
          />
        ))}
      </div>
    </div>
  )
}

export default function ComicHomePage() {
  const [genre, setGenre] = useState(GENRES[1].id)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [comics, setComics] = useState<Comic[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [randomComics, setRandomComics] = useState<Comic[]>([])
  const [likedComics, setlikedComics] = useState<string[]>([])
  const observerTarget = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  // Fetch comics
  const fetchComics = useCallback(async (reset = false) => {
    setLoading(true)
    setError(null)
    try {
      const api = GENRES.find(g => g.id === genre)?.api
      const res = await fetch(`${api}?page=${reset ? 1 : page}`)
      const json = await res.json()
      if (json.success && Array.isArray(json.result)) {
        if (reset) {
          setComics(json.result)
        } else {
          setComics(prev => [...prev, ...json.result])
        }
        setHasMore(json.result.length > 0)
      } else {
        setError('Failed to load comics')
        setHasMore(false)
      }
    } catch (err) {
      setError('Failed to load comics')
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [genre, page])

  // Reset on genre change
  useEffect(() => {
    setPage(1)
    setComics([])
    setHasMore(true)
    fetchComics(true)
  }, [genre])

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loading) return
    const observer = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setPage(p => p + 1)
      }
    }, { threshold: 0.1 })
    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [hasMore, loading])

  // Fetch more when page changes (not on genre reset)
  useEffect(() => {
    if (page === 1) return
    fetchComics()
  }, [page])

  // Get random comics for slider when comics change
  useEffect(() => {
    if (comics.length > 0) {
      // Shuffle array and take first 5 comics
      const shuffled = [...comics].sort(() => 0.5 - Math.random())
      setRandomComics(shuffled.slice(0, 5))
    }
  }, [comics])

  // Dropdown for genre
  const genreLabel = GENRES.find(g => g.id === genre)?.label || 'Genre'

  const handleLike = async (slug: string) => {
    if (!user) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "You need to login first to save your favorite anime!"
      });
      return;
    }

    const isAlreadyLiked = likedComics.includes(slug);
    const docId = `${user.uid}_${slug}`;
    const docRef = doc(db, "bookmarks", docId);

    try {
      if (isAlreadyLiked) {
        await deleteDoc(docRef);
        setlikedComics(prev => prev.filter(s => s !== slug));
      } else {
        const comicToSave = comics.find(c => c.link.includes(slug));

        setlikedComics(prev => [...prev, slug]);

        await setDoc(docRef, {
          userId: user.uid,
          slug,
          title: comicToSave?.title,
          poster: comicToSave?.image,
          type: "comic",
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Firestore Error:", error);
      if (!isAlreadyLiked) setlikedComics(prev => prev.filter(s => s !== slug));
      alert("Gagal menyimpan ke favorit.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Slider */}
      {randomComics.length > 0 && (
        <HeroSlider comics={randomComics} />
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        {/* Skeleton untuk Judul */}
        {loading && comics.length === 0 ? (
          <div className="animate-pulse space-y-2">
            <div className="h-8 md:h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-4 w-64 bg-slate-100 dark:bg-slate-800/50 rounded" />
          </div>
        ) : (
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Comic {genreLabel}</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
              Browse and discover your favorite comic content
            </p>
          </div>
        )}
        {/* Skeleton untuk Judul */}
        {loading && comics.length === 0 ? (
          <div className="flex gap-2 animate-pulse overflow-hidden w-full md:w-auto">
            <div className="h-10 w-56 bg-slate-200 dark:bg-slate-800 rounded shrink-0" />
          </div>
        ) : (
          <div className="flex justify-end w-full md:w-auto">
            <div className="relative w-56">
              <button
                onClick={() => setDropdownOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-pointer"
              >
                <span className="text-sm font-medium">{genreLabel}</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'transform rotate-180' : ''}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
                  <div className="py-1 max-h-64 overflow-y-auto">
                    {GENRES.map(g => (
                      <button
                        key={g.id}
                        onClick={() => { setGenre(g.id); setDropdownOpen(false) }}
                        className={`w-full cursor-pointer text-left px-4 py-2.5 text-sm transition-colors ${genre === g.id ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 font-semibold' : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <ComicContentGrid
        comics={comics}
        onLike={handleLike}
        likedComics={likedComics}
        loading={loading && comics.length === 0}
        hasMore={false} // Kita pakai observerTarget di bawah untuk infinite scroll
      />
      {/* Target untuk Infinite Scroll */}
      <div ref={observerTarget} className="flex justify-center py-12">
        {loading && comics.length > 0 && (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            <p className="text-xs text-slate-500 animate-pulse font-medium">Memuat lebih banyak...</p>
          </div>
        )}
      </div>
      {!hasMore && !loading && comics.length > 0 && (
        <div className="text-center text-slate-400 py-8">No more comics</div>
      )}
    </div>
  )
}
