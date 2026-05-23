import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="mx-auto min-h-screen w-full md:max-w-md bg-brand-bg flex flex-col relative md:shadow-2xl md:border-x md:border-gray-200">
      
      {/* Header Fijo con vida */}
      <header className="sticky top-0 z-50 bg-brand-bg/95 backdrop-blur-md p-4 border-b border-gray-100 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="leading-tight">
            <h1 className="text-xl font-black tracking-tight text-brand-primary uppercase">
              Don Melona
            </h1>
            <p className="text-[10px] text-brand-text/50 font-bold uppercase tracking-wider">Donde el chef eres tú</p>
          </div>
        </div>
        <div className="bg-brand-accent/10 text-brand-accent text-xs font-bold px-3 py-1 rounded-full animate-pulse border border-brand-accent/20">
          Abierto
        </div>
      </header>

      <main className="flex-1 p-4 pb-28">
        {children}
      </main>

      {/* Nav Amarillo con sombras profundas */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full md:max-w-md bg-brand-nav h-16 flex items-center justify-around z-50 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.15)] border-t border-brand-nav/80">
        <button className="flex-1 flex flex-col items-center justify-center text-brand-text font-black text-xs gap-1 h-full">
          <span className="text-2xl drop-shadow-sm">🍔</span>
          <span>Menú</span>
        </button>
        
        <div className="w-px h-8 bg-brand-text/10"></div>
        
        <button className="flex-1 flex flex-col items-center justify-center text-brand-text/70 font-bold text-xs gap-1 h-full relative hover:text-brand-text transition-colors">
          <div className="absolute top-2 right-1/4 bg-brand-primary text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center shadow-md">
            0
          </div>
          <span className="text-2xl grayscale opacity-70 drop-shadow-sm">🛒</span>
          <span>Carrito</span>
        </button>
      </nav>
    </div>
  );
}