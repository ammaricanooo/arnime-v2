'use client'

import { Heart, Play, Star, Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { AnimeItem } from '@/lib/types'
import CardSkeleton from './CardSkeleton'

interface ContentGridProps {
  animes: AnimeItem[]
  onLike: (slug: string) => void
  likedAnimes: string[]
  loading?: boolean
  type: 'ongoing' | 'complete'
  hasMore?: boolean
  onLoadMore?: () => void
  variant?: 'default' | 'history'
}

function getBadge(anime: AnimeItem, isOngoing: boolean): { text: string; color: string } {
  if (isOngoing && anime.current_episode)
    return { text: `${anime.current_episode}`, color: 'bg-indigo-600' }
  if (anime.rating)
    return { text: anime.rating, color: 'bg-amber-500' }
  if (anime.source === 'animasu')
    return { text: 'Animasu', color: 'bg-blue-600' }
  if (anime.total_episode)
    return { text: `${anime.total_episode} Ep`, color: 'bg-indigo-600' }
  return { text: 'N/A', color: 'bg-slate-500' }
}

export default function ContentGrid({
  animes,
  onLike,
  likedAnimes,
  loading = false,
  type,
  hasMore = false,
  onLoadMore,
  variant = 'default',
}: ContentGridProps) {
  const router = useRouter()
  const isOngoing = type === 'ongoing'

  const handleClick = (anime: AnimeItem) => {
    if (variant === 'history' && anime.lastEpisodeSlug) {
      router.push(`/anime/${anime.slug}/watch/${anime.lastEpisodeSlug}`)
    } else if (anime.source === 'animasu') {
      router.push(`/animasu/${anime.slug}`)
    } else {
      router.push(`/anime/${anime.slug}`)
    }
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {loading && animes.length === 0
          ? Array.from({ length: 10 }, (_, i) => <CardSkeleton key={i} />)
          : animes.map((anime) => {
              const isLiked = likedAnimes.includes(anime.slug)
              const { text: badge, color: badgeColor } = getBadge(anime, isOngoing)

              return (
                <article
                  key={anime.slug}
                  onClick={() => handleClick(anime)}
                  className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border border-slate-100 dark:border-slate-800"
                >
                  <div className="relative aspect-3/4 overflow-hidden">
                    <img
                      src={anime.poster || '/placeholder.svg'}
                      alt={anime.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                      </div>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); onLike(anime.slug) }}
                      className="absolute top-2 right-2 p-1.5 bg-black/30 backdrop-blur-sm hover:bg-black/50 rounded-lg transition-all z-10"
                      aria-label={variant === 'history' ? 'Remove from history' : 'Toggle favorite'}
                    >
                      {variant === 'history' ? (
                        <Trash2 className="w-3.5 h-3.5 text-white hover:text-red-400" />
                      ) : (
                        <Heart className={`w-3.5 h-3.5 transition-all ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                      )}
                    </button>

                    <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 ${badgeColor} rounded-md text-[10px] font-bold text-white`}>
                      {badgeColor === 'bg-amber-500' && <Star className="w-2.5 h-2.5 fill-current" />}
                      {badge}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-2.5">
                      <h3 className="font-semibold text-white text-xs line-clamp-2 leading-tight">
                        {anime.title}
                      </h3>
                      <p className="text-[10px] text-slate-300 mt-0.5">
                        {anime.lastEpisodeName || anime.release_day || anime.total_episode || 'Ongoing'}
                      </p>
                    </div>
                  </div>
                </article>
              )
            })}
      </div>

      {hasMore && onLoadMore && (
        <div className="flex justify-center mt-10">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:border-indigo-500 hover:text-indigo-600 disabled:opacity-50 transition-all text-sm font-semibold"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}
