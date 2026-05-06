const WebSocket = require('ws');

const url = 'wss://3xtremes-production.up.railway.app';
console.log(`🔍 Testing connection to: ${url}`);

const ws = new WebSocket(url);

let messagesReceived = 0;
const timeout = setTimeout(() => {
  console.log('❌ Timeout: No messages received after 10 seconds.');
  process.exit(1);
}, 10000);

ws.on('open', () => {
  console.log('✅ Connected to WebSocket Server successfully!');
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  messagesReceived++;
  console.log(`📥 Received message #${messagesReceived}: type=${msg.type}`);
  
  if (messagesReceived >= 3) {
    console.log('🎉 WebSocket is LIVE and streaming data perfectly!');
    clearTimeout(timeout);
    ws.close();
    process.exit(0);
  }
});

ws.on('error', (err) => {
  console.error('❌ WebSocket Error:', err.message);
  process.exit(1);
});
