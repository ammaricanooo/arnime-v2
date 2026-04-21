'use client'

import { BookOpen, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

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

export default function ComicContentGrid({
  comics,
  loading = false,
  hasMore = true,
  onLoadMore,
}: ComicContentGridProps) {
  const router = useRouter()

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
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
                className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-slate-100 dark:border-slate-800"
              >
                {/* Image Container */}
                <div className="relative aspect-3/4 overflow-hidden">
                  <img
                    src={posterUrl}
                    alt={comic.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />

                  {/* Overlay Gradient Lebih Halus */}
                  <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent opacity-80" />

                  {/* Book Icon on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                      <BookOpen className="w-6 h-6 text-white fill-current" />
                    </div>
                  </div>

                  {/* Badge */}
                  <div className={`absolute top-2 left-2 flex items-center gap-1 px-2.5 py-1 ${badgeColor} rounded-lg text-[10px] font-black text-white shadow-lg`}>
                    {badge.toUpperCase()}
                  </div>
                  <div className={`absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 bg-indigo-600 rounded-lg text-[10px] font-black text-white shadow-lg`}>
                    {comic.time}
                  </div>

                  {/* Info Section (Floating on Bottom) */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm line-clamp-2 leading-tight group-hover:text-indigo-300 transition-colors">
                        {comic.title}
                      </h3>
                    </div>
                    {comic.genre && (
                      <p className="text-[10px] text-slate-300 font-medium opacity-80">
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
        <div className="flex justify-center mt-12">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="group flex items-center gap-3 px-8 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl hover:border-indigo-500 hover:text-indigo-500 disabled:opacity-50 transition-all font-bold text-sm shadow-sm"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
            ) : (
              <>
                Tampilkan Lebih Banyak
                <div className="w-6 h-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <BookOpen className="w-3 h-3" />
                </div>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}