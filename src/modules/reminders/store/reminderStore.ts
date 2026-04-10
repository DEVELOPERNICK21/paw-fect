import { create } from 'zustand';
import type { Reminder } from '../domain/models/Reminder';
import type { ReminderType } from '../domain/models/Reminder';
import {
  type CreateReminderEntryResult,
} from '../domain/usecases/CreateReminderEntry';
import { remindersComposition } from '../remindersComposition';

export interface ReminderState {
  reminders: Reminder[];
  loading: boolean;
  reset: () => void;
  loadReminders: () => Promise<void>;
  createReminder: (reminder: Reminder) => Promise<void>;
  createReminderEntry: (input: {
    petId: string;
    title: string;
    type: ReminderType;
    date: string;
    time: string;
    repeatEnabled: boolean;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  updateReminder: (reminder: Reminder) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminders: [],
  loading: false,
  reset: () => set({ reminders: [], loading: false }),

  loadReminders: async () => {
    set({ loading: true });
    try {
      const reminders = await remindersComposition.getReminders.execute();
      set({ reminders, loading: false });
      void remindersComposition.syncAllReminderNotifications(reminders).catch(() => {});
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[reminderStore] loadReminders error', error);
      set({ loading: false });
    }
  },

  createReminder: async (reminder: Reminder) => {
    set({ loading: true });
    try {
      const created = await remindersComposition.createReminder.execute(reminder);
      const { reminders } = get();
      set({ reminders: [...reminders, created], loading: false });
      void remindersComposition.scheduleReminderNotifications(created).catch(() => {});
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[reminderStore] createReminder error', error);
      set({ loading: false });
    }
  },

  createReminderEntry: async (input) => {
    const result: CreateReminderEntryResult =
      remindersComposition.createReminderEntry.execute(input);
    if (!result.ok) {
      return { success: false, error: result.errorMessage };
    }
    await get().createReminder(result.reminder);
    return { success: true };
  },

  updateReminder: async (reminder: Reminder) => {
    set({ loading: true });
    try {
      const updated = await remindersComposition.updateReminder.execute(reminder);
      const { reminders } = get();
      const next = reminders.map(existing =>
        existing.id === updated.id ? updated : existing,
      );
      set({ reminders: next, loading: false });
      void remindersComposition.scheduleReminderNotifications(updated).catch(() => {});
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[reminderStore] updateReminder error', error);
      set({ loading: false });
    }
  },

  deleteReminder: async (id: string) => {
    set({ loading: true });
    try {
      await remindersComposition.cancelReminderNotifications(id).catch(() => {});
      await remindersComposition.deleteReminder.execute(id);
      const { reminders } = get();
      const next = reminders.filter(reminder => reminder.id !== id);
      set({ reminders: next, loading: false });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[reminderStore] deleteReminder error', error);
      set({ loading: false });
    }
  },
}));

