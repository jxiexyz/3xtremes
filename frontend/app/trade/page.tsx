'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useReadContract, useReadContracts, useWriteContract, useAccount } from 'wagmi'
import { CONTRACTS, CREDIT_VAULT_ABI, POSITION_MANAGER_ABI } from '../../lib/contracts'
import ConnectButton from '../../components/wallet/ConnectButton'
import DepositModal from '../../components/wallet/DepositModal'
import ConnectWalletModal from '../../components/wallet/ConnectWalletModal'
import WithdrawModal from '../../components/wallet/WithdrawModal'
import Link from 'next/link'
import styles from './trade.module.css'
import { LayoutGrid, TrendingUp, Gem, ArrowUpRight, Wallet, Settings, HelpCircle, CheckCircle2, Loader2 } from 'lucide-react'

// --- UX State Components ---
function SkeletonLine({ width = '100%', height = '16px', className = '' }: { width?: string, height?: string, className?: string }) {
  return <div className={`animate-pulse bg-white/[0.05] rounded ${className}`} style={{ width, height }} />
}

function EmptyState({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[140px] text-center px-4 opacity-0 animate-[fadeIn_0.4s_ease-out_forwards]">
      <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mb-3">
        <Icon size={18} className="text-white/40" />
      </div>
      <div className="text-sm font-semibold text-white/80 mb-1">{title}</div>
      <div className="text-xs text-white/40 max-w-[200px] leading-relaxed">{desc}</div>
    </div>
  )
}


import { createChart, ColorType, CrosshairMode, IChartApi, CandlestickSeries, LineSeries } from 'lightweight-charts'

interface Candle {
  time: number; open: number; close: number; high: number; low: number; volume: number
}

const fmtPrice = (r: bigint) => (Number(r) / 1e5).toFixed(5)
const fmtUscc  = (r: bigint) => (Number(r) / 1e6).toFixed(3)
const fmtTime  = (ts: bigint) =>
  new Date(Number(ts) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

function genCandle(prev: number, time: number): Candle {
  const r = Math.random()
  const move = r < 0.45 ? -(Math.random() * 0.003) : r < 0.55 ? (Math.random() - 0.5) * 0.001 : Math.random() * 0.003
  const open = prev
  const close = Math.max(1.19, Math.min(1.28, open + move))
  const wick = Math.abs(move) * (Math.random() * 1.5 + 0.5)
  return { time, open, close, high: Math.max(open, close) + Math.random() * wick * 0.5, low: Math.min(open, close) - Math.random() * wick * 0.5, volume: Math.floor(Math.random() * 80000 + 20000) }
}

function seedCandles(n: number): Candle[] {
  const list: Candle[] = []; let p = 1.23456
  let t = Math.floor(Date.now() / 1000) - n * 60;
  for (let i = 0; i < n; i++) { const c = genCandle(p, t); list.push(c); p = c.close; t += 60; }
  return list
}

function TradingChart({ data, isCandle, positions }: { data: Candle[], isCandle: boolean, positions: any[] }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);
  const priceLinesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: 'rgba(255, 255, 255, 0.4)' },
      grid: { vertLines: { color: 'rgba(255, 255, 255, 0.04)' }, horzLines: { color: 'rgba(255, 255, 255, 0.04)' } },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { width: 1, color: 'rgba(255,255,255,0.3)', style: 3, labelBackgroundColor: '#1e293b' },
        horzLine: { width: 1, color: 'rgba(255,255,255,0.3)', style: 3, labelBackgroundColor: '#1e293b' },
      },
      timeScale: { 
        borderColor: 'rgba(255, 255, 255, 0.1)', 
        timeVisible: true,
        rightOffset: 12, // Provides space on the right like TradingView
        barSpacing: 10,
        minBarSpacing: 0.5,
      },
      rightPriceScale: { 
        borderColor: 'rgba(255, 255, 255, 0.1)', 
        autoScale: true,
      },
      localization: {
        priceFormatter: (price: number) => price.toFixed(6),
      },
      autoSize: true,
    });
    chartRef.current = chart;

    chart.subscribeCrosshairMove((param) => {
      const toolTip = tooltipRef.current;
      if (!toolTip) return;
      if (!param.time || param.point === undefined || !param.seriesData || param.point.x < 0 || param.point.y < 0) {
        toolTip.style.display = 'none';
        return;
      }
      toolTip.style.display = 'block';
      const data = param.seriesData.values().next().value as any;
      if (!data) return;
      
      const price = data.value !== undefined ? data.value : data.close;
      const dateStr = new Date((param.time as number) * 1000).toLocaleString();
      toolTip.innerHTML = `
        <div style="font-weight: 800; color: #fff; font-size: 18px; margin-bottom: 4px; letter-spacing: -0.02em; font-variant-numeric: tabular-nums;">$${price.toFixed(5)}</div>
        <div style="color: rgba(255,255,255,0.5); font-size: 11px; font-weight: 500;">${dateStr}</div>
      `;
      
      const y = param.point.y;
      const x = param.point.x;
      const toolTipWidth = 130;
      const finalX = Math.max(0, Math.min(chartContainerRef.current!.clientWidth - toolTipWidth, x - toolTipWidth / 2));
      toolTip.style.left = finalX + 'px';
      toolTip.style.top = (y - 50) + 'px';
    });

    return () => { 
      chart.remove(); 
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    if (seriesRef.current) {
      try { chartRef.current.removeSeries(seriesRef.current); } catch (e) {}
    }

    const validData = data
      .filter(d => d && typeof d.time === 'number' && !isNaN(d.time))
      .filter((v, i, a) => i === 0 || v.time > a[i - 1].time);

    let series;
    if (isCandle) {
      series = chartRef.current.addSeries(CandlestickSeries, {
        upColor: '#10b981', downColor: '#ef4444', borderVisible: false,
        wickUpColor: '#10b981', wickDownColor: '#ef4444',
        priceFormat: { type: 'price', precision: 6, minMove: 0.000001 },
      });
      if (validData.length > 0) series.setData(validData as any);
    } else {
      series = chartRef.current.addSeries(LineSeries, {
        color: '#10b981', lineWidth: 2, crosshairMarkerVisible: true, crosshairMarkerRadius: 4,
        priceFormat: { type: 'price', precision: 6, minMove: 0.000001 },
      });
      if (validData.length > 0) {
        series.setData(validData.map((d: any) => ({ time: d.time, value: d.close })) as any);
      }
    }
    seriesRef.current = series;
  }, [isCandle]);

  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      const seen = new Set<number>();
      const validData = data
        .filter(d => d && typeof d.time === 'number' && !isNaN(d.time))
        .sort((a, b) => a.time - b.time)
        .filter(d => {
          if (seen.has(d.time)) return false;
          seen.add(d.time);
          return true;
        });

      if (validData.length > 0) {
        if (isCandle) {
          seriesRef.current.setData(validData as any);
        } else {
          seriesRef.current.setData(validData.map((d: any) => ({ time: d.time, value: d.close })) as any);
        }
      }
    }
  }, [data, isCandle]);

  useEffect(() => {
    if (!seriesRef.current) return;
    
    // Clear old lines
    priceLinesRef.current.forEach(l => {
      try { seriesRef.current.removePriceLine(l); } catch (e) {}
    });
    priceLinesRef.current = [];

    // Add new lines for each active position
    positions.forEach(p => {
      const entry = Number(p.entryPrice) / 1e5;
      const liq = Number(p.liquidationPrice) / 1e5;

      // Entry Line
      const entryLine = seriesRef.current.createPriceLine({
        price: entry,
        color: p.isLong ? '#10b981' : '#ef4444',
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: `${p.isLong ? 'L' : 'S'} Entry`,
      });
      priceLinesRef.current.push(entryLine);

      // Liquidation Line (Orange/White)
      const liqLine = seriesRef.current.createPriceLine({
        price: liq,
        color: '#f97316', 
        lineWidth: 1,
        lineStyle: 3, // Dotted
        axisLabelVisible: true,
        title: `LIQ`,
      });
      priceLinesRef.current.push(liqLine);
    });
  }, [positions, isCandle]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={chartContainerRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />
      <div ref={tooltipRef} style={{
        position: 'absolute', display: 'none', padding: '8px 12px',
        background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px', pointerEvents: 'none', zIndex: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)', fontFamily: 'var(--mono)',
      }} />
    </div>
  );
}

