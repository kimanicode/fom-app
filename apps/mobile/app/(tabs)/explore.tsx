import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import { api } from '../../lib/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ExploreScreen() {
  const [quests, setQuests] = useState<any[]>([]);
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return quests;
    const q = query.toLowerCase();
    return quests.filter((item) =>
      `${item.title} ${item.description} ${item.location?.placeName}`.toLowerCase().includes(q)
    );
  }, [quests, query]);
  const [region, setRegion] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  useEffect(() => {
    const load = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
        const list = await api.listQuests(loc.coords.latitude, loc.coords.longitude);
        setQuests(list);
      } else {
        const list = await api.listQuests();
        setQuests(list);
      }
    };
    load();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.topRow}>
        <View style={styles.locationPill}>
          <Ionicons name="location-outline" size={14} color="#E56A3C" />
          <Text style={styles.locationText}>San Diego</Text>
        </View>
        <Text style={styles.brand}>FOM</Text>
        <View style={styles.iconRow}>
          <Pressable style={styles.iconButton}>
            <Ionicons name="search" size={18} color="#7C6F66" />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={18} color="#7C6F66" />
          </Pressable>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color="#9A8E86" />
        <TextInput
          placeholder="Search quests, locations, vibes..."
          placeholderTextColor="#9A8E86"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#FFE7DB' }]}>
            <Ionicons name="trending-up" size={16} color="#E56A3C" />
          </View>
          <Text style={styles.statValue}>615</Text>
          <Text style={styles.statLabel}>Quests Done</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#E6F4EA' }]}>
            <Ionicons name="time" size={16} color="#2F6B4F" />
          </View>
          <Text style={styles.statValue}>6</Text>
          <Text style={styles.statLabel}>Active Quests</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#FFEFD6' }]}>
            <Ionicons name="star" size={16} color="#D97706" />
          </View>
          <Text style={styles.statValue}>4.8</Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Ionicons name="trending-up" size={16} color="#E56A3C" />
        <Text style={styles.sectionTitle}>Trending This Week</Text>
      </View>
      <View style={styles.sectionList}>
        {filtered.slice(0, 3).map((q, idx) => (
          <View key={q.id} style={styles.questRow}>
            <Image
              source={{
                uri:
                  q.imageUrl ||
                  (idx % 2 === 0
                    ? 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600'
                    : 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600'),
              }}
              style={styles.thumb}
            />
            <View style={styles.questInfo}>
              <Text style={styles.questTitle}>{q.title}</Text>
              <View style={styles.questMetaRow}>
                <Ionicons name="location-outline" size={12} color="#8B7E74" />
                <Text style={styles.questMetaText}>{q.location?.placeName}</Text>
              </View>
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>{q.vibeTag}</Text>
              </View>
            </View>
            <Text style={styles.questCount}>{Math.floor(80 + idx * 40)} did this</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Ionicons name="time" size={16} color="#2F6B4F" />
        <Text style={styles.sectionTitle}>Just Added</Text>
      </View>
      <View style={styles.sectionList}>
        {filtered.slice(3, 6).map((q, idx) => (
          <View key={q.id} style={styles.questRow}>
            <Image
              source={{
                uri:
                  q.imageUrl ||
                  (idx % 2 === 0
                    ? 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=600'
                    : 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600'),
              }}
              style={styles.thumb}
            />
            <View style={styles.questInfo}>
              <Text style={styles.questTitle}>{q.title}</Text>
              <View style={styles.questMetaRow}>
                <Ionicons name="location-outline" size={12} color="#8B7E74" />
                <Text style={styles.questMetaText}>{q.location?.placeName}</Text>
              </View>
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>{q.vibeTag}</Text>
              </View>
            </View>
            <Text style={styles.questCount}>{Math.floor(40 + idx * 20)} did this</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F2' },
  content: { padding: 16, gap: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF1E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  locationText: { color: '#E56A3C', fontSize: 12, fontWeight: '600' },
  brand: { fontSize: 18, fontWeight: '700', color: '#E56A3C' },
  iconRow: { flexDirection: 'row', gap: 8 },
  iconButton: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#EFE7E0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F0E6DE',
  },
  searchInput: { flex: 1, color: '#3C2F25' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#F0E6DE',
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '700', color: '#3C2F25' },
  statLabel: { fontSize: 12, color: '#8B7E74' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#3C2F25' },
  sectionList: { gap: 10 },
  questRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0E6DE',
  },
  thumb: { width: 56, height: 56, borderRadius: 12 },
  questInfo: { flex: 1, gap: 4 },
  questTitle: { fontSize: 13, fontWeight: '700', color: '#3C2F25' },
  questMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  questMetaText: { fontSize: 12, color: '#8B7E74' },
  tagPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagText: { fontSize: 11, fontWeight: '600', color: '#2F6B4F', textTransform: 'capitalize' },
  questCount: { fontSize: 11, color: '#9A8E86' },
});
