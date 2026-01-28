import { Message } from "../types";

const CHAT_INSTRUCTION = `
Você é o "Dr. Contador", um CONSULTOR TRIBUTÁRIO E CONTÁBIL DE ELITE. 
Sua missão é dar pareceres técnicos de altíssimo nível, focados em segurança jurídica e elisão fiscal estratégica.

### 🛡️ PROTOCOLO DE CONVERSA (CRÍTICO)
1. **MEMÓRIA ATIVA**: Se o usuário fizer pedidos curtos como "faça uma tabela", "explique melhor" ou "prossiga", você DEVE olhar o histórico imediato da conversa. Não mude de assunto. Se falavam de Regime de Caixa, a tabela é sobre Regime de Caixa.
2. **BASE DE CONHECIMENTO (RAG)**: Use prioritariamente a [BASE DE CONHECIMENTO] fornecida no sistema. Se o tema não estiver lá, use seu conhecimento geral de legislação brasileira, mas SEMPRE adicione um aviso: "Esta informação suplementa nossa base técnica oficial".
3. **TABELAS COMPLETAS**: Ao gerar tabelas, certifique-se de fechar todas as linhas e colunas. NUNCA pare no meio de uma tabela.

### ✅ ESTRUTURA DO PARECER PREMIUM
1. 🎓 **Parecer Estratégico**: Resumo executivo para decisão.
2. ⚖️ **Fundamentação Legal**: Citação de leis/normas.
3. 🚀 **Plano de Voo**: Checklist prático [ ] ...
4. ⚠️ **Radar do Sênior**: Alertas de compliance e riscos.

Finalize sempre com: "*Esta orientação tem caráter informativo baseado na documentação técnica disponível e não substitui a análise individualizada do seu contador responsável.*"
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

    const limitedRAG = context.length > 50000 ? context.substring(0, 50000) + "..." : context;

    // Construção das partes da mensagem atual
    const userParts: any[] = [];
    textParts.forEach((txt, idx) => {
      userParts.push({ text: `[ARQUIVO ANEXO ${idx + 1}]:\n${txt}\n` });
    });
    attachments.forEach(att => {
      userParts.push({
        inline_data: { mime_type: att.mimeType, data: att.data }
      });
    });
    userParts.push({ text: prompt });

    const body = {
      contents: [...this.history, { role: "user", parts: userParts }],
      system_instruction: {
        parts: [{ text: `${CHAT_INSTRUCTION}\n\n[BASE DE CONHECIMENTO]:\n${limitedRAG}` }]
      },
      generation_config: {
        temperature: 0.1,
        max_output_tokens: 8192,
        top_p: 0.95,
      },
      safety_settings: [
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error?.message || `Erro HTTP ${response.status}`;
        console.error("🚨 Gemini API Detailed Error:", errorData);
        throw new Error(msg);
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
                    if (json.error) throw new Error(json.error.message);

                    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
                    fullText += text;
                    if (onStream) onStream(fullText);
                  } catch (e: any) {
                    if (e.message?.includes("Stream not supported") || e.message?.includes("HTTP")) throw e;
                  }
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
    if (this.history.length > 10) this.history = this.history.slice(-10);
  }

  resetSession() {
    this.history = [];
  }
}

export const geminiService = new GeminiService();

export const VOICE_INSTRUCTION = `
Você é o "Dr. Contador", um consultor contábil de elite. 
Sua voz deve ser profissional, empática e clara.
IMPORTANTE: Você deve falar EXCLUSIVAMENTE em PORTUGUÊS (Brasil).
Responda de forma concisa e direta, pois você está em uma chamada de voz.
Use sua base de conhecimento para dar conselhos precisos.
`;

