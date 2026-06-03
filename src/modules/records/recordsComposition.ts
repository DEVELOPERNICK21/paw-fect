import { getAppSessionUserId } from '../../shared/session/appSessionPorts';
import { ensureNotificationsReady } from '../../infrastructure/notifications/notificationDiagnostics';
import { notificationService } from '../../infrastructure/notifications/notificationService';
import { syncAllSmartHealthDueNotifications } from '../../infrastructure/notifications/smartHealthNotificationSchedule';
import type { SmartHealthRecord } from './domain/models/SmartHealthRecord';
import { createPetRepository } from '../pets/data/repositories/PetRepositoryImpl';
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
const petRepository = createPetRepository();
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
  syncSmartHealthNotificationsForRecords: async (
    records: SmartHealthRecord[],
  ): Promise<void> => {
    const granted = await ensureNotificationsReady();
    if (!granted) {
      return;
    }
    const userId = getAppSessionUserId();
    if (userId == null) {
      return;
    }
    const petIds = [...new Set(records.map(record => record.petId))];
    const pets = await Promise.all(
      petIds.map(petId => petRepository.getPetById(userId, petId)),
    );
    const petSpeciesByPetId = new Map(
      pets
        .filter((pet): pet is NonNullable<(typeof pets)[number]> => pet != null)
        .map(pet => [pet.id, pet.type] as const),
    );
    await syncAllSmartHealthDueNotifications(
      records,
      notificationService,
      petSpeciesByPetId,
    );
  },
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
    const pets = await Promise.all(
      petIds.map(petId => petRepository.getPetById(userId, petId)),
    );
    const petSpeciesByPetId = new Map(
      pets
        .filter((pet): pet is NonNullable<(typeof pets)[number]> => pet != null)
        .map(pet => [pet.id, pet.type] as const),
    );
    await syncAllSmartHealthDueNotifications(
      records,
      notificationService,
      petSpeciesByPetId,
    );
  },
} as const;
