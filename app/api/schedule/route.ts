import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function GET() {
    try {
        const BASE_URL = "https://otakudesu.blog";
        const url = `${BASE_URL}/jadwal-rilis/`;

        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            }
        });

        const $ = cheerio.load(html);
        const scheduleData: any[] = [];

        $('.kglist321').each((_, el) => {
            const day = $(el).find('h2').text().trim();
            const animeList: any[] = [];

            $(el).find('ul li a').each((_, a) => {
                const link = $(a).attr('href') || '';
                const slug = link.split('/anime/')[1]?.replace(/\/$/, '') || '';
                const title = $(a).text().trim();

                if (title) {
                    animeList.push({
                        title,
                        slug,
                        otakudesu_url: link
                    });
                }
            });

            if (day) {
                scheduleData.push({
                    day,
                    anime: animeList
                });
            }
        });

        return NextResponse.json({
            success: true,
            code: 200,
            result: scheduleData,
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