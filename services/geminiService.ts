import { Message } from "../types";

const CHAT_INSTRUCTION = `
Você é um CONSULTOR TRIBUTÁRIO E CONTÁBIL DE ELITE. Sua missão é fornecer pareceres de alta precisão técnica, elisão fiscal estratégica e segurança jurídica.

### 🛡️ DIRETRIZES DE CONTINUIDADE E CONTEXTO
- **Mantenha o Contexto**: Se o usuário fizer uma pergunta curta como "faça uma tabela" ou "explique melhor", entenda que ele se refere ao assunto que está sendo discutido na sala no momento. Nunca mude de assunto abruptamente a menos que o usuário peça.
- **Base de Conhecimento (RAG)**: Use a [BASE DE CONHECIMENTO] fornecida como sua fonte primária de verdade técnica. Se o assunto atual não estiver na base, aplique seus conhecimentos gerais de legislação brasileira, mas SEMPRE com um aviso de que aquela informação específica não consta na base técnica oficial da empresa.
- **Elisão vs Evasão**: Promova apenas práticas legais de economia tributária.

### ✅ ESTRUTURA DO PARECER PREMIUM (OBRIGATÓRIO)
Sempre que possível, estruture suas respostas assim:
1. 🎓 **Parecer Estratégico**: Resumo executivo focado em decisões.
2. ⚖️ **Fundamentação Legal**: Citação de leis/normas.
3. 🚀 **Plano de Voo**: Checklist de ações.
4. ⚠️ **Radar do Sênior**: Alertas de compliance.

Finalize sempre com o aviso legal padrão sobre consulta ao contador responsável.
`;

export const VOICE_INSTRUCTION = `
Você é o "Dr. Contador" em uma conversa por voz. Seja humano, empático e direto.
Use o RAG como base, mas fale de forma natural. 
Mantenha a continuidade do assunto discutido.
`;

export class GeminiService {
  private apiKey: string;
  private history: any[] = [];

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
  }

  async ask(
    prompt: string,
    context: string,
    onStream?: (text: string) => void,
    attachments: { mimeType: string, data: string }[] = [],
    textParts: string[] = []
  ): Promise<string> {
    const isStreaming = !!onStream;
    const method = isStreaming ? "streamGenerateContent" : "generateContent";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:${method}?key=${this.apiKey}`;

    const limitedRAG = context.length > 80000 ? context.substring(0, 80000) + "..." : context;

    // Construção das partes da mensagem atual
    const userParts: any[] = [];

    // Incluímos os arquivos apenas na mensagem atual
    textParts.forEach((txt, idx) => {
      userParts.push({ text: `[ARQUIVO ANEXO ${idx + 1}]:\n${txt}\n` });
    });

    attachments.forEach(att => {
      userParts.push({
        inline_data: { mime_type: att.mimeType, data: att.data }
      });
    });

    userParts.push({ text: prompt });

    // Injetamos o RAG e a instrução no SystemInstruction para ele ser a "lei" constante
    const fullSystemInstruction = `${CHAT_INSTRUCTION}\n\n[BASE DE CONHECIMENTO ATUALIZADA]:\n${limitedRAG}`;

    const body = {
      contents: [...this.history, { role: "user", parts: userParts }],
      systemInstruction: { parts: [{ text: fullSystemInstruction }] },
      generationConfig: {
        temperature: 0.2, // Um pouco mais baixo para evitar "alucinações" de assunto
        maxOutputTokens: 8192,
        topP: 0.95,
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

          let startIdx = 0;
          while (true) {
            let braceCount = 0;
            let objectStart = -1;
            let found = false;

            for (let i = startIdx; i < buffer.length; i++) {
              if (buffer[i] === '{') {
                if (braceCount === 0) objectStart = i;
                braceCount++;
              } else if (buffer[i] === '}') {
                braceCount--;
                if (braceCount === 0 && objectStart !== -1) {
                  const jsonStr = buffer.substring(objectStart, i + 1);
                  try {
                    const json = JSON.parse(jsonStr);
                    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
                    fullText += text;
                    if (onStream) onStream(fullText);
                  } catch (e) { }
                  startIdx = i + 1;
                  found = true;
                  break;
                }
              }
            }
            if (!found) break;
          }
          buffer = buffer.substring(startIdx);
        }

        this.updateHistory(prompt, fullText);
        return fullText;
      } else {
        const data = await response.json();
        const assistantText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        this.updateHistory(prompt, assistantText);
        return assistantText;
      }
    } catch (error: any) {
      console.error("🚨 Gemini Error:", error);
      throw error;
    }
  }

  private updateHistory(userText: string, assistantText: string) {
    this.history.push({ role: "user", parts: [{ text: userText }] });
    this.history.push({ role: "model", parts: [{ text: assistantText }] });
    // Mantém as últimas 10 trocas (20 mensagens) para contexto
    if (this.history.length > 20) this.history = this.history.slice(-20);
  }

  resetSession() {
    this.history = [];
  }
}

export const geminiService = new GeminiService();

