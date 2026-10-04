import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { HOTELS } from '@/data/seed';
import type { Booking } from '@/domain/types';
import { useT } from '@/i18n';
import { Tag } from '@/ui/Tag';
import { Text } from '@/ui/Text';
import { colors, radius } from '@/ui/theme';
import { formatRange } from '@/utils/date';

export const statusTone = (s: Booking['status']) =>
  s === 'confirmed' || s === 'new' ? 'dark' : s === 'checked_in' ? 'success' : s === 'cancelled' || s === 'no_show' ? 'danger' : 'grey';

export function BookingCard({ booking }: { booking: Booking }) {
  const { t, locale } = useT();
  const hotel = HOTELS.find((h) => h.id === booking.hotelId);
  const payAtHotel = booking.status === 'confirmed' && booking.paymentMode === 'at_hotel';
  const guests = booking.adults + booking.children;
  return (
    <Pressable onPress={() => router.push({ pathname: '/booking/[id]', params: { id: booking.id } })} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
      <Image source={hotel?.images[0]} style={styles.img} contentFit="cover" transition={150} />
      <View style={{ flex: 1, gap: 3, paddingVertical: 4 }}>
        {payAtHotel ? <Tag tone="accent" label={t('bk.payAtHotel')} /> : <Tag tone={statusTone(booking.status)} label={t(`status.${booking.status}`)} />}
        <Text variant="title" numberOfLines={1} style={{ marginTop: 4, fontSize: 16 }}>
          {hotel?.name}
        </Text>
        <Text variant="small" muted>
          {formatRange(booking.checkIn, booking.checkOut, locale)} · {guests} {t('common.guests')}
        </Text>
        <Text variant="caption" muted>
          {booking.number}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, padding: 8, borderRadius: radius.xl, backgroundColor: colors.card },
  img: { width: 96, height: 104, borderRadius: 18, backgroundColor: colors.soft },
});
