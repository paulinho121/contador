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
