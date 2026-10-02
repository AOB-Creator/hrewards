import { Image } from 'expo-image';
import { BedDouble, Check, Coffee, Maximize2, ShieldCheck, Users } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import type { RoomOffer } from '@/domain/types';
import { useT } from '@/i18n';
import { Tag } from '@/ui/Tag';
import { Text } from '@/ui/Text';
import { colors, radius } from '@/ui/theme';
import { addDays, formatShortDate } from '@/utils/date';
import { useMoney } from '@/utils/money';

export function RoomOfferCard({ offer, checkIn, selected, onSelect }: { offer: RoomOffer; checkIn: string; selected: boolean; onSelect(): void }) {
  const { t, tl, locale } = useT();
  const { money } = useMoney();
  const { room, rate, price } = offer;
  const perNight = Math.round(price.total / Math.max(1, price.nights));
  const cancel =
    rate.cancellation.kind === 'free'
      ? t('room.freeCancel', { date: formatShortDate(addDays(checkIn, -rate.cancellation.freeUntilDaysBefore), locale) })
      : t('room.nonRefundable');
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onSelect}
      style={[styles.card, selected && styles.selected]}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Image source={room.images[0]} style={styles.img} contentFit="cover" transition={150} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="title">{tl(room.name)}</Text>
          <Text variant="caption" muted>
            {tl(rate.name)}
          </Text>
          <View style={styles.meta}>
            <Maximize2 size={12} color={colors.muted} />
            <Text variant="caption" muted>
              {t('room.sqm', { n: room.areaM2 })}
            </Text>
            <Users size={12} color={colors.muted} />
            <Text variant="caption" muted>
              {room.maxAdults + room.maxChildren}
            </Text>
            <BedDouble size={12} color={colors.muted} />
            <Text variant="caption" muted>
              {t(`bed.${room.bed}`)}
            </Text>
          </View>
        </View>
        <View style={[styles.radio, selected && styles.radioOn]}>{selected && <Check size={14} color={colors.white} strokeWidth={2.5} />}</View>
      </View>
      <View style={styles.tags}>
        <Tag tone={rate.breakfastIncluded ? 'success' : 'grey'} icon={<Coffee size={12} color={rate.breakfastIncluded ? colors.success : colors.inkSoft} />} label={rate.breakfastIncluded ? t('room.breakfast') : t('room.noBreakfast')} />
        <Tag tone={rate.cancellation.kind === 'free' ? 'success' : 'warning'} icon={<ShieldCheck size={12} color={rate.cancellation.kind === 'free' ? colors.success : colors.warning} />} label={cancel} />
        {rate.paymentModes.includes('at_hotel') && <Tag tone="grey" label={t('room.payAtHotel')} />}
        {rate.minNights > 1 && <Tag tone="grey" label={t('room.minNights', { n: rate.minNights })} />}
      </View>
      <View style={styles.priceRow}>
        {offer.available <= 3 ? (
          <Text variant="caption" color={colors.danger}>
            {t('room.left', { n: offer.available })}
          </Text>
        ) : (
          <View />
        )}
        <View style={{ alignItems: 'flex-end' }}>
          {price.memberDiscount > 0 && (
            <Text variant="caption" muted style={{ textDecorationLine: 'line-through' }}>
              {money(Math.round(price.roomsSubtotal / Math.max(1, price.nights)), true)}
            </Text>
          )}
          <Text variant="bodyMedium">
            {money(perNight, true)}
            <Text variant="small" muted>
              {t('common.perNight')}
            </Text>
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 12, gap: 10 },
  selected: { borderColor: colors.ink, borderWidth: 1.5 },
  img: { width: 72, height: 72, borderRadius: radius.sm, backgroundColor: colors.surface },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
});
