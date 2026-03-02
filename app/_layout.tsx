import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
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

function AppContent() {
  const { isLoading } = useAuth();
  const hasSeedChecked = useRef(false);

  useEffect(() => {
    if (isLoading || hasSeedChecked.current) return;
    hasSeedChecked.current = true;

    const seedDb = async () => {
      try {
        const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
        if (!baseUrl) return;

        console.log('[App] Checking DB seed status...');
        const statusRes = await fetch(`${baseUrl}/api/trpc/dbSetup.checkStatus`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          const result = statusData?.result?.data;
          if (result && result.programsCount > 0 && result.ambassadorsCount > 0) {
            console.log('[App] DB already seeded:', result);
            return;
          }
        }

        console.log('[App] Running DB seed...');
        const seedRes = await fetch(`${baseUrl}/api/trpc/dbSetup.seedAll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        if (seedRes.ok) {
          const seedData = await seedRes.json();
          console.log('[App] DB seed result:', seedData?.result?.data);
        } else {
          console.error('[App] DB seed failed:', seedRes.status);
        }
      } catch (error) {
        console.error('[App] DB seed error:', error);
      }
    };

    seedDb();
  }, [isLoading]);

  return (
    <ExchangeRateProvider>
      <SocialMediaProvider>
        <NotificationProvider>
          <ChatProvider>
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
