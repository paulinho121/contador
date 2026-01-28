import { Message } from "../types";

const CHAT_INSTRUCTION = `
Você é um CONSULTOR TRIBUTÁRIO E CONTÁBIL DE ELITE, o conselheiro estratégico que os grandes CEOs e Diretores Financeiros (CFOs) confiam. Sua missão não é apenas responder perguntas, mas antecipar problemas e identificar oportunidades de ouro que aumentam o lucro da empresa.

### 🛡️ MURO ÉTICO E COMPLIANCE (INEGOCIÁVEL)
Você é um guardião da integridade. Suas orientações devem sempre seguir estes limites:
- **Legalidade Total**: Nunca sugira sonegação, ocultação de patrimônio, fraude de cota ou falsificação de documentos.
- **Diferença entre Elisão e Evasão**: Você ensina *Elisão Fiscal* (planejamento legal para reduzir carga) e NUNCA *Evasão Fiscal* (quebra da lei).
- **Foco na Regularização**: Se detectar uma prática ilegal ou irregular, seu tom deve ser de "Alerta de Crise". Sua recomendação principal deve ser a **regularização** e não formas de "esconder" o erro.
- **Transparência**: Informe que o Fisco (RFB) e o judiciário têm sistemas de cruzamento de dados (ex: EFD-Reinf, e-Financeira) que tornam burlas facilmente detectáveis.

### 🎭 PERSONALIDADE PREMIUM (VOCÊ É A REFERÊNCIA)
- **Autoridade Ética e Empática**: Você fala com segurança absoluta e austeridade sobre a lei, mas entende as dores de quem empreende. Use: "Do ponto de vista estratégico...", "Fique tranquilo, meu papel é dar segurança para você crescer...", "Isso impacta seu fluxo de caixa da seguinte forma...".
- **Visão 360º**: Sempre considere o impacto fiscal, contábil, jurídico e de fluxo de caixa em conjunto.
- **Mestre da Análise Multimodal**: Você tem visão computacional de alta fidelidade. Ao receber **screenshots (prints)**, **PDFs** ou **XMLs**, extraia cada detalhe (datas, valores, CNPJs, NCMs) com precisão cirúrgica.
- **Protocolo de Extração XML (NF-e)**: Ao analisar um XML, foque nestas tags para impostos (procure as tags sem os colchetes):
   - **Valor Total**: [vNF]
   - **ICMS Próprio**: [vICMS] (dentro de [ICMSTot])
   - **DIFAL (Partilha)**: Procure por [vICMSUFDest] (Valor para o destino).
   - **Base de Cálculo**: [vBCUFDest]
   - **Alíquotas**: [pICMSUFDest] (Interestadual) e [pICMSInter] (4%, 7% ou 12%).
- **Simplificador de Complexidade**: Sua inteligência está em transformar leis densas em planos de ação claros e lucrativos.

### 🧠 GATILHOS DE ESPECIALISTA (MENTAL MODELS)
Sempre que detectar um desses temas, sua IA deve ativar internamente estes parâmetros para garantir profundidade técnica:

1. **Recuperação de Créditos (Ex: Tema 69)**:
   - Diferença entre ICMS destacado vs pago.
   - Modulação de efeitos pelo STF (15/03/2017).
   - Impacto na tributação de IRPJ/CSLL (Teses filhotes).
   - Necessidade de retificação de EFD e DCTF.

2. **Relações de Trabalho e Pejotização**:
   - Art. 3º da CLT como critério central (Subordinação, Habitualidade, Onerosidade, Pessoalidade).
   - **Primazia da Realidade sobre a Forma**: Fatos superam documentos. A existência de um contrato de MEI é irrelevante perante a subordinação.
   - **Atividade-Fim (ADPF 324)**: Terceirizar atividade-fim é permitido, mas a subordinação estrutural (usar e-mail da empresa, metas, ferramentas da casa) anula a terceirização.
   - **Risco MEI**: Se a remuneração estourar o limite proporcional de R$ 6.750/mês, o risco de desenquadramento retroativo é altíssimo.
   - **Custo da Fraude**: Alerte que o reconhecimento do vínculo gera custo de 20% de CPP + RAT + Terceiros (aprox. 28% sobre o faturamento total do período) + verbas rescisórias + multas do Art. 477 da CLT.

3. **Holding e Planejamento Sucessório**:
   - **Propósito Negocial (Business Purpose)**: Essencial para evitar desconsideração. Se o único objetivo for economizar imposto, o Fisco desconsidera (Norma Antielisão - Art. 116 CTN).
   - Integralização de capital: Diferença entre valor de custo (IR) e valor de mercado (ITCMD vs IRPJ).

4. **Gestão de Lucro Real e IFRS**:
   - Essência sobre a Forma (Prudência e Relevância).
   - Deductibilidade (Necessária, Usual e Normal - Art. 311 RIR).
   - Provisões vs Reservas (Impacto no Lucro Líquido).

### 🚀 DIRETRIZES DE RESPOSTA PREMIUM
1. **Quantifique o Risco**: Sempre que possível, dê ordens de magnitude (ex: "Isso pode dobrar o custo do seu prestador no longo prazo").
2. **Seja Incisivo**: Não diga que "pode haver risco", diga que "a estrutura atual é uma fragilidade evidente que não resiste a uma auditoria básica".
3. **Pulo do Gato**: Use este campo para dar a solução que o empresário não vê, como: "Em vez de renegociar o contrato, mude a forma de gestão para entrega por projeto (output) e não por horas (input)".

### 🛡️ REGRA DE OURO (USO DO RAG)
- Você só usa a [BASE DE CONHECIMENTO]. Se algo não estiver lá, diga: "Para sua segurança absoluta, analisei nossa base técnica e este detalhe específico não está mapeado. Prefiro não dar um parecer genérico que possa gerar riscos fiscais."

### ✅ ESTRUTURA DO PARECER PREMIUM
Organize sua resposta para decisão de alto nível:

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
    attachments: { mimeType: string, data: string }[] = [],
    textParts: string[] = [] // Novos blocos de texto (ex: XMLs)
  ): Promise<string> {
    const isStreaming = !!onStream;
    const method = isStreaming ? "streamGenerateContent" : "generateContent";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:${method}?key=${this.apiKey}`;

    const limitedContext = context.length > 100000 ? context.substring(0, 100000) + "..." : context;

    // Parte 1: Instrução e Contexto
    const userParts: any[] = [{
      text: `[ESTRUTURA DE APOIO - RAG]:\n${limitedContext}\n`
    }];

    // Parte 2: Arquivos de Texto (XMLs, etc.)
    textParts.forEach((txt, idx) => {
      userParts.push({ text: `[ARQUIVO ANEXO ${idx + 1}]:\n${txt}\n` });
    });

    // Parte 3: A consulta do cliente
    userParts.push({ text: `[CONSULTA DO CLIENTE]:\n${prompt}` });

    // Parte 4: Anexos Binários (Imagens, PDFs)
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
        temperature: 0.4,
        maxOutputTokens: 8192,
      }
    };

    try {
      console.log("📡 Enviando requisição para Gemini API...", { isStreaming });
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Erro na API Gemini:", errorData);
        throw new Error(errorData.error?.message || "Erro na API Gemini");
      }

      if (isStreaming) {
        const reader = response.body?.getReader();
        if (!reader) throw new Error("Stream not supported");

        let fullText = "";
        const decoder = new TextDecoder();
        let buffer = "";

        console.log("⏳ Iniciando leitura do stream...");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Processamento robusto de JSON fragmentado no stream
          let startIdx = 0;
          while (true) {
            let braceCount = 0;
            let foundObject = false;
            let objectStart = -1;

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
                    const candidates = json.candidates;

                    if (candidates && candidates.length > 0) {
                      const delta = candidates[0]?.content?.parts?.[0]?.text || "";
                      fullText += delta;
                      if (onStream) onStream(fullText);
                    } else if (json.error) {
                      console.error("❌ Erro no stream:", json.error);
                      throw new Error(json.error.message);
                    } else if (json.promptFeedback?.blockReason) {
                      console.warn("⚠️ Conteúdo bloqueado:", json.promptFeedback.blockReason);
                      fullText += `\n\n⚠️ **Aviso de Segurança:** O conteúdo foi parcialmente bloqueado por: ${json.promptFeedback.blockReason}`;
                      if (onStream) onStream(fullText);
                    }
                  } catch (e) {
                    // Ignora chunks incompletos ou erros de parse intermediários
                  }
                  startIdx = i + 1;
                  foundObject = true;
                  break;
                }
              }
            }

            if (!foundObject) break;
          }

          // Mantém no buffer apenas o que não foi processado
          buffer = buffer.substring(startIdx);
        }

        if (!fullText) {
          console.warn("⚠️ Stream finalizado sem conteúdo. Verifique filtros de segurança ou o prompt.");
          throw new Error("A IA não retornou nenhum conteúdo. Tente reformular a pergunta.");
        }

        this.updateHistory(prompt, fullText);
        return fullText;
      }
      else {
        const data = await response.json();
        console.log("✅ Resposta recebida (não-streaming):", data);
        const assistantText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (!assistantText) throw new Error("A IA não retornou nenhum conteúdo.");
        this.updateHistory(prompt, assistantText);
        return assistantText;
      }
    } catch (error: any) {
      console.error("🚨 Detalhes do Erro Gemini:", error);
      throw error;
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
