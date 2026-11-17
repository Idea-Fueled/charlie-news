import React from 'react'
import logoImg from '@/assets/Charlie-News-Logo.png'

export const AdminLogo: React.FC = () => {
  const imgSrc = typeof logoImg === 'string' ? logoImg : (logoImg as { src: string }).src

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '9px',
        textDecoration: 'none',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '4px 8px',
          borderRadius: '6px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt="Charlie News"
          style={{
            height: '24px',
            width: 'auto',
            maxHeight: '26px',
            maxWidth: '120px',
            display: 'block',
            objectFit: 'contain',
          }}
        />
      </div>
      <span
        style={{
          fontSize: '0.62rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          backgroundColor: '#0f766e',
          color: '#ffffff',
          padding: '2.5px 6.5px',
          borderRadius: '4px',
          lineHeight: 1,
          display: 'inline-block',
        }}
      >
        Admin
      </span>
    </div>
  )
}

export default AdminLogo
