'use client';

import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 md:p-16 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-16">
          <Link href="/" className="text-sm font-mono text-white/50 hover:text-white transition-colors">
            &lt; Back to Home
          </Link>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mt-8 mb-4">
            3XTREMES <span className="text-white/20">DOCS</span>
          </h1>
          <p className="text-lg text-white/50 font-mono">
            The comprehensive guide to surviving the 10,000x leverage arena.
          </p>
        </header>

        <div className="space-y-16">
          <section>
            <h2 className="text-2xl font-bold mb-6 text-white/90 border-b border-white/10 pb-4">
              1. The Arena
            </h2>
            <p className="text-white/60 leading-relaxed text-lg">
              Welcome to 3xtremes. This is not your traditional trading platform. 3xtremes is a high velocity, on chain trading arena built for true risk takers. We combine the speed of 60 second rounds with the insane capital efficiency of up to 10,000x leverage. You survive, you take the vault. You make the wrong move, you lose everything instantly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 text-white/90 border-b border-white/10 pb-4">
              2. Getting Started
            </h2>
            <p className="text-white/60 leading-relaxed text-lg mb-4">
              Before you can enter the arena, you must configure your equipment.
            </p>
            <ul className="list-disc list-inside text-white/60 leading-relaxed text-lg space-y-2">
              <li><strong className="text-white/80">Network Configuration:</strong> You need to connect your wallet to the Arc Testnet.</li>
              <li><strong className="text-white/80">Acquiring Capital:</strong> You need USCC tokens to trade. Since we operate on a testnet environment, you can mint USCC directly from our dashboard faucet.</li>
              <li><strong className="text-white/80">Connection:</strong> Click the connect wallet button on the top right, select your account, and you are ready to play.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 text-white/90 border-b border-white/10 pb-4">
              3. The Sixty Second Cycle
            </h2>
            <p className="text-white/60 leading-relaxed text-lg mb-4">
              Every trading session on 3xtremes is segmented into 60 second rounds. Time is your absolute enemy and your greatest ally.
            </p>
            <div className="space-y-4">
              <div className="bg-white/[0.03] p-6 rounded-xl border border-white/5">
                <h3 className="text-xl font-bold text-white/80 mb-2">The Trading Phase (Second 0 to 54)</h3>
                <p className="text-white/60">The market is fully open. You can open Long or Short positions freely. Prices update every single second.</p>
              </div>
              <div className="bg-white/[0.03] p-6 rounded-xl border border-white/5">
                <h3 className="text-xl font-bold text-white/80 mb-2">The Lock Window (Second 55 to 60)</h3>
                <p className="text-white/60">The final five seconds. The gates slam shut. No new entries are permitted. You are locked in for the final price movement.</p>
              </div>
              <div className="bg-white/[0.03] p-6 rounded-xl border border-white/5">
                <h3 className="text-xl font-bold text-white/80 mb-2">The Settlement Phase</h3>
                <p className="text-white/60">At exactly zero seconds, the round engine calculates the final closing price. Winning positions are credited automatically, and the next round begins immediately.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 text-white/90 border-b border-white/10 pb-4">
              4. Combat Mechanics
            </h2>
            <p className="text-white/60 leading-relaxed text-lg mb-4">
              Opening a position is straightforward, but surviving is not.
            </p>
            <ul className="list-disc list-inside text-white/60 leading-relaxed text-lg space-y-2">
              <li><strong className="text-white/80">Position Types:</strong> Select Long if you believe the price will end higher than your entry. Select Short if you believe the market will crash.</li>
              <li><strong className="text-white/80">Margin and Leverage:</strong> We offer extreme leverage scaling up to 10,000x. High leverage means massive multipliers on your profit, but it brings your liquidation price dangerously close to your entry point. Choose your margin size wisely.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 text-white/90 border-b border-white/10 pb-4">
              5. The Instant Liquidation Protocol
            </h2>
            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl">
              <p className="text-red-400 leading-relaxed text-lg">
                We do not issue margin calls. We do not do partial liquidations. If your position reaches a negative one hundred percent profit and loss ratio at any millisecond during the round, the keeper bot will instantly trigger a lethal strike. Your UI will lock, your position will be wiped out entirely, and your margin will be burned. This status is permanent. Once liquidated, you cannot recover your margin even if the price bounces back.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 text-white/90 border-b border-white/10 pb-4">
              6. Security and Architecture
            </h2>
            <p className="text-white/60 leading-relaxed text-lg">
              Your funds and the core logic live entirely on chain. The trading environment is powered by immutable smart contracts deployed on the Arc Testnet. The Round Engine manages the timeline and price feeds. The Position Manager handles your margin, calculates leverage, and executes the final payouts or liquidations. Our custom keeper bot executes background liquidations optimally without pausing or disrupting the ongoing game loop for other participants.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 text-white/90 border-b border-white/10 pb-4">
              7. Ultimate Risk Warning
            </h2>
            <p className="text-white/60 leading-relaxed text-lg">
              This platform is designed for extreme volatility. Trading with ultra high leverage is essentially financial combat. Only bring capital that you are prepared to lose entirely. We hold no liability for your reckless decisions. Enter the arena at your own absolute risk.
            </p>
          </section>
        </div>

        <footer className="mt-24 pt-8 border-t border-white/10 text-center">
          <p className="text-white/30 font-mono text-sm">
            © {new Date().getFullYear()} 3XTREMES. ALL RIGHTS RESERVED.
          </p>
        </footer>
      </div>
    </div>
  );
}
