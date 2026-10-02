import { addMonths, diffDays } from '@/utils/date';
import type { Booking, LoyaltyConfig, PointsTransaction, TierId } from './types';

/** Initial values from TZ 5.3 — all of them are editable from the admin panel. */
export const DEFAULT_LOYALTY: LoyaltyConfig = {
  earnPoints: 5,
  earnPerAmount: 100_000,
  pointValue: 1_000,
  maxRedeemShare: 0.5,
  expiryMonths: 24,
  tierWindowMonths: 12,
  memberDiscount: 0.05,
  tiers: [
    { id: 'silver', minNights: 0, bonus: 0, perks: ['perk.memberPrice'] },
    { id: 'gold', minNights: 5, bonus: 0.25, perks: ['perk.memberPrice', 'perk.lateCheckout', 'perk.freeBreakfast'] },
    {
      id: 'platinum',
      minNights: 15,
      bonus: 0.5,
      perks: ['perk.memberPrice', 'perk.upgrade', 'perk.guaranteedLateCheckout', 'perk.vip'],
    },
  ],
};

/** Nights completed (checked out) within the rolling tier window. */
export function qualifyingNights(bookings: Booking[], now: Date, cfg: LoyaltyConfig = DEFAULT_LOYALTY): number {
  const windowStart = addMonths(now, -cfg.tierWindowMonths).getTime();
  return bookings
    .filter((b) => b.status === 'checked_out' && new Date(b.checkOut).getTime() >= windowStart)
    .reduce((sum, b) => sum + diffDays(b.checkIn, b.checkOut) * b.rooms, 0);
}

export function tierForNights(nights: number, cfg: LoyaltyConfig = DEFAULT_LOYALTY) {
  const sorted = [...cfg.tiers].sort((a, b) => b.minNights - a.minNights);
  return sorted.find((t) => nights >= t.minNights) ?? cfg.tiers[0];
}

export function nextTier(current: TierId, cfg: LoyaltyConfig = DEFAULT_LOYALTY) {
  const sorted = [...cfg.tiers].sort((a, b) => a.minNights - b.minNights);
  const idx = sorted.findIndex((t) => t.id === current);
  return sorted[idx + 1];
}

export interface TierStatus {
  tier: LoyaltyConfig['tiers'][number];
  nights: number;
  next?: LoyaltyConfig['tiers'][number];
  nightsToNext: number;
  progress: number; // 0..1 towards next tier
}

export function tierStatus(bookings: Booking[], now: Date, cfg: LoyaltyConfig = DEFAULT_LOYALTY): TierStatus {
  const nights = qualifyingNights(bookings, now, cfg);
  const tier = tierForNights(nights, cfg);
  const next = nextTier(tier.id, cfg);
  if (!next) return { tier, nights, nightsToNext: 0, progress: 1 };
  const span = next.minNights - tier.minNights;
  return {
    tier,
    nights,
    next,
    nightsToNext: Math.max(0, next.minNights - nights),
    progress: Math.min(1, (nights - tier.minNights) / span),
  };
}

/**
 * Points earned for a completed stay: base points for the amount actually paid,
 * plus tier bonus. Only after check-out; cancelled / no-show bookings earn nothing.
 */
export function pointsForStay(booking: Booking, tier: TierId, cfg: LoyaltyConfig = DEFAULT_LOYALTY): number {
  if (booking.status !== 'checked_out') return 0;
  const base = Math.floor(booking.price.total / cfg.earnPerAmount) * cfg.earnPoints;
  const bonus = cfg.tiers.find((t) => t.id === tier)?.bonus ?? 0;
  return Math.floor(base * (1 + bonus));
}

/** Estimated points shown before booking. */
export function estimatePoints(total: number, tier: TierId, cfg: LoyaltyConfig = DEFAULT_LOYALTY): number {
  const base = Math.floor(total / cfg.earnPerAmount) * cfg.earnPoints;
  const bonus = cfg.tiers.find((t) => t.id === tier)?.bonus ?? 0;
  return Math.floor(base * (1 + bonus));
}

/** Points expire `expiryMonths` after the member's last activity (earn or redeem). */
export function pointsExpiryDate(lastActivityAt: string, cfg: LoyaltyConfig = DEFAULT_LOYALTY): Date {
  return addMonths(new Date(lastActivityAt), cfg.expiryMonths);
}

export function isBalanceExpired(lastActivityAt: string, now: Date, cfg: LoyaltyConfig = DEFAULT_LOYALTY): boolean {
  return now.getTime() > pointsExpiryDate(lastActivityAt, cfg).getTime();
}

export function balanceFromHistory(history: PointsTransaction[]): number {
  return history.reduce((s, tx) => s + tx.points, 0);
}

/** Perks granted on a booking according to the member's tier at booking time. */
export function perksForTier(tier: TierId, cfg: LoyaltyConfig = DEFAULT_LOYALTY): string[] {
  return cfg.tiers.find((t) => t.id === tier)?.perks ?? [];
}
