'use client';

import { motion } from 'framer-motion';

export function Trust() {
  return (
    <section className="py-24 relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
           <h2 className="text-[20px] md:text-[24px] font-[700] text-white/80 mb-12 tracking-[-0.02em] antialiased">Immutable Smart Contract Architecture</h2>
           
           {/* Metrics */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
              {[
                 { label: 'Maximum Leverage', value: '10,000x' },
                 { label: 'Execution Cycle', value: '60s' },
                 { label: 'Liquidation Threshold', value: '80%' },
                 { label: 'Liquidator Reward', value: '2%' },
              ].map((stat, i) => (
                 <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false }}
                    transition={{ delay: i * 0.1 }}
                    className="flex flex-col gap-2"
                 >
                    <div className="text-3xl md:text-4xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-white/50">{stat.label}</div>
                 </motion.div>
              ))}
           </div>

           {/* Technical Stack */}
           <div className="flex flex-wrap justify-center items-center gap-12 opacity-40 hover:opacity-80 transition-opacity duration-500">
              <div className="text-xl font-bold font-mono tracking-tighter flex items-center gap-2">block.prevrandao</div>
              <div className="text-xl font-black tracking-widest uppercase">USCC Vault</div>
              <div className="text-xl font-bold font-serif italic">Non Custodial</div>
              <div className="text-xl font-semibold lowercase tracking-widest">WebSocket Keepers</div>
              <div className="text-xl font-bold uppercase tracking-tight flex items-center gap-2"><div className="w-4 h-4 rounded-full border-[3px] border-white/60" /> Zero Slippage</div>
           </div>
        </div>
      </div>
    </section>
  );
}
