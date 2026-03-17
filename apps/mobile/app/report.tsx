import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAppTheme } from '../constants/app-theme';

export default function ReportScreen() {
  const { colors } = useAppTheme();
  const [targetType, setTargetType] = useState<'user' | 'quest' | 'post'>('user');
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');

  const submit = async () => {
    try {
      await api.report({ targetType, targetId, reason });
      Alert.alert('Report submitted');
    } catch (e: any) {
      Alert.alert('Report failed', e.message || 'Try again');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.screen }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Report</Text>
      <Input label="Target type (user/quest/post)" value={targetType} onChangeText={(v) => setTargetType(v as any)} />
      <Input label="Target ID" value={targetId} onChangeText={setTargetId} />
      <Input label="Reason" value={reason} onChangeText={setReason} />
      <Button label="Submit report" onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: '700' },
});
