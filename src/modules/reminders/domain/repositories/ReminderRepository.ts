import type { Reminder } from '../models/Reminder';

export interface ReminderRepository {
  getReminders(): Promise<Reminder[]>;
  createReminder(reminder: Reminder): Promise<Reminder>;
  updateReminder(reminder: Reminder): Promise<Reminder>;
  deleteReminder(id: string): Promise<void>;
}

