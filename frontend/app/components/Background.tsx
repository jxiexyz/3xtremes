'use client';

export function Background() {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none -z-50 bg-[#000000] overflow-hidden">

      {/* 1. Deep Space Base */}
      <div
        className="absolute top-0 left-0 right-0 h-[800px] opacity-60"
        style={{
          background: 'radial-gradient(ellipse 100% 100% at 50% -20%, #0A194A 0%, #020617 50%, #000000 100%)'
        }}
      />

      {/* 2. Static Wave Glows - CSS radial-gradients are GPU-cached, no per-frame cost */}
      <div
        className="absolute top-0 left-0 w-full h-[600px]"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 20% 60%, rgba(29,78,216,0.35) 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-0 left-0 w-full h-[600px]"
        style={{ background: 'radial-gradient(ellipse 50% 35% at 80% 40%, rgba(37,99,235,0.2) 0%, transparent 70%)' }}
      />

      {/* 3. Dashboard Cyan Backlight */}
      <div className="absolute top-[400px] left-1/2 -translate-x-1/2 w-[900px] h-[300px] bg-[#00f0ff] opacity-[0.08] blur-[100px] rounded-[100%] mix-blend-screen" />
      <div className="absolute top-[460px] left-1/2 -translate-x-1/2 w-[500px] h-[20px] bg-[#00f0ff] opacity-[0.4] blur-[20px] rounded-[100%] mix-blend-screen" />

      {/* 4. Center Hero Text Backlight */}
      <div className="absolute top-[150px] left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-[#3b82f6] opacity-[0.12] blur-[80px] rounded-[100%] mix-blend-screen" />

      {/* 5. Edge Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#000000]/80 to-[#000000] opacity-90" />
      <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,1)]" />
    </div>
  );
}
