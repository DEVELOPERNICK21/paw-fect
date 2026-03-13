import type { Reminder } from '../models/Reminder';
import type { ReminderRepository } from '../repositories/ReminderRepository';

export class GetReminders {
  constructor(private readonly repository: ReminderRepository) {}

  async execute(): Promise<Reminder[]> {
    return this.repository.getReminders();
  }
}

