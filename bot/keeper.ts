import { createPublicClient, createWalletClient, http, parseAbi, parseAbiItem } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";
import { WebSocketServer, WebSocket } from "ws";
import * as dotenv from "dotenv";

dotenv.config();

// ─── Arc Testnet ─────────────────────────────────────────────────────────────

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
  blockExplorers: { default: { name: "ArcScan", url: "https://testnet.arcscan.app" } },
});

// ─── ABI ─────────────────────────────────────────────────────────────────────

const ROUND_ENGINE_ABI = parseAbi([
  "function startRound() external",
  "function settleRound(uint256 finalPrice) external",
  "function cancelRound(string reason) external",
  "function currentRoundId() external view returns (uint256)",
  "function roundActive() external view returns (bool)",
  "function getSecondsRemaining() external view returns (uint256)",
  "function getCurrentPrice() external view returns (uint256)",
  "function getSeed(uint256 roundId) external view returns (uint256)",
  "event RoundStarted(uint256 indexed roundId, uint256 startPrice, uint256 startTime)",
  "event SeedFulfilled(uint256 indexed roundId, uint256 seed)",
  "event RoundSettled(uint256 indexed roundId, uint256 endPrice, uint256 endTime)",
]);

// ─── Config ───────────────────────────────────────────────────────────────────

const ROUND_ENGINE_ADDRESS = process.env.ROUND_ENGINE_ADDRESS as `0x${string}`;
let rawKey = (process.env.KEEPER_PRIVATE_KEY || "").replace(/['"]/g, "").trim();
if (rawKey && !rawKey.startsWith("0x")) {
  rawKey = `0x${rawKey}`;
}
const PRIVATE_KEY = rawKey as `0x${string}`;
const WS_PORT = parseInt(process.env.PORT || process.env.WS_PORT || "8080");

if (!ROUND_ENGINE_ADDRESS || !PRIVATE_KEY || PRIVATE_KEY === "0x") {
  console.error("❌ Missing ROUND_ENGINE_ADDRESS or KEEPER_PRIVATE_KEY in environment");
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY);
const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });
const walletClient = createWalletClient({ chain: arcTestnet, transport: http(), account });

// ─── WebSocket Server ─────────────────────────────────────────────────────────

const wss = new WebSocketServer({ port: WS_PORT });
const wsClients = new Set<WebSocket>();

wss.on("connection", (ws) => {
  wsClients.add(ws);
  log(`🔌 WS client connected (total: ${wsClients.size})`);

  // Send history on connect
  if (candleHistory.length > 0) {
    ws.send(JSON.stringify({
      type: "HISTORY",
      history: candleHistory
    }));
  }

  ws.on("close", () => {
    wsClients.delete(ws);
    log(`🔌 WS client disconnected (total: ${wsClients.size})`);
  });
});

function broadcast(data: object) {
  const msg = JSON.stringify(data);
  wsClients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
}

// ─── State ────────────────────────────────────────────────────────────────────

let isSettling = false;
let isStarting = false;
let candleInterval: ReturnType<typeof setInterval> | null = null;
let settleTimeout: ReturnType<typeof setTimeout> | null = null;
let candleHistory: any[] = []; // Stores last 200 candles across rounds

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function formatPrice(raw: unknown): string {
  return (Number(raw as bigint) / 100000).toFixed(5);
}

