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
import { useMoney } from '@/utils/money';

export const statusTone = (s: Booking['status']) =>
  s === 'confirmed' || s === 'new' ? 'dark' : s === 'checked_in' ? 'success' : s === 'cancelled' || s === 'no_show' ? 'danger' : 'grey';

export function BookingCard({ booking }: { booking: Booking }) {
  const { t, tl, locale } = useT();
  const { money } = useMoney();
  const hotel = HOTELS.find((h) => h.id === booking.hotelId);
  return (
    <Pressable onPress={() => router.push({ pathname: '/booking/[id]', params: { id: booking.id } })} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
      <Image source={hotel?.images[0]} style={styles.img} contentFit="cover" transition={150} />
      <View style={{ flex: 1, gap: 3 }}>
        <Tag tone={statusTone(booking.status)} label={t(`status.${booking.status}`)} />
        <Text variant="title" numberOfLines={1} style={{ marginTop: 4 }}>
          {hotel?.name}
        </Text>
        <Text variant="caption" muted>
          {hotel && tl(hotel.city)} · {formatRange(booking.checkIn, booking.checkOut, locale)}
        </Text>
        <Text variant="caption" muted>
          {booking.number} · {money(booking.price.total, true)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  img: { width: 92, height: 92, borderRadius: radius.md, backgroundColor: colors.surface },
});
