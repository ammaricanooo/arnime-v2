import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function GET() {
    try {
        const BASE_URL = "https://cors.eu.org/https://otakudesu.blog";
        const { data: html } = await axios.get(`${BASE_URL}/genre-list`, {
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
        const genres: any[] = [];

        $('#venkonten .vezone ul.genres li a').each((_, el) => {
            const element = $(el);
            const rawHref = element.attr('href') || "";

            genres.push({
                name: element.text().trim(),
                slug: rawHref.replace('/genres/', '').replace(/\//g, ''),
                otakudesu_url: rawHref.startsWith('http') ? rawHref : `${BASE_URL}${rawHref}`
            });
        });

        return NextResponse.json({
            success: true,
            code: 200,
            result: genres,
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