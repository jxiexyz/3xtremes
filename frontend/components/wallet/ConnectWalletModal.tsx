'use client'

import { useState, useEffect } from 'react'
import { useConnect, useConnectors, useAccount, useSignMessage } from 'wagmi'
import { Wallet, ChevronRight, Loader2, ShieldCheck, Fingerprint } from 'lucide-react'

interface Props {
  onClose: () => void
}

function WalletIcon({ name, size = 32 }: { name: string; size?: number }) {
  const n = name.toLowerCase()
  if (n.includes('metamask')) {
    return (
      <svg width={size} height={size} viewBox="0 0 35 33" fill="none">
        <path d="M32.96 1L19.39 10.72l2.52-5.92L32.96 1z" fill="#E17726" stroke="#E17726" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2.04 1l13.46 9.8-2.4-5.98L2.04 1z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M28.23 23.53l-3.61 5.53 7.73 2.13 2.22-7.54-6.34-.12zM1.44 23.65l2.2 7.54 7.72-2.13-3.6-5.53-6.32.12z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M11.01 14.46l-2.15 3.25 7.66.35-.26-8.23-5.25 4.63zM23.99 14.46l-5.29-4.71-.17 8.31 7.65-.35-2.19-3.25z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M11.36 29.06l4.62-2.24-3.98-3.1-.64 5.34zM19.01 26.82l4.63 2.24-.65-5.34-3.98 3.1z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M23.64 29.06l-4.63-2.24.37 3.03-.04 1.27 4.3-2.06zM11.36 29.06l4.31 2.06-.03-1.27.36-3.03-4.64 2.24z" fill="#D5BFB2" stroke="#D5BFB2" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15.74 21.97l-3.84-1.12 2.71-1.24 1.13 2.36zM19.26 21.97l1.13-2.36 2.72 1.24-3.85 1.12z" fill="#233447" stroke="#233447" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M11.36 29.06l.67-5.53-4.27.12 3.6 5.41zM23.97 23.53l.66 5.53 3.6-5.41-4.26-.12zM26.18 17.71l-7.65.35.71 3.91 1.13-2.36 2.72 1.24 3.09-3.14zM11.9 20.85l2.71-1.24 1.12 2.36.72-3.91-7.65-.35 3.1 3.14z" fill="#CC6228" stroke="#CC6228" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8.86 17.71l3.21 6.27-.1-3.13-3.11-3.14zM23.05 20.85l-.11 3.13 3.22-6.27-3.11 3.14zM16.46 18.06l-.72 3.91.9 4.64.21-6.12-.39-2.43zM18.53 18.06l-.38 2.42.2 6.13.91-4.64-.73-3.91z" fill="#E27525" stroke="#E27525" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19.26 21.97l-.91 4.64.65.45 3.98-3.1.11-3.13-3.83 1.14zM11.9 20.85l.1 3.13 3.98 3.1.66-.45-.91-4.64-3.83-1.14z" fill="#F5841F" stroke="#F5841F" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19.3 31.12l.04-1.27-.34-.3h-3.99l-.33.3.03 1.27-4.31-2.06 1.51 1.23 3.06 2.13h5.24l3.07-2.13 1.49-1.23-4.47 2.06z" fill="#C0AC9D" stroke="#C0AC9D" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19.01 26.82l-.65-.45h-3.72l-.66.45-.36 3.03.33-.3h3.99l.34.3-.27-3.03z" fill="#161616" stroke="#161616" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M33.52 11.32L34.8 5.2l-1.84-5.2-13.95 10.35 5.37 4.54 7.59 2.22 1.68-1.95-.73-.53 1.16-1.06-.89-.69 1.16-.9-.83-.61zM.2 5.2l1.28 6.12-.82.61 1.17.9-.89.69 1.16 1.06-.73.53 1.67 1.95 7.6-2.22 5.37-4.54L1.06 0 .2 5.2z" fill="#763E1A" stroke="#763E1A" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  }
  if (n.includes('coinbase')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#0052FF"/>
        <path d="M16 6C10.48 6 6 10.48 6 16s4.48 10 10 10 10-4.48 10-10S21.52 6 16 6zm0 17.5c-4.14 0-7.5-3.36-7.5-7.5S11.86 8.5 16 8.5s7.5 3.36 7.5 7.5-3.36 7.5-7.5 7.5zm-2.5-9.5v4h5v-4h-5z" fill="white"/>
      </svg>
    )
  }
  if (n.includes('phantom')) {
    return (
      <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
        <rect width="128" height="128" rx="24" fill="#AB9FF2"/>
        <path d="M110.2 64c0 25.5-20.7 46.2-46.2 46.2S17.8 89.5 17.8 64 38.5 17.8 64 17.8 110.2 38.5 110.2 64z" fill="white"/>
        <path d="M85 54.5c-3.2-5.5-8.3-8.5-14.8-8.5-5.5 0-10.2 2-14 5.8L64 64l-7.8-12.2C52.4 48 47.7 46 42.2 46c-6.5 0-11.6 3-14.8 8.5-3.2 5.5-3.2 12.5 0 18 3.2 5.5 8.3 8.5 14.8 8.5 5.5 0 10.2-2 14-5.8l7.8-12.2 7.8 12.2c3.8 3.8 8.5 5.8 14 5.8 6.5 0 11.6-3 14.8-8.5 3.2-5.5 3.2-12.5 0-18z" fill="#AB9FF2"/>
      </svg>
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 8, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Wallet size={size * 0.55} color="#3b82f6" strokeWidth={1.5} />
    </div>
  )
}

function getWalletDisplayName(id: string, name: string): string {
  if (id === 'metaMaskSDK' || name.toLowerCase().includes('metamask')) return 'MetaMask'
  if (name.toLowerCase().includes('coinbase')) return 'Coinbase Wallet'
  if (id === 'phantom' || name.toLowerCase().includes('phantom')) return 'Phantom'
  if (name.toLowerCase().includes('rabby')) return 'Rabby Wallet'
  if (id === 'injected' && !name) return 'Browser Wallet'
  return name || 'Browser Wallet'
}

function getWalletSubtitle(id: string, name: string): string {
  if (id === 'metaMaskSDK' || name.toLowerCase().includes('metamask')) return 'Popular · EVM compatible'
  if (name.toLowerCase().includes('coinbase')) return 'Coinbase · EVM compatible'
  if (id === 'phantom' || name.toLowerCase().includes('phantom')) return 'Multi-chain'
  if (name.toLowerCase().includes('rabby')) return 'Security-focused · EVM'
  if (id === 'injected') return 'Detected in browser'
  return 'Browser wallet · EVM compatible'
}

type Step = 'select' | 'signing' | 'done'

export default function ConnectWalletModal({ onClose }: Props) {
  const { connect, isPending } = useConnect()
  const connectors = useConnectors()
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState<Step>('select')

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  const seen = new Set<string>()
  const uniqueConnectors = [...connectors]
    .sort((a, b) => (b.icon ? 1 : 0) - (a.icon ? 1 : 0))
    .filter(c => {
      const key = c.id === 'injected' ? 'injected' : (c.id || c.name)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

  function handleConnect(connector: typeof connectors[0]) {
    setConnectingId(connector.uid)
    setError(null)
    connect(
      { connector },
      {
        onSuccess: () => {
          setStep('signing')
          setConnectingId(null)
        },
        onError: (err) => {
          setError(err.message?.includes('rejected') ? 'Connection rejected by user.' : 'Could not connect. Make sure the wallet is installed and unlocked.')
          setConnectingId(null)
        },
      }
    )
  }

  async function handleSign() {
    setError(null)
    try {
      const nonce = Math.random().toString(36).substring(2, 10)
      const timestamp = new Date().toISOString()
      const message = `Welcome to 3xtremes\n\nSign this message to verify wallet ownership.\n\nThis does not trigger a transaction or cost any gas.\n\nNonce: ${nonce}\nTimestamp: ${timestamp}`
      await signMessageAsync({ message })
      setStep('done')
      setTimeout(() => onClose(), 800)
    } catch (err: any) {
      setError(err.message?.includes('rejected') || err.message?.includes('denied')
        ? 'Signature rejected. Please sign to continue.'
        : 'Signature failed. Please try again.')
    }
  }

  // Auto-trigger sign when step changes to signing and address is available
  useEffect(() => {
    if (step === 'signing' && address) {
      handleSign()
    }
  }, [step, address])

  const modalBase = {
    position: 'fixed' as const, inset: 0,
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(24px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 99998, animation: 'iosFadeIn 0.3s ease-out forwards'
  }

  const cardBase = {
    background: 'rgba(3, 7, 18, 0.4)', backdropFilter: 'blur(32px) saturate(150%)',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: 28, borderRadius: 24, display: 'flex', flexDirection: 'column' as const, gap: 20,
    width: 360, boxShadow: '0 24px 48px -12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
    boxSizing: 'border-box' as const,
    animation: 'iosPop 0.4s cubic-bezier(0.32, 0.72, 0, 1) forwards'
  }

  // Step 2: Signing / Step 3: Done
  if (step === 'signing' || step === 'done') {
    return (
      <div onClick={onClose} style={modalBase}>
        <div onClick={e => e.stopPropagation()} style={cardBase}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '12px 0' }}>
            {step === 'done' ? (
              <>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, margin: '0 auto' }}>
                  {/* Ripple Ring */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '50%',
                    border: '2px solid rgba(16,185,129,0.6)',
                    animation: 'successRipple 1.2s ease-out forwards'
                  }} />
                  {/* Main Circle */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '50%',
                    background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'successPop 0.5s cubic-bezier(0.17, 0.89, 0.32, 1.28) forwards',
                    zIndex: 1
                  }}>
                    <ShieldCheck size={26} color="#10b981" />
                  </div>
                </div>
                <div style={{ textAlign: 'center', animation: 'iosFadeIn 0.4s ease-out forwards' }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', fontFamily: 'var(--font-sans), Inter, sans-serif', letterSpacing: '-0.02em' }}>
                    Verified
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-sans), Inter, sans-serif', marginTop: 4 }}>
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute', left: 0, right: 0, height: '50%',
                    background: 'linear-gradient(to bottom, transparent, rgba(59,130,246,0.5), rgba(59,130,246,0.8), transparent)',
                    animation: 'scanline 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite'
                  }} />
                  <Fingerprint size={26} color="#3b82f6" style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.6))', position: 'relative', zIndex: 1 }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', fontFamily: 'var(--font-sans), Inter, sans-serif', letterSpacing: '-0.02em' }}>
                    Verify Ownership
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans), Inter, sans-serif', marginTop: 4, lineHeight: 1.5 }}>
                    Sign the message in your wallet to confirm you own this address. No gas fees.
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(59,130,246,0.7)', fontSize: 12, fontFamily: 'var(--font-sans), Inter, sans-serif' }}>
                  <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />
                  Waiting for signature...
                </div>
              </>
            )}
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: 'rgba(239,68,68,0.8)', fontFamily: 'var(--font-sans), Inter, sans-serif', lineHeight: 1.4 }}>
              {error}
            </div>
          )}

          {error && (
            <button
              onClick={handleSign}
              style={{ padding: '12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6', borderRadius: 12, fontFamily: 'var(--font-sans), Inter, sans-serif', fontWeight: 600, cursor: 'pointer', fontSize: 13, transition: 'all 0.15s' }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.15)' }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)' }}
            >Try Again</button>
          )}

          <style>{`
            @keyframes spin { to { transform: rotate(360deg) } }
            @keyframes scanline { 
              0% { transform: translateY(-150%) } 
              100% { transform: translateY(250%) } 
            }
            @keyframes successPop {
              0% { transform: scale(0.8); opacity: 0; }
              50% { transform: scale(1.1); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes successRipple {
              0% { transform: scale(0.8); opacity: 1; border-width: 2px; }
              100% { transform: scale(2.2); opacity: 0; border-width: 1px; }
            }
          `}</style>
        </div>
      </div>
    )
  }

  // Step 1: Select Wallet
  return (
    <div onClick={onClose} style={modalBase}>
      <div onClick={e => e.stopPropagation()} style={cardBase}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(59,130,246,0.25)" strokeWidth="1.5" />
                <path d="M12 8v4M12 16h.01" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.4))' }}/>
              </svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#fff', fontFamily: 'var(--font-sans), Inter, sans-serif', letterSpacing: '-0.02em' }}>
              Connect Wallet
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
          >✕</button>
        </div>

        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans), Inter, sans-serif', marginTop: -10 }}>
          Choose a wallet to connect to 3xtremes
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!mounted ? (
            [0, 1].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, animation: 'pulse 1.5s ease-in-out infinite' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ width: '50%', height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
                  <div style={{ width: '30%', height: 10, borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} />
                </div>
              </div>
            ))
          ) : uniqueConnectors.length === 0 ? (
            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '20px', textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: 'var(--font-sans), Inter, sans-serif' }}>No wallets detected</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 6, fontFamily: 'var(--font-sans), Inter, sans-serif', lineHeight: 1.5 }}>Install a wallet extension like MetaMask to get started.</div>
            </div>
          ) : (
            uniqueConnectors.map((connector, i) => {
              const isConnecting = connectingId === connector.uid && isPending
              const displayName = getWalletDisplayName(connector.id, connector.name)
              const subtitle = getWalletSubtitle(connector.id, connector.name)
              return (
                <button
                  key={connector.uid}
                  onClick={() => !isPending && handleConnect(connector)}
                  disabled={isPending}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    background: isConnecting ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)',
                    border: isConnecting ? '1px solid rgba(59,130,246,0.25)' : '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 14, cursor: isPending ? 'not-allowed' : 'pointer',
                    textAlign: 'left', width: '100%', transition: 'all 0.15s',
                    animation: `iosPop ${0.3 + i * 0.05}s cubic-bezier(0.32, 0.72, 0, 1) both`,
                  }}
                  onMouseOver={e => { if (!isPending) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; } }}
                  onMouseOut={e => { if (!isPending) { e.currentTarget.style.background = isConnecting ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = isConnecting ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.05)'; } }}
                >
                  <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 10, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)' }}>
                    {connector.icon ? (
                      <img src={connector.icon} alt={displayName} width={40} height={40} style={{ borderRadius: 10, objectFit: 'contain' }} />
                    ) : (
                      <WalletIcon name={connector.name} size={32} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-sans), Inter, sans-serif', marginBottom: 2 }}>{displayName}</div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'var(--font-sans), Inter, sans-serif' }}>{subtitle}</div>
                  </div>
                  {isConnecting ? (
                    <Loader2 size={16} color="rgba(59,130,246,0.8)" style={{ animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                  ) : (
                    <ChevronRight size={16} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />
                  )}
                </button>
              )
            })
          )}
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: 'rgba(239,68,68,0.8)', fontFamily: 'var(--font-sans), Inter, sans-serif', lineHeight: 1.4 }}>
            {error}
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-sans), Inter, sans-serif', lineHeight: 1.5, marginTop: -4 }}>
          Make sure your wallet is installed and unlocked
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}
