import { HOLD_MINUTES, availableRooms, fitsOccupancy } from '@/domain/availability';
import { cancellationQuote, canModifyDates } from '@/domain/cancellation';
import {
  DEFAULT_LOYALTY,
  balanceFromHistory,
  isBalanceExpired,
  perksForTier,
  pointsExpiryDate,
  pointsForStay,
  tierStatus,
} from '@/domain/loyalty';
import { nightlyPrice, quote, validatePromo } from '@/domain/pricing';
import type {
  AppNotification,
  Booking,
  LoyaltyConfig,
  PointsTransaction,
  PromoCode,
  Review,
  RoomHold,
  RoomOffer,
  SearchQuery,
  SearchResult,
  User,
} from '@/domain/types';
import { isValidPhone, normalizePhone } from '@/domain/validation';
import { addDays, diffDays, today as todayISO } from '@/utils/date';
import { ApiError, type CreateBookingRequest, type HotelApi, type QuoteRequest } from './api';
import { HOTELS, PROMO_CODES, RATE_PLANS, REVIEWS, ROOM_TYPES } from './seed';

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

interface OtpState {
  hash: string;
  expiresAt: number;
  attempts: number;
  sentAt: number;
}

interface Db {
  version: number;
  users: User[];
  sessions: Record<string, string>; // token -> userId
  bookings: Booking[];
  holds: RoomHold[];
  points: Record<string, PointsTransaction[]>; // userId -> history
  notifications: Record<string, AppNotification[]>;
  reviews: Review[];
  promos: PromoCode[];
  otp: Record<string, OtpState>;
  closedDates: Record<string, string[]>; // roomTypeId -> dates closed for sale
}

const DB_KEY = 'hrewards:db';
const DB_VERSION = 1;
const OTP_TTL_MS = 5 * 60_000;
const OTP_RESEND_S = 60;
const OTP_MAX_ATTEMPTS = 5;
export const DEMO_PHONE = '+998901234567';

const id = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;

/** Non-cryptographic hash; the real backend uses bcrypt/argon2 for OTPs (TZ 7). */
function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}

function bookingNumber(now: Date): string {
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `HR-${yy}${mm}-${Math.floor(1000 + Math.random() * 9000)}`;
}

/**
 * In-device implementation of the API with the same business rules the backend enforces.
 * Used for demos and offline development; switch to `HttpApi` by setting EXPO_PUBLIC_API_URL.
 */
export class MockApi implements HotelApi {
  private db?: Db;
  private loading?: Promise<Db>;
  private cfg: LoyaltyConfig = DEFAULT_LOYALTY;

  constructor(
    private store: KeyValueStore,
    private clock: () => Date = () => new Date(),
    private latencyMs = 250,
  ) {}

  // ---------- infrastructure ----------

  private async delay() {
    if (this.latencyMs > 0) await new Promise((r) => setTimeout(r, this.latencyMs));
  }

  private async load(): Promise<Db> {
    if (this.db) return this.db;
    if (!this.loading) {
      this.loading = (async () => {
        const raw = await this.store.getItem(DB_KEY);
        let db: Db | null = raw ? JSON.parse(raw) : null;
        if (!db || db.version !== DB_VERSION) db = this.seed();
        this.db = db;
        this.runLifecycle(db);
        await this.save();
        return db;
      })();
    }
    return this.loading;
  }

  private async save() {
    if (this.db) await this.store.setItem(DB_KEY, JSON.stringify(this.db));
  }

