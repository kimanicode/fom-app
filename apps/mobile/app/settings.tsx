import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function SettingsScreen() {
  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [ageRange, setAgeRange] = useState('25-34');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

  useEffect(() => {
    api.getMe().then((me: any) => {
      setName(me.name || '');
      setAlias(me.alias || '');
      setAgeRange(me.ageRange || '25-34');
      setCity(me.city || '');
      setBio(me.bio || '');
      setInterests((me.interests || []).map((i: any) => i.id));
    });
  }, []);

  const save = async () => {
    try {
      await api.updateProfile({ name, alias, ageRange, city, bio, interests });
      Alert.alert('Profile updated');
    } catch (e: any) {
      Alert.alert('Update failed', e.message || 'Try again');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      <Input label="Name" value={name} onChangeText={setName} />
      <Input label="Alias" value={alias} onChangeText={setAlias} />
      <Input label="Age range" value={ageRange} onChangeText={setAgeRange} />
      <Input label="City" value={city} onChangeText={setCity} />
      <Input label="Bio" value={bio} onChangeText={setBio} />
      <Button label="Save" onPress={save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECFDF3' },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#065F46' },
});
