import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
    // Support untuk Next.js 14/15 async params
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
        const BASE_URL = "https://otakudesu.cloud"; // Menggunakan .cloud untuk stabilitas
        const url = `${BASE_URL}/batch/${slug}`;

        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            }
        });

        const $ = cheerio.load(html);
        
        // Ambil judul utama batch (misal: "Naruto Shippuden Batch Subtitle Indonesia")
        const title = $('#venkonten .venser .batchlink h4').text().trim() || $('.posttl').text().trim();

        const batch: any[] = [];

        // Scrape area download batch
        $('#venkonten .venser .batchlink ul li').each((_, el) => {
            const $el = $(el);
            
            // Resolusi ada di tag <strong>
            const resolution = $el.find('strong').text().trim();
            
            // Ukuran file biasanya ada di tag <i>
            const size = $el.find('i').text().trim();

            const downloadLinks: any[] = [];
            $el.find('a').each((_, a) => {
                const provider = $(a).text().trim();
                const link = $(a).attr('href');
                
                if (link) {
                    downloadLinks.push({
                        provider,
                        link
                    });
                }
            });

            // Hanya push jika ada link di resolusi tersebut
            if (downloadLinks.length > 0) {
                batch.push({
                    resolution,
                    size,
                    downloads: downloadLinks
                });
            }
        });

        return NextResponse.json({
            success: true,
            code: 200,
            result: {
                title,
                total_resolutions: batch.length,
                batch,
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