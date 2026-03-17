import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/auth';
import { useThemeStore } from '../store/theme';
import { useAppTheme } from '../constants/app-theme';
import { buildInterestSections, TaxonomyNode } from '../lib/taxonomy';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const { setProfile } = useAuthStore();
  const appTheme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const { colors, fonts } = useAppTheme();
  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [ageRange, setAgeRange] = useState('25-34');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<string[]>([]);
  const [selectedInterestIds, setSelectedInterestIds] = useState<string[]>([]);
  const [taxonomy, setTaxonomy] = useState<TaxonomyNode[]>([]);
  const [tagGroups, setTagGroups] = useState<Record<string, any[]>>({});
  const [intentTags, setIntentTags] = useState<string[]>([]);
  const [vibePreferences, setVibePreferences] = useState<string[]>([]);
  const [audienceAffinities, setAudienceAffinities] = useState<string[]>([]);
  const [locationPreferences, setLocationPreferences] = useState<string[]>([]);
  const [timePreferences, setTimePreferences] = useState<string[]>([]);
  const [pricePreferences, setPricePreferences] = useState<string[]>([]);
  const [loadingInterests, setLoadingInterests] = useState(true);

  useEffect(() => {
    Promise.all([api.getMe(), api.getTaxonomy()])
      .then(([me, taxonomyData]: any) => {
        setName(me.name || '');
        setAlias(me.alias || '');
        setAgeRange(me.ageRange || '25-34');
        setCity(me.city || '');
        setBio(me.bio || '');
        setSelectedCategoryIds(me.selectedCategoryIds || []);
        setSelectedSubcategoryIds(me.selectedSubcategoryIds || []);
        setSelectedInterestIds(me.selectedInterestIds || (me.interests || []).map((i: any) => i.id));
        setIntentTags(me.intentTags || []);
        setVibePreferences(me.vibePreferences || []);
        setAudienceAffinities(me.audienceAffinities || []);
        setLocationPreferences(me.locationPreferences || []);
        setTimePreferences(me.timePreferences || []);
        setPricePreferences(me.pricePreferences || []);
        setTaxonomy(taxonomyData.interestTree || []);
        setTagGroups(taxonomyData.groups || {});
      })
      .catch((e: any) => {
        Alert.alert('Unable to load settings', e?.message || 'Please try again.');
      })
      .finally(() => {
        setLoadingInterests(false);
      });
  }, []);

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

  const toggleSelection = (
    value: string,
    setter: Dispatch<SetStateAction<string[]>>,
  ) => {
    setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const save = async () => {
    try {
      if (totalInterestSelections < 3) {
        Alert.alert(
          'Select interests',
          'Pick at least 3 interests across categories, subcategories, or specific interests.',
        );
        return;
      }
      const updated = await api.updateProfile({
        name,
        alias,
        ageRange,
        city,
        bio,
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
      });
      setProfile(updated);
      Alert.alert('Profile updated');
      router.replace('/(tabs)/profile');
    } catch (e: any) {
      Alert.alert('Update failed', e.message || 'Try again');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.screen }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.success, fontFamily: fonts.displayBold }]}>Settings</Text>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.themeRow}>
          <View style={styles.themeText}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.sansSemi }]}>Theme</Text>
            <Text style={[styles.sectionHint, { color: colors.textMuted, fontFamily: fonts.sans }]}>
              {appTheme === 'dark' ? 'Dark mode is enabled.' : 'Light mode is enabled.'}
            </Text>
          </View>
          <Switch
            value={appTheme === 'dark'}
            onValueChange={() => toggleTheme().catch(console.warn)}
            trackColor={{ false: colors.chip, true: colors.primarySoft }}
            thumbColor={appTheme === 'dark' ? colors.primary : '#FFFFFF'}
          />
        </View>
      </View>
      <Input label="Name" value={name} onChangeText={setName} />
      <Input label="Alias" value={alias} onChangeText={setAlias} />
      <Input label="Age range" value={ageRange} onChangeText={setAgeRange} />
      <Input label="City" value={city} onChangeText={setCity} />
      <Input label="Bio" value={bio} onChangeText={setBio} />
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.sansSemi }]}>Interests</Text>
        <Text style={[styles.sectionHint, { color: colors.textMuted, fontFamily: fonts.sans }]}>
          Choose at least 3 specific interests, then keep adding as many as you want to tune your recommendations.
        </Text>
        {loadingInterests ? (
          <Text style={[styles.helper, { color: colors.textMuted, fontFamily: fonts.sansMedium }]}>Loading interests...</Text>
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
                <View key={section.title} style={styles.preferenceBlock}>
                  <Text style={[styles.sectionHint, { color: colors.textMuted, fontFamily: fonts.sansMedium }]}>
                    {section.title}
                  </Text>
                  {section.items.length === 0 ? (
                    <View style={[styles.inlineEmptyState, { backgroundColor: colors.surfaceElevated }]}>
                      <Text style={[styles.helper, { color: colors.textMuted, fontFamily: fonts.sansMedium }]}>
                        {section.emptyMessage}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.grid}>
                      {section.items.map((tag) => {
                        const active = activeValues.includes(tag.id);
                        return (
                          <Pressable
                            key={tag.id}
                            style={[
                              styles.pill,
                              { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                              active && { backgroundColor: colors.successSoft, borderColor: colors.success },
                            ]}
                            onPress={() => toggleSelection(tag.id, setter)}>
                            <Text
                              style={[
                                styles.pillText,
                                { color: colors.text, fontFamily: fonts.sansMedium },
                                active && { color: colors.success, fontFamily: fonts.sansSemi },
                              ]}>
                              {tag.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}

            {[
              ['Intent', 'intent', intentTags, setIntentTags],
              ['Vibe', 'vibe', vibePreferences, setVibePreferences],
              ['Audience', 'audience', audienceAffinities, setAudienceAffinities],
              ['Location', 'location', locationPreferences, setLocationPreferences],
              ['Time', 'time', timePreferences, setTimePreferences],
              ['Price', 'price', pricePreferences, setPricePreferences],
            ].map(([label, groupKey, activeValues, setter]) => (
              <View key={String(groupKey)} style={styles.preferenceBlock}>
                <Text style={[styles.sectionHint, { color: colors.textMuted, fontFamily: fonts.sansMedium }]}>{label}</Text>
                <View style={styles.grid}>
                  {(tagGroups[String(groupKey)] || []).map((tag: any) => {
                    const active = (activeValues as string[]).includes(tag.slug);
                    return (
                      <Pressable
                        key={tag.id}
                        style={[
                          styles.pill,
                          { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                          active && { backgroundColor: colors.successSoft, borderColor: colors.success },
                        ]}
                        onPress={() => toggleSelection(tag.slug, setter as Dispatch<SetStateAction<string[]>>)}>
                        <Text
                          style={[
                            styles.pillText,
                            { color: colors.text, fontFamily: fonts.sansMedium },
                            active && { color: colors.success, fontFamily: fonts.sansSemi },
                          ]}>
                          {tag.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </>
        )}
        <Text style={[styles.helper, { color: colors.textMuted, fontFamily: fonts.sansMedium }]}>
          {totalInterestSelections} selected
        </Text>
      </View>
      <Button label="Save" onPress={save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 22 },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  themeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  themeText: { flex: 1, gap: 4 },
  sectionTitle: { fontSize: 14 },
  sectionHint: { fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  preferenceBlock: { gap: 8 },
  inlineEmptyState: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  pillText: { fontSize: 12 },
  helper: { fontSize: 12 },
});
