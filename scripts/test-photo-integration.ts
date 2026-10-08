import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'
import {
  searchUnsplash,
  resolveArticlePhoto,
} from '../src/lib/automation/photos'
import { runClaudeAutomation } from '../src/lib/automation/orchestrator'

let passedTests = 0
let failedTests = 0

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ✗ FAILED: ${msg}`)
    failedTests += 1
    throw new Error(`Assertion failed: ${msg}`)
  } else {
    console.log(`  ✓ ${msg}`)
    passedTests += 1
  }
}

async function runTestSuite() {
  console.log('================================================================')
  console.log('CHARLIE NEWS - UNSPLASH PHOTO INTEGRATION TEST SUITE')
  console.log('================================================================\n')

  // -------------------------------------------------------------
  // TEST 1: Successful Unsplash Image Search
  // -------------------------------------------------------------
  console.log('--- TEST 1: Successful Unsplash Image Search ---')
  const unsplashSearch = await searchUnsplash('Sydney terrace renovation', {
    useMock: true,
  })
  assert(unsplashSearch.success === true, 'Unsplash search succeeded')
  assert(Boolean(unsplashSearch.photo), 'Photo returned from Unsplash')
  assert(unsplashSearch.photo?.source === 'Unsplash', 'Photo source is "Unsplash"')
  assert(
    Boolean(unsplashSearch.photo?.url && unsplashSearch.photo.url.startsWith('https://')),
    `Valid Unsplash image URL returned: ${unsplashSearch.photo?.url}`,
  )
  assert(
    unsplashSearch.photo?.creditLink.includes('utm_source=charlie_news') === true,
    'Photo credit link includes required UTM source tracking: utm_source=charlie_news',
  )
  assert(
    unsplashSearch.photo?.creditLink.includes('utm_medium=referral') === true,
    'Photo credit link includes required UTM medium tracking: utm_medium=referral',
  )
  assert(
    Boolean(unsplashSearch.photo?.photographerUrl?.includes('utm_source=charlie_news')),
    'Photographer profile link includes required UTM source tracking',
  )
  assert(
    Boolean(unsplashSearch.photo?.photographerUrl?.includes('utm_medium=referral')),
    'Photographer profile link includes required UTM medium tracking',
  )
  assert(
    Boolean(unsplashSearch.photo?.photographer),
    `Photographer credit recorded: ${unsplashSearch.photo?.photographer}`,
  )
  assert(
    Boolean(unsplashSearch.photo?.sourceId),
    `Unsplash photo ID recorded: ${unsplashSearch.photo?.sourceId}`,
  )

  // -------------------------------------------------------------
  // TEST 2: Suitable Image Selection (Landscape & >= 1200px Width)
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Suitable Image Selection ---')
  // 2a. Valid dimensions meeting criteria
  assert(
    (unsplashSearch.photo?.width || 0) >= 1200,
    `Selected image width meets >= 1200px requirement (got ${unsplashSearch.photo?.width}px)`,
  )
  assert(
    (unsplashSearch.photo?.width || 0) > (unsplashSearch.photo?.height || 0),
    `Selected image orientation is landscape (${unsplashSearch.photo?.width}x${unsplashSearch.photo?.height})`,
  )

  // 2b. Rejection of photo below 1200px width
  const unsplashSmall = await searchUnsplash('small photo query', {
    useMock: true,
    mockUnsplashPhoto: { width: 1080, height: 720 },
  })
  assert(unsplashSmall.success === false, 'Rejected photo below 1200px width')
  assert(
    unsplashSmall.reason?.includes('below minimum required 1200px') === true,
    `Error reason cites minimum width constraint: ${unsplashSmall.reason}`,
  )

  // 2c. Rejection of non-landscape (portrait) photo
  const unsplashPortrait = await searchUnsplash('portrait photo query', {
    useMock: true,
    mockUnsplashPhoto: { width: 1400, height: 1800 },
  })
  assert(unsplashPortrait.success === false, 'Rejected portrait photo')
  assert(
    unsplashPortrait.reason?.includes('not landscape orientation') === true,
    `Error reason cites landscape constraint: ${unsplashPortrait.reason}`,
  )

  // 2d. Rejection of square photo
  const unsplashSquare = await searchUnsplash('square query', {
    useMock: true,
    mockUnsplashPhoto: { width: 1400, height: 1400 },
  })
  assert(unsplashSquare.success === false, 'Rejected square photo (width <= height)')

  // 2e. Master resolver resolves Unsplash photo
  const resolvedPhoto = await resolveArticlePhoto('Melbourne architecture modern', {
    useMock: true,
  })
  assert(resolvedPhoto.found === true, 'Master resolver successfully resolved photo via Unsplash')
  if (resolvedPhoto.found) {
    assert(resolvedPhoto.source === 'Unsplash', 'Master resolver source is "Unsplash"')
    assert(resolvedPhoto.width >= 1200, 'Master resolver photo width is >= 1200px')
    assert(resolvedPhoto.width > resolvedPhoto.height, 'Master resolver photo orientation is landscape')
  }

  // -------------------------------------------------------------
  // TEST 3: Image Metadata Saved Correctly
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Image Metadata Saved Correctly ---')
  if (resolvedPhoto.found) {
    assert(typeof resolvedPhoto.url === 'string' && resolvedPhoto.url.length > 0, 'Image URL is non-empty string')
    assert(typeof resolvedPhoto.width === 'number' && resolvedPhoto.width >= 1200, 'Width is valid number >= 1200')
    assert(typeof resolvedPhoto.height === 'number' && resolvedPhoto.height > 0, 'Height is valid positive number')
    assert(resolvedPhoto.source === 'Unsplash', 'Source is explicitly "Unsplash"')
    assert(typeof resolvedPhoto.alt === 'string' && resolvedPhoto.alt.length > 0, 'Alt text is valid descriptive string')
    assert(typeof resolvedPhoto.photographer === 'string' && resolvedPhoto.photographer.length > 0, 'Photographer name is valid string')
    assert(
      typeof resolvedPhoto.photographerUrl === 'string' && resolvedPhoto.photographerUrl.includes('utm_source='),
      'Photographer/profile URL is valid string with UTM tracking',
    )
    assert(
      typeof resolvedPhoto.creditLink === 'string' && resolvedPhoto.creditLink.includes('utm_source='),
      'Credit link is valid string with UTM tracking',
    )
    assert(typeof resolvedPhoto.sourceId === 'string' && resolvedPhoto.sourceId.length > 0, 'Unsplash sourceId is valid string')
  }

  // -------------------------------------------------------------
  // TEST 4: Draft + Review Queue Flow
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Draft + Review Queue Flow ---')
  const payload = await getPayload({ config: configPromise })

  const mockStoriesFeed = `
    <rss version="2.0">
      <channel>
        <title>Australian Property Daily</title>
        <item>
          <title>NSW Heritage Planning Rules Update For Residential Properties ${Date.now()}-1</title>
          <link>https://wire.com.au/property/heritage-update-${Date.now()}-1</link>
          <description>Councils update residential design guidelines.</description>
          <pubDate>Tue, 06 Oct 2026 10:00:00 +1000</pubDate>
        </item>
        <item>
          <title>Victoria Regional Housing Demand Trends and Building Costs ${Date.now()}-2</title>
          <link>https://wire.com.au/property/regional-demand-${Date.now()}-2</link>
          <description>Regional hubs record steady owner-occupier interest.</description>
          <pubDate>Tue, 06 Oct 2026 10:15:00 +1000</pubDate>
        </item>
      </channel>
    </rss>
  `

  console.log('Running orchestrator with Unsplash photo assignment...')
  const runReportWithPhoto = await runClaudeAutomation(payload, {
    force: true,
    useMock: true,
    rssFeeds: ['data:application/rss+xml,' + encodeURIComponent(mockStoriesFeed)],
  })

  assert(runReportWithPhoto.success, `Orchestrator completed successfully: ${runReportWithPhoto.message}`)
  assert(runReportWithPhoto.draftsCreated > 0, `Created ${runReportWithPhoto.draftsCreated} drafts in Review Queue`)
  assert(
    runReportWithPhoto.photosAssigned > 0,
    `Assigned Unsplash photos to drafts (${runReportWithPhoto.photosAssigned} assigned)`,
  )

  for (const draftId of runReportWithPhoto.draftIds) {
    const draft = await payload.findByID({ collection: 'articles', id: draftId })

    // Must be Draft in Review Queue, NEVER auto-published
    assert(draft.status === 'Draft', `Article #${draftId} saved with status 'Draft' (in Review Queue)`)
    assert(
      !draft.flags || !draft.flags.includes('Needs photo'),
      `Article #${draftId} does NOT have 'Needs photo' flag when Unsplash photo is found`,
    )

    // Verify all required image metadata fields on the Article document
    assert(Boolean(draft.image?.url), `Article #${draftId} has image URL: ${draft.image?.url}`)
    assert(draft.image?.source === 'Unsplash', `Article #${draftId} image source is strictly 'Unsplash'`)
    assert((draft.image?.width || 0) >= 1200, `Article #${draftId} image width is >= 1200px (${draft.image?.width}px)`)
    assert((draft.image?.height || 0) > 0, `Article #${draftId} image height is valid (${draft.image?.height}px)`)
    assert(Boolean(draft.imageCredit?.name), `Article #${draftId} has photographer credit: ${draft.imageCredit?.name}`)
    assert(
      Boolean(draft.imageCredit?.link && draft.imageCredit.link.includes('utm_source=charlie_news')),
      `Article #${draftId} has photographer profile/credit link with UTM: ${draft.imageCredit?.link}`,
    )
    assert(
      Boolean(draft.imageSourceId),
      `Article #${draftId} has Unsplash imageSourceId: ${draft.imageSourceId}`,
    )
    assert(Boolean(draft.imageAlt), `Article #${draftId} has imageAlt: ${draft.imageAlt}`)

    // Cleanup test draft
    await payload.delete({ collection: 'articles', id: draftId })
  }

  // Cleanup run record
  if (runReportWithPhoto.runId) {
    await payload.delete({ collection: 'automation-runs', id: runReportWithPhoto.runId })
  }

  // -------------------------------------------------------------
  // TEST 5: No Suitable Image → Needs Photo
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: No Suitable Image → Needs Photo Flow ---')

  // 5a. Direct resolver test with no results
  const resolverEmpty = await resolveArticlePhoto('nonexistent niche topic', {
    useMock: true,
    mockUnsplashPhoto: null,
  })
  assert(resolverEmpty.found === false, 'Resolver returned found: false when no Unsplash photos exist')
  if (!resolverEmpty.found) {
    assert(
      Boolean(resolverEmpty.reason && resolverEmpty.reason.includes('Unsplash')),
      `Resolver reason describes lack of suitable Unsplash photo: ${resolverEmpty.reason}`,
    )
  }

  // 5b. End-to-end pipeline run when no suitable photo is available
  const mockFeedNoPhoto = `
    <rss version="2.0">
      <channel>
        <title>Australian Financial Wire</title>
        <item>
          <title>Australian Home Insulation Rebates Extended for 2026 Season ${Date.now()}-3</title>
          <link>https://wire.com.au/property/insulation-rebate-${Date.now()}-3</link>
          <description>Energy efficiency rebates updated for suburban homeowners.</description>
          <pubDate>Tue, 06 Oct 2026 10:30:00 +1000</pubDate>
        </item>
      </channel>
    </rss>
  `

  console.log('Running orchestrator when no suitable Unsplash photo is found...')
  const runReportNoPhoto = await runClaudeAutomation(payload, {
    force: true,
    useMock: true,
    rssFeeds: ['data:application/rss+xml,' + encodeURIComponent(mockFeedNoPhoto)],
    mockPhotoOptions: {
      mockUnsplashPhoto: null,
    },
  })

  assert(runReportNoPhoto.success, 'Orchestrator succeeded even when no photo is found')
  assert(runReportNoPhoto.draftsCreated === 1, 'Draft still created and saved')
  assert(runReportNoPhoto.photosAssigned === 0, 'Zero photos assigned')

  for (const draftId of runReportNoPhoto.draftIds) {
    const draft = await payload.findByID({ collection: 'articles', id: draftId })
    // Must remain Draft in Review Queue, NEVER auto-published
    assert(draft.status === 'Draft', `Article #${draftId} saved as 'Draft' (in Review Queue for admin manual photo)`)
    assert(
      Array.isArray(draft.flags) && draft.flags.includes('Needs photo'),
      `Article #${draftId} correctly flagged with 'Needs photo'`,
    )
    assert(
      Boolean(draft.flagReasons?.includes('Unsplash')),
      `Article #${draftId} flagReasons describes Unsplash result: ${draft.flagReasons}`,
    )
    assert(!draft.image?.url, `Article #${draftId} has no image URL attached`)

    // Cleanup test draft
    await payload.delete({ collection: 'articles', id: draftId })
  }

  // Verify Automation Runs record logged the photo notice
  if (runReportNoPhoto.runId) {
    const runDoc = await payload.findByID({
      collection: 'automation-runs',
      id: runReportNoPhoto.runId,
    })
    assert(
      Boolean(runDoc.errors && runDoc.errors.includes('Photo Notice') && runDoc.errors.includes('Unsplash')),
      'AutomationRuns record logged meaningful Photo Notice citing Unsplash in errors field',
    )
    await payload.delete({ collection: 'automation-runs', id: runReportNoPhoto.runId })
  }

  // -------------------------------------------------------------
  // TEST 6: Unsplash API Failure → Needs Photo + Automation Runs Error
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Unsplash API Failure Handling ---')

  // 6a. Direct resolver test when API fails
  const resolverFail = await resolveArticlePhoto('api failure test', {
    useMock: true,
    forceFailUnsplash: true,
  })
  assert(resolverFail.found === false, 'Resolver handled API failure cleanly')
  if (!resolverFail.found) {
    assert(
      Boolean(resolverFail.reason?.includes('Unsplash API') || resolverFail.error?.includes('Unsplash API')),
      `Resolver recorded descriptive API error: ${resolverFail.reason}`,
    )
  }

  // 6b. End-to-end pipeline run when Unsplash API fails
  const mockFeedApiFail = `
    <rss version="2.0">
      <channel>
        <title>Australian Financial Wire</title>
        <item>
          <title>Solar Battery Subsidies Announced for NSW Homeowners ${Date.now()}-4</title>
          <link>https://wire.com.au/property/solar-battery-${Date.now()}-4</link>
          <description>Clean energy incentives for residential properties.</description>
          <pubDate>Tue, 06 Oct 2026 10:45:00 +1000</pubDate>
        </item>
      </channel>
    </rss>
  `

  console.log('Running orchestrator with simulated Unsplash API failure...')
  const runReportApiFail = await runClaudeAutomation(payload, {
    force: true,
    useMock: true,
    rssFeeds: ['data:application/rss+xml,' + encodeURIComponent(mockFeedApiFail)],
    mockPhotoOptions: {
      forceFailUnsplash: true,
    },
  })

  // Article must NOT be discarded on photo API failure
  assert(runReportApiFail.success, 'Orchestrator did not crash on Unsplash API failure')
  assert(runReportApiFail.draftsCreated === 1, 'Article was NOT discarded - draft created successfully')
  assert(runReportApiFail.photosAssigned === 0, 'No photos assigned during API failure')

  for (const draftId of runReportApiFail.draftIds) {
    const draft = await payload.findByID({ collection: 'articles', id: draftId })
    assert(draft.status === 'Draft', `Article #${draftId} saved as 'Draft' (in Review Queue, not auto-published)`)
    assert(
      Array.isArray(draft.flags) && draft.flags.includes('Needs photo'),
      `Article #${draftId} saved with 'Needs photo' flag on API failure`,
    )
    assert(!draft.image?.url, `Article #${draftId} has no image URL attached`)

    // Cleanup test draft
    await payload.delete({ collection: 'articles', id: draftId })
  }

  // Automation Runs record must log the API error
  if (runReportApiFail.runId) {
    const runDoc = await payload.findByID({
      collection: 'automation-runs',
      id: runReportApiFail.runId,
    })
    assert(
      Boolean(runDoc.errors && runDoc.errors.includes('Photo Notice') && runDoc.errors.includes('Unsplash API')),
      `AutomationRuns record logged API error in errors field: ${runDoc.errors}`,
    )
    await payload.delete({ collection: 'automation-runs', id: runReportApiFail.runId })
  }

  // -------------------------------------------------------------
  // TEST SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================')
  console.log(`TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`)
  console.log('================================================================\n')

  if (failedTests > 0) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
