import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { trpc } from '@/lib/trpc';

const AUTH_TOKEN_KEY = 'compass_auth_token';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  accountStatus: string;
  type: string;
  referralCode: string;
  city: string;
  compassPoints: number;
  profilePhoto: string | null;
  phone?: string;
  category?: string;
  subType?: string;
  companyName?: string | null;
  parentId?: string | null;
  networkCommissionRate?: number;
  kvkkConsent?: boolean;
  privacyPolicyConsent?: boolean;
  termsConsent?: boolean;
  createdAt?: string;
  studentsReferred?: number;
  bankAccountsCount?: number;
  subAmbassadorsCount?: number;
  birthDate?: string | null;
  tcIdentity?: string | null;
  pendingFirstName?: string | null;
  pendingLastName?: string | null;
}

interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  city: string;
  category: 'individual' | 'corporate';
  subType: string;
  companyName?: string;
  taxNumber?: string;
  taxOffice?: string;
  kvkkConsent: true;
  privacyPolicyConsent: true;
  termsConsent: true;
  parentReferralCode?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook((): AuthState => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();

  const fetchProfile = useCallback(async (authToken: string): Promise<AuthUser | null> => {
    try {
      console.log('[Auth] Fetching profile with token...');
      let baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
      if (!baseUrl) {
        if (typeof window !== 'undefined' && window.location?.origin) {
          baseUrl = window.location.origin;
        } else {
          console.error('[Auth] API base URL not configured');
          return null;
        }
      }

      const inputPayload = { json: { token: authToken } };
      const response = await fetch(
        `${baseUrl}/trpc/auth.me?input=${encodeURIComponent(JSON.stringify(inputPayload))}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const text = await response.text();
        console.error('[Auth] Profile fetch failed:', response.status, text.substring(0, 200));
        return null;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[Auth] Non-JSON response:', text.substring(0, 200));
        return null;
      }

      const data = await response.json();
      const result = data?.result?.data?.json ?? data?.result?.data;
      if (!result) {
        console.error('[Auth] Invalid profile response:', JSON.stringify(data).substring(0, 300));
        return null;
      }

      console.log('[Auth] Profile fetched successfully for:', result.email);
      return result as AuthUser;
    } catch (error) {
      console.error('[Auth] Error fetching profile:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('[Auth] Initializing auth...');
        const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

        if (!storedToken) {
          console.log('[Auth] No stored token found');
          setIsLoading(false);
          return;
        }

        console.log('[Auth] Found stored token, validating...');
        const profile = await fetchProfile(storedToken);

        if (profile) {
          setToken(storedToken);
          setUser(profile);
          console.log('[Auth] Auth restored for:', profile.email);
        } else {
          console.log('[Auth] Stored token invalid, clearing...');
          await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        }
      } catch (error) {
        console.error('[Auth] Init error:', error);
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    console.log('[Auth] Login attempt for:', email);
    const result = await loginMutation.mutateAsync({ email, password });

    await AsyncStorage.setItem(AUTH_TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user as AuthUser);
    console.log('[Auth] Login successful, status:', result.user.accountStatus);
  }, [loginMutation]);

  const register = useCallback(async (input: RegisterInput) => {
    console.log('[Auth] Register attempt for:', input.email);
    const result = await registerMutation.mutateAsync(input);
    console.log('[Auth] Registration result:', result.message);
    return result;
  }, [registerMutation]);

  const logout = useCallback(async () => {
    console.log('[Auth] Logging out...');
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
    console.log('[Auth] Logout complete');
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      console.log('[Auth] No token to refresh');
      return;
    }

    console.log('[Auth] Refreshing user profile...');
    const profile = await fetchProfile(token);

    if (profile) {
      setUser(profile);
      console.log('[Auth] Profile refreshed for:', profile.email);
    } else {
      console.log('[Auth] Profile refresh failed, logging out...');
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      setToken(null);
      setUser(null);
    }
  }, [token, fetchProfile]);

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    refreshUser,
  };
});
