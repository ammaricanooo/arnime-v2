import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');

        if (!query) {
            return NextResponse.json({
                success: false,
                code: 400,
                message: "Missing required parameter: q (query)."
            }, { status: 400 });
        }

        const BASE_URL = "https://otakudesu.blog";
        const targetUrl = `${BASE_URL}/?s=${encodeURIComponent(query)}&post_type=anime`;

        const { data: html } = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            }
        });

        const $ = cheerio.load(html);
        const searchData: any[] = [];

        $('.chivsrc li').each((_, el) => {
            const element = $(el);
            const genres: any[] = [];

            element.find('.set:nth-child(3) a').each((_, g) => {
                const gen = $(g);
                genres.push({
                    name: gen.text().trim(),
                    slug: gen.attr('href')?.replace(/^https:\/\/otakudesu\.[a-zA-Z0-9-]+\/genres\//, '').replace(/\/$/, ''),
                    otakudesu_url: gen.attr('href')
                });
            });

            searchData.push({
                title: element.find('h2 a').text().trim(),
                slug: element.find('h2 a').attr('href')?.replace(/^https:\/\/otakudesu\.[a-zA-Z0-9-]+\/anime\//, '').replace(/\/$/, ''),
                poster: element.find('img').attr('src'),
                genres,
                status: element.find('.set:nth-child(4)').text().replace('Status :', '').trim(),
                rating: element.find('.set:last-child').text().replace('Rating :', '').trim(),
                url: element.find('h2 a').attr('href')
            });
        });

        return NextResponse.json({
            success: true,
            code: 200,
            result: searchData,
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