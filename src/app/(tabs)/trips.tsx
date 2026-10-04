import { router, useFocusEffect } from 'expo-router';
import { Luggage } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookingCard } from '@/components/BookingCard';
import { api } from '@/data';
import type { Booking } from '@/domain/types';
import { useAsync } from '@/hooks/useAsync';
import { useT } from '@/i18n';
import { useSession } from '@/store/session';
import { Button } from '@/ui/Button';
import { Field } from '@/ui/Field';
import { EmptyState, Loading } from '@/ui/misc';
import { Text } from '@/ui/Text';
import { colors, radius } from '@/ui/theme';
import { today } from '@/utils/date';
import { TAB_BAR_SPACE } from '@/ui/layout';

type Filter = 'upcoming' | 'past' | 'cancelled';

export default function Trips() {
  const { t } = useT();
  const token = useSession((s) => s.token);
  const guestIds = useSession((s) => s.guestBookingIds);
  const remember = useSession((s) => s.rememberGuestBooking);
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [number, setNumber] = useState('');
  const [phone, setPhone] = useState('+998 ');

  const res = useAsync(async (): Promise<Booking[]> => {
    const own = token ? await api.listBookings(token) : [];
    const guest = await Promise.all(guestIds.filter((id) => !own.some((b) => b.id === id)).map((id) => api.getBooking(id).catch(() => undefined)));
    return [...own, ...(guest.filter(Boolean) as Booking[])];
  }, [token, guestIds.join(',')]);

  useFocusEffect(
    useCallback(() => {
      res.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const t0 = today();
  const list = (res.data ?? []).filter((b) => {
    if (filter === 'cancelled') return b.status === 'cancelled' || b.status === 'no_show';
    if (filter === 'past') return b.status === 'checked_out';
    return ['new', 'confirmed', 'checked_in'].includes(b.status) && b.checkOut >= t0;
  });
  if (filter === 'upcoming') list.sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  const find = async () => {
    try {
      const b = await api.findBooking(number, phone);
      remember(b.id);
      router.push({ pathname: '/booking/[id]', params: { id: b.id } });
    } catch {
      Alert.alert(t('err.not_found'));
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <View style={styles.header}>
        <Text variant="h1">{t('tab.trips')}</Text>
      </View>
      <View accessibilityRole="tablist" style={styles.segment}>
        {(['upcoming', 'past', 'cancelled'] as Filter[]).map((f) => (
          <Pressable
            key={f}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === f }}
            onPress={() => setFilter(f)}
            style={[styles.segItem, f === 'cancelled' && { flex: 1.3 }, filter === f && styles.segActive]}
          >
            <Text variant="label" color={filter === f ? colors.white : colors.ink}>
              {t(`trips.${f}`)}
            </Text>
          </Pressable>
        ))}
      </View>
      {res.loading && !res.data ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: TAB_BAR_SPACE, flexGrow: 1 }}>
          {list.length ? (
            list.map((b) => <BookingCard key={b.id} booking={b} />)
          ) : (
            <EmptyState
              icon={<Luggage size={26} color={colors.ink} strokeWidth={1.5} />}
              title={t('trips.empty')}
              hint={t('trips.emptyHint')}
              action={!token ? <Button title={t('common.signIn')} size="md" onPress={() => router.push('/auth/login')} /> : undefined}
            />
          )}
          <View style={styles.find}>
            <Text variant="title">{t('trips.find')}</Text>
            <Text variant="caption" muted>
              {t('trips.findHint')}
            </Text>
            <Field value={number} onChangeText={setNumber} placeholder={t('trips.numberPh')} autoCapitalize="characters" />
            <Field value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Button title={t('search.search')} size="md" variant="secondary" onPress={find} disabled={number.length < 6} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 12 },
  segment: { flexDirection: 'row', gap: 6, marginHorizontal: 20, marginTop: 16, padding: 4, borderRadius: radius.pill, backgroundColor: colors.card },
  segItem: { flex: 1, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  segActive: { backgroundColor: colors.ink },
  find: { gap: 10, marginTop: 16, padding: 16, borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: '#C5C8CE' },
});
