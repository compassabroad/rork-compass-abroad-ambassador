import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  User,
  Phone,
  Building2,
  ChevronDown,
  Check,
  MapPin,
  Tag,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { TURKISH_CITIES } from '@/types';

type Category = 'individual' | 'corporate';

const INDIVIDUAL_SUB_TYPES = [
  { value: 'student', label: 'Öğrenci' },
  { value: 'teacher', label: 'Öğretmen' },
  { value: 'other', label: 'Diğer' },
];

const CORPORATE_SUB_TYPES = [
  { value: 'school', label: 'Okul' },
  { value: 'agency', label: 'Ajans' },
  { value: 'other', label: 'Diğer' },
];

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  city?: string;
  subType?: string;
  companyName?: string;
  kvkk?: string;
  privacy?: string;
  terms?: string;
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState<Category>('individual');
  const [subType, setSubType] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [taxOffice, setTaxOffice] = useState('');
  const [parentReferralCode, setParentReferralCode] = useState('');
  const [kvkkConsent, setKvkkConsent] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  const filteredCities = TURKISH_CITIES.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!firstName.trim() || firstName.trim().length < 2) {
      newErrors.firstName = 'İsim en az 2 karakter olmalı';
    }
    if (!lastName.trim() || lastName.trim().length < 2) {
      newErrors.lastName = 'Soyisim en az 2 karakter olmalı';
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    }
    if (!phone.trim() || phone.trim().length < 10) {
      newErrors.phone = 'Geçerli bir telefon numarası girin';
    }
    if (!password || password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalı';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }
    if (!city) {
      newErrors.city = 'Şehir seçiniz';
    }
    if (!subType) {
      newErrors.subType = 'Alt tür seçiniz';
    }
    if (category === 'corporate' && !companyName.trim()) {
      newErrors.companyName = 'Şirket adı zorunludur';
    }
    if (!kvkkConsent) {
      newErrors.kvkk = 'KVKK onayı gereklidir';
    }
    if (!privacyConsent) {
      newErrors.privacy = 'Gizlilik politikası onayı gereklidir';
    }
    if (!termsConsent) {
      newErrors.terms = 'Kullanım koşulları onayı gereklidir';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [firstName, lastName, email, phone, password, confirmPassword, city, subType, category, companyName, kvkkConsent, privacyConsent, termsConsent]);

  const handleRegister = async () => {
    setError(null);

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const result = await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        city,
        category,
        subType,
        companyName: category === 'corporate' ? companyName.trim() : undefined,
        taxNumber: category === 'corporate' && taxNumber.trim() ? taxNumber.trim() : undefined,
        taxOffice: category === 'corporate' && taxOffice.trim() ? taxOffice.trim() : undefined,
        kvkkConsent: true as const,
        privacyPolicyConsent: true as const,
        termsConsent: true as const,
        parentReferralCode: parentReferralCode.trim() || undefined,
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        'Kayıt Başarılı',
        result.message,
        [
          {
            text: 'Tamam',
            onPress: () => router.replace('/auth/pending-approval'),
          },
        ]
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Kayıt yapılamadı. Lütfen tekrar deneyin.';
      console.log('[Register] Error:', message);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (newCategory: Category) => {
    setCategory(newCategory);
    setSubType('');
    setErrors((prev) => ({ ...prev, subType: undefined, companyName: undefined }));
  };

  const renderFieldError = (fieldError?: string) => {
    if (!fieldError) return null;
    return (
      <View style={styles.fieldErrorContainer}>
        <AlertCircle size={12} color={Colors.error} />
        <Text style={styles.fieldErrorText}>{fieldError}</Text>
      </View>
    );
  };

  const renderCheckbox = (
    checked: boolean,
    onPress: () => void,
    label: string,
    fieldError?: string
  ) => (
    <View style={styles.checkboxRow}>
      <TouchableOpacity
        style={[styles.checkbox, checked && styles.checkboxChecked]}
        onPress={onPress}
      >
        {checked && <Check size={14} color={Colors.background} />}
      </TouchableOpacity>
      <Text style={styles.checkboxLabel}>{label}</Text>
      {fieldError ? (
        <View style={styles.checkboxErrorDot} />
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={[Colors.gradient.start, Colors.gradient.middle, Colors.background]}
        style={[styles.gradient, { paddingTop: insets.top + 20 }]}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoRing}>
              <LinearGradient
                colors={['#FFD700', '#E8B923', '#DAA520']}
                style={styles.logoRingGradient}
              >
                <View style={styles.logoInner}>
                  <Text style={styles.logoText}>CA</Text>
                </View>
              </LinearGradient>
            </View>
            <Text style={styles.title}>Compass Abroad</Text>
            <Text style={styles.subtitle}>Elçi Kayıt Formu</Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>

            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <User size={16} color={Colors.secondary} />
                <Text style={styles.inputLabel}>Ad</Text>
              </View>
              <TextInput
                style={[styles.input, errors.firstName ? styles.inputError : null]}
                value={firstName}
                onChangeText={(t) => { setFirstName(t); setErrors((p) => ({ ...p, firstName: undefined })); }}
                placeholder="Ad"
                placeholderTextColor={Colors.textMuted}
                testID="register-firstName"
              />
              {renderFieldError(errors.firstName)}
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <User size={16} color={Colors.secondary} />
                <Text style={styles.inputLabel}>Soyad</Text>
              </View>
              <TextInput
                style={[styles.input, errors.lastName ? styles.inputError : null]}
                value={lastName}
                onChangeText={(t) => { setLastName(t); setErrors((p) => ({ ...p, lastName: undefined })); }}
                placeholder="Soyad"
                placeholderTextColor={Colors.textMuted}
                testID="register-lastName"
              />
              {renderFieldError(errors.lastName)}
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <Mail size={16} color={Colors.secondary} />
                <Text style={styles.inputLabel}>E-posta</Text>
              </View>
              <TextInput
                style={[styles.input, errors.email ? styles.inputError : null]}
                value={email}
                onChangeText={(t) => { setEmail(t.toLowerCase()); setErrors((p) => ({ ...p, email: undefined })); }}
                placeholder="E-posta"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                testID="register-email"
              />
              {renderFieldError(errors.email)}
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <Phone size={16} color={Colors.secondary} />
                <Text style={styles.inputLabel}>Telefon</Text>
              </View>
              <TextInput
                style={[styles.input, errors.phone ? styles.inputError : null]}
                value={phone}
                onChangeText={(t) => { setPhone(t); setErrors((p) => ({ ...p, phone: undefined })); }}
                placeholder="Telefon"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                testID="register-phone"
              />
              {renderFieldError(errors.phone)}
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <Lock size={16} color={Colors.secondary} />
                <Text style={styles.inputLabel}>Şifre</Text>
              </View>
              <View style={[styles.passwordContainer, errors.password ? styles.inputError : null]}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setErrors((p) => ({ ...p, password: undefined })); }}
                  placeholder="Şifre (min. 6 karakter)"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPassword}
                  testID="register-password"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={Colors.textSecondary} />
                  ) : (
                    <Eye size={18} color={Colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
              {renderFieldError(errors.password)}
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <Lock size={16} color={Colors.secondary} />
                <Text style={styles.inputLabel}>Şifre Tekrar</Text>
              </View>
              <View style={[styles.passwordContainer, errors.confirmPassword ? styles.inputError : null]}>
                <TextInput
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); setErrors((p) => ({ ...p, confirmPassword: undefined })); }}
                  placeholder="Şifre Tekrar"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showConfirmPassword}
                  testID="register-confirmPassword"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} color={Colors.textSecondary} />
                  ) : (
                    <Eye size={18} color={Colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
              {renderFieldError(errors.confirmPassword)}
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <MapPin size={16} color={Colors.secondary} />
                <Text style={styles.inputLabel}>Şehir</Text>
              </View>
              <TouchableOpacity
                style={[styles.pickerButton, errors.city ? styles.inputError : null]}
                onPress={() => setShowCityPicker(true)}
              >
                <Text style={[styles.pickerButtonText, !city && styles.pickerPlaceholder]}>
                  {city || 'Şehir seçiniz'}
                </Text>
                <ChevronDown size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
              {renderFieldError(errors.city)}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Hesap Türü</Text>

            <View style={styles.categoryRow}>
              <TouchableOpacity
                style={[styles.categoryCard, category === 'individual' && styles.categoryCardActive]}
                onPress={() => handleCategoryChange('individual')}
              >
                <User size={24} color={category === 'individual' ? Colors.secondary : Colors.textMuted} />
                <Text style={[styles.categoryLabel, category === 'individual' && styles.categoryLabelActive]}>
                  Bireysel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.categoryCard, category === 'corporate' && styles.categoryCardActive]}
                onPress={() => handleCategoryChange('corporate')}
              >
                <Building2 size={24} color={category === 'corporate' ? Colors.secondary : Colors.textMuted} />
                <Text style={[styles.categoryLabel, category === 'corporate' && styles.categoryLabelActive]}>
                  Kurumsal
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subTypeLabel}>Alt Tür</Text>
            <View style={styles.subTypeRow}>
              {(category === 'individual' ? INDIVIDUAL_SUB_TYPES : CORPORATE_SUB_TYPES).map((st) => (
                <TouchableOpacity
                  key={st.value}
                  style={[styles.subTypeChip, subType === st.value && styles.subTypeChipActive]}
                  onPress={() => { setSubType(st.value); setErrors((p) => ({ ...p, subType: undefined })); }}
                >
                  <Text style={[styles.subTypeChipText, subType === st.value && styles.subTypeChipTextActive]}>
                    {st.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {renderFieldError(errors.subType)}

            {category === 'corporate' && (
              <>
                <View style={styles.inputContainer}>
                  <View style={styles.inputLabelRow}>
                    <Building2 size={16} color={Colors.secondary} />
                    <Text style={styles.inputLabel}>Şirket Adı</Text>
                  </View>
                  <TextInput
                    style={[styles.input, errors.companyName ? styles.inputError : null]}
                    value={companyName}
                    onChangeText={(t) => { setCompanyName(t); setErrors((p) => ({ ...p, companyName: undefined })); }}
                    placeholder="Şirket Adı"
                    placeholderTextColor={Colors.textMuted}
                  />
                  {renderFieldError(errors.companyName)}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Vergi No</Text>
                  <TextInput
                    style={styles.input}
                    value={taxNumber}
                    onChangeText={setTaxNumber}
                    placeholder="Vergi No (opsiyonel)"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Vergi Dairesi</Text>
                  <TextInput
                    style={styles.input}
                    value={taxOffice}
                    onChangeText={setTaxOffice}
                    placeholder="Vergi Dairesi (opsiyonel)"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Yasal Onaylar</Text>

            {renderCheckbox(
              kvkkConsent,
              () => { setKvkkConsent(!kvkkConsent); setErrors((p) => ({ ...p, kvkk: undefined })); },
              "KVKK Aydınlatma Metni'ni okudum ve kabul ediyorum",
              errors.kvkk
            )}
            {renderFieldError(errors.kvkk)}

            {renderCheckbox(
              privacyConsent,
              () => { setPrivacyConsent(!privacyConsent); setErrors((p) => ({ ...p, privacy: undefined })); },
              "Gizlilik Politikası'nı okudum ve kabul ediyorum",
              errors.privacy
            )}
            {renderFieldError(errors.privacy)}

            {renderCheckbox(
              termsConsent,
              () => { setTermsConsent(!termsConsent); setErrors((p) => ({ ...p, terms: undefined })); },
              "Kullanım Koşulları'nı okudum ve kabul ediyorum",
              errors.terms
            )}
            {renderFieldError(errors.terms)}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <Tag size={16} color={Colors.secondary} />
                <Text style={styles.inputLabel}>Referans Kodu (Opsiyonel)</Text>
              </View>
              <TextInput
                style={styles.input}
                value={parentReferralCode}
                onChangeText={(t) => setParentReferralCode(t.toUpperCase())}
                placeholder="Sizi davet eden elçinin kodu (opsiyonel)"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
              />
            </View>
          </View>

          {error && (
            <View style={styles.globalErrorContainer}>
              <AlertCircle size={16} color={Colors.error} />
              <Text style={styles.globalErrorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            testID="register-submit"
          >
            <LinearGradient
              colors={[Colors.secondary, '#F5D76E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.registerButtonGradient}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.background} />
              ) : (
                <Text style={styles.registerButtonText}>Kayıt Ol</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.back()}
          >
            <Text style={styles.loginLinkText}>
              Zaten hesabınız var mı? <Text style={styles.loginLinkHighlight}>Giriş Yapın</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>

      <Modal
        visible={showCityPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCityPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Şehir Seçin</Text>
              <TouchableOpacity onPress={() => setShowCityPicker(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalSearchContainer}>
              <TextInput
                style={styles.modalSearchInput}
                value={citySearch}
                onChangeText={setCitySearch}
                placeholder="Şehir ara..."
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <FlatList
              data={filteredCities}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.cityItem, city === item && styles.cityItemActive]}
                  onPress={() => {
                    setCity(item);
                    setErrors((p) => ({ ...p, city: undefined }));
                    setShowCityPicker(false);
                    setCitySearch('');
                  }}
                >
                  <Text style={[styles.cityItemText, city === item && styles.cityItemTextActive]}>
                    {item}
                  </Text>
                  {city === item && <Check size={18} color={Colors.secondary} />}
                </TouchableOpacity>
              )}
              style={styles.cityList}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  logoRingGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.secondary,
    letterSpacing: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 14,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputError: {
    borderColor: Colors.error,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
  },
  eyeButton: {
    padding: 14,
  },
  pickerButton: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerButtonText: {
    fontSize: 15,
    color: Colors.text,
  },
  pickerPlaceholder: {
    color: Colors.textMuted,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardActive: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary + '10',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  categoryLabelActive: {
    color: Colors.secondary,
  },
  subTypeLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  subTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  subTypeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subTypeChipActive: {
    backgroundColor: Colors.secondary + '20',
    borderColor: Colors.secondary,
  },
  subTypeChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textMuted,
  },
  subTypeChipTextActive: {
    color: Colors.secondary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    paddingRight: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  checkboxErrorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.error,
  },
  fieldErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  fieldErrorText: {
    fontSize: 12,
    color: Colors.error,
  },
  globalErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.error + '15',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  globalErrorText: {
    flex: 1,
    fontSize: 13,
    color: Colors.error,
  },
  registerButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonGradient: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  loginLink: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loginLinkText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loginLinkHighlight: {
    fontWeight: '600' as const,
    color: Colors.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalSearchContainer: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  modalSearchInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cityList: {
    flex: 1,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '40',
  },
  cityItemActive: {
    backgroundColor: Colors.secondary + '10',
  },
  cityItemText: {
    fontSize: 15,
    color: Colors.text,
  },
  cityItemTextActive: {
    color: Colors.secondary,
    fontWeight: '600' as const,
  },
});
