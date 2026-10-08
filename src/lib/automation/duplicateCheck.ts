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

/**
 * Checks if a candidate story was already processed within the previous 14 days
 */
export async function isDuplicateStory(
  payload: Payload,
  sourceUrl: string,
  headline: string,
  windowDays = AUTOMATION_CONFIG.DUPLICATE_WINDOW_DAYS,
): Promise<{ isDuplicate: boolean; reason?: string }> {
  const cutoffDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString()
  const fingerprint = generateSourceFingerprint(sourceUrl, headline)
  const cleanUrl = normalizeUrl(sourceUrl)
  const cleanTitle = normalizeHeadline(headline)

  // 1. Check exact fingerprint match within 14 days
  const byFingerprint = await payload.find({
    collection: 'articles',
    where: {
      and: [
        { sourceFingerprint: { equals: fingerprint } },
        { createdAt: { greater_than_equal: cutoffDate } },
      ],
    },
    limit: 1,
  })

  if (byFingerprint.totalDocs && byFingerprint.totalDocs > 0) {
    const existing = byFingerprint.docs[0]
    return {
      isDuplicate: true,
      reason: `Story fingerprint matches "${existing.headline}" created on ${existing.createdAt} (within ${windowDays} days)`,
    }
  }

  // 2. Check sourceUrl match within 14 days
  if (cleanUrl) {
    const byUrl = await payload.find({
      collection: 'articles',
      where: {
        and: [
          { sourceUrl: { equals: sourceUrl } },
          { createdAt: { greater_than_equal: cutoffDate } },
        ],
      },
      limit: 1,
    })

    if (byUrl.totalDocs && byUrl.totalDocs > 0) {
      const existing = byUrl.docs[0]
      return {
        isDuplicate: true,
        reason: `Source URL matches "${existing.headline}" created on ${existing.createdAt} (within ${windowDays} days)`,
      }
    }
  }

  // 3. Check normalized headline match within 14 days
  if (cleanTitle) {
    const recentArticles = await payload.find({
      collection: 'articles',
      where: {
        createdAt: { greater_than_equal: cutoffDate },
      },
      limit: 50,
      depth: 0,
    })

    for (const art of recentArticles.docs || []) {
      const existingNorm = normalizeHeadline(art.headline || '')
      if (existingNorm === cleanTitle) {
        return {
          isDuplicate: true,
          reason: `Headline strongly matches existing article "${art.headline}" created on ${art.createdAt} (within ${windowDays} days)`,
        }
      }
    }
  }

  return { isDuplicate: false }
}
