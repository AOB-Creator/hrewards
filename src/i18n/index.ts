import { useCallback } from 'react';
import type { Locale, LocalizedText } from '@/domain/types';
import { useSettings } from '@/store/settings';
import { en, type TKey } from './en';
import { ru } from './ru';
import { uz } from './uz';

const dictionaries: Record<Locale, Record<TKey, string>> = { en, ru, uz };

export type { TKey };
export type Params = Record<string, string | number>;

export function translate(locale: Locale, key: TKey | string, params?: Params): string {
  // Server messages may be encoded as "key|arg0|arg1".
  const [k, ...args] = key.split('|');
  let s = dictionaries[locale][k as TKey] ?? en[k as TKey] ?? k;
  args.forEach((a, i) => (s = s.replace(`{${i}}`, a)));
  if (params) for (const [p, v] of Object.entries(params)) s = s.split(`{${p}}`).join(String(v));
  return s;
}

export function useT() {
  const locale = useSettings((s) => s.locale);
  const t = useCallback((key: TKey | string, params?: Params) => translate(locale, key, params), [locale]);
  const tl = useCallback((text: LocalizedText) => text[locale] ?? text.en, [locale]);
  return { t, tl, locale };
}

export const LOCALE_NAMES: Record<Locale, string> = { uz: "O'zbekcha", ru: 'Русский', en: 'English' };
