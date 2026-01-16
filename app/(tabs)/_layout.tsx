import { Tabs } from "expo-router";
import { LayoutDashboard, Users, Network, Wallet, MessageCircle, Shield, UsersRound, UserCircle } from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";

import Colors from "@/constants/colors";
import { MOCK_CURRENT_USER } from "@/mocks/data";

export default function TabLayout() {
  const isAdmin = MOCK_CURRENT_USER.role === 'admin';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.secondary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 68,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Panel",
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: "Öğrenciler",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="network"
        options={{
          title: "Ağım",
          tabBarIcon: ({ color, size }) => <Network color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="finances"
        options={{
          title: "Finans",
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Mesajlar",
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: "Ekip",
          tabBarIcon: ({ color, size }) => <UsersRound color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          tabBarIcon: ({ color, size }) => <Shield color={color} size={size} />,
          href: isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => <UserCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="programs"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
