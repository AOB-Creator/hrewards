import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, Download, Phone, Sparkles, Star, Users, XCircle } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { statusTone } from '@/components/BookingCard';
import { PriceSummary } from '@/components/PriceSummary';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ApiError, api } from '@/data';
import { HOTELS, RATE_PLANS, ROOM_TYPES } from '@/data/seed';
import { useAsync } from '@/hooks/useAsync';
import { useT } from '@/i18n';
import { shareVoucher } from '@/services/voucher';
import { useSession } from '@/store/session';
import { Button } from '@/ui/Button';
import { CalendarModal } from '@/ui/CalendarModal';
import { Field } from '@/ui/Field';
import { Divider, EmptyState, KeyValue, Loading } from '@/ui/misc';
import { Tag } from '@/ui/Tag';
import { Text } from '@/ui/Text';
import { colors, radius } from '@/ui/theme';
import { diffDays, formatLongDate, today } from '@/utils/date';
import { useMoney } from '@/utils/money';

export default function BookingDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, tl, locale } = useT();
  const { money } = useMoney();
  const token = useSession((s) => s.token);
  const res = useAsync(() => api.getBooking(id), [id]);
  const [calendar, setCalendar] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');

  if (res.loading && !res.data) return <Loading />;
  const b = res.data;
  if (!b) return <EmptyState title={t('err.not_found')} action={<Button title={t('common.back')} size="md" onPress={() => router.back()} />} />;

  const hotel = HOTELS.find((h) => h.id === b.hotelId)!;
  const room = ROOM_TYPES.find((r) => r.id === b.roomTypeId)!;
  const rate = RATE_PLANS.find((r) => r.id === b.ratePlanId)!;
  const active = b.status === 'confirmed' || b.status === 'new';
  const canReview = !!token && b.status === 'checked_out' && !b.reviewId && diffDays(b.checkOut, today()) <= 30;

  const err = (e: unknown) => Alert.alert(e instanceof ApiError ? t(`err.${e.code}`) : t('common.error'));

  const cancel = async () => {
    try {
      const q = await api.cancellationQuote(b.id);
      if (!q.allowed) return Alert.alert(t('err.cannot_cancel'));
      const msg = [q.free ? t('bk.cancelFree', { amount: money(q.refund) }) : t('bk.cancelPenalty', { penalty: money(q.penalty), refund: money(q.refund) })];
      if (q.pointsReturned) msg.push(t('bk.cancelPoints', { n: q.pointsReturned }));
      Alert.alert(t('bk.cancelTitle'), msg.join('\n\n'), [
        { text: t('common.back'), style: 'cancel' },
        {
          text: t('bk.cancelConfirm'),
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              res.setData(await api.cancelBooking(b.id, token));
            } catch (e) {
              err(e);
            } finally {
              setBusy(false);
            }
          },
        },
      ]);
    } catch (e) {
      err(e);
    }
  };

  const changeDates = async (checkIn: string, checkOut: string) => {
    setCalendar(false);
    setBusy(true);
    try {
      res.setData(await api.changeDates(b.id, checkIn, checkOut, token));
    } catch (e) {
      err(e);
    } finally {
      setBusy(false);
    }
  };

  const submitReview = async () => {
    if (!token) return;
    try {
      const r = await api.createReview(token, b.id, rating, review);
      res.setData({ ...b, reviewId: r.id });
      Alert.alert(t('bk.reviewSent'));
    } catch (e) {
      err(e);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScreenHeader title={t('bk.title')} subtitle={b.number} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 48 }}>
        <Pressable onPress={() => router.push({ pathname: '/hotel/[id]', params: { id: hotel.id } })}>
          <Image source={hotel.images[0]} style={styles.hero} contentFit="cover" transition={150} />
        </Pressable>
        <View style={{ gap: 6 }}>
          <Tag tone={statusTone(b.status)} label={t(`status.${b.status}`)} />
          <Text variant="h2">{hotel.name}</Text>
          <Text variant="small" muted>
            {tl(hotel.address)}
          </Text>
        </View>

        <View style={styles.card}>
          <Row icon={<CalendarDays size={18} color={colors.ink} strokeWidth={1.6} />} title={t('bk.dates')} value={`${formatLongDate(b.checkIn, locale)} – ${formatLongDate(b.checkOut, locale)} · ${b.price.nights} ${t('common.nights')}`} />
          <Divider />
          <Row icon={<Users size={18} color={colors.ink} strokeWidth={1.6} />} title={t('bk.room')} value={`${tl(room.name)} × ${b.rooms} · ${t('bk.guests', { a: b.adults, c: b.children })}`} sub={tl(rate.name)} />
          <Divider />
          <Row icon={<Sparkles size={18} color={colors.ink} strokeWidth={1.6} />} title={t('bk.guest')} value={`${b.guest.firstName} ${b.guest.lastName}`} sub={`${b.guest.phone} · ${b.guest.email}`} />
        </View>

        {b.perks.length > 0 && (
          <View style={[styles.card, { borderColor: colors.gold }]}>
            <Text variant="label">{t('bk.perks')}</Text>
            {b.perks.map((p) => (
              <Text key={p} variant="small">
                • {t(p)}
              </Text>
            ))}
          </View>
        )}

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surface }]}>
          <Text variant="title">{t('bk.payment')}</Text>
          <PriceSummary price={b.price} rooms={b.rooms} />
          <Divider />
          <KeyValue k={`${t('bk.paid')} · ${t(`provider.${b.paymentProvider}`)}`} v={money(b.paid)} />
          {b.refunded > 0 && <KeyValue k={t('bk.refunded')} v={money(b.refunded)} color={colors.success} />}
          {b.pointsEarned > 0 && <Tag tone="success" label={t('bk.pointsEarned', { n: b.pointsEarned })} />}
        </View>

        <View style={{ gap: 10 }}>
          <Button title={t('book.voucher')} variant="secondary" icon={<Download size={18} color={colors.ink} />} onPress={() => shareVoucher(b, hotel, room, locale, money).catch(() => Alert.alert(t('common.error')))} />
          <Button title={t('bk.contactHotel')} variant="secondary" icon={<Phone size={18} color={colors.ink} />} onPress={() => Linking.openURL(`tel:${hotel.phone}`)} />
          {active && rate.cancellation.kind === 'free' && (
            <Button title={t('bk.changeDates')} variant="secondary" icon={<CalendarDays size={18} color={colors.ink} />} onPress={() => setCalendar(true)} loading={busy} />
          )}
          {active && <Button title={t('bk.cancel')} variant="ghost" icon={<XCircle size={18} color={colors.danger} />} onPress={cancel} loading={busy} />}
        </View>

        {canReview && (
          <View style={styles.card}>
            <Text variant="title">{t('bk.review')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setRating(n)} hitSlop={6} accessibilityLabel={`${n}`}>
                  <Star size={28} color={colors.star} fill={n <= rating ? colors.star : 'transparent'} strokeWidth={1.4} />
                </Pressable>
              ))}
            </View>
            <Field value={review} onChangeText={setReview} placeholder={t('bk.reviewPh')} multiline style={{ borderRadius: 18 }} />
            <Button title={t('common.save')} size="md" onPress={submitReview} disabled={review.trim().length < 3} />
          </View>
        )}
      </ScrollView>
      <CalendarModal visible={calendar} checkIn={b.checkIn} checkOut={b.checkOut} onClose={() => setCalendar(false)} onApply={changeDates} />
    </SafeAreaView>
  );
}

function Row({ icon, title, value, sub }: { icon: React.ReactNode; title: string; value: string; sub?: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, paddingVertical: 4 }}>
      {icon}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="caption" muted>
          {title}
        </Text>
        <Text variant="body">{value}</Text>
        {sub && (
          <Text variant="caption" muted>
            {sub}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: { width: '100%', height: 190, borderRadius: radius.xl, backgroundColor: colors.soft },
  card: { gap: 10, padding: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
});
