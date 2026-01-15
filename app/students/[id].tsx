import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
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
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { useExchangeRate } from '@/contexts/ExchangeRateContext';
import { MOCK_STUDENTS, MOCK_STUDENT_PIPELINES, PROGRAMS, MOCK_CURRENT_AMBASSADOR } from '@/mocks/data';
import { STAGE_LABELS, StudentStage } from '@/types';

const STAGES: StudentStage[] = ['registered', 'documents', 'application', 'interview', 'visa', 'approved', 'departed'];

export default function StudentDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { rate: exchangeRate } = useExchangeRate();
  
  const student = MOCK_STUDENTS.find(s => s.id === id);
  const pipeline = id ? MOCK_STUDENT_PIPELINES[id] : undefined;
  const program = student ? PROGRAMS.find(p => p.id === student.program) : undefined;

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

  const currentStageIndex = STAGES.indexOf(student.stage);
  const earnedCommission = program ? Math.floor(program.commission * (currentStageIndex / (STAGES.length - 1))) : 0;

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
            <Text style={styles.programText}>{program?.name || student.program}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
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
              <Text style={styles.infoValue}>{formatDate(student.registeredAt)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.timelineCard}>
          <Text style={styles.cardTitle}>Pipeline Durumu</Text>
          
          <View style={styles.timeline}>
            {pipeline?.map((stage, index) => {
              const isCompleted = stage.date !== null;
              const isCurrent = STAGES[index] === student.stage;
              const stageInfo = STAGE_LABELS[STAGES[index] as StudentStage];
              
              return (
                <View key={stage.stage} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineDot,
                      isCompleted && styles.timelineDotCompleted,
                      isCurrent && styles.timelineDotCurrent,
                    ]}>
                      {isCompleted ? (
                        <CheckCircle size={16} color={Colors.text} />
                      ) : (
                        <Circle size={16} color={Colors.textMuted} />
                      )}
                    </View>
                    {index < (pipeline?.length ?? 0) - 1 && (
                      <View style={[
                        styles.timelineLine,
                        isCompleted && styles.timelineLineCompleted,
                      ]} />
                    )}
                  </View>
                  
                  <View style={styles.timelineContent}>
                    <Text style={[
                      styles.timelineStageName,
                      isCurrent && styles.timelineStageNameCurrent,
                    ]}>
                      {stageInfo?.tr || stage.stage}
                    </Text>
                    <Text style={styles.timelineDate}>
                      {stage.date ? formatDate(stage.date) : 'Bekliyor'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.consultantCard}>
          <Text style={styles.cardTitle}>Danışman</Text>
          <View style={styles.consultantInfo}>
            <View style={styles.consultantAvatar}>
              <Text style={styles.consultantAvatarText}>
                {MOCK_CURRENT_AMBASSADOR.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={styles.consultantDetails}>
              <Text style={styles.consultantName}>{MOCK_CURRENT_AMBASSADOR.name}</Text>
              <Text style={styles.consultantCode}>{MOCK_CURRENT_AMBASSADOR.referralCode}</Text>
            </View>
          </View>
        </View>

        <View style={styles.commissionCard}>
          <View style={styles.commissionHeader}>
            <View style={[styles.commissionIcon, { backgroundColor: Colors.secondary + '20' }]}>
              <DollarSign size={20} color={Colors.secondary} />
            </View>
            <Text style={styles.cardTitle}>Kazanılan Komisyon</Text>
          </View>
          <Text style={styles.commissionAmount}>${earnedCommission}</Text>
          <Text style={styles.commissionAmountTRY}>
            ₺{(earnedCommission * exchangeRate).toLocaleString('tr-TR')}
          </Text>
          <Text style={styles.commissionNote}>
            Toplam potansiyel: ${program?.commission || 0} (₺{((program?.commission || 0) * exchangeRate).toLocaleString('tr-TR')})
          </Text>
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
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
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
