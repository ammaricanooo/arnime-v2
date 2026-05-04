"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import ContentGrid from "@/components/ContentGrid"
import ComicContentGrid from "@/components/ComicContentGrid"
import PageHeader from "@/components/ui/PageHeader"
import EmptyState from "@/components/ui/EmptyState"
import { fetchJson } from "@/lib/fetchJson"
import { API } from "@/lib/constants"
import type { AnimeItem, Comic } from "@/lib/types"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const q = searchParams?.get("q") ?? ""

  const [animes, setAnimes] = useState<AnimeItem[]>([])
  const [comics, setComics] = useState<Comic[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const search = useCallback(async () => {
    if (!q.trim()) { setAnimes([]); setComics([]); setSearched(false); return }

    setLoading(true)
    setSearched(true)

    const [otaku, animasu, komiku] = await Promise.allSettled([
      fetchJson<{ result: AnimeItem[] }>(API.otakudesu.search(q)),
      fetchJson<{ result: Array<{ title: string; slug: string; thumb: string; episode?: string }> }>(
        API.animasu.search(q)
      ),
      fetchJson<{ result: Array<{ title: string; link: string; thumb: string; type?: string; latest_chapter?: string; description?: string }> }>(
        API.komiku.search(q)
      ),
    ])

    const otakuResults: AnimeItem[] =
      otaku.status === "fulfilled" ? otaku.value?.result ?? [] : []

    const animasuResults: AnimeItem[] =
      animasu.status === "fulfilled"
        ? (animasu.value?.result ?? []).map((item) => ({
            title: item.title,
            slug: item.slug,
            poster: item.thumb,
            total_episode: item.episode,
            newest_release_date: "",
            source: "animasu" as const,
          }))
        : []

    const comicResults: Comic[] =
      komiku.status === "fulfilled"
        ? (komiku.value?.result ?? []).map((item) => ({
            title: item.title,
            link: item.link,
            thumb: item.thumb,
            image: item.thumb,
            genre: item.type,
            latest_chapter: item.latest_chapter,
            description: item.description,
          }))
        : []

    setAnimes([...otakuResults, ...animasuResults])
    setComics(comicResults)
    setLoading(false)
  }, [q])

  useEffect(() => { search() }, [search])

  const total = animes.length + comics.length

  return (
    <>
      <PageHeader
        title={q ? `Results for "${q}"` : "Search"}
        description={
          loading
            ? "Searching..."
            : searched
            ? total > 0
              ? `Found ${animes.length} anime and ${comics.length} comic`
              : "No results found"
            : "Enter a title to search"
        }
      />

      <ContentGrid
        animes={animes}
        onLike={() => {}}
        likedAnimes={[]}
        type="complete"
        loading={loading}
        hasMore={false}
      />

      {comics.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Comics</h2>
          <ComicContentGrid comics={comics} hasMore={false} />
        </section>
      )}

      {searched && !loading && total === 0 && (
        <EmptyState
          image="/NotFound.png"
          description={`No results for "${q}". Try different keywords.`}
        />
      )}

      {!searched && !loading && (
        <div className="text-center py-20 text-slate-400 text-sm">
          Use the search bar above to find anime or comics
        </div>
      )}
    </>
  )
}
