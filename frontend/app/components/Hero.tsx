'use client';

import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

function Counter({ isVisible }: { isVisible?: boolean }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString() + 'x');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  // Use the explicitly provided isVisible, or fallback to the element's own isInView
  const trigger = isVisible !== undefined ? isVisible : isInView;

  useEffect(() => {
    if (trigger) {
      count.set(0);
      const controls = animate(count, 10000, { duration: 1.5, ease: "easeOut", delay: 0 });
      return controls.stop;
    }
  }, [count, trigger]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

function PnlCounter({ isVisible }: { isVisible?: boolean }) {
  const count = useMotionValue(5000);
  const formatted = useTransform(count, (latest) => '+$' + Math.round(latest).toLocaleString());
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const trigger = isVisible !== undefined ? isVisible : isInView;

  useEffect(() => {
    if (trigger) {
      count.set(5000);
      const controls = animate(count, 500000, { duration: 1.1, ease: "easeOut", delay: 0.4 });
      return controls.stop;
    }
  }, [count, trigger]);

  return <motion.span ref={ref}>{formatted}</motion.span>;
}

function PnlCounter2({ isVisible }: { isVisible?: boolean }) {
  const count = useMotionValue(10000);
  const formatted = useTransform(count, (latest) => '+$' + Math.round(latest).toLocaleString());
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const trigger = isVisible !== undefined ? isVisible : isInView;

  useEffect(() => {
    if (trigger) {
      count.set(10000);
      const controls = animate(count, 30000, { duration: 0.9, ease: "easeOut", delay: 0.6 });
      return controls.stop;
    }
  }, [count, trigger]);

  return <motion.span ref={ref}>{formatted}</motion.span>;
}

export function Hero() {
  const chartRef = useRef(null);
  const isChartInView = useInView(chartRef, { once: true, margin: "-10% 0px -10% 0px" });

  return (
    <section className="relative pt-32 pb-20 overflow-hidden flex flex-col items-center justify-center min-h-screen">
      {/* Background ambient glow */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-white/80 text-[12px] md:text-[13px] font-medium mb-6 backdrop-blur-md"
        >
          <Sparkles className="w-4 h-4" />
          <span>The Future of Prediction Markets</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-[40px] md:text-[56px] font-[500] tracking-[-0.03em] leading-[1.1] text-white mb-5 antialiased"
        >
          Predict Nothing. <br className="hidden md:block" />
          Win Everything.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-[14px] md:text-[16px] font-normal text-white/50 max-w-[500px] mx-auto mb-8 leading-[1.5] antialiased"
        >
          A new kind of market where randomness is the only truth. Up to 10,000x leverage.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/trade"
            className="inline-flex items-center gap-1.5 w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-[13px] md:text-[14px] font-medium antialiased transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)]"
          >
            Get Started
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>

      {/* Mockup */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-5xl mx-auto mt-12 px-4"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-20" />
        <div className="relative glass-panel p-2 shadow-2xl rounded-[32px] border-white/10 bg-white/[0.01]">
          {/* Mockup Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="flex-1 text-center text-xs font-mono text-white/30">3xtremes</div>
          </div>
          {/* Mockup Body */}
          <div className="aspect-[16/9] w-full bg-[#0a0d14] rounded-b-[24px] overflow-hidden relative border-t border-white/5 p-6 flex gap-6">
             {/* Left Sidebar */}
             <div className="w-64 border-r border-white/5 hidden md:flex flex-col gap-4 pr-6">
                <div className="h-10 w-full bg-white/5 rounded-lg animate-pulse" />
                <div className="h-8 w-3/4 bg-white/5 rounded-lg animate-pulse" />
                <div className="h-8 w-5/6 bg-white/5 rounded-lg animate-pulse" />
                <div className="h-8 w-2/3 bg-white/5 rounded-lg animate-pulse" />
                <div className="mt-auto h-32 w-full bg-blue-600/10 border border-blue-500/20 rounded-xl" />
             </div>
             {/* Main Content Area */}
             <div className="flex-1 flex flex-col gap-6">
                {/* Top Stats */}
                <div className="flex gap-4">
                  <div className="flex-1 h-24 glass-panel rounded-2xl relative overflow-hidden flex items-center p-6">
                    <div>
                      <div className="text-white/40 text-xs font-medium mb-1">Max Leverage</div>
                      <div className="text-2xl font-medium text-white tracking-tight"><Counter isVisible={isChartInView} /></div>
                    </div>
                    <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full" />
                  </div>
                  <div className="flex-1 h-24 glass-panel rounded-2xl relative overflow-hidden flex items-center p-6">
                    <div>
                      <div className="text-white/40 text-xs font-medium mb-1">Blockchain Network</div>
                      <div className="text-2xl font-medium text-white tracking-tight">ARC Testnet</div>
                    </div>
                  </div>
                </div>
                {/* Chart Area */}
                <motion.div 
                  ref={chartRef}
                  initial="hidden"
                  animate={isChartInView ? "visible" : "hidden"}
                  className="flex-1 glass-panel rounded-2xl relative overflow-hidden p-6 flex flex-col"
                >

                  {/* Fake Chart Lines */}
                  <div className="flex-1 border-b border-l border-white/5 relative">
                     <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full stroke-blue-500 fill-blue-500/10">
                         <motion.path 
                           variants={{
                             hidden: { opacity: 0 },
                             visible: { opacity: 1, transition: { duration: 1, delay: 0 } }
                           }}
                           d="M0 100 L 0 80 L 200 50 L 400 60 L 600 30 L 800 40 L 1000 10 L 1000 100 Z" 
                           stroke="none" 
                        />
                        <motion.path 
                           variants={{
                             hidden: { pathLength: 0 },
                             visible: { pathLength: 1, transition: { duration: 1.5, ease: "easeOut", delay: 0 } }
                           }}
                           d="M0 80 L 200 50 L 400 60 L 600 30 L 800 40 L 1000 10" 
                           fill="none" 
                           strokeWidth="1" 
                           strokeLinecap="round" 
                           strokeLinejoin="round" 
                        />
                     </svg>
                     
                     <motion.div
                        variants={{
                          hidden: { opacity: 0, scale: 0.2, y: "-80%" },
                          visible: { opacity: 1, scale: 1, y: "-100%", transition: { type: "spring", bounce: 0.5, duration: 0.6, delay: 0.4 } }
                        }}
                        className="absolute z-20 pointer-events-none"
                        style={{ left: "calc(20% + 4px)", top: "calc(50% - 4px)", originX: 0, originY: 1 }}
                     >
                        <div 
                           className="glass-panel !border-white/20 !rounded-2xl !rounded-bl-none px-4 py-2 flex items-center relative z-10"
                           style={{
                             boxShadow: "inset 0px 0px 2px 0px rgba(255,255,255,0.4), 0px 10px 30px rgba(37,99,235,0.3)"
                           }}
                        >
                           {/* Base Blue Ambient to keep it blue-ish */}
                           <div className="absolute inset-0 bg-blue-600/30 pointer-events-none" />
                           <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />
                           
                           <div className="text-white text-[15px] font-medium tracking-tight relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                             <PnlCounter isVisible={isChartInView} />
                           </div>
                        </div>
                     </motion.div>

                     {/* Second Bubble at 2nd Peak (60%, 30%) */}
                     <motion.div
                        variants={{
                          hidden: { opacity: 0, scale: 0.2, y: "-80%" },
                          visible: { opacity: 1, scale: 1, y: "-100%", transition: { type: "spring", bounce: 0.5, duration: 0.6, delay: 0.6 } }
                        }}
                        className="absolute z-20 pointer-events-none"
                        style={{ left: "calc(60% + 4px)", top: "calc(30% - 4px)", originX: 0, originY: 1 }}
                     >
                        <div 
                           className="glass-panel !border-white/20 !rounded-2xl !rounded-bl-none px-4 py-2 flex items-center relative z-10"
                           style={{
                             boxShadow: "inset 0px 0px 2px 0px rgba(255,255,255,0.4), 0px 10px 30px rgba(37,99,235,0.3)"
                           }}
                        >
                           <div className="absolute inset-0 bg-blue-600/30 pointer-events-none" />
                           <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />
                           
                           <div className="text-white text-[15px] font-medium tracking-tight relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                             <PnlCounter2 isVisible={isChartInView} />
                           </div>
                        </div>
                     </motion.div>
                  </div>
                </motion.div>
             </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
