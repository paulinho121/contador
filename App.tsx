
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import KnowledgeManager from './components/KnowledgeManager';
import { Message } from './types';
import { geminiService } from './services/geminiService';
import VoiceConsultant from './components/VoiceConsultant';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá. Sou o **Dr. Contador**, seu consultor doutor em contabilidade. \n\nEstou à sua disposição para fornecer pareceres técnicos e fundamentação legal para suas dúvidas contábeis e tributárias. Como posso auxiliá-lo hoje?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState(`
- Simples Nacional: Regime unificado de tributos (LC 123/2006). Analogia: Uma única "cesta" de impostos em vez de vários boletos separados.
- ICMS (Imposto sobre Circulação de Mercadorias e Serviços): Imposto estadual. Em SP, alíquota interna padrão é 18% (Art. 52 RICMS/SP).
- Pró-labore: Remuneração do sócio que trabalha na empresa. Diferente de dividendos, incide INSS (11%) e IRRF conforme tabela.
- DRE (Demonstração do Resultado): Relatório econômico. Mostra se a operação deu lucro. Analogia: O placar final de um jogo.
- Balanço Patrimonial: Registro contábil de Ativos (bens e direitos) e Passivos (obrigações). Analogia: Uma foto de tudo que você tem vs. tudo que deve.
`);

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
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sessão reiniciada. Como posso ajudar com sua próxima dúvida contábil?',
        timestamp: new Date()
      }
    ]);
  };

  const quickTerms = ["Simples Nacional", "ICMS em SP", "Cálculo Pró-labore", "Balanço vs DRE"];


  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 group">
          <KnowledgeManager onKnowledgeUpdate={setContext} />
          <div className="flex items-center gap-4">
            <VoiceConsultant context={context} />
            <button
              onClick={handleReset}
              className="text-slate-400 hover:text-red-500 text-xs font-bold flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200/60 shadow-sm transition-all hover:shadow-md hover:border-red-100 active:scale-95"
              title="Limpar memória da conversa"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
              LIMPAR SESSÃO
            </button>
          </div>
        </div>

        <div className="premium-card premium-shadow flex flex-col h-[75vh] animate-fade-in">
          {/* Chat Header Info */}
          <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l4-4V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v10z" /><path d="M3 21v-8a2 2 0 0 1 2-2h2" /></svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Gabinete Digital</h3>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Doutor em Contabilidade Online</p>
              </div>
            </div>
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">AI</div>
              ))}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white/40">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[70%] rounded-3xl p-5 premium-shadow ${m.role === 'user'
                    ? 'message-user'
                    : 'message-assistant'
                    }`}
                >
                  <div className={`prose prose-sm max-w-none ${m.role === 'user' ? 'prose-invert font-medium' : 'prose-slate'}`}>
                    {m.content.split('\n').map((line, i) => {
                      if (line.startsWith('🎓')) {
                        return (
                          <div key={i} className="bg-indigo-50/80 p-4 rounded-2xl border border-indigo-100 my-4 text-indigo-900 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">🎓</span>
                              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Parecer Técnico</span>
                            </div>
                            <p className="text-sm leading-relaxed">{line.replace('🎓 **PARECER TÉCNICO**:', '').replace('🎓', '').trim()}</p>
                          </div>
                        );
                      }
                      if (line.startsWith('⚖️')) {
                        return (
                          <div key={i} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 my-4 text-slate-800 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">⚖️</span>
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Fundamentação Legal</span>
                            </div>
                            <p className="text-sm italic leading-relaxed">{line.replace('⚖️ **FUNDAMENTAÇÃO**:', '').replace('⚖️', '').trim()}</p>
                          </div>
                        );
                      }
                      if (line.startsWith('🚀')) {
                        return (
                          <div key={i} className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-100 my-4 text-emerald-900 shadow-sm border-l-4 border-l-emerald-400">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">🚀</span>
                              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Plano de Ação</span>
                            </div>
                            <p className="text-sm font-semibold leading-relaxed">{line.replace('🚀 **PLANO DE AÇÃO**:', '').replace('🚀', '').trim()}</p>
                          </div>
                        );
                      }

                      return <p key={i} className="mb-3 last:mb-0 leading-relaxed text-[15px]">{line}</p>;
                    })}
                  </div>
                  <div className={`flex items-center gap-2 mt-4 opacity-50 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {m.role === 'assistant' && (
                      <div className="flex gap-1">
                        <button className="p-1 hover:text-indigo-600 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" /></svg></button>
                        <button className="p-1 hover:text-indigo-600 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-white border border-slate-200 rounded-3xl rounded-tl-none p-5 shadow-sm flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  </div>
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Processando Legislação...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-slate-200/60 bg-slate-50/50">
            <div className="flex flex-wrap gap-2 mb-6">
              {quickTerms.map(term => (
                <button
                  key={term}
                  onClick={() => setInput(term)}
                  className="text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl bg-white text-slate-600 hover:bg-slate-900 hover:text-white transition-all border border-slate-200 shadow-sm hover:shadow-md active:scale-95"
                >
                  {term}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-indigo-600 rounded-2xl blur opacity-10 group-focus-within:opacity-20 transition duration-500"></div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ex: Como funciona a tributação de dividendos?"
                className="relative w-full bg-white border border-slate-200 rounded-2xl py-5 pl-6 pr-16 focus:ring-0 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400 text-slate-700 shadow-sm shadow-indigo-100/20"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-3 top-3 h-12 w-12 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-lg active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
              </button>
            </form>
            <p className="text-[10px] text-center mt-4 text-slate-400 font-medium uppercase tracking-[0.2em]">
              Powered by Google Gemini 2.0 • Respostas baseadas na legislação brasileira
            </p>
          </div>
        </div>
      </main>

      <footer className="py-10 text-center border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-400 text-xs">CA</div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Contador Amigo • 2026</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors">Privacidade</a>
            <a href="#" className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors">Termos de Uso</a>
            <a href="#" className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors">Suporte Técnico</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
