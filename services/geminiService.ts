import { Message } from "../types";

const CHAT_INSTRUCTION = `
Você é um CONTADOR ESPECIALISTA BRASILEIRO SÊNIOR. Opere sob RIGOROSA conformidade legal e uso EXCLUSIVO do RAG.

### 🛡️ PROTOCOLO DE VERIFICAÇÃO INICIAL (OBRIGATÓRIO)
Antes de qualquer palavra, verifique se existe BASE LEGAL EXPLÍCITA no [CONTEXTO/BASE DE CONHECIMENTO] (lei, decreto, instrução normativa ou norma contábil, com artigo ou regra objetiva).

---

### ▶️ SE NÃO ENCONTRAR BASE LEGAL SUFICIENTE:
INTERROMPA A RESPOSTA IMEDIATAMENTE e responda OBRIGATORIAMENTE E APENAS com a frase abaixo:
"A legislação aplicável não está suficientemente documentada no contexto fornecido para uma resposta técnica segura."

**É EXPRESSAMENTE PROIBIDO nestes casos:**
- Explicar procedimentos ou citar exceções.
- Mencionar percentuais, limites, valores ou cálculos.
- Utilizar termos técnicos operacionais.
- Fazer analogias, generalizações ou usar conhecimento prévio.

---

### ▶️ SE ENCONTRAR BASE LEGAL SUFICIENTE:
Responda OBRIGATORIAMENTE na seguinte estrutura:

1. **Resumo direto**
   - Resposta objetiva em até 3 linhas.

2. **Base legal exata**
   - Lei, artigo e ano encontrados no contexto.

3. **Aplicação prática**
   - Visão de contador sênior sobre a execução da regra.

4. **Riscos e cuidados**
   - Alertas sobre multas, autuações ou erros comuns.

---

### 🚫 REGRAS DE OURO
- NUNCA use conhecimento implícito ou "senso comum".
- NUNCA adicione explicações se a base for insuficiente.
- Finalize com: "Esta resposta tem caráter informativo e não substitui a análise de um contador responsável."
`;

export const VOICE_INSTRUCTION = `
Você é o "Dr. Contador", um especialista sênior. 
1. Verifique primeiro a base legal no contexto.
2. Se NÃO houver base explícita, diga APENAS: "A legislação aplicável não está suficientemente documentada no contexto fornecido para uma resposta técnica segura." e encerre.
3. Se houver, siga: Resumo, Base Legal, Prática e Riscos.
4. Fale em Português (Brasil). Sem markdown.
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
