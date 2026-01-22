
import { geminiService } from './geminiService';
import { azureService } from './azureService';

/**
 * AGENTE AUTÔNOMO DE INGESTÃO CONTÁBIL
 * Este serviço monitora feeds oficiais e atualiza o RAG no Azure Cosmos DB.
 */
export class AutonomousIngestionService {
    private intervalId: NodeJS.Timeout | null = null;
    private isRunning = false;

    // Feed da Receita Federal do Brasil (Legislação Geral)
    private rssUrl = "https://www.gov.br/receitafederal/pt-br/assuntos/noticias/RSS";

    /**
     * Inicia o monitoramento em background
     */
    startMonitoring(frequencyMs: number = 3600000) {
        if (this.isRunning) return;

        console.log("🚀 Monitoramento de Fontes Oficiais (RFB) iniciado...");
        this.isRunning = true;

        // Executa a primeira varredura imediatamente
        this.performScan();

        // Agenda as próximas
        this.intervalId = setInterval(() => {
            this.performScan();
        }, frequencyMs);
    }

    /**
     * Para o monitoramento
     */
    stopMonitoring() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log("🛑 Monitoramento interrompido.");
    }

    /**
     * Realiza a varredura e processamento das fontes RSS reais
     */
    private async performScan() {
        console.log(`[${new Date().toLocaleTimeString()}] Buscando novidades no portal da Receita Federal...`);

        try {
            // Utilizamos um serviço público de conversão de RSS para JSON para facilitar o consumo no frontend
            const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(this.rssUrl)}`;
            const response = await fetch(proxyUrl);
            const data = await response.json();

            if (!data.items || data.items.length === 0) return;

            const existingKnowledge = await azureService.getKnowledge();

            // Processamos os itens mais recentes
            for (const item of data.items.slice(0, 5)) {
                const title = item.title;
                const link = item.link;
                const description = item.description.replace(/<[^>]*>?/gm, ''); // Limpa HTML

                // Verifica se já processamos este título ou link
                const alreadyExists = existingKnowledge.some((k: any) =>
                    k.title === title || (k.metadata && k.metadata.link === link)
                );

                if (alreadyExists) {
                    continue;
                }

                console.log(`- Analisando nova norma RFB: ${title}`);

                const promptIngestao = `
                    Você é um AGENTE AUTÔNOMO DE APRENDIZADO CONTÁBIL.
                    Analise esta notícia/norma da Receita Federal:
                    TÍTULO: ${title}
                    CONTEÚDO: ${description}
                    
                    Se este conteúdo for relevante para profissionais de contabilidade (Leis, INs, Prazos, Obrigações), gere o JSON de salvamento seguindo RIGOROSAMENTE as 5 etapas do seu protocolo.
                    Caso seja irrelevante, responda APENAS: {"acao": "DESCARTAR"}
                    
                    Responda APENAS o JSON puro.
                `;

                const result = await geminiService.ask(promptIngestao, "Agente de Inteligência Normativa.");

                try {
                    const cleanedJson = result.replace(/```json|```/g, '').trim();
                    const analysisResult = JSON.parse(cleanedJson);

                    if (analysisResult.acao === "SALVAR_RAG") {
                        await azureService.addKnowledge({
                            title: analysisResult.dados.titulo,
                            content: analysisResult.dados.resumo_pratico,
                            metadata: {
                                ...analysisResult.dados,
                                link: link,
                                ingestao: 'Automatizada via Feed RFB'
                            },
                            timestamp: new Date().toISOString(),
                            source: 'Receita Federal do Brasil'
                        });
                        console.log(`✅ CONHECIMENTO INTEGRADO AO RAG: ${analysisResult.dados.titulo}`);
                    } else {
                        console.log(`- Item descartado por irrelevância técnica: ${title}`);
                    }
                } catch (e) {
                    console.warn(`Erro ao processar resposta do Gemini para: ${title}`);
                }
            }
        } catch (error) {
            console.error("Erro na varredura RSS:", error);
        }
    }
}

export const autonomousService = new AutonomousIngestionService();