  private async tx<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
    await this.delay();
    const db = await this.load();
    this.runLifecycle(db);
    const out = await fn(db);
    await this.save();
    return out;
  }

  private seed(): Db {
    const db: Db = {
      version: DB_VERSION,
      users: [],
      sessions: {},
      bookings: [],
      holds: [],
      points: {},
      notifications: {},
      reviews: [...REVIEWS],
      promos: PROMO_CODES.map((p) => ({ ...p })),
      otp: {},
      closedDates: {},
    };
    // Demo member with two completed stays (6 nights → Gold) so every screen has data.
    const now = this.clock();
    const user: User = {
      id: 'u_demo',
      phone: DEMO_PHONE,
      firstName: 'Runel',
      lastName: 'Karimov',
      email: 'runel@example.com',
      citizenship: 'UZ',
      createdAt: new Date(now.getTime() - 200 * 86_400_000).toISOString(),
      points: 0,
      lastActivityAt: now.toISOString(),
      notificationPrefs: { sms: true, email: true, push: true, marketing: false },
    };
    db.users.push(user);
    db.points[user.id] = [];
    db.notifications[user.id] = [];
    const t0 = todayISO(now);
    const past = [
      { hotelId: 'marmaris-samarkand', room: 'marmaris-samarkand:classic', checkIn: addDays(t0, -120), nights: 3 },
      { hotelId: 'marmaris-tashkent', room: 'marmaris-tashkent:deluxe', checkIn: addDays(t0, -40), nights: 3 },
    ];
    for (const p of past) {
      const rate = RATE_PLANS.find((r) => r.roomTypeId === p.room && r.id.endsWith(':flex'))!;
      const checkOut = addDays(p.checkIn, p.nights);
      const price = quote({
        rate,
        checkIn: p.checkIn,
        checkOut,
        rooms: 1,
        isMember: true,
        memberDiscount: this.cfg.memberDiscount,
        pointValue: this.cfg.pointValue,
        maxRedeemShare: this.cfg.maxRedeemShare,
        paymentMode: 'full',
      });
      db.bookings.push({
        id: id('bk'),
        number: bookingNumber(new Date(p.checkIn)),
        userId: user.id,
        hotelId: p.hotelId,
        roomTypeId: p.room,
        ratePlanId: rate.id,
        checkIn: p.checkIn,
        checkOut,
        adults: 2,
        children: 0,
        rooms: 1,
        guest: { firstName: user.firstName, lastName: user.lastName, phone: user.phone, email: user.email, citizenship: 'UZ', specialRequests: '', arrivalTime: '15:00' },
        status: 'confirmed',
        paymentMode: 'full',
        paymentProvider: 'payme',
        price,
        paid: price.total,
        refunded: 0,
        pointsEarned: 0,
        perks: perksForTier('silver'),
        createdAt: new Date(new Date(p.checkIn).getTime() - 14 * 86_400_000).toISOString(),
      });
    }
    return db;
  }

  /**
   * Server-side lifecycle normally driven by reception (check-in/out) and cron jobs:
   * advances statuses by date, credits points after check-out, sends reminders, expires points.
   */
  private runLifecycle(db: Db) {
    const now = this.clock();
    const t = todayISO(now);
    db.holds = db.holds.filter((h) => h.expiresAt > now.getTime());

    const ordered = [...db.bookings].sort((a, b) => a.checkOut.localeCompare(b.checkOut));
    for (const b of ordered) {
      if (b.status === 'confirmed' || b.status === 'new') {
        if (b.checkOut <= t) {
          b.status = 'checked_out';
          b.paid = b.price.total; // balance settled at the front desk
        } else if (b.checkIn <= t) {
          b.status = 'checked_in';
        } else if (addDays(t, 1) === b.checkIn && b.userId) {
          this.notifyOnce(db, b.userId, `reminder:${b.id}`, {
            kind: 'reminder',
            title: 'notif.reminder.title',
            body: 'notif.reminder.body',
            bookingId: b.id,
          });
        }
      } else if (b.status === 'checked_in' && b.checkOut <= t) {
        b.status = 'checked_out';
        b.paid = b.price.total;
      }

      if (b.status === 'checked_out' && b.userId && b.pointsEarned === 0) {
        const userBookings = db.bookings.filter((x) => x.userId === b.userId && x.id !== b.id);
        const status = tierStatus(userBookings, new Date(b.checkOut), this.cfg);
        const pts = pointsForStay(b, status.tier.id, this.cfg);
        b.pointsEarned = pts;
        if (pts > 0) {
          this.addPoints(db, b.userId, { kind: 'earned', points: pts, bookingId: b.id, createdAt: new Date(b.checkOut + 'T12:00:00').toISOString() });
          this.notifyOnce(db, b.userId, `points:${b.id}`, { kind: 'points_credited', title: 'notif.points.title', body: `notif.points.body|${pts}`, bookingId: b.id });
        }
        this.notifyOnce(db, b.userId, `thanks:${b.id}`, { kind: 'thank_you', title: 'notif.thanks.title', body: 'notif.thanks.body', bookingId: b.id });
      }
    }

    for (const user of db.users) {
      const balance = balanceFromHistory(db.points[user.id] ?? []);
      if (balance > 0 && isBalanceExpired(user.lastActivityAt, now, this.cfg)) {
        this.addPoints(db, user.id, { kind: 'expired', points: -balance, createdAt: now.toISOString() }, false);
      }
      user.points = balanceFromHistory(db.points[user.id] ?? []);
    }
  }

  private addPoints(db: Db, userId: string, tx: Omit<PointsTransaction, 'id'>, touchActivity = true) {
    (db.points[userId] ??= []).push({ id: id('pt'), ...tx });
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      user.points = balanceFromHistory(db.points[userId]);
      if (touchActivity && tx.createdAt > user.lastActivityAt) user.lastActivityAt = tx.createdAt;
    }
  }

  private notifyOnce(db: Db, userId: string, key: string, n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) {
    const list = (db.notifications[userId] ??= []);
    if (list.some((x) => x.id === key)) return;
    list.unshift({ ...n, id: key, createdAt: this.clock().toISOString(), read: false });
  }

  private userFor(db: Db, token?: string): User | undefined {
    if (!token) return undefined;
    const uid = db.sessions[token];
    return db.users.find((u) => u.id === uid);
  }

  private requireUser(db: Db, token: string): User {
    const u = this.userFor(db, token);
    if (!u) throw new ApiError('unauthorized');
    return u;
  }

  // ---------- auth ----------

  async requestOtp(phoneInput: string) {
    return this.tx((db) => {
      if (!isValidPhone(phoneInput)) throw new ApiError('invalid_phone');
      const phone = normalizePhone(phoneInput);
      const now = this.clock().getTime();
      const prev = db.otp[phone];
      if (prev && now - prev.sentAt < OTP_RESEND_S * 1000) {
        throw new ApiError('otp_too_soon', undefined, { resendIn: Math.ceil((OTP_RESEND_S * 1000 - (now - prev.sentAt)) / 1000) });
      }
      const code = String(Math.floor(1000 + Math.random() * 9000));
      db.otp[phone] = { hash: hash(phone + code), expiresAt: now + OTP_TTL_MS, attempts: 0, sentAt: now };
      // Production: SMS via Eskiz.uz / Playmobile. Demo: the code is returned to show on screen.
      return { resendIn: OTP_RESEND_S, expiresIn: OTP_TTL_MS / 1000, debugCode: code };
    });
  }

  async verifyOtp(phoneInput: string, code: string) {
    return this.tx((db) => {
      const phone = normalizePhone(phoneInput);
      const state = db.otp[phone];
      const now = this.clock().getTime();
      if (!state || state.expiresAt < now) throw new ApiError('otp_expired');
      if (state.attempts >= OTP_MAX_ATTEMPTS) throw new ApiError('otp_locked');
      if (state.hash !== hash(phone + code.trim())) {
        state.attempts += 1;
        throw new ApiError('otp_invalid', undefined, { attemptsLeft: OTP_MAX_ATTEMPTS - state.attempts });
      }
      delete db.otp[phone];
      // One account per phone number (anti-abuse, TZ 5.3).
      let user = db.users.find((u) => u.phone === phone);
      const isNew = !user;
      if (!user) {
        user = {
          id: id('u'),
          phone,
          firstName: '',
          lastName: '',
          email: '',
          citizenship: 'UZ',
          createdAt: new Date(now).toISOString(),
          points: 0,
          lastActivityAt: new Date(now).toISOString(),
          notificationPrefs: { sms: true, email: true, push: true, marketing: false },
        };
        db.users.push(user);
        db.points[user.id] = [];
        db.notifications[user.id] = [];
        // Bookings made earlier as a guest with this phone are attached to the new account.
        db.bookings.filter((b) => !b.userId && normalizePhone(b.guest.phone) === phone).forEach((b) => (b.userId = user!.id));
      }
      const token = id('tok');
      db.sessions[token] = user.id;
      return { token, user: { ...user }, isNew };
    });
  }

  async me(token: string) {
    return this.tx((db) => ({ ...this.requireUser(db, token) }));
  }

  async updateProfile(token: string, patch: Parameters<HotelApi['updateProfile']>[1]) {
    return this.tx((db) => {
      const u = this.requireUser(db, token);
      Object.assign(u, patch);
      return { ...u };
    });
  }

  // ---------- catalogue ----------

  async listHotels() {
    await this.delay();
    return HOTELS;
  }

  async getHotel(hotelId: string) {
    await this.delay();
    const h = HOTELS.find((x) => x.id === hotelId);
    if (!h) throw new ApiError('not_found');
    return h;
  }

  async reviews(hotelId: string) {
    return this.tx((db) => db.reviews.filter((r) => r.hotelId === hotelId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }

  async priceHistogram() {
    await this.delay();
    const prices = RATE_PLANS.map((r) => r.basePrice);
    const min = 0;
    const max = Math.ceil(Math.max(...prices) / 500_000) * 500_000;
    const n = 20;
    const buckets = Array.from({ length: n }, () => 0);
    for (const p of prices) buckets[Math.min(n - 1, Math.floor(((p - min) / (max - min)) * n))]++;
    return { min, max, buckets };
  }

  private offersFor(db: Db, hotelId: string, q: Pick<SearchQuery, 'checkIn' | 'checkOut' | 'adults' | 'children' | 'rooms'>, member: boolean): RoomOffer[] {
    const now = this.clock().getTime();
    const nights = diffDays(q.checkIn, q.checkOut);
    const out: RoomOffer[] = [];
    for (const room of ROOM_TYPES.filter((r) => r.hotelId === hotelId)) {
      if (!fitsOccupancy(room, q.adults, q.children, q.rooms)) continue;
      const available = availableRooms(room, q.checkIn, q.checkOut, db.bookings, db.holds, now, { closedDates: db.closedDates[room.id] });
      if (available < q.rooms) continue;
      for (const rate of RATE_PLANS.filter((r) => r.roomTypeId === room.id)) {
        if (nights < rate.minNights) continue;
        out.push({
          room,
          rate,
          available,
          price: quote({
            rate,
            checkIn: q.checkIn,
            checkOut: q.checkOut,
            rooms: q.rooms,
            isMember: member,
            memberDiscount: this.cfg.memberDiscount,
            pointValue: this.cfg.pointValue,
            maxRedeemShare: this.cfg.maxRedeemShare,
            paymentMode: rate.paymentModes[0],
          }),
        });
      }
    }
    return out.sort((a, b) => a.price.total - b.price.total);
  }

  async roomOffers(hotelId: string, q: Parameters<HotelApi['roomOffers']>[1], token?: string) {
    return this.tx((db) => this.offersFor(db, hotelId, q, !!this.userFor(db, token)));
  }

  async search(q: SearchQuery, token?: string) {
    return this.tx((db) => {
      const member = !!this.userFor(db, token);
      const text = q.location.trim().toLowerCase();
      const firstWord = text.split(',')[0].trim();
      const results: SearchResult[] = [];
      for (const hotel of HOTELS) {
        if (q.hotelId && hotel.id !== q.hotelId) continue;
        if (firstWord) {
          const hay = [hotel.name, ...Object.values(hotel.city), ...Object.values(hotel.district), 'uzbekistan', "o'zbekiston", 'узбекистан'].join(' ').toLowerCase();
          if (!hay.includes(firstWord)) continue;
        }
        if (q.types.length && !q.types.includes(hotel.type)) continue;
        if (q.amenities?.length && !q.amenities.every((a) => hotel.amenities.includes(a))) continue;
        if (q.minRating && hotel.rating < q.minRating) continue;
        let offers = this.offersFor(db, hotel.id, q, member);
        if (q.breakfastOnly) offers = offers.filter((o) => o.rate.breakfastIncluded);
        if (q.freeCancellationOnly) offers = offers.filter((o) => o.rate.cancellation.kind === 'free');
        const nightlyOf = (o: RoomOffer) => Math.round(o.price.total / Math.max(1, o.price.nights) / q.rooms);
        if (q.minPrice != null) offers = offers.filter((o) => nightlyOf(o) >= q.minPrice!);
        if (q.maxPrice != null) offers = offers.filter((o) => nightlyOf(o) <= q.maxPrice!);
        if (!offers.length) continue;
        const best = offers[0];
        results.push({
          hotel,
          fromPrice: nightlyOf(best),
          totalPrice: best.price.total,
          availableRooms: offers.reduce((m, o) => Math.max(m, o.available), 0),
          breakfastAvailable: offers.some((o) => o.rate.breakfastIncluded),
          freeCancellationAvailable: offers.some((o) => o.rate.cancellation.kind === 'free'),
        });
      }
      const sort = q.sort ?? 'recommended';
      const cmp: Record<string, (a: SearchResult, b: SearchResult) => number> = {
        recommended: (a, b) => b.hotel.rating * Math.log(b.hotel.reviewCount + 1) - a.hotel.rating * Math.log(a.hotel.reviewCount + 1),
        price_asc: (a, b) => a.fromPrice - b.fromPrice,
        price_desc: (a, b) => b.fromPrice - a.fromPrice,
        rating: (a, b) => b.hotel.rating - a.hotel.rating,
        reviews: (a, b) => b.hotel.reviewCount - a.hotel.reviewCount,
        distance: (a, b) => a.hotel.distanceToCenterKm - b.hotel.distanceToCenterKm,
      };
      return results.sort(cmp[sort]);
    });
  }

  // ---------- booking ----------

  async createHold(roomTypeId: string, checkIn: string, checkOut: string, rooms: number) {
    return this.tx((db) => {
      const room = ROOM_TYPES.find((r) => r.id === roomTypeId);
      if (!room) throw new ApiError('not_found');
      const now = this.clock().getTime();
      const free = availableRooms(room, checkIn, checkOut, db.bookings, db.holds, now, { closedDates: db.closedDates[room.id] });
      if (free < rooms) throw new ApiError('sold_out');
      const hold: RoomHold = { id: id('hold'), roomTypeId, checkIn, checkOut, rooms, expiresAt: now + HOLD_MINUTES * 60_000 };
      db.holds.push(hold);
      return hold;
    });
  }

  async releaseHold(holdId: string) {
    return this.tx((db) => {
      db.holds = db.holds.filter((h) => h.id !== holdId);
    });
  }

  async checkPromo(code: string, hotelId: string, nights: number) {
    return this.tx((db) => {
      const promo = db.promos.find((p) => p.code.toUpperCase() === code.trim().toUpperCase());
      const error = validatePromo(promo, { hotelId, nights, today: todayISO(this.clock()) });
      return error ? ({ ok: false, error } as const) : ({ ok: true } as const);
    });
  }

  private priceFor(db: Db, req: QuoteRequest, user?: User) {
    const rate = RATE_PLANS.find((r) => r.id === req.ratePlanId);
    if (!rate) throw new ApiError('not_found');
    if (!rate.paymentModes.includes(req.paymentMode)) throw new ApiError('payment_mode_not_allowed');
    const nights = diffDays(req.checkIn, req.checkOut);
    if (nights < rate.minNights) throw new ApiError('min_nights', undefined, { minNights: rate.minNights });
    const hotelId = ROOM_TYPES.find((r) => r.id === rate.roomTypeId)!.hotelId;
    let promo: PromoCode | undefined;
    if (req.promoCode) {
      promo = db.promos.find((p) => p.code.toUpperCase() === req.promoCode!.toUpperCase());
      const err = validatePromo(promo, { hotelId, nights, today: todayISO(this.clock()) });
      if (err) throw new ApiError(`promo_${err}`);
    }
    const balance = user ? balanceFromHistory(db.points[user.id] ?? []) : 0;
    const price = quote({
      rate,
      checkIn: req.checkIn,
      checkOut: req.checkOut,
      rooms: req.rooms,
      isMember: !!user,
      memberDiscount: this.cfg.memberDiscount,
      promo,
      pointsToRedeem: Math.min(req.pointsToRedeem ?? 0, balance),
      useFreeNight: req.useFreeNight,
      pointValue: this.cfg.pointValue,
      maxRedeemShare: this.cfg.maxRedeemShare,
      paymentMode: req.paymentMode,
    });
    if (price.pointsRedeemed > balance) throw new ApiError('insufficient_points');
    return { rate, price, promo, hotelId };
  }

  async quote(req: QuoteRequest, token?: string) {
    return this.tx((db) => this.priceFor(db, req, this.userFor(db, token)).price);
  }

  async createBooking(req: CreateBookingRequest, token?: string) {
    return this.tx((db) => {
      const now = this.clock();
      const hold = db.holds.find((h) => h.id === req.holdId);
      if (!hold || hold.expiresAt <= now.getTime()) throw new ApiError('hold_expired');
      const user = this.userFor(db, token);
      const { rate, price, promo } = this.priceFor(db, req, user);
      if (rate.roomTypeId !== hold.roomTypeId) throw new ApiError('hold_mismatch');

      const userBookings = user ? db.bookings.filter((b) => b.userId === user.id) : [];
      const tier = user ? tierStatus(userBookings, now, this.cfg).tier.id : undefined;
      // Payment is processed on the provider's page (Payme/Click/Uzum/acquiring); card data never touches our system.
      const paid = price.dueNow;
      const booking: Booking = {
        id: id('bk'),
        number: bookingNumber(now),
        userId: user?.id,
        hotelId: req.hotelId,
        roomTypeId: rate.roomTypeId,
        ratePlanId: rate.id,
        checkIn: req.checkIn,
        checkOut: req.checkOut,
        adults: req.adults,
        children: req.children,
        rooms: req.rooms,
        guest: { ...req.guest, phone: normalizePhone(req.guest.phone) },
        status: 'confirmed',
        paymentMode: req.paymentMode,
        paymentProvider: req.paymentMode === 'at_hotel' ? 'cash' : req.paymentProvider,
        promoCode: promo?.code,
        price,
        paid,
        refunded: 0,
        pointsEarned: 0,
        perks: tier ? perksForTier(tier, this.cfg) : [],
        createdAt: now.toISOString(),
      };
      db.bookings.push(booking);
      db.holds = db.holds.filter((h) => h.id !== hold.id);
      if (promo) promo.used += 1;
      if (user && price.pointsRedeemed > 0) {
        this.addPoints(db, user.id, { kind: 'redeemed', points: -price.pointsRedeemed, bookingId: booking.id, createdAt: now.toISOString() });
      }
      if (user) {
        this.notifyOnce(db, user.id, `confirmed:${booking.id}`, { kind: 'booking_confirmed', title: 'notif.confirmed.title', body: `notif.confirmed.body|${booking.number}`, bookingId: booking.id });
      }
      return booking;
    });
  }

  async getBooking(bookingId: string) {
    return this.tx((db) => {
      const b = db.bookings.find((x) => x.id === bookingId);
      if (!b) throw new ApiError('not_found');
      return { ...b };
    });
  }

  async findBooking(number: string, phone: string) {
    return this.tx((db) => {
      const b = db.bookings.find((x) => x.number.toUpperCase() === number.trim().toUpperCase() && x.guest.phone === normalizePhone(phone));
      if (!b) throw new ApiError('not_found');
      return { ...b };
    });
  }

  async listBookings(token: string) {
    return this.tx((db) => {
      const u = this.requireUser(db, token);
      return db.bookings.filter((b) => b.userId === u.id).sort((a, b) => b.checkIn.localeCompare(a.checkIn));
    });
  }

  async cancellationQuote(bookingId: string) {
    return this.tx((db) => {
      const b = db.bookings.find((x) => x.id === bookingId);
      if (!b) throw new ApiError('not_found');
      const rate = RATE_PLANS.find((r) => r.id === b.ratePlanId)!;
      return cancellationQuote(b, rate, todayISO(this.clock()));
    });
  }

  async cancelBooking(bookingId: string) {
    return this.tx((db) => {
      const b = db.bookings.find((x) => x.id === bookingId);
      if (!b) throw new ApiError('not_found');
      const rate = RATE_PLANS.find((r) => r.id === b.ratePlanId)!;
      const q = cancellationQuote(b, rate, todayISO(this.clock()));
      if (!q.allowed) throw new ApiError('cannot_cancel');
      const now = this.clock().toISOString();
      b.status = 'cancelled';
      b.cancelledAt = now;
      b.refunded = q.refund; // refund issued via the payment provider's refund API
      if (b.userId && q.pointsReturned > 0) {
        this.addPoints(db, b.userId, { kind: 'refunded', points: q.pointsReturned, bookingId: b.id, createdAt: now });
      }
      if (b.userId) {
        this.notifyOnce(db, b.userId, `cancelled:${b.id}`, { kind: 'cancelled', title: 'notif.cancelled.title', body: `notif.cancelled.body|${b.number}`, bookingId: b.id });
      }
      return { ...b };
    });
  }

  async changeDates(bookingId: string, checkIn: string, checkOut: string) {
    return this.tx((db) => {
      const b = db.bookings.find((x) => x.id === bookingId);
      if (!b) throw new ApiError('not_found');
      const rate = RATE_PLANS.find((r) => r.id === b.ratePlanId)!;
      if (!canModifyDates(b, rate, todayISO(this.clock()))) throw new ApiError('cannot_modify');
      const nights = diffDays(checkIn, checkOut);
      if (nights < rate.minNights) throw new ApiError('min_nights');
      const room = ROOM_TYPES.find((r) => r.id === b.roomTypeId)!;
      const others = db.bookings.filter((x) => x.id !== b.id);
      const free = availableRooms(room, checkIn, checkOut, others, db.holds, this.clock().getTime(), { closedDates: db.closedDates[room.id] });
      if (free < b.rooms) throw new ApiError('sold_out');
      const nightly = Array.from({ length: nights }, (_, i) => {
        const date = addDays(checkIn, i);
        return { date, price: nightlyPrice(rate, date) };
      });
      const subtotal = nightly.reduce((s, n) => s + n.price, 0) * b.rooms;
      const ratio = b.price.roomsSubtotal ? subtotal / b.price.roomsSubtotal : 1;
      const scale = (n: number) => Math.round((n * ratio) / 1000) * 1000;
      const memberDiscount = scale(b.price.memberDiscount);
      const promoDiscount = scale(b.price.promoDiscount);
      const total = Math.max(0, subtotal - memberDiscount - promoDiscount - b.price.pointsDiscount - b.price.freeNightDiscount);
      const dueNow = b.paymentMode === 'full' ? total : b.paymentMode === 'partial' ? Math.round((total * rate.depositPercent) / 1000) * 1000 : 0;
      b.price = { ...b.price, nights, nightly, roomsSubtotal: subtotal, memberDiscount, promoDiscount, total, dueNow, dueAtHotel: total - dueNow };
      b.checkIn = checkIn;
      b.checkOut = checkOut;
      // Difference is charged or refunded through the original payment provider.
      if (b.paid > dueNow) b.refunded += b.paid - dueNow;
      b.paid = dueNow;
      return { ...b };
    });
  }

  // ---------- loyalty ----------

  async loyalty(token: string) {
    return this.tx((db) => {
      const u = this.requireUser(db, token);
      const history = [...(db.points[u.id] ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return {
        balance: balanceFromHistory(history),
        status: tierStatus(db.bookings.filter((b) => b.userId === u.id), this.clock(), this.cfg),
        history,
        expiresAt: pointsExpiryDate(u.lastActivityAt, this.cfg).toISOString(),
        config: this.cfg,
      };
    });
  }

  async loyaltyConfig() {
    return this.cfg;
  }

  // ---------- reviews ----------

  async createReview(token: string, bookingId: string, rating: number, text: string) {
    return this.tx((db) => {
      const u = this.requireUser(db, token);
      const b = db.bookings.find((x) => x.id === bookingId && x.userId === u.id);
      if (!b || b.status !== 'checked_out') throw new ApiError('review_not_allowed');
      if (diffDays(b.checkOut, todayISO(this.clock())) > 30) throw new ApiError('review_window_closed');
      if (b.reviewId) throw new ApiError('review_exists');
      const review: Review = {
        id: id('rev'),
        hotelId: b.hotelId,
        bookingId: b.id,
        author: `${u.firstName} ${u.lastName.slice(0, 1)}.`.trim(),
        rating: Math.max(1, Math.min(5, Math.round(rating))),
        text: text.trim(),
        createdAt: this.clock().toISOString(),
      };
      db.reviews.push(review);
      b.reviewId = review.id;
      return review;
    });
  }

  // ---------- notifications ----------

  async notifications(token: string) {
    return this.tx((db) => [...(db.notifications[this.requireUser(db, token).id] ?? [])]);
  }

  async markNotificationsRead(token: string) {
    return this.tx((db) => {
      (db.notifications[this.requireUser(db, token).id] ?? []).forEach((n) => (n.read = true));
    });
  }
}
