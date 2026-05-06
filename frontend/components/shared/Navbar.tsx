'use client'
import Link from 'next/link'

export default function Navbar() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '20px 48px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', background: 'rgba(9,11,15,0.8)',
      backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 8 }}>
        3<span style={{ color: 'var(--green)' }}>x</span>tremes
      </div>

      <ul style={{ display: 'flex', alignItems: 'center', gap: 32, listStyle: 'none' }}>
        {[['#how', 'How it works'], ['#leverage', 'Leverage'], ['#faq', 'FAQ']].map(([href, label]) => (
          <li key={href}>
            <a href={href} style={{ color: 'var(--text2)', textDecoration: 'none', fontSize: 13, fontWeight: 500, letterSpacing: '0.3px', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text2)')}>
              {label}
            </a>
          </li>
        ))}
      </ul>

      <Link href="/trade" style={{
        background: 'var(--green)', color: '#000', padding: '9px 20px',
        borderRadius: 6, fontSize: 13, fontWeight: 700, letterSpacing: '0.3px',
        textDecoration: 'none', transition: 'opacity 0.2s, transform 0.2s',
      }}>
        Launch App &rarr;
      </Link>
    </nav>
  )
}
