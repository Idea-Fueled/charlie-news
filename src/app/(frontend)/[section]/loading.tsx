import React from 'react'

export default function SectionLoading() {
  return (
    <div
      className="site-container section-page-container"
      aria-busy="true"
      aria-label="Loading section stories..."
    >
      <div className="section-page-banner" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
        <div className="skeleton-line" style={{ width: '180px', height: '36px', marginBottom: '12px' }} />
        <div className="skeleton-line" style={{ width: '320px', height: '18px' }} />
      </div>
      <div className="news-grid" style={{ marginTop: '32px' }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="news-card" style={{ padding: '16px' }}>
            <div
              className="skeleton-line"
              style={{ width: '100%', height: '190px', marginBottom: '16px', borderRadius: '8px' }}
            />
            <div className="skeleton-line" style={{ width: '35%', height: '16px', marginBottom: '12px' }} />
            <div className="skeleton-line" style={{ width: '90%', height: '22px', marginBottom: '8px' }} />
            <div className="skeleton-line" style={{ width: '70%', height: '22px' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
