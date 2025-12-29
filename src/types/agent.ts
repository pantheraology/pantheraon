export interface Agent {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  is_main: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentConversationStarter {
  id: string;
  agent_id: string;
  prompt: string;
  display_order: number;
}

export interface AgentModel {
  id: string;
  agent_id: string;
  model_id: string;
}

export interface AgentCapability {
  id: string;
  agent_id: string;
  capability: string;
}

export interface AgentKnowledge {
  id: string;
  agent_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
}

export interface AgentActionConfig {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AgentAction {
  id: string;
  agent_id: string;
  action_type: string;
  action_name: string;
  config: AgentActionConfig | Record<string, unknown> | null;
  created_at: string;
}

export interface AgentWithDetails extends Agent {
  conversation_starters: AgentConversationStarter[];
  models: AgentModel[];
  capabilities: AgentCapability[];
  knowledge: AgentKnowledge[];
  actions: AgentAction[];
}

// Available AI models
export const AVAILABLE_MODELS = [
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Best for complex reasoning & multimodal' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Balanced speed & quality' },
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: 'Fastest, good for simple tasks' },
  { id: 'openai/gpt-5', name: 'GPT-5', description: 'Powerful reasoning & long context' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', description: 'Cost-efficient with strong performance' },
  { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano', description: 'Fast & cheap for high-volume tasks' },
];

// Available capabilities
export const AVAILABLE_CAPABILITIES = [
  { id: 'web_search', name: 'Web Search', description: 'Search the internet for information' },
  { id: 'thinking', name: 'Thinking', description: 'Extended reasoning for complex problems' },
  { id: 'deep_research', name: 'Deep Research', description: 'In-depth research & analysis' },
  { id: 'code', name: 'Code', description: 'Write and execute code' },
  { id: 'image_gen', name: 'Image Generation', description: 'Generate images from text' },
  { id: 'image_edit', name: 'Image Editing', description: 'Edit and modify images' },
  { id: 'file_analysis', name: 'File Analysis', description: 'Analyze uploaded documents' },
];
