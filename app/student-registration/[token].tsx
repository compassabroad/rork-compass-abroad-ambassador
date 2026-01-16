import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, Eye, EyeOff, Shield, FileText, Lock, User, Mail, Phone, BookOpen, Globe } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { PROGRAMS } from '@/mocks/data';

const KVKK_LINKS = {
  privacy: 'https://www.compassabroad.com.tr/gizlilik-politikasi/',
  kvkk: 'https://www.compassabroad.com.tr/kvkk-aydinlatma-metni/',
  consent: 'https://www.compassabroad.com.tr/acik-riza-beyan-formu/',
};

export default function StudentRegistrationScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentData, setStudentData] = useState<{
    name: string;
    email: string;
    phone: string;
    program: string;
    country: string;
  } | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [kvkkConsent, setKvkkConsent] = useState(false);
  const [consentConsent, setConsentConsent] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    loadStudentData();
  }, [token]);

  const loadStudentData = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setStudentData({
      name: 'Demo Öğrenci',
      email: 'demo@email.com',
      phone: '+90 532 123 4567',
      program: 'bachelor',
      country: 'USA',
    });
    setLoading(false);
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Hata', 'Link açılamadı');
    });
  };

  const validateForm = () => {
    if (!password) {
      Alert.alert('Hata', 'Lütfen şifrenizi belirleyin');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return false;
    }
    if (!privacyConsent || !kvkkConsent || !consentConsent) {
      Alert.alert('Hata', 'Lütfen tüm yasal metinleri onaylayın');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('Student registration completed:', {
      token,
      password: '***',
      privacyConsent,
      kvkkConsent,
      consentConsent,
    });

    setSubmitting(false);
    setCompleted(true);
  };

  const programName = studentData?.program 
    ? PROGRAMS.find(p => p.id === studentData.program)?.name || studentData.program
    : '';

  const allConsentsChecked = privacyConsent && kvkkConsent && consentConsent;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.secondary} />
        <Text style={styles.loadingText}>Davet bilgileri yükleniyor...</Text>
      </View>
    );
  }

  if (!studentData) {
    return (
      <View style={styles.errorContainer}>
        <Shield size={64} color={Colors.error} />
        <Text style={styles.errorTitle}>Geçersiz Davet</Text>
        <Text style={styles.errorText}>
          Bu davet linki geçersiz veya süresi dolmuş olabilir. 
          Lütfen size gönderilen e-postadaki linki kontrol edin.
        </Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => router.replace('/login')}>
          <Text style={styles.errorButtonText}>Giriş Sayfasına Git</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (completed) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIconContainer}>
          <CheckCircle size={64} color={Colors.success} />
        </View>
        <Text style={styles.successTitle}>Kayıt Tamamlandı!</Text>
        <Text style={styles.successText}>
          Hesabınız başarıyla oluşturuldu. Artık Compass Abroad uygulamasına giriş yapabilirsiniz.
        </Text>
        <TouchableOpacity style={styles.successButton} onPress={() => router.replace('/login')}>
          <Text style={styles.successButtonText}>Giriş Yap</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Shield size={40} color={Colors.secondary} />
          </View>
          <Text style={styles.title}>Compass Abroad</Text>
          <Text style={styles.subtitle}>Hesabınızı Tamamlayın</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Davet Bilgileriniz</Text>
          
          <View style={styles.infoRow}>
            <User size={18} color={Colors.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Ad Soyad</Text>
              <Text style={styles.infoValue}>{studentData.name}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Mail size={18} color={Colors.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>E-posta</Text>
              <Text style={styles.infoValue}>{studentData.email}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Phone size={18} color={Colors.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Telefon</Text>
              <Text style={styles.infoValue}>{studentData.phone}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <BookOpen size={18} color={Colors.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>İlgilendiği Program</Text>
              <Text style={styles.infoValue}>{programName}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Globe size={18} color={Colors.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Hedef Ülke</Text>
              <Text style={styles.infoValue}>{studentData.country}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={20} color={Colors.secondary} />
            <Text style={styles.sectionTitle}>Şifre Belirleyin</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Şifre</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="En az 6 karakter"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color={Colors.textMuted} />
                ) : (
                  <Eye size={20} color={Colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Şifre Tekrar</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Şifrenizi tekrar girin"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={Colors.textMuted} />
                ) : (
                  <Eye size={20} color={Colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color={Colors.secondary} />
            <Text style={styles.sectionTitle}>Yasal Onaylar</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Hesabınızı oluşturmak için aşağıdaki metinleri okumanız ve onaylamanız gerekmektedir.
          </Text>

          <TouchableOpacity 
            style={styles.consentItem}
            onPress={() => setPrivacyConsent(!privacyConsent)}
          >
            <View style={[styles.checkbox, privacyConsent && styles.checkboxChecked]}>
              {privacyConsent && <CheckCircle size={16} color={Colors.primaryDark} />}
            </View>
            <View style={styles.consentContent}>
              <Text style={styles.consentText}>
                <Text 
                  style={styles.consentLink}
                  onPress={() => handleOpenLink(KVKK_LINKS.privacy)}
                >
                  Gizlilik Politikası
                </Text>
                {" "}metnini okudum ve kabul ediyorum.
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.consentItem}
            onPress={() => setKvkkConsent(!kvkkConsent)}
          >
            <View style={[styles.checkbox, kvkkConsent && styles.checkboxChecked]}>
              {kvkkConsent && <CheckCircle size={16} color={Colors.primaryDark} />}
            </View>
            <View style={styles.consentContent}>
              <Text style={styles.consentText}>
                <Text 
                  style={styles.consentLink}
                  onPress={() => handleOpenLink(KVKK_LINKS.kvkk)}
                >
                  KVKK Aydınlatma Metni
                </Text>
                {" "}metnini okudum ve kabul ediyorum.
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.consentItem}
            onPress={() => setConsentConsent(!consentConsent)}
          >
            <View style={[styles.checkbox, consentConsent && styles.checkboxChecked]}>
              {consentConsent && <CheckCircle size={16} color={Colors.primaryDark} />}
            </View>
            <View style={styles.consentContent}>
              <Text style={styles.consentText}>
                <Text 
                  style={styles.consentLink}
                  onPress={() => handleOpenLink(KVKK_LINKS.consent)}
                >
                  Açık Rıza Beyanı
                </Text>
                {" "}metnini okudum ve kabul ediyorum.
              </Text>
            </View>
          </TouchableOpacity>

          {!allConsentsChecked && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                Devam etmek için tüm yasal metinleri onaylamanız gerekmektedir.
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.submitButton,
            (!allConsentsChecked || submitting) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!allConsentsChecked || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={Colors.primaryDark} />
          ) : (
            <Text style={styles.submitButtonText}>Kayıt Tamamla</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  errorButton: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  successContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  successButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
  },
  successButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primaryDark,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
  },
  eyeButton: {
    padding: 16,
  },
  consentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
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
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  consentContent: {
    flex: 1,
  },
  consentText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  consentLink: {
    color: Colors.secondary,
    fontWeight: '600' as const,
    textDecorationLine: 'underline',
  },
  warningBox: {
    backgroundColor: Colors.warning + '20',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  warningText: {
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '500' as const,
  },
  footer: {
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  submitButton: {
    backgroundColor: Colors.secondary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primaryDark,
  },
});
