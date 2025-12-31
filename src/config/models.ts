/**
 * Centralized AI Model Configuration
 * Single source of truth for all model definitions used across frontend and backend
 */

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  provider?: 'google' | 'openai' | 'anthropic';
}

/**
 * All valid AI models supported by the application
 * This is the source of truth - backend should match these IDs
 */
export const ALL_MODELS: ModelOption[] = [
  // Google models
  { id: 'google/gemini-2.5-flash', name: 'Gemini Flash', description: 'Fast & balanced', provider: 'google' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini Pro', description: 'Most capable', provider: 'google' },
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini Lite', description: 'Fastest', provider: 'google' },
  // OpenAI models
  { id: 'openai/gpt-5', name: 'GPT-5', description: 'Premium', provider: 'openai' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', description: 'Balanced', provider: 'openai' },
  { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano', description: 'Fast & efficient', provider: 'openai' },
];

/**
 * Models available in the chat interface
 * Subset of ALL_MODELS for general chat use
 */
export const CHAT_MODELS: ModelOption[] = [
  ALL_MODELS.find(m => m.id === 'google/gemini-2.5-flash')!,
  ALL_MODELS.find(m => m.id === 'google/gemini-2.5-pro')!,
  ALL_MODELS.find(m => m.id === 'google/gemini-2.5-flash-lite')!,
  ALL_MODELS.find(m => m.id === 'openai/gpt-5')!,
  ALL_MODELS.find(m => m.id === 'openai/gpt-5-mini')!,
];

/**
 * Models available for agent configuration
 * Extended descriptions for agent setup
 */
export const AGENT_MODELS: ModelOption[] = [
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Best for complex reasoning & multimodal', provider: 'google' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Balanced speed & quality', provider: 'google' },
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: 'Fastest, good for simple tasks', provider: 'google' },
  { id: 'openai/gpt-5', name: 'GPT-5', description: 'Powerful reasoning & long context', provider: 'openai' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', description: 'Cost-efficient with strong performance', provider: 'openai' },
  { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano', description: 'Fast & cheap for high-volume tasks', provider: 'openai' },
];

/**
 * Valid model IDs for backend validation
 */
export const VALID_MODEL_IDS = ALL_MODELS.map(m => m.id);

/**
 * Default model for chat
 */
export const DEFAULT_CHAT_MODEL = 'google/gemini-2.5-flash';

/**
 * Available agent capabilities
 */
export const AGENT_CAPABILITIES = [
  { id: 'web_search', name: 'Web Search', description: 'Search the internet for information' },
  { id: 'thinking', name: 'Thinking', description: 'Extended reasoning for complex problems' },
  { id: 'deep_research', name: 'Deep Research', description: 'In-depth research & analysis' },
  { id: 'code', name: 'Code', description: 'Write and execute code' },
  { id: 'image_gen', name: 'Image Generation', description: 'Generate images from text' },
  { id: 'image_edit', name: 'Image Editing', description: 'Edit and modify images' },
  { id: 'file_analysis', name: 'File Analysis', description: 'Analyze uploaded documents' },
] as const;

export type AgentCapabilityId = typeof AGENT_CAPABILITIES[number]['id'];
