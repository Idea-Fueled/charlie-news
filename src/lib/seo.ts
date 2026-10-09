/**
 * Centralized SEO Utilities for Charlie News
 */

/**
 * Returns the canonical site URL for production and development.
 * Strictly guarantees that no localhost URLs are used in production environments.
 */
export function getSiteUrl(): string {
  // If explicitly configured via environment variable
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/$/, '')
    if (!siteUrl.startsWith('http://') && !siteUrl.startsWith('https://')) {
      siteUrl = `https://${siteUrl}`
    }
    return siteUrl
  }

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL
  // If serverUrl is an actual remote hostname (not localhost or 127.0.0.1)
  if (serverUrl && !serverUrl.includes('localhost') && !serverUrl.includes('127.0.0.1')) {
    let clean = serverUrl.trim().replace(/\/$/, '')
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`
    }
    return clean
  }

  // Vercel production and deployment URLs
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim().replace(/\/$/, '')}`
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.trim().replace(/\/$/, '')}`
  }

  // Fallback to official Charlie News domain in production
  if (process.env.NODE_ENV === 'production') {
    return 'https://charlienews.com.au'
  }

  return (serverUrl || 'http://localhost:3005').trim().replace(/\/$/, '')
}

/**
 * Established Charlie News default hero image for Open Graph and social previews.
 * Uses the Australian residential architecture photography established across the codebase,
 * sized to standard 1200x630 (1.91:1) Open Graph share dimensions.
 */
export const DEFAULT_OG_IMAGE =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&h=630&q=80'

/**
 * Ensures an image URL is fully qualified, absolute, and publicly fetchable by social crawlers over HTTPS.
 * - Robustly handles string URLs, objects with .url, and Payload Media relations.
 * - Resolves protocol-relative URLs (//) to https://.
 * - Upgrades remote http:// URLs to https://.
 * - Prepends canonical site URL to relative paths, guaranteeing HTTPS in production.
 * - Optimizes Unsplash and Pexels featured images to standard 1200x630 Open Graph dimensions.
 * - Missing, empty, or invalid URLs safely fall back to DEFAULT_OG_IMAGE.
 */
export function toAbsoluteImageUrl(imageInput?: any): string {
  if (!imageInput) {
    return DEFAULT_OG_IMAGE
  }

  let rawUrl: string | null = null

  if (typeof imageInput === 'string') {
    rawUrl = imageInput.trim()
  } else if (typeof imageInput === 'object') {
    if (typeof imageInput.url === 'string' && imageInput.url.trim()) {
      rawUrl = imageInput.url.trim()
    } else if (imageInput.sizes?.og?.url) {
      rawUrl = String(imageInput.sizes.og.url).trim()
    } else if (imageInput.sizes?.large?.url) {
      rawUrl = String(imageInput.sizes.large.url).trim()
    } else if (typeof imageInput.filename === 'string' && imageInput.filename.trim()) {
      rawUrl = `/api/media/file/${imageInput.filename.trim()}`
    }
  }

  if (!rawUrl) {
    return DEFAULT_OG_IMAGE
  }

  // Reject invalid protocols or client data URIs for social preview metadata
  if (rawUrl.startsWith('data:') || rawUrl.startsWith('blob:') || rawUrl.startsWith('javascript:')) {
    return DEFAULT_OG_IMAGE
  }

  let finalUrl = rawUrl

  // Handle protocol-relative URLs
  if (finalUrl.startsWith('//')) {
    finalUrl = `https:${finalUrl}`
  } else if (finalUrl.startsWith('http://')) {
    // Upgrade remote HTTP URLs to HTTPS
    if (!finalUrl.includes('localhost') && !finalUrl.includes('127.0.0.1')) {
      finalUrl = finalUrl.replace(/^http:\/\//i, 'https://')
    }
  } else if (!finalUrl.startsWith('https://')) {
    // Relative path - prefix with canonical site URL
    const siteUrl = getSiteUrl()
    const cleanPath = finalUrl.startsWith('/') ? finalUrl : `/${finalUrl}`
    finalUrl = `${siteUrl}${cleanPath}`
    // Ensure HTTPS in production environments or remote deployments
    if (
      finalUrl.startsWith('http://') &&
      (process.env.NODE_ENV === 'production' ||
        (!finalUrl.includes('localhost') && !finalUrl.includes('127.0.0.1')))
    ) {
      finalUrl = finalUrl.replace(/^http:\/\//i, 'https://')
    }
  }

  // Optimize Unsplash images for social sharing (standard 1200x630 OG dimensions, web-optimized)
  try {
    if (finalUrl.includes('images.unsplash.com')) {
      const parsed = new URL(finalUrl)
      parsed.searchParams.set('w', '1200')
      parsed.searchParams.set('h', '630')
      parsed.searchParams.set('fit', 'crop')
      parsed.searchParams.set('auto', 'format')
      parsed.searchParams.set('q', '80')
      finalUrl = parsed.toString()
    } else if (finalUrl.includes('images.pexels.com')) {
      const parsed = new URL(finalUrl)
      parsed.searchParams.set('w', '1200')
      parsed.searchParams.set('h', '630')
      parsed.searchParams.set('fit', 'crop')
      parsed.searchParams.set('auto', 'compress')
      finalUrl = parsed.toString()
    }
  } catch {
    // If URL parsing fails, retain the formed URL
  }

  return finalUrl
}

/**
 * Safely escape characters for XML output (Sitemap and RSS feeds)
 */
export function escapeXml(unsafe: string): string {
  if (!unsafe) return ''
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      case '"':
        return '&quot;'
      default:
        return c
    }
  })
}
