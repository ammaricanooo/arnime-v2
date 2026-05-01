/**
 * QUICK REFERENCE GUIDE - ARNime Refactoring
 * Copy-paste snippets for common refactoring patterns
 * Use this as your quick cheat sheet during implementation
 */

# Quick Reference Guide

## Server Component Template

```typescript
// app/[resource]/[slug]/page.tsx
import { Metadata, notFound } from 'next'
import { generateMetadata as generateResourceMetadata } from '@/lib/seo'
import { fetchJson, ApiError } from '@/lib/api'
import { API_ENDPOINTS, REVALIDATION_TIMES } from '@/lib/constants'
import { ResourceDetail } from '@/lib/types'
import ClientPage from './ClientPage'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params
    const resource = await fetchJson<{ result: ResourceDetail }>(
      `${API_ENDPOINTS.ENDPOINT}/${slug}`,
      { retries: 1 }
    )
    return generateResourceMetadata(resource?.result)
  } catch {
    return generateResourceMetadata(null)
  }
}

export async function generateStaticParams() {
  try {
    const { result } = await fetchJson<{ result: Array<{ slug: string }> }>(
      API_ENDPOINTS.LIST_ENDPOINT
    )
    return result?.slice(0, 10).map(item => ({ slug: item.slug })) || []
  } catch {
    return []
  }
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  let resource: ResourceDetail | null = null
  
  try {
    const { result } = await fetchJson<{ result: ResourceDetail }>(
      `${API_ENDPOINTS.ENDPOINT}/${slug}`,
      { next: { revalidate: REVALIDATION_TIMES.LONG } }
    )
    resource = result
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound()
    }
  }

  if (!resource) notFound()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateSchema(resource))
        }}
        suppressHydrationWarning
      />
      <ClientPage resource={resource} />
    </>
  )
}

export const revalidate = REVALIDATION_TIMES.LONG
```

## Client Component Template

```typescript
// app/[resource]/[slug]/ClientPage.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { ResourceDetail } from '@/lib/types'
import { ANIMATIONS } from '@/lib/constants'

interface Props {
  resource: ResourceDetail
}

export default function ClientPage({ resource }: Props) {
  const [state, setState] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAction = useCallback(async () => {
    setLoading(true)
    try {
      // TODO: implement logic
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className={`min-h-screen ${ANIMATIONS.fadeIn}`}>
      {/* content */}
    </div>
  )
}
```

## API Fetch Pattern

```typescript
// ✅ CORRECT - Using lib/api.ts
import { fetchJson } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/constants'

// Server component
const data = await fetchJson<ResponseType>(
  `${API_ENDPOINTS.OTAKUDESU.HOME}?page=1`,
  {
    cacheKey: 'anime-home-page-1',
    retries: 2,
    next: { revalidate: 86400 } // 24 hours
  }
)

// Client component
try {
  const data = await fetchJson<ResponseType>(url, {
    retries: 1,
    cacheKey: 'short-lived-cache'
  })
} catch (error) {
  if (error instanceof ApiError) {
    if (error.statusCode === 404) {
      // handle 404
    }
    console.error(error.message)
  }
}
```

## Types Usage

```typescript
// ✅ CORRECT - Import from lib/types.ts
import { 
  AnimeCard, 
  AnimeDetail, 
  ComicCard, 
  ComicDetail,
  User,
  Bookmark,
  HistoryItem 
} from '@/lib/types'

async function getAnime(slug: string): Promise<AnimeDetail> {
  const data = await fetchJson<{ result: AnimeDetail }>(`/api/...`)
  return data.result
}

function displayAnimes(animes: AnimeCard[]) {
  return animes.map(anime => (
    <AnimeCard key={anime.id} anime={anime} />
  ))
}
```

## Constants Usage

```typescript
// ✅ CORRECT - Use lib/constants.ts
import { 
  API_ENDPOINTS, 
  REVALIDATION_TIMES, 
  ERROR_MESSAGES,
  ANIMATIONS,
  STORAGE_KEYS,
  TAILWIND_BREAKPOINTS
} from '@/lib/constants'

// API endpoints
const url = `${API_ENDPOINTS.OTAKUDESU.HOME}?page=1`
const genreUrl = `${API_ENDPOINTS.OTAKUDESU.BY_GENRE}?genre=action`

// Revalidation
export const revalidate = REVALIDATION_TIMES.LONG

// Error messages
throw new Error(ERROR_MESSAGES.API_FAILED)

// Animations
<div className={ANIMATIONS.fadeIn}>...</div>

// Storage keys
localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, value)

// Breakpoints in tailwind
<div className={`grid grid-cols-1 md:grid-cols-${TAILWIND_BREAKPOINTS.MD}`}>
```

