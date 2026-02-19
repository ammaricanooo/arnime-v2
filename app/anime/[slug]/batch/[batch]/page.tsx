import type { Metadata } from "next";
import BatchClientPage from "./BatchClientPage";

interface Props {
  params: Promise<{ slug: string; batch: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { batch } = await params; // use batch slug for metadata
  try {
    const res = await fetch(
      `https://api.ammaricano.my.id/api/otakudesu/batch/${encodeURIComponent(batch)}`
    );
    const json = await res.json();
    const data = json?.result;

    if (!data) return { title: "Batch Not Found - Arnime" };

    return {
      title: `${data.title} Sub Indo Batch - Arnime`,
      description: `Download ${data.title} subtitle Indonesia batch lengkap kualitas HD gratis di Arnime.`,
    };
  } catch {
    return { title: "Download Anime Batch - Arnime" };
  }
}

export default async function Page({ params }: Props) {
  const { slug, batch } = await params;
  return <BatchClientPage slug={slug} batch={batch} />;
}