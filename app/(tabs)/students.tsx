import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Linking,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  MapPin,
  Calendar,
  Phone,
  Clock,
  Send,
  Mail,
  Copy,
  Search,
  UserPlus,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { PROGRAMS } from '@/mocks/data';
import { StudentStage, STAGE_LABELS } from '@/types';

const STAGES: StudentStage[] = ['pre_payment', 'registered', 'documents_completed', 'visa_applied', 'visa_approved', 'visa_rejected', 'orientation', 'departed'];

interface StudentItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  programName: string;
  stage: string;
  country: string | null;
  invitationStatus: string | null;
  invitationToken: string | null;
  invitedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function StudentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedStage, setSelectedStage] = useState<StudentStage | 'all' | 'pending_kvkk'>('all');
  const scrollViewRef = useRef<ScrollView>(null);
  const { token } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 300);
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchText]);

  const stageFilter = selectedStage === 'all' || selectedStage === 'pending_kvkk' ? undefined : selectedStage;

  const studentsQuery = trpc.students.list.useQuery(
    {
      token: token || '',
      stage: stageFilter,
      search: debouncedSearch || undefined,
    },
    { enabled: !!token }
  );

  const allStudentsQuery = trpc.students.list.useQuery(
    { token: token || '' },
    { enabled: !!token }
  );

  const resendInviteMutation = trpc.students.resendInvite.useMutation({
    onSuccess: () => {
      Alert.alert('Başarılı', 'Davet e-postası tekrar gönderildi.');
      studentsQuery.refetch();
    },
    onError: (error) => {
      Alert.alert('Hata', error.message || 'Davet gönderilemedi');
    },
  });

  const students = studentsQuery.data ?? [];
  const allStudents = allStudentsQuery.data ?? [];

  const pendingKvkkStudents = allStudents.filter(s => s.invitationStatus === 'pending_kvkk');
  const activeStudents = allStudents.filter(s => s.invitationStatus !== 'pending_kvkk');

  const filteredStudents = selectedStage === 'pending_kvkk'
    ? pendingKvkkStudents.filter(s =>
        !debouncedSearch || s.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : students;

  const getStageCount = (stage: StudentStage) => {
    return activeStudents.filter(s => s.stage === stage).length;
  };

  const onRefresh = useCallback(() => {
    studentsQuery.refetch();
    allStudentsQuery.refetch();
  }, [studentsQuery, allStudentsQuery]);

  const handleResendInvite = async (student: StudentItem) => {
    Alert.alert(
      'Davet Gönder',
      `${student.email} adresine davet e-postası tekrar gönderilsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Gönder',
          onPress: () => {
            if (token) {
              resendInviteMutation.mutate({ token, studentId: student.id });
            }
          }
        },
      ]
    );
  };

  const handleCopyInviteLink = async (student: StudentItem) => {
    const link = `https://compassabroad.com/student-registration/${student.invitationToken}`;
    await Clipboard.setStringAsync(link);
    Alert.alert('Link Kopyalandı', 'Davet linki panoya kopyalandı.');
  };

  const handleShareInvite = async (student: StudentItem) => {
    const link = `https://compassabroad.com/student-registration/${student.invitationToken}`;
    try {
      await Share.share({
        message: `Merhaba ${student.name},\n\nCompass Abroad'a davet edildiniz! Kayıt işlemini tamamlamak için aşağıdaki linke tıklayın:\n\n${link}`,
        title: 'Compass Abroad Davet',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} gün önce`;
    if (diffHours > 0) return `${diffHours} saat önce`;
    return 'Az önce';
  };

  const renderPendingStudent = (student: StudentItem) => {
    const program = PROGRAMS.find(p => p.id === student.program);

    return (
      <View key={student.id} style={styles.pendingCard}>
        <View style={styles.pendingHeader}>
          <View style={styles.pendingAvatarContainer}>
            <View style={styles.pendingAvatar}>
              <Text style={styles.pendingInitial}>
                {student.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={styles.pendingBadge}>
              <Clock size={10} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.pendingHeaderInfo}>
            <Text style={styles.pendingName}>{student.name}</Text>
            <Text style={styles.pendingEmail}>{student.email}</Text>
          </View>
        </View>

        <View style={styles.pendingStatusContainer}>
          <View style={styles.pendingStatusBadge}>
            <Clock size={14} color={Colors.warning} />
            <Text style={styles.pendingStatusText}>KVKK Onayı Bekleniyor</Text>
          </View>
          <Text style={styles.pendingTimeText}>
            Davet: {student.invitedAt ? formatTimeAgo(student.invitedAt) : '-'}
          </Text>
        </View>

        <View style={styles.pendingInfo}>
          <View style={styles.pendingInfoRow}>
            <Text style={styles.pendingInfoLabel}>Program:</Text>
            <Text style={styles.pendingInfoValue}>{program?.name || student.programName}</Text>
          </View>
          <View style={styles.pendingInfoRow}>
            <Text style={styles.pendingInfoLabel}>Hedef Ülke:</Text>
            <Text style={styles.pendingInfoValue}>{student.country || '-'}</Text>
          </View>
          {student.notes && (
            <View style={styles.pendingInfoRow}>
              <Text style={styles.pendingInfoLabel}>Not:</Text>
              <Text style={styles.pendingInfoValue}>{student.notes}</Text>
            </View>
          )}
        </View>

        <View style={styles.pendingActions}>
          <TouchableOpacity
            style={styles.pendingActionButton}
            onPress={() => handleResendInvite(student)}
          >
            <Send size={16} color={Colors.secondary} />
            <Text style={styles.pendingActionText}>Tekrar Gönder</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pendingActionButton}
            onPress={() => handleCopyInviteLink(student)}
          >
            <Copy size={16} color={Colors.info} />
            <Text style={[styles.pendingActionText, { color: Colors.info }]}>Linki Kopyala</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pendingActionButton}
            onPress={() => handleShareInvite(student)}
          >
            <Mail size={16} color={Colors.textSecondary} />
            <Text style={[styles.pendingActionText, { color: Colors.textSecondary }]}>Paylaş</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStudent = (student: StudentItem) => {
    const program = PROGRAMS.find(p => p.id === student.program);
    const stage = student.stage as StudentStage;

    return (
      <TouchableOpacity
        key={student.id}
        style={styles.studentCard}
        activeOpacity={0.7}
        onPress={() => router.push(`/students/${student.id}`)}
      >
        <View style={styles.studentHeader}>
          <View style={styles.studentAvatar}>
            <Text style={styles.studentInitial}>
              {student.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <View style={styles.studentHeaderInfo}>
            <Text style={styles.studentName}>{student.name}</Text>
            <View style={styles.studentMeta}>
              <View style={styles.metaItem}>
                <MapPin size={12} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{student.country || '-'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Calendar size={12} color={Colors.textSecondary} />
                <Text style={styles.metaText}>
                  {new Date(student.createdAt).toLocaleDateString('tr-TR')}
                </Text>
              </View>
            </View>
          </View>
          <ChevronRight size={20} color={Colors.textMuted} />
        </View>

        <View style={styles.studentBody}>
          <View style={styles.programBadge}>
            <Text style={styles.programText}>{program?.name || student.programName}</Text>
          </View>

          <View style={styles.stageProgress}>
            {STAGES.map((s, index) => {
              const stageIndex = STAGES.indexOf(stage);
              const isCompleted = index <= stageIndex;
              const isCurrent = index === stageIndex;

              return (
                <View key={s} style={styles.stageProgressItem}>
                  <View
                    style={[
                      styles.stageDot,
                      isCompleted && { backgroundColor: Colors.stages[stage] },
                      isCurrent && styles.stageDotCurrent,
                    ]}
                  />
                  {index < STAGES.length - 1 && (
                    <View
                      style={[
                        styles.stageLine,
                        isCompleted && index < stageIndex && { backgroundColor: Colors.stages[stage] },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>

          <View style={[styles.currentStageBadge, { backgroundColor: (Colors.stages[stage] || '#9CA3AF') + '20' }]}>
            <View style={[styles.currentStageDot, { backgroundColor: Colors.stages[stage] || '#9CA3AF' }]} />
            <Text style={[styles.currentStageText, { color: Colors.stages[stage] || '#9CA3AF' }]}>
              {STAGE_LABELS[stage]?.tr || stage}
            </Text>
          </View>
        </View>

        <View style={styles.studentFooter}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => Linking.openURL(`tel:${student.phone}`)}
          >
            <Phone size={16} color={Colors.primary} />
            <Text style={styles.contactButtonText}>İletişim</Text>
          </TouchableOpacity>
          <View style={styles.commissionInfo}>
            <Text style={styles.commissionLabel}>Program:</Text>
            <Text style={styles.commissionValue}>{student.programName}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const isLoading = studentsQuery.isLoading || allStudentsQuery.isLoading;
  const isRefreshing = studentsQuery.isRefetching || allStudentsQuery.isRefetching;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradient.middle, Colors.background]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.headerTitle}>Öğrenciler</Text>
        <Text style={styles.headerSubtitle}>Pipeline takibi</Text>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Öğrenci ara..."
            placeholderTextColor={Colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedStage === 'all' && styles.filterChipActive,
            ]}
            onPress={() => setSelectedStage('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedStage === 'all' && styles.filterChipTextActive,
              ]}
            >
              Tümü ({allStudents.length})
            </Text>
          </TouchableOpacity>

          {pendingKvkkStudents.length > 0 && (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedStage === 'pending_kvkk' && styles.filterChipActive,
                selectedStage === 'pending_kvkk' && { borderColor: Colors.warning },
              ]}
              onPress={() => setSelectedStage('pending_kvkk')}
            >
              <View style={[styles.filterDot, { backgroundColor: Colors.warning }]} />
              <Text
                style={[
                  styles.filterChipText,
                  selectedStage === 'pending_kvkk' && styles.filterChipTextActive,
                ]}
              >
                Onay Bekliyor ({pendingKvkkStudents.length})
              </Text>
            </TouchableOpacity>
          )}

          {STAGES.map((stage) => (
            <TouchableOpacity
              key={stage}
              style={[
                styles.filterChip,
                selectedStage === stage && styles.filterChipActive,
                selectedStage === stage && { borderColor: Colors.stages[stage] },
              ]}
              onPress={() => setSelectedStage(stage)}
            >
              <View style={[styles.filterDot, { backgroundColor: Colors.stages[stage] }]} />
              <Text
                style={[
                  styles.filterChipText,
                  selectedStage === stage && styles.filterChipTextActive,
                ]}
              >
                {STAGE_LABELS[stage].tr} ({getStageCount(stage)})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Yükleniyor...</Text>
          </View>
        ) : filteredStudents.length > 0 ? (
          filteredStudents.map(student =>
            student.invitationStatus === 'pending_kvkk'
              ? renderPendingStudent(student)
              : renderStudent(student)
          )
        ) : (
          <View style={styles.emptyState}>
            <UserPlus size={48} color={Colors.textMuted} />
            <Text style={styles.emptyStateTitle}>Henüz öğrenci eklenmemiş</Text>
            <Text style={styles.emptyStateText}>
              Dashboard&apos;dan yeni öğrenci ekleyerek başlayın
            </Text>
          </View>
        )}
        <View style={{ height: 20 }} />
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 12,
  },
  filtersContainer: {
    backgroundColor: Colors.background,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.primary + '30',
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  filterChipTextActive: {
    color: Colors.text,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  studentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  studentInitial: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  studentHeaderInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  studentMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  studentBody: {
    marginBottom: 16,
  },
  programBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  programText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.secondary,
  },
  stageProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  stageProgressItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
  stageDotCurrent: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: Colors.background,
  },
  stageLine: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.border,
    marginLeft: 2,
  },
  currentStageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  currentStageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  currentStageText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  studentFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.primary + '15',
    borderRadius: 8,
  },
  contactButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  commissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto' as const,
  },
  commissionLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  commissionValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.secondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  pendingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.warning + '50',
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pendingAvatarContainer: {
    position: 'relative' as const,
    marginRight: 12,
  },
  pendingAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.warning + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingInitial: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
  pendingBadge: {
    position: 'absolute' as const,
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  pendingHeaderInfo: {
    flex: 1,
  },
  pendingName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  pendingEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  pendingStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pendingStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  pendingStatusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
  pendingTimeText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  pendingInfo: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  pendingInfoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  pendingInfoLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    width: 90,
  },
  pendingInfoValue: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
    flex: 1,
  },
  pendingActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    gap: 8,
  },
  pendingActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: Colors.background,
    borderRadius: 8,
    gap: 6,
  },
  pendingActionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.secondary,
  },
});
