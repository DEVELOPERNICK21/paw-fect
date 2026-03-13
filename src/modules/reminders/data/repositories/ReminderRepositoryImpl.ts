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

    const remoteReminders = await this.remote.fetchReminders();
    await this.local.saveReminders(remoteReminders);
    return remoteReminders;
  }

  async createReminder(reminder: Reminder): Promise<Reminder> {
    const created = await this.remote.createReminder(reminder);
    const reminders = await this.local.getReminders();
    await this.local.saveReminders([...reminders, created]);
    return created;
  }

  async updateReminder(reminder: Reminder): Promise<Reminder> {
    const updated = await this.remote.updateReminder(reminder);
    const reminders = await this.local.getReminders();
    const next = reminders.map(existing =>
      existing.id === updated.id ? updated : existing,
    );
    await this.local.saveReminders(next);
    return updated;
  }

  async deleteReminder(id: string): Promise<void> {
    await this.remote.deleteReminder(id);
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

