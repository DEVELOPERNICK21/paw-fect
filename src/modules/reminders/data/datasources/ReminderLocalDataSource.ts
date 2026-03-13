import type { Reminder } from '../../domain/models/Reminder';
import { storageService } from '../../../../infrastructure/storage/storageService';

const REMINDERS_STORAGE_KEY = 'reminders';

export interface ReminderLocalDataSource {
  getReminders(): Promise<Reminder[]>;
  saveReminders(reminders: Reminder[]): Promise<void>;
}

class ReminderLocalDataSourceImpl implements ReminderLocalDataSource {
  async getReminders(): Promise<Reminder[]> {
    const reminders =
      await storageService.getItem<Reminder[]>(REMINDERS_STORAGE_KEY);
    return reminders ?? [];
  }

  async saveReminders(reminders: Reminder[]): Promise<void> {
    await storageService.setItem(REMINDERS_STORAGE_KEY, reminders);
  }
}

export const createReminderLocalDataSource = (): ReminderLocalDataSource =>
  new ReminderLocalDataSourceImpl();

