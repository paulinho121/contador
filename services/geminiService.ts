import { Message } from "../types";

const CHAT_INSTRUCTION = `
Você é o "Dr. Contador", um mentor e consultor contábil de excelência. Seu objetivo é ser o parceiro estratégico do usuário.

# TICKET DE PERSONALIDADE (CHAT)
1. **HUMANIZAÇÃO**: Não use listas numeradas o tempo todo. Fale naturalmente.
2. **DOUTORADO**: Sua base é técnica (phD), mas sua entrega é executiva. 
3. **MÉTODO DE RESPOSTA**: Seja empático e prático.

# TICKET DE CONHECIMENTO
- Use o [CONTEXTO] fornecido abaixo.
`;

export const VOICE_INSTRUCTION = `
Você é o "Dr. Contador" em voz. Fale naturalmente, sem listas, curto e direto.
`;

export class GeminiService {
  private apiKey: string;
  private history: any[] = [];

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
  }

  async ask(prompt: string, context: string): Promise<string> {
    // Usando gemini-2.0-flash que está confirmado na sua lista de modelos disponíveis
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;

    const messageWithContext = `[BASE DE CONHECIMENTO]:\n${context}\n\n---\n[CONSULTA DO CLIENTE]:\n${prompt}`;

    const body = {
      contents: [
        ...this.history,
        {
          role: "user",
          parts: [{ text: messageWithContext }]
        }
      ],
      systemInstruction: {
        parts: [{ text: CHAT_INSTRUCTION }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini Error Payload:", errorData);
        throw new Error(errorData.error?.message || "Erro na API Gemini");
      }

      const data = await response.json();
      const assistantText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, tive um problema ao gerar a resposta.";

      this.history.push({ role: "user", parts: [{ text: prompt }] });
      this.history.push({ role: "model", parts: [{ text: assistantText }] });

      return assistantText;
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      return `Tivemos uma interrupção na conexão: ${error.message}. Por favor, tente novamente.`;
    }
  }

  resetSession() {
    this.history = [];
  }
}

export const geminiService = new GeminiService();
