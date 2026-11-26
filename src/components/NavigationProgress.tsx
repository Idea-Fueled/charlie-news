'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function NavigationProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  // Navigation finished: when pathname or searchParams change, complete and fade out
  useEffect(() => {
    if (loading) {
      setProgress(100)
      const timer = setTimeout(() => {
        setLoading(false)
        setProgress(0)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [pathname, searchParams])

  // Listen to clicks on links for 0ms instant feedback
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      // Ignore external links, mailto, tel, anchor hashes, modifier keys
      if (
        (href.startsWith('http://') || href.startsWith('https://')) &&
        !href.startsWith(window.location.origin)
      ) {
        return
      }
      if (
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:') ||
        anchor.target === '_blank' ||
        anchor.getAttribute('download') !== null ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey ||
        e.defaultPrevented ||
        e.button !== 0 // Only primary left-click
      ) {
        return
      }

      // Check if clicking current exact URL
      try {
        const targetUrl = new URL(href, window.location.origin)
        const currentUrl = new URL(window.location.href)
        if (
          targetUrl.pathname === currentUrl.pathname &&
          targetUrl.search === currentUrl.search &&
          targetUrl.hash === currentUrl.hash
        ) {
          return
        }
      } catch {
        return
      }

      // Start loading bar immediately
      setLoading(true)
      setProgress(25)
    }

    document.addEventListener('click', handleDocumentClick, true)
    return () => {
      document.removeEventListener('click', handleDocumentClick, true)
    }
  }, [])

  // Incremental trickle while page is rendering
  useEffect(() => {
    if (!loading) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) return prev
        // Slow down as it approaches 85%
        const step = Math.max(1, (90 - prev) / 6)
        return Math.min(prev + step, 85)
      })
    }, 150)

    // Safety timeout in case navigation is aborted or fails
    const safetyTimeout = setTimeout(() => {
      setLoading(false)
      setProgress(0)
    }, 10000)

    return () => {
      clearInterval(interval)
      clearTimeout(safetyTimeout)
    }
  }, [loading])

  if (!loading && progress === 0) return null

  return (
    <>
      {/* Top Progress Line */}
      <div
        role="progressbar"
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '3.5px',
          zIndex: 9999999,
          pointerEvents: 'none',
          background: 'transparent',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 70%, #7dd3fc 100%)',
            boxShadow: '0 0 12px rgba(56, 189, 248, 0.9), 0 0 6px rgba(2, 132, 199, 0.8)',
            transition:
              progress === 100
                ? 'width 150ms ease-out, opacity 250ms ease-out'
                : 'width 250ms cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: progress === 100 ? 0 : 1,
            borderRadius: '0 2px 2px 0',
          }}
        />
      </div>

      {/* Subtle Top-Right Spinner */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '12px',
          right: '16px',
          zIndex: 9999999,
          pointerEvents: 'none',
          opacity: progress === 100 ? 0 : 1,
          transition: 'opacity 200ms ease',
        }}
      >
        <div className="nav-progress-spinner" />
      </div>
    </>
  )
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressBar />
    </Suspense>
  )
}
