'use client'

import { Heart, Play, Star, Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Anime {
  title: string
  slug: string
  poster: string
  current_episode?: string
  release_day?: string
  total_episode?: string
  rating?: string
  newest_release_date?: string
  lastEpisodeName?: string
  lastEpisodeSlug?: string
}

interface ContentGridProps {
  animes: Anime[]
  onLike: (slug: string) => void
  likedAnimes: string[]
  loading?: boolean
  type: 'ongoing' | 'complete'
  onLoadMore?: () => void
  hasMore?: boolean
  variant?: 'default' | 'history'
}

// --- Skeleton Loader Component ---
const CardSkeleton = () => (
  <div className="animate-pulse space-y-3">
    <div className="aspect-3/4 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
  </div>
)

export default function ContentGrid({
  animes,
  onLike,
  likedAnimes,
  loading = false,
  type,
  onLoadMore,
  hasMore = true,
  variant = 'default',
}: ContentGridProps) {
  const router = useRouter()
  const isOngoing = type === 'ongoing'

  const getDisplayInfo = (anime: Anime): { badge: string; badgeColor: string } => {
    if (isOngoing && anime.current_episode) {
      return { badge: `${anime.current_episode}`, badgeColor: 'bg-indigo-600' }
    }
    if (anime.rating) {
      return { badge: anime.rating, badgeColor: 'bg-amber-500' } // Kuning emas untuk rating
    }
    if (anime.total_episode) {
      return { badge: `${anime.total_episode} Ep`, badgeColor: 'bg-indigo-600' }
    }
    return { badge: 'N/A', badgeColor: 'bg-slate-600' }
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {/* State Loading Awal */}
        {loading && animes.length === 0 ? (
          Array.from({ length: 10 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          animes.map((anime) => {
            const isLiked = likedAnimes.includes(anime.slug)
            const posterUrl = anime.poster || "/placeholder.svg"
            const { badge, badgeColor } = getDisplayInfo(anime)

            return (
              <div
                key={anime.slug}
                onClick={() => {
                  if (variant === 'history' && anime.lastEpisodeSlug) {
                    router.push(`/anime/${anime.slug}/watch/${anime.lastEpisodeSlug}`)
                  } else {
                    router.push(`/anime/${anime.slug}`)
                  }
                }}
                className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-slate-100 dark:border-slate-800"
              >
                {/* Image Container */}
                <div className="relative aspect-3/4 overflow-hidden">
                  <img
                    src={posterUrl}
                    alt={anime.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  
                  {/* Overlay Gradient Lebih Halus */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />

                  {/* Play Icon on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                      <Play className="w-6 h-6 text-white fill-current ml-1" />
                    </div>
                  </div>

                  {/* Top Actions (Like/Trash) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onLike(anime.slug)
                    }}
                    className="absolute top-2 right-2 p-2 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-xl transition-all z-10"
                  >
                    {variant === 'history' ? (
                      <Trash2 className="w-4 h-4 text-white hover:text-red-400" />
                    ) : (
                      <Heart
                        className={`w-4 h-4 transition-all ${isLiked ? "fill-red-500 text-red-500 scale-110" : "text-white"}`}
                      />
                    )}
                  </button>

                  {/* Badge */}
                  <div className={`absolute top-2 left-2 flex items-center gap-1 px-2.5 py-1 ${badgeColor} rounded-lg text-[10px] font-black text-white shadow-lg`}>
                    {badgeColor === 'bg-amber-500' && <Star className="w-3 h-3 fill-current" />}
                    {badge.toUpperCase()}
                  </div>

                  {/* Info Section (Floating on Bottom) */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
                    <h3 className="font-bold text-white text-sm line-clamp-2 leading-tight group-hover:text-indigo-300 transition-colors">
                      {anime.title}
                    </h3>
                    
                    {anime.lastEpisodeName ? (
                      <p className="text-[10px] text-indigo-300 font-bold flex items-center gap-1 uppercase tracking-tighter">
                        <span className="w-1 h-1 bg-indigo-400 rounded-full animate-ping" />
                        Lanjut: {anime.lastEpisodeName}
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-300 font-medium opacity-80">
                        {anime.release_day || anime.total_episode || 'Ongoing'}
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
                  <Play className="w-3 h-3 rotate-90" fill="currentColor" />
                </div>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}