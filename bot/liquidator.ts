import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";
import { WebSocket } from "ws";
import * as dotenv from "dotenv";

dotenv.config();

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
  blockExplorers: { default: { name: "ArcScan", url: "https://testnet.arcscan.app" } },
});

const POSITION_MANAGER_ABI = parseAbi([
  "function liquidatePosition(uint256 positionId) external",
  "function checkLiquidation(uint256 positionId) external view returns (bool)",
  "event PositionOpened(uint256 indexed positionId, address indexed trader, uint256 roundId, bool isLong, uint256 entryPrice, uint256 margin, uint256 leverage, uint256 size, uint256 liquidationPrice)",
  "event PositionClosed(uint256 indexed positionId, address indexed trader, uint256 exitPrice, int256 pnl, uint256 closeTimestamp)",
  "event PositionLiquidated(uint256 indexed positionId, address indexed trader, address indexed liquidator, uint256 liquidationPrice, uint256 marginLost)",
]);

const POSITION_MANAGER_ADDRESS = process.env.POSITION_MANAGER_ADDRESS as `0x${string}`;
let rawKey = (process.env.KEEPER_PRIVATE_KEY || "").replace(/['"]/g, "").trim();
if (rawKey && !rawKey.startsWith("0x")) {
  rawKey = `0x${rawKey}`;
}
const PRIVATE_KEY = rawKey as `0x${string}`;
const WS_URL = process.env.WS_URL || `ws://localhost:${process.env.PORT || 8080}`;

if (!POSITION_MANAGER_ADDRESS || !PRIVATE_KEY || PRIVATE_KEY === "0x") {
  console.error("❌ Missing POSITION_MANAGER_ADDRESS or KEEPER_PRIVATE_KEY in environment");
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY);
const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });
const walletClient = createWalletClient({ chain: arcTestnet, transport: http(), account });

interface CachedPosition {
  positionId: bigint;
  trader: string;
  isLong: boolean;
  liquidationPrice: bigint;
}

const openPositions = new Map<string, CachedPosition>();
const liquidating = new Set<string>();

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function formatPrice(raw: bigint): string {
  return (Number(raw) / 100000).toFixed(5);
}

// ─── Load Existing Open Positions on Startup ─────────────────────────────────

async function loadExistingPositions() {
  log("📂 Loading existing open positions from chain (scanning last 50k blocks)...");
  try {
    const currentBlock = await publicClient.getBlockNumber();
    const fromBlock = currentBlock > 50000n ? currentBlock - 50000n : 0n;

    const [opened, closed, liquidated] = await Promise.all([
      publicClient.getLogs({ address: POSITION_MANAGER_ADDRESS, event: parseAbi(["event PositionOpened(uint256 indexed positionId, address indexed trader, uint256 roundId, bool isLong, uint256 entryPrice, uint256 margin, uint256 leverage, uint256 size, uint256 liquidationPrice)"])[0], fromBlock }),
      publicClient.getLogs({ address: POSITION_MANAGER_ADDRESS, event: parseAbi(["event PositionClosed(uint256 indexed positionId, address indexed trader, uint256 exitPrice, int256 pnl, uint256 closeTimestamp)"])[0], fromBlock }),
      publicClient.getLogs({ address: POSITION_MANAGER_ADDRESS, event: parseAbi(["event PositionLiquidated(uint256 indexed positionId, address indexed trader, address indexed liquidator, uint256 liquidationPrice, uint256 marginLost)"])[0], fromBlock })
    ]);

    for (const l of opened) {
      const args = (l as any).args;
      if (!args) continue;
      openPositions.set(args.positionId.toString(), {
        positionId: args.positionId,
        trader: args.trader,
        isLong: args.isLong,
        liquidationPrice: args.liquidationPrice,
      });
    }

    for (const l of closed) {
      const args = (l as any).args;
      if (args) openPositions.delete(args.positionId.toString());
    }

    for (const l of liquidated) {
      const args = (l as any).args;
      if (args) openPositions.delete(args.positionId.toString());
    }

    log(`✅ Loaded ${openPositions.size} open positions from chain scan.`);
  } catch (err: any) {
    log(`⚠️  Could not load existing positions: ${err?.message}`);
  }
}

// ─── Watch Events ─────────────────────────────────────────────────────────────

async function watchEvents() {
  log("👀 Watching PositionOpened & PositionLiquidated events...");

  // New position opened → add to cache
  publicClient.watchContractEvent({
    address: POSITION_MANAGER_ADDRESS,
    abi: POSITION_MANAGER_ABI,
    eventName: "PositionOpened",
    onLogs: (logs) => {
      for (const l of logs) {
        const args = (l as any).args;
        const id = args.positionId.toString();
        openPositions.set(id, {
          positionId: args.positionId,
          trader: args.trader,
          isLong: args.isLong,
          liquidationPrice: args.liquidationPrice,
        });
        log(`➕ Position #${id} | ${args.isLong ? "LONG" : "SHORT"} | liqPrice: ${formatPrice(args.liquidationPrice)} | ${args.trader.slice(0, 8)}...`);
      }
    },
    onError: (err) => log(`❌ watchPositionOpened: ${err.message}`),
  });

  // Position closed manually → remove from cache
  publicClient.watchContractEvent({
    address: POSITION_MANAGER_ADDRESS,
    abi: POSITION_MANAGER_ABI,
    eventName: "PositionClosed",
    onLogs: (logs) => {
      for (const l of logs) {
        const args = (l as any).args;
        const id = args.positionId.toString();
        openPositions.delete(id);
        log(`➖ Position #${id} closed manually`);
      }
    },
    onError: (err) => log(`❌ watchPositionClosed: ${err.message}`),
  });

  // Position liquidated → remove from cache
  publicClient.watchContractEvent({
    address: POSITION_MANAGER_ADDRESS,
    abi: POSITION_MANAGER_ABI,
    eventName: "PositionLiquidated",
    onLogs: (logs) => {
      for (const l of logs) {
        const args = (l as any).args;
        const id = args.positionId.toString();
        openPositions.delete(id);
        liquidating.delete(id);
        log(`💀 Position #${id} liquidated`);
      }
    },
    onError: (err) => log(`❌ watchPositionLiquidated: ${err.message}`),
  });
}

