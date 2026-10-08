import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArticleCard } from '@/components/ArticleCard'
import {
  getActiveSections,
  getAllPublishedArticles,
} from '@/lib/getNewsData'

import type { Metadata } from 'next'

import { getSiteUrl, toAbsoluteImageUrl, DEFAULT_OG_IMAGE } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  const title = 'Charlie News | Australian Property News & Market Intelligence'
  const description =
    'Australian property news covering renovations, housing policy, market trends, and real estate politics across Sydney, Melbourne, Brisbane, and regional Australia.'

  let leadImageUrl = DEFAULT_OG_IMAGE
  let leadImageAlt = 'Charlie News | Australian Property News & Market Intelligence'

  try {
    const { articles } = await getAllPublishedArticles()
    if (articles?.[0]?.image?.url) {
      leadImageUrl = articles[0].image.url
      leadImageAlt = articles[0].imageAlt || articles[0].headline || leadImageAlt
    }
  } catch {
    // Keep DEFAULT_OG_IMAGE on fallback
  }

  const ogImageUrl = toAbsoluteImageUrl(leadImageUrl)

  return {
    title,
    description,
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      title,
      description,
      url: siteUrl,
      siteName: 'Charlie News',
      locale: 'en_AU',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: leadImageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function HomePage() {
  const [sections, { articles, isDemo }] = await Promise.all([
    getActiveSections(),
    getAllPublishedArticles(),
  ])

  // SOW 4.2: Top story is the newest published article
  const topStory = articles[0]
  // SOW 4.2: Latest articles grid shows the next 12 newest published articles
  const gridArticles = articles.slice(1, 13)

  // Per-section rows: for each active section, get up to 4 newest articles
  const sectionRows = sections.map((sec) => {
    const secArticles = articles
      .filter((a) => a.section?.slug?.toLowerCase() === sec.slug.toLowerCase())
      .slice(0, 4)
    return {
      section: sec,
      articles: secArticles,
    }
  })

  // Format Top Story date
  const topStoryDate = topStory?.publishedAt || topStory?.createdAt
  const formattedTopDate = topStoryDate
    ? new Intl.DateTimeFormat('en-AU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Australia/Sydney',
      }).format(new Date(topStoryDate))
    : 'Latest Update'

  const topStorySectionSlug = topStory?.section?.slug || 'property'
  const topStorySectionName = topStory?.section?.name || 'Property'
  const topStoryBadgeClass = topStorySectionSlug.toLowerCase().includes('renovation')
    ? 'renovation'
    : topStorySectionSlug.toLowerCase().includes('politics')
    ? 'politics'
    : 'general'

  return (
    <div className="site-container">
      {/* Demo notice if no database articles yet */}
      {isDemo && (
        <div className="demo-banner">
          <span>
            ℹ️ <strong>Preview Mode:</strong> Showing sample Australian property stories. Approve drafts in the{' '}
            <Link href="/admin" style={{ textDecoration: 'underline', fontWeight: 600 }}>
              Admin Panel
            </Link>{' '}
            to display live articles here.
          </span>
        </div>
      )}

      {/* TOP STORY (Hero Lead Article) - SOW 4.2 */}
      {topStory && (
        <section className="hero-section" aria-label="Lead story">
          <div className="hero-card">
            <Link
              href={`/${topStorySectionSlug}/${topStory.slug}`}
              className="hero-image-wrapper"
              aria-label={`Read story: ${topStory.headline}`}
            >
              <Image
                src={
                  topStory.image?.url ||
                  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
                }
                alt={topStory.imageAlt || topStory.headline}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                style={{ objectFit: 'cover' }}
              />
            </Link>

            <div className="hero-content">
              <Link href={`/${topStorySectionSlug}`} aria-label={`Section: ${topStorySectionName}`}>
                <span className={`badge-tag ${topStoryBadgeClass}`}>
                  {topStorySectionName}
                </span>
              </Link>
              <Link href={`/${topStorySectionSlug}/${topStory.slug}`}>
                <h1 className="hero-title">{topStory.headline}</h1>
              </Link>
              <p className="hero-summary">{topStory.summary}</p>
              <div className="meta-row">
                <time className="meta-date" dateTime={topStoryDate || undefined}>{formattedTopDate}</time>
                <span className="meta-dot" aria-hidden="true"></span>
                <span>Sydney, AU</span>
                <span className="meta-dot" aria-hidden="true"></span>
                <Link
                  href={`/${topStorySectionSlug}/${topStory.slug}`}
                  aria-label={`Read full story: ${topStory.headline}`}
                  style={{ color: 'var(--color-accent)', fontWeight: 600 }}
                >
                  Full Story <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* LATEST ARTICLES GRID (Next 12 articles) - SOW 4.2 */}
      {gridArticles.length > 0 && (
        <section className="section-block" aria-labelledby="latest-news-heading">
          <div className="section-header-bar">
            <h2 id="latest-news-heading" className="section-heading">Latest Property News</h2>
            <span style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
              Updated 4x Daily
            </span>
          </div>
          <div className="cards-grid">
            {gridArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* PER-SECTION ROWS - SOW 4.2 */}
      {sectionRows.map(
        ({ section, articles: secArticles }) =>
          secArticles.length > 0 && (
            <section
              key={section.slug}
              className="section-block"
              aria-labelledby={`section-heading-${section.slug}`}
            >
              <div className="section-header-bar">
                <div>
                  <h2 id={`section-heading-${section.slug}`} className="section-heading">{section.name}</h2>
                  {section.description && (
                    <p
                      style={{
                        fontSize: '0.9rem',
                        color: 'var(--color-text-muted)',
                        marginTop: '2px',
                      }}
                    >
                      {section.description}
                    </p>
                  )}
                </div>
                <Link href={`/${section.slug}`} className="section-see-all">
                  See all {section.name} <span aria-hidden="true">→</span>
                </Link>
              </div>

              <div className="cards-grid">
                {secArticles.map((art) => (
                  <ArticleCard
                    key={art.id}
                    article={art}
                    sectionSlug={section.slug}
                    sectionName={section.name}
                  />
                ))}
              </div>
            </section>
          ),
      )}
    </div>
  )
}
