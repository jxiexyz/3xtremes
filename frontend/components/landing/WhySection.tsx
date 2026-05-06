'use client'
const CARDS = [
  { icon: '△', title: 'VRF Powered', desc: 'Price movement comes from verifiable on-chain randomness. No manipulation, no MEV, no insiders.' },
  { icon: '▶', title: 'Instant Settlement', desc: 'Every round settles in 60 seconds. No waiting days for expiry. PnL hits your wallet immediately.' },
  { icon: '◆', title: 'Credit System', desc: 'USDC converts to USCC at 1:1000. Bigger numbers, same value. More fun, guaranteed.' },
  { icon: '■', title: 'Insurance Fund', desc: 'Platform maintains an insurance fund to cover edge cases. Your wins are always paid out.' },
]

export default function WhySection() {
  return (
    <section style={{ padding: '100px 48px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Why 3xtremes</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, marginBottom: 16 }}>Built different.</h2>
          <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.6, maxWidth: 500, margin: '0 auto' }}>
            No orderbooks. No counterparties. No alpha. Just pure on-chain randomness and your conviction.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          {CARDS.map((c, i) => (
            <div key={c.title} style={{
              padding: '32px 28px',
              borderRight: i < CARDS.length - 1 ? '1px solid var(--border)' : 'none',
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--card2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                width: 36, height: 36, border: '1px solid var(--border2)', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16, fontSize: 16,
              }}>{c.icon}</div>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{c.title}</h4>
              <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
