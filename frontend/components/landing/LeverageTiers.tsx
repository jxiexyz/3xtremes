const TIERS = [
  { tier: 'Normal', x: '10x', desc: 'For the cautious. Price needs to move 8% against you to get liquidated.', tag: 'Entry level', color: '#7a8599', accent: '#7a8599' },
  { tier: 'Wild',   x: '100x', desc: 'Getting interesting. Liquidation at 0.8% price movement against you.', tag: 'Recommended', color: '#f59e0b', accent: '#f59e0b' },
  { tier: 'Insane', x: '1,000x', desc: 'One tick is enough. 0.08% move kills your position. Godspeed.', tag: 'High risk', color: '#ef4444', accent: '#ef4444' },
  { tier: 'Extreme', x: '10,000x', desc: "0.008% move. You will almost certainly get liquidated. But if you don't...", tag: 'Degen only', color: '#00e676', accent: '#00e676', isExtreme: true },
]

export default function LeverageTiers() {
  return (
    <section id="leverage" style={{ padding: '80px 48px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Leverage Tiers</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, letterSpacing: -1, lineHeight: 1.1 }}>Pick your poison.</h2>
          </div>
          <p style={{ maxWidth: 300, textAlign: 'right', fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            Liquidation at 80% margin loss. The higher the leverage, the smaller the move you need. Both ways.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {TIERS.map((t) => (
            <div key={t.tier} style={{
              background: 'var(--card)',
              border: `1px solid ${t.isExtreme ? 'rgba(0,230,118,0.15)' : 'var(--border)'}`,
              borderRadius: 12, padding: '28px 24px', position: 'relative', overflow: 'hidden',
              transition: 'transform 0.2s',
            }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: t.accent }} />
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, color: t.color }}>{t.tier}</div>
              <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1, marginBottom: 8, lineHeight: 1, color: t.isExtreme ? 'var(--green)' : 'var(--text)' }}>{t.x}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{t.desc}</div>
              <span style={{
                display: 'inline-block', marginTop: 12, fontSize: 10, fontFamily: 'var(--font-mono)',
                padding: '3px 8px', borderRadius: 4,
                background: t.isExtreme ? 'var(--green-dim)' : 'var(--border)',
                color: t.isExtreme ? 'var(--green)' : 'var(--text3)',
              }}>{t.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
