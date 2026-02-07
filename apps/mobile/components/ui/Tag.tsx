import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../../constants/theme';

interface TagProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Tag({ label, selected, onPress }: TagProps) {
  return (
    <Pressable onPress={onPress} style={[styles.tag, selected && styles.selected]}>
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: theme.colors.accent,
    marginRight: 8,
    marginBottom: 8,
  },
  text: { color: theme.colors.accentForeground, fontSize: 12, fontFamily: theme.fonts.sansMedium },
  selected: { backgroundColor: theme.colors.primary },
  selectedText: { color: '#F8FAFC' },
});
