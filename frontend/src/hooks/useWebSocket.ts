import { useEffect, useCallback } from 'react';
import { wsService } from '@/services/websocket';

interface WebSocketOptions {
  autoConnect?: boolean;
}

export function useWebSocket(options: WebSocketOptions = {}) {
  const { autoConnect = true } = options;

  useEffect(() => {
    if (!autoConnect) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Connect to WebSocket if not already connected
    if (!wsService.isConnected()) {
      wsService.connect(token).catch(() => {
        // Connection failed silently
      });
    }

    return () => {
      // Don't disconnect on unmount as other components might be using it
    };
  }, [autoConnect]);

  const subscribe = useCallback((projectId: number) => {
    wsService.subscribe(projectId);
  }, []);

  const unsubscribe = useCallback((projectId: number) => {
    wsService.unsubscribe(projectId);
  }, []);

  const on = useCallback((event: string, callback: (data: unknown) => void) => {
    wsService.on(event, callback);
  }, []);

  const off = useCallback((event: string, callback: (data: unknown) => void) => {
    wsService.off(event, callback);
  }, []);

  return {
    subscribe,
    unsubscribe,
    on,
    off,
    isConnected: wsService.isConnected(),
  };
}
