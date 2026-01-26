
import React from 'react';

interface HeaderProps {
  onReset?: () => void;
  knowledgeComponent?: React.ReactNode;
  user?: { name: string; email: string } | null;
  onLogout?: () => void;
  onAdminClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onReset, knowledgeComponent, user, onLogout, onAdminClick }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-20 md:h-24 flex items-center justify-between px-4 md:px-12 pointer-events-none">
      <div className="flex items-center gap-3 md:gap-5 pointer-events-auto">
        <div className="relative group">
          <div className="absolute -inset-2 bg-indigo-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <img
            src="/logo.png"
            alt="Dr. Contador Logo"
            className="w-10 h-10 md:w-14 md:h-14 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-transform duration-500 hover:scale-110"
          />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-sm md:text-lg font-black text-white tracking-widest uppercase italic leading-none">
              {user?.name || "Dr. Contador"}
            </h1>
            {user && (
              <button
                onClick={onLogout}
                className="p-1 hover:text-red-400 text-white/20 transition-colors"
                title="Sair do Sistema"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            <p className="text-[7px] md:text-[9px] text-indigo-300/60 uppercase tracking-[0.3em] font-black">
              {user ? user.email : "Neural Core v2.0"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 pointer-events-auto">
        {/* Connection Status Badge (Integrated) */}
        <div className="hidden lg:flex flex-col items-end mr-2 text-right">
          <span className="text-[8px] text-white/20 uppercase tracking-[0.3em] font-black">Secure Protocol</span>
          <span className="text-[9px] text-emerald-500/60 font-bold uppercase tracking-widest">Active Link</span>
        </div>

        <div className="flex items-center gap-2 md:gap-3 bg-white/5 border border-white/10 backdrop-blur-2xl p-1.5 md:p-2 rounded-2xl md:rounded-[1.5rem] shadow-2xl">
          {user?.email === 'paulofernandoautomacao@gmail.com' && (
            <button
              onClick={onAdminClick}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              Painel Admin
            </button>
          )}
          {onReset && (
            <button
              onClick={onReset}
              className="w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/40 text-white/60 hover:text-red-400 transition-all shadow-xl active:scale-95"
              title="Apagar Dados do Atendimento"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
