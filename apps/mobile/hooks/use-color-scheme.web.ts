import { useThemeStore } from '../store/theme';

export function useColorScheme() {
  return useThemeStore((state) => state.theme);
}
