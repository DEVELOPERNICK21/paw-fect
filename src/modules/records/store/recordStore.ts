import { create } from 'zustand';
import type { HealthRecord } from '../domain/models/HealthRecord';
import {
  type CreateRecordEntryResult,
} from '../domain/usecases/CreateRecordEntry';
import { recordsComposition } from '../recordsComposition';

export interface RecordState {
  records: HealthRecord[];
  loading: boolean;
  error: string | null;
  reset: () => void;
  loadRecords: () => Promise<void>;
  createRecord: (record: HealthRecord) => Promise<void>;
  createRecordEntry: (input: {
    petId: string;
    title: string;
    category: string;
    date: string;
    notes: string;
  }) => Promise<{ success: boolean; error?: string }>;
  deleteRecord: (id: string) => Promise<void>;
}

export const useRecordStore = create<RecordState>((set, get) => ({
  records: [],
  loading: false,
  error: null,
  reset: () => set({ records: [], loading: false, error: null }),

  loadRecords: async () => {
    try {
      set({ loading: true, error: null });
      const records = await recordsComposition.getRecords.execute();
      set({ records, loading: false, error: null });
    } catch (error) {
      set({
        loading: false,
        error: 'Unable to load health records. Please try again.',
      });
      // eslint-disable-next-line no-console
      console.error('[recordStore] loadRecords error', error);
    }
  },

  createRecord: async (record: HealthRecord) => {
    try {
      const created = await recordsComposition.createRecord.execute(record);
      const { records } = get();
      set({ records: [...records, created] });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[recordStore] createRecord error', error);
    }
  },

  createRecordEntry: async (input) => {
    const result: CreateRecordEntryResult =
      recordsComposition.createRecordEntry.execute(input);
    if (!result.ok) {
      return { success: false, error: result.errorMessage };
    }
    await get().createRecord(result.record);
    return { success: true };
  },

  deleteRecord: async (id: string) => {
    try {
      await recordsComposition.deleteRecord.execute(id);
      const { records } = get();
      const next = records.filter(record => record.id !== id);
      set({ records: next });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[recordStore] deleteRecord error', error);
    }
  },
}));

