import { ensureNotificationsReady } from '../../infrastructure/notifications/notificationDiagnostics';
import { notificationService } from '../../infrastructure/notifications/notificationService';
import { syncAllSmartHealthDueNotifications } from '../../infrastructure/notifications/smartHealthNotificationSchedule';
import { createHealthRecordRepository } from './data/repositories/HealthRecordRepositoryImpl';
import { createSmartHealthRecordRepository } from './data/repositories/SmartHealthRecordRepositoryImpl';
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
const smartHealthRepository = createSmartHealthRecordRepository();
const getSmartHealthRecords = new GetSmartHealthRecords(smartHealthRepository);

export const recordsComposition = {
  getRecords: new GetRecords(healthRecordRepository),
  createRecord: new CreateRecord(healthRecordRepository),
  deleteRecord: new DeleteRecord(healthRecordRepository),
  createRecordEntry: new CreateRecordEntry(),
  bootstrapSmartHealthSchedule: new BootstrapSmartHealthSchedule(
    smartHealthRepository,
  ),
  getSmartHealthRecords,
  markSmartHealthRecordDone: new MarkSmartHealthRecordDone(smartHealthRepository),
  rescheduleSmartHealthRecord: new RescheduleSmartHealthRecord(
    smartHealthRepository,
  ),
  skipSmartHealthRecord: new SkipSmartHealthRecord(smartHealthRepository),
  notificationService,
  syncDueNotificationsForPets: async (
    userId: string,
    petIds: string[],
  ): Promise<void> => {
    const granted = await ensureNotificationsReady();
    if (!granted) {
      return;
    }
    const records = (
      await Promise.all(
        petIds.map(petId => getSmartHealthRecords.execute(userId, petId)),
      )
    ).flat();
    await syncAllSmartHealthDueNotifications(records, notificationService);
  },
} as const;
