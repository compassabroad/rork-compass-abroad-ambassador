import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Headphones,
  MessageSquare,
  Ticket,
  HelpCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import { useChat } from '@/contexts/ChatContext';
import { Message } from '@/types';

const QUICK_QUESTIONS = [
  'Komisyon oranları nedir?',
  'Öğrenci nasıl eklerim?',
  'Ödeme ne zaman yapılır?',
  'Program detayları nedir?',
];

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const {
    messages,
    unreadCount,
    isTyping,
    workingHours,
    sendMessage,
    markAllAsRead,
    tickets,
  } = useChat();

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (workingHours.isOpen) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [workingHours.isOpen, pulseAnim]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSending(true);
    const text = inputText.trim();
    setInputText('');

    try {
      await sendMessage(text);
    } catch (error) {
      console.log('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText(question);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Bugün';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Dün';
    } else {
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];

    msgs.forEach((message) => {
      const dateStr = new Date(message.timestamp).toDateString();
      const existingGroup = groups.find(
        (g) => new Date(g.date).toDateString() === dateStr
      );

      if (existingGroup) {
        existingGroup.messages.push(message);
      } else {
        groups.push({ date: message.timestamp, messages: [message] });
      }
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);
  const openTickets = tickets.filter((t) => t.status !== 'resolved').length;

  const renderMessage = (message: Message) => {
    const isOwn = message.senderId === 'current';
    const isSystem = message.senderId === 'system';
    const isTicketMessage = message.isTicket;

    if (isSystem) {
      return (
        <View key={message.id} style={styles.systemMessageContainer}>
          <View style={styles.systemMessage}>
            <Ticket size={16} color={Colors.warning} style={styles.systemIcon} />
            <Text style={styles.systemMessageText}>{message.text}</Text>
          </View>
        </View>
      );
    }

    return (
      <View
        key={message.id}
        style={[
          styles.messageBubble,
          isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
          isTicketMessage && isOwn && styles.messageBubbleTicket,
        ]}
      >
        {isTicketMessage && isOwn && (
          <View style={styles.ticketBadge}>
            <Ticket size={10} color={Colors.warning} />
            <Text style={styles.ticketBadgeText}>Talep</Text>
          </View>
        )}
        <Text
          style={[
            styles.messageText,
            isOwn ? styles.messageTextOwn : styles.messageTextOther,
          ]}
        >
          {message.text}
        </Text>
        <Text
          style={[
            styles.messageTime,
            isOwn ? styles.messageTimeOwn : styles.messageTimeOther,
          ]}
        >
          {formatTime(message.timestamp)}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={[Colors.gradient.middle, Colors.background]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerTop}>
          <View style={styles.consultantInfo}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                style={styles.avatar}
              >
                <Headphones size={24} color={Colors.text} />
              </LinearGradient>
              <Animated.View
                style={[
                  styles.statusDot,
                  workingHours.isOpen
                    ? styles.statusOnline
                    : styles.statusOffline,
                  workingHours.isOpen && { transform: [{ scale: pulseAnim }] },
                ]}
              />
            </View>
            <View style={styles.consultantDetails}>
              <Text style={styles.consultantName}>Compass Abroad Danışmanı</Text>
              <View style={styles.statusRow}>
                {workingHours.isOpen ? (
                  <CheckCircle size={12} color={Colors.success} />
                ) : (
                  <Clock size={12} color={Colors.warning} />
                )}
                <Text
                  style={[
                    styles.statusText,
                    workingHours.isOpen
                      ? styles.statusTextOnline
                      : styles.statusTextOffline,
                  ]}
                >
                  {workingHours.isOpen ? 'Çevrimiçi' : 'Mesai Dışı'}
                </Text>
              </View>
            </View>
          </View>
          {openTickets > 0 && (
            <View style={styles.ticketCounter}>
              <Ticket size={14} color={Colors.warning} />
              <Text style={styles.ticketCounterText}>{openTickets}</Text>
            </View>
          )}
        </View>

        {!workingHours.isOpen && (
          <View style={styles.offlineNotice}>
            <AlertCircle size={14} color={Colors.warning} />
            <Text style={styles.offlineNoticeText}>{workingHours.message}</Text>
          </View>
        )}

        <View style={styles.workingHoursInfo}>
          <Clock size={12} color={Colors.textMuted} />
          <Text style={styles.workingHoursText}>
            Hafta içi: 09:30-18:30 • Cumartesi: 12:30-16:30
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <MessageSquare size={48} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Danışmanınıza Yazın</Text>
            <Text style={styles.emptyText}>
              Programlar, komisyonlar, öğrenci süreçleri veya herhangi bir konuda
              soru sorabilirsiniz.
            </Text>
          </View>
        ) : (
          messageGroups.map((group, groupIndex) => (
            <View key={groupIndex}>
              <View style={styles.dateHeader}>
                <Text style={styles.dateHeaderText}>
                  {formatDateHeader(group.date)}
                </Text>
              </View>
              {group.messages.map(renderMessage)}
            </View>
          ))
        )}

        {isTyping && (
          <View style={styles.typingIndicator}>
            <View style={styles.typingDots}>
              <View style={[styles.dot, styles.dot1]} />
              <View style={[styles.dot, styles.dot2]} />
              <View style={[styles.dot, styles.dot3]} />
            </View>
            <Text style={styles.typingText}>Danışman yazıyor...</Text>
          </View>
        )}

        <View style={{ height: 10 }} />
      </ScrollView>

      {messages.length < 3 && (
        <View style={styles.quickQuestionsContainer}>
          <View style={styles.quickQuestionsHeader}>
            <HelpCircle size={14} color={Colors.textSecondary} />
            <Text style={styles.quickQuestionsTitle}>Hızlı Sorular</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickQuestionsScroll}
          >
            {QUICK_QUESTIONS.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickQuestionButton}
                onPress={() => handleQuickQuestion(question)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickQuestionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder={
              workingHours.isOpen
                ? 'Mesajınızı yazın...'
                : 'Mesajınızı yazın (talep oluşturulacak)...'
            }
            placeholderTextColor={Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            editable={!isSending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim() && !isSending
                ? styles.sendButtonActive
                : styles.sendButtonInactive,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
            activeOpacity={0.7}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={Colors.primaryDark} />
            ) : (
              <Send
                size={20}
                color={inputText.trim() ? Colors.primaryDark : Colors.textMuted}
              />
            )}
          </TouchableOpacity>
        </View>
        {!workingHours.isOpen && inputText.trim() && (
          <View style={styles.ticketWarning}>
            <Ticket size={12} color={Colors.warning} />
            <Text style={styles.ticketWarningText}>
              Mesai dışı - Mesajınız talep olarak kaydedilecek
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  consultantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  statusOnline: {
    backgroundColor: Colors.success,
  },
  statusOffline: {
    backgroundColor: Colors.warning,
  },
  consultantDetails: {
    flex: 1,
  },
  consultantName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  statusTextOnline: {
    color: Colors.success,
  },
  statusTextOffline: {
    color: Colors.warning,
  },
  ticketCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  ticketCounterText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 8,
    gap: 8,
  },
  offlineNoticeText: {
    flex: 1,
    fontSize: 12,
    color: Colors.warning,
    lineHeight: 16,
  },
  workingHoursInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workingHoursText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateHeaderText: {
    fontSize: 12,
    color: Colors.textMuted,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 8,
  },
  messageBubbleOwn: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageBubbleTicket: {
    backgroundColor: Colors.warning + '30',
    borderWidth: 1,
    borderColor: Colors.warning + '50',
  },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ticketBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: Colors.text,
  },
  messageTextOther: {
    color: Colors.text,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  messageTimeOwn: {
    color: Colors.textSecondary,
    textAlign: 'right' as const,
  },
  messageTimeOther: {
    color: Colors.textMuted,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.warning + '15',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    maxWidth: '90%',
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  systemIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  systemMessageText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textMuted,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.8,
  },
  typingText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  quickQuestionsContainer: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  quickQuestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  quickQuestionsTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  quickQuestionsScroll: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  quickQuestionButton: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    marginHorizontal: 4,
  },
  quickQuestionText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: Colors.secondary,
  },
  sendButtonInactive: {
    backgroundColor: Colors.surface,
  },
  ticketWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  ticketWarningText: {
    fontSize: 11,
    color: Colors.warning,
  },
});
