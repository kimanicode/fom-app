import { useCallback, useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api, apiFetch } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/auth';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';

export default function ProfileScreen() {
  const { profile, setProfile, signOut } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [showAvatar, setShowAvatar] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedQuests, setSavedQuests] = useState<any[]>([]);
  const [segment, setSegment] = useState<'done' | 'saved' | 'created'>('saved');

  const uploadUrl = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_URL || '';
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

  const load = useCallback(async () => {
    try {
      const [me, saved] = await Promise.all([api.getMe(), api.getSavedQuests()]);
      setProfile(me);
      setSavedQuests(saved as any[]);
    } finally {
      setLoading(false);
    }
  }, [setProfile]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.profileHeader}>
        <View style={styles.headerGradient} />
        <Pressable onPress={() => router.push('/settings')} style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={18} color="#6E6158" />
        </Pressable>
        <View style={styles.avatarRow}>
          <Pressable
            style={styles.avatarCircle}
            onPress={() => profile?.avatarUrl && setShowAvatar(true)}>
            {profile?.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarLetter}>{(profile?.name || 'A').charAt(0).toUpperCase()}</Text>
            )}
          </Pressable>
          <View style={styles.nameBlock}>
            <Text style={styles.title}>{profile?.name || 'Adventurer'}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={12} color="#8B7E74" />
              <Text style={styles.metaText}>{profile?.city || 'San Diego, CA'}</Text>
            </View>
          </View>
          <Pressable
            style={styles.cameraButton}
            onPress={async () => {
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
              setUploading(true);
              try {
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
              } finally {
                setUploading(false);
              }
            }}>
            <Ionicons name="camera" size={16} color="#E56A3C" />
          </Pressable>
        </View>
        <Text style={styles.bioText}>
          {profile?.bio || 'Curious soul. Always looking for the next adventure.'}
        </Text>
        <View style={styles.tagRow}>
          {(profile?.interests || []).slice(0, 4).map((tag: any) => (
            <View key={tag.id} style={styles.tagPill}>
              <Text style={styles.tagText}>{tag.name}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#FFE7DB' }]}>
            <Ionicons name="sparkles" size={14} color="#E56A3C" />
          </View>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#E6F4EA' }]}>
            <Ionicons name="calendar" size={14} color="#2F6B4F" />
          </View>
          <Text style={styles.statValue}>3</Text>
          <Text style={styles.statLabel}>Created</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#FFEFD6' }]}>
            <Ionicons name="bookmark" size={14} color="#D97706" />
          </View>
          <Text style={styles.statValue}>{savedQuests.length}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
      </View>

      <View style={styles.segment}>
        <Pressable
          style={[styles.segmentTab, segment === 'done' && styles.segmentActive]}
          onPress={() => setSegment('done')}>
          <Text style={segment === 'done' ? styles.segmentTextActive : styles.segmentText}>Done</Text>
        </Pressable>
        <Pressable
          style={[styles.segmentTab, segment === 'saved' && styles.segmentActive]}
          onPress={() => setSegment('saved')}>
          <Text style={segment === 'saved' ? styles.segmentTextActive : styles.segmentText}>Saved</Text>
        </Pressable>
        <Pressable
          style={[styles.segmentTab, segment === 'created' && styles.segmentActive]}
          onPress={() => setSegment('created')}>
          <Text style={segment === 'created' ? styles.segmentTextActive : styles.segmentText}>Created</Text>
        </Pressable>
      </View>

      <View style={styles.questList}>
        {segment === 'saved' &&
          savedQuests.map((item) => (
            <View key={item.id} style={styles.questRow}>
              <Image
                source={{
                  uri:
                    item.imageUrl ||
                    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
                }}
                style={styles.thumb}
              />
              <View style={styles.questInfo}>
                <Text style={styles.questTitle}>{item.title}</Text>
                <View style={styles.questMetaRow}>
                  <Ionicons name="location-outline" size={12} color="#8B7E74" />
                  <Text style={styles.questMetaText}>{item.location?.placeName}</Text>
                </View>
                <View style={styles.tagPillSmall}>
                  <Text style={styles.tagTextSmall}>{item.vibeTag}</Text>
                </View>
              </View>
              <Text style={styles.questCount}>Saved</Text>
            </View>
          ))}
        {segment !== 'saved' && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No items yet.</Text>
          </View>
        )}
      </View>

      <Button label="Report" variant="secondary" onPress={() => router.push('/report')} />
      <Button label="Block User" variant="secondary" onPress={() => router.push('/block')} />
      <Button label="Sign Out" onPress={() => signOut()} />

      <Modal visible={showAvatar} transparent animationType="fade" onRequestClose={() => setShowAvatar(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowAvatar(false)}>
          <View style={styles.modalContent}>
            {profile?.avatarUrl && <Image source={{ uri: profile.avatarUrl }} style={styles.modalImage} />}
          </View>
        </Pressable>
      </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F2' },
  scroll: { flex: 1 },
  content: { padding: 18, gap: 14 },
  muted: { color: '#7C6F66' },
  profileHeader: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0E6DE',
    gap: 10,
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    height: 120,
    backgroundColor: '#FCE7D4',
    opacity: 0.9,
  },
  settingsButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFF',
    padding: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F0E6DE',
    zIndex: 2,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 36 },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E56A3C',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarLetter: { color: '#FFF', fontWeight: '700', fontSize: 20 },
  nameBlock: { gap: 4 },
  title: { fontSize: 18, fontWeight: '700', color: '#3C2F25' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#8B7E74', fontSize: 12 },
  bioText: { color: '#7C6F66', fontSize: 12 },
  tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tagPill: { backgroundColor: '#E6F4EA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  tagText: { fontSize: 11, color: '#2F6B4F', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#F0E6DE',
  },
  statIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 16, fontWeight: '700', color: '#3C2F25' },
  statLabel: { fontSize: 11, color: '#8B7E74' },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#EFE7E0',
    borderRadius: 999,
    padding: 4,
  },
  segmentTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 999 },
  segmentActive: { backgroundColor: '#FFFFFF' },
  segmentText: { color: '#7C6F66', fontWeight: '600', fontSize: 12 },
  segmentTextActive: { color: '#3C2F25', fontWeight: '700', fontSize: 12 },
  questList: { gap: 10 },
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
  tagPillSmall: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tagTextSmall: { fontSize: 10, fontWeight: '600', color: '#2F6B4F' },
  questCount: { fontSize: 11, color: '#9A8E86' },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0E6DE',
    alignItems: 'center',
  },
  emptyText: { color: '#8B7E74', fontSize: 12 },
  cameraButton: {
    marginLeft: 'auto',
    marginRight: 4,
    backgroundColor: '#FFF1E8',
    padding: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F0E6DE',
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
