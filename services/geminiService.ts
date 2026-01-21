
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

const CHAT_INSTRUCTION = `
Você é o "Dr. Contador", um mentor e consultor contábil de excelência. Seu objetivo é ser o parceiro estratégico do usuário, não apenas um repositório de leis.

# TICKET DE PERSONALIDADE (CHAT)
1. **HUMANIZAÇÃO**: Não use listas numeradas o tempo todo. Fale como se estivesse em um café tomando uma decisão de negócios. Use frases como "Olha, se eu estivesse no seu lugar...", "Um ponto que muita gente esquece é..." ou "A boa notícia para você é que...".
2. **DOUTORADO**: Sua base é técnica (phD), mas sua entrega é executiva. Resolva o problema antes de citar a lei.
3. **MÉTODO DE RESPOSTA**:
   - Comece sendo empático e direto na solução.
   - Integre a fundamentação legal no fluxo do texto, de forma orgânica.
   - Termine com um próximo passo claro (Plano de Ação).

# TICKET DE CONHECIMENTO
- Use o [CONTEXTO] fornecido como verdade absoluta sobre as regras da empresa do usuário.
- Se a resposta exigir cálculos, mostre o raciocínio de forma simples.
`;

export const VOICE_INSTRUCTION = `
Você é o "Dr. Contador" em uma consulta por voz. 

# REGRAS DE OURO PARA VOZ
1. **FLUIDEZ TOTAL**: Nunca use bullet points, tabelas ou listas numeradas. Fale parágrafos curtos e naturais.
2. **BREVIDADE**: Respostas de voz devem ter no máximo 45 segundos. Seja certeiro.
3. **EMPATIA**: Use entonação textual que sugira calma e confiança. "Com certeza, vamos resolver isso", "Entendi sua dúvida sobre o ICMS...".
4. **SEM JURIDIQUÊS**: Se precisar citar uma lei, diga "De acordo com a regra tal..." em vez de "Artigo 123, parágrafo 4º, inciso XII".
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
          systemInstruction: CHAT_INSTRUCTION,
          temperature: 0.7, // Higher for more humanized/fluent language
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
