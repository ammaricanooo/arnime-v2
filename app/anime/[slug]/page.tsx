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

  // Fetch for structured data
  let structuredData: object | null = null
  try {
    const res = await fetch(
      `https://api.ammaricano.my.id/api/otakudesu/detail/${encodeURIComponent(slug)}`,
      { cache: 'no-store' }
    )
    const json = await res.json()
    const anime = json?.result
    if (anime) {
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'TVSeries',
        name: anime.title,
        description: anime.synopsis?.slice(0, 300),
        image: anime.poster,
        genre: anime.genre?.split(',').map((g: string) => g.trim()),
        numberOfEpisodes: anime.total_episode,
        productionCompany: anime.studio ? { '@type': 'Organization', name: anime.studio } : undefined,
        datePublished: anime.release_date,
        aggregateRating: anime.score
          ? { '@type': 'AggregateRating', ratingValue: anime.score, bestRating: '10' }
          : undefined,
      }
    }
  } catch {
    // structured data is non-critical
  }

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      <AnimeClientPage slug={slug} />
    </>
  )
}