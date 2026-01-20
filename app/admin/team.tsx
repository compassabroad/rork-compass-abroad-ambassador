import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  User,
  Mail,
  Phone,
  Briefcase,
  Globe,
  Check,
  ChevronDown,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/colors';
import { MOCK_TEAM_MEMBERS, PROGRAMS } from '@/mocks/data';
import { TeamMember, ProgramType, AvailabilityStatus } from '@/types';

const AVAILABILITY_OPTIONS: { value: AvailabilityStatus; label: string; color: string }[] = [
  { value: 'available', label: 'Müsait', color: Colors.success },
  { value: 'busy', label: 'Meşgul', color: Colors.warning },
];

const LANGUAGE_OPTIONS = [
  'Türkçe',
  'İngilizce',
  'Almanca',
  'Fransızca',
  'İspanyolca',
  'Hollandaca',
  'İtalyanca',
  'Rusça',
  'Arapça',
  'Çince',
];

export default function TeamManagementScreen() {
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(MOCK_TEAM_MEMBERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [programSelectVisible, setProgramSelectVisible] = useState(false);
  const [languageSelectVisible, setLanguageSelectVisible] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    expertiseAreas: [] as ProgramType[],
    languages: [] as string[],
    availability: 'available' as AvailabilityStatus,
  });

  const filteredMembers = useMemo(() => {
    return teamMembers.filter(
      (member) =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teamMembers, searchQuery]);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      title: '',
      email: '',
      phone: '',
      expertiseAreas: [],
      languages: [],
      availability: 'available',
    });
    setEditingMember(null);
  }, []);

  const openAddModal = useCallback(() => {
    resetForm();
    setModalVisible(true);
  }, [resetForm]);

  const openEditModal = useCallback((member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      title: member.title,
      email: member.email,
      phone: member.phone,
      expertiseAreas: member.expertiseAreas,
      languages: member.languages,
      availability: member.availability,
    });
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    resetForm();
  }, [resetForm]);

  const validateForm = useCallback((): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Hata', 'Lütfen isim giriniz.');
      return false;
    }
    if (!formData.title.trim()) {
      Alert.alert('Hata', 'Lütfen unvan giriniz.');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Hata', 'Lütfen e-posta giriniz.');
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Hata', 'Lütfen telefon giriniz.');
      return false;
    }
    if (formData.expertiseAreas.length === 0) {
      Alert.alert('Hata', 'Lütfen en az bir uzmanlık alanı seçiniz.');
      return false;
    }
    if (formData.languages.length === 0) {
      Alert.alert('Hata', 'Lütfen en az bir dil seçiniz.');
      return false;
    }
    return true;
  }, [formData]);

  const handleSave = useCallback(() => {
    if (!validateForm()) return;

    if (editingMember) {
      setTeamMembers((prev) =>
        prev.map((m) =>
          m.id === editingMember.id
            ? { ...m, ...formData }
            : m
        )
      );
      console.log('Team member updated:', editingMember.id, formData);
      Alert.alert('Başarılı', 'Ekip üyesi güncellendi.');
    } else {
      const newMember: TeamMember = {
        id: `team${Date.now()}`,
        ...formData,
      };
      setTeamMembers((prev) => [...prev, newMember]);
      console.log('New team member added:', newMember);
      Alert.alert('Başarılı', 'Yeni ekip üyesi eklendi.');
    }
    closeModal();
  }, [formData, editingMember, validateForm, closeModal]);

  const handleDelete = useCallback((member: TeamMember) => {
    Alert.alert(
      'Ekip Üyesini Sil',
      `${member.name} isimli ekip üyesini silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            setTeamMembers((prev) => prev.filter((m) => m.id !== member.id));
            console.log('Team member deleted:', member.id);
            Alert.alert('Başarılı', 'Ekip üyesi silindi.');
          },
        },
      ]
    );
  }, []);

  const toggleExpertise = useCallback((programId: ProgramType) => {
    setFormData((prev) => ({
      ...prev,
      expertiseAreas: prev.expertiseAreas.includes(programId)
        ? prev.expertiseAreas.filter((p) => p !== programId)
        : [...prev.expertiseAreas, programId],
    }));
  }, []);

  const toggleLanguage = useCallback((language: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...prev.languages, language],
    }));
  }, []);

  const getProgramName = (programId: ProgramType): string => {
    const program = PROGRAMS.find((p) => p.id === programId);
    return program?.name || programId;
  };

  const getAvailabilityInfo = (status: AvailabilityStatus) => {
    return AVAILABILITY_OPTIONS.find((opt) => opt.value === status) || AVAILABILITY_OPTIONS[0];
  };

  const renderTeamMember = (member: TeamMember) => {
    const availabilityInfo = getAvailabilityInfo(member.availability);

    return (
      <View key={member.id} style={styles.memberCard}>
        <View style={styles.memberHeader}>
          <View style={styles.memberAvatar}>
            <Text style={styles.memberAvatarText}>
              {member.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </Text>
          </View>
          <View style={styles.memberInfo}>
            <View style={styles.memberNameRow}>
              <Text style={styles.memberName}>{member.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: availabilityInfo.color + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: availabilityInfo.color }]} />
                <Text style={[styles.statusText, { color: availabilityInfo.color }]}>
                  {availabilityInfo.label}
                </Text>
              </View>
            </View>
            <Text style={styles.memberTitle}>{member.title}</Text>
          </View>
        </View>

        <View style={styles.memberDetails}>
          <View style={styles.detailRow}>
            <Mail size={14} color={Colors.textMuted} />
            <Text style={styles.detailText}>{member.email}</Text>
          </View>
          <View style={styles.detailRow}>
            <Phone size={14} color={Colors.textMuted} />
            <Text style={styles.detailText}>{member.phone}</Text>
          </View>
        </View>

        <View style={styles.expertiseSection}>
          <Text style={styles.sectionLabel}>Uzmanlık Alanları:</Text>
          <View style={styles.tagsContainer}>
            {member.expertiseAreas.map((area) => (
              <View key={area} style={styles.tag}>
                <Text style={styles.tagText}>{getProgramName(area)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.languagesSection}>
          <Text style={styles.sectionLabel}>Diller:</Text>
          <View style={styles.tagsContainer}>
            {member.languages.map((lang) => (
              <View key={lang} style={[styles.tag, styles.languageTag]}>
                <Text style={[styles.tagText, styles.languageTagText]}>{lang}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.memberActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => openEditModal(member)}
            testID={`edit-${member.id}`}
          >
            <Edit3 size={18} color={Colors.info} />
            <Text style={[styles.actionBtnText, { color: Colors.info }]}>Düzenle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDelete(member)}
            testID={`delete-${member.id}`}
          >
            <Trash2 size={18} color={Colors.error} />
            <Text style={[styles.actionBtnText, { color: Colors.error }]}>Sil</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
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
            <Text style={styles.headerTitle}>Ekip Yönetimi</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={openAddModal}
              testID="add-member-button"
            >
              <Plus color={Colors.text} size={24} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Search color={Colors.textMuted} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="İsim, unvan veya e-posta ile ara..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            testID="search-input"
          />
        </View>

        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            Toplam {filteredMembers.length} ekip üyesi
          </Text>
        </View>

        <ScrollView
          style={styles.membersList}
          contentContainerStyle={styles.membersListContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredMembers.map(renderTeamMember)}
        </ScrollView>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingMember ? 'Ekip Üyesini Düzenle' : 'Yeni Ekip Üyesi'}
              </Text>
              <TouchableOpacity onPress={closeModal} testID="close-modal">
                <X color={Colors.text} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Ad Soyad *</Text>
                <View style={styles.inputContainer}>
                  <User size={20} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ad Soyad"
                    placeholderTextColor={Colors.textMuted}
                    value={formData.name}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
                    testID="name-input"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Unvan *</Text>
                <View style={styles.inputContainer}>
                  <Briefcase size={20} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Örn: Kıdemli Eğitim Danışmanı"
                    placeholderTextColor={Colors.textMuted}
                    value={formData.title}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, title: text }))}
                    testID="title-input"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>E-posta *</Text>
                <View style={styles.inputContainer}>
                  <Mail size={20} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="email@compassabroad.com"
                    placeholderTextColor={Colors.textMuted}
                    value={formData.email}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, email: text }))}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    testID="email-input"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Telefon *</Text>
                <View style={styles.inputContainer}>
                  <Phone size={20} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="+90 212 555 0100"
                    placeholderTextColor={Colors.textMuted}
                    value={formData.phone}
                    onChangeText={(text) => setFormData((prev) => ({ ...prev, phone: text }))}
                    keyboardType="phone-pad"
                    testID="phone-input"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Müsaitlik Durumu</Text>
                <View style={styles.availabilityOptions}>
                  {AVAILABILITY_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.availabilityOption,
                        formData.availability === option.value && {
                          borderColor: option.color,
                          backgroundColor: option.color + '20',
                        },
                      ]}
                      onPress={() =>
                        setFormData((prev) => ({ ...prev, availability: option.value }))
                      }
                    >
                      <View
                        style={[
                          styles.availabilityDot,
                          { backgroundColor: option.color },
                        ]}
                      />
                      <Text
                        style={[
                          styles.availabilityText,
                          formData.availability === option.value && { color: option.color },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setProgramSelectVisible(!programSelectVisible)}
                >
                  <View style={styles.selectButtonContent}>
                    <Globe size={20} color={Colors.textMuted} />
                    <Text style={styles.selectButtonText}>
                      Uzmanlık Alanları * ({formData.expertiseAreas.length} seçili)
                    </Text>
                  </View>
                  <ChevronDown
                    size={20}
                    color={Colors.textMuted}
                    style={{
                      transform: [{ rotate: programSelectVisible ? '180deg' : '0deg' }],
                    }}
                  />
                </TouchableOpacity>
                {programSelectVisible && (
                  <View style={styles.selectDropdown}>
                    {PROGRAMS.map((program) => (
                      <TouchableOpacity
                        key={program.id}
                        style={styles.selectItem}
                        onPress={() => toggleExpertise(program.id)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            formData.expertiseAreas.includes(program.id) && styles.checkboxActive,
                          ]}
                        >
                          {formData.expertiseAreas.includes(program.id) && (
                            <Check size={14} color="#FFF" />
                          )}
                        </View>
                        <Text style={styles.selectItemText}>{program.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.formGroup}>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setLanguageSelectVisible(!languageSelectVisible)}
                >
                  <View style={styles.selectButtonContent}>
                    <Globe size={20} color={Colors.textMuted} />
                    <Text style={styles.selectButtonText}>
                      Diller * ({formData.languages.length} seçili)
                    </Text>
                  </View>
                  <ChevronDown
                    size={20}
                    color={Colors.textMuted}
                    style={{
                      transform: [{ rotate: languageSelectVisible ? '180deg' : '0deg' }],
                    }}
                  />
                </TouchableOpacity>
                {languageSelectVisible && (
                  <View style={styles.selectDropdown}>
                    {LANGUAGE_OPTIONS.map((language) => (
                      <TouchableOpacity
                        key={language}
                        style={styles.selectItem}
                        onPress={() => toggleLanguage(language)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            formData.languages.includes(language) && styles.checkboxActive,
                          ]}
                        >
                          {formData.languages.includes(language) && (
                            <Check size={14} color="#FFF" />
                          )}
                        </View>
                        <Text style={styles.selectItemText}>{language}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={closeModal}
                  testID="cancel-button"
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  testID="save-button"
                >
                  <Text style={styles.saveButtonText}>
                    {editingMember ? 'Güncelle' : 'Ekle'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 15,
    color: Colors.text,
  },
  countContainer: {
    marginBottom: 16,
  },
  countText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  membersList: {
    flex: 1,
  },
  membersListContent: {
    paddingBottom: 100,
    gap: 16,
  },
  memberCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  memberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  memberTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  memberDetails: {
    gap: 8,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  expertiseSection: {
    marginBottom: 12,
  },
  languagesSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.primary + '30',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: Colors.primaryLight,
    fontWeight: '500' as const,
  },
  languageTag: {
    backgroundColor: Colors.secondary + '30',
  },
  languageTagText: {
    color: Colors.secondary,
  },
  memberActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  editBtn: {
    backgroundColor: Colors.info + '15',
    borderWidth: 1,
    borderColor: Colors.info + '30',
  },
  deleteBtn: {
    backgroundColor: Colors.error + '15',
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 15,
    color: Colors.text,
  },
  availabilityOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  availabilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  availabilityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  availabilityText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectButtonText: {
    fontSize: 15,
    color: Colors.text,
  },
  selectDropdown: {
    marginTop: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 200,
  },
  selectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  selectItemText: {
    fontSize: 14,
    color: Colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 30,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primaryDark,
  },
});
