import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Not Found | Charlie News',
  description: 'The property article, section, or page you were looking for does not exist on Charlie News.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return (
    <div className="site-container">
      <div className="not-found-wrapper">
        <span className="badge-tag general">404 Error</span>
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-desc">
          The property article, market guide, or page you are looking for doesn&apos;t exist, has been renamed, or is temporarily unavailable.
        </p>

        <nav className="not-found-actions" aria-label="Suggested pages">
          <Link href="/" className="page-btn active not-found-primary-btn" aria-label="Return to Homepage">
            <span aria-hidden="true">←</span> Return to Homepage
          </Link>
          <Link href="/renovation" className="page-btn">
            Renovation News
          </Link>
          <Link href="/politics" className="page-btn">
            Housing Politics
          </Link>
        </nav>
      </div>
    </div>
  )
}
