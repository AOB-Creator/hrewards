import { router, useFocusEffect } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, Check, Clock, RotateCcw } from 'lucide-react-native';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TierCard } from '@/components/TierCard';
import type { PointsTxKind } from '@/domain/types';
import { useLoyalty } from '@/hooks/useLoyalty';
import { useT } from '@/i18n';
import { useSession } from '@/store/session';
import { Button } from '@/ui/Button';
import { EmptyState, Loading } from '@/ui/misc';
import { Text } from '@/ui/Text';
import { colors, radius, tierColor } from '@/ui/theme';
import { formatNumber, useMoney } from '@/utils/money';

const TX_ICON: Record<PointsTxKind, typeof Check> = { earned: ArrowDownLeft, redeemed: ArrowUpRight, expired: Clock, refunded: RotateCcw, adjusted: Check };

export default function Rewards() {
  const { t, locale } = useT();
  const { money } = useMoney();
  const user = useSession((s) => s.user);
  const loyalty = useLoyalty();

  useFocusEffect(
    useCallback(() => {
      loyalty.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.root}>
        <ScreenHeader title={t('rewards.title')} />
        <EmptyState title={t('profile.guestTitle')} hint={t('profile.guestBody')} action={<Button title={t('common.signIn')} size="md" onPress={() => router.push('/auth/login')} />} />
      </SafeAreaView>
    );
  }
  if (!loyalty.data) return <Loading />;
  const d = loyalty.data;
  const cfg = d.config;
  const name = `${user.firstName} ${user.lastName}`.trim();

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScreenHeader title={t('rewards.title')} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 22, paddingBottom: 48 }}>
        <TierCard data={d} name={name} />
        <View style={{ gap: 4 }}>
          <Text variant="small" muted>
            {t('rewards.nightsYear', { n: d.status.nights })}
          </Text>
          <Text variant="small" muted>
            {t('rewards.expires', { date: new Date(d.expiresAt).toLocaleDateString(locale) })}
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          <Text variant="h3">{t('rewards.yourPerks')}</Text>
          {d.status.tier.perks.map((p) => (
            <View key={p} style={styles.perk}>
              <Check size={16} color={colors.success} />
              <Text variant="body">{t(p)}</Text>
            </View>
          ))}
        </View>

        <View style={{ gap: 10 }}>
          <Text variant="h3">{t('rewards.tiers')}</Text>
          {cfg.tiers.map((tier) => {
            const current = tier.id === d.status.tier.id;
            return (
              <View key={tier.id} style={[styles.tier, current && { borderColor: colors.ink, borderWidth: 1.5 }]}>
                <View style={[styles.tierDot, { backgroundColor: tierColor(tier.id) }]} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="title">{t(`tier.${tier.id}`)}</Text>
                  <Text variant="caption" muted>
                    {tier.minNights ? t('rewards.tierReq', { n: tier.minNights }) : t('rewards.tierReqSilver')}
                    {tier.bonus ? ` · ${t('rewards.bonus', { p: Math.round(tier.bonus * 100) })}` : ''}
                  </Text>
                  <Text variant="caption">{tier.perks.map((p) => t(p)).join(' · ')}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={[styles.how]}>
          <Text variant="h3">{t('rewards.how')}</Text>
          <Text variant="small">• {t('rewards.how1', { p: cfg.earnPoints, a: money(cfg.earnPerAmount) })}</Text>
          <Text variant="small">• {t('rewards.how2', { v: money(cfg.pointValue) })}</Text>
          <Text variant="small">• {t('rewards.how3', { m: cfg.expiryMonths })}</Text>
        </View>

        <View style={{ gap: 4 }}>
          <Text variant="h3" style={{ marginBottom: 6 }}>
            {t('rewards.history')}
          </Text>
          {d.history.length === 0 ? (
            <Text variant="small" muted>
              {t('rewards.historyEmpty')}
            </Text>
          ) : (
            d.history.map((tx) => {
              const Icon = TX_ICON[tx.kind];
              return (
                <View key={tx.id} style={styles.tx}>
                  <View style={styles.txIcon}>
                    <Icon size={16} color={colors.ink} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="body">{t(`tx.${tx.kind}`)}</Text>
                    <Text variant="caption" muted>
                      {new Date(tx.createdAt).toLocaleDateString(locale)}
                    </Text>
                  </View>
                  <Text variant="bodyMedium" color={tx.points >= 0 ? colors.success : colors.ink}>
                    {tx.points >= 0 ? '+' : '−'}
                    {formatNumber(Math.abs(tx.points))}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tier: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  tierDot: { width: 14, height: 14, borderRadius: 7, marginTop: 3 },
  how: { gap: 8, padding: 16, borderRadius: radius.lg, backgroundColor: colors.surface },
  tx: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.border },
  txIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
});
