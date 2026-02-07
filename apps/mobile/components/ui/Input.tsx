import { StyleSheet, TextInput, View, Text } from 'react-native';
import { theme } from '../../constants/theme';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
}

export function Input({ label, value, onChangeText, placeholder, secureTextEntry }: InputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { fontSize: 12, color: theme.colors.mutedForeground, marginBottom: 4, fontFamily: theme.fonts.sansMedium },
  input: {
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 10,
    borderRadius: 10,
    color: theme.colors.foreground,
    fontFamily: theme.fonts.sans,
  },
});
