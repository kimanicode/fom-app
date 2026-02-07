import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function BlockScreen() {
  const [blockedId, setBlockedId] = useState('');

  const submit = async () => {
    try {
      await api.block(blockedId);
      Alert.alert('Blocked');
    } catch (e: any) {
      Alert.alert('Block failed', e.message || 'Try again');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Block User</Text>
      <Input label="User ID to block" value={blockedId} onChangeText={setBlockedId} />
      <Button label="Block" onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: '700' },
});
