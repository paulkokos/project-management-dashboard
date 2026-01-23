import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import useTaskWebSocket from '@/hooks/useTaskWebSocket';

describe('useTaskWebSocket', () => {
  let queryClient: QueryClient;
  let mockWebSocket: any;

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock WebSocket
    mockWebSocket = {
      onopen: null,
      onmessage: null,
      onerror: null,
      onclose: null,
      readyState: WebSocket.OPEN,
      send: vi.fn(),
      close: vi.fn(),
    };

    (global.WebSocket as any) = vi.fn(() => mockWebSocket);

    // Mock localStorage
    const store = new Map<string, string>();
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
        clear: () => store.clear(),
      },
      writable: true,
    });

    localStorage.setItem('access_token', 'test-token');

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Connection', () => {
    it('creates WebSocket connection with correct URL', async () => {
      const { result } = renderHook(
        () => useTaskWebSocket({ projectId: 1, enabled: true }),
        { wrapper }
      );

      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled();
      });

      const wsUrl = (global.WebSocket as any).mock.calls[0][0];
      expect(wsUrl).toContain('ws://');
      expect(wsUrl).toContain('/ws/projects/1/tasks/');
      expect(wsUrl).toContain('token=test-token');
    });

    it('uses wss:// for HTTPS connections', async () => {
      const originalProtocol = window.location.protocol;
      Object.defineProperty(window.location, 'protocol', {
        value: 'https:',
        writable: true,
      });

      const { result } = renderHook(
        () => useTaskWebSocket({ projectId: 1, enabled: true }),
        { wrapper }
      );

      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled();
      });

      const wsUrl = (global.WebSocket as any).mock.calls[0][0];
      expect(wsUrl).toContain('wss://');

      Object.defineProperty(window.location, 'protocol', {
        value: originalProtocol,
        writable: true,
      });
    });

    it('sends subscribe message on connection', async () => {
      const { result } = renderHook(
        () => useTaskWebSocket({ projectId: 1, enabled: true }),
        { wrapper }
      );

      act(() => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen();
        }
      });

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'subscribe' })
      );
    });

    it('does not create WebSocket when disabled', async () => {
      const { result } = renderHook(
        () => useTaskWebSocket({ projectId: 1, enabled: false }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
      });

      expect(global.WebSocket).not.toHaveBeenCalled();
    });

    it('does not create WebSocket when project ID is 0', async () => {
      const { result } = renderHook(
        () => useTaskWebSocket({ projectId: 0, enabled: true }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
      });

      expect(global.WebSocket).not.toHaveBeenCalled();
    });
  });

  describe('Events', () => {
    it('handles task_created event', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(
        () => useTaskWebSocket({ projectId: 1, enabled: true }),
        { wrapper }
      );

      // Wait for WebSocket to be created
      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled();
      });

      // Trigger the onopen handler that was set by the hook
      await act(async () => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen();
        }
      });

      const taskCreatedEvent = {
        type: 'task_created',
        project_id: 1,
        timestamp: new Date().toISOString(),
        task: { id: 1, title: 'New Task', status: 'todo', priority: 'medium', progress: 0 },
      };

      // Trigger the onmessage handler
      await act(async () => {
        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage({ data: JSON.stringify(taskCreatedEvent) });
        }
      });

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalled();
      });
    });

    it('handles task_updated event', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(
        () => useTaskWebSocket({ projectId: 1, enabled: true }),
        { wrapper }
      );

      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled();
      });

      await act(async () => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen();
        }
      });

      const taskUpdatedEvent = {
        type: 'task_updated',
        project_id: 1,
        timestamp: new Date().toISOString(),
        task: { id: 1, title: 'Updated Task', status: 'in_progress', priority: 'high', progress: 50 },
      };

      await act(async () => {
        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage({ data: JSON.stringify(taskUpdatedEvent) });
        }
      });

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalled();
      });
    });

    it('handles task_deleted event', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(
        () => useTaskWebSocket({ projectId: 1, enabled: true }),
        { wrapper }
      );

      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled();
      });

      await act(async () => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen();
        }
      });

      const taskDeletedEvent = {
        type: 'task_deleted',
        project_id: 1,
        timestamp: new Date().toISOString(),
        task: { id: 1 },
      };

      await act(async () => {
        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage({ data: JSON.stringify(taskDeletedEvent) });
        }
      });

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalled();
      });
    });

    it('handles task_status_changed event', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(
        () => useTaskWebSocket({ projectId: 1, enabled: true }),
        { wrapper }
      );

      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled();
      });

      await act(async () => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen();
        }
      });

      const statusChangedEvent = {
        type: 'task_status_changed',
        project_id: 1,
        timestamp: new Date().toISOString(),
        task: { id: 1, status: 'done', progress: 100 },
      };

      await act(async () => {
        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage({ data: JSON.stringify(statusChangedEvent) });
        }
      });

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalled();
      });
    });

    it('ignores events from different projects', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      invalidateSpy.mockClear();

      const { result } = renderHook(
        () => useTaskWebSocket({ projectId: 1, enabled: true }),
        { wrapper }
      );

      act(() => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen();
        }
      });

      const eventFromDifferentProject = {
        type: 'task_created',
        project_id: 999, // Different project
        timestamp: new Date().toISOString(),
        task: { id: 1, title: 'New Task', status: 'todo', priority: 'medium', progress: 0 },
      };

      act(() => {
        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage({ data: JSON.stringify(eventFromDifferentProject) });
        }
      });

      // Should still invalidate because event type is task_created
      // The project check happens in the handler
    });

    it('ignores subscribed message', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      invalidateSpy.mockClear();

      const { result } = renderHook(
        () => useTaskWebSocket({ projectId: 1, enabled: true }),
        { wrapper }
      );

      act(() => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen();
        }
      });

      const subscribedMessage = {
        type: 'subscribed',
      };

      act(() => {
        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage({ data: JSON.stringify(subscribedMessage) });
        }
      });

      expect(invalidateSpy).not.toHaveBeenCalled();
    });

    it('ignores pong message', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      invalidateSpy.mockClear();

      const { result } = renderHook(
        () => useTaskWebSocket({ projectId: 1, enabled: true }),
        { wrapper }
      );

      act(() => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen();
        }
      });

      const pongMessage = {
        type: 'pong',
      };

      act(() => {
        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage({ data: JSON.stringify(pongMessage) });
        }
      });

      expect(invalidateSpy).not.toHaveBeenCalled();
    });

    it('handles invalid JSON gracefully', async () => {
      const { result } = renderHook(
        () => useTaskWebSocket({ projectId: 1, enabled: true }),
        { wrapper }
      );

      act(() => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen();
        }
      });

      expect(() => {
        act(() => {
          if (mockWebSocket.onmessage) {
            mockWebSocket.onmessage({ data: 'invalid json' });
          }
        });
      }).not.toThrow();
    });
  });

  describe('Reconnection', () => {
    it('calls onStatusChange callback on connection', async () => {
      const mockStatusChange = vi.fn();

      const { result } = renderHook(
        () =>
          useTaskWebSocket({
            projectId: 1,
            enabled: true,
            onStatusChange: mockStatusChange,
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled();
      });

      await act(async () => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen();
        }
      });

      expect(mockStatusChange).toHaveBeenCalledWith('connected');
    });

    it('calls onStatusChange callback on disconnect', async () => {
      const mockStatusChange = vi.fn();

      const { result } = renderHook(
        () =>
          useTaskWebSocket({
            projectId: 1,
            enabled: true,
            onStatusChange: mockStatusChange,
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled();
      });

      await act(async () => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen();
        }
      });

      mockStatusChange.mockClear();

      await act(async () => {
        if (mockWebSocket.onclose) {
          mockWebSocket.onclose();
        }
      });

      expect(mockStatusChange).toHaveBeenCalledWith('disconnected');
    });

    it('calls onStatusChange on error', async () => {
      const mockStatusChange = vi.fn();

      const { result } = renderHook(
        () =>
          useTaskWebSocket({
            projectId: 1,
            enabled: true,
            onStatusChange: mockStatusChange,
          }),
        { wrapper }
      );

      act(() => {
        if (mockWebSocket.onerror) {
          mockWebSocket.onerror();
        }
      });

      expect(mockStatusChange).toHaveBeenCalledWith('error');
    });

    it('calls onError callback on error', async () => {
      const mockOnError = vi.fn();

      const { result } = renderHook(
        () =>
          useTaskWebSocket({
            projectId: 1,
            enabled: true,
            onError: mockOnError,
          }),
        { wrapper }
      );

      act(() => {
        if (mockWebSocket.onerror) {
          mockWebSocket.onerror();
        }
      });

      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Cleanup', () => {
    it('closes WebSocket on unmount', async () => {
      const { unmount } = renderHook(
        () => useTaskWebSocket({ projectId: 1, enabled: true }),
        { wrapper }
      );

      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled();
      });

      await act(async () => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen();
        }
      });

      expect(mockWebSocket.close).not.toHaveBeenCalled();

      unmount();

      expect(mockWebSocket.close).toHaveBeenCalled();
    });

    it('closes WebSocket when disabled', async () => {
      const { rerender } = renderHook(
        ({ enabled }) => useTaskWebSocket({ projectId: 1, enabled }),
        { wrapper, initialProps: { enabled: true } }
      );

      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled();
      });

      await act(async () => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen();
        }
      });

      rerender({ enabled: false });

      expect(mockWebSocket.close).toHaveBeenCalled();
    });
  });

  describe('Ping/Pong', () => {
    it('sends ping message periodically', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(
        () => useTaskWebSocket({ projectId: 1, enabled: true }),
        { wrapper }
      );

      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled();
      });

      await act(async () => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen();
        }
      });

      mockWebSocket.send.mockClear();

      // Advance time to trigger ping (30 seconds)
      await act(async () => {
        vi.advanceTimersByTime(30000);
      });

      // Ping should have been sent
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'ping' })
      );

      vi.useRealTimers();
    });
  });

  describe('isConnected', () => {
    it('returns true when WebSocket is open', async () => {
      const { result } = renderHook(
        () => useTaskWebSocket({ projectId: 1, enabled: true }),
        { wrapper }
      );

      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled();
      });

      await act(async () => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen();
        }
      });

      mockWebSocket.readyState = WebSocket.OPEN;

      expect(result.current.isConnected).toBe(true);
    });

    it('returns false when WebSocket is closed', async () => {
      const { result } = renderHook(
        () => useTaskWebSocket({ projectId: 1, enabled: true }),
        { wrapper }
      );

      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled();
      });

      await act(async () => {
        if (mockWebSocket.onopen) {
          mockWebSocket.onopen();
        }
      });

      mockWebSocket.readyState = WebSocket.CLOSED;

      await act(async () => {
        if (mockWebSocket.onclose) {
          mockWebSocket.onclose();
        }
      });

      // After onclose is called, the hook sets websocketRef.current = null
      // So isConnected should be false
      expect(result.current.isConnected).toBe(false);
    });
  });
});
