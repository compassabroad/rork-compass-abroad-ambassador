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
} from 'react-native';
import { X, User, Mail, Phone, BookOpen, Globe, FileText, ChevronDown, Send, CheckCircle, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { PROGRAMS } from '@/mocks/data';
import { ProgramType } from '@/types';

interface StudentAddModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (student: NewStudent) => void;
}

export interface NewStudent {
  name: string;
  email: string;
  phone: string;
  program: ProgramType;
  country: string;
  notes: string;
  invitationStatus: 'pending_kvkk';
  invitationToken: string;
  invitedAt: string;
}

const COUNTRY_GROUPS = [
  {
    region: 'Avrupa',
    countries: [
      { code: 'Italy', name: 'İtalya' },
      { code: 'Germany', name: 'Almanya' },
      { code: 'Spain', name: 'İspanya' },
      { code: 'Netherlands', name: 'Hollanda' },
      { code: 'France', name: 'Fransa' },
      { code: 'OtherEurope', name: 'Diğer Avrupa' },
    ],
  },
  {
    region: 'Diğer Ülkeler',
    countries: [
      { code: 'UK', name: 'İngiltere' },
      { code: 'Ireland', name: 'İrlanda' },
      { code: 'Canada', name: 'Kanada' },
      { code: 'USA', name: 'Amerika' },
      { code: 'Malta', name: 'Malta' },
      { code: 'Dubai', name: 'Dubai' },
      { code: 'Australia', name: 'Avustralya' },
      { code: 'NewZealand', name: 'Yeni Zelanda' },
      { code: 'Thailand', name: 'Tayland' },
      { code: 'Singapore', name: 'Singapur' },
      { code: 'Japan', name: 'Japonya' },
      { code: 'SouthKorea', name: 'Güney Kore' },
      { code: 'China', name: 'Çin' },
    ],
  },
];

const ALL_COUNTRIES = COUNTRY_GROUPS.flatMap(g => g.countries);

const generateToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export default function StudentAddModal({ visible, onClose, onSubmit }: StudentAddModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [program, setProgram] = useState<ProgramType | ''>('');
  const [country, setCountry] = useState('');
  const [notes, setNotes] = useState('');
  const [showProgramPicker, setShowProgramPicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setProgram('');
    setCountry('');
    setNotes('');
    setShowSuccess(false);
    setSubmittedEmail('');
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Lütfen öğrenci adını girin');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Hata', 'Lütfen e-posta adresini girin');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Hata', 'Lütfen geçerli bir e-posta adresi girin');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Hata', 'Lütfen telefon numarasını girin');
      return;
    }
    if (!program) {
      Alert.alert('Hata', 'Lütfen program seçin');
      return;
    }
    if (!country) {
      Alert.alert('Hata', 'Lütfen hedef ülke seçin');
      return;
    }

    const token = generateToken();
    const now = new Date().toISOString();

    onSubmit({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      program,
      country,
      notes: notes.trim(),
      invitationStatus: 'pending_kvkk',
      invitationToken: token,
      invitedAt: now,
    });

    setSubmittedEmail(email.trim());
    setShowSuccess(true);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectedProgram = PROGRAMS.find(p => p.id === program);
  const selectedCountry = ALL_COUNTRIES.find(c => c.code === country);

  if (showSuccess) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Davet Gönderildi</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.successContainer}>
            <View style={styles.successIconContainer}>
              <Send size={48} color={Colors.secondary} />
            </View>
            
            <Text style={styles.successTitle}>Davet E-postası Gönderildi!</Text>
            
            <Text style={styles.successEmail}>{submittedEmail}</Text>
            
            <View style={styles.successStepsContainer}>
              <Text style={styles.successStepsTitle}>Sonraki Adımlar:</Text>
              
              <View style={styles.successStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>E-posta Gönderildi</Text>
                  <Text style={styles.stepDescription}>Öğrenciye Compass Abroad davet konulu e-posta gönderildi.</Text>
                </View>
                <CheckCircle size={20} color={Colors.success} />
              </View>

              <View style={styles.successStep}>
                <View style={[styles.stepNumber, styles.stepNumberPending]}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>KVKK Onayı Bekleniyor</Text>
                  <Text style={styles.stepDescription}>Öğrenci linke tıklayıp KVKK metinlerini onaylayacak ve şifresini belirleyecek.</Text>
                </View>
                <Clock size={20} color={Colors.warning} />
              </View>

              <View style={styles.successStep}>
                <View style={[styles.stepNumber, styles.stepNumberPending]}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Hesap Aktif Olacak</Text>
                  <Text style={styles.stepDescription}>Onay sonrası öğrenci giriş yapabilecek ve sizinle otomatik eşleşecek.</Text>
                </View>
                <Clock size={20} color={Colors.textMuted} />
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoBoxTitle}>KVKK Uyumu</Text>
              <Text style={styles.infoBoxText}>
                Bu sistem sayesinde öğrenci kişisel verilerinin işlenmesine kendisi onay verir. 
                Yasal gereklilikler karşılanır ve e-posta doğrulaması da yapılmış olur.
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.submitButton} onPress={handleClose}>
              <Text style={styles.submitButtonText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Öğrenci Davet Et</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.inviteBanner}>
          <Send size={20} color={Colors.secondary} />
          <Text style={styles.inviteBannerText}>
            Öğrenci bilgilerini girin, sistem otomatik davet e-postası gönderecek. 
            Öğrenci KVKK onayını verdikten sonra hesabı aktif olacak.
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <User size={18} color={Colors.secondary} />
              <Text style={styles.labelText}>Ad Soyad</Text>
            </View>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Öğrenci adı ve soyadı"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Mail size={18} color={Colors.secondary} />
              <Text style={styles.labelText}>E-posta</Text>
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>Zorunlu</Text>
              </View>
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
            <Text style={styles.inputHint}>Davet e-postası bu adrese gönderilecek</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Phone size={18} color={Colors.secondary} />
              <Text style={styles.labelText}>Telefon</Text>
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

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <BookOpen size={18} color={Colors.secondary} />
              <Text style={styles.labelText}>İlgilendiği Program</Text>
            </View>
            <TouchableOpacity 
              style={styles.picker} 
              onPress={() => setShowProgramPicker(!showProgramPicker)}
            >
              <Text style={selectedProgram ? styles.pickerText : styles.pickerPlaceholder}>
                {selectedProgram?.name || 'Program seçin'}
              </Text>
              <ChevronDown size={20} color={Colors.textMuted} />
            </TouchableOpacity>
            {showProgramPicker && (
              <View style={styles.pickerOptions}>
                {PROGRAMS.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.pickerOption, program === p.id && styles.pickerOptionSelected]}
                    onPress={() => {
                      setProgram(p.id);
                      setShowProgramPicker(false);
                    }}
                  >
                    <Text style={[styles.pickerOptionText, program === p.id && styles.pickerOptionTextSelected]}>
                      {p.name}
                    </Text>
                    <Text style={styles.pickerOptionSubtext}>${p.commission} komisyon</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Globe size={18} color={Colors.secondary} />
              <Text style={styles.labelText}>Hedef Ülke</Text>
            </View>
            <TouchableOpacity 
              style={styles.picker} 
              onPress={() => setShowCountryPicker(!showCountryPicker)}
            >
              <Text style={selectedCountry ? styles.pickerText : styles.pickerPlaceholder}>
                {selectedCountry?.name || 'Ülke seçin'}
              </Text>
              <ChevronDown size={20} color={Colors.textMuted} />
            </TouchableOpacity>
            {showCountryPicker && (
              <ScrollView style={styles.pickerOptionsScroll} nestedScrollEnabled>
                {COUNTRY_GROUPS.map((group) => (
                  <View key={group.region}>
                    <View style={styles.regionHeader}>
                      <Text style={styles.regionTitle}>{group.region}</Text>
                    </View>
                    {group.countries.map((c) => (
                      <TouchableOpacity
                        key={c.code}
                        style={[styles.pickerOption, country === c.code && styles.pickerOptionSelected]}
                        onPress={() => {
                          setCountry(c.code);
                          setShowCountryPicker(false);
                        }}
                      >
                        <Text style={[styles.pickerOptionText, country === c.code && styles.pickerOptionTextSelected]}>
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <FileText size={18} color={Colors.secondary} />
              <Text style={styles.labelText}>Notlar</Text>
              <View style={styles.optionalBadge}>
                <Text style={styles.optionalText}>İsteğe bağlı</Text>
              </View>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Ek notlar (görüşme notları, tercihler vb.)"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>İptal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Send size={18} color={Colors.primaryDark} style={{ marginRight: 8 }} />
            <Text style={styles.submitButtonText}>Davet Gönder</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
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
  inviteBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primary + '30',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    gap: 12,
  },
  inviteBannerText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  content: {
    flex: 1,
    padding: 20,
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
    fontWeight: '600' as const,
    color: Colors.text,
  },
  requiredBadge: {
    backgroundColor: Colors.error + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  requiredText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  optionalBadge: {
    backgroundColor: Colors.textMuted + '30',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  optionalText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
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
  inputHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
    marginLeft: 4,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  picker: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  pickerOptions: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  pickerOptionsScroll: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 280,
  },
  regionHeader: {
    backgroundColor: Colors.primary + '40',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  regionTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pickerOption: {
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
    fontWeight: '500' as const,
  },
  pickerOptionTextSelected: {
    color: Colors.secondary,
  },
  pickerOptionSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  submitButton: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primaryDark,
  },
  successContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  successEmail: {
    fontSize: 16,
    color: Colors.secondary,
    fontWeight: '600' as const,
    marginBottom: 32,
  },
  successStepsContainer: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  successStepsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  successStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberPending: {
    backgroundColor: Colors.textMuted + '50',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  infoBox: {
    width: '100%',
    backgroundColor: Colors.info + '15',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
  },
  infoBoxTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.info,
    marginBottom: 6,
  },
  infoBoxText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
});