function drawChart(canvas: HTMLCanvasElement, candles: Candle[]) {
  const wrapper = canvas.parentElement!
  const W = wrapper.clientWidth; const H = wrapper.clientHeight
  const dpr = window.devicePixelRatio || 1
  canvas.width = W * dpr; canvas.height = H * dpr
  canvas.style.width = `${W}px`; canvas.style.height = `${H}px`
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)

  const prices = candles.map(c => c.close)
  const maxP = Math.max(...prices); const minP = Math.min(...prices)
  const pRange = maxP - minP || 0.001
  const maxV = Math.max(...candles.map(c => c.volume))
  const chartW = W - 50; const chartH = H * 0.72
  const volumeH = H * 0.1; const gap = H * 0.04; const N = candles.length
  const px = (i: number) => (i / (N - 1)) * chartW
  const py = (p: number) => ((maxP - p) / pRange) * chartH

  // background
  ctx.fillStyle = '#030712'; ctx.fillRect(0, 0, W, H)

  // grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1
  for (let i = 0; i <= 5; i++) {
    const y = py(minP + (pRange / 5) * i)
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(chartW, y); ctx.stroke()
  }

  // y-axis labels
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = '10px JetBrains Mono, monospace'
  for (let i = 0; i <= 4; i++) {
    const v = minP + (pRange / 4) * i
    const y = py(v)
    ctx.fillText(v.toFixed(4), chartW + 4, y + 4)
  }

  // green gradient fill
  const lineColor = '#00e676'
  const grad = ctx.createLinearGradient(0, 0, 0, chartH)
  grad.addColorStop(0, 'rgba(0, 230, 118, 0.15)')
  grad.addColorStop(1, 'rgba(0, 230, 118, 0)')
  ctx.beginPath(); ctx.moveTo(px(0), py(prices[0]))
  for (let i = 1; i < N; i++) {
    const cx = (px(i - 1) + px(i)) / 2
    ctx.bezierCurveTo(cx, py(prices[i - 1]), cx, py(prices[i]), px(i), py(prices[i]))
  }
  ctx.lineTo(chartW, chartH); ctx.lineTo(0, chartH); ctx.closePath()
  ctx.fillStyle = grad; ctx.fill()

  // line
  ctx.beginPath(); ctx.moveTo(px(0), py(prices[0]))
  for (let i = 1; i < N; i++) {
    const cx = (px(i - 1) + px(i)) / 2
    ctx.bezierCurveTo(cx, py(prices[i - 1]), cx, py(prices[i]), px(i), py(prices[i]))
  }
  ctx.strokeStyle = lineColor; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.9; ctx.stroke(); ctx.globalAlpha = 1

  // tip glow
  const lx = px(N - 1); const ly = py(prices[N - 1])
  const radial = ctx.createRadialGradient(lx, ly, 0, lx, ly, 10)
  radial.addColorStop(0, 'rgba(0, 230, 118, 0.4)'); radial.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.beginPath(); ctx.arc(lx, ly, 10, 0, Math.PI * 2); ctx.fillStyle = radial; ctx.fill()
  ctx.beginPath(); ctx.arc(lx, ly, 3, 0, Math.PI * 2); ctx.fillStyle = lineColor; ctx.fill()

  // dashed horizontal
  ctx.save(); ctx.globalAlpha = 0.3; ctx.setLineDash([4, 5])
  ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(chartW, ly)
  ctx.strokeStyle = lineColor; ctx.lineWidth = 1; ctx.stroke(); ctx.restore()

  // volume bars
  const barWidth = Math.max(2, (chartW / N) * 0.5)
  candles.forEach((c, i) => {
    const x = (i / (N - 1)) * chartW
    const h = (c.volume / maxV) * volumeH
    ctx.globalAlpha = 0.12
    ctx.fillStyle = c.close >= c.open ? '#3b82f6' : '#ff3b30'
    ctx.fillRect(x - barWidth / 2, chartH + gap + volumeH - h, barWidth, h)
    ctx.globalAlpha = 1
  })
}

