import { useState, useCallback, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Message, ChatTicket } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';

interface WorkingHours {
  isOpen: boolean;
  currentDay: string;
  nextOpenTime: string;
  message: string;
}

const WORKING_HOURS = {
  weekdays: { start: '09:30', end: '18:30' },
  saturday: { start: '12:30', end: '16:30' },
  sunday: null,
};

const DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

const checkWorkingHours = (): WorkingHours => {
  const now = new Date();
  const day = now.getDay();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const currentDay = DAY_NAMES[day];

  if (day === 0) {
    return {
      isOpen: false,
      currentDay,
      nextOpenTime: 'Pazartesi 09:30',
      message: 'Pazar günü kapalıyız. Pazartesi 09:30\'da hizmetinizdeyiz.',
    };
  }

  if (day === 6) {
    const hours = WORKING_HOURS.saturday;
    if (hours && currentTime >= hours.start && currentTime < hours.end) {
      return {
        isOpen: true,
        currentDay,
        nextOpenTime: '',
        message: 'Çevrimiçi - Cumartesi mesai saatleri içindeyiz',
      };
    }
    return {
      isOpen: false,
      currentDay,
      nextOpenTime: currentTime < (hours?.start || '12:30') ? 'Bugün 12:30' : 'Pazartesi 09:30',
      message: currentTime < (hours?.start || '12:30') 
        ? 'Cumartesi mesai saatlerimiz 12:30-16:30 arasıdır.'
        : 'Cumartesi mesai saatlerimiz sona erdi. Pazartesi 09:30\'da hizmetinizdeyiz.',
    };
  }

  const hours = WORKING_HOURS.weekdays;
  if (currentTime >= hours.start && currentTime < hours.end) {
    return {
      isOpen: true,
      currentDay,
      nextOpenTime: '',
      message: 'Çevrimiçi - Mesai saatleri içindeyiz',
    };
  }

  if (currentTime < hours.start) {
    return {
      isOpen: false,
      currentDay,
      nextOpenTime: `Bugün ${hours.start}`,
      message: `Mesai saatlerimiz ${hours.start}-${hours.end} arasıdır.`,
    };
  }

  const nextDay = day === 5 ? 'Cumartesi 12:30' : 'Yarın 09:30';
  return {
    isOpen: false,
    currentDay,
    nextOpenTime: nextDay,
    message: `Mesai saatlerimiz sona erdi. ${nextDay}'de hizmetinizdeyiz.`,
  };
};

export const [ChatProvider, useChat] = createContextHook(() => {
  const { token, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [tickets] = useState<ChatTicket[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHours>(checkWorkingHours());
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const unreadQuery = trpc.chat.getUnreadCount.useQuery(
    { token: token ?? '' },
    { enabled: !!token && isAuthenticated, refetchInterval: 30000 }
  );

  useEffect(() => {
    if (unreadQuery.data) {
      setUnreadCount(unreadQuery.data.unreadCount);
    }
  }, [unreadQuery.data]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWorkingHours(checkWorkingHours());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = useCallback(async (text: string): Promise<{ isTicket: boolean; ticketId?: string }> => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      text,
      senderId: 'current',
      timestamp: new Date().toISOString(),
      read: true,
    };

    setMessages(prev => [...prev, newMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const autoReply: Message = {
        id: `msg-${Date.now()}-reply`,
        text: 'Mesajınız alındı! Danışmanlarımız en kısa sürede size yanıt verecektir. 🙂',
        senderId: 'consultant',
        timestamp: new Date().toISOString(),
        read: false,
      };
      setMessages(prev => [...prev, autoReply]);
      setIsTyping(false);
    }, 1500);

    return { isTicket: false };
  }, []);

  const markAllAsRead = useCallback(() => {
    setMessages(prev => {
      const hasUnread = prev.some(m => !m.read);
      if (!hasUnread) return prev;
      return prev.map(m => ({ ...m, read: true }));
    });
  }, []);

  const getLastMessage = useCallback(() => {
    if (messages.length === 0) return null;
    return messages[messages.length - 1];
  }, [messages]);

  const clearChat = useCallback(async () => {
    setMessages([]);
  }, []);

  const refetchUnread = useCallback(() => {
    unreadQuery.refetch();
  }, [unreadQuery]);

  return {
    messages,
    tickets,
    unreadCount,
    isTyping,
    workingHours,
    sendMessage,
    markAllAsRead,
    getLastMessage,
    clearChat,
    checkWorkingHours,
    activeConversationId,
    setActiveConversationId,
    refetchUnread,
  };
});
