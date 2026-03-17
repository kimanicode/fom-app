import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/auth';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { requireAuth } from '../../lib/require-auth';
import { DEFAULT_LOCATION_LABEL, getCurrentLocationDetails } from '../../lib/location';
import { useAppTheme } from '../../constants/app-theme';
import { SwipeTabsScreen } from '../../components/navigation/SwipeTabsScreen';

const FEED_STALE_MS = 2 * 60 * 1000;
const FEED_CACHE_KEY = 'feed_cache';

type FeedItem = any;
type FeedCache = {
  items: FeedItem[];
  fetchedAt: number;
  coords?: { latitude: number; longitude: number };
  locationLabel?: string;
};

export default function FeedScreen() {
  const { colors } = useAppTheme();
  const { refreshFeed } = useLocalSearchParams<{ refreshFeed?: string }>();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const { token } = useAuthStore();
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [savePendingIds, setSavePendingIds] = useState<Record<string, boolean>>({});
  const [segment, setSegment] = useState<'quests' | 'joined'>('quests');
  const [joinedQuests, setJoinedQuests] = useState<any[]>([]);
  const [joinedIds, setJoinedIds] = useState<Record<string, boolean>>({});
  const [joinedDeltaByQuest, setJoinedDeltaByQuest] = useState<Record<string, number>>({});
  const [joinPendingIds, setJoinPendingIds] = useState<Record<string, boolean>>({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [locationLabel, setLocationLabel] = useState(DEFAULT_LOCATION_LABEL);
  const lastFetchedAtRef = useRef(0);
  const isFirstLoadRef = useRef(true);
  const cachedCoordsRef = useRef<{ latitude: number; longitude: number } | undefined>(undefined);
  const locationLabelRef = useRef(DEFAULT_LOCATION_LABEL);

  const shuffle = <T,>(arr: T[]) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const updateLocation = useCallback((nextLabel: string, coords?: { latitude: number; longitude: number }) => {
    locationLabelRef.current = nextLabel;
    setLocationLabel(nextLabel);
    if (coords) {
      cachedCoordsRef.current = coords;
    }
  }, []);

  const persistFeedCache = useCallback(async (nextItems: FeedItem[], fetchedAt: number) => {
    try {
      const payload: FeedCache = {
        items: nextItems,
        fetchedAt,
        coords: cachedCoordsRef.current,
        locationLabel: locationLabelRef.current,
      };
      await AsyncStorage.setItem(FEED_CACHE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn(error);
    }
  }, []);

  const extractSearchText = useCallback((value: unknown): string => {
    if (value == null) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (Array.isArray(value)) {
      return value.map(extractSearchText).join(' ');
    }
    if (typeof value === 'object') {
      return Object.values(value as Record<string, unknown>).map(extractSearchText).join(' ');
    }
    return '';
  }, []);

  const matchesSearch = useCallback((value: unknown, input: string) => {
    const search = input.trim().toLowerCase();
    if (!search) return true;
    const tokens = search.split(/\s+/).filter(Boolean);
    const haystack = extractSearchText(value).toLowerCase();
    return tokens.every((token) => haystack.includes(token));
  }, [extractSearchText]);

  const getJoinLabel = () => 'Join Quest';

  const loadSecondaryData = useCallback(async () => {
    if (!token) {
      setJoinedQuests([]);
      setJoinedIds({});
      setJoinedDeltaByQuest({});
      setSavedIds({});
      setUnreadCount(0);
      return;
    }

    try {
      const [joined, saved, unread] = await Promise.all([
        api.getJoinedQuests(),
        api.getSavedQuests(),
        api.notificationsUnread(),
      ]);

      setJoinedQuests(shuffle(joined as any[]));

      const joinedMap: Record<string, boolean> = {};
      (joined as any[]).forEach((entry: any) => {
        if (entry?.quest?.id) joinedMap[entry.quest.id] = true;
      });
      setJoinedIds(joinedMap);
      setJoinedDeltaByQuest({});
      setUnreadCount((unread as any[]).length || 0);

      const savedMap: Record<string, boolean> = {};
      (saved as any[]).forEach((quest: any) => {
        savedMap[quest.id] = true;
      });
      setSavedIds(savedMap);
    } catch (error) {
      console.warn(error);
    }
  }, [token]);

  const loadFeed = useCallback(async (options?: { force?: boolean; userInitiated?: boolean; silent?: boolean }) => {
    const force = options?.force ?? false;
    const userInitiated = options?.userInitiated ?? false;
    const silent = options?.silent ?? false;
    const shouldUseFreshFeed =
      !force &&
      lastFetchedAtRef.current > 0 &&
      Date.now() - lastFetchedAtRef.current < FEED_STALE_MS;

    if (shouldUseFreshFeed) {
      void loadSecondaryData();
      return;
    }

    if (userInitiated) {
      setRefreshing(true);
    } else if (isFirstLoadRef.current && !silent) {
      setLoading(true);
    }

    try {
      const fallbackCoords = cachedCoordsRef.current;
      const locationPromise = getCurrentLocationDetails()
        .then((currentLocation) => {
          updateLocation(
            currentLocation.label,
            currentLocation.granted
              ? {
                  latitude: currentLocation.coords.latitude,
                  longitude: currentLocation.coords.longitude,
                }
              : undefined,
          );
          return currentLocation;
        })
        .catch((error) => {
          console.warn(error);
          return null;
        });

      const feedPromise = api.feed(fallbackCoords?.latitude, fallbackCoords?.longitude);
      const feed = await feedPromise;
      const nextItems = shuffle(feed as FeedItem[]);

      setItems(nextItems);
      isFirstLoadRef.current = false;

      const fetchedAt = Date.now();
      lastFetchedAtRef.current = fetchedAt;
      void persistFeedCache(nextItems, fetchedAt);
      void loadSecondaryData();

      await locationPromise;
    } catch (error) {
      console.warn(error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [loadSecondaryData, persistFeedCache, updateLocation]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    return items.filter((item) => matchesSearch(item, query));
  }, [items, matchesSearch, query]);

  const filteredQuestItems = useMemo(
    () => filteredItems.filter((item) => item?.type === 'quest'),
    [filteredItems],
  );

  const filteredJoinedQuests = useMemo(() => {
    if (!query.trim()) return joinedQuests;
    return joinedQuests.filter((item) => matchesSearch(item, query));
  }, [joinedQuests, matchesSearch, query]);

  useEffect(() => {
    let active = true;

    const hydrateFeed = async () => {
      try {
        const cached = await AsyncStorage.getItem(FEED_CACHE_KEY);
        if (!cached || !active) return;

        const parsed = JSON.parse(cached) as FeedCache;
        if (Array.isArray(parsed.items) && parsed.items.length > 0) {
          setItems(parsed.items);
          setLoading(false);
          isFirstLoadRef.current = false;
        }
        if (parsed.fetchedAt) {
          lastFetchedAtRef.current = parsed.fetchedAt;
        }
        if (parsed.coords) {
          cachedCoordsRef.current = parsed.coords;
        }
        if (parsed.locationLabel) {
          updateLocation(parsed.locationLabel, parsed.coords);
        }
      } catch (error) {
        console.warn(error);
      } finally {
        if (!active) return;
        void loadFeed({ silent: true });
        void loadSecondaryData();
      }
    };

    hydrateFeed().catch(console.warn);

    return () => {
      active = false;
    };
  }, [loadFeed, loadSecondaryData, updateLocation]);

  useFocusEffect(
    useCallback(() => {
      if (refreshFeed === '1') {
        void loadFeed({ force: true, silent: true });
        router.setParams({ refreshFeed: undefined });
        return;
      }
      void loadFeed({ silent: items.length > 0 });
    }, [items.length, loadFeed, refreshFeed]),
  );

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <View style={styles.topRow}>
        <View style={[styles.locationPill, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="location-outline" size={14} color={colors.primary} />
          <Text style={[styles.locationText, { color: colors.primary }]}>{locationLabel}</Text>
        </View>
        <Text style={[styles.brand, { color: colors.primary }]}>FOM</Text>
        <View style={styles.iconRow}>
          <Pressable style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
          </Pressable>
          <Pressable
            style={[styles.iconButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              if (!requireAuth('Sign in to view notifications.')) return;
              router.push('/notifications');
            }}>
            <Ionicons name="notifications-outline" size={18} color={colors.textMuted} />
            {unreadCount > 0 && (
              <View style={[styles.notificationBadge, { backgroundColor: colors.danger }]}>
                <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <View style={[styles.segment, { backgroundColor: colors.chip }]}>
        <Pressable
          style={[styles.segmentTab, segment === 'quests' && styles.segmentActive, segment === 'quests' && { backgroundColor: colors.surface }]}
          onPress={() => setSegment('quests')}>
          <Text style={segment === 'quests' ? [styles.segmentTextActive, { color: colors.text }] : [styles.segmentText, { color: colors.textMuted }]}>
            Nearby Quests
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segmentTab, segment === 'joined' && styles.segmentActive, segment === 'joined' && { backgroundColor: colors.surface }]}
          onPress={() => {
            if (!token && !requireAuth('Sign in to view the quests you joined.')) return;
            setSegment('joined');
          }}>
          <Text style={segment === 'joined' ? [styles.segmentTextActive, { color: colors.text }] : [styles.segmentText, { color: colors.textMuted }]}>
            Joined Quests
          </Text>
        </Pressable>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={16} color={colors.textSoft} />
        <TextInput
          placeholder="Search quests, locations, vibes..."
          placeholderTextColor={colors.textSoft}
          value={query}
          onChangeText={setQuery}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      <View style={styles.chipsRow}>
        {['Chill', 'Creative', 'Active', 'Curious'].map((chip) => (
          <View key={chip} style={[styles.chip, { backgroundColor: colors.successSoft }]}>
            <Text style={[styles.chipText, { color: colors.success }]}>{chip}</Text>
          </View>
        ))}
      </View>

      {!loading && !token && (
        <Text style={[styles.muted, { color: colors.textMuted }]}>Sign in to join quests, save favorites, and track notifications.</Text>
      )}
    </View>
  );

  const renderQuestCard = ({ item }: { item: FeedItem }) => {
    const baseParticipants = Number(item.data?.participantsCount || 0);
    const delta = Number(joinedDeltaByQuest[item.data.id] || 0);
    const joinedCount = Math.max(0, baseParticipants + delta);
    const spotsLeft = Math.max(0, Number(item.data?.maxParticipants || 0) - joinedCount);

    return (
      <Pressable
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
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
          <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>{item.type === 'quest' ? item.data.vibeTag : 'Story'}</Text>
          </View>
          {item.type === 'quest' && (
            <Pressable
              style={styles.saveButton}
              onPress={async () => {
                if (!requireAuth('Sign in to save quests.')) return;
                if (savePendingIds[item.data.id]) return;
                const previousSaved = Boolean(savedIds[item.data.id]);
                const nextSaved = !previousSaved;
                setSavePendingIds((prev) => ({ ...prev, [item.data.id]: true }));
                setSavedIds((prev) => ({ ...prev, [item.data.id]: nextSaved }));
                try {
                  const res = await api.saveQuest(item.data.id);
                  setSavedIds((prev) => ({ ...prev, [item.data.id]: res.saved }));
                } catch (error) {
                  setSavedIds((prev) => ({ ...prev, [item.data.id]: previousSaved }));
                  console.warn(error);
                } finally {
                  setSavePendingIds((prev) => ({ ...prev, [item.data.id]: false }));
                }
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
          <Text style={[styles.cardTitle, { color: colors.success }]}>{item.data.title}</Text>
          <Text style={[styles.cardSubtitle, { color: colors.success }]}>{item.data.description}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={colors.success} />
            <Text style={[styles.metaText, { color: colors.success }]}>{item.data.location.placeName}</Text>
            <Ionicons name="time-outline" size={14} color={colors.success} />
            <Text style={[styles.metaText, { color: colors.success }]}>1-2 hours</Text>
            <Ionicons name="people-outline" size={14} color={colors.success} />
            <Text style={[styles.metaText, { color: colors.success }]}>{spotsLeft} spots left</Text>
          </View>
          {item.data?.cost === 'paid' && Number(item.data?.costAmountCents || 0) > 0 && (
            <Text style={[styles.paidAmountText, { color: colors.success }]}>
              KSh {Math.round(Number(item.data.costAmountCents) / 100)}
            </Text>
          )}
          <View style={styles.actionsRow}>
            <View style={styles.joinBlock}>
              <Button
                label={joinedIds[item.data.id] ? 'Joined' : getJoinLabel()}
                onPress={async () => {
                  if (!requireAuth('Sign in to join this quest.')) return;
                  if (joinedIds[item.data.id] || joinPendingIds[item.data.id]) return;
                  setJoinPendingIds((prev) => ({ ...prev, [item.data.id]: true }));
                  setJoinedIds((prev) => ({ ...prev, [item.data.id]: true }));
                  setJoinedDeltaByQuest((prev) => ({
                    ...prev,
                    [item.data.id]: (prev[item.data.id] || 0) + 1,
                  }));
                  try {
                    const isPaid = item.data?.cost === 'paid' && Number(item.data?.costAmountCents || 0) > 0;
                    await api.joinQuest(
                      item.data.id,
                      isPaid ? { paymentMethod: 'in_app_wallet' } : undefined,
                    );
                  } catch (error) {
                    setJoinedIds((prev) => ({ ...prev, [item.data.id]: false }));
                    setJoinedDeltaByQuest((prev) => ({
                      ...prev,
                      [item.data.id]: Math.max(0, (prev[item.data.id] || 0) - 1),
                    }));
                    console.warn(error);
                  } finally {
                    setJoinPendingIds((prev) => ({ ...prev, [item.data.id]: false }));
                  }
                }}
                variant={joinedIds[item.data.id] ? 'secondary' : 'primary'}
              />
            </View>
            <Pressable
              style={[styles.circleAction, { borderColor: colors.border }]}
              onPress={() =>
                Share.share({
                  message: `Join my quest: ${item.data.title}\n${item.data.description}\nLocation: ${item.data.location?.placeName || ''}\nLink: fom://quest/${item.data.id}`,
                })
              }>
              <Ionicons name="share-social-outline" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderQuestEmpty = () => {
    if (loading && items.length === 0) {
      return <Text style={[styles.muted, { color: colors.textMuted }]}>Loading your quests...</Text>;
    }
    if (!loading && filteredQuestItems.length === 0 && query.trim().length > 0) {
      return <Text style={[styles.muted, { color: colors.textMuted }]}>No matching results for &quot;{query}&quot;.</Text>;
    }
    if (!loading && items.length === 0) {
      return <Text style={[styles.muted, { color: colors.textMuted }]}>No feed items yet.</Text>;
    }
    return null;
  };

  if (segment === 'joined') {
    return (
      <SwipeTabsScreen tab="index">
        <SafeAreaView style={[styles.container, { backgroundColor: colors.screen }]} edges={['top']}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadFeed({ force: true, userInitiated: true, silent: true }).catch(console.warn)}
                tintColor={colors.primary}
                colors={[colors.primary]}
                progressBackgroundColor={colors.surface}
              />
            }>
            {renderHeader()}
            <View style={styles.storyRow}>
              {filteredJoinedQuests.map((item) => (
                <Pressable
                  key={item.instanceId}
                  style={styles.storyItem}
                  onPress={() => router.push(`/quest/${item.quest?.id}?instanceId=${item.instanceId}&joined=1`)}>
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
              {filteredJoinedQuests.length === 0 && (
                <Text style={[styles.muted, { color: colors.textMuted }]}>
                  {query.trim() ? 'No matching joined quests.' : 'No joined quests yet.'}
                </Text>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </SwipeTabsScreen>
    );
  }

  return (
    <SwipeTabsScreen tab="index">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.screen }]} edges={['top']}>
        <FlatList
          data={filteredQuestItems}
          keyExtractor={(item) => `${item.type}-${item.data.id}`}
          renderItem={renderQuestCard}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderQuestEmpty}
          contentContainerStyle={styles.content}
          style={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadFeed({ force: true, userInitiated: true, silent: true }).catch(console.warn)}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.surface}
            />
          }
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={5}
        />
      </SafeAreaView>
    </SwipeTabsScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 24 },
  headerContent: { gap: 16, paddingBottom: 16 },
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
  notificationBadge: {
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
  notificationBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
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
    marginBottom: 16,
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
  joinBlock: { flex: 1, gap: 4 },
  paidAmountText: {
    fontSize: 15,
    color: '#2F6B4F',
    textAlign: 'left',
    fontFamily: theme.fonts.display,
  },
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
});
