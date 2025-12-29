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
  deletedAt?: Date | null;
}

export interface Space {
  id: string;
  name: string;
  icon: string | null;
  createdAt: Date;
}

// Chat modes
export type ChatMode = 'normal' | 'research' | 'thinking';

export interface ChatOptions {
  mode: ChatMode;
  model: string;
  attachments?: File[];
}

// LLM Models available through Lovable AI
export interface ModelOption {
  id: string;
  name: string;
  description: string;
  provider: 'google' | 'openai';
}

export const AVAILABLE_MODELS: ModelOption[] = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini Flash', description: 'Fast & balanced', provider: 'google' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini Pro', description: 'Most capable', provider: 'google' },
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini Lite', description: 'Fastest', provider: 'google' },
  { id: 'openai/gpt-5', name: 'GPT-5', description: 'Premium', provider: 'openai' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', description: 'Balanced', provider: 'openai' },
];

// API Key providers for BYOK
export type ApiKeyProvider = 'openai' | 'anthropic' | 'google';

export interface UserApiKey {
  id: string;
  user_id: string;
  provider: ApiKeyProvider;
  api_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
