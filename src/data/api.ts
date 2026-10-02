import type {
  AppNotification,
  Booking,
  GuestDetails,
  Hotel,
  ISODate,
  LoyaltyConfig,
  PaymentMode,
  PaymentProvider,
  PointsTransaction,
  PriceBreakdown,
  Review,
  RoomHold,
  RoomOffer,
  SearchQuery,
  SearchResult,
  User,
} from '@/domain/types';
import type { TierStatus } from '@/domain/loyalty';
import type { CancellationQuote } from '@/domain/cancellation';
import type { PromoError } from '@/domain/pricing';

export class ApiError extends Error {
  constructor(
    public code: string,
    message?: string,
    public details?: Record<string, unknown>,
  ) {
    super(message ?? code);
  }
}

export interface OtpRequestResult {
  /** Seconds until a new code can be requested. */
  resendIn: number;
  expiresIn: number;
  /** Only returned by the demo backend, never by production. */
  debugCode?: string;
}

export interface AuthResult {
  token: string;
  user: User;
  isNew: boolean;
}

export interface QuoteRequest {
  ratePlanId: string;
  checkIn: ISODate;
  checkOut: ISODate;
  rooms: number;
  paymentMode: PaymentMode;
  promoCode?: string;
  pointsToRedeem?: number;
  useFreeNight?: boolean;
}

export interface CreateBookingRequest extends QuoteRequest {
  holdId: string;
  hotelId: string;
  adults: number;
  children: number;
  guest: GuestDetails;
  paymentProvider: PaymentProvider;
}

export interface LoyaltySummary {
  balance: number;
  status: TierStatus;
  history: PointsTransaction[];
  expiresAt: string;
  config: LoyaltyConfig;
}

/**
 * REST API contract shared with the public site and back-office (TZ section 8).
 * `token` is the member's session token; guest calls pass `undefined`.
 */
export interface HotelApi {
  // Auth (phone + SMS OTP, TZ 5.4)
  requestOtp(phone: string): Promise<OtpRequestResult>;
  verifyOtp(phone: string, code: string): Promise<AuthResult>;
  me(token: string): Promise<User>;
  updateProfile(token: string, patch: Partial<Pick<User, 'firstName' | 'lastName' | 'email' | 'citizenship' | 'birthDate' | 'notificationPrefs'>>): Promise<User>;

  // Catalogue & search (TZ 5.1–5.2)
  listHotels(): Promise<Hotel[]>;
  getHotel(id: string): Promise<Hotel>;
  search(query: SearchQuery, token?: string): Promise<SearchResult[]>;
  roomOffers(hotelId: string, query: Pick<SearchQuery, 'checkIn' | 'checkOut' | 'adults' | 'children' | 'rooms'>, token?: string): Promise<RoomOffer[]>;
  priceHistogram(): Promise<{ min: number; max: number; buckets: number[] }>;
  reviews(hotelId: string): Promise<Review[]>;

  // Booking (TZ 5.2)
  createHold(roomTypeId: string, checkIn: ISODate, checkOut: ISODate, rooms: number): Promise<RoomHold>;
  releaseHold(holdId: string): Promise<void>;
  checkPromo(code: string, hotelId: string, nights: number): Promise<{ ok: true } | { ok: false; error: PromoError }>;
  quote(req: QuoteRequest, token?: string): Promise<PriceBreakdown>;
  createBooking(req: CreateBookingRequest, token?: string): Promise<Booking>;
  getBooking(id: string): Promise<Booking>;
  findBooking(number: string, phone: string): Promise<Booking>;
  listBookings(token: string): Promise<Booking[]>;
  cancellationQuote(id: string): Promise<CancellationQuote>;
  cancelBooking(id: string, token?: string): Promise<Booking>;
  changeDates(id: string, checkIn: ISODate, checkOut: ISODate, token?: string): Promise<Booking>;

  // Loyalty (TZ 5.3)
  loyalty(token: string): Promise<LoyaltySummary>;
  loyaltyConfig(): Promise<LoyaltyConfig>;

  // Reviews (stayed guests, within 30 days of check-out)
  createReview(token: string, bookingId: string, rating: number, text: string): Promise<Review>;

  // Notifications (TZ 5.6)
  notifications(token: string): Promise<AppNotification[]>;
  markNotificationsRead(token: string): Promise<void>;
}
