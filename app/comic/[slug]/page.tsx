"use client"

import { useParams, notFound } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BookOpen, Calendar, User, Layers, Heart, Share2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import useAuth from "@/lib/useAuth"
import { useBookmarkToggle, saveHistory } from "@/lib/useBookmark"
import BackButton from "@/components/ui/BackButton"
import { API } from "@/lib/constants"
import type { ComicDetail } from "@/lib/types"
import Swal from "sweetalert2"

const Skeleton = () => (
  <div className="animate-pulse space-y-6 max-w-7xl mx-auto">
    <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
      <div className="md:col-span-3">
        <div className="aspect-3/4 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
      <div className="md:col-span-9 space-y-4">
        <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-full" />
        <div className="h-10 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    </div>
  </div>
)

export default function ComicDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug
  const router = useRouter()
  const { user } = useAuth()
  const [comic, setComic] = useState<ComicDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { isLiked, loading: likeLoading, toggle } = useBookmarkToggle(user, slug ?? '')

  useEffect(() => {
    if (!slug) return
    fetch(API.komiku.detail(API.komiku.comicUrl(slug)))
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.result) setComic(j.result)
        else setError('Failed to load comic')
      })
      .catch(() => setError('Failed to load comic'))
      .finally(() => setLoading(false))
  }, [slug])

  if (!slug) return notFound()
  if (loading) return <Skeleton />
  if (error || !comic) return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center gap-4">
      <p className="text-slate-600 dark:text-slate-400">{error ?? 'Comic not found'}</p>
      <BackButton />
    </div>
  )

  const handleToggleLike = () =>
    toggle({ slug: slug!, title: comic.title, poster: comic.thumbnail, type: 'comic' })

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) await navigator.share({ title: comic.title, url })
    else {
      await navigator.clipboard.writeText(url)
      Swal.fire({ icon: 'success', title: 'Link copied!', timer: 1000, showConfirmButton: false })
    }
  }

  const handleReadChapter = async (chapterSlug: string, chapterTitle: string) => {
    if (user) {
      await saveHistory(user.uid, {
        slug: slug!,
        title: comic.title,
        poster: comic.thumbnail,
        lastEpisodeName: chapterTitle,
        lastEpisodeSlug: chapterSlug,
        type: 'comic',
      }).catch(() => {})
    }
    router.push(`/comic/${slug}/chapter/${chapterSlug}`)
  }

  const chapterButtonClass =
    "flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group text-left"

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Blurred background */}
      <div className="absolute inset-x-0 top-0 h-96 z-0 overflow-hidden pointer-events-none mask-[linear-gradient(to_bottom,black_0%,transparent_80%)]">
        <img src={comic.thumbnail} alt="" className="w-full h-full object-cover blur-3xl scale-110 opacity-40 saturate-150" />
      </div>

      {/* Top bar */}
      <div className="relative flex items-center justify-between py-5">
        <BackButton href="/comic" label="Back to Comics" />
        <div className="flex gap-2">
          <button
            onClick={handleToggleLike}
            disabled={likeLoading}
            className={`p-2.5 rounded-full border transition-all ${
              isLiked
                ? 'bg-red-50 border-red-200 text-red-500 dark:bg-red-900/20 dark:border-red-800'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
            }`}
          >
            {likeLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />}
          </button>
          <button
            onClick={handleShare}
            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-400 hover:text-indigo-500 transition-all"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10">
        {/* Poster */}
        <div className="md:col-span-3">
          <div className="sticky top-20">
            <img src={comic.thumbnail} alt={comic.title} className="w-full rounded-2xl shadow-2xl object-cover aspect-3/4" />
          </div>
        </div>

        {/* Info */}
        <div className="md:col-span-9 space-y-6">
          <div>
            <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-semibold uppercase tracking-wide mb-3">
              {comic.type} · {comic.status}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight mb-1">{comic.title}</h1>
            {comic.alt_title && <p className="text-slate-400">{comic.alt_title}</p>}
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <User className="w-4 h-4" /><span>{comic.author || '—'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Calendar className="w-4 h-4" /><span>{comic.status}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Layers className="w-4 h-4" /><span>{comic.type}</span>
            </div>
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-1">
            {comic.genres?.map((g) => (
              <span key={g} className="text-[10px] px-2 py-0.5 bg-white dark:bg-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600">
                {g.trim()}
              </span>
            ))}
          </div>

          {/* Synopsis */}
          {comic.description && (
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="w-1 h-4 bg-indigo-600 rounded-full inline-block" />
                Synopsis
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{comic.description}</p>
            </div>
          )}

          {/* Chapters */}
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" /> Chapters
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {comic.chapters.slice().reverse().map((ch, idx) => {
                const chSlug = ch.url.split('/').filter(Boolean).pop() ?? ''
                return (
                  <button key={ch.url} onClick={() => handleReadChapter(chSlug, ch.title)} className={chapterButtonClass}>
                    <BookOpen className="w-6 h-6 text-slate-300 group-hover:text-indigo-600 transition-colors shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Ch. {idx + 1}</p>
                      <p className="text-sm font-medium truncate text-slate-700 dark:text-slate-200">{ch.title}</p>
                      <p className="text-[10px] text-slate-400">{ch.date}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
