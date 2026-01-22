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
Você é o "Dr. Contador". 
REGRAS CRÍTICAS:
1. Fale EXCLUSIVAMENTE em Português (Brasil).
2. NUNCA mencione que você é uma IA, um modelo, ou que está seguindo instruções.
3. NUNCA descreva seu comportamento (ex: não diga "Como Dr. Contador, devo falar...").
4. Responda diretamente ao usuário como se fosse uma pessoa real em uma chamada.
5. Seja curto, direto e use o contexto técnico fornecido.
6. Não use Markdown ou formatação de texto, apenas fala natural.
`;

export class GeminiService {
  private apiKey: string;
  private history: any[] = [];

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
  }

  async ask(prompt: string, context: string, onStream?: (text: string) => void): Promise<string> {
    const isStreaming = !!onStream;
    const method = isStreaming ? "streamGenerateContent" : "generateContent";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:${method}?key=${this.apiKey}`;

    // Safety: don't send the entire 1MB context if it's too big for a single chat turn
    // This is the main reason for latency. Truncating to 100k chars for text chat.
    const limitedContext = context.length > 100000 ? context.substring(0, 100000) + "..." : context;
    const messageWithContext = `[BASE DE CONHECIMENTO]:\n${limitedContext}\n\n---\n[CONSULTA DO CLIENTE]:\n${prompt}`;

    const body = {
      contents: [...this.history, { role: "user", parts: [{ text: messageWithContext }] }],
      systemInstruction: { parts: [{ text: CHAT_INSTRUCTION }] },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
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
        throw new Error(errorData.error?.message || "Erro na API Gemini");
      }

      if (isStreaming) {
        const reader = response.body?.getReader();
        if (!reader) throw new Error("Stream not supported");

        let fullText = "";
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Gemini REST streaming sends a series of JSON objects, possibly inside a [ ] array
          // and often separated by commas. This logic extracts each { ... } block.
          let braceCount = 0;
          let startIdx = -1;

          for (let i = 0; i < buffer.length; i++) {
            if (buffer[i] === '{') {
              if (braceCount === 0) startIdx = i;
              braceCount++;
            } else if (buffer[i] === '}') {
              braceCount--;
              if (braceCount === 0 && startIdx !== -1) {
                const jsonStr = buffer.substring(startIdx, i + 1);
                try {
                  const json = JSON.parse(jsonStr);
                  const delta = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
                  fullText += delta;
                  if (onStream) onStream(fullText);
                } catch (e) {
                  console.warn("Failed to parse stream chunk:", e);
                }
                // Keep the rest of the buffer
                buffer = buffer.substring(i + 1);
                i = -1; // Reset loop for new buffer
              }
            }
          }
        }

        this.updateHistory(prompt, fullText);
        return fullText;
      }
      else {
        const data = await response.json();
        const assistantText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        this.updateHistory(prompt, assistantText);
        return assistantText;
      }
    } catch (error: any) {
      console.error("Gemini Error:", error);
      return `Erro: ${error.message}`;
    }
  }

  private updateHistory(userText: string, assistantText: string) {
    this.history.push({ role: "user", parts: [{ text: userText }] });
    this.history.push({ role: "model", parts: [{ text: assistantText }] });
    if (this.history.length > 20) this.history = this.history.slice(-20);
  }

  resetSession() {
    this.history = [];
  }
}

export const geminiService = new GeminiService();
