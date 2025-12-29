/**
 * Hook for managing a single agent with all its details
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  AgentWithDetails, 
  AgentAction 
} from '@/types/agent';
import { handleError } from '@/lib/errors';
import { toast } from 'sonner';

export const useAgent = (agentId: string | null) => {
  const { user } = useAuth();
  const [agent, setAgent] = useState<AgentWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingKnowledge, setProcessingKnowledge] = useState<Set<string>>(new Set());

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
        actions: (actions.data || []).map(a => ({
          ...a,
          config: (typeof a.config === 'object' && a.config !== null ? a.config : null) as AgentAction['config'],
        })),
      });
    } catch (error) {
      handleError(error, 'Fetching agent');
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
      handleError(error, 'Adding conversation starter');
    }
  };

  const removeConversationStarter = async (starterId: string) => {
    // Optimistic update
    const originalStarters = agent?.conversation_starters || [];
    if (agent) {
      setAgent({
        ...agent,
        conversation_starters: originalStarters.filter(s => s.id !== starterId),
      });
    }

    try {
      const { error } = await supabase
        .from('agent_conversation_starters')
        .delete()
        .eq('id', starterId);
      
      if (error) throw error;
    } catch (error) {
      // Rollback on failure
      if (agent) {
        setAgent({ ...agent, conversation_starters: originalStarters });
      }
      handleError(error, 'Removing conversation starter');
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
      handleError(error, 'Updating models');
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
      handleError(error, 'Updating capabilities');
    }
  };

  // Knowledge files with RAG processing
  const uploadKnowledge = async (file: File) => {
    if (!agentId || !user) return;
    
    try {
      const filePath = `${user.id}/${agentId}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('agent-knowledge')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Insert knowledge record
      const { data: knowledgeRecord, error: dbError } = await supabase
        .from('agent_knowledge')
        .insert({
          agent_id: agentId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          processing_status: 'pending',
        })
        .select()
        .single();
      
      if (dbError) throw dbError;
      
      toast.success('File uploaded! Processing for AI...');
      await fetchAgent();

      // Trigger RAG processing in background
      if (knowledgeRecord) {
        setProcessingKnowledge(prev => new Set(prev).add(knowledgeRecord.id));
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const response = await supabase.functions.invoke('process-knowledge', {
              body: { knowledgeId: knowledgeRecord.id, agentId },
            });

            if (response.error) {
              console.error('Processing error:', response.error);
              toast.error('Failed to process file for AI. You can still use it.');
            } else {
              toast.success('File processed and ready for AI!');
            }
          }
        } catch (procError) {
          console.error('Processing invocation error:', procError);
        } finally {
          setProcessingKnowledge(prev => {
            const next = new Set(prev);
            next.delete(knowledgeRecord.id);
            return next;
          });
          await fetchAgent();
        }
      }
    } catch (error) {
      handleError(error, 'Uploading knowledge file');
    }
  };

  const removeKnowledge = async (knowledgeId: string, filePath: string) => {
    // Optimistic update
    const originalKnowledge = agent?.knowledge || [];
    if (agent) {
      setAgent({
        ...agent,
        knowledge: originalKnowledge.filter(k => k.id !== knowledgeId),
      });
    }

    try {
      // Delete embeddings first
      await supabase.from('agent_embeddings').delete().eq('knowledge_id', knowledgeId);
      
      // Delete from storage
      await supabase.storage.from('agent-knowledge').remove([filePath]);
      
      // Delete record
      const { error } = await supabase.from('agent_knowledge').delete().eq('id', knowledgeId);
      
      if (error) throw error;
      
      toast.success('File removed');
    } catch (error) {
      // Rollback on failure
      if (agent) {
        setAgent({ ...agent, knowledge: originalKnowledge });
      }
      handleError(error, 'Removing knowledge file');
    }
  };

  return {
    agent,
    isLoading,
    processingKnowledge,
    addConversationStarter,
    removeConversationStarter,
    setModels,
    setCapabilities,
    uploadKnowledge,
    removeKnowledge,
    refreshAgent: fetchAgent,
  };
};
