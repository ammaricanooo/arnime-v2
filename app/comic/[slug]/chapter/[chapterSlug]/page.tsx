"use client"
import { useParams, notFound } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useComicGap } from "@/lib/useComicGap"
import useAuth from "@/lib/useAuth";
import { doc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

// --- Skeleton Component ---
const ChapterSkeleton = () => (
  <div className="max-w-4xl mx-auto px-4 animate-pulse">
    <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg my-6" />
    <div>
      <div className="h-64 bg-slate-200 dark:bg-slate-800" />
      <div className="h-64 bg-slate-200 dark:bg-slate-800" />
      <div className="h-64 bg-slate-200 dark:bg-slate-800" />
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
  const { comicGap } = useComicGap()
  const [chapter, setChapter] = useState<ChapterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
const scrollContainerRef = useRef<HTMLDivElement>(null); // Tambahkan ini
  const [showNav, setShowNav] = useState(false);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Sekarang kita cek scrollTop dari elemen tersebut
      if (container.scrollTop > 50) {
        setShowNav(true);
      } else {
        setShowNav(false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!slug || !chapterSlug) return
    async function fetchChapter() {
      setLoading(true)
      setError(null)
      try {
        const comicUrl = `https://komiku.org/manga/${slug}/`
        const detailRes = await fetch(`https://api.ammaricano.my.id/api/komiku/detail?url=${encodeURIComponent(comicUrl)}`)
        const detailJson = await detailRes.json()
        let chapterUrl = ''

        if (detailJson.success && detailJson.result) {
          const foundChapter = detailJson.result.chapters.find((ch: any) => {
            const chSlug = ch.url.split('/').filter(Boolean).pop()
            return chSlug === chapterSlug
          })
          chapterUrl = foundChapter?.url || ''
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
    <div className="max-w-4xl pb-20 -mx-4 md:mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-6">
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
      <div className={comicGap ? 'space-y-4' : ''}>
        {chapter.images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`Page ${idx + 1}`}
            className="w-full"
            loading="lazy"
          />
        ))}
      </div>

      <div ref={scrollContainerRef}
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md transition-all duration-500 ease-in-out ${showNav
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-10 pointer-events-none'
          }`}
      >
        <div className="flex items-center justify-between p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <button
            onClick={handlePrev}
            disabled={!chapter.prev}
            className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white rounded-xl transition-all disabled:opacity-20 font-bold text-sm"
          >
            <ChevronLeft className="w-5 h-5" />
            Prev
          </button>

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Chapter</span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 italic lowercase tracking-tighter">
              {chapterSlug.split('-').pop()}
            </span>
          </div>

          <button
            onClick={handleNext}
            disabled={!chapter.next}
            className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white rounded-xl transition-all disabled:opacity-20 font-bold text-sm"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}