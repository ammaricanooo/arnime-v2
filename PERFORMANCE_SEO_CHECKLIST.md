/**
 * PERFORMANCE & SEO OPTIMIZATION CHECKLIST
 * Track and measure all performance and SEO improvements
 * 
 * Target Metrics:
 * - Lighthouse Score: 90+
 * - Core Web Vitals: All Green
 * - First Contentful Paint (FCP): < 1.5s
 * - Largest Contentful Paint (LCP): < 2.5s
 * - Cumulative Layout Shift (CLS): < 0.1
 * - Time to Interactive (TTI): < 3.8s
 * - Google Search Visibility: +40-50% growth (3 months)
 */

# Performance & SEO Optimization Checklist

## 1. SEO Fundamentals

### 1.1 Metadata & Tags
- [ ] **Home Page**
  - [ ] Title tag: descriptive, includes brand name (50-60 chars)
  - [ ] Meta description: compelling, includes CTA (150-160 chars)
  - [ ] Canonical URL: set to home page
  - [ ] OG tags: title, description, image, url
  - [ ] Twitter card: summary_large_image with image
  - [ ] Viewport meta tag: `width=device-width, initial-scale=1`
  - [ ] Language tag: `hreflang="en"` or appropriate language

- [ ] **Category Pages** (Anime, Manga, Comics)
  - [ ] Unique title for each category
  - [ ] Descriptive meta description
  - [ ] Canonical URL: distinct from other categories
  - [ ] OG tags with category-specific image
  - [ ] H1 tag: matches or closely matches title

- [ ] **Product Pages** (Anime Detail, Comic Detail)
  - [ ] Title: `[Title] - [Platform] | Anime Streaming`
  - [ ] Description: First 100 chars of synopsis
  - [ ] Canonical: `/anime/[slug]` or `/comic/[slug]`
  - [ ] Image: Poster with good quality (1200x630px minimum)
  - [ ] H1: Anime/Comic title

### 1.2 Structured Data (Schema.org)
- [ ] **Organization Schema**
  - [ ] Added to home page
  - [ ] Includes: name, description, logo, url, sameAs (social links)
  - [ ] Validates at schema.org/validate

- [ ] **Product/VideoObject Schema** (Anime)
  - [ ] Name: Anime title
  - [ ] Description: Full synopsis
  - [ ] Image: Poster URL
  - [ ] ContentRating: TV-14, R+, etc.
  - [ ] AggregateRating: score if available
  - [ ] Actor/Author: Studios and creators

- [ ] **CreativeWork Schema** (Manga/Comics)
  - [ ] Name: Comic title
  - [ ] Description: Full synopsis
  - [ ] Image: Poster/cover URL
  - [ ] Author: Creator/studio name
  - [ ] Genre: Multiple genres
  - [ ] DatePublished: Release date

- [ ] **BreadcrumbList Schema**
  - [ ] On all nested pages
  - [ ] Proper hierarchy: Home > Category > Item
  - [ ] Valid URL paths in each breadcrumb

- [ ] **WebSite Schema**
  - [ ] Added to home page or layout
  - [ ] SearchAction configured
  - [ ] Enables search box in SERP

### 1.3 Sitemap & Robots
- [ ] **Dynamic Sitemap** (`/sitemap.xml`)
  - [ ] Includes all anime/manga/comic pages
  - [ ] Updates weekly (ISR)
  - [ ] Includes `lastModified` timestamps
  - [ ] Sets proper `changeFrequency`
  - [ ] Max 50,000 URLs per file
  - [ ] File size < 50MB
  - [ ] Validates at xml-sitemaps.com

- [ ] **Robots.txt** (`/robots.txt`)
  - [ ] Allows Googlebot, Bingbot, other major crawlers
  - [ ] Blocks admin, API, internal pages
  - [ ] Sets appropriate crawl-delay (0 for Google, 1-2 for others)
  - [ ] References sitemap.xml
  - [ ] Accessible at domain.com/robots.txt

- [ ] **Google Search Console**
  - [ ] Property added and verified
  - [ ] Sitemap submitted
  - [ ] Mobile usability checked
  - [ ] Core Web Vitals monitored
  - [ ] Security issues none

