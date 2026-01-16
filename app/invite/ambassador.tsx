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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Copy,
  Share2,
  Download,
  ChevronLeft,
  Users,
  Percent,
  Star,
  TrendingUp,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import { MOCK_CURRENT_AMBASSADOR } from '@/mocks/data';

export default function AmbassadorInviteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const referralCode = MOCK_CURRENT_AMBASSADOR.referralCode;
  const referralLink = `https://compassabroad.com/ref/${referralCode}?type=ambassador`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralLink)}&bgcolor=FFFFFF&color=8B5CF6`;

  const copyToClipboard = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert('Kopyalandı!', `Davet linki kopyalandı:\n${referralLink}`);
  };

  const shareLink = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      await Share.share({
        message: `Compass Abroad Elçi Programı'na katıl ve yurt dışı eğitim sektöründe kazanmaya başla! 🚀\n\nDavet linkim: ${referralLink}`,
        url: referralLink,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const downloadQR = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert('QR Kodu İndir', 'QR kodunuz galeriye kaydedildi.', [{ text: 'Tamam' }]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4C1D95', '#6D28D9', Colors.background]}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Elçi Davet Et</Text>
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
            <Users size={48} color="#8B5CF6" />
          </View>
        </View>

        <Text style={styles.subtitle}>
          Kendi elçi ağınızı oluşturun ve pasif gelir elde edin
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
              <Share2 size={20} color="#FFFFFF" />
              <Text style={[styles.actionButtonText, styles.shareButtonText]}>Paylaş</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={downloadQR}>
              <Download size={20} color={Colors.text} />
              <Text style={styles.actionButtonText}>İndir</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Elçi Davet Avantajları</Text>

          <View style={styles.benefitItem}>
            <View style={[styles.benefitIcon, { backgroundColor: '#8B5CF6' + '20' }]}>
              <Percent size={20} color="#8B5CF6" />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitLabel}>%10 Alt Elçi Komisyonu</Text>
              <Text style={styles.benefitDesc}>Alt elçilerinizin kazançlarından %10 komisyon alın</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={[styles.benefitIcon, { backgroundColor: Colors.secondary + '20' }]}>
              <Star size={20} color={Colors.secondary} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitLabel}>+50 Compass Points</Text>
              <Text style={styles.benefitDesc}>Her davet için ekstra puan kazanın</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <View style={[styles.benefitIcon, { backgroundColor: Colors.success + '20' }]}>
              <TrendingUp size={20} color={Colors.success} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitLabel}>Ağınızı Büyütün</Text>
              <Text style={styles.benefitDesc}>Ağınızı büyütün, kazancınızı artırın</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Nasıl Çalışır?</Text>
          <View style={styles.infoStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Davet linkini potansiyel elçilerle paylaşın</Text>
          </View>
          <View style={styles.infoStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>Davet edilen kişi kayıt olur ve admin onayı bekler</Text>
          </View>
          <View style={styles.infoStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Onaylandığında sizin alt elçiniz olur</Text>
          </View>
          <View style={styles.infoStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={styles.stepText}>Alt elçinizin her kazancından %10 komisyon alırsınız</Text>
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
    backgroundColor: '#8B5CF6' + '20',
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
    borderColor: '#8B5CF6' + '40',
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
    color: '#8B5CF6',
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
    backgroundColor: '#8B5CF6',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  shareButtonText: {
    color: '#FFFFFF',
  },
  benefitsSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
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
  infoCard: {
    backgroundColor: '#8B5CF6' + '10',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#8B5CF6' + '30',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
