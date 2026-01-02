import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Space } from '@/types';
import {
  fetchSpaces,
  createSpace as createSpaceService,
  deleteSpace as deleteSpaceService,
} from '@/services/spaces';

const SPACES_QUERY_KEY = ['spaces'];

export const useSpaces = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch spaces with React Query
  const {
    data: spacesData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: SPACES_QUERY_KEY,
    queryFn: async () => {
      if (!user) return { data: [], hasMore: false };
      return fetchSpaces(user.id);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const spaces = spacesData?.data ?? [];

  // Create space mutation
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('Not authenticated');
      return createSpaceService(user.id, name);
    },
    onSuccess: (newSpace) => {
      queryClient.setQueryData(SPACES_QUERY_KEY, (old: { data: Space[]; hasMore: boolean } | undefined) => ({
        data: [newSpace, ...(old?.data ?? [])],
        hasMore: old?.hasMore ?? false,
      }));
    },
    onError: (error) => {
      console.error('Failed to create space:', error);
      toast.error('Failed to create space');
    },
  });

  // Delete space mutation
  const deleteMutation = useMutation({
    mutationFn: deleteSpaceService,
    onMutate: async (spaceId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: SPACES_QUERY_KEY });

      // Snapshot the previous value
      const previousSpaces = queryClient.getQueryData(SPACES_QUERY_KEY);

      // Optimistically update
      queryClient.setQueryData(SPACES_QUERY_KEY, (old: { data: Space[]; hasMore: boolean } | undefined) => ({
        data: (old?.data ?? []).filter((s) => s.id !== spaceId),
        hasMore: old?.hasMore ?? false,
      }));

      return { previousSpaces };
    },
    onError: (error, _spaceId, context) => {
      // Rollback on error
      if (context?.previousSpaces) {
        queryClient.setQueryData(SPACES_QUERY_KEY, context.previousSpaces);
      }
      console.error('Failed to delete space:', error);
      toast.error('Failed to delete space');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SPACES_QUERY_KEY });
    },
  });

  const createSpace = useCallback(async (name: string): Promise<Space | null> => {
    if (!user) {
      toast.error('Please sign in to create spaces');
      return null;
    }

    try {
      return await createMutation.mutateAsync(name);
    } catch {
      return null;
    }
  }, [user, createMutation]);

  const deleteSpace = useCallback(async (id: string) => {
    if (!user) return;
    await deleteMutation.mutateAsync(id);
  }, [user, deleteMutation]);

  const getSpace = useCallback((id: string): Space | undefined => {
    return spaces.find((s) => s.id === id);
  }, [spaces]);

  return {
    spaces,
    isLoading,
    createSpace,
    deleteSpace,
    getSpace,
    refetch,
  };
};
