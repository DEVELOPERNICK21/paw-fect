import { create } from 'zustand';
import type { HealthRecord } from '../domain/models/HealthRecord';
import { createHealthRecordRepository } from '../data/repositories/HealthRecordRepositoryImpl';
import { GetRecords } from '../domain/usecases/GetRecords';
import { CreateRecord } from '../domain/usecases/CreateRecord';
import { DeleteRecord } from '../domain/usecases/DeleteRecord';

export interface RecordState {
  records: HealthRecord[];
  loadRecords: () => Promise<void>;
  createRecord: (record: HealthRecord) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
}

const repository = createHealthRecordRepository();
const getRecordsUseCase = new GetRecords(repository);
const createRecordUseCase = new CreateRecord(repository);
const deleteRecordUseCase = new DeleteRecord(repository);

export const useRecordStore = create<RecordState>((set, get) => ({
  records: [],

  loadRecords: async () => {
    try {
      const records = await getRecordsUseCase.execute();
      set({ records });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[recordStore] loadRecords error', error);
    }
  },

  createRecord: async (record: HealthRecord) => {
    try {
      const created = await createRecordUseCase.execute(record);
      const { records } = get();
      set({ records: [...records, created] });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[recordStore] createRecord error', error);
    }
  },

  deleteRecord: async (id: string) => {
    try {
      await deleteRecordUseCase.execute(id);
      const { records } = get();
      const next = records.filter(record => record.id !== id);
      set({ records: next });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[recordStore] deleteRecord error', error);
    }
  },
}));

