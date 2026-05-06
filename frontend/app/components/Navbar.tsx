'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

export function Navbar() {
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="absolute top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-transparent"
    >
      <div className="flex items-center gap-2 max-w-4xl mx-auto w-full justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-[0_0_12px_rgba(37,99,235,0.5)]">
             <svg viewBox="0 0 100 100" className="w-4 h-4 md:w-[18px] md:h-[18px]">
                {/* The aggressive '3' */}
                <path 
                  d="M 15 20 H 45 L 30 50 H 45 L 15 80" 
                  fill="none" 
                  stroke="#ffffff" 
                  strokeWidth="14" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                {/* The 'X' */}
                <path 
                  d="M 55 20 L 85 80 M 85 20 L 55 80" 
                  fill="none" 
                  stroke="#bfdbfe" 
                  strokeWidth="12" 
                  strokeLinecap="round" 
                />
             </svg>
          </div>
          <span className="font-bold text-base tracking-tight text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>3xtremes</span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8">
          {['Home', 'How it Works', 'Features', 'Docs'].map((item) => (
            <Link
              key={item}
              href={item === 'Home' ? '/' : `#${item.toLowerCase().replace(/ /g, '-')}`}
              className="text-[12px] md:text-[13px] font-normal text-white/60 hover:text-white transition-colors tracking-tight antialiased"
            >
              {item}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/trade"
            className="inline-flex items-center gap-1 bg-white hover:bg-gray-100 text-black px-4 py-1.5 rounded-full text-[12px] md:text-[13px] font-medium antialiased transition-all"
          >
            Get Started
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
