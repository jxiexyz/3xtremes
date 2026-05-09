'use client'

import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits } from 'viem'
import { CONTRACTS, CREDIT_VAULT_ABI } from '../../lib/contracts'
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

interface Props {
  onClose: () => void
}

export default function WithdrawModal({ onClose }: Props) {
  const { address } = useAccount()
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<'idle' | 'withdrawing' | 'done'>('idle')

  // Read USCC balance
  const { data: usccRaw, refetch: refetchUSCC } = useReadContract({
    address: CONTRACTS.CREDIT_VAULT as `0x${string}`,
    abi: CREDIT_VAULT_ABI,
    functionName: 'getUSCCBalance',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address, refetchInterval: 5000 },
  })

  // Read open position count - to show warning if > 0
  const { data: openPositions } = useReadContract({
    address: CONTRACTS.CREDIT_VAULT as `0x${string}`,
    abi: [
      { name: 'openPositionCount', type: 'function', stateMutability: 'view',
        inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'uint256' }] },
    ] as const,
    functionName: 'openPositionCount',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address },
  })

  const { writeContract, data: txHash, isPending: isWalletPending } = useWriteContract()
  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  const isTxPending = isWalletPending || isTxConfirming

  // USCC stored as: usdcAmount(6dec) × 1000 → raw / 1e6 = human-readable USCC
  // e.g. 1 USDC deposit: raw = 1_000_000 × 1000 = 1_000_000_000 → 1000 USCC displayed
  const usccBalanceRaw = usccRaw ?? 0n
  const usccBalanceDisplay = (Number(usccBalanceRaw) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })

  const hasOpenPositions = openPositions != null && openPositions > 0n

  // User enters USCC in human-readable form (e.g. "1000")
  // Convert to raw for contract: raw = humanUscc × 1e6
  const humanUscc = parseFloat(amount) || 0
  // Contract requires usccAmount % 1000 == 0 (1000 USCC raw = 1 USDC)
  // Floor to nearest multiple of 1000 to avoid InvalidWithdrawAmount revert
  const usccToWithdraw = BigInt(Math.floor(humanUscc * 1e6 / 1000) * 1000)
  // usdcToReceive: humanUscc / 1000 (1000 USCC = 1 USDC)
  const usdcToReceive = humanUscc / 1000

  const insufficient = usccToWithdraw > usccBalanceRaw
  const isZero = usccToWithdraw === 0n

  const canWithdraw = !isZero && !insufficient && !hasOpenPositions && !isTxPending

  // Step transition on tx success
  if (isTxSuccess && step === 'withdrawing') {
    refetchUSCC()
    setStep('done')
  }

  function handleWithdraw() {
    if (!canWithdraw) return
    setStep('withdrawing')
    writeContract({
      address: CONTRACTS.CREDIT_VAULT as `0x${string}`,
      abi: CREDIT_VAULT_ABI,
      functionName: 'withdraw',
      args: [usccToWithdraw],
    })
  }

  function setMax() {
    // Max withdrawable in human-readable USCC (floor to whole number)
    const max = Math.floor(Number(usccBalanceRaw) / 1e6)
    setAmount(String(max))
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0f1117',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: 28,
          width: 380,
          display: 'flex', flexDirection: 'column', gap: 16,
          animation: 'slideUp 0.2s ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#fff', fontFamily: "Inter, -apple-system, sans-serif" }}>
            Withdraw USDC
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
          >✕</button>
        </div>

        {step === 'done' ? (
          /* ── Success state ── */
          <div style={{ textAlign: 'center', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <CheckCircle2 size={56} color="#3b82f6" />
            </div>
            <div style={{ color: '#3b82f6', fontWeight: 600, fontFamily: "Inter, -apple-system, sans-serif" }}>Withdrawal successful!</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
              +{usdcToReceive.toFixed(2)} USDC sent to your wallet
            </div>
            <button
              onClick={onClose}
              style={{
                marginTop: 8, padding: '12px 0', borderRadius: 12,
                background: '#2563eb', color: '#fff', fontWeight: 600,
                border: 'none', cursor: 'pointer', fontSize: 14,
                fontFamily: "'Inter Tight', sans-serif",
                boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
              }}
            >Done</button>
          </div>
        ) : (
          <>
            {/* Rate info */}
            <div style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: 8,
              padding: '10px 14px', fontSize: 12, color: 'rgba(255,255,255,0.4)',
              display: 'flex', justifyContent: 'space-between',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              <span>Rate</span>
              <span>1,000 USCC = 1 USDC</span>
            </div>

            {/* Open positions warning */}
            {hasOpenPositions && (
              <div style={{
                background: 'rgba(240,62,62,0.08)',
                border: '1px solid rgba(240,62,62,0.2)',
                borderRadius: 8, padding: '10px 14px',
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <AlertTriangle size={18} color="#f03e3e" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 12, color: 'rgba(240,62,62,0.9)', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.5 }}>
                  You have <strong>{Number(openPositions)} open position{Number(openPositions) > 1 ? 's' : ''}</strong>.
                  Close all positions before withdrawing.
                </div>
              </div>
            )}

            {/* Input - amount in USCC */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono', monospace" }}>Amount (USCC)</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono', monospace" }}>
                  Balance: {usccBalanceDisplay} USCC
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  style={{
                    flex: 1,
                    background: insufficient ? 'rgba(240,62,62,0.06)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${insufficient ? 'rgba(240,62,62,0.35)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 8, padding: '10px 14px',
                    color: '#fff', fontSize: 15, outline: 'none',
                    fontFamily: "'JetBrains Mono', monospace",
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                />
                <button
                  onClick={setMax}
                  style={{
                    padding: '0 14px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                    color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >MAX</button>
              </div>

              {/* Decimal notice */}
              {amount && humanUscc > 0 && humanUscc !== Math.floor(humanUscc) && (
                <div style={{ marginTop: 5, fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
                  Rounded to {Math.floor(humanUscc).toLocaleString()} USCC
                </div>
              )}

              {/* Insufficient error */}
              {insufficient && (
                <div style={{ marginTop: 5, fontSize: 11, color: '#f03e3e', fontFamily: 'DM Mono, monospace' }}>
                  Insufficient USCC balance
                </div>
              )}
            </div>

            {/* You receive */}
            {!isZero && !insufficient && (
              <div style={{
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 12, padding: '12px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter Tight', sans-serif" }}>You receive</span>
                <span style={{ color: '#3b82f6', fontWeight: 700, fontSize: 18, fontFamily: "'JetBrains Mono', monospace" }}>
                  {usdcToReceive.toFixed(2)} USDC
                </span>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleWithdraw}
              disabled={!canWithdraw}
              style={{
                padding: '12px 0', borderRadius: 12, border: 'none',
                background: !canWithdraw
                  ? 'rgba(37,99,235,0.4)'
                  : isTxPending ? 'rgba(37,99,235,0.6)' : '#2563eb',
                color: '#fff', fontWeight: 600, fontSize: 14,
                cursor: canWithdraw ? 'pointer' : 'not-allowed',
                fontFamily: "'Inter Tight', sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.2s, opacity 0.15s, box-shadow 0.2s',
                boxShadow: canWithdraw ? '0 4px 16px rgba(37,99,235,0.3)' : 'none',
                opacity: !canWithdraw && !isZero ? 0.6 : 1,
              }}
            >
              {isTxPending && step === 'withdrawing' ? (
                <><Loader2 size={16} className="animate-spin" /> Withdrawing...</>
              ) : hasOpenPositions ? (
                'Close positions to withdraw'
              ) : (
                `Withdraw${!isZero ? ` ${usdcToReceive.toFixed(humanUscc >= 1000 ? 2 : 4)} USDC` : ''}`
              )}
            </button>

            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'DM Mono, monospace', textAlign: 'center', lineHeight: 1.5 }}>
              Withdrawals require no open positions · 1,000 USCC = 1 USDC
            </div>
          </>
        )}
      </div>
    </div>
  )
}
