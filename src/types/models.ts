/**
 * Centralized AI Model definitions
 * Single source of truth for all model configurations
 */

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  provider?: 'google' | 'openai';
}

/**
 * Available AI models for chat interactions
 * Used in ChatInput and model selectors
 */
export const CHAT_MODELS: ModelOption[] = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini Flash', description: 'Fast & balanced', provider: 'google' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini Pro', description: 'Most capable', provider: 'google' },
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini Lite', description: 'Fastest', provider: 'google' },
  { id: 'openai/gpt-5', name: 'GPT-5', description: 'Premium', provider: 'openai' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', description: 'Balanced', provider: 'openai' },
];

/**
 * Available AI models for agent configuration
 * Extended list with more detailed descriptions
 */
export const AGENT_MODELS: ModelOption[] = [
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Best for complex reasoning & multimodal' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Balanced speed & quality' },
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: 'Fastest, good for simple tasks' },
  { id: 'openai/gpt-5', name: 'GPT-5', description: 'Powerful reasoning & long context' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', description: 'Cost-efficient with strong performance' },
  { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano', description: 'Fast & cheap for high-volume tasks' },
];

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

// Legacy export for backward compatibility
export const AVAILABLE_MODELS = CHAT_MODELS;
