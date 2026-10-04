import { router } from 'expo-router';
import { ArrowUpDown, Check, SearchX, SlidersHorizontal } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { HotelCard } from '@/components/HotelCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { api } from '@/data';
import type { SearchQuery } from '@/domain/types';
import { useAsync } from '@/hooks/useAsync';
import { useT } from '@/i18n';
import { useSearch } from '@/store/search';
import { useSession } from '@/store/session';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { EmptyState, Loading } from '@/ui/misc';
import { Text } from '@/ui/Text';
import { colors, radius } from '@/ui/theme';
import { formatRange } from '@/utils/date';

const SORTS: NonNullable<SearchQuery['sort']>[] = ['recommended', 'price_asc', 'price_desc', 'rating', 'reviews', 'distance'];

export default function Results() {
  const { t, locale } = useT();
  const insets = useSafeAreaInsets();
  const query = useSearch((s) => s.query);
  const setQuery = useSearch((s) => s.setQuery);
  const token = useSession((s) => s.token);
  const [sortOpen, setSortOpen] = useState(false);
  const res = useAsync(() => api.search(query, token), [JSON.stringify(query), token]);

  const guests = query.adults + query.children;
  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScreenHeader
        title={query.location || t('search.anywhere')}
        subtitle={`${formatRange(query.checkIn, query.checkOut, locale)} · ${guests} ${t('common.guests')}`}
        right={
          <Pressable onPress={() => router.push('/search')} hitSlop={8} accessibilityLabel={t('results.filters')}>
            <SlidersHorizontal size={22} color={colors.ink} strokeWidth={1.6} />
          </Pressable>
        }
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={{ flexGrow: 0, flexShrink: 0, minHeight: 58 }}>
        <Chip label={t(`sort.${query.sort ?? 'recommended'}`)} icon={<ArrowUpDown size={15} color={colors.white} />} active onPress={() => setSortOpen(true)} />
        <Chip label={t('results.breakfast')} active={!!query.breakfastOnly} onPress={() => setQuery({ breakfastOnly: !query.breakfastOnly })} />
        <Chip label={t('results.freeCancel')} active={!!query.freeCancellationOnly} onPress={() => setQuery({ freeCancellationOnly: !query.freeCancellationOnly })} />
        <Chip label={t('filter.minRating', { r: '4.8' })} active={query.minRating === 4.8} onPress={() => setQuery({ minRating: query.minRating ? undefined : 4.8 })} />
        <Chip label={t('amenity.pool')} active={!!query.amenities?.includes('pool')} onPress={() => setQuery({ amenities: query.amenities?.includes('pool') ? query.amenities.filter((a) => a !== 'pool') : [...(query.amenities ?? []), 'pool'] })} />
        <Chip label={t('amenity.spa')} active={!!query.amenities?.includes('spa')} onPress={() => setQuery({ amenities: query.amenities?.includes('spa') ? query.amenities.filter((a) => a !== 'spa') : [...(query.amenities ?? []), 'spa'] })} />
      </ScrollView>

      {res.loading && !res.data ? (
        <Loading />
      ) : res.error ? (
        <EmptyState title={t('common.error')} action={<Button title={t('common.retry')} size="md" onPress={res.reload} />} />
      ) : (
        <FlatList
          data={res.data ?? []}
          keyExtractor={(r) => r.hotel.id}
          refreshing={res.loading}
          onRefresh={res.reload}
          contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: insets.bottom + 24, flexGrow: 1 }}
          ListHeaderComponent={<Text variant="small" muted>{t('results.title', { n: res.data?.length ?? 0 })}</Text>}
          ListEmptyComponent={
            <EmptyState
              icon={<SearchX size={26} color={colors.ink} strokeWidth={1.5} />}
              title={t('results.empty')}
              hint={t('results.emptyHint')}
              action={<Button title={t('hotel.changeDates')} size="md" onPress={() => router.push('/search')} />}
            />
          }
          renderItem={({ item }) => (
            <HotelCard
              layout="list"
              hotel={item.hotel}
              price={item.fromPrice}
              freeCancellation={item.freeCancellationAvailable}
              breakfast={item.breakfastAvailable}
              leftRooms={item.availableRooms}
            />
          )}
        />
      )}

      <Modal visible={sortOpen} transparent animationType="fade" onRequestClose={() => setSortOpen(false)}>
        <Pressable style={styles.scrim} onPress={() => setSortOpen(false)}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.grabber} />
            <Text variant="h3" style={{ marginBottom: 8 }}>
              {t('results.sort')}
            </Text>
            {SORTS.map((s) => (
              <Pressable
                key={s}
                style={styles.sortRow}
                onPress={() => {
                  setQuery({ sort: s });
                  setSortOpen(false);
                }}
              >
                <Text variant="body" style={{ flex: 1 }}>
                  {t(`sort.${s}`)}
                </Text>
                {(query.sort ?? 'recommended') === s && <Check size={18} color={colors.ink} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  chips: { paddingHorizontal: 20, gap: 8, paddingVertical: 8, alignItems: 'center' },
  scrim: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, padding: 20 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 14 },
  sortRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.border },
});
