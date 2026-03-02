import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Users,
  Phone,
  Mail,
  MessageCircle,
  Filter,
  X,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { ProgramType } from '@/types';

interface TeamMemberData {
  id: string;
  name: string;
  title: string;
  expertiseAreas: string[];
  languages: string[];
  availability: 'available' | 'busy';
  email: string;
  phone: string;
}

export default function TeamScreen() {
  const { token } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<ProgramType | null>(null);

  const teamQuery = trpc.team.list.useQuery(
    { token: token ?? '' },
    { enabled: !!token }
  );

  const filteredTeam = useMemo(() => {
    const members: TeamMemberData[] = teamQuery.data ?? [];
    if (!selectedFilter) return members;
    return members.filter(member =>
      member.expertiseAreas.includes(selectedFilter)
    );
  }, [selectedFilter, teamQuery.data]);

  const handleCall = useCallback((phone: string) => {
    const phoneUrl = Platform.OS === 'ios' ? `tel:${phone}` : `tel:${phone}`;
    Linking.openURL(phoneUrl).catch(err => console.log('Error opening phone:', err));
  }, []);

  const handleEmail = useCallback((email: string) => {
    Linking.openURL(`mailto:${email}`).catch(err => console.log('Error opening email:', err));
  }, []);

  const handleWhatsApp = useCallback((phone: string) => {
    const cleanPhone = phone.replace(/\s+/g, '').replace('+', '');
    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    Linking.openURL(whatsappUrl).catch(err => console.log('Error opening WhatsApp:', err));
  }, []);

  const programsQuery = trpc.students.listPrograms.useQuery();
  const PROGRAMS = useMemo(() => programsQuery.data ?? [], [programsQuery.data]);

  const getProgramName = useCallback((programId: string): string => {
    const program = PROGRAMS.find((p: any) => p.id === programId);
    return program?.name || programId;
  }, [PROGRAMS]);

  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const renderFilterChip = (program: any) => {
    const isSelected = selectedFilter === program.id;
    return (
      <TouchableOpacity
        key={program.id}
        style={[
          styles.filterChip,
          isSelected && styles.filterChipSelected,
        ]}
        onPress={() => setSelectedFilter(isSelected ? null : program.id)}
        testID={`filter-${program.id}`}
      >
        <Text
          style={[
            styles.filterChipText,
            isSelected && styles.filterChipTextSelected,
          ]}
        >
          {program.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTeamMember = (member: TeamMemberData) => {
    const isAvailable = member.availability === 'available';

    return (
      <View key={member.id} style={styles.memberCard}>
        <View style={styles.memberHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(member.name)}</Text>
            </View>
            <View
              style={[
                styles.statusDot,
                isAvailable ? styles.statusAvailable : styles.statusBusy,
              ]}
            />
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{member.name}</Text>
            <Text style={styles.memberTitle}>{member.title}</Text>
            <View style={styles.statusBadge}>
              <View
                style={[
                  styles.statusIndicator,
                  isAvailable ? styles.statusAvailable : styles.statusBusy,
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  isAvailable ? styles.statusTextAvailable : styles.statusTextBusy,
                ]}
              >
                {isAvailable ? 'Müsait' : 'Meşgul'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.expertiseSection}>
          <Text style={styles.sectionLabel}>Uzmanlık Alanları</Text>
          <View style={styles.expertiseTags}>
            {member.expertiseAreas.map(area => (
              <View key={area} style={styles.expertiseTag}>
                <Text style={styles.expertiseTagText}>{getProgramName(area)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.languagesSection}>
          <Text style={styles.sectionLabel}>Diller</Text>
          <Text style={styles.languagesText}>{member.languages.join(' • ')}</Text>
        </View>

        <View style={styles.contactButtons}>
          <TouchableOpacity
            style={[styles.contactButton, styles.callButton]}
            onPress={() => handleCall(member.phone)}
            testID={`call-${member.id}`}
          >
            <Phone color="#FFFFFF" size={18} />
            <Text style={styles.contactButtonText}>Ara</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.contactButton, styles.emailButton]}
            onPress={() => handleEmail(member.email)}
            testID={`email-${member.id}`}
          >
            <Mail color="#FFFFFF" size={18} />
            <Text style={styles.contactButtonText}>E-posta</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.contactButton, styles.whatsappButton]}
            onPress={() => handleWhatsApp(member.phone)}
            testID={`whatsapp-${member.id}`}
          >
            <MessageCircle color="#FFFFFF" size={18} />
            <Text style={styles.contactButtonText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradient.start, Colors.gradient.middle, Colors.gradient.end]}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Users color={Colors.secondary} size={28} />
            <Text style={styles.headerTitle}>Danışman Ekibimiz</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.filterSection}>
        <View style={styles.filterHeader}>
          <Filter color={Colors.textSecondary} size={18} />
          <Text style={styles.filterTitle}>Uzmanlık Alanına Göre Filtrele</Text>
          {selectedFilter && (
            <TouchableOpacity
              style={styles.clearFilter}
              onPress={() => setSelectedFilter(null)}
              testID="clear-filter"
            >
              <X color={Colors.textMuted} size={16} />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
        >
          {PROGRAMS.map(renderFilterChip)}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={teamQuery.isRefetching}
            onRefresh={() => teamQuery.refetch()}
            tintColor={Colors.primary}
          />
        }
      >
        {teamQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Ekip bilgileri yükleniyor...</Text>
          </View>
        ) : filteredTeam.length > 0 ? (
          filteredTeam.map(renderTeamMember)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Bu alanda uzman danışman bulunamadı.
            </Text>
          </View>
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
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  filterSection: {
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  filterTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  clearFilter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChips: {
    paddingHorizontal: 20,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipSelected: {
    backgroundColor: Colors.secondary + '20',
    borderColor: Colors.secondary,
  },
  filterChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  filterChipTextSelected: {
    color: Colors.secondary,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
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
  memberCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  memberHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  statusAvailable: {
    backgroundColor: Colors.success,
  },
  statusBusy: {
    backgroundColor: Colors.error,
  },
  memberInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  memberTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  statusTextAvailable: {
    color: Colors.success,
  },
  statusTextBusy: {
    color: Colors.error,
  },
  expertiseSection: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  expertiseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  expertiseTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.secondary + '20',
  },
  expertiseTagText: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '500' as const,
  },
  languagesSection: {
    marginBottom: 18,
  },
  languagesText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  callButton: {
    backgroundColor: Colors.info,
  },
  emailButton: {
    backgroundColor: Colors.primary,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  contactButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
