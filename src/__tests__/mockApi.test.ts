import { ApiError } from '@/data/api';
import { DEMO_PHONE, MockApi, type KeyValueStore } from '@/data/mockApi';
import { RATE_PLANS } from '@/data/seed';
import { addDays, toISODate } from '@/utils/date';

function memoryStore(): KeyValueStore {
  const m = new Map<string, string>();
  return { getItem: async (k) => m.get(k) ?? null, setItem: async (k, v) => void m.set(k, v) };
}

function setup() {
  let now = new Date('2026-10-02T10:00:00');
  const api = new MockApi(memoryStore(), () => now, 0);
  return { api, advance: (days: number) => (now = new Date(now.getTime() + days * 86_400_000)), today: () => toISODate(now) };
}

async function login(api: MockApi, phone = DEMO_PHONE) {
  const { debugCode } = await api.requestOtp(phone);
  return api.verifyOtp(phone, debugCode!);
}

const guest = { firstName: 'Ali', lastName: 'Valiyev', phone: '+998901112233', email: 'ali@example.uz', citizenship: 'UZ', specialRequests: '', arrivalTime: '15:00' };

describe('MockApi', () => {
  it('limits OTP attempts and enforces resend cooldown', async () => {
    const { api } = setup();
    await api.requestOtp('+998935554433');
    await expect(api.requestOtp('+998935554433')).rejects.toMatchObject({ code: 'otp_too_soon' });
    for (let i = 0; i < 5; i++) await expect(api.verifyOtp('+998935554433', '0000')).rejects.toBeInstanceOf(ApiError);
    await expect(api.verifyOtp('+998935554433', '0000')).rejects.toMatchObject({ code: 'otp_locked' });
  });

  it('demo member is Gold with points from past stays', async () => {
    const { api } = setup();
    const { token, isNew } = await login(api);
    expect(isNew).toBe(false);
    const l = await api.loyalty(token);
    expect(l.status.tier.id).toBe('gold');
    expect(l.balance).toBeGreaterThan(0);
    expect(l.history.every((h) => h.kind === 'earned')).toBe(true);
  });

  it('search returns only hotels with free rooms, filtered by type', async () => {
    const { api, today } = setup();
    const q = { location: '', checkIn: addDays(today(), 10), checkOut: addDays(today(), 12), adults: 2, children: 0, rooms: 1, types: [] };
    const all = await api.search(q);
    expect(all.length).toBeGreaterThan(3);
    const resorts = await api.search({ ...q, types: ['resort'] });
    expect(resorts.every((r) => r.hotel.type === 'resort')).toBe(true);
    const samarkand = await api.search({ ...q, location: 'Samarkand' });
    expect(samarkand.map((r) => r.hotel.id)).toEqual(['marmaris-samarkand']);
  });

  it('full booking flow: hold → book with points → overbooking blocked → cancel returns points', async () => {
    const { api, today } = setup();
    const { token } = await login(api);
    const before = (await api.loyalty(token)).balance;
    const checkIn = addDays(today(), 20);
    const checkOut = addDays(today(), 22);
    const rate = RATE_PLANS.find((r) => r.id === 'marmaris-bukhara-villa:villa:flex')!; // inventory 1
    const hold = await api.createHold(rate.roomTypeId, checkIn, checkOut, 1);
    // A second guest cannot take the same (only) villa while it is held.
    await expect(api.createHold(rate.roomTypeId, checkIn, checkOut, 1)).rejects.toMatchObject({ code: 'sold_out' });
    const b = await api.createBooking(
      { holdId: hold.id, hotelId: 'marmaris-bukhara-villa', ratePlanId: rate.id, checkIn, checkOut, rooms: 1, adults: 2, children: 0, guest, paymentMode: 'full', paymentProvider: 'click', pointsToRedeem: 100 },
      token,
    );
    expect(b.status).toBe('confirmed');
    expect(b.price.memberDiscount).toBeGreaterThan(0);
    expect(b.price.pointsRedeemed).toBe(100);
    expect(b.perks).toContain('perk.freeBreakfast');
    expect((await api.loyalty(token)).balance).toBe(before - 100);
    await expect(api.createHold(rate.roomTypeId, checkIn, checkOut, 1)).rejects.toMatchObject({ code: 'sold_out' });

    const cancelled = await api.cancelBooking(b.id);
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.refunded).toBe(b.paid);
    expect((await api.loyalty(token)).balance).toBe(before);
    await expect(api.createHold(rate.roomTypeId, checkIn, checkOut, 1)).resolves.toBeDefined();
  });

  it('expired hold cannot be booked', async () => {
    const { api, today, advance } = setup();
    const rate = RATE_PLANS[0];
    const hold = await api.createHold(rate.roomTypeId, addDays(today(), 5), addDays(today(), 7), 1);
    advance(16 / (24 * 60));
    await expect(
      api.createBooking({ holdId: hold.id, hotelId: 'marmaris-tashkent', ratePlanId: rate.id, checkIn: addDays(today(), 5), checkOut: addDays(today(), 7), rooms: 1, adults: 2, children: 0, guest, paymentMode: 'full', paymentProvider: 'payme' }),
    ).rejects.toMatchObject({ code: 'hold_expired' });
  });

  it('credits points only after check-out; guest bookings attach to a new account', async () => {
    const { api, today, advance } = setup();
    const rate = RATE_PLANS.find((r) => r.id === 'lavanda-marmaris-rakat:standard:flex')!;
    const checkIn = addDays(today(), 1);
    const checkOut = addDays(today(), 3);
    const hold = await api.createHold(rate.roomTypeId, checkIn, checkOut, 1);
    const b = await api.createBooking({ holdId: hold.id, hotelId: 'lavanda-marmaris-rakat', ratePlanId: rate.id, checkIn, checkOut, rooms: 1, adults: 1, children: 0, guest, paymentMode: 'at_hotel', paymentProvider: 'payme' });
    expect(b.userId).toBeUndefined();
    expect(b.price.memberDiscount).toBe(0);
    expect(b.price.dueNow).toBe(0);

    const { token, isNew } = await login(api, guest.phone);
    expect(isNew).toBe(true);
    expect((await api.listBookings(token)).map((x) => x.id)).toContain(b.id);

    advance(2);
    expect((await api.getBooking(b.id)).status).toBe('checked_in');
    expect((await api.loyalty(token)).balance).toBe(0);
    advance(1);
    const done = await api.getBooking(b.id);
    expect(done.status).toBe('checked_out');
    expect(done.pointsEarned).toBe(Math.floor(done.price.total / 100_000) * 5);
    expect((await api.loyalty(token)).balance).toBe(done.pointsEarned);
    const notifs = await api.notifications(token);
    expect(notifs.map((n) => n.kind)).toEqual(expect.arrayContaining(['points_credited', 'thank_you']));
    await expect(api.createReview(token, b.id, 5, 'Great stay')).resolves.toBeDefined();
  });

  it('rejects invalid promo and applies valid one', async () => {
    const { api } = setup();
    expect(await api.checkPromo('SUMMER25', 'marmaris-tashkent', 3)).toEqual({ ok: false, error: 'expired' });
    expect(await api.checkPromo('LAVANDA200', 'marmaris-tashkent', 3)).toEqual({ ok: false, error: 'wrong_hotel' });
    expect(await api.checkPromo('welcome10', 'marmaris-tashkent', 1)).toEqual({ ok: true });
  });
});
