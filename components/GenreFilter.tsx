'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface GenreFilterProps {
  genres: string[]
  selectedGenre: string
  onSelectGenre: (genre: string) => void
}

export default function GenreFilter({ genres, selectedGenre, onSelectGenre }: GenreFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const label = selectedGenre === 'All' ? 'All Genres' : selectedGenre

  return (
    <div ref={ref} className="relative w-48">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 hover:border-indigo-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
      >
        <span className="font-medium truncate">{label}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="max-h-60 overflow-y-auto custom-scroll py-1">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => { onSelectGenre(genre); setIsOpen(false) }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  selectedGenre === genre
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {genre === 'All' ? 'All Genres' : genre}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
