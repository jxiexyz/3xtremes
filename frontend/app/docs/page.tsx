import Link from 'next/link'

export default function DocsPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#080b10',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      color: '#fff',
      textAlign: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'rgba(0,232,122,0.1)',
        border: '1px solid rgba(0,232,122,0.25)',
        borderRadius: '12px',
        padding: '8px 20px',
        fontSize: '13px',
        color: '#00e87a',
        fontWeight: 600,
        marginBottom: '32px',
        letterSpacing: '0.04em',
      }}>
        COMING SOON
      </div>

      <h1 style={{ fontSize: '48px', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 16px' }}>
        Documentation
      </h1>
      <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.45)', maxWidth: '480px', lineHeight: 1.6, margin: '0 0 48px' }}>
        Full docs for 3xtremes — leverage mechanics, smart contract references, and API guides — are on the way.
      </p>

      <Link href="/" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.7)',
        padding: '12px 24px',
        borderRadius: '40px',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: 500,
        transition: 'all 0.2s',
      }}>
        ← Back to Home
      </Link>
    </div>
  )
}
