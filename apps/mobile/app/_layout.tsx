import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/auth';
import { Text } from 'react-native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { token, loading, onboardingComplete, loadToken } = useAuthStore();

  useEffect(() => {
    loadToken();
  }, [loadToken]);

  useEffect(() => {
    if (loading) return;
    const inOnboarding = segments[0] === 'onboarding';
    if (!token && !inOnboarding) {
      router.replace('/onboarding');
    }
    if (token && inOnboarding && onboardingComplete) {
      router.replace('/(tabs)');
    }
  }, [token, loading, segments, router, onboardingComplete]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  if (!fontsLoaded) return null;

  Text.defaultProps = Text.defaultProps || {};
  Text.defaultProps.style = [{ fontFamily: 'Inter_400Regular' }, Text.defaultProps.style];

  return (
    <>
      <AuthGate />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="quest/[id]" />
        <Stack.Screen name="location/[id]" />
        <Stack.Screen name="checkin/[id]" />
        <Stack.Screen name="post-create/[id]" />
        <Stack.Screen name="report" />
        <Stack.Screen name="block" />
        <Stack.Screen name="settings" />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
