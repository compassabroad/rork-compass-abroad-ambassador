import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Megaphone,
  ChevronRight,
  Bell,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { Announcement } from '@/types';

export default function AnnouncementsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();

  const announcementsQuery = trpc.notifications.listAnnouncements.useQuery(
    { token: token || '' },
    { enabled: !!token }
  );

  const announcements = (announcementsQuery.data ?? []) as Announcement[];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleAnnouncementPress = (announcement: Announcement) => {
    router.push(`/announcements/${announcement.id}`);
  };

  const unreadCount = announcements.filter(a => !a.read).length;

  const renderAnnouncement = ({ item }: { item: Announcement }) => (
    <TouchableOpacity
      style={[styles.announcementCard, !item.read && styles.announcementCardUnread]}
      onPress={() => handleAnnouncementPress(item)}
    >
      <View style={styles.announcementHeader}>
        <View style={[styles.iconContainer, { backgroundColor: item.read ? Colors.surface : Colors.secondary + '20' }]}>
          <Megaphone size={20} color={item.read ? Colors.textSecondary : Colors.secondary} />
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.announcementContent}>
        <Text style={[styles.announcementTitle, !item.read && styles.announcementTitleUnread]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.announcementPreview} numberOfLines={2}>
          {item.preview}
        </Text>
        <Text style={styles.announcementDate}>{formatDate(item.date)}</Text>
      </View>
      <ChevronRight size={20} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradient.middle, Colors.background]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Duyurular</Text>
          <View style={styles.headerRight}>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={announcements}
        renderItem={renderAnnouncement}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={announcementsQuery.isRefetching}
            onRefresh={() => announcementsQuery.refetch()}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Henüz duyuru yok</Text>
          </View>
        }
      />
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
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  badge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  announcementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  announcementCardUnread: {
    backgroundColor: Colors.surfaceLight,
    borderColor: Colors.secondary + '40',
  },
  announcementHeader: {
    position: 'relative',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.secondary,
    borderWidth: 2,
    borderColor: Colors.surfaceLight,
  },
  announcementContent: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  announcementTitleUnread: {
    fontWeight: '700',
  },
  announcementPreview: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  announcementDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
});
