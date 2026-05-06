const fs = require('fs');

const css = `
/* ═══════════════════════════════════════
   TRADEFLARE REPLICA — EXACT PIXEL MATCH
   ═══════════════════════════════════════ */

:root {
  --bg: #0d0f14;
  --panel: #161821;
  --panel-glass: rgba(22, 24, 33, 0.7);
  --border: rgba(255,255,255,0.04);
  --border-light: rgba(255,255,255,0.08);
  --green: #00e676;
  --green-glow: rgba(0, 230, 118, 0.3);
  --green-bg: rgba(0, 230, 118, 0.15);
  --red: #ff3b30;
  --red-bg: rgba(255, 59, 48, 0.15);
  --text: #ffffff;
  --text-muted: rgba(255,255,255,0.4);
  --font: 'Inter', sans-serif;
  --mono: 'JetBrains Mono', monospace;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

.root {
  display: flex;
  height: 100vh;
  background: var(--bg);
  background-image: radial-gradient(circle at 50% 0%, rgba(30, 25, 50, 0.2) 0%, transparent 60%);
  color: var(--text);
  font-family: var(--font);
  font-size: 13px;
  overflow: hidden;
  padding: 16px;
  gap: 16px;
}

/* ── SIDEBAR (Floating Pill) ── */
.sidebar {
  width: 68px;
  flex-shrink: 0;
  background: var(--panel);
  border-radius: 34px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
  gap: 24px;
  border: 1px solid var(--border);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  z-index: 10;
}
.sidebarLogo {
  width: 44px; height: 44px;
  border-radius: 50%;
  background: var(--green);
  color: #000;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 20px var(--green-glow);
  cursor: pointer;
  margin-bottom: 8px;
}
.sidebarLogo svg { width: 20px; height: 20px; }

.navBtn {
  width: 40px; height: 40px;
  border-radius: 12px; border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.navBtn svg { width: 20px; height: 20px; fill: currentColor; }
.navBtn:hover { color: #fff; background: rgba(255,255,255,0.05); }
.navActive { background: var(--green-bg) !important; color: var(--green) !important; }

/* ── MAIN CONTENT ── */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

/* ── TOPBAR ── */
.topbar {
  display: flex;
  align-items: center;
  height: 56px;
  flex-shrink: 0;
  gap: 16px;
  padding: 0 8px;
}
.brand {
  font-size: 20px;
  font-weight: 800;
  color: var(--green);
  letter-spacing: 0.5px;
  display: flex; align-items: center; gap: 8px;
}

.tbSearch {
  display: flex; align-items: center; gap: 10px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 0 16px;
  height: 40px;
  width: 320px;
  margin-left: 24px;
}
.tbSearch input {
  background: none; border: none; outline: none;
  color: #fff; font-size: 13px; width: 100%;
}
.tbSearch input::placeholder { color: var(--text-muted); }

.tbSpacer { flex: 1; }

.tbRight {
  display: flex; align-items: center; gap: 16px;
}
.iconBtn {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: var(--panel);
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  color: var(--text-muted); cursor: pointer;
}
.tbBal {
  display: flex; align-items: center; gap: 10px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 6px 16px;
  height: 40px;
}
.tbBalVal { font-size: 14px; font-weight: 700; color: #fff; }

.currencySel {
  display: flex; align-items: center; gap: 6px;
  font-weight: 600; color: var(--text-muted);
}
.profile {
  display: flex; align-items: center; gap: 12px;
  background: transparent;
  padding: 4px 12px 4px 4px;
  border-radius: 24px;
}
.avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: #333; object-fit: cover;
}
.profileText { display: flex; flex-direction: column; }
.profileName { font-size: 13px; font-weight: 600; }
.profileAddr { font-size: 11px; color: var(--text-muted); font-family: var(--mono); }

/* ── BODY GRID ── */
.body {
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  grid-template-rows: minmax(0, 1fr) 280px;
  gap: 16px;
  min-height: 0;
}

/* ── CARD STYLE ── */
.card {
  background: var(--panel-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 20px;
  border: 1px solid var(--border);
  box-shadow: 0 12px 32px rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── MARKETS CARD (Col 1, Row 1) ── */
.marketsCard { grid-column: 1; grid-row: 1; padding: 16px 0; }

.segmentedTabs {
  display: flex;
  background: rgba(0,0,0,0.3);
  border-radius: 12px;
  padding: 4px;
  margin: 0 16px 16px;
  border: 1px solid var(--border);
}
.segTab {
  flex: 1;
  padding: 8px 0;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.segTabActive {
  background: rgba(255,255,255,0.08);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.coinList { flex: 1; overflow-y: auto; padding: 0 8px; }
.coinList::-webkit-scrollbar { width: 0; }
.coinRow {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 16px;
  cursor: pointer;
  transition: background 0.2s;
  gap: 12px;
}
.coinRow:hover { background: rgba(255,255,255,0.03); }
.coinIcon {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}
.coinIcon img { width: 100%; height: 100%; border-radius: 10px; }
.coinInfo { flex: 1; }
.coinName { font-weight: 600; font-size: 14px; color: #fff; margin-bottom: 2px; }
.coinSub { font-size: 11px; color: var(--text-muted); font-weight: 500; }
.coinPriceWrap { text-align: right; }
.coinPrice { font-weight: 600; font-size: 14px; color: #fff; font-family: var(--mono); margin-bottom: 2px; }
.coinChg { font-size: 11px; font-weight: 600; }
.textGreen { color: var(--green); }
.textRed { color: var(--red); }

/* ── CHART CARD (Col 2, Row 1) ── */
.chartCard { grid-column: 2; grid-row: 1; padding: 24px; position: relative; }
.chartHeaderTop {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
}
.chartAssetInfo { display: flex; align-items: center; gap: 12px; }
.chartAssetIcon { width: 44px; height: 44px; border-radius: 12px; }
.chartAssetIcon img { width: 100%; height: 100%; border-radius: 12px; }
.chartTitle { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 4px; }
.chartPriceRow { display: flex; align-items: center; gap: 10px; }
.chartPrice { font-size: 20px; font-weight: 700; font-family: var(--mono); color: #fff; }
.chartBadge {
  background: var(--green-bg); color: var(--green);
  padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 700;
}

.chartStats { display: flex; gap: 24px; }
.chartStatBox { display: flex; flex-direction: column; gap: 4px; }
.chartStatVal { font-size: 14px; font-weight: 600; color: #fff; font-family: var(--mono); }
.chartStatVal.green { color: var(--green); }
.chartStatLbl { font-size: 11px; color: var(--text-muted); font-weight: 500; }

.chartToolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.tfGroup { display: flex; gap: 4px; }
.tfBtn {
  background: transparent; border: none; color: var(--text-muted);
  padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.tfActive { background: rgba(255,255,255,0.08); color: #fff; }
.chartTypeToggle { display: flex; background: rgba(0,0,0,0.3); border-radius: 8px; padding: 2px; }
.ctBtn { padding: 4px 12px; font-size: 11px; font-weight: 600; border-radius: 6px; border: none; background: transparent; color: var(--text-muted); cursor: pointer; }
.ctActive { background: var(--green); color: #000; }

.chartWrap { flex: 1; position: relative; border-radius: 16px; overflow: hidden; }

/* ── CREATE ORDER CARD (Col 3, Row 1) ── */
.orderCard { grid-column: 3; grid-row: 1; padding: 24px; }
.orderTitle { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 20px; }

.buySellToggle { display: flex; margin-bottom: 20px; position: relative; }
.bsBtn {
  flex: 1; padding: 12px; font-size: 13px; font-weight: 700;
  border: none; cursor: pointer; transition: all 0.2s; background: transparent;
}
.bsBuy { color: var(--text-muted); }
.bsBuy.active { color: #fff; }
.bsBuy.active::after { content: ''; position: absolute; bottom: 0; left: 0; width: 50%; height: 2px; background: var(--green); box-shadow: 0 -2px 10px var(--green-glow); }
.bsSell { color: var(--text-muted); }
.bsSell.active { color: #fff; }
.bsSell.active::after { content: ''; position: absolute; bottom: 0; left: 50%; width: 50%; height: 2px; background: var(--red); box-shadow: 0 -2px 10px rgba(255,59,48,0.3); }

.assetSelector {
  display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
}
.assetIconSmall { width: 24px; height: 24px; border-radius: 50%; background: #f59e0b; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; color: #fff; }
.assetName { font-weight: 600; font-size: 14px; }
.assetRate { margin-left: auto; font-size: 12px; color: var(--text-muted); font-family: var(--mono); }

.inputGroup { margin-bottom: 16px; }
.inputLabel { font-size: 11px; font-weight: 500; color: var(--text-muted); margin-bottom: 8px; display: block; }
.inputWrap {
  background: rgba(0,0,0,0.2);
  border: 1px solid var(--border);
  border-radius: 12px;
  display: flex; align-items: center;
  padding: 12px 16px;
  transition: border-color 0.2s;
}
.inputWrap:focus-within { border-color: rgba(255,255,255,0.15); }
.inputWrap input {
  background: none; border: none; outline: none; flex: 1; color: #fff; font-size: 14px; font-weight: 600; font-family: var(--mono); width: 100%;
}
.inputSuffix { color: var(--green); font-size: 12px; font-weight: 700; background: var(--green-bg); padding: 4px 8px; border-radius: 6px; }
.inputSuffixBTC { color: #f59e0b; background: rgba(245, 158, 11, 0.15); font-size: 12px; font-weight: 700; padding: 4px 8px; border-radius: 6px; }

.totalRow { display: flex; justify-content: space-between; align-items: center; margin: 32px 0 20px; padding-top: 20px; border-top: 1px solid var(--border); }
.totalLabel { font-size: 15px; font-weight: 600; color: #fff; }
.totalVal { font-size: 20px; font-weight: 700; color: var(--green); font-family: var(--mono); }

.placeBtn {
  width: 100%; padding: 16px; border-radius: 14px; border: none;
  background: var(--green); color: #000; font-size: 15px; font-weight: 800;
  cursor: pointer; box-shadow: 0 4px 24px var(--green-glow);
  transition: all 0.2s; margin-top: auto;
}
.placeBtn:hover { transform: translateY(-1px); box-shadow: 0 6px 32px rgba(0,230,118,0.4); }

/* ── BOTTOM PANELS ── */
.runningTradeCard { grid-column: 1; grid-row: 2; padding: 20px; }
.orderBookCard { grid-column: 2; grid-row: 2; padding: 20px; }
.myOrderCard { grid-column: 3; grid-row: 2; padding: 20px; display: flex; flex-direction: column; gap: 16px; }

.cardTitle { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
.viewAll { font-size: 12px; color: var(--green); cursor: pointer; font-weight: 600; }

/* Tables */
.tableWrap { overflow-y: auto; flex: 1; }
.tableWrap::-webkit-scrollbar { width: 0; }
.table { width: 100%; border-collapse: collapse; }
.table th {
  text-align: left; font-size: 11px; font-weight: 500; color: var(--text-muted);
  padding-bottom: 16px; border-bottom: 1px solid var(--border);
}
.table td {
  padding: 10px 0; font-size: 12px; font-family: var(--mono); color: rgba(255,255,255,0.8);
  font-weight: 500;
}
.table tr:hover td { color: #fff; }

.obRow { display: flex; align-items: center; padding: 4px 0; position: relative; z-index: 1; }
.obBgGreen { position: absolute; right: 0; top: 0; bottom: 0; background: rgba(0,230,118,0.08); z-index: -1; }
.obBgRed { position: absolute; left: 0; top: 0; bottom: 0; background: rgba(255,59,48,0.08); z-index: -1; }

.orderItem {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px; background: rgba(0,0,0,0.2); border-radius: 12px; border: 1px solid var(--border);
  font-family: var(--mono); font-size: 12px; font-weight: 500;
}
.orderItem.filled { background: var(--green-bg); border-color: rgba(0,230,118,0.2); }
.oiClose { color: var(--text-muted); cursor: pointer; font-size: 14px; }
.oiClose:hover { color: #fff; }

.actionBtn {
  background: var(--red-bg); color: var(--red); border: none;
  padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.actionBtn:hover { background: rgba(255,59,48,0.25); }

.emptyText { font-size: 13px; color: var(--text-muted); text-align: center; padding: 32px; font-weight: 500; }
`;

