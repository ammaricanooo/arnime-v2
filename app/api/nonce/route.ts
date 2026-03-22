import { NextResponse } from 'next/server';
import axios from "axios";
import FormData from 'form-data';

// Definisikan tipe interface untuk response agar lebih rapi
interface ApiResponse {
  success: boolean;
  code: number;
  result?: any;
  message?: string;
  creator: string;
}

export async function GET(req: Request) {
  try {
    const BASE_URL = "https://cors.eu.org/https://otakudesu.blog";
    const formData = new FormData();
    
    // Action ID ini biasanya dinamis, pastikan masih valid
    formData.append('action', 'aa1208d27f29ca340c92c66d1926f13f');

    const response = await axios.post(`${BASE_URL}/wp-admin/admin-ajax.php`, formData, {
      headers: {
        ...formData.getHeaders(),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        'Referer': BASE_URL
      },
      timeout: 10000 // Timeout 10 detik agar tidak hanging
    });

    return NextResponse.json({
      success: true,
      code: 200,
      result: response.data.data,
      creator: "Nexure Network"
    });

  } catch (error: any) {
    console.error("Scraping Error:", error.message);
    
    return NextResponse.json(
      {
        success: false,
        code: 500,
        message: error.message || 'Internal Server Error',
        creator: "Nexure Network"
      },
      { status: 500 }
    );
  }
}
