const STEPS = [
  { num: '01', title: 'Deposit USDC', desc: 'Convert your USDC into USCC credits. 1 USDC = 1,000 USCC. Bigger numbers, bigger thrills.' },
  { num: '02', title: 'Pick your direction', desc: 'Long or Short. The chart goes wherever the VRF takes it. Nobody knows. Not even us.' },
  { num: '03', title: 'Choose leverage', desc: '10x, 100x, 1,000x or 10,000x. Higher leverage means faster wins and faster liquidations.' },
  { num: '04', title: 'Settle at round end', desc: 'After 60 seconds, all positions settle. PnL is instant. New round starts immediately.' },
]

export default function HowItWorks() {
  return (
    <section id="how" style={{ padding: '100px 48px' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', maxWidth: 1100, margin: '0 auto',
        border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden',
      }}>
        {/* Left */}
        <div style={{ padding: 60, borderRight: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>How it works</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, marginBottom: 16 }}>
            Four steps.<br />Infinite chaos.
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.6, maxWidth: 400 }}>
            Each round lasts 60 seconds. The price moves on pure randomness. You pick a direction and a leverage.
          </p>

          <div style={{ marginTop: 48 }}>
            {STEPS.map((s, i) => (
              <div key={s.num} style={{
                display: 'flex', gap: 20, padding: '24px 0',
                borderBottom: i < STEPS.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: 36, height: 36, border: '1px solid var(--border2)', borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text3)', flexShrink: 0,
                }}>{s.num}</div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{s.title}</h4>
                  <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div style={{ background: 'var(--card2)', padding: 60, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
          {/* Round card */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>Current Round</span>
              <span style={{ fontSize: 11, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>LIVE</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>#1042</div>
            <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
              <div style={{ height: '100%', width: '63%', background: 'var(--green)', borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 6 }}>00:38 remaining</div>
          </div>

          {/* Price card */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>Current Price</span>
              <span style={{ fontSize: 11, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>+4.82%</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>1.00482</div>
          </div>

          {/* OI card */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>Open Interest</span>
              <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>Long vs Short</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <div style={{ flex: 1, background: 'var(--green-dim)', borderRadius: 4, padding: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>62%</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>LONG</div>
              </div>
              <div style={{ flex: 1, background: 'var(--red-dim)', borderRadius: 4, padding: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>38%</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>SHORT</div>
              </div>
            </div>
          </div>

          {/* Last winner */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>Last Round Winner</div>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text2)', marginTop: 4 }}>0x22A8...73C9</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--green)', marginTop: 4 }}>+284,000 USCC</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>10,000x leverage &bull; Long</div>
          </div>
        </div>
      </div>
    </section>
  )
}
