import React, { useState, useCallback } from 'react';
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
import { useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  DollarSign,
  RefreshCw,
  Save,
  TrendingUp,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/colors';
import { useExchangeRate } from '@/contexts/ExchangeRateContext';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';


interface CommissionState {
  [key: string]: number;
}

export default function ProgramCommissionsScreen() {
  const router = useRouter();
  const { rate: exchangeRate, formattedRate } = useExchangeRate();

  const { token } = useAuth();
  const programCommissionsQuery = trpc.admin.getProgramCommissions.useQuery(
    { token: token || '' },
    { enabled: !!token }
  );
  const updateMutation = trpc.admin.updateProgramCommission.useMutation();

  const programs = programCommissionsQuery.data ?? [];

  const [commissions, setCommissions] = useState<CommissionState>({});

  React.useEffect(() => {
    if (programs.length > 0) {
      const initial: CommissionState = {};
      programs.forEach((pc: any) => {
        initial[pc.programId] = pc.defaultCommissionUSD;
      });
      setCommissions(initial);
    }
  }, [programs]);
  const [hasChanges, setHasChanges] = useState(false);

  const handleCommissionChange = useCallback((programId: string, value: string) => {
    const numValue = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
    setCommissions(prev => ({
      ...prev,
      [programId]: numValue,
    }));
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(() => {
    Alert.alert(
      'Değişiklikleri Kaydet',
      'Komisyon oranlarını kaydetmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaydet',
          onPress: async () => {
            try {
              for (const [programId, amount] of Object.entries(commissions)) {
                await updateMutation.mutateAsync({ token: token || '', programId, commissionUSD: amount });
              }
              setHasChanges(false);
              programCommissionsQuery.refetch();
              Alert.alert('Başarılı', 'Komisyon oranları kaydedildi.');
            } catch (error: any) {
              Alert.alert('Hata', error.message || 'Kaydetme başarısız');
            }
          },
        },
      ]
    );
  }, [commissions, token, updateMutation, programCommissionsQuery]);

  const handleReset = useCallback(() => {
    Alert.alert(
      'Varsayılana Sıfırla',
      'Tüm komisyon oranlarını varsayılan değerlere sıfırlamak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: () => {
            const defaultCommissions: CommissionState = {};
            programs.forEach((p: any) => {
              defaultCommissions[p.programId] = p.defaultCommissionUSD;
            });
            setCommissions(defaultCommissions);
            setHasChanges(true);
          },
        },
      ]
    );
  }, [programs]);

  const getProgramIcon = (iconName: string) => {
    return <DollarSign color={Colors.secondary} size={20} />;
  };

  const renderProgramItem = (program: any) => {
    const currentCommission = commissions[program.programId] || program.defaultCommissionUSD;
    const tryValue = currentCommission * exchangeRate;

    return (
      <View key={program.programId} style={styles.programCard}>
        <View style={styles.programHeader}>
          <View style={styles.programIconContainer}>
            {getProgramIcon('')}
          </View>
          <View style={styles.programInfo}>
            <Text style={styles.programName}>{program.programName}</Text>
            <Text style={styles.programNameEn}>{program.programNameEn}</Text>
          </View>
        </View>
        <View style={styles.commissionInputs}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>USD</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencyPrefix}>$</Text>
              <TextInput
                style={styles.commissionInput}
                value={currentCommission.toString()}
                onChangeText={(value) => handleCommissionChange(program.programId, value)}
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
            <Text style={styles.headerTitle}>Program Komisyonları</Text>
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
          Her program için varsayılan komisyon oranlarını düzenleyebilirsiniz.
          Elçi bazlı özel oranlar için elçi detayına gidin.
        </Text>

        {programs.map(renderProgramItem)}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.resetButton]}
            onPress={handleReset}
            testID="reset-button"
          >
            <RefreshCw color={Colors.text} size={20} />
            <Text style={styles.resetButtonText}>Varsayılana Sıfırla</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
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
