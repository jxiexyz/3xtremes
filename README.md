# 3XTREMES · The Extreme Velocity Trading Arena

> A high-velocity, 10,000x leverage on-chain trading platform with 60-second binary-style rounds. Designed for extreme risk-takers on the Arc Testnet.

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) ![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)

## Features

- **60-Second Trading Rounds:** Fast-paced, continuous loops of market action. No waiting.
- **10,000x Maximum Leverage:** Multiply your purchasing power. A 0.01% price movement can double your money—or destroy it.
- **Instant Liquidations:** No margin calls. No partial liquidations. If your position hits -100% PnL, our Keeper bot wipes out the account instantly.
- **Optimistic UI Architecture:** Zero-latency visual execution. Liquidations and balance deductions reflect immediately on the frontend without waiting for blockchain block confirmations.
- **On-Chain Resolution:** Price feeds, settlements, and funds are handled securely via smart contracts on the Arc Testnet.

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14, React 18, Tailwind CSS, Framer Motion |
| **Web3 Interaction**| Viem, Wagmi |
| **Backend / Bot** | Node.js, TypeScript, Viem |
| **Network** | Arc Testnet |

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
```

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

*(Note: Never commit your actual private key. Ensure `.env` is listed in your `.gitignore`)*

### 5. Run the Project

**Run the Frontend:**
```bash
cd frontend
npm run dev
```

**Run the Keeper Bot:**
```bash
cd bot
npm start
```

## Environment Variables

| Variable | Location | Description | Required |
| :--- | :--- | :--- | :--- |
| `KEEPER_PRIVATE_KEY` | `bot/.env` | The wallet private key used by the bot to pay gas for round settlements and forced liquidations. | Yes |
| `RPC_URL` | `bot/.env` | The blockchain RPC endpoint (e.g., Arc Testnet) to monitor events and submit transactions. | Yes |

## How It Works

1. **The Game Loop:** The `RoundEngine` smart contract manages a strict 60-second timer. 
2. **Trading Phase:** During the first 54 seconds, users can freely open Long or Short positions.
3. **Lock Window:** In the final 5 seconds, the market locks. No new entries are allowed to prevent latency arbitrage.
4. **Resolution:** At 0 seconds, the round settles. Winners receive instant payouts.
5. **The Keeper Bot:** An aggressive off-chain Node.js worker that monitors real-time price ticks. If any user's position hits -100% PnL, the bot forcibly injects a liquidation transaction *before* the round can settle, ensuring absolute financial fairness.

## Notes

- **Testnet Only:** This platform is currently deployed on the Arc Testnet. Use testnet USCC to trade.
- **High Risk:** The UI and mechanics are designed to simulate an extremely hostile trading environment. 
- **Asynchronous Settlement:** The bot executes liquidations entirely asynchronously in the background, ensuring the main 60-second game loop never pauses or freezes for other users.