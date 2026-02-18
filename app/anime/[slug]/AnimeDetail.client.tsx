"use client"

import AnimeDetailPage from "@/components/AnimeDetailPage"

export default function AnimeDetailClient({ slug }: { slug: string }) {
  return <AnimeDetailPage slug={slug} />
}
