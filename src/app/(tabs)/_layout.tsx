import * as Haptics from 'expo-haptics';
import { Heart, Home, MessageSquare, Navigation, User } from 'lucide-react-native';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router/js-tabs';
import { useNotificationsCount } from '@/hooks/useNotifications';
import { useT } from '@/i18n';
import { Text } from '@/ui/Text';
import { colors, shadowStrong } from '@/ui/theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const ICONS = { index: Home, saved: Heart, inbox: MessageSquare, profile: User } as const;
const LABELS = { index: 'tab.home', saved: 'tab.saved', inbox: 'notifs.title', profile: 'tab.profile' } as const;

/** Floating black pill + round "trips" button from the mockups. */
function PillTabBar({ state, navigation }: TabBarProps) {
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const unread = useNotificationsCount();
  const current = state.routes[state.index]?.name;
  const go = (name: string) => {
    Haptics.selectionAsync().catch(() => {});
    navigation.navigate(name as never);
  };
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.pill, shadowStrong]}>
        {(Object.keys(ICONS) as (keyof typeof ICONS)[]).map((name) => {
          const Icon = ICONS[name];
          const active = current === name;
          return (
            <Pressable
              key={name}
              accessibilityRole="tab"
              accessibilityLabel={t(LABELS[name])}
              accessibilityState={{ selected: active }}
              onPress={() => go(name)}
              style={[styles.item, active && styles.itemActive]}
            >
              <Icon size={21} color={active ? colors.ink : colors.white} strokeWidth={1.6} />
              {active && <Text variant="bodyMedium">{t(LABELS[name])}</Text>}
              {name === 'inbox' && unread > 0 && !active && <View style={styles.dot} />}
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="tab"
        accessibilityLabel={t('tab.trips')}
        accessibilityState={{ selected: current === 'trips' }}
        onPress={() => go('trips')}
        style={[styles.fab, shadowStrong, current === 'trips' && { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border }]}
      >
        <Navigation size={21} color={current === 'trips' ? colors.ink : colors.white} strokeWidth={1.6} />
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(p) => <PillTabBar {...p} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="saved" />
      <Tabs.Screen name="inbox" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="trips" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  pill: { flex: 1, height: 62, borderRadius: 31, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 },
  item: { height: 50, minWidth: 50, borderRadius: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
  itemActive: { backgroundColor: colors.white, paddingHorizontal: 18 },
  dot: { position: 'absolute', top: 12, right: 12, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.badge },
  fab: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
});

export const TAB_BAR_SPACE = 110;
