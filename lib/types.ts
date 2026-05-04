// ─── Anime ───────────────────────────────────────────────────────────────────

export interface AnimeItem {
  title: string
  slug: string
  poster: string
  current_episode?: string
  release_day?: string
  total_episode?: string
  rating?: string
  episode_count?: string
  season?: string
  studio?: string
  newest_release_date?: string
  lastEpisodeName?: string
  lastEpisodeSlug?: string
  source?: 'animasu'
}

export interface EpisodeItem {
  episode: string
  slug: string
}

export interface AnimeDetail {
  poster?: string
  title?: string
  japanese?: string
  score?: string
  tipe?: string
  status?: string
  total_episode?: string
  duration?: string
  release_date?: string
  studio?: string
  genre?: string
  synopsis?: string
  episodes?: EpisodeItem[]
  batch?: EpisodeItem[]
  lengkap?: EpisodeItem[]
}

export interface EpisodeDetail {
  title?: string
  has_next_episode?: boolean
  next_episode?: { slug: string }
  has_previous_episode?: boolean
  previous_episode?: { slug: string }
  stream_url?: string
  mirror?: Record<string, Array<{ nama: string; content: string }>>
  download?: Record<string, Array<{ provider: string; link: string }>>
}

// ─── Comic ───────────────────────────────────────────────────────────────────

export interface Comic {
  title: string
  link: string
  thumb?: string
  image?: string
  genre?: string
  latest_chapter?: string
  info?: string
  chapter?: string
  is_colored?: boolean
  type?: string
  update?: string
  readers?: string
  time?: string
  extra?: string
  description?: string
  firstChapter?: string
  firstChapterLink?: string
  latestChapter?: string
  latestChapterLink?: string
}

export interface ComicChapter {
  title: string
  url: string
  date: string
  views: number
}

export interface ComicDetail {
  title: string
  alt_title?: string
  thumbnail: string
  description: string
  author: string
  status: string
  type: string
  genres: string[]
  chapters: ComicChapter[]
  link: string
}

export interface ChapterData {
  images: string[]
  prev: string | null
  next: string | null
}

// ─── Schedule ────────────────────────────────────────────────────────────────

export interface ScheduleAnime {
  judul: string
  slug: string
}

export interface ScheduleDay {
  hari: string
  anime: ScheduleAnime[]
}

// ─── Live TV ─────────────────────────────────────────────────────────────────

export interface Channel {
  name: string
  url: string
  referer?: string
  origin?: string
}

// ─── Animasu ─────────────────────────────────────────────────────────────────

export interface AnimasuMirror {
  quality: string
  src: string
}

export interface AnimasuDetail {
  title: string
  altTitle: string
  synopsis: string
  genres: string[]
  status: string
  release: string
  type: string
  duration: string
  studio: string
  rating: string
  playData: {
    result: {
      mirrors: AnimasuMirror[]
      animeName: string
    }
  }
}

// ─── Firestore ───────────────────────────────────────────────────────────────

export interface BookmarkData {
  userId: string
  slug: string
  title: string
  poster: string
  type?: string
  createdAt: string
  id: string
}

export interface HistoryData {
  userId: string
  slug: string
  title?: string
  poster?: string
  lastEpisodeName?: string
  lastEpisodeSlug?: string
  type?: string
  lastWatched: string
  id: string
}

// ─── Watch Party ─────────────────────────────────────────────────────────────

export interface WatchPartyRoom {
  roomId: string
  hostId: string
  hostName: string
  hostAvatar: string
  animeSlug: string
  animeTitle: string
  animePoster: string
  episodeSlug: string
  episodeTitle: string
  iframeSrc: string
  members: string[]
  memberNames: Record<string, string>
  memberAvatars: Record<string, string>
  createdAt: { seconds: number; nanoseconds: number } | null
  expiresAt: number   // Unix ms — client-side expiry check
  updatedAt: number   // Unix ms — reset on episode change
}

export interface WatchPartyMessage {
  id: string
  userId: string
  userName: string
  userAvatar: string
  text: string
  type?: 'chat' | 'system'
  createdAt: { seconds: number } | null
}

export interface BatchDownloadItem {
  provider: string
  link: string
}

export interface BatchResolution {
  resolution: string
  downloads: BatchDownloadItem[]
}

export interface BatchDetail {
  title: string
  batch: BatchResolution[]
}

export interface LengkapItem {
  title: string
  resolution: string
  downloads: BatchDownloadItem[]
}

export interface LengkapDetail {
  title: string
  lengkap: LengkapItem[]
}
