import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import {
  ArrowLeft,
  Save,
  Award,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/colors';
import { useExchangeRate } from '@/contexts/ExchangeRateContext';
import {
  PROGRAMS,
  MOCK_PROGRAM_COMMISSIONS,
  MOCK_AMBASSADOR_COMMISSIONS,
  getAmbassadorById,
} from '@/mocks/data';
import { AMBASSADOR_TYPE_LABELS, ProgramType } from '@/types';

interface CommissionOverride {
  customValue: number | null;
  useCustom: boolean;
}

interface CommissionState {
  [programId: string]: CommissionOverride;
}

export default function AmbassadorCommissionsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ambassador = getAmbassadorById(id || '');
  const { rate: exchangeRate } = useExchangeRate();

  const initialState = useMemo(() => {
    const state: CommissionState = {};
    PROGRAMS.forEach(program => {
      const existing = MOCK_AMBASSADOR_COMMISSIONS.find(
        ac => ac.ambassadorId === id && ac.programId === program.id
      );
      state[program.id] = {
        customValue: existing?.customCommissionUSD ?? null,
        useCustom: existing?.useCustom ?? false,
      };
    });
    return state;
  }, [id]);

  const [commissions, setCommissions] = useState<CommissionState>(initialState);
  const [hasChanges, setHasChanges] = useState(false);

  const getDefaultCommission = useCallback((programId: ProgramType): number => {
    const pc = MOCK_PROGRAM_COMMISSIONS.find(p => p.programId === programId);
    return pc?.defaultCommissionUSD ?? 0;
  }, []);

  const handleToggleCustom = useCallback((programId: string, value: boolean) => {
    setCommissions(prev => ({
      ...prev,
      [programId]: {
        ...prev[programId],
        useCustom: value,
        customValue: value ? (prev[programId].customValue || getDefaultCommission(programId as ProgramType)) : prev[programId].customValue,
      },
    }));
    setHasChanges(true);
  }, [getDefaultCommission]);

  const handleCommissionChange = useCallback((programId: string, value: string) => {
    const numValue = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
    setCommissions(prev => ({
      ...prev,
      [programId]: {
        ...prev[programId],
        customValue: numValue,
      },
    }));
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(() => {
    Alert.alert(
      'Değişiklikleri Kaydet',
      `${ambassador?.name} için komisyon ayarlarını kaydetmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaydet',
          onPress: () => {
            console.log('Saving ambassador commissions:', { ambassadorId: id, commissions });
            setHasChanges(false);
            Alert.alert('Başarılı', 'Komisyon ayarları kaydedildi.');
          },
        },
      ]
    );
  }, [ambassador, id, commissions]);

  if (!ambassador) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Elçi bulunamadı</Text>
          <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
            <Text style={styles.errorButtonText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderProgramItem = (program: (typeof PROGRAMS)[0]) => {
    const state = commissions[program.id];
    const defaultCommission = getDefaultCommission(program.id);
    const currentCommission = state.useCustom
      ? (state.customValue ?? defaultCommission)
      : defaultCommission;
    const tryValue = currentCommission * exchangeRate;

    return (
      <View key={program.id} style={styles.programCard}>
        <View style={styles.programHeader}>
          <View style={styles.programInfo}>
            <Text style={styles.programName}>{program.name}</Text>
            <Text style={styles.defaultCommission}>
              Varsayılan: ${defaultCommission}
            </Text>
          </View>
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Özel</Text>
            <Switch
              value={state.useCustom}
              onValueChange={(value) => handleToggleCustom(program.id, value)}
              trackColor={{ false: Colors.border, true: Colors.secondary + '60' }}
              thumbColor={state.useCustom ? Colors.secondary : Colors.textMuted}
              testID={`toggle-${program.id}`}
            />
          </View>
        </View>

        <View style={styles.commissionRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Komisyon (USD)</Text>
            <View
              style={[
                styles.inputWrapper,
                !state.useCustom && styles.inputDisabled,
              ]}
            >
              <Text style={styles.currencyPrefix}>$</Text>
              <TextInput
                style={[
                  styles.commissionInput,
                  !state.useCustom && styles.inputTextDisabled,
                ]}
                value={state.useCustom ? (state.customValue?.toString() || '') : defaultCommission.toString()}
                onChangeText={(value) => handleCommissionChange(program.id, value)}
                keyboardType="numeric"
                editable={state.useCustom}
                testID={`input-${program.id}`}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>TRY Karşılığı</Text>
            <View style={[styles.inputWrapper, styles.tryWrapper]}>
              <Text style={styles.currencyPrefix}>₺</Text>
              <Text style={styles.tryValue}>
                {tryValue.toLocaleString('tr-TR')}
              </Text>
            </View>
          </View>
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
            <Text style={styles.headerTitle}>Elçi Komisyonları</Text>
            <View style={styles.headerPlaceholder} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.ambassadorHeader}>
        <View style={styles.ambassadorAvatar}>
          <Text style={styles.ambassadorAvatarText}>
            {ambassador.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        <View style={styles.ambassadorInfo}>
          <Text style={styles.ambassadorName}>{ambassador.name}</Text>
          <Text style={styles.ambassadorEmail}>{ambassador.email}</Text>
          <View style={styles.ambassadorMeta}>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: AMBASSADOR_TYPE_LABELS[ambassador.type].color + '30' },
              ]}
            >
              <Award
                color={AMBASSADOR_TYPE_LABELS[ambassador.type].color}
                size={14}
              />
              <Text
                style={[
                  styles.typeBadgeText,
                  { color: AMBASSADOR_TYPE_LABELS[ambassador.type].color },
                ]}
              >
                {AMBASSADOR_TYPE_LABELS[ambassador.type].tr}
              </Text>
            </View>
            <Text style={styles.ambassadorCode}>{ambassador.referralCode}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionDescription}>
          Bu elçi için program bazlı özel komisyon oranları belirleyebilirsiniz.
          Özel oran belirlenmediğinde varsayılan sistem oranları uygulanır.
        </Text>

        {PROGRAMS.map(renderProgramItem)}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            !hasChanges && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!hasChanges}
          testID="save-button"
        >
          <Save color={hasChanges ? '#000' : Colors.textMuted} size={20} />
          <Text
            style={[
              styles.saveButtonText,
              !hasChanges && styles.saveButtonTextDisabled,
            ]}
          >
            Değişiklikleri Kaydet
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
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
  headerPlaceholder: {
    width: 44,
  },
  ambassadorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ambassadorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  ambassadorAvatarText: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  ambassadorInfo: {
    flex: 1,
  },
  ambassadorName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  ambassadorEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  ambassadorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  ambassadorCode: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  programCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  defaultCommission: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  commissionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputDisabled: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: 'transparent',
  },
  tryWrapper: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: 'transparent',
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginRight: 6,
  },
  commissionInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    padding: 0,
  },
  inputTextDisabled: {
    color: Colors.textMuted,
  },
  tryValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000',
  },
  saveButtonTextDisabled: {
    color: Colors.textMuted,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});
