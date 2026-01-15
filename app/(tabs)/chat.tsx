import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  MessageCircle,
  ChevronRight,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { MOCK_CONVERSATIONS, getTotalUnreadMessages } from '@/mocks/data';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Dün';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('tr-TR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    }
  };

  const totalUnread = getTotalUnreadMessages();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradient.middle, Colors.background]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Mesajlar</Text>
          {totalUnread > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{totalUnread}</Text>
            </View>
          )}
        </View>
        <Text style={styles.headerSubtitle}>Destek ve danışman iletişimi</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {MOCK_CONVERSATIONS.map((conversation) => (
          <TouchableOpacity
            key={conversation.id}
            style={[
              styles.conversationCard,
              conversation.unreadCount > 0 && styles.conversationCardUnread,
            ]}
            onPress={() => router.push(`/chat/${conversation.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <MessageCircle size={22} color={Colors.secondary} />
              </View>
              {conversation.unreadCount > 0 && (
                <View style={styles.onlineIndicator} />
              )}
            </View>

            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <Text style={styles.participantName}>{conversation.participantName}</Text>
                <Text style={styles.lastMessageTime}>{formatTime(conversation.lastMessageTime)}</Text>
              </View>
              <Text style={styles.participantRole}>{conversation.participantRole}</Text>
              <Text 
                style={[
                  styles.lastMessage,
                  conversation.unreadCount > 0 && styles.lastMessageUnread,
                ]} 
                numberOfLines={1}
              >
                {conversation.lastMessage}
              </Text>
            </View>

            <View style={styles.conversationRight}>
              {conversation.unreadCount > 0 ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{conversation.unreadCount}</Text>
                </View>
              ) : (
                <ChevronRight size={18} color={Colors.textMuted} />
              )}
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.helpCard}>
          <View style={styles.helpIconContainer}>
            <MessageCircle size={24} color={Colors.info} />
          </View>
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>Yardıma mı ihtiyacınız var?</Text>
            <Text style={styles.helpText}>
              Destek ekibimiz 7/24 yanınızda. Herhangi bir sorunuz için yazabilirsiniz.
            </Text>
          </View>
        </View>

        <View style={{ height: 30 }} />
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  conversationCardUnread: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.primary + '40',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.surfaceElevated,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  lastMessageTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  participantRole: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  lastMessageUnread: {
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  conversationRight: {
    marginLeft: 8,
  },
  unreadBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.primaryDark,
  },
  helpCard: {
    flexDirection: 'row',
    backgroundColor: Colors.info + '15',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.info + '30',
  },
  helpIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.info + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  helpText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
