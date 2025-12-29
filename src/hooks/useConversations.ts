/**
 * Conversations Hook - React Query Implementation
 * Modern state management with caching and optimistic updates
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Message, Conversation } from '@/types';
import * as conversationsService from '@/services/conversations';

const PAGE_SIZE = 50;
const QUERY_KEY = 'conversations';

export const useConversations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch conversations with infinite query for pagination
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [QUERY_KEY, user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      return conversationsService.fetchConversations({ page: pageParam, pageSize: PAGE_SIZE });
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined;
    },
    initialPageParam: 0,
    enabled: !!user,
  });

  // Flatten pages into conversations
  const allConversations = data?.pages.flatMap((page) => page.data) || [];
  const conversations = allConversations.filter((c) => !c.deletedAt);
  const deletedConversations = allConversations.filter((c) => c.deletedAt);

  // Save conversation mutation
  const saveConversationMutation = useMutation({
    mutationFn: async ({ messages, existingId }: { messages: Message[]; existingId?: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const title = conversationsService.truncateTitle(messages[0]?.content || 'New Conversation');
      
      if (existingId) {
        await conversationsService.updateConversation(existingId, title, messages);
        return existingId;
      } else {
        const conv = await conversationsService.createConversation(user.id, title, messages);
        return conv.id;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error) => {
      console.error('Failed to save conversation:', error);
      toast.error('Failed to save conversation');
    },
  });

  // Soft delete mutation
  const deleteConversationMutation = useMutation({
    mutationFn: conversationsService.softDeleteConversation,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY] });
      const previousData = queryClient.getQueryData([QUERY_KEY, user?.id]);
      return { previousData };
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast('Chat moved to trash', {
        action: {
          label: 'Undo',
          onClick: () => restoreConversationMutation.mutate(id),
        },
        duration: 5000,
      });
    },
    onError: (error, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([QUERY_KEY, user?.id], context.previousData);
      }
      console.error('Failed to delete conversation:', error);
      toast.error('Failed to delete conversation');
    },
  });

  // Restore mutation
  const restoreConversationMutation = useMutation({
    mutationFn: conversationsService.restoreConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Chat restored');
    },
    onError: (error) => {
      console.error('Failed to restore conversation:', error);
      toast.error('Failed to restore conversation');
    },
  });

  // Permanent delete mutation
  const permanentlyDeleteMutation = useMutation({
    mutationFn: conversationsService.deleteConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Chat permanently deleted');
    },
    onError: (error) => {
      console.error('Failed to permanently delete conversation:', error);
      toast.error('Failed to delete conversation');
    },
  });

  // Move to space mutation
  const moveToSpaceMutation = useMutation({
    mutationFn: ({ conversationId, spaceId }: { conversationId: string; spaceId: string | null }) =>
      conversationsService.moveConversationToSpace(conversationId, spaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error) => {
      console.error('Failed to move conversation:', error);
      toast.error('Failed to move conversation');
    },
  });

  // Helper functions
  const saveConversation = useCallback(async (
    messages: Message[],
    existingId?: string
  ): Promise<string | null> => {
    if (!user) return null;
    try {
      return await saveConversationMutation.mutateAsync({ messages, existingId });
    } catch {
      return null;
    }
  }, [user, saveConversationMutation]);

  const getConversation = useCallback((id: string): Conversation | undefined => {
    return conversations.find((c) => c.id === id);
  }, [conversations]);

  const getConversationsBySpace = useCallback((spaceId: string | null): Conversation[] => {
    if (spaceId === null) {
      return conversations.filter((c) => !c.spaceId);
    }
    return conversations.filter((c) => c.spaceId === spaceId);
  }, [conversations]);

  const loadMore = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    conversations,
    deletedConversations,
    isLoading,
    isSaving: saveConversationMutation.isPending,
    hasMore: hasNextPage ?? false,
    saveConversation,
    deleteConversation: deleteConversationMutation.mutate,
    restoreConversation: restoreConversationMutation.mutate,
    permanentlyDeleteConversation: permanentlyDeleteMutation.mutate,
    getConversation,
    moveToSpace: (conversationId: string, spaceId: string | null) => 
      moveToSpaceMutation.mutate({ conversationId, spaceId }),
    getConversationsBySpace,
    loadMore,
    refetch: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  };
};