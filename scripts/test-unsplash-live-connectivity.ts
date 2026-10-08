import 'dotenv/config'
import { searchUnsplash } from '../src/lib/automation/photos/unsplash'

async function runLiveUnsplashTest() {
  const envDetected = Boolean(
    process.env.UNSPLASH_ACCESS_KEY?.trim() || process.env.UNSPLASH_API_KEY?.trim(),
  )

  if (!envDetected) {
    console.log(JSON.stringify({
      envDetected: false,
      apiStatus: 'Failed',
      usableResultsCount: 0,
      suitableImageFound: false,
      errorMessage: 'UNSPLASH_ACCESS_KEY not found in environment variables.',
    }, null, 2))
    process.exit(1)
  }

  // Also query directly using the accessKey in memory (never logged/printed) to count total results
  const accessKey = (process.env.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_API_KEY)!.trim()
  const query = 'Australian house renovation'
  
  let rawApiSuccess = false
  let rawResultsCount = 0
  let usableLandscapeCount = 0
  let rawErrorMessage: string | null = null

  try {
    const url = new URL('https://api.unsplash.com/search/photos')
    url.searchParams.set('query', query)
    url.searchParams.set('orientation', 'landscape')
    url.searchParams.set('per_page', '15')

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
        'User-Agent': 'CharlieNews/1.0',
      },
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      rawErrorMessage = `HTTP ${res.status} ${res.statusText}: ${errText.slice(0, 100)}`
    } else {
      rawApiSuccess = true
      const data = await res.json()
      const items = Array.isArray(data?.results) ? data.results : []
      rawResultsCount = items.length
      usableLandscapeCount = items.filter(
        (item: any) =>
          typeof item.width === 'number' &&
          typeof item.height === 'number' &&
          item.width >= 1200 &&
          item.width > item.height,
      ).length
    }
  } catch (err: any) {
    rawErrorMessage = err.message || String(err)
  }

  // Also verify through the official project integration
  const integrationResult = await searchUnsplash(query, { useMock: false })

  const output = {
    envDetected: true,
    apiStatus: integrationResult.success ? 'Success' : 'Failed',
    httpStatus: rawApiSuccess ? 200 : 'Error',
    rawResultsReturned: rawResultsCount,
    usableLandscapeGte1200pxCount: usableLandscapeCount,
    suitableImageFound: Boolean(integrationResult.success && integrationResult.photo),
    photoDetails: integrationResult.photo
      ? {
          width: integrationResult.photo.width,
          height: integrationResult.photo.height,
          source: integrationResult.photo.source,
          photographer: integrationResult.photo.photographer,
          hasRequiredUtm:
            integrationResult.photo.creditLink.includes('utm_source=charlie_news') &&
            integrationResult.photo.creditLink.includes('utm_medium=referral'),
        }
      : null,
    errorMessage: integrationResult.error || integrationResult.reason || rawErrorMessage,
  }

  console.log(JSON.stringify(output, null, 2))
}

runLiveUnsplashTest().catch((err) => {
  console.error('Test execution error:', err.message || err)
  process.exit(1)
})
