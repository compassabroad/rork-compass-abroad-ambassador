import React, { useState, useMemo } from 'react';
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
import { X, DollarSign, CreditCard, Building2, AlertCircle, CheckCircle, ChevronDown, User, Plus, Save } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useExchangeRate } from '@/contexts/ExchangeRateContext';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { SavedIban } from '@/types';

interface PaymentRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (request: WithdrawalRequest) => void;
}

export interface WithdrawalRequest {
  amount: number;
  currency: 'USD' | 'TRY';
  iban: string;
  bankName: string;
  accountHolder: string;
}

const BANKS = [
  'Ziraat Bankası',
  'İş Bankası',
  'Garanti BBVA',
  'Yapı Kredi',
  'Akbank',
  'QNB Finansbank',
  'Denizbank',
  'Vakıfbank',
  'Halkbank',
  'TEB',
  'ING',
  'HSBC',
];

export default function PaymentRequestModal({ visible, onClose, onSubmit }: PaymentRequestModalProps) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'TRY'>('USD');
  const [bankName, setBankName] = useState('');
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [selectedIbanId, setSelectedIbanId] = useState<string | 'new'>('');
  const [showIbanPicker, setShowIbanPicker] = useState(false);
  const [newIban, setNewIban] = useState('');
  const [ibanError, setIbanError] = useState('');
  const [showSaveIbanPrompt, setShowSaveIbanPrompt] = useState(false);
  
  const { rate: exchangeRate, formattedRate } = useExchangeRate();

  const { user, token } = useAuth();

  const bankAccountsQuery = trpc.bankAccounts.list.useQuery(
    { token: token || '' },
    { enabled: !!token && visible }
  );

  const overviewQuery = trpc.finances.getOverview.useQuery(
    { token: token || '' },
    { enabled: !!token && visible }
  );

  const availableUSD = overviewQuery.data?.availableUSD ?? 0;
  const availableTRY = availableUSD * exchangeRate;
  const savedIbans = useMemo<SavedIban[]>(() => {
    return (bankAccountsQuery.data ?? []).filter((a: any) => a.status === 'approved').map((a: any) => ({
      id: a.id,
      iban: a.iban,
      bankName: a.bankName,
      isDefault: a.isDefault,
      status: a.status,
      submittedAt: a.submittedAt,
      approvedAt: a.approvedAt,
    }));
  }, [bankAccountsQuery.data]);
  const accountHolderName = user ? `${user.firstName} ${user.lastName}` : '';

  const selectedSavedIban = useMemo(() => {
    if (selectedIbanId && selectedIbanId !== 'new') {
      return savedIbans.find(i => i.id === selectedIbanId);
    }
    return null;
  }, [selectedIbanId, savedIbans]);

  const resetForm = () => {
    setAmount('');
    setCurrency('USD');
    setBankName('');
    setShowBankPicker(false);
    setSelectedIbanId('');
    setShowIbanPicker(false);
    setNewIban('');
    setIbanError('');
    setShowSaveIbanPrompt(false);
  };

  const formatIbanDisplay = (iban: string) => {
    const cleaned = iban.replace(/\s/g, '');
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatIbanInput = (text: string) => {
    let cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (cleaned.length > 0 && !cleaned.startsWith('TR')) {
      if (cleaned.startsWith('T')) {
        cleaned = 'T' + cleaned.slice(1);
      } else {
        cleaned = 'TR' + cleaned;
      }
    }
    
    if (cleaned.length > 26) {
      cleaned = cleaned.slice(0, 26);
    }
    
    return cleaned;
  };

  const validateIban = (iban: string): boolean => {
    const cleaned = iban.replace(/\s/g, '');
    
    if (cleaned.length !== 26) {
      setIbanError('IBAN 26 karakter olmalıdır');
      return false;
    }
    
    if (!cleaned.startsWith('TR')) {
      setIbanError('IBAN "TR" ile başlamalıdır');
      return false;
    }
    
    const afterTR = cleaned.slice(2);
    if (!/^\d+$/.test(afterTR)) {
      setIbanError('TR sonrası sadece rakam olmalıdır');
      return false;
    }
    
    setIbanError('');
    return true;
  };

  const handleIbanChange = (text: string) => {
    const formatted = formatIbanInput(text);
    setNewIban(formatted);
    
    if (formatted.length === 26) {
      validateIban(formatted);
    } else {
      setIbanError('');
    }
  };

  const getAvailableBalance = () => {
    return currency === 'USD' ? availableUSD : availableTRY;
  };

  const formatCurrency = (value: number, curr: 'USD' | 'TRY') => {
    if (curr === 'USD') {
      return `$${value.toLocaleString('en-US')}`;
    }
    return `₺${value.toLocaleString('tr-TR')}`;
  };

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setAmount(cleaned);
  };

  const getCurrentIban = (): string => {
    if (selectedSavedIban) {
      return selectedSavedIban.iban;
    }
    if (selectedIbanId === 'new') {
      return newIban;
    }
    return '';
  };

  const getCurrentBankName = (): string => {
    if (selectedSavedIban) {
      return selectedSavedIban.bankName;
    }
    return bankName;
  };

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir tutar girin');
      return;
    }

    if (numAmount > getAvailableBalance()) {
      Alert.alert('Hata', 'Çekim tutarı mevcut bakiyenizi aşamaz');
      return;
    }

    if (numAmount < (currency === 'USD' ? 50 : 1000)) {
      Alert.alert('Hata', `Minimum çekim tutarı ${currency === 'USD' ? '$50' : '₺1000'}`);
      return;
    }

    if (!accountHolderName) {
      Alert.alert('Hata', 'Hesap sahibi bilgisi eksik. Lütfen profil sayfasından güncelleyin.');
      return;
    }

    const currentIban = getCurrentIban();
    if (!currentIban) {
      Alert.alert('Hata', 'Lütfen bir IBAN seçin veya yeni IBAN girin');
      return;
    }

    if (selectedIbanId === 'new' && !validateIban(newIban)) {
      return;
    }

    const currentBankName = getCurrentBankName();
    if (!currentBankName) {
      Alert.alert('Hata', 'Lütfen banka seçin');
      return;
    }

    if (selectedIbanId === 'new' && !showSaveIbanPrompt) {
      setShowSaveIbanPrompt(true);
      return;
    }

    onSubmit({
      amount: numAmount,
      currency,
      iban: currentIban,
      bankName: currentBankName,
      accountHolder: accountHolderName,
    });

    resetForm();
    onClose();
    Alert.alert(
      'Talep Gönderildi',
      `${formatCurrency(numAmount, currency)} çekim talebiniz alındı. 3-5 iş günü içinde hesabınıza aktarılacaktır.`
    );
  };

  const handleSaveIbanChoice = (save: boolean) => {
    setShowSaveIbanPrompt(false);
    if (save) {
      console.log('Saving new IBAN:', newIban, bankName);
    }
    
    const numAmount = parseFloat(amount);
    onSubmit({
      amount: numAmount,
      currency,
      iban: newIban,
      bankName,
      accountHolder: accountHolderName,
    });

    resetForm();
    onClose();
    Alert.alert(
      'Talep Gönderildi',
      `${formatCurrency(numAmount, currency)} çekim talebiniz alındı. 3-5 iş günü içinde hesabınıza aktarılacaktır.`
    );
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSelectSavedIban = (iban: SavedIban) => {
    setSelectedIbanId(iban.id);
    setBankName(iban.bankName);
    setShowIbanPicker(false);
    setNewIban('');
    setIbanError('');
  };

  const handleSelectNewIban = () => {
    setSelectedIbanId('new');
    setShowIbanPicker(false);
    setBankName('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Ödeme Talebi</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Çekilebilir Bakiye ({formattedRate})</Text>
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceCurrency}>USD</Text>
                <Text style={styles.balanceValue}>{formatCurrency(availableUSD, 'USD')}</Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceItem}>
                <Text style={styles.balanceCurrency}>TRY</Text>
                <Text style={styles.balanceValue}>{formatCurrency(availableTRY, 'TRY')}</Text>
              </View>
            </View>
          </View>

          <View style={styles.currencySelector}>
            <Text style={styles.sectionLabel}>Para Birimi</Text>
            <View style={styles.currencyButtons}>
              <TouchableOpacity
                style={[styles.currencyButton, currency === 'USD' && styles.currencyButtonActive]}
                onPress={() => setCurrency('USD')}
              >
                <DollarSign size={18} color={currency === 'USD' ? Colors.primaryDark : Colors.textSecondary} />
                <Text style={[styles.currencyButtonText, currency === 'USD' && styles.currencyButtonTextActive]}>
                  USD
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.currencyButton, currency === 'TRY' && styles.currencyButtonActive]}
                onPress={() => setCurrency('TRY')}
              >
                <Text style={[styles.currencySymbol, currency === 'TRY' && styles.currencySymbolActive]}>₺</Text>
                <Text style={[styles.currencyButtonText, currency === 'TRY' && styles.currencyButtonTextActive]}>
                  TRY
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.sectionLabel}>Çekim Tutarı</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.amountPrefix}>{currency === 'USD' ? '$' : '₺'}</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
              />
            </View>
            <Text style={styles.inputHint}>
              Min: {currency === 'USD' ? '$50' : '₺1,000'} | Max: {formatCurrency(getAvailableBalance(), currency)}
              {currency === 'USD' && amount && !isNaN(parseFloat(amount)) && (
                <Text style={styles.inputHintTRY}>
                  {' '}≈ ₺{(parseFloat(amount) * exchangeRate).toLocaleString('tr-TR')}
                </Text>
              )}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <User size={18} color={Colors.secondary} />
              <Text style={styles.sectionLabel}>Ad Soyad</Text>
            </View>
            <View style={styles.nameDisplay}>
              <Text style={styles.nameText}>{accountHolderName}</Text>
            </View>
            <Text style={styles.nameHint}>İsim değişikliği için Profil sayfasından talep oluşturun</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <CreditCard size={18} color={Colors.secondary} />
              <Text style={styles.sectionLabel}>IBAN</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.ibanSelector} 
              onPress={() => setShowIbanPicker(!showIbanPicker)}
            >
              <Text style={selectedIbanId ? styles.ibanSelectorText : styles.ibanSelectorPlaceholder}>
                {selectedSavedIban 
                  ? `${selectedSavedIban.bankName} - ${formatIbanDisplay(selectedSavedIban.iban)}`
                  : selectedIbanId === 'new'
                    ? 'Yeni IBAN Girişi'
                    : 'IBAN Seçin'}
              </Text>
              <ChevronDown size={20} color={Colors.textSecondary} />
            </TouchableOpacity>

            {showIbanPicker && (
              <View style={styles.ibanOptions}>
                {savedIbans.length > 0 && (
                  <>
                    <Text style={styles.ibanOptionsTitle}>Kayıtlı IBAN&apos;lar</Text>
                    {savedIbans.map((iban) => (
                      <TouchableOpacity
                        key={iban.id}
                        style={[styles.ibanOption, selectedIbanId === iban.id && styles.ibanOptionSelected]}
                        onPress={() => handleSelectSavedIban(iban)}
                      >
                        <View style={styles.ibanOptionContent}>
                          <Text style={[styles.ibanOptionBank, selectedIbanId === iban.id && styles.ibanOptionTextSelected]}>
                            {iban.bankName}
                          </Text>
                          <Text style={[styles.ibanOptionNumber, selectedIbanId === iban.id && styles.ibanOptionTextSelected]}>
                            {formatIbanDisplay(iban.iban)}
                          </Text>
                        </View>
                        {iban.isDefault && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Varsayılan</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </>
                )}
                <TouchableOpacity
                  style={[styles.ibanOption, styles.newIbanOption, selectedIbanId === 'new' && styles.ibanOptionSelected]}
                  onPress={handleSelectNewIban}
                >
                  <Plus size={18} color={selectedIbanId === 'new' ? Colors.secondary : Colors.textSecondary} />
                  <Text style={[styles.newIbanText, selectedIbanId === 'new' && styles.ibanOptionTextSelected]}>
                    Yeni IBAN Gir
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {selectedIbanId === 'new' && (
              <View style={styles.newIbanInput}>
                <TextInput
                  style={[styles.ibanTextInput, ibanError ? styles.ibanTextInputError : null]}
                  value={formatIbanDisplay(newIban)}
                  onChangeText={handleIbanChange}
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="characters"
                  maxLength={32}
                />
                {ibanError ? (
                  <View style={styles.ibanErrorContainer}>
                    <AlertCircle size={14} color={Colors.error} />
                    <Text style={styles.ibanErrorText}>{ibanError}</Text>
                  </View>
                ) : newIban.length === 26 ? (
                  <View style={styles.ibanSuccessContainer}>
                    <CheckCircle size={14} color={Colors.success} />
                    <Text style={styles.ibanSuccessText}>IBAN formatı geçerli</Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>

          {(selectedIbanId === 'new' || !selectedSavedIban) && (
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Building2 size={18} color={Colors.secondary} />
                <Text style={styles.sectionLabel}>Banka</Text>
              </View>
              <TouchableOpacity 
                style={styles.bankSelector} 
                onPress={() => setShowBankPicker(!showBankPicker)}
              >
                <Text style={bankName ? styles.bankText : styles.bankPlaceholder}>
                  {bankName || 'Banka seçin'}
                </Text>
                <ChevronDown size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
              {showBankPicker && (
                <ScrollView style={styles.bankOptions} nestedScrollEnabled>
                  {BANKS.map((bank) => (
                    <TouchableOpacity
                      key={bank}
                      style={[styles.bankOption, bankName === bank && styles.bankOptionSelected]}
                      onPress={() => {
                        setBankName(bank);
                        setShowBankPicker(false);
                      }}
                    >
                      <Text style={[styles.bankOptionText, bankName === bank && styles.bankOptionTextSelected]}>
                        {bank}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          <View style={styles.infoCard}>
            <AlertCircle size={18} color={Colors.info} />
            <Text style={styles.infoText}>
              Ödeme talepleri 3-5 iş günü içinde işleme alınır. Hafta sonu ve resmi tatillerde işlem yapılmaz.
            </Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>İptal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Talep Gönder</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showSaveIbanPrompt} transparent animationType="fade">
          <View style={styles.saveIbanOverlay}>
            <View style={styles.saveIbanModal}>
              <Save size={32} color={Colors.secondary} />
              <Text style={styles.saveIbanTitle}>IBAN&apos;ı Kaydet</Text>
              <Text style={styles.saveIbanMessage}>
                Bu IBAN&apos;ı gelecekte kullanmak üzere kaydetmek ister misiniz?
              </Text>
              <View style={styles.saveIbanButtons}>
                <TouchableOpacity 
                  style={styles.saveIbanButtonNo} 
                  onPress={() => handleSaveIbanChoice(false)}
                >
                  <Text style={styles.saveIbanButtonNoText}>Hayır</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveIbanButtonYes} 
                  onPress={() => handleSaveIbanChoice(true)}
                >
                  <Text style={styles.saveIbanButtonYesText}>Evet, Kaydet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  content: {
    flex: 1,
    padding: 20,
  },
  balanceCard: {
    backgroundColor: Colors.primary + '30',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  balanceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceCurrency: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.secondary,
  },
  balanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: 20,
  },
  currencySelector: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  currencyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  currencyButton: {
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
  currencyButtonActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  currencyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  currencyButtonTextActive: {
    color: Colors.primaryDark,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  currencySymbolActive: {
    color: Colors.primaryDark,
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
  },
  amountPrefix: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: Colors.secondary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600' as const,
    color: Colors.text,
    paddingVertical: 16,
  },
  inputHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
  },
  inputHintTRY: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '600' as const,
  },
  nameDisplay: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    opacity: 0.7,
  },
  nameText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  nameHint: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
    fontStyle: 'italic',
  },
  ibanSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ibanSelectorText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  ibanSelectorPlaceholder: {
    fontSize: 14,
    color: Colors.textMuted,
    flex: 1,
  },
  ibanOptions: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  ibanOptionsTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    padding: 12,
    paddingBottom: 8,
    backgroundColor: Colors.surface,
  },
  ibanOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ibanOptionSelected: {
    backgroundColor: Colors.primary + '30',
  },
  ibanOptionContent: {
    flex: 1,
  },
  ibanOptionBank: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  ibanOptionNumber: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  ibanOptionTextSelected: {
    color: Colors.secondary,
  },
  defaultBadge: {
    backgroundColor: Colors.secondary + '30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.secondary,
  },
  newIbanOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  newIbanText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  newIbanInput: {
    marginTop: 12,
  },
  ibanTextInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 14,
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
  },
  ibanTextInputError: {
    borderColor: Colors.error,
  },
  ibanErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  ibanErrorText: {
    fontSize: 12,
    color: Colors.error,
  },
  ibanSuccessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  ibanSuccessText: {
    fontSize: 12,
    color: Colors.success,
  },
  bankSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bankText: {
    fontSize: 16,
    color: Colors.text,
  },
  bankPlaceholder: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  bankOptions: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 200,
  },
  bankOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  bankOptionSelected: {
    backgroundColor: Colors.primary + '30',
  },
  bankOptionText: {
    fontSize: 15,
    color: Colors.text,
  },
  bankOptionTextSelected: {
    color: Colors.secondary,
    fontWeight: '600' as const,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.info + '15',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.info + '30',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.info,
    lineHeight: 20,
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
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primaryDark,
  },
  saveIbanOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  saveIbanModal: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  saveIbanTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  saveIbanMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  saveIbanButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  saveIbanButtonNo: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  saveIbanButtonNoText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  saveIbanButtonYes: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
  },
  saveIbanButtonYesText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primaryDark,
  },
});
