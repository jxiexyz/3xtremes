'use client';

import Link from 'next/link';
import { Terminal, ShieldAlert, Zap, Layers, Cpu, ArrowRight, BookOpen, Lock, Code2, Activity, Calculator, Coins, Database } from 'lucide-react';

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
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Deep Dive</h4>
              <ul className="space-y-2 text-[13px]">
                <li><a href="#architecture" className="text-white/60 hover:text-white transition-colors block py-1">Architecture & Bots</a></li>
                <li><a href="#vrf-engine" className="text-white/60 hover:text-white transition-colors block py-1">VRF Pricing Engine</a></li>
                <li><a href="#vault-mechanics" className="text-white/60 hover:text-white transition-colors block py-1">Vault Mechanics (USCC)</a></li>
                <li><a href="#trading-math" className="text-white/60 hover:text-white transition-colors block py-1">Trading Mathematics</a></li>
                <li><a href="#protocol-economy" className="text-white/60 hover:text-white transition-colors block py-1">Protocol Economy</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Resources</h4>
              <ul className="space-y-2 text-[13px]">
                <li><a href="#security" className="text-white/60 hover:text-white transition-colors block py-1">Security & Risk Limits</a></li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0 max-w-3xl prose prose-invert prose-blue">
          
          <header className="mb-16">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">Technical Whitepaper</h1>
            <p className="text-lg text-white/50 leading-relaxed">
              Explore the infrastructure powering 3xtremes: a high-velocity, low-latency derivative market engine designed for extreme leverage up to 10,000x and transparent, cryptographically secure settlement.
            </p>
          </header>

          <div className="space-y-24">
            
            {/* INTRODUCTION */}
            <section id="introduction" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20"><BookOpen className="w-5 h-5 text-blue-400" /></div>
                <h2 className="text-2xl font-bold text-white m-0">Introduction</h2>
              </div>
              <p className="text-white/70 leading-relaxed text-[15px]">
                3xtremes operates as an on-chain trading platform built on the Arc Testnet. Unlike traditional order-book exchanges, it relies on a <strong>round-based settlement</strong> system. We condense market volatility into 60-second execution epochs, allowing users to leverage capital up to 10,000x on real-time simulated price feeds.
              </p>
            </section>

            {/* CORE CONCEPTS */}
            <section id="core-concepts" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20"><Zap className="w-5 h-5 text-emerald-400" /></div>
                <h2 className="text-2xl font-bold text-white m-0">The 60-Second Epoch Loop</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl">
                  <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-400" /> 1. Initiation (T-60s)</h3>
                  <p className="text-[13px] text-white/60 leading-relaxed m-0">
                    The Keeper bot triggers the start of a round. A cryptographic seed is requested from the Gelato VRF to ensure absolute fairness.
                  </p>
                </div>
                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl">
                  <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><ArrowRight className="w-4 h-4 text-rose-400" /> 2. Trading Window</h3>
                  <p className="text-[13px] text-white/60 leading-relaxed m-0">
                    From T-60s to T-5s, users can open Long or Short positions with massive leverage based on the real-time streamed prices.
                  </p>
                </div>
                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl">
                  <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><Lock className="w-4 h-4 text-orange-400" /> 3. Lock Window (T-5s)</h3>
                  <p className="text-[13px] text-white/60 leading-relaxed m-0">
                    In the final 5 seconds, all actions are frozen. No positions can be opened or closed, effectively eliminating front-running and latency arbitrage.
                  </p>
                </div>
                <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl">
                  <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-purple-400" /> 4. Settlement (T-0s)</h3>
                  <p className="text-[13px] text-white/60 leading-relaxed m-0">
                    The round concludes. The final price is calculated on-chain, and all active positions are settled automatically.
                  </p>
                </div>
              </div>
            </section>

            {/* ARCHITECTURE */}
            <section id="architecture" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20"><Cpu className="w-5 h-5 text-purple-400" /></div>
                <h2 className="text-2xl font-bold text-white m-0">Architecture & Bots</h2>
              </div>
              <p className="text-white/70 leading-relaxed text-[15px] mb-6">
                3xtremes utilizes an off-chain worker infrastructure to handle extreme frequencies without bloating the EVM gas state.
              </p>
              
              <ul className="space-y-4">
                <li className="flex gap-4">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  <div>
                    <strong className="text-white text-[14px]">Keeper Bot</strong>
                    <p className="text-[14px] text-white/60 m-0 mt-1">The heartbeat of the system. It handles round lifecycles, streams pre-computed VRF candles to the frontend via WebSocket, and synchronizes the current price on-chain every second.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  <div>
                    <strong className="text-white text-[14px]">Liquidator Bot (Wick Detection)</strong>
                    <p className="text-[14px] text-white/60 m-0 mt-1">An independent bot constantly scanning open positions. Crucially, it evaluates the <strong>High</strong> and <strong>Low</strong> of every candle tick - not just the Close. If a position hits -100% PnL, the bot liquidates it instantly on-chain, earning a 2% margin reward.</p>
                  </div>
                </li>
              </ul>
            </section>

            {/* VRF ENGINE */}
            <section id="vrf-engine" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20"><Layers className="w-5 h-5 text-emerald-400" /></div>
                <h2 className="text-2xl font-bold text-white m-0">VRF Deterministic Engine</h2>
              </div>
              <p className="text-white/70 leading-relaxed text-[15px] mb-4">
                How do we ensure that the platform owners cannot manipulate the charts to liquidate users? By using a Verifiable Random Function (VRF). The price candles are purely mathematical derivatives of an on-chain seed.
              </p>
              
              <div className="bg-[#111] border border-white/10 rounded-xl p-5 mb-4">
                <h4 className="text-white text-sm font-bold mb-3">Candle Generation Algorithm</h4>
                <ul className="space-y-2 text-[13px] text-white/60 list-disc list-inside">
                  <li><strong>XOR Hash:</strong> Every second evaluates a hash: <code>h = seed ^ (second * MAGIC_CONSTANT)</code></li>
                  <li><strong>Global Drift & Noise:</strong> Introduces macro trends (±15) and micro volatility (±150 ticks per second).</li>
                  <li><strong>Mean Reversion Gravity:</strong> A 5% structural pull toward the starting price to prevent infinite spiraling.</li>
                  <li><strong>Volatility Tiers:</strong> Triggers random volatility spikes ranging from 0.01% up to 3.00% absolute deviation.</li>
                </ul>
              </div>
              <p className="text-white/70 leading-relaxed text-[15px]">
                Because the algorithm is open-source, any user can verify that the live chart precisely matches the cryptographic seed emitted by the smart contract. Manipulation is mathematically impossible.
              </p>
            </section>

            {/* VAULT MECHANICS */}
            <section id="vault-mechanics" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20"><Database className="w-5 h-5 text-indigo-400" /></div>
                <h2 className="text-2xl font-bold text-white m-0">Vault Mechanics (USCC)</h2>
              </div>
              <p className="text-white/70 leading-relaxed text-[15px] mb-6">
                3xtremes operates using a highly optimized internal accounting system managed by the <code>CreditVault</code> smart contract. To interact with the trading engine, users must deposit USDC, which is then converted into USCC.
              </p>
              
              <ul className="space-y-4">
                <li className="flex gap-4">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <div>
                    <strong className="text-white text-[14px]">The 1:1000 Exchange Rate</strong>
                    <p className="text-[14px] text-white/60 m-0 mt-1">When depositing USDC (minimum 1 USDC), the vault credits the user with USCC at a 1:1000 ratio. This provides the necessary granularity to execute micro-margin trades at hyper-leverage levels without running into precision rounding errors.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  <div>
                    <strong className="text-white text-[14px]">Not an ERC20 Token</strong>
                    <p className="text-[14px] text-white/60 m-0 mt-1">USCC is <strong>not</strong> a transferable token. It is purely an internal state mapping within the <code>CreditVault</code>. This means USCC cannot be sent to other wallets, traded on external DEXs, or viewed in MetaMask. It exists solely to optimize gas costs during the 60-second settlement loops.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                  <div>
                    <strong className="text-white text-[14px]">The Withdrawal Guard</strong>
                    <p className="text-[14px] text-white/60 m-0 mt-1">Security is paramount. The vault strictly prohibits any USDC withdrawals if the user has <em>any</em> active open positions (<code>openPositionCount &gt; 0</code>). This completely neutralizes flash-loan attacks or reentrancy exploits where an attacker might open a massive highly-leveraged position and immediately attempt to withdraw their underlying collateral before liquidation occurs.</p>
                  </div>
                </li>
              </ul>
            </section>

            {/* TRADING MATHEMATICS */}
            <section id="trading-math" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-pink-500/10 rounded-lg border border-pink-500/20"><Calculator className="w-5 h-5 text-pink-400" /></div>
                <h2 className="text-2xl font-bold text-white m-0">Trading Mathematics</h2>
              </div>
              
              <div className="space-y-6">
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-center">
                    <div className="text-xs text-white/50 mb-1">NORMAL</div>
                    <div className="text-lg font-bold text-white">10x</div>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-center">
                    <div className="text-xs text-white/50 mb-1">WILD</div>
                    <div className="text-lg font-bold text-emerald-400">100x</div>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-center">
                    <div className="text-xs text-white/50 mb-1">INSANE</div>
                    <div className="text-lg font-bold text-orange-400">1,000x</div>
                  </div>
                  <div className="p-3 bg-white/5 border border-rose-500/30 rounded-lg text-center">
                    <div className="text-xs text-rose-500/70 mb-1">EXTREME</div>
                    <div className="text-lg font-bold text-rose-500">10,000x</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-white text-[15px] font-bold mb-2">Absolute Liquidation</h4>
                  <p className="text-[14px] text-white/60 mb-2">There are no margin calls. If your position hits -100% PnL, it is instantly seized. The formula is exact:</p>
                  <div className="bg-[#111] p-3 rounded-lg text-[13px] font-mono text-emerald-300">
                    LONG Liquidation = EntryPrice - (EntryPrice / Leverage)<br/>
                    SHORT Liquidation = EntryPrice + (EntryPrice / Leverage)
                  </div>
                  <p className="text-[13px] text-rose-400 mt-2 italic">At 10,000x leverage, a mere 0.01% price movement against your position results in immediate liquidation.</p>
                </div>
              </div>
            </section>

            {/* PROTOCOL ECONOMY */}
            <section id="protocol-economy" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20"><Coins className="w-5 h-5 text-yellow-400" /></div>
                <h2 className="text-2xl font-bold text-white m-0">Protocol Economy</h2>
              </div>
              <p className="text-white/70 leading-relaxed text-[15px] mb-4">
                The financial stability of the platform relies on the FeeManager and the Insurance Fund.
              </p>
              
              <ul className="space-y-4">
                <li className="p-4 border border-white/10 rounded-xl bg-white/[0.02]">
                  <strong className="text-white text-[14px] block mb-1">Trading Spread (0.01%)</strong>
                  <p className="text-[13px] text-white/60 m-0">A flat fee of 0.01% of the total SIZE (not margin) is charged upon opening and when closing in profit. Distribution: <strong>30% Insurance Fund, 70% Protocol Revenue</strong>.</p>
                </li>
                <li className="p-4 border border-rose-500/20 rounded-xl bg-rose-500/5">
                  <strong className="text-white text-[14px] block mb-1">Liquidation Distribution</strong>
                  <p className="text-[13px] text-white/60 m-0">When a position is liquidated, the margin is seized. <strong>2%</strong> goes to the Liquidator Bot as a gas reward. The remaining <strong>98%</strong> flows to the FeeManager, where <strong>95% bolsters the Insurance Fund</strong> and 5% goes to the protocol.</p>
                </li>
                <li className="p-4 border border-blue-500/20 rounded-xl bg-blue-500/5">
                  <strong className="text-white text-[14px] block mb-1">The Insurance Fund</strong>
                  <p className="text-[13px] text-white/60 m-0">Acts as the ultimate counter-party. If traders collectively win more than they lose in an epoch, the Insurance Fund covers the deficit, ensuring the protocol remains 100% solvent.</p>
                </li>
              </ul>
            </section>



            {/* SECURITY & RISK LIMITS */}
            <section id="security" className="scroll-mt-24 border-t border-white/10 pt-16">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20"><Lock className="w-5 h-5 text-rose-400" /></div>
                <h2 className="text-2xl font-bold text-white m-0">Security & Risk Limits</h2>
              </div>
              <p className="text-white/70 leading-relaxed text-[15px] mb-6">
                Operating high-leverage infrastructure requires uncompromising security constraints. We employ 6 layers of protection.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border border-white/5 bg-white/[0.02] rounded-lg">
                  <h4 className="text-sm font-bold text-white mb-1">Epoch Locking (Anti-Snipe)</h4>
                  <p className="text-[13px] text-white/50 m-0">T-5s hard lock on the order book guarantees fairness by preventing late-stage algorithmic sniping.</p>
                </div>
                <div className="p-4 border border-white/5 bg-white/[0.02] rounded-lg">
                  <h4 className="text-sm font-bold text-white mb-1">OI Imbalance Cap</h4>
                  <p className="text-[13px] text-white/50 m-0">Global Open Interest skew is capped at 100M USCC to prevent systemic collapse during extreme one-sided betting.</p>
                </div>
                <div className="p-4 border border-white/5 bg-white/[0.02] rounded-lg">
                  <h4 className="text-sm font-bold text-white mb-1">Net Exposure Limit</h4>
                  <p className="text-[13px] text-white/50 m-0">Individual wallets are capped at ±100M USCC exposure to prevent massive hedge-drain attacks.</p>
                </div>
                <div className="p-4 border border-white/5 bg-white/[0.02] rounded-lg">
                  <h4 className="text-sm font-bold text-white mb-1">Withdrawal Guard</h4>
                  <p className="text-[13px] text-white/50 m-0">Users cannot withdraw USDC while any position is open, eliminating reentrancy and flash-loan vectors.</p>
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
