import { useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const DEFAULT_RATE = 38.50;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface ExchangeRateState {
  rate: number;
  lastUpdated: Date | null;
  isLoading: boolean;
  isError: boolean;
  fetchRate: () => void;
  convertToTRY: (usdAmount: number) => number;
  convertToUSD: (tryAmount: number) => number;
  formatTRY: (usdAmount: number) => string;
  formatUSD: (amount: number) => string;
  formattedRate: string;
  lastUpdatedText: string;
}

const fetchExchangeRateFromAPI = async (): Promise<number> => {
  console.log('[ExchangeRate] Fetching exchange rate...');
  
  // Primary API: Frankfurter
  try {
    const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=TRY', {
      headers: { 'Accept': 'application/json' },
    });
    if (response.ok) {
      const data = await response.json();
      if (data?.rates?.TRY) {
        console.log('[ExchangeRate] Frankfurter rate:', data.rates.TRY);
        return data.rates.TRY;
      }
    }
  } catch (error) {
    console.log('[ExchangeRate] Frankfurter API failed:', error);
  }

  // Backup API: ExchangeRate-API
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (response.ok) {
      const data = await response.json();
      if (data?.rates?.TRY) {
        console.log('[ExchangeRate] ER-API rate:', data.rates.TRY);
        return data.rates.TRY;
      }
    }
  } catch (error) {
    console.log('[ExchangeRate] ER-API failed:', error);
  }

  // Fallback to default
  console.log('[ExchangeRate] Using fallback rate:', DEFAULT_RATE);
  return DEFAULT_RATE;
};

export const [ExchangeRateProvider, useExchangeRate] = createContextHook((): ExchangeRateState => {
  const queryClient = useQueryClient();
  
  const { data: rate = DEFAULT_RATE, isLoading, isError, dataUpdatedAt } = useQuery({
    queryKey: ['exchangeRate'],
    queryFn: fetchExchangeRateFromAPI,
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION * 2,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const refreshMutation = useMutation({
    mutationFn: fetchExchangeRateFromAPI,
    onSuccess: (newRate) => {
      queryClient.setQueryData(['exchangeRate'], newRate);
      console.log('[ExchangeRate] Rate refreshed:', newRate);
    },
  });

  const { mutate: refreshRate, isPending: isRefreshing } = refreshMutation;

  const fetchRate = useCallback(() => {
    refreshRate();
  }, [refreshRate]);

  const convertToTRY = useCallback((usdAmount: number): number => {
    return usdAmount * rate;
  }, [rate]);

  const convertToUSD = useCallback((tryAmount: number): number => {
    return tryAmount / rate;
  }, [rate]);

  const formatTRY = useCallback((usdAmount: number): string => {
    const tryAmount = usdAmount * rate;
    return `₺${tryAmount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`;
  }, [rate]);

  const formatUSD = useCallback((amount: number): string => {
    return `$${amount.toLocaleString('en-US')}`;
  }, []);

  const formattedRate = `1 USD = ₺${rate.toFixed(2)}`;

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;
  
  const lastUpdatedText = lastUpdated
    ? lastUpdated.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return {
    rate,
    lastUpdated,
    isLoading: isLoading || isRefreshing,
    isError,
    fetchRate,
    convertToTRY,
    convertToUSD,
    formatTRY,
    formatUSD,
    formattedRate,
    lastUpdatedText,
  };
});
