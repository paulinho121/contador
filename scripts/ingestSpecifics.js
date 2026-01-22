import { CosmosClient } from "@azure/cosmos";

// Use a variável de ambiente para segurança
const CONNECTION_STRING = process.env.AZURE_COSMOS_CONNECTION_STRING;

if (!CONNECTION_STRING) {
    console.error("❌ Erro: Variável de ambiente AZURE_COSMOS_CONNECTION_STRING não definida.");
    process.exit(1);
}
const client = new CosmosClient(CONNECTION_STRING);
const databaseId = "ContadorAmigoDB";
const containerId = "KnowledgeBase";

const specificData = [
    // 1. CLT (Trabalhista)
    {
        titulo: "CLT Art. 457 — Remuneração e Salário",
        resumo_pratico: "Compreendem-se na remuneração do empregado, para todos os efeitos legais, além do salário devido e pago diretamente pelo empregador, as gratificações legais e as comissões pagas pelo empregador. Importante para o cálculo de encargos previdenciários e FGTS.",
        area_contabil: ["Trabalhista / Previdenciária"],
        tributos: ["INSS", "FGTS", "IRRF"],
        regimes_tributarios: ["Todos"],
        base_legal: [{ fonte: "CLT (Decreto-Lei nº 5.452/1943)", artigo: "457", ano: "1943", status: "vigente" }],
        prioridade: "critica",
        palavras_chave: ["Salário", "Remuneração", "Encargos"],
        sensibilidade: "normal"
    },
    {
        titulo: "CLT Art. 129 — Direito a Férias",
        resumo_pratico: "Todo empregado terá direito anualmente ao gozo de um período de férias, sem prejuízo da remuneração, após cada período de 12 meses de vigência do contrato de trabalho (período aquisitivo).",
        area_contabil: ["Trabalhista / Previdenciária"],
        tributos: ["FGTS", "INSS", "IRRF"],
        regimes_tributarios: ["Todos"],
        base_legal: [{ fonte: "CLT (Decreto-Lei nº 5.452/1943)", artigo: "129", ano: "1943", status: "vigente" }],
        prioridade: "alta",
        palavras_chave: ["Férias", "Período Aquisitivo", "Direito Trabalhista"],
        sensibilidade: "normal"
    },
    {
        titulo: "Lei 8.036/90 Art. 15 — Depósito de FGTS",
        resumo_pratico: "Os empregadores são obrigados a depositar, até o dia 20 de cada mês, em conta bancária vinculada, a importância correspondente a 8% da remuneração paga ou devida, no mês anterior, a cada trabalhador.",
        area_contabil: ["Trabalhista / Previdenciária"],
        tributos: ["FGTS"],
        regimes_tributarios: ["Todos"],
        base_legal: [{ fonte: "Lei nº 8.036/1990", artigo: "15", ano: "1990", status: "vigente" }],
        prioridade: "critica",
        palavras_chave: ["FGTS", "8%", "Depósito Mensal"],
        sensibilidade: "normal"
    },
    // 2. RICMS-SP (Estadual)
    {
        titulo: "RICMS/SP Art. 2º — Fato Gerador do ICMS",
        resumo_pratico: "Ocorre o fato gerador do imposto na saída de mercadoria, a qualquer título, de estabelecimento de contribuinte, ainda que para outro estabelecimento do mesmo titular; no fornecimento de alimentação e bebidas; e na prestação de serviços de transporte e comunicação.",
        area_contabil: ["Tributação Estadual"],
        tributos: ["ICMS"],
        regimes_tributarios: ["Lucro Real", "Lucro Presumido", "Simples Nacional"],
        base_legal: [{ fonte: "RICMS/SP (Decreto nº 45.490/2000)", artigo: "2", ano: "2000", status: "vigente" }],
        prioridade: "critica",
        palavras_chave: ["ICMS", "Fato Gerador", "Circulação de Mercadorias"],
        sensibilidade: "normal"
    },
    {
        titulo: "RICMS/SP Art. 52 — Alíquotas Internas (São Paulo)",
        resumo_pratico: "As alíquotas do imposto, nas operações internas, são: 18% (regra geral); 12% (transporte, aves, gado, etc.); 7% (insumos agrícolas, ovos, etc.) e 25% (supérfluos, bebidas alcoólicas).",
        area_contabil: ["Tributação Estadual"],
        tributos: ["ICMS"],
        regimes_tributarios: ["Lucro Real", "Lucro Presumido", "Simples Nacional"],
        base_legal: [{ fonte: "RICMS/SP (Decreto nº 45.490/2000)", artigo: "52", ano: "2000", status: "vigente" }],
        prioridade: "critica",
        palavras_chave: ["Alíquotas SP", "ICMS 18%", "ICMS 12%"],
        sensibilidade: "normal"
    },
    {
        titulo: "RICMS/SP Art. 313-Y — Substituição Tributária (Materiais de Construção)",
        resumo_pratico: "Na saída de materiais de construção e congêneres listados, com destino a estabelecimento localizado em território paulista, fica atribuída a responsabilidade pelo pagamento do imposto incidente nas operações subsequentes ao estabelecimento fabricante ou importador.",
        area_contabil: ["Tributação Estadual"],
        tributos: ["ICMS-ST"],
        regimes_tributarios: ["Lucro Real", "Lucro Presumido", "Simples Nacional"],
        base_legal: [{ fonte: "RICMS/SP (Decreto nº 45.490/2000)", artigo: "313-Y", ano: "2000", status: "vigente" }],
        prioridade: "alta",
        palavras_chave: ["ICMS-ST", "Substituição Tributária", "Materiais de Construção"],
        sensibilidade: "sensivel"
    }
];

async function ingest() {
    console.log("🚀 Iniciando ingestão de normas específicas (CLT e RICMS/SP)...");
    try {
        const { database } = await client.databases.createIfNotExists({ id: databaseId });
        const { container } = await database.containers.createIfNotExists({ id: containerId });

        for (const data of specificData) {
            const itemToSave = {
                id: `specific_${Math.random().toString(36).substring(7)}`,
                partitionKey: "global",
                timestamp: new Date().toISOString(),
                title: data.titulo,
                content: data.resumo_pratico,
                metadata: data,
                source: "Ingestão Prioritária - Trabalhista e Estadual (SP)"
            };

            await container.items.create(itemToSave);
            console.log(`✅ Salvo: ${data.titulo}`);
        }
        console.log("🏁 Ingestão concluída com sucesso.");
    } catch (error) {
        console.error("❌ Erro durante a ingestão:", error);
    }
}

ingest();
