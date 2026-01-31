import React, { useState, useRef, useEffect } from 'react';
import { Message } from './types';
import { geminiService } from './services/geminiService';
import { autonomousService } from './services/autonomousService';
import AuthPage from './components/AuthPage';
import AdminPanel from './components/AdminPanel';
import { azureService } from './services/azureService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { selfLearningService } from './services/selfLearningService';

const WELCOME_GUIDE = `
# Como obter o melhor Parecer Premium? 🎓
Para que eu possa entregar uma consultoria de elite, tente estruturar sua pergunta seguindo estes pilares:

1. **Contexto Completo**: Informe seu regime tributário (Simples, Presumido ou Real).
2. **Dados Técnicos**: Se possível, mencione NCMs ou CBOs específicos.
3. **O Objetivo**: O que você busca? Economia de caixa, evitar multas ou planejamento?
4. **Anexos**: Envie XMLs de notas fiscais ou PDFs para uma análise multimodal profunda.

**Exemplo Ideal**: *"Sou do Lucro Real e quero saber se posso tomar crédito de PIS/COFINS sobre este XML de insumo que acabei de anexar."*
`;

const App: React.FC = () => {
  const [user, setUser] = useState<{ name: string; email: string } | null>(() => {
    const saved = localStorage.getItem('contador_at_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const touchStartX = useRef<number | null>(null);

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
      content: WELCOME_GUIDE,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{ file: File; base64: string; preview: string; textContent?: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const censorPatterns = [
    /\d{3}\.\d{3}\.\d{3}-\d{2}/g, // CPF
    /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g, // CNPJ
    /\b[\w.-]+@[\w.-]+\.\w{2,}\b/g, // Email
    /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}/g // Phone
  ];

  const censorText = (text: string) => {
    let censored = text;
    censorPatterns.forEach(pattern => {
      censored = censored.replace(pattern, (match) => `[REDACTED]`);
    });
    return censored;
  };

  const renderContent = (content: string, role: string) => {
    const safeContent = censorText(content);
    if (role === 'assistant' && !content) {
      return (
        <div className="flex items-center gap-2 text-indigo-300 italic animate-pulse">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Analisando dados...
        </div>
      );
    }
    return (
      <div className="prose prose-invert max-w-none">
        {role === 'assistant' && content.length > 0 && (
          <div className="premium-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
            Parecer Premium
          </div>
        )}
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed text-slate-200">{children}</p>,
            strong: ({ children }) => <strong className="font-bold text-indigo-300">{children}</strong>,
            table: ({ children }) => <div className="overflow-x-auto my-6"><table className="min-w-full">{children}</table></div>,
            th: ({ children }) => <th className="bg-white/5 px-4 py-2 text-left font-bold text-white border-b border-white/10 uppercase text-[10px] tracking-widest">{children}</th>,
            td: ({ children }) => <td className="px-4 py-3 text-sm border-b border-white/5 text-slate-300">{children}</td>,
            h1: ({ children }) => <h1 className="text-xl font-black text-white italic uppercase tracking-tighter mb-4">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-bold text-indigo-200 mb-3">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-bold text-slate-200 mb-2">{children}</h3>,
            ul: ({ children }) => <ul className="space-y-2 mb-4">{children}</ul>,
            li: ({ children }) => (
              <li className="flex gap-2 items-start">
                <span className="text-indigo-400 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                <span className="flex-1">{children}</span>
              </li>
            ),
          }}
        >
          {safeContent}
        </ReactMarkdown>
      </div>
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file: File) => {
      const type = file.type;
      const extension = file.name.split('.').pop()?.toLowerCase();
      return type.startsWith('image/') ||
        type === 'application/pdf' ||
        type === 'text/xml' ||
        type === 'application/xml' ||
        extension === 'xml';
    });

    const newFiles = await Promise.all(validFiles.map(async (file: File) => {
      return new Promise<{ file: File; base64: string; preview: string; textContent?: string }>((resolve) => {
        const reader = new FileReader();
        const extension = file.name.split('.').pop()?.toLowerCase();
        const isXml = file.type === 'text/xml' || file.type === 'application/xml' || extension === 'xml';

        reader.onloadend = () => {
          if (isXml) {
            const content = reader.result as string;
            resolve({
              file,
              base64: '', // Não precisamos de base64 para XML pois enviamos via textPart
              preview: 'xml-icon',
              textContent: content
            });
          } else {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            let preview = '';
            if (file.type.startsWith('image/')) {
              preview = result;
            } else if (file.type === 'application/pdf') {
              preview = 'pdf-icon';
            } else {
              preview = 'file-icon';
            }
            resolve({ file, base64, preview });
          }
        };

        if (isXml) {
          reader.readAsText(file);
        } else {
          reader.readAsDataURL(file);
        }
      });
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };



  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX.current;

    if (diff > 50 && !isSidebarOpen) {
      setIsSidebarOpen(true); // Swipe right to open
    } else if (diff < -50 && isSidebarOpen) {
      setIsSidebarOpen(false); // Swipe left to close
    }
    touchStartX.current = null;
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && selectedFiles.length === 0) || isLoading) return;

    // Coletar conteúdos de texto (XML) separadamente
    const textParts = selectedFiles
      .filter(f => f.textContent)
      .map(f => `NOME DO ARQUIVO: ${f.file.name}\nCONTEÚDO:\n${f.textContent}`)
      .filter((txt): txt is string => !!txt);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input || (selectedFiles.length > 0 ? "Análise estratégica de arquivos" : ""),
      timestamp: new Date(),
      attachments: selectedFiles.map(f => ({
        preview: f.preview,
        fileName: f.file.name,
        type: f.file.type || (f.file.name.endsWith('.xml') ? 'text/xml' : 'application/octet-stream')
      }))
    };

    setMessages(prev => [...prev, userMessage]);

    // Preparar anexos (apenas imagens e PDFs para inline_data)
    const attachments = selectedFiles
      .filter(f => !f.textContent) // XMLs já estão no textParts
      .map(f => ({
        mimeType: f.file.type || 'application/octet-stream',
        data: f.base64
      }));

    setInput('');
    setSelectedFiles([]);
    setIsLoading(true);

    console.log("🚀 Iniciando análise estratégica...", {
      prompt: input || "Análise de arquivos",
      xmls: textParts.length,
      binaries: attachments.length
    });

    const assistantMsgId = (Date.now() + 1).toString();
    const placeholderMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, placeholderMsg]);

    try {
      const response = await geminiService.ask(input || "Analise estes documentos sob a ótica de um gestor tributário.", context, (fullText) => {
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId ? { ...m, content: fullText } : m
        ));
      }, attachments, textParts);

      // Gatilho de Auto-Aprendizagem (Self-Learning)
      // Se a resposta foi genérica, o serviço buscará a lei na web e alimentará o RAG em background.
      selfLearningService.learnFromResponse(input || "Consulta", response).then(didLearn => {
        if (didLearn) {
          console.log("🌟 [RAG] O Dr. Contador acabou de aprender uma nova legislação automaticamente!");
          // Recarregar o contexto para a próxima pergunta
          azureService.getKnowledge().then(items => {
            const allContent = items
              .map(item => `### ${item.title || 'Informação'}\n${item.content}\n`)
              .join('\n---\n\n');
            setContext(allContent);
          });
        }
      });

    } catch (error: any) {
      console.error(error);
      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId ? { ...m, content: `⚠️ **Erro na Análise:** ${error.message || 'Houve um problema ao processar seu documento. Verifique se o arquivo está corrompido ou é muito grande.'}` } : m
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
      content: WELCOME_GUIDE,
      timestamp: new Date()
    }]);
  };


  if (!user) {
    return <AuthPage onLogin={setUser} />;
  }


  return (
    <div
      className="app-container font-sans selection:bg-indigo-500/30"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
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
        <header className="lg:hidden h-14 border-b border-white/5 flex items-center justify-between px-4 bg-slate-900/50 backdrop-blur-md safe-top box-content">
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>
                    )}
                  </div>
                  <div className="flex-1 prose prose-invert prose-sm md:prose-base max-w-none">
                    {renderContent(m.content, m.role)}

                    {m.attachments && m.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {m.attachments.map((att, idx) => (
                          <div key={idx} className="relative group/att w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden border border-white/10 bg-black/20 group">
                            {att.type.startsWith('image/') ? (
                              <img src={att.preview} alt={att.fileName} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-slate-800/50">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400 mb-2">
                                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                  <polyline points="14 2 14 8 20 8" />
                                </svg>
                                <span className="text-[10px] text-white/70 truncate w-full text-center px-1 font-bold uppercase">{att.fileName.split('.').pop()}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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

        <div className="input-container no-print">
          <form onSubmit={handleSubmit} className="input-wrapper">
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 animate-fade-in">
                {selectedFiles.map((f, i) => (
                  <div key={i} className="relative group/file w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-lg">
                    {f.file.type.startsWith('image/') ? (
                      <img src={f.preview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-1 bg-indigo-500/10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span className="text-[8px] text-white/50 truncate w-full text-center mt-1 px-1 font-bold">
                          {f.file.name.split('.').pop()?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover/file:opacity-100 transition-all shadow-lg"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte ao Dr. Contador..."
                className="w-full bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl py-4 md:py-6 pl-14 md:pl-16 pr-16 text-sm md:text-base text-white outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400 shadow-2xl"
              />
              <div className="absolute left-2 top-2 bottom-2 flex items-center z-10">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-slate-400 hover:text-indigo-300 hover:bg-white/5 rounded-xl transition-all"
                  title="Anexar arquivos (Imagens, PDF, XML)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept="image/*,.pdf,.xml"
                  capture="environment"
                  className="hidden"
                />
              </div>
              <button
                type="submit"
                disabled={(!input.trim() && selectedFiles.length === 0) || isLoading}
                className="absolute right-2 md:right-3 top-2 md:top-3 bottom-2 md:bottom-3 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center disabled:opacity-20 transition-all shadow-lg active:scale-95 z-10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={isLoading ? 'animate-pulse' : ''}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
              </button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-5 opacity-60">
              <span className="text-amber-400 animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
              </span>
              <p className="text-[9px] md:text-[10px] font-black text-indigo-200 text-center tracking-[0.2em] uppercase">
                IA Multimodal: Imagens • XML • PDF
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default App;

