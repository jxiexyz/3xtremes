import { createPublicClient, createWalletClient, http, parseAbi, parseAbiItem, getAddress } from "viem";
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
  "function updatePrice(uint256 newPrice) external",
  "function currentRoundId() external view returns (uint256)",
  "function roundActive() external view returns (bool)",
  "function getSecondsRemaining() external view returns (uint256)",
  "function getCurrentPrice() external view returns (uint256)",
  "function getSeed(uint256 roundId) external view returns (uint256)",
  "event RoundStarted(uint256 indexed roundId, uint256 startPrice, uint256 startTime)",
  "event SeedFulfilled(uint256 indexed roundId, uint256 seed)",
  "event RoundSettled(uint256 indexed roundId, uint256 endPrice, uint256 endTime)",
]);

const POSITION_MANAGER_ABI = parseAbi([
  // Legacy on-chain user calls (kept for compatibility)
  "function liquidatePosition(uint256 positionId) external",
  "function checkLiquidation(uint256 positionId) external view returns (bool)",
  // ── Hybrid DEX: Backend-delegated execution ──────────────────────────────
  "function backendOpenPosition(address trader, bool isLong, uint256 margin, uint256 leverage, uint256 executionPrice) external returns (uint256)",
  "function backendClosePosition(uint256 positionId, uint256 executionPrice) external",
  "function backendLiquidatePosition(uint256 positionId, uint256 executionPrice) external",
  // Events
  "event PositionOpened(uint256 indexed positionId, address indexed trader, uint256 roundId, bool isLong, uint256 entryPrice, uint256 margin, uint256 leverage, uint256 size, uint256 liquidationPrice)",
  "event PositionClosed(uint256 indexed positionId, address indexed trader, uint256 exitPrice, int256 pnl, uint256 closeTimestamp)",
  "event PositionLiquidated(uint256 indexed positionId, address indexed trader, address indexed liquidator, uint256 liquidationPrice, uint256 marginLost)",
]);

// ─── Config ───────────────────────────────────────────────────────────────────

const ROUND_ENGINE_ADDRESS = process.env.ROUND_ENGINE_ADDRESS as `0x${string}`;
const POSITION_MANAGER_ADDRESS = process.env.POSITION_MANAGER_ADDRESS as `0x${string}`;
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
let currentRoundId: bigint = 0n;

