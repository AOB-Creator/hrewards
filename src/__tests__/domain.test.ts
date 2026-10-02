import { availableRooms } from '@/domain/availability';
import { cancellationQuote } from '@/domain/cancellation';
import { DEFAULT_LOYALTY, isBalanceExpired, pointsForStay, tierStatus } from '@/domain/loyalty';
import { nightlyPrice, paymentSchedule, quote, validatePromo } from '@/domain/pricing';
import type { Booking, RatePlan, RoomType } from '@/domain/types';
import { isValidPhone, normalizePhone } from '@/domain/validation';

const rate: RatePlan = {
  id: 'r',
  roomTypeId: 'room',
  name: { en: 'Flex', ru: '', uz: '' },
  basePrice: 1_000_000,
  weekdayMultipliers: { 6: 1.2 },
  seasonal: [{ from: '2026-12-28', to: '2027-01-05', price: 2_000_000 }],
  minNights: 1,
  breakfastIncluded: true,
  cancellation: { kind: 'free', freeUntilDaysBefore: 2, penaltyNights: 1 },
  paymentModes: ['full', 'partial', 'at_hotel'],
  depositPercent: 0.3,
};
const base = { rate, rooms: 1, memberDiscount: 0.05, pointValue: 1000, maxRedeemShare: 0.5, paymentMode: 'full' as const };

describe('pricing', () => {
  it('applies weekday multipliers and seasonal prices', () => {
    expect(nightlyPrice(rate, '2026-10-07')).toBe(1_000_000); // Wednesday
    expect(nightlyPrice(rate, '2026-10-10')).toBe(1_200_000); // Saturday
    expect(nightlyPrice(rate, '2026-12-30')).toBe(2_000_000); // season (Wednesday)
  });

  it('gives members −5%', () => {
    const p = quote({ ...base, checkIn: '2026-10-05', checkOut: '2026-10-08', isMember: true });
    expect(p.roomsSubtotal).toBe(3_000_000);
    expect(p.memberDiscount).toBe(150_000);
    expect(p.total).toBe(2_850_000);
  });

  it('caps points redemption at 50% of the booking', () => {
    const p = quote({ ...base, checkIn: '2026-10-05', checkOut: '2026-10-07', isMember: true, pointsToRedeem: 100_000 });
    // 2 000 000 − 5% = 1 900 000 → max 950 000 = 950 points
    expect(p.pointsRedeemed).toBe(950);
    expect(p.total).toBe(950_000);
  });

  it('free night is paid with points', () => {
    const p = quote({ ...base, checkIn: '2026-10-05', checkOut: '2026-10-08', isMember: true, useFreeNight: true });
    expect(p.freeNightDiscount).toBe(1_000_000);
    expect(p.pointsRedeemed).toBe(1000);
  });

  it('guests cannot redeem points', () => {
    const p = quote({ ...base, checkIn: '2026-10-05', checkOut: '2026-10-07', isMember: false, pointsToRedeem: 500 });
    expect(p.pointsRedeemed).toBe(0);
    expect(p.memberDiscount).toBe(0);
  });

  it('computes deposit schedule', () => {
    expect(paymentSchedule(1_000_000, 'partial', 0.3)).toEqual({ dueNow: 300_000, dueAtHotel: 700_000 });
    expect(paymentSchedule(1_000_000, 'at_hotel', 0.3)).toEqual({ dueNow: 0, dueAtHotel: 1_000_000 });
  });

  it('validates promo codes', () => {
    const promo = { code: 'X', kind: 'percent' as const, value: 10, validFrom: '2026-01-01', validTo: '2026-12-31', minNights: 3, hotelIds: ['h1'], used: 0 };
    expect(validatePromo(undefined, { hotelId: 'h1', nights: 3, today: '2026-10-01' })).toBe('not_found');
    expect(validatePromo(promo, { hotelId: 'h1', nights: 2, today: '2026-10-01' })).toBe('min_nights');
    expect(validatePromo(promo, { hotelId: 'h2', nights: 3, today: '2026-10-01' })).toBe('wrong_hotel');
    expect(validatePromo(promo, { hotelId: 'h1', nights: 3, today: '2027-01-01' })).toBe('expired');
    expect(validatePromo(promo, { hotelId: 'h1', nights: 3, today: '2026-10-01' })).toBeNull();
  });
});

