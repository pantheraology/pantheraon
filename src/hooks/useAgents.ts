import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Agent } from '@/types/agent';
import { handleError } from '@/lib/errors';
import { toast } from 'sonner';

const PAGE_SIZE = 50;

export const useAgents = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [mainAgent, setMainAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchAgents = useCallback(async (reset: boolean = true) => {
    if (!user) {
      setAgents([]);
      setMainAgent(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentPage = reset ? 0 : page;
      
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (error) throw error;

      const agentsList = data || [];
      setHasMore(agentsList.length === PAGE_SIZE);
      
      if (reset) {
        setAgents(agentsList);
        setPage(1);
      } else {
        setAgents(prev => [...prev, ...agentsList]);
        setPage(currentPage + 1);
      }
      
      setMainAgent(agentsList.find(a => a.is_main) || null);
    } catch (error) {
      handleError(error, 'Fetching agents');
    } finally {
      setIsLoading(false);
    }
  }, [user, page]);

  useEffect(() => {
    fetchAgents(true);
  }, [user]);

  const loadMore = useCallback(async () => {
    if (hasMore && !isLoading) {
      await fetchAgents(false);
    }
  }, [hasMore, isLoading, fetchAgents]);

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
      await fetchAgents(true);
      return data;
    } catch (error) {
      handleError(error, 'Creating agent');
      return null;
    }
  };

  const updateAgent = async (
    agentId: string,
    updates: Partial<Pick<Agent, 'name' | 'description' | 'instructions' | 'is_main'>>
  ): Promise<boolean> => {
    if (!user) return false;

    // Optimistic update
    const originalAgent = agents.find(a => a.id === agentId);
    if (originalAgent) {
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, ...updates } : a));
    }

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
      await fetchAgents(true);
      return true;
    } catch (error) {
      // Rollback on failure
      if (originalAgent) {
        setAgents(prev => prev.map(a => a.id === agentId ? originalAgent : a));
      }
      handleError(error, 'Updating agent');
      return false;
    }
  };

  const deleteAgent = async (agentId: string): Promise<boolean> => {
    if (!user) return false;

    // Optimistic update
    const originalAgent = agents.find(a => a.id === agentId);
    setAgents(prev => prev.filter(a => a.id !== agentId));

    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentId);

      if (error) throw error;

      toast.success('Agent deleted');
      return true;
    } catch (error) {
      // Rollback on failure
      if (originalAgent) {
        setAgents(prev => [originalAgent, ...prev]);
      }
      handleError(error, 'Deleting agent');
      return false;
    }
  };

  return {
    agents,
    mainAgent,
    isLoading,
    hasMore,
    createAgent,
    updateAgent,
    deleteAgent,
    loadMore,
    refreshAgents: () => fetchAgents(true),
  };
};

// Re-export useAgent from its separate file
export { useAgent } from './useAgent';
