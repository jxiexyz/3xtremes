export default function Quote() {
  return (
    <div style={{
      textAlign: 'center', padding: '80px 48px',
      borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
    }}>
      <p style={{
        fontSize: 'clamp(20px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: -1,
        lineHeight: 1.3, maxWidth: 800, margin: '0 auto', color: 'var(--text2)',
      }}>
        <em style={{ fontStyle: 'normal', color: 'var(--text)' }}>Simplicity, randomness, and pure risk.</em>{' '}
        No charts to analyze, no news to follow. Just you, the VRF, and your leverage.
      </p>
    </div>
  )
}