wss.on("connection", (ws) => {
  wsClients.add(ws);
  log(`🔌 WS client connected (total: ${wsClients.size})`);

  // Send history on connect
  if (candleHistory.length > 0) {
    ws.send(JSON.stringify({
      type: "HISTORY",
      roundId: Number(currentRoundId),
      history: candleHistory
    }));
  }

  // Heartbeat to keep connection alive
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, 15000);

  ws.on("message", async (data) => {
    try {
      const msg = JSON.parse(data.toString());

      // ── OPEN POSITION (Optimistic: Frontend already updated UI) ────────────
      if (msg.type === "OPEN_POSITION") {
        const { isLong, margin, leverage, price } = msg;
        // Normalize address to EIP-55 checksum format (required by viem)
        let trader: `0x${string}`;
        try { trader = getAddress(msg.trader); }
        catch { broadcast({ type: "POSITION_FAILED", trader: msg.trader, reason: "invalid_address" }); return; }
        log(`📥 OPEN request: ${trader} | ${isLong ? "LONG" : "SHORT"} | margin=${margin} | lev=${leverage}x | price=${formatPrice(BigInt(Math.floor(price)))}`);
        await backendOpen(trader, isLong, BigInt(margin), BigInt(leverage), price);
      }

      // ── CLOSE POSITION (Optimistic: Frontend already locked the position) ──
      else if (msg.type === "CLOSE_POSITION") {
        const { positionId, price } = msg;
        log(`📥 CLOSE request: positionId=${positionId} | price=${formatPrice(BigInt(price))}`);
        await backendClose(BigInt(positionId), price);
      }

      // ── LEGACY: Manual liquidation request from frontend ──────────────────
      else if (msg.type === "REQUEST_LIQUIDATION") {
        const pid = msg.positionId.toString();
        log(`📢 Liquidation request RECEIVED for #${pid} - Executing NOW!`);
        const targetPos = openPositions.get(pid);
        if (targetPos) {
          doLiquidate(pid, targetPos);
        }
        broadcast(msg);
      }
    } catch (e) { log(`⚠️ WS message error: ${(e as any)?.message}`); }
  });

  ws.on("close", () => {
    clearInterval(pingInterval);
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
let candleHistory: any[] = [];
let openPositions = new Map<string, any>();
let liquidating = new Set<string>();

async function watchEvents() {
  log("👀 Watching PositionOpened & PositionClosed events...");
  publicClient.watchContractEvent({
    address: POSITION_MANAGER_ADDRESS, abi: POSITION_MANAGER_ABI, eventName: "PositionOpened",
    onLogs: (logs) => {
      for (const l of logs) {
        const args = (l as any).args;
        openPositions.set(args.positionId.toString(), args);
        log(`➕ Position #${args.positionId} opened`);
      }
    }
  });
  publicClient.watchContractEvent({
    address: POSITION_MANAGER_ADDRESS, abi: POSITION_MANAGER_ABI, eventName: "PositionClosed",
    onLogs: (logs) => {
      for (const l of logs) {
        const args = (l as any).args;
        openPositions.delete(args.positionId.toString());
        log(`➖ Position #${args.positionId} closed`);
      }
    }
  });
  publicClient.watchContractEvent({
    address: POSITION_MANAGER_ADDRESS, abi: POSITION_MANAGER_ABI, eventName: "PositionLiquidated",
    onLogs: (logs) => {
      for (const l of logs) {
        const args = (l as any).args;
        openPositions.delete(args.positionId.toString());
        log(`💀 Position #${args.positionId} liquidated externally`);
      }
    }
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loadExistingPositions() {
  log("📂 Scanning chain for existing open positions...");
  try {
    const currentBlock = await publicClient.getBlockNumber();
    // Arc Testnet RPC limits eth_getLogs to 10,000 block range per request
    // We use 2,000 blocks (~20 min at ~6s/block) to stay safe with 3 parallel calls
    const SCAN_RANGE = 2000n;
    const fromBlock = currentBlock > SCAN_RANGE ? currentBlock - SCAN_RANGE : 0n;

    const [opened, closed, liquidated] = await Promise.all([
      publicClient.getLogs({ address: POSITION_MANAGER_ADDRESS, event: parseAbiItem("event PositionOpened(uint256 indexed positionId, address indexed trader, uint256 roundId, bool isLong, uint256 entryPrice, uint256 margin, uint256 leverage, uint256 size, uint256 liquidationPrice)"), fromBlock }),
      publicClient.getLogs({ address: POSITION_MANAGER_ADDRESS, event: parseAbiItem("event PositionClosed(uint256 indexed positionId, address indexed trader, uint256 exitPrice, int256 pnl, uint256 closeTimestamp)"), fromBlock }),
      publicClient.getLogs({ address: POSITION_MANAGER_ADDRESS, event: parseAbiItem("event PositionLiquidated(uint256 indexed positionId, address indexed trader, address indexed liquidator, uint256 liquidationPrice, uint256 marginLost)"), fromBlock })
    ]);

    for (const l of opened) {
      const args = (l as any).args;
      openPositions.set(args.positionId.toString(), args);
    }
    for (const l of closed) openPositions.delete((l as any).args.positionId.toString());
    for (const l of liquidated) openPositions.delete((l as any).args.positionId.toString());

    log(`✅ Loaded ${openPositions.size} open positions (scanned last ${SCAN_RANGE} blocks).`);
  } catch (err: any) {
    log(`⚠️ Load positions failed: ${err.message}`);
  }
}

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
    const receipt = await publicClient.waitForTransactionReceipt({ hash, pollingInterval: 500 });
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

function calcPriceMove(price: number, randomness: bigint, trendBias: number): number {
  const magnitudeSeed = Number(randomness % 100n);
  let magnitude: bigint;

  // INCREASED VOLATILITY - 3XTREMES STYLE
  if (magnitudeSeed <= 30) magnitude = 10n;       // 0.01%
  else if (magnitudeSeed <= 60) magnitude = 80n;  // 0.08%
  else if (magnitudeSeed <= 85) magnitude = 300n; // 0.30%
  else if (magnitudeSeed <= 96) magnitude = 800n; // 0.80%
  else magnitude = 3000n;                          // 3.00% EXTREME BLAST

  const priceMove = Math.max(1, Math.floor((price * Number(magnitude)) / Number(MOVE_DENOMINATOR)));

  // Bias thresholds based on round trend
  const downT = THRESHOLD_DOWN + BigInt(trendBias * 8000);
  const sideT = THRESHOLD_SIDEWAYS + BigInt(trendBias * 8000);

  if (randomness < downT) {
    return Math.max(1, price - priceMove);
  } else if (randomness < sideT) {
    // Tiny jitter even on sideways
    return price + (Number(randomness % 7n) - 3);
  } else {
    return price + priceMove;
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

  // Global drift: -15 to +15 (Subtle bias, not a bulldozer)
  const drift = Number((seed % 31n) - 15n);

  for (let s = 0; s < 60; s++) {
    const randomness = computeRandomness(seed, s);
    const open = price;
    
    // 1. Pure Volatility: High random noise per second
    const volatility = 150;
    const noise = Number((randomness % BigInt(volatility * 2 + 1)) - BigInt(volatility));
    
    // 2. Mean Reversion: If price moves too far from start, pull it back slightly
    const deviation = price - startPrice;
    const gravity = Math.floor(deviation * 0.05);
    
    // 3. Combine: Noise + subtle drift - gravity
    const move = noise + drift - gravity;
    const close = Math.max(1, price + move);

    // 4. Ensure Visible Body (No Dojis) but color is random based on move
    const bodySize = Math.abs(close - open);
    const minBody = 25;
    let finalClose = close;
    if (bodySize < minBody) {
      finalClose = close >= open ? open + minBody : open - minBody;
    }

    // 5. Professional Wicks: 30-70% of body size
    const finalBody = Math.abs(finalClose - open);
    const wickSize = Math.max(15, Math.floor(finalBody * (0.3 + (Number(randomness % 40n) / 100))));
    
    const high = Math.max(open, finalClose) + wickSize;
    const low = Math.max(1, Math.min(open, finalClose) - wickSize);

    candles.push({ second: s, open, high, low, close: finalClose, price: finalClose });
    price = finalClose;
  }

  return candles;
}

// ─── Round Lifecycle ──────────────────────────────────────────────────────────

// --- ASYNC ON-CHAIN TRANSITION LOGIC ---
let isBackgroundSettling = false;

async function startRoundOnChain() {
  log("🚀 Sending startRound to chain...");
  const ok = await sendTx("startRound", () =>
    walletClient.writeContract({
      address: ROUND_ENGINE_ADDRESS,
      abi: ROUND_ENGINE_ABI,
      functionName: "startRound",
      gas: 3000000n,
    })
  );

  if (!ok) {
    const isActive = await publicClient.readContract({ address: ROUND_ENGINE_ADDRESS, abi: ROUND_ENGINE_ABI, functionName: "roundActive" });
    if (!isActive) {
      log("⚠️  startRound gagal, retry in 2s...");
      setTimeout(startRoundOnChain, 2000);
      return;
    }
    log("✅ startRound tx receipt lost but round is active. Continuing...");
  }

  isBackgroundSettling = false; // Unblock trades ASAP

  // Read the REAL seed from chain and stream with it
  try {
    currentRoundId = await publicClient.readContract({ address: ROUND_ENGINE_ADDRESS, abi: ROUND_ENGINE_ABI, functionName: "currentRoundId" });
    const roundId = currentRoundId;
    const startPrice = await publicClient.readContract({ address: ROUND_ENGINE_ADDRESS, abi: ROUND_ENGINE_ABI, functionName: "getCurrentPrice" });
    const seed = await publicClient.readContract({ address: ROUND_ENGINE_ADDRESS, abi: ROUND_ENGINE_ABI, functionName: "getSeed", args: [roundId] });

    const roundIdNum = Number(roundId);
    const startPriceNum = Number(startPrice as bigint);
    const seedBig = seed as bigint;

    log(`🎲 Round #${roundIdNum} | Seed from chain: ${seedBig} | StartPrice: ${formatPrice(startPrice)}`);

    const candles = computeCandles(seedBig, startPriceNum);
    const finalPrice = candles[candles.length - 1].close;

    broadcast({ type: "ROUND_SETTLED", roundId: roundIdNum - 1, finalPrice: startPriceNum });
    broadcast({ type: "ROUND_START", roundId: roundIdNum, startPrice: startPriceNum });

    streamCandles(roundIdNum, candles, finalPrice);
  } catch (err: any) {
    log(`⚠️ Failed to read new round info: ${err?.message}. Falling back to startRound()...`);
    setTimeout(startRound, 2000);
  }
}

async function startRound() {
  if (isStarting) return;
  isStarting = true;
  log("🚀 Starting new round...");
  const ok = await sendTx("startRound", () =>
    walletClient.writeContract({
      address: ROUND_ENGINE_ADDRESS,
      abi: ROUND_ENGINE_ABI,
      functionName: "startRound",
      gas: 3000000n, // Bypass simulation with higher limit
    })
  );

  if (!ok) {
    const isActive = await publicClient.readContract({ address: ROUND_ENGINE_ADDRESS, abi: ROUND_ENGINE_ABI, functionName: "roundActive" });
    if (isActive) {
      log("✅ startRound tx receipt lost, but active. Proceeding...");
    } else {
      log("⚠️  startRound gagal, retry in 1s...");
      setTimeout(startRoundOnChain, 1000);
      return;
    }
  }


  // Read round info + seed from chain
  currentRoundId = await publicClient.readContract({ address: ROUND_ENGINE_ADDRESS, abi: ROUND_ENGINE_ABI, functionName: "currentRoundId" });
  const roundId = currentRoundId;
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
      time: Math.floor(Date.now() / 1000), // Absolute timestamp for chart continuity
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

    // ── Hybrid DEX: NO per-second on-chain price update ─────────────────────
    // Price is delivered to the contract JIT (Just-In-Time) only when needed:
    //   - backendOpen / backendClose: execution price is passed as an argument
    //   - doLiquidate: price is passed directly to backendLiquidatePosition

    // --- INSTANT LIQUIDATION CHECK (off-chain) ---
    checkAllLiquidations(candle.high, candle.low);

    broadcast(candleMsg);

    if (!isLockWindow) {
      log(`💹 second ${candle.second} | price: ${formatPrice(BigInt(candle.close))}`);
    } else if (candle.second >= 55) {
      log(`🔒 second ${candle.second} lock window`);
    }

    idx++;
  }, 1000);

  // Optimistic instant frontend transition
  const settleDelay = candles.length * 1000;
  settleTimeout = setTimeout(() => handleOptimisticRoundEnd(roundId, finalPrice), settleDelay);
}

async function handleOptimisticRoundEnd(roundId: number, finalPrice: number) {
  stopLoop();
  isBackgroundSettling = true;

  // 1. Immediately tell frontend the round is settling (clears positions/lines)
  broadcast({ type: "ROUND_SETTLING", roundId, finalPrice });

  // 2. Wait for any in-flight liquidations to complete BEFORE settling on-chain.
  //    This prevents settleRound from closing a position that should be liquidated,
  //    which would incorrectly return margin to the user instead of sending it to insurance.
  if (liquidating.size > 0) {
    log(`⏳ Waiting for ${liquidating.size} pending liquidation(s) before settle...`);
    let waited = 0;
    while (liquidating.size > 0 && waited < 15000) {
      await new Promise(r => setTimeout(r, 500));
      waited += 500;
    }
    if (liquidating.size > 0) {
      log(`⚠️ ${liquidating.size} liquidation(s) still pending after 15s — proceeding anyway`);
      liquidating.clear(); // Clear to avoid blocking settlement forever
    } else {
      log(`✅ All liquidations confirmed — proceeding to settle`);
    }
  }

  // 3. Perform on-chain settlement — WAIT for it to succeed before starting next round
  log(`⚡ Starting background settlement for round #${roundId}...`);
  await settleOnChain(roundId, finalPrice);
}

async function settleOnChain(roundId: number, finalPrice: number) {
  log(`🏁 Settling round #${roundId} on-chain at price ${formatPrice(BigInt(Math.floor(finalPrice)))}...`);

  let attempts = 0;
  while (attempts < 10) {
    const ok = await sendTx("settleRound", () =>
      walletClient.writeContract({
        address: ROUND_ENGINE_ADDRESS,
        abi: ROUND_ENGINE_ABI,
        functionName: "settleRound",
        args: [BigInt(Math.floor(finalPrice))],
        gas: 3000000n,
      })
    );

    if (ok) {
      log(`✅ Round #${roundId} settled on-chain! PnL distributed to traders.`);
      // Now start new round on-chain, then read REAL seed to stream
      await startRoundOnChain();
      return;
    }

    attempts++;
    log(`⏳ Retry settle (${attempts}/10) in 3s...`);
    await new Promise((r) => setTimeout(r, 3000));
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

  isBackgroundSettling = false;
  setTimeout(startRound, 2000);
}

// ─── Hybrid DEX: Backend Execution Functions ─────────────────────────────────

/**
 * Open a position on behalf of a user.
 * Called when Frontend sends an OPEN_POSITION WS message.
 */
async function backendOpen(
  trader: `0x${string}`,
  isLong: boolean,
  margin: bigint,
  leverage: bigint,
  price: number
) {
  // Block during settle/start to avoid nonce conflicts
  while (isBackgroundSettling) {
    await new Promise(r => setTimeout(r, 200));
  }

  let attempts = 0;
  while (attempts < 3) {
    try {
      const hash = await walletClient.writeContract({
        address: POSITION_MANAGER_ADDRESS,
        abi: POSITION_MANAGER_ABI,
        functionName: "backendOpenPosition",
        args: [trader, isLong, margin, leverage, BigInt(Math.floor(price))],
      });
      log(`📤 backendOpen tx: ${hash}`);

      // ✅ Konfirmasi LANGSUNG ke frontend setelah hash — tidak tunggu mining
      broadcast({ type: "POSITION_CONFIRMED", trader, isLong, price, tx: hash, margin: margin.toString(), leverage: leverage.toString() });

      // Receipt verification jalan di background (catch revert jika ada)
      publicClient.waitForTransactionReceipt({ hash }).then((receipt) => {
        if (receipt.status === "success") {
          log(`✅ Position OPENED on-chain for ${trader} (block ${receipt.blockNumber})`);
        } else {
          log(`❌ backendOpen REVERTED for ${trader} — notifying rollback`);
          broadcast({ type: "POSITION_FAILED", trader, reason: "tx_reverted" });
        }
      }).catch((err: any) => {
        log(`⚠️ Receipt check error: ${err?.shortMessage || err?.message}`);
      });

      return;
    } catch (err: any) {
      attempts++;
      log(`⚠️ backendOpen attempt ${attempts}/3 failed: ${err?.shortMessage || err?.message}`);
      if (attempts < 3) await new Promise((r) => setTimeout(r, 2000));
    }
  }
  broadcast({ type: "POSITION_FAILED", trader, reason: "max_retries_exceeded" });
}

/**
 * Close a position on behalf of a user.
 * Called when Frontend sends a CLOSE_POSITION WS message.
 */
async function backendClose(positionId: bigint, price: number) {
  while (isBackgroundSettling) {
    await new Promise(r => setTimeout(r, 200));
  }

  let attempts = 0;
  while (attempts < 3) {
    try {
      const hash = await walletClient.writeContract({
        address: POSITION_MANAGER_ADDRESS,
        abi: POSITION_MANAGER_ABI,
        functionName: "backendClosePosition",
        args: [positionId, BigInt(Math.floor(price))],
      });
      log(`📤 backendClose tx: ${hash} | positionId=${positionId}`);

      // ✅ Konfirmasi LANGSUNG ke frontend setelah hash — tidak tunggu mining
      broadcast({ type: "CLOSE_CONFIRMED", positionId: positionId.toString(), price, tx: hash });

      // Receipt verification jalan di background
      publicClient.waitForTransactionReceipt({ hash }).then((receipt) => {
        if (receipt.status === "success") {
          log(`✅ Position #${positionId} CLOSED on-chain (block ${receipt.blockNumber})`);
        } else {
          log(`❌ backendClose REVERTED for #${positionId} — notifying rollback`);
          broadcast({ type: "CLOSE_FAILED", positionId: positionId.toString(), reason: "tx_reverted" });
        }
      }).catch((err: any) => {
        log(`⚠️ Receipt check error: ${err?.shortMessage || err?.message}`);
      });

      return;
    } catch (err: any) {
      attempts++;
      log(`⚠️ backendClose attempt ${attempts}/3 failed: ${err?.shortMessage || err?.message}`);
      if (attempts < 3) await new Promise((r) => setTimeout(r, 2000));
    }
  }
  broadcast({ type: "CLOSE_FAILED", positionId: positionId.toString(), reason: "max_retries_exceeded" });
}

// ─── Liquidation Logic ────────────────────────────────────────────────────────

async function checkAllLiquidations(high: number, low: number) {
  if (openPositions.size === 0) return;
  const hiBig = BigInt(Math.floor(high));
  const loBig = BigInt(Math.floor(low));

  for (const [id, pos] of openPositions) {
    if (liquidating.has(id)) continue;
    const hit = pos.isLong ? loBig <= pos.liquidationPrice : hiBig >= pos.liquidationPrice;
    if (hit) doLiquidate(id, pos);
  }
}

async function doLiquidate(id: string, pos: any) {
  if (liquidating.has(id)) return;
  liquidating.add(id);

  broadcast({
    type: "POSITION_LIQUIDATED",
    positionId: id,
    trader: pos.trader,
    liquidationPrice: pos.liquidationPrice.toString(),
  });

  log(`🔥 Liquidating #${id} | executionPrice=${formatPrice(pos.liquidationPrice)}`);

  let attempts = 0;
  while (attempts < 3) {
    try {
      const hash = await walletClient.writeContract({
        address: POSITION_MANAGER_ADDRESS,
        abi: POSITION_MANAGER_ABI,
        functionName: "backendLiquidatePosition",
        args: [pos.positionId, pos.liquidationPrice],
        gas: 3000000n, // bypass simulation
      });

      log(`📤 backendLiquidate tx: ${hash}`);
      await publicClient.waitForTransactionReceipt({ hash });

      openPositions.delete(id);
      liquidating.delete(id);
      log(`✅ #${id} liquidated on-chain!`);
      broadcast({ type: "LIQUIDATION_CONFIRMED", positionId: id, tx: hash });
      return;
    } catch (err: any) {
      attempts++;
      log(`❌ backendLiquidate(#${id}) attempt ${attempts}/3 error: ${err.shortMessage || err.message}`);
      if (attempts < 3) await new Promise(r => setTimeout(r, 2000));
    }
  }

  // If we reach here, all 3 attempts failed
  liquidating.delete(id);
  broadcast({ type: "LIQUIDATION_FAILED", positionId: id, reason: "max_retries_exceeded" });
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

  await loadExistingPositions();
  watchEvents();

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
      settleTimeout = setTimeout(() => handleOptimisticRoundEnd(roundIdNum, finalPrice), remaining * 1000);
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
