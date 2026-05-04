"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore"
import useAuth from "@/lib/useAuth"
import ContentGrid from "@/components/ContentGrid"
import ComicContentGrid from "@/components/ComicContentGrid"
import PageHeader from "@/components/ui/PageHeader"
import EmptyState from "@/components/ui/EmptyState"
import { Loader2 } from "lucide-react"
import type { AnimeItem, Comic } from "@/lib/types"

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth()
  const [animes, setAnimes] = useState<AnimeItem[]>([])
  const [comics, setComics] = useState<Comic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !user) { setLoading(false); return }

    setLoading(true)
    getDocs(query(collection(db, "bookmarks"), where("userId", "==", user.uid)))
      .then((snap) => {
        const all = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Record<string, unknown> & { id: string })

        setAnimes(
          all
            .filter((item) => item.type !== "comic")
            .map((item) => ({
              title: String(item.title ?? ""),
              slug: String(item.slug ?? ""),
              poster: String(item.poster ?? ""),
              newest_release_date: "",
            }))
        )

        setComics(
          all
            .filter((item) => item.type === "comic")
            .map((item) => ({
              title: String(item.title ?? ""),
              link: `https://komiku.org/manga/${item.slug}/`,
              image: String(item.poster ?? ""),
              thumb: String(item.poster ?? ""),
            }))
        )
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, authLoading])

  const removeAnime = async (slug: string) => {
    if (!user) return
    await deleteDoc(doc(db, "bookmarks", `${user.uid}_${slug}`)).catch(() => {})
    setAnimes((prev) => prev.filter((a) => a.slug !== slug))
  }

  const removeComic = async (slug: string) => {
    if (!user) return
    await deleteDoc(doc(db, "bookmarks", `${user.uid}_${slug}`)).catch(() => {})
    setComics((prev) => prev.filter((c) => c.link.split("/").filter(Boolean).pop() !== slug))
  }

  if (authLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>

  if (!user) return (
    <EmptyState
      image="/Forbidden.png"
      title="My Favorites"
      description="Please sign in to see your favorites."
    />
  )

  return (
    <div>
      <PageHeader
        title="My Favorites"
        description={`${animes.length} anime · ${comics.length} comic`}
      />

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-indigo-600" /></div>
      ) : animes.length === 0 && comics.length === 0 ? (
        <EmptyState image="/NotFound.png" description="No favorites yet. Start adding some!" />
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
              />
            </section>
          )}
          {comics.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Comics</h2>
              <ComicContentGrid
                comics={comics}
                onLike={removeComic}
                likedComics={comics.map((c) => c.link.split("/").filter(Boolean).pop() ?? "")}
                hasMore={false}
              />
            </section>
          )}
        </div>
      )}
    </div>
  )
}
