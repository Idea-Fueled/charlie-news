import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArticleCard } from '@/components/ArticleCard'
import { getActiveSections, getArticlesBySection } from '@/lib/getNewsData'

export const dynamic = 'force-dynamic'

interface SectionPageProps {
  params: Promise<{
    section: string
  }>
  searchParams?: Promise<{
    page?: string
  }>
}

export async function generateMetadata({ params }: SectionPageProps): Promise<Metadata> {
  const { section: sectionSlug } = await params
  const sections = await getActiveSections()
  const currentSection = sections.find(
    (s) => s.slug.toLowerCase() === sectionSlug.toLowerCase(),
  )

  if (!currentSection) {
    return {
      title: 'Section Not Found | Charlie News',
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3005'
  const canonicalUrl = `${siteUrl}/${currentSection.slug}`
  const description =
    currentSection.description ||
    `Latest ${currentSection.name} property news, policies, and market updates from Charlie News.`

  return {
    title: `${currentSection.name} News | Charlie News`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${currentSection.name} News | Charlie News`,
      description,
      url: canonicalUrl,
      type: 'website',
    },
  }
}

export default async function SectionPage({
  params,
  searchParams,
}: SectionPageProps) {
  const { section: sectionSlug } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const rawPage = parseInt(resolvedSearchParams.page || '1', 10)
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage

  const sections = await getActiveSections()
  const currentSection = sections.find(
    (s) => s.slug.toLowerCase() === sectionSlug.toLowerCase(),
  )

  // SOW 4.3: Hidden or non-existent sections return "Page not found"
  if (!currentSection) {
    notFound()
  }

  const { articles, totalPages, currentPage, isDemo } =
    await getArticlesBySection(sectionSlug, page, 12)

  return (
    <div className="site-container">
      {/* Demo notice if no database articles yet */}
      {isDemo && (
        <div className="demo-banner">
          <span>
            ℹ️ <strong>Preview Mode:</strong> Displaying sample stories for {currentSection.name}.
          </span>
        </div>
      )}

      {/* Section Header Banner - SOW 4.3 */}
      <div className="section-page-banner">
        <h1 className="section-page-title">{currentSection.name} News</h1>
        {currentSection.description && (
          <p className="section-page-desc">{currentSection.description}</p>
        )}
      </div>

      {/* Articles Grid or Empty State - SOW 4.3 */}
      {articles.length > 0 ? (
        <>
          <div className="cards-grid">
            {articles.map((art) => (
              <ArticleCard
                key={art.id}
                article={art}
                sectionSlug={currentSection.slug}
                sectionName={currentSection.name}
              />
            ))}
          </div>

          {/* Dynamic Pagination - SOW 4.3 */}
          {totalPages > 1 && (
            <div className="pagination-bar">
              {currentPage > 1 && (
                <Link
                  href={`/${currentSection.slug}?page=${currentPage - 1}`}
                  className="page-btn"
                >
                  ← Prev
                </Link>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                <Link
                  key={pNum}
                  href={`/${currentSection.slug}?page=${pNum}`}
                  className={`page-btn ${pNum === currentPage ? 'active' : ''}`}
                >
                  {pNum}
                </Link>
              ))}

              {currentPage < totalPages && (
                <Link
                  href={`/${currentSection.slug}?page=${currentPage + 1}`}
                  className="page-btn"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        /* SOW 4.3: If a section has no articles, page shows "New stories coming soon." */
        <div className="empty-state-box">
          <h3>New stories coming soon.</h3>
          <p>Our editorial team is currently drafting fresh stories for this section.</p>
          <Link href="/" className="page-btn">
            ← Return to Homepage
          </Link>
        </div>
      )}
    </div>
  )
}
