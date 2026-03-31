"use client"
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Channel {
  name: string
  url: string
  headers?: Record<string, string>
}

export default function LiveTVPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchChannels() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('https://api.ammaricano.my.id/api/tools/tv')
        const data = await res.json()
        if (data.success && Array.isArray(data.result)) {
          setChannels(data.result)
        } else {
          setError('Failed to load channels')
        }
      } catch (err) {
        setError('Failed to load channels')
      } finally {
        setLoading(false)
      }
    }
    fetchChannels()
  }, [])

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Live TV Channels</h1>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <ul className="space-y-4">
        {channels.map((ch, idx) => (
          <li key={ch.name + idx} className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-lg shadow p-4">
            <span className="font-semibold text-lg">{ch.name}</span>
            <Link href={`/livetv/watch?name=${encodeURIComponent(ch.name)}&url=${encodeURIComponent(ch.url)}`} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">Watch</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
