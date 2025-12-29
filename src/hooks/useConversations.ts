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
}

interface DbMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch conversations with messages from database
  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch conversations
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

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

      const parsedConversations: Conversation[] = (convData as DbConversation[]).map((c) => ({
        id: c.id,
        title: c.title,
        messages: messagesMap[c.id] || [],
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
        spaceId: c.space_id,
      }));

      setConversations(parsedConversations);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const saveConversation = useCallback(async (
    messages: Message[],
    existingId?: string
  ): Promise<string | null> => {
    if (!user) return null;

    const title = messages[0]?.content.slice(0, 50) || 'New Conversation';

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
        };

        setConversations((prev) => [newConversation, ...prev]);
        return convData.id;
      }
    } catch (error) {
      console.error('Failed to save conversation:', error);
      toast.error('Failed to save conversation');
      return null;
    }
  }, [user]);

  const deleteConversation = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error('Failed to delete conversation');
    }
  }, [user]);

  const getConversation = useCallback((id: string): Conversation | undefined => {
    return conversations.find((c) => c.id === id);
  }, [conversations]);

  const moveToSpace = useCallback(async (conversationId: string, spaceId: string | null) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ space_id: spaceId })
        .eq('id', conversationId);

      if (error) throw error;

      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, spaceId } : c))
      );
    } catch (error) {
      console.error('Failed to move conversation:', error);
      toast.error('Failed to move conversation');
    }
  }, [user]);

  const getConversationsBySpace = useCallback((spaceId: string | null): Conversation[] => {
    if (spaceId === null) {
      return conversations.filter((c) => !c.spaceId);
    }
    return conversations.filter((c) => c.spaceId === spaceId);
  }, [conversations]);

  return {
    conversations,
    isLoading,
    saveConversation,
    deleteConversation,
    getConversation,
    moveToSpace,
    getConversationsBySpace,
    refetch: fetchConversations,
  };
};
