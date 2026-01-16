import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Share,
  Alert,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Copy,
  Share2,
  Download,
  ChevronLeft,
  GraduationCap,
  DollarSign,
  Star,
  Users,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import { MOCK_CURRENT_AMBASSADOR } from '@/mocks/data';

export default function StudentInviteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const referralCode = MOCK_CURRENT_AMBASSADOR.referralCode;
  const referralLink = `https://compassabroad.com/ref/${referralCode}?type=student`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralLink)}&bgcolor=FFFFFF&color=502274`;

  const copyToClipboard = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      await Clipboard.setStringAsync(referralLink);
      Alert.alert('Kopyalandı!', 'Davet linki panoya kopyalandı.');
    } catch (error) {
      console.log('Clipboard error:', error);
      Alert.alert('Hata', 'Kopyalama işlemi başarısız oldu.');
    }
  };

  const shareLink = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const shareMessage = `Compass Abroad ile yurt dışı eğitim hayalini gerçekleştir! 🎓\n\nReferans linkim: ${referralLink}`;
    
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: 'Compass Abroad Öğrenci Daveti',
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

  const downloadQR = async () => {
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradient.start, Colors.gradient.middle, Colors.background]}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Öğrenci Davet Et</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <GraduationCap size={48} color={Colors.secondary} />
          </View>
        </View>

        <Text style={styles.subtitle}>
          Bu linki öğrencilerle paylaşarak kazanç elde edin
        </Text>

        <View style={styles.qrCard}>
          <View style={styles.qrImageContainer}>
            <Image
              source={{ uri: qrCodeUrl }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Referans Kodunuz</Text>
            <Text style={styles.codeText}>{referralCode}</Text>
          </View>

          <View style={styles.linkContainer}>
            <Text style={styles.linkLabel}>Davet Linki</Text>
            <Text style={styles.linkText} numberOfLines={1}>{referralLink}</Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.actionButton} onPress={copyToClipboard}>
              <Copy size={20} color={Colors.text} />
              <Text style={styles.actionButtonText}>Kopyala</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.shareButton]} onPress={shareLink}>
              <Share2 size={20} color={Colors.background} />
              <Text style={[styles.actionButtonText, styles.shareButtonText]}>Paylaş</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={downloadQR}>
              <Download size={20} color={Colors.text} />
              <Text style={styles.actionButtonText}>İndir</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Öğrenci Davet Avantajları</Text>

          <View style={styles.benefitItem}>
            <View style={[styles.benefitIcon, { backgroundColor: Colors.success + '20' }]}>
              <DollarSign size={20} color={Colors.success} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitLabel}>Program Komisyonu</Text>
              <Text style={styles.benefitDesc}>Her kayıt olan öğrenciden komisyon kazanın</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={[styles.benefitIcon, { backgroundColor: Colors.secondary + '20' }]}>
              <Star size={20} color={Colors.secondary} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitLabel}>Compass Points</Text>
              <Text style={styles.benefitDesc}>Her öğrenci için bonus puan kazanın</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={[styles.benefitIcon, { backgroundColor: Colors.info + '20' }]}>
              <Users size={20} color={Colors.info} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitLabel}>Öğrenci Takibi</Text>
              <Text style={styles.benefitDesc}>Öğrencilerinizin sürecini canlı takip edin</Text>
            </View>
          </View>
        </View>

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
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  qrCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  qrImageContainer: {
    width: 180,
    height: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 10,
  },
  qrImage: {
    width: 160,
    height: 160,
  },
  codeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  codeText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.secondary,
    letterSpacing: 3,
  },
  linkContainer: {
    width: '100%',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  linkLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  linkText: {
    fontSize: 13,
    color: Colors.text,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  shareButton: {
    backgroundColor: Colors.secondary,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  shareButtonText: {
    color: Colors.background,
  },
  benefitsSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  benefitContent: {
    flex: 1,
  },
  benefitLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
