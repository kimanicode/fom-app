import { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import { api, apiFetch } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export default function CreateQuestScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [durationHours, setDurationHours] = useState('1');
  const [maxParticipants, setMaxParticipants] = useState('8');
  const [vibeTag, setVibeTag] = useState<'chill' | 'active' | 'creative' | 'curious'>('chill');
  const [photo, setPhoto] = useState<any>(null);
  const [createdQuest, setCreatedQuest] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [cost, setCost] = useState('0');

  const uploadUrl = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_URL || '';
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

  const pickPhoto = async () => {
    const imageMediaTypes = (ImagePicker as any).MediaType?.Images
      ? [(ImagePicker as any).MediaType.Images]
      : undefined;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: imageMediaTypes,
      allowsEditing: true,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
  };

  const uploadPhoto = async () => {
    if (!photo) return null;
    let targetUrl = uploadUrl;
    let signaturePayload: any = null;
    if (!uploadPreset) {
      signaturePayload = await apiFetch('/media/sign', {
        method: 'POST',
        body: JSON.stringify({ folder: 'quests' }),
      });
      targetUrl = signaturePayload.uploadUrl;
    }
    const formData = new FormData();
    formData.append('file', {
      uri: photo.uri,
      name: photo.fileName || 'quest.jpg',
      type: photo.mimeType || 'image/jpeg',
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
    return json.secure_url as string;
  };

  const combinedStart = useMemo(() => {
    const date = new Date(startDate);
    date.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    return date;
  }, [startDate, startTime]);

  const submit = async () => {
    try {
      if (!photo) {
        Alert.alert('Photo required', 'Add a photo before publishing.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const imageUrl = await uploadPhoto();
      if (!imageUrl) return;
      const created = await api.createQuest({
        title,
        description,
        vibeTag,
        imageUrl,
        location: {
          placeName,
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        },
        startTime: combinedStart.toISOString(),
        durationMinutes: Math.max(1, Number(durationHours)) * 60,
        maxParticipants: Number(maxParticipants),
        cost: 'free',
      });
      setCreatedQuest(created?.template || null);
      Alert.alert('Quest created');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Unable to create quest');
    }
  };

  const shareQuest = async () => {
    if (!createdQuest) return;
    const shareText = `Join my quest: ${createdQuest.title}\n${createdQuest.description}\nLocation: ${createdQuest.location?.placeName || ''}\nLink: fom://quest/${createdQuest.id}`;
    await Share.share({ message: shareText });
  };

  const onDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) setStartDate(selected);
  };

  const onTimeChange = (_event: DateTimePickerEvent, selected?: Date) => {
    setShowTimePicker(false);
    if (selected) setStartTime(selected);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create a Quest</Text>
      </View>

      <View style={styles.coverBox}>
        {photo ? <Image source={{ uri: photo.uri }} style={styles.coverImage} /> : null}
        {!photo && (
          <View style={styles.coverPlaceholder}>
            <Text style={styles.coverIcon}>📷</Text>
            <Text style={styles.coverText}>Add cover image</Text>
          </View>
        )}
        <Button label={photo ? 'Change photo' : 'Add cover image'} onPress={pickPhoto} />
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.label}>Quest Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Sunrise sketching at the pier"
          placeholderTextColor="#B7AAA0"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="What will participants do? What should they bring?"
          placeholderTextColor="#B7AAA0"
          value={description}
          onChangeText={setDescription}
          multiline
        />
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.label}>Location *</Text>
        <TextInput
          style={styles.input}
          placeholder="Search for a public place..."
          placeholderTextColor="#B7AAA0"
          value={placeName}
          onChangeText={setPlaceName}
        />
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.label}>Quest Vibe *</Text>
        <View style={styles.vibeGrid}>
          {([
            { key: 'chill', title: 'Chill', desc: 'Relaxed, low-energy activities' },
            { key: 'creative', title: 'Creative', desc: 'Art, music, or expression' },
            { key: 'active', title: 'Active', desc: 'Physical or high-energy' },
            { key: 'curious', title: 'Curious', desc: 'Learning or exploring' },
          ] as const).map((item) => (
            <View
              key={item.key}
              style={[styles.vibeCard, vibeTag === item.key && styles.vibeCardActive]}>
              <Text style={styles.vibeTitle}>{item.title}</Text>
              <Text style={styles.vibeDesc}>{item.desc}</Text>
              <Button
                label={vibeTag === item.key ? 'Selected' : 'Select'}
                variant="secondary"
                onPress={() => setVibeTag(item.key)}
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.pickerBlock}>
          <Text style={styles.label}>Date</Text>
          <Button label={startDate.toDateString()} variant="secondary" onPress={() => setShowDatePicker(true)} />
        </View>
        <View style={styles.pickerBlock}>
          <Text style={styles.label}>Time</Text>
          <Button
            label={startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            variant="secondary"
            onPress={() => setShowTimePicker(true)}
          />
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker value={startDate} mode="date" display="default" onChange={onDateChange} />
      )}
      {showTimePicker && (
        <DateTimePicker value={startTime} mode="time" display="default" onChange={onTimeChange} />
      )}

      <View style={styles.row}>
        <View style={styles.pickerBlock}>
          <Text style={styles.label}>Duration</Text>
          <View style={styles.inlineInput}>
            <TextInput
              style={styles.inputInline}
              value={durationHours}
              onChangeText={setDurationHours}
              keyboardType="numeric"
            />
            <Text style={styles.inlineSuffix}>hours</Text>
          </View>
        </View>
        <View style={styles.pickerBlock}>
          <Text style={styles.label}>Max People</Text>
          <View style={styles.inlineInput}>
            <TextInput
              style={styles.inputInline}
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              keyboardType="numeric"
            />
            <Text style={styles.inlineSuffix}>people</Text>
          </View>
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.label}>Cost (optional)</Text>
        <View style={styles.inlineInput}>
          <Text style={styles.inlinePrefix}>$</Text>
          <TextInput
            style={styles.inputInline}
            value={cost}
            onChangeText={setCost}
            keyboardType="numeric"
          />
        </View>
        <Text style={styles.helper}>Leave at 0 for free quests</Text>
      </View>

      <Button label="Create Quest" onPress={submit} />
      {createdQuest && <Button label="Share Quest" variant="secondary" onPress={shareQuest} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F2' },
  scroll: { flex: 1 },
  content: { padding: 18, gap: 14 },
  header: { marginBottom: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#3C2F25' },
  coverBox: {
    backgroundColor: '#F7F2ED',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFE4DA',
    padding: 14,
    gap: 10,
  },
  coverImage: { width: '100%', height: 180, borderRadius: 12 },
  coverPlaceholder: {
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E3D6CC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  coverIcon: { fontSize: 18 },
  coverText: { color: '#8B7E74' },
  fieldBlock: { gap: 8 },
  label: { fontSize: 12, color: '#6E6158', fontWeight: '600' },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFE4DA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#3C2F25',
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  pickerBlock: { flex: 1, gap: 6 },
  inlineInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFE4DA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputInline: { flex: 1, color: '#3C2F25' },
  inlineSuffix: { color: '#8B7E74', fontSize: 12 },
  inlinePrefix: { color: '#8B7E74', fontSize: 12 },
  helper: { fontSize: 11, color: '#9A8E86' },
  vibeGrid: { gap: 10 },
  vibeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFE4DA',
    padding: 12,
    gap: 6,
  },
  vibeCardActive: { borderColor: '#E56A3C' },
  vibeTitle: { fontSize: 13, fontWeight: '700', color: '#3C2F25' },
  vibeDesc: { fontSize: 12, color: '#8B7E74' },
});
