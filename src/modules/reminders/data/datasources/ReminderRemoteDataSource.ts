import type { Reminder } from '../../domain/models/Reminder';
import { apiClient } from '../../../../infrastructure/api/apiClient';

export interface ReminderRemoteDataSource {
  fetchReminders(): Promise<Reminder[]>;
  createReminder(reminder: Reminder): Promise<Reminder>;
  updateReminder(reminder: Reminder): Promise<Reminder>;
  deleteReminder(id: string): Promise<void>;
}

class ReminderRemoteDataSourceImpl implements ReminderRemoteDataSource {
  async fetchReminders(): Promise<Reminder[]> {
    const response = await apiClient.request<Reminder[]>({
      path: '/reminders',
      method: 'GET',
    });

    return response.data ?? [];
  }

  async createReminder(reminder: Reminder): Promise<Reminder> {
    const response = await apiClient.request<Reminder, Reminder>({
      path: '/reminders',
      method: 'POST',
      body: reminder,
    });

    if (!response.data) {
      throw new Error('Failed to create reminder');
    }

    return response.data;
  }

  async updateReminder(reminder: Reminder): Promise<Reminder> {
    const response = await apiClient.request<Reminder, Reminder>({
      path: `/reminders/${reminder.id}`,
      method: 'PUT',
      body: reminder,
    });

    if (!response.data) {
      throw new Error('Failed to update reminder');
    }

    return response.data;
  }

  async deleteReminder(id: string): Promise<void> {
    await apiClient.request<void>({
      path: `/reminders/${id}`,
      method: 'DELETE',
    });
  }
}

export const createReminderRemoteDataSource = (): ReminderRemoteDataSource =>
  new ReminderRemoteDataSourceImpl();

