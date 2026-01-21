
import React, { useState } from 'react';

import { azureService } from '../services/azureService';

interface KnowledgeManagerProps {
  onKnowledgeUpdate: (context: string) => void;
}

const DEFAULT_CONTEXT = `
# REGRAS TRIBUTÁRIAS E CONTÁBEIS (BASE RAG)

- **Simples Nacional**: Instituído pela Lei Complementar 123/2006. É um regime simplificado que abrange IRPJ, CSLL, PIS/Pasep, Cofins, IPI, ICMS, ISS e a Contribuição Previdenciária Patronal (CPP).
- **ICMS em São Paulo**: Alíquota interna padrão de 18% para a maioria das mercadorias, conforme Art. 52, I, do RICMS/SP. Existem alíquotas específicas (ex: 7% para insumos agrícolas, 12% para transporte).
- **Pró-labore**: É a remuneração obrigatória para sócios administradores (Instrução Normativa RFB nº 971/2009). Incidência: 11% de INSS (limitado ao teto) e Tabela Progressiva de IRRF.
- **Distribuição de Lucros**: Isenta de IR para o beneficiário (Lei nº 9.249/95), desde que a empresa tenha lucro contábil comprovado e não possua débitos previdenciários.
- **DRE (Demonstração do Resultado)**: Regulada pelo CPC 26. Deve apresentar Receita Bruta (-) Deduções (=) Receita Líquida (-) Custos (=) Lucro Bruto, etc.
- **MEI**: Faturamento anual de até R$ 81.000,00. Contribuição mensal fixa (DAS-MEI) que inclui INSS, ISS e/ou ICMS.
`;

const KnowledgeManager: React.FC<KnowledgeManagerProps> = ({ onKnowledgeUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [contextText, setContextText] = useState(DEFAULT_CONTEXT);
  const [dataStatus, setDataStatus] = useState<'local' | 'syncing' | 'synced' | 'error'>('local');

  React.useEffect(() => {
    async function loadFromCloud() {
      if (azureService.isConfigured()) {
        const items = await azureService.getKnowledge();
        if (items && items.length > 0) {
          // Assuming the latest item has the full context or accumulating
          // For this simple version, we take the latest content field if it exists
          const latest = items[0];
          if (latest.content) {
            setContextText(latest.content);
            onKnowledgeUpdate(latest.content);
            setDataStatus('synced');
          }
        }
      }
    }
    loadFromCloud();
  }, []); // Run once on mount

  const handleSave = async () => {
    setDataStatus('syncing');
    onKnowledgeUpdate(contextText);

    if (azureService.isConfigured()) {
      try {
        await azureService.addKnowledge({
          content: contextText,
          updatedAt: new Date().toISOString(),
          source: 'Dr. Contador UI'
        });
        setDataStatus('synced');
      } catch (e) {
        console.error(e);
        setDataStatus('error');
      }
    } else {
      // Fallback to local only
      setDataStatus('local');
    }

    setIsOpen(false);
  };

  return (
    <div className="w-full md:w-auto">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative overflow-hidden px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-sm border ${isOpen
          ? 'bg-slate-900 border-slate-900 text-white shadow-slate-200'
          : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'
          }`}
      >
        <div className="flex items-center gap-3 relative z-10">
          <div className={`p-1.5 rounded-lg transition-colors ${isOpen ? 'bg-slate-800' : 'bg-slate-50 group-hover:bg-indigo-50'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" /><path d="M8 7h6" /><path d="M8 11h8" /></svg>
          </div>
          <span>{isOpen ? "Fechar Base Técnica" : "Gerenciar Base Técnica (RAG)"}</span>
          <div className={`ml-2 w-2 h-2 rounded-full transition-all ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`}></div>
        </div>
      </button>

      {isOpen && (
        <div className="mt-4 p-6 bg-white border border-slate-200 rounded-3xl shadow-2xl ring-1 ring-slate-200/50 animate-fade-in relative z-20 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-indigo-600"></div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">Legislação e Contexto Especializado</h4>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Personalize o cérebro da AI com normas específicas do seu setor.</p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dataStatus === 'synced' ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dataStatus === 'synced' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className={`text-[10px] font-extrabold uppercase tracking-widest ${dataStatus === 'synced' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {dataStatus === 'synced' ? 'Sincronizado na Nuvem' : dataStatus === 'syncing' ? 'Sincronizando...' : 'Modo Offline'}
              </span>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-200 to-slate-100 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
            <textarea
              value={contextText}
              onChange={(e) => setContextText(e.target.value)}
              className="relative w-full h-64 p-5 text-sm border border-slate-200 rounded-2xl focus:ring-0 focus:border-indigo-400 outline-none font-mono leading-relaxed bg-slate-50/50 text-slate-700 shadow-inner"
              placeholder="Ex: Artigo X da Lei Y diz que..."
            />
          </div>

          <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              Dados Criptografados e Seguros
            </div>
            <button
              onClick={handleSave}
              className="w-full md:w-auto bg-slate-900 text-white px-8 py-3 rounded-2xl text-[11px] font-extrabold uppercase tracking-[0.15em] hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-200 active:scale-95"
            >
              Atualizar Inteligência
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeManager;
