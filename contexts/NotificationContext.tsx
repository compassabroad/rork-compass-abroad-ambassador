import { useState, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Notification } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';

export const [NotificationProvider, useNotifications] = createContextHook(() => {
  const { token } = useAuth();
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const notificationsQuery = trpc.notifications.list.useQuery(
    { token: token || '' },
    { enabled: !!token, refetchInterval: 30000 }
  );

  const unreadCountQuery = trpc.notifications.getUnreadCount.useQuery(
    { token: token || '' },
    { enabled: !!token, refetchInterval: 30000 }
  );

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      notificationsQuery.refetch();
      unreadCountQuery.refetch();
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      notificationsQuery.refetch();
      unreadCountQuery.refetch();
    },
  });

  const notifications: Notification[] = (notificationsQuery.data ?? []).map((n: any) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    date: n.date,
    read: n.read,
    studentId: n.studentId,
  }));

  const unreadCount = unreadCountQuery.data?.unreadCount ?? 0;
  const totalUnreadCount = unreadCount + chatUnreadCount;

  const markAsRead = useCallback((id: string) => {
    if (token) {
      markAsReadMutation.mutate({ token, notificationId: id });
    }
  }, [token, markAsReadMutation]);

  const markAllAsRead = useCallback(() => {
    if (token) {
      markAllAsReadMutation.mutate({ token });
    }
  }, [token, markAllAsReadMutation]);

  const addNotification = useCallback((_notification: Omit<Notification, 'id' | 'date' | 'read'>) => {
    console.log('[NotificationContext] addNotification called - will refetch from server');
    notificationsQuery.refetch();
    unreadCountQuery.refetch();
  }, [notificationsQuery, unreadCountQuery]);

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
