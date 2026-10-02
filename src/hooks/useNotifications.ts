import { create } from 'zustand';
import { api } from '@/data';
import type { AppNotification } from '@/domain/types';
import { useSession } from '@/store/session';

interface NotifState {
  items: AppNotification[];
  load(): Promise<void>;
  markRead(): Promise<void>;
}

export const useNotifications = create<NotifState>((set) => ({
  items: [],
  load: async () => {
    const token = useSession.getState().token;
    if (!token) return set({ items: [] });
    try {
      set({ items: await api.notifications(token) });
    } catch {
      // offline – keep previous
    }
  },
  markRead: async () => {
    const token = useSession.getState().token;
    if (!token) return;
    await api.markNotificationsRead(token).catch(() => {});
    set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) }));
  },
}));

export function useNotificationsCount() {
  return useNotifications((s) => s.items.filter((n) => !n.read).length);
}
