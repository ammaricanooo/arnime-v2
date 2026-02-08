'use client'

import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Download, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'

interface EpisodeDetail {
  title?: string
  has_next_episode?: boolean
  next_episode?: {
    slug: string
    otakudesu_url: string
  }
  has_previous_episode?: boolean
  previous_episode?: {
    slug: string
    otakudesu_url: string
  }
  stream_url?: string
  mirror?: {
    [quality: string]: Array<{
      nama: string
      content: string
    }>
  }
  download?: {
    [format: string]: Array<{
      nama: string
      href: string
    }>
  }
}

export default function WatchPage() {
  const router = useRouter()
  const params = useParams()
  const animeSlug = params.slug as string
  const episodeSlug = params.episode as string

  const [episode, setEpisode] = useState<EpisodeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedQuality, setSelectedQuality] = useState<string>('360p')
  const [isQualityOpen, setIsQualityOpen] = useState(false)
  const [selectedMirrorIframe, setSelectedMirrorIframe] = useState<string | null>(null)
  const [iframeLoading, setIframeLoading] = useState(false)
  const [iframeError, setIframeError] = useState<string | null>(null)
  const toggleAccordion = (id: number) => {
    const content = document.getElementById(`content-${id}`);
    const icon = document.getElementById(`icon-${id}`);
    if (content && icon) {
      if (content.classList.contains('max-h-0')) {
        content.classList.remove('max-h-0');
        content.classList.add('max-h-96');
        icon.classList.add('rotate-180');
      } else {
        content.classList.add('max-h-0');
        content.classList.remove('max-h-96');
        icon.classList.remove('rotate-180');
      }
    }
  }

  useEffect(() => {
    if (!episodeSlug) return

    const fetchEpisode = async () => {
      setLoading(true)
      setError(null)
      try {
        const { fetchJson } = await import('@/lib/fetchJson')
        const data = await fetchJson(
          `https://api.ammaricano.my.id/api/otakudesu/episode/${encodeURIComponent(episodeSlug)}`
        )

        if (data && data.result) {
          setEpisode(data.result)
          // Set first available quality
          const qualities = Object.keys(data.result.mirror || {})
          if (qualities.length > 0) {
            setSelectedQuality(qualities[0])
          }
        } else {
          setError('Episode not found')
        }
      } catch (err: any) {
        console.error('Error fetching episode:', err)
        setError(err?.message || 'Failed to load episode')
      } finally {
        setLoading(false)
      }
    }

    fetchEpisode()
  }, [episodeSlug])

  const handleMirrorClick = async (mirrorContent: string) => {
    setIframeLoading(true)
    setIframeError(null)
    try {
      const { fetchJson } = await import('@/lib/fetchJson')
      // Get nonce
      const nonceRes = await fetchJson('https://api.ammaricano.my.id/api/otakudesu/nonce')
      const nonce = nonceRes?.result

      if (!nonce) {
        setIframeError('Failed to get nonce')
        return
      }

      // Get iframe
      const iframeRes = await fetchJson(
        `https://api.ammaricano.my.id/api/otakudesu/getiframe?content=${encodeURIComponent(mirrorContent)}&nonce=${encodeURIComponent(nonce)}`
      )
      const iframeHtml = iframeRes?.result

      if (iframeHtml) {
        setSelectedMirrorIframe(iframeHtml)
      } else {
        setIframeError('Failed to load iframe')
      }
    } catch (err: any) {
      console.error('Error fetching iframe:', err)
      setIframeError(err?.message || 'Failed to load mirror')
    } finally {
      setIframeLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading episode...</p>
        </div>
      </div>
    )
  }

  if (error || !episode) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            {error || 'Episode not found'}
          </h2>
          <button
            onClick={() => router.back()}
            className="text-indigo-600 hover:underline font-medium"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  const mirrors = episode.mirror || {}
  const downloads = episode.download || {}
  const qualityList = Object.keys(mirrors)
  const currentMirrors = mirrors[selectedQuality] || []

  return (
    <>
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Episodes
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Player Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Container */}
          <div className="bg-black rounded-lg overflow-hidden aspect-video relative flex items-center justify-center">
            {selectedMirrorIframe ? (
              <div
                dangerouslySetInnerHTML={{ __html: selectedMirrorIframe }}
                className="w-full h-full"
              />
            ) : (
              <iframe
                src={episode.stream_url || 'about:blank'}
                allowFullScreen
                className="w-full h-full"
                title={episode.title || 'Episode'}
              />
            )}
          </div>

          {/* Episode Info */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-6">
            {/* Title & Navigation */}
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {episode.title}
              </h1>
            </div>

            {/* Quality/Mirrors Selection */}
            {qualityList.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Stream Quality</h3>
                <div className="flex flex-wrap gap-2">
                  {qualityList.map((quality) => (
                    <button
                      key={quality}
                      onClick={() => setSelectedQuality(quality)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedQuality === quality
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                      {quality}
                    </button>
                  ))}
                </div>

                {/* Mirror Options for Selected Quality */}
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">
                    Available Mirrors
                  </h4>
                  <div className="space-y-2">
                    {currentMirrors.map((mirror, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleMirrorClick(mirror.content)}
                        disabled={iframeLoading}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
                        title={`Mirror: ${mirror.nama}`}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {mirror.nama.toUpperCase()}
                          </p>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {iframeLoading && selectedMirrorIframe ? 'Loading...' : selectedQuality}
                        </div>
                      </button>
                    ))}
                    {iframeError && (
                      <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-700 dark:text-red-400">{iframeError}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Download Options */}
            {Object.keys(downloads).length > 0 && (
              <div className="space-y-3 pt-6">
                <div className="w-full">
                  <button onClick={() => toggleAccordion(1)}
                    className="w-full flex justify-between items-center py-5 text-slate-800" id="firstButton">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Download Episode</h3>
                    <span id="icon-1" className="text-slate-800 transition-transform duration-300">
                      <ChevronDown className="w-5 h-5" />
                    </span>
                  </button>
                  <div id="content-1" className="max-h-0 overflow-hidden transition-all duration-300 ease-in-out">
                    <div className="space-y-3">
                      {Object.entries(downloads).map(([format, links]) => (
                        <div key={format}>
                          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 capitalize">
                            {format.replace('dmp4', 'MP4 ')}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {(links as any[]).map((link, idx) => (
                              <a
                                key={idx}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors border border-slate-200 dark:border-slate-700"
                              >
                                <Download className="w-4 h-4" />
                                <span className="text-sm font-medium">{link.nama}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Episode Navigation */}
            <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => {
                  if (episode.has_previous_episode && episode.previous_episode) {
                    router.push(`/anime/${animeSlug}/watch/${episode.previous_episode.slug}`)
                  }
                }}
                disabled={!episode.has_previous_episode}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous Episode
              </button>
              <button
                onClick={() => {
                  if (episode.has_next_episode && episode.next_episode) {
                    router.push(`/anime/${animeSlug}/watch/${episode.next_episode.slug}`)
                  }
                }}
                disabled={!episode.has_next_episode}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Episode
              </button>
            </div>
          </div>
        </div>

        {/* Side Info */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6 sticky top-24">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Episode Info</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-600 dark:text-slate-400">Title</p>
                <p className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
                  {episode.title}
                </p>
              </div>

              {episode.has_next_episode && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider mb-2">
                    Next Episode
                  </p>
                  <button
                    onClick={() => {
                      if (episode.next_episode) {
                        router.push(`/anime/${animeSlug}/watch/${episode.next_episode.slug}`)
                      }
                    }}
                    className="w-full px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
