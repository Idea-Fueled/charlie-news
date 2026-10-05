import React from 'react'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getArticleBySlugOrRedirect } from '@/lib/getNewsData'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { ArticleTOCAndShare } from '@/components/ArticleTOCAndShare'
import { extractHeadingsFromLexical } from '@/lib/toc'

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

  if (res.type !== 'found') {
    return {
      title: 'Article Not Found | Charlie News',
    }
  }

  const { article } = res
  const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3005'
  const canonicalUrl = `${siteUrl}/${sectionSlug}/${article.slug}`
  const description = article.seoDescription || article.summary

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
      type: 'article',
      publishedTime: article.publishedAt || undefined,
      images: article.image?.url
        ? [
            {
              url: article.image.url,
              alt: article.imageAlt || article.headline,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.headline,
      description,
      images: article.image?.url ? [article.image.url] : [],
    },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { section: sectionSlug, slug: articleSlug } = await params
  const res = await getArticleBySlugOrRedirect(sectionSlug, articleSlug)

  // SOW 4.4: 301 Permanent Redirect when previous slug or canonical section is matched
  if (res.type === 'redirect') {
    redirect(res.targetUrl)
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

  return (
    <article className="article-page-container">
      {/* Breadcrumb (SOW 4.4) */}
      <nav className="article-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href={`/${sectionSlug}`}>{sectionName}</Link>
        <span>/</span>
        <span style={{ color: 'var(--color-text-main)', fontWeight: 500 }}>Article</span>
      </nav>

      {/* Headline & Summary */}
      <h1 className="article-headline">{article.headline}</h1>
      {article.summary && (
        <p className="article-lead-summary">{article.summary}</p>
      )}

      {/* Metadata Row */}
      <div className="article-meta-header">
        <div>
          Published on <strong>{formattedDate}</strong> (Sydney Time)
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

      {/* Featured Photo */}
      {article.image?.url && (
        <div className="article-featured-image-box">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.image.url}
            alt={article.imageAlt || article.headline}
          />
        </div>
      )}

      {/* Photo credit line under photo (SOW 4.4) */}
      {photoCreditElement && (
        <div className="photo-credit-line">{photoCreditElement}</div>
      )}

      {/* Table of Contents & Share Article Section */}
      <ArticleTOCAndShare
        items={extractHeadingsFromLexical(article.body)}
        articleTitle={article.headline}
        canonicalUrl={`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3005'}/${sectionSlug}/${article.slug}`}
      />

      {/* Article Body Content */}
      <RichTextRenderer
        content={article.body}
        fallbackText={article.bodyText}
      />

      {/* Claude AI Disclosure Note (SOW 4.4 & 6.3) */}
      <div className="ai-disclosure-badge">
        <div className="ai-disclosure-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
        <Link href={`/${sectionSlug}`} className="page-btn">
          ← Back to {sectionName} News
        </Link>
      </div>
    </article>
  )
}
