import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Headphones,
  MessageSquare,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { trpc } from '@/lib/trpc';

interface ConversationItem {
  id: string;
  participantName: string;
  participantRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  const { workingHours, refetchUnread } = useChat();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const conversationsQuery = trpc.chat.getConversations.useQuery(
    { token: token ?? '' },
    { enabled: !!token }
  );

  const conversations = conversationsQuery.data ?? [];

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

  const handleRefresh = useCallback(() => {
    conversationsQuery.refetch();
    refetchUnread();
  }, [conversationsQuery, refetchUnread]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffHours < 48) {
      return 'Dün';
    } else {
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleConversationPress = useCallback((conversation: ConversationItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/chat/${conversation.id}` as any);
  }, [router]);

  const renderConversation = (conversation: ConversationItem) => {
    const hasUnread = conversation.unreadCount > 0;

    return (
      <TouchableOpacity
        key={conversation.id}
        style={styles.conversationCard}
        onPress={() => handleConversationPress(conversation)}
        activeOpacity={0.7}
        testID={`conversation-${conversation.id}`}
      >
        <View style={styles.conversationAvatar}>
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>{getInitials(conversation.participantName)}</Text>
          </LinearGradient>
          {hasUnread && (
            <View style={styles.unreadDot} />
          )}
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.conversationName, hasUnread && styles.conversationNameUnread]}>
              {conversation.participantName}
            </Text>
            <Text style={[styles.conversationTime, hasUnread && styles.conversationTimeUnread]}>
              {formatTime(conversation.lastMessageTime)}
            </Text>
          </View>
          <View style={styles.conversationFooter}>
            <Text
              style={[styles.conversationLastMessage, hasUnread && styles.conversationLastMessageUnread]}
              numberOfLines={1}
            >
              {conversation.lastMessage}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
        <ChevronRight size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradient.middle, Colors.background]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerTop}>
          <View style={styles.consultantInfo}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                style={styles.headerAvatar}
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
        style={styles.conversationList}
        contentContainerStyle={styles.conversationListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={conversationsQuery.isRefetching}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {conversationsQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Sohbetler yükleniyor...</Text>
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <MessageSquare size={48} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Henüz Sohbet Yok</Text>
            <Text style={styles.emptyText}>
              Destek ekibimizle iletişime geçmek için yeni bir sohbet başlatın.
            </Text>
          </View>
        ) : (
          conversations.map(renderConversation)
        )}
      </ScrollView>
    </View>
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
  headerAvatar: {
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
  conversationList: {
    flex: 1,
  },
  conversationListContent: {
    padding: 16,
    paddingBottom: 100,
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
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  conversationAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  avatarGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.secondary,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  conversationContent: {
    flex: 1,
    marginRight: 8,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
    flex: 1,
  },
  conversationNameUnread: {
    fontWeight: '700' as const,
  },
  conversationTime: {
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 8,
  },
  conversationTimeUnread: {
    color: Colors.secondary,
    fontWeight: '600' as const,
  },
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conversationLastMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  conversationLastMessageUnread: {
    color: Colors.text,
    fontWeight: '500' as const,
  },
  unreadBadge: {
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.primaryDark,
  },
});
