import React from 'react'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getArticleBySlugOrRedirect } from '@/lib/getNewsData'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { ArticleTOCAndShare } from '@/components/ArticleTOCAndShare'
import { extractHeadingsFromLexical } from '@/lib/toc'

import { getSiteUrl, toAbsoluteImageUrl } from '@/lib/seo'

export const dynamic = 'force-dynamic'

interface ArticlePageProps {
  params: Promise<{
    section: string
    slug: string
  }>
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { section: sectionSlug, slug: articleSlug } = await params
  const res = await getArticleBySlugOrRedirect(sectionSlug, articleSlug)

  if (res.type !== 'found' || !res.article) {
    return {
      title: 'Article Not Found | Charlie News',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const { article } = res
  const siteUrl = getSiteUrl()
  const canonicalUrl = `${siteUrl}/${sectionSlug}/${article.slug}`
  const description = article.seoDescription || article.summary || article.headline
  const articleImageUrl = toAbsoluteImageUrl(article.image?.url || article.image)
  const imageAlt = article.imageAlt || article.headline

  return {
    title: `${article.headline} | Charlie News`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: article.headline,
      description,
      url: canonicalUrl,
      siteName: 'Charlie News',
      locale: 'en_AU',
      type: 'article',
      publishedTime: article.publishedAt || article.createdAt || undefined,
      modifiedTime: article.updatedAt || article.publishedAt || undefined,
      section: article.section?.name || 'Property',
      images: [
        {
          url: articleImageUrl,
          secureUrl: articleImageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt,
          type: 'image/jpeg',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.headline,
      description,
      images: [
        {
          url: articleImageUrl,
          alt: imageAlt,
        },
      ],
    },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { section: sectionSlug, slug: articleSlug } = await params
  const res = await getArticleBySlugOrRedirect(sectionSlug, articleSlug)

  // SOW 4.4: 301 Permanent Redirect when previous slug or canonical section is matched
  if (res.type === 'redirect') {
    permanentRedirect(res.targetUrl)
  }

  if (res.type === 'notFound' || !res.article) {
    notFound()
  }

  const article = res.article

  // Format Australian date (Sydney time - SOW 4.4)
  const dateStr = article.publishedAt || article.createdAt
  const formattedDate = dateStr
    ? new Intl.DateTimeFormat('en-AU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Australia/Sydney',
      }).format(new Date(dateStr))
    : 'Recent'

  const sectionName = article.section?.name || 'Property'

  // Photo attribution rendering (SOW 4.4)
  const imageSource = article.image?.source
  const creditName = article.imageCredit?.name
  const creditLink = article.imageCredit?.link

  let photoCreditElement: React.ReactNode = null
  if (creditName) {
    if (imageSource === 'Unsplash') {
      photoCreditElement = (
        <span>
          Photo by{' '}
          <a
            href={creditLink || 'https://unsplash.com'}
            target="_blank"
            rel="noopener noreferrer"
          >
            {creditName}
          </a>{' '}
          on{' '}
          <a
            href="https://unsplash.com?utm_source=charlie_news&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
          >
            Unsplash
          </a>
        </span>
      )
    } else if (imageSource === 'Pexels') {
      photoCreditElement = (
        <span>
          Photo by{' '}
          <a
            href={creditLink || 'https://pexels.com'}
            target="_blank"
            rel="noopener noreferrer"
          >
            {creditName}
          </a>{' '}
          on Pexels
        </span>
      )
    } else {
      photoCreditElement = <span>Photo credit: {creditName}</span>
    }
  }

  const tocItems = extractHeadingsFromLexical(article.body)
  const siteUrl = getSiteUrl()
  const canonicalUrl = `${siteUrl}/${sectionSlug}/${article.slug}`

  const featuredImageUrl =
    article.image?.url || (typeof article.image === 'string' ? article.image : null)

  // NewsArticle JSON-LD Structured Data (Schema.org)
  const newsArticleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    headline: article.headline,
    description: article.seoDescription || article.summary,
    url: canonicalUrl,
    datePublished: article.publishedAt || article.createdAt,
    dateModified: article.updatedAt || article.publishedAt || article.createdAt,
    ...(featuredImageUrl
      ? {
          image: [toAbsoluteImageUrl(featuredImageUrl)],
        }
      : {}),
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: 'Charlie News',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/favicon.ico`,
      },
    },
    articleSection: sectionName,
    inLanguage: 'en-AU',
  }

  return (
    <>
      {/* NewsArticle Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleJsonLd) }}
      />

      <article className="site-container article-page-container">
        {/* TOP SECTION: Wide Header (Headline, Breadcrumb, Summary, Meta) */}
      <div className="article-top-header">
        {/* Breadcrumb (SOW 4.4) */}
        <nav className="article-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/${sectionSlug}`}>{sectionName}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" style={{ color: 'var(--color-text-main)', fontWeight: 500 }}>Article</span>
        </nav>

        {/* Headline */}
        <h1 className="article-headline">{article.headline}</h1>

        {/* Lead Summary */}
        {article.summary && (
          <p className="article-lead-summary">{article.summary}</p>
        )}

        {/* Metadata Row */}
        <div className="article-meta-header">
          <div>
            Published on <time dateTime={dateStr || undefined}><strong>{formattedDate}</strong></time> (Sydney Time)
          </div>
          <div>
            Section:{' '}
            <Link
              href={`/${sectionSlug}`}
              style={{ fontWeight: 600, color: 'var(--color-accent)' }}
            >
              {sectionName}
            </Link>
          </div>
        </div>
      </div>

      {/* 2-COLUMN UNIFIED CONTENT FRAME */}
      <div className="article-content-grid">
        {/* LEFT COLUMN: Sticky Table of Contents & Share */}
        <aside
          className={`article-sidebar-col ${tocItems.length === 0 ? 'article-sidebar-col--no-toc' : ''}`}
          aria-label="Article navigation and sharing"
        >
          <div className="article-sidebar-sticky">
            <ArticleTOCAndShare
              items={tocItems}
              articleTitle={article.headline}
              canonicalUrl={canonicalUrl}
            />
          </div>
        </aside>

        {/* RIGHT COLUMN: Featured Photo + Article Body Content */}
        <div className="article-main-col">
          {/* Featured Photo at the top of the right column */}
          {featuredImageUrl && (
            <div className="article-featured-image-box">
              <Image
                src={featuredImageUrl}
                alt={article.imageAlt || article.headline}
                width={1200}
                height={675}
                priority
                sizes="(max-width: 1024px) 100vw, 840px"
                style={{ width: '100%', height: 'auto', maxHeight: '520px', objectFit: 'cover' }}
              />
            </div>
          )}

          {/* Photo credit line under photo (SOW 4.4) */}
          {photoCreditElement && (
            <div className="photo-credit-line">{photoCreditElement}</div>
          )}

          {/* Article Body Content */}
          <RichTextRenderer
            content={article.body}
            fallbackText={article.bodyText}
          />

          {/* Claude AI Disclosure Note (SOW 4.4 & 6.3) */}
          <div className="ai-disclosure-badge">
            <div className="ai-disclosure-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <div>
              <div className="ai-disclosure-title">Charlie News Editorial Transparency</div>
              <div className="ai-disclosure-desc">
                This article was researched and drafted with the assistance of Claude AI, then reviewed, edited, and approved by Charlie News editors before publication.
              </div>
            </div>
          </div>

          {/* Back to section navigation */}
          <div className="article-back-nav">
            <Link href={`/${sectionSlug}`} className="page-btn" aria-label={`Back to ${sectionName} News`}>
              <span aria-hidden="true">←</span> Back to {sectionName} News
            </Link>
          </div>
        </div>
      </div>
    </article>
    </>
  )
}
