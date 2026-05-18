import { create } from 'zustand';

import { getAppSessionUserId } from '../../../shared/session/appSessionPorts';
import type {
  BootstrapSmartScheduleInput,
  SmartHealthRecord,
  SmartHealthRecordType,
} from '../domain/models/SmartHealthRecord';
import type { MilestoneShareKind } from '../domain/utils/isMilestoneCompletion';
import { isMilestoneCompletion } from '../domain/utils/isMilestoneCompletion';
import { smartHealthSelectors } from './smartHealthSelectors';
import { recordsComposition } from '../recordsComposition';
import {
  cancelSmartHealthNotificationsForRecord,
  syncAllSmartHealthDueNotifications,
} from '../../../infrastructure/notifications/smartHealthNotificationSchedule';

const STORE_ACTION_TIMEOUT_MS = 15000;

export interface MilestoneShareEvent {
  petId: string;
  recordId: string;
  kind: MilestoneShareKind;
}

interface SmartHealthRecordState {
  records: SmartHealthRecord[];
  loading: boolean;
  error: string | null;
  /** One-shot queue for post-completion share prompts (drained by app shell). */
  milestoneEvents: MilestoneShareEvent[];
  reset: () => void;
  consumeMilestoneEvent: () => MilestoneShareEvent | undefined;
  bootstrapPetSchedule: (
    input: Omit<BootstrapSmartScheduleInput, 'userId'>,
  ) => Promise<void>;
  loadPetRecords: (petId: string) => Promise<void>;
  markAsDone: (
    recordId: string,
    completedDate?: string,
    petDateOfBirth?: string,
  ) => Promise<void>;
  skipDewormingDose: (
    recordId: string,
    reason: string,
    petDateOfBirth: string | undefined,
  ) => Promise<void>;
  reschedule: (
    recordId: string,
    newDueDate: string,
    petDateOfBirth?: string,
  ) => Promise<void>;
  getByType: (type: SmartHealthRecordType) => SmartHealthRecord[];
  getNextActionTask: (type: SmartHealthRecordType) => SmartHealthRecord | null;
  getNextVaccinationTask: () => SmartHealthRecord | null;
  getUpcomingVaccinations: (limit?: number) => SmartHealthRecord[];
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

function requireUserId(): string | null {
  return getAppSessionUserId();
}

async function refreshDueNotifications(records: SmartHealthRecord[]): Promise<void> {
  await syncAllSmartHealthDueNotifications(
    records,
    recordsComposition.notificationService,
  );
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error('Request timed out. Please try again.'));
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

export const useSmartHealthRecordStore = create<SmartHealthRecordState>(
  (set, get) => ({
    records: [],
    loading: false,
    error: null,
    milestoneEvents: [],

    reset: () =>
      set({
        records: [],
        loading: false,
        error: null,
        milestoneEvents: [],
      }),

    consumeMilestoneEvent: () => {
      const queue = get().milestoneEvents;
      if (queue.length === 0) {
        return undefined;
      }
      const [next, ...rest] = queue;
      set({ milestoneEvents: rest });
      return next;
    },

    bootstrapPetSchedule: async input => {
      const userId = requireUserId();
      if (!userId) {
        set({ error: 'Please sign in again.' });
        return;
      }
      set({ loading: true, error: null });
      try {
        await withTimeout(
          recordsComposition.bootstrapSmartHealthSchedule.execute({
            ...input,
            userId,
          }),
          STORE_ACTION_TIMEOUT_MS,
        );
        const records = await withTimeout(
          recordsComposition.getSmartHealthRecords.execute(userId, input.petId),
          STORE_ACTION_TIMEOUT_MS,
        );
        set({ records, loading: false, error: null });
        void refreshDueNotifications(records).catch(() => {});
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
        const records = await withTimeout(
          recordsComposition.getSmartHealthRecords.execute(userId, petId),
          STORE_ACTION_TIMEOUT_MS,
        );
        set({ records, loading: false, error: null });
        void refreshDueNotifications(records).catch(() => {});
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[smartHealthRecordStore] loadPetRecords error', error);
        set({
          loading: false,
          error: 'Unable to load smart health records.',
        });
      }
    },

    markAsDone: async (recordId, completedDate, petDateOfBirth) => {
      const record = get().records.find(item => item.id === recordId);
      if (!record) return;
      set({ loading: true, error: null });
      try {
        await cancelSmartHealthNotificationsForRecord(
          recordId,
          recordsComposition.notificationService,
        );
        await withTimeout(
          recordsComposition.markSmartHealthRecordDone.execute(
            record,
            completedDate,
            petDateOfBirth,
          ),
          STORE_ACTION_TIMEOUT_MS,
        );
        const userId = requireUserId();
        if (!userId) {
          set({ loading: false, error: 'Please sign in again.' });
          return;
        }
        const records = await withTimeout(
          recordsComposition.getSmartHealthRecords.execute(userId, record.petId),
          STORE_ACTION_TIMEOUT_MS,
        );
        const refreshed = records.find(item => item.id === recordId);
        let milestoneEvents = get().milestoneEvents;
        if (refreshed?.status === 'completed') {
          const petRecords = records.filter(r => r.petId === refreshed.petId);
          const milestone = isMilestoneCompletion(refreshed, petRecords);
          if (milestone) {
            milestoneEvents = [
              ...milestoneEvents,
              {
                petId: refreshed.petId,
                recordId: refreshed.id,
                kind: milestone.kind,
              },
            ];
          }
        }
        set({
          records,
          loading: false,
          error: null,
          milestoneEvents,
        });
        void refreshDueNotifications(records).catch(() => {});
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[smartHealthRecordStore] markAsDone error', error);
        set({
          loading: false,
          error: 'Unable to mark record as done.',
        });
      }
    },

    skipDewormingDose: async (recordId, reason, petDateOfBirth) => {
      const record = get().records.find(item => item.id === recordId);
      if (!record) return;
      set({ loading: true, error: null });
      try {
        await cancelSmartHealthNotificationsForRecord(
          recordId,
          recordsComposition.notificationService,
        );
        await withTimeout(
          recordsComposition.skipSmartHealthRecord.execute(
            record,
            reason,
            petDateOfBirth,
          ),
          STORE_ACTION_TIMEOUT_MS,
        );
        const userId = requireUserId();
        if (!userId) {
          set({ loading: false, error: 'Please sign in again.' });
          return;
        }
        const records = await withTimeout(
          recordsComposition.getSmartHealthRecords.execute(userId, record.petId),
          STORE_ACTION_TIMEOUT_MS,
        );
        set({ records, loading: false, error: null });
        void refreshDueNotifications(records).catch(() => {});
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[smartHealthRecordStore] skipDewormingDose error', error);
        set({
          loading: false,
          error: 'Unable to skip this dose.',
        });
      }
    },

    reschedule: async (recordId, newDueDate, petDateOfBirth) => {
      const record = get().records.find(item => item.id === recordId);
      if (!record) return;
      set({ loading: true, error: null });
      try {
        await cancelSmartHealthNotificationsForRecord(
          recordId,
          recordsComposition.notificationService,
        );
        await withTimeout(
          recordsComposition.rescheduleSmartHealthRecord.execute(
            record,
            newDueDate,
            petDateOfBirth,
          ),
          STORE_ACTION_TIMEOUT_MS,
        );
        const userId = requireUserId();
        if (!userId) {
          set({ loading: false, error: 'Please sign in again.' });
          return;
        }
        const records = await withTimeout(
          recordsComposition.getSmartHealthRecords.execute(userId, record.petId),
          STORE_ACTION_TIMEOUT_MS,
        );
        set({ records, loading: false, error: null });
        void refreshDueNotifications(records).catch(() => {});
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[smartHealthRecordStore] reschedule error', error);
        const message =
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : 'Unable to reschedule record.';
        set({
          loading: false,
          error: message,
        });
        throw error instanceof Error ? error : new Error(message);
      }
    },

    getByType: type =>
      smartHealthSelectors.getByType(get().records, type),
    getNextActionTask: type => {
      const records = get().getByType(type);
      return smartHealthSelectors.getNextActionTask(records);
    },
    getNextVaccinationTask: () =>
      smartHealthSelectors.getNextVaccinationTask(get().records),
    getUpcomingVaccinations: (limit = 5) =>
      smartHealthSelectors.getUpcomingVaccinations(get().records, limit),
    getUpcomingShortList: (type, limit = 3) => {
      const records = get().getByType(type);
      return smartHealthSelectors.getUpcomingShortList(records, limit);
    },
    getCompletedTasks: type =>
      smartHealthSelectors.getCompletedTasks(get().getByType(type)),
    getFullSchedule: type => smartHealthSelectors.getFullSchedule(get().getByType(type)),
    getActionRequiredItem: type => {
      const records = get().getByType(type);
      return smartHealthSelectors.getActionRequiredItems(records, 1)[0] ?? null;
    },
    getActionRequiredItems: (type, limit = 2) => {
      const records = get().getByType(type);
      return smartHealthSelectors.getActionRequiredItems(records, limit);
    },
    getUpcomingItems: (type, options) => {
      const records = get().getByType(type);
      return smartHealthSelectors.getUpcomingItems(records, {
        limit: options?.limit ?? 5,
        dedupeByFamily: options?.dedupeByFamily ?? true,
      });
    },
    getHistoryItems: type => {
      const records = get().getByType(type);
      return smartHealthSelectors.getHistoryItems(records);
    },
    getOverdueCount: type =>
      smartHealthSelectors.getOverdueCount(get().getByType(type)),
  }),
);

