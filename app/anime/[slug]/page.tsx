import type { Metadata } from "next"
import AnimeDetailClient from "./AnimeDetail.client"

interface Props {
  params: Promise<{
    slug: string
  }>
}

/* =========================
   🔥 DYNAMIC META TAG (FIXED)
========================= */
export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params   // ✅ WAJIB await

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

/* =========================
   SERVER PAGE
========================= */
export default async function Page({ params }: Props) {
  const { slug } = await params   // ✅ WAJIB await
  return <AnimeDetailClient slug={slug} />
}
