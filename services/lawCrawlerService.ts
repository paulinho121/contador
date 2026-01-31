
import { geminiService } from "./geminiService";
import { azureService } from "./azureService";

/**
 * LAW CRAWLER SERVICE
 * Serviço especializado em converter URLs de leis em fragmentos estruturados para o RAG.
 */
export class LawCrawlerService {

    /**
     * Captura o conteúdo de uma URL (via proxy de leitura) e processa em chunks
     */
    async ingestFromUrl(url: string, context: { esfera: string, estado?: string, municipio?: string }) {
        console.log(`📡 Iniciando captura legislativa: ${url}`);

        try {
            // Usamos o r.jina.ai ou similar para extrair o texto limpo da URL (Markdown/Text)
            const readerUrl = `https://r.jina.ai/${url}`;
            const response = await fetch(readerUrl);
            const rawText = await response.text();

            if (rawText.length < 100) {
                throw new Error("Conteúdo capturado muito curto ou inválido.");
            }

            console.log(`📖 Texto capturado (${rawText.length} caracteres). Iniciando fragmentação via IA...`);

            // Dividimos o texto em partes de ~15k caracteres para não estourar o limite de output do JSON
            const segments = this.splitIntoSegments(rawText, 15000);
            let totalProcessed = 0;

            for (const segment of segments) {
                const prompt = `
                    Você é um Arquiteto de Dados Legislativos Sênior.
                    Analise este segmento de uma lei da esfera ${context.esfera} (${context.municipio || context.estado || 'Geral'}).
                    
                    TAREFA:
                    1. Divida o texto em dispositivos legais (Artigos ou Parágrafos).
                    2. Para cada dispositivo, gere um objeto JSON.
                    3. Mantenha o texto INTEGRAL de cada artigo.
                    
                    FORMATO DE RETORNO (ARRAY JSON):
                    [{
                        "artigo": "Ex: Artigo 1º",
                        "tema": "Título do capítulo ou assunto principal",
                        "texto": "Conteúdo integral do artigo",
                        "impacto": "Resumo em uma frase do impacto contábil/fiscal"
                    }]
                `;

                const result = await geminiService.ask(prompt, `Contexto: ${url}`);
                const cleanedJson = result.replace(/```json|```/g, '').trim();
                const chunks = JSON.parse(cleanedJson);

                for (const chunk of chunks) {
                    await azureService.addKnowledge({
                        title: `${chunk.artigo} - ${context.municipio || context.estado || 'Legislativo'}`,
                        content: chunk.texto,
                        metadata: {
                            ...chunk,
                            ...context,
                            url_origem: url,
                            data_ingestao: new Date().toISOString(),
                            tipo_ingestao: 'Crawler Automático'
                        }
                    });
                }
                totalProcessed += chunks.length;
                console.log(`✅ Processados +${chunks.length} fragmentos deste segmento.`);
            }

            return { success: true, totalChunks: totalProcessed };

        } catch (error) {
            console.error("Erro no LawCrawler:", error);
            throw error;
        }
    }

    private splitIntoSegments(text: string, size: number): string[] {
        const segments = [];
        for (let i = 0; i < text.length; i += size) {
            segments.push(text.substring(i, i + size));
        }
        return segments;
    }
}

export const lawCrawlerService = new LawCrawlerService();
