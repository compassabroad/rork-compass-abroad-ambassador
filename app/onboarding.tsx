import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
  FileText,
  MapPin,
  Calendar,
  Phone,
  Mail,
  CreditCard,
  ChevronDown,
  CheckCircle,
  Clock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import { TURKISH_CITIES, AmbassadorCategory, IndividualSubType, CorporateSubType } from '@/types';

interface OnboardingData {
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
  kvkkConsent: boolean;
  privacyConsent: boolean;
  termsConsent: boolean;
}

const STEPS = [
  { id: 1, title: 'Hoş Geldiniz' },
  { id: 2, title: 'Kişisel Bilgiler' },
  { id: 3, title: 'Konum' },
  { id: 4, title: 'Elçi Tipi' },
  { id: 5, title: 'Sözleşmeler' },
  { id: 6, title: 'Tamamlandı' },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [slideAnim] = useState(() => new Animated.Value(0));
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [data, setData] = useState<OnboardingData>({
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
    kvkkConsent: false,
    privacyConsent: false,
    termsConsent: false,
  });

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

  const handleNext = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (currentStep < 6) {
      animateSlide('next');
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (currentStep > 1) {
      animateSlide('back');
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    console.log('Onboarding completed:', data);
    router.replace('/auth/pending-approval');
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

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return (
          data.firstName.trim().length >= 2 &&
          data.lastName.trim().length >= 2 &&
          validateEmail(data.email) &&
          data.phone.length >= 13 &&
          data.tcIdentity.length === 11
        );
      case 3:
        return data.city.length > 0;
      case 4:
        if (!data.category) return false;
        if (data.category === 'individual' && !data.individualType) return false;
        if (data.category === 'corporate') {
          if (!data.corporateType) return false;
          if (!data.companyName.trim() || !data.taxNumber.trim() || !data.taxOffice.trim()) return false;
        }
        return true;
      case 5:
        return data.kvkkConsent && data.privacyConsent && data.termsConsent;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.welcomeIcon}>
        <Compass size={80} color={Colors.secondary} />
      </View>
      <Text style={styles.welcomeTitle}>Compass Abroad Ambassador</Text>
      <Text style={styles.welcomeSubtitle}>
        Yurtdışı eğitim danışmanlığında yeni bir yolculuğa hoş geldiniz!
      </Text>
      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <View style={[styles.featureIcon, { backgroundColor: Colors.success + '20' }]}>
            <Users size={20} color={Colors.success} />
          </View>
          <Text style={styles.featureText}>Öğrenci referanslarından komisyon kazanın</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={[styles.featureIcon, { backgroundColor: Colors.info + '20' }]}>
            <Building2 size={20} color={Colors.info} />
          </View>
          <Text style={styles.featureText}>Kendi ağınızı oluşturun ve büyütün</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={[styles.featureIcon, { backgroundColor: Colors.secondary + '20' }]}>
            <GraduationCap size={20} color={Colors.secondary} />
          </View>
          <Text style={styles.featureText}>11 farklı program seçeneği ile çalışın</Text>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
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
            value={data.firstName}
            onChangeText={(text) => setData({ ...data, firstName: text })}
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
            value={data.lastName}
            onChangeText={(text) => setData({ ...data, lastName: text })}
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
          style={[styles.input, !validateEmail(data.email) && data.email.length > 0 && styles.inputError]}
          value={data.email}
          onChangeText={(text) => setData({ ...data, email: text.toLowerCase() })}
          placeholder="ornek@email.com"
          placeholderTextColor={Colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {!validateEmail(data.email) && data.email.length > 0 && (
          <Text style={styles.errorText}>Geçerli bir e-posta adresi girin</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputLabelRow}>
          <Phone size={16} color={Colors.secondary} />
          <Text style={styles.inputLabel}>Telefon *</Text>
        </View>
        <TextInput
          style={styles.input}
          value={data.phone}
          onChangeText={(text) => setData({ ...data, phone: formatPhone(text) })}
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
          value={data.birthDate}
          onChangeText={(text) => setData({ ...data, birthDate: formatDate(text) })}
          placeholder="GG/AA/YYYY"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          maxLength={10}
        />
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputLabelRow}>
          <CreditCard size={16} color={Colors.secondary} />
          <Text style={styles.inputLabel}>TC Kimlik No *</Text>
        </View>
        <TextInput
          style={styles.input}
          value={data.tcIdentity}
          onChangeText={(text) => setData({ ...data, tcIdentity: text.replace(/[^0-9]/g, '').slice(0, 11) })}
          placeholder="XXXXXXXXXXX"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          maxLength={11}
        />
        <Text style={styles.inputHint}>{data.tcIdentity.length}/11 karakter</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Konum Bilgisi</Text>
      <Text style={styles.stepDescription}>Bulunduğunuz şehri seçin</Text>

      <View style={styles.inputContainer}>
        <View style={styles.inputLabelRow}>
          <MapPin size={16} color={Colors.secondary} />
          <Text style={styles.inputLabel}>Şehir *</Text>
        </View>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowCityPicker(!showCityPicker)}
        >
          <Text style={data.city ? styles.pickerText : styles.pickerPlaceholder}>
            {data.city || 'Şehir seçin'}
          </Text>
          <ChevronDown size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {showCityPicker && (
        <ScrollView style={styles.pickerList} nestedScrollEnabled>
          {TURKISH_CITIES.map((city) => (
            <TouchableOpacity
              key={city}
              style={[styles.pickerOption, data.city === city && styles.pickerOptionSelected]}
              onPress={() => {
                setData({ ...data, city });
                setShowCityPicker(false);
              }}
            >
              <Text style={[styles.pickerOptionText, data.city === city && styles.pickerOptionTextSelected]}>
                {city}
              </Text>
              {data.city === city && <Check size={16} color={Colors.secondary} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderStep4 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Elçi Tipinizi Seçin</Text>
      <Text style={styles.stepDescription}>Size en uygun kategoriyi belirleyin</Text>

      <View style={styles.categoryContainer}>
        <TouchableOpacity
          style={[
            styles.categoryCard,
            data.category === 'individual' && styles.categoryCardActive,
          ]}
          onPress={() => setData({ ...data, category: 'individual', corporateType: null, companyName: '', taxNumber: '', taxOffice: '' })}
        >
          <User size={32} color={data.category === 'individual' ? Colors.secondary : Colors.textSecondary} />
          <Text style={[styles.categoryTitle, data.category === 'individual' && styles.categoryTitleActive]}>
            Bireysel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.categoryCard,
            data.category === 'corporate' && styles.categoryCardActive,
          ]}
          onPress={() => setData({ ...data, category: 'corporate', individualType: null })}
        >
          <Building2 size={32} color={data.category === 'corporate' ? Colors.secondary : Colors.textSecondary} />
          <Text style={[styles.categoryTitle, data.category === 'corporate' && styles.categoryTitleActive]}>
            Kurumsal
          </Text>
        </TouchableOpacity>
      </View>

      {data.category === 'individual' && (
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
                  data.individualType === type.id && styles.subTypeCardActive,
                ]}
                onPress={() => setData({ ...data, individualType: type.id })}
              >
                <type.icon
                  size={24}
                  color={data.individualType === type.id ? Colors.secondary : Colors.textSecondary}
                />
                <Text style={[
                  styles.subTypeLabel,
                  data.individualType === type.id && styles.subTypeLabelActive,
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {data.category === 'corporate' && (
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
                  data.corporateType === type.id && styles.subTypeCardActive,
                ]}
                onPress={() => setData({ ...data, corporateType: type.id })}
              >
                <type.icon
                  size={24}
                  color={data.corporateType === type.id ? Colors.secondary : Colors.textSecondary}
                />
                <Text style={[
                  styles.subTypeLabel,
                  data.corporateType === type.id && styles.subTypeLabelActive,
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.corporateFields}>
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <Building2 size={16} color={Colors.secondary} />
                <Text style={styles.inputLabel}>Şirket Adı *</Text>
              </View>
              <TextInput
                style={styles.input}
                value={data.companyName}
                onChangeText={(text) => setData({ ...data, companyName: text })}
                placeholder="Şirket adını girin"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <CreditCard size={16} color={Colors.secondary} />
                <Text style={styles.inputLabel}>Vergi No *</Text>
              </View>
              <TextInput
                style={styles.input}
                value={data.taxNumber}
                onChangeText={(text) => setData({ ...data, taxNumber: text.replace(/[^0-9]/g, '').slice(0, 11) })}
                placeholder="Vergi numarasını girin"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                maxLength={11}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <MapPin size={16} color={Colors.secondary} />
                <Text style={styles.inputLabel}>Vergi Dairesi *</Text>
              </View>
              <TextInput
                style={styles.input}
                value={data.taxOffice}
                onChangeText={(text) => setData({ ...data, taxOffice: text })}
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

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Sözleşmeler</Text>
      <Text style={styles.stepDescription}>
        Devam etmek için aşağıdaki sözleşmeleri onaylamanız gerekmektedir
      </Text>

      <View style={styles.agreementsList}>
        <TouchableOpacity
          style={styles.agreementItem}
          onPress={() => setData({ ...data, kvkkConsent: !data.kvkkConsent })}
        >
          <View style={[styles.checkbox, data.kvkkConsent && styles.checkboxChecked]}>
            {data.kvkkConsent && <Check size={16} color={Colors.background} />}
          </View>
          <View style={styles.agreementContent}>
            <Text style={styles.agreementLabel}>KVKK Aydınlatma Metni</Text>
            <Text style={styles.agreementDescription}>
              Kişisel verilerinizin işlenmesine ilişkin aydınlatma metni
            </Text>
          </View>
          <TouchableOpacity
            style={styles.agreementLink}
            onPress={() => Linking.openURL('https://compassabroad.com/kvkk')}
          >
            <FileText size={18} color={Colors.secondary} />
          </TouchableOpacity>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.agreementItem}
          onPress={() => setData({ ...data, privacyConsent: !data.privacyConsent })}
        >
          <View style={[styles.checkbox, data.privacyConsent && styles.checkboxChecked]}>
            {data.privacyConsent && <Check size={16} color={Colors.background} />}
          </View>
          <View style={styles.agreementContent}>
            <Text style={styles.agreementLabel}>Gizlilik Politikası</Text>
            <Text style={styles.agreementDescription}>
              Verilerinizin nasıl korunduğuna dair bilgiler
            </Text>
          </View>
          <TouchableOpacity
            style={styles.agreementLink}
            onPress={() => Linking.openURL('https://compassabroad.com/privacy')}
          >
            <FileText size={18} color={Colors.secondary} />
          </TouchableOpacity>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.agreementItem}
          onPress={() => setData({ ...data, termsConsent: !data.termsConsent })}
        >
          <View style={[styles.checkbox, data.termsConsent && styles.checkboxChecked]}>
            {data.termsConsent && <Check size={16} color={Colors.background} />}
          </View>
          <View style={styles.agreementContent}>
            <Text style={styles.agreementLabel}>Kullanım Şartları</Text>
            <Text style={styles.agreementDescription}>
              Platform kullanım koşulları ve kurallar
            </Text>
          </View>
          <TouchableOpacity
            style={styles.agreementLink}
            onPress={() => Linking.openURL('https://compassabroad.com/terms')}
          >
            <FileText size={18} color={Colors.secondary} />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Shield size={20} color={Colors.info} />
        <Text style={styles.infoText}>
          Bilgileriniz KVKK kapsamında güvenle saklanmaktadır ve üçüncü taraflarla paylaşılmamaktadır.
        </Text>
      </View>
    </View>
  );

  const renderStep6 = () => (
    <View style={styles.stepContent}>
      <View style={styles.completedIcon}>
        <View style={styles.completedIconCircle}>
          <CheckCircle size={64} color={Colors.success} />
        </View>
      </View>
      <Text style={styles.completedTitle}>Başvurunuz Alındı!</Text>
      <Text style={styles.completedSubtitle}>
        Hesabınız onay için inceleniyor. Onaylandığında bilgilendirileceksiniz.
      </Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Ad Soyad</Text>
          <Text style={styles.summaryValue}>{data.firstName} {data.lastName}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>E-posta</Text>
          <Text style={styles.summaryValue}>{data.email}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Şehir</Text>
          <Text style={styles.summaryValue}>{data.city}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Elçi Tipi</Text>
          <Text style={styles.summaryValue}>
            {data.category === 'individual' ? 'Bireysel' : 'Kurumsal'}
            {data.individualType && ` (${data.individualType === 'student' ? 'Öğrenci' : data.individualType === 'teacher' ? 'Öğretmen' : 'Diğer'})`}
            {data.corporateType && ` (${data.corporateType === 'school' ? 'Okul' : data.corporateType === 'agency' ? 'Acente' : 'Diğer'})`}
          </Text>
        </View>
      </View>

      <View style={styles.statusBadge}>
        <Clock size={18} color={Colors.warning} />
        <Text style={styles.statusText}>Onay Bekleniyor</Text>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={[Colors.gradient.start, Colors.gradient.middle, Colors.background]}
        style={[styles.gradient, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.progressContainer}>
          {STEPS.map((step, index) => (
            <View key={step.id} style={styles.progressItem}>
              <View
                style={[
                  styles.progressDot,
                  currentStep >= step.id && styles.progressDotActive,
                  currentStep === step.id && styles.progressDotCurrent,
                ]}
              >
                {currentStep > step.id ? (
                  <Check size={10} color={Colors.background} />
                ) : (
                  <Text style={[
                    styles.progressNumber,
                    currentStep >= step.id && styles.progressNumberActive,
                  ]}>
                    {step.id}
                  </Text>
                )}
              </View>
              {index < STEPS.length - 1 && (
                <View
                  style={[
                    styles.progressLine,
                    currentStep > step.id && styles.progressLineActive,
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        <Animated.View
          style={[
            styles.contentContainer,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          {renderStepContent()}
        </Animated.View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.buttonRow}>
            {currentStep > 1 && currentStep < 6 ? (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <ChevronLeft size={20} color={Colors.text} />
                <Text style={styles.backButtonText}>Geri</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.backButton} />
            )}

            {currentStep < 5 ? (
              <TouchableOpacity
                style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
                onPress={handleNext}
                disabled={!canProceed()}
              >
                <Text style={styles.nextButtonText}>İleri</Text>
                <ChevronRight size={20} color={Colors.background} />
              </TouchableOpacity>
            ) : currentStep === 5 ? (
              <TouchableOpacity
                style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
                onPress={handleNext}
                disabled={!canProceed()}
              >
                <Text style={styles.nextButtonText}>Başvuruyu Tamamla</Text>
                <Check size={20} color={Colors.background} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.finishButton}
                onPress={handleFinish}
              >
                <Text style={styles.finishButtonText}>Tamam</Text>
                <Check size={20} color={Colors.background} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
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
  progressDotCurrent: {
    borderWidth: 3,
    borderColor: Colors.secondaryLight,
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
  featureList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
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
    maxHeight: 300,
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
  categoryCardActive: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary + '10',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  categoryTitleActive: {
    color: Colors.secondary,
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
  subTypeCardActive: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary + '10',
  },
  subTypeLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  subTypeLabelActive: {
    color: Colors.secondary,
  },
  corporateFields: {
    marginTop: 20,
  },
  agreementsList: {
    gap: 16,
    marginBottom: 24,
  },
  agreementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  checkboxChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  agreementContent: {
    flex: 1,
  },
  agreementLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  agreementDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  agreementLink: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.info + '15',
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.info,
    lineHeight: 20,
  },
  completedIcon: {
    alignItems: 'center',
    marginBottom: 24,
  },
  completedIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  completedSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.warning + '20',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.warning,
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
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.background,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.background,
  },
});
