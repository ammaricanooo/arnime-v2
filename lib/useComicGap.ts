import { useState, useEffect } from 'react'

export function useComicGap() {
  const [comicGap, setComicGap] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('comicGap') === 'true'
    setComicGap(saved)
  }, [])

  const updateComicGap = (enabled: boolean) => {
    setComicGap(enabled)
    localStorage.setItem('comicGap', enabled.toString())
  }

  return { comicGap, updateComicGap }
}