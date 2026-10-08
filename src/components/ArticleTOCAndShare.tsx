'use client'

import React, { useState, useEffect } from 'react'
import type { TOCItem } from '@/lib/toc'

interface ArticleTOCAndShareProps {
  items: TOCItem[]
  articleTitle: string
  canonicalUrl: string
}

export function ArticleTOCAndShare({
  items,
  articleTitle,
  canonicalUrl,
}: ArticleTOCAndShareProps) {
  const [copied, setCopied] = useState(false)
  const [currentUrl, setCurrentUrl] = useState(canonicalUrl)
  const [activeId, setActiveId] = useState<string>('')

  // Use actual client URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href)
    }
  }, [])

  // Scroll spy to highlight the currently active section in the sticky sidebar
  useEffect(() => {
    if (!items || items.length === 0) return

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 130 // Header offset + threshold
      let currentActive = items[0]?.id || ''

      for (const item of items) {
        const el = document.getElementById(item.id)
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY
          if (top <= scrollPosition) {
            currentActive = item.id
          }
        }
      }
      setActiveId(currentActive)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [items])

  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentUrl)
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea')
        textarea.value = currentUrl
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const handleScrollToHeading = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const target = document.getElementById(id)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
      setActiveId(id)
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', `#${id}`)
      }
    }
  }

  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(articleTitle)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
    email: `mailto:?subject=${encodeURIComponent(articleTitle)}&body=${encodeURIComponent(
      `Read this article on Charlie News:\n\n${articleTitle}\n${currentUrl}`,
    )}`,
  }

  const hasTOC = items && items.length > 0

  return (
    <div className={`article-toc-card ${!hasTOC ? 'article-toc-card--share-only' : ''}`}>
      {/* FEATURE 1: Table of Contents (Hidden if no H2 headings) */}
      {hasTOC && (
        <div className="article-toc-section">
          <div className="article-toc-header">
            <h2 className="article-toc-title">Jump to section</h2>
          </div>

          <nav aria-label="Table of contents">
            <div className="article-toc-list">
              {items.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => handleScrollToHeading(e, item.id)}
                  className={`article-toc-link ${activeId === item.id ? 'active' : ''}`}
                  aria-current={activeId === item.id ? 'true' : undefined}
                >
                  <span className="article-toc-text">{item.text}</span>
                </a>
              ))}
            </div>
          </nav>
        </div>
      )}

      {/* Divider between TOC and Share section if TOC exists */}
      {hasTOC && <div className="article-toc-divider" />}

      {/* FEATURE 2: Share this Article */}
      <div className="article-share-section">
        <span className="article-share-label">Share this article</span>
        <div className="article-share-buttons">
          {/* Facebook */}
          <a
            href={shareUrls.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="article-share-btn"
            title="Share on Facebook"
            aria-label="Share on Facebook"
          >
            <svg
              className="article-share-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>

          {/* X / Twitter */}
          <a
            href={shareUrls.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="article-share-btn"
            title="Share on X"
            aria-label="Share on X"
          >
            <svg
              className="article-share-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          {/* LinkedIn */}
          <a
            href={shareUrls.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="article-share-btn"
            title="Share on LinkedIn"
            aria-label="Share on LinkedIn"
          >
            <svg
              className="article-share-icon"
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
          </a>

          {/* Email */}
          <a
            href={shareUrls.email}
            className="article-share-btn"
            title="Share via Email"
            aria-label="Share via Email"
          >
            <svg
              className="article-share-icon"
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </a>

          {/* Copy Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className={`article-share-btn article-share-btn--copy ${copied ? 'copied' : ''}`}
            title={copied ? 'Link copied!' : 'Copy link'}
            aria-label={copied ? 'Link copied to clipboard' : 'Copy link to article'}
          >
            {copied ? (
              <svg
                className="article-share-icon"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                className="article-share-icon"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            )}
          </button>
          <span className="sr-only" role="status" aria-live="polite">
            {copied ? 'Article link copied to clipboard.' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ArticleTOCAndShare
