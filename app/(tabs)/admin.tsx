import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
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
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/colors';
import {
  MOCK_CURRENT_USER,
  MOCK_PENDING_AMBASSADORS,
  getAllAmbassadors,
  MOCK_STUDENTS,
  MOCK_EARNINGS,
  MOCK_NAME_CHANGE_REQUESTS,
} from '@/mocks/data';
import { PendingAmbassador, Ambassador, AMBASSADOR_TYPE_LABELS, NameChangeRequest } from '@/types';

export default function AdminScreen() {
  const router = useRouter();
  const [pendingAmbassadors, setPendingAmbassadors] = useState<PendingAmbassador[]>(MOCK_PENDING_AMBASSADORS);
  const [nameChangeRequests, setNameChangeRequests] = useState<NameChangeRequest[]>(MOCK_NAME_CHANGE_REQUESTS);
  const [searchQuery, setSearchQuery] = useState('');
  const allAmbassadors = getAllAmbassadors();

  const isAdmin = MOCK_CURRENT_USER.role === 'admin';

  const stats = {
    totalAmbassadors: allAmbassadors.length,
    pendingApproval: pendingAmbassadors.filter(a => a.status === 'pending').length,
    totalStudents: MOCK_STUDENTS.length,
    totalEarnings: MOCK_EARNINGS.totalUSD,
  };

  const handleApprove = useCallback((id: string) => {
    Alert.alert(
      'Onayla',
      'Bu elçiyi onaylamak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Onayla',
          onPress: () => {
            setPendingAmbassadors(prev =>
              prev.map(a => (a.id === id ? { ...a, status: 'approved' as const } : a))
            );
            console.log('Ambassador approved:', id);
          },
        },
      ]
    );
  }, []);

  const handleReject = useCallback((id: string) => {
    Alert.alert(
      'Reddet',
      'Bu elçiyi reddetmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Reddet',
          style: 'destructive',
          onPress: () => {
            setPendingAmbassadors(prev =>
              prev.map(a => (a.id === id ? { ...a, status: 'rejected' as const } : a))
            );
            console.log('Ambassador rejected:', id);
          },
        },
      ]
    );
  }, []);

  const handleApproveNameChange = useCallback((request: NameChangeRequest) => {
    Alert.alert(
      'İsim Değişikliğini Onayla',
      `"${request.currentFirstName} ${request.currentLastName}" → "${request.requestedFirstName} ${request.requestedLastName}" olarak değiştirilsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Onayla',
          onPress: () => {
            setNameChangeRequests(prev =>
              prev.map(r => (r.id === request.id ? { ...r, status: 'approved' as const } : r))
            );
            console.log('Name change approved:', request);
            Alert.alert('Başarılı', 'İsim değişikliği onaylandı.');
          },
        },
      ]
    );
  }, []);

  const handleRejectNameChange = useCallback((request: NameChangeRequest) => {
    Alert.alert(
      'İsim Değişikliğini Reddet',
      'Bu isim değişikliği talebini reddetmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Reddet',
          style: 'destructive',
          onPress: () => {
            setNameChangeRequests(prev =>
              prev.map(r => (r.id === request.id ? { ...r, status: 'rejected' as const } : r))
            );
            console.log('Name change rejected:', request);
            Alert.alert('Reddedildi', 'İsim değişikliği talebi reddedildi.');
          },
        },
      ]
    );
  }, []);

  const filteredAmbassadors = allAmbassadors.filter(
    a =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.referralCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingList = pendingAmbassadors.filter(a => a.status === 'pending');
  const pendingNameChanges = nameChangeRequests.filter(r => r.status === 'pending');

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

  const renderPendingAmbassador = (ambassador: PendingAmbassador) => (
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

  const renderAmbassadorItem = (ambassador: Ambassador) => (
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
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: AMBASSADOR_TYPE_LABELS[ambassador.type].color + '30' },
            ]}
          >
            <Text
              style={[
                styles.typeBadgeText,
                { color: AMBASSADOR_TYPE_LABELS[ambassador.type].color },
              ]}
            >
              {AMBASSADOR_TYPE_LABELS[ambassador.type].tr}
            </Text>
          </View>
          <Text style={styles.ambassadorCode}>{ambassador.referralCode}</Text>
        </View>
      </View>
      <ChevronRight color={Colors.textMuted} size={20} />
    </TouchableOpacity>
  );

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
      >
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
            stats.pendingApproval,
            Colors.warning
          )}
          {renderStatCard(
            <GraduationCap color={Colors.success} size={20} />,
            'Toplam Öğrenci',
            stats.totalStudents,
            Colors.success
          )}
          {renderStatCard(
            <DollarSign color={Colors.secondary} size={20} />,
            'Toplam Kazanç',
            `$${stats.totalEarnings.toLocaleString()}`,
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
          <View style={styles.ambassadorList}>
            {filteredAmbassadors.map(renderAmbassadorItem)}
          </View>
        </View>
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
