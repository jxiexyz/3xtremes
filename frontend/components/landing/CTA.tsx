export default function CTA() {
  return (
    <section style={{ textAlign: 'center', padding: '120px 48px', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 800, height: 400, background: 'radial-gradient(ellipse, rgba(0,230,118,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <h2 style={{ fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 800, letterSpacing: -2, lineHeight: 1.05, maxWidth: 700, margin: '0 auto 20px' }}>
        Ready to predict<br /><em style={{ fontStyle: 'normal', color: 'var(--green)' }}>nothing?</em>
      </h2>
      <p style={{ fontSize: 15, color: 'var(--text2)', maxWidth: 400, margin: '0 auto 40px', lineHeight: 1.6 }}>
        Deposit USDC, pick a direction, choose your leverage. The rest is up to the VRF.
      </p>
      <a href="/trade" style={{
        background: 'var(--green)', color: '#000', padding: '16px 40px', borderRadius: 8,
        fontSize: 16, fontWeight: 700, textDecoration: 'none', display: 'inline-flex',
        alignItems: 'center', gap: 8, boxShadow: '0 0 30px var(--green-glow)',
      }}>
        Launch App &rarr;
      </a>
      <p style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 20 }}>
        Arc Testnet &bull; No real money at risk &bull; 24/7 live
      </p>
    </section>
  )
}
