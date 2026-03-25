import type { Reminder, ReminderRepeat, ReminderType } from '../models/Reminder';
import { createLocalId } from '../../../../shared/utils/id';

interface Input {
  petId: string;
  title: string;
  type: ReminderType;
  date: string;
  time: string;
  repeatEnabled: boolean;
}

export type CreateReminderEntryResult =
  | { ok: false; errorMessage: string }
  | { ok: true; reminder: Reminder };

export class CreateReminderEntry {
  execute(input: Input): CreateReminderEntryResult {
    const title = input.title.trim();
    const date = input.date.trim();
    const time = input.time.trim();
    if (!title || !date || !time) {
      return { ok: false, errorMessage: 'Title, date, and time are required.' };
    }
    if (!input.petId) {
      return { ok: false, errorMessage: 'Please select a pet.' };
    }

    const repeat: ReminderRepeat = input.repeatEnabled ? 'yearly' : 'once';
    return {
      ok: true,
      reminder: {
        id: createLocalId('reminder'),
        petId: input.petId,
        title,
        type: input.type,
        date,
        time,
        repeat,
        notes: '',
        notificationId: null,
      },
    };
  }
}