- [ ] **Bing Webmaster Tools**
  - [ ] Property added and verified
  - [ ] Sitemap submitted
  - [ ] Crawl requests monitored

## 2. Core Web Vitals

### 2.1 Largest Contentful Paint (LCP) - Target: < 2.5s
- [ ] **Image Optimization**
  - [ ] Using Next.js `<Image>` component
  - [ ] Images serve in modern formats (WebP, AVIF)
  - [ ] Width/height attributes set
  - [ ] `priority={true}` on above-fold images
  - [ ] `quality={80}` or appropriate
  - [ ] `placeholder="blur"` for lazy-loaded images

- [ ] **Critical Resources**
  - [ ] Fonts loaded early (preload in next.config.ts)
  - [ ] CSS minified and critical CSS inlined
  - [ ] JavaScript deferred/async where possible
  - [ ] Large scripts lazy-loaded

- [ ] **Server Response Time**
  - [ ] Database queries optimized
  - [ ] API calls cached (5-30 min TTL)
  - [ ] ISR enabled (revalidate: 3600)
  - [ ] No N+1 queries

### 2.2 First Input Delay (FID) / Interaction to Next Paint (INP) - Target: < 100ms
- [ ] **JavaScript Optimization**
  - [ ] Code splitting implemented
  - [ ] Tree-shaking enabled (production build)
  - [ ] Dead code removed
  - [ ] 3rd party scripts deferred/async
  - [ ] React Concurrent rendering used

- [ ] **Event Listeners**
  - [ ] Debounce/throttle on scroll, resize
  - [ ] Long tasks broken into smaller chunks
  - [ ] useTransition for non-blocking updates
  - [ ] useDeferredValue for heavy renders

### 2.3 Cumulative Layout Shift (CLS) - Target: < 0.1
- [ ] **Layout Stability**
  - [ ] All images have width/height
  - [ ] Ads/embeds have reserved space
  - [ ] Fonts don't cause layout shift
  - [ ] Modal/dialog has proper CSS
  - [ ] No content reflowed after load

- [ ] **Hero Section**
  - [ ] Fixed aspect ratio containers
  - [ ] Skeleton loaders match final layout
  - [ ] No lazy-loaded content in hero

## 3. Performance Metrics

### 3.1 First Contentful Paint (FCP) - Target: < 1.5s
- [ ] Critical rendering path optimized
- [ ] Render-blocking resources minimized
- [ ] Below-the-fold content deferred
- [ ] Critical CSS inlined

### 3.2 Time to Interactive (TTI) - Target: < 3.8s
- [ ] JavaScript hydration fast (< 1s)
- [ ] Event listeners attached quickly
- [ ] No long main thread tasks
- [ ] Service Worker cached assets

### 3.3 Total Blocking Time (TBT) - Target: < 200ms
- [ ] Heavy computations moved to Web Workers
- [ ] Long tasks split into 50ms chunks
- [ ] useTransition for non-urgent updates
- [ ] Virtualization for large lists

## 4. Bundle Size Optimization

### 4.1 Code Splitting
- [ ] **Route-based Splitting**
  - [ ] Each route loads only needed code
  - [ ] Shared chunks extracted
  - [ ] Common vendor chunk (React, TW CSS)
  - [ ] Firebase vendor chunk separate

- [ ] **Component-level Splitting**
  - [ ] Heavy components lazy-loaded
  - [ ] Modal/dialog content lazy-loaded
  - [ ] Video player lazy-loaded

- [ ] **Bundle Analysis**
  - [ ] Next.js analyze tool run: `npm run analyze`
  - [ ] Total bundle < 200KB (gzipped)
  - [ ] Main JS < 80KB (gzipped)
  - [ ] Each route JS < 30KB (gzipped)

### 4.2 Dependency Review
- [ ] **Unused Dependencies**
  - [ ] mongodb.js - REMOVE (unused)
  - [ ] Review all 50+ npm packages
  - [ ] Replace heavy packages with lighter alternatives
  - [ ] Remove polyfills for modern browsers only

- [ ] **Package Sizes**
  - [ ] sweetalert2: Check if can use native alerts
  - [ ] Check if all Firebase modules needed
  - [ ] Consider alternatives for HLS.js

## 5. Caching Strategy

