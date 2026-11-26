import React from 'react'
import type { Metadata } from 'next'
import { Inter, Newsreader } from 'next/font/google'
import './styles.css'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { NavigationProgress } from '@/components/NavigationProgress'
import { getActiveSections } from '@/lib/getNewsData'

import { getSiteUrl, toAbsoluteImageUrl, DEFAULT_OG_IMAGE } from '@/lib/seo'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  style: ['normal', 'italic'],
  variable: '--font-serif',
})

const siteUrl = getSiteUrl()
const defaultOgUrl = toAbsoluteImageUrl(DEFAULT_OG_IMAGE)

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Property News Australia | Australian Property News & Market Intelligence',
    template: '%s | Property News Australia',
  },
  description:
    'Independent reporting, daily insights, and updates on Australian property markets, housing policies, and renovation trends.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/fav-icon.png', type: 'image/png' },
    ],
    shortcut: '/fav-icon.png',
    apple: '/apple-touch-icon.png',
  },
  alternates: {
    canonical: siteUrl,
    types: {
      'application/rss+xml': `${siteUrl}/rss.xml`,
    },
  },
  openGraph: {
    siteName: 'Property News Australia',
    locale: 'en_AU',
    type: 'website',
    images: [
      {
        url: defaultOgUrl,
        width: 1200,
        height: 630,
        alt: 'Property News Australia | Australian Property News & Market Intelligence',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [defaultOgUrl],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sections = await getActiveSections()

  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable}`}>
      <body>
        <NavigationProgress />
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <Header sections={sections} />
        <main id="main-content" className="main-content">
          {children}
        </main>
        <Footer sections={sections} />
      </body>
    </html>
  )
}
