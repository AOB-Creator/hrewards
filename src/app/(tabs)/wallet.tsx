import { router, useFocusEffect } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TierCard } from '@/components/TierCard';
import { HOTELS } from '@/data/seed';
import type { PointsTransaction } from '@/domain/types';
import { useAsync } from '@/hooks/useAsync';
import { useLoyalty } from '@/hooks/useLoyalty';
import { api } from '@/data';
import { useT } from '@/i18n';
import { useSession } from '@/store/session';
import { Button } from '@/ui/Button';
import { TAB_BAR_SPACE } from '@/ui/layout';
import { EmptyState, Loading } from '@/ui/misc';
import { Text } from '@/ui/Text';
import { colors, radius, tierColor } from '@/ui/theme';
import { formatNumber, useMoney } from '@/utils/money';

export default function Wallet() {
  const { t, locale } = useT();
  const { money } = useMoney();
  const user = useSession((s) => s.user);
  const token = useSession((s) => s.token);
  const loyalty = useLoyalty();
  // Hotel names for the history rows.
  const bookings = useAsync(async () => (token ? api.listBookings(token) : []), [token]);

  useFocusEffect(
    useCallback(() => {
      loyalty.reload();
      bookings.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  if (!user) {
    return (
      <SafeAreaView edges={['top']} style={styles.root}>
        <Text variant="h1" style={styles.title}>
          {t('tab.wallet')}
        </Text>
        <EmptyState title={t('profile.guestTitle')} hint={t('profile.guestBody')} action={<Button title={t('common.signIn')} size="md" onPress={() => router.push('/auth/login')} />} />
      </SafeAreaView>
    );
  }
  if (!loyalty.data) return <Loading />;
  const d = loyalty.data;
  const cfg = d.config;
  const hotelOf = (tx: PointsTransaction) => {
    const b = bookings.data?.find((x) => x.id === tx.bookingId);
    return b ? HOTELS.find((h) => h.id === b.hotelId)?.name : undefined;
  };

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: 16, paddingBottom: TAB_BAR_SPACE }}>
        <Text variant="h1" style={{ marginTop: 12 }}>
          {t('tab.wallet')}
        </Text>
        <TierCard data={d} />
        <Text variant="small" muted>
          {t('rewards.nightsYear', { n: d.status.nights })} · {t('rewards.expires', { date: new Date(d.expiresAt).toLocaleDateString(locale) })}
        </Text>

        <View style={styles.card}>
          <Text variant="title" style={{ fontSize: 16 }}>
            {t('rewards.how')}
          </Text>
          {[
            [t('rewards.how1Title'), t('rewards.how1', { p: cfg.earnPoints, a: money(cfg.earnPerAmount) })],
            [t('rewards.how2Title'), t('rewards.how2', { v: money(cfg.pointValue) })],
            [t('rewards.how3Title'), t('rewards.how3', { m: cfg.expiryMonths })],
          ].map(([title, body], i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={styles.num}>
                <Text variant="label" color={colors.accent}>
                  {i + 1}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="label">{title}</Text>
                <Text variant="caption" muted style={{ fontSize: 12 }}>
                  {body}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text variant="title" style={{ fontSize: 16 }}>
            {t('rewards.yourPerks')}
          </Text>
          {d.status.tier.perks.map((p) => (
            <View key={p} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Check size={16} color={colors.accent} />
              <Text variant="small">{t(p)}</Text>
            </View>
          ))}
        </View>

        <View style={{ gap: 8 }}>
          <Text variant="title" style={{ fontSize: 16 }}>
            {t('rewards.tiers')}
          </Text>
          {cfg.tiers.map((tier) => (
            <View key={tier.id} style={[styles.tier, tier.id === d.status.tier.id && { borderColor: colors.ink, borderWidth: 1.5 }]}>
              <View style={[styles.tierDot, { backgroundColor: tierColor(tier.id) }]} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="label">{t(`tier.${tier.id}`)}</Text>
                <Text variant="caption" muted style={{ fontSize: 12 }}>
                  {tier.minNights ? t('rewards.tierReq', { n: tier.minNights }) : t('rewards.tierReqSilver')}
                  {tier.bonus ? ` · ${t('rewards.bonus', { p: Math.round(tier.bonus * 100) })}` : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Text variant="title" style={{ fontSize: 16, marginTop: 4 }}>
          {t('rewards.history')}
        </Text>
        <View style={[styles.card, { paddingVertical: 0, gap: 0 }]}>
          {d.history.length === 0 ? (
            <Text variant="small" muted style={{ paddingVertical: 16 }}>
              {t('rewards.historyEmpty')}
            </Text>
          ) : (
            d.history.map((tx, i) => (
              <View key={tx.id} style={[styles.tx, i < d.history.length - 1 && styles.txBorder]}>
                <View style={{ flex: 1 }}>
                  <Text variant="small">{[hotelOf(tx), t(`tx.${tx.kind}`)].filter(Boolean).join(' · ')}</Text>
                  <Text variant="caption" muted>
                    {new Date(tx.createdAt).toLocaleDateString(locale)}
                  </Text>
                </View>
                <Text variant="bodyMedium" weight="semibold" color={tx.points >= 0 ? colors.accent : colors.ink}>
                  {tx.points >= 0 ? '+' : '−'}
                  {formatNumber(Math.abs(tx.points))}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { paddingHorizontal: 20, marginTop: 12 },
  card: { gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: colors.card },
  num: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  tier: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.card },
  tierDot: { width: 14, height: 14, borderRadius: 7, marginTop: 3 },
  tx: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 62, paddingVertical: 10 },
  txBorder: { borderBottomWidth: 1, borderColor: colors.border },
});
