import { router } from 'expo-router';
import { CalendarDays, MapPin, Search as SearchIcon, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/data';
import { DESTINATIONS, HOTELS, PROPERTY_TYPES } from '@/data/seed';
import { useAsync } from '@/hooks/useAsync';
import { useT } from '@/i18n';
import { useSearch } from '@/store/search';
import { Button } from '@/ui/Button';
import { CalendarModal } from '@/ui/CalendarModal';
import { Chip } from '@/ui/Chip';
import { PriceRangeSlider } from '@/ui/PriceRangeSlider';
import { Stepper } from '@/ui/Stepper';
import { Text } from '@/ui/Text';
import { colors, fonts, radius } from '@/ui/theme';
import { formatSlashDate } from '@/utils/date';
import { formatNumber, useMoney } from '@/utils/money';

const STEP = 50_000;

export default function SearchSheet() {
  const { t, tl } = useT();
  const insets = useSafeAreaInsets();
  const { toUZS, fromUZS, currency } = useMoney();
  const stored = useSearch((s) => s.query);
  const setQuery = useSearch((s) => s.setQuery);
  const addRecent = useSearch((s) => s.addRecent);
  const hist = useAsync(() => api.priceHistogram(), []);

  const [q, setQ] = useState(stored);
  const [calendar, setCalendar] = useState(false);
  const [focus, setFocus] = useState(false);

  const min = hist.data?.min ?? 0;
  const max = hist.data?.max ?? 6_000_000;
  const low = q.minPrice ?? min;
  const high = q.maxPrice ?? max;

  const suggestions = useMemo(() => {
    const text = q.location.trim().toLowerCase();
    const cities = DESTINATIONS.map((d) => ({ key: d.id, label: `${tl(d.name)}, ${t('home.searchPlaceholder')}`, value: tl(d.name), hotelId: undefined as string | undefined }));
    const hotels = HOTELS.map((h) => ({ key: h.id, label: `${h.name} · ${tl(h.city)}`, value: h.name, hotelId: h.id as string | undefined }));
    return [...cities, ...hotels].filter((s) => !text || s.label.toLowerCase().includes(text)).slice(0, 6);
  }, [q.location, t, tl]);

  const submit = () => {
    const query = {
      ...q,
      minPrice: q.minPrice && q.minPrice > min ? q.minPrice : undefined,
      maxPrice: q.maxPrice && q.maxPrice < max ? q.maxPrice : undefined,
    };
    setQuery(query);
    const first = q.location.split(',')[0].trim().toLowerCase();
    const dest = DESTINATIONS.find((d) => Object.values(d.name).some((n) => n.toLowerCase() === first));
    const hotel = HOTELS.find((h) => h.name.toLowerCase() === first);
    if (dest || hotel) {
      addRecent({ destinationId: dest?.id ?? hotel!.id, location: dest ? tl(dest.name) : hotel!.name, checkIn: q.checkIn, checkOut: q.checkOut, image: dest?.image ?? hotel!.images[0] });
    }
    router.back();
    setTimeout(() => (query.hotelId ? router.push({ pathname: '/hotel/[id]', params: { id: query.hotelId } }) : router.push('/results')), 10);
  };

  const reset = () => setQ({ ...q, location: '', hotelId: undefined, adults: 2, children: 0, rooms: 1, minPrice: undefined, maxPrice: undefined, types: [] });

  const priceInput = (value: number, onSet: (v: number) => void, label: string) => (
    <View style={{ flex: 1, gap: 8 }}>
      <Text variant="caption" style={{ fontSize: 12.5 }}>
        {label}
      </Text>
      <View style={styles.input}>
        {currency !== 'UZS' && <Text variant="body">{currency === 'USD' ? '$' : '€'}</Text>}
        <TextInput
          accessibilityLabel={label}
          keyboardType="number-pad"
          defaultValue={formatNumber(fromUZS(value))}
          key={`${label}-${value}-${currency}`}
          onEndEditing={(e) => {
            const n = Number(e.nativeEvent.text.replace(/\D/g, ''));
            if (!Number.isNaN(n)) onSet(toUZS(n));
          }}
          style={styles.textInput}
        />
        {currency === 'UZS' && (
          <Text variant="small" muted>
            UZS
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <View style={styles.grabber} />
      <View style={styles.header}>
        <Text variant="title" style={{ fontSize: 16 }}>
          {t('search.title')}
        </Text>
        <Pressable accessibilityLabel={t('common.close')} onPress={() => router.back()} hitSlop={10} style={styles.close}>
          <X size={22} color={colors.ink} strokeWidth={1.6} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text variant="title" style={[styles.label, { marginTop: 4 }]}>
          {t('search.location')}
        </Text>
        <View style={styles.input}>
          <TextInput
            value={q.location}
            onChangeText={(location) => setQ({ ...q, location, hotelId: undefined })}
            onFocus={() => setFocus(true)}
            onBlur={() => setTimeout(() => setFocus(false), 150)}
            placeholder={t('search.locationPlaceholder')}
            placeholderTextColor={colors.faint}
            style={styles.textInput}
            returnKeyType="search"
            onSubmitEditing={submit}
          />
          {q.location ? (
            <Pressable hitSlop={8} onPress={() => setQ({ ...q, location: '', hotelId: undefined })} accessibilityLabel={t('common.remove')}>
              <X size={16} color={colors.muted} />
            </Pressable>
          ) : (
            <SearchIcon size={16} color={colors.ink} />
          )}
        </View>
        {focus && (
          <View style={styles.suggest}>
            {suggestions.map((s) => (
              <Pressable key={s.key} style={styles.suggestRow} onPress={() => setQ({ ...q, location: s.value, hotelId: s.hotelId })}>
                <MapPin size={16} color={colors.muted} />
                <Text variant="small">{s.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text variant="title" style={styles.label}>
          {t('search.dates')}
        </Text>
        <View style={styles.twoCols}>
          {([['checkIn', q.checkIn], ['checkOut', q.checkOut]] as const).map(([key, value]) => (
            <Pressable key={key} onPress={() => setCalendar(true)} style={styles.datePill} accessibilityRole="button" accessibilityLabel={t(`search.${key}`)}>
              <View>
                <Text variant="caption" muted>
                  {t(`search.${key}`)}
                </Text>
                <Text variant="body">{formatSlashDate(value)}</Text>
              </View>
              <CalendarDays size={18} color={colors.ink} strokeWidth={1.6} />
            </Pressable>
          ))}
        </View>

        <View style={styles.twoCols}>
          <View style={{ flex: 1 }}>
            <Text variant="title" style={styles.label}>
              {t('search.adults')}
            </Text>
            <Stepper label={t('search.adults')} value={q.adults} min={Math.max(1, q.rooms)} max={12} onChange={(adults) => setQ({ ...q, adults })} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="title" style={styles.label}>
              {t('search.children')}
            </Text>
            <Stepper label={t('search.children')} value={q.children} max={8} onChange={(children) => setQ({ ...q, children })} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="title" style={styles.label}>
              {t('search.rooms')}
            </Text>
            <Stepper label={t('search.rooms')} value={q.rooms} min={1} max={Math.min(6, q.adults)} onChange={(rooms) => setQ({ ...q, rooms })} />
          </View>
        </View>

        <Text variant="title" style={[styles.label, { marginBottom: 12 }]}>
          {t('search.priceRange')}
        </Text>
        <PriceRangeSlider
          min={min}
          max={max}
          step={STEP}
          low={low}
          high={high}
          buckets={hist.data?.buckets ?? Array.from({ length: 20 }, () => 0)}
          onChange={(l, h) => setQ((prev) => ({ ...prev, minPrice: l, maxPrice: h }))}
        />
        <View style={[styles.twoCols, { marginTop: 14 }]}>
          {priceInput(low, (v) => setQ({ ...q, minPrice: Math.max(min, Math.min(v, high - STEP)) }), t('search.minPrice'))}
          {priceInput(high, (v) => setQ({ ...q, maxPrice: Math.min(max, Math.max(v, low + STEP)) }), t('search.maxPrice'))}
        </View>

        <Text variant="title" style={styles.label}>
          {t('search.type')}
        </Text>
        <View style={styles.types}>
          <Chip label={t('search.allTypes')} active={q.types.length === 0} onPress={() => setQ({ ...q, types: [] })} />
          {PROPERTY_TYPES.map((type) => (
            <Chip
              key={type}
              label={t(`type.${type}`)}
              active={q.types.includes(type)}
              onPress={() => setQ({ ...q, types: q.types.includes(type) ? q.types.filter((x) => x !== type) : [...q.types, type] })}
            />
          ))}
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button title={t('search.reset')} variant="secondary" onPress={reset} style={{ flex: 1 }} />
        <Button title={t('search.search')} onPress={submit} style={{ flex: 1 }} testID="search-submit" />
      </View>
      <CalendarModal
        visible={calendar}
        checkIn={q.checkIn}
        checkOut={q.checkOut}
        onClose={() => setCalendar(false)}
        onApply={(checkIn, checkOut) => {
          setQ({ ...q, checkIn, checkOut });
          setCalendar(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.card },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, marginTop: 8, opacity: Platform.OS === 'ios' ? 1 : 0 },
  header: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  close: { position: 'absolute', right: 20, top: 12 },
  content: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 },
  label: { marginTop: 20, marginBottom: 8 },
  input: { height: 46, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8 },
  textInput: { flex: 1, minWidth: 0, fontFamily: fonts.regular, fontSize: 15, color: colors.ink, paddingVertical: 0 },
  suggest: { marginTop: 6, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 4 },
  suggestRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  datePill: { flex: 1, height: 54, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  twoCols: { flexDirection: 'row', gap: 8 },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.card },
});
