export type ReminderType =
  | 'vaccination'
  | 'medication'
  | 'grooming'
  | 'checkup'
  | 'other';

export type ReminderRepeat = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Reminder {
  id: string;
  petId: string;
  title: string;
  type: ReminderType;
  date: string;
  time: string;
  repeat: ReminderRepeat;
  notes: string;
  notificationId: string | null;
}

