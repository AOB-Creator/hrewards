import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Bath, BedDouble, Calendar, ChevronLeft, MapPin, Maximize, Phone, Share as ShareIcon, Sparkles, User } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Linking, Platform, Pressable, ScrollView, Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gallery } from '@/components/Gallery';
import { HeartButton } from '@/components/HeartButton';
import { RoomOfferCard } from '@/components/RoomOfferCard';
import { api } from '@/data';
import { useAsync } from '@/hooks/useAsync';
import { useT } from '@/i18n';
import { useSearch } from '@/store/search';
import { useSession } from '@/store/session';
import { Button } from '@/ui/Button';
import { CalendarModal } from '@/ui/CalendarModal';
import { IconButton } from '@/ui/IconButton';
import { EmptyState, Loading, RatingBar, StarIcon } from '@/ui/misc';
import { Tag } from '@/ui/Tag';
import { Text } from '@/ui/Text';
import { colors, radius } from '@/ui/theme';
import { formatRange } from '@/utils/date';
import { useMoney } from '@/utils/money';

export default function HotelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, tl, locale } = useT();
  const { money } = useMoney();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const token = useSession((s) => s.token);
  const query = useSearch((s) => s.query);
  const setQuery = useSearch((s) => s.setQuery);
  const [expanded, setExpanded] = useState(false);
  const [gallery, setGallery] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [calendar, setCalendar] = useState(false);

  const hotel = useAsync(() => api.getHotel(id), [id]);
  const offers = useAsync(
    () => api.roomOffers(id, { checkIn: query.checkIn, checkOut: query.checkOut, adults: query.adults, children: query.children, rooms: query.rooms }, token),
    [id, query.checkIn, query.checkOut, query.adults, query.children, query.rooms, token],
  );

  const offer = useMemo(() => offers.data?.find((o) => o.rate.id === selected) ?? offers.data?.[0], [offers.data, selected]);

  if (hotel.loading && !hotel.data) return <Loading />;
  if (!hotel.data) return <EmptyState title={t('common.error')} action={<Button title={t('common.back')} size="md" onPress={() => router.back()} />} />;
  const h = hotel.data;
  const heroH = Math.round(height * 0.44);
  const guests = query.adults + query.children;
  const perNight = offer ? Math.round(offer.price.total / Math.max(1, offer.price.nights)) : undefined;
  const thumbs = h.images.slice(1, 5);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <View style={{ height: heroH }}>
          <FlatList
            data={h.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(u, i) => `${i}-${u}`}
            onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item, index }) => (
              <Pressable onPress={() => setGallery(index)}>
                <Image source={item} style={{ width, height: heroH + 28 }} contentFit="cover" transition={200} />
              </Pressable>
            )}
          />
          <View style={[styles.heroBar, { top: insets.top + 8 }]}>
            <IconButton label={t('common.back')} floating onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}>
              <ChevronLeft size={22} color={colors.ink} strokeWidth={1.7} />
            </IconButton>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <HeartButton hotelId={h.id} size={44} />
              <IconButton label="Share" floating onPress={() => Share.share({ message: `${t('hotel.share', { name: h.name })} — ${tl(h.address)}` })}>
                <ShareIcon size={19} color={colors.ink} strokeWidth={1.7} />
              </IconButton>
            </View>
          </View>
          <View style={styles.dots}>
            {h.images.map((_, i) => (
              <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
            ))}
          </View>
        </View>

        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            <Text variant="h2" style={{ flex: 1 }}>
              {h.name}
            </Text>
            {perNight != null && (
              <Text variant="h3">
                {money(perNight, true)}
                <Text variant="caption" muted>
                  {t('common.perNight')}
                </Text>
              </Text>
            )}
          </View>
          <Text variant="body" muted style={{ marginTop: 4 }}>
            {tl(h.district)}, {tl(h.city)}, {t('home.searchPlaceholder')}
          </Text>

          <View style={styles.thumbs}>
            {thumbs.map((img, i) => (
              <Pressable key={i} style={styles.thumbWrap} onPress={() => setGallery(i + 1)} accessibilityLabel={t('hotel.photos')}>
                <Image source={img} style={styles.thumb} contentFit="cover" transition={150} />
                {i === thumbs.length - 1 && (
                  <View style={styles.more}>
                    <Text variant="body" color={colors.white}>
                      {h.photoCount - thumbs.length} {t('common.more')}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          <Text variant="title" style={styles.h}>
            {t('hotel.details')}
          </Text>
          <View style={styles.tagRow}>
            <Tag icon={<Maximize size={13} color={colors.muted} />} label={`${h.details.areaM2} m²`} />
            <Tag icon={<User size={13} color={colors.muted} />} label={t('hotel.guests', { n: h.details.guests })} />
            <Tag icon={<Bath size={13} color={colors.muted} />} label={t('hotel.bath', { n: h.details.baths })} />
            <Tag icon={<BedDouble size={13} color={colors.muted} />} label={t('hotel.beds', { n: h.details.beds })} />
          </View>
          <Text variant="body" style={{ marginTop: 14 }} numberOfLines={expanded ? undefined : 2}>
            {tl(h.description)}
          </Text>
          <Pressable onPress={() => setExpanded(!expanded)} hitSlop={6}>
            <Text variant="bodyMedium">{expanded ? t('common.showLess') : t('common.readMore')}</Text>
          </Pressable>

          <Text variant="title" style={styles.h}>
            {t('hotel.ratingReviews')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <StarIcon size={20} />
            <Text variant="h2">{String(+h.rating.toFixed(2))}</Text>
            <Text variant="h3" muted>
              {' '}• {h.reviewCount} {t('common.reviews')}
            </Text>
          </View>
          <RatingBar label={t('hotel.communication')} value={h.ratingBreakdown.communication} />
          <RatingBar label={t('hotel.cleanliness')} value={h.ratingBreakdown.cleanliness} />
          <RatingBar label={t('hotel.locationScore')} value={h.ratingBreakdown.location} />
          <RatingBar label={t('hotel.value')} value={h.ratingBreakdown.value} />
          <ReviewsList hotelId={h.id} />

          <Text variant="title" style={styles.h}>
            {t('hotel.amenities')}
          </Text>
          <View style={styles.tagRow}>
            {h.amenities.map((a) => (
              <Tag key={a} tone="grey" label={t(`amenity.${a}`)} />
            ))}
          </View>

          <View style={[styles.h, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <Text variant="title">{t('hotel.rooms')}</Text>
            <Pressable onPress={() => setCalendar(true)} style={styles.datePill} accessibilityLabel={t('hotel.changeDates')}>
              <Calendar size={14} color={colors.ink} />
              <Text variant="caption">
                {formatRange(query.checkIn, query.checkOut, locale)} · {guests}
              </Text>
            </Pressable>
          </View>
          {!token && (
            <Pressable onPress={() => router.push('/auth/login')} style={styles.memberHint}>
              <Sparkles size={16} color={colors.ink} />
              <Text variant="small" style={{ flex: 1 }}>
                {t('hotel.signInForPrice')}
              </Text>
            </Pressable>
          )}
          {offers.loading && !offers.data ? (
            <Loading />
          ) : offers.data?.length ? (
            <View style={{ gap: 10 }}>
              {offers.data.map((o) => (
                <RoomOfferCard key={o.rate.id} offer={o} checkIn={query.checkIn} selected={o.rate.id === offer?.rate.id} onSelect={() => setSelected(o.rate.id)} />
              ))}
            </View>
          ) : (
            <View style={styles.noRooms}>
              <Text variant="body" muted center>
                {t('hotel.noRooms')}
              </Text>
              <Button title={t('hotel.changeDates')} size="md" variant="secondary" onPress={() => setCalendar(true)} />
            </View>
          )}

          <Text variant="title" style={styles.h}>
            {t('hotel.location')}
          </Text>
          <Pressable
            style={styles.mapCard}
            onPress={() => {
              const { lat, lng } = h.geo;
              const url = Platform.select({ ios: `maps:0,0?q=${encodeURIComponent(h.name)}&ll=${lat},${lng}`, default: `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(h.name)})` });
              Linking.openURL(url).catch(() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`));
            }}
          >
            <MapPin size={20} color={colors.ink} strokeWidth={1.6} />
            <View style={{ flex: 1 }}>
              <Text variant="body">{tl(h.address)}</Text>
              <Text variant="caption" muted>
                {t('hotel.checkInOut', { in: h.checkInTime, out: h.checkOutTime })}
              </Text>
            </View>
            <Text variant="label">{t('hotel.openMap')}</Text>
          </Pressable>
          <Pressable style={[styles.mapCard, { marginTop: 8 }]} onPress={() => Linking.openURL(`tel:${h.phone}`)}>
            <Phone size={20} color={colors.ink} strokeWidth={1.6} />
            <Text variant="body" style={{ flex: 1 }}>
              {h.phone}
            </Text>
            <Text variant="label">{t('hotel.contact')}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={{ flex: 1 }}>
          <Text variant="h3">
            {offer ? `${money(offer.price.total, true)} ${t('common.total')}` : '—'}
          </Text>
          {offer && (
            <Text variant="caption" muted>
              {t('hotel.totalFor', { n: guests, price: money(perNight!, true) })}
            </Text>
          )}
        </View>
        <Button
          title={t('hotel.bookNow')}
          size="md"
          style={{ paddingHorizontal: 30, height: 52 }}
          disabled={!offer}
          testID="book-now"
          onPress={() => offer && router.push({ pathname: '/booking/new', params: { hotelId: h.id, rateId: offer.rate.id } })}
        />
      </View>

      <Gallery images={h.images} index={gallery} onClose={() => setGallery(null)} />
      <CalendarModal
        visible={calendar}
        checkIn={query.checkIn}
        checkOut={query.checkOut}
        onClose={() => setCalendar(false)}
        onApply={(checkIn, checkOut) => {
          setQuery({ checkIn, checkOut });
          setCalendar(false);
        }}
      />
    </View>
  );
}

function ReviewsList({ hotelId }: { hotelId: string }) {
  const reviews = useAsync(() => api.reviews(hotelId), [hotelId]);
  if (!reviews.data?.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingTop: 14 }} style={{ marginHorizontal: -20 }}>
      <View style={{ width: 10 }} />
      {reviews.data.slice(0, 6).map((r) => (
        <View key={r.id} style={styles.review}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={styles.avatar}>
              <Text variant="caption" weight="semibold">
                {r.author.slice(0, 1)}
              </Text>
            </View>
            <Text variant="label" style={{ flex: 1 }}>
              {r.author}
            </Text>
            <StarIcon size={12} />
            <Text variant="caption">{r.rating}</Text>
          </View>
          <Text variant="small" muted numberOfLines={3} style={{ marginTop: 8 }}>
            {r.text}
          </Text>
        </View>
      ))}
      <View style={{ width: 10 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  heroBar: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  dots: { position: 'absolute', bottom: 40, alignSelf: 'center', flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { width: 52, backgroundColor: colors.white },
  sheet: { marginTop: -28, backgroundColor: colors.bg, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, paddingHorizontal: 20, paddingTop: 24 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  thumbs: { flexDirection: 'row', gap: 6, marginTop: 16 },
  thumbWrap: { flex: 1, aspectRatio: 1, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.surface },
  thumb: { width: '100%', height: '100%' },
  more: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  h: { marginTop: 26, marginBottom: 12 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  datePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 30, borderRadius: radius.pill, backgroundColor: colors.surface },
  memberHint: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: radius.md, backgroundColor: colors.surface, marginBottom: 10 },
  noRooms: { padding: 20, gap: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg },
  mapCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  review: { width: 250, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
});
