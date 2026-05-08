'use client';

import Link from 'next/link';
import { Terminal, ShieldAlert, Zap, Layers, Cpu, ArrowRight, BookOpen, Lock, Code2, Activity } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0a0d14] text-white/80 font-sans selection:bg-blue-500/30">
      
      {/* Navbar Minimal */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-[#0a0d14]/80 backdrop-blur-md border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center shadow-[0_0_12px_rgba(37,99,235,0.5)]">
             <svg viewBox="0 0 100 100" className="w-4 h-4">
                <path d="M 15 20 H 45 L 30 50 H 45 L 15 80" fill="none" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 55 20 L 85 80 M 85 20 L 55 80" fill="none" stroke="#bfdbfe" strokeWidth="12" strokeLinecap="round" />
             </svg>
          </div>
          <span className="font-bold text-sm tracking-tight text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>3xtremes Docs</span>
        </Link>
        <div className="flex gap-4">
          <Link href="/trade" className="text-xs font-medium text-white/60 hover:text-white transition-colors">App</Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="text-xs font-medium text-white/60 hover:text-white transition-colors">GitHub</a>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="max-w-6xl mx-auto flex pt-24 pb-24 px-6 md:px-8">
        
        {/* Sidebar Navigation */}
        <aside className="w-64 flex-shrink-0 hidden lg:block sticky top-24 self-start max-h-[calc(100vh-100px)] overflow-y-auto pr-8 custom-scrollbar">
          <div className="space-y-8">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Overview</h4>
              <ul className="space-y-2 text-[13px]">
                <li><a href="#introduction" className="text-white/60 hover:text-white transition-colors block py-1">Introduction</a></li>
                <li><a href="#core-concepts" className="text-white/60 hover:text-white transition-colors block py-1">Core Concepts</a></li>
                <li><a href="#architecture" className="text-white/60 hover:text-white transition-colors block py-1">Architecture</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Integration</h4>
              <ul className="space-y-2 text-[13px]">
                <li><a href="#quick-start" className="text-white/60 hover:text-white transition-colors block py-1">Quick Start</a></li>
                <li><a href="#api-reference" className="text-white/60 hover:text-white transition-colors block py-1">WebSocket API</a></li>
                <li><a href="#user-flow" className="text-white/60 hover:text-white transition-colors block py-1">Lifecycle & Flow</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Resources</h4>
              <ul className="space-y-2 text-[13px]">
                <li><a href="#security" className="text-white/60 hover:text-white transition-colors block py-1">Security & Risk</a></li>
                <li><a href="#faq" className="text-white/60 hover:text-white transition-colors block py-1">FAQ</a></li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0 max-w-3xl prose prose-invert prose-blue">
          
          <header className="mb-16">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">Documentation</h1>
            <p className="text-lg text-white/50 leading-relaxed">
              Explore the infrastructure powering 3xtremes: a high-velocity, low-latency prediction market engine designed for extreme volatility and instantaneous settlement.
            </p>
          </header>

          <div className="space-y-24">
            
            {/* INTRODUCTION */}
            <section id="introduction" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20"><BookOpen className="w-5 h-5 text-blue-400" /></div>
                <h2 className="text-2xl font-bold text-white m-0">What is 3xtremes?</h2>
              </div>
              <p className="text-white/70 leading-relaxed text-[15px]">
                3xtremes is a decentralized infrastructure layer for ultra-short-term prediction markets. We condense market volatility into 60-second execution epochs, allowing users to leverage capital up to 10,000x on real-time price feeds.
              </p>
              <p className="text-white/70 leading-relaxed text-[15px] mt-4">
                Unlike traditional exchanges that rely on slow order books and complex margin requirements, 3xtremes operates as a binary engine. You predict the vector of the asset (Long/Short). If correct at the end of the epoch, you realize exponential gains. If the threshold is breached, the position is instantly liquidated. No margin calls, no delays.
              </p>
            </section>

            {/* CORE CONCEPTS */}
            <section id="core-concepts" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20"><Zap className="w-5 h-5 text-emerald-400" /></div>
                <h2 className="text-2xl font-bold text-white m-0">Core Concepts</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl">
                  <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-400" /> 60-Second Epochs</h3>
                  <p className="text-[13px] text-white/60 leading-relaxed m-0">
                    Markets operate in continuous 60-second loops. Positions opened during an epoch are locked at T-5 seconds and settled simultaneously at T-0 based on the absolute oracle price.
                  </p>
                </div>
                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl">
                  <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><ArrowRight className="w-4 h-4 text-rose-400" /> Hyper-Leverage</h3>
                  <p className="text-[13px] text-white/60 leading-relaxed m-0">
                    Capital can be multiplied from 10x up to 10,000x. High leverage radically compresses the liquidation threshold, amplifying both potential upside and absolute risk.
                  </p>
                </div>
                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl">
                  <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-orange-400" /> Absolute Liquidation</h3>
                  <p className="text-[13px] text-white/60 leading-relaxed m-0">
                    The liquidation engine operates with zero tolerance. If PnL hits -100% within the epoch, the position is systematically seized. Margin calls do not exist in the protocol.
                  </p>
                </div>
                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl">
                  <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><Layers className="w-4 h-4 text-purple-400" /> EVM Compatibility</h3>
                  <p className="text-[13px] text-white/60 leading-relaxed m-0">
                    Natively integrated with EVM architectures (currently running on ARC Testnet). Balances and settlements are anchored using EIP-6963 compatible wallets.
                  </p>
                </div>
              </div>
            </section>

            {/* ARCHITECTURE */}
            <section id="architecture" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20"><Cpu className="w-5 h-5 text-purple-400" /></div>
                <h2 className="text-2xl font-bold text-white m-0">Architecture</h2>
              </div>
              <p className="text-white/70 leading-relaxed text-[15px] mb-6">
                3xtremes utilizes a hybrid architecture to achieve sub-second execution while maintaining verifiable blockchain state synchronization.
              </p>
              
              <ul className="space-y-4">
                <li className="flex gap-4">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  <div>
                    <strong className="text-white text-[14px]">WebSocket Data Layer</strong>
                    <p className="text-[14px] text-white/60 m-0 mt-1">A high-throughput WebSocket connection streams tick-by-tick market data, ensuring clients render real-time charts at 60fps without polling overhead.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <div>
                    <strong className="text-white text-[14px]">Optimistic Execution UI</strong>
                    <p className="text-[14px] text-white/60 m-0 mt-1">Client-side state management immediately reflects position entries locally. True confirmation follows milliseconds later from the matching engine.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                  <div>
                    <strong className="text-white text-[14px]">Settlement Engine</strong>
                    <p className="text-[14px] text-white/60 m-0 mt-1">On round completion (T-0), the backend engine calculates PnL delta against the oracle price, distributing rewards or sweeping margin atomically.</p>
                  </div>
                </li>
              </ul>
            </section>

            {/* QUICK START */}
            <section id="quick-start" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-pink-500/10 rounded-lg border border-pink-500/20"><Terminal className="w-5 h-5 text-pink-400" /></div>
                <h2 className="text-2xl font-bold text-white m-0">Quick Start</h2>
              </div>
              <p className="text-white/70 leading-relaxed text-[15px] mb-4">
                Run the frontend application locally to connect with the 3xtremes testnet environment.
              </p>
              
              <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden mt-4">
                <div className="flex items-center px-4 py-2 bg-white/[0.02] border-b border-white/5 text-xs text-white/40 font-mono">
                  Terminal
                </div>
                <div className="p-4 overflow-x-auto text-sm font-mono text-emerald-400">
                  <div className="opacity-50 text-white/50 mb-1"># Clone the repository</div>
                  <div>git clone https://github.com/jxiexyz/3xtremes.git</div>
                  <div>cd 3xtremes/frontend</div>
                  <div className="opacity-50 text-white/50 mt-3 mb-1"># Install dependencies</div>
                  <div>npm install</div>
                  <div className="opacity-50 text-white/50 mt-3 mb-1"># Start the development server</div>
                  <div>npm run dev</div>
                </div>
              </div>
            </section>

            {/* API REFERENCE */}
            <section id="api-reference" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20"><Code2 className="w-5 h-5 text-yellow-400" /></div>
                <h2 className="text-2xl font-bold text-white m-0">WebSocket API</h2>
              </div>
              <p className="text-white/70 leading-relaxed text-[15px] mb-6">
                Direct integration is achieved via a stateful WebSocket connection. Payloads utilize strict JSON formatting.
              </p>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[15px] font-bold text-white mb-3">Opening a Position</h4>
                  <p className="text-[14px] text-white/60 mb-3">Construct an <code>OPEN_POSITION</code> payload to enter a trade during the active window (T-60s to T-5s).</p>
                  <div className="bg-[#111] border border-white/10 rounded-xl p-4 overflow-x-auto text-[13px] font-mono text-white/80">
<pre className="m-0"><code>{`{
  "type": "OPEN_POSITION",
  "trader": "0xYourWalletAddress...",
  "isLong": true,
  "margin": 10000000,    // Scaled to 6 decimals (10.00)
  "leverage": 1000,      // Multiplier (1000x)
  "price": 128500        // Expected entry price
}`}</code></pre>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                  <div className="text-blue-400 mt-0.5"><BookOpen className="w-4 h-4" /></div>
                  <div className="text-[13px] text-blue-200/80 leading-relaxed">
                    <strong className="text-blue-300 block mb-1">Note on Validation</strong>
                    The backend verifies balance states and active epoch windows before confirming. If successful, you will receive a <code>POSITION_CONFIRMED</code> response. If the epoch is locked, you will receive <code>POSITION_FAILED</code>.
                  </div>
                </div>
              </div>
            </section>

            {/* SECURITY */}
            <section id="security" className="scroll-mt-24 border-t border-white/10 pt-16">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20"><Lock className="w-5 h-5 text-rose-400" /></div>
                <h2 className="text-2xl font-bold text-white m-0">Security & Risk Disclosures</h2>
              </div>
              <p className="text-white/70 leading-relaxed text-[15px] mb-6">
                Operating high-leverage infrastructure requires uncompromising security constraints and full transparency regarding user risk.
              </p>

              <div className="grid gap-4">
                <div className="p-4 border-l-2 border-orange-500 bg-orange-500/5">
                  <h4 className="text-sm font-bold text-orange-400 mb-1">Epoch Locking (Anti-Snipe)</h4>
                  <p className="text-[13px] text-orange-200/70 m-0">At T-5 seconds, the protocol enforces a hard lock on the order book. This guarantees fairness by preventing algorithmic front-running or late-stage sniping based on impending resolution prices.</p>
                </div>
                <div className="p-4 border-l-2 border-rose-500 bg-rose-500/5">
                  <h4 className="text-sm font-bold text-rose-400 mb-1">Financial Risk Warning</h4>
                  <p className="text-[13px] text-rose-200/70 m-0">Deploying 10,000x leverage on sub-minute epochs carries severe risk of total margin loss. The system does not emit margin calls. Assets are liquidated instantly at the threshold. Integrate and interact with strict risk management parameters.</p>
                </div>
              </div>
            </section>

          </div>
        </main>
      </div>
      
      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center bg-[#05070a]">
        <p className="text-[13px] font-mono text-white/30 tracking-widest">
          © {new Date().getFullYear()} 3XTREMES INFRASTRUCTURE
        </p>
      </footer>

    </div>
  );
}
