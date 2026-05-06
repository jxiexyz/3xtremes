'use client'
export default function Footer() {
  return (
    <footer style={{
      padding: '32px 48px', borderTop: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.5px' }}>
        3<span style={{ color: 'var(--green)' }}>x</span>tremes
      </div>

      <ul style={{ display: 'flex', gap: 24, listStyle: 'none' }}>
        {['Docs', 'GitHub', 'Arc Testnet', 'Contract'].map(label => (
          <li key={label}>
            <a href="#" style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none', fontFamily: 'var(--font-mono)', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text2)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}>
              {label}
            </a>
          </li>
        ))}
      </ul>

      <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
        Built on Arc Testnet &bull; 2025
      </div>
    </footer>
  )
}
