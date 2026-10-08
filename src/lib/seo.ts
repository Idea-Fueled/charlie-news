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
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL
  // If serverUrl is an actual remote hostname (not localhost or 127.0.0.1)
  if (serverUrl && !serverUrl.includes('localhost') && !serverUrl.includes('127.0.0.1')) {
    return serverUrl.replace(/\/$/, '')
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`
  }

  // Fallback to official Charlie News domain in production
  if (process.env.NODE_ENV === 'production') {
    return 'https://charlienews.com.au'
  }

  return (serverUrl || 'http://localhost:3005').replace(/\/$/, '')
}

/**
 * Established Charlie News default hero image for Open Graph and social previews.
 * Uses the Australian residential architecture photography established across the codebase,
 * sized to standard 1200x630 (1.91:1) Open Graph share dimensions.
 */
export const DEFAULT_OG_IMAGE =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&h=630&q=80'

/**
 * Ensures an image URL is fully qualified, absolute, and publicly fetchable by social crawlers.
 * - Absolute HTTP/HTTPS URLs are preserved.
 * - Relative URLs (/api/media/file/...) are prefixed with the canonical site URL.
 * - Missing or invalid URLs safely fallback to DEFAULT_OG_IMAGE.
 */
export function toAbsoluteImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return DEFAULT_OG_IMAGE
  }
  const trimmed = url.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  const siteUrl = getSiteUrl()
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return `${siteUrl}${cleanPath}`
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
