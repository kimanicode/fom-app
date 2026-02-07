import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/auth';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { ModalAlert } from '../components/ui/ModalAlert';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
      } else {
        const me = await api.getMe();
        setProfile(me);
        await setOnboardingComplete(true);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Please try again.');
      setErrorOpen(true);
    }
  };

  const submitProfile = async () => {
    try {
      if (selected.length < 3) {
        setErrorMessage('Pick at least 3 interests.');
        setErrorOpen(true);
        return;
      }
      const payload = { name, alias, ageRange, interests: selected, city, bio };
      const profile = await api.updateProfile(payload);
      setProfile(profile);
      await setOnboardingComplete(true);
    } catch (e: any) {
      setErrorMessage(e.message || 'Please check your profile.');
      setErrorOpen(true);
    }
  };

  const remaining = useMemo(() => Math.max(0, 3 - selected.length), [selected.length]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {step === 'auth' ? (
        <View style={styles.authCenter}>
          <View style={styles.logoRow}>
            <Ionicons name="compass" size={22} color="#A88B7E" />
          </View>
          <Text style={styles.brand}>FOM</Text>
          <Text style={styles.tagline}>Social media, but for real life.</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#B7AAA0"
            value={email}
            onChangeText={setEmail}
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#B7AAA0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {mode === 'signup' && (
            <>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="yourname"
                placeholderTextColor="#B7AAA0"
                value={username}
                onChangeText={setUsername}
              />
            </>
          )}
          <Button label={mode === 'signup' ? 'Sign Up' : 'Sign In'} onPress={submitAuth} />
          <Pressable style={styles.forgotLink} onPress={() => setForgotOpen(true)}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>
          <Pressable style={styles.ghostButton} onPress={() => setStep('interests')}>
            <Text style={styles.ghostText}>Continue as Guest</Text>
          </Pressable>
          <Pressable
            style={styles.switchMode}
            onPress={() => setMode((m) => (m === 'login' ? 'signup' : 'login'))}>
            <Text style={styles.switchText}>
              {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.stepRow}>
            <Text style={styles.stepText}>✨ Step 1 of 1</Text>
            <Pressable style={styles.closeButton} onPress={() => setStep('auth')}>
              <Ionicons name="close" size={18} color="#6E6158" />
            </Pressable>
          </View>
          <Text style={styles.title}>What gets you moving?</Text>
          <Text style={styles.subtitle}>
            Pick a few interests so we can find quests you'll love. Choose at least 3.
          </Text>

          <View style={styles.grid}>
            {interests.map((tag) => {
              const active = selected.includes(tag.id);
              return (
                <Pressable
                  key={tag.id}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() =>
                    setSelected((prev) =>
                      prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                    )
                  }>
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{tag.name}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.ctaBox}>
            <Pressable style={styles.primaryCta} onPress={submitProfile}>
              <Text style={styles.primaryCtaText}>
                {remaining > 0 ? `Select ${remaining} more` : 'Continue'}
              </Text>
            </Pressable>
            <Pressable onPress={() => setStep('auth')}>
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          </View>
        </>
      )}

      <Modal visible={forgotOpen} transparent animationType="fade" onRequestClose={() => setForgotOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reset password</Text>
            <Text style={styles.modalSubtitle}>We will send reset instructions to your email.</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#B7AAA0"
              value={forgotEmail}
              onChangeText={setForgotEmail}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.ghostButton} onPress={() => setForgotOpen(false)}>
                <Text style={styles.ghostText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.primaryCta}
                onPress={async () => {
                  await api.forgotPassword(forgotEmail);
                  setForgotOpen(false);
                  setErrorMessage('If an account exists, you will receive reset instructions.');
                  setErrorOpen(true);
                }}>
                <Text style={styles.primaryCtaText}>Send</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ModalAlert
        visible={errorOpen}
        message={errorMessage}
        onClose={() => setErrorOpen(false)}
      />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  scroll: { flex: 1 },
  content: { padding: 24, gap: 12 },
  authCenter: { flex: 1, justifyContent: 'center', gap: 12 },
  logoRow: { alignItems: 'center', marginTop: 6 },
  brand: { fontSize: 32, fontFamily: theme.fonts.displayBold, color: '#2F2A26', textAlign: 'center' },
  tagline: { textAlign: 'center', color: '#7C6F66', marginBottom: 8 },
  label: { fontSize: 12, color: '#6E6158', fontFamily: theme.fonts.sansMedium },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFE4DA',
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#2F2A26',
  },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  orLine: { flex: 1, height: 1, backgroundColor: '#EFE4DA' },
  orText: { color: '#9A8E86', fontSize: 11 },
  ghostButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE4DA',
  },
  ghostText: { color: '#2F2A26', fontWeight: '600' },
  switchMode: { alignItems: 'center', marginTop: 6 },
  switchText: { color: '#7C6F66', fontSize: 12 },
  forgotLink: { alignItems: 'center', marginTop: 6 },
  forgotText: { color: '#7C6F66', fontSize: 12, textDecorationLine: 'underline' },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepText: { color: '#B7AAA0', fontSize: 12 },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFE4DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontFamily: theme.fonts.displayBold, color: '#2F2A26' },
  subtitle: { color: '#7C6F66', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE4DA',
  },
  pillActive: { borderColor: '#8FB39F', backgroundColor: '#EFF6F1' },
  pillText: { color: '#2F2A26', fontWeight: '600' },
  pillTextActive: { color: '#2F6B4F' },
  ctaBox: { marginTop: 6, alignItems: 'center', gap: 10 },
  primaryCta: {
    width: '100%',
    backgroundColor: '#3C7A57',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryCtaText: { color: '#FFFFFF', fontWeight: '700' },
  skipText: { color: '#8B7E74', fontSize: 12 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#2F2A26' },
  modalSubtitle: { color: '#7C6F66', fontSize: 12 },
  modalActions: { flexDirection: 'row', gap: 10 },
});