async function sendTx(label: string, fn: () => Promise<`0x${string}`>): Promise<boolean> {
  try {
    const hash = await fn();
    log(`📤 ${label} tx: ${hash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status === "success") {
      log(`✅ ${label} confirmed (block ${receipt.blockNumber})`);
      return true;
    } else {
      log(`❌ ${label} reverted`);
      return false;
    }
  } catch (err: any) {
    log(`❌ ${label} error: ${err?.shortMessage || err?.message}`);
    return false;
  }
}

// ─── Candle Pre-computation (same logic as contract) ─────────────────────────
//
// Catapult-style: 1 seed → compute all 60 candles off-chain
// Uses same deterministic formula as VRFConsumer.sol so candles are reproducible
//
// Candle = OHLC per second
// Price movement logic mirrors RoundEngine._calculatePriceMove()

const THRESHOLD_DOWN = 450_000n;
const THRESHOLD_SIDEWAYS = 550_000n;
const MOVE_DENOMINATOR = 100_000n;

function computeRandomness(seed: bigint, second: number): bigint {
  // Derive per-second randomness from seed deterministically
  // keccak256(seed, second) % 1_000_000
  const encoded = `${seed.toString(16).padStart(64, "0")}${second.toString(16).padStart(64, "0")}`;
  // Simple deterministic derivation (mirrors what contract would do)
  let h = seed ^ (BigInt(second) * 0x9e3779b97f4a7c15n);
  h = ((h >> 30n) ^ h) * 0xbf58476d1ce4e5b9n;
  h = ((h >> 27n) ^ h) * 0x94d049bb133111ebn;
  h = (h >> 31n) ^ h;
  return ((h % 1_000_000n) + 1_000_000n) % 1_000_000n; // ensure positive
}

function calcPriceMove(price: number, randomness: bigint): number {
  const magnitudeSeed = Number(randomness % 100n);
  let magnitude: bigint;

  if (magnitudeSeed <= 50) magnitude = 1n;       // 0.001%
  else if (magnitudeSeed <= 80) magnitude = 10n;  // 0.01%
  else if (magnitudeSeed <= 95) magnitude = 100n; // 0.1%
  else if (magnitudeSeed <= 99) magnitude = 1000n;// 1%
  else magnitude = 5000n;                          // 5% EXTREME

  const priceMove = Math.max(1, Math.floor((price * Number(magnitude)) / Number(MOVE_DENOMINATOR)));

  if (randomness < THRESHOLD_DOWN) {
    return Math.max(1, price - priceMove); // DOWN
  } else if (randomness < THRESHOLD_SIDEWAYS) {
    return price; // SIDEWAYS
  } else {
    return price + priceMove; // UP
  }
}

interface Candle {
  second: number;
  open: number;
  high: number;
  close: number;
  low: number;
  price: number; // = close
}

function computeCandles(seed: bigint, startPrice: number): Candle[] {
  const candles: Candle[] = [];
  let price = startPrice;

  for (let s = 0; s < 60; s++) {
    const randomness = computeRandomness(seed, s);
    const open = price;
    const close = calcPriceMove(price, randomness);

    // Simulate intra-candle high/low (small noise)
    const noise = Math.max(1, Math.floor(price * 0.0001));
    const high = Math.max(open, close) + Math.floor(Math.random() * noise);
    const low = Math.max(1, Math.min(open, close) - Math.floor(Math.random() * noise));

    candles.push({ second: s, open, high, low, close, price: close });
    price = close;
  }

  return candles;
}

// ─── Round Lifecycle ──────────────────────────────────────────────────────────

async function startRound() {
  if (isStarting) return;
  isStarting = true;
  log("🚀 Starting new round...");

  const ok = await sendTx("startRound", () =>
    walletClient.writeContract({
      address: ROUND_ENGINE_ADDRESS,
      abi: ROUND_ENGINE_ABI,
      functionName: "startRound",
    })
  );

  isStarting = false;

  if (!ok) {
    log("⚠️  startRound gagal, retry in 3s...");
    setTimeout(startRound, 3000);
    return;
  }

  // Read round info + seed from chain
  const roundId = await publicClient.readContract({ address: ROUND_ENGINE_ADDRESS, abi: ROUND_ENGINE_ABI, functionName: "currentRoundId" });
  const startPrice = await publicClient.readContract({ address: ROUND_ENGINE_ADDRESS, abi: ROUND_ENGINE_ABI, functionName: "getCurrentPrice" });
  const seed = await publicClient.readContract({ address: ROUND_ENGINE_ADDRESS, abi: ROUND_ENGINE_ABI, functionName: "getSeed", args: [roundId] });

  const roundIdNum = Number(roundId);
  const startPriceNum = Number(startPrice as bigint);
  const seedBig = seed as bigint;

  log(`🎰 Round #${roundIdNum} | StartPrice: ${formatPrice(startPrice)} | Seed: ${seedBig}`);

  // Pre-compute all 60 candles from seed
  const candles = computeCandles(seedBig, startPriceNum);
  const finalPrice = candles[candles.length - 1].close;

  log(`📊 Pre-computed 60 candles | FinalPrice: ${formatPrice(BigInt(finalPrice))}`);

  // Broadcast round start to all WS clients
  broadcast({
    type: "ROUND_START",
    roundId: roundIdNum,
    startPrice: startPriceNum,
    seed: seedBig.toString(),
    totalCandles: candles.length,
  });

  // Stream candles 1 per second
  streamCandles(roundIdNum, candles, finalPrice);
}

function streamCandles(roundId: number, candles: Candle[], finalPrice: number) {
  stopLoop();

  let idx = 0;

  candleInterval = setInterval(() => {
    if (idx >= candles.length) {
      if (candleInterval) { clearInterval(candleInterval); candleInterval = null; }
      return;
    }

    const candle = candles[idx];
    const isLockWindow = candle.second >= 55;

    const candleMsg = {
      type: "CANDLE",
      roundId,
      second: candle.second,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      price: candle.close,
      lockWindow: isLockWindow,
    };

    // Save to history
    candleHistory.push(candleMsg);
    if (candleHistory.length > 200) candleHistory.shift();

    broadcast(candleMsg);

    if (!isLockWindow) {
      log(`💹 second ${candle.second} | price: ${formatPrice(BigInt(candle.close))}`);
    } else if (candle.second >= 55) {
      log(`🔒 second ${candle.second} lock window`);
    }

    idx++;
  }, 1000);

  // Settle after all candles finish + 2s safety buffer (block.timestamp can lag)
  const settleDelay = (candles.length + 2) * 1000;
  settleTimeout = setTimeout(() => settle(roundId, finalPrice), settleDelay);
  log(`⏰ Settle scheduled in ${settleDelay}ms | candles=${candles.length} +2s buffer`);
}

async function settle(roundId: number, finalPrice: number) {
  log(`🔔 settle() called | isSettling=${isSettling}`);
  if (isSettling) return;
  isSettling = true;
  stopLoop();

  log(`🏁 Settling round #${roundId} at price ${formatPrice(BigInt(finalPrice))}...`);

  broadcast({ type: "ROUND_SETTLING", roundId, finalPrice });

  let attempts = 0;
  while (attempts < 10) {
    const ok = await sendTx("settleRound", () =>
      walletClient.writeContract({
        address: ROUND_ENGINE_ADDRESS,
        abi: ROUND_ENGINE_ABI,
        functionName: "settleRound",
        args: [BigInt(finalPrice)],
      })
    );

    if (ok) {
      log(`✅ Round #${roundId} settled!`);
      broadcast({ type: "ROUND_SETTLED", roundId, finalPrice });
      isSettling = false;
      setTimeout(startRound, 1000);
      return;
    }

    attempts++;
    log(`⏳ Retry settle (${attempts}/10) in 2s...`);
    await new Promise((r) => setTimeout(r, 2000));
  }

  log("❌ Settle gagal 10x — cancel round");
  broadcast({ type: "ROUND_ERROR", roundId, reason: "settle_failed" });

  await sendTx("cancelRound", () =>
    walletClient.writeContract({
      address: ROUND_ENGINE_ADDRESS,
      abi: ROUND_ENGINE_ABI,
      functionName: "cancelRound",
      args: ["settle_failed_after_10_retries"],
    })
  );

  isSettling = false;
  setTimeout(startRound, 2000);
}

function stopLoop() {
  if (candleInterval) { clearInterval(candleInterval); candleInterval = null; }
  if (settleTimeout) { clearTimeout(settleTimeout); settleTimeout = null; }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  log("🤖 3xtremes Keeper Bot (Catapult-style)");
  log(`👛 Wallet: ${account.address}`);
  log(`📄 RoundEngine: ${ROUND_ENGINE_ADDRESS}`);
  log(`📡 WebSocket: ws://localhost:${WS_PORT}`);

  const active = await publicClient.readContract({ address: ROUND_ENGINE_ADDRESS, abi: ROUND_ENGINE_ABI, functionName: "roundActive" });

  if (active) {
    const secsRemaining = await publicClient.readContract({ address: ROUND_ENGINE_ADDRESS, abi: ROUND_ENGINE_ABI, functionName: "getSecondsRemaining" });
    const roundId = await publicClient.readContract({ address: ROUND_ENGINE_ADDRESS, abi: ROUND_ENGINE_ABI, functionName: "currentRoundId" });
    const startPrice = await publicClient.readContract({ address: ROUND_ENGINE_ADDRESS, abi: ROUND_ENGINE_ABI, functionName: "getCurrentPrice" });
    const seed = await publicClient.readContract({ address: ROUND_ENGINE_ADDRESS, abi: ROUND_ENGINE_ABI, functionName: "getSeed", args: [roundId] });

    const remaining = Number(secsRemaining as bigint);
    const roundIdNum = Number(roundId);
    const seedBig = seed as bigint;
    const startPriceNum = Number(startPrice as bigint);

    log(`🔄 Round #${roundIdNum} aktif | ${remaining}s sisa | Seed: ${seedBig}`);

    if (remaining <= 5) {
      log("⏳ Hampir selesai, settle segera...");
      // Re-compute candles untuk dapet finalPrice
      const candles = computeCandles(seedBig, startPriceNum);
      const finalPrice = candles[candles.length - 1].close;
      settleTimeout = setTimeout(() => settle(roundIdNum, finalPrice), (remaining + 2) * 1000);
    } else {
      // Resume streaming dari second yang tersisa
      const elapsed = 60 - remaining;
      const candles = computeCandles(seedBig, startPriceNum);
      const finalPrice = candles[candles.length - 1].close;

      log(`▶️  Resume streaming dari second ${elapsed}`);
      const remainingCandles = candles.slice(elapsed);

      broadcast({ type: "ROUND_RESUME", roundId: roundIdNum, elapsed, startPrice: startPriceNum });
      streamCandles(roundIdNum, remainingCandles, finalPrice);
    }
  } else {
    log("💤 Tidak ada round aktif, mulai sekarang...");
    await startRound();
  }
}

// ─── Shutdown ─────────────────────────────────────────────────────────────────

process.on("SIGINT", () => { log("🛑 Shutdown"); stopLoop(); wss.close(); process.exit(0); });
process.on("SIGTERM", () => { log("🛑 Shutdown"); stopLoop(); wss.close(); process.exit(0); });

init().catch((err) => { console.error("Fatal:", err); process.exit(1); });
