import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../lib/api';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    api.notifications().then(setItems).catch(console.warn);
    api.markNotificationsRead().catch(console.warn);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
      </View>
      {items.map((n) => (
        <View key={n.id} style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="notifications" size={16} color="#E56A3C" />
          </View>
          <View style={styles.body}>
            <Text style={styles.cardTitle}>{n.title}</Text>
            <Text style={styles.cardBody}>{n.body}</Text>
            <Text style={styles.meta}>{new Date(n.createdAt).toLocaleString()}</Text>
          </View>
        </View>
      ))}
      {items.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No notifications yet.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F2' },
  content: { padding: 18, gap: 12 },
  header: { marginBottom: 6 },
  title: { fontSize: 20, fontWeight: '700', color: '#3C2F25' },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0E6DE',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1E8',
  },
  body: { flex: 1, gap: 4 },
  cardTitle: { fontWeight: '700', color: '#3C2F25' },
  cardBody: { color: '#7C6F66' },
  meta: { fontSize: 11, color: '#9A8E86' },
  empty: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0E6DE',
    alignItems: 'center',
  },
  emptyText: { color: '#8B7E74', fontSize: 12 },
});
