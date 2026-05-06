const fs = require('fs');

const cssContent = `
/* ═══════════════════════════════════════
   3XTREMES — Tradeflare-style layout
   ═══════════════════════════════════════ */

.root {
  display: flex;
  height: 100vh;
  background: #0b0c10;
  color: #d4d6e0;
  font-family: var(--font), sans-serif;
  font-size: 13px;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
}

/* ── SIDEBAR ── */
.sidebar {
  width: 64px;
  flex-shrink: 0;
  background: #0b0c10;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
  gap: 16px;
  border-right: 1px solid rgba(255,255,255,0.04);
}
.sidebarLogo {
  width: 40px; height: 40px;
  border-radius: 12px;
  background: #00d085;
  color: #000;
  font-weight: 900;
  font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  text-decoration: none;
  margin-bottom: 8px;
  box-shadow: 0 0 16px rgba(0,208,133,0.3);
}
.navBtn {
  width: 40px; height: 40px;
  border-radius: 12px; border: none;
  background: transparent;
  color: rgba(255,255,255,0.4);
  font-size: 18px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.navBtn:hover { color: #fff; background: rgba(255,255,255,0.05); }
.navActive { background: rgba(0,208,133,0.15) !important; color: #00d085 !important; }

/* ── MAIN ── */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px 24px;
  gap: 16px;
  overflow: hidden;
}

/* ── TOPBAR ── */
.topbar {
  display: flex;
  align-items: center;
  height: 48px;
  flex-shrink: 0;
  gap: 16px;
}
.brand {
  font-size: 18px;
  font-weight: 800;
  color: #00d085;
  letter-spacing: 1px;
}
.tbSearch {
  display: flex; align-items: center; gap: 8px;
  background: #14161d;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 0 16px;
  height: 40px;
  width: 280px;
  margin-left: 16px;
}
.tbSearch input {
  background: none; border: none; outline: none;
  color: #fff; font-size: 13px; width: 100%;
}
.tbSearch input::placeholder { color: rgba(255,255,255,0.3); }

.tbSpacer { flex: 1; }

.tbBal {
  display: flex; align-items: center; gap: 12px;
  background: #14161d;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 6px 16px;
  height: 40px;
}
.tbBalVal { font-size: 14px; font-weight: 700; color: #fff; }

/* ── BODY GRID ── */
.body {
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr 300px;
  grid-template-rows: minmax(0, 1fr) 260px;
  gap: 16px;
  min-height: 0;
}

/* ── CARD STYLE ── */
.card {
  background: linear-gradient(180deg, #181a22 0%, #12141a 100%);
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.04);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── MARKETS CARD (Col 1, Row 1) ── */
.marketsCard { grid-column: 1; grid-row: 1; }

.segmentedTabs {
  display: flex;
  background: rgba(0,0,0,0.3);
  border-radius: 10px;
  padding: 4px;
  margin: 16px;
  border: 1px solid rgba(255,255,255,0.02);
}
.segTab {
  flex: 1;
  padding: 8px 0;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.4);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.segTabActive {
  background: #232631;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.coinList { flex: 1; overflow-y: auto; padding: 0 8px; }
.coinRow {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
  gap: 12px;
}
.coinRow:hover { background: rgba(255,255,255,0.03); }
.coinIcon {
  width: 32px; height: 32px;
  border-radius: 8px;
  background: #f59e0b;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold; color: #fff;
}
.coinInfo { flex: 1; }
.coinName { font-weight: 600; font-size: 13px; color: #fff; }
.coinSub { font-size: 11px; color: rgba(255,255,255,0.4); }
.coinPriceWrap { text-align: right; }
.coinPrice { font-weight: 600; font-size: 13px; color: #fff; font-family: var(--mono); }
.coinChg { font-size: 11px; font-weight: 600; }
.textGreen { color: #00d085; }
.textRed { color: #f03e3e; }

/* ── CHART CARD (Col 2, Row 1) ── */
.chartCard { grid-column: 2; grid-row: 1; padding: 20px; }
.chartHeader {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.chartIcon {
  width: 40px; height: 40px;
  border-radius: 12px;
  background: #f59e0b;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; color: #fff;
}
.chartTitle { font-size: 16px; font-weight: 700; color: #fff; }
.chartPrice { font-size: 24px; font-weight: 700; font-family: var(--mono); color: #fff; }
.chartBadge {
  background: rgba(0,208,133,0.15);
  color: #00d085;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
}
.tfGroup { margin-left: auto; display: flex; gap: 4px; }
.tfBtn {
  background: transparent; border: none; color: rgba(255,255,255,0.4);
  padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.tfActive { background: rgba(0,208,133,0.15); color: #00d085; }

.chartWrap { flex: 1; position: relative; border-radius: 12px; overflow: hidden; }

/* ── CREATE ORDER CARD (Col 3, Row 1) ── */
.orderCard { grid-column: 3; grid-row: 1; padding: 20px; }
.orderTitle { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 16px; }

.buySellToggle {
  display: flex; gap: 8px; margin-bottom: 20px;
}
.bsBtn {
  flex: 1; padding: 10px; border-radius: 10px; font-size: 13px; font-weight: 700;
  border: none; cursor: pointer; color: #fff; transition: all 0.2s;
}
.bsBuy { background: #00d085; color: #000; box-shadow: 0 4px 12px rgba(0,208,133,0.3); }
.bsSell { background: #f03e3e; color: #fff; box-shadow: 0 4px 12px rgba(240,62,62,0.3); }
.bsInactive { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.5); box-shadow: none; }

.inputGroup { margin-bottom: 16px; }
.inputLabel { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.4); margin-bottom: 8px; display: block; }
.inputWrap {
  background: #101217;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 10px;
  display: flex; align-items: center;
  padding: 10px 16px;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
  transition: border-color 0.2s;
}
.inputWrap:focus-within { border-color: rgba(255,255,255,0.2); }
.inputWrap input {
  background: none; border: none; outline: none; flex: 1; color: #fff; font-size: 14px; font-weight: 600; font-family: var(--mono); width: 100%;
}
.inputSuffix { color: rgba(255,255,255,0.5); font-size: 12px; font-weight: 700; }

.totalRow { display: flex; justify-content: space-between; align-items: center; margin: 24px 0 16px; }
.totalLabel { font-size: 14px; font-weight: 600; color: #fff; }
.totalVal { font-size: 18px; font-weight: 700; color: #00d085; font-family: var(--mono); }

.placeBtn {
  width: 100%; padding: 14px; border-radius: 12px; border: none;
  background: #00d085; color: #000; font-size: 14px; font-weight: 800;
  cursor: pointer; box-shadow: 0 4px 16px rgba(0,208,133,0.3);
  transition: all 0.2s; margin-top: auto;
}
.placeBtn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,208,133,0.4); }
.placeBtnSell { background: #f03e3e; box-shadow: 0 4px 16px rgba(240,62,62,0.3); color: #fff; }

/* ── BOTTOM PANELS ── */
.runningTradeCard { grid-column: 1; grid-row: 2; padding: 20px; }
.orderBookCard { grid-column: 2; grid-row: 2; padding: 20px; }
.myOrderCard { grid-column: 3; grid-row: 2; padding: 20px; }

.cardTitle { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
.viewAll { font-size: 11px; color: #00d085; cursor: pointer; }

/* Tables */
.tableWrap { overflow-y: auto; flex: 1; }
.table { width: 100%; border-collapse: collapse; }
.table th {
  text-align: left; font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.3);
  padding-bottom: 12px;
}
.table td {
  padding: 6px 0; font-size: 12px; font-family: var(--mono); color: rgba(255,255,255,0.7);
}
.table tr:hover td { color: #fff; }

.actionBtn {
  background: rgba(240,62,62,0.15); color: #f03e3e; border: 1px solid rgba(240,62,62,0.3);
  padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.actionBtn:hover { background: rgba(240,62,62,0.25); }

.emptyText { font-size: 12px; color: rgba(255,255,255,0.4); text-align: center; padding: 20px; }
`;
fs.writeFileSync('/home/yaelah/Downloads/3xtremes/frontend/app/trade/trade.module.css', cssContent);
