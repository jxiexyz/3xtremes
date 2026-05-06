'use client';

import { useRef, useEffect } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';

function AnimatedLeverageSlider() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const count = useMotionValue(1);
  const formatted = useTransform(count, (latest) => `${Math.round(latest).toLocaleString()}x`);
  
  useEffect(() => {
    if (isInView) {
      count.set(1);
      const controls = animate(count, 10000, { duration: 2, ease: "easeOut" });
      return controls.stop;
    }
  }, [isInView, count]);

  return (
    <div ref={ref} className="w-full max-w-[200px] h-20 bg-[#0a0d14] rounded-xl border border-white/10 shadow-2xl p-4 flex flex-col justify-center gap-3">
      <div className="flex justify-between items-center">
         <div className="h-2 w-1/3 bg-white/20 rounded" />
         <div className="h-4 px-2 bg-blue-500/20 rounded flex items-center justify-center border border-blue-500/30">
            <motion.span className="text-[10px] font-bold text-blue-400">{formatted}</motion.span>
         </div>
      </div>
      {/* Slider Track */}
      <div className="h-1.5 w-full bg-white/5 rounded-full relative">
         <motion.div 
           initial={{ width: "0%" }}
           whileInView={{ width: "95%" }}
           transition={{ duration: 2, ease: "easeOut" }}
           viewport={{ once: true }}
           className="absolute top-0 left-0 h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.6)]" 
         />
         <motion.div 
           initial={{ left: "0%" }}
           whileInView={{ left: "95%" }}
           transition={{ duration: 2, ease: "easeOut" }}
           viewport={{ once: true }}
           className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-md" 
         />
      </div>
    </div>
  );
}

function AnimatedTimer() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const count = useMotionValue(60);
  const formatted = useTransform(count, (latest) => `${Math.round(latest)}s`);
  
  useEffect(() => {
    if (isInView) {
      count.set(60);
      const controls = animate(count, 5, { duration: 2, ease: "easeOut" });
      return controls.stop;
    }
  }, [isInView, count]);

  return (
    <div ref={ref} className="flex-1 flex items-center justify-center relative z-10 mb-4 mt-6">
      <div className="w-24 h-24 bg-[#0a0d14] rounded-full border border-white/10 shadow-2xl flex items-center justify-center relative">
         <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
            <motion.circle 
              initial={{ strokeDashoffset: 264 }}
              whileInView={{ strokeDashoffset: 40 }}
              transition={{ duration: 2, ease: "easeOut" }}
              viewport={{ once: true }}
              cx="50" cy="50" r="42" fill="none" stroke="#3b82f6" strokeWidth="4" 
              strokeDasharray="264" 
              strokeLinecap="round" 
              className="drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" 
            />
         </svg>
         <div className="flex flex-col items-center justify-center">
            <motion.div className="text-white text-xl font-mono font-bold tracking-tighter">{formatted}</motion.div>
            <div className="text-blue-500/60 text-[8px] uppercase tracking-widest mt-0.5">Left</div>
         </div>
      </div>
    </div>
  );
}

function AnimatedLiquidators() {
  return (
    <div className="flex-1 flex items-center justify-center relative z-10 mb-4 mt-2">
      <div className="w-full max-w-[200px] h-20 bg-[#0a0d14] rounded-xl border border-white/10 shadow-2xl p-3 flex flex-col gap-2 overflow-hidden relative">
         {/* Title bar */}
         <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.8)]" />
               <div className="h-2 w-12 bg-white/20 rounded" />
            </div>
            <div className="h-2 w-8 bg-white/10 rounded" />
         </div>
         
         {/* Feed Rows */}
         <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex justify-between items-center">
               <div className="h-1 w-1/2 bg-white/10 rounded" />
               <div className="h-1 w-1/4 bg-white/5 rounded" />
            </div>
            {/* The Liquidation Row */}
            <motion.div 
              initial={{ backgroundColor: "rgba(255,255,255,0)" }}
              whileInView={{ backgroundColor: "rgba(59,130,246,0.15)" }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.5, ease: "easeOut" }}
              className="flex justify-between items-center py-1 px-1.5 rounded -mx-1.5 border border-transparent"
            >
               <div className="h-1.5 w-2/3 bg-blue-400/60 rounded" />
               <motion.div 
                 initial={{ opacity: 0, scale: 0.8 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.2, delay: 0.6 }}
                 className="text-[8px] font-mono font-bold text-white leading-none"
               >
                 EXEC
               </motion.div>
            </motion.div>
            <div className="flex justify-between items-center">
               <div className="h-1 w-1/3 bg-white/10 rounded" />
               <div className="h-1 w-1/3 bg-white/5 rounded" />
            </div>
         </div>

         {/* Scanning laser line */}
         <motion.div 
           initial={{ top: 0, opacity: 0 }}
           whileInView={{ top: "100%", opacity: [0, 1, 0] }}
           viewport={{ once: true }}
           transition={{ duration: 1.2, ease: "linear" }}
           className="absolute left-0 w-full h-[1px] bg-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
         />
      </div>
    </div>
  );
}

