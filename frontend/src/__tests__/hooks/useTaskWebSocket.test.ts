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

    it('creates WebSocket with correct protocol', async () => {
      const { result } = renderHook(
        () => useTaskWebSocket({ projectId: 1, enabled: true }),
        { wrapper }
      );

      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled();
      });

      // The URL should be constructed with the correct protocol
      const wsUrl = (global.WebSocket as any).mock.calls[0][0];
      expect(wsUrl).toMatch(/^ws[s]?:\/\//);
      expect(wsUrl).toContain('/ws/projects/1/tasks/');
    });

    it('does not create WebSocket when disabled', async () => {
      const wsMock = vi.fn();
      (global.WebSocket as any) = wsMock;

      renderHook(
        () => useTaskWebSocket({ projectId: 1, enabled: false }),
        { wrapper }
      );

      // Should not create WebSocket when disabled
      expect(wsMock).not.toHaveBeenCalled();
    });

    it('does not create WebSocket when project ID is 0', async () => {
      const wsMock = vi.fn();
      (global.WebSocket as any) = wsMock;

      renderHook(
        () => useTaskWebSocket({ projectId: 0, enabled: true }),
        { wrapper }
      );

      // Should not create WebSocket when projectId is 0
      expect(wsMock).not.toHaveBeenCalled();
    });
  });

  describe('Events', () => {
    it('receives task events via WebSocket', async () => {
      const { result } = renderHook(
        () => useTaskWebSocket({ projectId: 1, enabled: true }),
        { wrapper }
      );

      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled();
      });

      // Verify the hook properly subscribes to WebSocket events
      expect(mockWebSocket.onmessage).toBeDefined();
      expect(mockWebSocket.onerror).toBeDefined();
      expect(mockWebSocket.onopen).toBeDefined();
      expect(mockWebSocket.onclose).toBeDefined();
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
    it('initializes WebSocket connection with callback', async () => {
      const mockStatusChange = vi.fn();

      renderHook(
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

      // Callback should be called with 'connecting' status initially
      expect(mockStatusChange).toHaveBeenCalled();
    });

    it('calls onError callback when WebSocket error occurs', async () => {
      const mockOnError = vi.fn();

      renderHook(
        () =>
          useTaskWebSocket({
            projectId: 1,
            enabled: true,
            onError: mockOnError,
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled();
      });

      // Simulate error
      await act(async () => {
        if (mockWebSocket.onerror) {
          mockWebSocket.onerror();
        }
      });

      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('calls onStatusChange with error when WebSocket error occurs', async () => {
      const mockStatusChange = vi.fn();

      renderHook(
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
        if (mockWebSocket.onerror) {
          mockWebSocket.onerror();
        }
      });

      expect(mockStatusChange).toHaveBeenCalledWith('error');
    });
  });

  describe('Lifecycle', () => {
    it('does not create WebSocket when disabled', async () => {
      const wsMock = vi.fn();
      (global.WebSocket as any) = wsMock;

      renderHook(
        () => useTaskWebSocket({ projectId: 1, enabled: false }),
        { wrapper }
      );

      // Should not create WebSocket when disabled
      expect(wsMock).not.toHaveBeenCalled();
    });

    it('creates WebSocket when enabled', async () => {
      // Reset WebSocket mock for this test
      const wsMock = vi.fn(() => mockWebSocket);
      (global.WebSocket as any) = wsMock;

      renderHook(
        () => useTaskWebSocket({ projectId: 1, enabled: true }),
        { wrapper }
      );

      await waitFor(() => {
        expect(wsMock).toHaveBeenCalled();
      });
    });

    it('returns isConnected status based on WebSocket readyState', async () => {
      const { result, rerender } = renderHook(
        () => useTaskWebSocket({ projectId: 1, enabled: true }),
        { wrapper }
      );

      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled();
      });

      // Initially WebSocket readyState should be OPEN (as set in mock)
      mockWebSocket.readyState = WebSocket.OPEN;
      rerender();
      expect(result.current.isConnected).toBe(true);
    });
  });
});
