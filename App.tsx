import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import { Message } from './types';
import { geminiService } from './services/geminiService';
import VoiceConsultant from './components/VoiceConsultant';
import KnowledgeManager from './components/KnowledgeManager';

const App: React.FC = () => {
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
  const [context, setContext] = useState(``);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    try {
      const response = await geminiService.ask(input, context);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
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

  return (
    <div className="relative min-h-screen flex flex-col text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Neural Background */}
      <div className="neural-bg">
        <div className="neural-orb orb-1"></div>
        <div className="neural-orb orb-2"></div>
        <div className="neural-orb orb-3"></div>
        {/* Logo Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <img src="/logo.png" className="w-[40vw] grayscale blur-sm" alt="watermark" />
        </div>
      </div>

      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-2 md:px-0 flex flex-col pt-24 md:pt-32 pb-4 md:pb-8 h-screen relative z-10">

        {/* Top Controls Float - Repositioned to avoid Header overlap on small screens */}
        <div className="fixed top-20 md:top-8 right-2 md:right-8 z-[60] flex items-center gap-2 md:gap-3">
          <div className="scale-90 md:scale-100 origin-right flex items-center gap-2 md:gap-3">
            <VoiceConsultant context={context} />
            <button
              onClick={handleReset}
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl glass-button flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/40 transition-all shadow-xl"
              title="Novo Atendimento"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
            </button>
            <KnowledgeManager onKnowledgeUpdate={setContext} />
          </div>
        </div>

        {/* Chat Hub */}
        <div className="flex-1 flex flex-col rounded-2xl md:rounded-3xl overflow-hidden glass-panel border-white/5 shadow-2xl relative">

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 md:p-12 space-y-6 md:space-y-10 scrollbar-hide">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in group`}>

                <div className={`relative max-w-[90%] md:max-w-[80%] rounded-2xl md:rounded-3xl p-5 md:p-8 transition-all duration-300 ${m.role === 'user'
                  ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-50 shadow-indigo-500/5'
                  : 'bg-white/5 border border-white/10 text-slate-100 shadow-white/5'
                  } backdrop-blur-3xl`}>

                  {/* Interaction Status */}
                  {m.role === 'assistant' && (
                    <div className="absolute -left-1 -top-1 md:-left-2 md:-top-2 w-4 h-4 md:w-5 md:h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 border border-white/20 shadow-lg shadow-indigo-500/40"></div>
                  )}

                  <div className="prose prose-invert prose-xs md:prose-base max-w-none leading-relaxed tracking-wide">
                    {m.content.split('\n').map((line, i) => (
                      <p key={i} className="mb-2 md:mb-3 last:mb-0 min-h-[1.2em] md:min-h-[1.5em] font-light text-sm md:text-base">
                        {line.split('**').map((part, index) => (
                          index % 2 === 1 ? <strong key={index} className="font-bold text-indigo-300">{part}</strong> : part
                        ))}
                      </p>
                    ))}
                  </div>

                  <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[8px] md:text-[9px] font-bold text-white/20 uppercase tracking-[0.4em]">
                      {m.role === 'user' ? 'Comando Recebido' : 'Resposta Neural'}
                    </span>
                    <span className="text-[9px] md:text-[10px] text-white/30 font-mono">
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
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
                  <span className="text-[9px] md:text-[11px] text-indigo-300 font-bold uppercase tracking-[0.2em] animate-pulse">Consultando Redes...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Floating Action Port */}
          <div className="p-4 md:p-10 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent">
            <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto group">
              <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl md:rounded-3xl blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-1000"></div>

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
            <div className="flex justify-center mt-4 md:mt-6">
              <span className="text-[8px] md:text-[9px] text-slate-700 font-bold uppercase tracking-[0.5em] text-center">
                Inteligência Artificial de Nível Doutoral
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
