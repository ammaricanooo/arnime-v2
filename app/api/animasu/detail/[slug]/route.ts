import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> | { slug: string } }) {
    const resolvedParams = await params;
    try {
        const response = await axios.get(`https://api.ammaricano.my.id/api/animasu/detail/${resolvedParams.slug}`);
        return NextResponse.json(response.data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}