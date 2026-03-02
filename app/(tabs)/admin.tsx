import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Shield,
  Users,
  UserCheck,
  GraduationCap,
  DollarSign,
  Search,
  Check,
  X,
  ChevronRight,
  Settings,
  Share2,
  UserCog,
  ArrowRight,
  Briefcase,
  CreditCard,
  Wallet,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { AMBASSADOR_TYPE_LABELS } from '@/types';

export default function AdminScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = user?.role === 'admin';

  const statsQuery = trpc.admin.getDashboardStats.useQuery(
    { token: token ?? '' },
    { enabled: !!token && isAdmin }
  );

  const pendingAmbassadorsQuery = trpc.admin.getPendingAmbassadors.useQuery(
    { token: token ?? '' },
    { enabled: !!token && isAdmin }
  );

  const nameChangeQuery = trpc.admin.getNameChangeRequests.useQuery(
    { token: token ?? '' },
    { enabled: !!token && isAdmin }
  );

  const pendingBanksQuery = trpc.admin.getPendingBankAccounts.useQuery(
    { token: token ?? '' },
    { enabled: !!token && isAdmin }
  );

  const pendingWithdrawalsQuery = trpc.admin.getPendingWithdrawals.useQuery(
    { token: token ?? '' },
    { enabled: !!token && isAdmin }
  );

  const allAmbassadorsQuery = trpc.admin.getAllAmbassadors.useQuery(
    { token: token ?? '', search: searchQuery || undefined },
    { enabled: !!token && isAdmin }
  );

  const approveAmbassadorMutation = trpc.admin.approveAmbassador.useMutation();
  const rejectAmbassadorMutation = trpc.admin.rejectAmbassador.useMutation();
  const approveNameChangeMutation = trpc.admin.approveNameChange.useMutation();
  const rejectNameChangeMutation = trpc.admin.rejectNameChange.useMutation();
  const approveBankMutation = trpc.admin.approveBankAccount.useMutation();
  const rejectBankMutation = trpc.admin.rejectBankAccount.useMutation();
  const approveWithdrawalMutation = trpc.admin.approveWithdrawal.useMutation();
  const rejectWithdrawalMutation = trpc.admin.rejectWithdrawal.useMutation();

  const stats = statsQuery.data ?? {
    totalAmbassadors: 0,
    totalStudents: 0,
    pendingApprovals: 0,
    pendingWithdrawals: 0,
    pendingBankAccounts: 0,
    pendingNameChanges: 0,
  };

  const pendingList = pendingAmbassadorsQuery.data ?? [];
  const pendingNameChanges = nameChangeQuery.data ?? [];
  const pendingBanks = pendingBanksQuery.data ?? [];
  const pendingWithdrawals = pendingWithdrawalsQuery.data ?? [];
  const allAmbassadors = allAmbassadorsQuery.data ?? [];

  const refetchAll = useCallback(() => {
    statsQuery.refetch();
    pendingAmbassadorsQuery.refetch();
    nameChangeQuery.refetch();
    pendingBanksQuery.refetch();
    pendingWithdrawalsQuery.refetch();
    allAmbassadorsQuery.refetch();
  }, [statsQuery, pendingAmbassadorsQuery, nameChangeQuery, pendingBanksQuery, pendingWithdrawalsQuery, allAmbassadorsQuery]);

  const handleApprove = useCallback((id: string) => {
    Alert.alert(
      'Onayla',
      'Bu elçiyi onaylamak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Onayla',
          onPress: async () => {
            try {
              await approveAmbassadorMutation.mutateAsync({ token: token ?? '', ambassadorId: id });
              Alert.alert('Başarılı', 'Elçi başarıyla onaylandı.');
              refetchAll();
            } catch (error: any) {
              Alert.alert('Hata', error.message || 'Bir hata oluştu');
            }
          },
        },
      ]
    );
  }, [token, approveAmbassadorMutation, refetchAll]);

  const handleReject = useCallback((id: string) => {
    Alert.alert(
      'Reddet',
      'Bu elçiyi reddetmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Reddet',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectAmbassadorMutation.mutateAsync({ token: token ?? '', ambassadorId: id });
              Alert.alert('Reddedildi', 'Elçi başvurusu reddedildi.');
              refetchAll();
            } catch (error: any) {
              Alert.alert('Hata', error.message || 'Bir hata oluştu');
            }
          },
        },
      ]
    );
  }, [token, rejectAmbassadorMutation, refetchAll]);

  const handleApproveNameChange = useCallback((request: { id: string; currentFirstName: string; currentLastName: string; requestedFirstName: string; requestedLastName: string }) => {
    Alert.alert(
      'İsim Değişikliğini Onayla',
      `"${request.currentFirstName} ${request.currentLastName}" → "${request.requestedFirstName} ${request.requestedLastName}" olarak değiştirilsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Onayla',
          onPress: async () => {
            try {
              await approveNameChangeMutation.mutateAsync({ token: token ?? '', requestId: request.id });
              Alert.alert('Başarılı', 'İsim değişikliği onaylandı.');
              refetchAll();
            } catch (error: any) {
              Alert.alert('Hata', error.message || 'Bir hata oluştu');
            }
          },
        },
      ]
    );
  }, [token, approveNameChangeMutation, refetchAll]);

  const handleRejectNameChange = useCallback((request: { id: string }) => {
    Alert.alert(
      'İsim Değişikliğini Reddet',
      'Bu isim değişikliği talebini reddetmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Reddet',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectNameChangeMutation.mutateAsync({ token: token ?? '', requestId: request.id });
              Alert.alert('Reddedildi', 'İsim değişikliği talebi reddedildi.');
              refetchAll();
            } catch (error: any) {
              Alert.alert('Hata', error.message || 'Bir hata oluştu');
            }
          },
        },
      ]
    );
  }, [token, rejectNameChangeMutation, refetchAll]);

  const handleApproveBankAccount = useCallback((id: string) => {
    Alert.alert(
      'Banka Hesabını Onayla',
      'Bu banka hesabını onaylamak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Onayla',
          onPress: async () => {
            try {
              await approveBankMutation.mutateAsync({ token: token ?? '', bankAccountId: id });
              Alert.alert('Başarılı', 'Banka hesabı onaylandı.');
              refetchAll();
            } catch (error: any) {
              Alert.alert('Hata', error.message || 'Bir hata oluştu');
            }
          },
        },
      ]
    );
  }, [token, approveBankMutation, refetchAll]);

  const handleRejectBankAccount = useCallback((id: string) => {
    Alert.alert(
      'Banka Hesabını Reddet',
      'Bu banka hesabını reddetmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Reddet',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectBankMutation.mutateAsync({ token: token ?? '', bankAccountId: id });
              Alert.alert('Reddedildi', 'Banka hesabı reddedildi.');
              refetchAll();
            } catch (error: any) {
              Alert.alert('Hata', error.message || 'Bir hata oluştu');
            }
          },
        },
      ]
    );
  }, [token, rejectBankMutation, refetchAll]);

  const handleApproveWithdrawal = useCallback((id: string) => {
    Alert.alert(
      'Çekim Talebini Onayla',
      'Bu çekim talebini onaylamak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Onayla',
          onPress: async () => {
            try {
              await approveWithdrawalMutation.mutateAsync({ token: token ?? '', withdrawalId: id });
              Alert.alert('Başarılı', 'Çekim talebi onaylandı.');
              refetchAll();
            } catch (error: any) {
              Alert.alert('Hata', error.message || 'Bir hata oluştu');
            }
          },
        },
      ]
    );
  }, [token, approveWithdrawalMutation, refetchAll]);

  const handleRejectWithdrawal = useCallback((id: string) => {
    Alert.alert(
      'Çekim Talebini Reddet',
      'Bu çekim talebini reddetmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Reddet',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectWithdrawalMutation.mutateAsync({ token: token ?? '', withdrawalId: id });
              Alert.alert('Reddedildi', 'Çekim talebi reddedildi.');
              refetchAll();
            } catch (error: any) {
              Alert.alert('Hata', error.message || 'Bir hata oluştu');
            }
          },
        },
      ]
    );
  }, [token, rejectWithdrawalMutation, refetchAll]);

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.accessDenied}>
          <Shield color={Colors.error} size={64} />
          <Text style={styles.accessDeniedTitle}>Erişim Reddedildi</Text>
          <Text style={styles.accessDeniedText}>
            Bu sayfaya erişim yetkiniz bulunmamaktadır.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderStatCard = (
    icon: React.ReactNode,
    label: string,
    value: string | number,
    color: string
  ) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderPendingAmbassador = (ambassador: { id: string; name: string; email: string; registrationDate: string; referredBy?: string }) => (
    <View key={ambassador.id} style={styles.pendingCard}>
      <View style={styles.pendingInfo}>
        <View style={styles.pendingAvatar}>
          <Text style={styles.pendingAvatarText}>
            {ambassador.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        <View style={styles.pendingDetails}>
          <Text style={styles.pendingName}>{ambassador.name}</Text>
          <Text style={styles.pendingEmail}>{ambassador.email}</Text>
          <Text style={styles.pendingDate}>
            Kayıt: {formatDate(ambassador.registrationDate)}
          </Text>
          {ambassador.referredBy && (
            <Text style={styles.pendingReferral}>
              Referans: {ambassador.referredBy}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.pendingActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApprove(ambassador.id)}
          testID={`approve-${ambassador.id}`}
        >
          <Check color="#FFFFFF" size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReject(ambassador.id)}
          testID={`reject-${ambassador.id}`}
        >
          <X color="#FFFFFF" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAmbassadorItem = (ambassador: { id: string; name: string; email: string; type: string; referralCode: string }) => {
    const typeKey = ambassador.type as keyof typeof AMBASSADOR_TYPE_LABELS;
    const typeLabel = AMBASSADOR_TYPE_LABELS[typeKey];

    return (
      <TouchableOpacity
        key={ambassador.id}
        style={styles.ambassadorItem}
        onPress={() => router.push(`/admin/ambassador-commissions/${ambassador.id}` as any)}
        testID={`ambassador-${ambassador.id}`}
      >
        <View style={styles.ambassadorAvatar}>
          <Text style={styles.ambassadorAvatarText}>
            {ambassador.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        <View style={styles.ambassadorInfo}>
          <Text style={styles.ambassadorName}>{ambassador.name}</Text>
          <Text style={styles.ambassadorEmail}>{ambassador.email}</Text>
          <View style={styles.ambassadorMeta}>
            {typeLabel && (
              <View
                style={[
                  styles.typeBadge,
                  { backgroundColor: typeLabel.color + '30' },
                ]}
              >
                <Text
                  style={[
                    styles.typeBadgeText,
                    { color: typeLabel.color },
                  ]}
                >
                  {typeLabel.tr}
                </Text>
              </View>
            )}
            <Text style={styles.ambassadorCode}>{ambassador.referralCode}</Text>
          </View>
        </View>
        <ChevronRight color={Colors.textMuted} size={20} />
      </TouchableOpacity>
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
            <View style={styles.headerLeft}>
              <Shield color={Colors.secondary} size={28} />
              <Text style={styles.headerTitle}>Admin Panel</Text>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/admin/program-commissions')}
              testID="program-commissions-button"
            >
              <Settings color={Colors.text} size={24} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={statsQuery.isRefetching}
            onRefresh={refetchAll}
            tintColor={Colors.primary}
          />
        }
      >
        {statsQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Veriler yükleniyor...</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              {renderStatCard(
                <Users color={Colors.info} size={20} />,
                'Toplam Elçi',
                stats.totalAmbassadors,
                Colors.info
              )}
              {renderStatCard(
                <UserCheck color={Colors.warning} size={20} />,
                'Onay Bekleyen',
                stats.pendingApprovals,
                Colors.warning
              )}
              {renderStatCard(
                <GraduationCap color={Colors.success} size={20} />,
                'Toplam Öğrenci',
                stats.totalStudents,
                Colors.success
              )}
              {renderStatCard(
                <Wallet color={Colors.secondary} size={20} />,
                'Çekim Bekleyen',
                stats.pendingWithdrawals,
                Colors.secondary
              )}
            </View>

            <TouchableOpacity
              style={styles.commissionsLink}
              onPress={() => router.push('/admin/program-commissions')}
            >
              <View style={styles.commissionsLinkContent}>
                <View style={styles.commissionsIconContainer}>
                  <DollarSign color={Colors.secondary} size={24} />
                </View>
                <View style={styles.commissionsTextContainer}>
                  <Text style={styles.commissionsLinkTitle}>Program Komisyonları</Text>
                  <Text style={styles.commissionsLinkSubtitle}>
                    Tüm programlar için komisyon oranlarını düzenle
                  </Text>
                </View>
              </View>
              <ChevronRight color={Colors.textMuted} size={24} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.commissionsLink}
              onPress={() => router.push('/admin/social-media')}
              testID="social-media-button"
            >
              <View style={styles.commissionsLinkContent}>
                <View style={[styles.commissionsIconContainer, { backgroundColor: '#E4405F20' }]}>
                  <Share2 color="#E4405F" size={24} />
                </View>
                <View style={styles.commissionsTextContainer}>
                  <Text style={styles.commissionsLinkTitle}>Sosyal Medya Linkleri</Text>
                  <Text style={styles.commissionsLinkSubtitle}>
                    Instagram, LinkedIn, Twitter ve Facebook linklerini yönet
                  </Text>
                </View>
              </View>
              <ChevronRight color={Colors.textMuted} size={24} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.commissionsLink}
              onPress={() => router.push('/admin/team')}
              testID="team-management-button"
            >
              <View style={styles.commissionsLinkContent}>
                <View style={[styles.commissionsIconContainer, { backgroundColor: Colors.info + '20' }]}>
                  <Briefcase color={Colors.info} size={24} />
                </View>
                <View style={styles.commissionsTextContainer}>
                  <Text style={styles.commissionsLinkTitle}>Danışman Ekibi</Text>
                  <Text style={styles.commissionsLinkSubtitle}>
                    Ekip üyelerini ekle, düzenle ve yönet
                  </Text>
                </View>
              </View>
              <ChevronRight color={Colors.textMuted} size={24} />
            </TouchableOpacity>

            {pendingNameChanges.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>İsim Değişikliği Talepleri</Text>
                  <View style={[styles.pendingBadge, { backgroundColor: Colors.info }]}>
                    <Text style={styles.pendingBadgeText}>{pendingNameChanges.length}</Text>
                  </View>
                </View>
                {pendingNameChanges.map((request) => (
                  <View key={request.id} style={styles.nameChangeCard}>
                    <View style={styles.nameChangeInfo}>
                      <View style={styles.nameChangeAvatar}>
                        <UserCog size={20} color={Colors.info} />
                      </View>
                      <View style={styles.nameChangeDetails}>
                        <Text style={styles.nameChangeAmbassador}>{request.ambassadorName}</Text>
                        <View style={styles.nameChangeNames}>
                          <Text style={styles.nameChangeCurrent}>
                            {request.currentFirstName} {request.currentLastName}
                          </Text>
                          <ArrowRight size={14} color={Colors.textMuted} />
                          <Text style={styles.nameChangeRequested}>
                            {request.requestedFirstName} {request.requestedLastName}
                          </Text>
                        </View>
                        <Text style={styles.nameChangeDate}>
                          Talep: {formatDate(request.requestDate)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.nameChangeActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleApproveNameChange(request)}
                      >
                        <Check color="#FFFFFF" size={20} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleRejectNameChange(request)}
                      >
                        <X color="#FFFFFF" size={20} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {pendingBanks.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Onay Bekleyen Banka Hesapları</Text>
                  <View style={[styles.pendingBadge, { backgroundColor: Colors.info }]}>
                    <Text style={styles.pendingBadgeText}>{pendingBanks.length}</Text>
                  </View>
                </View>
                {pendingBanks.map((bank) => (
                  <View key={bank.id} style={styles.pendingCard}>
                    <View style={styles.pendingInfo}>
                      <View style={[styles.pendingAvatar, { backgroundColor: Colors.info + '20' }]}>
                        <CreditCard size={20} color={Colors.info} />
                      </View>
                      <View style={styles.pendingDetails}>
                        <Text style={styles.pendingName}>{bank.ambassadorName}</Text>
                        <Text style={styles.pendingEmail}>{bank.bankName}</Text>
                        <Text style={styles.pendingDate}>{bank.iban}</Text>
                      </View>
                    </View>
                    <View style={styles.pendingActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleApproveBankAccount(bank.id)}
                      >
                        <Check color="#FFFFFF" size={20} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleRejectBankAccount(bank.id)}
                      >
                        <X color="#FFFFFF" size={20} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {pendingWithdrawals.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Onay Bekleyen Çekim Talepleri</Text>
                  <View style={[styles.pendingBadge, { backgroundColor: Colors.secondary }]}>
                    <Text style={styles.pendingBadgeText}>{pendingWithdrawals.length}</Text>
                  </View>
                </View>
                {pendingWithdrawals.map((withdrawal) => (
                  <View key={withdrawal.id} style={styles.pendingCard}>
                    <View style={styles.pendingInfo}>
                      <View style={[styles.pendingAvatar, { backgroundColor: Colors.secondary + '20' }]}>
                        <Wallet size={20} color={Colors.secondary} />
                      </View>
                      <View style={styles.pendingDetails}>
                        <Text style={styles.pendingName}>{withdrawal.ambassadorName}</Text>
                        <Text style={styles.pendingEmail}>
                          ${withdrawal.amountUSD.toLocaleString()} (₺{withdrawal.amountTRY.toLocaleString()})
                        </Text>
                        <Text style={styles.pendingDate}>{withdrawal.bankName} - {withdrawal.iban}</Text>
                        <Text style={styles.pendingDate}>
                          Tarih: {formatDate(withdrawal.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.pendingActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleApproveWithdrawal(withdrawal.id)}
                      >
                        <Check color="#FFFFFF" size={20} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleRejectWithdrawal(withdrawal.id)}
                      >
                        <X color="#FFFFFF" size={20} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {pendingList.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Onay Bekleyen Elçiler</Text>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>{pendingList.length}</Text>
                  </View>
                </View>
                {pendingList.map(renderPendingAmbassador)}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tüm Elçiler</Text>
              <View style={styles.searchContainer}>
                <Search color={Colors.textMuted} size={20} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="İsim, e-posta veya kod ile ara..."
                  placeholderTextColor={Colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  testID="ambassador-search"
                />
              </View>
              {allAmbassadorsQuery.isLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} />
              ) : (
                <View style={styles.ambassadorList}>
                  {allAmbassadors.map(renderAmbassadorItem)}
                  {allAmbassadors.length === 0 && (
                    <Text style={styles.emptyText}>Aktif elçi bulunamadı.</Text>
                  )}
                </View>
              )}
            </View>
          </>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  commissionsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.secondary + '40',
  },
  commissionsLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  commissionsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  commissionsTextContainer: {
    flex: 1,
  },
  commissionsLinkTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  commissionsLinkSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  pendingBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
    marginBottom: 16,
  },
  pendingBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#000',
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pendingAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  pendingAvatarText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  pendingDetails: {
    flex: 1,
  },
  pendingName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  pendingEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  pendingDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  pendingReferral: {
    fontSize: 12,
    color: Colors.secondary,
    marginTop: 2,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: Colors.success,
  },
  rejectButton: {
    backgroundColor: Colors.error,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 15,
    color: Colors.text,
  },
  ambassadorList: {
    gap: 12,
  },
  ambassadorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  ambassadorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  ambassadorAvatarText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  ambassadorInfo: {
    flex: 1,
  },
  ambassadorName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  ambassadorEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  ambassadorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  ambassadorCode: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  accessDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  accessDeniedTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  accessDeniedText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  nameChangeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.info + '30',
  },
  nameChangeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nameChangeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.info + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  nameChangeDetails: {
    flex: 1,
  },
  nameChangeAmbassador: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  nameChangeNames: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  nameChangeCurrent: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  nameChangeRequested: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.info,
  },
  nameChangeDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  nameChangeActions: {
    flexDirection: 'row',
    gap: 10,
  },
});
