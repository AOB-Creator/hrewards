import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, ChevronLeft, Clock, Download, Gift, Lock, Sparkles, Tag as TagIcon } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PriceSummary } from '@/components/PriceSummary';
import { ApiError, api } from '@/data';
import { RATE_PLANS, ROOM_TYPES } from '@/data/seed';
import { estimatePoints, freeNightPointsCost, maxRedeemablePoints } from '@/domain/loyalty-ui';
import type { Booking, GuestDetails, PaymentMode, PaymentProvider, PriceBreakdown, RoomHold } from '@/domain/types';
import { isValidEmail, isValidPhone } from '@/domain/validation';
import { useAsync } from '@/hooks/useAsync';
import { useLoyalty } from '@/hooks/useLoyalty';
import { useT } from '@/i18n';
import { shareVoucher } from '@/services/voucher';
import { useSearch } from '@/store/search';
import { useSession } from '@/store/session';
import { Button } from '@/ui/Button';
import { Field } from '@/ui/Field';
import { IconButton } from '@/ui/IconButton';
import { Divider, Loading } from '@/ui/misc';
import { Tag } from '@/ui/Tag';
import { Text } from '@/ui/Text';
import { colors, radius } from '@/ui/theme';
import { addDays, formatLongDate } from '@/utils/date';
import { formatNumber, useMoney } from '@/utils/money';

const PROVIDERS: PaymentProvider[] = ['payme', 'click', 'uzum', 'uzcard', 'humo', 'visa_mc'];
const PROVIDER_COLORS: Record<string, string> = { payme: '#33CCCC', click: '#0A6CFF', uzum: '#7B2BF9', uzcard: '#0D4C9B', humo: '#E7A321', visa_mc: '#1A1F71' };

