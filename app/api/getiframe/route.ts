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

        const BASE_URL = "https://otakudesu.blog";
        
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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Origin': BASE_URL,
                'Referer': BASE_URL,
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