'use client'

import { useEffect, useState } from 'react'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { arcTestnet } from '../../lib/wagmi'
import { CONTRACTS } from '../../lib/contracts'
import styles from '../../app/trade/trade.module.css'

const client = createPublicClient({ chain: arcTestnet, transport: http() })

interface Trade {
  user: string
  isLong: boolean
  leverage: number
  margin: bigint
  time: string
}

export default function RecentTrades() {
  const [trades, setTrades] = useState<Trade[]>([])

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const block = await client.getBlockNumber()
        const logs = await client.getLogs({
          address: CONTRACTS.POSITION_MANAGER as `0x${string}`,
          event: parseAbiItem('event PositionOpened(uint256 indexed positionId, address indexed trader, bool isLong, uint256 margin, uint256 leverage)'),
          fromBlock: block - 500n,
          toBlock: block,
        })
        const parsed = logs.reverse().slice(0, 5).map(log => ({
          user: `${log.args.trader?.slice(0,6)}…${log.args.trader?.slice(-4)}`,
          isLong: log.args.isLong ?? true,
          leverage: Number(log.args.leverage ?? 0),
          margin: log.args.margin ?? 0n,
          time: new Date().toLocaleTimeString('en-GB'),
        }))
        setTrades(parsed)
      } catch (e) {
        console.error(e)
      }
    }
    fetchTrades()
    const id = setInterval(fetchTrades, 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <div className={styles.tradesHdr}>
        <span>User</span><span>Position</span><span>Leverage</span><span>Amount</span><span>Time</span>
      </div>
      {trades.length === 0 && (
        <div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)',marginTop:8}}>No recent trades</div>
      )}
      {trades.map((t, i) => (
        <div key={i} className={styles.tradesRow}>
          <span>{t.user}</span>
          <span className={t.isLong ? styles.long : styles.short}>{t.isLong ? 'LONG' : 'SHORT'}</span>
          <span>{t.leverage}x</span>
          <span>{Number(t.margin).toLocaleString()} USCC</span>
          <span style={{color:'var(--text3)'}}>{t.time}</span>
        </div>
      ))}
    </>
  )
}