export default function NewBooking() {
  const { hotelId, rateId } = useLocalSearchParams<{ hotelId: string; rateId: string }>();
  const { t, tl, locale } = useT();
  const { money } = useMoney();
  const insets = useSafeAreaInsets();
  const query = useSearch((s) => s.query);
  const { token, user } = useSession();
  const rememberGuestBooking = useSession((s) => s.rememberGuestBooking);
  const loyalty = useLoyalty();

  const rate = RATE_PLANS.find((r) => r.id === rateId)!;
  const room = ROOM_TYPES.find((r) => r.id === rate?.roomTypeId)!;
  const hotel = useAsync(() => api.getHotel(hotelId), [hotelId]);

  const [step, setStep] = useState(1);
  const [hold, setHold] = useState<RoomHold>();
  const [holdError, setHoldError] = useState<string>();
  const [now, setNow] = useState(() => Date.now());
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(rate.paymentModes[0]);
  const [provider, setProvider] = useState<PaymentProvider>('payme');
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<string>();
  const [promoError, setPromoError] = useState<string>();
  const [pointsMode, setPointsMode] = useState<'none' | 'max' | 'night'>('none');
  const [price, setPrice] = useState<PriceBreakdown>();
  const [paying, setPaying] = useState(false);
  const [booking, setBooking] = useState<Booking>();
  const [guest, setGuest] = useState<GuestDetails>({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '+998 ',
    email: user?.email ?? '',
    citizenship: user?.citizenship ?? 'UZ',
    specialRequests: '',
    arrivalTime: hotel.data?.checkInTime ?? '14:00',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof GuestDetails, string>>>({});
  const booked = useRef(false);

  // 15-minute hold so the room cannot be sold twice while the guest fills the form.
  useEffect(() => {
    let created: RoomHold | undefined;
    api
      .createHold(room.id, query.checkIn, query.checkOut, query.rooms)
      .then((h) => {
        created = h;
        setHold(h);
      })
      .catch((e) => setHoldError(e instanceof ApiError && e.code === 'sold_out' ? t('book.soldOut') : t('common.error')));
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(timer);
      if (created && !booked.current) api.releaseHold(created.id).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remaining = hold ? Math.max(0, hold.expiresAt - now) : 0;
  const expired = !!hold && remaining === 0 && !booking;
  useEffect(() => {
    if (expired) {
      Alert.alert(t('book.holdExpired'), undefined, [{ text: 'OK', onPress: () => router.back() }]);
    }
  }, [expired, t]);

  const balance = loyalty.data?.balance ?? 0;
  const tier = loyalty.data?.status.tier.id ?? 'silver';
  const cfg = loyalty.data?.config;

  useEffect(() => {
    let alive = true;
    const pointsToRedeem = pointsMode === 'max' ? balance : 0;
    api
      .quote(
        { ratePlanId: rate.id, checkIn: query.checkIn, checkOut: query.checkOut, rooms: query.rooms, paymentMode, promoCode: promo, pointsToRedeem, useFreeNight: pointsMode === 'night' },
        token,
      )
      .then((p) => alive && setPrice(p))
      .catch((e) => {
        if (alive && e instanceof ApiError && e.code.startsWith('promo_')) {
          setPromo(undefined);
          setPromoError(t(`promo.${e.code.slice(6)}`));
        }
      });
    return () => {
      alive = false;
    };
  }, [pointsMode, balance, rate.id, query.checkIn, query.checkOut, query.rooms, paymentMode, promo, token, t]);

  const applyPromo = async () => {
    setPromoError(undefined);
    const code = promoInput.trim();
    if (!code) return;
    const r = await api.checkPromo(code, hotelId, price?.nights ?? 1);
    if (r.ok) setPromo(code.toUpperCase());
    else setPromoError(t(`promo.${r.error}`));
  };

  const validateGuest = () => {
    const e: typeof errors = {};
    if (!guest.firstName.trim()) e.firstName = t('book.required');
    if (!guest.lastName.trim()) e.lastName = t('book.required');
    if (!isValidPhone(guest.phone)) e.phone = t('book.invalidPhone');
    if (!isValidEmail(guest.email)) e.email = t('book.invalidEmail');
    if (!guest.citizenship.trim()) e.citizenship = t('book.required');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pay = async () => {
    if (!hold || !price) return;
    setPaying(true);
    try {
      // Redirect to provider checkout (Payme / Click / Uzum / acquiring) happens here in production.
      await new Promise((r) => setTimeout(r, paymentMode === 'at_hotel' ? 400 : 1400));
      const b = await api.createBooking(
        {
          holdId: hold.id,
          hotelId,
          ratePlanId: rate.id,
          checkIn: query.checkIn,
          checkOut: query.checkOut,
          rooms: query.rooms,
          adults: query.adults,
          children: query.children,
          guest,
          paymentMode,
          paymentProvider: provider,
          promoCode: promo,
          pointsToRedeem: pointsMode === 'max' ? balance : 0,
          useFreeNight: pointsMode === 'night',
        },
        token,
      );
      booked.current = true;
      if (!token) rememberGuestBooking(b.id);
      setBooking(b);
      setStep(4);
    } catch (e) {
      Alert.alert(e instanceof ApiError && e.code === 'hold_expired' ? t('book.holdExpired') : t('common.error'));
    } finally {
      setPaying(false);
    }
  };

  const nightsCount = price?.nights ?? 0;
  const maxPts = useMemo(() => (price && cfg ? Math.min(balance, maxRedeemablePoints(price.roomsSubtotal - price.memberDiscount - price.promoDiscount, cfg)) : 0), [price, cfg, balance]);
  const nightCost = useMemo(() => (price && cfg ? freeNightPointsCost(Math.min(...price.nightly.map((n) => n.price)), cfg) : Infinity), [price, cfg]);
  const earn = price ? estimatePoints(price.total, tier, cfg) : 0;

  if (holdError) {
    return (
      <SafeAreaView style={[styles.root, { justifyContent: 'center', padding: 24, gap: 16 }]}>
        <Text variant="h3" center>
          {holdError}
        </Text>
        <Button title={t('common.back')} onPress={() => router.back()} />
      </SafeAreaView>
    );
  }
  if (!hotel.data || !price || !hold) return <Loading />;
  const h = hotel.data;

  if (step === 4 && booking) {
    return (
      <SafeAreaView style={[styles.root, { padding: 24 }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={40} color={colors.white} strokeWidth={1.6} />
          </View>
          <Text variant="h1" center>
            {t('book.success')}
          </Text>
          <Text variant="body" muted center>
            {t('book.successBody')}
          </Text>
          <View style={styles.numberBox}>
            <Text variant="caption" muted>
              {t('book.number')}
            </Text>
            <Text variant="h2" selectable>
              {booking.number}
            </Text>
            <Text variant="small" muted center>
              {h.name} · {formatLongDate(booking.checkIn, locale)} – {formatLongDate(booking.checkOut, locale)}
            </Text>
          </View>
          {token && earn > 0 && <Tag tone="success" icon={<Sparkles size={12} color={colors.success} />} label={t('book.earn', { n: earn })} />}
        </View>
        <View style={{ gap: 10, paddingBottom: insets.bottom }}>
          <Button title={t('book.voucher')} variant="secondary" icon={<Download size={18} color={colors.ink} />} onPress={() => shareVoucher(booking, h, room, locale, money).catch(() => Alert.alert(t('common.error')))} />
          <Button title={t('book.viewBooking')} onPress={() => router.replace({ pathname: '/booking/[id]', params: { id: booking.id } })} />
          <Button title={t('book.backHome')} variant="ghost" size="md" onPress={() => router.dismissTo('/(tabs)')} />
        </View>
      </SafeAreaView>
    );
  }

  const mm = String(Math.floor(remaining / 60000)).padStart(2, '0');
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');
  const stepTitle = [t('book.step1'), t('book.step2'), t('book.step3')][step - 1];

  const next = () => {
    if (step === 1) setStep(2);
    else if (step === 2 && validateGuest()) setStep(3);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <View style={styles.header}>
        <IconButton label={t('common.back')} onPress={() => (step > 1 ? setStep(step - 1) : router.back())}>
          <ChevronLeft size={22} color={colors.ink} strokeWidth={1.6} />
        </IconButton>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text variant="title" style={{ fontSize: 16 }}>
            {stepTitle}
          </Text>
          <Text variant="caption" muted>
            {t('book.step', { n: step, total: 4 })}
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>
      <View style={styles.progress}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.progressSeg, i <= step && { backgroundColor: colors.ink }]} />
        ))}
      </View>
      <View style={[styles.hold, remaining < 3 * 60_000 && { backgroundColor: colors.warningBg }]}>
        <Clock size={14} color={remaining < 3 * 60_000 ? colors.warning : colors.inkSoft} />
        <Text variant="caption" color={remaining < 3 * 60_000 ? colors.warning : colors.inkSoft}>
          {t('book.holdTimer', { time: `${mm}:${ss}` })}
        </Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* Stay summary — always visible */}
          <View style={styles.stay}>
            <Image source={room.images[0]} style={styles.stayImg} contentFit="cover" />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="title" numberOfLines={1}>
                {h.name}
              </Text>
              <Text variant="small">{tl(room.name)}</Text>
              <Text variant="caption" muted>
                {tl(rate.name)}
              </Text>
              <Text variant="caption" muted>
                {formatLongDate(query.checkIn, locale)} – {formatLongDate(query.checkOut, locale)} · {nightsCount} {t('common.nights')} · {query.adults + query.children} {t('common.guests')}
              </Text>
            </View>
          </View>

          {step === 1 && (
            <View style={{ gap: 18, marginTop: 20 }}>
              <View style={styles.policy}>
                <Text variant="label">{t('book.policy')}</Text>
                <Text variant="small" muted>
                  {rate.cancellation.kind === 'free'
                    ? t('room.freeCancel', { date: formatLongDate(addDays(query.checkIn, -rate.cancellation.freeUntilDaysBefore), locale) })
                    : t('room.nonRefundable')}
                </Text>
              </View>

              {token && loyalty.data && loyalty.data.status.tier.perks.length > 1 && (
                <View style={styles.perks}>
                  <Text variant="label">{t('bk.perks')}</Text>
                  {loyalty.data.status.tier.perks.map((p) => (
                    <Text key={p} variant="small">
                      • {t(p)}
                    </Text>
                  ))}
                </View>
              )}

              <View>
                <Text variant="title" style={{ marginBottom: 8 }}>
                  {t('book.promo')}
                </Text>
                {promo ? (
                  <View style={styles.promoApplied}>
                    <TagIcon size={16} color={colors.success} />
                    <Text variant="small" color={colors.success} style={{ flex: 1 }}>
                      {t('book.promoApplied', { code: promo })}
                    </Text>
                    <Pressable onPress={() => setPromo(undefined)} hitSlop={8}>
                      <Text variant="label">{t('common.remove')}</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Field value={promoInput} onChangeText={setPromoInput} placeholder={t('book.promoPh')} autoCapitalize="characters" error={promoError} />
                    </View>
                    <Button title={t('common.apply')} size="md" variant="secondary" style={{ height: 50 }} onPress={applyPromo} />
                  </View>
                )}
              </View>

              {token && cfg ? (
                <View style={styles.points}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Gift size={18} color={colors.ink} strokeWidth={1.6} />
                    <Text variant="title">{t('book.usePoints')}</Text>
                  </View>
                  <Text variant="caption" muted>
                    {t('book.pointsBalance', { n: formatNumber(balance), v: money(cfg.pointValue) })}
                  </Text>
                  <View style={{ gap: 8, marginTop: 6 }}>
                    <Option selected={pointsMode === 'none'} title={t('book.noPoints')} onPress={() => setPointsMode('none')} />
                    <Option selected={pointsMode === 'max'} disabled={maxPts <= 0} title={t('book.pointsMax', { n: formatNumber(maxPts) })} hint={maxPts > 0 ? `−${money(maxPts * cfg.pointValue)}` : undefined} onPress={() => setPointsMode('max')} />
                    <Option selected={pointsMode === 'night'} disabled={balance < nightCost} title={t('book.freeNight', { n: formatNumber(nightCost === Infinity ? 0 : nightCost) })} onPress={() => setPointsMode('night')} />
                  </View>
                </View>
              ) : (
                <Pressable style={styles.joinHint} onPress={() => router.push('/auth/login')}>
                  <Sparkles size={16} color={colors.ink} />
                  <Text variant="small" style={{ flex: 1 }}>
                    {t('book.joinToEarn', { n: estimatePoints(price.total, 'silver') })}
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {step === 2 && (
            <View style={{ gap: 14, marginTop: 20 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Field label={t('book.firstName')} value={guest.firstName} onChangeText={(firstName) => setGuest({ ...guest, firstName })} error={errors.firstName} autoComplete="given-name" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label={t('book.lastName')} value={guest.lastName} onChangeText={(lastName) => setGuest({ ...guest, lastName })} error={errors.lastName} autoComplete="family-name" />
                </View>
              </View>
              <Field label={t('book.phone')} value={guest.phone} onChangeText={(phone) => setGuest({ ...guest, phone })} keyboardType="phone-pad" error={errors.phone} autoComplete="tel" />
              <Field label={t('book.email')} value={guest.email} onChangeText={(email) => setGuest({ ...guest, email })} keyboardType="email-address" autoCapitalize="none" error={errors.email} autoComplete="email" />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Field label={t('book.citizenship')} value={guest.citizenship} onChangeText={(citizenship) => setGuest({ ...guest, citizenship })} error={errors.citizenship} autoCapitalize="characters" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label={t('book.arrival')} value={guest.arrivalTime} onChangeText={(arrivalTime) => setGuest({ ...guest, arrivalTime })} placeholder="14:00" />
                </View>
              </View>
              <Field label={t('book.requests')} value={guest.specialRequests} onChangeText={(specialRequests) => setGuest({ ...guest, specialRequests })} placeholder={t('book.requestsPh')} multiline style={{ borderRadius: 18 }} />
            </View>
          )}

          {step === 3 && (
            <View style={{ gap: 12, marginTop: 20 }}>
              <Text variant="title">{t('book.paymentMode')}</Text>
              {rate.paymentModes.map((m) => (
                <Option
                  key={m}
                  selected={paymentMode === m}
                  title={m === 'partial' ? t('pay.partial', { p: Math.round(rate.depositPercent * 100) }) : t(`pay.${m}`)}
                  hint={t(`pay.${m}Hint`)}
                  onPress={() => setPaymentMode(m)}
                />
              ))}
              {paymentMode !== 'at_hotel' && (
                <>
                  <Text variant="title" style={{ marginTop: 10 }}>
                    {t('book.method')}
                  </Text>
                  <View style={styles.providers}>
                    {PROVIDERS.map((p) => (
                      <Pressable key={p} onPress={() => setProvider(p)} style={[styles.provider, provider === p && styles.providerOn]} accessibilityRole="radio" accessibilityState={{ selected: provider === p }}>
                        <View style={[styles.providerLogo, { backgroundColor: PROVIDER_COLORS[p] }]}>
                          <Text variant="caption" color={colors.white} weight="bold">
                            {t(`provider.${p}`).slice(0, 1)}
                          </Text>
                        </View>
                        <Text variant="label" numberOfLines={1}>
                          {t(`provider.${p}`)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <Lock size={14} color={colors.muted} />
                    <Text variant="caption" muted style={{ flex: 1 }}>
                      {t('book.secure')}
                    </Text>
                  </View>
                </>
              )}
            </View>
          )}

          <View style={styles.summary}>
            <Text variant="title" style={{ marginBottom: 6 }}>
              {t('book.summary')}
            </Text>
            <PriceSummary price={price} rooms={query.rooms} />
            {token && earn > 0 && (
              <View style={{ marginTop: 8 }}>
                <Divider />
                <Text variant="caption" color={colors.success} style={{ marginTop: 8 }}>
                  {t('book.earn', { n: earn })}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={{ flex: 1 }}>
          <Text variant="h3">{money(step === 3 ? price.dueNow || price.total : price.total)}</Text>
          <Text variant="caption" muted>
            {step === 3 && price.dueAtHotel > 0 ? `${t('book.dueAtHotel')}: ${money(price.dueAtHotel)}` : `${query.adults + query.children} ${t('common.guests')} · ${nightsCount} ${t('common.nights')}`}
          </Text>
        </View>
        {step < 3 ? (
          <Button title={t('book.next')} size="md" style={{ height: 52, paddingHorizontal: 30 }} onPress={next} testID="booking-next" />
        ) : (
          <Button
            title={paymentMode === 'at_hotel' ? t('book.confirm') : t('book.pay', { amount: money(price.dueNow, true) })}
            size="md"
            style={{ height: 52, paddingHorizontal: 24 }}
            onPress={pay}
            loading={paying}
            disabled={expired}
            testID="booking-pay"
          />
        )}
      </View>

      <Modal visible={paying} transparent animationType="fade">
        <View style={styles.payOverlay}>
          <View style={styles.payCard}>
            <ActivityIndicator color={colors.ink} />
            <Text variant="title" center>
              {paymentMode === 'at_hotel' ? t('book.processing') : t('book.redirect', { provider: t(`provider.${provider}`) })}
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Option({ selected, title, hint, onPress, disabled }: { selected: boolean; title: string; hint?: string; onPress(): void; disabled?: boolean }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.option, selected && styles.optionOn, disabled && { opacity: 0.4 }]} accessibilityRole="radio" accessibilityState={{ selected, disabled }}>
      <View style={[styles.radio, selected && styles.radioOn]}>{selected && <View style={styles.radioDot} />}</View>
      <Text variant="body" style={{ flex: 1 }}>
        {title}
      </Text>
      {hint && (
        <Text variant="caption" muted>
          {hint}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8 },
  progress: { flexDirection: 'row', gap: 4, paddingHorizontal: 20 },
  progressSeg: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.border },
  hold: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 20, marginTop: 10, paddingHorizontal: 12, height: 30, borderRadius: radius.pill, backgroundColor: colors.surface, alignSelf: 'flex-start' },
  stay: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  stayImg: { width: 76, height: 76, borderRadius: radius.sm, backgroundColor: colors.surface },
  policy: { gap: 4, padding: 14, borderRadius: radius.lg, backgroundColor: colors.surface },
  perks: { gap: 4, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.gold },
  promoApplied: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: radius.pill, backgroundColor: colors.successBg },
  points: { gap: 4, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  joinHint: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: radius.lg, backgroundColor: colors.surface },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 54, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  optionOn: { borderColor: colors.ink, borderWidth: 1.5 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.ink },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.ink },
  providers: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  provider: { width: '48.5%', flexDirection: 'row', alignItems: 'center', gap: 8, height: 50, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  providerOn: { borderColor: colors.ink, borderWidth: 1.5 },
  providerLogo: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  summary: { marginTop: 24, padding: 16, borderRadius: radius.lg, backgroundColor: colors.surface },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  successIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  numberBox: { alignItems: 'center', gap: 4, padding: 20, borderRadius: radius.lg, backgroundColor: colors.surface, alignSelf: 'stretch', marginTop: 12 },
  payOverlay: { flex: 1, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center' },
  payCard: { backgroundColor: colors.bg, borderRadius: radius.xl, padding: 28, gap: 14, alignItems: 'center', minWidth: 240 },
});
