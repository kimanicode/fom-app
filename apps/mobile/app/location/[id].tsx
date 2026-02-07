import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api } from '../../lib/api';

export default function LocationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [location, setLocation] = useState<any>();

  useEffect(() => {
    if (!id) return;
    api.getLocation(String(id)).then(setLocation).catch(console.warn);
  }, [id]);

  if (!location) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Loading location...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{location.placeName}</Text>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.muted}>Map preview requires a dev build.</Text>
        <Text style={styles.muted}>
          {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
        </Text>
      </View>
      <Text style={styles.section}>Quests here</Text>
      {location.quests.map((q: any) => (
        <View key={q.id} style={styles.card}>
          <Text style={styles.cardTitle}>{q.title}</Text>
          <Text style={styles.muted}>{q.description}</Text>
        </View>
      ))}
      <Text style={styles.section}>Recent stories</Text>
      {location.posts.map((p: any) => (
        <View key={p.id} style={styles.card}>
          <Text style={styles.cardTitle}>{p.user?.alias || 'Quest story'}</Text>
          <Text style={styles.muted}>{p.caption || 'Completed a quest.'}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: '700' },
  mapPlaceholder: {
    height: 180,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  section: { fontSize: 16, fontWeight: '600', marginTop: 8 },
  card: { backgroundColor: '#FFF', padding: 12, borderRadius: 12 },
  cardTitle: { fontWeight: '600' },
  muted: { color: '#64748B' },
});
