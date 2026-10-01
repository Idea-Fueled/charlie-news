import React from 'react'
import type { Metadata } from 'next'
import './styles.css'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { getActiveSections } from '@/lib/getNewsData'

export const metadata: Metadata = {
  title: 'Charlie News — Australian Property & Renovation News',
  description:
    'Independent reporting, daily insights, and updates on Australian property markets, housing policies, and renovation trends.',
}

export default async function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sections = await getActiveSections()

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <Header sections={sections} />
        <main className="main-content">{children}</main>
        <Footer sections={sections} />
      </body>
    </html>
  )
}
