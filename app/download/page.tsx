import type { Metadata } from 'next'
import DownloadPageClient from './DownloadPageClient'

export const metadata: Metadata = {
  title: 'Download Arnime App',
  description: 'Download aplikasi Arnime untuk Android. Nonton anime sub indo kapan saja dan di mana saja.',
}

export default function DownloadPage() {
  return <DownloadPageClient />
}
