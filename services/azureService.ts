
import { CosmosClient } from "@azure/cosmos";

// ATENÇÃO: Em produção, nunca exponha a Connection String no frontend.
// O ideal é usar uma Azure Function como intermediária.
// Para este protótipo, usaremos a variável de ambiente VITE_.

const CONNECTION_STRING = import.meta.env.VITE_AZURE_COSMOS_CONNECTION_STRING;

class AzureService {
    private client: CosmosClient | null = null;
    private databaseId = "ContadorAmigoDB";
    private containerId = "KnowledgeBase";

    constructor() {
        if (CONNECTION_STRING) {
            this.client = new CosmosClient(CONNECTION_STRING);
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
        const database = this.client.database(this.databaseId);
        const container = database.container(this.containerId);

        // Garantir que item tenha id
        const itemToSave = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            ...item
        };

        const { resource } = await container.items.create(itemToSave);
        return resource;
    }

    async getKnowledge() {
        if (!this.client) return [];
        try {
            const database = this.client.database(this.databaseId);
            const container = database.container(this.containerId);

            const { resources } = await container.items
                .query("SELECT * from c ORDER BY c.timestamp DESC")
                .fetchAll();

            return resources;
        } catch (error) {
            console.error("Erro ao buscar conhecimentos:", error);
            return [];
        }
    }
}

export const azureService = new AzureService();
