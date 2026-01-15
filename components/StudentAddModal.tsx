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
import { X, User, Mail, Phone, BookOpen, Globe, FileText, ChevronDown } from 'lucide-react-native';
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

export default function StudentAddModal({ visible, onClose, onSubmit }: StudentAddModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [program, setProgram] = useState<ProgramType | ''>('');
  const [country, setCountry] = useState('');
  const [notes, setNotes] = useState('');
  const [showProgramPicker, setShowProgramPicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setProgram('');
    setCountry('');
    setNotes('');
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

    onSubmit({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      program,
      country,
      notes: notes.trim(),
    });

    resetForm();
    onClose();
    Alert.alert('Başarılı', 'Öğrenci başarıyla eklendi!');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectedProgram = PROGRAMS.find(p => p.id === program);
  const selectedCountry = ALL_COUNTRIES.find(c => c.code === country);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Yeni Öğrenci Ekle</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
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
              <Text style={styles.labelText}>Program</Text>
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
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Ek notlar (isteğe bağlı)"
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
            <Text style={styles.submitButtonText}>Öğrenci Ekle</Text>
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
    fontWeight: '700',
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
    fontWeight: '500',
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
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  submitButton: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
});
