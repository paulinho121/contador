
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-24 flex items-center justify-between px-6 md:px-12 pointer-events-none">
      <div className="flex items-center gap-5 pointer-events-auto">
        <div className="relative group">
          <div className="absolute -inset-2 bg-indigo-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <img
            src="/logo.png"
            alt="Dr. Contador Logo"
            className="w-14 h-14 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-transform duration-500 hover:scale-110"
          />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Dr. Contador
          </h1>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            <p className="text-[10px] text-indigo-300 uppercase tracking-[0.3em] font-bold">Neural Core v2.0</p>
          </div>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-4 pointer-events-auto bg-white/5 border border-white/10 backdrop-blur-xl px-5 py-2.5 rounded-2xl shadow-2xl transition-all hover:bg-white/10">
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Protocolo Seguro</span>
          <span className="text-xs text-indigo-200 font-medium">Conexão Criptografada</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
