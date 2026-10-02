/**
 * Core domain model. Mirrors the REST API contract described in the TZ (section 8):
 * the mobile app talks to the same API as the public site and back-office.
 * All money amounts are integers in UZS (the base currency, TZ 5.1).
 */

export type Locale = 'uz' | 'ru' | 'en';
export type Currency = 'UZS' | 'USD' | 'EUR';
export type ISODate = string; // YYYY-MM-DD
export type LocalizedText = Record<Locale, string>;

export type PropertyType = 'hotel' | 'camper' | 'hostel' | 'villa' | 'resort' | 'apartment';

export type Amenity =
  | 'wifi'
  | 'pool'
  | 'spa'
  | 'gym'
  | 'parking'
  | 'restaurant'
  | 'breakfast'
  | 'airport_transfer'
  | 'air_conditioning'
  | 'kids_club'
  | 'bar'
  | 'conference';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface RatingBreakdown {
  communication: number;
  cleanliness: number;
  location: number;
  value: number;
}

export interface Hotel {
  id: string;
  name: string;
  type: PropertyType;
  city: LocalizedText;
  district: LocalizedText;
  address: LocalizedText;
  description: LocalizedText;
  geo: GeoPoint;
  distanceToCenterKm: number;
  stars: number;
  rating: number;
  reviewCount: number;
  ratingBreakdown: RatingBreakdown;
  images: string[];
  photoCount: number;
  amenities: Amenity[];
  phone: string;
  email: string;
  checkInTime: string;
  checkOutTime: string;
  /** Totals shown in "Property details" (largest room type). */
  details: { areaM2: number; guests: number; baths: number; beds: number };
  roomCount: number;
}

export type BedType = 'king' | 'queen' | 'twin' | 'double' | 'bunk';

export interface RoomType {
  id: string;
  hotelId: string;
  name: LocalizedText;
  areaM2: number;
  bed: BedType;
  beds: number;
  baths: number;
  maxAdults: number;
  maxChildren: number;
  amenities: Amenity[];
  images: string[];
  /** Number of physical rooms of this type (inventory). */
  inventory: number;
  /** Room type a Platinum member may be upgraded to (TZ 5.3). */
  upgradeToId?: string;
}

export type PaymentMode = 'full' | 'partial' | 'at_hotel';

export type CancellationPolicy =
  | { kind: 'free'; freeUntilDaysBefore: number; penaltyNights: number }
  | { kind: 'non_refundable' };

export interface SeasonalPrice {
  from: ISODate;
  to: ISODate; // inclusive
  price: number;
}

export interface RatePlan {
  id: string;
  roomTypeId: string;
  name: LocalizedText;
  basePrice: number; // per night, UZS
  /** Multipliers by weekday, 0=Sunday … 6=Saturday. Defaults to 1. */
  weekdayMultipliers?: Partial<Record<0 | 1 | 2 | 3 | 4 | 5 | 6, number>>;
  seasonal?: SeasonalPrice[];
  minNights: number;
  breakfastIncluded: boolean;
  cancellation: CancellationPolicy;
  paymentModes: PaymentMode[];
  /** Deposit share for partial pre-payment, 0..1. */
  depositPercent: number;
}

export type PromoKind = 'percent' | 'fixed';

export interface PromoCode {
  code: string;
  kind: PromoKind;
  value: number; // percent (0..100) or fixed UZS
  validFrom: ISODate;
  validTo: ISODate;
  minNights?: number;
  hotelIds?: string[];
  maxUses?: number;
  used: number;
}

export type BookingStatus = 'new' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

export type PaymentProvider = 'payme' | 'click' | 'uzum' | 'uzcard' | 'humo' | 'visa_mc' | 'cash';

export interface GuestDetails {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  citizenship: string;
  specialRequests: string;
  arrivalTime: string;
}

