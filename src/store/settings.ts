import { getLocales } from 'expo-localization';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Currency, FxRates, Locale } from '@/domain/types';
import { FALLBACK_RATES, fetchCbuRates } from '@/services/fx';
import { persistStorage } from './storage';

function deviceLocale(): Locale {
  const code = getLocales()[0]?.languageCode;
  return code === 'ru' || code === 'en' || code === 'uz' ? code : 'uz';
}

interface SettingsState {
  locale: Locale;
  currency: Currency;
  onboarded: boolean;
  fx: FxRates;
  setLocale(l: Locale): void;
  setCurrency(c: Currency): void;
  completeOnboarding(): void;
  refreshRates(): Promise<void>;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      locale: deviceLocale(),
      currency: 'UZS',
      onboarded: false,
      fx: FALLBACK_RATES,
      setLocale: (locale) => set({ locale }),
      setCurrency: (currency) => set({ currency }),
      completeOnboarding: () => set({ onboarded: true }),
      refreshRates: async () => {
        try {
          set({ fx: await fetchCbuRates() });
        } catch {
          // keep the last known rates
        }
      },
    }),
    { name: 'hrewards:settings', storage: persistStorage },
  ),
);
