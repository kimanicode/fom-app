import { DarkTheme, DefaultTheme, Theme } from '@react-navigation/native';
import { useMemo } from 'react';
import { theme } from './theme';
import { useColorScheme } from '../hooks/use-color-scheme';

type AppPalette = {
  screen: string;
  surface: string;
  surfaceMuted: string;
  surfaceElevated: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSoft: string;
  primary: string;
  primarySoft: string;
  primaryContrast: string;
  success: string;
  successSoft: string;
  danger: string;
  chip: string;
  chipText: string;
  overlay: string;
};

const palettes: Record<'light' | 'dark', AppPalette> = {
  light: {
    screen: '#F9F6F2',
    surface: '#FFFFFF',
    surfaceMuted: '#F7F2ED',
    surfaceElevated: '#FCFAF7',
    border: '#F0E6DE',
    borderStrong: '#E3D6CC',
    text: '#2F2A26',
    textMuted: '#7C6F66',
    textSoft: '#9A8E86',
    primary: '#E56A3C',
    primarySoft: '#FFF1E8',
    primaryContrast: '#FFFFFF',
    success: '#2F6B4F',
    successSoft: '#E6F4EA',
    danger: '#D62F2F',
    chip: '#EFE7E0',
    chipText: '#5F4B3F',
    overlay: 'rgba(0,0,0,0.55)',
  },
  dark: {
    screen: '#121110',
    surface: '#1C1917',
    surfaceMuted: '#25211F',
    surfaceElevated: '#211D1B',
    border: '#3A342F',
    borderStrong: '#4A423B',
    text: '#F4ECE4',
    textMuted: '#B2A79E',
    textSoft: '#92877D',
    primary: '#FF9C73',
    primarySoft: '#3F2A21',
    primaryContrast: '#1A1411',
    success: '#95D3AA',
    successSoft: '#22362B',
    danger: '#FF7A7A',
    chip: '#2A2623',
    chipText: '#D7C7B8',
    overlay: 'rgba(0,0,0,0.78)',
  },
};

export function useAppTheme() {
  const colorScheme = useColorScheme() ?? 'light';

  return useMemo(
    () => ({
      mode: colorScheme,
      colors: palettes[colorScheme],
      fonts: theme.fonts,
    }),
    [colorScheme]
  );
}

export function getNavigationTheme(mode: 'light' | 'dark'): Theme {
  const baseTheme = mode === 'dark' ? DarkTheme : DefaultTheme;
  const colors = palettes[mode];

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: colors.screen,
      card: colors.surface,
      border: colors.border,
      primary: colors.primary,
      text: colors.text,
      notification: colors.danger,
    },
    fonts: baseTheme.fonts,
  };
}
