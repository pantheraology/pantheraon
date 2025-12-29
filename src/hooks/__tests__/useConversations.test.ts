import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConversations } from '../useConversations';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        in: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { id: 'conv-1', title: 'Test', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), space_id: null },
            error: null 
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-123' },
    isLoading: false,
  })),
}));

describe('useConversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty conversations', async () => {
    let result: any;
    await act(async () => {
      const hook = renderHook(() => useConversations());
      result = hook.result;
    });
    
    expect(result.current.conversations).toEqual([]);
  });

  it('should provide conversation management functions', async () => {
    let result: any;
    await act(async () => {
      const hook = renderHook(() => useConversations());
      result = hook.result;
    });

    expect(typeof result.current.saveConversation).toBe('function');
    expect(typeof result.current.deleteConversation).toBe('function');
    expect(typeof result.current.getConversation).toBe('function');
    expect(typeof result.current.moveToSpace).toBe('function');
    expect(typeof result.current.getConversationsBySpace).toBe('function');
  });

  it('should filter conversations by space', async () => {
    let result: any;
    await act(async () => {
      const hook = renderHook(() => useConversations());
      result = hook.result;
    });

    const unassigned = result.current.getConversationsBySpace(null);
    expect(unassigned).toEqual([]);
  });
});
