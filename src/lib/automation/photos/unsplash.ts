/**
 * Official Unsplash API Integration (Primary & Only Automated Provider)
 * Server-side search for landscape photos matching Claude's photoSearchWords
 * Requirement: Minimum width 1200px, landscape orientation, required UTM attribution tracking,
 * and no downloading/copying into our own storage (use Unsplash CDN URL directly).
 */

import { SelectedPhoto, PhotoSearchOptions } from './types'

const UNSPLASH_SEARCH_URL = 'https://api.unsplash.com/search/photos'
const DEFAULT_MIN_WIDTH = 1200
const UTM_TRACKING_SUFFIX = 'utm_source=charlie_news&utm_medium=referral'

export interface UnsplashSearchResult {
  success: boolean
  photo?: SelectedPhoto
  reason?: string
  error?: string
}

function appendUtmTracking(urlStr: string): string {
  if (!urlStr) return ''
  try {
    const url = new URL(urlStr)
    url.searchParams.set('utm_source', 'charlie_news')
    url.searchParams.set('utm_medium', 'referral')
    return url.toString()
  } catch {
    const separator = urlStr.includes('?') ? '&' : '?'
    return `${urlStr}${separator}${UTM_TRACKING_SUFFIX}`
  }
}

/**
 * Triggers Unsplash download tracking endpoint asynchronously per API guidelines.
 * Fire-and-forget: does not block article draft creation or throw errors.
 */
function triggerUnsplashDownloadTracking(downloadLocationUrl?: string, accessKey?: string): void {
  if (!downloadLocationUrl || !accessKey) return
  fetch(downloadLocationUrl, {
    method: 'GET',
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      'Accept-Version': 'v1',
    },
  }).catch((err) => {
    // Non-critical tracking call, ignore errors
    console.warn('Unsplash download tracking ping failed:', err.message)
  })
}

export async function searchUnsplash(
  query: string,
  options: PhotoSearchOptions = {},
): Promise<UnsplashSearchResult> {
  const minWidth = options.minWidth || DEFAULT_MIN_WIDTH
  const cleanedQuery = query.trim()

  if (!cleanedQuery) {
    return { success: false, reason: 'Empty photo search query provided.' }
  }

  // 1. Mock Adapter for automated tests / when live credentials are absent
  if (options.useMock || process.env.USE_MOCK_PHOTOS === 'true') {
    if (options.forceFailUnsplash) {
      return { success: false, error: 'Unsplash API simulated failure (mock).' }
    }

    if (options.mockUnsplashPhoto === null) {
      return { success: false, reason: 'Unsplash returned no results for query (mock).' }
    }

    // Default mock photo satisfying all SOW requirements
    const mockUnsplash: SelectedPhoto = {
      found: true,
      source: 'Unsplash',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
      width: 1600,
      height: 1067,
      alt: `${cleanedQuery} - Australian property and residential renovation`,
      photographer: 'RArchitecture',
      photographerUrl: appendUtmTracking('https://unsplash.com/@rarchitecture'),
      creditLink: appendUtmTracking('https://unsplash.com/photos/modern-suburban-home-J9jS7t4y3'),
      sourceId: 'J9jS7t4y3',
      ...options.mockUnsplashPhoto,
    }

    // Verify mock constraints
    if (mockUnsplash.width < minWidth) {
      return {
        success: false,
        reason: `Unsplash photo width (${mockUnsplash.width}px) is below minimum required ${minWidth}px.`,
      }
    }
    if (mockUnsplash.width <= mockUnsplash.height) {
      return {
        success: false,
        reason: `Unsplash photo is not landscape orientation (${mockUnsplash.width}x${mockUnsplash.height}).`,
      }
    }

    return { success: true, photo: mockUnsplash }
  }

  // 2. Live Access Key verification
  const accessKey = (
    process.env.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_API_KEY
  )?.trim()
  if (!accessKey) {
    return {
      success: false,
      reason: 'Missing UNSPLASH_ACCESS_KEY in environment variables.',
    }
  }

  // 3. Official Unsplash API Search Request
  try {
    const url = new URL(UNSPLASH_SEARCH_URL)
    url.searchParams.set('query', cleanedQuery)
    url.searchParams.set('orientation', 'landscape')
    url.searchParams.set('per_page', '15')

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000) // 15s timeout

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
        'User-Agent': 'CharlieNews/1.0',
      },
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      if (response.status === 429) {
        return {
          success: false,
          error: 'Unsplash API rate limit exceeded (429).',
        }
      }
      return {
        success: false,
        error: `Unsplash API HTTP ${response.status} ${response.statusText}: ${errText.slice(0, 150)}`,
      }
    }

    const data = await response.json()
    const results: any[] = Array.isArray(data?.results) ? data.results : []

    if (results.length === 0) {
      return {
        success: false,
        reason: `No landscape photos found on Unsplash for "${cleanedQuery}".`,
      }
    }

    // 4. Find Top Suitable Result Meeting SOW Constraints
    for (const item of results) {
      const width = typeof item.width === 'number' ? item.width : 0
      const height = typeof item.height === 'number' ? item.height : 0

      // Must be at least 1200px wide
      if (width < minWidth) {
        continue
      }

      // Must be landscape-oriented
      if (width <= height) {
        continue
      }

      // Must have valid Unsplash image URL (prefer urls.full or urls.regular)
      const imageUrl = item.urls?.full || item.urls?.regular
      if (!imageUrl || typeof imageUrl !== 'string') {
        continue
      }

      const photographerName = (item.user?.name || item.user?.username || 'Unsplash Photographer').trim()
      const photographerProfile = item.user?.links?.html
        ? appendUtmTracking(item.user.links.html)
        : undefined
      const photoPageLink = item.links?.html
        ? appendUtmTracking(item.links.html)
        : appendUtmTracking('https://unsplash.com')

      const altText = (
        item.alt_description ||
        item.description ||
        `${cleanedQuery} photograph`
      ).trim()

      // Fire asynchronous download tracking ping
      if (item.links?.download_location) {
        triggerUnsplashDownloadTracking(item.links.download_location, accessKey)
      }

      return {
        success: true,
        photo: {
          found: true,
          source: 'Unsplash',
          url: imageUrl,
          width,
          height,
          alt: altText,
          photographer: photographerName,
          photographerUrl: photographerProfile,
          creditLink: photoPageLink,
          sourceId: String(item.id || ''),
          downloadLocation: item.links?.download_location,
        },
      }
    }

    return {
      success: false,
      reason: `Unsplash returned ${results.length} photo(s) for "${cleanedQuery}", but none met the landscape + >=${minWidth}px requirements.`,
    }
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError'
    return {
      success: false,
      error: isTimeout
        ? 'Unsplash API request timed out after 15 seconds.'
        : `Unsplash API request failed: ${err.message || String(err)}`,
    }
  }
}
