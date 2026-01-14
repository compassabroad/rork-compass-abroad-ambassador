import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  QrCode,
  Copy,
  Award,
  CreditCard,
  Shield,
  ChevronRight,
  Check,
  Edit3,
  LogOut,
  Bell,
  Globe,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import { MOCK_CURRENT_AMBASSADOR } from '@/mocks/data';
import { AMBASSADOR_TYPE_LABELS, AmbassadorType } from '@/types';

const AMBASSADOR_TYPES: AmbassadorType[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [iban, setIban] = useState(MOCK_CURRENT_AMBASSADOR.iban || '');
  const [kvkkConsent, setKvkkConsent] = useState(MOCK_CURRENT_AMBASSADOR.kvkkConsent);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState<'tr' | 'en'>('tr');
  const [editingIban, setEditingIban] = useState(false);

  const copyReferralCode = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert('Kopyalandı!', `Referans kodu: ${MOCK_CURRENT_AMBASSADOR.referralCode}`);
  };

  const handleKvkkToggle = (value: boolean) => {
    if (!value) {
      Alert.alert(
        'KVKK Onayı',
        'KVKK onayını geri çekerseniz bazı özellikler kısıtlanabilir. Devam etmek istiyor musunuz?',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Devam', onPress: () => setKvkkConsent(false) },
        ]
      );
    } else {
      setKvkkConsent(true);
    }
  };

  const typeInfo = AMBASSADOR_TYPE_LABELS[MOCK_CURRENT_AMBASSADOR.type];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradient.middle, Colors.background]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { borderColor: typeInfo.color }]}>
            <Text style={styles.avatarText}>
              {MOCK_CURRENT_AMBASSADOR.name.split(' ').map(n => n[0]).join('')}
            </Text>
            <View style={[styles.typeBadgeSmall, { backgroundColor: typeInfo.color }]}>
              <Award size={12} color={Colors.background} />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{MOCK_CURRENT_AMBASSADOR.name}</Text>
            <Text style={styles.profileEmail}>{MOCK_CURRENT_AMBASSADOR.email}</Text>
            <View style={[styles.typeBadge, { backgroundColor: typeInfo.color + '20' }]}>
              <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>
                {typeInfo.tr} Elçi
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.qrSection}>
          <View style={styles.qrContainer}>
            <View style={styles.qrPlaceholder}>
              <QrCode size={120} color={Colors.primary} strokeWidth={1} />
            </View>
            <Text style={styles.referralCode}>{MOCK_CURRENT_AMBASSADOR.referralCode}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={copyReferralCode}>
              <Copy size={16} color={Colors.text} />
              <Text style={styles.copyButtonText}>Kodu Kopyala</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.qrHint}>
            Bu QR kodu paylaşarak yeni öğrenci ve elçi kazanabilirsiniz
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Elçi Seviyesi</Text>
          <View style={styles.tierContainer}>
            {AMBASSADOR_TYPES.map((type, index) => {
              const info = AMBASSADOR_TYPE_LABELS[type];
              const isActive = type === MOCK_CURRENT_AMBASSADOR.type;
              const isPast = AMBASSADOR_TYPES.indexOf(MOCK_CURRENT_AMBASSADOR.type) > index;
              
              return (
                <View key={type} style={styles.tierItem}>
                  <View
                    style={[
                      styles.tierDot,
                      { backgroundColor: isPast || isActive ? info.color : Colors.border },
                      isActive && styles.tierDotActive,
                    ]}
                  >
                    {(isPast || isActive) && <Check size={10} color={Colors.background} />}
                  </View>
                  <Text
                    style={[
                      styles.tierLabel,
                      (isPast || isActive) && { color: Colors.text },
                    ]}
                  >
                    {info.tr}
                  </Text>
                  {index < AMBASSADOR_TYPES.length - 1 && (
                    <View
                      style={[
                        styles.tierLine,
                        isPast && { backgroundColor: info.color },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ödeme Bilgileri</Text>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <CreditCard size={20} color={Colors.primary} />
              <Text style={styles.cardTitle}>IBAN</Text>
              <TouchableOpacity onPress={() => setEditingIban(!editingIban)}>
                <Edit3 size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {editingIban ? (
              <TextInput
                style={styles.ibanInput}
                value={iban}
                onChangeText={setIban}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
              />
            ) : (
              <Text style={styles.ibanText}>
                {iban || 'IBAN eklenmemiş'}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ayarlar</Text>
          
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: Colors.info + '20' }]}>
                  <Bell size={18} color={Colors.info} />
                </View>
                <Text style={styles.settingLabel}>Bildirimler</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.text}
              />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: Colors.secondary + '20' }]}>
                  <Globe size={18} color={Colors.secondary} />
                </View>
                <Text style={styles.settingLabel}>Dil / Language</Text>
              </View>
              <View style={styles.languageToggle}>
                <Text style={[styles.langOption, language === 'tr' && styles.langOptionActive]}>
                  TR
                </Text>
                <Text style={styles.langDivider}>|</Text>
                <Text style={[styles.langOption, language === 'en' && styles.langOptionActive]}>
                  EN
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yasal</Text>
          
          <View style={styles.settingsCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: Colors.success + '20' }]}>
                  <Shield size={18} color={Colors.success} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>KVKK Onayı</Text>
                  <Text style={styles.settingSubtext}>
                    Kişisel verilerin işlenmesine izin
                  </Text>
                </View>
              </View>
              <Switch
                value={kvkkConsent}
                onValueChange={handleKvkkToggle}
                trackColor={{ false: Colors.border, true: Colors.success }}
                thumbColor={Colors.text}
              />
            </View>

            <View style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: Colors.primary + '20' }]}>
                  <Shield size={18} color={Colors.primary} />
                </View>
                <Text style={styles.settingLabel}>Gizlilik Politikası</Text>
              </View>
              <ChevronRight size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton}>
          <LogOut size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>

        <Text style={styles.version}>v1.0.0 • Compass Abroad Ambassador</Text>
        
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
    paddingBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 3,
  },
  avatarText: {
    fontSize: 24,
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
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
  },
  qrPlaceholder: {
    width: 160,
    height: 160,
    backgroundColor: Colors.text,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  referralCode: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.secondary,
    letterSpacing: 2,
    marginBottom: 16,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  qrHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    marginLeft: 4,
  },
  tierContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tierItem: {
    alignItems: 'center',
    flex: 1,
  },
  tierDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tierDotActive: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  tierLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  tierLine: {
    position: 'absolute',
    top: 12,
    left: '60%',
    right: '-40%',
    height: 2,
    backgroundColor: Colors.border,
    zIndex: -1,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  ibanInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  ibanText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  settingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  settingSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  settingDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 64,
  },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langOption: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  langOptionActive: {
    color: Colors.secondary,
    fontWeight: '700',
  },
  langDivider: {
    color: Colors.textMuted,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.error + '15',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  version: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
