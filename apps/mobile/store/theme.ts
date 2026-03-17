import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type AppTheme = 'light' | 'dark';

const THEME_KEY = 'appTheme';

interface ThemeState {
  theme: AppTheme;
  hydrated: boolean;
  loadTheme: () => Promise<void>;
  setTheme: (theme: AppTheme) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  hydrated: false,
  loadTheme: async () => {
    const storedTheme = await AsyncStorage.getItem(THEME_KEY);
    const theme = storedTheme === 'dark' ? 'dark' : 'light';
    set({ theme, hydrated: true });
  },
  setTheme: async (theme) => {
    await AsyncStorage.setItem(THEME_KEY, theme);
    set({ theme, hydrated: true });
  },
  toggleTheme: async () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    await AsyncStorage.setItem(THEME_KEY, nextTheme);
    set({ theme: nextTheme, hydrated: true });
  },
}));
