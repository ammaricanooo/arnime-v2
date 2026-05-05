import type { Metadata } from 'next'
import './globals.css'
import AppShell from '../components/AppShell'
import { Suspense } from 'react'
import { ThemeProvider } from '../lib/ThemeProvider'

const BASE_URL = 'https://arnime.vercel.app'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Arnime - Nonton Anime Sub Indo & Streaming Anime Terbaru',
    template: '%s | Arnime',
  },
  description:
    'Arnime adalah website nonton anime sub indo terlengkap. Streaming anime terbaru, daftar anime populer, jadwal rilis episode terbaru, dan informasi lengkap semua genre anime dalam satu tempat.',
  keywords: [
    'nonton anime sub indo',
    'streaming anime terbaru',
    'anime lengkap',
    'anime populer',
    'jadwal rilis anime',
    'anime ongoing',
    'anime terbaru 2026',
    'website anime sub indo',
    'nonton anime gratis',
    'anime subtitle indonesia',
  ],
  authors: [{ name: 'Arnime' }],
  creator: 'Arnime',
  publisher: 'Arnime',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Arnime - Nonton Anime Sub Indo & Streaming Anime Terbaru',
    description: 'Streaming anime sub indo terbaru dan terlengkap hanya di Arnime.',
    url: BASE_URL,
    type: 'website',
    locale: 'id_ID',
    siteName: 'Arnime',
    images: [
      {
        url: `${BASE_URL}/arnime.svg`,
        width: 1200,
        height: 630,
        alt: 'Arnime - Nonton Anime Sub Indo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Arnime - Nonton Anime Sub Indo & Streaming Anime Terbaru',
    description: 'Website streaming anime sub indo terbaru dan terlengkap.',
    images: [`${BASE_URL}/arnime.svg`],
  },
  alternates: {
    canonical: BASE_URL,
  },
  verification: {
    // Add your Google Search Console verification token here
    // google: 'your-verification-token',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <head>
        {/* JSON-LD structured data for WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Arnime',
              url: BASE_URL,
              description: 'Website streaming anime sub indo terbaru dan terlengkap.',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body className="antialiased">
        <Suspense fallback={null}>
          <ThemeProvider>
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  )
}
