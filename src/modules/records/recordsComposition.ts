import { notificationService } from '../../infrastructure/notifications/notificationService';
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

export const recordsComposition = {
  getRecords: new GetRecords(healthRecordRepository),
  createRecord: new CreateRecord(healthRecordRepository),
  deleteRecord: new DeleteRecord(healthRecordRepository),
  createRecordEntry: new CreateRecordEntry(),
  bootstrapSmartHealthSchedule: new BootstrapSmartHealthSchedule(
    smartHealthRepository,
  ),
  getSmartHealthRecords: new GetSmartHealthRecords(smartHealthRepository),
  markSmartHealthRecordDone: new MarkSmartHealthRecordDone(smartHealthRepository),
  rescheduleSmartHealthRecord: new RescheduleSmartHealthRecord(
    smartHealthRepository,
  ),
  skipSmartHealthRecord: new SkipSmartHealthRecord(smartHealthRepository),
  notificationService,
} as const;
