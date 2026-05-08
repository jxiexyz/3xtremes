# 3XTREMES · The Extreme Velocity Trading Arena

> A high-velocity, 10,000x leverage on-chain trading platform with 60-second binary-style rounds. Designed for extreme risk-takers on the Arc Testnet.

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) ![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)

## Features

- **60-Second Epoch Loop:** Continuous market cycles. Each epoch runs for exactly 60 seconds, locks at T-5, and settles atomically at T-0.
- **Up to 10,000x Leverage:** Hyper-leverage on real-time price feeds. A 0.01% price movement can fully double or wipe a position.
- **Absolute Liquidation Engine:** No margin calls. No partial fills. If a position hits -100% PnL intra-epoch, the Keeper bot liquidates it instantly on-chain.
- **Optimistic UI Architecture:** Zero-latency visual feedback. Position entries and liquidations reflect immediately on the frontend without waiting for block confirmations.
- **EIP-6963 Wallet Discovery:** Manual wallet picker flow using the EIP-6963 standard. Users explicitly select their wallet (MetaMask, Rabby, etc.) on connect instead of auto-connecting.
- **On-Chain Settlement:** Price feeds, payouts, and margin seizures are handled via smart contracts on the Arc Testnet.
- **Responsive Design:** Full mobile support across Landing Page, Navbar, Hero mockup, and Trading Dashboard.
- **Professional Docs:** Developer-oriented documentation with sidebar navigation, WebSocket API reference, architecture overview, and Quick Start.

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14, React 18, Tailwind CSS, Framer Motion |
| **Web3 Interaction** | Viem, Wagmi v2 |
| **Wallet Standard** | EIP-6963 (multi-wallet discovery) |
| **Backend / Bot** | Node.js, TypeScript, Viem |
| **Network** | Arc Testnet |
| **Deployment** | Netlify (frontend static export) |

## Project Structure

```
3xtremes/
├── frontend/                  # Next.js application
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── trade/page.tsx     # Trading dashboard
│   │   ├── docs/page.tsx      # Developer documentation
│   │   └── components/        # Landing page components (Navbar, Hero, etc.)
│   ├── components/
│   │   └── wallet/            # ConnectButton, ConnectWalletModal (EIP-6963)
│   ├── lib/
│   │   └── wagmi.ts           # Wagmi config (connectors, chains)
│   └── next.config.js         # Build config (removeConsole in production)
└── bot/                       # Keeper bot (liquidation + round settlement)
```

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/jxiexyz/3xtremes.git
cd 3xtremes
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:3000` by default.

### 3. Backend (Keeper Bot) Setup

```bash
cd ../bot
npm install
```

### 4. Set up environment variables

Create a `.env` file in the `bot` directory:

```env
KEEPER_PRIVATE_KEY=your_private_key_here
RPC_URL=your_arc_testnet_rpc_url
```

> Never commit your actual private key. Ensure `.env` is listed in `.gitignore`.

### 5. Run the Keeper Bot

```bash
cd bot
npm start
```

## Build for Production

```bash
cd frontend
npm run build
```

Static output is generated in `frontend/out`. Upload this folder directly to Netlify via drag-and-drop, or connect the repo for continuous deployment.

> `console.log` statements are automatically stripped in production builds via `compiler.removeConsole` in `next.config.js`.

## Environment Variables

| Variable | Location | Description | Required |
| :--- | :--- | :--- | :--- |
| `KEEPER_PRIVATE_KEY` | `bot/.env` | Wallet private key used by the bot to pay gas for settlements and forced liquidations. | Yes |
| `RPC_URL` | `bot/.env` | Blockchain RPC endpoint (Arc Testnet) for monitoring events and submitting transactions. | Yes |

## How It Works

1. **Epoch Start:** The `RoundEngine` smart contract initiates a 60-second epoch.
2. **Trading Window (T-60 to T-5):** Users open Long or Short positions with chosen margin and leverage.
3. **Lock Window (T-5 to T-0):** Order book locks. No new entries or exits allowed. Prevents latency arbitrage and front-running.
4. **Settlement (T-0):** The epoch closes. Oracle price is captured. Winning positions are paid out. Losing margins are swept.
5. **Keeper Bot:** An off-chain Node.js worker monitors real-time price ticks. If any position hits -100% PnL before T-0, the bot injects a forced liquidation transaction immediately, independent of the epoch cycle.

## UI Architecture

| Component | Description |
| :--- | :--- |
| **Trading Dashboard** | Epoch timer, Long/Short tabs, and Trade button visible without scrolling. Details (fees, liquidation price) below. |
| **Wallet Connect Flow** | EIP-6963 discovery modal. Users pick wallet explicitly. No auto-reconnect on mount. |
| **Chart Watermark** | Container query-based responsive 3XTREMES watermark. Scales with chart container width. |
| **Coming Soon Badge** | Market list badges use `flex-shrink: 0` and `whitespace-nowrap` to prevent overflow on narrow screens. |

## Notes

- **Testnet Only:** Deployed on Arc Testnet. Use testnet USCC to trade.
- **High Risk:** Mechanics are designed for extreme leverage environments. Do not use real funds.
- **Asynchronous Settlement:** The Keeper bot runs entirely off the main epoch loop, ensuring other users are never blocked during liquidation events.