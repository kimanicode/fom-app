import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useAppTheme } from '../../constants/app-theme';

interface ButtonProps {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', loading = false, disabled = false }: ButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const { colors, fonts } = useAppTheme();
  const resolvedLoading = loading || internalLoading;
  const isInactive = resolvedLoading || disabled;
  const textColor = variant === 'secondary' ? colors.text : colors.primaryContrast;

  const handlePress = () => {
    const result = onPress();
    if (!result || typeof (result as Promise<void>).then !== 'function') {
      return;
    }

    setInternalLoading(true);
    Promise.resolve(result).finally(() => setInternalLoading(false));
  };

  return (
    <Pressable
      style={[
        styles.base,
        { backgroundColor: colors.primary },
        variant === 'secondary' && { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
        isInactive && styles.inactive,
      ]}
      onPress={handlePress}
      disabled={isInactive}>
      {resolvedLoading ? (
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
