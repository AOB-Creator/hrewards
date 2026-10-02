import type { FxRates } from '@/domain/types';

/** Used until the Central Bank of Uzbekistan rates are fetched (or when offline). */
export const FALLBACK_RATES: FxRates = { USD: 12_050, EUR: 14_100, updatedAt: '2026-10-01T00:00:00Z', source: 'fallback' };

/** Daily rates from the Central Bank of the Republic of Uzbekistan (TZ 6). */
export async function fetchCbuRates(): Promise<FxRates> {
  const res = await fetch('https://cbu.uz/uz/arkhiv-kursov-valyut/json/');
  if (!res.ok) throw new Error(`cbu ${res.status}`);
  const list: { Ccy: string; Rate: string }[] = await res.json();
  const rate = (c: string) => Number(list.find((x) => x.Ccy === c)?.Rate);
  const USD = rate('USD');
  const EUR = rate('EUR');
  if (!USD || !EUR) throw new Error('cbu: missing rates');
  return { USD, EUR, updatedAt: new Date().toISOString(), source: 'cbu' };
}
