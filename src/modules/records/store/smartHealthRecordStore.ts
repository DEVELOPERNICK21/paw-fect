import { create } from 'zustand';

import { useAuthStore } from '../../auth/store/authStore';
import type {
  BootstrapSmartScheduleInput,
  SmartHealthRecord,
  SmartHealthRecordType,
} from '../domain/models/SmartHealthRecord';
import { createSmartHealthRecordRepository } from '../data/repositories/SmartHealthRecordRepositoryImpl';
import { BootstrapSmartHealthSchedule } from '../domain/usecases/BootstrapSmartHealthSchedule';
import { GetNextSmartHealthTask } from '../domain/usecases/GetNextSmartHealthTask';
import { GetSmartHealthRecords } from '../domain/usecases/GetSmartHealthRecords';
import { MarkSmartHealthRecordDone } from '../domain/usecases/MarkSmartHealthRecordDone';
import { RescheduleSmartHealthRecord } from '../domain/usecases/RescheduleSmartHealthRecord';
import { notificationService } from '../../../infrastructure/notifications/notificationService';
import { PetCareLifecycleEngine } from '../domain/utils/PetCareLifecycleEngine';

interface SmartHealthRecordState {
  records: SmartHealthRecord[];
  loading: boolean;
  error: string | null;
  reset: () => void;
  bootstrapPetSchedule: (
    input: Omit<BootstrapSmartScheduleInput, 'userId'>,
  ) => Promise<void>;
  loadPetRecords: (petId: string) => Promise<void>;
  markAsDone: (recordId: string, completedDate?: string) => Promise<void>;
  reschedule: (recordId: string, newDueDate: string) => Promise<void>;
  remindTask: (recordId: string) => Promise<void>;
  getByType: (type: SmartHealthRecordType) => SmartHealthRecord[];
  getNextActionTask: (type: SmartHealthRecordType) => SmartHealthRecord | null;
  getUpcomingShortList: (
    type: SmartHealthRecordType,
    limit?: number,
  ) => SmartHealthRecord[];
  getCompletedTasks: (type: SmartHealthRecordType) => SmartHealthRecord[];
  getFullSchedule: (type: SmartHealthRecordType) => SmartHealthRecord[];
  getActionRequiredItem: (type: SmartHealthRecordType) => SmartHealthRecord | null;
  getActionRequiredItems: (type: SmartHealthRecordType, limit?: number) => SmartHealthRecord[];
  getUpcomingItems: (
    type: SmartHealthRecordType,
    options?: { limit?: number; dedupeByFamily?: boolean },
  ) => SmartHealthRecord[];
  getHistoryItems: (type: SmartHealthRecordType) => SmartHealthRecord[];
  getOverdueCount: (type: SmartHealthRecordType) => number;
}

const repository = createSmartHealthRecordRepository();
const bootstrapScheduleUseCase = new BootstrapSmartHealthSchedule(repository);
const getRecordsUseCase = new GetSmartHealthRecords(repository);
const getNextTaskUseCase = new GetNextSmartHealthTask();
const markDoneUseCase = new MarkSmartHealthRecordDone(repository);
const rescheduleUseCase = new RescheduleSmartHealthRecord(repository);
const lifecycleEngine = new PetCareLifecycleEngine();

function requireUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

function dueToDate(dueDate: string): Date {
  return new Date(`${dueDate}T09:00:00`);
}

async function scheduleDueNotifications(record: SmartHealthRecord): Promise<void> {
  const baseId = `health-${record.id}`;
  const dueDate = dueToDate(record.dueDate);

  const threeDaysBefore = new Date(dueDate);
  threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);

  const overdueDate = new Date(dueDate);
  overdueDate.setDate(overdueDate.getDate() + 1);

  await notificationService.scheduleNotification({
    id: `${baseId}-d3`,
    title: `${record.name} due soon`,
    body: `Health task due in 3 days for your pet.`,
    scheduledDate: threeDaysBefore,
    data: { recordId: record.id, type: record.type },
  });
  await notificationService.scheduleNotification({
    id: `${baseId}-due`,
    title: `${record.name} is due today`,
    body: `Please complete this health task today.`,
    scheduledDate: dueDate,
    data: { recordId: record.id, type: record.type },
  });
  await notificationService.scheduleNotification({
    id: `${baseId}-overdue`,
    title: `${record.name} is overdue`,
    body: `This health task is now overdue.`,
    scheduledDate: overdueDate,
    data: { recordId: record.id, type: record.type },
  });
}

