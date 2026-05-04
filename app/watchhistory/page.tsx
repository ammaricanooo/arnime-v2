"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from "firebase/firestore"
import useAuth from "@/lib/useAuth"
import ContentGrid from "@/components/ContentGrid"
import ComicContentGrid from "@/components/ComicContentGrid"
import PageHeader from "@/components/ui/PageHeader"
import EmptyState from "@/components/ui/EmptyState"
import { Loader2 } from "lucide-react"
import type { AnimeItem, Comic } from "@/lib/types"

interface RawHistory {
  userId: string
  slug: string           // for anime: anime slug; for comic: chapter slug
  comicSlug?: string     // only for comic chapters
  title?: string
  poster?: string
  lastEpisodeName?: string
  lastEpisodeSlug?: string
  type?: string
  lastWatched: string
  id: string
}

// For comic history display we group by comicSlug and show the latest chapter
interface ComicHistoryEntry {
  comicSlug: string
  title: string
  poster: string
  lastChapterSlug: string
  lastChapterName: string
  lastWatched: string
  docIds: string[]  // all doc IDs for this comic (to delete all)
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth()
  const [animes, setAnimes] = useState<AnimeItem[]>([])
  const [comicEntries, setComicEntries] = useState<ComicHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !user) { setLoading(false); return }

    setLoading(true)
    getDocs(
      query(
        collection(db, "history"),
        where("userId", "==", user.uid),
        orderBy("lastWatched", "desc")
      )
    )
      .then((snap) => {
        const all = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as RawHistory)

        // Anime history (type !== 'comic')
        setAnimes(
          all
            .filter((h) => h.type !== "comic")
            .map((h) => ({
              title: h.title ?? "",
              slug: h.slug,
              poster: h.poster ?? "",
              newest_release_date: "",
              lastEpisodeName: h.lastEpisodeName,
              lastEpisodeSlug: h.lastEpisodeSlug,
            }))
        )

        // Comic history — group by comicSlug, keep latest chapter per comic
        const comicRaw = all.filter((h) => h.type === "comic")
        const grouped = new Map<string, ComicHistoryEntry>()
        for (const h of comicRaw) {
          const cSlug = h.comicSlug ?? h.slug  // fallback for old records
          if (!grouped.has(cSlug)) {
            grouped.set(cSlug, {
              comicSlug: cSlug,
              title: h.title ?? 'Comic',
              poster: h.poster ?? '',
              lastChapterSlug: h.slug,
              lastChapterName: h.lastEpisodeName ?? h.slug,
              lastWatched: h.lastWatched,
              docIds: [h.id],
            })
          } else {
            grouped.get(cSlug)!.docIds.push(h.id)
          }
        }
        setComicEntries(Array.from(grouped.values()))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, authLoading])

  const removeAnime = async (slug: string) => {
    if (!user) return
    await deleteDoc(doc(db, "history", `${user.uid}_${slug}`)).catch(() => {})
    setAnimes((prev) => prev.filter((a) => a.slug !== slug))
  }

  // Remove all chapter history docs for a comic
  const removeComic = async (comicSlug: string) => {
    if (!user) return
    const entry = comicEntries.find((e) => e.comicSlug === comicSlug)
    if (!entry) return
    await Promise.all(entry.docIds.map((id) => deleteDoc(doc(db, "history", id)).catch(() => {}))).catch(() => {})
    setComicEntries((prev) => prev.filter((e) => e.comicSlug !== comicSlug))
  }

  // Convert comic entries to Comic[] for the grid
  const comicGridItems: Comic[] = comicEntries.map((e) => ({
    title: e.title,
    link: `https://komiku.org/manga/${e.comicSlug}/`,
    image: e.poster,
    thumb: e.poster,
    chapter: e.lastChapterName,
    latest_chapter: e.lastChapterName,
  }))

  if (authLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>

  if (!user) return (
    <EmptyState
      image="/Forbidden.png"
      title="Watch History"
      description="Please sign in to see your watch history."
    />
  )

  return (
    <div>
      <PageHeader title="Watch History" description="Your recently watched anime and comics" />

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-indigo-600" /></div>
      ) : animes.length === 0 && comicEntries.length === 0 ? (
        <EmptyState image="/NotFound.png" description="Your watch history is empty." />
      ) : (
        <div className="space-y-10">
          {animes.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Anime</h2>
              <ContentGrid
                animes={animes}
                onLike={removeAnime}
                likedAnimes={animes.map((a) => a.slug)}
                type="ongoing"
                hasMore={false}
                variant="history"
              />
            </section>
          )}
          {comicEntries.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Comics</h2>
              <ComicContentGrid
                comics={comicGridItems}
                onLike={(slug) => {
                  // slug here is the comic slug extracted from the link
                  removeComic(slug)
                }}
                likedComics={comicGridItems.map((c) => c.link.split('/').filter(Boolean).pop() ?? '')}
                hasMore={false}
                variant="history"
              />
            </section>
          )}
        </div>
      )}
    </div>
  )
}
