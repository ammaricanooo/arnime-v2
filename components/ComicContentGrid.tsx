'use client'

import { BookOpen, Loader2, Trash2, Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Comic } from '@/lib/types'
import CardSkeleton from './CardSkeleton'

export type { Comic }

interface ComicContentGridProps {
  comics: Comic[]
  onLike?: (slug: string) => void
  likedComics?: string[]
  loading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  variant?: 'default' | 'history'
}

function getSlug(link: string) {
  return link.split('/').filter(Boolean).pop() ?? ''
}

export default function ComicContentGrid({
  comics,
  onLike = () => {},
  likedComics = [],
  loading = false,
  hasMore = false,
  onLoadMore,
  variant = 'default',
}: ComicContentGridProps) {
  const router = useRouter()

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {loading && comics.length === 0
          ? Array.from({ length: 10 }, (_, i) => <CardSkeleton key={i} />)
          : comics.map((comic) => {
              const slug = getSlug(comic.link)
              const poster = comic.image || comic.thumb || '/placeholder.svg'
              const isLiked = likedComics.includes(slug)
              const badge = comic.time || comic.update

              return (
                <article
                  key={comic.link}
                  onClick={() => router.push(`/comic/${slug}`)}
                  className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border border-slate-100 dark:border-slate-800"
                >
                  <div className="relative aspect-3/4 overflow-hidden">
                    <img
                      src={poster}
                      alt={comic.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); onLike(slug) }}
                      className="absolute top-2 right-2 p-1.5 bg-black/30 backdrop-blur-sm hover:bg-black/50 rounded-lg transition-all z-10"
                      aria-label={variant === 'history' ? 'Remove from history' : 'Toggle favorite'}
                    >
                      {variant === 'history' ? (
                        <Trash2 className="w-3.5 h-3.5 text-white hover:text-red-400" />
                      ) : (
                        <Heart className={`w-3.5 h-3.5 transition-all ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                      )}
                    </button>

                    {badge && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-indigo-600 rounded-md text-[10px] font-bold text-white">
                        {badge}
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-2.5">
                      <h3 className="font-semibold text-white text-xs line-clamp-2 leading-tight">
                        {comic.title}
                      </h3>
                      {comic.genre && (
                        <p className="text-[10px] text-slate-300 mt-0.5 line-clamp-1">{comic.genre}</p>
                      )}
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
