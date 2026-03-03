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

  useEffect(() => {
    if (isLoading) {
      return;
    }

    SplashScreen.hideAsync();

    const firstSegment = segments[0];
    const inAuthGroup = firstSegment === 'login' || firstSegment === 'auth' || firstSegment === 'onboarding';
    const inStudentReg = firstSegment === 'student-registration';
    const inTabs = firstSegment === '(tabs)';
    const onPendingApproval = firstSegment === 'auth' && segments[1] === 'pending-approval';

    if (inStudentReg) return;

    if (!isAuthenticated) {
      if (!inAuthGroup) {
        router.replace('/login');
      }
      return;
    }

    if (user?.accountStatus === 'pending_approval') {
      if (!onPendingApproval) {
        router.replace('/auth/pending-approval');
      }
      return;
    }

    if (user?.accountStatus === 'active' && inAuthGroup && !inTabs) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isAuthenticated, user?.accountStatus, segments, router]);

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
