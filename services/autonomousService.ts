
import { geminiService } from './geminiService';
import { azureService } from './azureService';

/**
 * AGENTE AUTÔNOMO DE INGESTÃO CONTÁBIL
 * Este serviço monitora feeds oficiais e atualiza o RAG no Azure Cosmos DB.
 */
export class AutonomousIngestionService {
    private intervalId: NodeJS.Timeout | null = null;
    private isRunning = false;

    // Lista de Feeds Oficiais e de Notícias Contábeis
    private feeds = [
        { name: "Receita Federal", url: "https://www.gov.br/receitafederal/pt-br/assuntos/noticias/RSS" },
        { name: "Portal Contábeis", url: "https://www.contabeis.com.br/rss/noticias/" },
        { name: "Jornal Contábil", url: "https://www.jornalcontabil.com.br/feed/" },
        { name: "Sefaz SP", url: "https://portal.fazenda.sp.gov.br/_layouts/15/listfeed.aspx?List=%7B5A6E8C0D-1B2F-4A0E-B8EB-8F8D6E9E6D5C%7D" }
    ];

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
     * Realiza a varredura e processamento de todas as fontes configuradas
     */
    private async performScan() {
        console.log(`[${new Date().toLocaleTimeString()}] Iniciando varredura multi-fonte...`);

        for (const feed of this.feeds) {
            console.log(`- Verificando: ${feed.name}...`);
            try {
                const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
                const response = await fetch(proxyUrl);
                const data = await response.json();

                if (!data.items || data.items.length === 0) continue;

                const existingKnowledge = await azureService.getKnowledge();

                // Processamos os itens mais recentes (top 3 de cada feed para evitar spam)
                for (const item of data.items.slice(0, 3)) {
                    const title = item.title;
                    const link = item.link;
                    const description = item.description.replace(/<[^>]*>?/gm, '').substring(0, 2000);

                    const alreadyExists = existingKnowledge.some((k: any) =>
                        k.title === title || (k.metadata && k.metadata.link === link)
                    );

                    if (alreadyExists) continue;

                    console.log(`  🔍 Analisando conteúdo de ${feed.name}: ${title}`);

                    const promptIngestao = `
                        Você é um AGENTE AUTÔNOMO DE APRENDIZADO CONTÁBIL.
                        Analise este conteúdo vindo de: ${feed.name}
                        TÍTULO: ${title}
                        CONTEÚDO: ${description}
                        
                        Sua tarefa é determinar se este conteúdo contém informações técnicas valiosas para um RAG contábil (Leis, normas, prazos, decisões judiciais tributárias, instruções normativas).
                        
                        Responda RIGOROSAMENTE no formato JSON:
                        {
                          "acao": "SALVAR_RAG" | "DESCARTAR",
                          "dados": {
                            "titulo": "Título técnico conciso",
                            "resumo_pratico": "A explicação técnica clara para o contador",
                            "categoria": "Tributária | Trabalhista | Previdenciária | Societária",
                            "urgencia": "Alta | Média | Baixa"
                          }
                        }
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
                                    fonte_original: feed.name,
                                    ingestao: 'Automatizada via Multi-Feed'
                                },
                                timestamp: new Date().toISOString(),
                                source: feed.name
                            });
                            console.log(`  ✅ INTEGRADO: ${analysisResult.dados.titulo}`);
                        }
                    } catch (e) {
                        // Silencia erros de parse para não interromper o loop
                    }
                }
            } catch (error) {
                console.error(`Erro ao processar feed ${feed.name}:`, error);
            }
        }
    }
}

export const autonomousService = new AutonomousIngestionService();
