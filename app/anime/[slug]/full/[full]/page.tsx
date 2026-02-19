import type { Metadata } from "next";
import FullClientPage from "./FullClientPage";

interface Props {
    params: Promise<{ slug: string; full: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { full } = await params; // use full slug for metadata
    try {
        const res = await fetch(
            `https://api.ammaricano.my.id/api/otakudesu/lengkap/${encodeURIComponent(full)}`
        );
        const json = await res.json();
        const data = json?.result;

        if (!data) return { title: "Full Not Found - Arnime" };

        return {
            title: `${data.title} Sub Indo Full - Arnime`,
            description: `Download ${data.title} subtitle Indonesia full lengkap kualitas HD gratis di Arnime.`,
        };
    } catch {
        return { title: "Download Anime Full - Arnime" };
    }
}

export default async function Page({ params }: Props) {
    const { slug, full } = await params;
    return <FullClientPage slug={slug} full={full} />;
}