import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { api, apiFetch } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/auth';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { DEFAULT_LOCATION_LABEL, getCurrentLocationDetails } from '../../lib/location';
import { theme } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { SwipeTabsScreen } from '../../components/navigation/SwipeTabsScreen';

const palette = {
  light: {
    screen: '#F4EEE8',
    surface: '#F7F2EC',
    surfaceAlt: '#F8F4EF',
    surfaceRaised: '#FCFAF7',
    border: '#E6DDD3',
    borderSoft: '#ECE2D9',
    text: '#2F241C',
    muted: '#7C6F66',
    mutedSoft: '#8B7E74',
    accent: '#E56A3C',
    accentSurface: '#FFE7DB',
    greenSurface: '#E6F4EA',
    greenText: '#2F6B4F',
    goldSurface: '#FFEFD6',
    goldText: '#D97706',
    segmentBg: '#E8E0D8',
    segmentActive: '#FFFFFF',
    actionBg: 'rgba(255,255,255,0.65)',
    actionBorder: 'rgba(226, 213, 201, 0.95)',
    modalSurface: '#FFF',
    overlay: 'rgba(0,0,0,0.6)',
    warm: '#F3D9CB',
    cool: '#DCE8DE',
    glow: '#E9D8B6',
    band: 'rgba(255,255,255,0.16)',
    tagBg: '#D9E8DA',
    tagText: '#315E47',
    tagSmallBg: '#F3EEE7',
    tagSmallBorder: '#DED1C3',
    tagSmallText: '#5D4C40',
    shareBg: '#FFF1E8',
    questMeta: '#6E6158',
    walletText: '#7C6F66',
  },
  dark: {
    screen: '#121110',
    surface: '#1D1A18',
    surfaceAlt: '#221F1D',
    surfaceRaised: '#262220',
    border: '#3A3430',
    borderSoft: '#433C37',
    text: '#F4ECE4',
    muted: '#B0A59B',
    mutedSoft: '#9D9187',
    accent: '#FF9C73',
    accentSurface: '#4B2D20',
    greenSurface: '#22362B',
    greenText: '#95D3AA',
    goldSurface: '#473626',
    goldText: '#F0C37C',
    segmentBg: '#2A2623',
    segmentActive: '#38322E',
    actionBg: 'rgba(37,33,30,0.92)',
    actionBorder: '#4B423B',
    modalSurface: '#1C1917',
    overlay: 'rgba(0,0,0,0.78)',
    warm: '#3C2B25',
    cool: '#233028',
    glow: '#4A3A27',
    band: 'rgba(255,255,255,0.05)',
    tagBg: '#26342B',
    tagText: '#A3D0B1',
    tagSmallBg: '#302923',
    tagSmallBorder: '#4B4036',
    tagSmallText: '#D7C3AE',
    shareBg: '#32261F',
    questMeta: '#B7AA9F',
    walletText: '#B0A59B',
  },
} as const;

