import { router, useFocusEffect } from 'expo-router';
import { Bell, ChevronDown, ChevronRight, Search, SlidersHorizontal, Sparkles } from 'lucide-react-native';
import { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DestinationCard } from '@/components/DestinationCard';
import { HotelCard } from '@/components/HotelCard';
import { api } from '@/data';
import { DESTINATIONS } from '@/data/seed';
import type { SearchQuery } from '@/domain/types';
import { useAsync } from '@/hooks/useAsync';
import { useNotifications, useNotificationsCount } from '@/hooks/useNotifications';
import { useLoyalty } from '@/hooks/useLoyalty';
import { useT } from '@/i18n';
import { useSearch } from '@/store/search';
import { useSession } from '@/store/session';
import { Chip } from '@/ui/Chip';
import { IconButton } from '@/ui/IconButton';
import { SectionHeader } from '@/ui/misc';
import { Text } from '@/ui/Text';
import { colors, radius, tierColor } from '@/ui/theme';
import { formatRange } from '@/utils/date';
import { formatNumber } from '@/utils/money';
import { TAB_BAR_SPACE } from './_layout';

export default function HomeScreen() {
  const { t, tl, locale } = useT();
  const user = useSession((s) => s.user);
  const token = useSession((s) => s.token);
  const query = useSearch((s) => s.query);
  const setQuery = useSearch((s) => s.setQuery);
  const recent = useSearch((s) => s.recent);
  const unread = useNotificationsCount();
  const loadNotifs = useNotifications((s) => s.load);
  const loyalty = useLoyalty();

  const popular = useAsync(
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

  const tiles = recent.length
    ? recent.map((r) => ({ key: r.destinationId, image: r.image, title: r.location, sub: formatRange(r.checkIn, r.checkOut, locale), loc: r.location }))
    : DESTINATIONS.map((d) => ({ key: d.id, image: d.image, title: tl(d.name), sub: formatRange(query.checkIn, query.checkOut, locale), loc: tl(d.name) }));

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={popular.loading && !!popular.data} onRefresh={popular.reload} />}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text variant="h2">{t('home.hey', { name: user?.firstName || t('home.traveler') })}</Text>
            <Text variant="small" muted style={{ marginTop: 2 }}>
              {t('home.subtitle')}
            </Text>
          </View>
          <IconButton label={t('notifs.title')} badge={unread} onPress={() => router.navigate('/(tabs)/inbox')}>
            <Bell size={20} color={colors.ink} strokeWidth={1.6} />
          </IconButton>
        </View>

        <Pressable accessibilityRole="search" onPress={() => router.push('/search')} style={styles.searchBar}>
          <Search size={20} color={colors.ink} strokeWidth={1.7} />
          <Text variant="body" color={query.location ? colors.ink : colors.faint} style={{ flex: 1 }}>
            {query.location || t('home.searchPlaceholder')}
          </Text>
          <SlidersHorizontal size={20} color={colors.ink} strokeWidth={1.6} />
        </Pressable>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label={t('home.location')} active trailing={<ChevronDown size={16} color={colors.white} />} onPress={() => router.push('/search')} />
          <Chip label={t('home.price')} trailing={<ChevronDown size={16} color={colors.ink} />} onPress={() => openResults({ sort: 'price_asc' })} />
          <Chip label={t('home.rating')} trailing={<ChevronDown size={16} color={colors.ink} />} onPress={() => openResults({ sort: 'rating' })} />
          <Chip label={t('home.reviews')} trailing={<ChevronDown size={16} color={colors.ink} />} onPress={() => openResults({ sort: 'reviews' })} />
        </ScrollView>

        {user && loyalty.data ? (
          <Pressable onPress={() => router.push('/rewards')} style={styles.member}>
            <View style={[styles.tierDot, { backgroundColor: tierColor(loyalty.data.status.tier.id) }]} />
            <Text variant="label" style={{ flex: 1 }}>
              {t('home.tierCard', { tier: t(`tier.${loyalty.data.status.tier.id}`), points: formatNumber(loyalty.data.balance) })}
            </Text>
            <ChevronRight size={18} color={colors.muted} />
          </Pressable>
        ) : !user ? (
          <Pressable onPress={() => router.push('/auth/login')} style={styles.join}>
            <View style={styles.joinIcon}>
              <Sparkles size={18} color={colors.white} strokeWidth={1.7} />
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
          <SectionHeader title={recent.length ? t('home.recent') : t('home.destinations')} />
        </View>
        <FlatList
          horizontal
          data={tiles}
          keyExtractor={(d) => d.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          renderItem={({ item }) => (
            <DestinationCard image={item.image} title={item.title} subtitle={item.sub} badge={t('home.wantToVisit')} onPress={() => openResults({ location: item.loc, sort: 'recommended' })} />
          )}
        />

        <View style={[styles.section, { marginTop: 24 }]}>
          <SectionHeader title={t('home.popular')} action={t('common.seeAll')} onAction={() => openResults({ location: '', sort: 'recommended' })} />
        </View>
        {popular.loading && !popular.data ? (
          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20 }}>
            {[0, 1].map((i) => (
              <View key={i} style={styles.skeleton} />
            ))}
          </View>
        ) : (
          <FlatList
            horizontal
            data={popular.data ?? []}
            keyExtractor={(r) => r.hotel.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
            renderItem={({ item }) => (
              <HotelCard hotel={item.hotel} price={item.fromPrice} freeCancellation={item.freeCancellationAvailable} breakfast={item.breakfastAvailable} />
            )}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  searchBar: {
    marginHorizontal: 20,
    marginTop: 18,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  chips: { paddingHorizontal: 20, gap: 8, paddingTop: 16 },
  section: { paddingHorizontal: 20, marginTop: 22 },
  member: { marginHorizontal: 20, marginTop: 16, height: 48, borderRadius: radius.pill, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 },
  tierDot: { width: 12, height: 12, borderRadius: 6 },
  join: { marginHorizontal: 20, marginTop: 16, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  joinIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  skeleton: { width: 232, height: 290, borderRadius: radius.lg, backgroundColor: colors.surface },
});