## SEO Metadata Setup

```typescript
// Server component with metadata
import { generateAnimeMetadata, generateAnimeSchema } from '@/lib/seo'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const anime = await fetchJson(`/api/...`)
  return generateAnimeMetadata(anime)
}

export default async function Page({ params }: Props) {
  const anime = await fetchJson(`/api/...`)
  const schema = generateAnimeSchema(anime)
  const breadcrumb = generateBreadcrumbSchema([
    { title: 'Home', url: '/' },
    { title: 'Anime', url: '/anime' },
    { title: anime.title, url: `/anime/${anime.slug}` }
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        suppressHydrationWarning
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
        suppressHydrationWarning
      />
      <ClientContent anime={anime} />
    </>
  )
}
```

## Metadata Examples

```typescript
// Home page
export const metadata: Metadata = {
  title: 'ARNime - Watch Anime & Read Manga Online',
  description: 'Free anime streaming and manga reading platform with HD quality',
  openGraph: {
    title: 'ARNime - Watch Anime & Read Manga Online',
    description: 'Free anime streaming and manga reading platform',
    url: 'https://arnime.vercel.app',
    siteName: 'ARNime',
    images: [{
      url: 'https://arnime.vercel.app/og-image.jpg',
      width: 1200,
      height: 630
    }],
    locale: 'en_US',
    type: 'website'
  }
}

// Anime detail page
const metadata = generateAnimeMetadata({
  title: 'Attack on Titan',
  synopsis: 'Long synopsis...',
  posterUrl: 'https://...',
  slug: 'attack-on-titan',
  score: 8.5,
  // ... other fields
})
```

## Error Handling

```typescript
// ✅ CORRECT - Comprehensive error handling
import { fetchJson, ApiError, getErrorMessage } from '@/lib/api'

try {
  const data = await fetchJson<DataType>(url)
  return data
} catch (error) {
  if (error instanceof ApiError) {
    if (error.statusCode === 404) {
      notFound()
    } else if (error.statusCode === 500) {
      console.error('Server error:', error.message)
      return null
    }
  } else {
    console.error('Unknown error:', getErrorMessage(error))
  }
  return null
}
```

## Image Optimization

```typescript
// ✅ CORRECT - Using Next.js Image component
import Image from 'next/image'

<Image
  src={anime.posterUrl}
  alt={anime.title}
  width={200}
  height={300}
  quality={80}
  priority={false}
  placeholder="blur"
  blurDataURL="data:image/..." // optional
  className="rounded-lg"
/>

// ✅ Hero image (above-fold)
<Image
  src={bgImage}
  alt="Hero"
  width={1920}
  height={1080}
  quality={70}
  priority={true}
  className="w-full h-auto"
/>

// ✅ Thumbnail (lazy load)
<Image
  src={poster}
  alt="Thumbnail"
  width={100}
  height={150}
  quality={60}
  priority={false}
/>
```

## Responsive Design

```typescript
// ✅ CORRECT - Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* items */}
</div>

// ✅ CORRECT - Responsive spacing
<div className="px-4 py-8 md:px-6 md:py-12 lg:px-8 lg:py-16">
  {/* content */}
</div>

// ✅ CORRECT - Responsive typography
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Title
</h1>
```

## Infinite Scroll Pattern

```typescript
// Client component with intersection observer
'use client'

const observerTarget = useRef<HTMLDivElement>(null)

useEffect(() => {
  const observer = new IntersectionObserver(
    entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadMoreItems()
      }
    },
    { threshold: 0.1 }
  )
  
  if (observerTarget.current) {
    observer.observe(observerTarget.current)
  }
  
  return () => observer.disconnect()
}, [hasMore, loading])

return (
  <>
    <div className="grid">
      {items.map(item => <Item key={item.id} />)}
    </div>
    <div ref={observerTarget} className="py-12">
      {loading && <Loader />}
    </div>
  </>
)
```

