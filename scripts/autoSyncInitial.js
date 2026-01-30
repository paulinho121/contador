
import { CosmosClient } from "@azure/cosmos";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const CONNECTION_STRING = process.env.VITE_AZURE_COSMOS_CONNECTION_STRING || process.env.AZURE_COSMOS_CONNECTION_STRING;
if (!CONNECTION_STRING) {
    console.error("Erro: VITE_AZURE_COSMOS_CONNECTION_STRING não definida no .env.local.");
    process.exit(1);
}

const client = new CosmosClient(CONNECTION_STRING);
const container = client.database("ContadorAmigoDB").container("KnowledgeBase");

const automatedFeed = [
    {
        title: "Barueri: ISS - Alíquotas e Benefícios (LC 118/2002)",
        content: `### ISS Barueri - Regras Gerais
1. **Alíquota Padrão**: 5%.
2. **Alíquotas Incentivadas (2%)**: Aplicáveis a serviços de informática (TI), biotecnologia, centros de atendimento (call centers) e educação superior.
3. **Base de Cálculo**: É o preço do serviço. Não se inclui o valor dos materiais fornecidos pelo prestador em serviços de construção civil (Art. 42).
4. **Isenções**: Estão isentos do imposto os serviços prestados por profissionais autônomos que utilizem a própria residência sem auxílio de empregados.`,
        metadata: {
            esfera: "municipal",
            municipio: "Barueri",
            tributo: "ISS",
            artigo: "Art. 41 e 42",
            status: "vigente",
            version: "2024.1"
        }
    },
    {
        title: "São Paulo: Nota Fiscal Paulistana e Retenção ISS",
        content: `### ISS São Paulo (Lei 13.701/2003)
1. **CPOM**: Prestadores de outros municípios devem se cadastrar no CPOM (Cadastro de Prestadores de Outros Municípios), caso contrário, o tomador em SP deve reter o ISS na fonte.
2. **Alíquotas**: Variam de 2% a 5% dependendo do código de serviço.
3. **Simples Nacional**: Alíquota conforme anexo da LC 123/2006.
4. **Sociedades de Profissionais (SUP)**: Podem optar pelo recolhimento em valor fixo por profissional (Habilitados: Médicos, Advogados, Contadores).`,
        metadata: {
            esfera: "municipal",
            municipio: "São Paulo",
            tributo: "ISS",
            status: "vigente"
        }
    },
    {
        title: "Reforma Tributária (LC 214/2025) - Impacto Municipal",
        content: `### A Morte do ISS e Nascimento do IBS
1. **Extinção**: O ISS será extinto progressivamente até 2032.
2. **Transição**: Início em 2026 com alíquota de 0,1% (teste).
3. **IBS (Imposto sobre Bens e Serviços)**: Gestão compartilhada entre Estados e Municípios através do Comitê Gestor.
4. **Princípio do Destino**: O imposto passará a pertencer ao município onde o serviço é consumido, não mais onde a empresa está sediada.`,
        metadata: {
            esfera: "federal",
            tributo: "IBS/ISS",
            tema: "reforma tributária",
            impacto_contabil: "planejamento fiscal"
        }
    }
];

async function run() {
    process.stdout.write("🚀 Iniciando Ingestão Automática no Cloud RAG...\n");
    for (const item of automatedFeed) {
        const doc = {
            id: `auto_${Math.random().toString(36).substring(7)}`,
            partitionKey: "global",
            title: item.title,
            content: item.content,
            metadata: { ...item.metadata, source: "Dr. Contador Auto-Sync" },
            timestamp: new Date().toISOString()
        };
        try {
            await container.items.create(doc);
            process.stdout.write(`✅ Injetado: ${item.title}\n`);
        } catch (e) {
            process.stdout.write(`❌ Erro ao injetar ${item.title}: ${e.message}\n`);
        }
    }
    process.stdout.write("🏁 Sincronização automática concluída!\n");
}

run();