function AnimatedSolvencyTracker() {
  return (
    <div className="flex-1 flex items-center justify-center relative z-10 mb-4 mt-2">
      <div className="w-full max-w-[200px] h-20 bg-[#0a0d14] rounded-xl border border-white/10 shadow-2xl p-3 flex flex-col justify-center overflow-hidden relative">
         {/* The Exposure Bars */}
         <div className="relative h-4 w-full flex items-center">
            {/* Center line */}
            <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[1px] h-6 bg-white/20 z-10" />

            {/* Longs (Blue) */}
            <div className="w-1/2 h-full flex justify-end pr-1">
               <motion.div 
                 initial={{ width: "0%" }}
                 whileInView={{ width: "75%" }}
                 viewport={{ once: true }}
                 transition={{ duration: 1.2, ease: "easeOut" }}
                 className="h-full bg-blue-500 rounded-l-sm" 
               />
            </div>
            
            {/* Shorts (White) */}
            <div className="w-1/2 h-full flex justify-start pl-1">
               <motion.div 
                 initial={{ width: "0%" }}
                 whileInView={{ width: "45%" }}
                 viewport={{ once: true }}
                 transition={{ duration: 1.2, ease: "easeOut", delay: 0.15 }}
                 className="h-full bg-white rounded-r-sm" 
               />
            </div>
         </div>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section className="py-24 relative" id="features">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/60 text-xs font-semibold mb-6">
            Features
          </div>
          <h2 className="text-[32px] md:text-[40px] font-[500] text-white mb-4 tracking-[-0.02em] leading-[1.1] antialiased">
            Provably Fair <br /> Extreme Volatility
          </h2>
          <p className="text-white/50 max-w-lg mx-auto text-sm md:text-base">
            Experience the first on-chain prediction market powered by verifiable randomness and 60 second execution rounds.
          </p>
        </motion.div>

        {/* Masonry-style Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Column 1: Large Card */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="glass-panel p-6 h-[500px] flex flex-col relative group overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/15 blur-[60px] group-hover:bg-blue-500/25 transition-colors duration-500 rounded-full pointer-events-none" />
              
              {/* Graphic: Glowing orb */}
              <div className="flex-1 relative flex items-center justify-center">
                 <div className="w-48 h-48 rounded-full border border-blue-500/20 bg-blue-500/5 relative flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-blue-500/20 blur-xl absolute" />
                    <div className="w-24 h-24 rounded-full bg-blue-400 blur-2xl absolute opacity-50" />
                    {/* Animated Colliding Waves */}
                    <svg className="w-full h-full opacity-50 absolute inset-0" viewBox="0 0 100 100">
                      <motion.path 
                        fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"
                        initial={{ d: "M20 50 Q 35 20 50 50 T 80 50" }}
                        whileInView={{ d: "M20 50 Q 35 80 50 50 T 80 50" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                      <motion.path 
                        fill="none" stroke="#ffffff" strokeWidth="1" strokeLinecap="round"
                        initial={{ d: "M20 50 Q 35 80 50 50 T 80 50" }}
                        whileInView={{ d: "M20 50 Q 35 20 50 50 T 80 50" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </svg>
                 </div>
              </div>
                            <div className="mt-auto relative z-10">
                 <h3 className="text-lg font-semibold text-white mb-2">Verifiable Randomness</h3>
                 <p className="text-sm text-white/50 leading-relaxed">
                    Market prices are generated using cryptographic seeds. Every 60 second round is provably fair and entirely transparent.
                 </p>
               </div>
            </motion.div>
          </div>

          {/* Column 2 */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Top Card: Bar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="glass-panel p-6 h-[240px] flex flex-col group relative overflow-hidden"
            >
               <div className="absolute top-0 left-0 w-48 h-48 bg-blue-600/20 blur-[50px] rounded-full group-hover:bg-blue-500/30 transition-colors pointer-events-none" />

               
               {/* Leverage Slider Mockup */}
               <div className="flex-1 flex items-center justify-center relative z-10 mb-4">
                 <AnimatedLeverageSlider />
               </div>
               
               <div>
                  <h3 className="text-sm font-semibold text-white mb-1">10,000x Leverage</h3>
                  <p className="text-xs text-white/50">Amplify your USCC margin up to ten thousand times.</p>
               </div>
            </motion.div>

            {/* Bottom Card: UI element */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="glass-panel p-6 h-[236px] flex flex-col group relative overflow-hidden"
            >
               <div className="absolute top-0 left-0 w-48 h-48 bg-blue-600/20 blur-[50px] rounded-full group-hover:bg-blue-500/30 transition-colors pointer-events-none" />
               <AnimatedSolvencyTracker />
               <div className="relative z-10">
                  <h3 className="text-sm font-semibold text-white mb-1">Guaranteed Solvency</h3>
                  <p className="text-xs text-white/50">Smart contracts enforce strict global open interest and net exposure limits.</p>
               </div>
            </motion.div>
          </div>

          {/* Column 3 */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Top Card: Small window */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="glass-panel p-6 h-[200px] flex flex-col group relative overflow-hidden"
            >
               <div className="absolute top-0 left-0 w-48 h-48 bg-blue-600/20 blur-[50px] rounded-full group-hover:bg-blue-500/30 transition-colors pointer-events-none" />
               <AnimatedLiquidators />
               <div className="relative z-10">
                  <h3 className="text-sm font-semibold text-white mb-1">Decentralized Liquidators</h3>
                  <p className="text-xs text-white/50">Off chain keeper bots execute liquidations for a 2 percent reward.</p>
               </div>
            </motion.div>

            {/* Bottom Card: Line chart */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0, y: 100 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] } }
              }}
              className="glass-panel p-6 h-[276px] flex flex-col group relative overflow-hidden"
            >
               <div className="absolute top-0 left-0 w-48 h-48 bg-blue-600/20 blur-[50px] rounded-full group-hover:bg-blue-500/30 transition-colors pointer-events-none" />
               <div className="relative z-10 mb-auto">
                  <h3 className="text-sm font-semibold text-white mb-1">60 Second Cycles</h3>
                  <p className="text-xs text-white/50">Lock your position before the final 5 seconds. Settle your profits instantly at round end.</p>
               </div>
               
               {/* 60s Cycle Mockup */}
               <AnimatedTimer />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
