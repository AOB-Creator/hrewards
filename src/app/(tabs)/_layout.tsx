import * as Haptics from 'expo-haptics';
import { CalendarDays, Gem, Home, User } from 'lucide-react-native';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router/js-tabs';
import { useT } from '@/i18n';
import { Text } from '@/ui/Text';
import { colors, shadowStrong } from '@/ui/theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS = [
  { name: 'index', icon: Home, label: 'tab.home' },
  { name: 'trips', icon: CalendarDays, label: 'tab.trips' },
  { name: 'wallet', icon: Gem, label: 'tab.wallet' },
  { name: 'profile', icon: User, label: 'tab.profile' },
] as const;

/** Floating black pill; the active tab is a white pill with its label. */
function PillTabBar({ state, navigation }: TabBarProps) {
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index]?.name;
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) + 8 }]}>
      <View style={[styles.pill, shadowStrong]}>
        {TABS.map(({ name, icon: Icon, label }) => {
          const active = current === name;
          return (
            <Pressable
              key={name}
              accessibilityRole="tab"
              accessibilityLabel={t(label)}
              accessibilityState={{ selected: active }}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                navigation.navigate(name as never);
              }}
              style={[styles.item, active && styles.itemActive]}
            >
              <Icon size={22} color={active ? colors.ink : colors.white} strokeWidth={1.6} />
              {active && <Text variant="bodyMedium">{t(label)}</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(p) => <PillTabBar {...p} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="trips" />
      <Tabs.Screen name="wallet" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 20, right: 20 },
  pill: { height: 64, borderRadius: 32, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 7 },
  item: { height: 50, minWidth: 50, borderRadius: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  itemActive: { backgroundColor: colors.white, paddingHorizontal: 18 },
});
