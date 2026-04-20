"use client"
import { useParams, notFound } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc, setDoc } from "firebase/firestore"
import useAuth from "@/lib/useAuth"

// --- Skeleton Component ---
const ChapterSkeleton = () => (
  <div className="max-w-4xl mx-auto px-4 animate-pulse">
    <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg my-6" />
    <div className="space-y-4">
      <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
    </div>
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
  const [chapter, setChapter] = useState<ChapterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug || !chapterSlug) return
    async function fetchChapter() {
      setLoading(true)
      setError(null)
      try {
        // First, fetch comic detail to get chapter URL
        const apis = [
          'https://api.ammaricano.my.id/api/komiku/hot?page=1',
          'https://api.ammaricano.my.id/api/komiku/latest?page=1',
        ]
        let chapterUrl = ''
        for (const api of apis) {
          const res = await fetch(api)
          const json = await res.json()
          if (json.success && Array.isArray(json.result)) {
            const found = json.result.find((c: any) => {
              const urlSlug = c.link.split('/').filter(Boolean).pop()
              return urlSlug === slug
            })
            if (found) {
              // Fetch full detail to get chapters
              const detailRes = await fetch(`https://api.ammaricano.my.id/api/komiku/detail?url=${encodeURIComponent(found.link)}`)
              const detailJson = await detailRes.json()
              if (detailJson.success && detailJson.result) {
                const chapter = detailJson.result.chapters.find((ch: any) => {
                  const chSlug = ch.url.split('/').filter(Boolean).pop()
                  return chSlug === chapterSlug
                })
                if (chapter) {
                  chapterUrl = chapter.url
                  break
                }
              }
            }
          }
        }
        if (!chapterUrl) {
          setError('Chapter not found')
          setLoading(false)
          return
        }
        // Now fetch chapter images
        const res = await fetch(`https://api.ammaricano.my.id/api/komiku/detail/chapter?url=${encodeURIComponent(chapterUrl)}`)
        const json = await res.json()
        if (json.success && json.result) {
          setChapter(json.result)
          // Save to history
          if (user && slug) {
            try {
              await setDoc(doc(db, "history", `${user.uid}_${slug}`), {
                userId: user.uid,
                slug,
                title: "Comic Chapter", // We don't have comic title here, maybe fetch from detail
                poster: "", // No poster for chapter
                lastEpisodeName: chapterSlug,
                lastEpisodeSlug: chapterSlug,
                type: "comic",
                lastWatched: new Date().toISOString(),
              }, { merge: true })
            } catch (err) {
              console.error("Gagal simpan history:", err)
            }
          }
        } else {
          setError('Failed to load chapter')
        }
      } catch (err) {
        setError('Failed to load chapter')
      } finally {
        setLoading(false)
      }
    }
    fetchChapter()
  }, [slug, chapterSlug])

  if (!slug || !chapterSlug) return notFound()

  if (loading) return <ChapterSkeleton />

  if (error || !chapter) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
      <h2 className="text-xl font-bold mb-4">{error || "Chapter Not Found"}</h2>
      <button onClick={() => router.back()} className="text-indigo-600 font-semibold border border-indigo-600 px-6 py-2 rounded-full hover:bg-indigo-600 hover:text-white transition-all">Kembali</button>
    </div>
  )

  const handlePrev = () => {
    if (chapter.prev) {
      const prevSlug = chapter.prev.split('/').filter(Boolean).pop() || ''
      router.push(`/comic/${slug}/chapter/${prevSlug}`)
    }
  }

  const handleNext = () => {
    if (chapter.next) {
      const nextSlug = chapter.next.split('/').filter(Boolean).pop() || ''
      router.push(`/comic/${slug}/chapter/${nextSlug}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between py-6">
        <button
          onClick={() => router.push(`/comic/${slug}`)}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="tracking-tighter">Kembali ke Detail Komik</span>
        </button>
        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            disabled={!chapter.prev}
            className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-400 hover:text-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            disabled={!chapter.next}
            className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-400 hover:text-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Images */}
      <div className="space-y-4">
        {chapter.images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`Page ${idx + 1}`}
            className="w-full rounded-2xl shadow-lg"
            loading="lazy"
          />
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-between items-center mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={handlePrev}
          disabled={!chapter.prev}
          className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          <ChevronLeft className="w-5 h-5" />
          Chapter Sebelumnya
        </button>
        <button
          onClick={handleNext}
          disabled={!chapter.next}
          className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          Chapter Selanjutnya
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}