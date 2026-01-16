import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Award,
  Users,
  Star,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  MessageCircle,
  ChevronRight,
  Percent,
  Lock,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { getAllAmbassadors, MOCK_CURRENT_AMBASSADOR, MOCK_CURRENT_USER } from '@/mocks/data';
import { AMBASSADOR_TYPE_LABELS } from '@/types';

export default function AmbassadorDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const allAmbassadors = getAllAmbassadors();
  const ambassador = allAmbassadors.find(a => a.id === id);
  
  const isAdmin = MOCK_CURRENT_USER.role === 'admin';
  const currentAmbassador = MOCK_CURRENT_AMBASSADOR;
  
  const isDirectSubAmbassador = useMemo(() => {
    if (!ambassador) return false;
    return ambassador.parentId === currentAmbassador.id;
  }, [ambassador, currentAmbassador.id]);
  
  const canSeeContactDetails = isAdmin || ambassador?.id === currentAmbassador.id;
  
  const networkCommission = useMemo(() => {
    if (!ambassador || !isDirectSubAmbassador) return 0;
    const rate = currentAmbassador.networkCommissionRate || 10;
    return (ambassador.totalEarningsUSD * rate) / 100;
  }, [ambassador, isDirectSubAmbassador, currentAmbassador.networkCommissionRate]);

  if (!ambassador) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.gradient.middle, Colors.background]}
          style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Elçi bulunamadı</Text>
        </View>
      </View>
    );
  }

  const typeInfo = AMBASSADOR_TYPE_LABELS[ambassador.type];
  const subAmbassadors = allAmbassadors.filter(a => a.parentId === ambassador.id);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: 'USD' | 'TRY') => {
    if (currency === 'USD') {
      return `$${amount.toLocaleString('en-US')}`;
    }
    return `₺${amount.toLocaleString('tr-TR')}`;
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${ambassador.email}`);
  };

  const handleCall = () => {
    Linking.openURL(`tel:${ambassador.phone}`);
  };

  const handleWhatsApp = () => {
    const phone = ambassador.phone.replace(/[^0-9]/g, '');
    Linking.openURL(`https://wa.me/${phone}`);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradient.start, Colors.gradient.middle, Colors.background]}
        style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Elçi Detayı</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.profileSection}>
          <View style={[styles.avatar, { borderColor: typeInfo.color }]}>
            <Text style={styles.avatarText}>
              {ambassador.name.split(' ').map(n => n[0]).join('')}
            </Text>
            <View style={[styles.typeBadgeSmall, { backgroundColor: typeInfo.color }]}>
              <Award size={12} color={Colors.background} />
            </View>
          </View>
          <Text style={styles.ambassadorName}>{ambassador.name}</Text>
          <View style={[styles.typeBadge, { backgroundColor: typeInfo.color + '20' }]}>
            <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>
              {typeInfo.tr} Elçi
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {canSeeContactDetails ? (
          <>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Mail size={18} color={Colors.textSecondary} />
                <Text style={styles.infoText}>{ambassador.email}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Phone size={18} color={Colors.textSecondary} />
                <Text style={styles.infoText}>{ambassador.phone}</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Calendar size={18} color={Colors.textSecondary} />
                <Text style={styles.infoText}>Katılım: {formatDate(ambassador.joinedAt)}</Text>
              </View>
            </View>

            <View style={styles.contactButtons}>
              <TouchableOpacity style={styles.contactButton} onPress={handleEmail}>
                <Mail size={20} color={Colors.info} />
                <Text style={[styles.contactButtonText, { color: Colors.info }]}>E-posta</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
                <Phone size={20} color={Colors.success} />
                <Text style={[styles.contactButtonText, { color: Colors.success }]}>Ara</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactButton} onPress={handleWhatsApp}>
                <MessageCircle size={20} color="#25D366" />
                <Text style={[styles.contactButtonText, { color: '#25D366' }]}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Lock size={18} color={Colors.textMuted} />
              <Text style={styles.infoTextMuted}>İletişim bilgileri gizli</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Calendar size={18} color={Colors.textSecondary} />
              <Text style={styles.infoText}>Katılım: {formatDate(ambassador.joinedAt)}</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>İstatistikler</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: Colors.success + '15' }]}>
            <View style={[styles.statIcon, { backgroundColor: Colors.success }]}>
              <Users size={20} color={Colors.text} />
            </View>
            <Text style={styles.statValue}>{ambassador.studentsReferred}</Text>
            <Text style={styles.statLabel}>Öğrenci</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors.secondary + '15' }]}>
            <View style={[styles.statIcon, { backgroundColor: Colors.secondary }]}>
              <DollarSign size={20} color={Colors.background} />
            </View>
            <Text style={styles.statValue}>{formatCurrency(ambassador.totalEarningsUSD, 'USD')}</Text>
            <Text style={styles.statLabel}>Toplam Kazanç</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors.primary + '15' }]}>
            <View style={[styles.statIcon, { backgroundColor: Colors.primary }]}>
              <Star size={20} color={Colors.secondary} />
            </View>
            <Text style={styles.statValue}>{ambassador.compassPoints}</Text>
            <Text style={styles.statLabel}>Puan</Text>
          </View>
        </View>

        {isDirectSubAmbassador && (
          <View style={styles.networkCommissionCard}>
            <View style={styles.networkCommissionHeader}>
              <View style={styles.networkCommissionIcon}>
                <Percent size={20} color={Colors.secondary} />
              </View>
              <View style={styles.networkCommissionInfo}>
                <Text style={styles.networkCommissionTitle}>Sizin Ağ Komisyonunuz</Text>
                <Text style={styles.networkCommissionDesc}>
                  Bu elçinin kazançlarından %{currentAmbassador.networkCommissionRate || 10} pay
                </Text>
              </View>
            </View>
            <View style={styles.networkCommissionAmount}>
              <Text style={styles.networkCommissionValue}>
                {formatCurrency(networkCommission, 'USD')}
              </Text>
              <Text style={styles.networkCommissionNote}>
                Toplam: {formatCurrency(ambassador.totalEarningsUSD, 'USD')} × %{currentAmbassador.networkCommissionRate || 10}
              </Text>
            </View>
          </View>
        )}

        {!canSeeContactDetails && (
          <View style={styles.privacyNote}>
            <Lock size={14} color={Colors.textMuted} />
            <Text style={styles.privacyNoteText}>
              Program bazlı kazanç detayları gizlidir. Sadece toplam kazanç görüntülenebilir.
            </Text>
          </View>
        )}

        {subAmbassadors.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Alt Elçiler ({subAmbassadors.length})</Text>
            <View style={styles.subList}>
              {subAmbassadors.map((sub) => {
                const subTypeInfo = AMBASSADOR_TYPE_LABELS[sub.type];
                return (
                  <TouchableOpacity
                    key={sub.id}
                    style={styles.subCard}
                    onPress={() => router.push(`/ambassadors/${sub.id}`)}
                  >
                    <View style={[styles.subAvatar, { borderColor: subTypeInfo.color }]}>
                      <Text style={styles.subAvatarText}>
                        {sub.name.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                    <View style={styles.subInfo}>
                      <Text style={styles.subName}>{sub.name}</Text>
                      <Text style={styles.subMeta}>
                        {sub.studentsReferred} öğrenci • Toplam: {formatCurrency(sub.totalEarningsUSD, 'USD')}
                      </Text>
                    </View>
                    <View style={[styles.subTypeBadge, { backgroundColor: subTypeInfo.color + '20' }]}>
                      <Text style={[styles.subTypeBadgeText, { color: subTypeInfo.color }]}>
                        {subTypeInfo.tr}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        <View style={{ height: insets.bottom + 20 }} />
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
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  profileSection: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  typeBadgeSmall: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  ambassadorName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginTop: -10,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  infoTextMuted: {
    fontSize: 14,
    color: Colors.textMuted,
    flex: 1,
    fontStyle: 'italic' as const,
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 30,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  statsGrid: {
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
    marginBottom: 10,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  subList: {
    gap: 10,
  },
  subCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  subAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  subAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  subInfo: {
    flex: 1,
  },
  subName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  subMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  subTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  networkCommissionCard: {
    backgroundColor: Colors.secondary + '15',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.secondary + '30',
  },
  networkCommissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  networkCommissionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.secondary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  networkCommissionInfo: {
    flex: 1,
  },
  networkCommissionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  networkCommissionDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  networkCommissionAmount: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  networkCommissionValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 4,
  },
  networkCommissionNote: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 24,
    gap: 8,
  },
  privacyNoteText: {
    fontSize: 12,
    color: Colors.textMuted,
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
});
