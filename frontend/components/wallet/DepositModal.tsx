'use client'

import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { CONTRACTS, ERC20_ABI, CREDIT_VAULT_ABI } from '../../lib/contracts'
import { X, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'

interface Props {
  onClose: () => void
}

export default function DepositModal({ onClose }: Props) {
  const { address } = useAccount()
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<'idle' | 'approving' | 'depositing' | 'done'>('idle')

  const usdcAmount = amount ? parseUnits(amount, 6) : 0n

  const { data: usdcBalance } = useReadContract({
    address: CONTRACTS.USDC as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address, refetchInterval: 5000 },
  })

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.USDC as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address ?? '0x0000000000000000000000000000000000000000', CONTRACTS.CREDIT_VAULT as `0x${string}`],
    query: { enabled: !!address },
  })

  const { writeContract, data: txHash, isPending: isWalletPending } = useWriteContract()

  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const isTxPending = isWalletPending || isTxConfirming

  const needsApproval = !allowance || allowance < usdcAmount

  const usccToGet = amount ? Number(amount) * 1000 : 0
  const usdcBalanceFormatted = usdcBalance ? formatUnits(usdcBalance, 6) : '0'

  async function handleApprove() {
    if (!usdcAmount) return
    setStep('approving')
    writeContract({
      address: CONTRACTS.USDC as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.CREDIT_VAULT as `0x${string}`, usdcAmount],
    })
  }

  async function handleDeposit() {
    if (!usdcAmount) return
    setStep('depositing')
    writeContract({
      address: CONTRACTS.CREDIT_VAULT as `0x${string}`,
      abi: CREDIT_VAULT_ABI,
      functionName: 'deposit',
      args: [usdcAmount],
    })
  }

  if (isTxSuccess && step === 'approving') {
    refetchAllowance()
    setStep('idle')
  }
  if (isTxSuccess && step === 'depositing') {
    setStep('done')
  }

  const btnStyle = {
    width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
    background: '#2563eb', color: '#fff', fontWeight: '600', fontSize: '14px',
    cursor: 'pointer', fontFamily: "'Inter Tight', sans-serif",
    boxShadow: '0 4px 16px rgba(37,99,235,0.3)', transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', justifyCenter: 'center', gap: '8px'
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        background: 'rgba(4,11,30,0.95)', border: '1px solid rgba(30,58,138,0.5)',
        borderRadius: 24, padding: 32, width: 400, display: 'flex', flexDirection: 'column', gap: 20,
        boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: "'Space Grotesk', sans-serif" }}>Deposit USDC</span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.4)', padding: 6, borderRadius: 8, cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {step === 'done' ? (
          <div style={{ textAlign: 'center', padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <CheckCircle2 size={56} color="#3b82f6" />
            </div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 20, fontFamily: "'Inter Tight', sans-serif" }}>Deposit Successful</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
              <span style={{ color: '#3b82f6', fontWeight: 600 }}>{usccToGet.toLocaleString()} USCC</span> has been added to your balance.
            </div>
            <button onClick={onClose} style={{ ...btnStyle, marginTop: 10, justifyContent: 'center' }}>
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Rate info */}
            <div style={{
              background: 'rgba(59,130,246,0.06)', borderRadius: 12,
              padding: '12px 16px', fontSize: 13, color: 'rgba(255,255,255,0.5)',
              display: 'flex', justifyContent: 'space-between', border: '1px solid rgba(59,130,246,0.1)'
            }}>
              <span>Rate</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>1 USDC = 1,000 USCC</span>
            </div>

            {/* Input */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                  Wallet: <span style={{ color: 'rgba(255,255,255,0.7)' }}>{Number(usdcBalanceFormatted).toFixed(2)} USDC</span>
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    style={{
                      width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(30,58,138,0.4)',
                      borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 16, fontWeight: 500, outline: 'none',
                      fontFamily: "'JetBrains Mono', monospace"
                    }}
                  />
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 700, color: 'rgba(59,130,246,0.6)' }}>USDC</span>
                </div>
                <button
                  onClick={() => setAmount(usdcBalanceFormatted)}
                  style={{
                    padding: '0 14px', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                    color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >MAX</button>
              </div>
            </div>

            {/* You get */}
            {amount && Number(amount) > 0 && (
              <div style={{
                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 12, padding: '12px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>You receive</span>
                <span style={{ color: '#3b82f6', fontWeight: 700, fontSize: 18, fontFamily: "'JetBrains Mono', monospace" }}>
                  {usccToGet.toLocaleString()} USCC
                </span>
              </div>
            )}

            {/* Steps indicator */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', padding: '4px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: needsApproval ? 'rgba(255,255,255,0.5)' : '#3b82f6' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>
                  {needsApproval ? '1' : <CheckCircle2 size={12} />}
                </div>
                Approve
              </div>
              <ArrowRight size={14} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: !needsApproval ? '#fff' : 'rgba(255,255,255,0.2)' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>2</div>
                Deposit
              </div>
            </div>

            {/* CTA */}
            {needsApproval ? (
              <button
                onClick={handleApprove}
                disabled={!amount || Number(amount) <= 0 || isTxPending}
                style={{
                  ...btnStyle,
                  justifyContent: 'center',
                  background: isTxPending ? 'rgba(37,99,235,0.4)' : '#2563eb',
                  opacity: !amount || Number(amount) <= 0 ? 0.4 : 1
                }}
              >
                {isTxPending && step === 'approving' ? <><Loader2 size={16} className="animate-spin" /> Approving USDC...</> : 'Approve USDC'}
              </button>
            ) : (
              <button
                onClick={handleDeposit}
                disabled={!amount || Number(amount) <= 0 || isTxPending}
                style={{
                  ...btnStyle,
                  justifyContent: 'center',
                  background: isTxPending ? 'rgba(37,99,235,0.4)' : '#2563eb',
                  opacity: !amount || Number(amount) <= 0 ? 0.4 : 1
                }}
              >
                {isTxPending && step === 'depositing' ? <><Loader2 size={16} className="animate-spin" /> Depositing...</> : `Deposit ${amount || '0'} USDC`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
