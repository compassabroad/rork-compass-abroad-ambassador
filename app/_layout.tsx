import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import Colors from "@/constants/colors";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ExchangeRateProvider } from "@/contexts/ExchangeRateContext";
import { SocialMediaProvider } from "@/contexts/SocialMediaContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'auth' || segments[0] === 'onboarding';
    const inStudentReg = segments[0] === 'student-registration';

    if (inStudentReg) return;

    if (!isAuthenticated) {
      if (!inAuthGroup) {
        console.log('[Nav] Not authenticated, redirecting to login');
        router.replace('/login');
        hasNavigated.current = true;
      }
    } else if (user?.accountStatus === 'pending_approval') {
      if (segments[0] !== 'auth' || segments[1] !== 'pending-approval') {
        console.log('[Nav] Account pending, redirecting to pending-approval');
        router.replace('/auth/pending-approval');
        hasNavigated.current = true;
      }
    } else if (user?.accountStatus === 'active') {
      if (inAuthGroup) {
        console.log('[Nav] Authenticated and active, redirecting to tabs');
        router.replace('/(tabs)');
        hasNavigated.current = true;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, user?.accountStatus, segments]);

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Geri",
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="auth"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="modal"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="students/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="chat/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="onboarding"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="announcements"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="announcements/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ambassadors/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="admin/program-commissions"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="admin/ambassador-commissions/[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="admin/social-media"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="admin/team"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="invite"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="student-registration/[token]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

function SeedManager() {
  const [seedEnabled, setSeedEnabled] = useState<boolean>(true);
  const [seedError, setSeedError] = useState<string | null>(null);
  const seedTriggered = useRef(false);

  const statusQuery = trpc.dbSetup.checkStatus.useQuery(undefined, {
    enabled: seedEnabled,
    retry: 5,
    retryDelay: 3000,
  });

  const seedMutation = trpc.dbSetup.seedAll.useMutation({
    onSuccess: (data) => {
      console.log('[App] DB seed result:', JSON.stringify(data));
      setSeedError(null);
    },
    onError: (err) => {
      console.error('[App] DB seed mutation error:', err.message);
      setSeedError(err.message);
    },
  });

  useEffect(() => {
    if (statusQuery.error) {
      console.error('[App] DB status check error:', statusQuery.error.message);
    }
  }, [statusQuery.error]);

  useEffect(() => {
    if (!statusQuery.data || seedTriggered.current) return;

    const tables = statusQuery.data.tables ?? [];
    const programsTable = tables.find((t) => t.table === 'programs');
    const ambassadorsTable = tables.find((t) => t.table === 'ambassadors');

    const hasPrograms = programsTable && programsTable.count > 0;
    const hasAmbassadors = ambassadorsTable && ambassadorsTable.count > 0;

    if (hasPrograms && hasAmbassadors) {
      console.log('[App] DB already seeded. Programs:', programsTable?.count, 'Ambassadors:', ambassadorsTable?.count);
      setSeedEnabled(false);
      return;
    }

    console.log('[App] DB needs seeding. Running seedAll...');
    seedTriggered.current = true;
    seedMutation.mutate();
    setSeedEnabled(false);
  }, [statusQuery.data, seedMutation]);

  if (seedError) {
    console.error('[App] Seed error displayed:', seedError);
  }

  return null;
}

function AppContent() {
  return (
    <ExchangeRateProvider>
      <SocialMediaProvider>
        <NotificationProvider>
          <ChatProvider>
            <SeedManager />
            <StatusBar style="light" />
            <RootLayoutNav />
          </ChatProvider>
        </NotificationProvider>
      </SocialMediaProvider>
    </ExchangeRateProvider>
  );
}

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
