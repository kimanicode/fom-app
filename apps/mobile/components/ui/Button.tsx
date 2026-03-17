import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useAppTheme } from '../../constants/app-theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', loading = false, disabled = false }: ButtonProps) {
  const { colors, fonts } = useAppTheme();
  const isInactive = loading || disabled;
  const textColor = variant === 'secondary' ? colors.text : colors.primaryContrast;

  return (
    <Pressable
      style={[
        styles.base,
        { backgroundColor: colors.primary },
        variant === 'secondary' && { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
        isInactive && styles.inactive,
      ]}
      onPress={onPress}
      disabled={isInactive}>
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text
          style={[
            styles.text,
            { color: textColor, fontFamily: fonts.sansSemi },
          ]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  text: {
    fontWeight: '600',
  },
  inactive: {
    opacity: 0.72,
  },
});
