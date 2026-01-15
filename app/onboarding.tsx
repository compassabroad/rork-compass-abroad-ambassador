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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';

type AmbassadorCategory = 'individual' | 'corporate';
type IndividualType = 'student' | 'teacher' | 'other';
type CorporateType = 'school' | 'agency' | 'other';

interface OnboardingData {
  category: AmbassadorCategory | null;
  individualType: IndividualType | null;
  corporateType: CorporateType | null;
  identityNumber: string;
  taxNumber: string;
  kvkkConsent: boolean;
}

const STEPS = [
  { id: 1, title: 'Hoş Geldiniz' },
  { id: 2, title: 'Elçi Tipi' },
  { id: 3, title: 'Profil Bilgileri' },
  { id: 4, title: 'KVKK Onayı' },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [slideAnim] = useState(() => new Animated.Value(0));
  const [data, setData] = useState<OnboardingData>({
    category: null,
    individualType: null,
    corporateType: null,
    identityNumber: '',
    taxNumber: '',
    kvkkConsent: false,
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
    if (currentStep < 4) {
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
    router.replace('/(tabs)');
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        if (!data.category) return false;
        if (data.category === 'individual' && !data.individualType) return false;
        if (data.category === 'corporate' && !data.corporateType) return false;
        return true;
      case 3:
        if (data.category === 'individual') {
          return data.identityNumber.length === 11;
        }
        return data.taxNumber.length >= 10;
      case 4:
        return data.kvkkConsent;
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
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Elçi Tipinizi Seçin</Text>
      <Text style={styles.stepDescription}>
        Size en uygun kategoriyi belirleyin
      </Text>

      <View style={styles.categoryContainer}>
        <TouchableOpacity
          style={[
            styles.categoryCard,
            data.category === 'individual' && styles.categoryCardActive,
          ]}
          onPress={() => setData({ ...data, category: 'individual', corporateType: null })}
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
              { id: 'student' as IndividualType, label: 'Öğrenci', icon: GraduationCap },
              { id: 'teacher' as IndividualType, label: 'Öğretmen', icon: School },
              { id: 'other' as IndividualType, label: 'Diğer', icon: User },
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
              { id: 'school' as CorporateType, label: 'Okul', icon: School },
              { id: 'agency' as CorporateType, label: 'Ajans', icon: Briefcase },
              { id: 'other' as CorporateType, label: 'Diğer', icon: Building2 },
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
        </View>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Profil Bilgileri</Text>
      <Text style={styles.stepDescription}>
        {data.category === 'individual'
          ? 'TC Kimlik numaranızı girin'
          : 'Vergi numaranızı girin'}
      </Text>

      {data.category === 'individual' ? (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>TC Kimlik Numarası</Text>
          <TextInput
            style={styles.input}
            value={data.identityNumber}
            onChangeText={(text) => setData({ ...data, identityNumber: text.replace(/[^0-9]/g, '').slice(0, 11) })}
            placeholder="XXXXXXXXXXX"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            maxLength={11}
          />
          <Text style={styles.inputHint}>
            {data.identityNumber.length}/11 karakter
          </Text>
        </View>
      ) : (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Vergi Numarası</Text>
          <TextInput
            style={styles.input}
            value={data.taxNumber}
            onChangeText={(text) => setData({ ...data, taxNumber: text.replace(/[^0-9]/g, '').slice(0, 11) })}
            placeholder="XXXXXXXXXX"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            maxLength={11}
          />
          <Text style={styles.inputHint}>
            {data.taxNumber.length}/10+ karakter
          </Text>
        </View>
      )}

      <View style={styles.infoBox}>
        <Shield size={20} color={Colors.info} />
        <Text style={styles.infoText}>
          Bilgileriniz KVKK kapsamında güvenle saklanmaktadır.
        </Text>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>KVKK Onayı</Text>
      <Text style={styles.stepDescription}>
        Kişisel verilerinizin işlenmesi için onayınız gerekmektedir
      </Text>

      <ScrollView style={styles.kvkkScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.kvkkContent}>
          <Text style={styles.kvkkText}>
            6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında, kişisel verilerinizin
            Compass Abroad tarafından işlenmesine ilişkin aydınlatma metnini okudum ve anladım.
          </Text>
          <Text style={styles.kvkkText}>
            • Ad, soyad, e-posta ve telefon bilgilerim iletişim amacıyla,{'\n'}
            • TC Kimlik / Vergi numarası bilgilerim yasal yükümlülükler için,{'\n'}
            • IBAN bilgilerim ödeme işlemleri için,{'\n'}
            • Performans verilerim komisyon hesaplamaları için işlenecektir.
          </Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.kvkkCheckbox}
        onPress={() => setData({ ...data, kvkkConsent: !data.kvkkConsent })}
      >
        <View style={[styles.checkbox, data.kvkkConsent && styles.checkboxChecked]}>
          {data.kvkkConsent && <Check size={16} color={Colors.background} />}
        </View>
        <Text style={styles.kvkkLabel}>
          KVKK Aydınlatma Metnini okudum ve kabul ediyorum.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.privacyLink}
        onPress={() => Linking.openURL('https://compassabroad.com/privacy')}
      >
        <FileText size={16} color={Colors.secondary} />
        <Text style={styles.privacyLinkText}>Gizlilik Politikasını Görüntüle</Text>
      </TouchableOpacity>
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
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
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
                  <Check size={12} color={Colors.background} />
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
            {currentStep > 1 ? (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <ChevronLeft size={20} color={Colors.text} />
                <Text style={styles.backButtonText}>Geri</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.backButton} />
            )}

            {currentStep < 4 ? (
              <TouchableOpacity
                style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
                onPress={handleNext}
                disabled={!canProceed()}
              >
                <Text style={styles.nextButtonText}>İleri</Text>
                <ChevronRight size={20} color={Colors.background} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.finishButton, !canProceed() && styles.nextButtonDisabled]}
                onPress={handleFinish}
                disabled={!canProceed()}
              >
                <Text style={styles.finishButtonText}>Tamamla</Text>
                <Check size={20} color={Colors.background} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
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
    paddingHorizontal: 40,
    marginBottom: 30,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  progressNumberActive: {
    color: Colors.background,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
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
    fontWeight: '700',
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
    fontWeight: '500',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 24,
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
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  subTypeLabelActive: {
    color: Colors.secondary,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    letterSpacing: 2,
  },
  inputHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: 'right',
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
  kvkkScroll: {
    maxHeight: 200,
    marginBottom: 20,
  },
  kvkkContent: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kvkkText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  kvkkCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
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
  kvkkLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  privacyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  privacyLinkText: {
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '500',
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
    fontWeight: '500',
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
    fontWeight: '600',
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
    fontWeight: '600',
    color: Colors.background,
  },
});
