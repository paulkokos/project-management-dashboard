/**
 * WebSocket Service for Django Channels
 * Implements native WebSocket connection with message-based event handling
 */

/**
 * Build WebSocket URL
 * Returns the base WebSocket URL without authentication
 * Authentication is handled via Authorization header in the connect method
 */
function getWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws/notifications/`;
}

export interface WebSocketMessage {
  type: string;
  title?: string;
  message?: string;
  event_type?: string;
  timestamp?: string;
  actor?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  project_id?: number;
  project_title?: string;
  data?: unknown;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private connectPromise: Promise<void> | null = null;
  private resolveConnect: (() => void) | null = null;
  private rejectConnect: ((error: Error) => void) | null = null;

  connect(token?: string): Promise<void> {
    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = new Promise((resolve, reject) => {
      this.resolveConnect = resolve;
      this.rejectConnect = reject;
      this.attemptConnection(token);
    });

    return this.connectPromise;
  }

  private attemptConnection(token?: string): void {
    try {
      const jwt = token || localStorage.getItem('access_token');
      if (!jwt) {
        if (this.rejectConnect) {
          this.rejectConnect(new Error('No JWT token found'));
        }
        return;
      }

      const wsUrl = getWebSocketUrl();
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        console.log('✅ WebSocket connected');

        // Send authentication message (for reference, actual auth via middleware)
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(
            JSON.stringify({
              type: 'authenticate',
              token: jwt,
            })
          );
        }

        if (this.resolveConnect) {
          this.resolveConnect();
          this.resolveConnect = null;
        }
        this.connectPromise = null;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;

          // Emit based on message type
          if (message.type) {
            this.emitEvent(message.type, message);
          }
        } catch {
          // Silent fail on parse error
        }
      };

      this.ws.onerror = () => {
        this.emitEvent('error', {
          type: 'connection_error',
          message: 'WebSocket connection failed',
        });
        if (this.rejectConnect) {
          this.rejectConnect(new Error('WebSocket connection failed'));
          this.rejectConnect = null;
        }
      };

      this.ws.onclose = () => {
        this.ws = null;
        this.connectPromise = null;

        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
          setTimeout(() => this.attemptConnection(token), delay);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          // Max reconnection attempts reached
          this.emitEvent('error', {
            type: 'connection_lost',
            message: 'Unable to reconnect to server. Please refresh the page.',
          });
        }
      };
    } catch (error) {
      if (this.rejectConnect) {
        this.rejectConnect(error as Error);
        this.rejectConnect = null;
      }
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to project updates
   * Sends a message to the WebSocket consumer to join project room
   */
  subscribe(projectId: number): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'subscribe_project',
        project_id: projectId,
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Unsubscribe from project updates
   */
  unsubscribe(projectId: number): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'unsubscribe_project',
        project_id: projectId,
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Register a listener for a specific event type
   */
  on(event: string, callback: (data: unknown) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Unregister a listener for a specific event type
   */
  off(event: string, callback: (data: unknown) => void): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  /**
   * Emit an event to all registered listeners
   */
  private emitEvent(event: string, data: unknown): void {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)!;
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch {
          // Silent fail on listener error
        }
      });
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketService();
