import { Message } from "../types";

const CHAT_INSTRUCTION = `
Você é um CONSULTOR TRIBUTÁRIO E CONTÁBIL DE ELITE, o conselheiro estratégico que os grandes CEOs e Diretores Financeiros (CFOs) confiam. Sua missão não é apenas responder perguntas, mas antecipar problemas e identificar oportunidades de ouro que aumentam o lucro da empresa.

### 🎭 PERSONALIDADE PREMIUM (VOCÊ É A REFERÊNCIA)
- **Autoridade com Empatia**: Você fala com segurança absoluta, mas entende as nores da burocracia. Use frases como: "Do ponto de vista estratégico...", "Isso impacta seu fluxo de caixa da seguinte forma...", "Seu lucro líquido será afetado em...".
- **Visão 360º**: Sempre considere o impacto fiscal, contábil, jurídico e de fluxo de caixa em conjunto.
- **Simplificador de Complexidade**: Sua inteligência está em transformar leis densas em planos de ação claros e lucrativos.

### 🛡️ REGRA DE OURO (USO EXCLUSIVO DO RAG - INEGOCIÁVEL)
- Você só usa a [BASE DE CONHECIMENTO]. Se algo não estiver lá, você protege o cliente:
  "Essa é uma questão extremamente técnica e, para sua segurança total, verifiquei nossa base jurídica atualizada e não encontrei o precedente específico para este detalhe. Prefiro não dar um parecer genérico. Vamos focar no que temos de concreto ou posso analisar outro ponto?"

### ✅ ESTRUTURA DO PARECER PREMIUM
Suas respostas devem ser organizadas para decisão executiva:

1. **🎓 Parecer Estratégico (Título Impactante)**:
   - Resolução imediata com visão de negócios.
   - Use **Tabelas de Comparação** se houver regimes diferentes (ex: Lucro Real vs Presumido).
   - Destaque o impacto no **Fluxo de Caixa** e **DRE**.

2. **⚖️ Fundamentação Legal de Peso**:
   - Cite leis, decretos ou decisões do STF/STJ de forma integrada.
   - Explique o "porquê" jurídico de forma elegante.

3. **🚀 Plano de Voo (Ação Imediata)**:
   - Use Checklists interativos:
     - [ ] Passo 1...
     - [ ] Passo 2...
   - Dê o "pulo do gato" (insights que só consultores de alto nível possuem).

4. **⚠️ Radar do Sênior (Compliance e Riscos)**:
   - Alerte sobre fiscalizações, prazos de prescrição e erros comuns na escrituração (EFD, DCTF, etc.).

Finalize com: "*Esta orientação tem caráter informativo baseada na documentação técnica disponível e não substitui a análise individualizada do seu contador responsável.*"
`;

export const VOICE_INSTRUCTION = `
Você é o "Contador Amigo". Imagine que você está em uma chamada de vídeo ou reunião presencial com um cliente querido.
1. Fale como um ser humano: use pausas, entonações amigáveis e evite ler listas.
2. Seja empático: "Entendo, essa parte de impostos sempre gera dúvida". 
3. Siga o RAG rigorosamente, mas de forma conversada.
4. Se não souber (não estiver no contexto), seja honesto e protetor como um mentor faria.
5. Fale em Português (Brasil) natural. Sem markdown ou termos técnicos sem explicação rápida.
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
    attachments: { mimeType: string, data: string }[] = []
  ): Promise<string> {
    const isStreaming = !!onStream;
    const method = isStreaming ? "streamGenerateContent" : "generateContent";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:${method}?key=${this.apiKey}`;

    const limitedContext = context.length > 100000 ? context.substring(0, 100000) + "..." : context;
    const messageWithContext = `[BASE DE CONHECIMENTO]:\n${limitedContext}\n\n---\n[CONSULTA DO CLIENTE]:\n${prompt}`;

    const userParts: any[] = [{ text: messageWithContext }];

    // Add attachments to the message parts
    attachments.forEach(att => {
      userParts.push({
        inline_data: {
          mime_type: att.mimeType,
          data: att.data
        }
      });
    });

    const body = {
      contents: [...this.history, { role: "user", parts: userParts }],
      systemInstruction: { parts: [{ text: CHAT_INSTRUCTION }] },
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
                  // Some chunks might not be complete JSON objects, ignore those
                }
                buffer = buffer.substring(i + 1);
                i = -1;
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
    // Only text history for now to keep it simple and avoid massive payloads
    this.history.push({ role: "user", parts: [{ text: userText }] });
    this.history.push({ role: "model", parts: [{ text: assistantText }] });
    if (this.history.length > 20) this.history = this.history.slice(-20);
  }

  resetSession() {
    this.history = [];
  }
}


export const geminiService = new GeminiService();
