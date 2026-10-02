import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PropertyType, SearchQuery } from '@/domain/types';
import { addDays, today } from '@/utils/date';
import { persistStorage } from './storage';

export interface RecentSearch {
  destinationId: string;
  location: string;
  checkIn: string;
  checkOut: string;
  image: string;
}

const defaultQuery = (): SearchQuery => ({
  location: '',
  checkIn: addDays(today(), 14),
  checkOut: addDays(today(), 17),
  adults: 2,
  children: 0,
  rooms: 1,
  types: [],
  sort: 'recommended',
});

interface SearchState {
  query: SearchQuery;
  favorites: string[];
  recent: RecentSearch[];
  setQuery(patch: Partial<SearchQuery>): void;
  resetQuery(): void;
  toggleType(t: PropertyType | 'all'): void;
  toggleFavorite(hotelId: string): void;
  addRecent(r: RecentSearch): void;
}

export const useSearch = create<SearchState>()(
  persist(
    (set) => ({
      query: defaultQuery(),
      favorites: ['marmaris-tashkent'],
      recent: [],
      setQuery: (patch) => set((s) => ({ query: { ...s.query, ...patch } })),
      resetQuery: () => set({ query: defaultQuery() }),
      toggleType: (t) =>
        set((s) => {
          if (t === 'all') return { query: { ...s.query, types: [] } };
          const types = s.query.types.includes(t) ? s.query.types.filter((x) => x !== t) : [...s.query.types, t];
          return { query: { ...s.query, types } };
        }),
      toggleFavorite: (id) =>
        set((s) => ({ favorites: s.favorites.includes(id) ? s.favorites.filter((x) => x !== id) : [id, ...s.favorites] })),
      addRecent: (r) =>
        set((s) => ({ recent: [r, ...s.recent.filter((x) => x.destinationId !== r.destinationId)].slice(0, 6) })),
    }),
    {
      name: 'hrewards:search',
      storage: persistStorage,
      // Stale dates from a previous session are replaced with fresh defaults.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SearchState>;
        const q = p.query && p.query.checkIn > today() ? p.query : current.query;
        return { ...current, ...p, query: q };
      },
    },
  ),
);