// ─── Liquidation Check ────────────────────────────────────────────────────────

async function checkAndLiquidate(high: number, low: number) {
  if (openPositions.size === 0) return;

  const hiBig = BigInt(Math.floor(high));
  const loBig = BigInt(Math.floor(low));
  const toLiquidate: CachedPosition[] = [];

  for (const [id, pos] of openPositions) {
    if (liquidating.has(id)) continue;
    
    // WICK DETECTION: 
    // Long is liquidated if LOW hits LiqPrice
    // Short is liquidated if HIGH hits LiqPrice
    const hit = pos.isLong
      ? loBig <= pos.liquidationPrice
      : hiBig >= pos.liquidationPrice;

    if (hit) toLiquidate.push(pos);
  }

  if (toLiquidate.length === 0) return;

  log(`🎯 ${toLiquidate.length} position(s) hit liq threshold at price ${formatPrice(hiBig)}`);

  await Promise.all(toLiquidate.map(async (pos) => {
    const id = pos.positionId.toString();
    if (liquidating.has(id)) return;
    liquidating.add(id);

    // Double-check on-chain
    try {
      const ok = await publicClient.readContract({
        address: POSITION_MANAGER_ADDRESS,
        abi: POSITION_MANAGER_ABI,
        functionName: "checkLiquidation",
        args: [pos.positionId],
      }) as boolean;

      if (!ok) {
        log(`⚠️  #${id} not liquidatable on-chain, skip`);
        liquidating.delete(id);
        openPositions.delete(id);
        return;
      }
    } catch {
      liquidating.delete(id);
      return;
    }

    // Fire tx
    try {
      log(`🔥 Liquidating #${id} | ${pos.isLong ? "LONG" : "SHORT"} | liqPrice: ${formatPrice(pos.liquidationPrice)}`);
      const hash = await walletClient.writeContract({
        address: POSITION_MANAGER_ADDRESS,
        abi: POSITION_MANAGER_ABI,
        functionName: "liquidatePosition",
        args: [pos.positionId],
      });
      log(`📤 liquidatePosition(#${id}) tx: ${hash}`);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === "success") {
        log(`✅ #${id} liquidated! Reward → ${account.address.slice(0, 8)}...`);
        openPositions.delete(id);
      } else {
        log(`❌ liquidatePosition(#${id}) reverted`);
        liquidating.delete(id);
      }
    } catch (err: any) {
      log(`❌ liquidatePosition(#${id}) error: ${err?.shortMessage || err?.message}`);
      liquidating.delete(id);
    }
  }));
}

// ─── WebSocket to Keeper ──────────────────────────────────────────────────────

function connectToKeeper() {
  log(`🔌 Connecting to keeper: ${WS_URL}`);
  const ws = new WebSocket(WS_URL);

  ws.on("open", () => log("✅ Connected to keeper WS"));

  ws.on("message", async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      switch (msg.type) {
        case "ROUND_START":
          log(`🎰 Round #${msg.roundId} started`);
          // DO NOT CLEAR openPositions! They might span across rounds.
          break;
        case "CANDLE":
          // Check for liquidations using BOTH High and Low (Wick detection)
          await checkAndLiquidate(msg.high, msg.low);
          break;
        case "ROUND_SETTLED":
          log(`🏁 Round #${msg.roundId} settled`);
          // DO NOT CLEAR openPositions! Let the events (PositionClosed) do the work.
          break;
      }
    } catch { }
  });

  ws.on("close", () => {
    log("🔌 WS disconnected, retry in 3s...");
    setTimeout(connectToKeeper, 3000);
  });

  ws.on("error", (err) => log(`❌ WS error: ${err.message}`));
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  log("🤖 3xtremes Liquidator Bot");
  log(`👛 Wallet: ${account.address}`);
  log(`📄 PositionManager: ${POSITION_MANAGER_ADDRESS}`);
  log(`📡 Keeper WS: ${WS_URL}`);
  log("💰 Reward: 2% margin per liquidation\n");

  await loadExistingPositions();
  watchEvents();
  connectToKeeper();
}

process.on("SIGINT", () => { log("🛑 Shutdown"); process.exit(0); });
process.on("SIGTERM", () => { log("🛑 Shutdown"); process.exit(0); });

init().catch((err) => { console.error("Fatal:", err); process.exit(1); });
