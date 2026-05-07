/**
 * Test script: Simulates Frontend → Bot WebSocket communication
 * Usage: node scripts/testHybridDex.js
 */

const WebSocket = require("ws");

const WS_URL = "ws://localhost:8080";
const TRADER  = "0x22A88bF5c6C0A224627B76073B69FA0b98b73C9E"; // deployer wallet (has USCC balance)

let latestPrice = null;
let latestPositionId = null;

const ws = new WebSocket(WS_URL);

ws.on("open", () => {
  console.log("✅ Connected to Keeper Bot WS\n");
  console.log("⏳ Waiting for first candle to get live price...\n");
});

ws.on("message", (data) => {
  const msg = JSON.parse(data.toString());

  // Update latest price from any candle/history
  if (msg.type === "CANDLE") {
    latestPrice = msg.price;
    process.stdout.write(`\r💹 Live price: ${(latestPrice / 100000).toFixed(5)}   `);
  }

  if (msg.type === "HISTORY" && msg.history?.length > 0) {
    latestPrice = msg.history[msg.history.length - 1].price;
  }

  // ── Listen for backend confirmations ─────────────────────────────────────
  if (msg.type === "POSITION_CONFIRMED") {
    console.log(`\n\n✅ POSITION_CONFIRMED on-chain!`);
    console.log(`   Trader : ${msg.trader}`);
    console.log(`   Side   : ${msg.isLong ? "LONG" : "SHORT"}`);
    console.log(`   Price  : ${(msg.price / 100000).toFixed(5)}`);
    console.log(`   Tx     : ${msg.tx}`);

    // After open confirmed, wait 5 seconds then try to close
    console.log("\n⏳ Waiting 5 seconds then sending CLOSE_POSITION...\n");
    setTimeout(() => sendClose(), 5000);
  }

  if (msg.type === "POSITION_FAILED") {
    console.log(`\n\n❌ POSITION_FAILED: ${msg.reason}`);
    console.log("   (Kemungkinan saldo USCC kurang, round lagi lock window, atau OI limit)");
    ws.close();
  }

  if (msg.type === "CLOSE_CONFIRMED") {
    console.log(`\n✅ CLOSE_CONFIRMED on-chain!`);
    console.log(`   Position : #${msg.positionId}`);
    console.log(`   Exit Price: ${(msg.price / 100000).toFixed(5)}`);
    console.log(`   Tx     : ${msg.tx}`);
    console.log("\n🎉 Full round-trip test complete: OPEN → CLOSE via Hybrid DEX!\n");
    ws.close();
    process.exit(0);
  }

  if (msg.type === "CLOSE_FAILED") {
    console.log(`\n❌ CLOSE_FAILED: ${msg.reason}`);
    ws.close();
  }

  // Capture positionId from PositionOpened event broadcast (if bot forwards it)
  if (msg.type === "ROUND_START" || msg.type === "ROUND_RESUME") {
    console.log(`\n📢 Round event: ${msg.type} | roundId=${msg.roundId}`);
  }
});

// Send OPEN_POSITION after getting first price
let opened = false;
const checkAndOpen = setInterval(() => {
  if (latestPrice && !opened) {
    opened = true;
    clearInterval(checkAndOpen);
    setTimeout(() => sendOpen(), 2000); // small delay to let price stabilize
  }
}, 500);

function sendOpen() {
  if (!latestPrice) {
    console.log("❌ No price yet, aborting.");
    return;
  }

  const payload = {
    type: "OPEN_POSITION",
    trader: TRADER,
    isLong: true,          // LONG
    margin: 1000,          // 1000 USCC margin (in USCC units, not wei — adjust if needed)
    leverage: 10,          // 10x leverage
    price: latestPrice,    // current live price from WS
  };

  console.log(`\n\n📤 Sending OPEN_POSITION to bot...`);
  console.log(`   Trader  : ${payload.trader}`);
  console.log(`   Side    : LONG`);
  console.log(`   Margin  : ${payload.margin} USCC`);
  console.log(`   Leverage: ${payload.leverage}x`);
  console.log(`   Price   : ${(payload.price / 100000).toFixed(5)}`);
  console.log(`   Expected liq price: ${((payload.price * (1 - 1/payload.leverage)) / 100000).toFixed(5)}\n`);

  ws.send(JSON.stringify(payload));
}

function sendClose() {
  // positionId diambil dari counter contract — untuk test kita pake 1 dulu
  // In production, frontend tracks positionId dari event POSITION_CONFIRMED
  const payload = {
    type: "CLOSE_POSITION",
    positionId: 1,         // ← ganti dengan positionId yang bener dari event
    price: latestPrice,
  };

  console.log(`📤 Sending CLOSE_POSITION #${payload.positionId} to bot...`);
  console.log(`   Exit price: ${(payload.price / 100000).toFixed(5)}\n`);
  ws.send(JSON.stringify(payload));
}

ws.on("error", (err) => {
  console.error("❌ WS Error:", err.message);
  console.error("   Pastiin bot lagi jalan di port 8080!");
});

ws.on("close", () => {
  console.log("\n🔌 WS disconnected.");
});

// Timeout safety
setTimeout(() => {
  console.log("\n⏱️ Test timeout (60s). Closing.");
  ws.close();
  process.exit(0);
}, 60000);
