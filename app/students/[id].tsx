import React from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  MessageCircle,
  CheckCircle,
  Circle,
  DollarSign,
  XCircle,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { useExchangeRate } from '@/contexts/ExchangeRateContext';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { STAGE_LABELS, StudentStage } from '@/types';

export default function StudentDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();

  const { rate: exchangeRate } = useExchangeRate();

  const studentQuery = trpc.students.getById.useQuery(
    { token: token || '', studentId: id || '' },
    { enabled: !!token && !!id }
  );

  const student = studentQuery.data;

  if (studentQuery.isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
          <Text style={[styles.errorText, { marginTop: 16 }]}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  if (!student) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Öğrenci bulunamadı</Text>
          <TouchableOpacity style={styles.backButtonError} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isRejected = student.stage === 'visa_rejected';
  const totalCommissionUSD = student.commissions.reduce((sum, c) => sum + c.amountUsd, 0);
  const earnedCommissionUSD = student.commissions.filter(c => c.status === 'completed').reduce((sum, c) => sum + c.amountUsd, 0);
  const pendingCommissionUSD = student.commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amountUsd, 0);

  const handleCall = () => {
    const phoneUrl = `tel:${student.phone.replace(/\s/g, '')}`;
    Linking.openURL(phoneUrl);
  };

  const handleWhatsApp = () => {
    const phone = student.phone.replace(/\s/g, '').replace('+', '');
    const url = Platform.OS === 'web' 
      ? `https://web.whatsapp.com/send?phone=${phone}`
      : `whatsapp://send?phone=${phone}`;
    Linking.openURL(url);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${student.email}`);
  };

  const PIPELINE_STAGES: StudentStage[] = ['pre_payment', 'registered', 'documents_completed', 'visa_applied', 'visa_approved', 'orientation', 'departed'];
  const pipelineMap = new Map(student.pipeline.map(p => [p.stage, p]));
  const currentStageIndex = PIPELINE_STAGES.indexOf(student.stage as StudentStage);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradient.start, Colors.gradient.middle, Colors.background]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.editButton}>
            <Edit2 size={20} color={Colors.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {student.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <Text style={styles.studentName}>{student.name}</Text>
          <View style={styles.programBadge}>
            <Text style={styles.programText}>{student.programName}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={studentQuery.isRefetching}
            onRefresh={() => studentQuery.refetch()}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>İletişim Bilgileri</Text>
          
          <TouchableOpacity style={styles.infoRow} onPress={handleEmail}>
            <View style={[styles.infoIcon, { backgroundColor: Colors.info + '20' }]}>
              <Mail size={18} color={Colors.info} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>E-posta</Text>
              <Text style={styles.infoValue}>{student.email}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoRow} onPress={handleCall}>
            <View style={[styles.infoIcon, { backgroundColor: Colors.success + '20' }]}>
              <Phone size={18} color={Colors.success} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Telefon</Text>
              <Text style={styles.infoValue}>{student.phone}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: Colors.warning + '20' }]}>
              <MapPin size={18} color={Colors.warning} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Hedef Ülke</Text>
              <Text style={styles.infoValue}>{student.country || 'Belirtilmedi'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: Colors.primary + '40' }]}>
              <Calendar size={18} color={Colors.primaryLight} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Kayıt Tarihi</Text>
              <Text style={styles.infoValue}>{formatDate(student.createdAt)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.timelineCard}>
          <Text style={styles.cardTitle}>Pipeline Durumu</Text>
          
          {isRejected && (
            <View style={styles.rejectedBanner}>
              <XCircle size={20} color={Colors.error} />
              <Text style={styles.rejectedText}>Vize başvurusu reddedildi</Text>
            </View>
          )}
          
          <View style={styles.timeline}>
            {PIPELINE_STAGES.map((stageName, index) => {
              const pipelineEntry = pipelineMap.get(stageName);
              const stageIndex = PIPELINE_STAGES.indexOf(stageName);
              const isStageCompleted = pipelineEntry?.date != null || stageIndex < currentStageIndex;
              const isCurrent = stageName === student.stage;
              const stageInfo = STAGE_LABELS[stageName];
              const commissionPercent = stageInfo?.commissionPercent || 0;
              
              if (stageName === 'visa_approved' && isRejected) {
                const rejectedEntry = pipelineMap.get('visa_rejected');
                return (
                  <View key="visa_rejected" style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <View style={[styles.timelineDot, styles.timelineDotRejected]}>
                        <XCircle size={16} color={Colors.text} />
                      </View>
                      {index < PIPELINE_STAGES.length - 1 && (
                        <View style={[styles.timelineLine, styles.timelineLineRejected]} />
                      )}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={[styles.timelineStageName, styles.timelineStageNameRejected]}>
                        {STAGE_LABELS.visa_rejected?.tr || 'Vize Red'}
                      </Text>
                      <Text style={styles.timelineDate}>
                        {rejectedEntry?.date ? formatDate(rejectedEntry.date) : 'Red edildi'}
                      </Text>
                    </View>
                  </View>
                );
              }
              
              return (
                <View key={stageName} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineDot,
                      isStageCompleted && styles.timelineDotCompleted,
                      isCurrent && !isRejected && styles.timelineDotCurrent,
                    ]}>
                      {isStageCompleted ? (
                        <CheckCircle size={16} color={Colors.text} />
                      ) : (
                        <Circle size={16} color={Colors.textMuted} />
                      )}
                    </View>
                    {index < PIPELINE_STAGES.length - 1 && (
                      <View style={[
                        styles.timelineLine,
                        isStageCompleted && styles.timelineLineCompleted,
                      ]} />
                    )}
                  </View>
                  
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineHeader}>
                      <Text style={[
                        styles.timelineStageName,
                        isCurrent && !isRejected && styles.timelineStageNameCurrent,
                      ]}>
                        {stageInfo?.tr || stageName}
                      </Text>
                      {commissionPercent > 0 && (
                        <View style={styles.commissionBadge}>
                          <Text style={styles.commissionBadgeText}>%{commissionPercent}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.timelineDate}>
                      {pipelineEntry?.date ? formatDate(pipelineEntry.date) : 'Bekliyor'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.commissionCard}>
          <View style={styles.commissionHeader}>
            <View style={[styles.commissionIcon, { backgroundColor: Colors.secondary + '20' }]}>
              <DollarSign size={20} color={Colors.secondary} />
            </View>
            <Text style={styles.cardTitle}>Komisyon Detayı</Text>
          </View>
          
          <View style={styles.commissionRateRow}>
            <Text style={styles.commissionRateLabel}>Program:</Text>
            <Text style={styles.commissionRateValue}>{student.programName}</Text>
          </View>
          <View style={styles.commissionRateRow}>
            <Text style={styles.commissionRateLabel}>Toplam Komisyon:</Text>
            <Text style={styles.commissionRateValue}>${totalCommissionUSD}</Text>
          </View>
          
          <View style={styles.commissionDivider} />
          
          <View style={styles.commissionBreakdownRow}>
            {student.commissions.map((c) => {
              const stageLabel = STAGE_LABELS[c.stage as StudentStage];
              return (
                <View key={c.id} style={styles.commissionBreakdownItem}>
                  <Text style={styles.breakdownLabel}>{stageLabel?.tr || c.stage}</Text>
                  <Text style={styles.breakdownAmount}>${c.amountUsd}</Text>
                  <View style={[styles.breakdownStatus, c.status === 'completed' && styles.breakdownStatusEarned]}>
                    <Text style={[styles.breakdownStatusText, c.status === 'completed' && styles.breakdownStatusTextEarned]}>
                      {c.status === 'completed' ? '✓ Kazanıldı' : 'Bekliyor'}
                    </Text>
                  </View>
                </View>
              );
            })}
            {student.commissions.length === 0 && (
              <View style={styles.commissionBreakdownItem}>
                <Text style={styles.breakdownLabel}>Henüz komisyon yok</Text>
              </View>
            )}
          </View>
          
          <View style={styles.commissionDivider} />
          
          <View style={styles.commissionTotalRow}>
            <Text style={styles.commissionTotalLabel}>Kazanılan:</Text>
            <View style={styles.commissionTotalAmounts}>
              <Text style={styles.commissionAmount}>${earnedCommissionUSD}</Text>
              <Text style={styles.commissionAmountTRY}>
                ₺{(earnedCommissionUSD * exchangeRate).toLocaleString('tr-TR')}
              </Text>
            </View>
          </View>
          {pendingCommissionUSD > 0 && (
            <Text style={styles.commissionNote}>
              Bekleyen: ${pendingCommissionUSD} (₺{(pendingCommissionUSD * exchangeRate).toLocaleString('tr-TR')})
            </Text>
          )}
        </View>

        <View style={styles.contactActions}>
          <TouchableOpacity style={styles.contactButton} onPress={handleWhatsApp}>
            <MessageCircle size={20} color={Colors.text} />
            <Text style={styles.contactButtonText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.contactButton, styles.contactButtonCall]} onPress={handleCall}>
            <Phone size={20} color={Colors.text} />
            <Text style={styles.contactButtonText}>Ara</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
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
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: Colors.secondary,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  studentName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  programBadge: {
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  programText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.secondary,
  },
  content: {
    flex: 1,
    marginTop: -10,
  },
  contentContainer: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  timelineCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 60,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  timelineDotCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  timelineDotCurrent: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  timelineLineCompleted: {
    backgroundColor: Colors.success,
  },
  timelineDotRejected: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  timelineLineRejected: {
    backgroundColor: Colors.error,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineStageName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  timelineStageNameCurrent: {
    color: Colors.secondary,
  },
  timelineStageNameRejected: {
    color: Colors.error,
  },
  commissionBadge: {
    backgroundColor: Colors.secondary + '30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  commissionBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.secondary,
  },
  rejectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '20',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  rejectedText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  timelineDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  consultantCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  consultantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  consultantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  consultantAvatarText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  consultantDetails: {
    flex: 1,
  },
  consultantName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  consultantCode: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  commissionCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.secondary + '40',
  },
  commissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  commissionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commissionAmount: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.secondary,
    marginBottom: 2,
  },
  commissionAmountTRY: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  commissionNote: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  commissionRateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commissionRateLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  commissionRateValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  commissionDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  commissionBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  commissionBreakdownItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  breakdownLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center' as const,
  },
  breakdownAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  breakdownStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.warning + '20',
  },
  breakdownStatusEarned: {
    backgroundColor: Colors.success + '20',
  },
  breakdownStatusRejected: {
    backgroundColor: Colors.error + '20',
  },
  breakdownStatusText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
  breakdownStatusTextEarned: {
    color: Colors.success,
  },
  breakdownStatusTextRejected: {
    color: Colors.error,
  },
  commissionTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commissionTotalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  commissionTotalAmounts: {
    alignItems: 'flex-end',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  contactButtonCall: {
    backgroundColor: Colors.info,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  backButtonError: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});
