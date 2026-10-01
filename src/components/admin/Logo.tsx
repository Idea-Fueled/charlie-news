import React from 'react'

export const AdminLogo: React.FC = () => {
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
      <span
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontSize: '1.45rem',
          fontWeight: 700,
          letterSpacing: '-0.035em',
          color: '#ffffff',
          lineHeight: 1,
        }}
      >
        Charlie News
      </span>
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
