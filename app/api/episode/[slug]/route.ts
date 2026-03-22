import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
    const { slug } = await params;

    if (!slug) {
        return NextResponse.json({
            success: false,
            code: 400,
            message: "Missing required parameter: slug."
        }, { status: 400 });
    }

    try {
        const BASE_URL = "https://cors.eu.org/https://otakudesu.blog";
        const url = `${BASE_URL}/episode/${slug}`;

        const { data: html } = await axios.get(url, {
            headers: {
                accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "accept-language": "id-ID",
      "cache-control": "no-cache",
      pragma: "no-cache",
      "sec-ch-ua": '"Chromium";v="127", "Not)A;Brand";v="99"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "upgrade-insecure-requests": "1",
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36"
            }
        });

        const $ = cheerio.load(html);

        const title = $('.venutama .posttl').text().trim();
        const stream_url = $('#pembed iframe').attr('src');

        const getEpisodeNav = (selector: string) => {
            const link = $(selector).attr('href');
            if (!link || !link.includes('/episode/')) return null;

            return {
                slug: link.replace(/^https:\/\/otakudesu\.[a-zA-Z0-9-]+\/episode\//, '').replace(/\//g, ''),
                otakudesu_url: link,
            };
        };

        const previous_episode = getEpisodeNav('.flir a:first-child');
        const next_episode = getEpisodeNav('.flir a:last-child');

        const mirror: any = {};
        ['m360p', 'm480p', 'm720p'].forEach(reso => {
            mirror[reso] = [];
            $(`.mirrorstream ul.${reso} li a`).each((_, el) => {
                mirror[reso].push({
                    nama: $(el).text().trim(),
                    content: $(el).attr('data-content')
                });
            });
        });

        const download: any = {};
        $('.venser .download ul li').each((_, li) => {
            const strong = $(li).find('strong').first();
            const qualityKey = 'd' + strong.text().toLowerCase().replace(/\s+/g, '');

            const links: any[] = [];
            $(li).find('a').each((_, a) => {
                links.push({
                    provider: $(a).text().trim(),
                    link: $(a).attr('href')
                });
            });

            if (links.length > 0) {
                download[qualityKey] = links;
            }
        });

        return NextResponse.json({
            success: true,
            code: 200,
            result: {
                title,
                has_next_episode: !!next_episode,
                next_episode,
                has_previous_episode: !!previous_episode,
                previous_episode,
                stream_url,
                mirror,
                download,
            },
            creator: "Nexure Network"
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            code: 500,
            message: error.message || 'Internal Server Error',
            creator: "Nexure Network"
        }, { status: 500 });
    }
}