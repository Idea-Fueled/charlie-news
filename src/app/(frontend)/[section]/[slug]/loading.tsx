import React from 'react'

export default function ArticleLoading() {
  return (
    <article
      className="site-container article-page-container article-skeleton-loading"
      aria-busy="true"
      aria-label="Loading article..."
    >
      <div className="article-header">
        <div className="skeleton-line skeleton-badge" />
        <div className="skeleton-line skeleton-headline" />
        <div className="skeleton-line skeleton-headline skeleton-headline-sub" />
        <div className="skeleton-line skeleton-meta" />
      </div>

      <div className="skeleton-image-wrapper" />

      <div className="article-content-grid">
        <div className="article-main-body">
          <div className="skeleton-line skeleton-text" />
          <div className="skeleton-line skeleton-text" />
          <div className="skeleton-line skeleton-text skeleton-text-short" />
          <div className="skeleton-line skeleton-text" />
          <div className="skeleton-line skeleton-text" />
          <div className="skeleton-line skeleton-text skeleton-text-short" />
        </div>
      </div>
    </article>
  )
}
