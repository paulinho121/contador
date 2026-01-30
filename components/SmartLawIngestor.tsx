
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { azureService } from '../services/azureService';
import { LawChunk } from '../types';

const SmartLawIngestor: React.FC = () => {
    const [rawText, setRawText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [chunks, setChunks] = useState<LawChunk[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const handleProcess = async () => {
        if (!rawText.trim()) return;
        setIsProcessing(true);
        try {
            const processedChunks = await geminiService.processLaw(rawText);
            setChunks(processedChunks);
        } catch (error) {
            alert("Erro ao processar o texto com IA. Verifique se o conteúdo é válido.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveAll = async () => {
        if (chunks.length === 0) return;
        setIsSaving(true);
        try {
            for (const chunk of chunks) {
                await azureService.addKnowledge({
                    title: `${chunk.tipo_norma} ${chunk.numero_norma}/${chunk.ano} - ${chunk.artigo}`,
                    content: chunk.texto,
                    metadata: {
                        ...chunk,
                        source: "Ingestão Inteligente LeisMunicipais"
                    }
                });
            }
            alert(`Sucesso! ${chunks.length} dispositivos foram salvos na base RAG.`);
            setChunks([]);
            setRawText('');
        } catch (error) {
            alert("Erro ao salvar no Azure Cosmos DB.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="p-6 bg-slate-950/50 border border-white/10 rounded-[2rem]">
                <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    Alimentação Inteligente (RAG Automático)
                </h3>
                <p className="text-[10px] text-slate-500 mb-6 leading-relaxed">
                    Cole o texto bruto da lei abaixo. O sistema usará IA para identificar esferas, tributos e realizar o chunking automático por artigos e parágrafos conforme as melhores práticas de RAG Contábil.
                </p>

                <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Cole aqui o texto do Código Tributário ou Lei... (Dica: Copie do site LeisMunicipais)"
                    className="w-full h-48 bg-black/40 border border-white/5 rounded-2xl p-4 text-slate-300 text-xs font-mono mb-4 outline-none focus:border-indigo-500/50"
                />

                <button
                    onClick={handleProcess}
                    disabled={isProcessing || !rawText.trim()}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                >
                    {isProcessing ? (
                        <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analisando Legislação...
                        </>
                    ) : 'Processar e Fragmentar Lei'}
                </button>
            </div>

            {chunks.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-4">
                        <h4 className="text-white font-bold text-xs uppercase tracking-widest">Preview: {chunks.length} Fragmentos Identificados</h4>
                        <button
                            onClick={handleSaveAll}
                            disabled={isSaving}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest transition-all"
                        >
                            {isSaving ? 'Salvando...' : 'Confirmar e Salvar Tudo'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                        {chunks.map((chunk, idx) => (
                            <div key={idx} className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase rounded">{chunk.artigo}</span>
                                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase rounded">{chunk.tributo}</span>
                                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[8px] font-black uppercase rounded">{chunk.tema}</span>
                                    <span className="px-2 py-0.5 bg-slate-500/20 text-slate-400 text-[8px] font-black uppercase rounded">{chunk.esfera}</span>
                                </div>
                                <p className="text-[11px] text-slate-300 leading-relaxed italic border-l-2 border-indigo-500/30 pl-3">
                                    {chunk.texto}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmartLawIngestor;
