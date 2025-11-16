import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface CommentEvent {
  type: 'comment_created' | 'comment_updated' | 'comment_deleted' | 'comment_replied';
  project_id: number;
  timestamp: string;
  comment: {
    id: number;
    content: string;
    author: {
      id: number;
      username: string;
      email: string;
      first_name: string;
      last_name: string;
    };
    created_at: string;
    updated_at: string;
    is_edited: boolean;
    reply_count: number;
  };
}

interface UseCommentWebSocketOptions {
  projectId: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
}

/**
 * Hook to connect to WebSocket for real-time comment updates.
 *
 * Automatically:
 * - Subscribes to comment events for a project
 * - Updates React Query cache on events
 * - Handles reconnection with exponential backoff
 * - Cleans up on unmount
 */
export function useCommentWebSocket({
  projectId,
  enabled = true,
  onError,
  onStatusChange,
}: UseCommentWebSocketOptions) {
  const queryClient = useQueryClient();
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000; // Start at 1 second

  const updateStatus = useCallback(
    (status: 'connecting' | 'connected' | 'disconnected' | 'error') => {
      onStatusChange?.(status);
    },
    [onStatusChange]
  );

  const connect = useCallback(() => {
    if (!enabled || !projectId) return;

    updateStatus('connecting');

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/comments/${projectId}/`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log(`Connected to comment WebSocket for project ${projectId}`);
        updateStatus('connected');
        reconnectAttempts.current = 0;

        // Send subscribe message
        ws.send(JSON.stringify({ type: 'subscribe' }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'connection_established') {
            console.log('WebSocket connection established');
            return;
          }

          if (data.type === 'subscribed') {
            console.log('Subscribed to comment updates');
            return;
          }

          if (data.type === 'pong') {
            console.log('Received pong');
            return;
          }

          // Handle comment events
          const commentEvent = data as CommentEvent;
          handleCommentEvent(commentEvent);
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
        console.log('WebSocket disconnected');
        updateStatus('disconnected');
        websocketRef.current = null;

        // Attempt reconnection with exponential backoff
        if (enabled && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts.current);
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);
          reconnectAttempts.current += 1;

          setTimeout(() => {
            connect();
          }, delay);
        }
      };

      websocketRef.current = ws;
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      updateStatus('error');
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
    }
  }, [projectId, enabled, updateStatus, onError]);

  const handleCommentEvent = useCallback(
    (event: CommentEvent) => {
      const COMMENTS_QUERY_KEY = ['comments', projectId];

      switch (event.type) {
        case 'comment_created':
          console.log('Comment created:', event.comment);
          // Invalidate comments list to refetch
          queryClient.invalidateQueries({
            queryKey: COMMENTS_QUERY_KEY,
          });
          break;

        case 'comment_updated':
          console.log('Comment updated:', event.comment);
          // Update specific comment in cache
          queryClient.invalidateQueries({
            queryKey: ['comments', event.comment.id],
          });
          // Also invalidate list
          queryClient.invalidateQueries({
            queryKey: COMMENTS_QUERY_KEY,
          });
          break;

        case 'comment_deleted':
          console.log('Comment deleted:', event.comment.id);
          // Remove from cache
          queryClient.removeQueries({
            queryKey: ['comments', event.comment.id],
          });
          // Invalidate list
          queryClient.invalidateQueries({
            queryKey: COMMENTS_QUERY_KEY,
          });
          break;

        case 'comment_replied':
          console.log('Reply added to comment:', event.comment.id);
          // Invalidate parent comment
          queryClient.invalidateQueries({
            queryKey: ['comments', event.comment.id],
          });
          // Invalidate list
          queryClient.invalidateQueries({
            queryKey: COMMENTS_QUERY_KEY,
          });
          break;

        default:
          console.log('Unknown event type:', event.type);
      }
    },
    [projectId, queryClient]
  );

  const sendPing = useCallback(() => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({ type: 'ping' }));
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      // Disconnect if disabled
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
      return;
    }

    // Connect on mount
    connect();

    // Setup ping interval to keep connection alive
    const pingInterval = setInterval(sendPing, 30000); // Ping every 30 seconds

    return () => {
      // Cleanup on unmount
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

export default useCommentWebSocket;
