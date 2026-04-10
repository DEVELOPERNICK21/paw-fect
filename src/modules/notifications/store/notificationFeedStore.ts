import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { NotificationFeedEvent } from '../../../infrastructure/notifications/notificationFeedEvents';
export interface InAppNotificationFeedItem {
  id: string;
  title: string;
  body: string;
  data: Record<string, string>;
  loggedAt: string;
  scheduledFor?: string;
  deliveredAt?: string;
  read: boolean;
  dismissed: boolean;
}

function mergeItem(
  prev: InAppNotificationFeedItem | undefined,
  patch: Partial<InAppNotificationFeedItem> & { id: string },
): InAppNotificationFeedItem {
  const loggedAt = patch.loggedAt ?? prev?.loggedAt ?? new Date().toISOString();
  const data =
    patch.data !== undefined
      ? { ...(prev?.data ?? {}), ...patch.data }
      : { ...(prev?.data ?? {}) };
  return {
    id: patch.id,
    title: patch.title ?? prev?.title ?? '',
    body: patch.body ?? prev?.body ?? '',
    data,
    loggedAt,
    scheduledFor: patch.scheduledFor ?? prev?.scheduledFor,
    deliveredAt: patch.deliveredAt ?? prev?.deliveredAt,
    read: patch.read ?? prev?.read ?? false,
    dismissed: patch.dismissed ?? prev?.dismissed ?? false,
  };
}

function sortKey(item: InAppNotificationFeedItem): number {
  const iso = item.deliveredAt ?? item.scheduledFor ?? item.loggedAt;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

export function selectVisibleFeedItems(
  itemsById: Record<string, InAppNotificationFeedItem>,
): InAppNotificationFeedItem[] {
  return Object.values(itemsById)
    .filter(i => !i.dismissed)
    .sort((a, b) => sortKey(b) - sortKey(a));
}

interface NotificationFeedState {
  itemsById: Record<string, InAppNotificationFeedItem>;
  applyFeedEvent: (event: NotificationFeedEvent) => void;
  /** Removes legacy rows that only mirrored scheduled triggers (never delivered in-app). */
  pruneScheduleMirrorRows: () => void;
  markRead: (id: string) => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationFeedStore = create<NotificationFeedState>()(
  persist(
    set => ({
      itemsById: {},

      applyFeedEvent: event => {
        set(state => {
          const prev = state.itemsById[event.payload.id];
          if (event.type === 'scheduled') {
            const p = event.payload;
            const next = mergeItem(prev, {
              id: p.id,
              title: p.title,
              body: p.body,
              ...(p.data != null ? { data: p.data } : {}),
              scheduledFor: p.scheduledForIso,
              loggedAt: new Date().toISOString(),
            });
            return { itemsById: { ...state.itemsById, [next.id]: next } };
          }
          if (event.type === 'displayed' || event.type === 'delivered') {
            const p = event.payload;
            const next = mergeItem(prev, {
              id: p.id,
              title: p.title,
              body: p.body,
              data: p.data,
              deliveredAt: p.deliveredAtIso,
              loggedAt: prev?.loggedAt ?? p.deliveredAtIso,
            });
            return { itemsById: { ...state.itemsById, [next.id]: next } };
          }
          return state;
        });
      },

      pruneScheduleMirrorRows: () => {
        set(state => {
          const itemsById = { ...state.itemsById };
          for (const [id, item] of Object.entries(itemsById)) {
            if (item.deliveredAt == null && item.scheduledFor != null) {
              delete itemsById[id];
            }
          }
          return { itemsById };
        });
      },

      markRead: id => {
        set(state => {
          const prev = state.itemsById[id];
          if (prev == null || prev.read) {
            return state;
          }
          const next = mergeItem(prev, { id, read: true });
          return { itemsById: { ...state.itemsById, [id]: next } };
        });
      },

      dismiss: id => {
        set(state => {
          const prev = state.itemsById[id];
          if (prev == null) {
            return state;
          }
          const next = mergeItem(prev, { id, dismissed: true });
          return { itemsById: { ...state.itemsById, [id]: next } };
        });
      },

      clearAll: () => {
        set({ itemsById: {} });
      },
    }),
    {
      name: 'pawfect-notification-feed-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ itemsById: state.itemsById }),
    },
  ),
);

export function getNotificationFeedItemsSnapshot(): InAppNotificationFeedItem[] {
  return selectVisibleFeedItems(useNotificationFeedStore.getState().itemsById);
}
