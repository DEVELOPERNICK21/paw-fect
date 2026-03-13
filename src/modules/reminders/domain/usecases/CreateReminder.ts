import type { Reminder } from '../models/Reminder';
import type { ReminderRepository } from '../repositories/ReminderRepository';

export class CreateReminder {
  constructor(private readonly repository: ReminderRepository) {}

  async execute(reminder: Reminder): Promise<Reminder> {
    return this.repository.createReminder(reminder);
  }
}

