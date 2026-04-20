"use client"
import { useEffect, useState, useRef, useCallback } from 'react'
import { Loader2, ChevronDown } from 'lucide-react'
import ComicContentGrid, { Comic } from '@/components/ComicContentGrid'

const GENRES = [
  { id: 'hot', label: 'Hot', api: 'https://api.ammaricano.my.id/api/komiku/hot' },
  { id: 'latest', label: 'Latest', api: 'https://api.ammaricano.my.id/api/komiku/latest' },
]


export default function ComicHomePage() {
  const [genre, setGenre] = useState(GENRES[0].id)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [comics, setComics] = useState<Comic[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const observerTarget = useRef<HTMLDivElement>(null)

  // Fetch comics
  const fetchComics = useCallback(async (reset = false) => {
    setLoading(true)
    setError(null)
    try {
      const api = GENRES.find(g => g.id === genre)?.api
      const res = await fetch(`${api}?page=${reset ? 1 : page}`)
      const json = await res.json()
      if (json.success && Array.isArray(json.result)) {
        if (reset) {
          setComics(json.result)
        } else {
          setComics(prev => [...prev, ...json.result])
        }
        setHasMore(json.result.length > 0)
      } else {
        setError('Failed to load comics')
        setHasMore(false)
      }
    } catch (err) {
      setError('Failed to load comics')
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [genre, page])

  // Reset on genre change
  useEffect(() => {
    setPage(1)
    setComics([])
    setHasMore(true)
    fetchComics(true)
  }, [genre])

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loading) return
    const observer = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setPage(p => p + 1)
      }
    }, { threshold: 0.1 })
    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [hasMore, loading])

  // Fetch more when page changes (not on genre reset)
  useEffect(() => {
    if (page === 1) return
    fetchComics()
  }, [page])

  // Dropdown for genre
  const genreLabel = GENRES.find(g => g.id === genre)?.label || 'Genre'

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Comic - Komiku</h1>
        <div className="relative w-56">
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-pointer"
          >
            <span className="text-sm font-medium">{genreLabel}</span>
            <ChevronDown className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'transform rotate-180' : ''}`} />
          </button>
          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
              <div className="py-1 max-h-64 overflow-y-auto">
                {GENRES.map(g => (
                  <button
                    key={g.id}
                    onClick={() => { setGenre(g.id); setDropdownOpen(false) }}
                    className={`w-full cursor-pointer text-left px-4 py-2.5 text-sm transition-colors ${genre === g.id ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 font-semibold' : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <ComicContentGrid
        comics={comics}
        loading={loading && comics.length === 0}
        hasMore={false} // Kita pakai observerTarget di bawah untuk infinite scroll
      />
      {/* Target untuk Infinite Scroll */}
      <div ref={observerTarget} className="flex justify-center py-12">
        {loading && comics.length > 0 && (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            <p className="text-xs text-slate-500 animate-pulse font-medium">Memuat lebih banyak...</p>
          </div>
        )}
      </div>
      {!hasMore && !loading && comics.length > 0 && (
        <div className="text-center text-slate-400 py-8">No more comics</div>
      )}
    </div>
  )
}
