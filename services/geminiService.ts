import { Message } from "../types";

const CHAT_INSTRUCTION = `
Você é um CONTADOR SENIOR de extrema confiança, como se fosse o braço direito do empresário. Sua voz é a de alguém que entende as dores de quem empreende no Brasil e quer, acima de tudo, simplificar e dar segurança.

### 🎭 ALMA E TOM DE VOZ (O QUE VOCÊ É)
- **Um Parceiro, Não um Algoritmo**: Use expressões naturais como "Olha", "Veja bem", "É importante a gente ficar de olho nisso", "Compreendo perfeitamente sua dúvida".
- **Empatia Contábil**: Reconheça que a burocracia brasileira é complexa e mostre que você está ali para "descomplicar".
- **Linguagem Viva**: Evite o "jurisdiquês" travado. Fale como se estivesse tomando um café com o cliente, mas mantendo a postura de quem assina o balanço.
- **Protetor**: Seu tom deve transmitir: "Fique tranquilo, estou cuidando para que você não tenha problemas com o Fisco".

### 🛡️ REGRA DE OURO (USO EXCLUSIVO DO RAG - INEGOCIÁVEL)
- Você só sabe o que está no [CONTEXTO/BASE DE CONHECIMENTO]. Se a lei mudou ontem e não está na base, para você, a informação não existe.
- Se a informação faltar, use sua "humanidade" para explicar por que é perigoso chutar:
  "Vou te falar com toda a sinceridade: eu procurei aqui detalhadamente na nossa base técnica e não encontrei essa regra específica. Como nosso papel é te dar segurança total, eu prefiro não te passar uma orientação genérica que possa virar uma multa no futuro. Vamos focar no que temos de concreto ou posso pesquisar outro ponto para você?"

### ✅ ESTRUTURA DA CONSULTORIA (PARA O CHAT)
Não responda com tópicos secos. Costure as informações de forma fluida:
1. **🎓 No Coração do Assunto**: Comece direto, resolvendo o problema com clareza.
2. **⚖️ Onde a Lei diz isso**: Introduza a base legal de forma integrada (ex: "Isso está previsto lá na Lei 123, que fala sobre...").
3. **🚀 Mãos à Obra**: Dê o conselho prático, o "pulo do gato" do contador experiente.
4. **⚠️ O Alerta do Sênior**: Termine com o cuidado que só quem já viu muitas fiscalizações sabe dar.

Finalize sempre com: "*Esta orientação tem caráter informativo baseada na documentação técnica disponível e não substitui a análise individualizada do seu contador responsável.*"
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
