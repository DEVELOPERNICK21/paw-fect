import type { Reminder } from '../../domain/models/Reminder';
import type { ReminderRepository } from '../../domain/repositories/ReminderRepository';
import type { ReminderRemoteDataSource } from '../datasources/ReminderRemoteDataSource';
import { createReminderRemoteDataSource } from '../datasources/ReminderRemoteDataSource';
import type { ReminderLocalDataSource } from '../datasources/ReminderLocalDataSource';
import { createReminderLocalDataSource } from '../datasources/ReminderLocalDataSource';

export class ReminderRepositoryImpl implements ReminderRepository {
  constructor(
    private readonly remote: ReminderRemoteDataSource,
    private readonly local: ReminderLocalDataSource,
  ) {}

  private revalidateFromRemote(): void {
    void (async () => {
      try {
        const remoteReminders = await this.remote.fetchReminders();
        await this.local.saveReminders(remoteReminders);
      } catch {
        // Keep serving cache; sync will retry later.
      }
    })();
  }

  async getReminders(): Promise<Reminder[]> {
    const cached = await this.local.getReminders();
    if (cached.length > 0) {
      this.revalidateFromRemote();
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
    const reminders = await this.local.getReminders();
    const next = [
      ...reminders.filter(existing => existing.id !== reminder.id),
      reminder,
    ];
    await this.local.saveReminders(next);

    try {
      await this.remote.createReminder(reminder);
    } catch {
      // Sync will retry in background
    }
    return reminder;
  }

  async updateReminder(reminder: Reminder): Promise<Reminder> {
    const reminders = await this.local.getReminders();
    const exists = reminders.some(existing => existing.id === reminder.id);
    const next = exists
      ? reminders.map(existing =>
          existing.id === reminder.id ? reminder : existing,
        )
      : [...reminders, reminder];
    await this.local.saveReminders(next);

    try {
      await this.remote.updateReminder(reminder);
    } catch {
      // Sync will retry in background
    }
    return reminder;
  }

  async deleteReminder(id: string): Promise<void> {
    const reminders = await this.local.getReminders();
    const next = reminders.filter(reminder => reminder.id !== id);
    await this.local.saveReminders(next);

    try {
      await this.remote.deleteReminder(id);
    } catch {
      // Sync will retry in background
    }
  }
}

export const createReminderRepository = (): ReminderRepository => {
  const remote = createReminderRemoteDataSource();
  const local = createReminderLocalDataSource();
  return new ReminderRepositoryImpl(remote, local);
};
