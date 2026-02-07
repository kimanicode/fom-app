import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../components/ui/Button';
import { api, apiFetch } from '../../lib/api';

const uploadUrl = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_URL || '';
const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

export default function PostCreateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [media, setMedia] = useState<any>(null);

  const pickMedia = async () => {
    const mediaTypes = (ImagePicker as any).MediaType?.Images
      ? [(ImagePicker as any).MediaType.Images, (ImagePicker as any).MediaType.Videos]
      : undefined;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      allowsEditing: true,
    });
    if (!result.canceled) {
      setMedia(result.assets[0]);
    }
  };

  const upload = async () => {
    if (!media) return;
    let targetUrl = uploadUrl;
    let signaturePayload: any = null;
    if (!uploadPreset) {
      signaturePayload = await apiFetch('/media/sign', {
        method: 'POST',
        body: JSON.stringify({ folder: 'stories' }),
      });
      targetUrl = signaturePayload.uploadUrl;
    }
    const formData = new FormData();
    formData.append('file', {
      uri: media.uri,
      name: media.fileName || 'upload.jpg',
      type: media.mimeType || 'image/jpeg',
    } as any);
    if (uploadPreset) formData.append('upload_preset', uploadPreset);
    if (signaturePayload) {
      formData.append('api_key', signaturePayload.apiKey);
      formData.append('timestamp', String(signaturePayload.timestamp));
      formData.append('signature', signaturePayload.signature);
      if (signaturePayload.folder) formData.append('folder', signaturePayload.folder);
    }

    const res = await fetch(targetUrl, {
      method: 'POST',
      body: formData,
    });
    const json = await res.json();
    const mediaType = media.type === 'video' ? 'video' : 'photo';

    await api.createPost(String(id), {
      mediaUrl: json.secure_url,
      mediaType,
      durationSeconds: media.duration ? Math.round(media.duration) : undefined,
    });

    Alert.alert('Posted', 'Your quest story is live.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Post Your Quest</Text>
      {media && <Image source={{ uri: media.uri }} style={styles.preview} />}
      <Button label="Pick photo/video" onPress={pickMedia} />
      <Button label="Upload & post" variant="secondary" onPress={upload} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#F8FAFC', padding: 20 },
  title: { fontSize: 22, fontWeight: '700' },
  preview: { width: 220, height: 220, borderRadius: 16 },
});
