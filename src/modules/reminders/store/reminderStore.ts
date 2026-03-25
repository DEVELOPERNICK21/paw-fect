import { create } from 'zustand';
import type { Reminder } from '../domain/models/Reminder';
import type { ReminderType } from '../domain/models/Reminder';
import { createReminderRepository } from '../data/repositories/ReminderRepositoryImpl';
import { GetReminders } from '../domain/usecases/GetReminders';
import { CreateReminder } from '../domain/usecases/CreateReminder';
import { UpdateReminder } from '../domain/usecases/UpdateReminder';
import { DeleteReminder } from '../domain/usecases/DeleteReminder';
import {
  CreateReminderEntry,
  type CreateReminderEntryResult,
} from '../domain/usecases/CreateReminderEntry';

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
  }) => Promise<{ success: boolean; error?: string }>;
  updateReminder: (reminder: Reminder) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
}

const repository = createReminderRepository();
const getRemindersUseCase = new GetReminders(repository);
const createReminderUseCase = new CreateReminder(repository);
const updateReminderUseCase = new UpdateReminder(repository);
const deleteReminderUseCase = new DeleteReminder(repository);
const createReminderEntryUseCase = new CreateReminderEntry();

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminders: [],
  loading: false,
  reset: () => set({ reminders: [], loading: false }),

  loadReminders: async () => {
    set({ loading: true });
    try {
      const reminders = await getRemindersUseCase.execute();
      set({ reminders, loading: false });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[reminderStore] loadReminders error', error);
      set({ loading: false });
    }
  },

  createReminder: async (reminder: Reminder) => {
    set({ loading: true });
    try {
      const created = await createReminderUseCase.execute(reminder);
      const { reminders } = get();
      set({ reminders: [...reminders, created], loading: false });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[reminderStore] createReminder error', error);
      set({ loading: false });
    }
  },

  createReminderEntry: async (input) => {
    const result: CreateReminderEntryResult =
      createReminderEntryUseCase.execute(input);
    if (!result.ok) {
      return { success: false, error: result.errorMessage };
    }
    await get().createReminder(result.reminder);
    return { success: true };
  },

  updateReminder: async (reminder: Reminder) => {
    set({ loading: true });
    try {
      const updated = await updateReminderUseCase.execute(reminder);
      const { reminders } = get();
      const next = reminders.map(existing =>
        existing.id === updated.id ? updated : existing,
      );
      set({ reminders: next, loading: false });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[reminderStore] updateReminder error', error);
      set({ loading: false });
    }
  },

  deleteReminder: async (id: string) => {
    set({ loading: true });
    try {
      await deleteReminderUseCase.execute(id);
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

