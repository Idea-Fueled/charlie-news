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

    // Bot trap check (SOW 4.1.3)
    if (honeypot) {
      return
    }

    if (!email || !email.includes('@') || !email.includes('.')) {
      setStatus('error')
      setMessage('Please enter a valid email address.')
      return
    }

    setStatus('loading')
    // Simulating subscription handling
    setTimeout(() => {
      setStatus('success')
      setMessage('Thanks for signing up.')
      setEmail('')
    }, 600)
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

          <form onSubmit={handleSubscribe} className="newsletter-form">
            {/* Hidden honeypot field to block simple bots (SOW 4.1.3) */}
            <input
              type="text"
              name="trap_field"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
            />

            <div className="newsletter-input-group">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (status !== 'idle') setStatus('idle')
                }}
                className="newsletter-input"
                required
                disabled={status === 'loading'}
              />
              <button
                type="submit"
                className="newsletter-btn"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>

            {status === 'success' && (
              <p style={{ color: '#4ade80', fontSize: '0.85rem', fontWeight: 600 }}>{message}</p>
            )}
            {status === 'error' && (
              <p style={{ color: '#f87171', fontSize: '0.85rem', fontWeight: 600 }}>{message}</p>
            )}
            {status === 'idle' && (
              <span className="newsletter-disclaimer">
                We will email you the latest property news. Unsubscribe anytime.
              </span>
            )}
          </form>
        </div>

        {/* Footer Navigation & Columns */}
        <div className="footer-columns">
          <div>
            <h4 className="footer-about-title">Charlie News</h4>
            <p className="footer-about-text">
              Charlie News is an independent Australian property news publication covering residential design, renovations, housing market shifts, and government property policies across Australia.
            </p>
          </div>

          <div>
            <h5 className="footer-nav-title">Sections</h5>
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
          </div>

          <div>
            <h5 className="footer-nav-title">Publishing & Contact</h5>
            <ul className="footer-nav-links">
              <li>
                <Link href="/privacy-terms">Privacy & Terms</Link>
              </li>
              <li>
                <a href="mailto:contact@charlienews.com.au">contact@charlienews.com.au</a>
              </li>
              <li>
                <Link href="/admin">Editor Login</Link>
              </li>
            </ul>
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
