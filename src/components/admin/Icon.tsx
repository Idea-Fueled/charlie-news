import React from 'react'

export const AdminIcon: React.FC = () => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '30px',
        height: '30px',
        borderRadius: '7px',
        backgroundColor: '#ffffff',
        padding: '3px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Charlie-News-Logo.png"
        alt="Charlie News Icon"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  )
}

export default AdminIcon
