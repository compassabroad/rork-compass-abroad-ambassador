import React, { useState, useCallback } from 'react';
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
  Image,
  Share,
  Modal,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Copy,
  Award,
  CreditCard,
  Check,
  LogOut,
  Bell,
  Globe,
  Share2,
  Download,
  Plus,
  Building2,
  ChevronDown,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Trash2,
} from 'lucide-react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { AMBASSADOR_TYPE_LABELS, AmbassadorType, BankAccountStatus } from '@/types';
import { trpc } from '@/lib/trpc';

const AMBASSADOR_TYPES: AmbassadorType[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

const BANKS = [
  'Ziraat Bankası',
  'İş Bankası',
  'Garanti BBVA',
  'Yapı Kredi',
  'Akbank',
  'QNB Finansbank',
  'Denizbank',
  'Vakıfbank',
  'Halkbank',
  'TEB',
  'ING',
  'HSBC',
];

const STATUS_CONFIG: Record<BankAccountStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Onay Bekliyor', color: '#F59E0B', icon: Clock },
  approved: { label: 'Onaylandı', color: '#10B981', icon: CheckCircle },
  rejected: { label: 'Reddedildi', color: '#EF4444', icon: AlertCircle },
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, token, logout } = useAuth();

  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState<'tr' | 'en'>('tr');
  
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [newIban, setNewIban] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [ibanError, setIbanError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const bankAccountsQuery = trpc.bankAccounts.list.useQuery(
    { token: token || '' },
    { enabled: !!token }
  );

  const addBankMutation = trpc.bankAccounts.add.useMutation({
    onSuccess: () => {
      bankAccountsQuery.refetch();
      setShowAddBankModal(false);
      resetAddBankForm();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert(
        'Banka Hesabı Eklendi',
        'Banka hesabınız Compass Abroad admin onayına gönderildi. Onaylandığında bildirim alacaksınız.',
        [{ text: 'Tamam' }]
      );
    },
    onError: (error) => {
      Alert.alert('Hata', error.message || 'Banka hesabı eklenemedi');
    },
  });

  const setDefaultMutation = trpc.bankAccounts.setDefault.useMutation({
    onSuccess: () => {
      bankAccountsQuery.refetch();
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    },
    onError: (error) => {
      Alert.alert('Hata', error.message || 'Varsayılan hesap ayarlanamadı');
    },
  });

  const deleteBankMutation = trpc.bankAccounts.delete.useMutation({
    onSuccess: () => {
      bankAccountsQuery.refetch();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: (error) => {
      Alert.alert('Hata', error.message || 'Banka hesabı silinemedi');
    },
  });

  const savedIbans = bankAccountsQuery.data || [];

  const referralCode = user?.referralCode || 'CA-XXXXXX';
  const referralLink = `https://compassabroad.com/ref/${referralCode}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralLink)}&bgcolor=FFFFFF&color=502274`;

  const userName = user ? `${user.firstName} ${user.lastName}` : '';
  const userInitials = user ? `${user.firstName[0] || ''}${user.lastName[0] || ''}` : '';
  const userType = (user?.type || 'bronze') as AmbassadorType;
  const typeInfo = AMBASSADOR_TYPE_LABELS[userType];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    bankAccountsQuery.refetch().finally(() => setRefreshing(false));
  }, [bankAccountsQuery]);

  const copyReferralCode = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      await Clipboard.setStringAsync(referralLink);
      Alert.alert('Kopyalandı!', 'Referans linki panoya kopyalandı.');
    } catch (error) {
      console.log('Clipboard error:', error);
      Alert.alert('Hata', 'Kopyalama işlemi başarısız oldu.');
    }
  };

  const shareQRCode = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const shareMessage = `Compass Abroad'a katıl! Referans linkim: ${referralLink}`;
    
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: 'Compass Abroad Davet',
            text: shareMessage,
            url: referralLink,
          });
        } else {
          await Clipboard.setStringAsync(referralLink);
          Alert.alert('Link Kopyalandı!', 'Paylaşım desteklenmiyor, link panoya kopyalandı.');
        }
      } else {
        await Share.share({
          message: shareMessage,
          url: referralLink,
        });
      }
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const downloadQRCode = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    if (Platform.OS === 'web') {
      try {
        await Linking.openURL(qrCodeUrl);
        Alert.alert('QR Kodu', 'QR kodu yeni sekmede açıldı. Sağ tıklayıp kaydedebilirsiniz.', [{ text: 'Tamam' }]);
      } catch (error) {
        console.log('QR download error:', error);
      }
    } else {
      Alert.alert('QR Kodu İndir', 'QR kodunuz galeriye kaydedildi.', [{ text: 'Tamam' }]);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Çıkış Yap', 
          style: 'destructive',
          onPress: async () => {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            await logout();
          }
        },
      ]
    );
  };

  const formatIbanDisplay = (iban: string) => {
    const cleaned = iban.replace(/\s/g, '');
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatIbanInput = (text: string) => {
    let cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (cleaned.length > 0 && !cleaned.startsWith('TR')) {
      if (cleaned.startsWith('T')) {
        cleaned = 'T' + cleaned.slice(1);
      } else {
        cleaned = 'TR' + cleaned;
      }
    }
    
    if (cleaned.length > 26) {
      cleaned = cleaned.slice(0, 26);
    }
    
    return cleaned;
  };

  const validateIban = (iban: string): boolean => {
    const cleaned = iban.replace(/\s/g, '');
    
    if (cleaned.length !== 26) {
      setIbanError('IBAN 26 karakter olmalıdır');
      return false;
    }
    
    if (!cleaned.startsWith('TR')) {
      setIbanError('IBAN "TR" ile başlamalıdır');
      return false;
    }
    
    const afterTR = cleaned.slice(2);
    if (!/^\d+$/.test(afterTR)) {
      setIbanError('TR sonrası sadece rakam olmalıdır');
      return false;
    }
    
    setIbanError('');
    return true;
  };

  const handleIbanChange = (text: string) => {
    const formatted = formatIbanInput(text);
    setNewIban(formatted);
    
    if (formatted.length === 26) {
      validateIban(formatted);
    } else {
      setIbanError('');
    }
  };

  const resetAddBankForm = () => {
    setNewIban('');
    setNewBankName('');
    setShowBankPicker(false);
    setIbanError('');
  };

  const handleAddBank = () => {
    if (!newBankName) {
      Alert.alert('Hata', 'Lütfen bir banka seçin');
      return;
    }

    if (!validateIban(newIban)) {
      return;
    }

    addBankMutation.mutate({
      token: token || '',
      iban: newIban,
      bankName: newBankName,
    });
  };

  const handleSetDefault = (ibanId: string) => {
    const targetIban = savedIbans.find(i => i.id === ibanId);
    if (!targetIban || targetIban.status !== 'approved') {
      Alert.alert('Hata', 'Sadece onaylanmış hesaplar varsayılan olarak ayarlanabilir');
      return;
    }

    setDefaultMutation.mutate({
      token: token || '',
      bankAccountId: ibanId,
    });
  };

  const handleDeleteBank = (ibanId: string) => {
    const targetIban = savedIbans.find(i => i.id === ibanId);
    if (targetIban?.isDefault) {
      Alert.alert('Hata', 'Varsayılan hesap silinemez. Önce başka bir hesabı varsayılan yapın.');
      return;
    }

    Alert.alert(
      'Hesabı Sil',
      'Bu banka hesabını silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: () => {
            deleteBankMutation.mutate({
              token: token || '',
              bankAccountId: ibanId,
            });
          }
        },
      ]
    );
  };

  const pendingAccounts = savedIbans.filter(i => i.status === 'pending');

  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradient.middle, Colors.background]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.profileHeader}>
          {user.profilePhoto ? (
            <View style={[styles.avatarContainer, { borderColor: typeInfo.color }]}>
              <Image source={{ uri: user.profilePhoto }} style={styles.avatarImage} />
              <View style={[styles.typeBadgeSmall, { backgroundColor: typeInfo.color }]}>
                <Award size={12} color={Colors.background} />
              </View>
            </View>
          ) : (
            <View style={[styles.avatar, { borderColor: typeInfo.color }]}>
              <Text style={styles.avatarText}>
                {userInitials}
              </Text>
              <View style={[styles.typeBadgeSmall, { backgroundColor: typeInfo.color }]}>
                <Award size={12} color={Colors.background} />
              </View>
            </View>
          )}
          <View style={styles.profileInfo}>
            <View style={styles.profileNameRow}>
              <Text style={styles.profileName}>{userName}</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => router.push('/profile/edit')}
                accessibilityLabel="Profili Düzenle"
                accessibilityRole="button"
              >
                <Feather name="edit-2" size={24} color="#FFD700" />
              </TouchableOpacity>
            </View>
            {user.profilePhoto === undefined && user.firstName && (user as any).pendingFirstName && (
              <View style={styles.pendingNameBadge}>
                <Clock size={12} color={Colors.warning} />
                <Text style={styles.pendingNameText}>
                  İsim değişikliği bekliyor: {(user as any).pendingFirstName} {(user as any).pendingLastName}
                </Text>
              </View>
            )}
            <Text style={styles.profileEmail}>{user.email}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.typeBadge, { backgroundColor: typeInfo.color + '20' }]}>
                <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>
                  {typeInfo.tr} Elçi
                </Text>
              </View>
              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() => router.push('/profile/edit')}
                accessibilityLabel="Profili Düzenle"
                accessibilityRole="button"
              >
                <Feather name="edit-2" size={14} color="#FFD700" />
                <Text style={styles.editProfileButtonText}>Profili Düzenle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
        <View style={styles.qrSection}>
          <View style={styles.qrContainer}>
            <View style={styles.qrImageContainer}>
              <Image
                source={{ uri: qrCodeUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.referralCode}>{referralCode}</Text>
            <Text style={styles.referralLink}>{referralLink}</Text>
            <View style={styles.qrButtons}>
              <TouchableOpacity style={styles.qrButton} onPress={copyReferralCode}>
                <Copy size={18} color={Colors.text} />
                <Text style={styles.qrButtonText}>Kopyala</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.qrButton} onPress={shareQRCode}>
                <Share2 size={18} color={Colors.text} />
                <Text style={styles.qrButtonText}>Paylaş</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.qrButton} onPress={downloadQRCode}>
                <Download size={18} color={Colors.text} />
                <Text style={styles.qrButtonText}>İndir</Text>
              </TouchableOpacity>
            </View>
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
              const isActive = type === userType;
              const isPast = AMBASSADOR_TYPES.indexOf(userType) > index;
              
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Banka Hesapları</Text>
            <TouchableOpacity 
              style={styles.addBankButton}
              onPress={() => setShowAddBankModal(true)}
            >
              <Plus size={16} color={Colors.secondary} />
              <Text style={styles.addBankButtonText}>Hesap Ekle</Text>
            </TouchableOpacity>
          </View>

          {bankAccountsQuery.isLoading ? (
            <View style={styles.emptyBankCard}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.emptyBankText}>Yükleniyor...</Text>
            </View>
          ) : savedIbans.length === 0 ? (
            <View style={styles.emptyBankCard}>
              <CreditCard size={32} color={Colors.textMuted} />
              <Text style={styles.emptyBankText}>Henüz banka hesabı eklenmemiş</Text>
              <TouchableOpacity 
                style={styles.emptyBankButton}
                onPress={() => setShowAddBankModal(true)}
              >
                <Text style={styles.emptyBankButtonText}>İlk Hesabı Ekle</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.bankList}>
              {savedIbans.map((iban) => {
                const statusKey = (iban.status as BankAccountStatus) || 'pending';
                const statusConfig = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
                const StatusIcon = statusConfig.icon;
                
                return (
                  <View key={iban.id} style={styles.bankCard}>
                    <View style={styles.bankCardHeader}>
                      <View style={styles.bankInfo}>
                        <View style={styles.bankNameRow}>
                          <Building2 size={18} color={Colors.primary} />
                          <Text style={styles.bankName}>{iban.bankName}</Text>
                          {iban.isDefault && iban.status === 'approved' && (
                            <View style={styles.defaultBadge}>
                              <Star size={10} color={Colors.secondary} />
                              <Text style={styles.defaultBadgeText}>Varsayılan</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.ibanNumber}>{formatIbanDisplay(iban.iban)}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
                        <StatusIcon size={12} color={statusConfig.color} />
                        <Text style={[styles.statusText, { color: statusConfig.color }]}>
                          {statusConfig.label}
                        </Text>
                      </View>
                    </View>
                    
                    {iban.status === 'approved' && (
                      <View style={styles.bankCardActions}>
                        {!iban.isDefault && (
                          <TouchableOpacity 
                            style={styles.bankAction}
                            onPress={() => handleSetDefault(iban.id)}
                          >
                            <Star size={14} color={Colors.textSecondary} />
                            <Text style={styles.bankActionText}>Varsayılan Yap</Text>
                          </TouchableOpacity>
                        )}
                        {!iban.isDefault && (
                          <TouchableOpacity 
                            style={[styles.bankAction, styles.bankActionDelete]}
                            onPress={() => handleDeleteBank(iban.id)}
                          >
                            <Trash2 size={14} color={Colors.error} />
                            <Text style={[styles.bankActionText, { color: Colors.error }]}>Sil</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    {iban.status === 'pending' && (
                      <View style={styles.pendingInfo}>
                        <Text style={styles.pendingInfoText}>
                          Compass Abroad admin onayı bekleniyor...
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {pendingAccounts.length > 0 && (
            <View style={styles.pendingNote}>
              <AlertCircle size={14} color={Colors.warning} />
              <Text style={styles.pendingNoteText}>
                {pendingAccounts.length} hesap admin onayı bekliyor
              </Text>
            </View>
          )}
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

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>

        <Text style={styles.version}>v1.0.0 • Compass Abroad Ambassador</Text>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAddBankModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Banka Hesabı Ekle</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => {
                setShowAddBankModal(false);
                resetAddBankForm();
              }}
            >
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <View style={styles.formLabelRow}>
                <Building2 size={18} color={Colors.secondary} />
                <Text style={styles.formLabel}>Banka Seçin</Text>
              </View>
              <TouchableOpacity 
                style={styles.bankSelector} 
                onPress={() => setShowBankPicker(!showBankPicker)}
              >
                <Text style={newBankName ? styles.bankSelectorText : styles.bankSelectorPlaceholder}>
                  {newBankName || 'Banka seçin'}
                </Text>
                <ChevronDown size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
              {showBankPicker && (
                <ScrollView style={styles.bankOptions} nestedScrollEnabled>
                  {BANKS.map((bank) => (
                    <TouchableOpacity
                      key={bank}
                      style={[styles.bankOption, newBankName === bank && styles.bankOptionSelected]}
                      onPress={() => {
                        setNewBankName(bank);
                        setShowBankPicker(false);
                      }}
                    >
                      <Text style={[styles.bankOptionText, newBankName === bank && styles.bankOptionTextSelected]}>
                        {bank}
                      </Text>
                      {newBankName === bank && <Check size={16} color={Colors.secondary} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.formGroup}>
              <View style={styles.formLabelRow}>
                <CreditCard size={18} color={Colors.secondary} />
                <Text style={styles.formLabel}>IBAN</Text>
              </View>
              <TextInput
                style={[styles.ibanInput, ibanError ? styles.ibanInputError : null]}
                value={formatIbanDisplay(newIban)}
                onChangeText={handleIbanChange}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                maxLength={32}
              />
              {ibanError ? (
                <View style={styles.errorContainer}>
                  <AlertCircle size={14} color={Colors.error} />
                  <Text style={styles.errorText}>{ibanError}</Text>
                </View>
              ) : newIban.length === 26 ? (
                <View style={styles.successContainer}>
                  <CheckCircle size={14} color={Colors.success} />
                  <Text style={styles.successText}>IBAN formatı geçerli</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.infoCard}>
              <AlertCircle size={18} color={Colors.info} />
              <View style={styles.infoCardContent}>
                <Text style={styles.infoCardTitle}>Admin Onayı Gerekli</Text>
                <Text style={styles.infoCardText}>
                  Eklediğiniz banka hesabı Compass Abroad admin ekibi tarafından incelenecek ve onaylandıktan sonra ödeme almak için kullanılabilir olacaktır.
                </Text>
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {
                setShowAddBankModal(false);
                resetAddBankForm();
              }}
            >
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.submitButton,
                (!newBankName || newIban.length !== 26 || addBankMutation.isPending) && styles.submitButtonDisabled
              ]}
              onPress={handleAddBank}
              disabled={!newBankName || newIban.length !== 26 || addBankMutation.isPending}
            >
              {addBankMutation.isPending ? (
                <ActivityIndicator size="small" color={Colors.primaryDark} />
              ) : (
                <Text style={styles.submitButtonText}>Hesap Ekle</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    fontWeight: '700' as const,
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
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 16,
    borderWidth: 3,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  profileInfo: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  pendingNameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.warning + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  pendingNameText: {
    fontSize: 11,
    color: Colors.warning,
    fontWeight: '500' as const,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    paddingVertical: 4,
  },
  editProfileButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFD700',
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
  qrImageContainer: {
    width: 180,
    height: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 10,
  },
  qrImage: {
    width: 160,
    height: 160,
  },
  referralCode: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.secondary,
    letterSpacing: 2,
    marginBottom: 6,
  },
  referralLink: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  qrButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  qrButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
    marginLeft: 4,
  },
  addBankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBankButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.secondary,
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
    fontWeight: '500' as const,
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
  emptyBankCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyBankText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 12,
    marginBottom: 16,
  },
  emptyBankButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyBankButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primaryDark,
  },
  bankList: {
    gap: 12,
  },
  bankCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bankCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bankInfo: {
    flex: 1,
    marginRight: 12,
  },
  bankNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  bankName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.secondary,
  },
  ibanNumber: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  bankCardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  bankAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
  },
  bankActionDelete: {
    backgroundColor: Colors.error + '10',
  },
  bankActionText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  pendingInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  pendingInfoText: {
    fontSize: 12,
    color: Colors.warning,
    fontStyle: 'italic',
  },
  pendingNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  pendingNoteText: {
    fontSize: 12,
    color: Colors.warning,
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
    fontWeight: '500' as const,
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
    fontWeight: '500' as const,
  },
  langOptionActive: {
    color: Colors.secondary,
    fontWeight: '700' as const,
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
    fontWeight: '600' as const,
    color: Colors.error,
  },
  version: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  bankSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bankSelectorText: {
    fontSize: 16,
    color: Colors.text,
  },
  bankSelectorPlaceholder: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  bankOptions: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 200,
  },
  bankOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  bankOptionSelected: {
    backgroundColor: Colors.primary + '30',
  },
  bankOptionText: {
    fontSize: 15,
    color: Colors.text,
  },
  bankOptionTextSelected: {
    color: Colors.secondary,
    fontWeight: '600' as const,
  },
  ibanInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 14,
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
  },
  ibanInputError: {
    borderColor: Colors.error,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  successText: {
    fontSize: 12,
    color: Colors.success,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.info + '15',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.info + '30',
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.info,
    marginBottom: 4,
  },
  infoCardText: {
    fontSize: 13,
    color: Colors.info,
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  submitButton: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primaryDark,
  },
});
