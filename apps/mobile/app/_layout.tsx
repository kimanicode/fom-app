import { ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { getNavigationTheme } from '../constants/app-theme';
import { useAuthStore } from '../store/auth';
import { useThemeStore } from '../store/theme';
import { Text } from 'react-native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { token, loading, onboardingComplete, loadToken } = useAuthStore();
  const [root, child] = segments;
  const isProtectedRoute =
    (root === '(tabs)' && (child === 'create' || child === 'profile')) ||
    root === 'notifications' ||
    root === 'settings' ||
    root === 'report' ||
    root === 'block' ||
    root === 'chat' ||
    root === 'checkin' ||
    root === 'post-create';

  useEffect(() => {
    loadToken();
  }, [loadToken]);

  useEffect(() => {
    if (loading) return;
    const inOnboarding = segments[0] === 'onboarding';
    if (!token && !inOnboarding && isProtectedRoute) {
      router.replace('/onboarding');
    }
    if (token && inOnboarding && onboardingComplete) {
      router.replace('/(tabs)');
    }
  }, [token, loading, segments, router, onboardingComplete, isProtectedRoute]);

  return null;
}

export default function RootLayout() {
  const appTheme = useThemeStore((state) => state.theme);
  const themeHydrated = useThemeStore((state) => state.hydrated);
  const loadTheme = useThemeStore((state) => state.loadTheme);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    loadTheme().catch(console.warn);
  }, [loadTheme]);

  if (!fontsLoaded || !themeHydrated) return null;

  const TextComponent = Text as any;
  TextComponent.defaultProps = TextComponent.defaultProps || {};
  TextComponent.defaultProps.style = [{ fontFamily: 'Inter_400Regular' }, TextComponent.defaultProps.style];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={getNavigationTheme(appTheme)}>
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
        <StatusBar style={appTheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
