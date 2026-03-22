import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: Request) {
    try {
        // Ambil data dari Query Params (URL), bukan dari body
        const { searchParams } = new URL(req.url);
        const content = searchParams.get('content');
        const nonce = searchParams.get('nonce');

        if (!content || !nonce) {
            return NextResponse.json({
                success: false,
                code: 400,
                message: "Missing required parameters: content and nonce in query string."
            }, { status: 400 });
        }

        const BASE_URL = "https://cors.eu.org/https://otakudesu.blog";

        // 1. Decode content dari Base64
        let decodedContent: string;
        try {
            decodedContent = Buffer.from(content, 'base64').toString('utf-8');
        } catch (e) {
            return NextResponse.json({ success: false, message: "Invalid Base64 content." }, { status: 400 });
        }

        // 2. Siapkan Form Data untuk dikirim ke Otakudesu
        const params = new URLSearchParams();
        try {
            const decodedObj = JSON.parse(decodedContent);
            Object.entries(decodedObj).forEach(([key, value]) => {
                params.append(key, value as string);
            });
        } catch (e) {
            return NextResponse.json({ success: false, message: "Invalid JSON in decoded content." }, { status: 400 });
        }

        params.append('nonce', nonce);
        params.append('action', '2a3505c93b0035d3f455df82bf976b84');

        // 3. Request ke admin-ajax.php menggunakan POST (Internal ke Otakudesu)
        const response = await axios.post(`${BASE_URL}/wp-admin/admin-ajax.php`, params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
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
                "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
                'Origin': 'https://otakudesu.blog',
                'Referer': 'https://otakudesu.blog/',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!response.data || !response.data.data) {
            return NextResponse.json({
                success: false,
                message: "Failed to get data. Nonce or Content might be expired."
            }, { status: 404 });
        }

        // 4. Decode hasil response (Server Otakudesu membalas dengan Base64)
        const htmlTag = Buffer.from(response.data.data, 'base64').toString('utf-8');

        return NextResponse.json({
            success: true,
            code: 200,
            result: htmlTag,
            creator: "Nexure Network"
        });

    } catch (error: any) {
        console.error("Iframe Scraper Error:", error.message);
        return NextResponse.json({
            success: false,
            code: 500,
            message: error.message || 'Internal Server Error',
            creator: "Nexure Network"
        }, { status: 500 });
    }
}