import { useCallback } from 'react';
import type { Currency, FxRates } from '@/domain/types';
import { useSettings } from '@/store/settings';

const groups = (n: number, sep = ' ') => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep);

export function convert(uzs: number, currency: Currency, fx: FxRates): number {
  if (currency === 'UZS') return uzs;
  return uzs / fx[currency];
}

/** Formats an amount stored in UZS in the user's display currency. */
export function formatMoney(uzs: number, currency: Currency, fx: FxRates, opts: { compact?: boolean; locale?: string } = {}): string {
  const v = convert(uzs, currency, fx);
  if (currency === 'USD') return `$${groups(v, ',')}`;
  if (currency === 'EUR') return `€${groups(v, ',')}`;
  const sum = opts.locale === 'ru' ? 'сум' : opts.locale === 'en' ? 'UZS' : "so'm";
  if (opts.compact && v >= 1_000_000) {
    const m = (v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 2).replace(/\.?0+$/, '');
    if (opts.locale === 'en') return `${m}M ${sum}`;
    return `${m.replace('.', ',')} ${opts.locale === 'ru' ? 'млн' : 'mln'} ${sum}`;
  }
  if (opts.compact && v >= 1_000 && opts.locale === 'en') return `${groups(v / 1000)}K ${sum}`;
  if (opts.compact && v >= 1_000) return `${groups(v / 1000)} ${opts.locale === 'ru' ? 'тыс' : 'ming'} ${sum}`;
  return `${groups(v)} ${sum}`;
}

export function useMoney() {
  const currency = useSettings((s) => s.currency);
  const fx = useSettings((s) => s.fx);
  const locale = useSettings((s) => s.locale);
  const money = useCallback((uzs: number, compact = false) => formatMoney(uzs, currency, fx, { compact, locale }), [currency, fx, locale]);
  /** Converts a value typed in the display currency back to UZS. */
  const toUZS = useCallback((v: number) => (currency === 'UZS' ? v : Math.round(v * fx[currency])), [currency, fx]);
  const fromUZS = useCallback((v: number) => convert(v, currency, fx), [currency, fx]);
  return { money, toUZS, fromUZS, currency };
}

export const formatNumber = (n: number) => groups(n);
