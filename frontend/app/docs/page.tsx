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
            The definitive masterclass on surviving the extreme leverage trading arena.
          </p>
        </header>

        <div className="space-y-16">
          <section>
            <h2 className="text-2xl font-bold mb-6 text-white/90 border-b border-white/10 pb-4">
              1. The Philosophy of 3xtremes
            </h2>
            <div className="space-y-4 text-white/60 leading-relaxed text-lg">
              <p>
                Welcome to 3xtremes. If you are looking for traditional, slow moving, and conservative market environments, you are in the wrong place. This platform is forged for the absolute apex of risk takers. We have stripped away the noise and the waiting periods to deliver pure, unfiltered financial combat.
              </p>
              <p>
                3xtremes is a hyper volatile trading arena where every single decision you make is magnified by astronomical leverage. There are no stop losses to save you. There are no multi day swing trades. You enter the arena, you predict the immediate future of the market, and you face the consequences in real time. You either multiply your capital rapidly, or you lose it all in the blink of an eye. This is trading distilled to its most terrifying and rewarding essence.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 text-white/90 border-b border-white/10 pb-4">
              2. Account Initialization and Capital
            </h2>
            <div className="space-y-4 text-white/60 leading-relaxed text-lg">
              <p>
                Before you can participate in the action, you need to prepare your account and secure your capital.
              </p>
              <ul className="list-disc list-inside space-y-3 mt-4">
                <li><strong className="text-white/80">Wallet Connection:</strong> Simply click the connect button on the top right of the dashboard. Your digital wallet acts as your unique identity and secure vault.</li>
                <li><strong className="text-white/80">Acquiring USCC:</strong> The entire platform operates using USCC. You can fund your account directly through the interface to ensure you have the necessary ammunition to open positions.</li>
                <li><strong className="text-white/80">Wallet Balance:</strong> Your available balance is displayed at the bottom of the trading panel. It updates instantly to reflect your wins, your losses, and your active margin locked in the market.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 text-white/90 border-b border-white/10 pb-4">
              3. Anatomy of a Sixty Second Round
            </h2>
            <div className="space-y-4 text-white/60 leading-relaxed text-lg">
              <p>
                The heartbeat of 3xtremes is the sixty second continuous loop. Time is your absolute enemy and your greatest asset. Every minute presents a completely new battleground.
              </p>
              <div className="bg-white/[0.03] p-6 rounded-xl border border-white/5 mt-6">
                <h3 className="text-xl font-bold text-white/80 mb-2">The Action Phase (Seconds 60 down to 6)</h3>
                <p>During the vast majority of the round, the market is fully liquid and chaotic. You are free to open as many Long or Short positions as your balance permits. The price chart will aggressively draw new candles every second, constantly shifting your open profit and loss.</p>
              </div>
              <div className="bg-white/[0.03] p-6 rounded-xl border border-white/5">
                <h3 className="text-xl font-bold text-red-400 mb-2">The Lock Window (Seconds 5 down to 1)</h3>
                <p>When the countdown timer hits the five second mark, the interface flashes red and the gates slam shut. The trading panel is completely disabled. No new participants can enter, and no one can leave. You are forced to watch the final price movements play out, deciding the ultimate fate of your active positions.</p>
              </div>
              <div className="bg-white/[0.03] p-6 rounded-xl border border-white/5">
                <h3 className="text-xl font-bold text-green-400 mb-2">The Resolution (Second 0)</h3>
                <p>The timer reaches zero. The final closing price is etched into the system. All surviving positions are immediately evaluated against this final price. Winners receive their payouts instantly added to their balance, and the next sixty second round begins without a single moment of hesitation.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 text-white/90 border-b border-white/10 pb-4">
              4. Position Mechanics and Extreme Leverage
            </h2>
            <div className="space-y-4 text-white/60 leading-relaxed text-lg">
              <p>
                Executing a trade requires understanding the extreme multipliers at your disposal. 
              </p>
              <ul className="list-disc list-inside space-y-3 mt-4">
                <li><strong className="text-white/80">Going Long:</strong> You are predicting that the price will finish higher than your exact entry point.</li>
                <li><strong className="text-white/80">Going Short:</strong> You are predicting a market crash, betting that the final price will be lower than your entry point.</li>
                <li><strong className="text-white/80">The Leverage Multiplier:</strong> We do not offer standard double or triple leverage. You can dial your risk from a terrifying 1,000x up to a mind bending 10,000x.</li>
              </ul>
              <p className="mt-4">
                To put this into perspective: If you use ten thousand times leverage, a mere 0.01 percent movement in the market price in your favor will instantly double your money. However, that exact same microscopic movement against you will result in total annihilation.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 text-white/90 border-b border-white/10 pb-4">
              5. The Absolute Liquidation Rule
            </h2>
            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl space-y-4">
              <p className="text-red-400 leading-relaxed text-lg font-bold">
                This is the most critical rule of the platform. Read carefully.
              </p>
              <p className="text-red-400/80 leading-relaxed text-lg">
                There are no margin calls. We do not do partial liquidations to save your account. 
              </p>
              <p className="text-red-400/80 leading-relaxed text-lg">
                If the real time market price moves against your position far enough that your open profit and loss reaches negative one hundred percent, you are dead. It does not matter if the price bounces back a millisecond later. It does not matter if the round ends in profit. The moment that threshold is breached, the system intercepts your position instantly. Your user interface will lock, the word LIQUIDATED will stamp across your screen, and your margin is permanently burned and removed from your balance.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 text-white/90 border-b border-white/10 pb-4">
              6. Navigating the Interface
            </h2>
            <div className="space-y-4 text-white/60 leading-relaxed text-lg">
              <p>
                The 3xtremes dashboard is designed to give you maximum situational awareness without clutter.
              </p>
              <ul className="list-disc list-inside space-y-3 mt-4">
                <li><strong className="text-white/80">The Real Time Chart:</strong> Dominated by a massive, high frequency candlestick chart that tracks every single tick of volatility.</li>
                <li><strong className="text-white/80">The Execution Panel:</strong> Located on the right, this is your weapon. Adjust your leverage slider, input your margin, and execute your strikes.</li>
                <li><strong className="text-white/80">Active Positions:</strong> Located right below the chart. This tracks your live trades, showing your real time percentage return. This is also where you will see the dreaded red tag if you fail to survive.</li>
                <li><strong className="text-white/80">The Summary Vault:</strong> A comprehensive breakdown of your all time performance. It tracks your win rate, your total profits, and your total losses, giving you a brutally honest assessment of your trading skills.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 text-white/90 border-b border-white/10 pb-4">
              7. Ultimate Risk Warning
            </h2>
            <p className="text-white/60 leading-relaxed text-lg">
              Do not mistake this for a game. Trading with extreme leverage is the equivalent of financial combat. The speed of the rounds combined with the multipliers means you can drain your entire wallet in minutes if you lose your emotional control. Only deploy capital that you are fully prepared to see vanish. Enter the arena at your own absolute risk.
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
