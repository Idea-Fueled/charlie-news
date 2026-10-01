import React from 'react'
import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy & Terms of Use — Charlie News',
  description: 'Privacy policy and terms of use for Charlie News Australian property publication.',
}

export default function PrivacyTermsPage() {
  return (
    <div className="site-container" style={{ maxWidth: '820px', padding: '48px 20px 80px' }}>
      <nav className="article-breadcrumb" style={{ marginBottom: '24px' }}>
        <Link href="/">Home</Link>
        <span>/</span>
        <span>Privacy & Terms</span>
      </nav>

      <h1 className="article-headline" style={{ marginBottom: '28px' }}>
        Privacy Policy & Terms of Use
      </h1>

      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', marginBottom: '16px', color: 'var(--color-text-main)' }}>
          1. Privacy Policy
        </h2>
        <div style={{ color: '#334155', lineHeight: '1.75', fontSize: '1.05rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p>
            At <strong>Charlie News</strong>, we respect the privacy of our readers and subscribers. This Privacy Policy outlines how we collect, store, and manage your personal information when you browse our website or subscribe to our newsletter.
          </p>
          <p>
            <strong>Information We Collect:</strong> When you subscribe to our newsletter, we collect your email address. We do not sell, rent, or trade subscriber contact information to third-party marketing companies.
          </p>
          <p>
            <strong>Newsletter Services:</strong> Our email newsletters are dispatched using Klaviyo. Your email address is stored securely on Klaviyo’s servers for the sole purpose of sending property news digests. You may unsubscribe at any time via the unsubscribe link included at the footer of every email.
          </p>
          <p>
            <strong>Analytics & Cookies:</strong> We utilize privacy-friendly, aggregated analytics to observe general website traffic patterns and improve reader experience.
          </p>
        </div>
      </section>

      <section style={{ borderTop: '1px solid var(--color-border)', paddingTop: '40px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', marginBottom: '16px', color: 'var(--color-text-main)' }}>
          2. Terms of Use
        </h2>
        <div style={{ color: '#334155', lineHeight: '1.75', fontSize: '1.05rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p>
            Welcome to Charlie News. By accessing or using this website, you agree to comply with and be bound by the following terms and conditions.
          </p>
          <p>
            <strong>Informational Purposes Only:</strong> All content, market data, and commentary published on Charlie News is provided solely for general informational and educational purposes. It does not constitute financial, legal, investment, or real estate advisory services.
          </p>
          <p>
            <strong>Accuracy of Information:</strong> While our editorial team makes every effort to verify facts and source information from reputable Australian property institutions, readers should conduct their own independent due diligence before making property or investment decisions.
          </p>
          <p>
            <strong>Photo Credits & Copyright:</strong> Editorial photography displayed across Charlie News is attributed in accordance with licensing guidelines provided by Pexels, Unsplash, and respective rights holders.
          </p>
        </div>
      </section>

      <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
        <Link href="/" className="page-btn">
          ← Return to Home
        </Link>
      </div>
    </div>
  )
}
