import type { ReminderRepository } from '../repositories/ReminderRepository';

export class DeleteReminder {
  constructor(private readonly repository: ReminderRepository) {}

  async execute(id: string): Promise<void> {
    return this.repository.deleteReminder(id);
  }
}

