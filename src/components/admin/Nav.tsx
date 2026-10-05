'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useNav } from '@payloadcms/ui'
import { AdminLogo } from './Logo'

interface NavProps {
  user?: {
    email?: string
    id?: string | number
  } | null
}

export const AdminNav: React.FC<NavProps> = ({ user }) => {
  const pathname = usePathname() || ''
  const searchParams = useSearchParams()
  const statusParam = searchParams?.get('where[status][equals]')

  const { navOpen, setNavOpen, navRef, hydrated } = useNav()

  const handleNavClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1025) {
      setNavOpen?.(false)
    }
  }

  // SOW Required Navigation Items
  const navItems = [
    {
      label: 'Dashboard',
      href: '/admin',
      isActive: pathname === '/admin' || pathname === '/admin/',
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="9" />
          <rect x="14" y="3" width="7" height="5" />
          <rect x="14" y="12" width="7" height="9" />
          <rect x="3" y="16" width="7" height="5" />
        </svg>
      ),
    },
    {
      label: 'Review Queue',
      href: '/admin/collections/articles?where[status][equals]=Draft',
      isActive:
        pathname.startsWith('/admin/collections/articles') &&
        (statusParam === 'Draft' || (!statusParam && !pathname.includes('/Published'))),
      badge: 'Drafts',
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 12h-6l-2 3h-4l-2-3H2" />
          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
      ),
    },
    {
      label: 'Published Articles',
      href: '/admin/collections/articles?where[status][equals]=Published',
      isActive:
        pathname.startsWith('/admin/collections/articles') && statusParam === 'Published',
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
          <path d="M18 14h-8" />
          <path d="M15 18h-5" />
          <path d="M10 6h8v4h-8V6Z" />
        </svg>
      ),
    },
    {
      label: 'Sections',
      href: '/admin/collections/sections',
      isActive: pathname.startsWith('/admin/collections/sections'),
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
          <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
          <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
        </svg>
      ),
    },
    {
      label: 'Privacy & Terms',
      href: '/admin/collections/pages',
      isActive: pathname.startsWith('/admin/collections/pages'),
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      label: 'Admin Account',
      href: '/admin/account',
      isActive:
        pathname.startsWith('/admin/account') || pathname.startsWith('/admin/collections/users'),
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ]

  return (
    <aside
      className={`nav ${navOpen ? 'nav--nav-open' : ''} ${hydrated ? 'nav--nav-hydrated' : ''} charlie-admin-sidebar`}
    >
      <div className="nav__scroll" ref={navRef}>
        <div className="charlie-sidebar-inner">
          {/* Sidebar Header with Brand */}
          <div className="charlie-sidebar-header">
            <Link
              href="/admin"
              className="charlie-sidebar-brand"
              onClick={handleNavClick}
            >
              <AdminLogo />
            </Link>
            <span className="charlie-sidebar-tagline">Editorial CMS</span>
          </div>

          {/* Main Navigation Section */}
          <div className="charlie-sidebar-content">
            <div className="charlie-nav-group-label">EDITORIAL MANAGEMENT</div>
            <nav className="charlie-nav-menu">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`charlie-nav-link ${item.isActive ? 'charlie-nav-link--active' : ''}`}
                  onClick={handleNavClick}
                >
                  <span className="charlie-nav-icon">{item.icon}</span>
                  <span className="charlie-nav-label">{item.label}</span>
                  {item.badge && <span className="charlie-nav-badge">{item.badge}</span>}
                </Link>
              ))}
            </nav>

            {/* Public Website Preview Shortcut */}
            <div className="charlie-sidebar-divider" />
            <div className="charlie-nav-group-label">PUBLICATION</div>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="charlie-nav-link charlie-nav-link--external"
            >
              <span className="charlie-nav-icon">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </span>
              <span className="charlie-nav-label">View Live Website</span>
              <span className="charlie-nav-external-arrow">↗</span>
            </a>
          </div>

          {/* Sidebar Footer: Red Logout Button Only */}
          <div className="charlie-sidebar-footer">
            <Link
              href="/admin/logout"
              className="charlie-logout-btn-red"
              title="Log Out"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Log out</span>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default AdminNav
