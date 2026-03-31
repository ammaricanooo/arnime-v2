"use client"
import { useSearchParams } from 'next/navigation'

export default function LiveTVWatchPage() {
  const searchParams = useSearchParams()
  const name = searchParams?.get('name') || 'Live TV'
  const url = searchParams?.get('url') || ''

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">{name}</h1>
      {url ? (
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
          <video src={url} controls autoPlay className="w-full h-full" />
        </div>
      ) : (
        <div className="text-red-500">No stream URL provided.</div>
      )}
    </div>
  )
}
