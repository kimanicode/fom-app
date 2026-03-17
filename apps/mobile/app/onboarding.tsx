import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, resetApiUnauthorizedState } from '../lib/api';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/auth';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { ModalAlert } from '../components/ui/ModalAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildInterestSections, TaxonomyNode } from '../lib/taxonomy';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function OnboardingScreen() {
  const { token, setToken, setProfile, setOnboardingComplete } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'auth' | 'interests'>('auth');

  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [ageRange] = useState('25-34');
  const [city, setCity] = useState('');
  const [bio] = useState('');
  const [taxonomy, setTaxonomy] = useState<TaxonomyNode[]>([]);
  const [tagGroups, setTagGroups] = useState<Record<string, any[]>>({});
  const [interestsLoading, setInterestsLoading] = useState(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<string[]>([]);
  const [selectedInterestIds, setSelectedInterestIds] = useState<string[]>([]);
  const [intentTags, setIntentTags] = useState<string[]>([]);
  const [vibePreferences, setVibePreferences] = useState<string[]>([]);
  const [audienceAffinities, setAudienceAffinities] = useState<string[]>([]);
  const [locationPreferences, setLocationPreferences] = useState<string[]>([]);
  const [timePreferences, setTimePreferences] = useState<string[]>([]);
  const [pricePreferences, setPricePreferences] = useState<string[]>([]);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    setInterestsLoading(true);
    api
      .getTaxonomy()
      .then((data: any) => {
        setTaxonomy(data.interestTree || []);
        setTagGroups(data.groups || {});
      })
      .catch((error) => {
        console.warn(error);
        setErrorMessage('Unable to load interests. Please try again.');
        setErrorOpen(true);
      })
      .finally(() => setInterestsLoading(false));
  }, []);

  const beginInterestSetup = useCallback((profile: any) => {
    setProfile(profile);
    setName((current) => current || profile?.name || profile?.alias || '');
    setAlias((current) => current || profile?.alias || profile?.name || '');
    setCity((current) => current || profile?.city || 'Nairobi');
    setStep('interests');
  }, [setProfile]);

  const completeSignedInSession = useCallback(async (accessToken: string, fallbackToInterests = false) => {
    resetApiUnauthorizedState();
    const tokenPromise = setToken(accessToken);
    const mePromise = api.getMe();
    await tokenPromise;
    const me = await mePromise;

    const hasCompletedInterests = new Set([
      ...(me?.selectedCategoryIds || []),
      ...(me?.selectedSubcategoryIds || []),
      ...(me?.selectedInterestIds || []),
    ]).size >= 3;
    const hasProfileBasics =
      Boolean(me?.name?.trim()) &&
      Boolean(me?.alias?.trim()) &&
      Boolean(me?.city?.trim());

    if (hasCompletedInterests && hasProfileBasics && !fallbackToInterests) {
      setProfile(me);
      await setOnboardingComplete(true);
      router.replace('/(tabs)');
      return;
    }

    await setOnboardingComplete(false);
    beginInterestSetup(me);
  }, [beginInterestSetup, setOnboardingComplete, setProfile, setToken]);

  const submitAuth = async () => {
    try {
      setAuthLoading(true);
      if (!supabase) {
        throw new Error('Supabase auth is not configured in the mobile app.');
      }

      if (mode === 'signup') {
        const normalizedUsername = username.trim();
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              user_name: normalizedUsername,
              full_name: normalizedUsername,
            },
          },
        });

        if (error) throw error;
        if (!data.session?.access_token) {
          throw new Error('Check your email to confirm your account, then sign in.');
        }

        setName((current) => current || normalizedUsername);
        setAlias((current) => current || normalizedUsername);
        setCity((current) => current || 'Nairobi');
        await completeSignedInSession(data.session.access_token, true);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      if (!data.session?.access_token) {
        throw new Error('Supabase did not return a session.');
      }

      await completeSignedInSession(data.session.access_token);
    } catch (e: any) {
      setErrorMessage(e.message || 'Please try again.');
      setErrorOpen(true);
    } finally {
      setAuthLoading(false);
    }
  };

  const continueWithGoogle = async () => {
    if (!supabase) {
      setErrorMessage('Supabase auth is not configured in the mobile app.');
      setErrorOpen(true);
      return;
    }

    try {
      setGoogleLoading(true);
      const redirectTo = Linking.createURL('/onboarding');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('Supabase did not return an auth URL.');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success' || !result.url) {
        if (result.type !== 'cancel' && result.type !== 'dismiss') {
          throw new Error('Google sign-in was not completed.');
        }
        return;
      }

      const parsedUrl = Linking.parse(result.url);
      const queryParams = (parsedUrl.queryParams ?? {}) as Record<string, string | string[] | undefined>;
      const hashParams = new URLSearchParams(result.url.split('#')[1] || '');
      const code =
        (typeof queryParams.code === 'string' ? queryParams.code : undefined) ||
        hashParams.get('code') ||
        undefined;
      const accessToken =
        (typeof queryParams.access_token === 'string' ? queryParams.access_token : undefined) ||
        hashParams.get('access_token') ||
        undefined;
      const refreshToken =
        (typeof queryParams.refresh_token === 'string' ? queryParams.refresh_token : undefined) ||
        hashParams.get('refresh_token') ||
        undefined;

      if (code) {
        const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
        if (!sessionData.session?.access_token) {
          throw new Error('Supabase did not return an access token.');
        }
        await completeSignedInSession(sessionData.session.access_token);
        return;
      }

      if (accessToken && refreshToken) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
        if (!sessionData.session?.access_token) {
          throw new Error('Supabase did not return an access token.');
        }
        await completeSignedInSession(sessionData.session.access_token);
        return;
      }

      throw new Error('Supabase redirect did not include a usable session.');
    } catch (e: any) {
      setErrorMessage(e.message || 'Google sign-in failed.');
      setErrorOpen(true);
    } finally {
      setGoogleLoading(false);
    }
  };

  const submitProfile = async () => {
    try {
      const totalInterestSelections = new Set([
        ...selectedCategoryIds,
        ...selectedSubcategoryIds,
        ...selectedInterestIds,
      ]).size;

      if (totalInterestSelections < 3) {
        setErrorMessage('Pick at least 3 interests across categories, subcategories, or specific interests.');
        setErrorOpen(true);
        return;
      }
      const trimmedName = name.trim();
      const trimmedAlias = alias.trim();
      const trimmedCity = city.trim();

      if (trimmedName.length < 2) {
        setErrorMessage('Name must be at least 2 characters.');
        setErrorOpen(true);
        return;
      }

      if (trimmedAlias.length < 2) {
        setErrorMessage('Alias must be at least 2 characters.');
        setErrorOpen(true);
        return;
      }

      if (trimmedCity.length < 2) {
        setErrorMessage('City must be at least 2 characters.');
        setErrorOpen(true);
        return;
      }

      const payload = {
        name: trimmedName,
        alias: trimmedAlias,
        ageRange,
        interests: selectedInterestIds,
        selectedCategoryIds,
        selectedSubcategoryIds,
        selectedInterestIds,
        intentTags,
        vibePreferences,
        audienceAffinities,
        locationPreferences,
        timePreferences,
        pricePreferences,
        city: trimmedCity,
        bio: bio.trim(),
      };

      if (!token) {
        setProfile({
          ...payload,
          id: 'guest',
          email: null,
          avatarUrl: null,
          interests: [],
        });
        await setOnboardingComplete(true);
        router.replace('/(tabs)');
        return;
      }

      const profile = await api.updateProfile(payload);
      setProfile(profile);
      await setOnboardingComplete(true);
      router.replace('/(tabs)/profile');
    } catch (e: any) {
      setErrorMessage(e.message || 'Please check your profile.');
      setErrorOpen(true);
    }
  };

  const interestSections = useMemo(
    () => buildInterestSections(taxonomy, selectedCategoryIds, selectedSubcategoryIds),
    [taxonomy, selectedCategoryIds, selectedSubcategoryIds],
  );
  const totalInterestSelections = useMemo(
    () =>
      new Set([
        ...selectedCategoryIds,
        ...selectedSubcategoryIds,
        ...selectedInterestIds,
      ]).size,
    [selectedCategoryIds, selectedSubcategoryIds, selectedInterestIds],
  );
  const remaining = useMemo(() => Math.max(0, 3 - totalInterestSelections), [totalInterestSelections]);

  const toggleSelection = (value: string, setter: Dispatch<SetStateAction<string[]>>) => {
    setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

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
          <Button
            label={mode === 'signup' ? 'Sign Up' : 'Sign In'}
            onPress={submitAuth}
            loading={authLoading}
          />
          <Pressable
            style={[styles.googleButton, googleLoading && styles.googleButtonDisabled]}
            disabled={googleLoading}
            onPress={() => {
              void continueWithGoogle();
            }}>
            <Text style={styles.googleButtonText}>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</Text>
          </Pressable>
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
            Pick at least 3 interests so we can find quests you&apos;ll love. You can select as many as you want.
          </Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor="#B7AAA0"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Alias</Text>
          <TextInput
            style={styles.input}
            placeholder="How people will see you"
            placeholderTextColor="#B7AAA0"
            value={alias}
            onChangeText={setAlias}
          />

          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            placeholder="Your city"
            placeholderTextColor="#B7AAA0"
            value={city}
            onChangeText={setCity}
          />

          {interestsLoading ? (
            <View style={styles.interestsState}>
              <Text style={styles.interestsStateText}>Loading interests...</Text>
            </View>
          ) : taxonomy.length === 0 ? (
            <View style={styles.interestsState}>
              <Text style={styles.interestsStateText}>No interests available right now.</Text>
              <Pressable
                style={styles.retryButton}
                onPress={() => {
                  setInterestsLoading(true);
                  api
                    .getTaxonomy()
                    .then((data: any) => {
                      setTaxonomy(data.interestTree || []);
                      setTagGroups(data.groups || {});
                    })
                    .catch((error) => {
                      console.warn(error);
                      setErrorMessage('Unable to load interests. Please try again.');
                      setErrorOpen(true);
                    })
                    .finally(() => setInterestsLoading(false));
                }}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {interestSections.map((section) => {
                const setter =
                  section.title === 'Categories'
                    ? setSelectedCategoryIds
                    : section.title === 'Subcategories'
                      ? setSelectedSubcategoryIds
                      : setSelectedInterestIds;
                const activeValues =
                  section.title === 'Categories'
                    ? selectedCategoryIds
                    : section.title === 'Subcategories'
                      ? selectedSubcategoryIds
                      : selectedInterestIds;

                return (
                  <View key={section.title} style={styles.preferenceSection}>
                    <Text style={styles.sectionLabel}>{section.title}</Text>
                    {section.items.length === 0 ? (
                      <View style={styles.inlineEmptyState}>
                        <Text style={styles.inlineEmptyStateText}>{section.emptyMessage}</Text>
                      </View>
                    ) : (
                      <View style={styles.grid}>
                        {section.items.map((tag) => {
                          const active = activeValues.includes(tag.id);
                          return (
                            <Pressable
                              key={tag.id}
                              style={[styles.pill, active && styles.pillActive]}
                              onPress={() => toggleSelection(tag.id, setter)}>
                              <Text style={[styles.pillText, active && styles.pillTextActive]}>{tag.name}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}

              {[
                ['Intent Tags', 'intent', intentTags, setIntentTags],
                ['Vibe Preferences', 'vibe', vibePreferences, setVibePreferences],
                ['Audience', 'audience', audienceAffinities, setAudienceAffinities],
                ['Location Preferences', 'location', locationPreferences, setLocationPreferences],
                ['Time Preferences', 'time', timePreferences, setTimePreferences],
                ['Price Preferences', 'price', pricePreferences, setPricePreferences],
              ].map(([label, groupKey, value, setter]) => (
                <View key={String(groupKey)} style={styles.preferenceSection}>
                  <Text style={styles.sectionLabel}>{label}</Text>
                  <View style={styles.grid}>
                    {(tagGroups[String(groupKey)] || []).map((tag: any) => {
                      const active = (value as string[]).includes(tag.slug);
                      return (
                        <Pressable
                          key={tag.id}
                          style={[styles.pill, active && styles.pillActive]}
                          onPress={() => toggleSelection(tag.slug, setter as Dispatch<SetStateAction<string[]>>)}>
                          <Text style={[styles.pillText, active && styles.pillTextActive]}>{tag.name}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </>
          )}

          <View style={styles.ctaBox}>
            <Pressable style={styles.primaryCta} onPress={submitProfile}>
              <Text style={styles.primaryCtaText}>
                {remaining > 0 ? `Select ${remaining} more` : `Continue with ${totalInterestSelections}`}
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
                  try {
                    if (!supabase) {
                      throw new Error('Supabase auth is not configured in the mobile app.');
                    }
                    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
                      redirectTo: Linking.createURL('/onboarding'),
                    });
                    if (error) throw error;
                    setForgotOpen(false);
                    setErrorMessage('If an account exists, you will receive reset instructions.');
                    setErrorOpen(true);
                  } catch (e: any) {
                    setErrorMessage(e?.message || 'Unable to send reset instructions.');
                    setErrorOpen(true);
                  }
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
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9CEC4',
  },
  googleButtonDisabled: {
    opacity: 0.55,
  },
  googleButtonText: { color: '#2F2A26', fontWeight: '700' },
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
  interestsState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFE4DA',
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  interestsStateText: { color: '#7C6F66', fontSize: 13, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sectionLabel: { fontSize: 13, color: '#6E6158', fontFamily: theme.fonts.sansSemi, marginTop: 4 },
  preferenceSection: { gap: 8 },
  inlineEmptyState: {
    backgroundColor: '#F4EEE8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inlineEmptyStateText: { color: '#7C6F66', fontSize: 12, lineHeight: 18, textAlign: 'center' },
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
  retryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D9CEC4',
  },
  retryButtonText: { color: '#2F2A26', fontWeight: '600' },
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