function booking(over: Partial<Booking>): Booking {
  const price = quote({ ...base, checkIn: over.checkIn ?? '2026-10-05', checkOut: over.checkOut ?? '2026-10-08', isMember: true });
  return {
    id: Math.random().toString(),
    number: 'HR',
    hotelId: 'h',
    roomTypeId: 'room',
    ratePlanId: 'r',
    checkIn: '2026-10-05',
    checkOut: '2026-10-08',
    adults: 2,
    children: 0,
    rooms: 1,
    guest: { firstName: 'A', lastName: 'B', phone: '+998901234567', email: 'a@b.uz', citizenship: 'UZ', specialRequests: '', arrivalTime: '' },
    status: 'confirmed',
    paymentMode: 'full',
    paymentProvider: 'payme',
    price,
    paid: price.total,
    refunded: 0,
    pointsEarned: 0,
    perks: [],
    createdAt: '2026-09-01T00:00:00Z',
    ...over,
  };
}

describe('loyalty', () => {
  const now = new Date('2026-10-20T12:00:00');
  it('derives tiers from nights in the last 12 months', () => {
    expect(tierStatus([], now).tier.id).toBe('silver');
    const gold = [booking({ status: 'checked_out', checkIn: '2026-09-01', checkOut: '2026-09-06' })];
    const s = tierStatus(gold, now);
    expect(s.tier.id).toBe('gold');
    expect(s.nightsToNext).toBe(10);
    const old = [booking({ status: 'checked_out', checkIn: '2025-01-01', checkOut: '2025-01-20' })];
    expect(tierStatus(old, now).tier.id).toBe('silver');
    const cancelled = [booking({ status: 'cancelled', checkIn: '2026-09-01', checkOut: '2026-09-20' })];
    expect(tierStatus(cancelled, now).tier.id).toBe('silver');
  });

  it('earns 5 points per 100 000 so‘m plus tier bonus, only after check-out', () => {
    const b = booking({ status: 'checked_out' }); // total 2 850 000 → 28 × 5 = 140
    expect(pointsForStay(b, 'silver')).toBe(140);
    expect(pointsForStay(b, 'gold')).toBe(175);
    expect(pointsForStay(b, 'platinum')).toBe(210);
    expect(pointsForStay({ ...b, status: 'confirmed' }, 'gold')).toBe(0);
    expect(pointsForStay({ ...b, status: 'cancelled' }, 'gold')).toBe(0);
  });

  it('expires balance 24 months after last activity', () => {
    expect(isBalanceExpired('2024-10-01T00:00:00Z', now, DEFAULT_LOYALTY)).toBe(true);
    expect(isBalanceExpired('2025-01-01T00:00:00Z', now, DEFAULT_LOYALTY)).toBe(false);
  });
});

describe('cancellation', () => {
  it('is free before the deadline', () => {
    const q = cancellationQuote(booking({}), rate, '2026-10-02');
    expect(q.free).toBe(true);
    expect(q.refund).toBe(2_850_000);
    expect(q.freeUntil).toBe('2026-10-03');
  });
  it('charges the first night after the deadline', () => {
    const q = cancellationQuote(booking({}), rate, '2026-10-04');
    expect(q.free).toBe(false);
    expect(q.penalty).toBe(1_000_000);
    expect(q.refund).toBe(1_850_000);
  });
  it('non-refundable keeps everything', () => {
    const q = cancellationQuote(booking({}), { ...rate, cancellation: { kind: 'non_refundable' } }, '2026-09-01');
    expect(q.refund).toBe(0);
  });
  it('cannot cancel after check-in', () => {
    expect(cancellationQuote(booking({ status: 'checked_in' }), rate, '2026-10-06').allowed).toBe(false);
  });
});

describe('availability', () => {
  const room = { id: 'room', inventory: 2 } as RoomType;
  it('counts bookings and active holds', () => {
    const bookings = [booking({ checkIn: '2026-10-05', checkOut: '2026-10-07' })];
    const holds = [{ id: 'h1', roomTypeId: 'room', checkIn: '2026-10-06', checkOut: '2026-10-08', rooms: 1, expiresAt: 2_000 }];
    expect(availableRooms(room, '2026-10-05', '2026-10-08', bookings, holds, 1_000)).toBe(0);
    expect(availableRooms(room, '2026-10-05', '2026-10-08', bookings, holds, 3_000)).toBe(1); // hold expired
    expect(availableRooms(room, '2026-10-05', '2026-10-08', bookings, holds, 1_000, { excludeHoldId: 'h1' })).toBe(1);
    expect(availableRooms(room, '2026-10-07', '2026-10-08', bookings, [], 0)).toBe(2);
  });
});

describe('validation', () => {
  it('normalizes Uzbek and international phones', () => {
    expect(normalizePhone('90 123 45 67')).toBe('+998901234567');
    expect(isValidPhone('+998 90 123 45 67')).toBe(true);
    expect(isValidPhone('+998 90 123')).toBe(false);
    expect(isValidPhone('+44 7700 900123')).toBe(true);
  });
});
