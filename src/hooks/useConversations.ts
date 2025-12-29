import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Message, Conversation } from '@/types';

interface DbConversation {
  id: string;
  user_id: string;
  space_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface DbMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const PAGE_SIZE = 50;

// Helper to truncate title with ellipsis
const truncateTitle = (content: string, maxLength: number = 50): string => {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength - 1) + '…';
};

export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [deletedConversations, setDeletedConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Fetch conversations with messages from database
  const fetchConversations = useCallback(async (reset: boolean = true) => {
    if (!user) {
      setConversations([]);
      setDeletedConversations([]);
      setIsLoading(false);
      return;
    }

    try {
      const currentPage = reset ? 0 : page;
      
      // Fetch paginated conversations (both active and deleted)
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (convError) throw convError;

      // Check if we have more data
      setHasMore((convData?.length || 0) === PAGE_SIZE);
      if (!reset) {
        setPage(currentPage + 1);
      } else {
        setPage(1);
      }

      // Fetch all messages for these conversations
      const conversationIds = (convData as DbConversation[]).map((c) => c.id);
      
      let messagesMap: Record<string, Message[]> = {};
      
      if (conversationIds.length > 0) {
        const { data: msgData, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: true });

        if (msgError) throw msgError;

        // Group messages by conversation
        (msgData as DbMessage[]).forEach((m) => {
          if (!messagesMap[m.conversation_id]) {
            messagesMap[m.conversation_id] = [];
          }
          messagesMap[m.conversation_id].push({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.created_at),
          });
        });
      }

      const newConversations: Conversation[] = (convData as DbConversation[]).map((c) => ({
        id: c.id,
        title: c.title,
        messages: messagesMap[c.id] || [],
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
        spaceId: c.space_id,
        deletedAt: c.deleted_at ? new Date(c.deleted_at) : null,
      }));

      if (reset) {
        // Split into active and deleted
        setConversations(newConversations.filter((c) => !c.deletedAt));
        setDeletedConversations(newConversations.filter((c) => c.deletedAt));
      } else {
        // Append to existing
        setConversations(prev => [...prev, ...newConversations.filter((c) => !c.deletedAt)]);
        setDeletedConversations(prev => [...prev, ...newConversations.filter((c) => c.deletedAt)]);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [user, page]);

  useEffect(() => {
    fetchConversations(true);
  }, [user]); // Only refetch when user changes

  const loadMore = useCallback(async () => {
    if (hasMore && !isLoading) {
      await fetchConversations(false);
    }
  }, [hasMore, isLoading, fetchConversations]);

  const saveConversation = useCallback(async (
    messages: Message[],
    existingId?: string
  ): Promise<string | null> => {
    if (!user) return null;

    const title = truncateTitle(messages[0]?.content || 'New Conversation');

    setIsSaving(true);
    try {
      if (existingId) {
        // Update existing conversation
        const { error: convError } = await supabase
          .from('conversations')
          .update({ title, updated_at: new Date().toISOString() })
          .eq('id', existingId);

        if (convError) throw convError;

        // Get existing message IDs
        const { data: existingMessages } = await supabase
          .from('messages')
          .select('id')
          .eq('conversation_id', existingId);

        const existingIds = new Set((existingMessages || []).map((m) => m.id));

        // Insert only new messages
        const newMessages = messages.filter((m) => !existingIds.has(m.id));
        
        if (newMessages.length > 0) {
          const { error: msgError } = await supabase
            .from('messages')
            .insert(
              newMessages.map((m) => ({
                id: m.id,
                conversation_id: existingId,
                role: m.role,
                content: m.content,
                created_at: m.timestamp?.toISOString() || new Date().toISOString(),
              }))
            );

          if (msgError) throw msgError;
        }

        // Update local state
        setConversations((prev) =>
          prev.map((c) =>
            c.id === existingId
              ? { ...c, title, messages, updatedAt: new Date() }
              : c
          )
        );

        return existingId;
      } else {
        // Create new conversation
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .insert({ title, user_id: user.id })
          .select()
          .single();

        if (convError) throw convError;

        // Insert messages
        if (messages.length > 0) {
          const { error: msgError } = await supabase
            .from('messages')
            .insert(
              messages.map((m) => ({
                id: m.id,
                conversation_id: convData.id,
                role: m.role,
                content: m.content,
                created_at: m.timestamp?.toISOString() || new Date().toISOString(),
              }))
            );

          if (msgError) throw msgError;
        }

        const newConversation: Conversation = {
          id: convData.id,
          title,
          messages,
          createdAt: new Date(convData.created_at),
          updatedAt: new Date(convData.updated_at),
          spaceId: convData.space_id,
          deletedAt: null,
        };

        setConversations((prev) => [newConversation, ...prev]);
        return convData.id;
      }
    } catch (error) {
      console.error('Failed to save conversation:', error);
      toast.error('Failed to save conversation');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  // Soft delete - move to trash with undo option
  const deleteConversation = useCallback(async (id: string) => {
    if (!user) return;

    // Optimistically update UI
    const conversation = conversations.find((c) => c.id === id);
    if (!conversation) return;

    const deletedConv = { ...conversation, deletedAt: new Date() };
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setDeletedConversations((prev) => [deletedConv, ...prev]);

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      // Show undo toast
      toast('Chat moved to trash', {
        action: {
          label: 'Undo',
          onClick: async () => {
            await restoreConversation(id);
          },
        },
        duration: 5000,
      });
    } catch (error) {
      // Rollback on failure
      console.error('Failed to delete conversation:', error);
      setConversations((prev) => [conversation, ...prev]);
      setDeletedConversations((prev) => prev.filter((c) => c.id !== id));
      toast.error('Failed to delete conversation');
    }
  }, [user, conversations]);

  // Restore from trash
  const restoreConversation = useCallback(async (id: string) => {
    if (!user) return;

    // Optimistically update UI
    const conversation = deletedConversations.find((c) => c.id === id);
    if (!conversation) return;

    const restoredConv = { ...conversation, deletedAt: null };
    setDeletedConversations((prev) => prev.filter((c) => c.id !== id));
    setConversations((prev) => [restoredConv, ...prev]);

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ deleted_at: null })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Chat restored');
    } catch (error) {
      // Rollback on failure
      console.error('Failed to restore conversation:', error);
      setDeletedConversations((prev) => [conversation, ...prev]);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      toast.error('Failed to restore conversation');
    }
  }, [user, deletedConversations]);

  // Permanent delete
  const permanentlyDeleteConversation = useCallback(async (id: string) => {
    if (!user) return;

    // Optimistically update UI
    const conversation = deletedConversations.find((c) => c.id === id);
    setDeletedConversations((prev) => prev.filter((c) => c.id !== id));

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Chat permanently deleted');
    } catch (error) {
      // Rollback on failure
      console.error('Failed to permanently delete conversation:', error);
      if (conversation) {
        setDeletedConversations((prev) => [conversation, ...prev]);
      }
      toast.error('Failed to delete conversation');
    }
  }, [user, deletedConversations]);

  const getConversation = useCallback((id: string): Conversation | undefined => {
    return conversations.find((c) => c.id === id);
  }, [conversations]);

  const moveToSpace = useCallback(async (conversationId: string, spaceId: string | null) => {
    if (!user) return;

    // Optimistic update
    const originalConv = conversations.find(c => c.id === conversationId);
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, spaceId } : c))
    );

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ space_id: spaceId })
        .eq('id', conversationId);

      if (error) throw error;
    } catch (error) {
      // Rollback on failure
      console.error('Failed to move conversation:', error);
      if (originalConv) {
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? originalConv : c))
        );
      }
      toast.error('Failed to move conversation');
    }
  }, [user, conversations]);

  const getConversationsBySpace = useCallback((spaceId: string | null): Conversation[] => {
    if (spaceId === null) {
      return conversations.filter((c) => !c.spaceId);
    }
    return conversations.filter((c) => c.spaceId === spaceId);
  }, [conversations]);

  return {
    conversations,
    deletedConversations,
    isLoading,
    isSaving,
    hasMore,
    saveConversation,
    deleteConversation,
    restoreConversation,
    permanentlyDeleteConversation,
    getConversation,
    moveToSpace,
    getConversationsBySpace,
    loadMore,
    refetch: () => fetchConversations(true),
  };
};
