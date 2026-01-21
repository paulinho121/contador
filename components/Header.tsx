
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-200/50">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white p-1 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <img
                src="/logo.png"
                alt="Contador Amigo Logo"
                className="w-12 h-12 object-contain"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/2654/2654416.png';
                }}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-extrabold tracking-tight">
              <span className="text-slate-900">Dr.</span>
              <span className="text-indigo-600 ml-1">Contador</span>
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 -mt-1">
              Doutorado em Contabilidade & RAG
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-slate-700">Inteligência Técnica</span>
            <span className="text-[11px] text-slate-400 font-medium italic">Base Legal Atualizada 2026</span>
          </div>
          <div className="h-8 w-[1px] bg-slate-200"></div>
          <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[11px] font-bold text-slate-600 uppercase">Sistema Online</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