// --- 3X SVG Logo ---
function LogoIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <path d="M 15 20 H 45 L 30 50 H 45 L 15 80" fill="none" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 55 20 L 85 80 M 85 20 L 55 80" fill="none" stroke="#bfdbfe" strokeWidth="12" strokeLinecap="round" />
    </svg>
  )
}

export default function TradePage() {
  const { address } = useAccount()

  const { data: usccRaw } = useReadContract({
    address: CONTRACTS.CREDIT_VAULT as `0x${string}`,
    abi: CREDIT_VAULT_ABI,
    functionName: 'getUSCCBalance',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address, refetchInterval: 5_000 },
  })
  const balance = usccRaw ? Number(usccRaw) / 1e6 : 0

  const { data: positionIds } = useReadContract({
    address: CONTRACTS.POSITION_MANAGER as `0x${string}`,
    abi: POSITION_MANAGER_ABI,
    functionName: 'getUserPositions',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address, refetchInterval: 6_000 },
  })
  const ids = useMemo(() => (positionIds as bigint[] | undefined) ?? [], [positionIds])

  const { data: positionsRaw } = useReadContracts({
    contracts: ids.map(id => ({ address: CONTRACTS.POSITION_MANAGER as `0x${string}`, abi: POSITION_MANAGER_ABI, functionName: 'getPosition', args: [id] })),
    query: { enabled: ids.length > 0, refetchInterval: 6_000 },
  })

  const { data: pnlsRaw } = useReadContracts({
    contracts: ids.map(id => ({ address: CONTRACTS.POSITION_MANAGER as `0x${string}`, abi: POSITION_MANAGER_ABI, functionName: 'getUnrealizedPnL', args: [id] })),
    query: { enabled: ids.length > 0, refetchInterval: 3_000 },
  })

  const { writeContract } = useWriteContract()

  const allPositions = ((positionsRaw as any) ?? []).flatMap((r: any) => r.status === 'success' && r.result ? [r.result as any] : [])
  const openPositions = allPositions.filter((p: any) => p.isOpen)
  const closedPositions = allPositions.filter((p: any) => !p.isOpen).sort((a: any, b: any) => Number(b.closeTimestamp) - Number(a.closeTimestamp))

  const [candles, setCandles] = useState<Candle[]>([])
  const [isCandle, setIsCandle] = useState(true)
  const [countdown, setCountdown] = useState(60)
  const [roundStatus, setRoundStatus] = useState<string>("Active")
  const roundBaseTimeRef = useRef<number>(0)

  // UX States
  const [isLoading, setIsLoading] = useState(true)
  const [tradeSuccess, setTradeSuccess] = useState(false)
  const [isTxPending, setIsTxPending] = useState(false)

  useEffect(() => {
    // Mock loading state delay to show skeletons
    const timer = setTimeout(() => setIsLoading(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "wss://3xtremes-production.up.railway.app";
    let ws: any = null;
    let reconnectTimeout: any;

    function connect() {
      console.log("Connecting to WebSocket:", wsUrl);
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("Connected to 3xtremes Live price feed!");
      };

      ws.onmessage = (event: any) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "HISTORY") {
            const historyCandles = msg.history.map((c: any) => ({
              time: c.time,
              open: Number(c.open) / 1e5,
              high: Number(c.high) / 1e5,
              low: Number(c.low) / 1e5,
              close: Number(c.close) / 1e5,
              volume: Math.floor(Math.random() * 80000 + 20000)
            }));
            setCandles(historyCandles);
            setRoundStatus("Active");

          } else if (msg.type === "ROUND_SETTLING") {
            setRoundStatus("Settling Round...");
          } else if (msg.type === "ROUND_SETTLED") {
            setRoundStatus("Starting Next Round...");
          } else if (msg.type === "ROUND_START") {
            setCountdown(60);
            setRoundStatus("Active");

          } else if (msg.type === "CANDLE") {
            const open  = Number(msg.open)  / 1e5;
            const high  = Number(msg.high)  / 1e5;
            const low   = Number(msg.low)   / 1e5;
            const close = Number(msg.close) / 1e5;
            const time  = Number(msg.time);

            setCountdown(Math.max(0, 59 - msg.second));

            const newCandle: Candle = {
              time,
              open,
              high,
              low,
              close,
              volume: Math.floor(Math.random() * 80000 + 20000)
            };

            setCandles(prev => {
              const last = prev[prev.length - 1];
              if (last && last.time === time) {
                const updated = [...prev];
                updated[updated.length - 1] = newCandle;
                return updated;
              }
              return [...prev.slice(-149), newCandle];
            });
          }
        } catch (e) {
          console.error("Error parsing WS message:", e);
        }
      };

      ws.onerror = (err: any) => {
        console.error("WebSocket error:", err);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected. Retrying in 3s...");
        reconnectTimeout = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  const [side, setSide]           = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount]       = useState('100')
  const [leverage, setLeverage]   = useState(1000)
  const [showDeposit, setShowDeposit]   = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [showConnect, setShowConnect]   = useState(false)
  const [showWalletMenu, setShowWalletMenu] = useState(false)
  const [mktTab, setMktTab]   = useState(0)
  const [orderTab, setOrderTab] = useState(0)
  const [chartTf, setChartTf] = useState('1s Time frame')

  const last = candles[candles.length - 1]
  const prev = candles[candles.length - 2]
  const cur  = last?.close ?? 1.23456
  const first = candles[0]
  const pct  = first ? ((cur - first.close) / first.close) * 100 : 0
  const isUp = cur >= (prev?.close ?? cur)

  const notional = (parseFloat(amount) || 0) * leverage
  const estLiq = side === 'buy' ? Math.max(0, cur - (cur / leverage)) : cur + (cur / leverage)

  // Validation
  const marginNum = parseFloat(amount)
  const isInvalidMargin = isNaN(marginNum) || marginNum <= 0
  const isExceedsBalance = !!address && marginNum > balance
  const isOrderDisabled = isInvalidMargin || isExceedsBalance

  // Auto-Liquidation Trigger (Frontend Safety Net)
  // Sensitive to "wicks" (High/Low) to ensure flash-crashes are caught
  useEffect(() => {
    if (!address || openPositions.length === 0 || candles.length === 0) return;

    const lastCandle = candles[candles.length - 1];
    if (!lastCandle) return;

    openPositions.forEach(p => {
      const liqPrice = Number(p.liquidationPrice) / 1e5;
      // Check if the candle's range (Low for Long, High for Short) hit the Liq price
      const hitOnWick = p.isLong ? (lastCandle.low <= liqPrice) : (lastCandle.high >= liqPrice);
      
      if (hitOnWick) {
        console.log(`💀 Wick hit Liquidation! Triggering # ${p.positionId}...`);
        writeContract({
          address: CONTRACTS.POSITION_MANAGER as `0x${string}`,
          abi: POSITION_MANAGER_ABI,
          functionName: 'liquidatePosition',
          args: [p.positionId],
        });
      }
    });
  }, [candles, openPositions, address]);



  const MARKETS = [
    { n: '3X/USCC', s: 'ROUND', p: cur.toFixed(5), c: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`, up: pct >= 0, bg: '#2563eb', is3X: true },
    { n: 'BTC/USCC', s: 'PERP', p: '', c: '', up: true, bg: 'rgba(255,255,255,0.03)', ic: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=035', comingSoon: true },
    { n: 'ETH/USCC', s: 'PERP', p: '', c: '', up: true, bg: 'rgba(255,255,255,0.03)', ic: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=035', comingSoon: true },
    { n: 'SOL/USCC', s: 'PERP', p: '', c: '', up: true, bg: 'rgba(255,255,255,0.03)', ic: 'https://cryptologos.cc/logos/solana-sol-logo.svg?v=035', comingSoon: true },
    { n: 'BNB/USCC', s: 'PERP', p: '', c: '', up: true, bg: 'rgba(255,255,255,0.03)', ic: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=035', comingSoon: true },
    { n: 'TRX/USCC', s: 'PERP', p: '', c: '', up: true, bg: 'rgba(255,255,255,0.03)', ic: 'https://cryptologos.cc/logos/tron-trx-logo.svg?v=035', comingSoon: true },
    { n: 'DOGE/USCC', s: 'PERP', p: '', c: '', up: true, bg: 'rgba(255,255,255,0.03)', ic: 'https://cryptologos.cc/logos/dogecoin-doge-logo.svg?v=035', comingSoon: true },
    { n: 'LINK/USCC', s: 'PERP', p: '', c: '', up: true, bg: 'rgba(255,255,255,0.03)', ic: 'https://cryptologos.cc/logos/chainlink-link-logo.svg?v=035', comingSoon: true },
    { n: 'TON/USCC', s: 'PERP', p: '', c: '', up: true, bg: 'rgba(255,255,255,0.03)', ic: 'https://cryptologos.cc/logos/toncoin-ton-logo.svg?v=035', comingSoon: true },
    { n: 'LTC/USCC', s: 'PERP', p: '', c: '', up: true, bg: 'rgba(255,255,255,0.03)', ic: 'https://cryptologos.cc/logos/litecoin-ltc-logo.svg?v=035', comingSoon: true },
    { n: 'AVAX/USCC', s: 'PERP', p: '', c: '', up: true, bg: 'rgba(255,255,255,0.03)', ic: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg?v=035', comingSoon: true },
  ]

  const RUN_TRADES: any[] = []
  const OB_BIDS: any[] = []
  const OB_ASKS: any[] = []

  return (
    <div className={styles.root}>

      {/* Main area */}
      <div className={styles.main}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <Link href="/" className={styles.brand} style={{ textDecoration: 'none' }}>
            <div className={styles.logoBlock}>
              <LogoIcon size={16} />
            </div>
            3xtremes
          </Link>

          <div className={styles.tbSpacer} />

          <div className={styles.tbRight}>


            {/* Balance */}
            {address && (
              <div className={styles.tbBal}>
                <span className={styles.tbBalLabel}>USCC</span>
                <span>{balance.toFixed(2)}</span>
              </div>
            )}

            <button className={styles.tbIconBtn} onClick={() => address ? setShowWalletMenu(true) : setShowConnect(true)}>
              <Wallet size={15} />
            </button>

            <ConnectButton />
          </div>
        </header>

        {/* Body grid */}
        <div className={styles.body}>
          {/* Markets */}
          <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.08] backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:from-white/[0.04] hover:to-white/[0.02] hover:-translate-y-[1px] transition-all duration-300 ${styles.card} ${styles.marketsCard}`}>

            <div className={styles.coinList}>
              {MARKETS.map(m => (
                <div key={m.n} className={styles.coinRow}>
                  <div className={`${styles.coinIcon} !rounded-full`} style={{ background: m.bg }}>
                    {m.is3X ? <LogoIcon size={16} /> : <img src={m.ic} alt={m.n} className="w-full h-full rounded-full object-contain" />}
                  </div>
                  <div className={styles.coinInfo}>
                    <div className={styles.coinName}>{m.n}</div>
                    <div className={styles.coinSym}>{m.s}</div>
                  </div>
                  <div className={styles.coinRight}>
                    {m.comingSoon ? (
                      <div className="text-[9px] font-bold text-white/40 uppercase tracking-wider bg-white/5 px-2 py-1 rounded-md border border-white/[0.03]">Coming Soon</div>
                    ) : (
                      <>
                        <div className={styles.coinPrice}>{m.p}</div>
                        <div className={`${styles.coinChg} ${m.up ? styles.blue : styles.red}`}>{m.up ? '▲' : '▼'} {m.c}</div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className={`relative overflow-hidden rounded-2xl bg-white/[0.01] border border-white/[0.08] backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.1)] ${styles.card} ${styles.chartCard}`}>
            <div className={styles.chartTop}>
              <div className={styles.chartAsset}>
                <div className={styles.chartAssetIcon} style={{ background: '#2563eb' }}>
                  <LogoIcon size={22} />
                </div>
                <div>
                  <div className={styles.chartPrice}>
                    <div className={`text-4xl font-extrabold tracking-tighter tabular-nums transition-colors duration-300 ${
                      isUp ? 'text-emerald-400 drop-shadow-[0_0_24px_rgba(52,211,153,0.4)]' : 'text-rose-500 drop-shadow-[0_0_24px_rgba(244,63,94,0.4)]'
                    }`} style={{ lineHeight: 1.1 }}>
                      {cur.toFixed(6)}
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.chartStats}>
                <div className={styles.chartStat}>
                  <span className={styles.chartStatVal} style={{ color: 'rgba(255,255,255,0.8)' }}>60s</span>
                  <span className={styles.chartStatLbl}>Round Duration</span>
                </div>


              </div>
            </div>
            <div className={styles.chartToolbar} style={{ justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className={`${styles.tfBtn} ${isCandle ? styles.tfActive : ''}`} onClick={() => setIsCandle(true)}>Candle</button>
                <button className={`${styles.tfBtn} ${!isCandle ? styles.tfActive : ''}`} onClick={() => setIsCandle(false)}>Line</button>
              </div>
            </div>
            <div className={styles.chartWrap}>
              {isLoading ? (
                <div className="absolute inset-0 flex flex-col gap-4 p-4 pointer-events-none">
                  <div className="flex justify-between items-end h-[70%] border-b border-white/[0.05] pb-4">
                    {[40, 70, 30, 80, 50, 90, 60, 40, 85, 30].map((h, i) => (
                      <SkeletonLine key={i} width="3%" height={`${h}%`} className="bg-white/[0.03]" />
                    ))}
                  </div>
                  <SkeletonLine width="100%" height="20px" className="opacity-50" />
                </div>
              ) : (
                <>
                  <TradingChart data={candles} isCandle={isCandle} positions={openPositions} />
                  
                  {/* Round Status Overlay */}
                  {roundStatus !== "Active" && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#030712]/40 backdrop-blur-[2px] transition-all duration-500 animate-[fadeIn_0.3s_ease-out]">
                      <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08] shadow-2xl backdrop-blur-xl scale-100 animate-[zoomIn_0.3s_ease-out]">
                        <div className="relative">
                          <Loader2 size={32} className="text-emerald-400 animate-spin" />
                          <div className="absolute inset-0 blur-lg bg-emerald-400/20 animate-pulse" />
                        </div>
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="text-sm font-bold text-white uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{roundStatus}</div>
                          <div className="text-[10px] text-white/40 font-medium uppercase tracking-[0.3em]">Syncing with chain</div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Order Panel */}
          <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/[0.08] backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.25)] z-10 ${styles.card} ${styles.orderCard}`}>
            {tradeSuccess && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] uppercase tracking-wider font-bold px-4 py-2.5 rounded-xl flex items-center gap-2.5 opacity-0 animate-[fadeIn_0.3s_ease-out_forwards] backdrop-blur-md z-50">
                <CheckCircle2 size={14} className="text-emerald-400" />
                Order Executed
              </div>
            )}
            <div className={styles.orderTitle}>Open Position</div>
            <div className={styles.buySellWrap}>
              {['Long', 'Short'].map((t, i) => (
                <button
                  key={t}
                  className={`${styles.buySellBtn} ${side === (i === 0 ? 'buy' : 'sell') ? (i === 0 ? styles.buySellBtnBlue : styles.buySellBtnRed) : ''}`}
                  onClick={() => setSide(i === 0 ? 'buy' : 'sell')}
                >{t}</button>
              ))}
            </div>

            <div className={styles.inputGroup}>
              <span className="text-xs font-medium text-white/50 tracking-wide uppercase mb-2 block">Margin (USCC)</span>
              <div className={styles.inputWrap}>
                <input 
                  type="text"
                  value={amount} 
                  onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} 
                  placeholder="0.00"
                  className={isExceedsBalance ? '!text-rose-500' : ''}
                />
                <span className={styles.inputSuffix}>USCC</span>
              </div>
              {isExceedsBalance && (
                <div className="text-xs text-rose-500 mt-2 font-medium flex items-center gap-1.5 opacity-0 animate-[fadeIn_0.2s_ease-out_forwards]">
                  <span className="w-1 h-1 rounded-full bg-rose-500" />
                  Insufficient USCC balance
                </div>
              )}
              <div className={styles.pctBtnWrap}>
                {['25%', '50%', '75%', 'Max'].map(p => (
                  <button 
                    key={p} 
                    className={styles.pctBtn} 
                    onClick={() => setAmount(
                      p === '25%' ? (balance * 0.25).toFixed(2) :
                      p === '50%' ? (balance * 0.50).toFixed(2) :
                      p === '75%' ? (balance * 0.75).toFixed(2) :
                      (balance * 0.99).toFixed(2)
                    )}
                  >{p}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <div className={styles.leverageRow}>
                <span className="text-xs font-medium text-white/50 tracking-wide uppercase">Leverage</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="text-lg font-bold text-white tabular-nums">{leverage}x</span>
                  {leverage >= 1000 && (
                    <span style={{ fontSize: 10, color: leverage >= 5000 ? '#ef4444' : '#f59e0b', fontWeight: 800, padding: '2px 6px', background: leverage >= 5000 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', borderRadius: 4 }}>
                      HIGH RISK
                    </span>
                  )}
                </div>
              </div>
              <input
                type="range" min={1} max={10000} step={1}
                value={leverage}
                onChange={e => setLeverage(Number(e.target.value))}
                className={`${styles.slider} ${leverage >= 5000 ? styles.sliderExtremeRisk : leverage >= 1000 ? styles.sliderHighRisk : ''}`}
                style={{
                  background: `linear-gradient(to right, ${leverage >= 5000 ? '#ef4444' : leverage >= 1000 ? '#f59e0b' : '#2563eb'} ${(leverage / 10000) * 100}%, rgba(255,255,255,0.1) ${(leverage / 10000) * 100}%)`
                }}
              />
              {leverage >= 1000 && (
                <div style={{ fontSize: 11, color: leverage >= 5000 ? 'rgba(239,68,68,0.8)' : 'rgba(245,158,11,0.8)', marginTop: '8px', lineHeight: 1.4 }}>
                  High leverage significantly increases your liquidation risk.
                </div>
              )}
            </div>

            <div className={styles.divider} style={{ margin: '0 0 24px', opacity: 0.3 }} />

            <div className="flex flex-col gap-4 mb-9">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-white/50 tracking-wide uppercase">Order Value</span>
                <span className="text-base font-semibold text-white/90 tabular-nums">{notional.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USCC</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-white/50 tracking-wide uppercase">Est. Liq Price</span>
                <span className="text-base font-semibold text-white/90 tabular-nums">{estLiq.toFixed(5)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-white/50 tracking-wide uppercase">Slippage</span>
                <span className="text-base font-semibold text-emerald-400 tabular-nums">0.00%</span>
              </div>
            </div>

            {/* Round Countdown */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="text-xs font-medium text-white/50 tracking-wide uppercase">Round Closes In</span>
                {roundStatus !== "Active" ? (
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase animate-pulse">
                    <Loader2 size={12} className="animate-spin" />
                    {roundStatus}
                  </span>
                ) : (
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 14,
                    fontWeight: 700,
                    color: countdown <= 10 ? '#ff3b30' : '#00e676',
                    textShadow: countdown <= 10 ? '0 0 12px rgba(255,59,48,0.4)' : 'none'
                  }}>
                    {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </div>
              <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(countdown / 60) * 100}%`,
                  borderRadius: 99,
                  background: countdown <= 10
                    ? 'linear-gradient(to right, #ef4444, #f97316)'
                    : countdown <= 20
                      ? 'linear-gradient(to right, #f59e0b, #eab308)'
                      : 'linear-gradient(to right, #10b981, #3b82f6)',
                  transition: 'width 1s linear, background 0.5s ease',
                  boxShadow: countdown <= 10
                    ? '0 0 8px rgba(239,68,68,0.6)'
                    : countdown <= 20
                      ? '0 0 8px rgba(245,158,11,0.5)'
                      : '0 0 8px rgba(16,185,129,0.4)',
                }} />
              </div>
            </div>

            <div style={{ marginTop: 'auto' }}>
              <button 
                disabled={address ? (isOrderDisabled || isTxPending) : false}
                className={`w-full py-4 rounded-xl text-[15px] font-bold tracking-wide transition-all flex items-center justify-center gap-2 ${
                  !address 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_4px_20px_rgba(37,99,235,0.25)]' 
                    : isTxPending
                      ? 'bg-white/[0.05] text-white/70 cursor-not-allowed border border-white/[0.05]'
                      : isOrderDisabled
                        ? 'bg-white/[0.03] text-white/30 cursor-not-allowed border border-white/[0.05]'
                        : side === 'buy' ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_4px_20px_rgba(16,185,129,0.25)]' : 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_4px_20px_rgba(244,63,94,0.25)]'
                }`} 
                onClick={() => {
                  if (!address) return setShowConnect(true)
                  if (isOrderDisabled) {
                    console.log("Order disabled state:", { isInvalidMargin, isExceedsBalance, marginNum, balance });
                    return;
                  }
                  if (isTxPending) return;
                  
                  setIsTxPending(true)
                  console.log("🚀 Attempting to open position...", { side, amount, leverage });
                  
                  try {
                    const isLong = side === 'buy';
                    const margin = BigInt(Math.floor(parseFloat(amount) * 1e6));
                    const lev = BigInt(leverage);
                    
                    writeContract({
                      address: CONTRACTS.POSITION_MANAGER as `0x${string}`,
                      abi: POSITION_MANAGER_ABI,
                      functionName: 'openPosition',
                      args: [isLong, margin, lev],
                    }, {
                      onSuccess: (hash) => {
                        console.log("✅ Transaction sent:", hash);
                        setIsTxPending(false);
                        setTradeSuccess(true);
                        setTimeout(() => setTradeSuccess(false), 3000);
                      },
                      onError: (err: any) => {
                        console.error("❌ Trade failed:", err);
                        setIsTxPending(false);
                        // Show error to user via alert for quick debug
                        alert(`Trade Failed: ${err.shortMessage || err.message || "Unknown error"}`);
                      }
                    });
                  } catch (e: any) {
                    console.error("💥 Trade execution error:", e);
                    setIsTxPending(false);
                    alert(`Error: ${e.message}`);
                  }
                }}
              >
                {isTxPending ? (
                  <><Loader2 size={18} className="animate-spin" /> CONFIRMING...</>
                ) : !address ? (
                  "CONNECT WALLET"
                ) : isExceedsBalance ? (
                  "INSUFFICIENT BALANCE"
                ) : isInvalidMargin ? (
                  "INVALID MARGIN"
                ) : (
                  `OPEN ${side.toUpperCase()}`
                )}
                {(!isOrderDisabled || !address) && !isTxPending && <ArrowUpRight size={18} strokeWidth={2.5} className="ml-1 opacity-80" />}
              </button>
            </div>
          </div>

          <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.08] backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:from-white/[0.04] hover:to-white/[0.02] hover:-translate-y-[1px] transition-all duration-300 ${styles.card} ${styles.runCard}`}>
            <div className={styles.cardTitle}>Summary</div>
            <table className={styles.tbl}>
              <thead>
                <tr><th>Metric</th><th style={{ textAlign: 'right' }}>Value</th></tr>
              </thead>
              <tbody>
                <tr><td>Open Positions</td><td style={{ textAlign: 'right' }}>{openPositions.length}</td></tr>
                <tr><td>Total Margin</td><td style={{ textAlign: 'right' }}>{openPositions.reduce((acc: number, p: any) => acc + Number(p.margin) / 1e6, 0).toFixed(2)} USCC</td></tr>
              </tbody>
            </table>
          </div>

          <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.08] backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:from-white/[0.04] hover:to-white/[0.02] hover:-translate-y-[1px] transition-all duration-300 ${styles.card} ${styles.obCard}`}>
            <div className={styles.cardTitle}>Positions</div>
            <div className={styles.obWrap}>
              {isLoading ? (
                  <div className="flex flex-col gap-3 pt-2 w-full px-4">
                    {Array.from({ length: 3 }).map((_, i) => <SkeletonLine key={i} height="40px" />)}
                  </div>
              ) : openPositions.length > 0 ? (
                <table className={styles.tbl}>
                  <thead>
                    <tr><th>Side/Entry</th><th>PnL (USCC)</th><th style={{ textAlign: 'right' }}>Action</th></tr>
                  </thead>
                  <tbody>
                    {openPositions.map((p: any) => {
                      // Find real-time PnL from contract data
                      const pnlIdx = ids.findIndex(id => id === p.positionId);
                      const contractPnl = (pnlsRaw as any)?.[pnlIdx]?.result ? BigInt((pnlsRaw as any)[pnlIdx].result) : 0n;
                      
                      // Calculate LIVE frontend PnL for smoothness
                      const entry = Number(p.entryPrice) / 1e5;
                      const margin = Number(p.margin) / 1e6;
                      const lev = Number(p.leverage);
                      
                      const priceDiff = p.isLong ? (cur - entry) : (entry - cur);
                      const livePnl = (priceDiff / entry) * (margin * lev);
                      
                      // Use livePnl for display, fall back to contract if something is weird
                      const displayPnl = isNaN(livePnl) ? (Number(contractPnl) / 1e6) : livePnl;
                      const isPnlPositive = displayPnl >= 0;
                      
                      const liqPrice = Number(p.liquidationPrice) / 1e5;
                      const isUnderwater = p.isLong ? (cur <= liqPrice) : (cur >= liqPrice);

                      return (
                        <tr key={p.positionId.toString()} style={isUnderwater ? { background: 'rgba(239, 68, 68, 0.05)' } : {}}>
                          <td style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div className="flex items-center gap-2">
                              <span style={{ color: p.isLong ? '#10b981' : '#ef4444', fontWeight: 800, fontSize: 10 }}>{p.isLong ? 'LONG' : 'SHORT'}</span>
                              {isUnderwater && <span className="animate-pulse bg-rose-500 text-white text-[8px] px-1 rounded font-bold">LIQUIDATABLE</span>}
                            </div>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{fmtPrice(p.entryPrice)}</span>
                          </td>
                          <td style={{ color: isPnlPositive ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: 14 }}>
                            {isPnlPositive ? '+' : ''}{displayPnl.toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {isUnderwater ? (
                               <button 
                                 className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(225,29,72,0.4)]"
                                 onClick={() => {
                                   writeContract({
                                     address: CONTRACTS.POSITION_MANAGER as `0x${string}`,
                                     abi: POSITION_MANAGER_ABI,
                                     functionName: 'liquidatePosition',
                                     args: [p.positionId],
                                   });
                                 }}
                               >
                                 Force Liq
                               </button>
                            ) : (
                               <button 
                                 className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border border-white/5"
                                 onClick={() => {
                                   writeContract({
                                     address: CONTRACTS.POSITION_MANAGER as `0x${string}`,
                                     abi: POSITION_MANAGER_ABI,
                                     functionName: 'closePosition',
                                     args: [p.positionId],
                                   });
                                 }}
                               >
                                 Close
                               </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="w-full h-full">
                  <EmptyState icon={Wallet} title="No Active Positions" desc="Your open positions will appear here once executed." />
                </div>
              )}
            </div>
          </div>

          <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.08] backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:from-white/[0.04] hover:to-white/[0.02] hover:-translate-y-[1px] transition-all duration-300 ${styles.card} ${styles.myCard}`}>
            <div className={styles.cardTitle}>
              <span>Position History</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
              {isLoading ? (
                <div className="flex flex-col gap-3 pt-2">
                  {Array.from({ length: 2 }).map((_, i) => <SkeletonLine key={i} height="32px" />)}
                </div>
              ) : closedPositions.length > 0 ? (
                closedPositions.slice(0, 3).map((p: any, i: any) => (
                  <div key={i} className={styles.orderRow}>
                    <span style={{ fontFamily: 'var(--mono)', color: 'rgba(255,255,255,0.8)' }}>{fmtPrice(p.entryPrice)}</span>
                    <span style={{ color: 'var(--muted)' }}>{fmtUscc(p.margin)} USCC</span>
                    <span style={{ color: p.isLong ? 'var(--blue)' : 'var(--red)', fontSize: 10, fontWeight: 700 }}>{p.isLong ? 'Long' : 'Short'}</span>
                    <span className={styles.closeX}>×</span>
                  </div>
                ))
              ) : (
                <EmptyState icon={Settings} title="No History" desc="Your past trades and closed positions will be listed here." />
              )}
            </div>
          </div>
        </div>
      </div>

      {showWalletMenu && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setShowWalletMenu(false)}>
          <div style={{
            background: 'var(--panel)', border: '1px solid var(--border)',
            padding: 24, borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 12,
            width: 320, boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
            boxSizing: 'border-box'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontFamily: 'Space Grotesk, sans-serif', color: '#fff' }}>Portfolio Action</h3>
            <button 
              style={{ padding: '14px', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)', color: '#3b82f6', borderRadius: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: 14 }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.2)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.5)' }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.1)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.3)' }}
              onClick={() => { setShowDeposit(true); setShowWalletMenu(false); }}
            >
              Deposit Funds
            </button>
            <button 
              style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: 14 }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
              onClick={() => { setShowWithdraw(true); setShowWalletMenu(false); }}
            >
              Withdraw Funds
            </button>
            <button 
              style={{ padding: '10px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', borderRadius: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', fontSize: 13, marginTop: 4 }}
              onMouseOver={e => e.currentTarget.style.color = '#fff'}
              onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
              onClick={() => setShowWalletMenu(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showDeposit  && <DepositModal onClose={() => setShowDeposit(false)} />}
      {showWithdraw && <WithdrawModal onClose={() => setShowWithdraw(false)} />}
      {showConnect  && <ConnectWalletModal onClose={() => setShowConnect(false)} />}
    </div>
  )
}