import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { X, User, Mail, Phone, Link2, Copy, MessageCircle, Share2, Check, ChevronLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { MOCK_CURRENT_AMBASSADOR } from '@/mocks/data';

interface AmbassadorInviteModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AmbassadorInviteModal({ visible, onClose }: AmbassadorInviteModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const referralCode = MOCK_CURRENT_AMBASSADOR.referralCode;
  const baseUrl = 'https://compass-abroad.com/join';

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setGeneratedLink('');
    setCopied(false);
  };

  const generateReferralLink = () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Lütfen davet edilecek kişinin adını girin');
      return;
    }

    const encodedName = encodeURIComponent(name.trim());
    const link = `${baseUrl}?ref=${referralCode}&name=${encodedName}`;
    setGeneratedLink(link);
    console.log('Generated referral link:', link);
  };

  const copyToClipboard = async () => {
    if (generatedLink) {
      await Clipboard.setStringAsync(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      Alert.alert('Kopyalandı', 'Davet linki panoya kopyalandı!');
    }
  };

  const shareViaWhatsApp = () => {
    if (!generatedLink) {
      Alert.alert('Hata', 'Önce davet linki oluşturun');
      return;
    }

    const message = `Merhaba ${name}!\n\nSeni Compass Abroad Elçi programına davet ediyorum. Bu link ile kayıt olabilirsin:\n\n${generatedLink}\n\nSorularınız için benimle iletişime geçebilirsin.`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}${phone ? `&phone=${phone.replace(/\s+/g, '')}` : ''}`;
    
    Linking.canOpenURL(whatsappUrl).then((supported) => {
      if (supported) {
        Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('Hata', 'WhatsApp yüklü değil');
      }
    });
  };

  const shareViaSMS = () => {
    if (!generatedLink) {
      Alert.alert('Hata', 'Önce davet linki oluşturun');
      return;
    }

    const message = `Merhaba ${name}! Seni Compass Abroad Elçi programına davet ediyorum: ${generatedLink}`;
    const smsUrl = Platform.select({
      ios: `sms:${phone.replace(/\s+/g, '')}&body=${encodeURIComponent(message)}`,
      android: `sms:${phone.replace(/\s+/g, '')}?body=${encodeURIComponent(message)}`,
      default: `sms:${phone.replace(/\s+/g, '')}?body=${encodeURIComponent(message)}`,
    });
    
    Linking.openURL(smsUrl);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView 
          style={styles.keyboardView} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.backButton}>
              <ChevronLeft size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Elçi Davet Et</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.referralCodeCard}>
            <Text style={styles.referralCodeLabel}>Referans Kodunuz</Text>
            <Text style={styles.referralCode}>{referralCode}</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <User size={18} color={Colors.secondary} />
              <Text style={styles.labelText}>Ad Soyad</Text>
            </View>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Davet edilecek kişinin adı"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Mail size={18} color={Colors.secondary} />
              <Text style={styles.labelText}>E-posta (Opsiyonel)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@email.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Phone size={18} color={Colors.secondary} />
              <Text style={styles.labelText}>Telefon (Opsiyonel)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+90 5XX XXX XX XX"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity style={styles.generateButton} onPress={generateReferralLink}>
            <Link2 size={20} color={Colors.primaryDark} />
            <Text style={styles.generateButtonText}>Davet Linki Oluştur</Text>
          </TouchableOpacity>

          {generatedLink ? (
            <View style={styles.linkSection}>
              <Text style={styles.linkLabel}>Oluşturulan Link</Text>
              <View style={styles.linkContainer}>
                <Text style={styles.linkText} numberOfLines={2}>{generatedLink}</Text>
                <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
                  {copied ? (
                    <Check size={20} color={Colors.success} />
                  ) : (
                    <Copy size={20} color={Colors.secondary} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.shareButtons}>
                <TouchableOpacity style={styles.whatsappButton} onPress={shareViaWhatsApp}>
                  <MessageCircle size={20} color="#FFFFFF" />
                  <Text style={styles.whatsappButtonText}>WhatsApp</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.smsButton} onPress={shareViaSMS}>
                  <Share2 size={20} color={Colors.text} />
                  <Text style={styles.smsButtonText}>SMS</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Elçi Davet Avantajları</Text>
            <View style={styles.infoItem}>
              <View style={styles.infoBullet} />
              <Text style={styles.infoText}>Alt elçilerinizin kazançlarından %10 komisyon</Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoBullet} />
              <Text style={styles.infoText}>Her davet için +50 Compass Points</Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoBullet} />
              <Text style={styles.infoText}>Ağınızı büyütün, kazancınızı artırın</Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  referralCodeCard: {
    backgroundColor: Colors.primary + '30',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  referralCodeLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  referralCode: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.secondary,
    letterSpacing: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  linkSection: {
    marginBottom: 24,
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 10,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  linkText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    borderRadius: 12,
    padding: 14,
  },
  whatsappButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  smsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  smsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  infoCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  infoBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
    marginTop: 6,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
