import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { Bell, ChevronRight, CircleHelp, Coins, Globe, Heart, LogOut, ShieldCheck, UserRound } from 'lucide-react-native';
import { useCallback, type ReactNode } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wordmark } from '@/components/Wordmark';
import { formatPhone } from '@/domain/validation';
import { useLoyalty } from '@/hooks/useLoyalty';
import { useNotifications } from '@/hooks/useNotifications';
import { LOCALE_NAMES, useT } from '@/i18n';
import { useSession } from '@/store/session';
import { useSettings } from '@/store/settings';
import { Button } from '@/ui/Button';
import { Text } from '@/ui/Text';
import { colors, radius } from '@/ui/theme';
import { formatNumber } from '@/utils/money';
import { TAB_BAR_SPACE } from '@/ui/layout';

export default function Profile() {
  const { t } = useT();
  const { user, signOut } = useSession();
  const locale = useSettings((s) => s.locale);
  const currency = useSettings((s) => s.currency);
  const fx = useSettings((s) => s.fx);
  const loyalty = useLoyalty();
  const loadNotifs = useNotifications((s) => s.load);

  useFocusEffect(
    useCallback(() => {
      loyalty.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]),
  );

  const name = user ? `${user.firstName} ${user.lastName}`.trim() || formatPhone(user.phone) : '';

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: TAB_BAR_SPACE, gap: 18 }}>
        <Text variant="h1">{t('profile.title')}</Text>

        {user ? (
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <UserRound size={28} color="#55585E" strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="h3">{name}</Text>
              <Text variant="small" muted>
                {formatPhone(user.phone)}
              </Text>
              {loyalty.data && (
                <Pressable onPress={() => router.navigate('/(tabs)/wallet')} style={styles.tierBadge}>
                  <Text variant="caption" color={colors.accentInk} weight="semibold" style={{ fontSize: 12 }}>
                    {t('profile.tierBadge', { tier: t(`tier.${loyalty.data.status.tier.id}`), n: formatNumber(loyalty.data.balance) })}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.guest}>
            <Wordmark size={18} />
            <Text variant="h3">{t('profile.guestTitle')}</Text>
            <Text variant="small" muted>
              {t('profile.guestBody')}
            </Text>
            <Button title={t('common.signIn')} onPress={() => router.push('/auth/login')} style={{ marginTop: 6 }} testID="profile-signin" />
          </View>
        )}

        <View style={styles.menu}>
          {user && <Item icon={<UserRound size={20} color={colors.ink} strokeWidth={1.6} />} label={t('profile.personal')} onPress={() => router.push({ pathname: '/settings', params: { section: 'personal' } })} />}
          <Item icon={<Heart size={20} color={colors.ink} strokeWidth={1.6} />} label={t('saved.title')} onPress={() => router.push('/saved')} />
          {user && <Item icon={<Bell size={20} color={colors.ink} strokeWidth={1.6} />} label={t('profile.notifications')} onPress={() => router.push({ pathname: '/settings', params: { section: 'notifications' } })} />}
          <Item icon={<Globe size={20} color={colors.ink} strokeWidth={1.6} />} label={t('profile.language')} value={LOCALE_NAMES[locale]} onPress={() => router.push({ pathname: '/settings', params: { section: 'language' } })} />
          <Item icon={<Coins size={20} color={colors.ink} strokeWidth={1.6} />} label={t('profile.currency')} value={currency} onPress={() => router.push({ pathname: '/settings', params: { section: 'currency' } })} />
          <Item icon={<CircleHelp size={20} color={colors.ink} strokeWidth={1.6} />} label={t('profile.help')} onPress={() => Linking.openURL('tel:+998712000101')} />
          <Item icon={<ShieldCheck size={20} color={colors.ink} strokeWidth={1.6} />} label={t('profile.privacy')} onPress={() => Linking.openURL('https://marmaris.uz/privacy')} last />
        </View>
          {user && (
            <Button
              title={t('profile.signOut')}
              variant="secondary"
              icon={<LogOut size={20} color={colors.danger} strokeWidth={1.6} />}
              textColor={colors.danger}
              style={{ borderColor: '#E2C4C0' }}
              onPress={() =>
                Alert.alert(t('profile.signOut'), undefined, [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: t('profile.signOut'),
                    style: 'destructive',
                    onPress: () => {
                      signOut();
                      loadNotifs();
                    },
                  },
                ])
              }
            />
          )}
        <Text variant="caption" muted center>
          {t('profile.fx', { usd: formatNumber(fx.USD), eur: formatNumber(fx.EUR) })}
          {'\n'}
          {t('profile.version', { v: Constants.expoConfig?.version ?? '1.0.0' })}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Item({ icon, label, value, onPress, danger, last }: { icon: ReactNode; label: string; value?: string; onPress(): void; danger?: boolean; last?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, !last && styles.itemBorder, pressed && { opacity: 0.7 }]}>
      {icon}
      <Text variant="body" color={danger ? colors.danger : colors.ink} style={{ flex: 1 }}>
        {label}
      </Text>
      {value && (
        <Text variant="small" muted>
          {value}
        </Text>
      )}
      {!danger && <ChevronRight size={18} color={colors.faint} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radius.xl, backgroundColor: colors.card },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#D6D8DD', alignItems: 'center', justifyContent: 'center' },
  tierBadge: { alignSelf: 'flex-start', marginTop: 6, backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  guest: { gap: 8, padding: 20, borderRadius: radius.xl, backgroundColor: colors.card },
  menu: { borderRadius: radius.lg, backgroundColor: colors.card, paddingHorizontal: 16 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, height: 56 },
  itemBorder: { borderBottomWidth: 1, borderColor: colors.border },
});
