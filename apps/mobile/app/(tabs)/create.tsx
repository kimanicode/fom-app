import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import { api, apiFetch } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useAppTheme } from '../../constants/app-theme';
import { SwipeTabsScreen } from '../../components/navigation/SwipeTabsScreen';

export default function CreateQuestScreen() {
  const { colors } = useAppTheme();
  type SelectedLocation = {
    placeName: string;
    lat: number;
    lng: number;
  };

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [resolvingLocation, setResolvingLocation] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [durationHours, setDurationHours] = useState('1');
  const [maxParticipants, setMaxParticipants] = useState('8');
  const [vibeTag, setVibeTag] = useState<'chill' | 'active' | 'creative' | 'curious'>('chill');
  const [photo, setPhoto] = useState<any>(null);
  const [createdQuest, setCreatedQuest] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [cost, setCost] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState<'idle' | 'uploading' | 'creating'>('idle');

  const uploadUrl = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_URL || '';
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPlaceName('');
    setSelectedLocation(null);
    setResolvingLocation(false);
    setStartDate(new Date());
    setStartTime(new Date());
    setDurationHours('1');
    setMaxParticipants('8');
    setVibeTag('chill');
    setPhoto(null);
    setCreatedQuest(null);
    setShowDatePicker(false);
    setShowTimePicker(false);
    setCost('');
  };

  const pickPhoto = async () => {
    try {
      const imageMediaTypes = (ImagePicker as any).MediaType?.Images
        ? [(ImagePicker as any).MediaType.Images]
        : undefined;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: imageMediaTypes,
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled) {
        setPhoto(result.assets[0]);
      }
    } catch (e: any) {
      Alert.alert('Unable to pick image', e?.message || 'Please try again.');
    }
  };

  const uploadPhoto = async () => {
    try {
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
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message || 'Please try again.');
      return null;
    }
  };

  const combinedStart = useMemo(() => {
    const date = new Date(startDate);
    date.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    return date;
  }, [startDate, startTime]);

  const formatReverseGeocode = (item: Location.LocationGeocodedAddress) => {
    const parts = [item.name, item.street, item.city, item.region].filter(Boolean);
    return parts.join(', ');
  };

  const useCurrentLocation = async () => {
    try {
      setResolvingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location permission required', 'Enable location permission to use your current location.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const reverse = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      const resolvedName = reverse.length > 0 ? formatReverseGeocode(reverse[0]) : 'Current location';
      setPlaceName(resolvedName);
      setSelectedLocation({
        placeName: resolvedName,
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });
    } catch (e: any) {
      Alert.alert('Unable to get current location', e?.message || 'Please try again.');
    } finally {
      setResolvingLocation(false);
    }
  };

  const findLocationFromInput = async () => {
    try {
      const query = placeName.trim();
      if (!query) {
        Alert.alert('Add a location', 'Enter a place name before searching.');
        return;
      }
      setResolvingLocation(true);
      const results = await Location.geocodeAsync(query);
      if (!results.length) {
        Alert.alert('Location not found', 'Try a more specific place name.');
        return;
      }
      const first = results[0];
      setSelectedLocation({
        placeName: query,
        lat: first.latitude,
        lng: first.longitude,
      });
    } catch (e: any) {
      Alert.alert('Unable to find location', e?.message || 'Please try again.');
    } finally {
      setResolvingLocation(false);
    }
  };

  const submit = async () => {
    if (submitting) return;
    try {
      if (!photo) {
        Alert.alert('Photo required', 'Add a photo before publishing.');
        return;
      }
      if (!selectedLocation) {
        Alert.alert('Location required', 'Select a location using "Use Current Location" or "Find Location".');
        return;
      }
      const parsedCost = Number(cost || '0');
      if (!Number.isFinite(parsedCost) || parsedCost < 0) {
        Alert.alert('Invalid cost', 'Enter a valid cost amount.');
        return;
      }
      const costAmountCents = Math.round(parsedCost * 100);
      const costType = costAmountCents > 0 ? 'paid' : 'free';
      setSubmitting(true);
      setSubmitStage('uploading');
      const imageUrl = await uploadPhoto();
      if (!imageUrl) return;
      setSubmitStage('creating');
      const created = await api.createQuest({
        title,
        description,
        vibeTag,
        imageUrl,
        location: {
          placeName: selectedLocation.placeName,
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
        },
        startTime: combinedStart.toISOString(),
        durationMinutes: Math.max(1, Number(durationHours)) * 60,
        maxParticipants: Number(maxParticipants),
        costType,
        costAmountCents,
        currency: 'KES',
      });
      setCreatedQuest(created?.template || null);
      Alert.alert('Quest created', 'Your quest is now live.', [
        {
          text: 'OK',
          onPress: () => {
            resetForm();
            router.replace({ pathname: '/(tabs)', params: { refreshFeed: '1' } });
          },
        },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Unable to create quest');
    } finally {
      setSubmitting(false);
      setSubmitStage('idle');
    }
  };

  const submitLabel =
    submitStage === 'uploading'
      ? 'Uploading cover...'
      : submitStage === 'creating'
        ? 'Creating quest...'
        : 'Create Quest';

  const shareQuest = async () => {
    try {
      if (!createdQuest) return;
      const shareText = `Join my quest: ${createdQuest.title}\n${createdQuest.description}\nLocation: ${createdQuest.location?.placeName || ''}\nLink: fom://quest/${createdQuest.id}`;
      await Share.share({ message: shareText });
    } catch (e) {
      console.warn(e);
    }
  };

  const onDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextDate = new Date(selected);
      nextDate.setHours(0, 0, 0, 0);
      setStartDate(nextDate < today ? today : nextDate);
    }
  };

  const onTimeChange = (_event: DateTimePickerEvent, selected?: Date) => {
    setShowTimePicker(false);
    if (selected) setStartTime(selected);
  };

  return (
    <SwipeTabsScreen tab="create">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.screen }]} edges={['top']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Create a Quest</Text>
      </View>

      <Pressable style={[styles.coverBox, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]} onPress={pickPhoto}>
        {photo ? <Image source={{ uri: photo.uri }} style={styles.coverImage} /> : null}
        {!photo && (
          <View style={styles.coverPlaceholder}>
            <Text style={styles.coverIcon}>📷</Text>
            <Text style={[styles.coverText, { color: colors.textMuted }]}>Add cover image</Text>
          </View>
        )}
        <Button label={photo ? 'Change photo' : 'Add cover image'} onPress={pickPhoto} />
      </Pressable>

      <View style={styles.fieldBlock}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Quest Title *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="e.g., Sunrise sketching at the pier"
          placeholderTextColor={colors.textSoft}
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.fieldBlock}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textarea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="What will participants do? What should they bring?"
          placeholderTextColor={colors.textSoft}
          value={description}
          onChangeText={setDescription}
          multiline
        />
      </View>

      <View style={styles.fieldBlock}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Location *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="Search for a public place..."
          placeholderTextColor={colors.textSoft}
          value={placeName}
          onChangeText={(value) => {
            setPlaceName(value);
            setSelectedLocation(null);
          }}
        />
        <View style={styles.locationActions}>
          <Button
            label={resolvingLocation ? 'Resolving...' : 'Use Current Location'}
            variant="secondary"
            onPress={useCurrentLocation}
          />
          <Button
            label={resolvingLocation ? 'Resolving...' : 'Find Location'}
            variant="secondary"
            onPress={findLocationFromInput}
          />
        </View>
        {selectedLocation && (
          <View style={[styles.locationResolved, { backgroundColor: colors.surface, borderColor: colors.successSoft }]}>
            <Text style={[styles.locationResolvedTitle, { color: colors.success }]}>Selected location</Text>
            <Text style={[styles.locationResolvedText, { color: colors.text }]}>{selectedLocation.placeName}</Text>
            <Text style={[styles.locationResolvedMeta, { color: colors.textMuted }]}>
              {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.fieldBlock}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Quest Vibe *</Text>
        <View style={styles.vibeGrid}>
          {([
            { key: 'chill', title: 'Chill', desc: 'Relaxed, low-energy activities' },
            { key: 'creative', title: 'Creative', desc: 'Art, music, or expression' },
            { key: 'active', title: 'Active', desc: 'Physical or high-energy' },
            { key: 'curious', title: 'Curious', desc: 'Learning or exploring' },
          ] as const).map((item) => (
            <View
              key={item.key}
              style={[
                styles.vibeCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                vibeTag === item.key && { borderColor: colors.primary },
              ]}>
              <Text style={[styles.vibeTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.vibeDesc, { color: colors.textMuted }]}>{item.desc}</Text>
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
          <Text style={[styles.label, { color: colors.textMuted }]}>Date</Text>
          <Button label={startDate.toDateString()} variant="secondary" onPress={() => setShowDatePicker(true)} />
        </View>
        <View style={styles.pickerBlock}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Time</Text>
          <Button
            label={startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            variant="secondary"
            onPress={() => setShowTimePicker(true)}
          />
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={onDateChange}
        />
      )}
      {showTimePicker && (
        <DateTimePicker value={startTime} mode="time" display="default" onChange={onTimeChange} />
      )}

      <View style={styles.row}>
        <View style={styles.pickerBlock}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Duration</Text>
          <View style={[styles.inlineInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.inputInline, { color: colors.text }]}
              value={durationHours}
              onChangeText={setDurationHours}
              keyboardType="numeric"
            />
            <Text style={[styles.inlineSuffix, { color: colors.textMuted }]}>hours</Text>
          </View>
        </View>
        <View style={styles.pickerBlock}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Max People</Text>
          <View style={[styles.inlineInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.inputInline, { color: colors.text }]}
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              keyboardType="numeric"
            />
            <Text style={[styles.inlineSuffix, { color: colors.textMuted }]}>people</Text>
          </View>
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Cost</Text>
        <View style={[styles.inlineInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.inlinePrefix, { color: colors.textMuted }]}>KSh</Text>
          <TextInput
            style={[styles.inputInline, { color: colors.text }]}
            value={cost}
            onChangeText={setCost}
            placeholder="0"
            placeholderTextColor={colors.textSoft}
            keyboardType="numeric"
          />
        </View>
        <Text style={[styles.helper, { color: colors.textSoft }]}>Leave at 0 for free quests</Text>
      </View>

      <Button label={submitLabel} onPress={submit} loading={submitting} />
      {submitting && (
        <View style={[styles.progressCard, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <Text style={[styles.progressTitle, { color: colors.text }]}>
            {submitStage === 'uploading' ? 'Uploading your cover image' : 'Publishing your quest'}
          </Text>
          <Text style={[styles.progressBody, { color: colors.textMuted }]}>
            {submitStage === 'uploading'
              ? 'Your quest details are ready. Finishing the image upload now.'
              : 'The server is saving the quest and opening it to participants.'}
          </Text>
        </View>
      )}
      {createdQuest && <Button label="Share Quest" variant="secondary" onPress={shareQuest} />}
        </ScrollView>
      </SafeAreaView>
    </SwipeTabsScreen>
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
  locationActions: { gap: 8 },
  locationResolved: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6F4EA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  locationResolvedTitle: { fontSize: 12, color: '#2F6B4F', fontWeight: '700' },
  locationResolvedText: { color: '#3C2F25', fontWeight: '600' },
  locationResolvedMeta: { color: '#7C6F66', fontSize: 12 },
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
  progressCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressBody: {
    fontSize: 12,
    lineHeight: 18,
  },
});
