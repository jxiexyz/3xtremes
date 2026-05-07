# 3xtremes — Project Documentation

> On-chain extreme leverage perpetual trading platform built on Arc Testnet.
> Up to **10,000x leverage** dengan round-based settlement dan VRF-seeded candles.

---

## 📁 Struktur Proyek

```
3xtremes/
├── contracts/          # Smart contracts (Solidity)
│   ├── FeeManager.sol
│   ├── CreditVault.sol
│   ├── VRFConsumer.sol
│   ├── RoundEngine.sol
│   └── PositionManager.sol
├── scripts/            # Hardhat deployment & admin scripts
│   ├── deploy.ts       # Full deployment sequence
│   ├── redeployPositionManager.ts
│   ├── redeploy_live_price.ts
│   ├── restoreLinks.ts
│   ├── setMaxPos.ts
│   └── authBot.ts
├── bot/                # Off-chain bots (TypeScript / viem)
│   ├── keeper.ts       # Round lifecycle + WebSocket price streamer
│   ├── liquidator.ts   # Liquidation watcher
│   └── main.ts
├── frontend/           # Next.js 14 trading dashboard
│   ├── app/
│   │   ├── page.tsx            # Landing page
│   │   └── trade/page.tsx      # Main trading dashboard (53KB monster)
│   ├── components/
│   │   ├── landing/            # Landing page sections
│   │   ├── trading/            # Trade-specific components (RecentTrades)
│   │   ├── wallet/             # Wallet: ConnectButton, Deposit/Withdraw modal
│   │   ├── shared/             # Navbar, Footer
│   │   └── ui/                 # Generic UI components
│   └── lib/                    # Hooks, utilities, contract ABIs
├── hardhat.config.ts   # Hardhat config (Arc testnet)
├── tsconfig.json       # Root TypeScript config (for bots)
└── .env                # Private keys + contract addresses
```

---

## 🏗️ Arsitektur Smart Contract

### Deploy Order (PENTING — ada dependency chain)

```
1. FeeManager        ← no deps
2. CreditVault       ← needs USDC address
3. VRFConsumer       ← no deps
4. RoundEngine       ← needs VRFConsumer
5. PositionManager   ← needs CreditVault + FeeManager + RoundEngine
```

Setelah deploy, set permissions:
- `VRFConsumer.setRoundEngine(roundEngine)`
- `RoundEngine.setPositionManager(positionManager)`
- `CreditVault.setAuthorizedContract(positionManager, true)`
- `FeeManager.setAuthorizedCaller(positionManager, true)`
- `RoundEngine.setAuthorizedKeeper(keeperAddress, true)`

---

### Contract Overview

#### `FeeManager.sol`
- **Deploy first** — no deps.
- Distribusi fee: **30% → insurance fund**, **70% → platform revenue**
- Pada liquidation: **95% → insurance fund**, **5% → platform**
- `collectFee(amount, trader)` — dipanggil PositionManager saat open/close
- `collectLiquidationFee(margin, trader)` — dipanggil saat liquidasi
- `coverLoss(amount)` — cover kemenangan trader dari insurance fund
- `isInsuranceFundCritical()` — circuit breaker jika fund < 10% dari total fees
- Platform revenue bisa di-withdraw owner ke `platformWallet`

#### `CreditVault.sol`
- Handles USDC deposits → mints **USCC** (virtual credit, bukan ERC20)
- Rate: **1 USDC = 1000 USCC** (6 decimals USDC)
- Min deposit: **1 USDC**
- Withdraw: harus multiple of 1000 USCC, **tidak bisa kalau ada open position** (`openPositionCount > 0`)
- `deductUSCC` / `creditUSCC` — hanya bisa dipanggil PositionManager (authorized)
- `updateOpenPositionCount(user, isOpening)` — withdrawal guard

#### `VRFConsumer.sol`
- Wrapper minimal untuk Gelato VRF
- `requestSeed(roundId)` → dipanggil RoundEngine, langsung fulfill sync (testnet)
- Seed dikembalikan ke RoundEngine via `fulfillSeed(roundId, seed)`

#### `RoundEngine.sol`
- Manages **60-second round cycles**
- **Lock window: 5 detik terakhir** — tidak bisa open/close posisi
- Flow per round:
  1. Keeper calls `startRound()` → request VRF seed
  2. VRF fulfill seed → emit `SeedFulfilled(roundId, seed)`
  3. Keeper baca seed, pre-compute 60 candles off-chain
  4. Keeper stream candles ke frontend via WebSocket (1/detik)
  5. Keeper update harga on-chain tiap detik via `updatePrice()`
  6. Setelah 60s, keeper calls `settleRound(finalPrice)`
  7. Contract settle semua posisi → loop ke step 1
- `isPositionOpenAllowed()` — returns false di 5 detik terakhir
- Emergency: `cancelRound()` → refund semua posisi di round tersebut

