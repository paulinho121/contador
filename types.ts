
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface KnowledgeSource {
  id: string;
  name: string;
  content: string;
}
