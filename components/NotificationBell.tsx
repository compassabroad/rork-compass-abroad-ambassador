import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { getUnreadNotificationsCount } from '@/mocks/data';

interface NotificationBellProps {
  size?: number;
}

export default function NotificationBell({ size = 24 }: NotificationBellProps) {
  const router = useRouter();
  const unreadCount = getUnreadNotificationsCount();

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => router.push('/notifications')}
      activeOpacity={0.7}
    >
      <Bell size={size} color={Colors.text} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.text,
  },
});