#### `PositionManager.sol`
- Core trading logic — **deploy last**
- Leverage tiers: NORMAL / WILD / INSANE / EXTREME
- Range leverage: **10x — 10,000x**
- Max posisi per user: **10**
- Max net exposure per user: **100M USCC**
- Max OI imbalance global: **100M USCC**
- Spread fee: **0.01% dari SIZE** (bukan margin) saat open, sama saat close pada profit
- Liquidation reward: **2% margin → liquidation bot**
- Sisanya: **98% → FeeManager** (lalu 95% insurance / 5% platform)

**Liquidation price formula:**
- LONG: `entryPrice - (entryPrice / leverage)`
- SHORT: `entryPrice + (entryPrice / leverage)`

**PnL formula:**
```
pnl = (priceDelta / entryPrice) × size
```
Dimana `priceDelta` = `exitPrice - entryPrice` (LONG) atau `entryPrice - exitPrice` (SHORT)

---

## ⛓️ Network

| Param | Value |
|-------|-------|
| Network | Arc Testnet |
| Chain ID | `5042002` |
| RPC | `https://rpc.testnet.arc.network` |
| Explorer | `https://testnet.arcscan.app` |
| Native | ETH |

---

## 🤖 Off-chain Bots

### Keeper Bot (`bot/keeper.ts`)

**Tanggung jawab:**
1. Lifecycle round: `startRound()` → `settleRound()`
2. Pre-compute **60 candles dari VRF seed** (deterministik, sama seperti yang contract akan pakai)
3. Stream candles ke frontend via **WebSocket** (port `WS_PORT`, default 8080)
4. Update harga on-chain tiap detik via `updatePrice()` (crucial untuk liquidation akurat di high leverage)
5. Maintain candle history 200 candles — dikirim ke WS client baru saat connect

**Candle generation algorithm:**
- Seed → per-second randomness via XOR hash (`h = seed ^ (second * 0x9e3779b97...`)
- Global drift: ±15 dari seed (subtle bias)
- Noise: ±150 per tick
- Mean reversion gravity: 5% pull ke start price
- Min body: 25 ticks (no doji)
- Wicks: 30-70% dari body size
- Volatility tiers: 0.01% / 0.08% / 0.30% / 0.80% / 3.00%

**WS Message Types (Keeper → Client):**
```ts
{ type: "HISTORY",       history: Candle[] }           // sent on connect
{ type: "ROUND_START",   roundId, startPrice, seed, totalCandles }
{ type: "CANDLE",        roundId, time, second, open, high, low, close, price, lockWindow }
{ type: "ROUND_SETTLING",roundId, finalPrice }
{ type: "ROUND_SETTLED", roundId, finalPrice }
{ type: "ROUND_RESUME",  roundId, elapsed, startPrice } // on restart mid-round
{ type: "ROUND_ERROR",   roundId, reason }
```

**Settle logic:**
- Settle dijadwal setelah `(60 + 2) * 1000ms` (2s safety buffer untuk block.timestamp lag)
- Retry settle up to **10x** dengan jeda 2s tiap retry
- Jika gagal 10x → `cancelRound()` → start round baru

### Liquidator Bot (`bot/liquidator.ts`)

**Tanggung jawab:**
1. Load semua open positions dari chain (scan 50k blok terakhir) on startup
2. Watch events: `PositionOpened`, `PositionClosed`, `PositionLiquidated`
3. Terima candle messages dari Keeper via WebSocket
4. **Wick detection**: Cek HIGH dan LOW candle — bukan hanya close price
   - LONG liquidasi jika `low <= liquidationPrice`
   - SHORT liquidasi jika `high >= liquidationPrice`
5. Double-check on-chain via `checkLiquidation()` sebelum fire tx
6. Reward: **2% margin** per liquidation berhasil

---

## 🖥️ Frontend

**Stack:** Next.js 14, TypeScript, Tailwind CSS, Wagmi v2, viem, Framer Motion, Lightweight Charts (TradingView)

### Pages

| Route | File | Deskripsi |
|-------|------|-----------|
| `/` | `app/page.tsx` | Landing page |
| `/trade` | `app/trade/page.tsx` | Main trading dashboard |

### Komponen Utama

**Wallet:**
- `ConnectButton.tsx` — Wallet connect + dropdown menu (disconnect, copy address)
- `ConnectWalletModal.tsx` — Modal pilih wallet
- `DepositModal.tsx` — USDC → USCC deposit flow
- `WithdrawModal.tsx` — USCC → USDC withdraw flow
- `ChainWatcher.tsx` — Monitor chain events

**Trading Dashboard (`app/trade/page.tsx`):**
- Real-time chart via `lightweight-charts` (TradingView library)
- WebSocket client untuk terima candle stream dari keeper
- Order panel: open LONG / SHORT dengan pilihan leverage (10x, 100x, 1000x, 10000x)
- Posisi aktif user: tampil PnL real-time
- Round timer countdown
- Lock window indicator (5 detik terakhir)

**Data flow:**
```
Keeper Bot (WS:8080)
      ↓ WebSocket CANDLE messages
Frontend (Chart Update + UI)
      ↓ wagmi hooks
Smart Contracts (open/close/liquidate)
```

