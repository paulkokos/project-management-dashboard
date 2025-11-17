import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  description?: string;
  duration?: number; // ms, 0 = permanent
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { on, off } = useWebSocket({ autoConnect: false });

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id'>) => {
      const id = `notification_${Date.now()}_${Math.random()}`;
      const notificationWithId: Notification = {
        ...notification,
        id,
        duration: notification.duration ?? 5000, // Default 5 seconds
      };

      setNotifications((prev) => [...prev, notificationWithId]);

      // Auto-remove notification after duration
      if ((notificationWithId.duration ?? 0) > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, notificationWithId.duration ?? 5000);
      }

      return id;
    },
    [removeNotification]
  );

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Listen to WebSocket notification events
  useEffect(() => {
    const handleNotification = (data: any) => {
      const title = data.title || data.message;
      const message = data.message || 'Something changed';
      const actor = data.actor;
      const projectTitle = data.project_title;

      let description = '';
      if (actor && projectTitle) {
        description = `${actor.first_name || actor.username} in "${projectTitle}"`;
      } else if (projectTitle) {
        description = `Project: ${projectTitle}`;
      }

      addNotification({
        type: 'info',
        message: title || message,
        description,
        duration: 5000,
      });
    };

    const handleError = (data: any) => {
      addNotification({
        type: 'error',
        message: data.message || 'An error occurred',
        description: data.details,
        duration: 7000,
      });
    };

    on('notification_received', handleNotification);
    on('error', handleError);

    return () => {
      off('notification_received', handleNotification);
      off('error', handleError);
    };
  }, [on, off, addNotification]);

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
