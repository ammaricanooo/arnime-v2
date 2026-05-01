"use client"
import { useParams, notFound } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, BookOpen, Calendar, User, Layers, Heart, Share2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore"
import useAuth from "@/lib/useAuth"
import Swal from "sweetalert2"

// --- Skeleton Component ---
const ComicSkeleton = () => (
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

interface Chapter {
  title: string
  url: string
  date: string
  views: number
}

interface ComicDetail {
  title: string
  alt_title?: string
  thumbnail: string
  description: string
  author: string
  status: string
  type: string
  genres: string[]
  chapters: Chapter[]
  link: string
}

export default function ComicDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug
  const router = useRouter()
  const { user } = useAuth()
  const [comic, setComic] = useState<ComicDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)

  useEffect(() => {
    if (!slug) return
    async function fetchDetail() {
      setLoading(true)
      setError(null)
      try {
        const comicUrl = `https://komiku.org/manga/${slug}/`
        const res = await fetch(`https://api.ammaricano.my.id/api/komiku/detail?url=${encodeURIComponent(comicUrl)}`)
        const json = await res.json()
        if (json.success && json.result) {
          setComic(json.result)
        } else {
          setError('Failed to load comic detail')
        }
      } catch (err) {
        setError('Failed to load comic detail')
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
        text: "You need to login first to save your favorite comic!"
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
          title: comic?.title,
          poster: comic?.thumbnail,
          type: "comic",
          createdAt: new Date().toISOString()
        })
        setIsLiked(true)
      }
    } finally {
      setLikeLoading(false)
    }
  }

  // 4. Handle Share
  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: comic?.title, url })
    } else {
      await navigator.clipboard.writeText(url)
      Swal.fire({ icon: "success", title: "Link Disalin!", timer: 1000, showConfirmButton: false })
    }
  }

  // 5. Handle Read Chapter & History
  const handleReadChapter = async (chapterSlug: string, chapterTitle: string) => {
    if (user && comic) {
      try {
        await setDoc(doc(db, "history", `${user.uid}_${slug}`), {
          userId: user.uid,
          slug,
          title: comic.title,
          poster: comic.thumbnail,
          lastEpisodeName: chapterTitle,
          lastEpisodeSlug: chapterSlug,
          type: "comic",
          lastWatched: new Date().toISOString(),
        }, { merge: true })
      } catch (err) {
        console.error("Gagal simpan history:", err)
      }
    }
    router.push(`/comic/${slug}/chapter/${chapterSlug}`)
  }

  if (!slug) return notFound()

  if (loading) return <ComicSkeleton />

  if (error || !comic) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
      <h2 className="text-xl font-bold mb-4">{error || "Comic Not Found"}</h2>
      <button onClick={() => router.back()} className="text-indigo-600 font-semibold border border-indigo-600 px-6 py-2 rounded-full hover:bg-indigo-600 hover:text-white transition-all">Kembali</button>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20">
      {/* Tombol Kembali */}
      <div className="flex items-center justify-between py-6">
        <button
          onClick={() => router.push(`/comic`)}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all group mb-8"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="tracking-tighter">Back</span>
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
        <div className="absolute inset-x-0 top-0 h-[450px] md:h-[550px] z-0 overflow-hidden pointer-events-none [mask-image:linear-gradient(to_bottom,black_0%,transparent_80%)]">
            <div className="absolute inset-0 opacity-50 dark:opacity-40">
                <img src={comic.thumbnail} alt="" className="w-full h-full object-cover blur-3xl scale-110 saturate-150" />
            </div>
        </div>
        <div className="md:col-span-4 lg:col-span-3">
          <div className="sticky top-24">
            <img src={comic.thumbnail} alt={comic.title} className="w-full rounded-2xl shadow-2xl object-cover aspect-3/4" />
          </div>
        </div>

        {/* Kolom Info Content */}
        <div className="md:col-span-8 lg:col-span-9 space-y-8">
          <div className="space-y-4">
            <div className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider">
              {comic.type} • {comic.status}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-slate-900 dark:text-white">{comic.title}</h1>
            {comic.alt_title && <p className="text-lg text-slate-500">{comic.alt_title}</p>}

            <div className="flex flex-wrap gap-6 text-sm font-medium">
              <div className="flex items-center gap-2 text-slate-400"><User className="w-5 h-5 text-slate-400" /> <span className="text-base">{comic.author || "-"}</span></div>
              <div className="flex items-center gap-2 text-slate-400 border-l border-slate-700 pl-6"><Calendar className="w-5 h-5" /> {comic.status}</div>
              <div className="flex items-center gap-2 text-slate-400 border-l border-slate-700 pl-6"><Layers className="w-5 h-5" /> {comic.type}</div>
            </div>
          </div>

          {/* Info Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="col-span-2"><p className="text-xs text-slate-500 font-bold uppercase mb-1">Genre</p>
              <div className="flex flex-wrap gap-1">{comic.genres?.map(g => <span key={g} className="text-[10px] bg-white dark:bg-slate-800 dark:text-white px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700">{g.trim()}</span>)}</div>
            </div>
          </div>

          {/* Sinopsis */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold flex items-center gap-2 dark:text-white"><div className="w-1 h-5 bg-indigo-600 rounded-full" /> Sinopsis</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{comic.description}</p>
          </div>

          {/* Daftar Chapter */}
          <div className="space-y-4 pt-4">
            <h3 className="text-xl font-bold flex items-center gap-2 dark:text-white"><BookOpen className="w-6 h-6 text-indigo-500" /> Daftar Chapter</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {comic.chapters.slice().reverse().map((ch, idx) => {
                const chapterSlug = ch.url.split('/').filter(Boolean).pop() || ''
                return (
                  <button
                    key={ch.url}
                    onClick={() => handleReadChapter(chapterSlug, ch.title)}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group text-left"
                  >
                    <BookOpen className="w-8 h-8 text-slate-300 group-hover:text-indigo-600 transition-colors shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-400 uppercase">Ch. {idx + 1}</p>
                      <p className="text-sm font-semibold truncate text-slate-700 dark:text-slate-200">{ch.title}</p>
                      <p className="text-xs text-slate-400">{ch.date}</p>
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
