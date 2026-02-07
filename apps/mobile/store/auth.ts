import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface AuthState {
  token: string | null;
  profile: any | null;
  loading: boolean;
  onboardingComplete: boolean;
  setToken: (token: string | null) => Promise<void>;
  setProfile: (profile: any | null) => void;
  loadToken: () => Promise<void>;
  setOnboardingComplete: (complete: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  profile: null,
  loading: true,
  onboardingComplete: false,
  setToken: async (token) => {
    if (token) await AsyncStorage.setItem('token', token);
    else await AsyncStorage.removeItem('token');
    set({ token });
  },
  setProfile: (profile) => set({ profile }),
  loadToken: async () => {
    const token = await AsyncStorage.getItem('token');
    const onboardingComplete = (await AsyncStorage.getItem('onboardingComplete')) === 'true';
    set({ token, onboardingComplete, loading: false });
  },
  setOnboardingComplete: async (complete) => {
    await AsyncStorage.setItem('onboardingComplete', String(complete));
    set({ onboardingComplete: complete });
  },
  signOut: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('onboardingComplete');
    set({ token: null, profile: null, onboardingComplete: false });
  },
}));
