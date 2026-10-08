import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/', '/api/*'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
