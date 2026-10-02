import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/data';
import type { User } from '@/domain/types';
import { persistStorage } from './storage';

interface SessionState {
  token?: string;
  user?: User;
  /** Bookings made as a guest on this device (no account). */
  guestBookingIds: string[];
  signIn(token: string, user: User): void;
  setUser(user: User): void;
  refresh(): Promise<void>;
  signOut(): void;
  rememberGuestBooking(id: string): void;
}

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      guestBookingIds: [],
      signIn: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      refresh: async () => {
        const { token } = get();
        if (!token) return;
        try {
          set({ user: await api.me(token) });
        } catch {
          set({ token: undefined, user: undefined });
        }
      },
      signOut: () => set({ token: undefined, user: undefined }),
      rememberGuestBooking: (id) => set((s) => ({ guestBookingIds: [id, ...s.guestBookingIds.filter((x) => x !== id)] })),
    }),
    { name: 'hrewards:session', storage: persistStorage },
  ),
);
