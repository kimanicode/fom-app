import { ReactNode, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

type TabKey = 'index' | 'explore' | 'create' | 'profile';

const TAB_ORDER: TabKey[] = ['index', 'explore', 'create', 'profile'];
const TAB_ROUTES: Record<TabKey, '/(tabs)' | '/(tabs)/explore' | '/(tabs)/create' | '/(tabs)/profile'> = {
  index: '/(tabs)',
  explore: '/(tabs)/explore',
  create: '/(tabs)/create',
  profile: '/(tabs)/profile',
};

type SwipeTabsScreenProps = {
  tab: TabKey;
  children: ReactNode;
};

export function SwipeTabsScreen({ tab, children }: SwipeTabsScreenProps) {
  const gesture = useMemo(() => {
    const navigateToSibling = (direction: -1 | 1) => {
      const currentIndex = TAB_ORDER.indexOf(tab);
      const nextIndex = currentIndex + direction;
      if (nextIndex < 0 || nextIndex >= TAB_ORDER.length) return;
      router.replace(TAB_ROUTES[TAB_ORDER[nextIndex]]);
    };

    return Gesture.Pan()
      .activeOffsetX([-24, 24])
      .failOffsetY([-16, 16])
      .onEnd((event) => {
        const horizontalDistance = Math.abs(event.translationX);
        const horizontalVelocity = Math.abs(event.velocityX);
        const verticalDistance = Math.abs(event.translationY);

        if (horizontalDistance < 72) return;
        if (horizontalVelocity < 250) return;
        if (verticalDistance > 48) return;

        runOnJS(navigateToSibling)(event.translationX < 0 ? 1 : -1);
      });
  }, [tab]);

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.container}>{children}</View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
