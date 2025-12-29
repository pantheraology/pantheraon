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

// Re-export chat types from centralized location
export { 
  type ChatMode,
  type ChatAttachment,
  type ChatOptions,
  type UploadedFile,
} from './chat';

// Re-export models from centralized location
export { 
  CHAT_MODELS, 
  CHAT_MODELS as AVAILABLE_MODELS, 
  AGENT_MODELS,
  AGENT_CAPABILITIES,
  type ModelOption 
} from './models';

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
