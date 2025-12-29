/**
 * Agents Service
 * Encapsulates all Supabase operations for agents
 */

import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Use Supabase generated types
type DbAgent = Tables<'agents'>;
type AgentInsert = TablesInsert<'agents'>;
type AgentUpdate = TablesUpdate<'agents'>;

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface CreateAgentParams {
  userId: string;
  name: string;
  description?: string;
  instructions?: string;
  isMain?: boolean;
}

export interface UpdateAgentParams {
  name?: string;
  description?: string | null;
  instructions?: string | null;
  is_main?: boolean;
}

/**
 * Fetch paginated agents for a user
 */
export async function fetchAgents(
  userId: string,
  params: PaginationParams
): Promise<{ data: DbAgent[]; hasMore: boolean }> {
  const { page, pageSize } = params;
  const from = page * pageSize;
  const to = (page + 1) * pageSize - 1;

  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    data: data || [],
    hasMore: (data?.length || 0) === pageSize,
  };
}

/**
 * Create a new agent
 */
export async function createAgent(params: CreateAgentParams): Promise<DbAgent> {
  const { userId, name, description, instructions, isMain } = params;

  // If creating main agent, unset any existing main
  if (isMain) {
    await supabase
      .from('agents')
      .update({ is_main: false } as AgentUpdate)
      .eq('user_id', userId)
      .eq('is_main', true);
  }

  const { data, error } = await supabase
    .from('agents')
    .insert({
      user_id: userId,
      name,
      description,
      instructions,
      is_main: isMain || false,
    } as AgentInsert)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing agent
 */
export async function updateAgent(
  agentId: string,
  userId: string,
  updates: UpdateAgentParams
): Promise<void> {
  // If setting as main, unset any existing main
  if (updates.is_main) {
    await supabase
      .from('agents')
      .update({ is_main: false } as AgentUpdate)
      .eq('user_id', userId)
      .eq('is_main', true);
  }

  const { error } = await supabase
    .from('agents')
    .update(updates as AgentUpdate)
    .eq('id', agentId);

  if (error) throw error;
}

/**
 * Delete an agent
 */
export async function deleteAgent(agentId: string): Promise<void> {
  const { error } = await supabase
    .from('agents')
    .delete()
    .eq('id', agentId);

  if (error) throw error;
}

/**
 * Fetch a single agent with all details
 */
export async function fetchAgentWithDetails(agentId: string) {
  const [
    { data: agent, error: agentError },
    { data: starters, error: startersError },
    { data: models, error: modelsError },
    { data: capabilities, error: capabilitiesError },
    { data: knowledge, error: knowledgeError },
    { data: actions, error: actionsError },
  ] = await Promise.all([
    supabase.from('agents').select('*').eq('id', agentId).maybeSingle(),
    supabase.from('agent_conversation_starters').select('*').eq('agent_id', agentId).order('display_order'),
    supabase.from('agent_models').select('*').eq('agent_id', agentId),
    supabase.from('agent_capabilities').select('*').eq('agent_id', agentId),
    supabase.from('agent_knowledge').select('*').eq('agent_id', agentId).order('created_at', { ascending: false }),
    supabase.from('agent_actions').select('*').eq('agent_id', agentId),
  ]);

  if (agentError) throw agentError;
  if (!agent) return null;

  return {
    ...agent,
    conversation_starters: starters || [],
    models: models || [],
    capabilities: capabilities || [],
    knowledge: knowledge || [],
    actions: actions || [],
  };
}
