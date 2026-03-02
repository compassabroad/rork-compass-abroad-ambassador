import React, { useState } from 'react';
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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (!url) throw new Error('EXPO_PUBLIC_RORK_API_BASE_URL is not set');
  return url;
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetupDatabase = async () => {
    setIsSettingUp(true);
    Alert.alert('Veritabanı', 'Veritabanı hazırlanıyor...');
    try {
      const res = await fetch(`${getBaseUrl()}/api/setup`, { method: 'POST' });
      const data = await res.json();
      console.log('[Setup] Response:', JSON.stringify(data));
      if (data.success) {
        Alert.alert('Başarılı', 'Veritabanı hazır! Artık giriş yapabilirsiniz.');
      } else {
        Alert.alert('Hata', `Kurulum tamamlanamadı: ${data.error || JSON.stringify(data.results)}`);
      }
    } catch (err) {
      console.error('[Setup] Error:', err);
      Alert.alert('Hata', `Bağlantı hatası: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSettingUp(false);
    }
  };

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleLogin = async () => {
    setError(null);

    if (!email.trim()) {
      setError('E-posta adresi gereklidir');
      return;
    }

    if (!validateEmail(email)) {
      setError('Geçerli bir e-posta adresi girin');
      return;
    }

    if (!password.trim()) {
      setError('Şifre gereklidir');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setIsLoading(true);

    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      await login(email.trim(), password);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      console.log('[Login] Success for:', email);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Giriş yapılamadı. Lütfen tekrar deneyin.';
      console.log('[Login] Error:', message);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Şifremi Unuttum',
      'Bu özellik yakında eklenecek. Şu an için destek ekibimizle iletişime geçebilirsiniz.',
      [{ text: 'Tamam' }]
    );
  };

  const handleRegister = () => {
    router.push('/auth/register');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={[Colors.gradient.start, Colors.gradient.middle, Colors.background]}
        style={[styles.gradient, { paddingTop: insets.top + 40 }]}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
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
            <Text style={styles.subtitle}>Ambassador</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <Mail size={18} color={Colors.secondary} />
                <Text style={styles.inputLabel}>E-posta</Text>
              </View>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => {
                  setEmail(text.toLowerCase());
                  setError(null);
                }}
                placeholder="E-posta adresiniz"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                testID="login-email"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputLabelRow}>
                <Lock size={18} color={Colors.secondary} />
                <Text style={styles.inputLabel}>Şifre</Text>
              </View>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError(null);
                  }}
                  placeholder="Şifreniz"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  testID="login-password"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={Colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={Colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <AlertCircle size={16} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              testID="login-submit"
            >
              <LinearGradient
                colors={[Colors.secondary, '#F5D76E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={Colors.background} />
                ) : (
                  <Text style={styles.loginButtonText}>Giriş Yap</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotButton} onPress={handleForgotPassword}>
              <Text style={styles.forgotButtonText}>Şifremi Unuttum</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>veya</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>
              Hesabınız yok mu? <Text style={styles.registerButtonHighlight}>Kayıt Olun</Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.copyright}>Compass Abroad © 2024</Text>

          <TouchableOpacity
            style={styles.setupButton}
            onPress={handleSetupDatabase}
            disabled={isSettingUp}
          >
            {isSettingUp ? (
              <ActivityIndicator size="small" color={Colors.textMuted} />
            ) : (
              <Text style={styles.setupButtonText}>🔧 Veritabanını Hazırla</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 20,
  },
  logoRingGradient: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.secondary,
    letterSpacing: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.secondary,
    fontWeight: '500' as const,
    letterSpacing: 2,
  },
  formContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.error + '15',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: Colors.error,
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonGradient: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  forgotButton: {
    alignItems: 'center',
  },
  forgotButtonText: {
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '500' as const,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginHorizontal: 16,
  },
  registerButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  registerButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  registerButtonHighlight: {
    fontWeight: '600' as const,
    color: Colors.secondary,
  },
  copyright: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
  },
  setupButton: {
    marginTop: 16,
    alignItems: 'center',
    padding: 12,
  },
  setupButtonText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});
