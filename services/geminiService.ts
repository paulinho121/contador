import { Message } from "../types";

const CHAT_INSTRUCTION = `
Você é o "Dr. Contador", um CONSULTOR TRIBUTÁRIO E CONTÁBIL DE ELITE. 
Sua missão é dar pareceres técnicos de altíssimo nível, focados em segurança jurídica e elisão fiscal estratégica.

### 🛡️ PROTOCOLO DE CONVERSA (CRÍTICO)
1. **MEMÓRIA ATIVA**: Se o usuário fizer pedidos curtos como "faça uma tabela", "explique melhor" ou "prossiga", você DEVE olhar o histórico imediato da conversa. Não mude de assunto. Se falavam de Regime de Caixa, a tabela é sobre Regime de Caixa.
2. **ESPECIFICIDADE ESTADUAL E MUNICIPAL**: Se a pergunta envolver cálculos de ICMS, ISS ou taxas locais, procure IMEDIATAMENTE por referências à prefeitura, município ou estado citado na [BASE DE CONHECIMENTO]. Cite o número da Lei ou Decreto (ex: RICMS/SP, Lei 118/22 de Barueri) sempre que disponível.
3. **BASE DE CONHECIMENTO (RAG)**: Use prioritariamente a [BASE DE CONHECIMENTO] fornecida no sistema. Se o tema não estiver lá, use seu conhecimento geral de legislação brasileira, mas SEMPRE adicione um aviso: "Esta informação suplementa nossa base técnica oficial".
4. **TABELAS COMPLETAS**: Ao gerar tabelas, certifique-se de fechar todas as linhas e colunas. NUNCA pare no meio de uma tabela.

### ✅ ESTRUTURA DO PARECER PREMIUM
1. 🎓 **Parecer Estratégico**: Resumo executivo para decisão.
2. ⚖️ **Fundamentação Legal**: Citação de leis/normas.
3. 🚀 **Plano de Voo**: Checklist prático [ ] ...
4. ⚠️ **Radar do Sênior**: Alertas de compliance e riscos.

Finalize sempre com: "*Esta orientação tem caráter informativo baseado na documentação técnica disponível e não substitui a análise individualizada do seu contador responsável.*"
`;

import { externalApiService } from "./externalApiService";

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
    let augmentedContext = context;

    // 🔍 ANALISADOR DE INTENÇÃO PARA BUSCA EXTERNA
    // Se o usuário mencionar CNPJ ou pedir algo "atual", buscamos fora.
    const cnpjMatch = prompt.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
    if (cnpjMatch) {
      console.log("🔍 Detectado CNPJ no prompt. Consultando BrasilAPI...");
      const cnpjInfo = await externalApiService.queryCNPJ(cnpjMatch[0]);
      if (cnpjInfo) {
        augmentedContext += `\n\n[DADOS REAIS CNPJ ${cnpjMatch[0]}]:\n${JSON.stringify(cnpjInfo, null, 2)}`;
      }
    }

    // LISTA DE TEMAS QUE EXIGEM BUSCA WEB (TRIBUTOS ESTADUAIS/MUNICIPAIS)
    const hotTopics = [
      "ipva", "iptu", "itcmd", "itbi", "alíquota", "tabela", "vencimento",
      "prazo", "reforma tributária", "uau", "ufesp", "ufir", "selic"
    ];

    // LISTA DE ESTADOS E CAPITAIS PARA REFORÇAR BUSCA LOCALIZADA
    const locations = ["ceara", "ceará", "fortaleza", "são paulo", "sp", "rio", "rj", "minas", "mg", "bahia", "paraná", "pr"];

    const promptLower = prompt.toLowerCase();
    const needsWeb = hotTopics.some(t => promptLower.includes(t)) ||
      promptLower.includes("pesquise") ||
      promptLower.includes("internet") ||
      promptLower.includes("web") ||
      (promptLower.includes("valor") && locations.some(l => promptLower.includes(l)));

    if (needsWeb) {
      console.log("🌐 Gatilho de busca web acionado para: " + prompt);
      const webResults = await externalApiService.searchWeb(prompt);
      if (webResults) {
        augmentedContext += `\n\n[RESULTADOS DA BUSCA WEB EM TEMPO REAL]:\n${webResults}`;
      }
    }

    // 🧠 COMANDO DE APRENDIZADO ATIVO ("Aprenda sobre...")
    const learnMatch = prompt.toLowerCase().match(/aprenda sobre (?:as leis tributárias de |as leis tributarias de |as leis de |a legislação de )?(.+)/);
    if (learnMatch) {
      const target = learnMatch[1].trim();
      console.log(`🧠 [ACTIVE-LEARNING] Comando recebido para aprender sobre: ${target}`);

      // Iniciamos o aprendizado em background
      const { selfLearningService } = await import("./selfLearningService");
      // Forçamos a busca para o alvo específico
      selfLearningService.learnFromResponse(`Preciso aprender sobre as leis de ${target}`, "Base local não possui informações específicas sobre " + target);

      return `Com prazer! Estou iniciando agora uma varredura profunda na internet para aprender tudo sobre a legislação tributária de **${target}**. 

Isso pode levar alguns segundos enquanto eu fragmento e indexo os artigos na minha base. Enquanto eu processo, **o que exatamente você gostaria de saber sobre as regras contábeis ou impostos de ${target}?**`;
    }

    const isStreaming = !!onStream;
    const method = isStreaming ? "streamGenerateContent" : "generateContent";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:${method}?key=${this.apiKey}`;

    const limitedRAG = augmentedContext.length > 60000 ? augmentedContext.substring(0, 60000) + "..." : augmentedContext;

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

  async processLaw(text: string): Promise<any[]> {
    const prompt = `
      Você é um especialista em direito tributário brasileiro, contabilidade e arquitetura de sistemas RAG.
      Sua tarefa é organizar o texto legal abaixo para indexação em um sistema RAG.

      REGRAS RÍGIDAS:
      1. IDENTIFICAÇÃO: Identifique Esfera, Tipo, Número, Ano, Órgão e Status.
      2. CHUNKING: Divida EXCLUSIVAMENTE por Artigos, Parágrafos ou Incisos. Nunca quebre no meio de um dispositivo.
      3. CLASSIFICAÇÃO: Identifique Tributo, Tema Principal e Tipo de Impacto Contábil.
      4. FORMATO: Retorne APENAS um array de objetos JSON no formato:
      {
        "esfera": "",
        "estado": "",
        "municipio": "",
        "orgao_emissor": "",
        "tipo_norma": "",
        "numero_norma": "",
        "ano": "",
        "tributo": "",
        "tema": "",
        "impacto_contabil": "",
        "artigo": "",
        "status": "",
        "texto": ""
      }

      TEXTO LEGAL:
      ${text}

      Retorne APENAS o array JSON, sem explicações.
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generation_config: {
            temperature: 0,
            response_mime_type: "application/json"
          }
        })
      });

      if (!response.ok) throw new Error("Falha ao processar lei com Gemini");

      const data = await response.json();
      const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      return JSON.parse(rawOutput);
    } catch (error) {
      console.error("Erro no processamento da lei:", error);
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

