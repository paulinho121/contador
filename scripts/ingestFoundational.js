import { CosmosClient } from "@azure/cosmos";

// Use a variável de ambiente para segurança
const CONNECTION_STRING = process.env.AZURE_COSMOS_CONNECTION_STRING;

if (!CONNECTION_STRING) {
    console.error("❌ Erro: Variável de ambiente AZURE_COSMOS_CONNECTION_STRING não definida.");
    process.exit(1);
}
const client = new CosmosClient(CONNECTION_STRING);
const databaseId = "ContadorAmigoDB";
const containerId = "KnowledgeBase";

const foundationalData = [
    // 1. CTN
    {
        titulo: "CTN Art. 3º — Conceito de tributo",
        resumo_pratico: "Tributo é toda prestação pecuniária compulsória, em moeda ou cujo valor nela se possa exprimir, que não constitua sanção de ato ilícito, instituída em lei e cobrada mediante atividade administrativa plenamente vinculada.",
        area_contabil: ["Tributação Geral"],
        tributos: ["Todos"],
        regimes_tributarios: ["Todos"],
        base_legal: [{ fonte: "Lei nº 5.172/1966 (CTN)", artigo: "3", ano: "1966", status: "vigente" }],
        prioridade: "critica",
        palavras_chave: ["Conceito", "Tributo", "Compulsoriedade"],
        sensibilidade: "normal"
    },
    {
        titulo: "CTN Art. 97 — Reserva legal tributária",
        resumo_pratico: "Somente a lei pode estabelecer a instituição ou extinção de tributos, a majoração ou redução de alíquotas (ressalvadas exceções constitunal), a definição do fato gerador, a fixação de alíquota e base de cálculo, além de penalidades.",
        area_contabil: ["Tributação Geral"],
        tributos: ["Todos"],
        regimes_tributarios: ["Todos"],
        base_legal: [{ fonte: "Lei nº 5.172/1966 (CTN)", artigo: "97", ano: "1966", status: "vigente" }],
        prioridade: "critica",
        palavras_chave: ["Legalidade", "Reserva Legal", "Instituição de Tributo"],
        sensibilidade: "normal"
    },
    {
        titulo: "CTN Art. 113 — Obrigação tributária (principal e acessória)",
        resumo_pratico: "A obrigação principal surge com o fato gerador, tem por objeto o pagamento de tributo ou penalidade pecuniária. A obrigação acessória decorre da legislação tributária e tem por objeto as prestações, positivas ou negativas, nela previstas no interesse da arrecadação ou da fiscalização.",
        area_contabil: ["Tributação Geral", "Obrigações Acessórias"],
        tributos: ["Todos"],
        regimes_tributarios: ["Todos"],
        base_legal: [{ fonte: "Lei nº 5.172/1966 (CTN)", artigo: "113", ano: "1966", status: "vigente" }],
        prioridade: "critica",
        palavras_chave: ["Obrigação Principal", "Obrigação Acessória", "Fato Gerador"],
        sensibilidade: "normal"
    },
    {
        titulo: "CTN Art. 114 — Fato gerador",
        resumo_pratico: "Fato gerador da obrigação principal é a situação definida em lei como necessária e suficiente à sua ocorrência.",
        area_contabil: ["Tributação Geral"],
        tributos: ["Todos"],
        regimes_tributarios: ["Todos"],
        base_legal: [{ fonte: "Lei nº 5.172/1966 (CTN)", artigo: "114", ano: "1966", status: "vigente" }],
        prioridade: "critica",
        palavras_chave: ["Fato Gerador", "Nascimento da Obrigação"],
        sensibilidade: "normal"
    },
    {
        titulo: "CTN Art. 121 — Sujeito passivo",
        resumo_pratico: "Sujeito passivo da obrigação principal é a pessoa obrigada ao pagamento de tributo ou penalidade pecuniária. Pode ser contribuinte (relação direta e pessoal) ou responsável (expressa disposição legal).",
        area_contabil: ["Tributação Geral"],
        tributos: ["Todos"],
        regimes_tributarios: ["Todos"],
        base_legal: [{ fonte: "Lei nº 5.172/1966 (CTN)", artigo: "121", ano: "1966", status: "vigente" }],
        prioridade: "critica",
        palavras_chave: ["Sujeito Passivo", "Contribuinte", "Responsável"],
        sensibilidade: "normal"
    },
    {
        titulo: "CTN Art. 142 — Lançamento tributário",
        resumo_pratico: "Compete privativamente à autoridade administrativa constituir o crédito tributário pelo lançamento, assim entendido o procedimento administrativo tendente a verificar a ocorrência do fato gerador, determinar a matéria tributável e calcular o montante devido.",
        area_contabil: ["Tributação Geral"],
        tributos: ["Todos"],
        regimes_tributarios: ["Todos"],
        base_legal: [{ fonte: "Lei nº 5.172/1966 (CTN)", artigo: "142", ano: "1966", status: "vigente" }],
        prioridade: "critica",
        palavras_chave: ["Lançamento", "Crédito Tributário", "Autoridade Administrativa"],
        sensibilidade: "normal"
    },
    {
        titulo: "CTN Art. 150 — Lançamento por homologação",
        resumo_pratico: "O lançamento por homologação, que ocorre quanto aos tributos cuja legislação atribua ao sujeito passivo o dever de antecipar o pagamento sem prévio exame da autoridade administrativa, opera-se pelo ato em que a referida autoridade, tomando conhecimento da atividade assim exercida pelo obrigado, expressamente a homologa.",
        area_contabil: ["Tributação Geral"],
        tributos: ["PIS", "COFINS", "IRPJ", "CSLL"],
        regimes_tributarios: ["Lucro Real", "Lucro Presumido"],
        base_legal: [{ fonte: "Lei nº 5.172/1966 (CTN)", artigo: "150", ano: "1966", status: "vigente" }],
        prioridade: "critica",
        palavras_chave: ["Homologação", "Antecipação de Pagamento", "Decadência"],
        sensibilidade: "normal"
    },
    // 2. Simples Nacional
    {
        titulo: "LC 123/2006 Art. 3º — ME e EPP (Conceitos)",
        resumo_pratico: "Consideram-se microempresas (ME) aquelas com receita bruta anual igual ou inferior a R$ 360.000,00 e empresas de pequeno porte (EPP) aquelas com receita bruta anual superior a R$ 360.000,00 e igual ou inferior a R$ 4.800.000,00.",
        area_contabil: ["Regime Tributário"],
        tributos: ["Simples Nacional"],
        regimes_tributarios: ["Simples Nacional"],
        base_legal: [{ fonte: "Lei Complementar nº 123/2006", artigo: "3", ano: "2006", status: "vigente" }],
        prioridade: "critica",
        palavras_chave: ["ME", "EPP", "Limites de Faturamento"],
        sensibilidade: "normal"
    },
    {
        titulo: "LC 123/2006 Art. 13 — Tributos abrangidos",
        resumo_pratico: "O Simples Nacional implica o recolhimento mensal, mediante documento único de arrecadação, dos seguintes impostos e contribuições: IRPJ, CSLL, PIS/Pasep, Cofins, IPI, ICMS, ISS e a Contribuição para a Seguridade Social (CPP).",
        area_contabil: ["Regime Tributário"],
        tributos: ["IRPJ", "CSLL", "PIS", "COFINS", "IPI", "ICMS", "ISS", "CPP"],
        regimes_tributarios: ["Simples Nacional"],
        base_legal: [{ fonte: "Lei Complementar nº 123/2006", artigo: "13", ano: "2006", status: "vigente" }],
        prioridade: "critica",
        palavras_chave: ["Tributos Unificados", "DAS", "Unificação"],
        sensibilidade: "normal"
    },
    {
        titulo: "LC 123/2006 Art. 17 — Vedações ao Simples Nacional",
        resumo_pratico: "Não poderão recolher os impostos e contribuições na forma do Simples Nacional a pessoa jurídica que exerça atividade de banco, corretora, que possua débito com INSS ou Fazendas Públicas, ou que preste serviços de transporte intermunicipal e interestadual de passageiros.",
        area_contabil: ["Regime Tributário"],
        tributos: ["Simples Nacional"],
        regimes_tributarios: ["Simples Nacional"],
        base_legal: [{ fonte: "Lei Complementar nº 123/2006", artigo: "17", ano: "2006", status: "vigente" }],
        prioridade: "critica",
        palavras_chave: ["Vedações", "Restrições", "Impedimentos"],
        sensibilidade: "normal"
    },
    {
        titulo: "LC 123/2006 Art. 18-A — MEI",
        resumo_pratico: "O Microempreendedor Individual (MEI) é a pessoa que trabalha por conta própria, possui faturamento de até R$ 81.000,00 por ano e opta pelo recolhimento de valor fixo mensal, abrangendo INSS, ICMS e ISS.",
        area_contabil: ["Regime Tributário"],
        tributos: ["INSS", "ICMS", "ISS"],
        regimes_tributarios: ["SIMEI"],
        base_legal: [{ fonte: "Lei Complementar nº 123/2006", artigo: "18-A", ano: "2006", status: "vigente" }],
        prioridade: "critica",
        palavras_chave: ["MEI", "SIMEI", "Valor Fixo"],
        sensibilidade: "normal"
    },
    // 3. RIR/2018
    {
        titulo: "RIR/2018 Art. 238 — Lucros isentos",
        resumo_pratico: "Os lucros ou dividendos pagos ou creditados pelas pessoas jurídicas tributadas com base no lucro real, presumido ou arbitrado, não ficarão sujeitos ao imposto sobre a renda na fonte, nem integrarão a base de cálculo do imposto sobre a renda do beneficiário.",
        area_contabil: ["Tributação Federal", "Societária"],
        tributos: ["IRPJ", "IRPF"],
        regimes_tributarios: ["Lucro Real", "Lucro Presumido"],
        base_legal: [{ fonte: "RIR/2018 (Decreto nº 9.580/2018)", artigo: "238", ano: "2018", status: "vigente" }],
        prioridade: "critica",
        palavras_chave: ["Distribuição de Lucros", "Isenção IR", "Dividendos"],
        sensibilidade: "sensivel"
    },
    {
        titulo: "RIR/2018 Art. 299 — Despesas dedutíveis",
        resumo_pratico: "São operacionais as despesas não computadas nos custos, necessárias à atividade da empresa e à manutenção da respectiva fonte produtora. Devem ser usuais e normais no tipo de transação.",
        area_contabil: ["Tributação Federal"],
        tributos: ["IRPJ", "CSLL"],
        regimes_tributarios: ["Lucro Real"],
        base_legal: [{ fonte: "RIR/2018 (Decreto nº 9.580/2018)", artigo: "299", ano: "2018", status: "vigente" }],
        prioridade: "critica",
        palavras_chave: ["Dedutibilidade", "Despesas Operacionais", "Lucro Real"],
        sensibilidade: "sensivel"
    },
    // 4. Código Civil
    {
        titulo: "CC/2002 Art. 1.179 — Obrigatoriedade da escrituração",
        resumo_pratico: "O empresário e a sociedade empresária são obrigados a seguir um sistema de contabilidade e a levantar anualmente o balanço patrimonial e o de resultado econômico.",
        area_contabil: ["Contabilidade Societária"],
        tributos: ["Nenhum"],
        regimes_tributarios: ["Todos"],
        base_legal: [{ fonte: "Lei nº 10.406/2002 (Código Civil)", artigo: "1179", ano: "2002", status: "vigente" }],
        prioridade: "critica",
        palavras_chave: ["Obrigatoriedade", "Escrituração", "Balanço Anual"],
        sensibilidade: "normal"
    },
    // 5. Lei das S.A.
    {
        titulo: "Lei 6.404/76 Art. 176 — Demonstrações contábeis",
        resumo_pratico: "Ao fim de cada exercício social, a diretoria fará elaborar as seguintes demonstrações financeiras: Balanço Patrimonial, Demonstração dos Lucros ou Prejuízos Acumulados, DRE e Fluxo de Caixa.",
        area_contabil: ["Contabilidade Societária"],
        tributos: ["Nenhum"],
        regimes_tributarios: ["S/A", "Lucro Real"],
        base_legal: [{ fonte: "Lei nº 6.404/1976", artigo: "176", ano: "1976", status: "vigente" }],
        prioridade: "alta",
        palavras_chave: ["Demonstrações Financeiras", "Exercício Socia", "DRE", "BP"],
        sensibilidade: "normal"
    },
    // 6. NBC TG 1000
    {
        titulo: "NBC TG 1000 — Regime de Competência",
        resumo_pratico: "A entidade deve elaborar demonstrações contábeis usando o regime de competência (exceto fluxo de caixa). Itens são reconhecidos quando satisfazem as definições sob este regime.",
        area_contabil: ["Normas Contábeis (CFC)"],
        tributos: ["Nenhum"],
        regimes_tributarios: ["PMEs"],
        base_legal: [{ fonte: "NBC TG 1000 (R1)", artigo: "Sessão 2", ano: "2016", status: "vigente" }],
        prioridade: "critica",
        palavras_chave: ["Regime de Competência", "Reconhecimento", "PMEs"],
        sensibilidade: "normal"
    }
];

async function ingest() {
    console.log("🚀 Iniciando ingestão prioritária de leis fundacionais...");
    try {
        const { database } = await client.databases.createIfNotExists({ id: databaseId });
        const { container } = await database.containers.createIfNotExists({ id: containerId });

        for (const data of foundationalData) {
            const itemToSave = {
                id: `foundational_${Math.random().toString(36).substring(7)}`,
                partitionKey: "global",
                timestamp: new Date().toISOString(),
                title: data.titulo,
                content: data.resumo_pratico,
                metadata: data,
                source: "Ingestão Prioritária de Leis Fundacionais"
            };

            await container.items.create(itemToSave);
            console.log(`✅ Salvo: ${data.titulo}`);
        }
        console.log("🏁 Ingestão concluída com sucesso.");
    } catch (error) {
        console.error("❌ Erro durante a ingestão:", error);
    }
}

ingest();
