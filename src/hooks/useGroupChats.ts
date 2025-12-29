import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { GroupChat, GroupChatMember, GroupMessage, GroupChatWithMembers } from '@/types/groupChat';
import { toast } from 'sonner';

export const useGroupChats = () => {
  const { user } = useAuth();
  const [groupChats, setGroupChats] = useState<GroupChatWithMembers[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGroupChats = useCallback(async () => {
    if (!user) {
      setGroupChats([]);
      setIsLoading(false);
      return;
    }

    try {
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

      // Fetch group details
      const { data: groups, error: groupError } = await supabase
        .from('group_chats')
        .select('*')
        .in('id', groupIds)
        .order('updated_at', { ascending: false });

      if (groupError) throw groupError;

      // Fetch member counts for each group
      const groupsWithMembers: GroupChatWithMembers[] = await Promise.all(
        (groups || []).map(async (group) => {
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

      setGroupChats(groupsWithMembers);
    } catch (error) {
      console.error('Error fetching group chats:', error);
      toast.error('Failed to load group chats');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGroupChats();
  }, [fetchGroupChats]);

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
      await fetchGroupChats();
      return group;
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
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
    } catch (error: any) {
      console.error('Error inviting member:', error);
      return { error: error.message || 'Failed to invite member' };
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('group_chat_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Left the group');
      await fetchGroupChats();
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error('Failed to leave group');
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('group_chats')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      toast.success('Group deleted');
      await fetchGroupChats();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  return {
    groupChats,
    isLoading,
    createGroupChat,
    inviteMember,
    leaveGroup,
    deleteGroup,
    refreshGroupChats: fetchGroupChats,
  };
};

// Hook for a single group chat with messages and members
export const useGroupChat = (groupId: string | null) => {
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupChat | null>(null);
  const [members, setMembers] = useState<GroupChatMember[]>([]);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchGroup = useCallback(async () => {
    if (!groupId || !user) {
      setGroup(null);
      setMembers([]);
      setMessages([]);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch group details
      const { data: groupData, error: groupError } = await supabase
        .from('group_chats')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('group_chat_members')
        .select('*')
        .eq('group_id', groupId);

      if (membersError) throw membersError;
      
      // Fetch profiles for members
      const memberUserIds = (membersData || []).map(m => m.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, email, username')
        .in('id', memberUserIds);
      
      const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
      
      const processedMembers: GroupChatMember[] = (membersData || []).map(m => ({
        ...m,
        role: m.role as 'admin' | 'member',
        profile: profilesMap.get(m.user_id) || undefined,
      }));
      setMembers(processedMembers);

      // Check if current user is admin
      const currentMember = processedMembers.find(m => m.user_id === user.id);
      setIsAdmin(currentMember?.role === 'admin');

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      
      // Fetch sender profiles for messages
      const senderIds = [...new Set((messagesData || []).map(m => m.sender_id))];
      const { data: sendersData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, username')
        .in('id', senderIds);
      
      const sendersMap = new Map((sendersData || []).map(s => [s.id, s]));
      
      const processedMessages: GroupMessage[] = (messagesData || []).map(m => ({
        ...m,
        sender: sendersMap.get(m.sender_id) || undefined,
      }));
      setMessages(processedMessages);
    } catch (error) {
      console.error('Error fetching group:', error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, user]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`group-messages-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          // Fetch the sender profile for the new message
          const { data: senderData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, username')
            .eq('id', payload.new.sender_id)
            .single();

          const newMessage: GroupMessage = {
            ...(payload.new as GroupMessage),
            sender: senderData,
          };

          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  const sendMessage = async (content: string) => {
    if (!groupId || !user || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          sender_id: user.id,
          content: content.trim(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const removeMember = async (memberId: string) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('group_chat_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast.success('Member removed');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  return {
    group,
    members,
    messages,
    isLoading,
    isAdmin,
    sendMessage,
    removeMember,
    refreshGroup: fetchGroup,
  };
};
