import React from 'react'
import Link from 'next/link'

export interface ArticleItem {
  id?: number | string
  headline: string
  slug: string
  summary: string
  publishedAt?: string | null
  createdAt?: string
  section?:
    | {
        name?: string
        slug?: string
      }
    | string
    | number
  image?: {
    url?: string | null
    source?: string | null
  } | null
  imageAlt?: string | null
}

interface ArticleCardProps {
  article: ArticleItem
  sectionSlug?: string
  sectionName?: string
}

export function ArticleCard({ article, sectionSlug, sectionName }: ArticleCardProps) {
  // Determine section info
  const resolvedSectionName =
    sectionName ||
    (typeof article.section === 'object' && article.section?.name) ||
    'Property'

  const resolvedSectionSlug =
    sectionSlug ||
    (typeof article.section === 'object' && article.section?.slug) ||
    'property'

  const articleHref = `/${resolvedSectionSlug}/${article.slug}`

  // Format date
  const dateStr = article.publishedAt || article.createdAt
  const formattedDate = dateStr
    ? new Intl.DateTimeFormat('en-AU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(dateStr))
    : 'Recent'

  const imageUrl =
    article.image?.url ||
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'

  const badgeClass = resolvedSectionSlug.toLowerCase().includes('renovation')
    ? 'renovation'
    : resolvedSectionSlug.toLowerCase().includes('politics')
    ? 'politics'
    : 'general'

  return (
    <article className="news-card">
      <Link href={articleHref} className="card-image-box">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={article.imageAlt || article.headline}
          loading="lazy"
        />
      </Link>
      <div className="card-body">
        <Link href={`/${resolvedSectionSlug}`}>
          <span className={`badge-tag ${badgeClass}`}>{resolvedSectionName}</span>
        </Link>
        <Link href={articleHref}>
          <h3 className="card-title">{article.headline}</h3>
        </Link>
        <p className="card-summary">{article.summary}</p>
        <div className="card-footer">
          <span>{formattedDate}</span>
          <span>Read Story →</span>
        </div>
      </div>
    </article>
  )
}
