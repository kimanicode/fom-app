import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

type SecureStoreModule = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
};

let secureStore: SecureStoreModule | null = null;
try {
  secureStore = require('expo-secure-store') as SecureStoreModule;
} catch {
  secureStore = null;
}

const TOKEN_KEY = 'token';

async function readToken() {
  if (secureStore) return secureStore.getItemAsync(TOKEN_KEY);
  return AsyncStorage.getItem(TOKEN_KEY);
}

async function writeToken(token: string) {
  if (secureStore) {
    await secureStore.setItemAsync(TOKEN_KEY, token);
    return;
  }
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

async function clearToken() {
  if (secureStore) {
    await secureStore.deleteItemAsync(TOKEN_KEY);
    return;
  }
  await AsyncStorage.removeItem(TOKEN_KEY);
}

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
    set({ token });
    if (token) await writeToken(token);
    else await clearToken();
  },
  setProfile: (profile) => set({ profile }),
  loadToken: async () => {
    const token = await readToken();
    const onboardingComplete = (await AsyncStorage.getItem('onboardingComplete')) === 'true';
    set({ token, onboardingComplete, loading: false });
  },
  setOnboardingComplete: async (complete) => {
    await AsyncStorage.setItem('onboardingComplete', String(complete));
    set({ onboardingComplete: complete });
  },
  signOut: async () => {
    await clearToken();
    await AsyncStorage.removeItem('onboardingComplete');
    set({ token: null, profile: null, onboardingComplete: false });
  },
}));
