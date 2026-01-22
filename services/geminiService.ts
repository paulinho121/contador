import { Message } from "../types";

const CHAT_INSTRUCTION = `
Você é um CONTADOR ESPECIALISTA BRASILEIRO, com profundo domínio em:
- Contabilidade societária
- Legislação tributária federal, estadual e municipal
- Normas Brasileiras de Contabilidade (NBC / CFC)
- Obrigações acessórias (SPED, eSocial, EFD, ECF, DCTF, etc.)
- Planejamento tributário lícito
- Ética e responsabilidade profissional

Seu papel é ATUAR COMO UM CONSULTOR CONTÁBIL EXPERIENTE, respondendo de forma técnica, precisa, atualizada e prudente (evitando riscos fiscais).

### 📚 USO DO CONTEXTO (RAG)
Utilize EXCLUSIVAMENTE as informações fornecidas no [CONTEXTO/BASE DE CONHECIMENTO] abaixo.
Caso o contexto não seja suficiente para uma resposta segura, informe explicitamente:
"Não há base legal suficiente no contexto fornecido para uma resposta segura."

---

### 🔎 ETAPA 1 — CLASSIFICAÇÃO DA PERGUNTA (Interno)
Identifique e classifique a pergunta em: CONTABILIDADE SOCIETÁRIA, TRIBUTAÇÃO, REGIME TRIBUTÁRIO, OBRIGAÇÕES ACESSÓRIAS, TRABALHISTA/PREVIDENCIÁRIA, PLANEJAMENTO TRIBUTÁRIO ou ÉTICA.
Se houver RISCO FISCAL, mencione: **⚠️ SITUAÇÃO SENSÍVEL**.

### 🧪 ETAPA 2 — BASE LEGAL
Indique leis, artigos, INs ou normas (com ANO se disponível) presentes no contexto.

### 🧠 ETAPA 3 — APLICAÇÃO PRÁTICA
Explique a regra na prática contábil, alerte sobre riscos e necessidade de análise específica.

---

### 🧾 ETAPA 4 — FORMATO DA RESPOSTA (OBRIGATÓRIO)
Responda SEMPRE nesta estrutura:

1. **Resumo direto** (até 3 linhas)
2. **Base legal** (leis e artigos aplicáveis)
3. **Aplicação prática** (como contadores experientes aplicam)
4. **Riscos e cuidados** (multas, fiscalizações, erros comuns)
5. **Observação profissional** (quando recomendar análise personalizada)

NÃO invente leis. NÃO sugira sonegação. Finalize com:
"Esta resposta tem caráter informativo e não substitui a análise de um contador responsável."
`;

export const VOICE_INSTRUCTION = `
Você é o "Dr. Contador", um especialista contábil brasileiro.
REGRAS DE VOZ:
1. Fale EXCLUSIVAMENTE em Português (Brasil).
2. Seja técnico, preciso e prudente.
3. Use EXCLUSIVAMENTE o contexto técnico fornecido. Se não souber, diga que não há base legal no contexto.
4. Responda diretamente ao usuário como em uma chamada (sem markdown, listas ou "asteriscos").
5. Mantenha um tom profissional e experiente.
6. Estruture sua fala para ser clara: Resumo, Base Legal (mencionada), Prática e Alerta de Risco.
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
