import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
  Image,
  ActionSheetIOS,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  MapPin,
  Camera,
  Building2,
  ChevronDown,
  Check,
  X,
  Trash2,
  Star,
  Plus,
  AlertCircle,
  Clock,
  CheckCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import { MOCK_CURRENT_AMBASSADOR } from '@/mocks/data';
import { TURKISH_CITIES, SavedIban, BankAccountStatus } from '@/types';

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

export default function ProfileEditScreen() {
  const router = useRouter();
  const [firstName] = useState(MOCK_CURRENT_AMBASSADOR.firstName);
  const [lastName] = useState(MOCK_CURRENT_AMBASSADOR.lastName);
  const [email, setEmail] = useState(MOCK_CURRENT_AMBASSADOR.email);
  const [phone, setPhone] = useState(MOCK_CURRENT_AMBASSADOR.phone);
  const [birthDate, setBirthDate] = useState(MOCK_CURRENT_AMBASSADOR.birthDate || '');
  const [city, setCity] = useState(MOCK_CURRENT_AMBASSADOR.city || '');
  const [savedIbans, setSavedIbans] = useState<SavedIban[]>(MOCK_CURRENT_AMBASSADOR.savedIbans || []);
  
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [showNameChangeModal, setShowNameChangeModal] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newIban, setNewIban] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [ibanError, setIbanError] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(MOCK_CURRENT_AMBASSADOR.profilePhoto || null);

  const [pendingFirstName, setPendingFirstName] = useState(firstName);
  const [pendingLastName, setPendingLastName] = useState(lastName);

  const originalFirstName = MOCK_CURRENT_AMBASSADOR.firstName;
  const originalLastName = MOCK_CURRENT_AMBASSADOR.lastName;
  const tcIdentity = MOCK_CURRENT_AMBASSADOR.tcIdentity || '';

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets[0]) {
        setProfilePhoto(result.assets[0].uri);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Kamera kullanmak için izin vermeniz gerekiyor.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('Camera result:', result);

      if (!result.canceled && result.assets[0]) {
        setProfilePhoto(result.assets[0].uri);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu.');
    }
  };

  const removePhoto = () => {
    Alert.alert(
      'Fotoğrafı Kaldır',
      'Profil fotoğrafınızı kaldırmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: () => {
            setProfilePhoto(null);
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          },
        },
      ]
    );
  };

  const handleChangePhoto = () => {
    if (Platform.OS === 'ios') {
      const options = profilePhoto
        ? ['İptal', 'Galeriden Seç', 'Fotoğraf Çek', 'Fotoğrafı Kaldır']
        : ['İptal', 'Galeriden Seç', 'Fotoğraf Çek'];
      const destructiveButtonIndex = profilePhoto ? 3 : undefined;

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          destructiveButtonIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            pickImageFromGallery();
          } else if (buttonIndex === 2) {
            takePhoto();
          } else if (buttonIndex === 3 && profilePhoto) {
            removePhoto();
          }
        }
      );
    } else {
      Alert.alert(
        'Profil Fotoğrafı',
        'Fotoğraf kaynağını seçin',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Galeriden Seç', onPress: pickImageFromGallery },
          { text: 'Fotoğraf Çek', onPress: takePhoto },
          ...(profilePhoto ? [{ text: 'Fotoğrafı Kaldır', onPress: removePhoto, style: 'destructive' as const }] : []),
        ]
      );
    }
  };

  

  const formatPhone = (text: string): string => {
    let cleaned = text.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+90') && cleaned.length > 0) {
      if (cleaned.startsWith('90')) {
        cleaned = '+' + cleaned;
      } else if (cleaned.startsWith('0')) {
        cleaned = '+9' + cleaned;
      } else if (!cleaned.startsWith('+')) {
        cleaned = '+90' + cleaned;
      }
    }
    return cleaned.slice(0, 13);
  };

  const formatDate = (text: string): string => {
    const cleaned = text.replace(/[^\d]/g, '');
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
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
    const existingBank = savedIbans.find(
      i => i.iban === newIban || (i.bankName === newBankName && i.status !== 'rejected')
    );
    if (existingBank) {
      Alert.alert('Hata', 'Bu banka veya IBAN zaten kayıtlı');
      return;
    }
    const isFirstAccount = savedIbans.filter(i => i.status === 'approved').length === 0;
    const newAccount: SavedIban = {
      id: Date.now().toString(),
      iban: newIban,
      bankName: newBankName,
      isDefault: isFirstAccount,
      status: 'pending',
      submittedAt: new Date().toISOString().split('T')[0],
    };
    setSavedIbans([...savedIbans, newAccount]);
    setShowAddBankModal(false);
    resetAddBankForm();
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert(
      'Banka Hesabı Eklendi',
      'Banka hesabınız Compass Abroad admin onayına gönderildi.',
      [{ text: 'Tamam' }]
    );
  };

  const handleSetDefault = (ibanId: string) => {
    const targetIban = savedIbans.find(i => i.id === ibanId);
    if (!targetIban || targetIban.status !== 'approved') {
      Alert.alert('Hata', 'Sadece onaylanmış hesaplar varsayılan olarak ayarlanabilir');
      return;
    }
    setSavedIbans(savedIbans.map(iban => ({
      ...iban,
      isDefault: iban.id === ibanId,
    })));
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
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
            setSavedIbans(savedIbans.filter(i => i.id !== ibanId));
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }
        },
      ]
    );
  };

  const handleNameChange = () => {
    if (pendingFirstName === originalFirstName && pendingLastName === originalLastName) {
      Alert.alert('Uyarı', 'İsim değişikliği yapmadınız.');
      return;
    }
    setShowNameChangeModal(true);
  };

  const submitNameChangeRequest = () => {
    setShowNameChangeModal(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert(
      'Talep Oluşturuldu',
      `İsim değişikliği talebiniz admin onayına gönderildi.\n\nMevcut: ${originalFirstName} ${originalLastName}\nTalep Edilen: ${pendingFirstName} ${pendingLastName}`,
      [{ text: 'Tamam' }]
    );
    console.log('Name change request submitted:', {
      currentFirstName: originalFirstName,
      currentLastName: originalLastName,
      requestedFirstName: pendingFirstName,
      requestedLastName: pendingLastName,
    });
  };

  const handleSave = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    console.log('Profile saved:', {
      firstName,
      lastName,
      email,
      phone,
      birthDate,
      city,
      savedIbans,
    });
    Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.', [
      { text: 'Tamam', onPress: () => router.back() }
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {firstName[0]}{lastName[0]}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton} onPress={handleChangePhoto}>
              <Camera size={18} color={Colors.background} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleChangePhoto}>
            <Text style={styles.changePhotoText}>
              {profilePhoto ? 'Fotoğrafı Değiştir' : 'Fotoğraf Ekle'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>

          <View style={styles.inputRow}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <View style={styles.inputLabelRow}>
                <User size={16} color={Colors.secondary} />
                <Text style={styles.inputLabel}>Ad</Text>
              </View>
              <TextInput
                style={styles.input}
                value={pendingFirstName}
                onChangeText={setPendingFirstName}
                placeholder="Adınız"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <View style={styles.inputLabelRow}>
                <User size={16} color={Colors.secondary} />
                <Text style={styles.inputLabel}>Soyad</Text>
              </View>
              <TextInput
                style={styles.input}
                value={pendingLastName}
                onChangeText={setPendingLastName}
                placeholder="Soyadınız"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          {(pendingFirstName !== originalFirstName || pendingLastName !== originalLastName) && (
            <TouchableOpacity style={styles.nameChangeButton} onPress={handleNameChange}>
              <AlertCircle size={16} color={Colors.warning} />
              <Text style={styles.nameChangeButtonText}>İsim değişikliği için onay talep et</Text>
            </TouchableOpacity>
          )}

          {MOCK_CURRENT_AMBASSADOR.pendingFirstName && (
            <View style={styles.pendingNameBanner}>
              <Clock size={16} color={Colors.warning} />
              <Text style={styles.pendingNameText}>
                İsim değişikliği onay bekliyor: {MOCK_CURRENT_AMBASSADOR.pendingFirstName} {MOCK_CURRENT_AMBASSADOR.pendingLastName}
              </Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <View style={styles.inputLabelRow}>
              <Mail size={16} color={Colors.secondary} />
              <Text style={styles.inputLabel}>E-posta</Text>
            </View>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="E-posta adresiniz"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputLabelRow}>
              <Phone size={16} color={Colors.secondary} />
              <Text style={styles.inputLabel}>Telefon</Text>
            </View>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(text) => setPhone(formatPhone(text))}
              placeholder="+90 5XX XXX XX XX"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputLabelRow}>
              <Calendar size={16} color={Colors.secondary} />
              <Text style={styles.inputLabel}>Doğum Tarihi</Text>
            </View>
            <TextInput
              style={styles.input}
              value={birthDate}
              onChangeText={(text) => setBirthDate(formatDate(text))}
              placeholder="GG/AA/YYYY"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputLabelRow}>
              <CreditCard size={16} color={Colors.secondary} />
              <Text style={styles.inputLabel}>TC Kimlik No</Text>
            </View>
            <View style={[styles.input, styles.inputDisabled]}>
              <Text style={styles.inputDisabledText}>{tcIdentity}</Text>
            </View>
            <Text style={styles.inputHint}>TC Kimlik No değiştirilemez</Text>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputLabelRow}>
              <MapPin size={16} color={Colors.secondary} />
              <Text style={styles.inputLabel}>Şehir</Text>
            </View>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowCityPicker(!showCityPicker)}
            >
              <Text style={city ? styles.pickerText : styles.pickerPlaceholder}>
                {city || 'Şehir seçin'}
              </Text>
              <ChevronDown size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {showCityPicker && (
            <ScrollView style={styles.pickerList} nestedScrollEnabled>
              {TURKISH_CITIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.pickerOption, city === c && styles.pickerOptionSelected]}
                  onPress={() => {
                    setCity(c);
                    setShowCityPicker(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, city === c && styles.pickerOptionTextSelected]}>
                    {c}
                  </Text>
                  {city === c && <Check size={16} color={Colors.secondary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Banka Hesapları</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddBankModal(true)}
            >
              <Plus size={16} color={Colors.secondary} />
              <Text style={styles.addButtonText}>Yeni IBAN Ekle</Text>
            </TouchableOpacity>
          </View>

          {savedIbans.length === 0 ? (
            <View style={styles.emptyState}>
              <Building2 size={32} color={Colors.textMuted} />
              <Text style={styles.emptyStateText}>Henüz banka hesabı eklenmemiş</Text>
            </View>
          ) : (
            <View style={styles.bankList}>
              {savedIbans.map((iban) => {
                const statusConfig = STATUS_CONFIG[iban.status];
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
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Değişiklikleri Kaydet</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showAddBankModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Yeni IBAN Ekle</Text>
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
              <View style={styles.inputLabelRow}>
                <Building2 size={18} color={Colors.secondary} />
                <Text style={styles.inputLabel}>Banka Seçin</Text>
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
              <View style={styles.inputLabelRow}>
                <CreditCard size={18} color={Colors.secondary} />
                <Text style={styles.inputLabel}>IBAN</Text>
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
                (!newBankName || newIban.length !== 26) && styles.submitButtonDisabled
              ]}
              onPress={handleAddBank}
              disabled={!newBankName || newIban.length !== 26}
            >
              <Text style={styles.submitButtonText}>IBAN Ekle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showNameChangeModal} animationType="fade" transparent>
        <View style={styles.nameChangeModalOverlay}>
          <View style={styles.nameChangeModalContent}>
            <View style={styles.nameChangeModalHeader}>
              <AlertCircle size={48} color={Colors.warning} />
              <Text style={styles.nameChangeModalTitle}>İsim Değişikliği</Text>
            </View>
            <Text style={styles.nameChangeModalText}>
              İsim değişikliği admin onayı gerektirir. Talep oluşturulsun mu?
            </Text>
            <View style={styles.nameChangeModalInfo}>
              <View style={styles.nameChangeRow}>
                <Text style={styles.nameChangeLabel}>Mevcut:</Text>
                <Text style={styles.nameChangeValue}>{originalFirstName} {originalLastName}</Text>
              </View>
              <View style={styles.nameChangeRow}>
                <Text style={styles.nameChangeLabel}>Yeni:</Text>
                <Text style={[styles.nameChangeValue, { color: Colors.secondary }]}>
                  {pendingFirstName} {pendingLastName}
                </Text>
              </View>
            </View>
            <View style={styles.nameChangeModalButtons}>
              <TouchableOpacity 
                style={styles.nameChangeModalCancel}
                onPress={() => setShowNameChangeModal(false)}
              >
                <Text style={styles.nameChangeModalCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.nameChangeModalConfirm}
                onPress={submitNameChangeRequest}
              >
                <Text style={styles.nameChangeModalConfirmText}>Talep Oluştur</Text>
              </TouchableOpacity>
            </View>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.secondary,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.secondary,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
  },
  changePhotoText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '600' as const,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.secondary,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputDisabled: {
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
  },
  inputDisabledText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  inputHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
  },
  nameChangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warning + '15',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  nameChangeButtonText: {
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '500' as const,
  },
  pendingNameBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.warning + '15',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  pendingNameText: {
    flex: 1,
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '500' as const,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerText: {
    fontSize: 16,
    color: Colors.text,
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  pickerList: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 200,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerOptionSelected: {
    backgroundColor: Colors.primary + '30',
  },
  pickerOptionText: {
    fontSize: 15,
    color: Colors.text,
  },
  pickerOptionTextSelected: {
    color: Colors.secondary,
    fontWeight: '600' as const,
  },
  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 12,
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
  saveButton: {
    backgroundColor: Colors.secondary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primaryDark,
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
  nameChangeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  nameChangeModalContent: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  nameChangeModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  nameChangeModalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 12,
  },
  nameChangeModalText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  nameChangeModalInfo: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  nameChangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  nameChangeLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  nameChangeValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  nameChangeModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  nameChangeModalCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  nameChangeModalCancelText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  nameChangeModalConfirm: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
  },
  nameChangeModalConfirmText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.primaryDark,
  },
});
