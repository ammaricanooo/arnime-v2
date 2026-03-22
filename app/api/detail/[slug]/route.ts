import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { slug } = resolvedParams;

    if (!slug) {
        return NextResponse.json({
            success: false,
            code: 400,
            message: "Missing required parameter: slug."
        }, { status: 400 });
    }

    try {
        const BASE_URL = "https://cors.eu.org/https://otakudesu.blog";
        const url = `${BASE_URL}/anime/${slug}`;

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
        const infoElement = $('#venkonten .venser .fotoanime .infozin .infozingle');

        const getInfo = (index: number) => {
            const text = $(infoElement).find(`p:nth-child(${index}) span`).text();
            return text.includes(':') ? text.split(':')[1].trim() : text.trim();
        };

        const detailData = {
            poster: $('#venkonten .venser .fotoanime img').attr('src'),
            title: getInfo(1),
            japanese: getInfo(2),
            score: getInfo(3),
            producer: getInfo(4),
            tipe: getInfo(5),
            status: getInfo(6),
            total_episode: getInfo(7),
            duration: getInfo(8),
            release_date: getInfo(9),
            studio: getInfo(10),
            genre: getInfo(11),
            synopsis: $('#venkonten .venser .fotoanime .sinopc p').text().trim(),
        };

        // Fungsi baru yang lebih akurat: mencari berdasarkan teks Header
        const getListByTitle = (titleKeyword: string, type: 'episode' | 'batch' | 'lengkap') => {
            const result: any[] = [];
            $('.episodelist').each((_, el) => {
                const title = $(el).find('span').text().toLowerCase();
                if (title.includes(titleKeyword)) {
                    $(el).find('ul li').each((_, li) => {
                        const anchor = $(li).find('span:first a');
                        const href = anchor.attr('href');
                        if (href) {
                            result.push({
                                episode: anchor.text().trim(),
                                slug: href.replace(new RegExp(`^https:\\/\\/otakudesu\\.[a-zA-Z0-9-]+\\/${type}\\/`), '').replace(/\//g, ''),
                                date: $(li).find('.zeebr').text().trim(),
                                otakudesu_url: href
                            });
                        }
                    });
                }
            });
            return result;
        };

        return NextResponse.json({
            success: true,
            code: 200,
            result: {
                ...detailData,
                episodes: getListByTitle('episode', 'episode'),
                batch: getListByTitle('batch', 'batch'),
                lengkap: getListByTitle('lengkap', 'lengkap')
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