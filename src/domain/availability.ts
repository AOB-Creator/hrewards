import { eachNight } from '@/utils/date';
import type { Booking, ISODate, RoomHold, RoomType } from './types';

/** TZ 5.2: a room is held for 15 minutes while the guest completes the booking. */
export const HOLD_MINUTES = 15;

const occupies = (status: Booking['status']) => status !== 'cancelled' && status !== 'no_show';

/**
 * Rooms of a type free for every night of the stay, accounting for confirmed bookings,
 * active holds (excluding the caller's own hold) and nights closed for sale.
 */
export function availableRooms(
  room: RoomType,
  checkIn: ISODate,
  checkOut: ISODate,
  bookings: Booking[],
  holds: RoomHold[],
  now: number,
  opts: { excludeHoldId?: string; closedDates?: ISODate[] } = {},
): number {
  const nights = eachNight(checkIn, checkOut);
  if (nights.some((n) => opts.closedDates?.includes(n))) return 0;
  let min = room.inventory;
  for (const night of nights) {
    const booked = bookings
      .filter((b) => b.roomTypeId === room.id && occupies(b.status) && b.checkIn <= night && night < b.checkOut)
      .reduce((s, b) => s + b.rooms, 0);
    const held = holds
      .filter(
        (h) =>
          h.roomTypeId === room.id &&
          h.id !== opts.excludeHoldId &&
          h.expiresAt > now &&
          h.checkIn <= night &&
          night < h.checkOut,
      )
      .reduce((s, h) => s + h.rooms, 0);
    min = Math.min(min, room.inventory - booked - held);
  }
  return Math.max(0, min);
}

export function fitsOccupancy(room: RoomType, adults: number, children: number, rooms: number): boolean {
  return adults <= room.maxAdults * rooms && children <= room.maxChildren * rooms && adults >= rooms;
}
