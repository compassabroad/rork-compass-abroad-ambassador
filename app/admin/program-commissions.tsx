import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  DollarSign,
  RefreshCw,
  Save,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Star,
  Clock,
  Globe,
  FileText,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/colors';
import { useExchangeRate } from '@/contexts/ExchangeRateContext';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';

interface ProgramEditState {
  commission: number;
  points: number;
  description: string;
  duration: string;
  countries: string;
}

export default function ProgramCommissionsScreen() {
  const router = useRouter();
  const { rate: exchangeRate, formattedRate } = useExchangeRate();
  const { token } = useAuth();

  const programCommissionsQuery = trpc.admin.getProgramCommissions.useQuery(
    { token: token || '' },
    { enabled: !!token }
  );
  const updateProgramMutation = trpc.admin.updateProgram.useMutation();

  const programs = React.useMemo(() => programCommissionsQuery.data ?? [], [programCommissionsQuery.data]);

  const [editStates, setEditStates] = useState<Record<string, ProgramEditState>>({});
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  React.useEffect(() => {
    if (programs.length > 0) {
      const initial: Record<string, ProgramEditState> = {};
      programs.forEach((pc: any) => {
        initial[pc.programId] = {
          commission: pc.defaultCommissionUSD,
          points: pc.points ?? 0,
          description: pc.description ?? '',
          duration: pc.duration ?? '',
          countries: Array.isArray(pc.countries) ? pc.countries.join(', ') : '',
        };
      });
      setEditStates(initial);
    }
  }, [programs]);

  const updateField = useCallback((programId: string, field: keyof ProgramEditState, value: string | number) => {
    setEditStates(prev => ({
      ...prev,
      [programId]: {
        ...prev[programId],
        [field]: value,
      },
    }));
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(() => {
    Alert.alert('Değişiklikleri Kaydet', 'Tüm program bilgilerini kaydetmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Kaydet',
        onPress: async () => {
          try {
            for (const [programId, state] of Object.entries(editStates)) {
              await updateProgramMutation.mutateAsync({
                token: token || '',
                programId,
                defaultCommissionUSD: state.commission,
                points: state.points,
                description: state.description,
                duration: state.duration,
                countries: state.countries.split(',').map(c => c.trim()).filter(Boolean),
              });
            }
            setHasChanges(false);
            programCommissionsQuery.refetch();
            Alert.alert('Başarılı', 'Program bilgileri kaydedildi.');
          } catch (error: any) {
            Alert.alert('Hata', error.message || 'Kaydetme başarısız');
          }
        },
      },
    ]);
  }, [editStates, token, updateProgramMutation, programCommissionsQuery]);

  const handleReset = useCallback(() => {
    Alert.alert('Varsayılana Sıfırla', 'Tüm değişiklikleri geri almak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sıfırla',
        style: 'destructive',
        onPress: () => {
          const initial: Record<string, ProgramEditState> = {};
          programs.forEach((pc: any) => {
            initial[pc.programId] = {
              commission: pc.defaultCommissionUSD,
              points: pc.points ?? 0,
              description: pc.description ?? '',
              duration: pc.duration ?? '',
              countries: Array.isArray(pc.countries) ? pc.countries.join(', ') : '',
            };
          });
          setEditStates(initial);
          setHasChanges(false);
        },
      },
    ]);
  }, [programs]);

  const renderProgramItem = (program: any) => {
    const state = editStates[program.programId];
    if (!state) return null;

    const tryValue = state.commission * exchangeRate;
    const isExpanded = expandedProgram === program.programId;

    return (
      <View key={program.programId} style={styles.programCard}>
        <TouchableOpacity
          style={styles.programHeader}
          onPress={() => setExpandedProgram(isExpanded ? null : program.programId)}
          activeOpacity={0.7}
        >
          <View style={styles.programIconContainer}>
            <DollarSign color={Colors.secondary} size={20} />
          </View>
          <View style={styles.programInfo}>
            <Text style={styles.programName}>{program.programName}</Text>
            <Text style={styles.programNameEn}>{program.programNameEn}</Text>
          </View>
          {isExpanded ? (
            <ChevronUp color={Colors.textMuted} size={20} />
          ) : (
            <ChevronDown color={Colors.textMuted} size={20} />
          )}
        </TouchableOpacity>

        <View style={styles.commissionInputs}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>USD</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencyPrefix}>$</Text>
              <TextInput
                style={styles.commissionInput}
                value={state.commission.toString()}
                onChangeText={(value) => {
                  const numValue = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
                  updateField(program.programId, 'commission', numValue);
                }}
                keyboardType="numeric"
                testID={`commission-${program.programId}`}
              />
            </View>
          </View>
          <View style={styles.inputDivider}>
            <TrendingUp color={Colors.textMuted} size={16} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>TRY</Text>
            <View style={[styles.inputWrapper, styles.tryWrapper]}>
              <Text style={styles.currencyPrefix}>₺</Text>
              <Text style={styles.tryValue}>{tryValue.toLocaleString('tr-TR')}</Text>
            </View>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.expandedSection}>
            <View style={styles.expandedRow}>
              <View style={styles.expandedIconLabel}>
                <Star color={Colors.secondary} size={16} />
                <Text style={styles.expandedLabel}>Compass Points</Text>
              </View>
              <TextInput
                style={styles.expandedInput}
                value={state.points.toString()}
                onChangeText={(value) => {
                  const numValue = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
                  updateField(program.programId, 'points', numValue);
                }}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.expandedRow}>
              <View style={styles.expandedIconLabel}>
                <Clock color={Colors.info} size={16} />
                <Text style={styles.expandedLabel}>Süre</Text>
              </View>
              <TextInput
                style={styles.expandedInput}
                value={state.duration}
                onChangeText={(value) => updateField(program.programId, 'duration', value)}
                placeholder="Örn: 6 ay"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.expandedRow}>
              <View style={styles.expandedIconLabel}>
                <Globe color={Colors.success} size={16} />
                <Text style={styles.expandedLabel}>Ülkeler (virgülle ayırın)</Text>
              </View>
              <TextInput
                style={[styles.expandedInput, styles.expandedInputWide]}
                value={state.countries}
                onChangeText={(value) => updateField(program.programId, 'countries', value)}
                placeholder="ABD, İngiltere, Kanada"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.expandedDescriptionRow}>
              <View style={styles.expandedIconLabel}>
                <FileText color={Colors.primaryLight} size={16} />
                <Text style={styles.expandedLabel}>Açıklama</Text>
              </View>
              <TextInput
                style={[styles.expandedInput, styles.expandedInputMultiline]}
                value={state.description}
                onChangeText={(value) => updateField(program.programId, 'description', value)}
                placeholder="Program açıklaması..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        )}
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
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} testID="back-button">
              <ArrowLeft color={Colors.text} size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Program Yönetimi</Text>
            <View style={styles.headerPlaceholder} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.exchangeRateBar}>
        <Text style={styles.exchangeRateLabel}>Canlı Kur:</Text>
        <Text style={styles.exchangeRateValue}>{formattedRate}</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionDescription}>
          Her program için komisyon, puan, açıklama, süre ve ülke bilgilerini düzenleyebilirsiniz.
          Detayları görmek için programa dokunun.
        </Text>

        {programCommissionsQuery.isLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 40 }} />
        ) : (
          programs.map(renderProgramItem)
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, styles.resetButton]} onPress={handleReset} testID="reset-button">
            <RefreshCw color={Colors.text} size={20} />
            <Text style={styles.resetButtonText}>Sıfırla</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!hasChanges || updateProgramMutation.isPending}
            testID="save-button"
          >
            {updateProgramMutation.isPending ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Save color={hasChanges ? '#000' : Colors.textMuted} size={20} />
                <Text style={[styles.saveButtonText, !hasChanges && styles.saveButtonTextDisabled]}>Kaydet</Text>
              </>
            )}
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
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerPlaceholder: {
    width: 44,
  },
  exchangeRateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  exchangeRateLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  exchangeRateValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.secondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
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
    marginBottom: 16,
  },
  programIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
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
  programNameEn: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  commissionInputs: {
    flexDirection: 'row',
    alignItems: 'center',
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
  tryValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  inputDivider: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  expandedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  expandedIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  expandedLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  expandedInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 100,
    textAlign: 'right' as const,
  },
  expandedInputWide: {
    flex: 1,
    marginLeft: 12,
    textAlign: 'left' as const,
  },
  expandedDescriptionRow: {
    marginBottom: 8,
  },
  expandedInputMultiline: {
    marginTop: 8,
    minHeight: 70,
    textAlign: 'left' as const,
    textAlignVertical: 'top' as const,
    width: '100%',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  resetButton: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.secondary,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#000',
  },
  saveButtonTextDisabled: {
    color: Colors.textMuted,
  },
});
