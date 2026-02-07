import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Location from 'expo-location';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';

export default function CheckinScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [status, setStatus] = useState('Ready to check in');

  const doCheckin = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({});
      await api.checkin(String(id), loc.coords.latitude, loc.coords.longitude);
      setStatus('Checked in. You can complete now.');
    } catch (e: any) {
      Alert.alert('Check-in failed', e.message || 'Unable to check in');
    }
  };

  const doComplete = async () => {
    try {
      await api.complete(String(id));
      Alert.alert('Quest completed', 'You can now post your media.');
      router.push(`/post-create/${id}`);
    } catch (e: any) {
      Alert.alert('Complete failed', e.message || 'Unable to complete');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Check-in</Text>
      <Text style={styles.muted}>{status}</Text>
      <Button label="Check in" onPress={doCheckin} />
      <Button label="Complete quest" variant="secondary" onPress={doComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#F8FAFC' },
  title: { fontSize: 22, fontWeight: '700' },
  muted: { color: '#64748B' },
});
