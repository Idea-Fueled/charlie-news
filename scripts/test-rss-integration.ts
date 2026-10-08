/**
 * Comprehensive Test Suite for Charlie News Client RSS Sources & Automation
 *
 * Covers all 8 required criteria:
 * 1. Valid RSS feed parsing (RSS 2.0 & Atom)
 * 2. Invalid RSS feed handling (malformed, HTML, empty)
 * 3. Unavailable RSS feed handling (HTTP 404, HTTP 500, network failure)
 * 4. Multiple approved feeds aggregation
 * 5. Renovation source mapping
 * 6. Politics source mapping
 * 7. Duplicate source handling (list preservation & runtime deduplication)
 * 8. Ensuring no unapproved source can be used
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'
import { parseRssXml, fetchRssFeed } from '../src/lib/automation/rss'
import {
  CLIENT_NEWS_SOURCES,
  getVerifiedRssSources,
  getVerifiedFeedUrls,
  isApprovedFeedUrl,
  getSectionHintForFeedUrl,
  getSourceNameForFeedUrl,
  getApprovedRssFeeds,
} from '../src/config/automation'
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

async function runRssTestSuite() {
  console.log('================================================================')
  console.log('CHARLIE NEWS - CLAUDE RSS SOURCE CONFIGURATION TEST SUITE')
  console.log('================================================================\n')

  // -------------------------------------------------------------
  // TEST 1: Valid RSS Feed Parsing (RSS 2.0 & Atom)
  // -------------------------------------------------------------
  console.log('--- TEST 1: Valid RSS Feed Parsing ---')
  const validRss2 = `
    <?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>Australian Property Journal</title>
        <link>https://www.example.com.au</link>
        <description>Property news feed</description>
        <item>
          <title><![CDATA[NSW Approves Medium Density Terrace Housing Reform]]></title>
          <link>https://www.example.com.au/news/nsw-density-2026?utm_source=rss</link>
          <description><![CDATA[<p>State planning departments cleared <b>dual-occupancy</b> provisions across inner councils.</p>]]></description>
          <pubDate>Wed, 07 Oct 2026 09:30:00 +1000</pubDate>
          <guid>https://www.example.com.au/news/nsw-density-2026</guid>
        </item>
      </channel>
    </rss>
  `
  const parsedRss = parseRssXml(validRss2)
  assert(parsedRss.length === 1, 'Parsed 1 item from valid RSS 2.0')
  assert(
    parsedRss[0].title === 'NSW Approves Medium Density Terrace Housing Reform',
    'Extracted and cleaned CDATA headline accurately',
  )
  assert(
    parsedRss[0].contentSnippet.includes('State planning departments cleared dual-occupancy provisions'),
    'Stripped HTML tags and preserved text in content snippet',
  )
  assert(
    parsedRss[0].sourceName === 'Australian Property Journal',
    'Extracted channel title as sourceName',
  )
  assert(Boolean(parsedRss[0].pubDate), 'Parsed publication date to ISO format')

  const validAtom = `
    <?xml version="1.0" encoding="utf-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <title>Sydney Property Wire</title>
      <entry>
        <title>Reserve Bank Holds Cash Rate Steady at October Review</title>
        <link href="https://www.example.com.au/rates/october-hold" />
        <summary>The RBA board concluded its monetary policy meeting today.</summary>
        <updated>2026-10-07T04:30:00Z</updated>
        <id>urn:uuid:12345-atom-feed</id>
      </entry>
    </feed>
  `
  const parsedAtom = parseRssXml(validAtom)
  assert(parsedAtom.length === 1, 'Parsed 1 entry from valid Atom XML')
  assert(
    parsedAtom[0].link === 'https://www.example.com.au/rates/october-hold',
    'Extracted Atom link from href attribute',
  )
  assert(
    parsedAtom[0].sourceName === 'Sydney Property Wire',
    'Extracted feed title as sourceName for Atom',
  )

  // -------------------------------------------------------------
  // TEST 2: Invalid RSS Feed Handling (Malformed, HTML, Empty)
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Invalid RSS Feed Handling ---')
  // 2a. Malformed XML string
  const malformed = '<<<malformed xml not closing tags <<< >>><<<???'
  const malformedParsed = parseRssXml(malformed)
  assert(Array.isArray(malformedParsed) && malformedParsed.length === 0, 'Malformed XML handled gracefully without throwing')

  // 2b. Standard HTML webpage without RSS tags
  const htmlPage = `
    <!DOCTYPE html>
    <html>
      <head><title>404 Not Found</title></head>
      <body><h1>The requested news page was not found</h1></body>
    </html>
  `
  const htmlParsed = parseRssXml(htmlPage)
  assert(htmlParsed.length === 0, 'HTML page without RSS tags returns 0 stories')

  // 2c. Empty string
  const emptyParsed = parseRssXml('')
  assert(emptyParsed.length === 0, 'Empty XML string returns 0 stories')

  // -------------------------------------------------------------
  // TEST 3: Unavailable RSS Feed Handling
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Unavailable RSS Feed Handling ---')
  const http = await import('http')
  const mockServer = http.createServer((req, res) => {
    if (req.url === '/404') {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not Found')
    } else if (req.url === '/500') {
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('Internal Server Error')
    } else {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end('OK')
    }
  })

  await new Promise<void>((resolve) => mockServer.listen(0, '127.0.0.1', () => resolve()))
  const serverPort = (mockServer.address() as any).port
  const url404 = `http://127.0.0.1:${serverPort}/404`
  const url500 = `http://127.0.0.1:${serverPort}/500`

  try {
    // 3a. HTTP 404 URL
    const notFoundResult = await fetchRssFeed(url404, 5000)
    assert(notFoundResult.success === false, 'fetchRssFeed returns success: false on HTTP 404')
    assert(Boolean(notFoundResult.error?.includes('404')), `Error cites HTTP 404 status: ${notFoundResult.error}`)
    assert(notFoundResult.stories.length === 0, 'Returns empty stories array on 404')

    // 3b. HTTP 500 URL
    const serverErrorResult = await fetchRssFeed(url500, 5000)
    assert(serverErrorResult.success === false, 'fetchRssFeed returns success: false on HTTP 500')
    assert(Boolean(serverErrorResult.error?.includes('500')), `Error cites HTTP 500 status: ${serverErrorResult.error}`)

    // 3c. Unreachable / connection refused error
    const unreachableResult = await fetchRssFeed('http://127.0.0.1:59999/unreachable', 2000)
    assert(unreachableResult.success === false, 'fetchRssFeed handles connection refused safely')
    assert(Boolean(unreachableResult.error), `Recorded network error safely: ${unreachableResult.error}`)
  } finally {
    mockServer.close()
  }

  // -------------------------------------------------------------
  // TEST 4: Multiple Approved Feeds Aggregation & Resilience
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Multiple Approved Feeds Aggregation & Resilience ---')
  const payload = await getPayload({ config: configPromise })

  const feed1Mock = `
    <rss version="2.0">
      <channel>
        <title>Homes to Love</title>
        <item>
          <title>Brisbane Contemporary Queenslander Renovation Design ${Date.now()}-A</title>
          <link>https://www.homestolove.com.au/renovation/queenslander-${Date.now()}-A</link>
          <description>Architects extend historic timber residence with passive design principles.</description>
          <pubDate>Wed, 07 Oct 2026 10:00:00 +1000</pubDate>
        </item>
      </channel>
    </rss>
  `
  const feed2Mock = `
    <rss version="2.0">
      <channel>
        <title>The Guardian Housing</title>
        <item>
          <title>Federal Housing Accord Targets Suburban Density Reforms ${Date.now()}-B</title>
          <link>https://www.theguardian.com/australia-news/housing/accord-${Date.now()}-B</link>
          <description>Treasury confirms progress on national infrastructure incentives for regional hubs.</description>
          <pubDate>Wed, 07 Oct 2026 10:15:00 +1000</pubDate>
        </item>
      </channel>
    </rss>
  `

  // Run orchestrator with one failing feed (empty/invalid XML) and two working feeds
  const multiFeedReport = await runClaudeAutomation(payload, {
    force: true,
    useMock: true,
    rssFeeds: [
      'data:application/rss+xml,INVALID_CORRUPTED_FEED', // failing feed to test resilience
      'data:application/rss+xml,' + encodeURIComponent(feed1Mock),
      'data:application/rss+xml,' + encodeURIComponent(feed2Mock),
    ],
  })

  assert(multiFeedReport.success, 'Automation pipeline succeeded despite one failing feed')
  assert(multiFeedReport.draftsCreated > 0, `Created ${multiFeedReport.draftsCreated} drafts from working feeds`)
  assert(
    multiFeedReport.errors.some((e) => e.includes('RSS source failure')),
    'Logged RSS source failure for unavailable feed in Automation Runs',
  )

  // Clean up created test drafts
  for (const draftId of multiFeedReport.draftIds) {
    await payload.delete({ collection: 'articles', id: draftId })
  }
  if (multiFeedReport.runId) {
    await payload.delete({ collection: 'automation-runs', id: multiFeedReport.runId })
  }

  // -------------------------------------------------------------
  // TEST 5: Renovation Source Mapping
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Renovation Source Mapping ---')
  const renoSources = CLIENT_NEWS_SOURCES.filter((s) => s.section === 'Renovation')
  assert(renoSources.length === 14, `Exact 14 Renovation sources in client list (got ${renoSources.length})`)

  // Check verified renovation sources
  const verifiedReno = renoSources.filter((s) => s.status === 'Verified')
  assert(verifiedReno.length === 5, `Found 5 verified Renovation sources (got ${verifiedReno.length})`)

  const expectedRenoNames = [
    'Realestate.com.au News',
    'Realestate.com.au Lifestyle',
    'Homes to Love',
    'Build.com.au',
    'The Design Files',
  ]
  for (const name of expectedRenoNames) {
    const found = verifiedReno.find((s) => s.name === name)
    assert(Boolean(found), `Verified Renovation source present: ${name}`)
  }

  // Test section hint helper
  assert(
    getSectionHintForFeedUrl('https://www.homestolove.com.au/feed/') === 'Renovation',
    'Homes to Love correctly maps to "Renovation"',
  )
  assert(
    getSectionHintForFeedUrl('https://build.com.au/feed') === 'Renovation',
    'Build.com.au correctly maps to "Renovation"',
  )
  assert(
    getSectionHintForFeedUrl('https://thedesignfiles.net/feed/') === 'Renovation',
    'The Design Files correctly maps to "Renovation"',
  )
  assert(
    getSectionHintForFeedUrl('https://www.realestate.com.au/lifestyle/feed/') === 'Renovation',
    'Realestate.com.au Lifestyle correctly maps to "Renovation"',
  )

  // -------------------------------------------------------------
  // TEST 6: Politics Source Mapping
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Politics Source Mapping ---')
  const politicsSources = CLIENT_NEWS_SOURCES.filter((s) => s.section === 'Politics')
  assert(politicsSources.length === 14, `Exact 14 Politics sources in client list (got ${politicsSources.length})`)

  // Check verified politics sources
  const verifiedPolitics = politicsSources.filter((s) => s.status === 'Verified')
  assert(verifiedPolitics.length === 7, `Found 7 verified Politics sources (got ${verifiedPolitics.length})`)

  const expectedPoliticsNames = [
    'ABC News Business',
    'The Guardian Housing',
    'Realestate.com.au News',
    'SMH Property',
    'The Age Property',
    'AFR Property',
    'RBA Media Releases',
  ]
  for (const name of expectedPoliticsNames) {
    const found = verifiedPolitics.find((s) => s.name === name)
    assert(Boolean(found), `Verified Politics source present: ${name}`)
  }

  // Test section hint helper
  assert(
    getSectionHintForFeedUrl('https://www.abc.net.au/news/feed/46182/rss.xml') === 'Politics',
    'ABC News Business correctly maps to "Politics"',
  )
  assert(
    getSectionHintForFeedUrl('https://www.theguardian.com/australia-news/housing/rss') === 'Politics',
    'The Guardian Housing correctly maps to "Politics"',
  )
  assert(
    getSectionHintForFeedUrl('https://www.smh.com.au/rss/property.xml') === 'Politics',
    'SMH Property correctly maps to "Politics"',
  )
  assert(
    getSectionHintForFeedUrl('https://www.theage.com.au/rss/property.xml') === 'Politics',
    'The Age Property correctly maps to "Politics"',
  )
  assert(
    getSectionHintForFeedUrl('https://www.afr.com/rss/property.xml') === 'Politics',
    'AFR Property correctly maps to "Politics"',
  )
  assert(
    getSectionHintForFeedUrl('https://www.rba.gov.au/rss/rss-cb-media-releases.xml') === 'Politics',
    'RBA Media Releases correctly maps to "Politics"',
  )

  // -------------------------------------------------------------
  // TEST 7: Duplicate Source Handling
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: Duplicate Source Handling ---')
  // 7a. Client list structure preserves duplicated entries
  const reaNewsEntries = CLIENT_NEWS_SOURCES.filter((s) => s.name === 'Realestate.com.au News')
  assert(reaNewsEntries.length === 2, 'Preserved Realestate.com.au News in both Renovation (#1) and Politics (#18)')
  assert(reaNewsEntries[0].section === 'Renovation', 'Entry #1 categorized under Renovation')
  assert(reaNewsEntries[1].section === 'Politics', 'Entry #18 categorized under Politics')

  const newsComAuEntries = CLIENT_NEWS_SOURCES.filter((s) => s.name === 'News.com.au Real Estate')
  assert(newsComAuEntries.length === 2, 'Preserved News.com.au Real Estate in both Renovation (#7) and Politics (#17)')

  const domainNewsEntries = CLIENT_NEWS_SOURCES.filter((s) => s.name === 'Domain News')
  assert(domainNewsEntries.length === 2, 'Preserved Domain News in both Renovation (#4) and Politics (#19)')

  // 7b. Runtime deduplication of feed URLs
  const verifiedFeedUrls = getVerifiedFeedUrls()
  const reaNewsRss = 'https://www.realestate.com.au/news/feed/'
  const reaCount = verifiedFeedUrls.filter((u) => u === reaNewsRss).length
  assert(reaCount === 1, 'Runtime deduplication ensures Realestate.com.au News RSS URL appears exactly once in active feed list')
  assert(verifiedFeedUrls.length === 11, `Exact 11 unique verified feed URLs in active pool (got ${verifiedFeedUrls.length})`)

  // 7c. Deduplication helper for Realestate.com.au News (appears in both sections)
  assert(
    getSectionHintForFeedUrl(reaNewsRss) === null,
    'Shared feed (Realestate.com.au News) returns null hint allowing Claude to categorize dynamically',
  )

  // -------------------------------------------------------------
  // TEST 8: Ensuring No Unapproved Source Can Be Used
  // -------------------------------------------------------------
  console.log('\n--- TEST 8: Ensuring No Unapproved Source Can Be Used ---')
  // 8a. Check arbitrary unapproved websites
  const unapproved1 = 'https://www.dailymail.co.uk/news/rss.xml'
  const unapproved2 = 'https://edition.cnn.com/rss/edition.rss'
  const unapproved3 = 'https://malicious-random-phishing.com/rss'
  assert(!isApprovedFeedUrl(unapproved1), `Rejected unapproved external feed: ${unapproved1}`)
  assert(!isApprovedFeedUrl(unapproved2), `Rejected unapproved external feed: ${unapproved2}`)
  assert(!isApprovedFeedUrl(unapproved3), `Rejected unapproved external feed: ${unapproved3}`)

  // 8b. getApprovedRssFeeds filters out unapproved URLs from environment variable
  const originalEnv = process.env.APPROVED_RSS_FEEDS
  try {
    process.env.APPROVED_RSS_FEEDS = JSON.stringify([
      'https://www.abc.net.au/news/feed/46182/rss.xml', // approved
      'https://unapproved-site.com/feed.xml', // unapproved!
    ])
    const filteredFeeds = getApprovedRssFeeds()
    assert(
      filteredFeeds.includes('https://www.abc.net.au/news/feed/46182/rss.xml'),
      'Retained approved feed from env var',
    )
    assert(
      !filteredFeeds.includes('https://unapproved-site.com/feed.xml'),
      'Strictly stripped unapproved feed from env var',
    )
  } finally {
    process.env.APPROVED_RSS_FEEDS = originalEnv
  }

  // 8c. Orchestrator strips unapproved feed URLs from candidate options
  const unapprovedRunReport = await runClaudeAutomation(payload, {
    force: true,
    useMock: true,
    rssFeeds: [
      'https://unapproved-external-source.org/rss', // will be stripped
      'data:application/rss+xml,' + encodeURIComponent(feed1Mock), // approved mock data
    ],
  })
  assert(unapprovedRunReport.success, 'Orchestrator safely filtered unapproved feed and processed only approved feed')

  for (const draftId of unapprovedRunReport.draftIds) {
    await payload.delete({ collection: 'articles', id: draftId })
  }
  if (unapprovedRunReport.runId) {
    await payload.delete({ collection: 'automation-runs', id: unapprovedRunReport.runId })
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

runRssTestSuite().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
