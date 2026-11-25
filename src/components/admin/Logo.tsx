import React from 'react'
import logoImg from '@/assets/Charlie-News-Logo.png'

export const AdminLogo: React.FC = () => {
  const imgSrc = typeof logoImg === 'string' ? logoImg : (logoImg as { src: string }).src

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        textDecoration: 'none',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          padding: '8px 16px',
          borderRadius: '8px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt="Property News Australia"
          style={{
            height: '40px',
            width: 'auto',
            maxHeight: '44px',
            maxWidth: '190px',
            display: 'block',
            objectFit: 'contain',
          }}
        />
      </div>
      <span
        style={{
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          backgroundColor: '#0f766e',
          color: '#ffffff',
          padding: '2.5px 8.5px',
          borderRadius: '4px',
          lineHeight: 1.2,
          display: 'inline-block',
        }}
      >
        Admin
      </span>
    </div>
  )
}

export default AdminLogo
