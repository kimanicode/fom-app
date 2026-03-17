import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api } from '../../lib/api';
import { useAppTheme } from '../../constants/app-theme';

export default function LocationScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [location, setLocation] = useState<any>();

  useEffect(() => {
    if (!id) return;
    api.getLocation(String(id)).then(setLocation).catch(console.warn);
  }, [id]);

  if (!location) {
    return (
      <View style={[styles.container, { backgroundColor: colors.screen }]}>
        <Text style={[styles.muted, { color: colors.textMuted }]}>Loading location...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.screen }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>{location.placeName}</Text>
      <View style={[styles.mapPlaceholder, { backgroundColor: colors.surfaceMuted }]}>
        <Text style={[styles.muted, { color: colors.textMuted }]}>Map preview requires a dev build.</Text>
        <Text style={[styles.muted, { color: colors.textMuted }]}>
          {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
        </Text>
      </View>
      <Text style={[styles.section, { color: colors.text }]}>Quests here</Text>
      {location.quests.map((q: any) => (
        <View key={q.id} style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{q.title}</Text>
          <Text style={[styles.muted, { color: colors.textMuted }]}>{q.description}</Text>
        </View>
      ))}
      <Text style={[styles.section, { color: colors.text }]}>Recent stories</Text>
      {location.posts.map((p: any) => (
        <View key={p.id} style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{p.user?.alias || 'Quest story'}</Text>
          <Text style={[styles.muted, { color: colors.textMuted }]}>{p.caption || 'Completed a quest.'}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: '700' },
  mapPlaceholder: { height: 180, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 6 },
  section: { fontSize: 16, fontWeight: '600', marginTop: 8 },
  card: { padding: 12, borderRadius: 12 },
  cardTitle: { fontWeight: '600' },
  muted: {},
});
