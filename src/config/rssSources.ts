/**
 * Official Client-Provided RSS News Sources for Charlie News
 * Source of truth for client property news sources categorized into Renovation and Politics.
 *
 * SOW Rules:
 * - Do NOT add any new websites.
 * - Do NOT remove any website.
 * - Do NOT replace any website with another source.
 * - Do NOT change the section/category of any source.
 */

export type SectionCategory = 'Renovation' | 'Politics'
export type RssFeedStatus = 'Verified' | 'Not available' | 'Inactive / Unusable'

export interface ClientRssSource {
  id: number
  name: string
  section: SectionCategory
  websiteUrl: string
  rssUrl: string | null
  status: RssFeedStatus
  notes?: string
}

export const CLIENT_NEWS_SOURCES: ClientRssSource[] = [
  // ========================
  // RENOVATION (1 - 14)
  // ========================
  {
    id: 1,
    name: 'Realestate.com.au News',
    section: 'Renovation',
    websiteUrl: 'https://www.realestate.com.au/news/',
    rssUrl: 'https://www.realestate.com.au/news/feed/',
    status: 'Verified',
    notes: 'Active RSS 2.0 feed (~50 items). Shared source across Renovation and Politics.',
  },
  {
    id: 2,
    name: 'Realestate.com.au Lifestyle',
    section: 'Renovation',
    websiteUrl: 'https://www.realestate.com.au/lifestyle/',
    rssUrl: 'https://www.realestate.com.au/lifestyle/feed/',
    status: 'Verified',
    notes: 'Active RSS 2.0 feed (~50 items). Focuses on residential lifestyle and renovation.',
  },
  {
    id: 3,
    name: 'Domain Advice',
    section: 'Renovation',
    websiteUrl: 'https://www.domain.com.au/advice/',
    rssUrl: null,
    status: 'Not available',
    notes: 'Domain does not provide a public RSS feed (HTTP 404 on feed endpoints).',
  },
  {
    id: 4,
    name: 'Domain News',
    section: 'Renovation',
    websiteUrl: 'https://www.domain.com.au/news/',
    rssUrl: null,
    status: 'Not available',
    notes: 'Domain does not provide a public RSS feed (HTTP 404 on feed endpoints).',
  },
  {
    id: 5,
    name: 'Daily Telegraph Real Estate',
    section: 'Renovation',
    websiteUrl: 'https://www.dailytelegraph.com.au/real-estate',
    rssUrl: null,
    status: 'Inactive / Unusable',
    notes: 'News Corp has decommissioned public RSS (endpoints return HTTP 200 with 0-byte body).',
  },
  {
    id: 6,
    name: 'Herald Sun Real Estate',
    section: 'Renovation',
    websiteUrl: 'https://www.heraldsun.com.au/real-estate',
    rssUrl: null,
    status: 'Inactive / Unusable',
    notes: 'News Corp has decommissioned public RSS (endpoints return HTTP 200 with 0-byte body).',
  },
  {
    id: 7,
    name: 'News.com.au Real Estate',
    section: 'Renovation',
    websiteUrl: 'https://www.news.com.au/finance/real-estate',
    rssUrl: null,
    status: 'Inactive / Unusable',
    notes: 'News Corp has decommissioned public RSS (endpoints return HTTP 200 with 0-byte body).',
  },
  {
    id: 8,
    name: 'Yahoo Finance Australia',
    section: 'Renovation',
    websiteUrl: 'https://au.finance.yahoo.com/',
    rssUrl: null,
    status: 'Not available',
    notes: 'Yahoo Finance does not publish a regional Australian RSS feed (HTTP 404 on feed endpoints).',
  },
  {
    id: 9,
    name: 'Elite Agent',
    section: 'Renovation',
    websiteUrl: 'https://eliteagent.com/',
    rssUrl: null,
    status: 'Not available',
    notes: 'Protected by Cloudflare WAF (HTTP 403); no open public RSS feed available.',
  },
  {
    id: 10,
    name: 'Houzz Australia Magazine',
    section: 'Renovation',
    websiteUrl: 'https://www.houzz.com.au/magazine',
    rssUrl: null,
    status: 'Not available',
    notes: 'Houzz does not maintain a public RSS feed (feed endpoints return HTTP 404 or HTML).',
  },
  {
    id: 11,
    name: 'Homes to Love',
    section: 'Renovation',
    websiteUrl: 'https://www.homestolove.com.au/',
    rssUrl: 'https://www.homestolove.com.au/feed/',
    status: 'Verified',
    notes: 'Active RSS 2.0 feed (~30 items). Published by Are Media.',
  },
  {
    id: 12,
    name: 'Architecture & Design',
    section: 'Renovation',
    websiteUrl: 'https://www.architectureanddesign.com.au/',
    rssUrl: null,
    status: 'Not available',
    notes: 'Website no longer provides an active public RSS feed (HTTP 404 on feed endpoints).',
  },
  {
    id: 13,
    name: 'Build.com.au',
    section: 'Renovation',
    websiteUrl: 'https://build.com.au/',
    rssUrl: 'https://build.com.au/feed',
    status: 'Verified',
    notes: 'Active RSS 2.0 feed (~10 items). Verified from HTML alternate link.',
  },
  {
    id: 14,
    name: 'The Design Files',
    section: 'Renovation',
    websiteUrl: 'https://thedesignfiles.net/',
    rssUrl: 'https://thedesignfiles.net/feed/',
    status: 'Verified',
    notes: 'Active RSS 2.0 feed (~10 items). Covers Australian residential design and renovation.',
  },

  // ========================
  // POLITICS (15 - 28)
  // ========================
  {
    id: 15,
    name: 'ABC News Business',
    section: 'Politics',
    websiteUrl: 'https://www.abc.net.au/news/business',
    rssUrl: 'https://www.abc.net.au/news/feed/46182/rss.xml',
    status: 'Verified',
    notes: 'Official ABC News Business RSS feed. Covers economic policy, rates, and business news.',
  },
  {
    id: 16,
    name: 'The Guardian Housing',
    section: 'Politics',
    websiteUrl: 'https://www.theguardian.com/australia-news/housing',
    rssUrl: 'https://www.theguardian.com/australia-news/housing/rss',
    status: 'Verified',
    notes: 'Official Guardian Australia Housing RSS feed (~20 items). Covers national housing policy.',
  },
  {
    id: 17,
    name: 'News.com.au Real Estate',
    section: 'Politics',
    websiteUrl: 'https://www.news.com.au/finance/real-estate',
    rssUrl: null,
    status: 'Inactive / Unusable',
    notes: 'Same website as #7. News Corp has decommissioned public RSS (HTTP 200 with 0-byte body).',
  },
  {
    id: 18,
    name: 'Realestate.com.au News',
    section: 'Politics',
    websiteUrl: 'https://www.realestate.com.au/news/',
    rssUrl: 'https://www.realestate.com.au/news/feed/',
    status: 'Verified',
    notes: 'Same website as #1. Active RSS 2.0 feed (~50 items). Covers housing market policy & data.',
  },
  {
    id: 19,
    name: 'Domain News',
    section: 'Politics',
    websiteUrl: 'https://www.domain.com.au/news/',
    rssUrl: null,
    status: 'Not available',
    notes: 'Same website as #4. Domain does not provide a public RSS feed (HTTP 404).',
  },
  {
    id: 20,
    name: 'SMH Property',
    section: 'Politics',
    websiteUrl: 'https://www.smh.com.au/property',
    rssUrl: 'https://www.smh.com.au/rss/property.xml',
    status: 'Verified',
    notes: 'Official Sydney Morning Herald Property RSS feed (~20 items). Covers planning and policy.',
  },
  {
    id: 21,
    name: 'The Age Property',
    section: 'Politics',
    websiteUrl: 'https://www.theage.com.au/property',
    rssUrl: 'https://www.theage.com.au/rss/property.xml',
    status: 'Verified',
    notes: 'Official The Age Property RSS feed (~20 items). Covers Victorian housing policy and market data.',
  },
  {
    id: 22,
    name: 'AFR Property',
    section: 'Politics',
    websiteUrl: 'https://www.afr.com/property',
    rssUrl: 'https://www.afr.com/rss/property.xml',
    status: 'Verified',
    notes: 'Official Australian Financial Review Property RSS feed (~20 items). Covers commercial and residential policy.',
  },
  {
    id: 23,
    name: 'Daily Telegraph',
    section: 'Politics',
    websiteUrl: 'https://www.dailytelegraph.com.au/',
    rssUrl: null,
    status: 'Inactive / Unusable',
    notes: 'News Corp general feed has been decommissioned (HTTP 200 with 0-byte empty body).',
  },
  {
    id: 24,
    name: 'RBA Media Releases',
    section: 'Politics',
    websiteUrl: 'https://www.rba.gov.au/media-releases/',
    rssUrl: 'https://www.rba.gov.au/rss/rss-cb-media-releases.xml',
    status: 'Verified',
    notes: 'Official Reserve Bank of Australia Media Releases RSS feed. Cash rate decisions and policy statements.',
  },
  {
    id: 25,
    name: 'ABS Building and Construction',
    section: 'Politics',
    websiteUrl: 'https://www.abs.gov.au/statistics/industry/building-and-construction',
    rssUrl: null,
    status: 'Not available',
    notes: 'Australian Bureau of Statistics does not maintain public RSS feeds (HTTP 404 on feed endpoints).',
  },
  {
    id: 26,
    name: 'Housing Australia',
    section: 'Politics',
    websiteUrl: 'https://www.housingaustralia.gov.au/',
    rssUrl: null,
    status: 'Not available',
    notes: 'Government agency does not provide a functional public RSS feed (HTTP 500 / 404 on feed endpoints).',
  },
  {
    id: 27,
    name: 'Property Council of Australia',
    section: 'Politics',
    websiteUrl: 'https://www.propertycouncil.com.au/media',
    rssUrl: null,
    status: 'Not available',
    notes: 'Protected / no public RSS feed (HTTP 403 on feed endpoints).',
  },
  {
    id: 28,
    name: 'REIA',
    section: 'Politics',
    websiteUrl: 'https://reia.com.au/media/',
    rssUrl: null,
    status: 'Not available',
    notes: 'Real Estate Institute of Australia does not publish an RSS feed (HTTP 404 on feed endpoints).',
  },
]

