import { StyleSheet, View } from 'react-native';
import type { LoyaltySummary } from '@/data';
import { useT } from '@/i18n';
import { Text } from '@/ui/Text';
import { colors, radius } from '@/ui/theme';
import { formatNumber, useMoney } from '@/utils/money';

/** Lavender balance card: points, value, tier and progress to the next tier. */
export function TierCard({ data }: { data: LoyaltySummary; name?: string }) {
  const { t } = useT();
  const { money } = useMoney();
  const { status, balance, config } = data;
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text variant="caption" color={colors.accentLight} style={{ letterSpacing: 1, fontSize: 12 }}>
          {t('rewards.title').toUpperCase()}
        </Text>
        <View style={styles.tierPill}>
          <Text variant="caption" color={colors.accentInk} weight="semibold" style={{ fontSize: 12 }}>
            {t(`tier.${status.tier.id}`)}
          </Text>
        </View>
      </View>
      <Text variant="display" color={colors.white} style={{ fontSize: 44, lineHeight: 50, marginTop: 14 }}>
        {formatNumber(balance)}{' '}
        <Text variant="body" color={colors.white} style={{ fontSize: 17 }}>
          {t('rewards.points')}
        </Text>
      </Text>
      <Text variant="small" color={colors.accentLight}>
        {t('rewards.worth', { amount: money(balance * config.pointValue) })}
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(status.progress * 100)}%` }]} />
      </View>
      <View style={styles.bottom}>
        <Text variant="caption" color={colors.accentLight}>
          {t(`tier.${status.tier.id}`)}
        </Text>
        <Text variant="caption" color={colors.accentLight} style={{ flex: 1, textAlign: 'center' }}>
          {status.next ? t('rewards.nightsToNext', { n: status.nightsToNext, tier: t(`tier.${status.next.id}`) }) : t('rewards.topTier')}
        </Text>
        {status.next && (
          <Text variant="caption" color={colors.accentLight}>
            {t(`tier.${status.next.id}`)}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, padding: 20, backgroundColor: colors.accent },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tierPill: { backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4 },
  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)', marginTop: 16, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: colors.white, borderRadius: 3 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 6 },
});
