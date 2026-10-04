import { router, useFocusEffect } from 'expo-router';
import { Bell, CalendarCheck, Gift, Heart, Megaphone, XCircle } from 'lucide-react-native';
import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AppNotification } from '@/domain/types';
import { useNotifications } from '@/hooks/useNotifications';
import { useT } from '@/i18n';
import { useSession } from '@/store/session';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/misc';
import { Text } from '@/ui/Text';
import { colors, radius } from '@/ui/theme';
import { ScreenHeader } from '@/components/ScreenHeader';

const ICON: Record<AppNotification['kind'], typeof Bell> = {
  booking_confirmed: CalendarCheck,
  reminder: Bell,
  points_credited: Gift,
  thank_you: Heart,
  promo: Megaphone,
  cancelled: XCircle,
};

export default function Inbox() {
  const { t } = useT();
  const token = useSession((s) => s.token);
  const { items, load, markRead } = useNotifications();

  useFocusEffect(
    useCallback(() => {
      load().then(() => setTimeout(markRead, 1500));
    }, [load, markRead]),
  );

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScreenHeader title={t('notifs.title')} />
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 48, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            icon={<Bell size={26} color={colors.ink} strokeWidth={1.5} />}
            title={t('notifs.empty')}
            action={!token ? <Button title={t('common.signIn')} size="md" onPress={() => router.push('/auth/login')} /> : undefined}
          />
        }
        renderItem={({ item }) => {
          const Icon = ICON[item.kind];
          return (
            <Pressable
              onPress={() => item.bookingId && router.push({ pathname: '/booking/[id]', params: { id: item.bookingId } })}
              style={[styles.item, !item.read && { backgroundColor: colors.surface, borderColor: colors.surface }]}
            >
              <View style={styles.icon}>
                <Icon size={18} color={colors.white} strokeWidth={1.7} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="title">{t(item.title)}</Text>
                <Text variant="small" muted>
                  {t(item.body)}
                </Text>
                <Text variant="caption" muted>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              {!item.read && <View style={styles.dot} />}
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  item: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  icon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.badge, marginTop: 6 },
});
