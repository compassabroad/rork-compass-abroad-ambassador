import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="edit"
        options={{
          title: 'Profili Düzenle',
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
