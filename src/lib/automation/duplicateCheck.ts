/**
 * Duplicate Protection for Charlie News Automation
 * Enforces the 14-day repeat prevention rule per the SOW
 */

import type { Payload } from 'payload'
import { AUTOMATION_CONFIG } from '@/config/automation'

/**
 * Normalizes a URL by removing tracking query parameters and trailing slashes
 */
export function normalizeUrl(url: string): string {
  if (!url) return ''
  try {
    const parsed = new URL(url.trim())
    const searchParams = new URLSearchParams()
    
    // Discard advertising/tracking query parameters
    for (const [key, value] of parsed.searchParams.entries()) {
      const lowerKey = key.toLowerCase()
      if (
        !lowerKey.startsWith('utm_') &&
        lowerKey !== 'ref' &&
        lowerKey !== 'fbclid' &&
        lowerKey !== 'gclid' &&
        lowerKey !== 'source' &&
        lowerKey !== 'campaign'
      ) {
        searchParams.append(key, value)
      }
    }

    const search = searchParams.toString() ? `?${searchParams.toString()}` : ''
    const cleanPath = parsed.pathname.replace(/\/+$/, '') || '/'
    return `${parsed.protocol}//${parsed.host.toLowerCase()}${cleanPath}${search}`
  } catch {
    return url.trim().toLowerCase().replace(/\/+$/, '')
  }
}

/**
 * Normalizes a headline for linguistic similarity comparison
 */
export function normalizeHeadline(headline: string): string {
  if (!headline) return ''
  return headline
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Creates a unique deterministic fingerprint for a story
 */
export function generateSourceFingerprint(sourceUrl: string, headline: string): string {
  const normUrl = normalizeUrl(sourceUrl)
  const normTitle = normalizeHeadline(headline)
  return `${normUrl}|${normTitle}`
}

export interface DuplicateChecker {
  isDuplicate(sourceUrl: string, headline: string): { isDuplicate: boolean; reason?: string }
}

/**
 * Creates an in-memory duplicate checker loaded from the 14-day database window in a single query.
 * Replaces hundreds of repetitive sequential database round-trips with instant in-memory lookups.
 */
export async function createDuplicateChecker(
  payload: Payload,
  windowDays = AUTOMATION_CONFIG.DUPLICATE_WINDOW_DAYS,
): Promise<DuplicateChecker> {
  const cutoffDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString()

  // Single batch fetch of all articles within the 14-day window (depth: 0 for minimal payload)
  const recentArticles = await payload.find({
    collection: 'articles',
    where: {
      createdAt: { greater_than_equal: cutoffDate },
    },
    limit: 500,
    depth: 0,
  })

  const fingerprints = new Map<string, { headline: string; createdAt: string }>()
  const urls = new Map<string, { headline: string; createdAt: string }>()
  const headlines = new Map<string, { headline: string; createdAt: string }>()

  for (const art of recentArticles.docs || []) {
    const artHeadline = art.headline || ''
    const artDate = art.createdAt || ''

    if (art.sourceFingerprint) {
      fingerprints.set(art.sourceFingerprint, { headline: artHeadline, createdAt: artDate })
    }
    if (art.sourceUrl) {
      urls.set(art.sourceUrl.trim(), { headline: artHeadline, createdAt: artDate })
      const clean = normalizeUrl(art.sourceUrl)
      if (clean) urls.set(clean, { headline: artHeadline, createdAt: artDate })
    }
    const normHead = normalizeHeadline(artHeadline)
    if (normHead) {
      headlines.set(normHead, { headline: artHeadline, createdAt: artDate })
    }
  }

  return {
    isDuplicate(sourceUrl: string, headline: string): { isDuplicate: boolean; reason?: string } {
      const fingerprint = generateSourceFingerprint(sourceUrl, headline)
      const cleanUrl = normalizeUrl(sourceUrl)
      const cleanTitle = normalizeHeadline(headline)

      // 1. Exact fingerprint match
      const matchedFp = fingerprints.get(fingerprint)
      if (matchedFp) {
        return {
          isDuplicate: true,
          reason: `Story fingerprint matches "${matchedFp.headline}" created on ${matchedFp.createdAt} (within ${windowDays} days)`,
        }
      }

      // 2. Source URL match
      if (cleanUrl) {
        const matchedUrl = urls.get(cleanUrl) || urls.get(sourceUrl.trim())
        if (matchedUrl) {
          return {
            isDuplicate: true,
            reason: `Source URL matches "${matchedUrl.headline}" created on ${matchedUrl.createdAt} (within ${windowDays} days)`,
          }
        }
      }

      // 3. Normalized headline match
      if (cleanTitle) {
        const matchedHead = headlines.get(cleanTitle)
        if (matchedHead) {
          return {
            isDuplicate: true,
            reason: `Headline strongly matches existing article "${matchedHead.headline}" created on ${matchedHead.createdAt} (within ${windowDays} days)`,
          }
        }
      }

      return { isDuplicate: false }
    },
  }
}

/**
 * Checks if a candidate story was already processed within the previous 14 days
 */
export async function isDuplicateStory(
  payload: Payload,
  sourceUrl: string,
  headline: string,
  windowDays = AUTOMATION_CONFIG.DUPLICATE_WINDOW_DAYS,
): Promise<{ isDuplicate: boolean; reason?: string }> {
  const checker = await createDuplicateChecker(payload, windowDays)
  return checker.isDuplicate(sourceUrl, headline)
}