### 5.1 HTTP Caching Headers
- [ ] **Static Assets** (images, CSS, JS)
  - [ ] Cache-Control: `max-age=31536000, immutable` (1 year)
  - [ ] Content is hash-versioned
  - [ ] No cache revalidation needed

- [ ] **Dynamic Content** (pages, data)
  - [ ] Cache-Control: `s-maxage=3600, stale-while-revalidate=86400` (1 hour ISR)
  - [ ] Revalidate: defined in next.config.ts
  - [ ] ISR background regeneration

- [ ] **API Responses**
  - [ ] Cached in-memory for 5 minutes (lib/api.ts)
  - [ ] Cache-Control: `max-age=300, stale-while-revalidate=600`
  - [ ] Unique cache keys per endpoint

### 5.2 Browser Caching
- [ ] Service Worker enabled
- [ ] Offline support for critical pages
- [ ] IndexedDB for large data sets
- [ ] LocalStorage for user preferences

## 6. Image Optimization

### 6.1 Image Serving
- [ ] **Next.js Image Component**
  - [ ] Used for all dynamic images
  - [ ] Static images imported as modules
  - [ ] Width/height attributes set
  - [ ] `quality={80}` (good balance)

- [ ] **Image Formats**
  - [ ] Modern: WebP, AVIF
  - [ ] Fallback: JPEG for older browsers
  - [ ] Responsive: srcset generated
  - [ ] Different sizes for mobile/desktop

- [ ] **Image Sizing**
  - [ ] Poster images: 200x300px (card), 500x750px (detail)
  - [ ] Hero image: 1200x630px minimum (scaled to 1920x1080px)
  - [ ] Thumbnail: 100x150px

| Image Type | Size | Quality | Format |
|-----------|------|---------|--------|
| Poster Card | 200x300 | 75 | WebP |
| Poster Detail | 500x750 | 85 | WebP |
| Hero Background | 1920x1080 | 70 | AVIF |
| Thumbnail | 100x150 | 70 | WebP |
| OG Image | 1200x630 | 80 | JPEG |

## 7. Lighthouse Audit Targets

### 7.1 Target Scores
| Category | Mobile | Desktop |
|----------|--------|---------|
| Performance | 85+ | 90+ |
| Accessibility | 95+ | 95+ |
| Best Practices | 95+ | 95+ |
| SEO | 95+ | 95+ |

### 7.2 Common Issues to Address
- [ ] **Performance**
  - [ ] Eliminate render-blocking resources
  - [ ] Defer offscreen images (lazy loading)
  - [ ] Minify CSS, JavaScript
  - [ ] Remove unused CSS/JS
  - [ ] Enable text compression

- [ ] **Accessibility**
  - [ ] Add alt text to images
  - [ ] Use semantic HTML (h1, nav, main, etc.)
  - [ ] Sufficient color contrast (4.5:1)
  - [ ] Form labels associated
  - [ ] Keyboard navigation supported

- [ ] **Best Practices**
  - [ ] No console errors/warnings
  - [ ] HTTPS enabled
  - [ ] No cross-origin issues
  - [ ] No deprecated APIs used
  - [ ] Secure cookies (SameSite, Secure)

- [ ] **SEO**
  - [ ] Mobile friendly
  - [ ] Proper meta tags
  - [ ] Valid structured data
  - [ ] Crawlable links
  - [ ] No duplicate content

## 8. Monitoring & Analytics

### 8.1 Google Analytics 4
- [ ] Property created
- [ ] Tracking code installed (in next.config.ts)
- [ ] Goals/conversions defined
- [ ] User engagement tracked
- [ ] Page views monitored

### 8.2 Core Web Vitals Monitoring
- [ ] web-vitals library integrated
- [ ] Metrics sent to analytics
- [ ] CrUX data reviewed monthly
- [ ] Field data vs Lab data compared

### 8.3 Error Tracking
- [ ] Sentry setup (optional)
- [ ] JavaScript errors captured
- [ ] API errors logged
- [ ] 404 errors tracked
- [ ] Server errors monitored

## 9. Mobile Optimization

### 9.1 Mobile-Friendly
- [ ] Viewport meta tag set
- [ ] Touch-friendly buttons (48x48px minimum)
- [ ] Text readable without zoom
- [ ] No horizontal scrolling
- [ ] Fast load on 4G

