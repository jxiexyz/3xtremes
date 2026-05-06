'use client'

import { useEffect } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { arcTestnet } from '@/lib/wagmi'

export default function ChainWatcher() {
  const { isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()

  useEffect(() => {
    if (isConnected && chainId !== arcTestnet.id) {
      console.log(`Wrong network detected (${chainId}). Switching to Arc Testnet (${arcTestnet.id})...`)
      switchChain({ chainId: arcTestnet.id }, {
        onError: (error) => {
          console.error('Failed to switch network:', error)
        }
      })
    }
  }, [isConnected, chainId, switchChain])

  return null
}
