import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  Save,
  RotateCcw,
  ExternalLink,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/colors';
import { MOCK_SOCIAL_MEDIA_LINKS } from '@/mocks/data';
import { SocialMediaLinks } from '@/types';

type SocialPlatform = keyof SocialMediaLinks;

interface SocialInput {
  key: SocialPlatform;
  label: string;
  icon: React.ReactNode;
  color: string;
  placeholder: string;
}

const SOCIAL_INPUTS: SocialInput[] = [
  {
    key: 'instagram',
    label: 'Instagram',
    icon: <Instagram size={24} color="#E4405F" />,
    color: '#E4405F',
    placeholder: 'https://instagram.com/username',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: <Linkedin size={24} color="#0A66C2" />,
    color: '#0A66C2',
    placeholder: 'https://linkedin.com/company/name',
  },
  {
    key: 'twitter',
    label: 'Twitter',
    icon: <Twitter size={24} color="#1DA1F2" />,
    color: '#1DA1F2',
    placeholder: 'https://twitter.com/username',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    icon: <Facebook size={24} color="#1877F2" />,
    color: '#1877F2',
    placeholder: 'https://facebook.com/pagename',
  },
];

export default function SocialMediaScreen() {
  const router = useRouter();
  const [links, setLinks] = useState<SocialMediaLinks>({ ...MOCK_SOCIAL_MEDIA_LINKS });
  const [hasChanges, setHasChanges] = useState(false);

  const handleLinkChange = (key: SocialPlatform, value: string) => {
    setLinks(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    console.log('Saving social media links:', links);
    Alert.alert(
      'Başarılı',
      'Sosyal medya linkleri güncellendi.',
      [{ text: 'Tamam' }]
    );
    setHasChanges(false);
  };

  const handleReset = () => {
    Alert.alert(
      'Sıfırla',
      'Tüm linkleri varsayılana döndürmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: () => {
            setLinks({ ...MOCK_SOCIAL_MEDIA_LINKS });
            setHasChanges(false);
          },
        },
      ]
    );
  };

  const handleTestLink = async (url: string) => {
    try {
      const { Linking } = await import('react-native');
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Hata', 'Bu link açılamıyor.');
      }
    } catch {
      Alert.alert('Hata', 'Link açılırken bir hata oluştu.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradient.start, Colors.gradient.middle, Colors.gradient.end]}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              testID="back-button"
            >
              <ArrowLeft color={Colors.text} size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sosyal Medya Linkleri</Text>
            <View style={styles.headerRight} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Aşağıdaki linkleri güncelleyerek uygulamadaki sosyal medya butonlarının
            yönlendirileceği adresleri değiştirebilirsiniz.
          </Text>
        </View>

        {SOCIAL_INPUTS.map((input) => (
          <View key={input.key} style={styles.inputCard}>
            <View style={styles.inputHeader}>
              <View style={[styles.iconContainer, { backgroundColor: input.color + '20' }]}>
                {input.icon}
              </View>
              <Text style={styles.inputLabel}>{input.label}</Text>
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => handleTestLink(links[input.key])}
              >
                <ExternalLink size={18} color={Colors.secondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={links[input.key]}
              onChangeText={(value) => handleLinkChange(input.key, value)}
              placeholder={input.placeholder}
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              testID={`input-${input.key}`}
            />
          </View>
        ))}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={handleReset}
            testID="reset-button"
          >
            <RotateCcw size={20} color={Colors.text} />
            <Text style={styles.resetButtonText}>Sıfırla</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.saveButton, !hasChanges && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={!hasChanges}
            testID="save-button"
          >
            <Save size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Kaydet</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerRight: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: Colors.info + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  inputCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  inputLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  testButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  resetButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.success,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
