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

// Re-export from centralized location
export { 
  AGENT_MODELS as AVAILABLE_MODELS, 
  AGENT_CAPABILITIES as AVAILABLE_CAPABILITIES 
} from './models';
