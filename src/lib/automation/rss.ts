/**
 * Server-side RSS / Atom feed parser for Charlie News
 * Handles standard RSS 2.0, Atom, CDATA, HTML entities, and error boundaries
 */

export interface RawRssStory {
  title: string
  link: string
  contentSnippet: string
  pubDate: string | null
  guid: string | null
  sourceName: string
  feedUrl?: string
  sectionHint?: 'Renovation' | 'Politics'
}

function decodeXmlEntities(text: string): string {
  if (!text) return ''
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '--')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractTagContent(xml: string, tagName: string): string {
  // Check CDATA first: <tagName><![CDATA[...]]></tagName>
  const cdataRegex = new RegExp(
    `<${tagName}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tagName}>`,
    'i',
  )
  const cdataMatch = xml.match(cdataRegex)
  if (cdataMatch) {
    return cdataMatch[1].trim()
  }

  // Normal tag: <tagName>...</tagName>
  const normalRegex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i')
  const match = xml.match(normalRegex)
  if (match) {
    return decodeXmlEntities(match[1].trim())
  }

  return ''
}

export function parseRssXml(xml: string, defaultSourceName = 'News Source'): RawRssStory[] {
  const stories: RawRssStory[] = []

  // Extract channel/feed title from header before first item or entry
  const headerXml = xml.split(/<item[\s>]/i)[0]?.split(/<entry[\s>]/i)[0] || xml
  const channelTitle = extractTagContent(headerXml, 'title') || defaultSourceName

  // 1. Check for RSS 2.0 <item> blocks
  const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || []
  for (const itemXml of itemMatches) {
    const title = stripHtml(extractTagContent(itemXml, 'title'))
    const link =
      extractTagContent(itemXml, 'link') ||
      extractTagContent(itemXml, 'guid') ||
      ''
    const content =
      extractTagContent(itemXml, 'content:encoded') ||
      extractTagContent(itemXml, 'description') ||
      ''
    const pubDate = extractTagContent(itemXml, 'pubDate') || null
    const guid = extractTagContent(itemXml, 'guid') || link

    if (title && (link || guid)) {
      stories.push({
        title,
        link: link.trim(),
        contentSnippet: stripHtml(content),
        pubDate: pubDate ? new Date(pubDate).toISOString() : null,
        guid: guid.trim(),
        sourceName: channelTitle,
      })
    }
  }

  // 2. Check for Atom <entry> blocks if no RSS items found
  if (stories.length === 0) {
    const entryMatches = xml.match(/<entry[\s\S]*?<\/entry>/gi) || []
    for (const entryXml of entryMatches) {
      const title = stripHtml(extractTagContent(entryXml, 'title'))
      
      // Link in atom can be <link href="..."/>
      let link = extractTagContent(entryXml, 'link')
      if (!link) {
        const linkHrefMatch = entryXml.match(/<link[^>]+href=["']([^"']+)["']/i)
        if (linkHrefMatch) {
          link = linkHrefMatch[1]
        }
      }

      const content =
        extractTagContent(entryXml, 'content') ||
        extractTagContent(entryXml, 'summary') ||
        ''
      const pubDate =
        extractTagContent(entryXml, 'published') ||
        extractTagContent(entryXml, 'updated') ||
        null
      const guid = extractTagContent(entryXml, 'id') || link

      if (title && (link || guid)) {
        stories.push({
          title,
          link: link ? link.trim() : '',
          contentSnippet: stripHtml(content),
          pubDate: pubDate ? new Date(pubDate).toISOString() : null,
          guid: guid ? guid.trim() : null,
          sourceName: channelTitle,
        })
      }
    }
  }

  return stories
}

/**
 * Fetches and parses a single RSS/Atom feed URL
 */
export async function fetchRssFeed(
  feedUrl: string,
  timeoutMs = 12000,
): Promise<{ success: boolean; stories: RawRssStory[]; error?: string }> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch(feedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'CharlieNewsBot/1.0 (+https://charlienews.com.au; Australian property reporting)',
        Accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml, text/plain;q=0.9',
      },
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!response.ok) {
      return {
        success: false,
        stories: [],
        error: `HTTP ${response.status} ${response.statusText} from ${feedUrl}`,
      }
    }

    const xmlText = await response.text()
    if (!xmlText || xmlText.trim().length === 0) {
      return {
        success: false,
        stories: [],
        error: `Empty feed response from ${feedUrl}`,
      }
    }

    const parsed = parseRssXml(xmlText)
    if (parsed.length === 0) {
      return {
        success: false,
        stories: [],
        error: `No valid stories found in RSS/Atom feed from ${feedUrl}`,
      }
    }

    const stories = parsed.map((s) => ({
      ...s,
      feedUrl,
    }))

    return {
      success: true,
      stories,
    }
  } catch (err: any) {
    const msg = err.name === 'AbortError' ? `Timeout after ${timeoutMs}ms` : err.message || String(err)
    return {
      success: false,
      stories: [],
      error: `Failed to fetch RSS from ${feedUrl}: ${msg}`,
    }
  }
}
