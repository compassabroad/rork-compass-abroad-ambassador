import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
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
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

import Colors from '@/constants/colors';
import { useExchangeRate } from '@/contexts/ExchangeRateContext';
import { MOCK_STUDENTS, PROGRAMS, MOCK_CURRENT_AMBASSADOR } from '@/mocks/data';
import { StudentStage, STAGE_LABELS, Student } from '@/types';
import { calculateCommissionBreakdown } from '@/utils/commissionCalculator';

const STAGES: StudentStage[] = ['pre_payment', 'registered', 'documents_completed', 'visa_applied', 'visa_approved', 'visa_rejected', 'orientation', 'departed'];

const MOCK_PENDING_STUDENTS: Student[] = [
  {
    id: 'pending-1',
    name: 'Ayşe Yılmaz',
    email: 'ayse.yilmaz@email.com',
    phone: '+90 532 111 2233',
    program: 'bachelor',
    stage: 'pre_payment',
    registeredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    country: 'USA',
    invitationStatus: 'pending_kvkk',
    invitationToken: 'abc123xyz789',
    invitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Dil okulu sonrası lisans planlıyor',
  },
  {
    id: 'pending-2',
    name: 'Mert Kaya',
    email: 'mert.kaya@email.com',
    phone: '+90 533 222 3344',
    program: 'language_education',
    stage: 'pre_payment',
    registeredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    country: 'UK',
    invitationStatus: 'pending_kvkk',
    invitationToken: 'def456uvw012',
    invitedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function StudentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedStage, setSelectedStage] = useState<StudentStage | 'all' | 'pending_kvkk'>('all');
  const scrollViewRef = useRef<ScrollView>(null);
  const { rate: exchangeRate } = useExchangeRate();
  const ambassadorId = MOCK_CURRENT_AMBASSADOR.id;

  const allStudents = [...MOCK_STUDENTS, ...MOCK_PENDING_STUDENTS];
  const pendingKvkkStudents = MOCK_PENDING_STUDENTS.filter(s => s.invitationStatus === 'pending_kvkk');
  const activeStudents = MOCK_STUDENTS;

  const filteredStudents = selectedStage === 'all'
    ? allStudents
    : selectedStage === 'pending_kvkk'
    ? pendingKvkkStudents
    : activeStudents.filter(s => s.stage === selectedStage);

  const getStageCount = (stage: StudentStage) => {
    return MOCK_STUDENTS.filter(s => s.stage === stage).length;
  };

  const handleResendInvite = async (student: Student) => {
    Alert.alert(
      'Davet Gönder',
      `${student.email} adresine davet e-postası tekrar gönderilsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Gönder', 
          onPress: () => {
            Alert.alert('Başarılı', 'Davet e-postası tekrar gönderildi.');
          }
        },
      ]
    );
  };

  const handleCopyInviteLink = async (student: Student) => {
    const link = `https://compassabroad.com/student-registration/${student.invitationToken}`;
    await Clipboard.setStringAsync(link);
    Alert.alert('Link Kopyalandı', 'Davet linki panoya kopyalandı.');
  };

  const handleShareInvite = async (student: Student) => {
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

  const renderPendingStudent = (student: Student) => {
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
            <Text style={styles.pendingInfoValue}>{program?.name || student.program}</Text>
          </View>
          <View style={styles.pendingInfoRow}>
            <Text style={styles.pendingInfoLabel}>Hedef Ülke:</Text>
            <Text style={styles.pendingInfoValue}>{student.country}</Text>
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

  const renderStudent = (student: Student) => {
    const program = PROGRAMS.find(p => p.id === student.program);
    const breakdown = calculateCommissionBreakdown(student, ambassadorId);
    
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
                <Text style={styles.metaText}>{student.country || 'USA'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Calendar size={12} color={Colors.textSecondary} />
                <Text style={styles.metaText}>
                  {new Date(student.registeredAt).toLocaleDateString('tr-TR')}
                </Text>
              </View>
            </View>
          </View>
          <ChevronRight size={20} color={Colors.textMuted} />
        </View>

        <View style={styles.studentBody}>
          <View style={styles.programBadge}>
            <Text style={styles.programText}>{program?.name || student.program}</Text>
          </View>
          
          <View style={styles.stageProgress}>
            {STAGES.map((stage, index) => {
              const stageIndex = STAGES.indexOf(student.stage);
              const isCompleted = index <= stageIndex;
              const isCurrent = index === stageIndex;
              
              return (
                <View key={stage} style={styles.stageProgressItem}>
                  <View
                    style={[
                      styles.stageDot,
                      isCompleted && { backgroundColor: Colors.stages[student.stage] },
                      isCurrent && styles.stageDotCurrent,
                    ]}
                  />
                  {index < STAGES.length - 1 && (
                    <View
                      style={[
                        styles.stageLine,
                        isCompleted && index < stageIndex && { backgroundColor: Colors.stages[student.stage] },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
          
          <View style={[styles.currentStageBadge, { backgroundColor: Colors.stages[student.stage] + '20' }]}>
            <View style={[styles.currentStageDot, { backgroundColor: Colors.stages[student.stage] }]} />
            <Text style={[styles.currentStageText, { color: Colors.stages[student.stage] }]}>
              {STAGE_LABELS[student.stage].tr}
            </Text>
          </View>
        </View>

        <View style={styles.studentFooter}>
          <TouchableOpacity style={styles.contactButton}>
            <Phone size={16} color={Colors.primary} />
            <Text style={styles.contactButtonText}>İletişim</Text>
          </TouchableOpacity>
          <View style={styles.commissionInfo}>
            <Text style={styles.commissionLabel}>Kazanılan:</Text>
            <Text style={styles.commissionValue}>${breakdown.earnedCommissionUSD}</Text>
            <Text style={styles.commissionValueTRY}>₺{(breakdown.earnedCommissionUSD * exchangeRate).toLocaleString('tr-TR')}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradient.middle, Colors.background]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.headerTitle}>Öğrenciler</Text>
        <Text style={styles.headerSubtitle}>Pipeline takibi</Text>
      </LinearGradient>

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
      >
        {filteredStudents.length > 0 ? (
          filteredStudents.map(student => 
            student.invitationStatus === 'pending_kvkk' 
              ? renderPendingStudent(student)
              : renderStudent(student)
          )
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Bu aşamada öğrenci yok</Text>
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
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
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
    fontWeight: '500',
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
    fontWeight: '600',
    color: Colors.text,
  },
  studentHeaderInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '600',
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
  commissionValueTRY: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textSecondary,
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
    position: 'relative',
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
    position: 'absolute',
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