## State Management

```typescript
// ✅ SIMPLE STATE - Local useState
const [liked, setLiked] = useState(false)

// ✅ ASYNC STATE - With loading
const [data, setData] = useState<DataType | null>(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  const fetch = async () => {
    setLoading(true)
    try {
      const result = await fetchJson(url)
      setData(result)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }
  fetch()
}, [])

// ✅ OPTIMISTIC UPDATE
const handleLike = async (id: string) => {
  const previous = liked
  setLiked(!liked)
  
  try {
    await api.toggleLike(id)
  } catch {
    setLiked(previous)
  }
}
```

## Tailwind CSS Best Practices

```typescript
// ✅ CORRECT - Use utility classes
<div className="flex items-center justify-between gap-4">
  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors">
    Click me
  </button>
</div>

// ✅ CORRECT - Responsive
<div className="text-sm md:text-base lg:text-lg">
  Responsive text
</div>

// ✅ CORRECT - Dark mode
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
  Dark mode support
</div>

// ✅ CORRECT - State variants
<div className="bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 active:scale-95 disabled:opacity-50">
  Interactive
</div>
```

## Validation Checklist After Changes

```bash
# 1. TypeScript check
npx tsc --noEmit

# 2. Build check
npm run build

# 3. Lint check (if configured)
npm run lint

# 4. Start dev server
npm run dev

# 5. Test in browser
# - Open http://localhost:3000
# - Check Console (F12) for errors
# - Check Network tab for 404s
# - Test on mobile (Ctrl+Shift+K)
```

## Git Workflow

```bash
# Create feature branch
git checkout -b refactor/feature-name

# Make changes, then:
git add .

# Commit with descriptive message
git commit -m "refactor: migrate [component] to use lib utilities"

# Push
git push origin refactor/feature-name

# Create PR with description:
# - What changed
# - Why it changed
# - How to test
# - Links to related issues
```

## Common Mistakes to Avoid

```typescript
// ❌ DON'T - Use 'any'
const data: any = await fetch(url)

// ✅ DO - Use proper types
const data: ResponseType = await fetchJson<ResponseType>(url)

// ❌ DON'T - Forget error handling
const data = await fetch(url).then(r => r.json())

// ✅ DO - Handle errors
try {
  const data = await fetchJson(url)
} catch (error) {
  // handle error
}

// ❌ DON'T - Magic strings/numbers
const delay = 5000
const endpoint = 'https://api.com/...'

// ✅ DO - Use constants
import { REVALIDATION_TIMES, API_ENDPOINTS } from '@/lib/constants'

// ❌ DON'T - Client-side data fetching in server components
export default function Page() {
  useEffect(() => {
    fetch(url).then(...) // WRONG - runs on server
  }, [])
}

// ✅ DO - Server-side data fetching
export default async function Page() {
  const data = await fetch(url)
  return <Client data={data} />
}

// ❌ DON'T - Forgot 'use client'
export default function InteractiveComponent() {
  const [open, setOpen] = useState(false) // ERROR - useState on server
}

// ✅ DO - Mark as client component
'use client'

export default function InteractiveComponent() {
  const [open, setOpen] = useState(false) // OK
}
```

## Performance Checklist

- [ ] Using Next.js Image component for all images
- [ ] Images have width/height attributes
- [ ] CSS is minified in production
- [ ] JavaScript is code-split by route
- [ ] API responses are cached
- [ ] Heavy computations use useCallback/useMemo
- [ ] No console.log() in production code
- [ ] No unused CSS classes
- [ ] No unused npm packages
- [ ] TypeScript strict mode enabled

## SEO Checklist

- [ ] All pages have unique meta titles & descriptions
- [ ] Canonical URLs set correctly
- [ ] Open Graph tags configured
- [ ] Structured data (schema.org) on all pages
- [ ] Sitemap generated (`/sitemap.xml`)
- [ ] Robots.txt allows crawlers (`/robots.txt`)
- [ ] Mobile-friendly (responsive, touch-friendly)
- [ ] Fast loading (< 3s on 4G)
- [ ] No duplicate content
- [ ] Proper heading hierarchy (h1, h2, h3)

---

**Print this guide and keep it handy during refactoring!**
Last updated: Choose actual date when printing
