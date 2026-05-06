'use client';

import { motion } from 'framer-motion';
import { Wallet, Activity, TrendingUp, ArrowRight } from 'lucide-react';

const steps = [
  {
    icon: Wallet,
    title: 'Connect Wallet',
    desc: 'Link your Web3 wallet instantly. Start trading immediately with zero KYC or lengthy verifications required.',
  },
  {
    icon: Activity,
    title: 'Pick Direction',
    desc: 'Analyze live market volatility and predict the next move. Choose your entry and select your extreme leverage.',
  },
  {
    icon: TrendingUp,
    title: 'Execute Trade',
    desc: 'Watch your positions react in real time. Secure massive multipliers the moment the market aligns with your prediction.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 relative" id="how-it-works">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/60 text-xs font-semibold mb-6">
            Execution
          </div>
          <h2 className="text-[32px] md:text-[40px] font-[500] text-white mb-4 tracking-[-0.02em] leading-[1.1] antialiased">
            Enter The Extreme <br /> In Three Steps
          </h2>
          <p className="text-white/50 max-w-lg mx-auto text-sm md:text-base">
            Experience the ultimate prediction market. Execute high leverage trades seamlessly without the traditional barriers.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.8, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="glass-panel p-8 relative overflow-hidden group hover:border-blue-500/30 transition-colors"
            >
              <div className="absolute top-0 left-0 w-48 h-48 bg-blue-600/20 blur-[50px] rounded-full group-hover:bg-blue-500/30 transition-colors pointer-events-none" />
              
              <div className="relative w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-6">
                <step.icon className="w-5 h-5 text-blue-400" />
              </div>
              
              <div className="text-xs font-semibold text-blue-400 mb-2 tracking-wider uppercase">Step {i + 1}</div>
              <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>


      </div>
    </section>
  );
}
