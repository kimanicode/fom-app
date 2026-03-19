import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../../lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/auth';
import { requireAuth } from '../../lib/require-auth';
import { DEFAULT_LOCATION_LABEL, getCurrentLocationDetails } from '../../lib/location';
import { theme } from '../../constants/theme';
import { useAppTheme } from '../../constants/app-theme';
import { SwipeTabsScreen } from '../../components/navigation/SwipeTabsScreen';
import { TabSkeletonScreen } from '../../components/ui/TabSkeletonScreen';

const DAY_MS = 24 * 60 * 60 * 1000;
const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'into',
  'your',
  'this',
  'that',
  'near',
  'after',
  'before',
  'around',
  'through',
  'quest',
  'quests',
  'meet',
  'join',
]);

type Quest = {
  id: string;
  title: string;
  description?: string;
  vibeTag?: string;
  imageUrl?: string;
  startTime?: string;
  createdAt?: string;
  savesCount?: number;
  participantsCount?: number;
  location?: {
    placeName?: string;
    lat?: number;
    lng?: number;
  };
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function getSearchHaystack(quest: Quest) {
  return [
    quest.title,
    quest.description,
    quest.vibeTag,
    quest.location?.placeName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function getEngagementScore(quest: Quest) {
  return Number(quest.participantsCount || 0) * 2 + Number(quest.savesCount || 0);
}

function tokenizeTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

export default function ExploreScreen() {
  const { colors } = useAppTheme();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [query, setQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();
  const [locationLabel, setLocationLabel] = useState(DEFAULT_LOCATION_LABEL);

  const trimmedQuery = query.trim();

  const filteredQuests = useMemo(() => {
    if (!trimmedQuery) return quests;
    const tokens = normalizeText(trimmedQuery).split(/\s+/).filter(Boolean);
    return quests.filter((quest) => {
      const haystack = getSearchHaystack(quest);
      return tokens.every((token) => haystack.includes(token));
    });
  }, [quests, trimmedQuery]);

  const trendingTerms = useMemo(() => {
    const termScores = new Map<string, number>();

    for (const quest of quests) {
      const score = Math.max(1, getEngagementScore(quest));
      const vibe = normalizeText(quest.vibeTag || '');
      if (vibe) {
        const label = vibe.replace(/\b\w/g, (char) => char.toUpperCase());
        termScores.set(label, (termScores.get(label) || 0) + score);
      }

      const tokens = tokenizeTitle(quest.title || '');
      for (let index = 0; index < tokens.length; index += 1) {
        const single = tokens[index];
        const singleLabel = single.replace(/\b\w/g, (char) => char.toUpperCase());
        termScores.set(singleLabel, (termScores.get(singleLabel) || 0) + score);

        const next = tokens[index + 1];
        if (next) {
          const phrase = `${single} ${next}`.replace(/\b\w/g, (char) => char.toUpperCase());
          termScores.set(phrase, (termScores.get(phrase) || 0) + score + 1);
        }
      }
    }

    return [...termScores.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([label]) => label)
      .filter((label, index, items) => items.indexOf(label) === index)
      .slice(0, 8);
  }, [quests]);

  const popularLocations = useMemo(() => {
    const locationScores = new Map<string, { label: string; score: number }>();

    for (const quest of quests) {
      const placeName = quest.location?.placeName?.trim();
      if (!placeName) continue;
      const key = placeName.toLowerCase();
      const score = Math.max(1, getEngagementScore(quest));
      const current = locationScores.get(key);
      if (current) {
        current.score += score;
      } else {
        locationScores.set(key, { label: placeName, score });
      }
    }

    return [...locationScores.values()]
      .sort((left, right) => right.score - left.score)
      .slice(0, 6);
  }, [quests]);

  const featuredToday = useMemo(() => {
    const now = Date.now();
    const tomorrow = now + DAY_MS;
    const todayCandidates = quests.filter((quest) => {
      const startTime = new Date(quest.startTime || 0).getTime();
      return startTime >= now && startTime <= tomorrow;
    });
    const source = todayCandidates.length > 0 ? todayCandidates : quests;

    return [...source]
      .sort((left, right) => {
        const scoreDelta = getEngagementScore(right) - getEngagementScore(left);
        if (scoreDelta !== 0) return scoreDelta;
        return new Date(left.startTime || 0).getTime() - new Date(right.startTime || 0).getTime();
      })
      .slice(0, 4);
  }, [quests]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const currentLocation = await getCurrentLocationDetails();
        setLocationLabel(currentLocation.label);
        const list = currentLocation.granted
          ? await api.listQuests(currentLocation.coords.latitude, currentLocation.coords.longitude)
          : await api.listQuests();
        setQuests(list as Quest[]);
        if (token) {
          const unread = await api.notificationsUnread();
          setUnreadCount((unread as any[]).length || 0);
        } else {
          setUnreadCount(0);
        }
      } catch (e: any) {
        Alert.alert('Unable to load explore feed', e?.message || 'Please try again.');
      } finally {
        setLoading(false);
      }
    };

    load().catch(console.warn);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      api.notificationsUnread()
        .then((unread: any) => setUnreadCount((unread as any[]).length || 0))
        .catch(console.warn);
    }, [token])
  );

  const openQuest = (id: string) => router.push(`/quest/${id}`);

  if (loading) {
    return (
      <SwipeTabsScreen tab="explore">
        <TabSkeletonScreen variant="explore" />
      </SwipeTabsScreen>
    );
  }

  const renderQuestCard = (quest: Quest, meta: string, fallback: string) => (
    <Pressable
      key={quest.id}
      style={[styles.questCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => openQuest(quest.id)}>
      <Image source={{ uri: quest.imageUrl || fallback }} style={styles.thumb} />
      <View style={styles.questInfo}>
        <Text style={styles.questTitle} numberOfLines={1}>
          {quest.title}
        </Text>
        <View style={styles.questMetaRow}>
          <Ionicons name="location-outline" size={12} color={colors.textMuted} />
          <Text style={[styles.questMetaText, { color: colors.textMuted }]} numberOfLines={1}>
            {quest.location?.placeName || 'Location TBD'}
          </Text>
        </View>
        <View style={styles.metaBottomRow}>
          <View style={[styles.tagPill, { backgroundColor: colors.successSoft }]}>
            <Text style={[styles.tagText, { color: colors.success }]}>{quest.vibeTag || 'Quest'}</Text>
          </View>
          <Text style={[styles.questMetaAside, { color: colors.textSoft }]}>{meta}</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SwipeTabsScreen tab="explore">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.screen }]} edges={['top']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
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
                <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.searchBlock}>
          <Text style={[styles.searchTitle, { color: colors.text }]}>Find what you want</Text>
          <Text style={[styles.searchSubtitle, { color: colors.textMuted }]}>
            Search by quest title, place, or vibe when you already know the kind of experience you want.
          </Text>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={16} color={colors.textSoft} />
            <TextInput
              placeholder="Search quests, places, vibes..."
              placeholderTextColor={colors.textSoft}
              value={query}
              onChangeText={setQuery}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {trimmedQuery.length > 0 && (
              <Pressable onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textSoft} />
              </Pressable>
            )}
          </View>
        </View>

        {!loading && quests.length === 0 && <Text style={[styles.stateText, { color: colors.textMuted }]}>No quests available right now.</Text>}

        {!loading && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="trending-up" size={16} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Trending Searches</Text>
            </View>
            <View style={styles.chipRow}>
              {trendingTerms.map((term) => (
                <Pressable key={term} style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setQuery(term)}>
                  <Text style={[styles.chipText, { color: colors.chipText }]}>{term}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <Ionicons name="map-outline" size={16} color={colors.success} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Locations</Text>
            </View>
            <View style={styles.locationGrid}>
              {popularLocations.map((location) => (
                <Pressable
                  key={location.label}
                  style={[styles.locationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => setQuery(location.label)}>
                  <Ionicons name="navigate-circle-outline" size={18} color={colors.success} />
                  <Text style={[styles.locationCardText, { color: colors.text }]}>{location.label}</Text>
                </Pressable>
              ))}
            </View>

            {trimmedQuery.length > 0 ? (
              <>
                <View style={styles.sectionHeader}>
                  <Ionicons name="search-outline" size={16} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Search Results</Text>
                </View>
                {filteredQuests.length > 0 ? (
                  <View style={styles.sectionList}>
                    {filteredQuests.map((quest, index) =>
                      renderQuestCard(
                        quest,
                        `${Number(quest.participantsCount || 0)} joined`,
                        index % 2 === 0
                          ? 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600'
                          : 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600'
                      )
                    )}
                  </View>
                ) : (
                  <Text style={[styles.stateText, { color: colors.textMuted }]}>No results for &quot;{trimmedQuery}&quot;.</Text>
                )}
              </>
            ) : (
              <>
                <View style={styles.sectionHeader}>
                  <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Today</Text>
                </View>
                <Text style={[styles.featuredHint, { color: colors.textMuted }]}>
                  Curated picks for right now, before you start narrowing things down.
                </Text>
                <View style={styles.sectionList}>
                  {featuredToday.map((quest, index) =>
                    renderQuestCard(
                      quest,
                      `${Number(quest.participantsCount || 0) + Number(quest.savesCount || 0)} active`,
                      index % 2 === 0
                        ? 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=600'
                        : 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600'
                    )
                  )}
                </View>
              </>
            )}
          </>
        )}
        </ScrollView>
      </SafeAreaView>
    </SwipeTabsScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F2' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 24 },
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
  locationText: { color: '#E56A3C', fontSize: 12, fontFamily: theme.fonts.sansSemi },
  brand: { fontSize: 18, fontFamily: theme.fonts.displayBold, color: '#E56A3C' },
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
  searchBlock: { gap: 8 },
  searchTitle: { fontSize: 20, fontFamily: theme.fonts.displayBold, color: '#2F2A26' },
  searchSubtitle: { color: '#7C6F66', fontFamily: theme.fonts.sans, lineHeight: 20 },
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
  searchInput: { flex: 1, color: '#3C2F25', fontFamily: theme.fonts.sans },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  sectionTitle: { fontSize: 14, fontFamily: theme.fonts.displayBold, color: '#3C2F25' },
  sectionList: { gap: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#FFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#EFE7E0',
  },
  chipText: { color: '#5F4B3F', fontFamily: theme.fonts.sansSemi, fontSize: 12 },
  locationGrid: { gap: 10 },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#F0E6DE',
  },
  locationCardText: { flex: 1, color: '#3C2F25', fontFamily: theme.fonts.sansSemi },
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0E6DE',
  },
  thumb: { width: 64, height: 64, borderRadius: 14 },
  questInfo: { flex: 1, gap: 4 },
  questTitle: { fontSize: 14, fontFamily: theme.fonts.display, color: '#3C2F25' },
  questMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  questMetaText: { flex: 1, fontSize: 12, color: '#8B7E74', fontFamily: theme.fonts.sans },
  metaBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  questMetaAside: { color: '#9A8E86', fontSize: 11, fontFamily: theme.fonts.sansMedium },
  tagPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagText: { fontSize: 11, fontFamily: theme.fonts.sansSemi, color: '#2F6B4F', textTransform: 'capitalize' },
  featuredHint: { color: '#8B7E74', fontFamily: theme.fonts.sans, lineHeight: 18 },
  stateText: { color: '#8B7E74', fontFamily: theme.fonts.sansMedium },
});
