'use client'

import React, { useState } from 'react'
import Link from 'next/link'

interface SectionItem {
  id?: number | string
  name: string
  slug: string
}

export function Footer({ sections = [] }: { sections?: SectionItem[] }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [honeypot, setHoneypot] = useState('')

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent duplicate submissions while in-flight
    if (status === 'loading') {
      return
    }

    // Bot trap check (SOW Requirement: hidden spam-trap blocks simple bots)
    if (honeypot) {
      // Silently return success to fool bots without making external calls
      setStatus('success')
      setMessage('Thanks for signing up.')
      setEmail('')
      return
    }

    // Client-side quick check (SOW Requirement 4)
    const trimmed = email.trim()
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

    if (!trimmed || !emailRegex.test(trimmed)) {
      setStatus('error')
      setMessage('Please enter a valid email address.')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: trimmed,
          b_trap: honeypot,
        }),
      })

      const data = await res.json().catch(() => null)

      if (res.ok && data?.success) {
        setStatus('success')
        setMessage(data.message || 'Thanks for signing up.')
        setEmail('')
      } else if (res.status === 400) {
        setStatus('error')
        setMessage(data?.message || 'Please enter a valid email address.')
      } else {
        setStatus('error')
        setMessage(data?.message || 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  const currentYear = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="site-container">
        {/* Newsletter Signup Box (Klaviyo integrated design - SOW 4.1.3) */}
        <div className="newsletter-box">
          <div>
            <h3 className="newsletter-title">Stay Ahead in Australian Property</h3>
            <p className="newsletter-desc">
              Get the latest property insights, renovation guides, and policy updates delivered straight to your inbox.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="newsletter-form" noValidate>
            {/* Hidden honeypot field to block simple bots (SOW 4.1.3) */}
            <input
              type="text"
              name="b_trap"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{ display: 'none', position: 'absolute', left: '-9999px' }}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            <div className="newsletter-input-group">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address for property news updates
              </label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (status !== 'idle' && status !== 'loading') setStatus('idle')
                }}
                className="newsletter-input"
                required
                autoComplete="email"
                aria-required="true"
                aria-describedby={status !== 'idle' ? 'newsletter-status-message' : 'newsletter-disclaimer'}
                disabled={status === 'loading'}
              />
              <button
                type="submit"
                className="newsletter-btn"
                disabled={status === 'loading'}
                aria-label={status === 'loading' ? 'Subscribing to newsletter...' : 'Subscribe to newsletter'}
              >
                {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>

            {/* SOW Requirement: Text below the field */}
            <span id="newsletter-disclaimer" className="newsletter-disclaimer">
              We'll email you the latest property news. Unsubscribe anytime.
            </span>

            {/* User Feedback Messages (Success, Invalid Email, Error) */}
            {status === 'success' && (
              <p
                id="newsletter-status-message"
                role="status"
                aria-live="polite"
                style={{ color: '#4ade80', fontSize: '0.88rem', fontWeight: 600, marginTop: '2px' }}
              >
                {message}
              </p>
            )}
            {status === 'error' && (
              <p
                id="newsletter-status-message"
                role="alert"
                aria-live="assertive"
                style={{ color: '#f87171', fontSize: '0.88rem', fontWeight: 600, marginTop: '2px' }}
              >
                {message}
              </p>
            )}
          </form>
        </div>

        {/* Footer Navigation & Columns */}
        <div className="footer-columns">
          <div>
            <h4 className="footer-about-title">Charlie News</h4>
            <p className="footer-about-text">
              Charlie News is your source for Australian property news, from interior and exterior design to the latest market and policy updates.
              <br />
              Stories are drafted with the help of AI and checked by our team before they go live.
              <br />
              General information only, not financial, legal or property advice.
            </p>
          </div>

          <div>
            <h5 className="footer-nav-title">Sections</h5>
            <nav aria-label="Footer sections navigation">
              <ul className="footer-nav-links">
                <li>
                  <Link href="/">Home</Link>
                </li>
                {sections.map((sec) => (
                  <li key={sec.slug}>
                    <Link href={`/${sec.slug}`}>{sec.name}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div>
            <h5 className="footer-nav-title">Publishing & Contact</h5>
            <nav aria-label="Publishing and contact navigation">
              <ul className="footer-nav-links">
                <li>
                  <Link href="/privacy-terms">Privacy & Terms</Link>
                </li>
                <li>
                  <a href="mailto:info@corbygroup.com">info@corbygroup.com</a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="footer-bottom-bar">
          <p>© {currentYear} Charlie News. All rights reserved.</p>
          <p>Reporting on Australian Property & Housing Policy</p>
        </div>
      </div>
    </footer>
  )
}