export interface PriceBreakdown {
  nights: number;
  nightly: { date: ISODate; price: number }[];
  roomsSubtotal: number; // sum of nightly * rooms
  memberDiscount: number;
  promoDiscount: number;
  pointsDiscount: number;
  pointsRedeemed: number;
  freeNightDiscount: number;
  total: number;
  dueNow: number;
  dueAtHotel: number;
}

export interface Booking {
  id: string;
  number: string;
  userId?: string;
  hotelId: string;
  roomTypeId: string;
  ratePlanId: string;
  checkIn: ISODate;
  checkOut: ISODate;
  adults: number;
  children: number;
  rooms: number;
  guest: GuestDetails;
  status: BookingStatus;
  paymentMode: PaymentMode;
  paymentProvider: PaymentProvider;
  promoCode?: string;
  price: PriceBreakdown;
  paid: number;
  refunded: number;
  pointsEarned: number;
  perks: string[];
  createdAt: string;
  cancelledAt?: string;
  reviewId?: string;
}

export type TierId = 'silver' | 'gold' | 'platinum';

export type PointsTxKind = 'earned' | 'redeemed' | 'expired' | 'refunded' | 'adjusted';

export interface PointsTransaction {
  id: string;
  kind: PointsTxKind;
  points: number; // signed
  bookingId?: string;
  note?: string;
  createdAt: string;
}

export interface NotificationPrefs {
  sms: boolean;
  email: boolean;
  push: boolean;
  marketing: boolean;
}

export interface User {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  citizenship: string;
  birthDate?: ISODate;
  createdAt: string;
  points: number;
  lastActivityAt: string;
  notificationPrefs: NotificationPrefs;
}

export interface AppNotification {
  id: string;
  kind: 'booking_confirmed' | 'reminder' | 'points_credited' | 'thank_you' | 'promo' | 'cancelled';
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  bookingId?: string;
}

export interface Review {
  id: string;
  hotelId: string;
  bookingId?: string;
  author: string;
  rating: number;
  text: string;
  createdAt: string;
}

export interface SearchQuery {
  location: string; // free text: city / hotel name / '' for all
  hotelId?: string;
  checkIn: ISODate;
  checkOut: ISODate;
  adults: number;
  children: number;
  rooms: number;
  minPrice?: number;
  maxPrice?: number;
  types: PropertyType[]; // empty = all types
  amenities?: Amenity[];
  breakfastOnly?: boolean;
  freeCancellationOnly?: boolean;
  minRating?: number;
  sort?: 'recommended' | 'price_asc' | 'price_desc' | 'rating' | 'reviews' | 'distance';
}

export interface SearchResult {
  hotel: Hotel;
  /** Cheapest available nightly price for the query (before member discount). */
  fromPrice: number;
  /** Total for the stay at the cheapest available rate. */
  totalPrice: number;
  availableRooms: number;
  breakfastAvailable: boolean;
  freeCancellationAvailable: boolean;
}

export interface RoomOffer {
  room: RoomType;
  rate: RatePlan;
  available: number;
  price: PriceBreakdown;
}

export interface RoomHold {
  id: string;
  roomTypeId: string;
  checkIn: ISODate;
  checkOut: ISODate;
  rooms: number;
  expiresAt: number; // epoch ms
}

export interface LoyaltyConfig {
  /** Points per `earnPerAmount` UZS (TZ: 5 points per 100 000 so'm). */
  earnPoints: number;
  earnPerAmount: number;
  /** Value of 1 point in UZS when redeemed. */
  pointValue: number;
  /** Max share of a booking that can be paid with points. */
  maxRedeemShare: number;
  expiryMonths: number;
  tierWindowMonths: number;
  memberDiscount: number; // 0.05
  tiers: {
    id: TierId;
    minNights: number;
    bonus: number; // extra share of base points
    perks: string[]; // i18n keys
  }[];
}

export interface FxRates {
  /** UZS per 1 unit of currency. */
  USD: number;
  EUR: number;
  updatedAt: string;
  source: 'cbu' | 'fallback';
}
