
/**
 * EXTERNAL API SERVICE
 * Centraliza integrações com APIs públicas brasileiras e serviços de busca.
 */

export interface CNPJData {
    cnpj: string;
    razao_social: string;
    nome_fantasia: string;
    logradouro: string;
    numero: string;
    bairro: string;
    cep: string;
    municipio: string;
    uf: string;
    cnae_fiscal_descricao: string;
    situacao_cadastral: string;
}

export class ExternalApiService {
    private tavilyApiKey: string;

    constructor() {
        this.tavilyApiKey = import.meta.env.VITE_TAVILY_API_KEY || "";
    }

    /**
     * Consulta CNPJ via BrasilAPI (Gratuito, sem auth)
     */
    async queryCNPJ(cnpj: string): Promise<CNPJData | null> {
        try {
            const cleanCnpj = cnpj.replace(/\D/g, '');
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error("Erro ao consultar BrasilAPI (CNPJ):", error);
            return null;
        }
    }

    /**
     * Consulta CEP via BrasilAPI
     */
    async queryCEP(cep: string) {
        try {
            const cleanCep = cep.replace(/\D/g, '');
            const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            console.error("Erro ao consultar BrasilAPI (CEP):", error);
            return null;
        }
    }

    /**
     * Busca na Web via Tavily (Otimizado para LLMs)
     */
    async searchWeb(query: string): Promise<string> {
        if (!this.tavilyApiKey) {
            console.warn("⚠️ Tavily API Key não configurada. Busca web desativada.");
            return "";
        }

        try {
            const response = await fetch("https://api.tavily.com/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    api_key: this.tavilyApiKey,
                    query: query,
                    search_depth: "advanced",
                    include_answer: true,
                    include_raw_content: false,
                    max_results: 5
                })
            });

            if (!response.ok) return "";
            const data = await response.json();

            // Retorna um resumo dos resultados formatado para o RAG
            return data.results.map((r: any) =>
                `FONTE: ${r.title}\nURL: ${r.url}\nCONTEÚDO: ${r.content}\n`
            ).join("\n---\n");
        } catch (error) {
            console.error("Erro na busca Tavily:", error);
            return "";
        }
    }

    /**
     * Consulta feriados nacionais via BrasilAPI
     */
    async getHolidays(year: number = new Date().getFullYear()) {
        try {
            const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error("Erro ao buscar feriados:", error);
            return [];
        }
    }
}

export const externalApiService = new ExternalApiService();
