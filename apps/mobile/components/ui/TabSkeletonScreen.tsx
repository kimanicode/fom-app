import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../constants/app-theme';
import { theme } from '../../constants/theme';
import { Skeleton } from './Skeleton';

type TabSkeletonVariant = 'feed' | 'explore' | 'profile' | 'create';

type TabSkeletonScreenProps = {
  variant: TabSkeletonVariant;
};

export function TabSkeletonScreen({ variant }: TabSkeletonScreenProps) {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screen }]} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Skeleton height={26} width={118} radius={999} />
          <Skeleton height={24} width={72} radius={10} />
          <View style={styles.topActions}>
            <Skeleton height={36} width={36} radius={999} />
            <Skeleton height={36} width={36} radius={999} />
          </View>
        </View>

        {(variant === 'feed' || variant === 'profile') && (
          <View style={styles.segmentRow}>
            <Skeleton height={44} width="100%" radius={999} />
          </View>
        )}

        {variant === 'feed' && (
          <>
            <Skeleton height={48} radius={16} />
            <View style={styles.inlineRow}>
              <Skeleton height={30} width={74} radius={999} />
              <Skeleton height={30} width={88} radius={999} />
              <Skeleton height={30} width={72} radius={999} />
            </View>
            {[0, 1, 2].map((item) => (
              <View key={item} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Skeleton height={220} radius={20} />
                <View style={styles.cardBody}>
                  <Skeleton height={22} width="70%" />
                  <Skeleton height={14} width="94%" />
                  <Skeleton height={14} width="78%" />
                  <Skeleton height={42} radius={16} />
                </View>
              </View>
            ))}
          </>
        )}

        {variant === 'explore' && (
          <>
            <View style={styles.searchBlock}>
              <Skeleton height={26} width="46%" />
              <Skeleton height={16} width="92%" />
              <Skeleton height={48} radius={16} />
            </View>
            <View style={styles.inlineRow}>
              <Skeleton height={32} width={92} radius={999} />
              <Skeleton height={32} width={112} radius={999} />
              <Skeleton height={32} width={84} radius={999} />
            </View>
            {[0, 1, 2, 3].map((item) => (
              <View key={item} style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Skeleton height={64} width={64} radius={14} />
                <View style={styles.listCardBody}>
                  <Skeleton height={18} width="68%" />
                  <Skeleton height={12} width="88%" />
                  <Skeleton height={12} width="54%" />
                </View>
              </View>
            ))}
          </>
        )}

        {variant === 'profile' && (
          <>
            <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.profileRow}>
                <Skeleton height={74} width={74} radius={37} />
                <View style={styles.profileBody}>
                  <Skeleton height={28} width="55%" />
                  <Skeleton height={14} width="42%" />
                </View>
              </View>
              <Skeleton height={16} width="92%" />
              <Skeleton height={16} width="76%" />
            </View>
            <View style={styles.statsRow}>
              <Skeleton height={106} width="31%" radius={22} />
              <Skeleton height={106} width="31%" radius={22} />
              <Skeleton height={106} width="31%" radius={22} />
            </View>
            <Skeleton height={44} radius={999} />
            {[0, 1].map((item) => (
              <View key={item} style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Skeleton height={72} width={72} radius={16} />
                <View style={styles.listCardBody}>
                  <Skeleton height={20} width="72%" />
                  <Skeleton height={12} width="84%" />
                  <Skeleton height={12} width="48%" />
                </View>
              </View>
            ))}
            <View style={[styles.walletCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Skeleton height={18} width="34%" />
              <Skeleton height={14} width="46%" />
              <Skeleton height={42} radius={16} />
            </View>
          </>
        )}

        {variant === 'create' && (
          <>
            <Skeleton height={28} width="42%" />
            <Skeleton height={48} radius={16} />
            <Skeleton height={120} radius={20} />
            <Skeleton height={48} radius={16} />
            <Skeleton height={48} radius={16} />
            <Skeleton height={48} radius={16} />
            <Skeleton height={48} radius={16} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 28 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topActions: { flexDirection: 'row', gap: 8 },
  segmentRow: { marginTop: 2 },
  inlineRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  searchBlock: { gap: 8 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardBody: { padding: 16, gap: 10 },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  listCardBody: { flex: 1, gap: 8 },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileBody: { flex: 1, gap: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  walletCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
});
