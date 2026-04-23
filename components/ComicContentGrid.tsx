'use client'

import { BookOpen, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export interface Comic {
  title: string
  link: string
  thumb?: string
  image?: string
  genre?: string
  latest_chapter?: string
  info?: string
  chapter?: string
  is_colored?: boolean
  type?: string
  update?: string
  readers?: string
  time?: string
  extra?: string
  description?: string
  firstChapter?: string
  firstChapterLink?: string
  latestChapter?: string
  latestChapterLink?: string
}

interface ComicContentGridProps {
  comics: Comic[]
  loading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
}

// --- Skeleton Loader Component ---
const ComicCardSkeleton = () => (
  <div className="animate-pulse space-y-3">
    <div className="aspect-3/4 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
  </div>
)

// --- Hero Slider Component with Animation ---
const HeroSlider = ({ comics }: { comics: Comic[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (comics.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % comics.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [comics.length])

  useEffect(() => {
    if (currentIndex >= comics.length) {
      setCurrentIndex(0)
    }
  }, [comics.length, currentIndex])

  if (comics.length === 0) return null

  return (
    <div className="relative w-full mb-8 md:mb-12 rounded-xl md:rounded-2xl overflow-hidden group">
      <div className="relative w-full overflow-hidden rounded-xl md:rounded-2xl bg-slate-900 shadow-xl">
        <div className="relative w-full h-[200px] sm:h-[320px] md:h-[380px] lg:h-[350px]">
          {comics.map((comic, index) => {
            const slug = comic.link.split('/').filter(Boolean).pop() || ''
            const posterUrl = comic.image || comic.thumb || "/placeholder.svg"
            const isActive = index === currentIndex

            return (
              <div
                key={`${comic.link}-${index}`}
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  isActive ? 'opacity-100 z-20' : 'opacity-0 z-10 pointer-events-none'
                }`}
              >
                <img
                  src={posterUrl}
                  alt={comic.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-900/20 to-slate-900/0 md:via-slate-900/50 md:to-slate-900/20" />
                <div className="absolute inset-0 bg-slate-900/70 md:bg-slate-900/20" />

                <div className="absolute inset-0 flex items-end ">
                  <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 pb-6 sm:pb-8 md:pb-12">
                    <div className="max-w-2xl space-y-2 sm:space-y-3 md:space-y-4">
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
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

                      <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white leading-tight line-clamp-2">
                        {comic.title}
                      </h2>

                      <p className="block text-slate-200 text-xs md:text-base line-clamp-1 md:line-clamp-3">
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
            className={`transition-all duration-300 ${
              idx === currentIndex
                ? 'w-4 sm:w-6 md:w-8 h-1.5 sm:h-2 bg-indigo-600'
                : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/50 hover:bg-white/80'
            } rounded-full`}
          />
        ))}
      </div>
    </div>
  )
}

export default function ComicContentGrid({
  comics,
  loading = false,
  hasMore = true,
  onLoadMore,
}: ComicContentGridProps) {
  const router = useRouter()
  const [randomComics, setRandomComics] = useState<Comic[]>([])

  // Get random comics for slider when comics change
  useEffect(() => {
    if (comics.length > 0) {
      // Shuffle array and take first 5 comics
      const shuffled = [...comics].sort(() => 0.5 - Math.random())
      setRandomComics(shuffled.slice(0, 5))
    }
  }, [comics])

  const getDisplayInfo = (comic: Comic): { badge: string; badgeColor: string } => {
    if (comic.latest_chapter) {
      return { badge: comic.latest_chapter, badgeColor: 'bg-indigo-600' }
    }
    if (comic.chapter) {
      return { badge: comic.chapter, badgeColor: 'bg-green-600' }
    }
    if (comic.update) {
      return { badge: comic.update, badgeColor: 'bg-amber-500' }
    }
    return { badge: 'N/A', badgeColor: 'bg-slate-600' }
  }

  return (
    <div className="w-full">
      {/* Hero Slider */}
      {!loading && randomComics.length > 0 && (
        <HeroSlider comics={randomComics} />
      )}

      {/* Section Title */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
          Semua Komik
        </h2>
        <div className="mt-1.5 md:mt-2 h-1 w-16 md:w-20 bg-indigo-600 rounded-full" />
      </div>

      {/* Grid Comics - Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
        {/* State Loading Awal */}
        {loading && comics.length === 0 ? (
          Array.from({ length: 10 }).map((_, i) => <ComicCardSkeleton key={i} />)
        ) : (
          comics.map((comic) => {
            const slug = comic.link.split('/').filter(Boolean).pop() || ''
            const posterUrl = comic.image || comic.thumb || "/placeholder.svg"
            const { badge, badgeColor } = getDisplayInfo(comic)

            return (
              <div
                key={comic.link}
                onClick={() => router.push(`/comic/${slug}`)}
                className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-xl md:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-slate-100 dark:border-slate-800"
              >
                {/* Image Container */}
                <div className="relative aspect-3/4 overflow-hidden">
                  <img
                    src={posterUrl}
                    alt={comic.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

                  {/* Book Icon on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                      <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                  </div>

                  {/* Badges */}
                  <div className={`absolute top-2 left-2 flex items-center gap-1 px-1.5 md:px-2.5 py-0.5 md:py-1 ${badgeColor} rounded-md md:rounded-lg text-[8px] md:text-[10px] font-black text-white shadow-lg`}>
                    {badge.toUpperCase()}
                  </div>
                  {comic.time && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 md:px-2.5 py-0.5 md:py-1 bg-indigo-600 rounded-md md:rounded-lg text-[8px] md:text-[10px] font-black text-white shadow-lg">
                      {comic.time}
                    </div>
                  )}

                  {/* Info Section */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 space-y-0.5 md:space-y-1">
                    <h3 className="font-bold text-white text-xs md:text-sm line-clamp-2 leading-tight group-hover:text-indigo-300 transition-colors">
                      {comic.title}
                    </h3>
                    {comic.genre && (
                      <p className="text-[8px] md:text-[10px] text-slate-300 font-medium opacity-80 line-clamp-1">
                        {comic.genre}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Load More Button */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center mt-8 md:mt-12">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="group flex items-center gap-2 md:gap-3 px-6 md:px-8 py-2.5 md:py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl md:rounded-2xl hover:border-indigo-500 hover:text-indigo-500 disabled:opacity-50 transition-all font-bold text-xs md:text-sm shadow-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-indigo-500" />
            ) : (
              <>
                Tampilkan Lebih Banyak
                <div className="w-5 h-5 md:w-6 md:h-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <BookOpen className="w-2.5 h-2.5 md:w-3 md:h-3" />
                </div>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}