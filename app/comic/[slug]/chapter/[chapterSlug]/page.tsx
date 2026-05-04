"use client"

import { useParams, notFound } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useComicGap } from "@/lib/useComicGap"
import useAuth from "@/lib/useAuth"
import { doc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { API } from "@/lib/constants"
import BackButton from "@/components/ui/BackButton"

const ChapterSkeleton = () => (
  <div className="max-w-2xl mx-auto animate-pulse space-y-2 px-0">
    {Array.from({ length: 5 }, (_, i) => (
      <div key={i} className="w-full bg-slate-200 dark:bg-slate-800" style={{ height: `${180 + (i % 3) * 60}px` }} />
    ))}
  </div>
)

interface ChapterData {
  images: string[]
  prev: string | null
  next: string | null
}

export default function ComicChapterPage() {
  const params = useParams<{ slug: string; chapterSlug: string }>()
  const slug = params?.slug
  const chapterSlug = params?.chapterSlug
  const router = useRouter()
  const { user } = useAuth()
  const { comicGap } = useComicGap()
  const [chapter, setChapter] = useState<ChapterData | null>(null)
  const [comicTitle, setComicTitle] = useState('')
  const [comicPoster, setComicPoster] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNav, setShowNav] = useState(false)

  // Show floating nav after scroll
  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return
    const onScroll = () => setShowNav(main.scrollTop > 80)
    onScroll()
    main.addEventListener('scroll', onScroll, { passive: true })
    return () => main.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!slug || !chapterSlug) return

    async function fetchChapter() {
      setLoading(true)
      setError(null)
      try {
        // 1. Get comic detail to find chapter URL
        const detailRes = await fetch(API.komiku.detail(API.komiku.comicUrl(slug!)))
        const detailJson = await detailRes.json()

        let chapterUrl = ''
        if (detailJson.success && detailJson.result) {
          setComicTitle(detailJson.result.title ?? '')
          setComicPoster(detailJson.result.thumbnail ?? '')
          const found = detailJson.result.chapters?.find((ch: { url: string }) => {
            return ch.url.split('/').filter(Boolean).pop() === chapterSlug
          })
          chapterUrl = found?.url ?? ''
        }

        if (!chapterUrl) {
          setError('Chapter not found')
          return
        }

        // 2. Fetch chapter images
        const chRes = await fetch(API.komiku.chapter(chapterUrl))
        const chJson = await chRes.json()

        if (chJson.success && chJson.result) {
          setChapter(chJson.result)

          // 3. Save history — unique per chapter: {uid}_{comicSlug}_{chapterSlug}
          if (user && slug) {
            const historyKey = `${user.uid}_${slug}_${chapterSlug}`
            await setDoc(
              doc(db, 'history', historyKey),
              {
                userId: user.uid,
                comicSlug: slug,
                slug: chapterSlug,           // chapter slug as the "episode"
                title: detailJson.result?.title ?? '',
                poster: detailJson.result?.thumbnail ?? '',
                lastEpisodeName: chapterSlug,
                lastEpisodeSlug: chapterSlug,
                type: 'comic',
                lastWatched: new Date().toISOString(),
              },
              { merge: true }
            ).catch(() => {})
          }
        } else {
          setError('Failed to load chapter')
        }
      } catch {
        setError('Failed to load chapter')
      } finally {
        setLoading(false)
      }
    }

    fetchChapter()
  }, [slug, chapterSlug, user])

  if (!slug || !chapterSlug) return notFound()
  if (loading) return <ChapterSkeleton />
  if (error || !chapter) return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center gap-4 p-4">
      <p className="text-slate-600 dark:text-slate-400 font-medium">{error ?? 'Chapter not found'}</p>
      <BackButton href={`/comic/${slug}`} label="Back to Comic" />
    </div>
  )

  const navigate = (url: string | null) => {
    if (!url) return
    const nextSlug = url.split('/').filter(Boolean).pop() ?? ''
    router.push(`/comic/${slug}/chapter/${nextSlug}`)
  }

  return (
    <div className="relative max-w-2xl pb-24 -mx-3 md:mx-auto">
      {/* Top nav */}
      <div className="flex items-center justify-between px-3 pb-4 gap-3">
        <BackButton href={`/comic/${slug}`} label="Back" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(chapter.prev)}
            disabled={!chapter.prev}
            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous chapter"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate(chapter.next)}
            disabled={!chapter.next}
            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next chapter"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chapter images */}
      <div className={comicGap ? 'space-y-2' : ''}>
        {chapter.images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`Page ${i + 1}`}
            className="w-full block"
            loading="lazy"
          />
        ))}
      </div>

      {/* Floating bottom nav — appears after scroll */}
      <div
        className={`fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm transition-all duration-300 ${
          showNav ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between gap-2 p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl">
          <button
            onClick={() => navigate(chapter.prev)}
            disabled={!chapter.prev}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white rounded-xl transition-all disabled:opacity-25"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>

          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Chapter</p>
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {chapterSlug.split('-').pop()}
            </p>
          </div>

          <button
            onClick={() => navigate(chapter.next)}
            disabled={!chapter.next}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white rounded-xl transition-all disabled:opacity-25"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
