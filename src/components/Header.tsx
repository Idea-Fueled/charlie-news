'use client'

import React, { useState } from 'react'
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
              <line x1="16" x2="16" y1="2" y2="6"/>
              <line x1="8" x2="8" y1="2" y2="6"/>
              <line x1="3" x2="21" y1="10" y2="10"/>
            </svg>
            <span>{todayFormatted} (Sydney Time)</span>
          </div>
          <div className="utility-right">
            <Link href="/admin" className="utility-admin-link" target="_blank" rel="noopener noreferrer">
              <span>Admin Login</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <Link href="/" className="brand-logo">
              <span className="brand-logo-text">Charlie News</span>
              <span className="brand-badge">AU PROPERTY</span>
            </Link>

            <nav className="header-nav">
              <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
                Home
              </Link>
              {sections.map((sec) => (
                <Link
                  key={sec.slug}
                  href={`/${sec.slug}`}
                  className={`nav-link ${pathname === `/${sec.slug}` || pathname.startsWith(`/${sec.slug}/`) ? 'active' : ''}`}
                >
                  {sec.name}
                </Link>
              ))}
            </nav>

            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="mobile-nav-drawer open">
              <Link
                href="/"
                className={`nav-link ${pathname === '/' ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              {sections.map((sec) => (
                <Link
                  key={sec.slug}
                  href={`/${sec.slug}`}
                  className={`nav-link ${pathname === `/${sec.slug}` || pathname.startsWith(`/${sec.slug}/`) ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {sec.name}
                </Link>
              ))}
              <Link
                href="/admin"
                className="nav-link"
                target="_blank"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Panel ↗
              </Link>
            </div>
          )}
        </div>
      </header>
    </>
  )
}
