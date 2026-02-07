import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Tag } from '../components/ui/Tag';
import { useAuthStore } from '../store/auth';

export default function OnboardingScreen() {
  const { setToken, setProfile, setOnboardingComplete } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'auth' | 'interests'>('auth');

  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [ageRange, setAgeRange] = useState('25-34');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    api.listInterests().then(setInterests).catch(console.warn);
  }, []);

  const submitAuth = async () => {
    try {
      const res =
        mode === 'signup'
          ? await api.signup(email, password, username)
          : await api.login(email, password);
      await setToken(res.accessToken);
      if (mode === 'signup') {
        setStep('interests');
      }
    } catch (e: any) {
      Alert.alert('Auth failed', e.message || 'Please try again.');
    }
  };

  const submitProfile = async () => {
    try {
      const payload = { name, alias, ageRange, interests: selected, city, bio };
      const profile = await api.updateProfile(payload);
      setProfile(profile);
      await setOnboardingComplete(true);
    } catch (e: any) {
      Alert.alert('Profile error', e.message || 'Please check your profile.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Welcome to FOM</Text>
      {step === 'auth' ? (
        <>
          <Text style={styles.muted}>Earn your content by completing real-life quests.</Text>
          <View style={styles.row}>
            <Button label="Sign up" variant={mode === 'signup' ? 'primary' : 'secondary'} onPress={() => setMode('signup')} />
            <Button label="Log in" variant={mode === 'login' ? 'primary' : 'secondary'} onPress={() => setMode('login')} />
          </View>
          {mode === 'signup' && (
            <Input label="Username" value={username} onChangeText={setUsername} placeholder="yourname" />
          )}
          <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" />
          <Input label="Password" value={password} onChangeText={setPassword} placeholder="Min 8 characters" secureTextEntry />
          <Button label={mode === 'signup' ? 'Create account' : 'Continue'} onPress={submitAuth} />
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>Pick your interests</Text>
          <Input label="Name" value={name} onChangeText={setName} />
          <Input label="Alias" value={alias} onChangeText={setAlias} />
          <Input label="Age range" value={ageRange} onChangeText={setAgeRange} />
          <Input label="City" value={city} onChangeText={setCity} />
          <Input label="Bio" value={bio} onChangeText={setBio} />
          <Text style={styles.muted}>Pick at least one interest</Text>
          <View style={styles.tags}>
            {interests.map((tag) => {
              const active = selected.includes(tag.id);
              return (
                <Tag
                  key={tag.id}
                  label={tag.name}
                  selected={active}
                  onPress={() => {
                    setSelected((prev) =>
                      prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                    );
                  }}
                />
              );
            })}
          </View>
          <Button label="Finish" onPress={submitProfile} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF1F2' },
  content: { padding: 24, gap: 12 },
  title: { fontSize: 26, fontWeight: '700', color: '#BE123C' },
  subtitle: { fontSize: 20, fontWeight: '600', color: '#9F1239' },
  muted: { color: '#9F1239' },
  row: { flexDirection: 'row', gap: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap' },
});
