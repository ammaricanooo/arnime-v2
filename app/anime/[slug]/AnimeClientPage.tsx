"use client"

import { useRouter } from "next/navigation"
import { Heart, Share2, Loader2, Star, PlayCircle, Clock, Tv } from "lucide-react"
import { useState, useEffect } from "react"
import useAuth from "@/lib/useAuth"
import { useBookmarkToggle, saveHistory } from "@/lib/useBookmark"
import BackButton from "@/components/ui/BackButton"
import { fetchJson } from "@/lib/fetchJson"
import { API } from "@/lib/constants"
import type { AnimeDetail } from "@/lib/types"
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

export default function AnimeClientPage({ slug }: { slug: string }) {
  const { user } = useAuth()
  const router = useRouter()
  const [detail, setDetail] = useState<AnimeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { isLiked, loading: likeLoading, toggle } = useBookmarkToggle(user, slug)

  useEffect(() => {
    fetchJson<{ result: AnimeDetail }>(API.otakudesu.detail(slug))
      .then(({ result }) => setDetail(result ?? null))
      .catch((err) => setError(err?.message ?? "Failed to load"))
      .finally(() => setLoading(false))
  }, [slug])

  const handleToggleLike = () =>
    toggle({
      slug,
      title: detail?.title,
      poster: detail?.poster,
      type: detail?.status === "Completed" ? "complete" : "ongoing",
    })

  const handleWatch = async (epSlug: string, epTitle: string) => {
    if (user && detail) {
      await saveHistory(user.uid, {
        slug,
        title: detail.title,
        poster: detail.poster,
        lastEpisodeName: epTitle,
        lastEpisodeSlug: epSlug,
      }).catch(() => {})
    }
    router.push(`/anime/${slug}/watch/${epSlug}`)
  }

  const handleBatch = async (batchSlug: string, batchTitle: string) => {
    if (user && detail) {
      await saveHistory(user.uid, {
        slug,
        title: detail.title,
        poster: detail.poster,
        lastEpisodeName: batchTitle,
        lastEpisodeSlug: batchSlug,
      }).catch(() => {})
    }
    router.push(`/anime/${slug}/batch/${batchSlug}`)
  }

  const handleFull = async (fullSlug: string, fullTitle: string) => {
    if (user && detail) {
      await saveHistory(user.uid, {
        slug,
        title: detail.title,
        poster: detail.poster,
        lastEpisodeName: fullTitle,
        lastEpisodeSlug: fullSlug,
      }).catch(() => {})
    }
    router.push(`/anime/${slug}/full/${fullSlug}`)
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: detail?.title, url })
    } else {
      await navigator.clipboard.writeText(url)
      Swal.fire({ icon: "success", title: "Link copied!", timer: 1000, showConfirmButton: false })
    }
  }

  if (loading) return <Skeleton />

  if (error || !detail) return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center gap-4">
      <p className="text-slate-600 dark:text-slate-400">{error ?? "Anime not found"}</p>
      <BackButton />
    </div>
  )

  const episodeButtonClass =
    "flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group text-left"

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Blurred background */}
      <div className="absolute inset-x-0 top-0 h-96 z-0 overflow-hidden pointer-events-none mask-[linear-gradient(to_bottom,black_0%,transparent_80%)]">
        <img
          src={detail.poster}
          alt=""
          className="w-full h-full object-cover blur-3xl scale-110 opacity-40 saturate-150"
        />
      </div>

      {/* Top bar */}
      <div className="relative flex items-center justify-between py-5">
        <BackButton href="/" label="Back to Home" />
        <div className="flex gap-2">
          <button
            onClick={handleToggleLike}
            disabled={likeLoading}
            className={`p-2.5 rounded-full border transition-all ${
              isLiked
                ? "bg-red-50 border-red-200 text-red-500 dark:bg-red-900/20 dark:border-red-800"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
            }`}
            aria-label="Toggle favorite"
          >
            {likeLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
            )}
          </button>
          <button
            onClick={handleShare}
            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-400 hover:text-indigo-500 transition-all"
            aria-label="Share"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10">
        {/* Poster */}
        <div className="md:col-span-3">
          <div className="sticky top-20">
            <img
              src={detail.poster}
              alt={detail.title}
              className="w-full rounded-2xl shadow-2xl object-cover aspect-3/4"
            />
          </div>
        </div>

        {/* Info */}
        <div className="md:col-span-9 space-y-6">
          <div>
            <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-semibold uppercase tracking-wide mb-3">
              {detail.tipe} · {detail.status}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight mb-1">
              {detail.title}
            </h1>
            {detail.japanese && (
              <p className="text-slate-400 text-base">{detail.japanese}</p>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Star className="w-4 h-4 text-amber-500 fill-current" />
              <span className="font-semibold">{detail.score ?? "N/A"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Tv className="w-4 h-4" />
              <span>{detail.total_episode} Eps</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Clock className="w-4 h-4" />
              <span>{detail.duration}</span>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Studio</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{detail.studio ?? "—"}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Released</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{detail.release_date ?? "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Genre</p>
              <div className="flex flex-wrap gap-1">
                {detail.genre?.split(",").map((g) => (
                  <span key={g} className="text-[10px] px-2 py-0.5 bg-white dark:bg-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600">
                    {g.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Synopsis */}
          {detail.synopsis && (
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="w-1 h-4 bg-indigo-600 rounded-full inline-block" />
                Synopsis
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{detail.synopsis}</p>
            </div>
          )}

          {/* Episodes */}
          {detail.episodes && detail.episodes.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">Episodes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {detail.episodes.map((ep, idx) => (
                  <button key={ep.slug} onClick={() => handleWatch(ep.slug, ep.episode)} className={episodeButtonClass}>
                    <PlayCircle className="w-7 h-7 text-slate-300 group-hover:text-indigo-600 transition-colors shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Ep {idx + 1}</p>
                      <p className="text-sm font-medium truncate text-slate-700 dark:text-slate-200">{ep.episode}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Batch */}
          {detail.batch && detail.batch.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">Batch</h2>
              <div className="space-y-2">
                {detail.batch.map((b) => (
                  <button key={b.slug} onClick={() => handleBatch(b.slug, b.episode)} className={episodeButtonClass}>
                    <PlayCircle className="w-7 h-7 text-slate-300 group-hover:text-indigo-600 transition-colors shrink-0" />
                    <p className="text-sm font-medium truncate text-slate-700 dark:text-slate-200">{b.episode}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Full/Lengkap */}
          {detail.lengkap && detail.lengkap.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">Full Series</h2>
              <div className="space-y-2">
                {detail.lengkap.map((f) => (
                  <button key={f.slug} onClick={() => handleFull(f.slug, f.episode)} className={episodeButtonClass}>
                    <PlayCircle className="w-7 h-7 text-slate-300 group-hover:text-indigo-600 transition-colors shrink-0" />
                    <p className="text-sm font-medium truncate text-slate-700 dark:text-slate-200">{f.episode}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
