import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function GET() {
    try {
        const BASE_URL = "https://otakudesu.blog";
        const { data: html } = await axios.get(`${BASE_URL}/genre-list`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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