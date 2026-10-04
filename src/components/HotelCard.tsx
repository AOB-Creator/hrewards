import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Hotel } from '@/domain/types';
import { useT } from '@/i18n';
import { useMoney } from '@/utils/money';
import { StarIcon } from '@/ui/misc';
import { Tag } from '@/ui/Tag';
import { Text } from '@/ui/Text';
import { colors, radius } from '@/ui/theme';
import { HeartButton } from './HeartButton';

interface Props {
  hotel: Hotel;
  price?: number;
  freeCancellation?: boolean;
  breakfast?: boolean;
  width?: number;
  layout?: 'carousel' | 'list';
  leftRooms?: number;
}

/** White card with an inset rounded photo, name, city and "from" price. */
export function HotelCard({ hotel, price, freeCancellation, breakfast, width = 250, layout = 'carousel', leftRooms }: Props) {
  const { t, tl } = useT();
  const { money } = useMoney();
  const list = layout === 'list';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hotel.name}
      onPress={() => router.push({ pathname: '/hotel/[id]', params: { id: hotel.id } })}
      style={({ pressed }) => [styles.card, { width: list ? undefined : width }, pressed && { opacity: 0.92 }]}
    >
      <View>
        <Image source={hotel.images[0]} style={[styles.image, list && { height: 200 }]} contentFit="cover" transition={200} placeholder={{ blurhash: 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4' }} />
        <View style={styles.heart}>
          <HeartButton hotelId={hotel.id} size={40} />
        </View>
        {!!leftRooms && leftRooms <= 2 && (
          <View style={styles.left}>
            <Tag tone="white" label={t('results.left', { n: leftRooms })} />
          </View>
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.row}>
          <Text variant="title" numberOfLines={1} style={{ flex: 1, fontSize: 16 }}>
            {hotel.name}
          </Text>
          <StarIcon size={14} />
          <Text variant="small">{String(+hotel.rating.toFixed(2))}</Text>
        </View>
        <Text variant="small" muted>
          {tl(hotel.city)} · {hotel.distanceToCenterKm} {t('common.km')}
        </Text>
        {(freeCancellation || breakfast) && (
          <View style={[styles.row, { gap: 6, marginTop: 4, flexWrap: 'wrap' }]}>
            {freeCancellation && <Tag label={t('home.cancellation')} />}
            {breakfast && <Tag label={t('home.breakfast')} />}
          </View>
        )}
        {price != null && (
          <Text variant="body" style={{ marginTop: 6 }}>
            <Text variant="small" muted>{t('results.from')} </Text>
            <Text variant="bodyMedium" weight="semibold">{money(price, true)}</Text>
            <Text variant="small" muted>
              {t('common.perNight')}
            </Text>
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.xl, padding: 8 },
  image: { width: '100%', height: 150, borderRadius: 18, backgroundColor: colors.soft },
  heart: { position: 'absolute', top: 10, right: 10 },
  left: { position: 'absolute', left: 10, bottom: 10 },
  body: { paddingHorizontal: 8, paddingTop: 12, paddingBottom: 8, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
