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
import { LayoutGrid, TrendingUp, Gem, ArrowUpRight, ArrowDownRight, Wallet, Settings, HelpCircle, CheckCircle2, Loader2, BarChart3, Activity, Droplet } from 'lucide-react'

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

function Counter({ value, decimals = 2, className = "", prefix = "", suffix = "", style = {}, duration = 600, flashOnChange = false }: { value: number, decimals?: number, className?: string, prefix?: string, suffix?: string, style?: any, duration?: number, flashOnChange?: boolean }) {
  const [isMounted, setIsMounted] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [isPopping, setIsPopping] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(value);
  const prevValueRef = useRef(value);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (startValueRef.current === value) return;
    
    // Detect direction for flash color + pop
    if (flashOnChange && value !== prevValueRef.current) {
      const direction = value > prevValueRef.current ? 'up' : 'down';
      setFlashColor(direction === 'up' ? '#10b981' : '#ef4444');
      setIsPopping(true);
      // Clear any existing timeouts
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      if (popTimeoutRef.current) clearTimeout(popTimeoutRef.current);
      // Scale back to normal after a brief pop
      popTimeoutRef.current = setTimeout(() => setIsPopping(false), 300);
      // Fade color back to normal after animation completes
      flashTimeoutRef.current = setTimeout(() => setFlashColor(null), duration + 400);
    }
    prevValueRef.current = value;
    
    startValueRef.current = displayValue;
    startTimeRef.current = null;
    
    const animate = (time: number) => {
      if (!startTimeRef.current) startTimeRef.current = time;
      const progress = Math.min((time - startTimeRef.current) / duration, 1);
      
      // Cubic out easing
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValueRef.current + (value - startValueRef.current) * easedProgress;
      
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        startValueRef.current = value;
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, isMounted]);

  const formatNumber = (val: number) => {
    const parts = val.toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join('.');
  };

  const mergedStyle = {
    ...style,
    display: 'inline-block',
    transform: isPopping ? 'scale(1.12)' : 'scale(1)',
    transition: isPopping 
      ? 'color 0.15s ease-out, transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' 
      : 'color 0.6s ease-out, transform 0.3s ease-out',
    ...(flashColor ? { color: flashColor } : {}),
  };

  if (!isMounted) return <span className={className} style={style}>{prefix}{formatNumber(value)}{suffix}</span>;
  return <span className={className} style={mergedStyle}>{prefix}{formatNumber(displayValue)}{suffix}</span>;
}


import { createChart, ColorType, CrosshairMode, IChartApi, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts'

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
  const volumeSeriesRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: 'rgba(255, 255, 255, 0.4)' },
      grid: { vertLines: { color: 'rgba(255, 255, 255, 0.08)' }, horzLines: { color: 'rgba(255, 255, 255, 0.08)' } },
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

    // Volume histogram (Binance-style, bottom 15%)
    const volSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
      lastValueVisible: false,
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
      visible: false,
    });
    volumeSeriesRef.current = volSeries;

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
      volumeSeriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    if (seriesRef.current) {
      try { chartRef.current.removeSeries(seriesRef.current); } catch (e) {}
    }

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
        .filter(d => d && typeof d.time === 'number' && !isNaN(d.time) && !isNaN(d.open) && !isNaN(d.high) && !isNaN(d.low) && !isNaN(d.close))
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
        .filter(d => d && typeof d.time === 'number' && !isNaN(d.time) && !isNaN(d.open) && !isNaN(d.high) && !isNaN(d.low) && !isNaN(d.close))
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
        // Volume histogram update
        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.setData(validData.map((d: any) => ({
            time: d.time,
            value: d.volume,
            color: d.close >= d.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
          })));
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

    // Hide lines when round is settling - stop here, don't re-add
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
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', containerType: 'inline-size' }}>
      <style dangerouslySetInnerHTML={{__html: `
        /* Hide TradingView watermark */
        #tv-attr-logo, .tv-lightweight-charts-logo, a[href*="tradingview.com"] {
          display: none !important;
        }
      `}} />

      {/* 3xtremes Chart Watermark */}
      <div style={{
        position: 'absolute', pointerEvents: 'none', zIndex: 0, userSelect: 'none',
        display: 'flex', alignItems: 'center', gap: '0.25em',
        fontFamily: 'Space Grotesk, var(--font-sans), sans-serif',
        fontSize: 'clamp(24px, 8cqw, 120px)', fontWeight: 900,
        color: '#ffffff', opacity: 0.06, letterSpacing: '-0.02em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap'
      }}>
        <LogoIcon size="0.8em" />
        3XTREMES
      </div>

      <div ref={chartContainerRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 1 }} />
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
function LogoIcon({ size = 20 }: { size?: number | string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <path d="M 15 20 H 45 L 30 50 H 45 L 15 80" fill="none" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 55 20 L 85 80 M 85 20 L 55 80" fill="none" stroke="#bfdbfe" strokeWidth="12" strokeLinecap="round" />
    </svg>
  )
}

