import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Platform,
  Linking,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Compass,
  User,
  Building2,
  GraduationCap,
  Briefcase,
  Users,
  School,
  ChevronRight,
  ChevronLeft,
  Check,
  Shield,
  MapPin,
  Calendar,
  Phone,
  Mail,
  CreditCard,
  ChevronDown,
  CheckCircle,
  Clock,
  Globe,
  Target,
  Lock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import { TURKISH_CITIES, AmbassadorCategory, IndividualSubType, CorporateSubType } from '@/types';

type RegistrationType = 'student' | 'ambassador' | null;

interface StudentData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  city: string;
  interestedProgram: string;
  targetCountry: string;
  plannedSeason: string;
  password: string;
  confirmPassword: string;
  privacyConsent: boolean;
  kvkkConsent: boolean;
  termsConsent: boolean;
}

interface AmbassadorData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  tcIdentity: string;
  city: string;
  category: AmbassadorCategory | null;
  individualType: IndividualSubType | null;
  corporateType: CorporateSubType | null;
  companyName: string;
  taxNumber: string;
  taxOffice: string;
  password: string;
  confirmPassword: string;
  privacyConsent: boolean;
  kvkkConsent: boolean;
  termsConsent: boolean;
}

const INTERESTED_PROGRAMS = [
  { id: 'camp_usa', label: 'Camp USA' },
  { id: 'summer_school', label: 'Summer School' },
  { id: 'work_and_travel', label: 'Work and Travel' },
  { id: 'language_education', label: 'Dil Okulu' },
  { id: 'high_school', label: 'Yurt Dışı Lise' },
  { id: 'bachelor', label: 'Üniversite' },
  { id: 'masters', label: 'Yüksek Lisans' },
  { id: 'mba', label: 'MBA' },
  { id: 'internship', label: 'Staj Programı' },
  { id: 'au_pair', label: 'Au Pair' },
  { id: 'group_summer_school', label: 'Yaz Okulu' },
];

const TARGET_COUNTRIES = [
  { id: 'usa', label: 'ABD' },
  { id: 'uk', label: 'İngiltere' },
  { id: 'canada', label: 'Kanada' },
  { id: 'germany', label: 'Almanya' },
  { id: 'australia', label: 'Avustralya' },
  { id: 'ireland', label: 'İrlanda' },
  { id: 'malta', label: 'Malta' },
  { id: 'other', label: 'Diğer' },
];

