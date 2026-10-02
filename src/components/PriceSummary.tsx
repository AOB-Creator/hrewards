import { View } from 'react-native';
import type { PriceBreakdown } from '@/domain/types';
import { useT } from '@/i18n';
import { Divider, KeyValue } from '@/ui/misc';
import { colors } from '@/ui/theme';
import { useMoney } from '@/utils/money';

export function PriceSummary({ price, rooms }: { price: PriceBreakdown; rooms: number }) {
  const { t } = useT();
  const { money } = useMoney();
  return (
    <View>
      <KeyValue k={t('book.roomsNights', { rooms, nights: price.nights })} v={money(price.roomsSubtotal)} />
      {price.memberDiscount > 0 && <KeyValue k={t('book.memberDiscount')} v={`−${money(price.memberDiscount)}`} color={colors.success} />}
      {price.promoDiscount > 0 && <KeyValue k={t('book.promoDiscount')} v={`−${money(price.promoDiscount)}`} color={colors.success} />}
      {price.freeNightDiscount > 0 && <KeyValue k={t('book.freeNightDiscount', { n: price.pointsRedeemed })} v={`−${money(price.freeNightDiscount)}`} color={colors.success} />}
      {price.pointsDiscount > 0 && <KeyValue k={t('book.pointsDiscount', { n: price.pointsRedeemed })} v={`−${money(price.pointsDiscount)}`} color={colors.success} />}
      <View style={{ marginVertical: 6 }}>
        <Divider />
      </View>
      <KeyValue k={t('book.total')} v={money(price.total)} strong />
      {price.dueAtHotel > 0 && (
        <>
          <KeyValue k={t('book.dueNow')} v={money(price.dueNow)} />
          <KeyValue k={t('book.dueAtHotel')} v={money(price.dueAtHotel)} />
        </>
      )}
    </View>
  );
}
