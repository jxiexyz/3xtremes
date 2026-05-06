'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function CTA() {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ type: "spring", bounce: 0.4, duration: 0.9 }}
          className="glass-panel p-12 md:p-20 flex flex-col items-center border border-blue-500/20"
        >
          <h2 className="text-[32px] md:text-[40px] font-[500] text-white mb-6 tracking-[-0.02em] leading-[1.1] antialiased">
            Enter The Execution Cycle
          </h2>
          <p className="text-white/60 mb-10 max-w-2xl text-lg">
            Interact directly with the protocol. Execute on chain positions with 10,000x leverage on 60 second cycles seeded by <code className="text-white/80 text-base">block.prevrandao</code>.
          </p>
          <Link
            href="/trade"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-[13px] md:text-[14px] font-medium antialiased transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)]"
          >
            Launch Web App
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