### 9.2 Mobile Performance
- [ ] LCP < 2.5s on 4G
- [ ] FCP < 1.5s on 4G
- [ ] CLS < 0.1 on all devices
- [ ] Images optimized for mobile

## 10. International & Localization

### 10.1 Hreflang Tags
- [ ] If supporting multiple countries
- [ ] Added to `<head>`
- [ ] Self-referential hreflang
- [ ] Proper language codes (en, id, ja, etc.)

### 10.2 Content Language
- [ ] HTML lang attribute: `<html lang="en">`
- [ ] Or `lang="id"` if Indonesian
- [ ] Content consistently in one language

## 11. Social Media Integration

### 11.1 Open Graph Tags
- [ ] `og:title` - Page title
- [ ] `og:description` - Meta description
- [ ] `og:image` - 1200x630px image
- [ ] `og:url` - Canonical URL
- [ ] `og:type` - website, article, etc.

### 11.2 Twitter Card
- [ ] `twitter:card` - summary_large_image
- [ ] `twitter:title` - Title (< 70 chars)
- [ ] `twitter:description` - Description (< 200 chars)
- [ ] `twitter:image` - 1200x630px image

## 12. Security & Privacy

### 12.1 Security Headers (in next.config.ts)
- [ ] `Strict-Transport-Security` - HTTPS only
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY` (unless iframes needed)
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Content-Security-Policy` - Restrict resources

### 12.2 Privacy
- [ ] GDPR consent banner (if EU users)
- [ ] Privacy policy page
- [ ] Cookie policy page
- [ ] <data deletion/export option (GDPR requirement)

## Optimization Priority Matrix

### Priority 1 (DO FIRST - High Impact, High Effort)
- [ ] Implement server components (metadata, ISR)
- [ ] Add structured data (schema.org)
- [ ] Create sitemap & robots.txt
- [ ] Image optimization (Next.js Image)
- [ ] Code splitting
- [ ] API caching

**Estimated Impact**: +30-40% SEO traffic, +50% page speed

### Priority 2 (DO SECOND - Medium Impact)
- [ ] Remove unused dependencies
- [ ] Add error boundaries
- [ ] Monitoring & analytics
- [ ] Mobile optimization
- [ ] Open Graph tags
- [ ] Breadcrumb navigation

**Estimated Impact**: +10-20% SEO traffic, +20-30% page speed

### Priority 3 (DO LAST - Low Impact)
- [ ] Service Worker
- [ ] Advanced caching strategies
- [ ] Internationalization
- [ ] Advanced analytics
- [ ] A/B testing setup

**Estimated Impact**: +5-10% conversions, +10% page speed

## Success Timeline

| Timeline | Goal | Action |
|----------|------|--------|
| Week 1-2 | Priority 1 | Structural changes |
| Week 3 | Testing | Validation & fixes |
| Week 4+ | Monitoring | Analytics & optimization |
| Month 2-3 | Growth | SEO improvements visible |

## Verification Tools

1. **Local Testing**
```bash
npm run build
npm run start
# Visit http://localhost:3000 in Lighthouse
```

2. **Online Tools**
   - [PageSpeed Insights](https://pagespeed.web.dev/)
   - [schema.org Validator](https://schema.org/validator/)
   - [Rich Results Tester](https://search.google.com/test/rich-results)
   - [Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
   - [Structured Data Testing](https://www.bing.com/webmaster/tools/schema-validator)

3. **Search Console**
   - [Google Search Console](https://search.google.com/search-console/)
   - [Bing Webmaster](https://www.bing.com/webmaster/)

## Progress Tracking

Copy this to track your progress through the checklist:

```
Phase 1 - SEO Fundamentals: _____% complete
Phase 2 - Core Web Vitals: _____% complete
Phase 3 - Performance: _____% complete
Phase 4 - Bundle Optimization: _____% complete
Phase 5 - Caching: _____% complete
Phase 6 - Images: _____% complete
Phase 7 - Lighthouse: _____% complete
Phase 8 - Monitoring: _____% complete
Phase 9 - Mobile: _____% complete
Phase 10 - Additional: _____% complete

Overall Progress: _____% complete
```

---

**Last Updated**: [Current Date]
**Review Frequency**: Weekly during refactoring, Monthly after launch
