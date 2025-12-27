import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/components/MessageList';

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  spaceId?: string;
}

export interface Space {
  id: string;
  name: string;
  icon?: string;
  createdAt: Date;
}

const CONVERSATIONS_KEY = 'ombrion-conversations';
const SPACES_KEY = 'ombrion-spaces';

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONVERSATIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setConversations(parsed.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
          messages: c.messages.map((m: any) => ({
            ...m,
            timestamp: m.timestamp ? new Date(m.timestamp) : undefined,
          })),
        })));
      }

      const savedSpaces = localStorage.getItem(SPACES_KEY);
      if (savedSpaces) {
        const parsed = JSON.parse(savedSpaces);
        setSpaces(parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
        })));
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, []);

  // Save to localStorage when conversations change
  useEffect(() => {
    try {
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  }, [conversations]);

  // Save spaces to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SPACES_KEY, JSON.stringify(spaces));
    } catch (error) {
      console.error('Failed to save spaces:', error);
    }
  }, [spaces]);

  const saveConversation = useCallback((messages: Message[], existingId?: string) => {
    const now = new Date();
    const title = messages[0]?.content.slice(0, 50) || 'New Conversation';
    
    if (existingId) {
      setConversations(prev => 
        prev.map(c => 
          c.id === existingId 
            ? { ...c, messages, updatedAt: now, title }
            : c
        )
      );
      return existingId;
    }

    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title,
      messages,
      createdAt: now,
      updatedAt: now,
    };

    setConversations(prev => [newConversation, ...prev]);
    return newConversation.id;
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
  }, []);

  const getConversation = useCallback((id: string) => {
    return conversations.find(c => c.id === id);
  }, [conversations]);

  const createSpace = useCallback((name: string) => {
    const newSpace: Space = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date(),
    };
    setSpaces(prev => [...prev, newSpace]);
    return newSpace;
  }, []);

  const deleteSpace = useCallback((id: string) => {
    setSpaces(prev => prev.filter(s => s.id !== id));
    // Remove space association from conversations
    setConversations(prev => 
      prev.map(c => 
        c.spaceId === id ? { ...c, spaceId: undefined } : c
      )
    );
  }, []);

  const moveToSpace = useCallback((conversationId: string, spaceId: string | undefined) => {
    setConversations(prev =>
      prev.map(c =>
        c.id === conversationId ? { ...c, spaceId } : c
      )
    );
  }, []);

  const getConversationsBySpace = useCallback((spaceId: string | undefined) => {
    if (spaceId === undefined) {
      return conversations.filter(c => !c.spaceId);
    }
    return conversations.filter(c => c.spaceId === spaceId);
  }, [conversations]);

  return {
    conversations,
    spaces,
    saveConversation,
    deleteConversation,
    getConversation,
    createSpace,
    deleteSpace,
    moveToSpace,
    getConversationsBySpace,
  };
};
