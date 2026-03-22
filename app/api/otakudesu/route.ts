import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface AnimeItem {
    title: string;
    slug: string | undefined;
    poster: string | undefined;
    current_episode?: string;
    total_episode?: string;
    release_day?: string;
    rating?: string;
    newest_release_date: string;
    otakudesu_url: string | undefined;
}

export async function GET(req: Request) {
    try {
        // Ambil query params dari URL (contoh: /api/anime?type=ongoing&page=1)
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') || "ongoing";
        const page = searchParams.get('page') || "1";

        const BASE_URL = "https://otakudesu.blog";
        const targetUrl = `${BASE_URL}/${type}-anime/page/${page}`;

        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);
        const data: AnimeItem[] = [];

        // Selector utama Otakudesu
        $('.venutama .rseries .rapi .venz ul li').each((_: any, el: any) => {
            const element = $(el);
            const title = element.find('.detpost .thumb .thumbz .jdlflm').text().trim();
            const rawUrl = element.find('.detpost .thumb a').attr('href');
            const poster = element.find('.detpost .thumb .thumbz img').attr('src');
            const epzText = element.find('.detpost .epz').text().trim();
            const epzTipeText = element.find('.detpost .epztipe').text().trim();
            const releaseDate = element.find('.detpost .newnime').text().trim();

            // Membersihkan slug dari URL
            const slug = rawUrl?.replace(/^https:\/\/otakudesu\.[a-zA-Z0-9-]+\/anime\//, '').replace(/\/$/, '');

            data.push({
                title,
                slug,
                poster,
                ...(type === "ongoing"
                    ? { current_episode: epzText, release_day: epzTipeText }
                    : { total_episode: epzText, rating: epzTipeText }
                ),
                newest_release_date: releaseDate,
                otakudesu_url: rawUrl
            });
        });

        return NextResponse.json({
            success: true,
            code: 200,
            result: data,
            creator: "Nexure Network"
        });

    } catch (error: any) {
        console.error("Scraping Ongoing Error:", error.message);
        return NextResponse.json(
            {
                success: false,
                code: 500,
                message: error.message || 'Internal Server Error',
                creator: "Nexure Network"
            },
            { status: 500 }
        );
    }
}