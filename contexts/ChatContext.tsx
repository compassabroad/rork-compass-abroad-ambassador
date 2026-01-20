import { useState, useCallback, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message, ChatTicket } from '@/types';
import { MOCK_CURRENT_AMBASSADOR } from '@/mocks/data';

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

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'welcome-1',
    text: 'Merhaba! Compass Abroad Danışman Ekibine hoş geldiniz. 👋',
    senderId: 'consultant',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    read: true,
  },
  {
    id: 'welcome-2',
    text: 'Size programlar, komisyonlar, öğrenci süreçleri ve daha fazlası hakkında yardımcı olabiliriz. Sormak istediğiniz her şeyi yazabilirsiniz!',
    senderId: 'consultant',
    timestamp: new Date(Date.now() - 86400000 + 1000).toISOString(),
    read: true,
  },
];

export const [ChatProvider, useChat] = createContextHook(() => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [tickets, setTickets] = useState<ChatTicket[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHours>(checkWorkingHours());

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedMessages = await AsyncStorage.getItem('chat_messages');
        const storedTickets = await AsyncStorage.getItem('chat_tickets');
        
        if (storedMessages) {
          const parsed = JSON.parse(storedMessages);
          setMessages(parsed.length > 0 ? parsed : INITIAL_MESSAGES);
        }
        if (storedTickets) {
          setTickets(JSON.parse(storedTickets));
        }
      } catch (error) {
        console.log('Error loading chat data:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWorkingHours(checkWorkingHours());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const count = messages.filter(m => !m.read && m.senderId !== 'current').length;
    setUnreadCount(count);
  }, [messages]);

  const saveMessages = useCallback(async (newMessages: Message[]) => {
    try {
      await AsyncStorage.setItem('chat_messages', JSON.stringify(newMessages));
    } catch (error) {
      console.log('Error saving messages:', error);
    }
  }, []);

  const saveTickets = useCallback(async (newTickets: ChatTicket[]) => {
    try {
      await AsyncStorage.setItem('chat_tickets', JSON.stringify(newTickets));
    } catch (error) {
      console.log('Error saving tickets:', error);
    }
  }, []);

  const sendMessage = useCallback(async (text: string): Promise<{ isTicket: boolean; ticketId?: string }> => {
    const currentHours = checkWorkingHours();
    const isOutsideHours = !currentHours.isOpen;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      text,
      senderId: 'current',
      timestamp: new Date().toISOString(),
      read: true,
      isTicket: isOutsideHours,
    };

    let ticketId: string | undefined;

    if (isOutsideHours) {
      ticketId = `ticket-${Date.now()}`;
      const newTicket: ChatTicket = {
        id: ticketId,
        subject: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        message: text,
        createdAt: new Date().toISOString(),
        status: 'open',
        priority: 'medium',
        ambassadorId: MOCK_CURRENT_AMBASSADOR.id,
        ambassadorName: MOCK_CURRENT_AMBASSADOR.name,
        responses: [],
      };

      newMessage.ticketId = ticketId;

      const updatedTickets = [...tickets, newTicket];
      setTickets(updatedTickets);
      saveTickets(updatedTickets);

      const ticketNotification: Message = {
        id: `msg-${Date.now()}-ticket`,
        text: `📋 Talebiniz alındı! (Talep No: #${ticketId.slice(-6).toUpperCase()})\n\nMesai saatleri dışında olduğumuz için mesajınız talep olarak kaydedildi. En kısa sürede size dönüş yapacağız.\n\n⏰ Mesai Saatlerimiz:\n• Hafta içi: 09:30 - 18:30\n• Cumartesi: 12:30 - 16:30\n• Pazar: Kapalı`,
        senderId: 'system',
        timestamp: new Date(Date.now() + 100).toISOString(),
        read: false,
        isTicket: true,
        ticketId,
      };

      const updatedMessages = [...messages, newMessage, ticketNotification];
      setMessages(updatedMessages);
      saveMessages(updatedMessages);

      return { isTicket: true, ticketId };
    }

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);

    setIsTyping(true);
    setTimeout(() => {
      const autoReply: Message = {
        id: `msg-${Date.now()}-reply`,
        text: 'Mesajınız alındı! Danışmanlarımız en kısa sürede size yanıt verecektir. 🙂',
        senderId: 'consultant',
        timestamp: new Date().toISOString(),
        read: false,
      };
      
      const withReply = [...updatedMessages, autoReply];
      setMessages(withReply);
      saveMessages(withReply);
      setIsTyping(false);
    }, 1500);

    return { isTicket: false };
  }, [messages, tickets, saveMessages, saveTickets]);

  const markAllAsRead = useCallback(() => {
    const updated = messages.map(m => ({ ...m, read: true }));
    setMessages(updated);
    saveMessages(updated);
  }, [messages, saveMessages]);

  const getLastMessage = useCallback(() => {
    if (messages.length === 0) return null;
    return messages[messages.length - 1];
  }, [messages]);

  const clearChat = useCallback(async () => {
    setMessages(INITIAL_MESSAGES);
    await AsyncStorage.removeItem('chat_messages');
  }, []);

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
  };
});
