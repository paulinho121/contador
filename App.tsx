
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import { Message } from './types';
import { geminiService } from './services/geminiService';
import VoiceConsultant from './components/VoiceConsultant';
import KnowledgeManager from './components/KnowledgeManager';
import AuthPage from './components/AuthPage';

const App: React.FC = () => {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá. Sou o **Dr. Contador**. Estou pronto para processar sua análise contábil.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState('');
  const [viewMode, setViewMode] = useState<'selection' | 'chat'>('selection');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (viewMode === 'chat') {
      scrollToBottom();
    }
  }, [messages, viewMode]);

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

  const SelectionScreen = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 animate-fade-in relative z-10 w-full">
      <div className="text-center mb-10 md:mb-20 mt-12 md:mt-0">
        <h1 className="text-3xl md:text-7xl font-black text-white tracking-tighter italic mb-4 leading-none uppercase">
          Como deseja ser <br className="hidden md:block" /> atendido?
        </h1>
        <div className="flex items-center justify-center gap-4">
          <span className="h-px w-8 md:w-16 bg-gradient-to-r from-transparent to-indigo-500/50"></span>
          <p className="text-indigo-300/60 text-[8px] md:text-[11px] uppercase tracking-[0.6em] font-black">
            Protocolo de Interação Neural
          </p>
          <span className="h-px w-8 md:w-16 bg-gradient-to-l from-transparent to-indigo-500/50"></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 w-full max-w-6xl px-4">
        {/* Chat Card */}
        <button
          onClick={() => setViewMode('chat')}
          className="group relative flex flex-col items-center text-center p-10 md:p-16 rounded-[3rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all duration-700 hover:-translate-y-3 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className="w-20 h-20 md:w-28 md:h-28 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-10 shadow-2xl border border-white/5 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" md:width="48" md:height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-300"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          </div>
          <h3 className="text-2xl md:text-4xl font-black text-white mb-6 uppercase tracking-tighter italic">Especialista Chat</h3>
          <p className="text-slate-500 text-xs md:text-lg font-light leading-relaxed max-w-[320px] group-hover:text-slate-300 transition-colors">
            Análise técnica de documentos com precisão doutoral em interface textual.
          </p>
          <div className="mt-10 flex items-center gap-3 text-[9px] md:text-[11px] font-black text-indigo-400 uppercase tracking-widest opacity-30 group-hover:opacity-100 transition-all duration-700">
            Acessar Chat <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </div>
        </button>

        {/* Voice Card */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[3.2rem] blur-2xl opacity-0 group-hover:opacity-20 transition duration-1000"></div>
          <div className="relative h-full flex flex-col items-center">
            <div className="flex-1 w-full bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 md:p-16 flex flex-col items-center justify-center text-center group-hover:bg-white/[0.05] group-hover:border-purple-500/30 transition-all duration-700 group-hover:-translate-y-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="w-20 h-20 md:w-28 md:h-28 bg-purple-500/10 rounded-3xl flex items-center justify-center mb-10 shadow-2xl border border-white/5 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" md:width="48" md:height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-purple-300"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="23" /><line x1="8" x2="16" y1="23" y2="23" /></svg>
              </div>
              <h3 className="text-2xl md:text-4xl font-black text-white mb-6 uppercase tracking-tighter italic">Consultoria Voz</h3>
              <p className="text-slate-500 text-xs md:text-lg font-light leading-relaxed max-w-[320px] group-hover:text-slate-300 transition-colors">
                Experiência neural de voz em tempo real com o Dr. Contador (Charon).
              </p>

              <div className="mt-10">
                <VoiceConsultant context={context} isSelectionMode={true} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 md:mt-20 scale-90 md:scale-100">
        {/* Knowledge Manager removed from SelectionScreen as it is now in Header */}
      </div>
    </div>
  );

  if (!user) {
    return <AuthPage onLogin={setUser} />;
  }

  return (
    <div className="relative min-h-screen flex flex-col text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Neural Background */}
      <div className="neural-bg">
        <div className="neural-orb orb-1"></div>
        <div className="neural-orb orb-2"></div>
        <div className="neural-orb orb-3"></div>
      </div>

      <Header
        onReset={handleReset}
        knowledgeComponent={<KnowledgeManager onKnowledgeUpdate={setContext} />}
        user={user}
        onLogout={() => setUser(null)}
      />

      {viewMode === 'selection' ? (
        <SelectionScreen />
      ) : (
        <main className="flex-1 max-w-4xl mx-auto w-full px-2 md:px-0 flex flex-col pt-24 md:pt-32 pb-4 md:pb-8 h-screen relative z-10 transition-all duration-500">

          {/* Back to Selection */}
          <button
            onClick={() => setViewMode('selection')}
            className="absolute -top-12 md:-top-16 left-4 md:left-0 flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-colors group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6" /></svg>
            Voltar para Seleção
          </button>

          {/* Chat Hub */}
          <div className="flex-1 flex flex-col rounded-2xl md:rounded-3xl overflow-hidden glass-panel border-white/5 shadow-2xl relative">
            <div className="flex-1 overflow-y-auto p-4 md:p-12 space-y-6 md:space-y-10 scrollbar-hide">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
                  <div className={`relative max-w-[90%] md:max-w-[80%] rounded-2xl md:rounded-3xl p-5 md:p-8 transition-all duration-300 ${m.role === 'user'
                    ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-50 shadow-indigo-500/5'
                    : 'bg-white/5 border border-white/10 text-slate-100 shadow-white/5'
                    } backdrop-blur-3xl`}>
                    <div className="prose prose-invert prose-xs md:prose-base max-w-none leading-relaxed tracking-wide">
                      {m.content.split('\n').map((line, i) => (
                        <p key={i} className="mb-2 md:mb-3 last:mb-0 min-h-[1.2em] md:min-h-[1.5em] font-light text-sm md:text-base text-white">
                          {line.split('**').map((part, index) => (
                            index % 2 === 1 ? <strong key={index} className="font-bold text-indigo-300">{part}</strong> : part
                          ))}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 flex items-center gap-3 md:gap-4 backdrop-blur-md">
                    <div className="flex gap-1 md:gap-1.5">
                      <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 md:p-10 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent">
              <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Inicie sua consulta..."
                  className="w-full glass-input rounded-xl md:rounded-2xl py-4 md:py-5 pl-5 md:pl-8 pr-16 md:pr-20 text-sm md:text-lg font-light outline-none transition-all placeholder:text-slate-600"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 md:right-3 top-2 md:top-3 bottom-2 md:bottom-3 px-4 md:px-6 glass-button rounded-lg md:rounded-xl flex items-center justify-center hover:bg-indigo-600/30 hover:text-white disabled:opacity-20 transition-all active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" md:width="22" md:height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                </button>
              </form>
            </div>
          </div>
        </main>
      )}

    </div>
  );
};

export default App;
