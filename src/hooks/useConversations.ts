import { useState, useCallback } from 'react';
import { Message, Conversation } from '@/types';
import { useLocalStorage } from './useLocalStorage';
import { useSpaces } from './useSpaces';
import { STORAGE_KEYS } from '@/config/storage';
import { parseStoredDate, toStoredDate } from '@/lib/utils';

interface StoredConversation {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  spaceId?: string;
}

export const useConversations = () => {
  const [storedConversations, setStoredConversations] = useLocalStorage<StoredConversation[]>(
    STORAGE_KEYS.CONVERSATIONS,
    []
  );
  
  // Re-export spaces functionality for backward compatibility
  const { spaces, createSpace, deleteSpace: deleteSpaceBase, getSpace } = useSpaces();

  // Parse dates from stored format
  const conversations: Conversation[] = storedConversations.map((c) => ({
    ...c,
    createdAt: parseStoredDate(c.createdAt),
    updatedAt: parseStoredDate(c.updatedAt),
    messages: c.messages.map((m) => ({
      ...m,
      timestamp: m.timestamp ? parseStoredDate(m.timestamp) : undefined,
    })),
  }));

  const saveConversation = useCallback(
    (messages: Message[], existingId?: string): string => {
      const now = new Date();
      const title = messages[0]?.content.slice(0, 50) || 'New Conversation';

      if (existingId) {
        setStoredConversations((prev) =>
          prev.map((c) =>
            c.id === existingId
              ? {
                  ...c,
                  messages: messages.map((m) => ({
                    ...m,
                    timestamp: m.timestamp ? toStoredDate(m.timestamp) : undefined,
                  })),
                  updatedAt: toStoredDate(now),
                  title,
                }
              : c
          )
        );
        return existingId;
      }

      const newId = crypto.randomUUID();
      const newConversation: StoredConversation = {
        id: newId,
        title,
        messages: messages.map((m) => ({
          ...m,
          timestamp: m.timestamp ? toStoredDate(m.timestamp) : undefined,
        })),
        createdAt: toStoredDate(now),
        updatedAt: toStoredDate(now),
      };

      setStoredConversations((prev) => [newConversation, ...prev]);
      return newId;
    },
    [setStoredConversations]
  );

  const deleteConversation = useCallback(
    (id: string) => {
      setStoredConversations((prev) => prev.filter((c) => c.id !== id));
    },
    [setStoredConversations]
  );

  const getConversation = useCallback(
    (id: string): Conversation | undefined => {
      return conversations.find((c) => c.id === id);
    },
    [conversations]
  );

  const deleteSpace = useCallback(
    (id: string) => {
      deleteSpaceBase(id);
      // Remove space association from conversations
      setStoredConversations((prev) =>
        prev.map((c) => (c.spaceId === id ? { ...c, spaceId: undefined } : c))
      );
    },
    [deleteSpaceBase, setStoredConversations]
  );

  const moveToSpace = useCallback(
    (conversationId: string, spaceId: string | undefined) => {
      setStoredConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, spaceId } : c))
      );
    },
    [setStoredConversations]
  );

  const getConversationsBySpace = useCallback(
    (spaceId: string | undefined): Conversation[] => {
      if (spaceId === undefined) {
        return conversations.filter((c) => !c.spaceId);
      }
      return conversations.filter((c) => c.spaceId === spaceId);
    },
    [conversations]
  );

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