---

## 💰 Fee Structure

| Aksi | Fee | Kemana |
|------|-----|--------|
| Open position | 0.01% × size | FeeManager (30% ins, 70% platform) |
| Close position (profit) | 0.01% × profit | FeeManager |
| Liquidation | 2% margin | Liquidation bot |
| Liquidation remainder | 98% margin | FeeManager (95% ins, 5% platform) |

**Insurance Fund** digunakan untuk cover kemenangan trader ketika protokol rugi.

---

## 🔐 Security Measures

| Measure | Detail |
|---------|--------|
| Lock window | No open/close di 5 detik terakhir round (anti front-running) |
| Net exposure limit | Max ±100M USCC net per user (anti hedge drain) |
| Global OI cap | Max 100M USCC imbalance (anti extreme one-sided bet) |
| Max position size | 1M USCC default, adjustable by admin |
| Max positions | 10 concurrent per user |
| Withdrawal guard | Tidak bisa withdraw jika ada open position |
| Reentrancy guard | `nonReentrant` di semua state-changing functions |
| Pausable | Semua contracts punya emergency pause |
| RoundId enforcement | Posisi hanya bisa settle di roundId yang sama saat dibuka |
| Off-chain liquidation | Bots cek wick detection, double-check on-chain, no gas loop |

---

## 🚀 Development Setup

### Prerequisites
- Node.js 18+
- Hardhat
- Arc testnet ETH

### Root (Contracts + Bots)
```bash
cd /home/yaelah/Downloads/3xtremes

# Install deps
npm install

# Compile contracts
npx hardhat compile

# Deploy ke Arc testnet
npx hardhat run scripts/deploy.ts --network arcTestnet

# Build bots
npm run build

# Run keeper
npm run start:keeper

# Run liquidator
npm run start:liquidator
```

### Frontend
```bash
cd /home/yaelah/Downloads/3xtremes/frontend

# Install deps
npm install

# Dev server
npm run dev   # http://localhost:3000
```

### Environment Variables
Copy `env.example` ke `.env` dan isi:

```env
PRIVATE_KEY=            # Deployer private key
ARC_RPC_URL=            # https://rpc.testnet.arc.network
USDC_ADDRESS=           # USDC contract di Arc testnet

# Setelah deploy:
FEE_MANAGER_ADDRESS=
CREDIT_VAULT_ADDRESS=
VRF_CONSUMER_ADDRESS=
ROUND_ENGINE_ADDRESS=
POSITION_MANAGER_ADDRESS=

# Bot config
KEEPER_PRIVATE_KEY=     # Bisa sama dengan PRIVATE_KEY
WS_PORT=8080

# Frontend (NEXT_PUBLIC_* prefix)
NEXT_PUBLIC_ARC_RPC_URL=
NEXT_PUBLIC_ROUND_ENGINE_ADDRESS=
NEXT_PUBLIC_POSITION_MANAGER_ADDRESS=
NEXT_PUBLIC_CREDIT_VAULT_ADDRESS=
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

---

## ⚠️ Known Issues & Notes

1. **`settleRound` loop posisi** — saat ini iterasi `positionCounter` O(n). Perlu di-optimize dengan per-round position list untuk scale ke >200 posisi.
2. **VRF sync on testnet** — `VRFConsumer.requestSeed()` fulfill langsung (sync) di testnet. Di production pakai Gelato VRF async.
3. **candle history** — Keeper menyimpan max 200 candles in-memory. Restart keeper = history hilang (client yang reconnect sebelum round baru bakal ketinggalan history lama).
4. **USCC bukan ERC20** — USCC adalah virtual credit tracked di CreditVault storage. Tidak bisa transfer antar wallet atau lihat di MetaMask.
5. **FeeManager.withdrawPlatformRevenue** — saat ini hanya track accounting, actual USCC transfer dari CreditVault belum fully implemented.

---

## 📋 Contract Interfaces (Ringkas)

```solidity
// CreditVault
function deposit(uint256 usdcAmount) external;
function withdraw(uint256 usccAmount) external;
function getUSCCBalance(address user) external view returns (uint256);

// RoundEngine
function startRound() external; // onlyKeeper
function settleRound(uint256 finalPrice) external; // onlyKeeper
function updatePrice(uint256 newPrice) external; // onlyKeeper
function isPositionOpenAllowed() external view returns (bool);
function getSecondsRemaining() external view returns (uint256);
function getCurrentPrice() external view returns (uint256);

// PositionManager
function openPosition(bool isLong, uint256 margin, uint256 leverage) external returns (uint256 positionId);
function closePosition(uint256 positionId) external;
function liquidatePosition(uint256 positionId) external;
function calculatePnL(uint256 positionId, uint256 atPrice) external view returns (int256);
function getOpenPositions(address user) external view returns (uint256[] memory);
```

---

*Last updated: 2026-05-07 | Network: Arc Testnet (Chain ID 5042002)*
