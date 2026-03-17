import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../store/auth';

export function requireAuth(message = 'Sign in to continue.') {
  if (useAuthStore.getState().token) {
    return true;
  }

  Alert.alert('Sign in required', message, [
    { text: 'Not now', style: 'cancel' },
    { text: 'Sign in', onPress: () => router.push('/onboarding') },
  ]);

  return false;
}
