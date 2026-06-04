import { useState, useEffect, useCallback } from 'react';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'match' | 'message' | 'system';
  read: boolean;
  timestamp: number;
}

const STORAGE_KEY = 'equal-notifications';

function loadNotifications(): AppNotification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveNotifications(notifications: AppNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)));
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>(loadNotifications);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unread = notifications.filter((n) => !n.read).length;
    setUnreadCount(unread);
    saveNotifications(notifications);
  }, [notifications]);

  const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'read' | 'timestamp'>) => {
    const newNotification: AppNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      read: false,
      timestamp: Date.now(),
    };
    setNotifications((prev) => [newNotification, ...prev]);

    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.body,
        icon: '/icon-192x192.png',
        tag: newNotification.id,
      });
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    requestPermission,
  };
}
