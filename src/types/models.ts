/**
 * Model Types - Re-exported from config
 * Use src/config/models.ts as the single source of truth
 */

export {
  CHAT_MODELS,
  AGENT_MODELS,
  AGENT_CAPABILITIES,
  ALL_MODELS,
  VALID_MODEL_IDS,
  DEFAULT_CHAT_MODEL,
  type ModelOption,
  type AgentCapabilityId,
} from '@/config/models';

// Legacy export for backward compatibility
import { CHAT_MODELS } from '@/config/models';
export const AVAILABLE_MODELS = CHAT_MODELS;