/**
 * Normalizes URL strings for consistent comparison (trims trailing slashes)
 */
function normalizeFeedUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

export interface VerifiedClientRssSource extends ClientRssSource {
  rssUrl: string
  status: 'Verified'
}

/**
 * Returns all client sources where RSS feed has been verified
 */
export function getVerifiedRssSources(): VerifiedClientRssSource[] {
  return CLIENT_NEWS_SOURCES.filter(
    (src): src is VerifiedClientRssSource =>
      src.status === 'Verified' && typeof src.rssUrl === 'string' && src.rssUrl.length > 0,
  )
}

/**
 * Returns deduplicated list of verified RSS feed URLs, optionally filtered by section
 */
export function getVerifiedFeedUrls(section?: SectionCategory): string[] {
  let sources = getVerifiedRssSources()
  if (section) {
    sources = sources.filter((s) => s.section === section)
  }

  // Deduplicate URLs (e.g. Realestate.com.au News appears in both Renovation and Politics)
  const uniqueUrls = new Set<string>()
  for (const s of sources) {
    uniqueUrls.add(s.rssUrl)
  }
  return Array.from(uniqueUrls)
}

/**
 * Validates whether a given feed URL is in the approved client RSS feed list.
 * Allows mock/data URLs for test execution.
 */
