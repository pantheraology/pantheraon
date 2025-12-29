/**
 * Agents Hook - React Query Implementation
 * Modern state management with caching and optimistic updates
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Agent } from '@/types/agent';
import { handleError } from '@/lib/errors';
import { toast } from 'sonner';
import * as agentsService from '@/services/agents';

const PAGE_SIZE = 50;
const QUERY_KEY = 'agents';

export const useAgents = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch agents with infinite query for pagination
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [QUERY_KEY, user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user) return { data: [], hasMore: false };
      return agentsService.fetchAgents(user.id, { page: pageParam, pageSize: PAGE_SIZE });
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined;
    },
    initialPageParam: 0,
    enabled: !!user,
  });

  // Flatten pages into agents
  const agents = (data?.pages.flatMap((page) => page.data) || []) as Agent[];
  const mainAgent = agents.find((a) => a.is_main) || null;

  // Create agent mutation
  const createAgentMutation = useMutation({
    mutationFn: async (params: {
      name: string;
      isMain?: boolean;
      description?: string;
      instructions?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      return agentsService.createAgent({
        userId: user.id,
        name: params.name,
        description: params.description,
        instructions: params.instructions,
        isMain: params.isMain,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(`Agent "${data.name}" created!`);
    },
    onError: (error) => {
      handleError(error, 'Creating agent');
    },
  });

  // Update agent mutation
  const updateAgentMutation = useMutation({
    mutationFn: async ({ agentId, updates }: {
      agentId: string;
      updates: Partial<Pick<Agent, 'name' | 'description' | 'instructions' | 'is_main'>>;
    }) => {
      if (!user) throw new Error('Not authenticated');
      await agentsService.updateAgent(agentId, user.id, updates);
    },
    onMutate: async ({ agentId, updates }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY] });
      const previousData = queryClient.getQueryData([QUERY_KEY, user?.id]);
      return { previousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Agent updated!');
    },
    onError: (error, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([QUERY_KEY, user?.id], context.previousData);
      }
      handleError(error, 'Updating agent');
    },
  });

  // Delete agent mutation
  const deleteAgentMutation = useMutation({
    mutationFn: agentsService.deleteAgent,
    onMutate: async (agentId) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY] });
      const previousData = queryClient.getQueryData([QUERY_KEY, user?.id]);
      return { previousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Agent deleted');
    },
    onError: (error, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([QUERY_KEY, user?.id], context.previousData);
      }
      handleError(error, 'Deleting agent');
    },
  });

  // Helper functions
  const createAgent = useCallback(async (
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
      return await createAgentMutation.mutateAsync({ name, isMain, description, instructions });
    } catch {
      return null;
    }
  }, [user, createAgentMutation]);

  const updateAgent = useCallback(async (
    agentId: string,
    updates: Partial<Pick<Agent, 'name' | 'description' | 'instructions' | 'is_main'>>
  ): Promise<boolean> => {
    if (!user) return false;
    try {
      await updateAgentMutation.mutateAsync({ agentId, updates });
      return true;
    } catch {
      return false;
    }
  }, [user, updateAgentMutation]);

  const deleteAgent = useCallback(async (agentId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      await deleteAgentMutation.mutateAsync(agentId);
      return true;
    } catch {
      return false;
    }
  }, [user, deleteAgentMutation]);

  const loadMore = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    agents,
    mainAgent,
    isLoading,
    hasMore: hasNextPage ?? false,
    createAgent,
    updateAgent,
    deleteAgent,
    loadMore,
    refreshAgents: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  };
};

// Re-export useAgent from its separate file
export { useAgent } from './useAgent';