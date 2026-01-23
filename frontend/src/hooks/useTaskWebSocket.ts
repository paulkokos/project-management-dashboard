import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface TaskEvent {
  type:
    | 'task_created'
    | 'task_updated'
    | 'task_deleted'
    | 'task_status_changed'
    | 'task_assigned';
  project_id: number;
  timestamp: string;
  task?: {
    id: number;
    title: string;
    status: string;
    priority: string;
    assigned_to: any;
    progress: number;
  };
}

interface UseTaskWebSocketOptions {
  projectId: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
  onStatusChange?: (
    status: 'connecting' | 'connected' | 'disconnected' | 'error'
  ) => void;
}

/**
 * Hook to connect to WebSocket for real-time task updates.
 *
 * WebSocket URL: ws://localhost:8000/ws/projects/{project_id}/tasks/
 * Events: task_created, task_updated, task_deleted, task_status_changed, task_assigned
 */
export function useTaskWebSocket({
  projectId,
  enabled = true,
  onError,
  onStatusChange,
}: UseTaskWebSocketOptions) {
  const queryClient = useQueryClient();
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;

  const updateStatus = useCallback(
    (status: 'connecting' | 'connected' | 'disconnected' | 'error') => {
      onStatusChange?.(status);
    },
    [onStatusChange]
  );

  const handleTaskEvent = useCallback(
    (event: TaskEvent) => {
      const TASKS_QUERY_KEY = ['tasks'];

      console.log('Task event received:', event.type, event.task);

      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: ['project', projectId.toString()],
      });
    },
    [projectId, queryClient]
  );

  const connect = useCallback(() => {
    if (!enabled || !projectId) return;

    updateStatus('connecting');

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const token = localStorage.getItem('access_token');
      const wsUrl = `${protocol}//${window.location.host}/ws/projects/${projectId}/tasks/?token=${token}`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log(`Connected to task WebSocket for project ${projectId}`);
        updateStatus('connected');
        reconnectAttempts.current = 0;

        ws.send(JSON.stringify({ type: 'subscribe' }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'subscribed') {
            console.log('Subscribed to task updates');
            return;
          }

          if (data.type === 'pong') {
            return;
          }

          handleTaskEvent(data as TaskEvent);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateStatus('error');
        onError?.(new Error('WebSocket connection error'));
      };

      ws.onclose = () => {
        console.log('Task WebSocket disconnected');
        updateStatus('disconnected');
        websocketRef.current = null;

        if (
          enabled &&
          reconnectAttempts.current < maxReconnectAttempts
        ) {
          const delay =
            baseReconnectDelay * Math.pow(2, reconnectAttempts.current);
          console.log(
            `Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1})`
          );
          reconnectAttempts.current += 1;

          setTimeout(() => {
            connect();
          }, delay);
        }
      };

      websocketRef.current = ws;
    } catch (error) {
      console.error('Failed to connect to task WebSocket:', error);
      updateStatus('error');
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
    }
  }, [
    projectId,
    enabled,
    updateStatus,
    onError,
    handleTaskEvent,
  ]);

  const sendPing = useCallback(() => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({ type: 'ping' }));
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
      return;
    }

    connect();

    const pingInterval = setInterval(sendPing, 30000);

    return () => {
      clearInterval(pingInterval);
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
    };
  }, [enabled, connect, sendPing]);

  return {
    isConnected: websocketRef.current?.readyState === WebSocket.OPEN,
    status: websocketRef.current?.readyState,
  };
}

export default useTaskWebSocket;
