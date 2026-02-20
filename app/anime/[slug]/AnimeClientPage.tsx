"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Heart, Share2, Loader2, Star, PlayCircle, Clock, Tv, Calendar } from "lucide-react"
import { useState, useEffect } from "react"
import { db } from "@/lib/firebase"
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore"
import useAuth from "@/lib/useAuth"
import Swal from "sweetalert2"

// --- Skeleton Component ---
const Skeleton = () => (
  <div className="max-w-7xl mx-auto px-4 animate-pulse">
    <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg my-6" />
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
      <div className="md:col-span-4 lg:col-span-3">
        <div className="aspect-3/4 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
      <div className="md:col-span-8 lg:col-span-9 space-y-6">
        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
        <div className="h-12 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-6 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-24 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>
    </div>
  </div>
)

interface EpisodeItem {
  episode: string
  slug: string
}

interface DetailResult {
  poster?: string
  title?: string
  japanese?: string
  score?: string
  tipe?: string
  status?: string
  total_episode?: string
  duration?: string
  release_date?: string
  studio?: string
  genre?: string
  synopsis?: string
  episodes?: EpisodeItem[]
  batch?: EpisodeItem[]
  lengkap?: EpisodeItem[]
}

export default function AnimeDetailPage({ slug }: { slug: string }) {
  const { user } = useAuth()
  const router = useRouter()
  const [detail, setDetail] = useState<DetailResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)

  // 1. Fetch Detail Data
  useEffect(() => {
    if (!slug) return
    const fetchDetail = async () => {
      setLoading(true)
      try {
        const { fetchJson } = await import("../../../lib/fetchJson")
        const json = await fetchJson(`https://api.ammaricano.my.id/api/otakudesu/detail/${encodeURIComponent(slug)}`)
        if (json?.result) setDetail(json.result)
        else setError("Anime tidak ditemukan")
      } catch (err: any) {
        setError(err?.message || "Gagal memuat detail")
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [slug])

  // 2. Check Bookmark Status
  useEffect(() => {
    if (!user?.uid || !slug) return
    const checkLikeStatus = async () => {
      const docRef = doc(db, "bookmarks", `${user.uid}_${slug}`)
      const snap = await getDoc(docRef)
      setIsLiked(snap.exists())
    }
    checkLikeStatus()
  }, [user, slug])

  // 3. Handle Bookmark Toggle
  const handleToggleLike = async () => {
    if (!user) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "You need to login first to save your favorite anime!"
      });
      return
    }
    setLikeLoading(true)
    const ref = doc(db, "bookmarks", `${user.uid}_${slug}`)
    try {
      if (isLiked) {
        await deleteDoc(ref)
        setIsLiked(false)
      } else {
        await setDoc(ref, {
          userId: user.uid,
          slug,
          title: detail?.title,
          poster: detail?.poster,
          type: detail?.status === "Completed" ? "complete" : "ongoing",
          createdAt: new Date().toISOString()
        })
        setIsLiked(true)
      }
    } finally {
      setLikeLoading(false)
    }
  }

  // 4. Handle Watch & History (Perbaikan Error 'handleWatchEpisode')
  const handleWatchEpisode = async (epSlug: string, epTitle: string) => {
    const targetUrl = `/anime/${encodeURIComponent(slug)}/watch/${encodeURIComponent(epSlug)}`

    if (user && detail) {
      try {
        await setDoc(doc(db, "history", `${user.uid}_${slug}`), {
          userId: user.uid,
          slug,
          title: detail.title,
          poster: detail.poster,
          lastEpisodeName: epTitle,
          lastEpisodeSlug: epSlug,
          lastWatched: new Date().toISOString(),
        }, { merge: true })
      } catch (err) {
        console.error("Gagal simpan history:", err)
      }
    }
    router.push(targetUrl)
  }
  const handleBatchEpisode = async (batchSlug: string, batchTitle: string) => {
    const targetUrl = `/anime/${encodeURIComponent(slug)}/batch/${encodeURIComponent(batchSlug)}`

    if (user && detail) {
      try {
        await setDoc(doc(db, "history", `${user.uid}_${slug}`), {
          userId: user.uid,
          slug,
          title: detail.title,
          poster: detail.poster,
          lastEpisodeName: batchTitle,
          lastEpisodeSlug: batchSlug,
          lastWatched: new Date().toISOString(),
        }, { merge: true })
      } catch (err) {
        console.error("Gagal simpan history:", err)
      }
    }
    router.push(targetUrl)
  }

  const handleFullEpisode = async (fullSlug: string, fullTitle: string) => {
    const targetUrl = `/anime/${encodeURIComponent(slug)}/full/${encodeURIComponent(fullSlug)}`

    if (user && detail) {
      try {
        await setDoc(doc(db, "history", `${user.uid}_${slug}`), {
          userId: user.uid,
          slug,
          title: detail.title,
          poster: detail.poster,
          lastEpisodeName: fullTitle,
          lastEpisodeSlug: fullSlug,
          lastWatched: new Date().toISOString(),
        }, { merge: true })
      } catch (err) {
        console.error("Gagal simpan history:", err)
      }
    }
    router.push(targetUrl)
  }

  // 5. Handle Share
  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: detail?.title, url })
    } else {
      await navigator.clipboard.writeText(url)
      Swal.fire({ icon: "success", title: "Link Disalin!", timer: 1000, showConfirmButton: false })
    }
  }

  if (loading) return <Skeleton />

  if (error || !detail) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
      <h2 className="text-xl font-bold mb-4">{error || "Anime Not Found"}</h2>
      <button onClick={() => router.back()} className="text-indigo-600 font-semibold border border-indigo-600 px-6 py-2 rounded-full hover:bg-indigo-600 hover:text-white transition-all">Kembali</button>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20">
      {/* Tombol Kembali & Aksi */}
      <div className="flex items-center justify-between py-6">
        <button
          onClick={() => router.push(`/`)}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all group mb-8"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="uppercase italic tracking-tighter">Back to List Anime</span>
        </button>
        <div className="flex gap-2">
          <button onClick={handleToggleLike} disabled={likeLoading} className={`p-3 rounded-full shadow-sm transition-all ${isLiked ? "bg-red-50 text-red-600" : "bg-white dark:bg-slate-800 text-slate-400"}`}>
            {likeLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Heart className={`w-6 h-6 ${isLiked ? "fill-current" : ""}`} />}
          </button>
          <button onClick={handleShare} className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-400 hover:text-indigo-500 transition-all">
            <Share2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
        {/* Kolom Poster */}
        <div className="md:col-span-4 lg:col-span-3">
          <div className="sticky top-24">
            <img src={detail.poster} alt={detail.title} className="w-full rounded-2xl shadow-2xl object-cover aspect-3/4" />
          </div>
        </div>

        {/* Kolom Info Content */}
        <div className="md:col-span-8 lg:col-span-9 space-y-8">
          <div className="space-y-4">
            <div className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider">
              {detail.tipe} • {detail.status}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-slate-900 dark:text-white">{detail.title}</h1>
            <p className="text-lg text-slate-500 italic">{detail.japanese}</p>

            <div className="flex flex-wrap gap-6 text-sm font-medium">
              <div className="flex items-center gap-1"><Star className="w-5 h-5 text-yellow-500 fill-current" /> <span className="text-lg">{detail.score || "N/A"}</span></div>
              <div className="flex items-center gap-2 text-slate-400 border-l border-slate-700 pl-6"><Tv className="w-5 h-5" /> {detail.total_episode} Eps</div>
              <div className="flex items-center gap-2 text-slate-400 border-l border-slate-700 pl-6"><Clock className="w-5 h-5" /> {detail.duration}</div>
            </div>
          </div>

          {/* Info Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div><p className="text-xs text-slate-500 font-bold uppercase mb-1">Studio</p><p className="text-sm font-semibold">{detail.studio || "-"}</p></div>
            <div><p className="text-xs text-slate-500 font-bold uppercase mb-1">Rilis</p><p className="text-sm font-semibold">{detail.release_date || "-"}</p></div>
            <div className="col-span-2"><p className="text-xs text-slate-500 font-bold uppercase mb-1">Genre</p>
              <div className="flex flex-wrap gap-1">{detail.genre?.split(',').map(g => <span key={g} className="text-[10px] bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700">{g.trim()}</span>)}</div>
            </div>
          </div>

          {/* Sinopsis */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold flex items-center gap-2"><div className="w-1 h-5 bg-indigo-600 rounded-full" /> Sinopsis</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{detail.synopsis}</p>
          </div>

          {/* Episode List */}
          <div className="space-y-4 pt-4">
            <h3 className="text-xl font-bold">Daftar Episode</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {detail.episodes?.map((ep, idx) => (
                <button
                  key={ep.slug}
                  onClick={() => handleWatchEpisode(ep.slug, ep.episode)}
                  className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group text-left"
                >
                  <PlayCircle className="w-8 h-8 text-slate-300 group-hover:text-indigo-600 transition-colors shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-400 uppercase">Eps {idx + 1}</p>
                    <p className="text-sm font-semibold truncate text-slate-700 dark:text-slate-200">{ep.episode}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          {/* Batch */}
          {detail.batch && detail.batch.length > 0 && (
            <div className="space-y-4 pt-4">
              <h3 className="text-xl font-bold">Batch</h3>
              <div className="grid grid-cols-1 w-full">
                {detail.batch?.map((batch, idx) => (
                  <button
                    key={batch.slug}
                    onClick={() => handleBatchEpisode(batch.slug, batch.episode)}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group text-left"
                  >
                    <PlayCircle className="w-8 h-8 text-slate-300 group-hover:text-indigo-600 transition-colors shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-slate-700 dark:text-slate-200">{batch.episode}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Lengkap */}
          {detail.lengkap && detail.lengkap.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Full</h3>
              </div>
              <div className="grid grid-cols-1 w-full">
                {detail.lengkap?.map((full, idx) => (
                  <button
                    key={full.slug}
                    onClick={() => handleFullEpisode(full.slug, full.episode)}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group text-left"
                  >
                    <PlayCircle className="w-8 h-8 text-slate-300 group-hover:text-indigo-600 transition-colors shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-slate-700 dark:text-slate-200">{full.episode}</p>
                    </div>
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