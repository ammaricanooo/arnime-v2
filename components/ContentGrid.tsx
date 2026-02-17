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
      return { badge: anime.rating, badgeColor: 'bg-indigo-400' }
    }

    if (anime.total_episode) {
      return { badge: `${anime.total_episode} Ep`, badgeColor: 'bg-indigo-600' }
    }

    return { badge: 'N/A', badgeColor: 'bg-slate-600' }
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {animes.map((anime) => {
          const isLiked = likedAnimes.includes(anime.slug)
          const posterUrl = anime.poster || "/placeholder.svg"
          const { badge, badgeColor } = getDisplayInfo(anime)

          return (
            <div
              key={anime.slug}
              data-anime-slug={anime.slug}
              onClick={() => {
                if (variant === 'history' && anime.lastEpisodeSlug) {
                  // Jika di halaman history, langsung ke episode terakhir
                  router.push(`/anime/${anime.slug}/watch/${anime.lastEpisodeSlug}`)
                } else {
                  // Jika di halaman biasa, pergi ke detail
                  router.push(`/anime/${anime.slug}`)
                }
              }}
              className="group relative rounded-lg overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all cursor-pointer"
            >
              {/* Image Container */}
              <div className="relative overflow-hidden aspect-3/4">
                <img
                  src={posterUrl}
                  alt={anime.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                {/* Overlay Actions */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); router.push(`/anime/${anime.slug}`); }} className="flex items-center justify-center w-14 h-14 text-white">
                    <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
                  </button>
                </div>

                {/* Like Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onLike(anime.slug)
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-slate-900/90 hover:bg-red-100 dark:hover:bg-red-900 rounded-full transition-colors shadow-sm z-10 group/btn"
                >
                  {variant === 'history' ? (
                    <Trash2 className="w-4 h-4 text-slate-500 group-hover/btn:text-red-600" />
                  ) : (
                    <Heart
                      className={`w-4 h-4 transition-colors ${isLiked
                          ? "fill-red-500 text-red-500" 
                          : "fill-none text-current"
                        }`}
                    />
                  )}
                </button>

                {/* Badge */}
                <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-1 ${badgeColor} rounded-full text-xs font-bold ${badgeColor === 'bg-indigo-400' ? 'text-white' : 'text-white'}`}>
                  {badgeColor === 'bg-indigo-400' && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
                  {badge}
                </div>
              </div>

              {/* Info Section */}
              <div className="p-3 pt-20 space-y-2 absolute bottom-0 w-full bg-linear-to-t from-black/70 to-transparent">
                <div>
                  <h3 className="font-semibold text-slate-100 dark:text-slate-100 text-xs md:text-sm line-clamp-2 transition-colors">
                    {anime.title}
                  </h3>
                  {/* INFO EPISODE TERAKHIR DI SINI */}
                  {anime.lastEpisodeName && (
                    <p className="text-[10px] text-indigo-300 font-medium">
                      {anime.lastEpisodeName}
                    </p>
                  )}
                  {(anime.release_day || anime.total_episode) && (
                    <p className="text-xs text-slate-100 dark:text-slate-400 mt-1">
                      {anime.release_day ?? anime.total_episode}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Load More Button - Only show if onLoadMore is provided */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
