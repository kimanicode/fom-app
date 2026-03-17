import { StyleSheet, TextInput, View, Text } from 'react-native';
import { useAppTheme } from '../../constants/app-theme';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
}

export function Input({ label, value, onChangeText, placeholder, secureTextEntry }: InputProps) {
  const { colors, fonts } = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted, fontFamily: fonts.sansMedium }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text,
            fontFamily: fonts.sans,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSoft}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { fontSize: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
  },
});
