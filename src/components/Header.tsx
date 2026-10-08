'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SectionItem {
  id?: number | string
  name: string
  slug: string
  menuOrder?: number
}

interface HeaderProps {
  sections?: SectionItem[]
}

export function Header({ sections = [] }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Close mobile drawer when user presses Escape key (WCAG keyboard accessibility)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  // Format today's date in Australian English
  const todayFormatted = new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Australia/Sydney',
  }).format(new Date())

  return (
    <>
      {/* Top Utility Bar */}
      <div className="top-utility-bar">
        <div className="site-container top-utility-inner">
          <div className="utility-date">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
              <line x1="16" x2="16" y1="2" y2="6"/>
              <line x1="8" x2="8" y1="2" y2="6"/>
              <line x1="3" x2="21" y1="10" y2="10"/>
            </svg>
            <span>
              {todayFormatted} <span className="utility-tz">(Sydney Time)</span>
            </span>
          </div>
          <div className="utility-right">
            <Link
              href="/admin"
              className="utility-admin-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Admin Login (opens in new tab)"
            >
              <span>Admin Login</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 3h6v6"/>
                <path d="M10 14 21 3"/>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <header className="site-header">
        <div className="site-container">
          <div className="header-main">
            <Link href="/" className="brand-logo" aria-label="Charlie News Homepage">
              <span className="brand-logo-text">Charlie News</span>
              <span className="brand-badge" aria-hidden="true">AU PROPERTY</span>
            </Link>

            <nav className="header-nav" aria-label="Main navigation">
              <Link
                href="/"
                className={`nav-link ${pathname === '/' ? 'active' : ''}`}
                aria-current={pathname === '/' ? 'page' : undefined}
              >
                Home
              </Link>
              {sections.map((sec) => {
                const isActive = pathname === `/${sec.slug}` || pathname.startsWith(`/${sec.slug}/`)
                return (
                  <Link
                    key={sec.slug}
                    href={`/${sec.slug}`}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {sec.name}
                  </Link>
                )
              })}
            </nav>

            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-drawer"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {mobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </>
                ) : (
                  <>
                    <line x1="4" y1="12" x2="20" y2="12"/>
                    <line x1="4" y1="6" x2="20" y2="6"/>
                    <line x1="4" y1="18" x2="20" y2="18"/>
                  </>
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <nav id="mobile-nav-drawer" className="mobile-nav-drawer open" aria-label="Mobile navigation">
              <Link
                href="/"
                className={`nav-link ${pathname === '/' ? 'active' : ''}`}
                aria-current={pathname === '/' ? 'page' : undefined}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              {sections.map((sec) => {
                const isActive = pathname === `/${sec.slug}` || pathname.startsWith(`/${sec.slug}/`)
                return (
                  <Link
                    key={sec.slug}
                    href={`/${sec.slug}`}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {sec.name}
                  </Link>
                )
              })}
              <Link
                href="/admin"
                className="nav-link"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Admin Panel (opens in new tab)"
              >
                Admin Panel <span aria-hidden="true">↗</span>
              </Link>
            </nav>
          )}
        </div>
      </header>
    </>
  )
}
