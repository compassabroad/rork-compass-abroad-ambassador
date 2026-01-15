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
import { X, DollarSign, CreditCard, Building2, AlertCircle, CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useExchangeRate } from '@/contexts/ExchangeRateContext';
import { MOCK_EARNINGS, MOCK_CURRENT_AMBASSADOR } from '@/mocks/data';

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
  
  const { rate: exchangeRate, formattedRate } = useExchangeRate();

  const availableUSD = MOCK_EARNINGS.pendingUSD;
  const availableTRY = availableUSD * exchangeRate;
  const iban = MOCK_CURRENT_AMBASSADOR.iban || '';

  const resetForm = () => {
    setAmount('');
    setCurrency('USD');
    setBankName('');
    setShowBankPicker(false);
  };

  const formatIBAN = (iban: string) => {
    return iban.replace(/(.{4})/g, '$1 ').trim();
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

    if (!iban) {
      Alert.alert('Hata', 'IBAN bilginiz eksik. Lütfen profil sayfasından ekleyin.');
      return;
    }

    if (!bankName) {
      Alert.alert('Hata', 'Lütfen banka seçin');
      return;
    }

    onSubmit({
      amount: numAmount,
      currency,
      iban,
      bankName,
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
              <CreditCard size={18} color={Colors.secondary} />
              <Text style={styles.sectionLabel}>IBAN</Text>
            </View>
            {iban ? (
              <View style={styles.ibanDisplay}>
                <Text style={styles.ibanText}>{formatIBAN(iban)}</Text>
                <CheckCircle size={18} color={Colors.success} />
              </View>
            ) : (
              <View style={styles.ibanWarning}>
                <AlertCircle size={18} color={Colors.warning} />
                <Text style={styles.ibanWarningText}>IBAN bilginiz eksik. Profil sayfasından ekleyin.</Text>
              </View>
            )}
          </View>

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
            </TouchableOpacity>
            {showBankPicker && (
              <View style={styles.bankOptions}>
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
              </View>
            )}
          </View>

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
    fontWeight: '700',
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
    fontWeight: '600',
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
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  currencyButtonTextActive: {
    color: Colors.primaryDark,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
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
    fontWeight: '600',
    color: Colors.secondary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
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
  ibanDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ibanText: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
  },
  ibanWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.warning + '20',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.warning + '50',
  },
  ibanWarningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.warning,
  },
  bankSelector: {
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
    fontWeight: '600',
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
