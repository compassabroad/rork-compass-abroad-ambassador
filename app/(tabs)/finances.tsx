import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DollarSign,
  Clock,
  TrendingUp,
  UserPlus,
  BookOpen,
  CheckCircle,
  Plane,
  Users,
  Gift,
  Wallet,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react-native';

import PaymentRequestModal, { WithdrawalRequest } from '@/components/PaymentRequestModal';
import Colors from '@/constants/colors';
import { useExchangeRate } from '@/contexts/ExchangeRateContext';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { TRANSACTION_TYPE_LABELS } from '@/types';

const getTransactionIcon = (type: string) => {
  const iconProps = { size: 18, color: Colors.text };
  switch (type) {
    case 'student_registration':
    case 'student_pre_payment':
      return <UserPlus {...iconProps} />;
    case 'student_program_selected':
    case 'student_registered':
      return <BookOpen {...iconProps} />;
    case 'student_visa_approved':
      return <CheckCircle {...iconProps} />;
    case 'student_departed':
      return <Plane {...iconProps} />;
    case 'referral_commission':
      return <Users {...iconProps} />;
    case 'bonus':
      return <Gift {...iconProps} />;
    case 'payment_withdrawal':
      return <Wallet {...iconProps} />;
    default:
      return <DollarSign {...iconProps} />;
  }
};

const getTransactionLabel = (type: string): string => {
  const labels = TRANSACTION_TYPE_LABELS as Record<string, { tr: string; en: string; icon: string }>;
  if (labels[type]) {
    return labels[type].tr;
  }
  if (type.startsWith('student_')) {
    const stage = type.replace('student_', '');
    const stageLabels: Record<string, string> = {
      pre_payment: 'Ön Ödeme Komisyonu',
      registered: 'Kayıt Komisyonu',
      documents_completed: 'Belge Komisyonu',
      visa_applied: 'Vize Başvuru Komisyonu',
      visa_approved: 'Vize Onay Komisyonu',
      departed: 'Uçuş Komisyonu',
    };
    return stageLabels[stage] || 'Komisyon';
  }
  return 'İşlem';
};

