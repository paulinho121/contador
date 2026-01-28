import { createClient } from "@google/genai";

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
  private client;
  private history: any[] = [];

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
    this.client = createClient({
      apiKey,
    });
  }

  async ask(
    prompt: string,
    context: string,
    onStream?: (text: string) => void,
    attachments: { mimeType: string, data: string }[] = [],
    textParts: string[] = []
  ): Promise<string> {
    const isStreaming = !!onStream;
    // RAG limitado para dar espaço ao histórico
    const limitedRAG = context.length > 50000 ? context.substring(0, 50000) + "..." : context;

    const currentParts: any[] = [];

    // Inclusão de XMLs/Textos
    textParts.forEach((txt, idx) => {
      currentParts.push({ text: `[ARQUIVO ANEXO ${idx + 1}]:\n${txt}\n` });
    });

    // Inclusão de Imagens/PDFs
    attachments.forEach(att => {
      currentParts.push({
        inline_data: { mimeType: att.mimeType, data: att.data }
      });
    });

    currentParts.push({ text: prompt });

    try {
      if (isStreaming) {
        let fullText = "";
        const stream = await this.client.models.generateContentStream({
          model: "gemini-2.0-flash",
          systemInstruction: {
            parts: [{ text: `${CHAT_INSTRUCTION}\n\n[BASE DE CONHECIMENTO]:\n${limitedRAG}` }]
          },
          contents: [
            ...this.history,
            { role: "user", parts: currentParts }
          ],
          config: {
            temperature: 0.1, // Minimiza variações e cortes
            maxOutputTokens: 8192,
            safetySettings: [
              { category: "HATE_SPEECH", threshold: "BLOCK_NONE" },
              { category: "HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
          }
        });

        for await (const chunk of stream.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            fullText += chunkText;
            if (onStream) onStream(fullText);
          }
        }

        this.updateHistory(prompt, fullText);
        return fullText;
      } else {
        const response = await this.client.models.generateContent({
          model: "gemini-2.0-flash",
          systemInstruction: {
            parts: [{ text: `${CHAT_INSTRUCTION}\n\n[BASE DE CONHECIMENTO]:\n${limitedRAG}` }]
          },
          contents: [
            ...this.history,
            { role: "user", parts: currentParts }
          ],
          config: {
            temperature: 0.1,
            maxOutputTokens: 8192,
          }
        });

        const assistantText = response.text() || "";
        this.updateHistory(prompt, assistantText);
        return assistantText;
      }
    } catch (error: any) {
      console.error("🚨 Gemini SDK Error:", error);
      throw error;
    }
  }

  private updateHistory(userText: string, assistantText: string) {
    this.history.push({ role: "user", parts: [{ text: userText }] });
    this.history.push({ role: "model", parts: [{ text: assistantText }] });
    // Mantém histórico focado (5 trocas)
    if (this.history.length > 10) this.history = this.history.slice(-10);
  }

  resetSession() {
    this.history = [];
  }
}

export const geminiService = new GeminiService();
