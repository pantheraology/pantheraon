import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { GroupChat, GroupChatWithMembers } from '@/types/groupChat';
import { handleError } from '@/lib/errors';
import { toast } from 'sonner';

const PAGE_SIZE = 50;

export const useGroupChats = () => {
  const { user } = useAuth();
  const [groupChats, setGroupChats] = useState<GroupChatWithMembers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchGroupChats = useCallback(async (reset: boolean = true) => {
    if (!user) {
      setGroupChats([]);
      setIsLoading(false);
      return;
    }

    try {
      const currentPage = reset ? 0 : page;
      
      // Get all groups user is a member of
      const { data: memberships, error: memberError } = await supabase
        .from('group_chat_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      if (!memberships || memberships.length === 0) {
        setGroupChats([]);
        setIsLoading(false);
        return;
      }

      const groupIds = memberships.map(m => m.group_id);

      // Fetch group details with pagination
      const { data: groups, error: groupError } = await supabase
        .from('group_chats')
        .select('*')
        .in('id', groupIds)
        .order('updated_at', { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (groupError) throw groupError;

      const groupsList = groups || [];
      setHasMore(groupsList.length === PAGE_SIZE);

      // Fetch member counts for each group
      const groupsWithMembers: GroupChatWithMembers[] = await Promise.all(
        groupsList.map(async (group) => {
          const { count } = await supabase
            .from('group_chat_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          return {
            ...group,
            members: [],
            member_count: count || 0,
          };
        })
      );

      if (reset) {
        setGroupChats(groupsWithMembers);
        setPage(1);
      } else {
        setGroupChats(prev => [...prev, ...groupsWithMembers]);
        setPage(currentPage + 1);
      }
    } catch (error) {
      handleError(error, 'Fetching group chats');
    } finally {
      setIsLoading(false);
    }
  }, [user, page]);

  useEffect(() => {
    fetchGroupChats(true);
  }, [user]);

  const loadMore = useCallback(async () => {
    if (hasMore && !isLoading) {
      await fetchGroupChats(false);
    }
  }, [hasMore, isLoading, fetchGroupChats]);

  const createGroupChat = async (name: string, description?: string) => {
    if (!user) {
      toast.error('You must be logged in to create a group');
      return null;
    }

    try {
      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('group_chats')
        .insert({
          name,
          description,
          created_by: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin
      const { error: memberError } = await supabase
        .from('group_chat_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin',
        });

      if (memberError) throw memberError;

      toast.success('Group created successfully!');
      await fetchGroupChats(true);
      return group;
    } catch (error) {
      handleError(error, 'Creating group');
      return null;
    }
  };

  const inviteMember = async (groupId: string, identifier: string) => {
    if (!user) return { error: 'Not authenticated' };

    // Validate and sanitize input
    const sanitizedIdentifier = identifier.trim();
    if (!sanitizedIdentifier || sanitizedIdentifier.length > 255) {
      return { error: 'Invalid username or email' };
    }

    try {
      // Try to find user by username first (using safe parameterized query)
      let targetUser: { id: string; username: string | null; email: string | null } | null = null;
      
      const { data: userByUsername, error: usernameError } = await supabase
        .from('profiles')
        .select('id, username, email')
        .eq('username', sanitizedIdentifier)
        .maybeSingle();

      if (usernameError) throw usernameError;
      
      if (userByUsername) {
        targetUser = userByUsername;
      } else {
        // If not found by username, try email (using safe parameterized query)
        const { data: userByEmail, error: emailError } = await supabase
          .from('profiles')
          .select('id, username, email')
          .eq('email', sanitizedIdentifier)
          .maybeSingle();

        if (emailError) throw emailError;
        targetUser = userByEmail;
      }

      if (!targetUser) {
        return { error: 'User not found. Check the username or email.' };
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('group_chat_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', targetUser.id)
        .maybeSingle();

      if (existing) {
        return { error: 'User is already a member of this group' };
      }

      // Add as member
      const { error: addError } = await supabase
        .from('group_chat_members')
        .insert({
          group_id: groupId,
          user_id: targetUser.id,
          role: 'member',
        });

      if (addError) throw addError;

      toast.success('Member invited successfully!');
      return { error: null };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to invite member';
      handleError(error, 'Inviting member', { showToast: false });
      return { error: errorMessage };
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;

    // Optimistic update
    const originalGroup = groupChats.find(g => g.id === groupId);
    setGroupChats(prev => prev.filter(g => g.id !== groupId));

    try {
      const { error } = await supabase
        .from('group_chat_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Left the group');
    } catch (error) {
      // Rollback on failure
      if (originalGroup) {
        setGroupChats(prev => [originalGroup, ...prev]);
      }
      handleError(error, 'Leaving group');
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!user) return;

    // Optimistic update
    const originalGroup = groupChats.find(g => g.id === groupId);
    setGroupChats(prev => prev.filter(g => g.id !== groupId));

    try {
      const { error } = await supabase
        .from('group_chats')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      toast.success('Group deleted');
    } catch (error) {
      // Rollback on failure
      if (originalGroup) {
        setGroupChats(prev => [originalGroup, ...prev]);
      }
      handleError(error, 'Deleting group');
    }
  };

  return {
    groupChats,
    isLoading,
    hasMore,
    createGroupChat,
    inviteMember,
    leaveGroup,
    deleteGroup,
    loadMore,
    refreshGroupChats: () => fetchGroupChats(true),
  };
};

// Re-export useGroupChat from its separate file
export { useGroupChat } from './useGroupChat';
