/**
 * Hook for managing a single group chat with messages and members
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { GroupChat, GroupChatMember, GroupMessage } from '@/types/groupChat';
import { handleError } from '@/lib/errors';
import { toast } from 'sonner';

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
      
      // Fetch profiles for members - exclude email to prevent PII exposure
      // Only fetch non-sensitive profile fields for group members
      const memberUserIds = (membersData || []).map(m => m.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, username')
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
      handleError(error, 'Fetching group', { showToast: false });
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
      handleError(error, 'Sending message');
    }
  };

  const removeMember = async (memberId: string) => {
    if (!isAdmin) return;

    // Optimistic update
    const originalMember = members.find(m => m.id === memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));

    try {
      const { error } = await supabase
        .from('group_chat_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Member removed');
    } catch (error) {
      // Rollback on failure
      if (originalMember) {
        setMembers(prev => [...prev, originalMember]);
      }
      handleError(error, 'Removing member');
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
