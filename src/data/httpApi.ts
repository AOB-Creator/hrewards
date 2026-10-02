import type { HotelApi } from './api';
import { ApiError } from './api';

/**
 * REST client for the production backend (NestJS, Swagger-documented — TZ section 8).
 * Endpoint paths follow the shared contract; every method maps 1:1 to `HotelApi`.
 */
export class HttpApi implements HotelApi {
  constructor(
    private baseUrl: string,
    private getLocale: () => string = () => 'uz',
  ) {}

  private async req<T>(method: string, path: string, opts: { token?: string; body?: unknown; query?: Record<string, unknown> } = {}): Promise<T> {
    const qs = opts.query
      ? '?' +
        Object.entries(opts.query)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(Array.isArray(v) ? v.join(',') : String(v))}`)
          .join('&')
      : '';
    const res = await fetch(`${this.baseUrl}${path}${qs}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': this.getLocale(),
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = res.status === 204 ? undefined : await res.json().catch(() => undefined);
    if (!res.ok) throw new ApiError(data?.code ?? `http_${res.status}`, data?.message, data?.details);
    return data as T;
  }

  requestOtp: HotelApi['requestOtp'] = (phone) => this.req('POST', '/auth/otp', { body: { phone } });
  verifyOtp: HotelApi['verifyOtp'] = (phone, code) => this.req('POST', '/auth/otp/verify', { body: { phone, code } });
  me: HotelApi['me'] = (token) => this.req('GET', '/me', { token });
  updateProfile: HotelApi['updateProfile'] = (token, patch) => this.req('PATCH', '/me', { token, body: patch });

  listHotels: HotelApi['listHotels'] = () => this.req('GET', '/hotels');
  getHotel: HotelApi['getHotel'] = (id) => this.req('GET', `/hotels/${id}`);
  search: HotelApi['search'] = (query, token) => this.req('GET', '/search', { token, query: query as unknown as Record<string, unknown> });
  roomOffers: HotelApi['roomOffers'] = (hotelId, query, token) => this.req('GET', `/hotels/${hotelId}/offers`, { token, query });
  priceHistogram: HotelApi['priceHistogram'] = () => this.req('GET', '/search/price-histogram');
  reviews: HotelApi['reviews'] = (hotelId) => this.req('GET', `/hotels/${hotelId}/reviews`);

  createHold: HotelApi['createHold'] = (roomTypeId, checkIn, checkOut, rooms) => this.req('POST', '/holds', { body: { roomTypeId, checkIn, checkOut, rooms } });
  releaseHold: HotelApi['releaseHold'] = (holdId) => this.req('DELETE', `/holds/${holdId}`);
  checkPromo: HotelApi['checkPromo'] = (code, hotelId, nights) => this.req('POST', '/promo/check', { body: { code, hotelId, nights } });
  quote: HotelApi['quote'] = (body, token) => this.req('POST', '/bookings/quote', { token, body });
  createBooking: HotelApi['createBooking'] = (body, token) => this.req('POST', '/bookings', { token, body });
  getBooking: HotelApi['getBooking'] = (id) => this.req('GET', `/bookings/${id}`);
  findBooking: HotelApi['findBooking'] = (number, phone) => this.req('GET', '/bookings/lookup', { query: { number, phone } });
  listBookings: HotelApi['listBookings'] = (token) => this.req('GET', '/me/bookings', { token });
  cancellationQuote: HotelApi['cancellationQuote'] = (id) => this.req('GET', `/bookings/${id}/cancellation`);
  cancelBooking: HotelApi['cancelBooking'] = (id, token) => this.req('POST', `/bookings/${id}/cancel`, { token });
  changeDates: HotelApi['changeDates'] = (id, checkIn, checkOut, token) => this.req('POST', `/bookings/${id}/dates`, { token, body: { checkIn, checkOut } });

  loyalty: HotelApi['loyalty'] = (token) => this.req('GET', '/me/loyalty', { token });
  loyaltyConfig: HotelApi['loyaltyConfig'] = () => this.req('GET', '/loyalty/config');
  createReview: HotelApi['createReview'] = (token, bookingId, rating, text) => this.req('POST', `/bookings/${bookingId}/review`, { token, body: { rating, text } });
  notifications: HotelApi['notifications'] = (token) => this.req('GET', '/me/notifications', { token });
  markNotificationsRead: HotelApi['markNotificationsRead'] = (token) => this.req('POST', '/me/notifications/read', { token });
}
