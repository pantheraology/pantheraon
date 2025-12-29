export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  spaceId: string | null;
}

export interface Space {
  id: string;
  name: string;
  icon: string | null;
  createdAt: Date;
}
