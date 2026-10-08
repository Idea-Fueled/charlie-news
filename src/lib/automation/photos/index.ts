/**
 * Photo Resolver Engine for Charlie News
 * Unsplash is the primary and only automated photo provider:
 *
 * Claude article
 *     ↓
 * photoSearchWords
 *     ↓
 * Search Unsplash (Landscape >= 1200px)
 *     ↓
 * If suitable photo found:
 *     Attach photo metadata, save as Draft, send to Review Queue
 * If no suitable photo or API fails:
 *     Save as Draft, flag "Needs photo", log error in Automation Runs, send to Review Queue
 */

import { searchUnsplash } from './unsplash'
import { PhotoResolveResult, PhotoSearchOptions } from './types'

export * from './types'
export * from './unsplash'

export async function resolveArticlePhoto(
  searchWords: string,
  options: PhotoSearchOptions = {},
): Promise<PhotoResolveResult> {
  const query = (searchWords || '').trim()

  if (!query) {
    return {
      found: false,
      reason: 'No photo search keywords provided by Claude.',
    }
  }

  // -------------------------------------------------------------
  // Search Unsplash (Official API - Primary & Only Automated Provider)
  // -------------------------------------------------------------
  const unsplashRes = await searchUnsplash(query, options)
  if (unsplashRes.success && unsplashRes.photo) {
    return unsplashRes.photo
  }

  const failureReason =
    unsplashRes.error ||
    unsplashRes.reason ||
    `No suitable photo found on Unsplash for "${query}".`

  return {
    found: false,
    reason: failureReason,
    unsplashNotice: unsplashRes.reason,
    error: unsplashRes.error,
  }
}