fs.writeFileSync('/home/yaelah/Downloads/3xtremes/frontend/app/trade/trade.module.css', css);

const tsx = `
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import styles from './trade.module.css'

export default function TradePage() {
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  
  return (
    <div className={styles.root}>
      {/* ── SIDEBAR ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <svg viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z"/></svg>
        </div>
        <button className={\`\${styles.navBtn} \${styles.navActive}\`}><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></button>
        <button className={styles.navBtn}><svg viewBox="0 0 24 24"><path d="M3 3h18v18H3z"/></svg></button>
        <button className={styles.navBtn}><svg viewBox="0 0 24 24"><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/></svg></button>
        <button className={styles.navBtn}><svg viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z"/></svg></button>
        <div style={{flex:1}} />
        <button className={styles.navBtn}><svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.58-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41L9.25 5.35C8.66 5.59 8.12 5.92 7.63 6.29L5.24 5.33c-.22-.08-.47 0-.59.22L2.73 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.58.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .43-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.49-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg></button>
      </aside>

      {/* ── MAIN ── */}
      <div className={styles.main}>
        {/* TOPBAR */}
        <header className={styles.topbar}>
          <div className={styles.brand}>TRADEFLARE</div>
          <div className={styles.tbSearch}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input placeholder="Search" />
          </div>
          <div className={styles.tbSpacer} />
          
          <div className={styles.tbRight}>
            <button className={styles.iconBtn}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></button>
            <div className={styles.tbBal}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
              <span className={styles.tbBalVal}>$189,932.33</span>
            </div>
            <div className={styles.currencySel}>USD <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg></div>
            <div className={styles.profile}>
              <div className={styles.profileText} style={{ textAlign: 'right' }}>
                <span className={styles.profileName}>Diane Littel</span>
                <span className={styles.profileAddr}>0x4cB6...cdKF</span>
              </div>
              <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" className={styles.avatar} alt="Profile" />
            </div>
          </div>
        </header>

        {/* BODY */}
        <div className={styles.body}>
          {/* COL 1: Markets */}
          <div className={\`\${styles.card} \${styles.marketsCard}\`}>
            <div className={styles.segmentedTabs}>
              <div className={\`\${styles.segTab} \${styles.segTabActive}\`}>Movement</div>
              <div className={styles.segTab}>Volume</div>
            </div>
            <div className={styles.coinList}>
              {[
                { n: 'Bitcoin', s: 'BTC', p: '65,173.42', c: '+13.40%', up: true, bg: '#f59e0b', ic: '₿' },
                { n: 'Ethereum', s: 'ETH', p: '3,428.50', c: '-5.92%', up: false, bg: '#627eea', ic: 'Ξ' },
                { n: 'Litecoin', s: 'LTC', p: '94.92', c: '-26.83%', up: false, bg: '#345d9d', ic: 'Ł' },
                { n: 'Solana', s: 'SOL', p: '175.03', c: '+1.94%', up: true, bg: '#9945ff', ic: 'S' },
                { n: 'Binance', s: 'BNB', p: '614.35', c: '+52.08%', up: true, bg: '#f3ba2f', ic: 'B' },
                { n: 'Cardano', s: 'ADA', p: '0.56', c: '-3.23%', up: false, bg: '#0033ad', ic: 'A' },
              ].map(c => (
                <div key={c.n} className={styles.coinRow}>
                  <div className={styles.coinIcon} style={{background: c.bg, color: '#fff', fontWeight: 'bold', fontSize: 16}}>{c.ic}</div>
                  <div className={styles.coinInfo}>
                    <div className={styles.coinName}>{c.n}</div>
                    <div className={styles.coinSub}>{c.s}</div>
                  </div>
                  <div className={styles.coinPriceWrap}>
                    <div className={styles.coinPrice}>$\{c.p\}</div>
                    <div className={\`\${styles.coinChg} \${c.up ? styles.textGreen : styles.textRed}\`}>
                      {c.up ? '▲' : '▼'} {c.c}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COL 2: Chart */}
          <div className={\`\${styles.card} \${styles.chartCard}\`}>
            <div className={styles.chartHeaderTop}>
              <div className={styles.chartAssetInfo}>
                <div className={styles.chartAssetIcon} style={{background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#fff', fontWeight: 'bold'}}>₿</div>
                <div>
                  <div className={styles.chartTitle}>Bitcoin</div>
                  <div className={styles.chartPriceRow}>
                    <span className={styles.chartPrice}>$65,173</span>
                    <span className={styles.chartBadge}>▲ +13.40%</span>
                  </div>
                </div>
              </div>
              <div className={styles.chartStats} style={{marginLeft: 'auto'}}>
                <div className={styles.chartStatBox}>
                  <span className={\`\${styles.chartStatVal} \${styles.green}\`}>+$1,938.94</span>
                  <span className={styles.chartStatLbl}>24 Hours Movement</span>
                </div>
                <div className={styles.chartStatBox}>
                  <span className={styles.chartStatVal}>$27,965,324,755</span>
                  <span className={styles.chartStatLbl}>24 Hours Volume</span>
                </div>
              </div>
            </div>
            
            <div className={styles.chartToolbar}>
              <div className={styles.tfGroup}>
                {['1D','7D','1M','3M','1Y','All'].map((t,i) => (
                  <button key={t} className={\`\${styles.tfBtn} \${i===1 ? styles.tfActive : ''}\`}>{t}</button>
                ))}
              </div>
              <div className={styles.chartTypeToggle}>
                <button className={\`\${styles.ctBtn} \${styles.ctActive}\`}>Line</button>
                <button className={styles.ctBtn}>Candle</button>
              </div>
            </div>

            <div className={styles.chartWrap}>
              {/* Decorative Chart SVG to perfectly match screenshot */}
              <svg width="100%" height="100%" viewBox="0 0 600 300" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(0,230,118,0.2)" />
                    <stop offset="100%" stopColor="rgba(0,230,118,0)" />
                  </linearGradient>
                </defs>
                {/* Grid */}
                <line x1="0" y1="50" x2="600" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="0" y1="100" x2="600" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="0" y1="150" x2="600" y2="150" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="0" y1="200" x2="600" y2="200" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="0" y1="250" x2="600" y2="250" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                
                {/* Labels */}
                <text x="0" y="45" fill="rgba(255,255,255,0.3)" fontSize="10">$62,000</text>
                <text x="0" y="95" fill="rgba(255,255,255,0.3)" fontSize="10">$61,000</text>
                <text x="0" y="145" fill="rgba(255,255,255,0.3)" fontSize="10">$60,000</text>
                <text x="0" y="195" fill="rgba(255,255,255,0.3)" fontSize="10">$59,000</text>
                <text x="0" y="245" fill="rgba(255,255,255,0.3)" fontSize="10">$58,000</text>
                <text x="0" y="295" fill="rgba(255,255,255,0.3)" fontSize="10">$57,000</text>
                
                <text x="100" y="295" fill="rgba(255,255,255,0.3)" fontSize="10">1 Apr</text>
                <text x="200" y="295" fill="rgba(255,255,255,0.3)" fontSize="10">2 Apr</text>
                <text x="300" y="295" fill="rgba(255,255,255,0.3)" fontSize="10">3 Apr</text>
                <text x="400" y="295" fill="rgba(255,255,255,0.3)" fontSize="10">4 Apr</text>
                <text x="500" y="295" fill="rgba(255,255,255,0.3)" fontSize="10">5 Apr</text>

                {/* Path Area */}
                <path d="M0,200 Q50,220 100,180 T200,190 T300,120 T400,90 T500,110 T600,40 L600,300 L0,300 Z" fill="url(#chartGrad)" />
                {/* Path Line */}
                <path d="M0,200 Q50,220 100,180 T200,190 T300,120 T400,90 T500,110 T600,40" fill="none" stroke="#00e676" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Indicator Point */}
                <line x1="400" y1="90" x2="400" y2="300" stroke="#00e676" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="400" cy="90" r="5" fill="#00e676" stroke="#0d0f14" strokeWidth="2" />
                <circle cx="400" cy="90" r="10" fill="rgba(0,230,118,0.2)" />
              </svg>

              {/* Tooltip */}
              <div style={{ position: 'absolute', left: '410px', top: '50px', background: 'rgba(22,24,33,0.9)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', backdropFilter: 'blur(10px)', color: '#fff', fontSize: '12px', fontFamily: 'var(--mono)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                <div style={{marginBottom: 4}}>Price: <span style={{color:'#00e676', fontWeight:'bold'}}>$65,173</span></div>
                <div>Volume: <span style={{color:'#00e676', fontWeight:'bold'}}>$35.2B</span></div>
              </div>
            </div>
          </div>

          {/* COL 3: Create Order */}
          <div className={\`\${styles.card} \${styles.orderCard}\`}>
            <div className={styles.orderTitle}>Create Order</div>
            <div className={styles.segmentedTabs} style={{ margin: '0 0 24px' }}>
              <div className={\`\${styles.segTab} \${styles.segTabActive}\`}>Price Limit</div>
              <div className={styles.segTab}>Market Price</div>
              <div className={styles.segTab}>Stop Limit</div>
            </div>

            <div className={styles.buySellToggle}>
              <button 
                className={\`\${styles.bsBtn} \${side === 'buy' ? styles.bsBuy + ' ' + styles.active : styles.bsBuy}\`}
                onClick={() => setSide('buy')}
              >Buy</button>
              <button 
                className={\`\${styles.bsBtn} \${side === 'sell' ? styles.bsSell + ' ' + styles.active : styles.bsSell}\`}
                onClick={() => setSide('sell')}
              >Sell</button>
            </div>

            <div className={styles.assetSelector}>
              <div className={styles.assetIconSmall}>₿</div>
              <span className={styles.assetName}>Bitcoin</span>
              <span className={styles.assetRate}>1 BTC = $65,173</span>
            </div>

            <div className={styles.inputGroup}>
              <span className={styles.inputLabel}>Price Limit</span>
              <div className={styles.inputWrap}>
                <input type="text" value="130,346" readOnly />
                <span className={styles.inputSuffix}>Ⓢ USD</span>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <span className={styles.inputLabel}>Amount</span>
              <div className={styles.inputWrap}>
                <input type="text" value="2" readOnly />
                <span className={styles.inputSuffixBTC}>₿ BTC</span>
              </div>
            </div>

            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalVal}>$130,346</span>
            </div>

            <button className={styles.placeBtn}>Place Order</button>
          </div>

          {/* COL 1 Row 2: Running Trade */}
          <div className={\`\${styles.card} \${styles.runningTradeCard}\`}>
            <div className={styles.cardTitle}>Running Trade</div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Price</th><th>Amount</th><th style={{textAlign:'right'}}>Time</th></tr></thead>
                <tbody>
                  {[
                    { p: '65,159', a: '0.012 BTC', t: '15:40:14', c: '#00e676' },
                    { p: '65,142', a: '0.12 BTC', t: '14:21:02', c: '#00e676' },
                    { p: '65,137', a: '1.42 BTC', t: '13:54:11', c: '#00e676' },
                    { p: '65,130', a: '0.001 BTC', t: '13:24:04', c: '#00e676' },
                    { p: '65,113', a: '2.56 BTC', t: '13:10:12', c: '#ff3b30' },
                    { p: '65,115', a: '12.4 BTC', t: '12:32:49', c: '#ff3b30' },
                  ].map((r, i) => (
                    <tr key={i}>
                      <td style={{ color: r.c }}>$\{r.p\}</td>
                      <td>{r.a}</td>
                      <td style={{textAlign:'right', color: 'rgba(255,255,255,0.4)'}}>{r.t}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* COL 2 Row 2: Order Book */}
          <div className={\`\${styles.card} \${styles.orderBookCard}\`}>
            <div className={styles.cardTitle}>Order Book</div>
            <div className={styles.tableWrap} style={{ display: 'flex', gap: 24 }}>
              
              {/* Green Side */}
              <table className={styles.table}>
                <thead><tr><th>Price (USDT)</th><th>Size (BTC)</th><th>Sum (USDT)</th></tr></thead>
                <tbody>
                  {[
                    { p: '65,100', s: '15.00', sum: '13.06M', w: '30%' },
                    { p: '65,000', s: '1.06K', sum: '114.17M', w: '60%' },
                    { p: '64,900', s: '1.5K', sum: '46.72M', w: '40%' },
                    { p: '64,800', s: '521.5', sum: '960.47K', w: '20%' },
                    { p: '64,700', s: '86.71', sum: '6.74M', w: '10%' },
                  ].map((r, i) => (
                    <tr key={i} style={{position: 'relative', zIndex: 1}}>
                      <td style={{ color: '#00e676', position: 'relative' }}>
                        <div style={{position: 'absolute', right: -24, top: 0, bottom: 0, width: r.w, background: 'rgba(0,230,118,0.08)', zIndex: -1}} />
                        {r.p}
                      </td>
                      <td>{r.s}</td>
                      <td>{r.sum}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Red Side */}
              <table className={styles.table}>
                <thead><tr><th>Sum (USDT)</th><th>Size (BTC)</th><th style={{textAlign:'right'}}>Price (USDT)</th></tr></thead>
                <tbody>
                  {[
                    { p: '65,100', s: '15.00', sum: '13.06M', w: '30%' },
                    { p: '65,000', s: '1.06K', sum: '114.17M', w: '60%' },
                    { p: '64,900', s: '1.5K', sum: '46.72M', w: '40%' },
                    { p: '64,800', s: '521.5', sum: '960.47K', w: '20%' },
                    { p: '64,700', s: '86.71', sum: '6.74M', w: '10%' },
                  ].map((r, i) => (
                    <tr key={i} style={{position: 'relative', zIndex: 1}}>
                      <td>{r.sum}</td>
                      <td>{r.s}</td>
                      <td style={{ color: '#ff3b30', textAlign: 'right', position: 'relative' }}>
                        <div style={{position: 'absolute', left: -24, top: 0, bottom: 0, width: r.w, background: 'rgba(255,59,48,0.08)', zIndex: -1}} />
                        {r.p}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          </div>

          {/* COL 3 Row 2: My Order */}
          <div className={\`\${styles.card} \${styles.myOrderCard}\`}>
            
            <div>
              <div className={styles.cardTitle}><span>My Order</span> <span className={styles.viewAll}>View all</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { p1: '$16,992', a: '0.26 BTC', p2: '$65,173' },
                  { p1: '$21,724', a: '0.31 BTC', p2: '$65,173' },
                  { p1: '$11,349', a: '0.17 BTC', p2: '$65,173' },
                ].map((r,i) => (
                  <div key={i} className={styles.orderItem}>
                    <span style={{ color: '#00e676' }}>{r.p1}</span>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>{r.a}</span>
                    <span>{r.p2}</span>
                    <span className={styles.oiClose}>×</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{marginTop: 'auto'}}>
              <div className={styles.cardTitle} style={{marginTop: 16}}>Order Filled</div>
              <div className={\`\${styles.orderItem} \${styles.filled}\`}>
                <span style={{ color: '#00e676' }}>$91,893</span>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>1.41 BTC</span>
                <span>0.12/3.5 BTC</span>
              </div>
            </div>

          </div>

        </div>{/* body */}
      </div>{/* main */}
    </div>
  )
}
`;

fs.writeFileSync('/home/yaelah/Downloads/3xtremes/frontend/app/trade/page.tsx', tsx);
