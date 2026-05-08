'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { keepPreviousData } from '@tanstack/react-query'
import { useReadContract, useReadContracts, useAccount } from 'wagmi'
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

function TradingChart({ data, isCandle, positions, showLines }: { data: Candle[], isCandle: boolean, positions: any[], showLines: boolean }) {
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
    } else {
      series = chartRef.current.addSeries(LineSeries, {
        color: '#3b82f6', lineWidth: 2, crosshairMarkerVisible: true, crosshairMarkerRadius: 4,
        priceFormat: { type: 'price', precision: 6, minMove: 0.000001 },
      });
    }
    seriesRef.current = series;

    // Immediately set data if available
    if (data.length > 0) {
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
          series.setData(validData as any);
        } else {
          series.setData(validData.map((d: any) => ({ time: d.time, value: d.close })) as any);
        }
      }
    }
  }, [isCandle]);

  // Handle subsequent data updates
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

    // Clear old lines always first
    priceLinesRef.current.forEach(l => {
      try { seriesRef.current.removePriceLine(l); } catch (e) {}
    });
    priceLinesRef.current = [];

    // Hide lines when round is settling — stop here, don't re-add
    if (!showLines) return;

    // Add lines for each active position
    positions.forEach((p: any) => {
      const entryPrice = Number(p.entryPrice) / 1e5;
      const liqPrice = Number(p.liquidationPrice) / 1e5;

      if (entryPrice > 0) {
        const entryLine = seriesRef.current.createPriceLine({
          price: entryPrice,
          color: p.isLong ? '#10b981' : '#ef4444',
          lineWidth: 1,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: `${p.isLong ? 'L' : 'S'} Entry @ ${entryPrice.toFixed(5)}`,
        });
        priceLinesRef.current.push(entryLine);
      }

      if (liqPrice > 0) {
        const liqLine = seriesRef.current.createPriceLine({
          price: liqPrice,
          color: '#f97316',
          lineWidth: 1,
          lineStyle: 3, // Dotted
          axisLabelVisible: true,
          title: `LIQ @ ${liqPrice.toFixed(5)}`,
        });
        priceLinesRef.current.push(liqLine);
      }
    });

    console.log("🎨 Chart price lines:", positions.length, "| showLines:", showLines);
  }, [positions, isCandle, showLines]);

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
    query: { enabled: !!address, refetchInterval: 1000 },
  })
  const ids = useMemo(() => (positionIds as bigint[] | undefined) ?? [], [positionIds])

  const { data: positionsRaw } = useReadContracts({
    contracts: ids.map(id => ({ address: CONTRACTS.POSITION_MANAGER as `0x${string}`, abi: POSITION_MANAGER_ABI, functionName: 'getPosition', args: [id] })),
    query: { enabled: ids.length > 0, refetchInterval: 1000, placeholderData: keepPreviousData },
  })

  const { data: pnlsRaw } = useReadContracts({
    contracts: ids.map(id => ({ address: CONTRACTS.POSITION_MANAGER as `0x${string}`, abi: POSITION_MANAGER_ABI, functionName: 'getUnrealizedPnL', args: [id] })),
    query: { enabled: ids.length > 0, refetchInterval: 3_000, placeholderData: keepPreviousData },
  })

  // Hybrid DEX: optimistic positions opened before blockchain confirmation
  const [optimisticPositions, setOptimisticPositions] = useState<any[]>([]);
  const [closingPositionIds, setClosingPositionIds] = useState<Set<string>>(new Set());

  const [wipedOutIds, setWipedOutIds] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const saved = localStorage.getItem('3xtremes_liquidated_ids');
    if (saved) {
      try {
        const ids = JSON.parse(saved);
        setWipedOutIds(new Set(ids));
      } catch (e) {}
    }
  }, []);

  const allPositions = ((positionsRaw as any) ?? []).flatMap((r: any) => r.status === 'success' && r.result ? [r.result as any] : [])
  // Chart uses a filtered version, but we keep them in openPositions for the UI table
  const openPositions = allPositions.filter((p: any) => p.isOpen && !closingPositionIds.has(p.positionId.toString()))
  const chartPositions = openPositions.filter((p: any) => !wipedOutIds.has(p.positionId.toString()))
  const closedPositions = allPositions.filter((p: any) => !p.isOpen).sort((a: any, b: any) => Number(b.closeTimestamp) - Number(a.closeTimestamp))

  const updateWipedOutIds = (id: string) => {
    setWipedOutIds(prev => {
      const next = new Set([...prev, id]);
      localStorage.setItem('3xtremes_liquidated_ids', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // --- OPTIMISTIC BALANCE LOGIC ---
  const [optimisticBalanceOffset, setOptimisticBalanceOffset] = useState(0);

  useEffect(() => {
    let offset = 0;
    closedPositions.forEach((p: any) => {
      const posId = p.positionId.toString();
      // If position was liquidated locally, but blockchain hasn't confirmed it yet (zombie state)
      // The blockchain will return the margin + pnl to the user. We must hide it.
      if (wipedOutIds.has(posId) && !p.isLiquidated) {
        const margin = Number(p.margin) / 1e6;
        const pnl = Number(p.realizedPnL) / 1e6;
        const blockchainRefund = margin + pnl;
        offset += blockchainRefund;
      }
    });
    // Deduct margin for positions that are still optimistic (not yet confirmed on-chain)
    optimisticPositions.forEach((p: any) => {
      const margin = Number(p.margin) / 1e6;
      const openFee = margin * Number(p.leverage) * 0.0001; // 0.01% of size
      offset += (margin + openFee);
    });

    setOptimisticBalanceOffset(offset);
  }, [closedPositions, wipedOutIds, optimisticPositions]);

  const displayBalance = Math.max(0, balance - optimisticBalanceOffset);

  const [candles, setCandles] = useState<Candle[]>([])
  const [isCandle, setIsCandle] = useState(true)
  const [countdown, setCountdown] = useState(60)
  const [roundStatus, setRoundStatus] = useState<string>("Active")
  const [settlingCountdown, setSettlingCountdown] = useState(0)
  const settlingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const roundBaseTimeRef = useRef<number>(0)

  const [isLoading, setIsLoading] = useState(true)
  const [tradeSuccess, setTradeSuccess] = useState(false)
  const [isTxPending, setIsTxPending] = useState(false)

  const isBalanceSyncing = isTxPending || 
    optimisticPositions.length > 0 || 
    closingPositionIds.size > 0 || 
    allPositions.some((p: any) => wipedOutIds.has(p.positionId.toString()) && !p.isLiquidated);

  useEffect(() => {
    // Mock loading state delay to show skeletons
    const timer = setTimeout(() => setIsLoading(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "wss://3xtremes-production.up.railway.app";
    let reconnectTimeout: any;

    function connect() {
      console.log("Connecting to WebSocket:", wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Connected to 3xtremes Live price feed!");
      };

      ws.onmessage = (event: any) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "POSITION_CONFIRMED") {
            // On-chain tx submitted — already handled optimistically at click time
            // Just log, no UI change needed
            console.log('✅ POSITION_CONFIRMED from bot:', msg.tx);

          } else if (msg.type === "POSITION_FAILED") {
            // Rollback: remove ALL optimistic positions for this trader
            setOptimisticPositions(prev => prev.filter(p => p.trader?.toLowerCase() !== msg.trader?.toLowerCase()));
            setIsTxPending(false);
            alert(`Trade Failed: ${msg.reason}`);

          } else if (msg.type === "POSITION_LIQUIDATED") {
            // Bot push: optimistic liquidation lock
            updateWipedOutIds(msg.positionId.toString());
            liquidationFiredRef.current.add(msg.positionId.toString());
            // Clear from optimistic array if it was there
            setOptimisticPositions(prev => prev.filter(p => !p._optimistic));

          } else if (msg.type === "CLOSE_CONFIRMED") {
            setClosingPositionIds(prev => { const n = new Set(prev); n.delete(msg.positionId); return n; });

          } else if (msg.type === "CLOSE_FAILED") {
            setClosingPositionIds(prev => { const n = new Set(prev); n.delete(msg.positionId); return n; });
            alert(`Close Failed: ${msg.reason}`);

          } else if (msg.type === "HISTORY") {
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
            setOptimisticPositions([]);
            // Start countdown from 15s (avg block confirmation time)
            setSettlingCountdown(15);
            if (settlingTimerRef.current) clearInterval(settlingTimerRef.current);
            settlingTimerRef.current = setInterval(() => {
              setSettlingCountdown(prev => {
                if (prev <= 1) { clearInterval(settlingTimerRef.current!); return 0; }
                return prev - 1;
              });
            }, 1000);
          } else if (msg.type === "ROUND_SETTLED") {
            setRoundStatus("Starting Next Round...");
            setOptimisticPositions([]);
            setSettlingCountdown(5);
            if (settlingTimerRef.current) clearInterval(settlingTimerRef.current);
            settlingTimerRef.current = setInterval(() => {
              setSettlingCountdown(prev => {
                if (prev <= 1) { clearInterval(settlingTimerRef.current!); return 0; }
                return prev - 1;
              });
            }, 1000);
          } else if (msg.type === "ROUND_START") {
            setCountdown(60);
            setRoundStatus("Active");
            setSettlingCountdown(0);
            if (settlingTimerRef.current) clearInterval(settlingTimerRef.current);

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
      if (wsRef.current) wsRef.current.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  const [side, setSide]           = useState<'buy' | 'sell'>('buy')
  const [flashSide, setFlashSide] = useState<string | null>(null)
  const [amount, setAmount]       = useState('100')
  const [leverage, setLeverage]   = useState(1000)
  const [showDeposit, setShowDeposit]   = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [showConnect, setShowConnect]   = useState(false)
  const [showWalletMenu, setShowWalletMenu] = useState(false)

  // Tracks which positions already had liquidation TX fired — prevents spam
  const liquidationFiredRef = useRef<Set<string>>(new Set())
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
  const marginNum = parseFloat(amount) || 0
  const openFee = notional * 0.0001
  const totalRequired = marginNum + openFee
  
  const isInvalidMargin = isNaN(marginNum) || marginNum <= 0
  const isExceedsBalance = !!address && totalRequired > displayBalance
  const isOrderDisabled = isInvalidMargin || isExceedsBalance

  // Wipeout Detection + Auto-Liquidation
  // Once a position hits -100% (via wick OR PnL), it's permanently frozen
  // and liquidation TX fires ONCE (not every candle tick)
  useEffect(() => {
    // Check both real and optimistic positions for wipeout!
    const allActive = [...openPositions, ...optimisticPositions];
    if (allActive.length === 0 || candles.length === 0) return;

    const lastCandle = candles[candles.length - 1];
    if (!lastCandle) return;

    allActive.forEach((p: any) => {
      const posId = p.positionId.toString();

      // Already fired liquidation for this position — skip entirely
      if (liquidationFiredRef.current.has(posId)) return;

      const liqPrice  = Number(p.liquidationPrice) / 1e5;
      const entry     = Number(p.entryPrice) / 1e5;
      const margin    = Number(p.margin) / 1e6;
      const lev       = Number(p.leverage);
      const priceDiff = p.isLong ? (cur - entry) : (entry - cur);
      const livePnl   = (priceDiff / entry) * (margin * lev);

      const isLiquidatable = p.isLong
        ? (lastCandle.close <= liqPrice)
        : (lastCandle.close >= liqPrice);

      if (isLiquidatable) {
        console.log(`💀 Wipeout #${posId} — price=${lastCandle.close} liqPrice=${liqPrice} margin=${margin}`);

        // Permanently mark as wiped out → display freezes at -100%
        updateWipedOutIds(posId);

        // Fire liquidation logic locally for UI lock
        liquidationFiredRef.current.add(posId);

        // TRIGGER BACKEND: Tell the bot to liquidate immediately (only if it's a real position)
        if (!p._optimistic && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'REQUEST_LIQUIDATION', positionId: posId }));
          console.log(`📡 Reported liquidation request for #${posId} to backend`);
        }
      }
    });
  }, [candles, openPositions, optimisticPositions, address]);



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
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {displayBalance.toFixed(2)}
                  {isBalanceSyncing && <Loader2 size={12} className="animate-spin text-emerald-400" />}
                </span>
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
                      {cur.toFixed(5)}
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
                  <TradingChart data={candles} isCandle={isCandle} positions={[...chartPositions, ...optimisticPositions.filter(p => !wipedOutIds.has(p.positionId.toString()))]} showLines={roundStatus === "Active"} />
                  
                  {/* Round Status Overlay */}
                  {roundStatus !== "Active" && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#030712]/40 backdrop-blur-[2px] transition-all duration-500 animate-[fadeIn_0.3s_ease-out]">
                      <div className="flex flex-col items-center gap-5 p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08] shadow-2xl backdrop-blur-xl scale-100 animate-[zoomIn_0.3s_ease-out]">
                        <div className="relative">
                          <Loader2 size={32} className="text-emerald-400 animate-spin" />
                          <div className="absolute inset-0 blur-lg bg-emerald-400/20 animate-pulse" />
                        </div>
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="text-sm font-bold text-white uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{roundStatus}</div>
                          <div className="text-[10px] text-white/40 font-medium uppercase tracking-[0.3em]">Syncing with chain</div>
                        </div>
                        {settlingCountdown > 0 && (
                          <div className="flex flex-col items-center gap-1">
                            <div style={{
                              fontFamily: 'var(--mono)',
                              fontSize: 36,
                              fontWeight: 900,
                              color: settlingCountdown <= 5 ? '#10b981' : 'rgba(255,255,255,0.9)',
                              lineHeight: 1,
                              letterSpacing: '-0.04em',
                              textShadow: settlingCountdown <= 5 ? '0 0 20px rgba(16,185,129,0.6)' : '0 0 20px rgba(255,255,255,0.2)',
                              transition: 'color 0.5s ease, text-shadow 0.5s ease',
                            }}>
                              {settlingCountdown}s
                            </div>
                            <div className="text-[9px] text-white/30 uppercase tracking-[0.3em]">est. next round</div>
                          </div>
                        )}
                        {settlingCountdown === 0 && (
                          <div className="text-[10px] text-emerald-400/80 uppercase tracking-[0.2em] animate-pulse">Starting soon...</div>
                        )}
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
            {/* Native CSS :active + Keyframe Animations */}
            <style>{`
              @keyframes popGreen {
                0% { transform: scale(1); background: rgba(16,185,129,0.08); box-shadow: none; }
                50% { transform: scale(0.92); background: rgba(16,185,129,0.4) !important; box-shadow: 0 0 20px rgba(16,185,129,0.6) !important; color: #fff !important; }
                100% { transform: scale(1); background: rgba(16,185,129,0.08); box-shadow: none; }
              }
              @keyframes popRed {
                0% { transform: scale(1); background: rgba(239,68,68,0.08); box-shadow: none; }
                50% { transform: scale(0.92); background: rgba(239,68,68,0.4) !important; box-shadow: 0 0 20px rgba(239,68,68,0.6) !important; color: #fff !important; }
                100% { transform: scale(1); background: rgba(239,68,68,0.08); box-shadow: none; }
              }
              .anim-flash-buy {
                animation: popGreen 0.25s ease-out forwards !important;
              }
              .anim-flash-sell {
                animation: popRed 0.25s ease-out forwards !important;
              }
              #btn-long, #btn-short {
                transition: transform 0.1s ease, background 0.15s ease !important;
              }
              #btn-long:active, #btn-short:active {
                transform: scale(0.95) !important;
              }
            `}</style>
            <div style={{ display: 'flex', marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {(['Long', 'Short'] as const).map((t, i) => {
                const val    = i === 0 ? 'buy' : 'sell';
                const isLong = i === 0;
                const isSel  = side === val;
                const col    = isLong ? '#10b981' : '#ef4444';
                return (
                  <button
                    id={isLong ? 'btn-long' : 'btn-short'}
                    key={`${t}-${flashSide === val ? 'flash' : 'idle'}`}
                    className={flashSide === val ? `anim-flash-${val}` : ''}
                    onClick={() => {
                      setSide(val);
                      setFlashSide(val);
                      setTimeout(() => setFlashSide(null), 250);
                    }}
                    style={{
                      flex: 1,
                      padding: '12px 0',
                      border: 'none',
                      borderBottom: `2px solid ${isSel ? col : 'transparent'}`,
                      borderRadius: '6px 6px 0 0',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: 13,
                      fontFamily: 'Inter Tight, sans-serif',
                      letterSpacing: '0.03em',
                      color: isSel ? col : 'rgba(255,255,255,0.35)',
                      background: isSel
                        ? `rgba(${isLong ? '16,185,129' : '239,68,68'}, 0.08)`
                        : 'transparent',
                      textShadow: isSel ? `0 0 14px ${col}88` : 'none',
                    }}
                  >{t}</button>
                );
              })}
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
                    onClick={() => {
                      const maxMargin = displayBalance / (1 + (leverage * 0.005));
                      setAmount(
                        p === '25%' ? (maxMargin * 0.25).toFixed(2) :
                        p === '50%' ? (maxMargin * 0.50).toFixed(2) :
                        p === '75%' ? (maxMargin * 0.75).toFixed(2) :
                        (maxMargin * 0.999).toFixed(2) // 0.999 for extra safety against rounding
                      )
                    }}
                  >{p}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <div className={styles.leverageRow}>
                <span className="text-xs font-medium text-white/50">Leverage</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="text-lg font-bold text-white">{leverage}x</span>
                  {leverage >= 1000 && (
                    <span style={{ fontSize: 10, color: leverage >= 5000 ? '#ef4444' : '#f59e0b', fontWeight: 800, padding: '2px 6px', background: leverage >= 5000 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', borderRadius: 4 }}>
                      HIGH RISK
                    </span>
                  )}
                </div>
              </div>
              <input
                type="range" min={10} max={10000} step={1}
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
                <span className="text-xs font-medium text-white/50">Order Value</span>
                <span className="text-base font-semibold text-white/90">{notional.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USCC</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-white/50">Opening Fee (0.01%)</span>
                <span className="text-base font-semibold text-white/70">{openFee.toFixed(2)} USCC</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-1">
                <span className="text-xs font-bold text-white/60">Total Required</span>
                <span className={`text-base font-bold ${isExceedsBalance ? 'text-rose-500' : 'text-white'}`}>{totalRequired.toFixed(2)} USCC</span>
              </div>
              <div className={styles.divider} style={{ margin: '8px 0', opacity: 0.2 }} />
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-white/50">Est. Liq Price</span>
                <span className="text-base font-semibold text-white/90">{estLiq.toFixed(5)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-white/50">Slippage</span>
                <span className="text-base font-semibold text-emerald-400">0.00%</span>
              </div>
            </div>

            {/* Round Countdown */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="text-xs font-medium text-white/50">Round Closes In</span>
                {roundStatus !== "Active" ? (
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase animate-pulse">
                    <Loader2 size={12} className="animate-spin" />
                    {roundStatus}
                  </span>
                ) : (
                  <span style={{
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
                disabled={address ? (isOrderDisabled || isTxPending || countdown <= 7) : false}
                className={`w-full py-4 rounded-xl text-[15px] font-bold tracking-wide transition-all flex items-center justify-center gap-2 active:scale-[0.98] active:brightness-90 ${
                  !address 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_4px_20px_rgba(37,99,235,0.25)]' 
                    : isTxPending
                      ? 'bg-white/[0.05] text-white/70 cursor-not-allowed border border-white/[0.05] active:scale-100 active:brightness-100'
                      : (isOrderDisabled || countdown <= 7)
                        ? 'bg-white/[0.03] text-white/20 cursor-not-allowed border border-white/[0.05] active:scale-100 active:brightness-100'
                        : side === 'buy' 
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_4px_20px_rgba(16,185,129,0.25)] hover:shadow-[0_6px_24px_rgba(16,185,129,0.4)]' 
                          : 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_4px_20px_rgba(244,63,94,0.25)] hover:shadow-[0_6px_24px_rgba(244,63,94,0.4)]'
                }`} 
                onClick={() => {
                  if (!address) return setShowConnect(true)
                  if (isOrderDisabled || countdown <= 7) return;
                  if (isTxPending) return;
                  
                  // ── HYBRID DEX: Send OPEN_POSITION to bot via WebSocket ──
                  setIsTxPending(true)

                  const parsedAmount = parseFloat(amount);
                  if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
                    alert('Please enter a valid margin amount.');
                    setIsTxPending(false);
                    return;
                  }
                  const parsedLev = Number(leverage);
                  if (isNaN(parsedLev) || parsedLev < 10 || parsedLev > 10000) {
                    alert('Leverage must be between 10x and 10,000x.');
                    setIsTxPending(false);
                    return;
                  }
                  const marginRaw = Math.floor(parsedAmount * 1e6);
                  if (marginRaw <= 0) {
                    alert('Margin is too small.');
                    setIsTxPending(false);
                    return;
                  }

                  const isLong = side === 'buy';
                  const rawPrice = Math.floor(cur * 1e5);
                  const liqPrice = isLong
                    ? Math.max(0, rawPrice - Math.floor(rawPrice / parsedLev))
                    : rawPrice + Math.floor(rawPrice / parsedLev);

                  // ── Optimistic UI: add fake position immediately ──
                  const optKey = `${address}_${rawPrice}_${isLong}`;
                  const optimisticPos = {
                    _optimistic: true,
                    _optimisticKey: optKey,
                    positionId: BigInt(Date.now()), // temp ID
                    trader: address,
                    isLong,
                    entryPrice: BigInt(rawPrice),
                    liquidationPrice: BigInt(liqPrice),
                    margin: BigInt(marginRaw),
                    leverage: BigInt(parsedLev),
                    size: BigInt(marginRaw * parsedLev),
                    isOpen: true,
                    isLiquidated: false,
                    openTimestamp: BigInt(Math.floor(Date.now() / 1000)),
                    closeTimestamp: 0n,
                    realizedPnL: 0n,
                  };
                  setOptimisticPositions(prev => [...prev, optimisticPos]);

                  // ── Send to backend bot via WebSocket ──
                  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                      type: 'OPEN_POSITION',
                      trader: address,
                      isLong,
                      margin: marginRaw,
                      leverage: parsedLev,
                      price: rawPrice,
                    }));
                    // ✅ Posisi sudah tampil optimistic — tombol langsung unlock
                    setIsTxPending(false);
                    setTradeSuccess(true);
                    setTimeout(() => setTradeSuccess(false), 2000);
                  } else {
                    alert('Not connected to trading server. Please refresh.');
                    setOptimisticPositions(prev => prev.filter(p => p._optimisticKey !== optKey));
                    setIsTxPending(false);
                  }
                }}
              >
                {/* Button label — countdown lock takes highest priority */}
                {countdown <= 7 && address ? (
                  'ROUND LOCKED'
                ) : isTxPending ? (
                  <><Loader2 size={18} className="animate-spin" /> EXECUTING...</>
                ) : !address ? (
                  'CONNECT WALLET'
                ) : isExceedsBalance ? (
                  'INSUFFICIENT BALANCE'
                ) : isInvalidMargin ? (
                  'INVALID MARGIN'
                ) : (
                  `OPEN ${side === 'buy' ? 'LONG' : 'SHORT'}`
                )}
                {(!isOrderDisabled && !!address && countdown > 7) && !isTxPending && <ArrowUpRight size={18} strokeWidth={2.5} className="ml-1 opacity-80" />}
              </button>
            </div>
          </div>

          <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.08] backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:from-white/[0.04] hover:to-white/[0.02] hover:-translate-y-[1px] transition-all duration-300 ${styles.card} ${styles.runCard}`}>
            <div className={styles.cardTitle}>Summary</div>
            <table className={styles.tbl}>
              <tbody>
                {(() => {
                  const wins   = closedPositions.filter((p: any) => !p.isLiquidated && Number(p.realizedPnL) > 0);
                  const losses = closedPositions.filter((p: any) => p.isLiquidated || Number(p.realizedPnL) <= 0);
                  const totalProfit = wins.reduce((acc: number, p: any) => acc + Number(p.realizedPnL) / 1e6, 0);
                  const totalLoss   = losses.reduce((acc: number, p: any) => acc + Math.abs(Number(p.realizedPnL)) / 1e6, 0);
                  const winrate     = closedPositions.length > 0 ? (wins.length / closedPositions.length) * 100 : 0;
                  return (
                    <>
                      <tr>
                        <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Balance</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
                          <span style={{ color: '#fff' }}>{displayBalance.toFixed(2)}</span> <span style={{ fontWeight: 500 }}>USCC</span>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Total Profit</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
                          <span style={{ color: totalProfit > 0 ? '#10b981' : 'rgba(255,255,255,0.4)' }}>{totalProfit > 0 ? '+' : ''}{totalProfit.toFixed(2)}</span> <span style={{ fontWeight: 500 }}>USCC</span>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Total Loss</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
                          <span style={{ color: totalLoss > 0 ? '#ef4444' : 'rgba(255,255,255,0.4)' }}>{totalLoss > 0 ? '-' : ''}{totalLoss.toFixed(2)}</span> <span style={{ fontWeight: 500 }}>USCC</span>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Win Rate</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 700, color: 'rgba(255,255,255,0.25)' }}>
                          <span style={{ color: winrate >= 50 ? '#10b981' : winrate > 0 ? '#f59e0b' : 'rgba(255,255,255,0.4)' }}>
                            {closedPositions.length > 0 ? `${winrate.toFixed(0)}%` : '—'}
                          </span>
                          {closedPositions.length > 0 && <span style={{ fontWeight: 400, fontSize: 10 }}> ({wins.length}/{closedPositions.length})</span>}
                        </td>
                      </tr>
                      <tr style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, paddingTop: 8 }}>All Time</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 13, paddingTop: 8, color: 'rgba(255,255,255,0.3)' }}>
                          {closedPositions.length > 0 ? (
                            <>
                              <span style={{ color: (totalProfit - totalLoss) > 0 ? '#10b981' : (totalProfit - totalLoss) < 0 ? '#ef4444' : 'rgba(255,255,255,0.4)' }}>
                                {(totalProfit - totalLoss) >= 0 ? '+' : ''}{Math.abs(totalProfit - totalLoss).toFixed(2)}
                              </span> <span style={{ fontWeight: 500 }}>USCC</span>
                            </>
                          ) : <span style={{ color: 'rgba(255,255,255,0.4)' }}>—</span>}
                        </td>
                      </tr>
                    </>
                  );
                })()}
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
              ) : roundStatus !== "Active" ? (
                <div className="w-full h-full">
                  <EmptyState icon={Wallet} title="Round Settling" desc="Positions are being settled. Next round starting soon." />
                </div>
              ) : (openPositions.length > 0 || optimisticPositions.length > 0) ? (
                <table className={styles.tbl}>
                  <thead>
                    <tr><th>Side/Entry</th><th>PNL</th><th style={{ textAlign: 'right' }}>Action</th></tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Filter optimistic: hapus jika real position sudah masuk dari chain
                      const realTraders = new Set(openPositions.map((p: any) => p.trader?.toLowerCase()));
                      const filteredOptimistic = optimisticPositions.filter(
                        op => !realTraders.has(op.trader?.toLowerCase())
                      );
                      return [...openPositions, ...filteredOptimistic].map((p: any) => {
                        const pnlIdx = ids.findIndex(id => id === p.positionId);
                        const contractPnl = (pnlsRaw as any)?.[pnlIdx]?.result ? BigInt((pnlsRaw as any)[pnlIdx].result) : 0n;
                        const posId  = p.positionId.toString();
                        const entry  = Number(p.entryPrice) / 1e5;
                        const margin = Number(p.margin) / 1e6;
                        const lev    = Number(p.leverage);
                        const isWipedOut = wipedOutIds.has(posId);
                        const priceDiff = p.isLong ? (cur - entry) : (entry - cur);
                        // Optimistic: PnL starts live from 0 using current price
                        const livePnl = isWipedOut ? -margin : (entry > 0 ? (priceDiff / entry) * (margin * lev) : 0);
                        const rawPnl  = isNaN(livePnl) ? (Number(contractPnl) / 1e6) : livePnl;
                        const displayPnl    = isWipedOut ? -margin : Math.max(rawPnl, -margin);
                        const isPnlPositive = displayPnl >= 0;
                        const pnlPct        = Math.max((displayPnl / margin) * 100, -100);
                        const liqPrice    = Number(p.liquidationPrice) / 1e5;
                        const isUnderwater = (p.isLong ? (cur <= liqPrice) : (cur >= liqPrice));
                        const isLiquidated = isWipedOut || isUnderwater;
                        
                        // Force display PnL to -margin if liquidated
                        const finalDisplayPnl = isLiquidated ? -margin : displayPnl;
                        const finalPnlPct = isLiquidated ? -100 : pnlPct;
                        const isFinalPnlPositive = finalDisplayPnl >= 0;

                        return (
                          <tr key={posId} style={isLiquidated ? { background: 'rgba(239, 68, 68, 0.07)' } : {}}>
                            <td style={{ verticalAlign: 'middle', padding: '10px 0' }}>
                              <div className="flex items-center gap-2.5">
                                <span style={{ color: p.isLong ? '#10b981' : '#ef4444', fontWeight: 800, fontSize: 11 }}>{p.isLong ? 'LONG' : 'SHORT'}</span>
                                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>{fmtPrice(p.entryPrice)}</span>
                              </div>
                            </td>
                            <td style={{ color: isFinalPnlPositive ? '#10b981' : '#ef4444', verticalAlign: 'middle' }}>
                              <span style={{ fontWeight: 700, fontSize: 12, fontFamily: 'var(--mono)' }}>
                                {isFinalPnlPositive ? '+' : ''}{finalPnlPct.toFixed(2)}%
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                              {isLiquidated ? (
                                <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>LIQUIDATED</span>
                              ) : closingPositionIds.has(posId) ? (
                                <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CLOSING...</span>
                              ) : (
                                <button
                                  className="bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border border-white/5"
                                  disabled={!!p._optimistic}
                                  onClick={() => {
                                    if (p._optimistic) return;
                                    setClosingPositionIds(prev => new Set([...prev, posId]));
                                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                                      wsRef.current.send(JSON.stringify({ type: 'CLOSE_POSITION', positionId: posId, price: Math.floor(cur * 1e5) }));
                                    } else {
                                      alert('Not connected to trading server.');
                                      setClosingPositionIds(prev => { const n = new Set(prev); n.delete(posId); return n; });
                                    }
                                  }}
                                >{p._optimistic ? '...' : 'Close'}</button>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
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
                <table className={styles.tbl}>
                  <thead>
                    <tr><th>Result</th><th>Margin</th><th style={{ textAlign: 'right' }}>Side</th></tr>
                  </thead>
                  <tbody>
                    {closedPositions.slice(0, 5).map((p: any, i: any) => {
                      const posId       = p.positionId.toString();
                      const margin      = Number(p.margin) / 1e6;
                      const realizedPnl = Number(p.realizedPnL) / 1e6;
                      const pnlPct      = margin > 0 ? (realizedPnl / margin) * 100 : 0;
                      const isLiq       = p.isLiquidated || pnlPct <= -100 || wipedOutIds.has(posId);
                      const isPnlPos    = realizedPnl >= 0 && !wipedOutIds.has(posId);

                      return (
                        <tr key={i}>
                          <td style={{ verticalAlign: 'middle', padding: '8px 0' }}>
                            {isLiq ? (
                              <span style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', fontFamily: 'var(--mono)' }}>
                                LIQUIDATED
                              </span>
                            ) : (
                              <span style={{ fontSize: 12, fontWeight: 800, fontFamily: 'var(--mono)', color: isPnlPos ? '#10b981' : '#ef4444' }}>
                                {isPnlPos ? '+' : ''}{pnlPct.toFixed(2)}%
                              </span>
                            )}
                          </td>
                          <td style={{ verticalAlign: 'middle', color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                            {fmtUscc(p.margin)} USCC
                          </td>
                          <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                            <span style={{ color: p.isLong ? 'var(--blue)' : 'var(--red)', fontSize: 10, fontWeight: 700 }}>
                              {p.isLong ? 'Long' : 'Short'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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