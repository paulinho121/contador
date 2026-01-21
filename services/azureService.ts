
import { CosmosClient } from "@azure/cosmos";

// ATENÇÃO: Em produção, nunca exponha a Connection String no frontend.
// O ideal é usar uma Azure Function como intermediária.
// Para este protótipo, usaremos a variável de ambiente VITE_.

const CONNECTION_STRING = import.meta.env.VITE_AZURE_COSMOS_CONNECTION_STRING;

if (!CONNECTION_STRING) {
    console.warn("⚠️ ALERTA: VITE_AZURE_COSMOS_CONNECTION_STRING não encontrada. A sincronização com Azure ficará desativada.");
}

class AzureService {
    private client: CosmosClient | null = null;
    private databaseId = "ContadorAmigoDB";
    private containerId = "KnowledgeBase";

    constructor() {
        if (CONNECTION_STRING) {
            try {
                this.client = new CosmosClient(CONNECTION_STRING);
            } catch (error) {
                console.error("Erro crítico ao inicializar Azure Cosmos Client. Verifique a Connection String.", error);
                this.client = null;
            }
        }
    }

    isConfigured() {
        return !!this.client;
    }

    async testConnection() {
        if (!this.client) return false;
        try {
            const { database } = await this.client.databases.createIfNotExists({ id: this.databaseId });
            const { container } = await database.containers.createIfNotExists({ id: this.containerId });
            return true;
        } catch (error) {
            console.error("Erro ao conectar Azure Cosmos DB:", error);
            return false;
        }
    }

    async addKnowledge(item: any) {
        if (!this.client) throw new Error("Azure não configurado");

        try {
            console.log("Iniciando sincronização com Azure Cosmos DB...");

            // Garantir que Banco e Container existam antes de salvar
            const { database } = await this.client.databases.createIfNotExists({ id: this.databaseId });
            const { container } = await database.containers.createIfNotExists({ id: this.containerId });

            const itemToSave = {
                id: crypto.randomUUID(),
                partitionKey: "global", // Adicionando uma partition key padrão para escalabilidade
                timestamp: new Date().toISOString(),
                ...item
            };

            console.log("Salvando item no container...");
            const { resource } = await container.items.create(itemToSave);
            console.log("Sincronização concluída com sucesso!");
            return resource;
        } catch (error) {
            console.error("Falha na sincronização Azure:", error);
            throw error;
        }
    }

    async getKnowledge() {
        if (!this.client) return [];
        try {
            const { database } = await this.client.databases.createIfNotExists({ id: this.databaseId });
            const { container } = await database.containers.createIfNotExists({ id: this.containerId });

            console.log("Buscando conhecimentos na nuvem...");
            const { resources } = await container.items
                .query("SELECT * from c")
                .fetchAll();

            // Ordenação local para evitar erros de índice não configurado
            const sortedResources = resources.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            console.log(`Encontrados ${sortedResources.length} itens de conhecimento.`);
            return sortedResources;
        } catch (error) {
            console.error("Erro ao buscar conhecimentos:", error);
            return [];
        }
    }
}

export const azureService = new AzureService();
