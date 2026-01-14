import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TrendingUp,
  Users,
  Star,
  DollarSign,
  ArrowUpRight,
  Clock,
  Award,
  ChevronRight,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { MOCK_EARNINGS, MOCK_STUDENTS, MOCK_CURRENT_AMBASSADOR, PROGRAMS } from '@/mocks/data';
import { STAGE_LABELS, AMBASSADOR_TYPE_LABELS } from '@/types';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(MOCK_EARNINGS.exchangeRate);
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setExchangeRate(32.0 + Math.random() * 0.5);
      setRefreshing(false);
    }, 1500);
  };

  const formatCurrency = (amount: number, currency: 'USD' | 'TRY') => {
    if (currency === 'USD') {
      return `$${amount.toLocaleString('en-US')}`;
    }
    return `₺${amount.toLocaleString('tr-TR')}`;
  };

  const recentStudents = MOCK_STUDENTS.slice(0, 3);
  const stageCount = {
    active: MOCK_STUDENTS.filter(s => !['departed', 'approved'].includes(s.stage)).length,
    completed: MOCK_STUDENTS.filter(s => ['departed', 'approved'].includes(s.stage)).length,
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradient.start, Colors.gradient.middle, Colors.background]}
        style={[styles.headerGradient, { paddingTop: insets.top }]}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Merhaba,</Text>
              <Text style={styles.userName}>{MOCK_CURRENT_AMBASSADOR.name}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: AMBASSADOR_TYPE_LABELS[MOCK_CURRENT_AMBASSADOR.type].color + '30' }]}>
              <Award size={16} color={AMBASSADOR_TYPE_LABELS[MOCK_CURRENT_AMBASSADOR.type].color} />
              <Text style={[styles.badgeText, { color: AMBASSADOR_TYPE_LABELS[MOCK_CURRENT_AMBASSADOR.type].color }]}>
                {AMBASSADOR_TYPE_LABELS[MOCK_CURRENT_AMBASSADOR.type].tr}
              </Text>
            </View>
          </View>
          
          <View style={styles.exchangeRateContainer}>
            <Text style={styles.exchangeRateLabel}>Döviz Kuru</Text>
            <Text style={styles.exchangeRate}>1 USD = ₺{exchangeRate.toFixed(2)}</Text>
          </View>
        </Animated.View>
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
        <View style={styles.earningsCard}>
          <LinearGradient
            colors={[Colors.surfaceElevated, Colors.surface]}
            style={styles.earningsGradient}
          >
            <View style={styles.earningsHeader}>
              <View style={styles.earningsIconContainer}>
                <DollarSign size={24} color={Colors.secondary} />
              </View>
              <Text style={styles.earningsTitle}>Toplam Kazanç</Text>
            </View>
            
            <View style={styles.earningsAmounts}>
              <View style={styles.earningsRow}>
                <Text style={styles.earningsCurrency}>USD</Text>
                <Text style={styles.earningsValue}>{formatCurrency(MOCK_EARNINGS.totalUSD, 'USD')}</Text>
              </View>
              <View style={styles.earningsDivider} />
              <View style={styles.earningsRow}>
                <Text style={styles.earningsCurrency}>TRY</Text>
                <Text style={styles.earningsValueTRY}>{formatCurrency(MOCK_EARNINGS.totalTRY, 'TRY')}</Text>
              </View>
            </View>

            <View style={styles.earningsFooter}>
              <View style={styles.earningsSubItem}>
                <Clock size={14} color={Colors.warning} />
                <Text style={styles.earningsSubLabel}>Bekleyen</Text>
                <Text style={styles.earningsSubValue}>{formatCurrency(MOCK_EARNINGS.pendingUSD, 'USD')}</Text>
              </View>
              <View style={styles.earningsSubItem}>
                <TrendingUp size={14} color={Colors.success} />
                <Text style={styles.earningsSubLabel}>Bu Ay</Text>
                <Text style={[styles.earningsSubValue, { color: Colors.success }]}>
                  {formatCurrency(MOCK_EARNINGS.thisMonthUSD, 'USD')}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: Colors.primary + '20' }]}>
            <View style={[styles.statIcon, { backgroundColor: Colors.primary }]}>
              <Star size={20} color={Colors.secondary} />
            </View>
            <Text style={styles.statValue}>{MOCK_CURRENT_AMBASSADOR.compassPoints}</Text>
            <Text style={styles.statLabel}>Compass Points</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: Colors.success + '20' }]}>
            <View style={[styles.statIcon, { backgroundColor: Colors.success }]}>
              <Users size={20} color={Colors.text} />
            </View>
            <Text style={styles.statValue}>{MOCK_CURRENT_AMBASSADOR.studentsReferred}</Text>
            <Text style={styles.statLabel}>Öğrenci</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: Colors.info + '20' }]}>
            <View style={[styles.statIcon, { backgroundColor: Colors.info }]}>
              <Users size={20} color={Colors.text} />
            </View>
            <Text style={styles.statValue}>{MOCK_CURRENT_AMBASSADOR.subAmbassadors.length}</Text>
            <Text style={styles.statLabel}>Alt Elçi</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pipeline Durumu</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>Tümü</Text>
              <ChevronRight size={16} color={Colors.secondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.pipelineCard}>
            <View style={styles.pipelineRow}>
              <View style={styles.pipelineItem}>
                <View style={[styles.pipelineDot, { backgroundColor: Colors.stages.application }]} />
                <Text style={styles.pipelineCount}>{stageCount.active}</Text>
                <Text style={styles.pipelineLabel}>Aktif</Text>
              </View>
              <View style={styles.pipelineDivider} />
              <View style={styles.pipelineItem}>
                <View style={[styles.pipelineDot, { backgroundColor: Colors.stages.departed }]} />
                <Text style={styles.pipelineCount}>{stageCount.completed}</Text>
                <Text style={styles.pipelineLabel}>Tamamlanan</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Son Öğrenciler</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>Tümü</Text>
              <ChevronRight size={16} color={Colors.secondary} />
            </TouchableOpacity>
          </View>
          
          {recentStudents.map((student, index) => {
            const program = PROGRAMS.find(p => p.id === student.program);
            return (
              <TouchableOpacity key={student.id} style={styles.studentCard}>
                <View style={styles.studentAvatar}>
                  <Text style={styles.studentInitial}>
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentProgram}>{program?.name || student.program}</Text>
                </View>
                <View style={[styles.stageBadge, { backgroundColor: Colors.stages[student.stage] + '30' }]}>
                  <Text style={[styles.stageText, { color: Colors.stages[student.stage] }]}>
                    {STAGE_LABELS[student.stage].tr}
                  </Text>
                </View>
                <ArrowUpRight size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            );
          })}
        </View>

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
  headerGradient: {
    paddingBottom: 30,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  exchangeRateContainer: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exchangeRateLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  exchangeRate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  earningsCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  earningsGradient: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  earningsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  earningsAmounts: {
    marginBottom: 16,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  earningsCurrency: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  earningsValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.secondary,
  },
  earningsValueTRY: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text,
  },
  earningsDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  earningsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  earningsSubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  earningsSubLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  earningsSubValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '500',
  },
  pipelineCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pipelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pipelineItem: {
    flex: 1,
    alignItems: 'center',
  },
  pipelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  pipelineCount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  pipelineLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  pipelineDivider: {
    width: 1,
    height: 50,
    backgroundColor: Colors.border,
    marginHorizontal: 20,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  studentInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  studentProgram: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  stageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  stageText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
