
import { externalApiService } from "./externalApiService";
import { lawCrawlerService } from "./lawCrawlerService";
import { geminiService } from "./geminiService";

/**
 * SELF-LEARNING SERVICE
 * Monitora as falhas de conhecimento do RAG e tenta preenchê-las automaticamente.
 */
export class SelfLearningService {

    /**
     * Analisa se a resposta foi genérica e tenta buscar a lei faltante
     */
    async learnFromResponse(prompt: string, assistantResponse: string) {
        // Marcadores de que a base local falhou
        const genericMarkers = [
            "não consta na base",
            "não está disponível na minha base",
            "necessário consultar o código tributário",
            "consulte a legislação municipal",
            "não tenho informações específicas"
        ];

        const isGeneric = genericMarkers.some(marker =>
            assistantResponse.toLowerCase().includes(marker)
        );

        if (!isGeneric) return;

        console.log("🧠 [SELF-LEARNING] Identificada lacuna de conhecimento. Iniciando busca de fonte oficial...");

        try {
            // 1. Pede à IA para identificar EXATAMENTE qual documento falta
            const extractPrompt = `
                Com base nesta conversa, qual é o DOCUMENTO OFICIAL (Lei, Decreto, Código) que falta na base de conhecimento para responder com precisão?
                RESPONDA APENAS O NOME DO DOCUMENTO E A CIDADE/ESTADO.
                Exemplo: Código Tributário Municipal de Caucaia
                
                CONVERSA:
                Usuário: ${prompt}
                IA: ${assistantResponse}
            `;

            const missingDocName = await geminiService.ask(extractPrompt, "Analista de Lacunas RAG");

            if (missingDocName.length > 50 || missingDocName.includes("?")) return;

            console.log(`🧠 [SELF-LEARNING] Buscando URL para: ${missingDocName}`);

            // 2. Busca a URL do documento via Tavily focando em PDFs ou Sites Oficiais
            const searchQuery = `URL oficial arquivo PDF ou site prefeitura ${missingDocName}`;
            const searchResults = await externalApiService.searchWeb(searchQuery);

            // 3. Pede para a IA extrair a MELHOR URL de download ou leitura do resultado
            const urlExtractPrompt = `
                Abaixo estão resultados de busca para "${missingDocName}".
                Identifique a URL que parece ser o documento integral (PDF ou página de legislação).
                Retorne APENAS a URL pura. Se não houver uma URL clara de documento, responda "NONE".
                
                RESULTADOS:
                ${searchResults}
            `;

            const targetUrl = await geminiService.ask(urlExtractPrompt, "Extrator de URLs de Legislação");

            if (targetUrl && targetUrl.startsWith("http") && !targetUrl.includes("NONE")) {
                console.log(`🚀 [SELF-LEARNING] URL Encontrada! Iniciando auto-ingestão: ${targetUrl}`);

                // 4. Ingestão automática no RAG
                // Determinando esfera (heurística simples)
                const esfera = missingDocName.toLowerCase().includes("municipal") ? "Municipal" : "Estadual";

                await lawCrawlerService.ingestFromUrl(targetUrl.trim(), {
                    esfera: esfera,
                    municipio: missingDocName.split(" de ")[1] || "Detectado",
                    ingestao_automatica: true as any
                });

                console.log(`✅ [SELF-LEARNING] Base RAG atualizada com: ${missingDocName}`);
                return true;
            }
        } catch (error) {
            console.warn("❌ [SELF-LEARNING] Falha na auto-aprendizagem:", error);
        }
        return false;
    }
}

export const selfLearningService = new SelfLearningService();
