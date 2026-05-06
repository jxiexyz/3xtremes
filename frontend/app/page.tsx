import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { Features } from './components/Features';
import { Trust } from './components/Trust';
import { CTA } from './components/CTA';
import { Background } from './components/Background';

export default function Home() {
  return (
    <div className="min-h-screen text-white selection:bg-blue-500/30 font-sans relative">
      <Background />
      <Navbar />
      
      <main>
        <div className="snap-start snap-always min-h-screen flex flex-col justify-center"><Hero /></div>
        <div className="snap-start snap-always min-h-screen flex flex-col justify-center"><HowItWorks /></div>
        <div className="snap-start snap-always min-h-screen flex flex-col justify-center"><Features /></div>
        <div className="snap-start snap-always min-h-screen flex flex-col justify-center"><Trust /></div>
        <div className="snap-start snap-always min-h-screen flex flex-col justify-center"><CTA /></div>
      </main>

      <footer className="py-8 text-center text-white/40 text-sm border-t border-white/5 snap-end">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
           <div>© {new Date().getFullYear()} 3xtremes. All rights reserved.</div>
           <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
           </div>
        </div>
      </footer>
    </div>
  );
}
