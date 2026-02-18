import type { Metadata } from "next"
import AnimeClientPage from "./AnimeClientPage"

interface Props {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params

  try {
    const res = await fetch(
      `https://api.ammaricano.my.id/api/otakudesu/detail/${encodeURIComponent(slug)}`,
      { cache: "no-store" }
    )

    const json = await res.json()
    const anime = json?.result

    if (!anime) {
      return {
        title: "Anime not found - Arnime",
        description: "Anime tidak ditemukan di Arnime",
      }
    }

    const title = `${anime.title} Sub Indo - Arnime`
    const description =
      anime.synopsis?.replace(/\s+/g, " ").slice(0, 160) ||
      `Nonton anime ${anime.title} sub indo terbaru di Arnime`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "video.tv_show",
        siteName: "Arnime",
        images: [
          {
            url: anime.poster,
            width: 1200,
            height: 630,
            alt: anime.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [anime.poster],
      },
    }
  } catch {
    return {
      title: "Arnime - Anime Detail",
      description: "Detail anime terbaru di Arnime",
    }
  }
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  return <AnimeClientPage slug={slug} />
}