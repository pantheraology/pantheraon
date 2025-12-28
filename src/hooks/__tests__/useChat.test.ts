import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChat } from '../useChat';

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty messages and not loading', () => {
    const { result } = renderHook(() => useChat());
    
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should add user message when sendMessage is called', async () => {
    const mockResponse = {
      ok: true,
      body: {
        getReader: () => ({
          read: vi.fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n'),
            })
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('data: [DONE]\n'),
            })
            .mockResolvedValueOnce({ done: true }),
        }),
      },
    };
    
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('Hello, AI!');
    });

    expect(result.current.messages.length).toBeGreaterThan(0);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('Hello, AI!');
  });

  it('should clear messages when clearMessages is called', () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toEqual([]);
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' }),
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('Test');
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should handle rate limit errors', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: 'Rate limited' }),
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage('Test');
    });

    expect(result.current.isLoading).toBe(false);
  });
});
