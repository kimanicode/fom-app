import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../../constants/theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onPress, variant = 'primary' }: ButtonProps) {
  return (
    <Pressable style={[styles.base, variant === 'secondary' && styles.secondary]} onPress={onPress}>
      <Text style={[styles.text, variant === 'secondary' && styles.secondaryText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
  },
  text: {
    color: theme.colors.primaryForeground,
    fontWeight: '600',
    fontFamily: theme.fonts.sansSemi,
  },
  secondaryText: {
    color: theme.colors.secondaryForeground,
  },
});
