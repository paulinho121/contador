
import { CosmosClient } from "@azure/cosmos";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const CONNECTION_STRING = process.env.VITE_AZURE_COSMOS_CONNECTION_STRING;
console.log("DEBUG: Connection string length:", CONNECTION_STRING?.length);

if (!CONNECTION_STRING) {
    console.error("Erro: VITE_AZURE_COSMOS_CONNECTION_STRING não definida.");
    process.exit(1);
}

const client = new CosmosClient(CONNECTION_STRING);
if (!client) {
    console.error("Erro: Falha ao instanciar CosmosClient.");
    process.exit(1);
}

const database = client.database("ContadorAmigoDB");
const container = database.container("KnowledgeBase");

const deepData = [
    {
        title: "Campinas: ISSQN - Alíquotas e Código Tributário (Lei 12.392/2005)",
        content: `### ISS Campinas (Lei 12.392/2005)
1. **Alíquota Geral**: 5% sobre o valor da nota fiscal.
2. **Alíquotas Específicas**: Alguns serviços possuem alíquota reduzida de 2% (verificar CNAE no portal NFSe Campinas).
3. **Profissionais Autônomos (2024)**: Lançamento em 25 de abril. Desconto de 3% para cota única ou parcelamento em 9x.
4. **Consulta CNAE**: A prefeitura disponibiliza ferramenta de correlação CNAE vs Alíquota para evitar erros de emissão.`,
        metadata: { esfera: "municipal", municipio: "Campinas", estado: "SP", tributo: "ISS", lei: "12.392/2005" }
    },
    {
        title: "Curitiba: ISS Fixo e Alíquotas Variáveis (LC 40/2001)",
        content: `### ISS Curitiba (Lei Complementar 40/2001)
1. **Alíquotas Variáveis**: 2% a 5% dependendo do serviço.
2. **ISS Fixo 2024/2025 (Autônomos)**:
   - **Nível Superior**: R$ 1.580,82/ano (isento no primeiro ano; desconto nos 2 anos seguintes).
   - **Outros Níveis**: R$ 790,39/ano.
3. **Sociedades de Profissionais (SUP)**: Recolhimento por sócio habilitado (R$ 1.580,82/ano cada).
4. **Vencimento**: Todo dia 20. Processo 100% digital via 'Curitiba App' ou portal da prefeitura.`,
        metadata: { esfera: "municipal", municipio: "Curitiba", estado: "PR", tributo: "ISS", lei: "LC 40/2001" }
    },
    {
        title: "Belo Horizonte: ISSQN e Regulamentação (Lei 8.725/2003)",
        content: `### ISS Belo Horizonte (Lei 8.725/2003)
1. **Portal BHISS Digital**: Centraliza toda a gestão tributária de ISSQN.
2. **Alíquotas**: Geralmente entre 3% e 5%. Alíquota de 2% para transporte público urbano.
3. **Cooperativas**: Podem usufruir de alíquota diferenciada de 3% mediante cumprimento de requisitos municipais.
4. **Retenção**: Obrigatória para tomadores situados em BH quando o serviço é prestado por empresa de fora sem cadastro específico, similar ao CPOM de SP.`,
        metadata: { esfera: "municipal", municipio: "Belo Horizonte", estado: "MG", tributo: "ISS", lei: "8.725/2003" }
    },
    {
        title: "Porto Alegre: Código Tributário e ISS (LC 07/1973)",
        content: `### ISS Porto Alegre (Lei Complementar 07/1973)
1. **Código Tributário**: Um dos mais antigos do país, com atualizações constantes (até 2024).
2. **Alíquotas**: Faixa de 2% a 5%.
3. **Incentivos TI**: Porto Alegre possui forte política de incentivos para empresas de tecnologia no 4º Distrito, com alíquotas reduzidas.
4. **Local de Incidência**: Segue a LC 116/03, com atenção especial aos serviços de construção e limpeza que tributam no local da prestação.`,
        metadata: { esfera: "municipal", municipio: "Porto Alegre", estado: "RS", tributo: "ISS", lei: "LC 07/1973" }
    }
];

async function run() {
    console.log("🔍 Varredura Profunda em andamento...");
    for (const item of deepData) {
        const doc = {
            id: `scan_${item.municipio.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            partitionKey: "global",
            title: item.title,
            content: item.content,
            metadata: { ...item.metadata, source: "Dr. Contador Deep Scanner" },
            timestamp: new Date().toISOString()
        };
        try {
            await container.items.create(doc);
            console.log(`✅ Conhecimento Consolidado: ${item.municipio}`);
        } catch (e) {
            console.error(`❌ Erro no município ${item.municipio}:`, e.message);
        }
    }
    console.log("🏁 Varredura e Ingestão Automática CONCLUÍDAS!");
}

run().catch(err => console.error("ERRO FATAL:", err));
