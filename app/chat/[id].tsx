import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Send,
  ChevronLeft,
  Headphones,
  HelpCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { Message } from '@/types';
import { useChat } from '@/contexts/ChatContext';

const QUICK_QUESTIONS = [
  'Komisyon oranları nedir?',
  'Öğrenci nasıl eklerim?',
  'Ödeme ne zaman yapılır?',
  'Program detayları nedir?',
];

export default function ChatDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth();
  const { refetchUnread } = useChat();
  const scrollViewRef = useRef<ScrollView>(null);

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  const messagesQuery = trpc.chat.getMessages.useQuery(
    { token: token ?? '', conversationId: id ?? '' },
    { enabled: !!token && !!id }
  );

  const sendMessageMutation = trpc.chat.sendMessage.useMutation();

  useEffect(() => {
    if (messagesQuery.data) {
      setLocalMessages(messagesQuery.data as Message[]);
    }
  }, [messagesQuery.data]);

  const scrollToEndIfNeeded = useCallback(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []);

  const handleContentSizeChange = useCallback(() => {
    scrollToEndIfNeeded();
  }, [scrollToEndIfNeeded]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isSending || !token || !id) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSending(true);
    const text = inputText.trim();
    setInputText('');

    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      text,
      senderId: user?.id ?? 'current',
      timestamp: new Date().toISOString(),
      read: true,
    };
    setLocalMessages(prev => [...prev, tempMsg]);

    try {
      await sendMessageMutation.mutateAsync({
        token,
        conversationId: id,
        text,
      });

      setTimeout(() => {
        messagesQuery.refetch();
        refetchUnread();
      }, 3000);
    } catch (error) {
      console.log('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, token, id, user, sendMessageMutation, messagesQuery, refetchUnread]);

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

  const messageGroups = groupMessagesByDate(localMessages);

  const renderMessage = (message: Message) => {
    const isOwn = message.senderId === (user?.id ?? 'current') || message.senderId === 'current';
    const isSystem = message.senderId === 'system';

    if (isSystem) {
      return (
        <View key={message.id} style={styles.systemMessageContainer}>
          <View style={styles.systemMessage}>
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
        ]}
      >
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
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.headerAvatar}
        >
          <Headphones size={18} color={Colors.text} />
        </LinearGradient>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Destek Sohbeti</Text>
          <Text style={styles.headerSubtitle}>Compass Abroad</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleContentSizeChange}
      >
        {messagesQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Mesajlar yükleniyor...</Text>
          </View>
        ) : localMessages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Yeni Sohbet</Text>
            <Text style={styles.emptyText}>
              Danışmanınıza soru sormak için mesaj yazın.
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
        <View style={{ height: 10 }} />
      </ScrollView>

      {localMessages.length < 3 && (
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
            placeholder="Mesajınızı yazın..."
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceElevated ?? Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
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
    backgroundColor: Colors.warning + '15',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    maxWidth: '90%',
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  systemMessageText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
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
    backgroundColor: Colors.surfaceElevated ?? Colors.background,
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
});
