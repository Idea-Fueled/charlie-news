import type { MetadataRoute } from 'next'
import { getActiveSections, getAllPublishedArticles } from '@/lib/getNewsData'
import { getSiteUrl } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const entries: MetadataRoute.Sitemap = []

  // 1. Homepage
  entries.push({
    url: siteUrl,
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 1.0,
  })

  // 2. Active public sections
  try {
    const sections = await getActiveSections()
    for (const section of sections) {
      entries.push({
        url: `${siteUrl}/${section.slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      })
    }
  } catch (err) {
    console.error('Error fetching sections for sitemap:', err)
  }

  // 3. Published articles ONLY (never Draft or Rejected)
  try {
    const { articles } = await getAllPublishedArticles(500)
    for (const article of articles) {
      const sectionSlug = article.section?.slug || 'property'
      const lastModDate = article.updatedAt
        ? new Date(article.updatedAt)
        : article.publishedAt
        ? new Date(article.publishedAt)
        : new Date()

      entries.push({
        url: `${siteUrl}/${sectionSlug}/${article.slug}`,
        lastModified: lastModDate,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
  } catch (err) {
    console.error('Error fetching articles for sitemap:', err)
  }

  // 4. Public static pages
  entries.push({
    url: `${siteUrl}/privacy-terms`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.3,
  })

  return entries
}
