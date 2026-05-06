const STATS = [
  { big: '24', accent: '/7', desc: 'Nonstop rounds, no pauses, no weekends' },
  { big: '60', accent: 's',  desc: 'Duration per round. Fast and relentless.' },
  { big: '10k', accent: 'x', desc: 'Maximum leverage available on any position' },
  { big: '0.5', accent: '%', desc: 'Spread fee per trade. Flat, no hidden costs.' },
]

export default function Stats() {
  return (
    <div style={{ background: 'var(--card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '60px 48px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', maxWidth: 1100, margin: '0 auto' }}>
        {STATS.map((s, i) => (
          <div key={i} style={{ padding: 32, borderRight: i < STATS.length - 1 ? '1px solid var(--border)' : 'none', textAlign: 'center' }}>
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1, fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
              {s.big}<span style={{ color: 'var(--green)' }}>{s.accent}</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