export default function ProfileScreen() {
  const { token, profile, setProfile, signOut } = useAuthStore();
  const appTheme = useColorScheme() ?? 'light';
  const [loading, setLoading] = useState(true);
  const [showAvatar, setShowAvatar] = useState(false);
  const [savedQuests, setSavedQuests] = useState<any[]>([]);
  const [createdQuests, setCreatedQuests] = useState<any[]>([]);
  const [creatorWallet, setCreatorWallet] = useState<any>(null);
  const [segment, setSegment] = useState<'done' | 'saved' | 'created'>('saved');
  const [detectedLocation, setDetectedLocation] = useState(DEFAULT_LOCATION_LABEL);

  const uploadUrl = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_URL || '';
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';
  const colors = palette[appTheme];

  const shareQuest = async (quest: any) => {
    try {
      const shareText = `Join my quest: ${quest.title}\n${quest.description || ''}\nLocation: ${
        quest.location?.placeName || ''
      }\nLink: fom://quest/${quest.id}`;
      await Share.share({ message: shareText });
    } catch (e) {
      console.warn(e);
    }
  };

  const load = useCallback(async () => {
    if (!token) {
      setSavedQuests([]);
      setCreatedQuests([]);
      setCreatorWallet(null);
      setLoading(false);
      return;
    }

    try {
      const [me, saved, created, wallet] = await Promise.all([
        api.getMe(),
        api.getSavedQuests(),
        api.getCreatedQuests(),
        api.getCreatorWallet(),
      ]);
      setProfile(me);
      setSavedQuests(saved as any[]);
      setCreatedQuests(created as any[]);
      setCreatorWallet(wallet);
    } catch (e: any) {
      Alert.alert('Unable to load profile', e?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [setProfile, token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const resolveLocation = async () => {
      try {
        const currentLocation = await getCurrentLocationDetails(profile?.city || DEFAULT_LOCATION_LABEL);
        setDetectedLocation(currentLocation.label);
      } catch {
        setDetectedLocation(profile?.city || DEFAULT_LOCATION_LABEL);
      }
    };

    resolveLocation().catch(console.warn);
  }, [profile?.city]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!token) {
    return (
      <SwipeTabsScreen tab="profile">
        <SafeAreaView style={[styles.container, { backgroundColor: colors.screen }]} edges={['top']}>
          <View style={styles.content}>
            <View style={[styles.profileHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.headerGradientWarm, { backgroundColor: colors.warm }]} />
              <View style={[styles.headerGradientCool, { backgroundColor: colors.cool }]} />
              <View style={[styles.headerGradientGlow, { backgroundColor: colors.glow }]} />
              <View style={[styles.headerTopBand, { backgroundColor: colors.band }]} />
              <View style={styles.avatarRow}>
                <View style={[styles.avatarCircle, { backgroundColor: colors.accent, borderColor: colors.surface }]}>
                  <Text style={styles.avatarLetter}>{(profile?.name || 'G').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.nameBlock}>
                  <Text style={[styles.title, { color: colors.text }]}>{profile?.name || 'Guest'}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={12} color={colors.mutedSoft} />
                    <Text style={[styles.metaText, { color: colors.mutedSoft }]}>{profile?.city || DEFAULT_LOCATION_LABEL}</Text>
                  </View>
                </View>
              </View>
              <Text style={[styles.bioText, { color: colors.questMeta }]}>
                Sign in to sync your profile, saved quests, and creator activity across devices.
              </Text>
            </View>

            <Button label="Sign In Or Create Account" onPress={() => router.replace('/onboarding')} />
          </View>
        </SafeAreaView>
      </SwipeTabsScreen>
    );
  }

  if (loading) {
    return (
      <SwipeTabsScreen tab="profile">
        <View style={[styles.container, { backgroundColor: colors.screen }]}>
          <Text style={[styles.muted, { color: colors.muted }]}>Loading profile...</Text>
        </View>
      </SwipeTabsScreen>
    );
  }

  const completedQuestsCount = profile?.stats?.completedQuestsCount ?? 0;
  const activeQuestsCount = profile?.stats?.activeQuestsCount ?? 0;
  const averageRating = profile?.stats?.averageRating ?? 0;

  return (
    <SwipeTabsScreen tab="profile">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.screen }]} edges={['top']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={[styles.profileHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.headerGradientWarm, { backgroundColor: colors.warm }]} />
        <View style={[styles.headerGradientCool, { backgroundColor: colors.cool }]} />
        <View style={[styles.headerGradientGlow, { backgroundColor: colors.glow }]} />
        <View style={[styles.headerTopBand, { backgroundColor: colors.band }]} />
        <View style={styles.avatarRow}>
          <Pressable
            style={[styles.avatarCircle, { backgroundColor: colors.accent, borderColor: colors.surface }]}
            onPress={() => profile?.avatarUrl && setShowAvatar(true)}>
            {profile?.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarLetter}>{(profile?.name || 'A').charAt(0).toUpperCase()}</Text>
            )}
          </Pressable>
          <View style={styles.nameBlock}>
            <Text style={[styles.title, { color: colors.text }]}>{profile?.name || 'Adventurer'}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={12} color={colors.mutedSoft} />
              <Text style={[styles.metaText, { color: colors.mutedSoft }]}>{detectedLocation}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={[styles.iconButton, { backgroundColor: colors.actionBg, borderColor: colors.actionBorder }]}
              onPress={async () => {
                try {
                  let targetUrl = uploadUrl;
                  let signaturePayload: any = null;
                  if (!uploadPreset) {
                    signaturePayload = await apiFetch('/media/sign', {
                      method: 'POST',
                      body: JSON.stringify({ folder: 'avatars' }),
                    });
                    targetUrl = signaturePayload.uploadUrl;
                  }
                  const imageMediaTypes = (ImagePicker as any).MediaType?.Images
                    ? [(ImagePicker as any).MediaType.Images]
                    : undefined;
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: imageMediaTypes,
                    allowsEditing: true,
                  });
                  if (result.canceled) return;
                  const asset = result.assets[0];
                  const formData = new FormData();
                  formData.append('file', {
                    uri: asset.uri,
                    name: asset.fileName || 'avatar.jpg',
                    type: asset.mimeType || 'image/jpeg',
                  } as any);
                  if (uploadPreset) formData.append('upload_preset', uploadPreset);
                  if (signaturePayload) {
                    formData.append('api_key', signaturePayload.apiKey);
                    formData.append('timestamp', String(signaturePayload.timestamp));
                    formData.append('signature', signaturePayload.signature);
                    if (signaturePayload.folder) formData.append('folder', signaturePayload.folder);
                  }
                  const res = await fetch(targetUrl, { method: 'POST', body: formData });
                  const json = await res.json();
                  const updated = await api.updateProfile({
                    name: profile?.name || '',
                    alias: profile?.alias || '',
                    ageRange: profile?.ageRange || '25-34',
                    city: profile?.city || '',
                    bio: profile?.bio || '',
                    interests: (profile?.interests || []).map((i: any) => i.id),
                    avatarUrl: json.secure_url,
                  });
                  setProfile(updated);
                } catch (e: any) {
                  Alert.alert('Unable to update avatar', e?.message || 'Please try again.');
                }
              }}>
              <Ionicons name="camera" size={16} color={colors.accent} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/settings')}
              style={[styles.iconButton, { backgroundColor: colors.actionBg, borderColor: colors.actionBorder }]}>
              <Ionicons name="settings-outline" size={18} color={colors.questMeta} />
            </Pressable>
          </View>
        </View>
        <Text style={[styles.bioText, { color: colors.questMeta }]}>
          {profile?.bio || 'Curious soul. Always looking for the next adventure.'}
        </Text>
        <View style={styles.tagRow}>
          {(profile?.interests || []).slice(0, 4).map((tag: any) => (
            <View key={tag.id} style={[styles.tagPill, { backgroundColor: colors.tagBg }]}>
              <Text style={[styles.tagText, { color: colors.tagText }]}>{tag.name}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: colors.accentSurface }]}>
            <Ionicons name="trending-up" size={14} color={colors.accent} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{completedQuestsCount}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedSoft }]}>Quests Done</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: colors.greenSurface }]}>
            <Ionicons name="time" size={14} color={colors.greenText} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{activeQuestsCount}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedSoft }]}>Active Quests</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: colors.goldSurface }]}>
            <Ionicons name="star" size={14} color={colors.goldText} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{averageRating.toFixed(1)}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedSoft }]}>Avg Rating</Text>
        </View>
      </View>

      <View style={[styles.segment, { backgroundColor: colors.segmentBg, borderColor: colors.border }]}>
        <Pressable
          style={[styles.segmentTab, segment === 'done' && styles.segmentActive, segment === 'done' && { backgroundColor: colors.segmentActive }]}
          onPress={() => setSegment('done')}>
          <Text
            style={
              segment === 'done'
                ? [styles.segmentTextActive, { color: colors.text }]
                : [styles.segmentText, { color: colors.muted }]
            }>
            Done
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segmentTab, segment === 'saved' && styles.segmentActive, segment === 'saved' && { backgroundColor: colors.segmentActive }]}
          onPress={() => setSegment('saved')}>
          <Text
            style={
              segment === 'saved'
                ? [styles.segmentTextActive, { color: colors.text }]
                : [styles.segmentText, { color: colors.muted }]
            }>
            Saved
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segmentTab, segment === 'created' && styles.segmentActive, segment === 'created' && { backgroundColor: colors.segmentActive }]}
          onPress={() => setSegment('created')}>
          <Text
            style={
              segment === 'created'
                ? [styles.segmentTextActive, { color: colors.text }]
                : [styles.segmentText, { color: colors.muted }]
            }>
            Created
          </Text>
        </Pressable>
      </View>

      <View style={styles.questList}>
        {segment === 'saved' &&
          savedQuests.map((item) => (
            <View
              key={item.id}
              style={[styles.questRow, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderSoft }]}>
              <Image
                source={{
                  uri:
                    item.imageUrl ||
                    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
                }}
                style={styles.thumb}
              />
              <View style={styles.questInfo}>
                <Text style={[styles.questTitle, { color: colors.text }]}>{item.title}</Text>
                <View style={styles.questMetaRow}>
                  <Ionicons name="location-outline" size={12} color={colors.mutedSoft} />
                  <Text style={[styles.questMetaText, { color: colors.mutedSoft }]}>{item.location?.placeName}</Text>
                </View>
                <View
                  style={[
                    styles.tagPillSmall,
                    { backgroundColor: colors.tagSmallBg, borderColor: colors.tagSmallBorder },
                  ]}>
                  <Text style={[styles.tagTextSmall, { color: colors.tagSmallText }]}>{item.vibeTag}</Text>
                </View>
              </View>
              <Text style={[styles.questCount, { color: colors.mutedSoft }]}>Saved</Text>
            </View>
          ))}
        {segment !== 'saved' && (
          <>
            {segment === 'created' &&
              createdQuests.map((item) => (
                <View
                  key={item.id}
                  style={[styles.questRow, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderSoft }]}>
                  <Image
                    source={{
                      uri:
                        item.imageUrl ||
                        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
                    }}
                    style={styles.thumb}
                  />
                  <View style={styles.questInfo}>
                    <Text style={[styles.questTitle, { color: colors.text }]}>{item.title}</Text>
                    <View style={styles.questMetaRow}>
                      <Ionicons name="location-outline" size={12} color={colors.mutedSoft} />
                      <Text style={[styles.questMetaText, { color: colors.mutedSoft }]}>{item.location?.placeName}</Text>
                    </View>
                    <View style={styles.createdMetaRow}>
                      <Text style={[styles.createdMetaText, { color: colors.questMeta }]}>
                        Joined: {item.metadata?.joinedCount ?? 0}
                      </Text>
                      <Text style={[styles.createdMetaText, { color: colors.questMeta }]}>
                        Paid: {item.metadata?.paidCount ?? 0}
                      </Text>
                      <Text style={[styles.createdMetaText, { color: colors.questMeta }]}>
                        Revenue: KSh {Math.round((item.metadata?.paidAmountCents ?? 0) / 100)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.questCount, { color: colors.mutedSoft }]}>
                    KSh {Math.round((item.metadata?.creatorEarningsCents ?? 0) / 100)}
                  </Text>
                  <Pressable
                    style={[styles.questShareButton, { backgroundColor: colors.shareBg, borderColor: colors.borderSoft }]}
                    onPress={() => shareQuest(item)}>
                    <Ionicons name="share-social-outline" size={16} color={colors.accent} />
                  </Pressable>
                </View>
              ))}
            {segment === 'created' && createdQuests.length === 0 && (
              <View style={[styles.emptyState, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderSoft }]}>
                <Text style={[styles.emptyText, { color: colors.mutedSoft }]}>No created quests yet.</Text>
              </View>
            )}
          </>
        )}
        {segment !== 'saved' && segment !== 'created' && (
          <View style={[styles.emptyState, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderSoft }]}>
            <Text style={[styles.emptyText, { color: colors.mutedSoft }]}>No items yet.</Text>
          </View>
        )}
      </View>

      <View style={[styles.walletCard, { backgroundColor: colors.surfaceRaised, borderColor: colors.borderSoft }]}>
        <Text style={[styles.walletTitle, { color: colors.text }]}>Creator Wallet</Text>
        <Text style={[styles.walletAmount, { color: colors.walletText }]}>
          KSh {Math.round(Number(creatorWallet?.withdrawableCents || 0) / 100)} available
        </Text>
        <Button
          label="Request Withdrawal"
          variant="secondary"
          onPress={async () => {
            try {
              const amountCents = Number(creatorWallet?.withdrawableCents || 0);
              if (amountCents < 100) {
                Alert.alert('No withdrawable balance yet');
                return;
              }
              await api.requestWithdrawal(amountCents, 'manual_bank_transfer');
              Alert.alert('Withdrawal requested', 'Your request has been submitted for processing.');
              const wallet = await api.getCreatorWallet();
              setCreatorWallet(wallet);
            } catch (e: any) {
              Alert.alert('Withdrawal failed', e?.message || 'Please try again.');
            }
          }}
        />
      </View>

      <Button label="Report" variant="secondary" onPress={() => router.push('/report')} />
      <Button label="Block User" variant="secondary" onPress={() => router.push('/block')} />
      <Button label="Sign Out" onPress={() => signOut()} />

      <Modal visible={showAvatar} transparent animationType="fade" onRequestClose={() => setShowAvatar(false)}>
        <Pressable style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]} onPress={() => setShowAvatar(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalSurface }]}>
            {profile?.avatarUrl && <Image source={{ uri: profile.avatarUrl }} style={styles.modalImage} />}
          </View>
        </Pressable>
      </Modal>
        </ScrollView>
      </SafeAreaView>
    </SwipeTabsScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4EEE8' },
  scroll: { flex: 1 },
  content: { padding: 18, gap: 14, paddingBottom: 28 },
  muted: { color: '#7C6F66', fontFamily: theme.fonts.sansMedium },
  profileHeader: {
    backgroundColor: '#F7F2EC',
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6DDD3',
    gap: 12,
    overflow: 'hidden',
    shadowColor: '#A88C76',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  headerGradientWarm: {
    position: 'absolute',
    top: -40,
    left: -10,
    width: 220,
    height: 180,
    borderRadius: 999,
    backgroundColor: '#F3D9CB',
    opacity: 0.85,
  },
  headerGradientCool: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 240,
    height: 190,
    borderRadius: 999,
    backgroundColor: '#DCE8DE',
    opacity: 0.95,
  },
  headerGradientGlow: {
    position: 'absolute',
    top: 34,
    right: 70,
    width: 150,
    height: 90,
    borderRadius: 999,
    backgroundColor: '#E9D8B6',
    opacity: 0.5,
  },
  headerTopBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 118,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#E56A3C',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#F7F2EC',
    marginTop: 28,
    shadowColor: '#A95A37',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarLetter: { color: '#FFF', fontFamily: theme.fonts.displayBold, fontSize: 28 },
  nameBlock: { flex: 1, gap: 4, marginTop: 30 },
  title: { fontSize: 31, fontFamily: theme.fonts.displayBold, color: '#2F241C', letterSpacing: -0.8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#7F7167', fontSize: 14, fontFamily: theme.fonts.sansMedium },
  bioText: { color: '#7A685C', fontSize: 14, lineHeight: 22, fontFamily: theme.fonts.sans },
  tagRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tagPill: {
    backgroundColor: '#D9E8DA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: { fontSize: 12, color: '#315E47', fontFamily: theme.fonts.sansSemi },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F4EF',
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#EBE1D8',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 28, fontFamily: theme.fonts.displayBold, color: '#2F241C' },
  statLabel: { fontSize: 12, color: '#8B7E74', fontFamily: theme.fonts.sansMedium, textAlign: 'center' },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#E8E0D8',
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E0D6CD',
  },
  segmentTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 999 },
  segmentActive: { backgroundColor: '#FFFFFF' },
  segmentText: { color: '#7C6F66', fontFamily: theme.fonts.sansSemi, fontSize: 13 },
  segmentTextActive: { color: '#3C2F25', fontFamily: theme.fonts.display, fontSize: 13 },
  questList: { gap: 10 },
  questRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FCFAF7',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECE2D9',
  },
  thumb: { width: 72, height: 72, borderRadius: 16 },
  questInfo: { flex: 1, gap: 4 },
  questTitle: { fontSize: 20, fontFamily: theme.fonts.display, color: '#2F241C', letterSpacing: -0.4 },
  questMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  questMetaText: { fontSize: 13, color: '#8B7E74', fontFamily: theme.fonts.sansMedium },
  createdMetaRow: { gap: 2 },
  createdMetaText: { fontSize: 11, color: '#6E6158', fontFamily: theme.fonts.sansMedium },
  tagPillSmall: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3EEE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DED1C3',
  },
  tagTextSmall: { fontSize: 11, fontFamily: theme.fonts.sansSemi, color: '#5D4C40' },
  questCount: { fontSize: 11, color: '#9A8E86', fontFamily: theme.fonts.sansMedium },
  questShareButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1E8',
    borderWidth: 1,
    borderColor: '#F0E6DE',
  },
  emptyState: {
    backgroundColor: '#FCFAF7',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECE2D9',
    alignItems: 'center',
  },
  emptyText: { color: '#8B7E74', fontSize: 12, fontFamily: theme.fonts.sansMedium },
  walletCard: {
    backgroundColor: '#FCFAF7',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECE2D9',
    gap: 8,
  },
  walletTitle: { fontSize: 15, fontFamily: theme.fonts.display, color: '#2F241C' },
  walletAmount: { fontSize: 13, color: '#7C6F66', fontFamily: theme.fonts.sansMedium },
  headerActions: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 26,
  },
  iconButton: {
    padding: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
  },
  modalImage: { width: '100%', height: 320, borderRadius: 12 },
});
