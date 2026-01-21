# Guia de Deploy - Azure Static Web Apps

Como seu projeto é uma aplicação web moderna com React e Vite (Frontend), a melhor e mais econômica opção no Azure é o **Azure Static Web Apps**.

Ele conecta diretamente com seu GitHub e faz o deploy automático a cada push.

## Passo 1: Criar o Recurso no Azure
1. Acesse o [Portal do Azure](https://portal.azure.com).
2. Pesquise por **"Static Web Apps"** e clique em **Create** (ou Criar).
3. Preencha os detalhes Básicos:
   - **Subscription**: Sua assinatura.
   - **Resource Group**: Selecione o mesmo do seu banco de dados ou crie um novo (ex: `ContadorRG`).
   - **Name**: Nome do app (ex: `contador-amigo-app`).
   - **Plan Type**: `Free` (Gratuito para uso pessoal/hobby) ou `Standard`.
   - **Deployment details**: Selecione **GitHub**.

## Passo 2: Conectar ao GitHub
1. Clique em **Sign in with GitHub** e autorize o Azure.
2. Preencha os campos que aparecerão:
   - **Organization**: Seu usuário (`paulinho121`).
   - **Repository**: `contador`.
   - **Branch**: `main`.

## Passo 3: Configuração de Build (Importante!)
O Azure vai tentar detectar, mas caso precise configurar manualmente:
- **Build Presets**: Selecione `React`.
- **App location**: `/` (Raiz do projeto).
- **Api location**: (Deixe em branco, pois não temos Azure Functions integradas no repo).
- **Output location**: `dist` (Pasta padrão de build do Vite).

Clique em **Review + create** e depois em **Create**.

## Passo 4: Configurar Variáveis de Ambiente (CRÍTICO)
Seu app precisa das chaves de API para funcionar (Gemini e Cosmos DB). O `.env.local` **não** é enviado para o GitHub por segurança, então você precisa adicionar manualmente no Azure.

1. Quando o deploy terminar, clique em **Go to resource**.
2. No menu lateral, procure por **Settings** -> **Environment variables** (ou Configuration).
3. Adicione as seguintes variáveis (com os mesmos valores do seu `.env.local`):

| Name | Value |
|------|-------|
| `VITE_GEMINI_API_KEY` | *(Sua chave do Gemini)* |
| `VITE_AZURE_COSMOS_CONNECTION_STRING` | *(Sua connection string do Cosmos)* |

4. Clique em **Save** (ou Apply).

## Passo 5: Testar
O Azure vai te dar uma URL (ex: `calm-sand-01234.zw01.azurestaticapps.net`). Acesse e teste o Dr. Contador!

---
**Nota:** O Azure criará automaticamente um arquivo de workflow na pasta `.github/workflows` do seu repositório. Sempre que você der um `git push` na main, ele atualizará o site sozinho.
