import type { HealthRecord } from '../models/HealthRecord';
import { createLocalId } from '../../../../shared/utils/id';

interface Input {
  petId: string;
  title: string;
  category: string;
  date: string;
  notes: string;
}

export type CreateRecordEntryResult =
  | { ok: false; errorMessage: string }
  | { ok: true; record: HealthRecord };

export class CreateRecordEntry {
  execute(input: Input): CreateRecordEntryResult {
    const title = input.title.trim();
    const date = input.date.trim();
    if (!title || !date) {
      return {
        ok: false,
        errorMessage: 'Record title and date are required.',
      };
    }
    return {
      ok: true,
      record: {
        id: createLocalId('record'),
        petId: input.petId,
        title,
        category: input.category,
        date,
        notes: input.notes.trim(),
        attachments: [],
      },
    };
  }
}
