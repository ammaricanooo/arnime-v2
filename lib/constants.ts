export const API_BASE = 'https://api.ammaricano.my.id/api'

export const API = {
  otakudesu: {
    genre: `${API_BASE}/otakudesu/genre`,
    list: (type: 'ongoing' | 'complete', page: number) =>
      `${API_BASE}/otakudesu?type=${type}&page=${page}`,
    byGenre: (slug: string, page: number) =>
      `${API_BASE}/otakudesu/animebygenre?genre=${slug}&page=${page}`,
    detail: (slug: string) =>
      `${API_BASE}/otakudesu/detail/${encodeURIComponent(slug)}`,
    episode: (slug: string) =>
      `${API_BASE}/otakudesu/episode/${encodeURIComponent(slug)}`,
    batch: (slug: string) =>
      `${API_BASE}/otakudesu/batch/${encodeURIComponent(slug)}`,
    lengkap: (slug: string) =>
      `${API_BASE}/otakudesu/lengkap/${encodeURIComponent(slug)}`,
    schedule: `${API_BASE}/otakudesu/schedule`,
    search: (q: string) =>
      `${API_BASE}/otakudesu/search?query=${encodeURIComponent(q)}`,
    nonce: `${API_BASE}/otakudesu/nonce`,
    iframe: (content: string, nonce: string) =>
      `${API_BASE}/otakudesu/getiframe?content=${encodeURIComponent(content)}&nonce=${encodeURIComponent(nonce)}`,
  },
  animasu: {
    detail: (slug: string) =>
      `${API_BASE}/animasu/detail/${encodeURIComponent(slug)}`,
    search: (q: string) =>
      `${API_BASE}/animasu/search?query=${encodeURIComponent(q)}`,
  },
  komiku: {
    hot: `${API_BASE}/komiku/hot`,
    latest: `${API_BASE}/komiku/latest`,
    detail: (url: string) =>
      `${API_BASE}/komiku/detail?url=${encodeURIComponent(url)}`,
    chapter: (url: string) =>
      `${API_BASE}/komiku/detail/chapter?url=${encodeURIComponent(url)}`,
    search: (q: string) =>
      `${API_BASE}/komiku/search?query=${encodeURIComponent(q)}`,
    comicUrl: (slug: string) => `https://komiku.org/manga/${slug}/`,
  },
  tv: `${API_BASE}/tools/tv`,
} as const

export const MAX_PAGES = 3

export const ROUTES: Record<string, string> = {
  home: '/',
  complete: '/?type=complete',
  schedule: '/schedule',
  favorites: '/favorites',
  watchhistory: '/watchhistory',
  livetv: '/livetv',
  comic: '/comic',
  settings: '/settings',
  watchparty: '/watchparty',
}
