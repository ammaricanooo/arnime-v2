'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Play, BookOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SliderItem {
  slug: string
  title: string
  poster: string
  badge?: string
  badgeColor?: string
  subtitle?: string
  type: 'anime' | 'comic'
}

interface HeroSliderProps {
  items: SliderItem[]
  autoPlayMs?: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HeroSlider({ items, autoPlayMs = 5000 }: HeroSliderProps) {
  const [current, setCurrent] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(0)
  const [dragDelta, setDragDelta] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const router = useRouter()

  const count = items.length

  const go = useCallback(
    (dir: 1 | -1) => {
      setCurrent((i) => (i + dir + count) % count)
    },
    [count]
  )

  // Auto-play — pause while dragging
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => go(1), autoPlayMs)
  }, [go, autoPlayMs])

  useEffect(() => {
    if (count < 2) return
    startTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [startTimer, count])

  // ── Touch / Mouse drag ──────────────────────────────────────────────────────

  const onDragStart = (clientX: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setIsDragging(true)
    setDragStart(clientX)
    setDragDelta(0)
  }

  const onDragMove = (clientX: number) => {
    if (!isDragging) return
    setDragDelta(clientX - dragStart)
  }

  const onDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (Math.abs(dragDelta) > 50) {
      go(dragDelta < 0 ? 1 : -1)
    }
    setDragDelta(0)
    startTimer()
  }

  if (count === 0) return null

  const item = items[current]
  const href = item.type === 'anime' ? `/anime/${item.slug}` : `/comic/${item.slug}`

  return (
    <div
      className="relative w-full mb-8 rounded-2xl overflow-hidden bg-slate-900 shadow-xl select-none"
      // Mouse events
      onMouseDown={(e) => onDragStart(e.clientX)}
      onMouseMove={(e) => onDragMove(e.clientX)}
      onMouseUp={onDragEnd}
      onMouseLeave={onDragEnd}
      // Touch events
      onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
      onTouchMove={(e) => onDragMove(e.touches[0].clientX)}
      onTouchEnd={onDragEnd}
    >
      {/* Slides */}
      <div className="relative h-[220px] sm:h-[300px] md:h-[400px] overflow-hidden">
        {items.map((s, i) => (
          <div
            key={s.slug + i}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img
              src={s.poster}
              alt={s.title}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        ))}

        {/* Gradient */}
        <div className="absolute inset-0 z-20 bg-linear-to-t from-black/85 via-black/30 to-transparent" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 z-30 p-4 sm:p-6 md:p-8">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {item.badge && (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase ${
                  item.badgeColor ?? 'bg-indigo-600'
                }`}
              >
                {item.badge}
              </span>
            )}
          </div>

          <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-white leading-tight line-clamp-2 mb-1">
            {item.title}
          </h2>

          {item.subtitle && (
            <p className="text-slate-300 text-xs sm:text-sm mb-3 line-clamp-1">{item.subtitle}</p>
          )}

          <button
            onClick={() => router.push(href)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-semibold text-sm transition-all active:scale-95"
          >
            {item.type === 'anime' ? (
              <><Play className="w-4 h-4 fill-current" /> Watch Now</>
            ) : (
              <><BookOpen className="w-4 h-4" /> Read Now</>
            )}
          </button>
        </div>
      </div>

      {/* Arrow buttons — hidden on mobile, visible on hover desktop */}
      {count > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); go(-1) }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-40 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white hidden sm:flex items-center justify-center transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); go(1) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-40 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white hidden sm:flex items-center justify-center transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {count > 1 && (
        <div className="absolute bottom-3 right-4 z-40 flex gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); startTimer() }}
              className={`rounded-full transition-all duration-300 ${
                i === current ? 'w-5 h-1.5 bg-indigo-500' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
