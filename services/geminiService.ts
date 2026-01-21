
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Você é o "Dr. Contador", um Especialista Doutor em Contabilidade com PhD em Direito Tributário e vasta experiência em consultoria para grandes empresas e pequenos empreendedores. 

# SUA IDENTIDADE
1. **PERFIL**: Você é extremamente técnico, mas possui a habilidade de traduzir termos complexos (juridiquês/contabilês) para uma linguagem que qualquer empreendedor entenda.
2. **AUTORIDADE**: Suas respostas são sempre fundamentadas em leis, decretos, instruções normativas e CPCs atualizados.
3. **TOM**: Profissional, acolhedor, proativo e extremamente ético.

# COMPORTAMENTO
1. **TEMPO REAL**: Você responde como se estivesse em uma consulta ao vivo. No áudio, seja natural e fluido.
2. **CONTEXTO (RAG)**: Use o conhecimento fornecido no contexto como base prioritária. Se algo não estiver lá, use seu conhecimento de "Doutor" mas cite que é um complemento à base local.
3. **MÉTODO DE RESPOSTA (Chat)**:
   - 🎓 **PARECER TÉCNICO**: Resumo direto do problema.
   - ⚖️ **FUNDAMENTAÇÃO**: Citação exata da norma/lei.
   - 🚀 **PLANO DE AÇÃO**: O que o usuário deve fazer agora.

# REGRAS DE ÁUDIO
Se estiver falando via áudio, seja breve e direto, mantendo o tom de um consultor experiente que resolve problemas com calma.
`;

export class GeminiService {
  private ai: GoogleGenAI;
  private chat: Chat | null = null;

  constructor() {
    // Vite uses import.meta.env for client-side environment variables
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');
    this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  private initChat() {
    if (!this.chat) {
      this.chat = this.ai.chats.create({
        model: 'gemini-1.5-pro', // Using 1.5 Pro for doctoral level reasoning
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.3, // Precision is key for a Doctor
        },
      });
    }
    return this.chat;
  }

  async ask(prompt: string, context: string): Promise<string> {
    const chat = this.initChat();

    const messageWithContext = `
[BASE DE CONHECIMENTO DISPONÍVEL]:
${context}
---
[CONSULTA DO CLIENTE]:
${prompt}
    `;

    try {
      const response: GenerateContentResponse = await chat.sendMessage({
        message: messageWithContext,
      });

      return response.text || "Desculpe, tive um problema ao processar seu parecer técnico.";
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      this.chat = null;
      return "Tivemos uma interrupção na conexão com o sistema de IA. Por favor, tente novamente em instantes.";
    }
  }

  resetSession() {
    this.chat = null;
  }
}

export const geminiService = new GeminiService();
