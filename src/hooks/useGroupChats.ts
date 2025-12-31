/**
 * Group Chats Hook - React Query Implementation
 * Modern state management with caching and optimistic updates
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { GroupChatWithMembers } from '@/types/groupChat';
import * as groupChatsService from '@/services/groupChats';
import { handleError } from '@/lib/errors';

const PAGE_SIZE = 50;
const QUERY_KEY = 'groupChats';

export const useGroupChats = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch group chats with infinite query for pagination
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
      return groupChatsService.fetchGroupChats(user.id, { page: pageParam, pageSize: PAGE_SIZE });
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined;
    },
    initialPageParam: 0,
    enabled: !!user,
  });

  // Flatten pages into group chats
  const groupChats = (data?.pages.flatMap((page) => page.data) || []) as GroupChatWithMembers[];

  // Create group chat mutation
  const createGroupChatMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      if (!user) throw new Error('Not authenticated');
      return groupChatsService.createGroupChat(user.id, name, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Group created successfully!');
    },
    onError: (error) => {
      handleError(error, 'Creating group');
    },
  });

  // Leave group mutation
  const leaveGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      if (!user) throw new Error('Not authenticated');
      return groupChatsService.leaveGroupChat(groupId, user.id);
    },
    onMutate: async (groupId) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY] });
      const previousData = queryClient.getQueryData([QUERY_KEY, user?.id]);
      return { previousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Left the group');
    },
    onError: (error, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([QUERY_KEY, user?.id], context.previousData);
      }
      handleError(error, 'Leaving group');
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: groupChatsService.deleteGroupChat,
    onMutate: async (groupId) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY] });
      const previousData = queryClient.getQueryData([QUERY_KEY, user?.id]);
      return { previousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Group deleted');
    },
    onError: (error, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([QUERY_KEY, user?.id], context.previousData);
      }
      handleError(error, 'Deleting group');
    },
  });

  // Invite member mutation
  const inviteMemberMutation = useMutation({
    mutationFn: async ({ groupId, username }: { groupId: string; username: string }) => {
      const result = await groupChatsService.inviteMember(groupId, username);
      if (!result) {
        throw new Error('User not found. Check the username.');
      }
      return result;
    },
    onSuccess: () => {
      toast.success('Member invited successfully!');
    },
    onError: (error) => {
      handleError(error, 'Inviting member', { showToast: true });
    },
  });

  // Helper functions
  const createGroupChat = useCallback(async (name: string, description?: string) => {
    if (!user) {
      toast.error('You must be logged in to create a group');
      return null;
    }
    try {
      return await createGroupChatMutation.mutateAsync({ name, description });
    } catch {
      return null;
    }
  }, [user, createGroupChatMutation]);

  const inviteMember = useCallback(async (groupId: string, identifier: string) => {
    const sanitizedIdentifier = identifier.trim();
    if (!sanitizedIdentifier || sanitizedIdentifier.length > 255) {
      return { error: 'Invalid username' };
    }
    try {
      await inviteMemberMutation.mutateAsync({ groupId, username: sanitizedIdentifier });
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to invite member' };
    }
  }, [inviteMemberMutation]);

  const leaveGroup = useCallback((groupId: string) => {
    leaveGroupMutation.mutate(groupId);
  }, [leaveGroupMutation]);

  const deleteGroup = useCallback((groupId: string) => {
    deleteGroupMutation.mutate(groupId);
  }, [deleteGroupMutation]);

  const loadMore = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    groupChats,
    isLoading,
    hasMore: hasNextPage ?? false,
    createGroupChat,
    inviteMember,
    leaveGroup,
    deleteGroup,
    loadMore,
    refreshGroupChats: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  };
};

// Re-export useGroupChat from its separate file
export { useGroupChat } from './useGroupChat';
