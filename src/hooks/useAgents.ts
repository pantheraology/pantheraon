import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Agent, 
  AgentWithDetails, 
  AgentConversationStarter,
  AgentModel,
  AgentCapability,
  AgentKnowledge,
  AgentAction 
} from '@/types/agent';
import { toast } from 'sonner';

export const useAgents = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [mainAgent, setMainAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAgents = useCallback(async () => {
    if (!user) {
      setAgents([]);
      setMainAgent(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const agentsList = data || [];
      setAgents(agentsList);
      setMainAgent(agentsList.find(a => a.is_main) || null);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const createAgent = async (
    name: string, 
    isMain: boolean = false,
    description?: string,
    instructions?: string
  ): Promise<Agent | null> => {
    if (!user) {
      toast.error('You must be logged in to create an agent');
      return null;
    }

    try {
      // If creating main agent, unset any existing main
      if (isMain) {
        await supabase
          .from('agents')
          .update({ is_main: false })
          .eq('user_id', user.id)
          .eq('is_main', true);
      }

      const { data, error } = await supabase
        .from('agents')
        .insert({
          user_id: user.id,
          name,
          description,
          instructions,
          is_main: isMain,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Agent "${name}" created!`);
      await fetchAgents();
      return data;
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error('Failed to create agent');
      return null;
    }
  };

  const updateAgent = async (
    agentId: string,
    updates: Partial<Pick<Agent, 'name' | 'description' | 'instructions' | 'is_main'>>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      // If setting as main, unset any existing main
      if (updates.is_main) {
        await supabase
          .from('agents')
          .update({ is_main: false })
          .eq('user_id', user.id)
          .eq('is_main', true);
      }

      const { error } = await supabase
        .from('agents')
        .update(updates)
        .eq('id', agentId);

      if (error) throw error;

      toast.success('Agent updated!');
      await fetchAgents();
      return true;
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error('Failed to update agent');
      return false;
    }
  };

  const deleteAgent = async (agentId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentId);

      if (error) throw error;

      toast.success('Agent deleted');
      await fetchAgents();
      return true;
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent');
      return false;
    }
  };

  return {
    agents,
    mainAgent,
    isLoading,
    createAgent,
    updateAgent,
    deleteAgent,
    refreshAgents: fetchAgents,
  };
};

// Hook for a single agent with all details
export const useAgent = (agentId: string | null) => {
  const { user } = useAuth();
  const [agent, setAgent] = useState<AgentWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAgent = useCallback(async () => {
    if (!agentId || !user) {
      setAgent(null);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch agent
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (agentError) throw agentError;

      // Fetch related data in parallel
      const [starters, models, capabilities, knowledge, actions] = await Promise.all([
        supabase.from('agent_conversation_starters').select('*').eq('agent_id', agentId).order('display_order'),
        supabase.from('agent_models').select('*').eq('agent_id', agentId),
        supabase.from('agent_capabilities').select('*').eq('agent_id', agentId),
        supabase.from('agent_knowledge').select('*').eq('agent_id', agentId).order('created_at', { ascending: false }),
        supabase.from('agent_actions').select('*').eq('agent_id', agentId).order('created_at', { ascending: false }),
      ]);

      setAgent({
        ...agentData,
        conversation_starters: starters.data || [],
        models: models.data || [],
        capabilities: capabilities.data || [],
        knowledge: knowledge.data || [],
        actions: actions.data || [],
      });
    } catch (error) {
      console.error('Error fetching agent:', error);
      toast.error('Failed to load agent');
    } finally {
      setIsLoading(false);
    }
  }, [agentId, user]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  // Conversation starters
  const addConversationStarter = async (prompt: string) => {
    if (!agentId) return;
    
    try {
      const maxOrder = Math.max(0, ...((agent?.conversation_starters || []).map(s => s.display_order)));
      const { error } = await supabase
        .from('agent_conversation_starters')
        .insert({ agent_id: agentId, prompt, display_order: maxOrder + 1 });
      
      if (error) throw error;
      await fetchAgent();
    } catch (error) {
      console.error('Error adding starter:', error);
      toast.error('Failed to add conversation starter');
    }
  };

  const removeConversationStarter = async (starterId: string) => {
    try {
      const { error } = await supabase
        .from('agent_conversation_starters')
        .delete()
        .eq('id', starterId);
      
      if (error) throw error;
      await fetchAgent();
    } catch (error) {
      console.error('Error removing starter:', error);
      toast.error('Failed to remove conversation starter');
    }
  };

  // Models
  const setModels = async (modelIds: string[]) => {
    if (!agentId) return;
    
    try {
      // Delete existing
      await supabase.from('agent_models').delete().eq('agent_id', agentId);
      
      // Insert new
      if (modelIds.length > 0) {
        const { error } = await supabase
          .from('agent_models')
          .insert(modelIds.map(model_id => ({ agent_id: agentId, model_id })));
        
        if (error) throw error;
      }
      
      await fetchAgent();
    } catch (error) {
      console.error('Error setting models:', error);
      toast.error('Failed to update models');
    }
  };

  // Capabilities
  const setCapabilities = async (capabilityIds: string[]) => {
    if (!agentId) return;
    
    try {
      // Delete existing
      await supabase.from('agent_capabilities').delete().eq('agent_id', agentId);
      
      // Insert new
      if (capabilityIds.length > 0) {
        const { error } = await supabase
          .from('agent_capabilities')
          .insert(capabilityIds.map(capability => ({ agent_id: agentId, capability })));
        
        if (error) throw error;
      }
      
      await fetchAgent();
    } catch (error) {
      console.error('Error setting capabilities:', error);
      toast.error('Failed to update capabilities');
    }
  };

  // Knowledge files
  const uploadKnowledge = async (file: File) => {
    if (!agentId || !user) return;
    
    try {
      const filePath = `${user.id}/${agentId}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('agent-knowledge')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { error: dbError } = await supabase
        .from('agent_knowledge')
        .insert({
          agent_id: agentId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
        });
      
      if (dbError) throw dbError;
      
      toast.success('File uploaded!');
      await fetchAgent();
    } catch (error) {
      console.error('Error uploading knowledge:', error);
      toast.error('Failed to upload file');
    }
  };

  const removeKnowledge = async (knowledgeId: string, filePath: string) => {
    try {
      await supabase.storage.from('agent-knowledge').remove([filePath]);
      const { error } = await supabase.from('agent_knowledge').delete().eq('id', knowledgeId);
      
      if (error) throw error;
      
      toast.success('File removed');
      await fetchAgent();
    } catch (error) {
      console.error('Error removing knowledge:', error);
      toast.error('Failed to remove file');
    }
  };

  return {
    agent,
    isLoading,
    addConversationStarter,
    removeConversationStarter,
    setModels,
    setCapabilities,
    uploadKnowledge,
    removeKnowledge,
    refreshAgent: fetchAgent,
  };
};
