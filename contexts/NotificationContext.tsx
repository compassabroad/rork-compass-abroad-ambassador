import { useState, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Notification } from '@/types';
import { MOCK_NOTIFICATIONS } from '@/mocks/data';

export const [NotificationProvider, useNotifications] = createContextHook(() => {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const unreadCount = notifications.filter(n => !n.read).length;
  const totalUnreadCount = unreadCount + chatUnreadCount;

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'date' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `n-${Date.now()}`,
      date: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const addChatNotification = useCallback((message: string) => {
    addNotification({
      type: 'announcement',
      title: 'Yeni Mesaj',
      message,
    });
  }, [addNotification]);

  const updateChatUnreadCount = useCallback((count: number) => {
    setChatUnreadCount(count);
  }, []);

  return {
    notifications,
    unreadCount,
    chatUnreadCount,
    totalUnreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    addChatNotification,
    updateChatUnreadCount,
  };
});
