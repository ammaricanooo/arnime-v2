import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const genre = searchParams.get('genre');
        const page = searchParams.get('page') || "1";

        if (!genre) {
            return NextResponse.json({
                success: false,
                code: 400,
                message: "Missing required parameter: genre."
            }, { status: 400 });
        }

        const BASE_URL = "https://cors.eu.org/https://otakudesu.blog";
        const url = `${BASE_URL}/genres/${genre}/page/${page}`;

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
        const animeData: any[] = [];

        // Mengambil setiap elemen kartu anime di halaman genre
        $('.venser .page .col-anime-con').each((_, el) => {
            const element = $(el);

            // Mengambil daftar genre untuk setiap anime
            const genres: any[] = [];
            element.find('.col-anime-genre a').each((_, g) => {
                const gen = $(g);
                genres.push({
                    name: gen.text().trim(),
                    slug: gen.attr('href')?.replace(/^https:\/\/otakudesu\.[a-zA-Z0-9-]+\/genres\//, '').replace(/\/$/, ''),
                    otakudesu_url: gen.attr('href')
                });
            });

            const episodeCount = element.find('.col-anime-eps').text().replace(/[A-z]/g, '').trim();

            animeData.push({
                title: element.find('.col-anime-title a').text().trim(),
                slug: element.find('.col-anime-title a').attr('href')?.replace(/^https:\/\/otakudesu\.[a-zA-Z0-9-]+\/anime\//, '').replace(/\/$/, ''),
                poster: element.find('.col-anime-cover img').attr('src'),
                rating: element.find('.col-anime-rating').text().trim() || null,
                episode_count: episodeCount === '' ? null : episodeCount,
                season: element.find('.col-anime-date').text().trim(),
                studio: element.find('.col-anime-studio').text().trim(),
                genres,
                synopsis: element.find('.col-synopsis p').text().trim(),
                otakudesu_url: element.find('.col-anime-title a').attr('href')
            });
        });

        return NextResponse.json({
            success: true,
            code: 200,
            result: animeData,
            creator: "Nexure Network"
        });

    } catch (error: any) {
        console.error("Scraping Genre Error:", error.message);
        return NextResponse.json({
            success: false,
            code: 500,
            message: error.message || 'Internal Server Error',
            creator: "Nexure Network"
        }, { status: 500 });
    }
}