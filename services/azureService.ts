
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
    private usersContainerId = "Users";

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
            await database.containers.createIfNotExists({ id: this.containerId });
            await database.containers.createIfNotExists({ id: this.usersContainerId });
            return true;
        } catch (error) {
            console.error("Erro ao conectar Azure Cosmos DB:", error);
            return false;
        }
    }

    async addKnowledge(item: any) {
        if (!this.client) throw new Error("Azure não configurado");

        try {
            const { database } = await this.client.databases.createIfNotExists({ id: this.databaseId });
            const { container } = await database.containers.createIfNotExists({ id: this.containerId });

            const itemToSave = {
                id: crypto.randomUUID(),
                partitionKey: "global",
                timestamp: new Date().toISOString(),
                ...item
            };

            const { resource } = await container.items.create(itemToSave);
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

            const { resources } = await container.items
                .query("SELECT * from c")
                .fetchAll();

            return resources.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
        } catch (error) {
            console.error("Erro ao buscar conhecimentos:", error);
            return [];
        }
    }

    async registerUser(userData: { name: string, email: string, password?: string }) {
        if (!this.client) throw new Error("Azure não configurado");

        const { database } = await this.client.databases.createIfNotExists({ id: this.databaseId });
        const { container } = await database.containers.createIfNotExists({ id: this.usersContainerId });

        const { resources } = await container.items
            .query({
                query: "SELECT * FROM c WHERE c.email = @email",
                parameters: [{ name: "@email", value: userData.email }]
            })
            .fetchAll();

        if (resources.length > 0) {
            throw new Error("E-mail já cadastrado.");
        }

        const newUser = {
            id: crypto.randomUUID(),
            partitionKey: "user",
            timestamp: new Date().toISOString(),
            ...userData
        };

        const { resource } = await container.items.create(newUser);
        return resource;
    }

    async loginUser(email: string, password?: string) {
        if (!this.client) throw new Error("Azure não configurado");

        const { database } = await this.client.databases.createIfNotExists({ id: this.databaseId });
        const { container } = await database.containers.createIfNotExists({ id: this.usersContainerId });

        const { resources } = await container.items
            .query({
                query: "SELECT * FROM c WHERE c.email = @email",
                parameters: [{ name: "@email", value: email }]
            })
            .fetchAll();

        if (resources.length === 0) {
            throw new Error("E-mail não encontrado.");
        }

        const user = resources[0];

        if (password && user.password !== password) {
            throw new Error("Senha incorreta.");
        }

        return user;
    }

    async getAllUsers() {
        if (!this.client) return [];
        try {
            const { database } = await this.client.databases.createIfNotExists({ id: this.databaseId });
            const { container } = await database.containers.createIfNotExists({ id: this.usersContainerId });

            const { resources } = await container.items
                .query("SELECT * from c")
                .fetchAll();

            return resources;
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
            return [];
        }
    }

    async updateUserActivity(email: string) {
        if (!this.client) return;
        try {
            const { database } = await this.client.databases.createIfNotExists({ id: this.databaseId });
            const { container } = await database.containers.createIfNotExists({ id: this.usersContainerId });

            const { resources } = await container.items
                .query({
                    query: "SELECT * FROM c WHERE c.email = @email",
                    parameters: [{ name: "@email", value: email }]
                })
                .fetchAll();

            if (resources.length > 0) {
                const user = resources[0];
                user.lastActive = new Date().toISOString();
                await container.item(user.id, user.partitionKey).replace(user);
            }
        } catch (error) {
            console.error("Erro ao atualizar atividade:", error);
        }
    }

    async deleteKnowledge(id: string) {
        if (!this.client) return;
        try {
            const { database } = await this.client.databases.createIfNotExists({ id: this.databaseId });
            const { container } = await database.containers.createIfNotExists({ id: this.containerId });
            await container.item(id, "global").delete();
        } catch (error) {
            console.error("Erro ao deletar conhecimento:", error);
            throw error;
        }
    }
}

export const azureService = new AzureService();
