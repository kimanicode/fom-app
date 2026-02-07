import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function QuestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [quest, setQuest] = useState<any>();
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const insets = useSafeAreaInsets();
  const topOffset = Math.max(insets.top, 16);

  useEffect(() => {
    if (!id) return;
    api.getQuest(String(id)).then(setQuest).catch(console.warn);
  }, [id]);

  const startDate = useMemo(() => {
    if (!quest?.startTime) return '';
    const date = new Date(quest.startTime);
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }, [quest?.startTime]);

  const startTime = useMemo(() => {
    if (!quest?.startTime) return '';
    const date = new Date(quest.startTime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [quest?.startTime]);

  if (!quest) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Loading quest...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={[styles.hero, { paddingTop: topOffset }]}>
        <Image
          source={{
            uri:
              quest.imageUrl ||
              'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200',
          }}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay} />
        <Pressable style={[styles.backButton, { top: topOffset }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#3C2F25" />
        </Pressable>
        <View style={[styles.heroActions, { top: topOffset }]}>
          <Pressable style={styles.iconButton}>
            <Ionicons name="share-social-outline" size={18} color="#3C2F25" />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => api.saveQuest(quest.id)}>
            <Ionicons name="bookmark-outline" size={18} color="#3C2F25" />
          </Pressable>
        </View>
        <View style={styles.heroContent}>
          <View style={styles.vibeTag}>
            <Text style={styles.vibeText}>{quest.vibeTag}</Text>
          </View>
          <Text style={styles.heroTitle}>{quest.title}</Text>
          <Text style={styles.heroSubtitle}>Hosted by {quest.creator?.alias || 'Host'}</Text>
        </View>
      </View>

      <View style={styles.sectionGrid}>
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="calendar" size={16} color="#6E6158" />
          </View>
          <Text style={styles.infoLabel}>Date</Text>
          <Text style={styles.infoValue}>{startDate}</Text>
        </View>
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="time" size={16} color="#6E6158" />
          </View>
          <Text style={styles.infoLabel}>Time</Text>
          <Text style={styles.infoValue}>{startTime}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About this Quest</Text>
        <Text style={styles.sectionBody}>{quest.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.locationCard}>
          <View style={styles.locationIcon}>
            <Ionicons name="location-outline" size={16} color="#2F6B4F" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.locationTitle}>{quest.location.placeName}</Text>
            <Text style={styles.locationMeta}>Public location</Text>
            <Text style={styles.locationDistance}>2.3 km away</Text>
          </View>
          <View style={styles.locationAction}>
            <Ionicons name="navigate" size={14} color="#2F6B4F" />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Who's Going</Text>
          <Text style={styles.sectionMeta}>5/8</Text>
        </View>
        <View style={styles.avatarRow}>
          {['A', 'B', 'C', 'D', 'E'].map((letter) => (
            <View key={letter} style={styles.smallAvatar}>
              <Text style={styles.smallAvatarText}>{letter}</Text>
            </View>
          ))}
          <View style={[styles.smallAvatar, styles.addAvatar]}>
            <Text style={styles.addAvatarText}>+3</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <Pressable style={styles.circleAction} onPress={() => api.saveQuest(quest.id)}>
          <Ionicons name="bookmark-outline" size={18} color="#3C2F25" />
        </Pressable>
        <Button
          label={joined ? 'Joined' : 'Join Quest'}
          variant={joined ? 'secondary' : 'primary'}
          onPress={async () => {
            if (joined) return;
            const res = await api.joinQuest(quest.id);
            setInstanceId(res.instanceId);
            setJoined(true);
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F2' },
  hero: { position: 'relative' },
  heroImage: { width: '100%', height: 260 },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 999,
  },
  heroActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 999,
  },
  heroContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    gap: 6,
  },
  vibeTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  vibeText: { fontSize: 11, fontWeight: '600', color: '#2F6B4F', textTransform: 'capitalize' },
  heroTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  heroSubtitle: { fontSize: 12, color: '#F0E6DE' },
  sectionGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0E6DE',
    gap: 6,
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F7F2ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { fontSize: 11, color: '#8B7E74' },
  infoValue: { fontSize: 12, fontWeight: '600', color: '#3C2F25' },
  section: { paddingHorizontal: 16, marginTop: 16, gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#3C2F25' },
  sectionBody: { fontSize: 12, color: '#7C6F66' },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0E6DE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTitle: { fontWeight: '700', color: '#3C2F25' },
  locationMeta: { fontSize: 11, color: '#8B7E74' },
  locationDistance: { fontSize: 11, color: '#2F6B4F' },
  locationAction: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionMeta: { fontSize: 11, color: '#8B7E74' },
  avatarRow: { flexDirection: 'row', gap: 8 },
  smallAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E6D6C8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallAvatarText: { fontWeight: '700', color: '#3C2F25' },
  addAvatar: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6D6C8',
  },
  addAvatarText: { color: '#8B7E74', fontWeight: '600' },
  bottomBar: {
    marginTop: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  circleAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F7F2ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  muted: { color: '#64748B' },
});
