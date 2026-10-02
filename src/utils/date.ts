import type { ISODate } from '@/domain/types';

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parses YYYY-MM-DD as a local date (no timezone shift). */
export function parseISODate(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: ISODate, days: number): ISODate {
  const d = parseISODate(s);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}

export function diffDays(from: ISODate, to: ISODate): number {
  const ms = parseISODate(to).getTime() - parseISODate(from).getTime();
  return Math.round(ms / 86_400_000);
}

/** Every night of a stay: [checkIn, checkOut). */
export function eachNight(checkIn: ISODate, checkOut: ISODate): ISODate[] {
  const out: ISODate[] = [];
  for (let d = checkIn; d < checkOut; d = addDays(d, 1)) out.push(d);
  return out;
}

export function today(now: Date = new Date()): ISODate {
  return toISODate(now);
}

export function isWithin(date: ISODate, from: ISODate, to: ISODate): boolean {
  return date >= from && date <= to;
}

/** 09/20/2025 — format used in the search sheet. */
export function formatSlashDate(s: ISODate): string {
  const [y, m, d] = s.split('-');
  return `${m}/${d}/${y}`;
}

const MONTHS: Record<string, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ru: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  uz: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'],
};

export function formatShortDate(s: ISODate, locale = 'en'): string {
  const d = parseISODate(s);
  return `${d.getDate()} ${(MONTHS[locale] ?? MONTHS.en)[d.getMonth()]}`;
}

/** "20 Sep–29 Sep" */
export function formatRange(from: ISODate, to: ISODate, locale = 'en'): string {
  return `${formatShortDate(from, locale)}–${formatShortDate(to, locale)}`;
}

export function formatLongDate(s: ISODate, locale = 'en'): string {
  const d = parseISODate(s);
  return `${formatShortDate(s, locale)} ${d.getFullYear()}`;
}
