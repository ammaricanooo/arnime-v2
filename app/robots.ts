import type { MetadataRoute } from 'next'

const BASE_URL = 'https://arnime.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/favorites', '/watchhistory', '/watchlist', '/settings'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
