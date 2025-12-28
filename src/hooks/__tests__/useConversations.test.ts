import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConversations } from '../useConversations';
import { Message } from '@/types';

describe('useConversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  it('should initialize with empty conversations and spaces', () => {
    const { result } = renderHook(() => useConversations());
    
    expect(result.current.conversations).toEqual([]);
    expect(result.current.spaces).toEqual([]);
  });

  it('should load conversations from localStorage on mount', () => {
    const savedConversations = [
      {
        id: 'conv-1',
        title: 'Test Conversation',
        messages: [{ id: 'msg-1', role: 'user', content: 'Hello' }],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];
    
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'pantheraon-conversations') {
        return JSON.stringify(savedConversations);
      }
      return null;
    });

    const { result } = renderHook(() => useConversations());
    
    expect(result.current.conversations.length).toBe(1);
    expect(result.current.conversations[0].title).toBe('Test Conversation');
  });

  it('should save a new conversation', () => {
    const { result } = renderHook(() => useConversations());
    
    const messages: Message[] = [
      { id: 'msg-1', role: 'user', content: 'Hello, AI!', timestamp: new Date() },
      { id: 'msg-2', role: 'assistant', content: 'Hi there!', timestamp: new Date() },
    ];

    let conversationId: string;
    act(() => {
      conversationId = result.current.saveConversation(messages);
    });

    expect(result.current.conversations.length).toBe(1);
    expect(result.current.conversations[0].title).toBe('Hello, AI!');
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('should update an existing conversation', () => {
    const { result } = renderHook(() => useConversations());
    
    const initialMessages: Message[] = [
      { id: 'msg-1', role: 'user', content: 'Hello', timestamp: new Date() },
    ];

    let conversationId: string;
    act(() => {
      conversationId = result.current.saveConversation(initialMessages);
    });

    const updatedMessages: Message[] = [
      ...initialMessages,
      { id: 'msg-2', role: 'assistant', content: 'Hi!', timestamp: new Date() },
    ];

    act(() => {
      result.current.saveConversation(updatedMessages, conversationId!);
    });

    expect(result.current.conversations.length).toBe(1);
    expect(result.current.conversations[0].messages.length).toBe(2);
  });

  it('should delete a conversation', () => {
    const { result } = renderHook(() => useConversations());
    
    const messages: Message[] = [
      { id: 'msg-1', role: 'user', content: 'Hello', timestamp: new Date() },
    ];

    let conversationId: string;
    act(() => {
      conversationId = result.current.saveConversation(messages);
    });

    expect(result.current.conversations.length).toBe(1);

    act(() => {
      result.current.deleteConversation(conversationId!);
    });

    expect(result.current.conversations.length).toBe(0);
  });

  it('should create a new space', () => {
    const { result } = renderHook(() => useConversations());

    act(() => {
      result.current.createSpace('Work');
    });

    expect(result.current.spaces.length).toBe(1);
    expect(result.current.spaces[0].name).toBe('Work');
  });

  it('should delete a space and unassign conversations', () => {
    const { result } = renderHook(() => useConversations());

    let spaceId: string;
    act(() => {
      const space = result.current.createSpace('Work');
      spaceId = space.id;
    });

    const messages: Message[] = [
      { id: 'msg-1', role: 'user', content: 'Hello', timestamp: new Date() },
    ];

    let conversationId: string;
    act(() => {
      conversationId = result.current.saveConversation(messages);
    });

    act(() => {
      result.current.moveToSpace(conversationId!, spaceId!);
    });

    expect(result.current.conversations[0].spaceId).toBe(spaceId);

    act(() => {
      result.current.deleteSpace(spaceId!);
    });

    expect(result.current.spaces.length).toBe(0);
    expect(result.current.conversations[0].spaceId).toBeUndefined();
  });

  it('should move conversation to a space', () => {
    const { result } = renderHook(() => useConversations());

    let spaceId: string;
    act(() => {
      const space = result.current.createSpace('Personal');
      spaceId = space.id;
    });

    const messages: Message[] = [
      { id: 'msg-1', role: 'user', content: 'Hello', timestamp: new Date() },
    ];

    let conversationId: string;
    act(() => {
      conversationId = result.current.saveConversation(messages);
    });

    act(() => {
      result.current.moveToSpace(conversationId!, spaceId!);
    });

    expect(result.current.conversations[0].spaceId).toBe(spaceId);
  });

  it('should get conversations by space', () => {
    const { result } = renderHook(() => useConversations());

    let spaceId: string;
    act(() => {
      const space = result.current.createSpace('Work');
      spaceId = space.id;
    });

    act(() => {
      result.current.saveConversation([
        { id: 'msg-1', role: 'user', content: 'Conversation 1', timestamp: new Date() },
      ]);
      result.current.saveConversation([
        { id: 'msg-2', role: 'user', content: 'Conversation 2', timestamp: new Date() },
      ]);
    });

    act(() => {
      result.current.moveToSpace(result.current.conversations[0].id, spaceId!);
    });

    const spaceConversations = result.current.getConversationsBySpace(spaceId!);
    const unassignedConversations = result.current.getConversationsBySpace(undefined);

    expect(spaceConversations.length).toBe(1);
    expect(unassignedConversations.length).toBe(1);
  });

  it('should get a specific conversation by id', () => {
    const { result } = renderHook(() => useConversations());

    let conversationId: string;
    act(() => {
      conversationId = result.current.saveConversation([
        { id: 'msg-1', role: 'user', content: 'Find me', timestamp: new Date() },
      ]);
    });

    const found = result.current.getConversation(conversationId!);
    expect(found).toBeDefined();
    expect(found?.title).toBe('Find me');

    const notFound = result.current.getConversation('non-existent-id');
    expect(notFound).toBeUndefined();
  });
});
