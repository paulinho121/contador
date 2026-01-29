const { CosmosClient } = require("@azure/cosmos");

const CONNECTION_STRING = process.env.VITE_AZURE_COSMOS_CONNECTION_STRING;
const databaseId = "ContadorAmigoDB";
const containerId = "KnowledgeBase";

async function injectLaw() {
    const client = new CosmosClient(CONNECTION_STRING);
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    const { container } = await database.containers.createIfNotExists({ id: containerId });

    const lawItem = {
        id: "lei-214-2025-reforma",
        partitionKey: "global",
        timestamp: new Date().toISOString(),
        title: "Lei Complementar 214/2025 - Reforma Tributária",
        content: `Institui o Imposto sobre Bens e Serviços (IBS), a Contribuição Social sobre Bens e Serviços (CBS) e o Imposto Seletivo (IS). 
        
### Principais Mudanças:
1. **Unificação**: Substitui PIS, COFINS, IPI (federais), ICMS (estadual) e ISS (municipal).
2. **IBS e CBS**: O ISS municipal será gradualmente substituído pelo IBS (Imposto sobre Bens e Serviços).
3. **Transição**: Período de 2026 a 2032. A partir de setembro/2025, os códigos de serviço de Barueri e outras cidades devem se adequar ao padrão nacional.
4. **Local de Tributação**: A cobrança passa a ser no 'Destino' (onde o serviço é consumido), e não mais na 'Origem'.
5. **Impacto em Barueri**: Fim gradual da guerra fiscal baseada em alíquotas reduzidas de ISS.`
    };

    try {
        await container.items.upsert(lawItem);
        console.log("✅ Lei 214/2025 injetada com sucesso no RAG!");
    } catch (error) {
        console.error("❌ Erro ao injetar lei:", error);
    }
}

injectLaw();
