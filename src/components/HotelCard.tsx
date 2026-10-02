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

/** "Popular hotels" card from the home screen. */
export function HotelCard({ hotel, price, freeCancellation = true, breakfast = true, width = 232, layout = 'carousel', leftRooms }: Props) {
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
        <Image source={hotel.images[0]} style={[styles.image, list && { height: 210 }]} contentFit="cover" transition={200} placeholder={{ blurhash: 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4' }} />
        <View style={styles.heart}>
          <HeartButton hotelId={hotel.id} />
        </View>
        {!!leftRooms && leftRooms <= 2 && (
          <View style={styles.left}>
            <Tag tone="white" label={t('results.left', { n: leftRooms })} />
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text variant="title" numberOfLines={1}>
          {hotel.name}
        </Text>
        <View style={styles.row}>
          <StarIcon />
          <Text variant="body">
            {String(+hotel.rating.toFixed(2))} ({hotel.reviewCount} {t('common.reviews')})
          </Text>
        </View>
        <Text variant="caption" muted>
          {tl(hotel.city)} · {hotel.distanceToCenterKm} {t('common.km')}
        </Text>
        <View style={[styles.row, { gap: 6, marginTop: 6, flexWrap: 'wrap' }]}>
          {freeCancellation && <Tag label={t('home.cancellation')} />}
          {breakfast && <Tag label={t('home.breakfast')} />}
        </View>
        {price != null && (
          <Text variant="bodyMedium" style={{ marginTop: 8 }}>
            {list && <Text variant="small" muted>{t('results.from')} </Text>}
            {money(price, true)}
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
  card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  image: { width: '100%', height: 150, backgroundColor: colors.surface },
  heart: { position: 'absolute', top: 10, right: 10 },
  left: { position: 'absolute', left: 10, bottom: 10 },
  body: { padding: 12, gap: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
