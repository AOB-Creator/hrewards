import { Heart } from 'lucide-react-native';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HotelCard } from '@/components/HotelCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { HOTELS } from '@/data/seed';
import { useT } from '@/i18n';
import { useSearch } from '@/store/search';
import { EmptyState } from '@/ui/misc';
import { colors } from '@/ui/theme';

export default function Saved() {
  const { t } = useT();
  const favorites = useSearch((s) => s.favorites);
  const hotels = favorites.map((id) => HOTELS.find((h) => h.id === id)).filter((h) => !!h);
  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScreenHeader title={t('saved.title')} />
      <FlatList
        data={hotels}
        keyExtractor={(h) => h.id}
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 48, flexGrow: 1 }}
        ListEmptyComponent={<EmptyState icon={<Heart size={26} color={colors.ink} strokeWidth={1.5} />} title={t('saved.empty')} hint={t('saved.emptyHint')} />}
        renderItem={({ item }) => <HotelCard hotel={item} layout="list" />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.bg } });
