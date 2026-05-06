'use client'

import { useState, useRef, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { LogOut, Copy, Check } from 'lucide-react'

export default function ConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function copyAddress() {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isConnected && address) {
    return (
      <div style={{ position: 'relative', zIndex: 9999 }} ref={menuRef}>
        <div
          style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'6px 12px', cursor:'pointer', transition: 'background 0.2s' }}
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
        >
          <span style={{ fontSize:12, fontWeight: 600, color:'rgba(255,255,255,0.8)', fontFamily:'JetBrains Mono,monospace' }}>
            {address.slice(0,6)}…{address.slice(-4)}
          </span>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#10b981', display:'inline-block', boxShadow:'0 0 8px rgba(16,185,129,0.6)' }} />
        </div>
        
        {showMenu && (
          <div style={{ 
            position: 'absolute', top: '100%', right: 0, marginTop: 8, 
            background: 'rgba(10,14,23,0.95)', border: '1px solid rgba(255,255,255,0.08)', 
            borderRadius: 12, padding: 6, minWidth: 160,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 100, backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.15s ease'
          }}>
            <button 
              onClick={() => { copyAddress(); setShowMenu(false) }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 12, cursor: 'pointer', borderRadius: 8, transition: 'all 0.2s', textAlign: 'left', fontFamily: 'Inter, sans-serif' }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff' }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy Address'}
            </button>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
            <button 
              onClick={() => { disconnect(); setShowMenu(false) }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'transparent', border: 'none', color: '#f43f5e', fontSize: 12, cursor: 'pointer', borderRadius: 8, transition: 'all 0.2s', textAlign: 'left', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)' }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <LogOut size={14} /> Disconnect Wallet
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      style={{ padding:'6px 16px', background:'#2563eb', color:'#fff', border:'none', borderRadius:10, fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:'Inter Tight,Inter,sans-serif', boxShadow:'0 0 16px rgba(37,99,235,0.4)', transition:'all 0.2s' }}
      onMouseOver={e => (e.currentTarget.style.background = '#3b82f6')}
      onMouseOut={e => (e.currentTarget.style.background = '#2563eb')}
    >
      Connect Wallet
    </button>
  )
}
