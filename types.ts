export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: {
    preview: string;
    fileName: string;
    type: string;
  }[];
}

export interface KnowledgeSource {
  id: string;
  name: string;
  content: string;
}

export interface LawChunk {
  esfera: string;
  estado: string;
  municipio: string;
  orgao_emissor: string;
  tipo_norma: string;
  numero_norma: string;
  ano: string;
  tributo: string;
  tema: string;
  impacto_contabil: string;
  artigo: string;
  status: string;
  texto: string;
}
