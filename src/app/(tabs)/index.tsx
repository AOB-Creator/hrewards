import { router, useFocusEffect } from 'expo-router';
import { Bell, ChevronDown, ChevronRight, Gem, Search, SlidersHorizontal, Sparkles, Tag as TagIcon } from 'lucide-react-native';
import { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HotelCard } from '@/components/HotelCard';
import { api } from '@/data';
import { PROMO_CODES } from '@/data/seed';
import type { SearchQuery } from '@/domain/types';
import { useAsync } from '@/hooks/useAsync';
import { useLoyalty } from '@/hooks/useLoyalty';
import { useNotifications, useNotificationsCount } from '@/hooks/useNotifications';
import { useT } from '@/i18n';
import { useSearch } from '@/store/search';
import { useSession } from '@/store/session';
import { Chip } from '@/ui/Chip';
import { IconButton } from '@/ui/IconButton';
import { TAB_BAR_SPACE } from '@/ui/layout';
import { SectionHeader } from '@/ui/misc';
import { Text } from '@/ui/Text';
import { colors, radius } from '@/ui/theme';
import { isWithin, today } from '@/utils/date';
import { formatNumber } from '@/utils/money';

export default function HomeScreen() {
  const { t } = useT();
  const user = useSession((s) => s.user);
  const token = useSession((s) => s.token);
  const query = useSearch((s) => s.query);
  const setQuery = useSearch((s) => s.setQuery);
  const unread = useNotificationsCount();
  const loadNotifs = useNotifications((s) => s.load);
  const loyalty = useLoyalty();

  const hotels = useAsync(
    () => api.search({ ...query, location: '', types: [], minPrice: undefined, maxPrice: undefined, sort: 'recommended' }, token),
    [query.checkIn, query.checkOut, query.adults, query.children, query.rooms, token],
  );

  useFocusEffect(
    useCallback(() => {
      loadNotifs();
      loyalty.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]),
  );

  const openResults = (patch: Partial<SearchQuery>) => {
    setQuery(patch);
    router.push('/results');
  };

  const t0 = today();
  const offers = PROMO_CODES.filter((p) => isWithin(t0, p.validFrom, p.validTo) && (p.maxUses == null || p.used < p.maxUses));

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={hotels.loading && !!hotels.data} onRefresh={hotels.reload} />}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text variant="h1" style={{ fontSize: 26 }}>
              {t('home.hey', { name: user?.firstName || t('home.traveler') })}
            </Text>
            <Text variant="small" muted style={{ marginTop: 4, fontSize: 14 }}>
              {t('home.subtitle')}
            </Text>
          </View>
          <IconButton label={t('notifs.title')} size={48} floating onPress={() => router.push('/notifications')}>
            <Bell size={20} color={colors.ink} strokeWidth={1.6} />
            {unread > 0 && <View style={styles.dot} />}
          </IconButton>
        </View>

        <Pressable accessibilityRole="search" onPress={() => router.push('/search')} style={styles.searchBar}>
          <Search size={20} color={colors.ink} strokeWidth={1.6} />
          <Text variant="body" color={query.location ? colors.ink : colors.faint} style={{ flex: 1 }}>
            {query.location || t('search.locationPlaceholder')}
          </Text>
          <View style={styles.filterBtn}>
            <SlidersHorizontal size={18} color={colors.ink} strokeWidth={1.6} />
          </View>
        </Pressable>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label={t('home.location')} active trailing={<ChevronDown size={16} color={colors.white} />} onPress={() => router.push('/search')} />
          <Chip label={t('home.price')} trailing={<ChevronDown size={16} color={colors.ink} />} onPress={() => openResults({ sort: 'price_asc' })} />
          <Chip label={t('home.rating')} trailing={<ChevronDown size={16} color={colors.ink} />} onPress={() => openResults({ sort: 'rating' })} />
        </ScrollView>

        {user && loyalty.data ? (
          <Pressable onPress={() => router.navigate('/(tabs)/wallet')} style={styles.member}>
            <View style={styles.memberIcon}>
              <Gem size={20} color={colors.white} strokeWidth={1.6} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="h3" color={colors.accent}>
                {formatNumber(loyalty.data.balance)} {t('rewards.points')}
              </Text>
              <Text variant="small" muted>
                {loyalty.data.status.next
                  ? t('home.tierLine', { tier: t(`tier.${loyalty.data.status.tier.id}`), next: t(`tier.${loyalty.data.status.next.id}`), n: loyalty.data.status.nightsToNext })
                  : t(`tier.${loyalty.data.status.tier.id}`)}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.muted} />
          </Pressable>
        ) : !user ? (
          <Pressable onPress={() => router.push('/auth/login')} style={styles.member}>
            <View style={styles.memberIcon}>
              <Sparkles size={20} color={colors.white} strokeWidth={1.6} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="title">{t('home.joinTitle')}</Text>
              <Text variant="caption" muted>
                {t('home.joinBody')}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.muted} />
          </Pressable>
        ) : null}

        <View style={styles.section}>
          <SectionHeader title={t('home.popular')} action={t('common.seeAll')} onAction={() => openResults({ location: '', sort: 'recommended' })} />
        </View>
        {hotels.loading && !hotels.data ? (
          <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20 }}>
            {[0, 1].map((i) => (
              <View key={i} style={styles.skeleton} />
            ))}
          </View>
        ) : (
          <FlatList
            horizontal
            data={hotels.data ?? []}
            keyExtractor={(r) => r.hotel.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            renderItem={({ item }) => <HotelCard hotel={item.hotel} price={item.fromPrice} />}
          />
        )}

        {offers.length > 0 && (
          <View style={[styles.section, { gap: 10 }]}>
            <SectionHeader title={t('home.offers')} />
            {offers.map((p) => (
              <Pressable key={p.code} onPress={() => openResults({ location: '', sort: 'recommended' })} style={styles.offer}>
                <View style={styles.offerIcon}>
                  <TagIcon size={22} color={colors.accent} strokeWidth={1.6} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="title">{t(`offer.${p.code}`)}</Text>
                  <Text variant="small" muted>
                    {t('home.offerCode', { code: p.code })}
                  </Text>
                  <Text variant="caption" color={colors.accent} weight="medium">
                    {t('home.offerUntil', { date: p.validTo.split('-').reverse().join('.') })}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  dot: { position: 'absolute', top: 12, right: 13, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.white },
  searchBar: { marginHorizontal: 20, marginTop: 16, height: 52, borderRadius: radius.pill, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', paddingLeft: 18, paddingRight: 6, gap: 10 },
  filterBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  chips: { paddingHorizontal: 20, gap: 8, paddingTop: 16 },
  member: { marginHorizontal: 20, marginTop: 16, padding: 14, borderRadius: radius.lg, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  section: { paddingHorizontal: 20, marginTop: 22 },
  skeleton: { width: 250, height: 260, borderRadius: radius.xl, backgroundColor: colors.card },
  offer: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, borderRadius: radius.xl, backgroundColor: colors.card },
  offerIcon: { width: 72, height: 72, borderRadius: 18, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
});
