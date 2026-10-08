import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPageBySlug } from '@/lib/getPageData'
import { RichTextRenderer } from '@/components/RichTextRenderer'

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getSiteUrl, toAbsoluteImageUrl, DEFAULT_OG_IMAGE } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug('privacy-terms')
  const title = page?.title || 'Privacy Policy & Terms of Use'
  const siteUrl = getSiteUrl()
  const canonicalUrl = `${siteUrl}/privacy-terms`
  const description =
    'Privacy policy and terms of use for Charlie News Australian property publication.'
  const ogImageUrl = toAbsoluteImageUrl(DEFAULT_OG_IMAGE)

  return {
    title: `${title} | Charlie News`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | Charlie News`,
      description,
      url: canonicalUrl,
      siteName: 'Charlie News',
      locale: 'en_AU',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${title} | Charlie News`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Charlie News`,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function PrivacyTermsPage() {
  const page = await getPageBySlug('privacy-terms')

  const title = page?.title || 'Privacy Policy & Terms of Use'
  const hasCmsPrivacyPolicy = Boolean(page?.privacyPolicy?.root?.children?.length)
  const hasCmsTermsOfUse = Boolean(page?.termsOfUse?.root?.children?.length)

  return (
    <div className="site-container privacy-terms-container">
      <nav className="article-breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: '24px' }}>
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Privacy & Terms</span>
      </nav>

      <h1 className="article-headline" style={{ marginBottom: '28px' }}>
        {title}
      </h1>

      {/* Section 1: Privacy Policy */}
      <section style={{ marginBottom: '48px' }}>
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.75rem',
            marginBottom: '16px',
            color: 'var(--color-text-main)',
          }}
        >
          1. Privacy Policy
        </h2>

        {hasCmsPrivacyPolicy ? (
          <RichTextRenderer content={page?.privacyPolicy} />
        ) : (
          <p style={{ color: 'var(--color-text-muted, #64748b)', fontStyle: 'italic', fontSize: '1rem' }}>
            Privacy Policy content is managed in Payload CMS.
          </p>
        )}
      </section>

      {/* Section 2: Terms of Use */}
      <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '40px' }}>
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.75rem',
            marginBottom: '16px',
            color: 'var(--color-text-main)',
          }}
        >
          2. Terms of Use
        </h2>

        {hasCmsTermsOfUse ? (
          <RichTextRenderer content={page?.termsOfUse} />
        ) : (
          <p style={{ color: 'var(--color-text-muted, #64748b)', fontStyle: 'italic', fontSize: '1rem' }}>
            Terms of Use content is managed in Payload CMS.
          </p>
        )}
      </section>

      <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
        <Link href="/" className="page-btn" aria-label="Return to Home">
          <span aria-hidden="true">←</span> Return to Home
        </Link>
      </div>
    </div>
  )
}
