import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
    // Handling params untuk Next.js 14/15
    const resolvedParams = await params;
    const { slug } = resolvedParams;

    if (!slug) {
        return NextResponse.json({
            success: false,
            code: 400,
            message: "Missing required parameter: slug."
        }, { status: 400 });
    }

    try {
        const BASE_URL = "https://otakudesu.cloud"; // Disarankan .cloud karena lebih stabil
        const url = `${BASE_URL}/lengkap/${slug}`;

        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            }
        });

        const $ = cheerio.load(html);
        const lengkap: any[] = [];

        // Scrape area download lengkap/batch
        $('#venkonten .download ul').each((_, el) => {
            const $ul = $(el);

            // Mengambil judul format (biasanya dari h4 sebelum ul)
            const title = $ul.prev('h4').text().trim() || "Download";

            $ul.find('li').each((_, li) => {
                const $li = $(li);
                const resolution = $li.find('strong').text().trim();
                const size = $li.find('i').text().trim(); // Menambahkan size (MB/GB)
                
                const downloads: any[] = [];
                $li.find('a').each((_, a) => {
                    downloads.push({
                        provider: $(a).text().trim(),
                        link: $(a).attr('href')
                    });
                });

                if (downloads.length > 0) {
                    lengkap.push({
                        title,
                        resolution,
                        size,
                        downloads
                    });
                }
            });
        });

        return NextResponse.json({
            success: true,
            code: 200,
            result: {
                total: lengkap.length,
                lengkap,
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