export default function FinancesScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const { rate: exchangeRate, fetchRate } = useExchangeRate();
  const { token } = useAuth();

  const overviewQuery = trpc.finances.getOverview.useQuery(
    { token: token || '' },
    { enabled: !!token }
  );

  const transactionsQuery = trpc.finances.getTransactions.useQuery(
    { token: token || '' },
    { enabled: !!token }
  );

  const programBreakdownQuery = trpc.finances.getCommissionsByProgram.useQuery(
    { token: token || '' },
    { enabled: !!token }
  );

  const withdrawalMutation = trpc.finances.createWithdrawal.useMutation({
    onSuccess: (data) => {
      setShowPaymentModal(false);
      overviewQuery.refetch();
      transactionsQuery.refetch();
    },
    onError: (error) => {
      console.log('[Finances] Withdrawal error:', error.message);
    },
  });

  const overview = overviewQuery.data;
  const transactions = transactionsQuery.data || [];
  const programEarnings = programBreakdownQuery.data || [];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRate();
    Promise.all([
      overviewQuery.refetch(),
      transactionsQuery.refetch(),
      programBreakdownQuery.refetch(),
    ]).finally(() => setRefreshing(false));
  }, [overviewQuery, transactionsQuery, programBreakdownQuery, fetchRate]);

  const handleWithdrawalRequest = (request: WithdrawalRequest) => {
    if (!token) return;
    const amountUSD = request.currency === 'USD' ? request.amount : request.amount / exchangeRate;
    const amountTRY = request.currency === 'TRY' ? request.amount : request.amount * exchangeRate;
    withdrawalMutation.mutate({
      token,
      iban: request.iban,
      bankName: request.bankName,
      amountUSD,
      amountTRY,
      exchangeRate,
    });
  };

  const formatCurrency = (amount: number, currency: 'USD' | 'TRY') => {
    const absAmount = Math.abs(amount);
    if (currency === 'USD') {
      return `$${absAmount.toLocaleString('en-US')}`;
    }
    return `₺${absAmount.toLocaleString('tr-TR')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const totalEarnedUSD = overview?.totalEarnedUSD ?? 0;
  const totalPendingUSD = overview?.totalPendingUSD ?? 0;
  const availableUSD = overview?.availableUSD ?? 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradient.middle, Colors.background]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.headerTitle}>Finansal Durum</Text>
        <Text style={styles.headerSubtitle}>Kazanç ve işlem geçmişi</Text>
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
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={[Colors.surfaceElevated, Colors.surface]}
            style={styles.summaryGradient}
          >
            <View style={styles.summaryHeader}>
              <View style={styles.summaryIconContainer}>
                <DollarSign size={24} color={Colors.secondary} />
              </View>
              <Text style={styles.summaryTitle}>Toplam Kazanç</Text>
            </View>

            {overviewQuery.isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : (
              <>
                <View style={styles.summaryAmounts}>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>USD</Text>
                    <Text style={styles.amountValuePrimary}>{formatCurrency(totalEarnedUSD, 'USD')}</Text>
                  </View>
                  <View style={styles.amountDivider} />
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>TRY</Text>
                    <Text style={styles.amountValueSecondary}>{formatCurrency(totalEarnedUSD * exchangeRate, 'TRY')}</Text>
                  </View>
                </View>

                <View style={styles.summaryStats}>
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: Colors.success + '20' }]}>
                      <TrendingUp size={16} color={Colors.success} />
                    </View>
                    <View>
                      <Text style={styles.statLabel}>Çekilebilir</Text>
                      <Text style={[styles.statValue, { color: Colors.success }]}>
                        {formatCurrency(availableUSD, 'USD')} / {formatCurrency(availableUSD * exchangeRate, 'TRY')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: Colors.warning + '20' }]}>
                      <Clock size={16} color={Colors.warning} />
                    </View>
                    <View>
                      <Text style={styles.statLabel}>Bekleyen</Text>
                      <Text style={[styles.statValue, { color: Colors.warning }]}>
                        {formatCurrency(totalPendingUSD, 'USD')} / {formatCurrency(totalPendingUSD * exchangeRate, 'TRY')}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </LinearGradient>
        </View>

        <TouchableOpacity
          style={styles.withdrawButton}
          onPress={() => setShowPaymentModal(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.secondary, '#D4A520']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.withdrawButtonGradient}
          >
            <Wallet size={20} color={Colors.primaryDark} />
            <Text style={styles.withdrawButtonText}>Ödeme Talep Et</Text>
            <ChevronRight size={20} color={Colors.primaryDark} />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İşlem Geçmişi</Text>
          
          {transactionsQuery.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <DollarSign size={32} color={Colors.textMuted} />
              <Text style={styles.emptyStateText}>Henüz işlem bulunmuyor</Text>
            </View>
          ) : (
            transactions.map((transaction) => {
              const isPositive = transaction.type !== 'payment_withdrawal' && transaction.amountUSD > 0;
              
              return (
                <TouchableOpacity key={transaction.id} style={styles.transactionCard} activeOpacity={0.7}>
                  <View style={[
                    styles.transactionIcon,
                    { backgroundColor: isPositive ? Colors.success + '20' : Colors.error + '20' }
                  ]}>
                    {getTransactionIcon(transaction.type)}
                  </View>
                  
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionType}>
                      {getTransactionLabel(transaction.type)}
                    </Text>
                    <Text style={styles.transactionDescription} numberOfLines={1}>
                      {transaction.description}
                    </Text>
                    <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
                  </View>
                  
                  <View style={styles.transactionAmounts}>
                    <View style={styles.transactionAmountRow}>
                      {isPositive ? (
                        <ArrowDownLeft size={14} color={Colors.success} />
                      ) : (
                        <ArrowUpRight size={14} color={Colors.error} />
                      )}
                      <Text style={[
                        styles.transactionAmountUSD,
                        { color: isPositive ? Colors.success : Colors.error }
                      ]}>
                        {isPositive ? '+' : '-'}{formatCurrency(transaction.amountUSD, 'USD')}
                      </Text>
                    </View>
                    <Text style={styles.transactionAmountTRY}>
                      {formatCurrency(transaction.amountUSD * exchangeRate, 'TRY')}
                    </Text>
                    {transaction.status === 'pending' && (
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingText}>Bekliyor</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {programEarnings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Program Bazlı Kazanç</Text>
            
            <View style={styles.programEarningsCard}>
              {programEarnings.map((item, index) => (
                <View key={item.programId}>
                  <View style={styles.programEarningRow}>
                    <View style={styles.programInfo}>
                      <Text style={styles.programName}>{item.programName}</Text>
                      <Text style={styles.programCount}>{item.studentCount} öğrenci</Text>
                    </View>
                    <View style={styles.programEarnedContainer}>
                      <Text style={styles.programEarned}>{formatCurrency(item.earnedUSD, 'USD')}</Text>
                      <Text style={styles.programEarnedTRY}>{formatCurrency(item.earnedUSD * exchangeRate, 'TRY')}</Text>
                    </View>
                  </View>
                  {index < programEarnings.length - 1 && <View style={styles.programDivider} />}
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      <PaymentRequestModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSubmit={handleWithdrawalRequest}
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  summaryCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  summaryGradient: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  summaryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  summaryAmounts: {
    marginBottom: 20,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  amountValuePrimary: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.secondary,
  },
  amountValueSecondary: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  amountDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  withdrawButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 24,
  },
  withdrawButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  withdrawButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primaryDark,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 12,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  transactionAmounts: {
    alignItems: 'flex-end' as const,
  },
  transactionAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  transactionAmountUSD: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  transactionAmountTRY: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pendingBadge: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  pendingText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
  programEarningsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  programEarningRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  programCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  programEarned: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.secondary,
  },
  programEarnedContainer: {
    alignItems: 'flex-end' as const,
  },
  programEarnedTRY: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  programDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
});
