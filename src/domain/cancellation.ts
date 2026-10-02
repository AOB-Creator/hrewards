import { addDays, diffDays } from '@/utils/date';
import type { Booking, ISODate, RatePlan } from './types';

export interface CancellationQuote {
  allowed: boolean;
  penalty: number;
  refund: number;
  pointsReturned: number;
  free: boolean;
  /** Last date (inclusive) for free cancellation, if the policy has one. */
  freeUntil?: ISODate;
}

/**
 * Refund calculation for a cancellation (TZ 5.2): depends on the rate's policy and how
 * many days remain until arrival. Redeemed points are always returned to the member.
 */
export function cancellationQuote(booking: Booking, rate: RatePlan, todayISO: ISODate): CancellationQuote {
  if (!['new', 'confirmed'].includes(booking.status)) {
    return { allowed: false, penalty: 0, refund: 0, pointsReturned: 0, free: false };
  }
  const daysBefore = diffDays(todayISO, booking.checkIn);
  const policy = rate.cancellation;
  let penalty: number;
  let free = false;
  let freeUntil: ISODate | undefined;

  if (policy.kind === 'non_refundable') {
    penalty = booking.price.total;
  } else {
    const nightly = booking.price.nightly;
    const firstNights = nightly.slice(0, policy.penaltyNights).reduce((s, n) => s + n.price, 0) * booking.rooms;
    free = daysBefore >= policy.freeUntilDaysBefore;
    penalty = free ? 0 : Math.min(firstNights, booking.price.total);
    freeUntil = addDays(booking.checkIn, -policy.freeUntilDaysBefore);
  }

  const refund = Math.max(0, booking.paid - penalty);
  return {
    allowed: true,
    penalty,
    refund,
    pointsReturned: booking.price.pointsRedeemed,
    free,
    freeUntil,
  };
}

/** Changing dates is allowed while free cancellation is still possible. */
export function canModifyDates(booking: Booking, rate: RatePlan, todayISO: ISODate): boolean {
  const q = cancellationQuote(booking, rate, todayISO);
  return q.allowed && (q.free || rate.cancellation.kind === 'free');
}
