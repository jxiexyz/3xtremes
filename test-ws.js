const WebSocket = require('ws');

const ws = new WebSocket('wss://3xtremes-production.up.railway.app');

ws.on('open', () => {
  console.log('✅ Connected to Railway Keeper WebSocket!');
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === 'ROUND_START') {
    console.log(`\n🚀 ROUND START: Round #${msg.roundId} | Start Price: ${msg.startPrice / 100000}`);
  } else if (msg.type === 'CANDLE') {
    console.log(`📊 CANDLE ${msg.candle.second}s | Close: ${msg.candle.close / 100000}`);
  } else {
    console.log('📨 Message:', msg);
  }
});

ws.on('error', (err) => {
  console.error('❌ WebSocket Error:', err.message);
});

ws.on('close', () => {
  console.log('🔌 Disconnected.');
});

// Run for 15 seconds then exit
setTimeout(() => {
  console.log('⏳ Test finished.');
  process.exit(0);
}, 15000);
