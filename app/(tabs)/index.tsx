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
  UserPlus,
  Wallet,
  Share2,
  HelpCircle,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  RefreshCw,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

import StudentAddModal, { NewStudent } from '@/components/StudentAddModal';
import AmbassadorInviteModal from '@/components/AmbassadorInviteModal';
import PaymentRequestModal, { WithdrawalRequest } from '@/components/PaymentRequestModal';
import NotificationBell from '@/components/NotificationBell';
import HowItWorksModal from '@/components/HowItWorksModal';

import Colors from '@/constants/colors';
import { MOCK_EARNINGS, MOCK_STUDENTS, MOCK_CURRENT_AMBASSADOR, PROGRAMS, MOCK_SOCIAL_MEDIA_LINKS } from '@/mocks/data';
import { SocialMediaLinks, STAGE_LABELS, AMBASSADOR_TYPE_LABELS } from '@/types';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(MOCK_EARNINGS.exchangeRate);
  const [fadeAnim] = useState(() => new Animated.Value(0));
  
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showAmbassadorModal, setShowAmbassadorModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [socialLinks] = useState<SocialMediaLinks>(MOCK_SOCIAL_MEDIA_LINKS);
  const [isLoadingRate, setIsLoadingRate] = useState(false);

  const handleAddStudent = (student: NewStudent) => {
    console.log('New student added:', student);
  };

  const handleWithdrawalRequest = (request: WithdrawalRequest) => {
    console.log('Withdrawal request:', request);
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    fetchExchangeRate();
  }, [fadeAnim]);

  const fetchExchangeRate = async () => {
    setIsLoadingRate(true);
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      if (data && data.rates && data.rates.TRY) {
        setExchangeRate(data.rates.TRY);
        console.log('Exchange rate fetched:', data.rates.TRY);
      }
    } catch (error) {
      console.log('Failed to fetch exchange rate, using default:', error);
    } finally {
      setIsLoadingRate(false);
    }
  };

  const handleSocialPress = async (url: string) => {
    try {
      const { Linking } = await import('react-native');
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        console.log('Cannot open URL:', url);
      }
    } catch (error) {
      console.log('Error opening URL:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchExchangeRate();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number, currency: 'USD' | 'TRY') => {
    if (currency === 'USD') {
      return `$${amount.toLocaleString('en-US')}`;
    }
    return `₺${amount.toLocaleString('tr-TR')}`;
  };

  const recentStudents = MOCK_STUDENTS.slice(0, 3);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradient.start, Colors.gradient.middle, Colors.background]}
        style={[styles.headerGradient, { paddingTop: insets.top }]}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
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
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.helpButton}
                onPress={() => setShowHowItWorksModal(true)}
              >
                <HelpCircle size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
              <NotificationBell />
            </View>
          </View>
          
          <View style={styles.exchangeRateContainer}>
            <Text style={styles.exchangeRateLabel}>Döviz Kuru</Text>
            <View style={styles.exchangeRateRow}>
              <Text style={styles.exchangeRate}>1 USD = ₺{exchangeRate.toFixed(2)}</Text>
              {isLoadingRate && <RefreshCw size={14} color={Colors.secondary} />}
            </View>
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
          <Text style={styles.sectionTitle}>Bizi Takip Edin</Text>
          <View style={styles.socialCard}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialPress(socialLinks.instagram)}
              testID="social-instagram"
            >
              <View style={[styles.socialIconContainer, { backgroundColor: '#E4405F20' }]}>
                <Instagram size={24} color="#E4405F" />
              </View>
              <Text style={styles.socialLabel}>Instagram</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialPress(socialLinks.linkedin)}
              testID="social-linkedin"
            >
              <View style={[styles.socialIconContainer, { backgroundColor: '#0A66C220' }]}>
                <Linkedin size={24} color="#0A66C2" />
              </View>
              <Text style={styles.socialLabel}>LinkedIn</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialPress(socialLinks.twitter)}
              testID="social-twitter"
            >
              <View style={[styles.socialIconContainer, { backgroundColor: '#1DA1F220' }]}>
                <Twitter size={24} color="#1DA1F2" />
              </View>
              <Text style={styles.socialLabel}>Twitter</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialPress(socialLinks.facebook)}
              testID="social-facebook"
            >
              <View style={[styles.socialIconContainer, { backgroundColor: '#1877F220' }]}>
                <Facebook size={24} color="#1877F2" />
              </View>
              <Text style={styles.socialLabel}>Facebook</Text>
            </TouchableOpacity>
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
          
          {recentStudents.map((student) => {
            const program = PROGRAMS.find(p => p.id === student.program);
            return (
              <TouchableOpacity 
                key={student.id} 
                style={styles.studentCard}
                onPress={() => router.push(`/students/${student.id}`)}
              >
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

      <View style={styles.quickActionsContainer}>
        <TouchableOpacity 
          style={styles.quickActionButton} 
          onPress={() => setShowStudentModal(true)}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: Colors.success + '30' }]}>
            <UserPlus size={20} color={Colors.success} />
          </View>
          <Text style={styles.quickActionText}>Öğrenci</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionButton} 
          onPress={() => setShowAmbassadorModal(true)}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: Colors.info + '30' }]}>
            <Share2 size={20} color={Colors.info} />
          </View>
          <Text style={styles.quickActionText}>Davet</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionButton} 
          onPress={() => setShowPaymentModal(true)}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: Colors.secondary + '30' }]}>
            <Wallet size={20} color={Colors.secondary} />
          </View>
          <Text style={styles.quickActionText}>Çekim</Text>
        </TouchableOpacity>
      </View>

      <StudentAddModal
        visible={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        onSubmit={handleAddStudent}
      />
      
      <AmbassadorInviteModal
        visible={showAmbassadorModal}
        onClose={() => setShowAmbassadorModal(false)}
      />
      
      <PaymentRequestModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSubmit={handleWithdrawalRequest}
      />

      <HowItWorksModal
        visible={showHowItWorksModal}
        onClose={() => setShowHowItWorksModal(false)}
      />
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLeft: {
    flex: 1,
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
  exchangeRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exchangeRate: {
    fontSize: 14,
    fontWeight: '600' as const,
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
  socialCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  socialButton: {
    alignItems: 'center',
    flex: 1,
  },
  socialIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  socialLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
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
  quickActionsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  quickActionButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
});
