
import { CosmosClient } from "@azure/cosmos";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

// Configurações
const CONNECTION_STRING = process.env.VITE_AZURE_COSMOS_CONNECTION_STRING;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!CONNECTION_STRING || !GEMINI_API_KEY) {
    console.error("❌ Erro: Configure VITE_AZURE_COSMOS_CONNECTION_STRING e VITE_GEMINI_API_KEY.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const client = new CosmosClient(CONNECTION_STRING);
const databaseId = "ContadorAmigoDB";
const containerId = "KnowledgeBase";

async function processAndIngest(filePath) {
    console.log(`📖 Lendo arquivo: ${filePath}`);
    const text = fs.readFileSync(filePath, 'utf-8');

    const prompt = `
      Você é um especialista em direito tributário brasileiro. 
      Organize o texto legal abaixo para RAG. 
      Retorne APENAS um array JSON de objetos conforme estrutura:
      {
        "esfera": "", "municipio": "", "tipo_norma": "", "numero_norma": "", "ano": "",
        "tributo": "", "tema": "", "impacto_contabil": "", "artigo": "", "texto": ""
      }
      TEXTO:
      ${text}
    `;

    console.log("🤖 Processando com Gemini...");
    const result = await model.generateContent(prompt);
    const chunks = JSON.parse(result.response.text());

    console.log(`✅ ${chunks.length} fragmentos gerados. Salvando no Azure...`);

    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    const { container } = await database.containers.createIfNotExists({ id: containerId });

    for (const chunk of chunks) {
        const item = {
            id: `law_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            partitionKey: "global",
            title: `${chunk.tipo_norma} ${chunk.numero_norma}/${chunk.ano} - ${chunk.artigo}`,
            content: chunk.texto,
            metadata: chunk,
            timestamp: new Date().toISOString()
        };
        await container.items.create(item);
        console.log(`✔ Salvo: ${item.title}`);
    }

    console.log("🏁 Processo concluído com sucesso!");
}

// Uso: node scripts/ingestMunicipal.js caminho/para/arquivo.txt
const fileArg = process.argv[2];
if (fileArg) {
    processAndIngest(path.resolve(fileArg));
} else {
    console.log("Uso: node scripts/ingestMunicipal.js <arquivo.txt>");
}
