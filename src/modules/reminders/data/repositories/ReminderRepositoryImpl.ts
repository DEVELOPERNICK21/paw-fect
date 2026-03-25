import type { Reminder } from '../../domain/models/Reminder';
import type { ReminderRepository } from '../../domain/repositories/ReminderRepository';
import type { ReminderRemoteDataSource } from '../datasources/ReminderRemoteDataSource';
import {
  createReminderRemoteDataSource,
} from '../datasources/ReminderRemoteDataSource';
import type { ReminderLocalDataSource } from '../datasources/ReminderLocalDataSource';
import {
  createReminderLocalDataSource,
} from '../datasources/ReminderLocalDataSource';

export class ReminderRepositoryImpl implements ReminderRepository {
  constructor(
    private readonly remote: ReminderRemoteDataSource,
    private readonly local: ReminderLocalDataSource,
  ) {}

  async getReminders(): Promise<Reminder[]> {
    const cached = await this.local.getReminders();
    if (cached.length > 0) {
      return cached;
    }

    try {
      const remoteReminders = await this.remote.fetchReminders();
      await this.local.saveReminders(remoteReminders);
      return remoteReminders;
    } catch {
      return [];
    }
  }

  async createReminder(reminder: Reminder): Promise<Reminder> {
    let created = reminder;
    try {
      created = await this.remote.createReminder(reminder);
    } catch {
      created = reminder;
    }
    const reminders = await this.local.getReminders();
    const next = [
      ...reminders.filter(existing => existing.id !== created.id),
      created,
    ];
    await this.local.saveReminders(next);
    return created;
  }

  async updateReminder(reminder: Reminder): Promise<Reminder> {
    let updated = reminder;
    try {
      updated = await this.remote.updateReminder(reminder);
    } catch {
      updated = reminder;
    }
    const reminders = await this.local.getReminders();
    const exists = reminders.some(existing => existing.id === updated.id);
    const next = exists
      ? reminders.map(existing =>
          existing.id === updated.id ? updated : existing,
        )
      : [...reminders, updated];
    await this.local.saveReminders(next);
    return updated;
  }

  async deleteReminder(id: string): Promise<void> {
    try {
      await this.remote.deleteReminder(id);
    } catch {
      // Ignore remote failures in offline mode.
    }
    const reminders = await this.local.getReminders();
    const next = reminders.filter(reminder => reminder.id !== id);
    await this.local.saveReminders(next);
  }
}

export const createReminderRepository = (): ReminderRepository => {
  const remote = createReminderRemoteDataSource();
  const local = createReminderLocalDataSource();
  return new ReminderRepositoryImpl(remote, local);
};

