import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Clock,
  Mail,
  Phone,
  LogOut,
  MessageCircle,
} from 'lucide-react-native';

import Colors from '@/constants/colors';

export default function PendingApprovalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleContactSupport = () => {
    Linking.openURL('mailto:destek@compassabroad.com?subject=Hesap%20Onay%20Durumu');
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+902121234567');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/902121234567');
  };

  const handleLogout = () => {
    router.replace('/onboarding');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradient.start, Colors.gradient.middle, Colors.background]}
        style={[styles.gradient, { paddingTop: insets.top + 40 }]}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Clock size={64} color={Colors.warning} />
          </View>

          <Text style={styles.title}>Hesabınız Onay Bekliyor</Text>
          
          <Text style={styles.description}>
            Başvurunuz başarıyla alındı ve şu anda inceleme sürecindedir. 
            Bu işlem genellikle 1-2 iş günü içinde tamamlanmaktadır.
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Ne Olacak?</Text>
            <Text style={styles.infoText}>
              • Başvurunuz ekibimiz tarafından değerlendirilecek{'\n'}
              • Onay durumu e-posta ile bildirilecek{'\n'}
              • Onay sonrası uygulamayı tam olarak kullanabileceksiniz
            </Text>
          </View>

          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>Sorularınız mı var?</Text>
            
            <View style={styles.contactButtons}>
              <TouchableOpacity style={styles.contactButton} onPress={handleContactSupport}>
                <View style={[styles.contactIcon, { backgroundColor: Colors.info + '20' }]}>
                  <Mail size={20} color={Colors.info} />
                </View>
                <Text style={styles.contactLabel}>E-posta</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.contactButton} onPress={handleCallSupport}>
                <View style={[styles.contactIcon, { backgroundColor: Colors.success + '20' }]}>
                  <Phone size={20} color={Colors.success} />
                </View>
                <Text style={styles.contactLabel}>Ara</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.contactButton} onPress={handleWhatsApp}>
                <View style={[styles.contactIcon, { backgroundColor: '#25D366' + '20' }]}>
                  <MessageCircle size={20} color="#25D366" />
                </View>
                <Text style={styles.contactLabel}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color={Colors.error} />
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            Farklı bir hesapla giriş yapmak için çıkış yapabilirsiniz.
          </Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.warning + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  infoBox: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  contactSection: {
    width: '100%',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  contactButton: {
    alignItems: 'center',
    gap: 8,
  },
  contactIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
  },
  footer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.error + '15',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  footerNote: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