export function isApprovedFeedUrl(feedUrl: string): boolean {
  if (!feedUrl || typeof feedUrl !== 'string') {
    return false
  }

  const trimmed = feedUrl.trim()

  // Allow data URIs for automated tests
  if (trimmed.startsWith('data:application/rss+xml')) {
    return true
  }

  const normalizedTarget = normalizeFeedUrl(trimmed)
  const verifiedUrls = getVerifiedFeedUrls().map(normalizeFeedUrl)

  return verifiedUrls.includes(normalizedTarget)
}

/**
 * Returns which Section ('Renovation' | 'Politics' | null) a verified feed belongs to.
 * If the feed appears in both sections (e.g. Realestate.com.au News), returns null to let Claude decide.
 */
export function getSectionHintForFeedUrl(feedUrl: string): SectionCategory | null {
  if (!feedUrl) return null

  const normalizedTarget = normalizeFeedUrl(feedUrl)
  const matchingSources = getVerifiedRssSources().filter(
    (s) => normalizeFeedUrl(s.rssUrl) === normalizedTarget,
  )

  if (matchingSources.length === 0) {
    return null
  }

  const sections = Array.from(new Set(matchingSources.map((s) => s.section)))
  if (sections.length === 1) {
    return sections[0]
  }

  // Appears in multiple sections (e.g. Renovation & Politics)
  return null
}

/**
 * Looks up the official client source name for a given feed URL
 */
export function getSourceNameForFeedUrl(feedUrl: string): string | null {
  if (!feedUrl) return null
  const normalizedTarget = normalizeFeedUrl(feedUrl)
  const found = getVerifiedRssSources().find((s) => normalizeFeedUrl(s.rssUrl) === normalizedTarget)
  return found ? found.name : null
}
