'use client'
import { useEffect, useRef } from 'react'

const TRADERS = [
  { rank: 1, addr: '0x22A8...73C9', side: 'long', lev: '10,000x', pnlId: 'pnl1', init: 482000, color: '#f59e0b', letter: 'D' },
  { rank: 2, addr: '0xf4a1...2B88', side: 'long', lev: '1,000x',  pnlId: 'pnl2', init: 84200,  color: '#94a3b8', letter: 'K' },
  { rank: 3, addr: '0x9c3d...A041', side: 'short', lev: '100x',   pnlId: 'pnl3', init: 12480,  color: '#b45309', letter: 'R' },
  { rank: 4, addr: '0x77bb...C302', side: 'long', lev: '100x',    pnlId: null,   init: 3840,   color: '#4a5568', letter: 'M' },
  { rank: 5, addr: '0x1de8...8F12', side: 'short', lev: '1,000x', pnlId: null,   init: -28000, color: '#ff4444', letter: 'X' },
  { rank: 6, addr: '0x5520...991A', side: 'long', lev: '10,000x', pnlId: null,   init: -100000, color: '#ff4444', letter: 'Z' },
]

const rankColors: Record<number, string> = { 1: '#f59e0b', 2: '#94a3b8', 3: '#b45309' }

export default function Hero() {
  const timerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let seconds = 38

    const timerInt = setInterval(() => {
      seconds = seconds <= 0 ? 60 : seconds - 1
      if (timerRef.current) timerRef.current.textContent = '00:' + String(seconds).padStart(2, '0')
    }, 1000)

    let pnl1 = 482000, pnl2 = 84200, pnl3 = 12480
    const pnlInt = setInterval(() => {
      pnl1 += Math.floor((Math.random() - 0.3) * 8000)
      pnl2 += Math.floor((Math.random() - 0.35) * 2000)
      pnl3 += Math.floor((Math.random() - 0.4) * 500)

      const fmt = (n: number) => (n >= 0 ? '+' : '') + n.toLocaleString()
      const setEl = (id: string, val: number) => {
        const el = document.getElementById(id)
        if (!el) return
        el.textContent = fmt(val)
        el.style.color = val >= 0 ? 'var(--green)' : 'var(--red)'
      }
      setEl('pnl1', pnl1)
      setEl('pnl2', pnl2)
      setEl('pnl3', pnl3)
    }, 1400)

    return () => { clearInterval(timerInt); clearInterval(pnlInt) }
  }, [])

  return (
    <section style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: '120px 24px 80px', position: 'relative', overflow: 'hidden',
    }}>
      {/* BG glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(0,230,118,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'var(--green-dim)', border: '1px solid rgba(0,230,118,0.2)',
        borderRadius: 100, padding: '6px 14px', fontSize: 11,
        fontFamily: 'var(--font-mono)', color: 'var(--green)',
        letterSpacing: 1, textTransform: 'uppercase', marginBottom: 32,
        animation: 'fadeUp 0.6s ease both',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s infinite', display: 'inline-block' }} />
        Arc Testnet &mdash; Live Now
      </div>

      <h1 style={{
        fontSize: 'clamp(42px, 7vw, 88px)', fontWeight: 800, lineHeight: 1.0,
        letterSpacing: -2, maxWidth: 900, marginBottom: 24,
        animation: 'fadeUp 0.6s 0.1s ease both',
      }}>
        Predict Nothing.<br /><em style={{ fontStyle: 'normal', color: 'var(--green)' }}>Win Everything.</em>
      </h1>

      <p style={{
        fontSize: 'clamp(15px, 2vw, 18px)', color: 'var(--text2)', maxWidth: 480,
        lineHeight: 1.6, fontWeight: 400, marginBottom: 40,
        animation: 'fadeUp 0.6s 0.2s ease both',
      }}>
        A new kind of market where randomness is the only truth. Up to 10,000x leverage.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 64, animation: 'fadeUp 0.6s 0.3s ease both' }}>
        <a href="/trade" style={{
          background: 'var(--green)', color: '#000', padding: '14px 32px', borderRadius: 8,
          fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'inline-flex',
          alignItems: 'center', gap: 8, boxShadow: '0 0 30px var(--green-glow)', transition: 'transform 0.2s, box-shadow 0.2s',
        }}>
          Start Trading &rarr;
        </a>
        <a href="#how" style={{
          color: 'var(--text2)', padding: '14px 24px', fontSize: 15, fontWeight: 500,
          textDecoration: 'none', border: '1px solid var(--border2)', borderRadius: 8,
        }}>
          How it works
        </a>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
        color: 'var(--text3)', fontFamily: 'var(--font-mono)',
        animation: 'fadeUp 0.6s 0.4s ease both', marginBottom: 80,
      }}>
        <span style={{ color: 'var(--green)', letterSpacing: 2 }}>★★★★★</span>
        <span>4.9 &nbsp;&bull;&nbsp; Arc Testnet &nbsp;&bull;&nbsp; 24/7 Nonstop</span>
      </div>

      {/* LEADERBOARD CARD */}
      <div style={{ width: '100%', maxWidth: 720, margin: '0 auto', position: 'relative', animation: 'fadeUp 0.8s 0.5s ease both' }}>
        <div style={{
          position: 'absolute', inset: -1, borderRadius: 18,
          background: 'linear-gradient(135deg, rgba(0,230,118,0.25), transparent 50%, rgba(0,230,118,0.08))',
          zIndex: -1,
        }} />
        <div style={{ background: 'var(--card)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>

          {/* Header */}
          <div style={{
            padding: '16px 24px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', borderBottom: '1px solid var(--border)', background: 'var(--card2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />
                Live
              </div>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Round Leaderboard</span>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>#1042</span>
            </div>
            <span ref={timerRef} style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text2)', fontWeight: 500 }}>00:38</span>
          </div>

          {/* Table head */}
          <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 80px 90px 80px', padding: '10px 24px', borderBottom: '1px solid var(--border)', gap: 12 }}>
            {['#', 'Trader', 'Side', 'Leverage', 'PnL'].map((h, i) => (
              <div key={h} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', textAlign: i >= 3 ? 'right' : 'left' }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {TRADERS.map((t) => (
            <div key={t.rank} style={{
              display: 'grid', gridTemplateColumns: '36px 1fr 80px 90px 80px',
              padding: '14px 24px', borderBottom: '1px solid var(--border)', gap: 12,
              alignItems: 'center', background: t.rank === 1 ? 'rgba(0,230,118,0.04)' : 'transparent',
            }}>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: rankColors[t.rank] || 'var(--text3)', fontWeight: 500 }}>{t.rank}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
                  background: `${t.color}18`, color: t.color,
                }}>{t.letter}</div>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text2)' }}>{t.addr}</span>
              </div>
              <div>
                <span style={{
                  fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 7px', borderRadius: 4,
                  textTransform: 'uppercase', fontWeight: 500,
                  background: t.side === 'long' ? 'var(--green-dim)' : 'var(--red-dim)',
                  color: t.side === 'long' ? 'var(--green)' : 'var(--red)',
                }}>{t.side}</span>
              </div>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text2)', textAlign: 'right' }}>{t.lev}</div>
              <div id={t.pnlId || undefined} style={{
                fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, textAlign: 'right',
                color: t.init >= 0 ? 'var(--green)' : 'var(--red)',
              }}>
                {(t.init >= 0 ? '+' : '') + t.init.toLocaleString()}
              </div>
            </div>
          ))}

          {/* Footer */}
          <div style={{
            padding: '12px 24px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', background: 'var(--card2)', borderTop: '1px solid var(--border)',
          }}>
            {[['Active traders', '87'], ['Volume', '1,248,400 USCC'], ['Rounds', '1,042']].map(([k, v], i) => (
              <span key={k} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>
                {k}: <span style={{ color: i === 2 ? 'var(--green)' : 'var(--text2)', fontWeight: 500 }}>{v}</span>
              </span>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