const PLANNED_SEASONS = [
  { id: '2025_summer', label: '2025 Yaz' },
  { id: '2025_fall', label: '2025 Güz' },
  { id: '2026_summer', label: '2026 Yaz' },
  { id: '2026_fall', label: '2026 Güz' },
  { id: 'undecided', label: 'Henüz Karar Vermedim' },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [slideAnim] = useState(() => new Animated.Value(0));
  
  const typeFromUrl = params.type as RegistrationType;
  const refCode = params.ref as string | undefined;
  
  const [registrationType, setRegistrationType] = useState<RegistrationType>(typeFromUrl || null);
  const [currentStep, setCurrentStep] = useState(typeFromUrl ? 1 : 0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showProgramPicker, setShowProgramPicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showSeasonPicker, setShowSeasonPicker] = useState(false);
  
  const [studentData, setStudentData] = useState<StudentData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    city: '',
    interestedProgram: '',
    targetCountry: '',
    plannedSeason: '',
    password: '',
    confirmPassword: '',
    privacyConsent: false,
    kvkkConsent: false,
    termsConsent: false,
  });
  
  const [ambassadorData, setAmbassadorData] = useState<AmbassadorData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    tcIdentity: '',
    city: '',
    category: null,
    individualType: null,
    corporateType: null,
    companyName: '',
    taxNumber: '',
    taxOffice: '',
    password: '',
    confirmPassword: '',
    privacyConsent: false,
    kvkkConsent: false,
    termsConsent: false,
  });

  useEffect(() => {
    if (typeFromUrl && (typeFromUrl === 'student' || typeFromUrl === 'ambassador')) {
      setRegistrationType(typeFromUrl);
      setCurrentStep(1);
    }
  }, [typeFromUrl]);

  const animateSlide = (direction: 'next' | 'back') => {
    const toValue = direction === 'next' ? -20 : 20;
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSelectType = async (type: RegistrationType) => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRegistrationType(type);
    setCurrentStep(1);
    animateSlide('next');
  };

  const handleNext = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    animateSlide('next');
    setCurrentStep(currentStep + 1);
  };

  const handleBack = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (currentStep === 1 && !typeFromUrl) {
      setRegistrationType(null);
      setCurrentStep(0);
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
    animateSlide('back');
  };

  const handleStudentRegister = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    console.log('Student registration:', studentData, 'Referral:', refCode);
    router.replace('/(tabs)');
  };

  const handleAmbassadorRegister = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    console.log('Ambassador registration:', ambassadorData, 'Referral:', refCode);
    setShowSuccessModal(true);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  const canProceedStudent = () => {
    switch (currentStep) {
      case 1:
        return (
          studentData.firstName.trim().length >= 2 &&
          studentData.lastName.trim().length >= 2 &&
          validateEmail(studentData.email) &&
          studentData.phone.length >= 13
        );
      case 2:
        return (
          studentData.city.length > 0 &&
          studentData.interestedProgram.length > 0 &&
          studentData.targetCountry.length > 0 &&
          studentData.plannedSeason.length > 0
        );
      case 3:
        return (
          studentData.password.length >= 6 &&
          studentData.password === studentData.confirmPassword &&
          studentData.privacyConsent &&
          studentData.kvkkConsent &&
          studentData.termsConsent
        );
      default:
        return false;
    }
  };

  const canProceedAmbassador = () => {
    switch (currentStep) {
      case 1:
        return (
          ambassadorData.firstName.trim().length >= 2 &&
          ambassadorData.lastName.trim().length >= 2 &&
          validateEmail(ambassadorData.email) &&
          ambassadorData.phone.length >= 13 &&
          ambassadorData.tcIdentity.length === 11
        );
      case 2:
        return ambassadorData.city.length > 0;
      case 3:
        if (!ambassadorData.category) return false;
        if (ambassadorData.category === 'individual' && !ambassadorData.individualType) return false;
        if (ambassadorData.category === 'corporate') {
          if (!ambassadorData.corporateType) return false;
          if (!ambassadorData.companyName.trim() || !ambassadorData.taxNumber.trim() || !ambassadorData.taxOffice.trim()) return false;
        }
        return true;
      case 4:
        return (
          ambassadorData.password.length >= 6 &&
          ambassadorData.password === ambassadorData.confirmPassword &&
          ambassadorData.privacyConsent &&
          ambassadorData.kvkkConsent &&
          ambassadorData.termsConsent
        );
      default:
        return false;
    }
  };

  const renderTypeSelection = () => (
    <View style={styles.stepContent}>
      <View style={styles.welcomeIcon}>
        <Compass size={80} color={Colors.secondary} />
      </View>
      <Text style={styles.welcomeTitle}>Compass Abroad</Text>
      <Text style={styles.welcomeSubtitle}>
        Nasıl kayıt olmak istersiniz?
      </Text>

      <View style={styles.typeSelectionContainer}>
        <TouchableOpacity
          style={styles.typeCard}
          onPress={() => handleSelectType('student')}
        >
          <View style={[styles.typeIconContainer, { backgroundColor: Colors.secondary + '20' }]}>
            <GraduationCap size={40} color={Colors.secondary} />
          </View>
          <Text style={styles.typeTitle}>Öğrenci Olarak Kayıt Ol</Text>
          <Text style={styles.typeDescription}>
            Yurt dışı eğitim programlarına başvurmak için kayıt olun
          </Text>
          <ChevronRight size={24} color={Colors.secondary} style={styles.typeArrow} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeCard, styles.ambassadorCard]}
          onPress={() => handleSelectType('ambassador')}
        >
          <View style={[styles.typeIconContainer, { backgroundColor: '#8B5CF6' + '20' }]}>
            <Users size={40} color="#8B5CF6" />
          </View>
          <Text style={styles.typeTitle}>Elçi Olarak Kayıt Ol</Text>
          <Text style={styles.typeDescription}>
            Öğrenci referansları ile komisyon kazanmak için kayıt olun
          </Text>
          <ChevronRight size={24} color="#8B5CF6" style={styles.typeArrow} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStudentStep1 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Kişisel Bilgiler</Text>
      <Text style={styles.stepDescription}>Hesabınızı oluşturmak için bilgilerinizi girin</Text>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
          <View style={styles.inputLabelRow}>
            <User size={16} color={Colors.secondary} />
            <Text style={styles.inputLabel}>Ad *</Text>
          </View>
          <TextInput
            style={styles.input}
            value={studentData.firstName}
            onChangeText={(text) => setStudentData({ ...studentData, firstName: text })}
            placeholder="Adınız"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
        <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
          <View style={styles.inputLabelRow}>
            <User size={16} color={Colors.secondary} />
            <Text style={styles.inputLabel}>Soyad *</Text>
          </View>
          <TextInput
            style={styles.input}
            value={studentData.lastName}
            onChangeText={(text) => setStudentData({ ...studentData, lastName: text })}
            placeholder="Soyadınız"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputLabelRow}>
          <Mail size={16} color={Colors.secondary} />
          <Text style={styles.inputLabel}>E-posta *</Text>
        </View>
        <TextInput
          style={[styles.input, !validateEmail(studentData.email) && studentData.email.length > 0 && styles.inputError]}
          value={studentData.email}
          onChangeText={(text) => setStudentData({ ...studentData, email: text.toLowerCase() })}
          placeholder="ornek@email.com"
          placeholderTextColor={Colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputLabelRow}>
          <Phone size={16} color={Colors.secondary} />
          <Text style={styles.inputLabel}>Telefon *</Text>
        </View>
        <TextInput
          style={styles.input}
          value={studentData.phone}
          onChangeText={(text) => setStudentData({ ...studentData, phone: formatPhone(text) })}
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
          value={studentData.birthDate}
          onChangeText={(text) => setStudentData({ ...studentData, birthDate: formatDate(text) })}
          placeholder="GG/AA/YYYY"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          maxLength={10}
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderStudentStep2 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Program Tercihleri</Text>
      <Text style={styles.stepDescription}>İlgilendiğiniz program ve ülkeyi seçin</Text>

      <View style={styles.inputContainer}>
        <View style={styles.inputLabelRow}>
          <MapPin size={16} color={Colors.secondary} />
          <Text style={styles.inputLabel}>Şehir *</Text>
        </View>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowCityPicker(!showCityPicker)}
        >
          <Text style={studentData.city ? styles.pickerText : styles.pickerPlaceholder}>
            {studentData.city || 'Şehir seçin'}
          </Text>
          <ChevronDown size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        {showCityPicker && (
          <ScrollView style={styles.pickerList} nestedScrollEnabled>
            {TURKISH_CITIES.map((city) => (
              <TouchableOpacity
                key={city}
                style={[styles.pickerOption, studentData.city === city && styles.pickerOptionSelected]}
                onPress={() => {
                  setStudentData({ ...studentData, city });
                  setShowCityPicker(false);
                }}
              >
                <Text style={[styles.pickerOptionText, studentData.city === city && styles.pickerOptionTextSelected]}>
                  {city}
                </Text>
                {studentData.city === city && <Check size={16} color={Colors.secondary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputLabelRow}>
          <GraduationCap size={16} color={Colors.secondary} />
          <Text style={styles.inputLabel}>İlgilendiği Program *</Text>
        </View>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowProgramPicker(!showProgramPicker)}
        >
          <Text style={studentData.interestedProgram ? styles.pickerText : styles.pickerPlaceholder}>
            {INTERESTED_PROGRAMS.find(p => p.id === studentData.interestedProgram)?.label || 'Program seçin'}
          </Text>
          <ChevronDown size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        {showProgramPicker && (
          <ScrollView style={styles.pickerList} nestedScrollEnabled>
            {INTERESTED_PROGRAMS.map((program) => (
              <TouchableOpacity
                key={program.id}
                style={[styles.pickerOption, studentData.interestedProgram === program.id && styles.pickerOptionSelected]}
                onPress={() => {
                  setStudentData({ ...studentData, interestedProgram: program.id });
                  setShowProgramPicker(false);
                }}
              >
                <Text style={[styles.pickerOptionText, studentData.interestedProgram === program.id && styles.pickerOptionTextSelected]}>
                  {program.label}
                </Text>
                {studentData.interestedProgram === program.id && <Check size={16} color={Colors.secondary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputLabelRow}>
          <Globe size={16} color={Colors.secondary} />
          <Text style={styles.inputLabel}>Hedef Ülke *</Text>
        </View>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowCountryPicker(!showCountryPicker)}
        >
          <Text style={studentData.targetCountry ? styles.pickerText : styles.pickerPlaceholder}>
            {TARGET_COUNTRIES.find(c => c.id === studentData.targetCountry)?.label || 'Ülke seçin'}
          </Text>
          <ChevronDown size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        {showCountryPicker && (
          <ScrollView style={styles.pickerList} nestedScrollEnabled>
            {TARGET_COUNTRIES.map((country) => (
              <TouchableOpacity
                key={country.id}
                style={[styles.pickerOption, studentData.targetCountry === country.id && styles.pickerOptionSelected]}
                onPress={() => {
                  setStudentData({ ...studentData, targetCountry: country.id });
                  setShowCountryPicker(false);
                }}
              >
                <Text style={[styles.pickerOptionText, studentData.targetCountry === country.id && styles.pickerOptionTextSelected]}>
                  {country.label}
                </Text>
                {studentData.targetCountry === country.id && <Check size={16} color={Colors.secondary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputLabelRow}>
          <Target size={16} color={Colors.secondary} />
          <Text style={styles.inputLabel}>Planlanan Dönem *</Text>
        </View>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowSeasonPicker(!showSeasonPicker)}
        >
          <Text style={studentData.plannedSeason ? styles.pickerText : styles.pickerPlaceholder}>
            {PLANNED_SEASONS.find(s => s.id === studentData.plannedSeason)?.label || 'Dönem seçin'}
          </Text>
          <ChevronDown size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        {showSeasonPicker && (
          <ScrollView style={styles.pickerList} nestedScrollEnabled>
            {PLANNED_SEASONS.map((season) => (
              <TouchableOpacity
                key={season.id}
                style={[styles.pickerOption, studentData.plannedSeason === season.id && styles.pickerOptionSelected]}
                onPress={() => {
                  setStudentData({ ...studentData, plannedSeason: season.id });
                  setShowSeasonPicker(false);
                }}
              >
                <Text style={[styles.pickerOptionText, studentData.plannedSeason === season.id && styles.pickerOptionTextSelected]}>
                  {season.label}
                </Text>
                {studentData.plannedSeason === season.id && <Check size={16} color={Colors.secondary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderStudentStep3 = () => {
    const allConsentsGiven = studentData.privacyConsent && studentData.kvkkConsent && studentData.termsConsent;
    const passwordsMatch = studentData.password === studentData.confirmPassword;
    const passwordValid = studentData.password.length >= 6;

    return (
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Şifre ve Onaylar</Text>
        <Text style={styles.stepDescription}>Hesabınızı güvence altına alın</Text>

        <View style={styles.inputContainer}>
          <View style={styles.inputLabelRow}>
            <Lock size={16} color={Colors.secondary} />
            <Text style={styles.inputLabel}>Şifre *</Text>
          </View>
          <TextInput
            style={[styles.input, !passwordValid && studentData.password.length > 0 && styles.inputError]}
            value={studentData.password}
            onChangeText={(text) => setStudentData({ ...studentData, password: text })}
            placeholder="En az 6 karakter"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
          />
          {!passwordValid && studentData.password.length > 0 && (
            <Text style={styles.errorText}>Şifre en az 6 karakter olmalıdır</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputLabelRow}>
            <Lock size={16} color={Colors.secondary} />
            <Text style={styles.inputLabel}>Şifre Tekrar *</Text>
          </View>
          <TextInput
            style={[styles.input, !passwordsMatch && studentData.confirmPassword.length > 0 && styles.inputError]}
            value={studentData.confirmPassword}
            onChangeText={(text) => setStudentData({ ...studentData, confirmPassword: text })}
            placeholder="Şifrenizi tekrar girin"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
          />
          {!passwordsMatch && studentData.confirmPassword.length > 0 && (
            <Text style={styles.errorText}>Şifreler eşleşmiyor</Text>
          )}
        </View>

        <View style={styles.agreementsList}>
          <View style={[styles.agreementItem, !studentData.privacyConsent && styles.agreementItemUnchecked]}>
            <TouchableOpacity
              style={styles.checkboxTouchable}
              onPress={() => setStudentData({ ...studentData, privacyConsent: !studentData.privacyConsent })}
            >
              <View style={[styles.checkbox, studentData.privacyConsent && styles.checkboxChecked]}>
                {studentData.privacyConsent && <Check size={16} color={Colors.background} />}
              </View>
            </TouchableOpacity>
            <View style={styles.agreementContent}>
              <Text style={styles.agreementText}>
                <Text
                  style={styles.agreementLink}
                  onPress={() => openLink('https://www.compassabroad.com.tr/gizlilik-politikasi/')}
                >
                  Gizlilik Politikası
                </Text>
                <Text style={styles.agreementLabel}>{"'nı okudum ve kabul ediyorum"}</Text>
              </Text>
            </View>
          </View>

          <View style={[styles.agreementItem, !studentData.kvkkConsent && styles.agreementItemUnchecked]}>
            <TouchableOpacity
              style={styles.checkboxTouchable}
              onPress={() => setStudentData({ ...studentData, kvkkConsent: !studentData.kvkkConsent })}
            >
              <View style={[styles.checkbox, studentData.kvkkConsent && styles.checkboxChecked]}>
                {studentData.kvkkConsent && <Check size={16} color={Colors.background} />}
              </View>
            </TouchableOpacity>
            <View style={styles.agreementContent}>
              <Text style={styles.agreementText}>
                <Text
                  style={styles.agreementLink}
                  onPress={() => openLink('https://www.compassabroad.com.tr/kvkk-aydinlatma-metni/')}
                >
                  KVKK Aydınlatma Metni
                </Text>
                <Text style={styles.agreementLabel}>{"'ni okudum ve kabul ediyorum"}</Text>
              </Text>
            </View>
          </View>

          <View style={[styles.agreementItem, !studentData.termsConsent && styles.agreementItemUnchecked]}>
            <TouchableOpacity
              style={styles.checkboxTouchable}
              onPress={() => setStudentData({ ...studentData, termsConsent: !studentData.termsConsent })}
            >
              <View style={[styles.checkbox, studentData.termsConsent && styles.checkboxChecked]}>
                {studentData.termsConsent && <Check size={16} color={Colors.background} />}
              </View>
            </TouchableOpacity>
            <View style={styles.agreementContent}>
              <Text style={styles.agreementText}>
                <Text
                  style={styles.agreementLink}
                  onPress={() => openLink('https://www.compassabroad.com.tr/acik-riza-beyan-formu/')}
                >
                  Açık Rıza Beyanı
                </Text>
                <Text style={styles.agreementLabel}>{"'nı okudum ve kabul ediyorum"}</Text>
              </Text>
            </View>
          </View>
        </View>

        {!allConsentsGiven && (
          <View style={styles.warningBox}>
            <Shield size={18} color={Colors.error} />
            <Text style={styles.warningText}>
              Devam edebilmek için tüm sözleşmeleri onaylamanız gerekmektedir.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  const renderAmbassadorStep1 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Kişisel Bilgiler</Text>
      <Text style={styles.stepDescription}>Elçi hesabınızı oluşturmak için bilgilerinizi girin</Text>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
          <View style={styles.inputLabelRow}>
            <User size={16} color="#8B5CF6" />
            <Text style={styles.inputLabel}>Ad *</Text>
          </View>
          <TextInput
            style={styles.input}
            value={ambassadorData.firstName}
            onChangeText={(text) => setAmbassadorData({ ...ambassadorData, firstName: text })}
            placeholder="Adınız"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
        <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
          <View style={styles.inputLabelRow}>
            <User size={16} color="#8B5CF6" />
            <Text style={styles.inputLabel}>Soyad *</Text>
          </View>
          <TextInput
            style={styles.input}
            value={ambassadorData.lastName}
            onChangeText={(text) => setAmbassadorData({ ...ambassadorData, lastName: text })}
            placeholder="Soyadınız"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputLabelRow}>
          <Mail size={16} color="#8B5CF6" />
          <Text style={styles.inputLabel}>E-posta *</Text>
        </View>
        <TextInput
          style={[styles.input, !validateEmail(ambassadorData.email) && ambassadorData.email.length > 0 && styles.inputError]}
          value={ambassadorData.email}
          onChangeText={(text) => setAmbassadorData({ ...ambassadorData, email: text.toLowerCase() })}
          placeholder="ornek@email.com"
          placeholderTextColor={Colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputLabelRow}>
          <Phone size={16} color="#8B5CF6" />
          <Text style={styles.inputLabel}>Telefon *</Text>
        </View>
        <TextInput
          style={styles.input}
          value={ambassadorData.phone}
          onChangeText={(text) => setAmbassadorData({ ...ambassadorData, phone: formatPhone(text) })}
          placeholder="+90 5XX XXX XX XX"
          placeholderTextColor={Colors.textMuted}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputLabelRow}>
          <Calendar size={16} color="#8B5CF6" />
          <Text style={styles.inputLabel}>Doğum Tarihi</Text>
        </View>
        <TextInput
          style={styles.input}
          value={ambassadorData.birthDate}
          onChangeText={(text) => setAmbassadorData({ ...ambassadorData, birthDate: formatDate(text) })}
          placeholder="GG/AA/YYYY"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          maxLength={10}
        />
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputLabelRow}>
          <CreditCard size={16} color="#8B5CF6" />
          <Text style={styles.inputLabel}>TC Kimlik No *</Text>
        </View>
        <TextInput
          style={styles.input}
          value={ambassadorData.tcIdentity}
          onChangeText={(text) => setAmbassadorData({ ...ambassadorData, tcIdentity: text.replace(/[^0-9]/g, '').slice(0, 11) })}
          placeholder="XXXXXXXXXXX"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          maxLength={11}
        />
        <Text style={styles.inputHint}>{ambassadorData.tcIdentity.length}/11 karakter</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderAmbassadorStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Konum Bilgisi</Text>
      <Text style={styles.stepDescription}>Bulunduğunuz şehri seçin</Text>

      <View style={styles.inputContainer}>
        <View style={styles.inputLabelRow}>
          <MapPin size={16} color="#8B5CF6" />
          <Text style={styles.inputLabel}>Şehir *</Text>
        </View>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowCityPicker(!showCityPicker)}
        >
          <Text style={ambassadorData.city ? styles.pickerText : styles.pickerPlaceholder}>
            {ambassadorData.city || 'Şehir seçin'}
          </Text>
          <ChevronDown size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {showCityPicker && (
        <ScrollView style={styles.pickerList} nestedScrollEnabled>
          {TURKISH_CITIES.map((city) => (
            <TouchableOpacity
              key={city}
              style={[styles.pickerOption, ambassadorData.city === city && styles.pickerOptionSelected]}
              onPress={() => {
                setAmbassadorData({ ...ambassadorData, city });
                setShowCityPicker(false);
              }}
            >
              <Text style={[styles.pickerOptionText, ambassadorData.city === city && styles.pickerOptionTextSelected]}>
                {city}
              </Text>
              {ambassadorData.city === city && <Check size={16} color="#8B5CF6" />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderAmbassadorStep3 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Elçi Tipinizi Seçin</Text>
      <Text style={styles.stepDescription}>Size en uygun kategoriyi belirleyin</Text>

      <View style={styles.categoryContainer}>
        <TouchableOpacity
          style={[
            styles.categoryCard,
            ambassadorData.category === 'individual' && styles.categoryCardActiveAmbassador,
          ]}
          onPress={() => setAmbassadorData({ ...ambassadorData, category: 'individual', corporateType: null, companyName: '', taxNumber: '', taxOffice: '' })}
        >
          <User size={32} color={ambassadorData.category === 'individual' ? '#8B5CF6' : Colors.textSecondary} />
          <Text style={[styles.categoryTitle, ambassadorData.category === 'individual' && styles.categoryTitleActiveAmbassador]}>
            Bireysel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.categoryCard,
            ambassadorData.category === 'corporate' && styles.categoryCardActiveAmbassador,
          ]}
          onPress={() => setAmbassadorData({ ...ambassadorData, category: 'corporate', individualType: null })}
        >
          <Building2 size={32} color={ambassadorData.category === 'corporate' ? '#8B5CF6' : Colors.textSecondary} />
          <Text style={[styles.categoryTitle, ambassadorData.category === 'corporate' && styles.categoryTitleActiveAmbassador]}>
            Kurumsal
          </Text>
        </TouchableOpacity>
      </View>

      {ambassadorData.category === 'individual' && (
        <View style={styles.subTypeContainer}>
          <Text style={styles.subTypeTitle}>Mesleğiniz</Text>
          <View style={styles.subTypeGrid}>
            {[
              { id: 'student' as IndividualSubType, label: 'Öğrenci', icon: GraduationCap },
              { id: 'teacher' as IndividualSubType, label: 'Öğretmen', icon: School },
              { id: 'other' as IndividualSubType, label: 'Diğer', icon: User },
            ].map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.subTypeCard,
                  ambassadorData.individualType === type.id && styles.subTypeCardActiveAmbassador,
                ]}
                onPress={() => setAmbassadorData({ ...ambassadorData, individualType: type.id })}
              >
                <type.icon
                  size={24}
                  color={ambassadorData.individualType === type.id ? '#8B5CF6' : Colors.textSecondary}
                />
                <Text style={[
                  styles.subTypeLabel,
                  ambassadorData.individualType === type.id && styles.subTypeLabelActiveAmbassador,
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {ambassadorData.category === 'corporate' && (
        <View style={styles.subTypeContainer}>
          <Text style={styles.subTypeTitle}>Kurum Tipi</Text>
          <View style={styles.subTypeGrid}>
            {[
              { id: 'school' as CorporateSubType, label: 'Okul', icon: School },
              { id: 'agency' as CorporateSubType, label: 'Acente', icon: Briefcase },
              { id: 'other' as CorporateSubType, label: 'Diğer', icon: Building2 },
            ].map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.subTypeCard,
                  ambassadorData.corporateType === type.id && styles.subTypeCardActiveAmbassador,
                ]}
                onPress={() => setAmbassadorData({ ...ambassadorData, corporateType: type.id })}
              >
                <type.icon
                  size={24}
                  color={ambassadorData.corporateType === type.id ? '#8B5CF6' : Colors.textSecondary}
                />
                <Text style={[
                  styles.subTypeLabel,
                  ambassadorData.corporateType === type.id && styles.subTypeLabelActiveAmbassador,
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.corporateFields}>
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <Building2 size={16} color="#8B5CF6" />
                <Text style={styles.inputLabel}>Şirket Adı *</Text>
              </View>
              <TextInput
                style={styles.input}
                value={ambassadorData.companyName}
                onChangeText={(text) => setAmbassadorData({ ...ambassadorData, companyName: text })}
                placeholder="Şirket adını girin"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <CreditCard size={16} color="#8B5CF6" />
                <Text style={styles.inputLabel}>Vergi No *</Text>
              </View>
              <TextInput
                style={styles.input}
                value={ambassadorData.taxNumber}
                onChangeText={(text) => setAmbassadorData({ ...ambassadorData, taxNumber: text.replace(/[^0-9]/g, '').slice(0, 11) })}
                placeholder="Vergi numarasını girin"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                maxLength={11}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <MapPin size={16} color="#8B5CF6" />
                <Text style={styles.inputLabel}>Vergi Dairesi *</Text>
              </View>
              <TextInput
                style={styles.input}
                value={ambassadorData.taxOffice}
                onChangeText={(text) => setAmbassadorData({ ...ambassadorData, taxOffice: text })}
                placeholder="Vergi dairesini girin"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderAmbassadorStep4 = () => {
    const allConsentsGiven = ambassadorData.privacyConsent && ambassadorData.kvkkConsent && ambassadorData.termsConsent;
    const passwordsMatch = ambassadorData.password === ambassadorData.confirmPassword;
    const passwordValid = ambassadorData.password.length >= 6;

    return (
      <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Şifre ve Sözleşmeler</Text>
        <Text style={styles.stepDescription}>Hesabınızı güvence altına alın</Text>

        <View style={styles.inputContainer}>
          <View style={styles.inputLabelRow}>
            <Lock size={16} color="#8B5CF6" />
            <Text style={styles.inputLabel}>Şifre *</Text>
          </View>
          <TextInput
            style={[styles.input, !passwordValid && ambassadorData.password.length > 0 && styles.inputError]}
            value={ambassadorData.password}
            onChangeText={(text) => setAmbassadorData({ ...ambassadorData, password: text })}
            placeholder="En az 6 karakter"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
          />
          {!passwordValid && ambassadorData.password.length > 0 && (
            <Text style={styles.errorText}>Şifre en az 6 karakter olmalıdır</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputLabelRow}>
            <Lock size={16} color="#8B5CF6" />
            <Text style={styles.inputLabel}>Şifre Tekrar *</Text>
          </View>
          <TextInput
            style={[styles.input, !passwordsMatch && ambassadorData.confirmPassword.length > 0 && styles.inputError]}
            value={ambassadorData.confirmPassword}
            onChangeText={(text) => setAmbassadorData({ ...ambassadorData, confirmPassword: text })}
            placeholder="Şifrenizi tekrar girin"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
          />
          {!passwordsMatch && ambassadorData.confirmPassword.length > 0 && (
            <Text style={styles.errorText}>Şifreler eşleşmiyor</Text>
          )}
        </View>

        <View style={styles.agreementsList}>
          <View style={[styles.agreementItem, !ambassadorData.privacyConsent && styles.agreementItemUnchecked]}>
            <TouchableOpacity
              style={styles.checkboxTouchable}
              onPress={() => setAmbassadorData({ ...ambassadorData, privacyConsent: !ambassadorData.privacyConsent })}
            >
              <View style={[styles.checkbox, ambassadorData.privacyConsent && styles.checkboxCheckedAmbassador]}>
                {ambassadorData.privacyConsent && <Check size={16} color={Colors.background} />}
              </View>
            </TouchableOpacity>
            <View style={styles.agreementContent}>
              <Text style={styles.agreementText}>
                <Text
                  style={styles.agreementLinkAmbassador}
                  onPress={() => openLink('https://www.compassabroad.com.tr/gizlilik-politikasi/')}
                >
                  Gizlilik Politikası
                </Text>
                <Text style={styles.agreementLabel}>{"'nı okudum ve kabul ediyorum"}</Text>
              </Text>
            </View>
          </View>

          <View style={[styles.agreementItem, !ambassadorData.kvkkConsent && styles.agreementItemUnchecked]}>
            <TouchableOpacity
              style={styles.checkboxTouchable}
              onPress={() => setAmbassadorData({ ...ambassadorData, kvkkConsent: !ambassadorData.kvkkConsent })}
            >
              <View style={[styles.checkbox, ambassadorData.kvkkConsent && styles.checkboxCheckedAmbassador]}>
                {ambassadorData.kvkkConsent && <Check size={16} color={Colors.background} />}
              </View>
            </TouchableOpacity>
            <View style={styles.agreementContent}>
              <Text style={styles.agreementText}>
                <Text
                  style={styles.agreementLinkAmbassador}
                  onPress={() => openLink('https://www.compassabroad.com.tr/kvkk-aydinlatma-metni/')}
                >
                  KVKK Aydınlatma Metni
                </Text>
                <Text style={styles.agreementLabel}>{"'ni okudum ve kabul ediyorum"}</Text>
              </Text>
            </View>
          </View>

          <View style={[styles.agreementItem, !ambassadorData.termsConsent && styles.agreementItemUnchecked]}>
            <TouchableOpacity
              style={styles.checkboxTouchable}
              onPress={() => setAmbassadorData({ ...ambassadorData, termsConsent: !ambassadorData.termsConsent })}
            >
              <View style={[styles.checkbox, ambassadorData.termsConsent && styles.checkboxCheckedAmbassador]}>
                {ambassadorData.termsConsent && <Check size={16} color={Colors.background} />}
              </View>
            </TouchableOpacity>
            <View style={styles.agreementContent}>
              <Text style={styles.agreementText}>
                <Text
                  style={styles.agreementLinkAmbassador}
                  onPress={() => openLink('https://www.compassabroad.com.tr/acik-riza-beyan-formu/')}
                >
                  Açık Rıza Beyanı
                </Text>
                <Text style={styles.agreementLabel}>{"'nı okudum ve kabul ediyorum"}</Text>
              </Text>
            </View>
          </View>
        </View>

        {!allConsentsGiven && (
          <View style={styles.warningBox}>
            <Shield size={18} color={Colors.error} />
            <Text style={styles.warningText}>
              Devam edebilmek için tüm sözleşmeleri onaylamanız gerekmektedir.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  const getStudentSteps = () => ['Kişisel', 'Program', 'Şifre'];
  const getAmbassadorSteps = () => ['Kişisel', 'Konum', 'Elçi Tipi', 'Sözleşme'];

  const renderContent = () => {
    if (currentStep === 0) {
      return renderTypeSelection();
    }

    if (registrationType === 'student') {
      switch (currentStep) {
        case 1:
          return renderStudentStep1();
        case 2:
          return renderStudentStep2();
        case 3:
          return renderStudentStep3();
        default:
          return null;
      }
    }

    if (registrationType === 'ambassador') {
      switch (currentStep) {
        case 1:
          return renderAmbassadorStep1();
        case 2:
          return renderAmbassadorStep2();
        case 3:
          return renderAmbassadorStep3();
        case 4:
          return renderAmbassadorStep4();
        default:
          return null;
      }
    }

    return null;
  };

  const canProceed = () => {
    if (registrationType === 'student') {
      return canProceedStudent();
    }
    if (registrationType === 'ambassador') {
      return canProceedAmbassador();
    }
    return false;
  };

  const getMaxSteps = () => {
    if (registrationType === 'student') return 3;
    if (registrationType === 'ambassador') return 4;
    return 0;
  };

  const getStepLabels = () => {
    if (registrationType === 'student') return getStudentSteps();
    if (registrationType === 'ambassador') return getAmbassadorSteps();
    return [];
  };

  const gradientColors = registrationType === 'ambassador'
    ? ['#4C1D95', '#6D28D9', Colors.background]
    : [Colors.gradient.start, Colors.gradient.middle, Colors.background];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        style={[styles.gradient, { paddingTop: insets.top + 20 }]}
      >
        {currentStep > 0 && (
          <View style={styles.progressContainer}>
            {getStepLabels().map((label, index) => (
              <View key={index} style={styles.progressItem}>
                <View
                  style={[
                    styles.progressDot,
                    currentStep >= index + 1 && (registrationType === 'ambassador' ? styles.progressDotActiveAmbassador : styles.progressDotActive),
                    currentStep === index + 1 && (registrationType === 'ambassador' ? styles.progressDotCurrentAmbassador : styles.progressDotCurrent),
                  ]}
                >
                  {currentStep > index + 1 ? (
                    <Check size={10} color={Colors.background} />
                  ) : (
                    <Text style={[
                      styles.progressNumber,
                      currentStep >= index + 1 && styles.progressNumberActive,
                    ]}>
                      {index + 1}
                    </Text>
                  )}
                </View>
                {index < getStepLabels().length - 1 && (
                  <View
                    style={[
                      styles.progressLine,
                      currentStep > index + 1 && (registrationType === 'ambassador' ? styles.progressLineActiveAmbassador : styles.progressLineActive),
                    ]}
                  />
                )}
              </View>
            ))}
          </View>
        )}

        <Animated.View
          style={[
            styles.contentContainer,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          {renderContent()}
        </Animated.View>

        {currentStep > 0 && (
          <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <ChevronLeft size={20} color={Colors.text} />
                <Text style={styles.backButtonText}>Geri</Text>
              </TouchableOpacity>

              {currentStep < getMaxSteps() ? (
                <TouchableOpacity
                  style={[
                    registrationType === 'ambassador' ? styles.nextButtonAmbassador : styles.nextButton,
                    !canProceed() && styles.nextButtonDisabled
                  ]}
                  onPress={handleNext}
                  disabled={!canProceed()}
                >
                  <Text style={styles.nextButtonText}>İleri</Text>
                  <ChevronRight size={20} color={Colors.background} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    registrationType === 'ambassador' ? styles.nextButtonAmbassador : styles.nextButton,
                    !canProceed() && styles.nextButtonDisabled
                  ]}
                  onPress={registrationType === 'student' ? handleStudentRegister : handleAmbassadorRegister}
                  disabled={!canProceed()}
                >
                  <Text style={styles.nextButtonText}>Kayıt Ol</Text>
                  <Check size={20} color={Colors.background} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </LinearGradient>

      <Modal visible={showSuccessModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <CheckCircle size={64} color={Colors.success} />
            </View>
            <Text style={styles.modalTitle}>Başvurunuz Alınmıştır!</Text>
            <Text style={styles.modalDescription}>
              Başvurunuz incelemeye alınmıştır. En kısa zamanda sizinle iletişime geçilecektir.
            </Text>
            <Text style={styles.modalNote}>
              Onay sonrası giriş yapabileceksiniz.
            </Text>
            <View style={styles.modalStatusBadge}>
              <Clock size={18} color={Colors.warning} />
              <Text style={styles.modalStatusText}>Onay Bekleniyor</Text>
            </View>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowSuccessModal(false);
                router.replace('/auth/pending-approval');
              }}
            >
              <Text style={styles.modalButtonText}>Tamam</Text>
            </TouchableOpacity>
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  progressDotActiveAmbassador: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  progressDotCurrent: {
    borderWidth: 3,
    borderColor: Colors.secondaryLight,
  },
  progressDotCurrentAmbassador: {
    borderWidth: 3,
    borderColor: '#A78BFA',
  },
  progressNumber: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  progressNumberActive: {
    color: Colors.background,
  },
  progressLine: {
    width: 24,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 2,
  },
  progressLineActive: {
    backgroundColor: Colors.secondary,
  },
  progressLineActiveAmbassador: {
    backgroundColor: '#8B5CF6',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    flex: 1,
  },
  welcomeIcon: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  typeSelectionContainer: {
    gap: 16,
  },
  typeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: Colors.secondary + '40',
    position: 'relative',
  },
  ambassadorCard: {
    borderColor: '#8B5CF6' + '40',
  },
  typeIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  typeTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  typeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    paddingRight: 32,
  },
  typeArrow: {
    position: 'absolute',
    right: 20,
    top: '50%',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 24,
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
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 6,
  },
  inputHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
    textAlign: 'right',
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
  categoryContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 12,
  },
  categoryCardActiveAmbassador: {
    borderColor: '#8B5CF6',
    backgroundColor: '#8B5CF6' + '10',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  categoryTitleActiveAmbassador: {
    color: '#8B5CF6',
  },
  subTypeContainer: {
    marginTop: 8,
  },
  subTypeTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  subTypeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  subTypeCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  subTypeCardActiveAmbassador: {
    borderColor: '#8B5CF6',
    backgroundColor: '#8B5CF6' + '10',
  },
  subTypeLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  subTypeLabelActiveAmbassador: {
    color: '#8B5CF6',
  },
  corporateFields: {
    marginTop: 20,
  },
  agreementsList: {
    gap: 12,
    marginBottom: 16,
    marginTop: 8,
  },
  agreementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  agreementItemUnchecked: {
    borderColor: Colors.error + '50',
  },
  checkboxTouchable: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkboxCheckedAmbassador: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  agreementContent: {
    flex: 1,
  },
  agreementText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  agreementLabel: {
    color: Colors.text,
  },
  agreementLink: {
    fontWeight: '600' as const,
    color: Colors.secondary,
    textDecorationLine: 'underline',
  },
  agreementLinkAmbassador: {
    fontWeight: '600' as const,
    color: '#8B5CF6',
    textDecorationLine: 'underline',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.error + '15',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.error,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 12,
    minWidth: 80,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  nextButtonAmbassador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  modalIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  modalNote: {
    fontSize: 14,
    color: Colors.info,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500' as const,
  },
  modalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 24,
  },
  modalStatusText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
  modalButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
