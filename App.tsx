
import React, { useState, useRef, useEffect } from 'react';
import { Message } from './types';
import { geminiService } from './services/geminiService';
import { autonomousService } from './services/autonomousService';
import AuthPage from './components/AuthPage';
import AdminPanel from './components/AdminPanel';
import { azureService } from './services/azureService';

const App: React.FC = () => {
  const [user, setUser] = useState<{ name: string; email: string } | null>(() => {
    const saved = localStorage.getItem('contador_at_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('contador_at_user', JSON.stringify(user));
      // Inicia o agente de monitoramento autônomo a cada 30 minutos (1.800.000ms)
      autonomousService.startMonitoring(1800000);

      // Atualiza atividade agora e a cada 5 minutos
      const updateActivity = () => azureService.updateUserActivity(user.email);
      updateActivity();
      const activityInterval = setInterval(updateActivity, 5 * 60 * 1000);

      // Carrega conhecimento (RAG) global
      const loadKnowledge = async () => {
        try {
          const items = await azureService.getKnowledge();
          if (items.length > 0) {
            const allContent = items
              .map(item => `### ${item.title || 'Informação'}\n${item.content}\n`)
              .join('\n---\n\n');
            setContext(allContent);
          }
        } catch (e) {
          console.error("Erro ao carregar RAG:", e);
        }
      };
      loadKnowledge();

      return () => {
        autonomousService.stopMonitoring();
        clearInterval(activityInterval);
      };
    } else {
      localStorage.removeItem('contador_at_user');
    }
  }, [user]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou seu **Contador Sênior de Confiança**. No que posso te orientar hoje? Estou aqui para garantir a segurança fiscal e contábil do seu negócio.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const censorPatterns = [
    /\d{3}\.\d{3}\.\d{3}-\d{2}/g, // CPF
    /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g, // CNPJ
    /\b[\w.-]+@[\w.-]+\.\w{2,}\b/g, // Email
    /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}/g // Phone
  ];

  const renderContent = (text: string) => {
    // First handle bold marks
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const boldParts = line.split('**');
      return (
        <p key={i} className="mb-2 md:mb-3 last:mb-0 min-h-[1.2em] md:min-h-[1.5em] font-light text-sm md:text-base text-white">
          {boldParts.map((part, index) => {
            const isBold = index % 2 === 1;
            const rawContent = part;

            // Handle sensitive patterns
            let subParts: (string | React.ReactNode)[] = [rawContent];
            censorPatterns.forEach(pattern => {
              const nextSubParts: (string | React.ReactNode)[] = [];
              subParts.forEach(sp => {
                if (typeof sp === 'string') {
                  const matches = sp.match(pattern);
                  const splits = sp.split(pattern);
                  splits.forEach((s, si) => {
                    nextSubParts.push(s);
                    if (matches && matches[si]) {
                      nextSubParts.push(<span key={si} className="censored-on-print">{matches[si]}</span>);
                    }
                  });
                } else {
                  nextSubParts.push(sp);
                }
              });
              subParts = nextSubParts;
            });

            return (
              <React.Fragment key={index}>
                {isBold ? (
                  <strong className="font-bold text-indigo-300">{subParts}</strong>
                ) : (
                  subParts
                )}
              </React.Fragment>
            );
          })}
        </p>
      );
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMsgId = (Date.now() + 1).toString();
    const placeholderMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, placeholderMsg]);

    try {
      await geminiService.ask(input, context, (fullText) => {
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId ? { ...m, content: fullText } : m
        ));
      });
    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId ? { ...m, content: 'Desculpe, tive um problema ao gerar a resposta.' } : m
      ));
    } finally {
      setIsLoading(false);
    }
  };


  const handleReset = () => {
    geminiService.resetSession();
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Base de dados resetada. Iniciando nova análise.',
      timestamp: new Date()
    }]);
  };


  if (!user) {
    return <AuthPage onLogin={setUser} />;
  }


  return (
    <div className="app-container font-sans selection:bg-indigo-500/30">
      {/* Neural Background */}
      <div className="neural-bg">
        <div className="neural-orb orb-1"></div>
        <div className="neural-orb orb-2"></div>
        <div className="neural-orb orb-3"></div>
      </div>

      {/* Sidebar - ChatGPT Style */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="flex-1 flex flex-col p-2">
          <div className="px-4 py-6 mb-2 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1 bg-indigo-500/20 rounded-full blur-sm"></div>
                <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain relative z-10" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-white italic tracking-tighter uppercase leading-tight">Dr. Contador</span>
                <span className="text-[7px] text-indigo-400 font-bold uppercase tracking-[0.2em]">Expert em Contabilidade</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="new-chat-btn text-white hover:bg-white/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
            Nova Consulta
          </button>

          <div className="mt-4 flex-1 overflow-y-auto">
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Histórico Recente</p>
            <div className="sidebar-item active bg-white/5 border border-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              <span className="truncate">Consulta Contábil Atual</span>
            </div>
          </div>

          <div className="p-2 border-t border-white/5 space-y-1">
            {user?.email === 'paulofernandoautomacao@gmail.com' && (
              <button
                onClick={() => setIsAdminOpen(true)}
                className="sidebar-item w-full text-left hover:bg-white/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                Painel Admin
              </button>
            )}
            <button
              onClick={() => setUser(null)}
              className="sidebar-item w-full text-left hover:bg-red-500/10 text-slate-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
              Sair
            </button>
            <div className="flex items-center gap-3 p-3 mt-2 rounded-lg bg-black/20">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold">
                {user?.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate">{user?.name}</span>
                <span className="text-[10px] text-slate-500 truncate">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {/* Mobile Header */}
        <header className="lg:hidden h-14 border-b border-white/5 flex items-center justify-between px-4 bg-slate-900/50 backdrop-blur-md">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="12" y2="12" /><line x1="3" x2="21" y1="6" y2="6" /><line x1="3" x2="21" y1="18" y2="18" /></svg>
          </button>
          <span className="text-sm font-black uppercase italic tracking-widest text-white">Dr. Contador</span>
          <button onClick={handleReset} className="p-2 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
          </button>
        </header>

        {isAdminOpen && user?.email === 'paulofernandoautomacao@gmail.com' && (
          <AdminPanel
            onClose={() => setIsAdminOpen(false)}
            onKnowledgeUpdate={setContext}
            currentUserEmail={user.email}
          />
        )}

        <div className="chat-messages">
          <div className="chat-container-inner">
            {messages.length === 1 && (
              <div className="flex flex-col items-center justify-center py-12 md:py-20 animate-fade-in text-center">
                <div className="w-32 h-32 md:w-48 md:h-48 mb-8 relative">
                  <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-2xl animate-pulse"></div>
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain relative z-10 grayscale-[0.5] opacity-80" />
                </div>
                <h2 className="text-xl md:text-3xl font-black text-white italic uppercase tracking-tighter mb-3">
                  Consultoria Inteligente <span className="text-indigo-400">Premium</span>
                </h2>
                <p className="text-xs md:text-sm text-slate-500 max-w-md leading-relaxed font-light uppercase tracking-widest">
                  Especialista em contabilidade doutoral, análise de leis e segurança fiscal processada por IA de alto desempenho.
                </p>
                <div className="mt-8 flex gap-2">
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    ⚖️ Base Legal
                  </span>
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    🎓 Parecer Técnico
                  </span>
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    ⚡ Resposta em Tempo Real
                  </span>
                </div>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`message-bubble ${m.role === 'assistant' ? 'message-assistant' : 'message-user'}`}>
                <div className="flex gap-4 md:gap-6 max-w-none">
                  <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg shrink-0 flex items-center justify-center border ${m.role === 'user'
                    ? 'bg-indigo-600 border-indigo-500'
                    : 'bg-emerald-600/20 border-emerald-500/30'}`}>
                    {m.role === 'user' ? (
                      <span className="text-[10px] font-bold uppercase">{user?.name.substring(0, 1)}</span>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" md:width="20" md:height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>
                    )}
                  </div>
                  <div className="flex-1 prose prose-invert prose-sm md:prose-base max-w-none">
                    {renderContent(m.content)}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message-bubble message-assistant">
                <div className="flex gap-4 md:gap-6 items-center">
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg shrink-0 bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <div className="flex gap-1">
                      <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"></span>
                      <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                  <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest animate-pulse">Processando dados...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="input-container">
          <form onSubmit={handleSubmit} className="input-wrapper">
            <div className="relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte qualquer coisa sobre contabilidade..."
                className="w-full bg-slate-800/50 border border-white/10 rounded-2xl py-4 md:py-5 pl-5 md:pl-6 pr-14 text-sm md:text-base text-white outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 md:right-3 top-2 md:top-3 bottom-2 md:bottom-3 px-4 glass-button rounded-xl flex items-center justify-center hover:bg-indigo-600/30 disabled:opacity-20 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
              </button>
            </div>
            <p className="privacy-notice mt-4 text-[10px] md:text-[11px] font-bold text-indigo-300/60 text-center tracking-widest uppercase">
              ⚠️ Aviso de Privacidade: Nenhuma informação desta sessão é armazenada em nosso banco de dados. Tudo é processado de forma volátil e segura.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default App;

