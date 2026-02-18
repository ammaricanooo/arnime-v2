import type { Metadata } from "next";
import WatchClientPage from "./WatchClientPage";

interface Props {
  params: Promise<{
    slug: string;
    episode: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { episode } = await params;

  try {
    const res = await fetch(
      `https://api.ammaricano.my.id/api/otakudesu/episode/${encodeURIComponent(episode)}`,
      { next: { revalidate: 3600 } } // Cache 1 jam lebih baik untuk SEO & Performance
    );
    const json = await res.json();
    const ep = json?.result;

    if (!ep) {
      return {
        title: "Episode Not Found - Arnime",
      };
    }

    const title = `Nonton ${ep.title} Sub Indo - Arnime`;
    return {
      title,
      description: `Nonton streaming anime ${ep.title} subtitle Indonesia kualitas HD gratis di Arnime.`,
      openGraph: {
        title,
        type: "video.episode",
        images: [ep.thumbnail || ""],
      },
    };
  } catch {
    return { title: "Nonton Anime - Arnime" };
  }
}

export default async function Page({ params }: Props) {
  const { slug, episode } = await params;

  return <WatchClientPage slug={slug} episode={episode} />;
}