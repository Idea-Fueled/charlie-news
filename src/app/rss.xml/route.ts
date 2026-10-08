import { getAllPublishedArticles } from '@/lib/getNewsData'
import { escapeXml, getSiteUrl } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export async function GET() {
  const siteUrl = getSiteUrl()
  const { articles } = await getAllPublishedArticles(50)

  const itemsXml = articles
    .map((article) => {
      const sectionSlug = article.section?.slug || 'property'
      const articleUrl = `${siteUrl}/${sectionSlug}/${article.slug}`
      const pubDate = article.publishedAt
        ? new Date(article.publishedAt).toUTCString()
        : article.createdAt
        ? new Date(article.createdAt).toUTCString()
        : new Date().toUTCString()
      const description = article.seoDescription || article.summary || ''

      return `    <item>
      <title>${escapeXml(article.headline)}</title>
      <link>${articleUrl}</link>
      <guid isPermaLink="true">${articleUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
      <category>${escapeXml(article.section?.name || 'Property')}</category>
    </item>`
    })
    .join('\n')

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Charlie News | Australian Property News &amp; Market Intelligence</title>
    <link>${siteUrl}</link>
    <description>Australian property news covering renovations, housing policy, market trends, and real estate politics across Sydney, Melbourne, Brisbane, and regional Australia.</description>
    <language>en-AU</language>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`

  return new Response(rssFeed, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
