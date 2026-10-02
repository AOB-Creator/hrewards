import { Heart } from 'lucide-react-native';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HotelCard } from '@/components/HotelCard';
import { HOTELS } from '@/data/seed';
import { useT } from '@/i18n';
import { useSearch } from '@/store/search';
import { EmptyState } from '@/ui/misc';
import { Text } from '@/ui/Text';
import { colors } from '@/ui/theme';
import { TAB_BAR_SPACE } from './_layout';

export default function Saved() {
  const { t } = useT();
  const favorites = useSearch((s) => s.favorites);
  const hotels = favorites.map((id) => HOTELS.find((h) => h.id === id)).filter((h) => !!h);
  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
        <Text variant="h1">{t('saved.title')}</Text>
      </View>
      <FlatList
        data={hotels}
        keyExtractor={(h) => h.id}
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: TAB_BAR_SPACE, flexGrow: 1 }}
        ListEmptyComponent={<EmptyState icon={<Heart size={26} color={colors.ink} strokeWidth={1.5} />} title={t('saved.empty')} hint={t('saved.emptyHint')} />}
        renderItem={({ item }) => <HotelCard hotel={item} layout="list" />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.bg } });
