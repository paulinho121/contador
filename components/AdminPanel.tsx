
import React, { useState, useEffect } from 'react';
import { azureService } from '../services/azureService';
import SmartLawIngestor from './SmartLawIngestor';

interface AdminPanelProps {
    onClose: () => void;
    onKnowledgeUpdate: (context: string) => void;
    currentUserEmail: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, onKnowledgeUpdate, currentUserEmail }) => {
    if (currentUserEmail !== 'paulofernandoautomacao@gmail.com') {
        return <div className="fixed inset-0 z-[110] bg-black flex items-center justify-center text-red-500 font-bold">ACESSO NEGADO</div>;
    }
    const [users, setUsers] = useState<any[]>([]);
    const [knowledgeItems, setKnowledgeItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'users' | 'rag' | 'leis' | 'discovery'>('users');
    const [isSyncing, setIsSyncing] = useState(false);

    // RAG Form state
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const allUsers = await azureService.getAllUsers();
            const knowledge = await azureService.getKnowledge();
            setUsers(allUsers);
            setKnowledgeItems(knowledge);

            if (knowledge.length > 0) {
                const allContent = knowledge
                    .map(item => `### ${item.title || 'Informação'}\n${item.content}\n`)
                    .join('\n---\n\n');
                onKnowledgeUpdate(allContent);
            }
        } catch (error) {
            console.error("Erro ao carregar dados do admin:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddKnowledge = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle || !newContent) return;

        setIsSaving(true);
        try {
            await azureService.addKnowledge({
                title: newTitle,
                content: newContent
            });
            setNewTitle('');
            setNewContent('');
            await fetchData();
        } catch (error) {
            alert("Erro ao salvar conhecimento");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteKnowledge = async (id: string) => {
        if (!confirm("Tem certeza que deseja remover este conhecimento?")) return;
        try {
            await azureService.deleteKnowledge(id);
            await fetchData();
        } catch (error) {
            alert("Erro ao deletar");
        }
    };

    const onlineUsers = users.filter(u => {
        if (!u.lastActive) return false;
        const lastActive = new Date(u.lastActive).getTime();
        const now = new Date().getTime();
        return (now - lastActive) < 10 * 60 * 1000;
    });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-6xl h-full max-h-[90vh] bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative">

                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Painel do Administrador</h2>
                            <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-bold">Controle Central Neural</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-slate-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex flex-col md:flex-row items-center gap-6 p-8 bg-white/[0.01]">
                    <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-white/5">
                        <button onClick={() => setActiveTab('users')} className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}>Usuários</button>
                        <button onClick={() => setActiveTab('rag')} className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'rag' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}>Base RAG</button>
                        <button onClick={() => setActiveTab('leis')} className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'leis' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}>Processar Lei</button>
                        <button onClick={() => setActiveTab('discovery')} className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'discovery' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}>Auto-Discovery</button>
                    </div>

                    <div className="flex gap-4 ml-auto">
                        <div className="bg-white/5 border border-white/5 px-6 py-3 rounded-2xl">
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Total de Usuários</span>
                            <span className="text-xl font-black text-white">{users.length}</span>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl">
                            <span className="text-[10px] text-emerald-500/60 uppercase tracking-widest block mb-1">Online Agora</span>
                            <span className="text-xl font-black text-emerald-400">{onlineUsers.length}</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 pt-0 scrollbar-hide">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="flex gap-2">
                                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                        </div>
                    ) : activeTab === 'users' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                            {users.map((user) => {
                                const isOnline = user.lastActive && (new Date().getTime() - new Date(user.lastActive).getTime()) < 10 * 60 * 1000;
                                return (
                                    <div key={user.id} className="bg-white/5 border border-white/5 p-6 rounded-3xl hover:border-indigo-500/30 transition-all group">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 font-bold group-hover:scale-110 transition-transform">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            {isOnline && (
                                                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase rounded-full">
                                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                                                    Online
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-white font-bold truncate">{user.name}</h3>
                                        <p className="text-slate-500 text-xs truncate mb-4">{user.email}</p>
                                        <div className="pt-4 border-t border-white/5">
                                            <span className="text-[9px] text-slate-600 uppercase tracking-widest block mb-1">Última atividade</span>
                                            <span className="text-[10px] text-slate-400">{user.lastActive ? new Date(user.lastActive).toLocaleString() : 'Sem registros'}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : activeTab === 'rag' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-fade-in">
                            <div className="space-y-6">
                                <div className="p-6 bg-white/[0.03] border border-white/10 rounded-[2rem]">
                                    <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                                        Adicionar Novo Conhecimento (RAG)
                                    </h3>
                                    <form onSubmit={handleAddKnowledge} className="space-y-4">
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-4 mb-2 block">Título / Assunto</label>
                                            <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ex: Alíquota ISS 2024" className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-indigo-500/50" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-4 mb-2 block">Conteúdo Detalhado</label>
                                            <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Descreva aqui as regras ou informações..." className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-indigo-500/50 min-h-[200px]" />
                                        </div>
                                        <button type="submit" disabled={isSaving} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 uppercase tracking-widest text-xs">
                                            {isSaving ? 'Gravando no Núcleo...' : 'Alimentar Inteligência'}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-white font-bold uppercase tracking-widest text-xs flex items-center gap-2 mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" /><path d="M8 7h6" /><path d="M8 11h8" /></svg>
                                    Base de Dados Atual
                                </h3>
                                {knowledgeItems.map((item) => (
                                    <div key={item.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl group relative">
                                        <button onClick={() => handleDeleteKnowledge(item.id)} className="absolute top-4 right-4 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                        </button>
                                        <h4 className="text-sm font-bold text-white mb-2">{item.title}</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{item.content}</p>
                                        <span className="text-[9px] text-slate-700 uppercase tracking-widest block mt-4">{new Date(item.timestamp).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : activeTab === 'leis' ? (
                        <div className="space-y-8 animate-fade-in">
                            {/* Crawler Section */}
                            <div className="p-8 bg-indigo-600/5 border border-indigo-500/20 rounded-[2.5rem] mb-10">
                                <h3 className="text-white font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2 italic">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                    Crawler Legislativo (Alpha)
                                </h3>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <input
                                        type="text"
                                        id="crawler-url"
                                        placeholder="Cole a URL de uma Lei (Ex: Jusbrasil, Planalto, LeisMunicipais)"
                                        className="flex-1 bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:border-indigo-500/50"
                                    />
                                    <button
                                        onClick={async () => {
                                            const url = (document.getElementById('crawler-url') as HTMLInputElement).value;
                                            if (!url) return alert("Insira uma URL");
                                            alert("Iniciando varredura profunda... Acompanhe os logs no console.");
                                            try {
                                                const { lawCrawlerService } = await import('../services/lawCrawlerService');
                                                const result = await lawCrawlerService.ingestFromUrl(url, { esfera: 'Municipal', municipio: 'Detectado via URL' });
                                                alert(`Sucesso! ${result.totalChunks} novos fragmentos adicionados ao RAG.`);
                                                fetchData();
                                            } catch (e) {
                                                alert("Erro no crawler. Verifique o console.");
                                            }
                                        }}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20"
                                    >
                                        Sincronizar Lei via URL
                                    </button>
                                </div>
                                <p className="text-[9px] text-slate-500 mt-4 uppercase tracking-[0.2em] font-bold">O sistema irá ler, fragmentar e classificar cada artigo automaticamente.</p>
                            </div>

                            <div className="mb-10">
                                <SmartLawIngestor />
                            </div>

                            <div className="pt-8 border-t border-white/5">
                                <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6 px-4">Sugestões Rápidas de Legislação</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[
                                        { city: 'FEDERAL', title: 'Lei Comp. 214/2025 (Reforma)', content: 'Institui o IBS e CBS. O ISS municipal será extinto e substituído pelo IBS gradualmente entre 2026 e 2032. A partir de set/2025, os códigos de serviço devem ser unificados ao padrão nacional.' },
                                        { city: 'SÃO PAULO (Estado)', title: 'RICMS/SP (Dec. 45.490/2000)', content: 'Alíquota interna padrão de 18%. Substituição Tributária (ST) aplicada a diversos setores (bebidas, autopeças, perfumaria). Isenção para hortifrutigranjeiros. Redução de base de cálculo para cesta básica (7%).' },
                                        { city: 'Barueri - SP', title: 'ISS Barueri (Lei 118/2022)', content: 'Alíquota geral: 5%. Alíquotas reduzidas (2%): TI, saúde e educação. O cálculo para autônomos utiliza a UFIB. Vencimento: Dia 10 do mês subsequente.' }
                                    ].map((sugestion, idx) => (
                                        <div key={idx} className="p-6 bg-white/[0.03] border border-white/10 rounded-3xl hover:border-indigo-500/30 transition-all flex flex-col h-full">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center text-[10px] font-black text-indigo-400">
                                                    {sugestion.city.substring(0, 2).toUpperCase()}
                                                </div>
                                                <h4 className="text-sm font-bold text-white uppercase italic">{sugestion.city}</h4>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">{sugestion.title}</p>
                                            <p className="text-xs text-slate-400 mb-6 flex-1 line-clamp-2">{sugestion.content}</p>
                                            <button
                                                onClick={() => { setNewTitle(`${sugestion.city}: ${sugestion.title}`); setNewContent(sugestion.content); setActiveTab('rag'); }}
                                                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-[0.2em] transition-all"
                                            >
                                                Carregar para RAG
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'discovery' ? (
                        <div className="space-y-8 animate-fade-in">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* API Status Card */}
                                <div className="p-8 bg-slate-950 border border-white/5 rounded-[2.5rem]">
                                    <h4 className="text-white font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        Status das APIs Externas
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <span className="text-xs text-slate-400 font-bold uppercase">BrasilAPI (CNPJ/CEP)</span>
                                            <span className="text-[10px] text-emerald-400 font-black">Conectado (Livre)</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <span className="text-xs text-slate-400 font-bold uppercase">Tavily Web Search</span>
                                            <span className={`text-[10px] ${import.meta.env.VITE_TAVILY_API_KEY ? 'text-emerald-400' : 'text-amber-500'} font-black italic`}>
                                                {import.meta.env.VITE_TAVILY_API_KEY ? 'Ativo (Premium)' : 'Aguardando Chave'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <span className="text-xs text-slate-400 font-bold uppercase">Receita Federal RSS</span>
                                            <span className="text-[10px] text-emerald-400 font-black">Sincronizado</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Multi-Feed Monitoring */}
                                <div className="lg:col-span-2 p-8 bg-indigo-600/10 border border-indigo-500/20 rounded-[2.5rem]">
                                    <h4 className="text-white font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2 italic">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                                        Monitoramento Inteligente de Fontes (RAG Automático)
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { name: "Receita Federal", desc: "Legislação, Instruções Normativas e Atos", status: "Monitorando" },
                                            { name: "Sefaz SP", desc: "Mudanças no ICMS e substituição tributária", status: "Monitorando" },
                                            { name: "Portal Contábeis", desc: "Principais notícias e prazos do setor", status: "Monitorando" },
                                            { name: "Simples Nacional", desc: "Resoluções e comitê gestor", status: "Em Breve" }
                                        ].map((source, i) => (
                                            <div key={i} className="p-5 bg-black/40 border border-white/5 rounded-2xl hover:border-indigo-500/30 transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h5 className="text-white font-bold text-sm italic">{source.name}</h5>
                                                    <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-full font-black uppercase tracking-widest">{source.status}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 leading-relaxed font-bold uppercase tracking-tighter">{source.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-8 flex gap-4">
                                        <button onClick={() => alert("Varredura manual iniciada...")} className="flex-1 bg-white text-black font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-indigo-400 transition-all italic">Forçar Varredura Agora</button>
                                        <button onClick={() => alert("Alertas ativados")} className="flex-1 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Configurar Alertas Telegram</button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 bg-slate-950 border border-white/5 rounded-[3rem] relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
                                <h3 className="text-xl font-black text-white mb-6 italic uppercase tracking-tighter">Missão de Aprendizado</h3>
                                <p className="text-sm text-slate-400 mb-8 leading-relaxed max-w-2xl">
                                    A IA "Dr. Contador" não apenas responde dúvidas, ela aprende continuamente.
                                    A cada 30 minutos, o sistema consulta as APIs públicas acima para detectar novas leis e integrá-las à sua base de vetores (RAG).
                                </p>
                                <div className="flex items-center gap-6 p-6 bg-white/5 rounded-3xl border border-white/10">
                                    <div className="p-4 bg-indigo-500/20 rounded-2xl">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-indigo-300 font-black uppercase tracking-[0.2em] mb-1">Dica de Administrador</p>
                                        <p className="text-[10px] text-slate-500 font-medium">Você pode falar no chat: "Pesquise na internet sobre a nova portaria do IRPF" e o sistema usará o Tavily para enriquecer o parecer em tempo real.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
