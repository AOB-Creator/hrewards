import { eachNight, isWithin, parseISODate } from '@/utils/date';
import type { ISODate, PaymentMode, PriceBreakdown, PromoCode, RatePlan } from './types';

/** Price of one night under a rate plan: seasonal override → weekday multiplier (TZ 5.5). */
export function nightlyPrice(rate: RatePlan, date: ISODate): number {
  const season = rate.seasonal?.find((s) => isWithin(date, s.from, s.to));
  const base = season ? season.price : rate.basePrice;
  const weekday = parseISODate(date).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const mult = rate.weekdayMultipliers?.[weekday] ?? 1;
  return roundUZS(base * mult);
}

/** UZS amounts are rounded to 1 000 so'm. */
export function roundUZS(n: number): number {
  return Math.round(n / 1000) * 1000;
}

export type PromoError = 'not_found' | 'expired' | 'min_nights' | 'wrong_hotel' | 'exhausted';

export function validatePromo(
  promo: PromoCode | undefined,
  ctx: { hotelId: string; nights: number; today: ISODate },
): PromoError | null {
  if (!promo) return 'not_found';
  if (!isWithin(ctx.today, promo.validFrom, promo.validTo)) return 'expired';
  if (promo.maxUses != null && promo.used >= promo.maxUses) return 'exhausted';
  if (promo.minNights && ctx.nights < promo.minNights) return 'min_nights';
  if (promo.hotelIds?.length && !promo.hotelIds.includes(ctx.hotelId)) return 'wrong_hotel';
  return null;
}

export interface QuoteInput {
  rate: RatePlan;
  checkIn: ISODate;
  checkOut: ISODate;
  rooms: number;
  isMember: boolean;
  memberDiscount: number;
  promo?: PromoCode;
  /** Points the member wants to spend as a discount. */
  pointsToRedeem?: number;
  pointValue: number;
  maxRedeemShare: number;
  /** Gold perk: one night's breakfast is free (applied as a value-add, not a discount). */
  paymentMode: PaymentMode;
  /** Spend points to make the cheapest night free. */
  useFreeNight?: boolean;
}

/**
 * Computes the full price of a stay. Order of application:
 * nightly prices → member price (−5%) → promo code → free night / points (≤ 50% of remaining).
 */
export function quote(input: QuoteInput): PriceBreakdown {
  const nights = eachNight(input.checkIn, input.checkOut);
  const nightly = nights.map((date) => ({ date, price: nightlyPrice(input.rate, date) }));
  const roomsSubtotal = nightly.reduce((s, n) => s + n.price, 0) * input.rooms;

  const memberDiscount = input.isMember ? roundUZS(roomsSubtotal * input.memberDiscount) : 0;
  let running = roomsSubtotal - memberDiscount;

  let promoDiscount = 0;
  if (input.promo) {
    promoDiscount =
      input.promo.kind === 'percent' ? roundUZS((running * input.promo.value) / 100) : Math.min(input.promo.value, running);
    running -= promoDiscount;
  }

  let freeNightDiscount = 0;
  let pointsRedeemed = 0;
  let pointsDiscount = 0;
  if (input.isMember && input.useFreeNight && nightly.length > 0) {
    const cheapest = Math.min(...nightly.map((n) => n.price));
    freeNightDiscount = Math.min(cheapest, running);
    pointsRedeemed = freeNightPointsCost(cheapest, input.pointValue);
    running -= freeNightDiscount;
  } else if (input.isMember && input.pointsToRedeem && input.pointsToRedeem > 0) {
    const maxPoints = maxRedeemablePoints(running, input.pointValue, input.maxRedeemShare);
    pointsRedeemed = Math.min(Math.floor(input.pointsToRedeem), maxPoints);
    pointsDiscount = pointsRedeemed * input.pointValue;
    running -= pointsDiscount;
  }

  const total = Math.max(0, running);
  const { dueNow, dueAtHotel } = paymentSchedule(total, input.paymentMode, input.rate.depositPercent);

  return {
    nights: nightly.length,
    nightly,
    roomsSubtotal,
    memberDiscount,
    promoDiscount,
    pointsDiscount,
    pointsRedeemed,
    freeNightDiscount,
    total,
    dueNow,
    dueAtHotel,
  };
}

export function maxRedeemablePoints(amount: number, pointValue: number, maxShare: number): number {
  return Math.floor((amount * maxShare) / pointValue);
}

export function freeNightPointsCost(nightPrice: number, pointValue: number): number {
  return Math.ceil(nightPrice / pointValue);
}

export function paymentSchedule(total: number, mode: PaymentMode, depositPercent: number) {
  switch (mode) {
    case 'full':
      return { dueNow: total, dueAtHotel: 0 };
    case 'partial': {
      const dueNow = roundUZS(total * depositPercent);
      return { dueNow, dueAtHotel: total - dueNow };
    }
    case 'at_hotel':
      return { dueNow: 0, dueAtHotel: total };
  }
}
