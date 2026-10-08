import 'dotenv/config'
import { getApprovedRssFeeds } from '../src/config/automation'
import { fetchRssFeed } from '../src/lib/automation/rss'

async function testFeeds() {
  const feeds = getApprovedRssFeeds()
  console.log(`Testing ${feeds.length} approved feeds:`)
  let totalTime = 0

  for (let i = 0; i < feeds.length; i++) {
    const feed = feeds[i]
    const start = Date.now()
    console.log(`[${i + 1}/${feeds.length}] Fetching ${feed}...`)
    const res = await fetchRssFeed(feed, 12000)
    const elapsed = Date.now() - start
    totalTime += elapsed
    console.log(`  -> Success: ${res.success}, Stories: ${res.stories.length}, Error: ${res.error || 'none'} (${elapsed}ms)`)
  }
  console.log(`Total time for all 11 feeds: ${totalTime}ms (${(totalTime / 1000).toFixed(1)}s)`)
}

testFeeds().catch(console.error)
