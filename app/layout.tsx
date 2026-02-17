import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import AppShell from '../components/AppShell'
import { Suspense } from 'react'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Arnime - Nonton Anime Sub Indo & Streaming Anime Terbaru',
  description: 'Arnime adalah website nonton anime sub indo terlengkap. Streaming anime terbaru, daftar anime populer, jadwal rilis episode terbaru, dan informasi lengkap semua genre anime dalam satu tempat.',
  keywords: [
    'nonton anime sub indo',
    'streaming anime terbaru',
    'anime lengkap',
    'anime populer',
    'jadwal rilis anime',
    'anime ongoing',
    'anime terbaru 2026',
    'website anime sub indo'
  ],
  openGraph: {
    title: 'Arnime - Nonton Anime Sub Indo & Streaming Anime Terbaru',
    description: 'Streaming anime sub indo terbaru dan terlengkap hanya di Arnime.',
    type: 'website',
    locale: 'id_ID',
    siteName: 'Arnime'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Arnime - Nonton Anime Sub Indo & Streaming Anime Terbaru',
    description: 'Website streaming anime sub indo terbaru dan terlengkap.'
  }
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Suspense fallback={null}>
        <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  )
}
