import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Currency, FxRates, Locale } from '@/domain/types';
import { FALLBACK_RATES, fetchCbuRates } from '@/services/fx';
import { persistStorage } from './storage';

/** The app's working language is Uzbek; users can switch in Profile › Til. */
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
      locale: 'uz',
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