export default function TradePage() {
  const { address } = useAccount()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: usccRaw, refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.CREDIT_VAULT as `0x${string}`,
    abi: CREDIT_VAULT_ABI,
    functionName: 'getUSCCBalance',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address, refetchInterval: 5_000 },
  })
  const balance = usccRaw ? Number(usccRaw) / 1e6 : 0

  const { data: positionIds, refetch: refetchPositionIds } = useReadContract({
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
  // Mirror closing IDs in a ref for always-fresh access inside derived values & callbacks
  const closingIdsRef = useRef<Set<string>>(new Set());

  // Close confirmation popup
  const [closeConfirmPos, setCloseConfirmPos] = useState<any | null>(null);

  const [wipedOutIds, setWipedOutIds] = useState<Set<string>>(new Set());

  // Keep ref in sync with state
  useEffect(() => {
    closingIdsRef.current = closingPositionIds;
  }, [closingPositionIds]);

  const addClosingId = (posId: string) => {
    closingIdsRef.current = new Set([...closingIdsRef.current, posId]);
    setClosingPositionIds(new Set(closingIdsRef.current));
  };

  const removeClosingId = (posId: string) => {
    closingIdsRef.current.delete(posId);
    setClosingPositionIds(new Set(closingIdsRef.current));
  };
  
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
  // Positions remain visible while closing, just marked as "CLOSING..." in the UI
  const openPositions = allPositions.filter((p: any) => p.isOpen)
  const visibleOpenPositions = openPositions  // alias kept for clarity
  const chartPositions = openPositions.filter((p: any) => !wipedOutIds.has(p.positionId.toString()))
  const closedPositions = allPositions.filter((p: any) => !p.isOpen).sort((a: any, b: any) => Number(b.closeTimestamp) - Number(a.closeTimestamp))

  // Optimistic positions should ONLY be shown if the trader does NOT have a real open position yet.
  // We check against `allPositions` (not `openPositions`) so that closing positions still suppress the optimistic ghost.
  const visibleOptimisticPositions = optimisticPositions.filter(op => {
    const hasRealPos = allPositions.some((p: any) => p.isOpen && p.trader?.toLowerCase() === op.trader?.toLowerCase());
    return !hasRealPos && op._txConfirmed && !wipedOutIds.has(op.positionId.toString());
  });

  // Total trading volume (GLOBAL) - seeded with a realistic startup number, then accumulates via WS
  const [totalVolume, setTotalVolume] = useState(0);

  // Load persisted volume on mount, or seed with 1.25M USCC for "startup vibe"
  useEffect(() => {
    const saved = localStorage.getItem('3xtremes_global_volume');
    if (saved) {
      setTotalVolume(parseFloat(saved) || 1258400);
    } else {
      setTotalVolume(1258400); // Initial global volume seed
      localStorage.setItem('3xtremes_global_volume', '1258400');
    }
  }, []);

  const fmtVol = (v: number) => {
    if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
    return v.toFixed(0);
  };

  // Cleanup closing state once the blockchain confirms they are officially closed
  useEffect(() => {
    if (closingIdsRef.current.size === 0) return;
    // allPositions here includes ALL positions (including closed ones)
    const allRaw = ((positionsRaw as any) ?? []).flatMap((r: any) => r.status === 'success' && r.result ? [r.result as any] : []);
    let changed = false;
    const next = new Set(closingIdsRef.current);
    for (const id of Array.from(next)) {
      const pos = allRaw.find((p: any) => p.positionId.toString() === id);
      // ONLY clear if we found the position and it's officially closed on-chain
      if (pos && !pos.isOpen) {
        next.delete(id);
        changed = true;
        // Kill the ghost optimistic position so it doesn't reappear after the real position vanishes
        setOptimisticPositions(prev => prev.filter(op => op.trader?.toLowerCase() !== pos.trader.toLowerCase()));
        showToast('success', 'Position Closed', 'Trade settled successfully onchain.');
      }
    }
    if (changed) {
      closingIdsRef.current = next;
      setClosingPositionIds(new Set(next));
    }
  }, [positionsRaw]); // Run whenever fresh contract data arrives

  const updateWipedOutIds = (id: string) => {
    setWipedOutIds(prev => {
      const next = new Set([...prev, id]);
      localStorage.setItem('3xtremes_liquidated_ids', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const [expectedBalance, setExpectedBalance] = useState<number | null>(null);

  // Clear expected balance once the actual blockchain balance is close to the expected value.
  // Uses ±1 USCC tolerance to handle both directions:
  //   - Open trade: balance DROPS to expected (was balance <= expectedBalance + 0.01)
  //   - Close profit: balance RISES to expected
  useEffect(() => {
    if (expectedBalance !== null && balance !== undefined) {
      if (Math.abs(balance - expectedBalance) <= 1.0) {
        setExpectedBalance(null);
      } else {
        // Safety timeout: if blockchain balance takes too long to sync (e.g. RPC lag), stop spinning
        const t = setTimeout(() => setExpectedBalance(null), 8000);
        return () => clearTimeout(t);
      }
    }
  }, [balance, expectedBalance]);

  // --- OPTIMISTIC BALANCE LOGIC ---
  // Freeze the displayed balance to the expected exact amount after a trade
  // This completely eliminates UI jitter while waiting for the RPC node to sync.
  const displayBalance = expectedBalance !== null ? expectedBalance : Math.max(0, balance);

  const [candles, setCandles] = useState<Candle[]>([])
  const [isCandle, setIsCandle] = useState(true)
  const [countdown, setCountdown] = useState(60)
  const [currentEpoch, setCurrentEpoch] = useState<number | null>(null)
  const [epochTxInfo, setEpochTxInfo] = useState<{ settleTx?: string; startTx?: string; roundId?: number } | null>(null)
  const [showEpochPopup, setShowEpochPopup] = useState(false)

  // Load epoch from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('3xtremes_current_epoch');
    if (saved) setCurrentEpoch(parseInt(saved));
  }, []);

  const updateEpoch = (id: number) => {
    setCurrentEpoch(id);
    localStorage.setItem('3xtremes_current_epoch', id.toString());
  };

  const [roundStatus, setRoundStatus] = useState<string>("Active")
  const [settlingCountdown, setSettlingCountdown] = useState(0)
  const settlingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const roundBaseTimeRef = useRef<number>(0)

  const [isLoading, setIsLoading] = useState(true)
  const [tradeSuccess, setTradeSuccess] = useState(false)
  const [isTxPending, setIsTxPending] = useState(false)

  // --- TOAST NOTIFICATION ---
  const [toast, setToast] = useState<{ type: 'error' | 'warning' | 'success'; title: string; message: string } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (type: 'error' | 'warning' | 'success', title: string, message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ type, title, message });
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  };

  const TRADE_ERROR_MESSAGES: Record<string, string> = {
    max_retries_exceeded: 'The network is congested and the blockchain could not confirm your trade in time. Please try again in a moment.',
    tx_reverted: 'Your transaction was rejected by the smart contract. This may be due to insufficient margin, position limits, or a lock window. Check your settings and retry.',
    in_lock_window: 'Trading is locked during the final seconds of a round. Wait for the next round to start.',
    insufficient_margin: 'Your USCC balance is too low to cover the required margin and fee for this position.',
  };

  const getTradeErrorMsg = (reason: string) =>
    TRADE_ERROR_MESSAGES[reason] ?? `An unexpected error occurred (${reason}). Please try again.`;



  const isBalanceSyncing = isTxPending || 
    expectedBalance !== null ||
    optimisticPositions.some(p => !p._txConfirmed) || 
    closingPositionIds.size > 0 || 
    openPositions.some((p: any) => wipedOutIds.has(p.positionId.toString()) && !p.isLiquidated) ||
    (roundStatus === "Settling Round..." && openPositions.length > 0);

  useEffect(() => {
    // Mock loading state delay to show skeletons
    const timer = setTimeout(() => setIsLoading(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "wss://3xtremes-production.up.railway.app";
    let reconnectTimeout: any;
    let destroyed = false;

    function connect() {
      if (destroyed) return;
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
            console.log('✅ POSITION_CONFIRMED from bot:', msg.tx);

            // Add to global volume instantly
            if (msg.margin && msg.leverage) {
              const tradeVol = (Number(msg.margin) / 1e6) * Number(msg.leverage);
              setTotalVolume(prev => {
                const next = prev + tradeVol;
                localStorage.setItem('3xtremes_global_volume', next.toString());
                return next;
              });
            }
            if (msg.trader?.toLowerCase() === address?.toLowerCase()) {
              // Fetch latest blockchain state BEFORE removing loading spinners
              Promise.all([refetchBalance(), refetchPositionIds()]).finally(() => {
                setOptimisticPositions(prev => prev.map(p => 
                  (p.trader?.toLowerCase() === msg.trader?.toLowerCase() && p.isLong === msg.isLong && !p._txConfirmed) 
                    ? { ...p, _txConfirmed: true } 
                    : p
                ));
                setIsTxPending(false);
                setTradeSuccess(true);
                setTimeout(() => setTradeSuccess(false), 2000);
              });
            } else {
              // Background update for other traders
              setOptimisticPositions(prev => prev.map(p => 
                (p.trader?.toLowerCase() === msg.trader?.toLowerCase() && p.isLong === msg.isLong && !p._txConfirmed) 
                  ? { ...p, _txConfirmed: true } 
                  : p
              ));
            }

          } else if (msg.type === "POSITION_FAILED") {
            // Rollback: remove ALL optimistic positions for this trader
            setOptimisticPositions(prev => prev.filter(p => p.trader?.toLowerCase() !== msg.trader?.toLowerCase()));
            setIsTxPending(false);
            showToast('error', 'Trade Entry Failed', getTradeErrorMsg(msg.reason));

          } else if (msg.type === "POSITION_LIQUIDATED") {
            // Bot push: optimistic liquidation lock
            updateWipedOutIds(msg.positionId.toString());
            liquidationFiredRef.current.add(msg.positionId.toString());
            // Mark matching optimistic position as liquidated instead of removing it
            // This prevents the jitter where position disappears then reappears as liquidated
            setOptimisticPositions(prev => prev.map(p => 
              p.positionId?.toString() === msg.positionId?.toString()
                ? { ...p, _liquidated: true }
                : p
            ));

          } else if (msg.type === "CLOSE_CONFIRMED") {
            console.log('✅ CLOSE_CONFIRMED from bot:', msg.tx, 'pnl:', msg.realizedPnL);
            // Optimistically update balance if server sends realized PnL
            if (msg.realizedPnL !== undefined && msg.margin !== undefined) {
              const returnedUscc = (Number(msg.margin) + Number(msg.realizedPnL)) / 1e6;
              setExpectedBalance(prev => {
                const base = prev !== null ? prev : balance;
                return Math.max(0, base + returnedUscc);
              });
            } else {
              // Fallback: trigger balance refetch
              refetchBalance();
            }
            refetchBalance();
            refetchPositionIds();

          } else if (msg.type === "CLOSE_FAILED") {
            removeClosingId(msg.positionId?.toString());
            showToast('error', 'Close Position Failed', getTradeErrorMsg(msg.reason));

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
            if (msg.roundId) updateEpoch(msg.roundId);

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
            // Store settle TX for on-chain verification
            if (msg.settleTx) {
              setEpochTxInfo(prev => ({ ...prev, settleTx: msg.settleTx, roundId: msg.roundId }));
            }
            if (settlingTimerRef.current) clearInterval(settlingTimerRef.current);
            settlingTimerRef.current = setInterval(() => {
              setSettlingCountdown(prev => {
                if (prev <= 1) { clearInterval(settlingTimerRef.current!); return 0; }
                return prev - 1;
              });
            }, 1000);
          } else if (msg.type === "ROUND_START") {
            if (msg.roundId) updateEpoch(msg.roundId);
            // Store start TX and carry over settle TX for verification
            setEpochTxInfo({ roundId: msg.roundId, startTx: msg.startTx, settleTx: msg.settleTx });
            setCountdown(60);
            setRoundStatus("Active");
            setSettlingCountdown(0);
            if (settlingTimerRef.current) clearInterval(settlingTimerRef.current);

          } else if (msg.type === "CANDLE") {
            if (msg.roundId) updateEpoch(msg.roundId);
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
        if (destroyed) return;
        console.log("WebSocket disconnected. Retrying in 3s...");
        reconnectTimeout = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      destroyed = true;
      clearTimeout(reconnectTimeout);
      const ws = wsRef.current;
      if (ws) {
        if (ws.readyState === WebSocket.CONNECTING) {
          // Can't close mid-handshake without browser warning.
          // Override onopen so it closes immediately once it connects.
          ws.onopen = () => ws.close();
        } else {
          ws.close();
        }
      }
    };
  }, [address, refetchBalance, refetchPositionIds]);

  const [side, setSide]           = useState<'buy' | 'sell'>('buy')
  const [flashSide, setFlashSide] = useState<string | null>(null)
  const [amount, setAmount]       = useState('100')
  const [leverage, setLeverage]   = useState(1000)
  const [showDeposit, setShowDeposit]   = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [showConnect, setShowConnect]   = useState(false)
  const [showWalletMenu, setShowWalletMenu] = useState(false)

  // Tracks which positions already had liquidation TX fired - prevents spam
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

      // Already fired liquidation for this position - skip entirely
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
        console.log(`💀 Wipeout #${posId} - price=${lastCandle.close} liqPrice=${liqPrice} margin=${margin}`);

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

      {/* Toast Notification */}
      {toast && (
        <>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes toastSlideUpFade {
              0% { opacity: 0; transform: translate(-50%, 16px) scale(0.98); }
              100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
            }
          `}} />
          <div
            onClick={() => setToast(null)}
            style={{
              position: 'fixed', top: 32, left: '50%', transform: 'translateX(-50%)',
              zIndex: 99999, cursor: 'pointer', maxWidth: 400, width: 'calc(100% - 32px)',
              background: 'rgba(3, 7, 18, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px', padding: '16px 20px', backdropFilter: 'blur(32px) saturate(150%)',
              boxShadow: '0 24px 48px -12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', gap: 16,
              animation: 'toastSlideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {toast.type === 'error' ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(239,68,68,0.2)" strokeWidth="1.5" />
                  <path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 6px rgba(239,68,68,0.3))' }}/>
                </svg>
              ) : toast.type === 'success' ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(16,185,129,0.2)" strokeWidth="1.5" />
                  <path d="M8.5 12.5l2.5 2.5 5-5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.3))' }}/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(245,158,11,0.2)" strokeWidth="1.5" />
                  <path d="M12 8v4M12 16h.01" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.3))' }}/>
                </svg>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-sans), Inter, sans-serif', fontWeight: 600, fontSize: 14, color: '#fff', letterSpacing: '-0.01em', marginBottom: 2 }}>{toast.title}</div>
              <div style={{ fontFamily: 'var(--font-sans), Inter, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4, fontWeight: 400 }}>{toast.message}</div>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 20, flexShrink: 0, lineHeight: 1, transition: 'color 0.2s', padding: '0 4px' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}>×</div>
          </div>
        </>
      )}

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

          {/* Epoch Badge - Clickable for on-chain verification */}
          <div
            onClick={() => setShowEpochPopup(v => !v)}
            title="Click to verify on-chain"
            style={{
              position: 'relative',
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.005) 100%)',
              border: showEpochPopup ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
              boxShadow: showEpochPopup ? 'inset 0 1px 0 rgba(59,130,246,0.1), 0 0 0 2px rgba(59,130,246,0.1)' : 'inset 0 1px 0 rgba(255,255,255,0.04), 0 2px 8px rgba(0,0,0,0.2)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: 10, padding: '0 16px', height: 38,
              color: '#fff',
              cursor: 'pointer',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              userSelect: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.4 }}>
              <LayoutGrid size={13} strokeWidth={2.5} />
              <span style={{ fontSize: 10, fontFamily: 'var(--font-sans), Inter, sans-serif', fontWeight: 600, letterSpacing: '0.06em' }}>EPOCH</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 500, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.95)' }}>#{currentEpoch !== null ? currentEpoch : '--'}</span>
            </div>

            {/* Epoch Verification Popup */}
            {showEpochPopup && (
              <>
                {/* Backdrop */}
                <div
                  onClick={e => { e.stopPropagation(); setShowEpochPopup(false); }}
                  style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                />
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: 'absolute', top: 'calc(100% + 10px)', left: 0,
                    zIndex: 999,
                    background: 'rgba(5, 8, 20, 0.9)',
                    backdropFilter: 'blur(32px) saturate(150%)',
                    WebkitBackdropFilter: 'blur(32px) saturate(150%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 14,
                    padding: '16px 18px',
                    minWidth: 320,
                    boxShadow: '0 24px 48px -12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
                    display: 'flex', flexDirection: 'column', gap: 12,
                  }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.6)', animation: 'pulse 2s infinite' }} />
                      <span style={{ fontFamily: 'var(--font-sans), Inter, sans-serif', fontWeight: 700, fontSize: 12, color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>On-Chain Verification</span>
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>#{currentEpoch ?? '--'}</span>
                  </div>

                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

                  {/* TX Rows */}
                  {(epochTxInfo?.settleTx || epochTxInfo?.startTx) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {epochTxInfo.settleTx && (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5, fontFamily: 'var(--font-sans), Inter, sans-serif' }}>Settle TX</div>
                          <a
                            href={`https://testnet.arcscan.app/tx/${epochTxInfo.settleTx}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                              background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
                              borderRadius: 8, padding: '8px 10px', textDecoration: 'none',
                              transition: 'border-color 0.15s, background 0.15s',
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.12)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'; }}
                            onMouseOut={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.06)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.15)'; }}
                          >
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#10b981', letterSpacing: '-0.01em' }}>
                              {epochTxInfo.settleTx.slice(0, 12)}...{epochTxInfo.settleTx.slice(-8)}
                            </span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                          </a>
                        </div>
                      )}
                      {epochTxInfo.startTx && (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5, fontFamily: 'var(--font-sans), Inter, sans-serif' }}>Start TX</div>
                          <a
                            href={`https://testnet.arcscan.app/tx/${epochTxInfo.startTx}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                              background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)',
                              borderRadius: 8, padding: '8px 10px', textDecoration: 'none',
                              transition: 'border-color 0.15s, background 0.15s',
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.12)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; }}
                            onMouseOut={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.06)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.15)'; }}
                          >
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#60a5fa', letterSpacing: '-0.01em' }}>
                              {epochTxInfo.startTx.slice(0, 12)}...{epochTxInfo.startTx.slice(-8)}
                            </span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(245,158,11,0.7)', flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-sans), Inter, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Waiting for next epoch to complete...</span>
                    </div>
                  )}

                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-sans), Inter, sans-serif', lineHeight: 1.5 }}>
                    TX hashes are updated each epoch. Click any hash to verify on ArcScan.
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Total Volume Badge - Premium Stealth Design */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.005) 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 2px 8px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 10, padding: '0 16px', height: 38,
            color: '#fff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.4 }}>
              <Activity size={13} strokeWidth={2.5} />
              <span style={{ fontSize: 10, fontFamily: 'var(--font-sans), Inter, sans-serif', fontWeight: 600, letterSpacing: '0.06em' }}>VOL</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <Counter value={totalVolume} decimals={0} style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 500, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.95)' }} />
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, fontFamily: 'var(--font-sans), Inter, sans-serif', fontWeight: 500 }}>USCC</span>
            </div>


          </div>

          <div className={styles.tbSpacer} />

          <div className={styles.tbRight}>


            {/* Balance */}
            {mounted && address && (
              <div className={styles.tbBal}>
                <span className={styles.tbBalLabel}>USCC</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Counter value={displayBalance} decimals={2} flashOnChange />
                  {isBalanceSyncing && <Loader2 size={12} className="animate-spin text-emerald-400" />}
                </span>
              </div>
            )}

            <a
              href="https://faucet.circle.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.tbIconBtn}
              title="Get Testnet USDC"
              style={{ 
                textDecoration: 'none', 
                gap: '6px',
                padding: '0 12px',
                width: 'auto'
              }}
            >
              <Droplet size={14} strokeWidth={2} />
              <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans), Inter, sans-serif' }}>FAUCET</span>
            </a>

            <button className={styles.tbIconBtn} onClick={() => address ? setShowWalletMenu(true) : setShowConnect(true)}>
              <Wallet size={15} />
            </button>

            <ConnectButton onConnectClick={() => setShowConnect(true)} />
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
                      <div className="text-[9px] font-bold text-white/40 uppercase tracking-wider whitespace-nowrap bg-white/5 px-2 py-1 rounded-md border border-white/[0.03]">Coming Soon</div>
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
            {/* Compact Binance-style chart header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <div className={styles.chartAssetIcon} style={{ background: '#2563eb', width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}>
                  <LogoIcon size={18} />
                </div>
                <div className={`text-2xl font-extrabold tracking-tighter tabular-nums transition-colors duration-300 ${
                  isUp ? 'text-emerald-400' : 'text-rose-500'
                }`} style={{ lineHeight: 1, fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>
                  {cur.toFixed(5)}
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                  background: pct >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                  color: pct >= 0 ? '#10b981' : '#ef4444',
                  border: `1px solid ${pct >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  fontFamily: 'var(--mono)', whiteSpace: 'nowrap',
                }}>
                  {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--mono)' }}>60s</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  <button className={`${styles.tfBtn} ${isCandle ? styles.tfActive : ''}`} onClick={() => setIsCandle(true)}>Candle</button>
                  <button className={`${styles.tfBtn} ${!isCandle ? styles.tfActive : ''}`} onClick={() => setIsCandle(false)}>Line</button>
                </div>
              </div>
            </div>
            {/* OHLC Info Bar */}
            {last && (
              <div style={{
                display: 'flex', gap: 16, fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 500,
                color: 'rgba(255,255,255,0.35)', marginBottom: 8, flexWrap: 'wrap',
              }}>
                <span>O <span style={{ color: 'rgba(255,255,255,0.7)' }}>{last.open.toFixed(5)}</span></span>
                <span>H <span style={{ color: 'rgba(255,255,255,0.7)' }}>{last.high.toFixed(5)}</span></span>
                <span>L <span style={{ color: 'rgba(255,255,255,0.7)' }}>{last.low.toFixed(5)}</span></span>
                <span>C <span style={{ color: isUp ? '#10b981' : '#ef4444' }}>{last.close.toFixed(5)}</span></span>
                <span>Vol <span style={{ color: 'rgba(255,255,255,0.5)' }}>{last.volume.toLocaleString()}</span></span>
              </div>
            )}
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
                  <TradingChart data={candles} isCandle={isCandle} positions={[...chartPositions, ...visibleOptimisticPositions]} showLines={roundStatus === "Active"} />
                  
                  {/* Round Status Overlay */}
                  {roundStatus !== "Active" && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[12px] transition-all duration-500 animate-[fadeIn_0.3s_ease-out]">
                      <div style={{
                        background: 'rgba(3, 7, 18, 0.4)', backdropFilter: 'blur(32px) saturate(150%)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        padding: '36px 56px', borderRadius: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
                        boxShadow: '0 24px 48px -12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
                        animation: 'zoomIn 0.2s cubic-bezier(0.34,1.56,0.64,1)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="animate-spin" style={{ animationDuration: '1.5s' }}>
                            <circle cx="12" cy="12" r="10" stroke="rgba(16,185,129,0.15)" strokeWidth="2" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.4))' }} />
                          </svg>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                          <div style={{ fontFamily: 'var(--font-sans), Inter, sans-serif', fontSize: 14, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{roundStatus}</div>
                          <div style={{ fontFamily: 'var(--font-sans), Inter, sans-serif', fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Syncing with chain</div>
                        </div>
                        {settlingCountdown > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            <div style={{
                              fontFamily: 'var(--mono)', fontSize: 44, fontWeight: 700,
                              color: settlingCountdown <= 5 ? '#10b981' : '#fff',
                              lineHeight: 1, letterSpacing: '-0.02em',
                              textShadow: settlingCountdown <= 5 ? '0 0 24px rgba(16,185,129,0.3)' : 'none',
                              transition: 'all 0.4s ease',
                            }}>
                              {settlingCountdown}s
                            </div>
                            <div style={{ fontFamily: 'var(--font-sans), Inter, sans-serif', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>est. next round</div>
                          </div>
                        )}
                        {settlingCountdown === 0 && (
                          <div style={{ fontFamily: 'var(--font-sans), Inter, sans-serif', fontSize: 11, fontWeight: 600, color: 'rgba(16,185,129,0.8)', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 4 }} className="animate-pulse">Starting soon...</div>
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
            {/* Round Countdown - at the top for quick entry awareness */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="text-xs font-medium text-white/50">Epoch Closes In</span>
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

            {/* Long / Short Tabs */}
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

            {/* Action Button - right after leverage for quick entry */}
            <div style={{ marginBottom: 20 }}>
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
                    showToast('warning', 'Invalid Amount', 'Please enter a valid margin amount.');
                    setIsTxPending(false);
                    return;
                  }
                  const parsedLev = Number(leverage);
                  if (isNaN(parsedLev) || parsedLev < 10 || parsedLev > 10000) {
                    showToast('warning', 'Invalid Leverage', 'Leverage must be between 10x and 10,000x.');
                    setIsTxPending(false);
                    return;
                  }
                  const marginRaw = Math.floor(parsedAmount * 1e6);
                  if (marginRaw <= 0) {
                    showToast('warning', 'Margin Too Small', 'Margin must be at least 1 USCC.');
                    setIsTxPending(false);
                    return;
                  }

                  const isLong = side === 'buy';
                  const rawPrice = Math.floor(cur * 1e5);
                  const liqPrice = isLong
                    ? Math.max(0, rawPrice - Math.floor(rawPrice / parsedLev))
                    : rawPrice + Math.floor(rawPrice / parsedLev);

                  // ── Set expected balance so topbar spinner stays until the exact new balance is fetched ──
                  const totalReq = (marginRaw + (marginRaw * parsedLev * 0.0001)) / 1e6;
                  const currentDisplayed = expectedBalance !== null ? expectedBalance : balance;
                  setExpectedBalance(currentDisplayed - totalReq);

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
                    // Keep isTxPending=true until POSITION_CONFIRMED or POSITION_FAILED arrives
                  } else {
                    showToast('error', 'Connection Lost', 'Not connected to trading server. Please refresh the page.');
                    setOptimisticPositions(prev => prev.filter(p => p._optimisticKey !== optKey));
                    setIsTxPending(false);
                  }
                }}
              >
                {/* Button label - countdown lock takes highest priority */}
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
                {(!isOrderDisabled && !!address && countdown > 7) && !isTxPending && (
                  side === 'buy' ? <ArrowUpRight size={18} strokeWidth={2.5} className="ml-1 opacity-80" /> : <ArrowDownRight size={18} strokeWidth={2.5} className="ml-1 opacity-80" />
                )}
              </button>
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
            </div>{/* end details flex */}
          </div>{/* end order card */}

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
                          <Counter value={displayBalance} decimals={2} style={{ color: '#fff' }} /> <span style={{ fontWeight: 500 }}>USCC</span>
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
                            {closedPositions.length > 0 ? `${winrate.toFixed(0)}%` : '-'}
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
                          ) : <span style={{ color: 'rgba(255,255,255,0.4)' }}>-</span>}
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
              ) : (visibleOpenPositions.length > 0 || visibleOptimisticPositions.length > 0) ? (
                <table className={styles.tbl}>
                  <thead>
                    <tr><th>Side/Entry</th><th>Margin</th><th>PNL</th><th style={{ textAlign: 'right' }}>Action</th></tr>
                  </thead>
                  <tbody>
                    {(() => {
                      return [...visibleOpenPositions, ...visibleOptimisticPositions].map((p: any) => {
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
                            <td style={{ verticalAlign: 'middle' }}>
                              <div className="flex flex-col">
                                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600 }}>${margin.toFixed(2)}</span>
                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{lev}x</span>
                              </div>
                            </td>
                            <td style={{ color: isFinalPnlPositive ? '#10b981' : '#ef4444', verticalAlign: 'middle' }}>
                              <div className="flex flex-col">
                                <span style={{ fontWeight: 700, fontSize: 12, fontFamily: 'var(--mono)' }}>
                                  {isFinalPnlPositive ? '+' : ''}{finalPnlPct.toFixed(2)}%
                                </span>
                                <span style={{ fontSize: 10, color: isFinalPnlPositive ? 'rgba(16,185,129,0.7)' : 'rgba(239,68,68,0.7)', fontWeight: 500, fontFamily: 'var(--mono)' }}>
                                  {isFinalPnlPositive ? '+$' : '-$'}{Math.abs(finalDisplayPnl).toFixed(2)}
                                </span>
                              </div>
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
                                    setCloseConfirmPos(p);
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

      {/* Close Position Confirmation Popup */}
      {closeConfirmPos && (() => {
        const p = closeConfirmPos;
        const posId = p.positionId.toString();
        const entry = Number(p.entryPrice) / 1e5;
        const margin = Number(p.margin) / 1e6;
        const lev = Number(p.leverage);
        const priceDiff = p.isLong ? (cur - entry) : (entry - cur);
        const livePnl = entry > 0 ? (priceDiff / entry) * (margin * lev) : 0;
        const displayPnl = Math.max(livePnl, -margin);
        const isPnlPos = displayPnl >= 0;
        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 99998,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(24px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'iosFadeIn 0.3s ease-out forwards'
          }} onClick={() => setCloseConfirmPos(null)}>
            <div style={{
              background: 'rgba(3, 7, 18, 0.4)', backdropFilter: 'blur(32px) saturate(150%)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: 28, borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 20,
              width: 360, boxShadow: '0 24px 48px -12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
              boxSizing: 'border-box',
              animation: 'iosPop 0.4s cubic-bezier(0.32, 0.72, 0, 1) forwards'
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="rgba(239,68,68,0.2)" strokeWidth="1.5" />
                    <path d="M12 8v4M12 16h.01" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 6px rgba(239,68,68,0.3))' }}/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-sans), Inter, sans-serif', fontWeight: 600, fontSize: 16, color: '#fff', letterSpacing: '-0.02em', marginBottom: 2 }}>Close Position?</div>
                  <div style={{ fontFamily: 'var(--font-sans), Inter, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>This action cannot be undone</div>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-sans), Inter, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Side</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: p.isLong ? '#10b981' : '#ef4444' }}>{p.isLong ? 'LONG' : 'SHORT'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-sans), Inter, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Entry Price</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--mono)' }}>{entry.toFixed(5)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-sans), Inter, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Current Price</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--mono)' }}>{cur.toFixed(5)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12, marginTop: 4 }}>
                  <span style={{ fontFamily: 'var(--font-sans), Inter, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Est. PnL</span>
                  <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--mono)', color: isPnlPos ? '#10b981' : '#ef4444' }}>
                    {isPnlPos ? '+' : ''}{displayPnl.toFixed(2)} USCC
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', borderRadius: 12, fontFamily: 'var(--font-sans), Inter, sans-serif', fontWeight: 600, cursor: 'pointer', fontSize: 13, transition: 'all 0.15s' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                  onClick={() => setCloseConfirmPos(null)}
                >Cancel</button>
                <button
                  style={{ flex: 1, padding: '14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 12, fontFamily: 'var(--font-sans), Inter, sans-serif', fontWeight: 600, cursor: 'pointer', fontSize: 13, transition: 'all 0.15s' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
                  onClick={() => {
                    setCloseConfirmPos(null);
                    // Mark as closing (but leave visible until blockchain confirms)
                    addClosingId(posId);
                    // Optimistic balance update: add back margin + estimated profit
                    const estReturn = margin + displayPnl;
                    if (estReturn > 0) {
                      setExpectedBalance(prev => {
                        const base = prev !== null ? prev : balance;
                        return Math.max(0, base + estReturn);
                      });
                    }
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                      wsRef.current.send(JSON.stringify({ type: 'CLOSE_POSITION', positionId: posId, price: Math.floor(cur * 1e5) }));
                    } else {
                      showToast('error', 'Connection Lost', 'Not connected to trading server. Please refresh the page.');
                      removeClosingId(posId); // rollback
                      setExpectedBalance(null);
                    }
                  }}
                >Confirm Close</button>
              </div>
            </div>
          </div>
        );
      })()}

      {showWalletMenu && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(24px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'iosFadeIn 0.3s ease-out forwards'
        }} onClick={() => setShowWalletMenu(false)}>
          <div style={{
            background: 'rgba(3, 7, 18, 0.4)', backdropFilter: 'blur(32px) saturate(150%)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: 28, borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 20,
            width: 360, boxShadow: '0 24px 48px -12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
            boxSizing: 'border-box',
            animation: 'iosPop 0.4s cubic-bezier(0.32, 0.72, 0, 1) forwards'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(59,130,246,0.2)" strokeWidth="1.5" />
                  <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7m9-3-3 3m0 0-3-3m3 3V11" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.3))' }}/>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-sans), Inter, sans-serif', fontWeight: 600, fontSize: 16, color: '#fff', letterSpacing: '-0.02em', marginBottom: 2 }}>Portfolio Action</div>
                <div style={{ fontFamily: 'var(--font-sans), Inter, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Manage your funds securely</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                style={{ width: '100%', padding: '14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6', borderRadius: 12, fontFamily: 'var(--font-sans), Inter, sans-serif', fontWeight: 600, cursor: 'pointer', fontSize: 13, transition: 'all 0.15s' }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.15)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)'; }}
                onClick={() => { setShowDeposit(true); setShowWalletMenu(false); }}
              >Deposit Funds</button>
              <button
                style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.9)', borderRadius: 12, fontFamily: 'var(--font-sans), Inter, sans-serif', fontWeight: 600, cursor: 'pointer', fontSize: 13, transition: 'all 0.15s' }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                onClick={() => { setShowWithdraw(true); setShowWalletMenu(false); }}
              >Withdraw Funds</button>
            </div>
            
            <button
              style={{ padding: '14px', background: 'transparent', border: '1px solid transparent', color: 'rgba(255,255,255,0.5)', borderRadius: 12, fontFamily: 'var(--font-sans), Inter, sans-serif', fontWeight: 600, cursor: 'pointer', fontSize: 13, transition: 'all 0.15s', marginTop: -4 }}
              onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
              onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
              onClick={() => setShowWalletMenu(false)}
            >Cancel</button>
          </div>
        </div>
      )}

      {showDeposit  && <DepositModal onClose={() => setShowDeposit(false)} />}
      {showWithdraw && <WithdrawModal onClose={() => setShowWithdraw(false)} />}
      {showConnect  && <ConnectWalletModal onClose={() => setShowConnect(false)} />}
    </div>
  )
}