export const useSmartHealthRecordStore = create<SmartHealthRecordState>(
  (set, get) => ({
    records: [],
    loading: false,
    error: null,

    reset: () => set({ records: [], loading: false, error: null }),

    bootstrapPetSchedule: async input => {
      const userId = requireUserId();
      if (!userId) {
        set({ error: 'Please sign in again.' });
        return;
      }
      set({ loading: true, error: null });
      try {
        await bootstrapScheduleUseCase.execute({ ...input, userId });
        const records = await getRecordsUseCase.execute(userId, input.petId);
        set({ records, loading: false, error: null });
        for (const record of records) {
          if (record.status !== 'completed') {
            await scheduleDueNotifications(record);
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[smartHealthRecordStore] bootstrapPetSchedule error', error);
        set({
          loading: false,
          error: 'Unable to generate health schedule. Please try again.',
        });
      }
    },

    loadPetRecords: async petId => {
      const userId = requireUserId();
      if (!userId) {
        set({ error: 'Please sign in again.' });
        return;
      }
      set({ loading: true, error: null });
      try {
        const records = await getRecordsUseCase.execute(userId, petId);
        set({ records, loading: false, error: null });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[smartHealthRecordStore] loadPetRecords error', error);
        set({
          loading: false,
          error: 'Unable to load smart health records.',
        });
      }
    },

    markAsDone: async (recordId, completedDate) => {
      const record = get().records.find(item => item.id === recordId);
      if (!record) return;
      set({ loading: true, error: null });
      try {
        await markDoneUseCase.execute(record, completedDate);
        const userId = requireUserId();
        if (!userId) {
          set({ loading: false, error: 'Please sign in again.' });
          return;
        }
        const records = await getRecordsUseCase.execute(userId, record.petId);
        set({ records, loading: false, error: null });
        // Schedule notifications for any newly generated recurring items.
        for (const item of records) {
          if (item.status === 'upcoming' && item.recurrenceType !== 'none') {
            await scheduleDueNotifications(item);
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[smartHealthRecordStore] markAsDone error', error);
        set({
          loading: false,
          error: 'Unable to mark record as done.',
        });
      }
    },

    reschedule: async (recordId, newDueDate) => {
      const record = get().records.find(item => item.id === recordId);
      if (!record) return;
      set({ loading: true, error: null });
      try {
        await rescheduleUseCase.execute(record, newDueDate);
        const userId = requireUserId();
        if (!userId) {
          set({ loading: false, error: 'Please sign in again.' });
          return;
        }
        const records = await getRecordsUseCase.execute(userId, record.petId);
        set({ records, loading: false, error: null });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[smartHealthRecordStore] reschedule error', error);
        set({
          loading: false,
          error: 'Unable to reschedule record.',
        });
      }
    },
    remindTask: async recordId => {
      const record = get().records.find(item => item.id === recordId);
      if (!record) return;
      try {
        const reminderDate = new Date();
        reminderDate.setMinutes(reminderDate.getMinutes() + 5);
        await notificationService.scheduleNotification({
          id: `health-remind-${record.id}-${Date.now()}`,
          title: `Reminder: ${record.name}`,
          body: `Don't forget this ${record.type} task.`,
          scheduledDate: reminderDate,
          data: { recordId: record.id, type: record.type },
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[smartHealthRecordStore] remindTask error', error);
        set({
          error: 'Unable to set reminder right now.',
        });
      }
    },

    getByType: type =>
      get()
        .records
        .filter(record => record.type === type)
        .slice()
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    getNextActionTask: type => {
      const records = get().getByType(type);
      return getNextTaskUseCase.execute(records);
    },
    getUpcomingShortList: (type, limit = 3) => {
      const records = get().getByType(type);
      const nextActionTask = get().getNextActionTask(type);
      return records
        .filter(record => record.status === 'overdue' || record.status === 'upcoming')
        .filter(record => record.id !== nextActionTask?.id)
        .slice(0, limit);
    },
    getCompletedTasks: type =>
      get()
        .getByType(type)
        .filter(record => record.status === 'completed'),
    getFullSchedule: type => get().getByType(type),
    getActionRequiredItem: type => {
      const records = get().getByType(type);
      return lifecycleEngine.getActionRequired(records);
    },
    getActionRequiredItems: (type, limit = 2) => {
      const records = get().getByType(type);
      return lifecycleEngine.getActionRequiredList(records, limit);
    },
    getUpcomingItems: (type, options) => {
      const records = get().getByType(type);
      return lifecycleEngine.getUpcoming(
        records,
        options?.limit ?? 5,
        options?.dedupeByFamily ?? true,
      );
    },
    getHistoryItems: type => {
      const records = get().getByType(type);
      return lifecycleEngine.getHistory(records);
    },
    getOverdueCount: type =>
      get()
        .getByType(type)
        .filter(record => record.status === 'overdue').length,
  }),
);

