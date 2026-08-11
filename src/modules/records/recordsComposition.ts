import { isLikelyOfflineError } from '../../shared/utils/isLikelyOfflineError';
import { notificationService } from '../../infrastructure/notifications/notificationService';
import { cancelSmartHealthNotificationsForRecord } from '../../infrastructure/notifications/smartHealthNotificationSchedule';
import { requestNotificationResync } from '../../infrastructure/notifications/requestNotificationResync';
import type { SmartHealthRecord } from './domain/models/SmartHealthRecord';
import type { SmartHealthQueueEntryInput } from './domain/models/SmartHealthQueueEntry';
import { createHealthRecordRepository } from './data/repositories/HealthRecordRepositoryImpl';
import {
  configureSmartHealthQueueHooks,
  createSmartHealthRecordRepository,
} from './data/repositories/SmartHealthRecordRepositoryImpl';
import { BootstrapSmartHealthSchedule } from './domain/usecases/BootstrapSmartHealthSchedule';
import { CreateRecord } from './domain/usecases/CreateRecord';
import { CreateRecordEntry } from './domain/usecases/CreateRecordEntry';
import { DeleteRecord } from './domain/usecases/DeleteRecord';
import { GetRecords } from './domain/usecases/GetRecords';
import { GetSmartHealthRecords } from './domain/usecases/GetSmartHealthRecords';
import { MarkSmartHealthRecordDone } from './domain/usecases/MarkSmartHealthRecordDone';
import { RescheduleSmartHealthRecord } from './domain/usecases/RescheduleSmartHealthRecord';
import { SkipSmartHealthRecord } from './domain/usecases/SkipSmartHealthRecord';

const healthRecordRepository = createHealthRecordRepository();

async function syncSmartHealthNotificationsForRecords(
  _records: SmartHealthRecord[],
): Promise<void> {
  await requestNotificationResync();
}

const smartHealthRepository = createSmartHealthRecordRepository();
const getSmartHealthRecords = new GetSmartHealthRecords(smartHealthRepository);

configureSmartHealthQueueHooks(smartHealthRepository, {
  beforeMutation: recordId =>
    cancelSmartHealthNotificationsForRecord(recordId, notificationService),
  afterMutation: async (userId, petId) => {
    const records = await getSmartHealthRecords.execute(userId, petId);
    await smartHealthRepository.saveCachedRecordsFromServer(userId, petId, records);
    await syncSmartHealthNotificationsForRecords(records);
  },
});
const markSmartHealthRecordDone = new MarkSmartHealthRecordDone(smartHealthRepository);
const skipSmartHealthRecord = new SkipSmartHealthRecord(smartHealthRepository);
const rescheduleSmartHealthRecord = new RescheduleSmartHealthRecord(
  smartHealthRepository,
);

async function runQueuedSmartHealthMutation(input: {
  userId: string;
  petId: string;
  snapshot: SmartHealthRecord[];
  queueEntry: SmartHealthQueueEntryInput;
  execute: () => Promise<void>;
}): Promise<{ offline: boolean }> {
  const queued = await smartHealthRepository.enqueueMutation(
    input.userId,
    input.queueEntry,
  );
  const optimistic = await smartHealthRepository.mergeWithPendingQueue(
    input.userId,
    input.petId,
    input.snapshot,
  );
  await smartHealthRepository.saveCachedRecords(input.userId, input.petId, optimistic);

  try {
    await cancelSmartHealthNotificationsForRecord(
      input.queueEntry.recordId,
      notificationService,
    );
    await input.execute();
    await smartHealthRepository.removeQueueEntry(input.userId, queued.id);
    return { offline: false };
  } catch (error) {
    if (isLikelyOfflineError(error)) {
      return { offline: true };
    }
    await smartHealthRepository.removeQueueEntry(input.userId, queued.id);
    throw error;
  }
}

export const recordsComposition = {
  getRecords: new GetRecords(healthRecordRepository),
  createRecord: new CreateRecord(healthRecordRepository),
  deleteRecord: new DeleteRecord(healthRecordRepository),
  createRecordEntry: new CreateRecordEntry(),
  bootstrapSmartHealthSchedule: new BootstrapSmartHealthSchedule(
    smartHealthRepository,
  ),
  getSmartHealthRecords,
  markSmartHealthRecordDone,
  rescheduleSmartHealthRecord,
  skipSmartHealthRecord,
  smartHealthRepository,
  processSmartHealthSyncQueue: (userId: string) =>
    smartHealthRepository.processSyncQueue(userId),
  getSmartHealthPendingSyncCount: (userId: string) =>
    smartHealthRepository.getPendingSyncCount(userId),
  getCachedSmartHealthRecords: (userId: string, petId: string) =>
    smartHealthRepository.getCachedRecords(userId, petId),
  mergeSmartHealthRecordsWithQueue: (
    userId: string,
    petId: string,
    records: SmartHealthRecord[],
  ) => smartHealthRepository.mergeWithPendingQueue(userId, petId, records),
  markSmartHealthRecordDoneWithQueue: async (
    userId: string,
    snapshot: SmartHealthRecord[],
    record: SmartHealthRecord,
    completedDate?: string,
    petDateOfBirth?: string,
  ): Promise<{ offline: boolean }> =>
    runQueuedSmartHealthMutation({
      userId,
      petId: record.petId,
      snapshot,
      queueEntry: {
        op: 'markDone',
        petId: record.petId,
        recordId: record.id,
        record,
        completedDate,
        petDateOfBirth,
      },
      execute: () =>
        markSmartHealthRecordDone.execute(record, completedDate, petDateOfBirth),
    }),
  skipSmartHealthRecordWithQueue: async (
    userId: string,
    snapshot: SmartHealthRecord[],
    record: SmartHealthRecord,
    reason: string,
    petDateOfBirth?: string,
  ): Promise<{ offline: boolean }> =>
    runQueuedSmartHealthMutation({
      userId,
      petId: record.petId,
      snapshot,
      queueEntry: {
        op: 'skip',
        petId: record.petId,
        recordId: record.id,
        record,
        reason,
        petDateOfBirth,
      },
      execute: () =>
        skipSmartHealthRecord.execute(record, reason, petDateOfBirth),
    }),
  rescheduleSmartHealthRecordWithQueue: async (
    userId: string,
    snapshot: SmartHealthRecord[],
    record: SmartHealthRecord,
    newDueDate: string,
    petDateOfBirth?: string,
  ): Promise<{ offline: boolean }> =>
    runQueuedSmartHealthMutation({
      userId,
      petId: record.petId,
      snapshot,
      queueEntry: {
        op: 'reschedule',
        petId: record.petId,
        recordId: record.id,
        record,
        newDueDate,
        petDateOfBirth,
      },
      execute: () =>
        rescheduleSmartHealthRecord.execute(record, newDueDate, petDateOfBirth),
    }),
  notificationService,
  syncSmartHealthNotificationsForRecords,
  syncDueNotificationsForPets: async (
    _userId: string,
    _petIds: string[],
  ): Promise<void> => {
    await requestNotificationResync();
  },
} as const;
