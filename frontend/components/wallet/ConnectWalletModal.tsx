'use client'

import { useConnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { Wallet } from 'lucide-react'

interface Props {
  onClose: () => void
}

export default function ConnectWalletModal({ onClose }: Props) {
  const { connect, isPending } = useConnect()

  function handleConnect() {
    connect(
      { connector: injected() },
      { onSuccess: () => onClose() }
    )
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0f1115',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: 28,
          width: 360,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          animation: 'slideUp 0.2s ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#e8edf5', fontFamily: "Inter, -apple-system, sans-serif" }}>
            Connect Wallet
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(232,237,245,0.3)', fontSize: 20,
              cursor: 'pointer', lineHeight: 1,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(232,237,245,0.7)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(232,237,245,0.3)')}
          >✕</button>
        </div>

        {/* Icon */}
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <Wallet size={30} color="#3b82f6" strokeWidth={1.5} />
          </div>
          <div style={{ color: '#e8edf5', fontWeight: 700, fontSize: 15, fontFamily: "Inter, -apple-system, sans-serif", marginBottom: 6 }}>
            Wallet not connected
          </div>
          <div style={{ color: 'rgba(232,237,245,0.45)', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6 }}>
            Connect your wallet to deposit USDC<br />and start trading on 3xtremes.
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

        {/* Connect button */}
        <button
          onClick={handleConnect}
          disabled={isPending}
          style={{
            padding: '13px 0',
            borderRadius: 12, border: 'none',
            background: isPending ? 'rgba(37,99,235,0.6)' : '#2563eb',
            color: '#fff', fontWeight: 600,
            fontSize: 14, cursor: isPending ? 'not-allowed' : 'pointer',
            fontFamily: "'Inter Tight', sans-serif",
            transition: 'opacity 0.15s, transform 0.1s, box-shadow 0.2s',
            boxShadow: isPending ? 'none' : '0 4px 16px rgba(37,99,235,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          onMouseEnter={e => { if (!isPending) e.currentTarget.style.opacity = '0.9' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          {isPending ? (
            <>
              <span style={{
                width: 13, height: 13, border: '2px solid rgba(0,0,0,0.3)',
                borderTopColor: '#000', borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.7s linear infinite',
              }} />
              Connecting...
            </>
          ) : (
            'Connect Wallet'
          )}
        </button>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

        <div style={{ textAlign: 'center', fontSize: 10, color: 'rgba(232,237,245,0.25)', fontFamily: "'JetBrains Mono', monospace" }}>
          Make sure your wallet is installed and unlocked
        </div>
      </div>
    </div>
  )
}
