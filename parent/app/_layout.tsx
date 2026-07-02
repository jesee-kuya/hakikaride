import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../lib/auth';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="reset-password" />
          <Stack.Screen name="change-password" />
          <Stack.Screen name="guardian" />
          <Stack.Screen name="parent" />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
