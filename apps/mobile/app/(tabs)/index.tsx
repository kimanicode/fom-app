import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/auth';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../constants/theme';

export default function FeedScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [segment, setSegment] = useState<'quests' | 'joined'>('quests');
  const [joinedQuests, setJoinedQuests] = useState<any[]>([]);
  const [joinedIds, setJoinedIds] = useState<Record<string, boolean>>({});
  const [unreadCount, setUnreadCount] = useState(0);
  

  const shuffle = <T,>(arr: T[]) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        let coords;
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          coords = loc.coords;
        }
        const [feed, joined, saved, unread] = await Promise.all([
          api.feed(coords?.latitude, coords?.longitude),
          api.getJoinedQuests(),
          api.getSavedQuests(),
          api.notificationsUnread(),
        ]);
        setItems(shuffle(feed));
        setJoinedQuests(shuffle(joined as any[]));
        setUnreadCount((unread as any[]).length || 0);
        const map: Record<string, boolean> = {};
        (saved as any[]).forEach((q: any) => {
          map[q.id] = true;
        });
        setSavedIds(map);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      api.notificationsUnread()
        .then((unread: any) => setUnreadCount((unread as any[]).length || 0))
        .catch(console.warn);
    }, [token])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <View style={styles.locationPill}>
          <Ionicons name="location-outline" size={14} color="#E56A3C" />
          <Text style={styles.locationText}>Nairobi</Text>
        </View>
        <Text style={styles.brand}>FOM</Text>
        <View style={styles.iconRow}>
          <Pressable style={styles.iconButton}>
            <Ionicons name="search" size={18} color="#7C6F66" />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={18} color="#7C6F66" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.segment}>
        <Pressable
          style={[styles.segmentTab, segment === 'quests' && styles.segmentActive]}
          onPress={() => setSegment('quests')}>
          <Text style={segment === 'quests' ? styles.segmentTextActive : styles.segmentText}>
            Nearby Quests
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segmentTab, segment === 'joined' && styles.segmentActive]}
          onPress={() => setSegment('joined')}>
          <Text style={segment === 'joined' ? styles.segmentTextActive : styles.segmentText}>
            Joined Quests
          </Text>
        </Pressable>
      </View>

      <View style={styles.chipsRow}>
        {['Chill', 'Creative', 'Active', 'Curious'].map((chip) => (
          <View key={chip} style={styles.chip}>
            <Text style={styles.chipText}>{chip}</Text>
          </View>
        ))}
      </View>

      {loading && <Text style={styles.muted}>Loading your quests...</Text>}
      {!loading && !token && <Text style={styles.muted}>Log in to see your feed.</Text>}
      {!loading && token && items.length === 0 && <Text style={styles.muted}>No feed items yet.</Text>}

      {segment === 'joined' && (
        <View style={styles.storyRow}>
          {joinedQuests.map((item) => (
            <Pressable
              key={item.instanceId}
              style={styles.storyItem}
              onPress={() =>
                router.push(`/quest/${item.quest?.id}?instanceId=${item.instanceId}&joined=1`)
              }>
              <Image
                source={{
                  uri:
                    item.quest?.imageUrl ||
                    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
                }}
                style={styles.storyImage}
              />
              <Text style={styles.storyName}>{item.quest?.title || 'Quest'}</Text>
            </Pressable>
          ))}
          {joinedQuests.length === 0 && <Text style={styles.muted}>No joined quests yet.</Text>}
        </View>
      )}

      {segment === 'quests' &&
        items.map((item) => (
        <Pressable
          key={`${item.type}-${item.data.id}`}
          style={styles.card}
          onPress={() => {
            if (item.type === 'quest') router.push(`/quest/${item.data.id}`);
          }}>
          <View style={styles.cardImageWrap}>
            <Image
              source={{
                uri:
                  item.type === 'quest' && item.data.imageUrl
                    ? item.data.imageUrl
                    : 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200',
              }}
              style={styles.cardImage}
            />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.type === 'quest' ? item.data.vibeTag : 'Story'}</Text>
            </View>
            {item.type === 'quest' && (
              <Pressable
                style={styles.saveButton}
                onPress={async () => {
                  const res = await api.saveQuest(item.data.id);
                  setSavedIds((prev) => ({ ...prev, [item.data.id]: res.saved }));
                }}>
                <Ionicons
                  name={savedIds[item.data.id] ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color="#FFFFFF"
                />
              </Pressable>
            )}
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>
              {item.type === 'quest' ? item.data.title : 'Sunrise sketching at the pier'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {item.type === 'quest' ? item.data.description : 'Bring a sketchbook and capture the morning light.'}
            </Text>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={14} color="#8B7E74" />
              <Text style={styles.metaText}>{item.data.location.placeName}</Text>
              <Ionicons name="time-outline" size={14} color="#8B7E74" />
              <Text style={styles.metaText}>1-2 hours</Text>
              <Ionicons name="people-outline" size={14} color="#8B7E74" />
              <Text style={styles.metaText}>5 spots left</Text>
            </View>
            {item.type === 'quest' ? (
              <View style={styles.actionsRow}>
                <Button
                  label={joinedIds[item.data.id] ? 'Joined' : 'Join Quest'}
                  onPress={async () => {
                    if (joinedIds[item.data.id]) return;
                    await api.joinQuest(item.data.id);
                    setJoinedIds((prev) => ({ ...prev, [item.data.id]: true }));
                  }}
                  variant={joinedIds[item.data.id] ? 'secondary' : 'primary'}
                />
                <Pressable style={styles.circleAction} onPress={() => api.saveQuest(item.data.id)}>
                  <Ionicons name="repeat" size={18} color="#7C6F66" />
                </Pressable>
                <Pressable
                  style={styles.circleAction}
                  onPress={() =>
                    Share.share({
                      message: `Join my quest: ${item.data.title}\n${item.data.description}\nLocation: ${item.data.location?.placeName || ''}\nLink: fom://quest/${item.data.id}`,
                    })
                  }>
                  <Ionicons name="share-social-outline" size={18} color="#7C6F66" />
                </Pressable>
              </View>
            ) : (
              <View style={styles.actionsRow}>
                <Button label="View Location" variant="secondary" onPress={() => router.push(`/location/${item.data.locationId}`)} />
              </View>
            )}
          </View>
        </Pressable>
      ))}

      {/* Stories modal removed; replaced by Joined Quests */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16 },
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
  brand: { fontSize: 18, fontFamily: theme.fonts.displayBold, color: theme.colors.primary },
  iconRow: { flexDirection: 'row', gap: 8 },
  iconButton: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#EFE7E0',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#D62F2F',
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#EFE7E0',
    borderRadius: 999,
    padding: 4,
  },
  segmentTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 999 },
  segmentActive: { backgroundColor: '#FFFFFF' },
  segmentText: { color: theme.colors.mutedForeground, fontWeight: '600' },
  segmentTextActive: { color: theme.colors.foreground, fontWeight: '700', fontFamily: theme.fonts.display },
  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: { color: '#2F6B4F', fontWeight: '600', fontSize: 12 },
  muted: { color: '#8B7E74' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0E6DE',
  },
  cardImageWrap: { position: 'relative' },
  cardImage: { width: '100%', height: 220 },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FFE8D9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { color: '#B4532E', fontWeight: '700', fontSize: 12, textTransform: 'capitalize' },
  saveButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 8,
    borderRadius: 999,
  },
  cardBody: { padding: 16, gap: 8 },
  cardTitle: { fontSize: 18, fontFamily: theme.fonts.display, color: theme.colors.foreground },
  cardSubtitle: { color: theme.colors.mutedForeground, fontSize: 13 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  metaText: { color: '#8B7E74', fontSize: 12, marginRight: 8 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  circleAction: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#EFE7E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  storyItem: { alignItems: 'center', gap: 6 },
  storyImage: { width: 70, height: 70, borderRadius: 20 },
  storyName: { fontSize: 11, color: '#7C6F66' },
  storyModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyFull: { width: '100%', height: '100%', resizeMode: 'cover' },
  storyHeader: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storyClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyUser: { color: '#FFF', fontWeight: '600' },
  storyTapLeft: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%' },
  storyTapRight: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%' },
});
