import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import type { LoyaltySummary } from '@/data';
import { useT } from '@/i18n';
import { Text } from '@/ui/Text';
import { colors, radius } from '@/ui/theme';
import { formatNumber, useMoney } from '@/utils/money';
import { Wordmark } from './Wordmark';

const GRADIENTS = {
  silver: ['#2A2A2E', '#4A4C52'],
  gold: ['#2B2416', '#6B5526'],
  platinum: ['#121212', '#3B3F4A'],
} as const;

export function TierCard({ data, name }: { data: LoyaltySummary; name: string }) {
  const { t } = useT();
  const { money } = useMoney();
  const { status, balance, config } = data;
  return (
    <LinearGradient colors={GRADIENTS[status.tier.id]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.top}>
        <Wordmark size={16} color={colors.white} />
        <View style={styles.tierPill}>
          <Text variant="caption" color={colors.ink} weight="semibold">
            {t(`tier.${status.tier.id}`).toUpperCase()}
          </Text>
        </View>
      </View>
      <Text variant="display" color={colors.white} style={{ marginTop: 18 }}>
        {formatNumber(balance)}
        <Text variant="body" color="rgba(255,255,255,0.7)">
          {' '}
          {t('rewards.points')}
        </Text>
      </Text>
      <Text variant="small" color="rgba(255,255,255,0.75)">
        {t('rewards.worth', { amount: money(balance * config.pointValue) })}
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(status.progress * 100)}%` }]} />
      </View>
      <View style={styles.bottom}>
        <Text variant="caption" color="rgba(255,255,255,0.8)">
          {status.next ? t('rewards.nightsToNext', { n: status.nightsToNext, tier: t(`tier.${status.next.id}`) }) : t('rewards.topTier')}
        </Text>
        <Text variant="caption" color="rgba(255,255,255,0.8)">
          {name}
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, padding: 20 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tierPill: { backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  track: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 18, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: colors.white, borderRadius: 2 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
});
