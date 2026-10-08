/**
 * Focused Verification Test:
 * Shared-Feed Handling for Realestate.com.au News (Renovation & Politics)
 *
 * Verifies that:
 * 1. Realestate.com.au News feed URL returns null for sectionHint (no hardcoded section bias).
 * 2. When a story with a Renovation topic is processed from this shared feed,
 *    Claude classifies it as "renovation" (not "politics").
 * 3. When a story with a Politics topic is processed from this shared feed,
 *    Claude classifies it as "politics" (not "renovation").
 * 4. The orchestrator maps the generated sectionSlug to the correct database Section ID
 *    and prevents incorrect section assignments.
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'
import {
  getSectionHintForFeedUrl,
  isApprovedFeedUrl,
} from '../src/config/automation'
import { generateArticleWithClaude, SectionMetadata } from '../src/lib/automation/claude'
import { RawRssStory } from '../src/lib/automation/rss'
import { runClaudeAutomation } from '../src/lib/automation/orchestrator'

let passedTests = 0
let failedTests = 0

function assert(condition: boolean, msg: string): asserts condition {
  if (!condition) {
    console.error(`  ✗ FAILED: ${msg}`)
    failedTests += 1
    throw new Error(`Assertion failed: ${msg}`)
  } else {
    console.log(`  ✓ ${msg}`)
    passedTests += 1
  }
}

async function runSharedFeedTest() {
  console.log('================================================================')
  console.log('CHARLIE NEWS - SHARED FEED REALESTATE.COM.AU NEWS VERIFICATION')
  console.log('================================================================\n')

  const sharedFeedUrl = 'https://www.realestate.com.au/news/feed/'

  // -------------------------------------------------------------
  // STEP 1: Verify Feed Configuration & Section Hint Neutrality
  // -------------------------------------------------------------
  console.log('--- STEP 1: Section Hint Neutrality for Shared Feed ---')
  assert(
    isApprovedFeedUrl(sharedFeedUrl),
    'Realestate.com.au News feed is approved in client configuration',
  )

  const sectionHint = getSectionHintForFeedUrl(sharedFeedUrl)
  assert(
    sectionHint === null,
    'getSectionHintForFeedUrl returns null (no hardcoded section bias, allowing content-based classification)',
  )

  // -------------------------------------------------------------
  // STEP 2: Database Sections Retrieval
  // -------------------------------------------------------------
  console.log('\n--- STEP 2: Database Sections Retrieval ---')
  const payload = await getPayload({ config: configPromise })
  const sectionsData = await payload.find({
    collection: 'sections',
    where: { status: { equals: 'Active' } },
    limit: 10,
  })

  const activeSections: SectionMetadata[] = (sectionsData.docs || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    claudeTopicGuide: s.claudeTopicGuide || null,
  }))

  const renovationSection = activeSections.find(
    (s) => s.slug.toLowerCase() === 'renovation' || s.name.toLowerCase() === 'renovation',
  )
  const politicsSection = activeSections.find(
    (s) => s.slug.toLowerCase() === 'politics' || s.name.toLowerCase() === 'politics',
  )

  assert(Boolean(renovationSection), `Found active Renovation section (ID: ${renovationSection?.id})`)
  assert(Boolean(politicsSection), `Found active Politics section (ID: ${politicsSection?.id})`)

  // -------------------------------------------------------------
  // STEP 3: Live Claude Classification for Renovation Topic
  // -------------------------------------------------------------
  console.log('\n--- STEP 3: Live Claude Content Classification — Renovation Topic ---')
  const renovationStory: RawRssStory = {
    title: `Byron Bay 1970s Brick Home Transformed With Budget DIY Renovation ${Date.now()}`,
    link: `https://www.realestate.com.au/news/byron-bay-diy-renovation-${Date.now()}`,
    guid: `https://www.realestate.com.au/news/byron-bay-diy-renovation-${Date.now()}`,
    pubDate: new Date().toISOString(),
    contentSnippet:
      'A young couple in Byron Bay completely revitalised a dated 1970s brick house, replacing tired laminate kitchen benchtops with timber joinery, modernising the bathroom tiles, and adding an open-plan sunlit deck to deliver a stunning coastal home makeover on a modest budget.',
    sourceName: 'Realestate.com.au News',
    feedUrl: sharedFeedUrl,
  }

  console.log(`Source Headline: "${renovationStory.title}"`)
  console.log(`Feed URL:        ${renovationStory.feedUrl}`)
  console.log('Sending live classification request to Claude...')

  const renoClaudeRes = await generateArticleWithClaude(renovationStory, activeSections, {
    useMock: false,
  })

  assert(renoClaudeRes.success, 'Claude generated article successfully for renovation story')
  assert(Boolean(renoClaudeRes.data), 'Claude returned parsed article data')

  const renoData = renoClaudeRes.data!
  console.log(`  Assigned sectionSlug: "${renoData.sectionSlug}"`)
  console.log(`  Generated Headline:   "${renoData.headline}"`)

  assert(
    renoData.sectionSlug.toLowerCase() === 'renovation',
    `Claude correctly classified renovation topic as "renovation" (got "${renoData.sectionSlug}")`,
  )
  assert(
    renoData.sectionSlug.toLowerCase() !== 'politics',
    'Claude did NOT incorrectly assign renovation topic to "politics"',
  )

  // -------------------------------------------------------------
  // STEP 4: Live Claude Classification for Politics Topic
  // -------------------------------------------------------------
  console.log('\n--- STEP 4: Live Claude Content Classification — Politics Topic ---')
  const politicsStory: RawRssStory = {
    title: `Federal Government Introduces Mandatory Council Rezoning Accord Legislation ${Date.now()}`,
    link: `https://www.realestate.com.au/news/federal-rezoning-accord-bill-${Date.now()}`,
    guid: `https://www.realestate.com.au/news/federal-rezoning-accord-bill-${Date.now()}`,
    pubDate: new Date().toISOString(),
    contentSnippet:
      'Federal Housing Minister introduced new Commonwealth legislation tying billion-dollar infrastructure grants to mandatory state and local council planning reforms, penalising councils that delay medium-density townhouse approvals and reforming developer infrastructure charges.',
    sourceName: 'Realestate.com.au News',
    feedUrl: sharedFeedUrl,
  }

  console.log(`Source Headline: "${politicsStory.title}"`)
  console.log(`Feed URL:        ${politicsStory.feedUrl}`)
  console.log('Sending live classification request to Claude...')

  const politicsClaudeRes = await generateArticleWithClaude(politicsStory, activeSections, {
    useMock: false,
  })

  assert(politicsClaudeRes.success, 'Claude generated article successfully for politics story')
  assert(Boolean(politicsClaudeRes.data), 'Claude returned parsed article data')

  const politicsData = politicsClaudeRes.data!
  console.log(`  Assigned sectionSlug: "${politicsData.sectionSlug}"`)
  console.log(`  Generated Headline:   "${politicsData.headline}"`)

  assert(
    politicsData.sectionSlug.toLowerCase() === 'politics',
    `Claude correctly classified politics topic as "politics" (got "${politicsData.sectionSlug}")`,
  )
  assert(
    politicsData.sectionSlug.toLowerCase() !== 'renovation',
    'Claude did NOT incorrectly assign politics topic to "renovation"',
  )

  // -------------------------------------------------------------
  // STEP 5: Orchestrator Pipeline Database Section ID Mapping
  // -------------------------------------------------------------
  console.log('\n--- STEP 5: End-to-End Orchestrator Section ID Mapping Verification ---')
  // We feed both Claude-generated results into the orchestrator pipeline to verify
  // that the resulting Payload article records are stored with the exact corresponding section ID.

  const renoXml = `
    <rss version="2.0">
      <channel>
        <title>Realestate.com.au News</title>
        <item>
          <title>${renovationStory.title}</title>
          <link>${renovationStory.link}</link>
          <description>${renovationStory.contentSnippet}</description>
          <pubDate>${renovationStory.pubDate}</pubDate>
        </item>
      </channel>
    </rss>
  `
  const politicsXml = `
    <rss version="2.0">
      <channel>
        <title>Realestate.com.au News</title>
        <item>
          <title>${politicsStory.title}</title>
          <link>${politicsStory.link}</link>
          <description>${politicsStory.contentSnippet}</description>
          <pubDate>${politicsStory.pubDate}</pubDate>
        </item>
      </channel>
    </rss>
  `

  // Run pipeline for renovation story with Claude-determined data
  const renoRun = await runClaudeAutomation(payload, {
    force: true,
    useMock: true,
    mockData: renoData,
    rssFeeds: ['data:application/rss+xml,' + encodeURIComponent(renoXml)],
  })
  assert(renoRun.success, 'Pipeline succeeded for shared-feed renovation story')
  assert(renoRun.draftIds.length === 1, 'Draft created for renovation story')

  const createdRenoArticle = await payload.findByID({
    collection: 'articles',
    id: renoRun.draftIds[0],
    depth: 0,
  })
  const renoArticleSectionId =
    typeof createdRenoArticle.section === 'object'
      ? (createdRenoArticle.section as any)?.id
      : createdRenoArticle.section
  assert(
    String(renoArticleSectionId) === String(renovationSection?.id),
    `Draft article section ID matches Renovation section (expected ${renovationSection?.id}, got ${renoArticleSectionId})`,
  )

  // Run pipeline for politics story with Claude-determined data
  const politicsRun = await runClaudeAutomation(payload, {
    force: true,
    useMock: true,
    mockData: politicsData,
    rssFeeds: ['data:application/rss+xml,' + encodeURIComponent(politicsXml)],
  })
  assert(politicsRun.success, 'Pipeline succeeded for shared-feed politics story')
  assert(politicsRun.draftIds.length === 1, 'Draft created for politics story')

  const createdPoliticsArticle = await payload.findByID({
    collection: 'articles',
    id: politicsRun.draftIds[0],
    depth: 0,
  })
  const politicsArticleSectionId =
    typeof createdPoliticsArticle.section === 'object'
      ? (createdPoliticsArticle.section as any)?.id
      : createdPoliticsArticle.section
  assert(
    String(politicsArticleSectionId) === String(politicsSection?.id),
    `Draft article section ID matches Politics section (expected ${politicsSection?.id}, got ${politicsArticleSectionId})`,
  )

  // Clean up created test draft articles & automation runs
  await payload.delete({ collection: 'articles', id: renoRun.draftIds[0] })
  await payload.delete({ collection: 'articles', id: politicsRun.draftIds[0] })
  if (renoRun.runId) await payload.delete({ collection: 'automation-runs', id: renoRun.runId })
  if (politicsRun.runId) await payload.delete({ collection: 'automation-runs', id: politicsRun.runId })

  // -------------------------------------------------------------
  // TEST SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================')
  console.log(`SHARED FEED VERIFICATION RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`)
  console.log('================================================================\n')

  if (failedTests > 0) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}

runSharedFeedTest().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
